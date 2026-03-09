// src/modules/training_core/services/1rm.service.js

class OneRMService {
    
    /**
     * Calcula el 1RM teórico usando la fórmula óptima según el rango de repeticiones.
     * @param {number} weight - Peso levantado
     * @param {number} reps - Repeticiones completadas
     * @returns {number} 1RM estimado (sin redondear)
     */
    calculate1RM(weight, reps) {
        if (reps <= 0 || weight <= 0) return 0;
        if (reps === 1) return weight;

        let oneRM = 0;

        if (reps <= 5) {
            // Fuerza Máxima: Fórmula de Brzycki (Muy precisa en rangos bajos)
            oneRM = weight * (36 / (37 - reps));
        } 
        else if (reps <= 10) {
            // Hipertrofia: Fórmula de Epley (Estándar para rangos medios)
            oneRM = weight * (1 + (reps / 30));
        } 
        else {
            // Resistencia / "Psicópatas": Fórmula de Lombardi (Escala mejor en altas repes)
            oneRM = weight * Math.pow(reps, 0.10);
        }

        return oneRM;
    }

    /**
     * Ingeniería inversa: Calcula cuánto peso deberías levantar para X repeticiones 
     * basándose en tu 1RM teórico.
     * @param {number} oneRM - Tu 1RM teórico
     * @param {number} targetReps - Las repeticiones objetivo (Ej: 5 para tu 5RM)
     * @returns {number} Peso estimado (sin redondear)
     */
    calculateTargetWeight(oneRM, targetReps) {
        if (targetReps <= 0 || oneRM <= 0) return 0;
        if (targetReps === 1) return oneRM;
        
        let weight = 0;

        // Despejamos 'weight' de las fórmulas originales
        if (targetReps <= 5) {
            weight = oneRM * ((37 - targetReps) / 36);
        } 
        else if (targetReps <= 10) {
            weight = oneRM / (1 + (targetReps / 30));
        } 
        else {
            weight = oneRM / Math.pow(targetReps, 0.10);
        }

        return weight;
    }

    /**
     * Genera el desglose completo para la UI (Del 1RM al 9RM).
     * @param {number} weight - Peso levantado
     * @param {number} reps - Repeticiones completadas
     * @returns {Object} Diccionario con los pesos redondeados listos para pintar
     */
    generateRMTable(weight, reps) {
        const raw1RM = this.calculate1RM(weight, reps);
        
        // Estructura base con el 1RM
        const table = {
            "1RM": Math.round(raw1RM)
        };
        
        // Generamos del 2RM al 9RM como sale en el diseño de Figma
        for (let i = 2; i <= 9; i++) {
            table[`${i}RM`] = Math.round(this.calculateTargetWeight(raw1RM, i));
        }
        
        return table;
    }

    /**
     * Un pequeño Easter Egg o helper para la UI si meten cardio. Y no, nadie me va a convencer de que se puede entrenar la resistencia. Que pereza
     * RETORNA LA CLAVE DE TRADUCCIÓN (I18N), NO EL TEXTO DURO.
     */
    getFeedbackMessage(reps) {
        if (reps === 1) return "core_feedback_strength";
        if (reps > 15) return "core_feedback_cardio";
        return null;
    }
}

export const oneRmService = new OneRMService();