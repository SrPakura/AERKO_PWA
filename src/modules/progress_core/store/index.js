// src/modules/progress_core/store/index.js

class ProgressStore {
    constructor() {
        this.state = {
            records: [], // Todos los registros históricos de progreso
            latestBiometrics: {
                weight: null,
                bodyFat: null
            },
            // --- NUEVO: El borrador temporal para las 3 pantallas ---
            draft: {} 
        };
    }

    // ==========================================
    // CARGA DE DATOS (Setters)
    // ==========================================

    setRecords(records) {
        this.state.records = records.sort((a, b) => b.timestamp - a.timestamp);
        this._updateLatest();
    }

    addRecord(record) {
        this.state.records.push(record);
        this.state.records.sort((a, b) => b.timestamp - a.timestamp);
        this._updateLatest();
    }

    // --- NUEVOS SETTERS DEL BORRADOR ---
    updateDraft(newData) {
        // Fusionamos lo que ya hay en el borrador con lo nuevo
        this.state.draft = { ...this.state.draft, ...newData };
    }

    clearDraft() {
        this.state.draft = {};
    }

    // ==========================================
    // LECTURA DE DATOS (Getters)
    // ==========================================

    getRecords() {
        return this.state.records;
    }

    getLatestBiometrics() {
        return this.state.latestBiometrics;
    }

    // --- NUEVO GETTER DEL BORRADOR ---
    getDraft() {
        return this.state.draft;
    }

    // ==========================================
    // HELPERS PRIVADOS
    // ==========================================

    _updateLatest() {
        let w = null, bf = null;
        for (const r of this.state.records) {
            if (w === null && r.weight) w = r.weight;
            if (bf === null && r.bodyFat) bf = r.bodyFat;
            if (w !== null && bf !== null) break;
        }
        
        this.state.latestBiometrics = { weight: w, bodyFat: bf };
    }
}

// Singleton global
export const progressStore = new ProgressStore();