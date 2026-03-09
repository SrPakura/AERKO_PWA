// src/modules/nutrition_wizard/store/wizard.store.js

class WizardStore {
    constructor() {
        // Inicializamos la pizarra en blanco al arrancar
        this.reset();
    }

    /**
     * Devuelve el store a su estado de fábrica.
     * Útil para limpiar el borrador cuando el usuario termina o cancela.
     */
    reset() {
        this.state = {
            // --- PASO 1: Biometría ---
            gender: 'XX',
            age: '',
            height: '',
            weight: '00.0',
            unitWeight: 'KG',
            unitHeight: 'M',

            // --- PASO 2: Actividad ---
            activityLevel: 'sedentary',

            // --- PASO 3: Objetivo Estándar ---
            goalType: 'lose',
            speed: 'normal',

            // --- MODO DIOS (Expert / Custom) ---
            targetKcal: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            interval: 0.05, // Margen de error por defecto (±5%)
            isCustom: false
        };
    }

    /**
     * HIDRATACIÓN: Carga los datos reales del usuario en el borrador.
     * Así, si el usuario ya existe, no empieza con los campos en blanco.
     */
    hydrate(userProfile = {}, currentGoal = {}) {
        // 1. Cargamos lo que sepamos de su cuerpo
        if (userProfile.weight) {
            this.state.gender = userProfile.gender || 'XX';
            this.state.age = userProfile.age || '';
            this.state.height = userProfile.height || '';
            this.state.weight = userProfile.weight || '00.0';
            this.state.activityLevel = userProfile.activityLevel || 'sedentary';
        }

        // 2. Cargamos lo que sepamos de su dieta actual
        if (currentGoal.targetKcal) {
            this.state.goalType = currentGoal.goalType || 'lose';
            this.state.isCustom = currentGoal.isCustom || false;

            // Si estaba en Modo Dios, le recuperamos sus macros exactos
            if (this.state.isCustom) {
                this.state.targetKcal = currentGoal.targetKcal || 0;
                this.state.protein = currentGoal.protein || 0;
                this.state.carbs = currentGoal.carbs || 0;
                this.state.fat = currentGoal.fat || 0;
                // Intentamos deducir el intervalo que usó, o le ponemos el 5% por defecto
                this.state.interval = currentGoal.interval || 0.05; 
            }
        }
        console.log('[WIZARD STORE] Pizarra hidratada con datos reales:', this.state);
    }

    /**
     * Actualiza cualquier parte del borrador (Merge).
     * Ej: wizardStore.update({ weight: '85.5' })
     */
    update(partialData) {
        this.state = { ...this.state, ...partialData };
    }

    /**
     * Devuelve una foto actual de toda la pizarra.
     */
    getState() {
        // Devolvemos una copia para evitar mutaciones accidentales desde fuera
        return { ...this.state };
    }
}

// Exportamos el Singleton (Una única pizarra para toda la app)
export const wizardStore = new WizardStore();