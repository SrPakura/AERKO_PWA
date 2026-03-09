// src/modules/nutrition_core/services/calculator.service.js

export const FORMULAS = {
    HARRIS_BENEDICT: 'harris_benedict',
    CUSTOM: 'custom'
};

export const GOALS = {
    LOSE: 'lose',          // Perder Peso
    MAINTAIN: 'maintain',  // Mantener
    GAIN: 'gain'           // Ganar Músculo
};

export const SPEED = {
    SAFE: 0.075,    // 7.5%
    NORMAL: 0.10,   // 10%
    FAST: 0.15      // 15%
};

// Definición de ratios según ISSN
const MACRO_RATIOS = {
    [GOALS.GAIN]:     { p: 1.8,  f: 1.0  }, // Carbos: Resto
    [GOALS.MAINTAIN]: { p: 1.6,  f: 0.75 }, // Carbos: Resto
    [GOALS.LOSE]:     { p: 2.0,  f: 0.5  }  // Carbos: Resto
};

class CalculatorService {

    // Añadimos appMode = 'a' por defecto para no romper usos anteriores
    calculateMacros(input, goalType, speedPercent = 0, appMode = 'a') {
        // 1. Calcular TMB (Harris Benedict 1984)
        let tmb = 0;
        const w = parseFloat(input.weight);
        const h = parseFloat(input.height);
        const a = parseFloat(input.age);

        if (input.gender === 'male') {
            tmb = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
        } else {
            tmb = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
        }

        // 2. Calcular TDEE con Intervalo ADITIVO 
        // LÓGICA MODO ZEN: ±2% (0.02) si appMode es 'b', de lo contrario ±1% (0.01)
        const factorBase = parseFloat(input.activityFactor); 
        const interval = appMode === 'b' ? 0.02 : 0.01;
        
        const factorMin = factorBase - interval; 
        const factorMax = factorBase + interval; 

        const tdeeMin = tmb * factorMin;
        const tdeeMax = tmb * factorMax;

        // 3. Aplicar Objetivo (Déficit / Superávit) a las CALORÍAS
        let modifier = 1;

        if (goalType === GOALS.LOSE) {
            modifier = 1 - speedPercent;
        } else if (goalType === GOALS.GAIN) {
            modifier = 1 + speedPercent;
        }

        const minKcal = Math.round(tdeeMin * modifier);
        const maxKcal = Math.round(tdeeMax * modifier);
        const targetKcal = Math.round(((tdeeMin + tdeeMax) / 2) * modifier);

        // --- 4. CÁLCULO DE MACROS (LÓGICA ISSN) ---
        
        // A. Obtener ratios según objetivo
        // Si por error goalType no existe, fallback a MAINTAIN
        const ratios = MACRO_RATIOS[goalType] || MACRO_RATIOS[GOALS.MAINTAIN];

        // B. Calcular Fijos (Proteína y Grasa)
        const proteinGrams = Math.round(w * ratios.p);
        const fatGrams = Math.round(w * ratios.f);

        // C. Calcular Calorías ocupadas por los fijos
        const fixedKcal = (proteinGrams * 4) + (fatGrams * 9);

        // D. Calcular Carbohidratos (El "Resto")
        // Usamos targetKcal para dar un objetivo fijo al usuario, 
        // sabiendo que el intervalo min/max lo absorben los carbos implícitamente.
        const remainingKcal = targetKcal - fixedKcal;
        
        // Evitamos números negativos si la dieta es muy extrema (edge case)
        const carbGrams = remainingKcal > 0 ? Math.round(remainingKcal / 4) : 0;

        // 5. Retornar Objeto Completo
        return {
            tmb: Math.round(tmb),
            minKcal: minKcal,
            maxKcal: maxKcal,
            targetKcal: targetKcal,
            // Nuevos campos que se guardarán en DB automáticamente
            protein: proteinGrams,
            fat: fatGrams,
            carbs: carbGrams
        };
    }
}

export const calculatorService = new CalculatorService();