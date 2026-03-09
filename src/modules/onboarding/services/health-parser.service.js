// src/modules/onboarding/services/health-parser.service.js

import { unitService } from '../../../core/utils/unit.service.js';

// --- DICCIONARIO APPLE HEALTH -> AERKO ---
const APPLE_MAP = {
    'HKQuantityTypeIdentifierBodyMass': 'weight',
    'HKQuantityTypeIdentifierHeight': 'height',
    'HKQuantityTypeIdentifierBodyFatPercentage': 'bodyFat',
    'HKQuantityTypeIdentifierLeanBodyMass': 'muscleMass',
    'HKQuantityTypeIdentifierWaistCircumference': 'waist'
};

const CHUNK_SIZE = 1024 * 1024; // 1MB por lectura para Apple Health

class HealthParserService {
    
    async parseHealthData(file, sourceId, onProgress = () => {}) {
        console.log(`%c[HEALTH PARSER] Iniciando extracción de ${sourceId}. Tamaño: ${(file.size / 1024 / 1024).toFixed(2)} MB`, 'color: #CCFF00');

        if (sourceId === 'apple_health') {
            return await this._parseAppleHealthStream(file, onProgress);
        } else if (sourceId === 'google_fit' || sourceId === 'samsung_health') {
            return await this._parseZipData(file, sourceId, onProgress);
        } else {
            throw new Error("err_health_unsupported");
        }
    }

    // ========================================================================
    // --- 1. APPLE HEALTH (STREAM PARSER CON NORMALIZACIÓN DE UNIDADES) ---
    // ========================================================================
    
    _parseAppleHealthStream(file, onProgress) {
        return new Promise((resolve, reject) => {
            let offset = 0;
            let leftover = '';
            
            // Map agrupando por "YYYY-MM-DD" para quedarnos con el último dato del día
            const dailyRecords = new Map(); 
            let profileData = { gender: null, age: null };

            const reader = new FileReader();

            reader.onload = (e) => {
                const chunk = leftover + e.target.result;
                
                // 1. Perfil del Usuario (<Me ... />)
                if (!profileData.gender) {
                    const meMatch = chunk.match(/<Me([^>]+)>/);
                    if (meMatch) {
                        const sex = meMatch[1].match(/HKCharacteristicTypeIdentifierBiologicalSex="([^"]+)"/);
                        const dob = meMatch[1].match(/HKCharacteristicTypeIdentifierDateOfBirth="([^"]+)"/);
                        if (sex) profileData.gender = sex[1].replace('HKBiologicalSex', '');
                        if (dob) profileData.age = new Date().getFullYear() - new Date(dob[1]).getFullYear();
                    }
                }

                // 2. Extracción de Registros
                const recordRegex = /<Record([^>]+)>/g;
                let match;
                let lastIndex = 0;

                while ((match = recordRegex.exec(chunk)) !== null) {
                    const attrs = match[1];
                    const typeMatch = attrs.match(/type="([^"]+)"/);
                    
                    if (typeMatch && APPLE_MAP[typeMatch[1]]) {
                        const aerkoKey = APPLE_MAP[typeMatch[1]];
                        const valMatch = attrs.match(/value="([^"]+)"/);
                        const unitMatch = attrs.match(/unit="([^"]+)"/); 
                        const dateMatch = attrs.match(/startDate="([^"]+)"/);

                        if (valMatch && dateMatch) {
                            const dayDate = dateMatch[1].split(' ')[0]; 
                            let val = parseFloat(valMatch[1]);
                            const unit = unitMatch ? unitMatch[1].toLowerCase() : '';

                            // --- NORMALIZACIÓN DE UNIDADES ---
                            val = unitService.toBase(val, unit.toUpperCase());

                            if (!dailyRecords.has(dayDate)) {
                                dailyRecords.set(dayDate, { timestamp: new Date(dayDate).getTime() });
                            }
                            
                            // Guardamos el dato limpio
                            dailyRecords.get(dayDate)[aerkoKey] = val;
                        }
                    }
                    lastIndex = match.index + match[0].length;
                }

                // 3. Preparar el siguiente ciclo
                leftover = chunk.slice(lastIndex);
                offset += CHUNK_SIZE;

                const progress = Math.min(100, Math.round((offset / file.size) * 100));
                onProgress(progress);

                if (offset < file.size) {
                    readNextChunk(); 
                } else {
                    console.log('%c[HEALTH PARSER] Archivo XML de Apple purificado.', 'color: #CCFF00');
                    resolve({
                        profile: profileData,
                        records: Array.from(dailyRecords.values()).sort((a, b) => b.timestamp - a.timestamp)
                    });
                }
            };

            reader.onerror = () => reject(new Error("err_xml_read"));

            const readNextChunk = () => {
                const slice = file.slice(offset, offset + CHUNK_SIZE);
                reader.readAsText(slice); 
            };

            readNextChunk();
        });
    }

    // ========================================================================
    // --- 2. GOOGLE FIT / SAMSUNG HEALTH (ZIP PARSER CON JSZIP) ---
    // ========================================================================

    async _parseZipData(file, sourceId, onProgress) {
        const isZip = file.name.toLowerCase().endsWith('.zip') || file.type === 'application/zip';
        const dailyRecords = new Map();

        // CASO A: ES UN ARCHIVO SUELTO (.CSV)
        if (!isZip) {
            console.log(`%c[HEALTH PARSER] Archivo suelto detectado (${file.name}). Bypass de JSZip.`, 'color: orange');
            const text = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error("err_csv_read"));
                reader.readAsText(file);
            });
            
            // Reutilizamos la lógica del CSV pasándole un objeto falso que simula ser el ZIP entry
            const fakeZipEntry = { async: async () => text };
            let mode = 'google_weight';
            if (file.name.toLowerCase().includes('fat') || file.name.toLowerCase().includes('grasa')) mode = 'google_fat';
            
            await this._extractCsvFromZip(fakeZipEntry, dailyRecords, mode);
            onProgress(100);
            return { profile: { gender: null, age: null }, records: Array.from(dailyRecords.values()).sort((a, b) => b.timestamp - a.timestamp) };
        }

        // CASO B: ES UN .ZIP COMPLETO (La vía normal)
        if (typeof JSZip === 'undefined') throw new Error("err_zip_not_found");

        const zip = new JSZip();
        let zipContent;
        
        try {
            zipContent = await zip.loadAsync(file);
        } catch (e) {
            throw new Error("err_zip_corrupt");
        }

        const filePromises = [];
        const totalFiles = Object.keys(zipContent.files).length;
        let filesProcessed = 0;

        zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return; 
            
            const lowerPath = relativePath.toLowerCase();

            if (sourceId === 'samsung_health' && lowerPath.includes('com.samsung.health.weight') && lowerPath.endsWith('.csv')) {
                filePromises.push(this._extractCsvFromZip(zipEntry, dailyRecords, 'samsung'));
            }

            if (sourceId === 'google_fit' && lowerPath.endsWith('.csv')) {
                if (lowerPath.includes('weight') || lowerPath.includes('peso')) {
                    filePromises.push(this._extractCsvFromZip(zipEntry, dailyRecords, 'google_weight'));
                }
                if (lowerPath.includes('body fat') || lowerPath.includes('grasa')) {
                    filePromises.push(this._extractCsvFromZip(zipEntry, dailyRecords, 'google_fat'));
                }
            }

            filesProcessed++;
            if (filesProcessed % 10 === 0) {
                onProgress(Math.min(50, Math.round((filesProcessed / totalFiles) * 50)));
            }
        });

        await Promise.all(filePromises);
        onProgress(100);
        
        console.log(`%c[HEALTH PARSER] ZIP de ${sourceId} purificado.`, 'color: #CCFF00');

        return {
            profile: { gender: null, age: null }, 
            records: Array.from(dailyRecords.values()).sort((a, b) => b.timestamp - a.timestamp)
        };
    }

    // ========================================================================
    // --- 3. CSV EXTRACTOR (MOTOR PARA EL ZIP) ---
    // ========================================================================

    async _extractCsvFromZip(zipEntry, dailyRecords, mode) {
        const content = await zipEntry.async("string");
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) return;

        // Buscamos dónde están las cabeceras (A veces Samsung mete metadata en la línea 0)
        let headerIndex = lines.findIndex(l => l.toLowerCase().includes('weight') || l.toLowerCase().includes('peso') || l.toLowerCase().includes('create_time'));
        if (headerIndex === -1) headerIndex = 0;

        const headers = lines[headerIndex].toLowerCase().split(',').map(h => h.replace(/"/g, '').trim());
        
        // Identificadores de columnas dinámicos
        const idxDate = headers.findIndex(h => h.includes('time') || h.includes('date') || h.includes('fecha'));
        const idxWeight = headers.findIndex(h => h.includes('weight') || h.includes('peso') || h === 'kg');
        const idxFat = headers.findIndex(h => h.includes('fat') || h.includes('grasa'));

        if (idxDate === -1) return; // Si no hay fecha, es basura

        for (let i = headerIndex + 1; i < lines.length; i++) {
            // Regex para separar CSV respetando comillas
            const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/"/g, ''));
            if (row.length <= idxDate) continue;

            const dateRaw = row[idxDate];
            const timestamp = new Date(dateRaw).getTime();
            if (isNaN(timestamp)) continue; // Si la fecha está corrupta, al pozo

            const dayDate = dateRaw.split(' ')[0]; // Para agrupar: "YYYY-MM-DD"

            if (!dailyRecords.has(dayDate)) {
                dailyRecords.set(dayDate, { timestamp });
            }
            const record = dailyRecords.get(dayDate);

            // Siempre guardamos el registro más reciente del día
            if (timestamp >= record.timestamp) {
                record.timestamp = timestamp;
                
                // Mapeo de Pesos
                if (idxWeight !== -1 && row[idxWeight]) {
                    const w = parseFloat(row[idxWeight]);
                    if (!isNaN(w)) record.weight = unitService.toBase(w, 'KG');
                }
                
                // Mapeo de Grasas
                if (idxFat !== -1 && row[idxFat]) {
                    const f = parseFloat(row[idxFat]);
                    if (!isNaN(f)) record.bodyFat = unitService.toBase(f, '%');
                }
            }
        }
    }
}

export const healthParserService = new HealthParserService();