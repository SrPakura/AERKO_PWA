// src/modules/progress_core/services/progress.service.js

import { db } from '../../../core/db/index.js';
import { bus } from '../../../core/bus/index.js';
import { userService } from '../../user/services/user.service.js';
import { progressStore } from '../store/index.js';
// 1. Importamos el traductor para saber en qué modo estamos
import { i18nService } from '../../../core/i18n/i18n.service.js';

const VAULT_NAME = 'progress_vault';
const RECORDS_KEY = 'user_progress_history';

// ¡Adiós a la constante global de 20 horas! Ahora se calcula dinámicamente.

class ProgressService {
    constructor() {
        this.isReady = false;
    }

    /**
     * Inicializa el módulo cargando los registros históricos.
     */
    async init() {
        if (this.isReady) return true;
        
        console.log('[PROGRESS] Abriendo la bóveda de progreso...');
        try {
            const record = await db.get(VAULT_NAME, RECORDS_KEY);
            
            if (record && record.data) {
                progressStore.setRecords(record.data);
            } else {
                progressStore.setRecords([]);
            }

            this.isReady = true;
            console.log(`[PROGRESS] Listo. Registros cargados: ${progressStore.getRecords().length}`);
            return true;
        } catch (error) {
            console.error('[PROGRESS] Error crítico al inicializar:', error);
            return false;
        }
    }

    /**
     * --- EL PORTERO DEL VILLAMARÍN (ACTUALIZADO PARA EL MODO ZEN) ---
     * Comprueba si el usuario puede añadir un registro o tiene que esperar
     */
    canAddRecord() {
        const records = progressStore.getRecords();
        
        // Si no hay registros, es como un canterano debutando: vía libre total.
        if (records.length === 0) return true; 

        // 2. Obtenemos el modo actual desde las preferencias
        const appMode = i18nService.getPreferences().mode;

        // 3. Calculamos el tiempo de espera según la personalidad:
        // 'b' (Zen) = 1 semana (7 días * 24 hrs * 60 min * 60 seg * 1000 ms)
        // Default/Tsundere = 20 horas
        const cooldownMs = appMode === 'b'
            ? 7 * 24 * 60 * 60 * 1000  
            : 20 * 60 * 60 * 1000;     

        // Cogemos el último (que es el más nuevo, como el último fichaje estrella)
        const lastRecordTime = records[0].timestamp; 
        const timePassed = Date.now() - lastRecordTime;

        // ¿Han pasado ya las horas necesarias? Si no, se queda en el banquillo esperando.
        return timePassed >= cooldownMs;
    }

    /**
     * Añade un nuevo registro de progreso
     */
    async addRecord(data) {
        // --- NUEVO: Validación de seguridad (El VAR del progreso) ---
        if (!this.canAddRecord()) {
            console.warn('[PROGRESS] ¡Quieto ahí! Cooldown activo. No se puede guardar todavía.');
            return null;
        }

        const newRecord = {
            id: `PRG_${Date.now()}`,
            timestamp: Date.now(),
            ...data
        };

        // 1. Guardar en el Store (RAM) - Directo a la escuadra
        progressStore.addRecord(newRecord);
        
        // --- NUEVO: Limpiamos el borrador (Como dejar el vestuario limpio tras ganar el derbi) ---
        if (typeof progressStore.clearDraft === 'function') {
            progressStore.clearDraft();
        }

        // 2. Persistir en la bóveda cifrada (IndexedDB)
        await this._syncToDB();

        console.log(`[PROGRESS] Nuevo registro guardado: ${newRecord.id}`);

        // 3. LA MAGIA: Datos transversales (Repartiendo juego como Isco)
        const bioUpdates = {};
        if (data.weight) bioUpdates.weight = data.weight;
        if (data.bodyFat) bioUpdates.bodyFat = data.bodyFat;

        if (Object.keys(bioUpdates).length > 0) {
            console.log('[PROGRESS] Detectados datos transversales. Notificando al Kernel...');
            await userService.updateBiometrics(bioUpdates);
        }

        // Emitimos un evento local para que las gráficas se pongan de verde y blanco
        bus.emit('PROGRESS_RECORD_ADDED', newRecord);

        return newRecord;
    }

    // ============================================================
    // ⚙️ HELPERS PRIVADOS (El trabajo sucio que no se ve, como el de un buen pivote)
    // ============================================================

    async _syncToDB() {
        const records = progressStore.getRecords();
        await db.put(VAULT_NAME, { 
            id: RECORDS_KEY, 
            data: records 
        });
    }
}

export const progressService = new ProgressService();