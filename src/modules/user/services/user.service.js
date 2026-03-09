// src/modules/user/services/user.service.js
import { db } from '../../../core/db/index.js';
import { bus } from '../../../core/bus/index.js';
import { DEFAULT_SHORTCUTS } from '../shortcut.registry.js'; // 🟢 Importamos el array por defecto

const VAULT = 'user_vault';
const BIOMETRICS_KEY = 'biometrics'; // ID único para el registro en DB
const SHORTCUTS_KEY = 'home_shortcuts'; // 🟢 ID único para los accesos directos

class UserService {
    constructor() {
        // RAM Cache: Para no leer de IndexedDB cada vez que alguien pregunta el peso o los atajos
        this._profile = null;
        this._shortcuts = null; // 🟢 Cache de los atajos
    }

    /**
     * Carga los datos al iniciar la app
     */
    async init() {
        try {
            // 1. Cargar Biometría
            const record = await db.get(VAULT, BIOMETRICS_KEY);
            if (record) {
                this._profile = record.data;
                console.log('[USER] Biometrics loaded into RAM.');
            } else {
                console.log('[USER] No biometrics found (New user).');
                this._profile = {};
            }

            // 2. Cargar Accesos Directos (NUEVO) 🟢
            const shortcutsRecord = await db.get(VAULT, SHORTCUTS_KEY);
            if (shortcutsRecord && shortcutsRecord.data) {
                this._shortcuts = shortcutsRecord.data;
                console.log('[USER] Shortcuts loaded into RAM.');
            } else {
                console.log('[USER] No custom shortcuts found. Using defaults.');
                this._shortcuts = [...DEFAULT_SHORTCUTS]; // Usamos los del registro
            }

        } catch (e) {
            console.error('[USER] Failed to load user data:', e);
        }
    }

    /**
     * Devuelve los datos actuales (sincrono si ya inició)
     */
    getProfile() {
        return this._profile || {};
    }

    /**
     * Devuelve el array de accesos directos actual 🟢
     */
    getShortcuts() {
        return this._shortcuts || [...DEFAULT_SHORTCUTS];
    }

    /**
     * Actualiza datos biométricos y AVISA A TODOS (Event Bus)
     * @param {Object} newData - { weight, height, age, gender, activityLevel... }
     */
    async updateBiometrics(newData) {
        // 1. Merge: Fusionamos lo nuevo con lo que ya había
        // Así si solo pasas el peso, no borras la altura
        const updatedProfile = { ...this._profile, ...newData };

        // 2. Guardar en RAM
        this._profile = updatedProfile;

        // 3. Persistir en DB (Cifrado por user_vault)
        await db.put(VAULT, { id: BIOMETRICS_KEY, data: updatedProfile });

        // 4. EL GRITO: Avisar al sistema que el usuario ha cambiado
        // Aquí es donde Nutrición escuchará
        bus.emit('USER_UPDATED', updatedProfile);
        
        console.log('%c[USER] Biometrics Updated & Broadcasted', 'color: #BEFF00', updatedProfile);
    }

    /**
     * Actualiza el orden/selección de los accesos directos 🟢
     * @param {Array<string>} newShortcuts - Array con los IDs (ej: ['smart_checks', ...])
     */
    async updateShortcuts(newShortcuts) {
        this._shortcuts = newShortcuts;
        
        // Persistir en DB (Lo metemos en user_vault para que esté cifrado)
        await db.put(VAULT, { id: SHORTCUTS_KEY, data: newShortcuts });
        
        // Avisamos por si alguien más necesita saberlo (ej: home.js)
        bus.emit('SHORTCUTS_UPDATED', newShortcuts);
        
        console.log('%c[USER] Shortcuts Updated', 'color: #BEFF00', newShortcuts);
    }
}

export const userService = new UserService();