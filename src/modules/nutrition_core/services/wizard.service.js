// src/modules/nutrition_core/services/wizard.service.js

import { wizardStore } from '../../nutrition_wizard/store/wizard.store.js';
import { nutritionService } from './nutrition.service.js';
import { calculatorService, SPEED } from './calculator.service.js';
import { nutritionStore } from '../store/index.js'; 
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

class WizardService {
    
    /**
     * 1. HIDRATACIÓN INICIAL
     * Se llama cuando el usuario abre la pantalla 1 del Wizard.
     * Carga la verdad actual de la BD en la pizarra borrador.
     */
    async init() {
        wizardStore.reset(); // Limpiamos la pizarra por seguridad
        
        // Cogemos los datos que la app ya tiene cargados en RAM
        const currentBiometrics = nutritionStore.getWizardState() || {};
        const currentGoal = nutritionStore.getDietGoal() || {};
        
        // Se los pasamos al borrador
        wizardStore.hydrate(currentBiometrics, currentGoal);
        console.log('[WIZARD SERVICE] Sistema inicializado y borrador hidratado.');
    }

    /**
     * 2. GUARDAR DIETA ESTÁNDAR (El flujo de 3 pasos)
     */
    async saveStandardGoal() {
        const draft = wizardStore.getState();

        // A. Mapear velocidad a porcentajes reales
        const speedMap = {
            'safe': SPEED.SAFE,     // 0.075
            'normal': SPEED.NORMAL, // 0.10
            'fast': SPEED.FAST      // 0.15
        };

        // B. Preparar los datos que pide la calculadora
        const input = {
            weight: draft.weight,
            height: draft.height,
            age: draft.age,
            gender: draft.gender === 'XX' ? 'female' : 'male',
            activityFactor: this._getActivityFactor(draft.activityLevel)
        };
        
        // --- NUEVO: Leer el modo actual (a, b o c) ---
        const appMode = i18nService.getPreferences().mode;

        // C. Magia matemática: Calculamos Kcal y Macros
        const result = calculatorService.calculateMacros(
            input,
            draft.goalType,
            speedMap[draft.speed] || 0,
            appMode // <--- AÑADE ESTE CUARTO PARÁMETRO
        );

        const finalGoal = {
            ...result, // minKcal, maxKcal, targetKcal, tmb, protein, carbs, fat
            goalType: draft.goalType,
            formulaUsed: 'harris_benedict',
            isCustom: false,
            // ¡NUEVO! Guardamos el factor de actividad para futuros recálculos
            activityFactor: this._getActivityFactor(draft.activityLevel) 
        };

        // D. Sincronizamos biometría y guardamos
        this._syncBiometricsToCore(draft);
        await nutritionService.saveGoalOnly(finalGoal);
        console.log('[WIZARD SERVICE] Dieta Estándar calculada y guardada.');
    }

    /**
     * 3. GUARDAR DIETA EXPERTA (El nuevo Modo "Dumb Code")
     */
    async saveCustomGoal() {
        const draft = wizardStore.getState();

        // A. Extraemos exactamente lo que el usuario escribió (Fallback a 0 por seguridad)
        const targetKcal = parseInt(draft.targetKcal) || 0;
        const interval = parseFloat(draft.interval) || 0.05; // 5% por defecto

        // B. Montamos el objeto final SIN calcular TMB
        const finalGoal = {
            tmb: 0, // Fallback seguro para evitar NaN en cálculos futuros
            targetKcal: targetKcal,
            minKcal: Math.round(targetKcal * (1 - interval)), // Calculamos el margen inferior
            maxKcal: Math.round(targetKcal * (1 + interval)), // Calculamos el margen superior
            
            protein: parseInt(draft.protein) || 0,
            carbs: parseInt(draft.carbs) || 0,
            fat: parseInt(draft.fat) || 0,
            
            formulaUsed: 'manual', // Etiqueta limpia
            goalType: 'custom',    // Etiqueta limpia
            isCustom: true,        // LA FLAG CRÍTICA
            interval: interval     // Guardamos el intervalo para hidratarlo en el futuro
        };

        // C. Sincronizamos biometría y guardamos
        this._syncBiometricsToCore(draft);
        await nutritionService.saveGoalOnly(finalGoal);
        console.log('[WIZARD SERVICE] Dieta Experta guardada en Modo Dios.');
    }

    // --- HELPERS INTERNOS ---

    /**
     * Pasa los datos biométricos del borrador al Store Principal.
     * Es obligatorio hacerlo antes de llamar a nutritionService.saveDietGoal()
     * porque este último lee de nutritionStore para actualizar el perfil global.
     */
    _syncBiometricsToCore(draft) {
        // 1. Guardamos en RAM (lo que ya tenías)
        nutritionStore.setWizardState({
            gender: draft.gender,
            height: draft.height,
            age: draft.age,
            weight: draft.weight,
            activityLevel: draft.activityLevel
        });

        // 2. ¡NUEVO! Guardamos a fuego en la base de datos (IndexedDB)
        userService.updateBiometrics({
            weight: draft.weight,
            height: draft.height,
            age: draft.age,
            gender: draft.gender,
            activityLevel: draft.activityLevel
        });
    }

    _getActivityFactor(level) {
        const map = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'extreme': 1.9
        };
        return map[level] || 1.2;
    }
}

export const wizardService = new WizardService();