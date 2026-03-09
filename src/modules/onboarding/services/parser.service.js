// src/modules/onboarding/services/parser.service.js
import { db } from '../../../core/db/index.js';

const VAULT_NAME = 'training_vault';
const EXERCISES_KEY = 'master_exercises';

// DICCIONARIO DE TRADUCCIÓN (Clean Room Design)
// Mapeamos los nombres basura más comunes a tus IDs exactos de Aerko.
const EXERCISE_DICTIONARY = {
    'bench press': 'bench_press',
    'barbell bench press': 'bench_press',
    'squat': 'barbell_squat',
    'barbell squat': 'barbell_squat',
    'deadlift': 'deadlift',
    'romanian deadlift': 'rdl',
    'rdl': 'rdl',
    'pull up': 'pull_up',
    'pullup': 'pull_up',
    'lat pulldown': 'lat_pulldown',
    'overhead press': 'overhead_press',
    'military press': 'overhead_press',
    // Puedes ampliar este diccionario todo lo que quieras
};

class ParserService {
    constructor() {
        this.masterExercises = [];
    }

    /**
     * Inicializa el parser cargando los ejercicios maestros de Aerko
     * para poder hacer el emparejamiento.
     */
    async init() {
        const record = await db.get(VAULT_NAME, EXERCISES_KEY);
        this.masterExercises = record && record.data ? record.data : [];
    }

    /**
     * ORQUESTADOR PRINCIPAL
     * @param {string} rawData - Contenido en texto del archivo (CSV o JSON)
     * @param {string} sourceId - Origen ('hevy', 'strong', 'lyfta', 'aerko')
     * @returns {Promise<Array>} Array de sesiones en formato Aerko
     */
    async parseData(rawData, sourceId) {
        if (this.masterExercises.length === 0) await this.init();

        let parsedSessions = [];

        try {
            if (sourceId === 'hevy' || sourceId === 'strong') {
                // Hevy y Strong suelen exportar en CSV
                parsedSessions = this._parseGenericCSV(rawData);
            } else if (sourceId === 'lyfta' || sourceId === 'hevy_pro') {
                // Asumimos JSON para Lyfta o exportaciones Pro
                parsedSessions = this._parseGenericJSON(JSON.parse(rawData));
            } else {
                throw new Error("err_source_unsupported");
            }

            console.log(`%c[PARSER] Éxito: ${parsedSessions.length} sesiones extraídas y purificadas.`, 'color: #CCFF00');
            return parsedSessions;

        } catch (error) {
            console.error('[PARSER] Error fatal procesando el archivo:', error);
            throw new Error("err_file_corrupt");
        }
    }

    // ========================================================================
    // --- 1. MOTOR DE EMPAREJAMIENTO SEMÁNTICO (Nativo, sin dependencias) ---
    // ========================================================================
    
    _matchExercise(rawName) {
        if (!rawName) return 'unknown_exercise';
        
        // Limpieza extrema: minúsculas, sin espacios extra, sin paréntesis
        const cleanName = rawName.toLowerCase().replace(/\([^)]*\)/g, '').trim();

        // 1. Búsqueda rápida en nuestro diccionario manual
        if (EXERCISE_DICTIONARY[cleanName]) {
            return EXERCISE_DICTIONARY[cleanName];
        }

        // 2. Búsqueda en la base de datos maestra de Aerko
        const matched = this.masterExercises.find(ex => {
            const esName = (ex.name && ex.name.es) ? ex.name.es.toLowerCase() : '';
            const enName = (ex.name && ex.name.en) ? ex.name.en.toLowerCase() : '';
            return esName === cleanName || enName === cleanName || ex.id === cleanName.replace(/ /g, '_');
        });

        if (matched) return matched.id;

        // Si no tenemos ni idea de qué es, lo marcamos como desconocido
        // para que Aerko no explote, y el usuario pueda editarlo luego.
        return `imported_${cleanName.replace(/ /g, '_')}`;
    }

    // ========================================================================
    // --- 2. EXTRACTORES ESPECÍFICOS (Clean Room) ---
    // ========================================================================

    /**
     * Parsea un CSV genérico (Hevy/Strong style) a código Aerko
     */
    _parseGenericCSV(csvText) {
        // Separamos por líneas y limpiamos retornos de carro
        const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.length < 2) throw new Error("err_csv_empty");

        const headers = lines[0].toLowerCase().split(',');
        
        // Detectamos columnas clave independientemente del orden
        const colDate = headers.findIndex(h => h.includes('date') || h.includes('time'));
        const colName = headers.findIndex(h => h.includes('workout') || h.includes('title'));
        const colExercise = headers.findIndex(h => h.includes('exercise') || h.includes('name'));
        const colKg = headers.findIndex(h => h.includes('weight') || h.includes('kg'));
        const colReps = headers.findIndex(h => h.includes('reps'));
        const colRpe = headers.findIndex(h => h.includes('rpe')); // Opcional

        if (colDate === -1 || colExercise === -1 || colKg === -1) {
            throw new Error("err_csv_columns");
        }

        const sessionsMap = new Map(); // Agrupamos por Fecha + Nombre

        for (let i = 1; i < lines.length; i++) {
            // Regex para separar por comas ignorando comas dentro de comillas
            const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/"/g, ''));
            if (row.length < headers.length) continue;

            const dateRaw = row[colDate];
            const workoutName = colName !== -1 ? row[colName] : 'Imported Workout';
            const exerciseRaw = row[colExercise];
            
            const sessionKey = `${dateRaw}_${workoutName}`;
            
            if (!sessionsMap.has(sessionKey)) {
                sessionsMap.set(sessionKey, {
                    id: crypto.randomUUID(),
                    routineId: 'imported',
                    routineName: workoutName,
                    timestamp: new Date(dateRaw).getTime() || Date.now(),
                    exercises: []
                });
            }

            const session = sessionsMap.get(sessionKey);
            const aerkoExerciseId = this._matchExercise(exerciseRaw);

            // Buscamos si el ejercicio ya está en esta sesión
            let exBlock = session.exercises.find(e => e.id === aerkoExerciseId);
            if (!exBlock) {
                exBlock = { id: aerkoExerciseId, sets: [] };
                session.exercises.push(exBlock);
            }

            // Calculamos RIR si viene RPE (RIR = 10 - RPE)
            const rpeVal = colRpe !== -1 ? parseFloat(row[colRpe]) : null;
            const rirVal = (rpeVal && !isNaN(rpeVal)) ? Math.max(0, 10 - rpeVal) : null;

            exBlock.sets.push({
                kg: parseFloat(row[colKg]) || 0,
                reps: parseInt(row[colReps]) || 0,
                rir: rirVal,
                timestamp: session.timestamp // Fallback simple
            });
        }

        return Array.from(sessionsMap.values());
    }

    /**
     * Parsea un JSON genérico (Lyfta/Hevy Pro style)
     */
    _parseGenericJSON(jsonObj) {
        // Asumimos que viene un array de workouts
        const workouts = Array.isArray(jsonObj) ? jsonObj : (jsonObj.workouts || []);
        
        return workouts.map(w => {
            const session = {
                id: crypto.randomUUID(),
                routineId: 'imported',
                routineName: w.title || w.name || 'Imported Workout',
                timestamp: new Date(w.start_time || w.workout_perform_date || Date.now()).getTime(),
                duration: w.duration_seconds || 0,
                exercises: []
            };

            const exList = w.exercises || [];
            exList.forEach(ex => {
                const aerkoId = this._matchExercise(ex.title || ex.excercise_name);
                const sets = (ex.sets || []).map(s => ({
                    kg: parseFloat(s.weight_kg || s.weight || 0),
                    reps: parseInt(s.reps || 0),
                    rir: s.rpe ? Math.max(0, 10 - parseFloat(s.rpe)) : null,
                    timestamp: session.timestamp
                }));

                if (sets.length > 0) {
                    session.exercises.push({ id: aerkoId, sets: sets });
                }
            });

            return session;
        });
    }
}

export const parserService = new ParserService();