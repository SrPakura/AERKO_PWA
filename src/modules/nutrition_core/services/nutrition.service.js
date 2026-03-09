// src/modules/nutrition_core/services/nutrition.service.js

import { db } from '../../../core/db/index.js';
import { bus } from '../../../core/bus/index.js';
import { nutritionStore } from '../store/index.js';
import { calculatorService } from './calculator.service.js';

// Importamos a los nuevos especialistas (El Almacenero y el Contable)
import { pantryService } from './pantry.service.js';
import { journalService } from './journal.service.js';

const VAULT_NAME = 'nutrition_vault';
const GOAL_KEY = 'user_diet_goal';

class NutritionService {
    constructor() {
        this.isReady = false;
    }

    /**
     * Inicializa el sistema maestro de nutrición delegando
     * el trabajo duro a los servicios especializados.
     */
    async init() {
        if (this.isReady) return true;

        console.log('[NUTRITION] Booting core systems...');
        try {
            // 1. Cargamos el Objetivo de Dieta (Macros objetivo)
            const goalRecord = await db.get(VAULT_NAME, GOAL_KEY);
            if (goalRecord) {
                nutritionStore.setDietGoal(goalRecord.data);
            }

            // 2. Despertamos al Almacenero (Pantry) y al Contable (Journal)
            // Lo hacemos en paralelo para no perder tiempo
            await Promise.all([
                pantryService.init(),
                journalService.init()
            ]);

            // 3. Activamos el Escudo Antimisiones
            this._attachReactiveListeners();

            this.isReady = true;
            console.log('[NUTRITION] All systems green. GO.');
            return true;

        } catch (error) {
            console.error('[NUTRITION] Critical Error during Init:', error);
            return false;
        }
    }

    // ============================================================
    // ⚙️ GESTIÓN DE OBJETIVOS (DIETA BASE)
    // ============================================================

    /**
     * Guarda el objetivo de macros/calorías del usuario.
     * Llamado principalmente por el WizardService.
     */
    async saveGoalOnly(goal) {
        nutritionStore.setDietGoal(goal);
        await db.put(VAULT_NAME, { id: GOAL_KEY, data: goal });
        console.log('[NUTRITION] Diet Goal updated successfully.');
    }

    /**
     * Comprueba de forma rápida si la dieta actual es manual (Modo Dios).
     */
    isCustomGoal() {
        const goal = nutritionStore.getDietGoal();
        return goal && goal.isCustom === true;
    }

    // ============================================================
    // 🛡️ ESCUDO Y REACTIVIDAD
    // ============================================================

    _attachReactiveListeners() {
        // Escuchamos si el usuario actualiza su peso en su perfil
        bus.on('USER_UPDATED', (userProfile) => {
            this._recalculateDiet(userProfile);
        });
    }

    /**
     * Recalcula la dieta si el usuario cambia de peso,
     * PROTEGIENDO a los usuarios expertos que introdujeron datos a mano.
     */
    async _recalculateDiet(userProfile) {
        const currentGoal = nutritionStore.getDietGoal();
        if (!currentGoal || !currentGoal.targetKcal) return;

        // 🛡️ EL ESCUDO PROTECTOR 🛡️
        // Si la dieta la hizo un experto a mano, la app NO se la recalcula por sorpresa.
        if (currentGoal.isCustom) {
            console.log('[NUTRITION] Dieta Custom detectada. Ignorando recálculo automático.');
            return; 
        }

        const input = {
            weight: userProfile.weight,
            height: userProfile.height,
            age: userProfile.age,
            gender: userProfile.gender === 'XX' ? 'female' : 'male',
            activityFactor: currentGoal.activityFactor || 1.2
        };

        let speed = (currentGoal.goalType === 'lose' || currentGoal.goalType === 'gain') ? 0.10 : 0;

        const newResult = calculatorService.calculateMacros(input, currentGoal.goalType, speed);
        
        // Solo guardamos y emitimos si el cambio es significativo (evitamos micro-ajustes molestos)
        if (Math.abs(newResult.targetKcal - currentGoal.targetKcal) > 10) {
            const updatedGoal = { ...currentGoal, ...newResult };
            await this.saveGoalOnly(updatedGoal); 
            bus.emit('DIET_RECALCULATED', updatedGoal);
            console.log('[NUTRITION] Dieta recalculada automáticamente por cambio de peso.');
        }
    }
}

export const nutritionService = new NutritionService();