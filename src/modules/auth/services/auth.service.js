// src/modules/auth/services/auth.service.js
import { db } from '../../../core/db/index.js';
import { cryptoService } from '../../../core/crypto/index.js';

const STORE = 'public_store';
const CONFIG_ID = 'app_config'; 
const CANARY_ID = 'auth_canary'; 
const SALT_ID = 'auth_salt';     

class AuthService {
    
    /**
     * Consulta si el usuario tiene la seguridad activada (PIN).
     * @returns {Promise<boolean>}
     */
    async hasPin() {
        const config = await this._getConfig();
        return !!config.security_enabled;
    }

    /**
     * Consulta si hay una sesión de desencriptación activa en la RAM.
     * VITAL para el Router: Si esto es false y el usuario tiene PIN, no le dejamos pasar.
     * @returns {boolean}
     */
    isSessionActive() {
        // Si cryptoService.key es null, significa que no se ha metido el PIN
        // o que se ha refrescado la página (limpiando la RAM).
        return !!cryptoService.key;
    }

    /**
     * Consulta si el usuario ya terminó el onboarding.
     * @returns {Promise<boolean>}
     */
    async isOnboardingComplete() {
        const config = await this._getConfig();
        return !!config.onboarding_complete;
    }

    async completeOnboarding() {
        const config = await this._getConfig();
        config.onboarding_complete = true;
        await db.put(STORE, config);
    }

    /**
     * Intenta desbloquear la app con un PIN.
     */
    async verifyPin(pin) {
        // 1. Recuperar la SAL única
        const saltRecord = await db.get(STORE, SALT_ID);
        
        if (!saltRecord) {
            console.error('[AUTH] No salt found. Critical integrity error.');
            return false;
        }

        // 2. Generar clave en RAM
        const keyGenerated = await cryptoService.initSession(pin, saltRecord.value);
        if (!keyGenerated) return false;

        try {
            // 3. Buscar el canario cifrado
            const canary = await db.get(STORE, CANARY_ID);
            
            if (!canary) {
                console.warn('[AUTH] Security flag is ON but Canary is missing.');
                return true; 
            }

            // 4. Intentar descifrar
            const decrypted = await cryptoService.decrypt(canary.data);
            
            // 5. Verificar contenido
            return decrypted.secret === 'AERKO_SECURE';

        } catch (error) {
            console.error('[AUTH] PIN Incorrecto (Fallo al descifrar canario).');
            return false;
        }
    }

    /**
     * Activa la seguridad creando un PIN nuevo y migrando los datos.
     */
    async enableSecurity(pin) {
        // 1. GENERAR SAL ALEATORIA
        const saltArray = window.crypto.getRandomValues(new Uint8Array(16));
        const saltHex = Array.from(saltArray).map(b => b.toString(16).padStart(2, '0')).join('');

        console.log('[AUTH] Generating unique salt for user:', saltHex);

        // 2. Guardar Sal
        await db.put(STORE, { id: SALT_ID, value: saltHex });

        // 3. Iniciar sesión
        await cryptoService.initSession(pin, saltHex);

        // 4. Crear Canario
        const canaryPayload = { secret: 'AERKO_SECURE', timestamp: Date.now() };
        const encryptedCanary = await cryptoService.encrypt(canaryPayload);

        // 5. Guardar Canario
        await db.put(STORE, { id: CANARY_ID, data: encryptedCanary });

        // 6. Actualizar Config
        const config = await this._getConfig();
        config.security_enabled = true;
        await db.put(STORE, config);

        // 7. LA GRAN MIGRACIÓN: Cifrar los datos existentes
        console.log('[AUTH] Iniciando migración a datos cifrados...');
        for (const vault of config.protected_vaults) {
            // Leemos los datos "por la puerta de atrás" para evitar que el middleware intente descifrarlos
            const records = await db._transaction(vault, 'readonly', store => store.getAll());
            
            for (const record of records) {
                // Al usar el put normal, el middleware de la Fase 1 lo interceptará
                // y lo cifrará automáticamente porque la sesión ya está iniciada. ¡Magia!
                await db.put(vault, record);
            }
        }

        console.log('[AUTH] Security Enabled with Unique Salt & Data Migrated.');
    }

    /**
     * Actualiza la lista de vaults que el usuario quiere cifrar.
     */
    async updateProtectedVaults(vaultsArray) {
        const config = await this._getConfig();
        config.protected_vaults = vaultsArray;
        await db.put(STORE, config);
        console.log('[AUTH] Bóvedas protegidas actualizadas:', vaultsArray);
    }

    /**
     * Desactiva la seguridad de la app. REQUIERE EL PIN ACTUAL.
     * @returns {Promise<boolean>} True si se desactivó, false si el PIN era incorrecto.
     * Esto no va a funcionar, ya ha dado un error chungo y tengo hasta miedo. 
     */
    async disableSecurity(currentPin) {
        // 1. Validar que el PIN es el correcto
        const isValid = await this.verifyPin(currentPin);
        if (!isValid) return false;

        const config = await this._getConfig();

        // 2. LA GRAN MIGRACIÓN INVERSA: Desencriptar datos
        console.log('[AUTH] Iniciando reversión a datos en texto plano...');
        for (const vault of config.protected_vaults) {
            // Leemos los datos crudos cifrados (con su .data.iv) por la puerta de atrás
            const records = await db._transaction(vault, 'readonly', store => store.getAll());
            
            for (const record of records) {
                // Si el registro está cifrado...
                if (record.data && record.data.iv) {
                    // Lo desciframos manualmente
                    const decryptedPayload = await cryptoService.decrypt(record.data);
                    // Reconstruimos el objeto original
                    const plainRecord = { id: record.id, ...decryptedPayload };
                    
                    // Lo guardamos en texto plano por la puerta de atrás (esquivando el middleware)
                    await db._transaction(vault, 'readwrite', store => store.put(plainRecord));
                }
            }
        }
        console.log('[AUTH] Reversión a texto plano completada.');

        // 3. Destruir las llaves y el canario del almacenamiento persistente
        await db.delete(STORE, CANARY_ID);
        await db.delete(STORE, SALT_ID);

        // 4. Apagar la bandera de seguridad
        config.security_enabled = false;
        await db.put(STORE, config);

        // 5. Cerrar la sesión criptográfica actual por seguridad (limpia RAM)
        cryptoService.lock();
        
        console.log('[AUTH] Security Disabled. Keys destroyed.');
        return true;
    }

    // --- PRIVADO ---

    async _getConfig() {
        const config = await db.get(STORE, CONFIG_ID);
        
        // Si no hay configuración previa, devolvemos la de por defecto
        if (!config) {
            return { 
                id: CONFIG_ID, 
                security_enabled: false, 
                onboarding_complete: false,
                protected_vaults: ['user_vault', 'nutrition_vault', 'training_vault', 'progress_vault']
            };
        }

        // PARCHE DE COMPATIBILIDAD: Si es una configuración antigua y no tiene los vaults, se los inyectamos
        if (!config.protected_vaults) {
            config.protected_vaults = ['user_vault', 'nutrition_vault', 'training_vault', 'progress_vault'];
        }

        return config;
    }
}

export const authService = new AuthService();