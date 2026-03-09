// src/modules/settings/services/export.service.js

import { db } from '../../../core/db/index.js';
import { cryptoService } from '../../../core/crypto/index.js';
import { authService } from '../../auth/services/auth.service.js';

class ExportService {
    /**
     * Exporta las bóvedas seleccionadas, desencriptando al vuelo si es necesario.
     * @param {string[]} selectedVaults - Ej: ['user_vault', 'nutrition_vault']
     */
    async exportData(selectedVaults) {
        if (!selectedVaults || selectedVaults.length === 0) {
            // Lanzamos la llave para que el i18n la procese en la vista
            throw new Error("err_export_no_vaults");
        }

        // 1. Consultar estado de seguridad actual
        const config = await authService._getConfig(); 
        const isSecurityEnabled = config.security_enabled; 
        const protectedVaults = config.protected_vaults || [];

        const exportPayload = {};

        // 2. Iterar sobre cada bóveda que el usuario quiere exportar
        for (const vaultName of selectedVaults) {
            const rawRecords = await db.getAll(vaultName); 
            
            // Si la seguridad global está activa y ESTA bóveda está en la lista de protegidas...
            if (isSecurityEnabled && protectedVaults.includes(vaultName)) {
                
                // Defensa vital: Comprobar que la llave maestra está en RAM 
                if (!cryptoService.key) { 
                    // Lanzamos la llave
                    throw new Error("err_export_no_key");
                }

                const decryptedRecords = [];
                for (const record of rawRecords) {
                    try {
                        // Desencriptamos el payload (asumiendo que Aerko guarda lo cifrado en record.data)
                        const decryptedData = await cryptoService.decrypt(record.data); 
                        decryptedRecords.push({
                            id: record.id,
                            data: decryptedData
                        });
                    } catch (error) {
                        console.warn(`[EXPORT] Imposible descifrar el registro ${record.id} de la bóveda ${vaultName}. Posible corrupción de datos.`, error);
                        // Lo ignoramos para no exportar basura ilegible
                    }
                }
                exportPayload[vaultName] = decryptedRecords;

            } else {
                // Si la bóveda no está protegida, nos llevamos los datos tal cual 
                exportPayload[vaultName] = rawRecords;
            }
        }

        // 3. Crear el archivo descargable
        const jsonString = JSON.stringify(exportPayload, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // 4. Forzar la descarga (Truco de crear un <a> temporal)
        const a = document.createElement('a');
        a.href = url;
        
        // Un poco de clase: añadir la fecha al nombre del archivo
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `Aerko_Export_${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        
        // 5. Limpieza para no dejar basura en el DOM ni en la memoria
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 150);

        return true;
    }
}

export const exportService = new ExportService();