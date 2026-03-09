// src/modules/settings/services/import.service.js

import { db } from '../../../core/db/index.js';
import { cryptoService } from '../../../core/crypto/index.js';
import { authService } from '../../auth/services/auth.service.js';

class ImportService {
    /**
     * Inyecta un backup nativo de Aerko en la base de datos.
     * @param {File} file - El archivo Aerko_Export_*.json
     */
    async importAerkoBackup(file) {
        // 1. Leer y parsear el archivo
        const text = await this._readFile(file);
        let backupData;
        try {
            backupData = JSON.parse(text);
        } catch (e) {
            throw new Error("err_json_corrupt");
        }

        // 2. Consultar el estado de seguridad de ESTE dispositivo
        const config = await authService._getConfig();
        const isSecurityEnabled = config.security_enabled;
        const protectedVaults = config.protected_vaults || [];

        // Si hay seguridad y hay bóvedas protegidas, necesitamos la llave en RAM para cifrar
        if (isSecurityEnabled && protectedVaults.length > 0 && !cryptoService.key) {
            throw new Error("err_system_locked");
        }

        // 3. Iterar sobre las bóvedas del backup
        for (const vaultName of Object.keys(backupData)) {
            const records = backupData[vaultName];
            if (!Array.isArray(records)) continue;

            const isVaultProtected = isSecurityEnabled && protectedVaults.includes(vaultName);

            // 4. Procesar registro a registro
            for (const record of records) {
                if (!record.id) continue; // Si no hay ID, es basura, lo ignoramos

                let recordToSave;

                // LA ADUANA: ¿Necesita cifrado?
                if (isVaultProtected) {
                    // Si está protegida, nos aseguramos de aislar el payload correctamente
                    // Si el backup ya venía de un sistema sin cifrar, el payload es todo menos el ID
                    const payload = record.data !== undefined ? record.data : this._extractPayload(record);
                    
                    const encryptedData = await cryptoService.encrypt(payload);
                    
                    recordToSave = {
                        id: record.id,
                        data: encryptedData
                    };
                } else {
                    // Si NO está protegida (ej: public_store), reconstruimos el objeto 
                    // para asegurarnos de que no lo metemos en una propiedad 'data' por error
                    // si es que venía desencriptado de una bóveda que ANTES estaba protegida.
                    if (record.data !== undefined && Object.keys(record).length === 2) {
                        // Venía de un backup donde esto estaba cifrado/empaquetado, lo aplanamos
                        recordToSave = { id: record.id, ...record.data };
                    } else {
                        // Ya venía plano y perfecto
                        recordToSave = { ...record };
                    }
                }

                // 5. Inyectar en la base de datos (Upsert: actualiza si ya existe)
                await db.put(vaultName, recordToSave);
            }
            console.log(`%c[IMPORT] Bóveda '${vaultName}' inyectada con éxito.`, 'color: #CCFF00');
        }

        return true;
    }

    // ==========================================
    // HELPERS PRIVADOS
    // ==========================================

    _readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Error de lectura del sistema de archivos."));
            reader.readAsText(file);
        });
    }

    _extractPayload(record) {
        // Extrae todo menos el ID para cifrarlo
        const { id, ...rest } = record;
        return rest;
    }
}

export const importService = new ImportService();