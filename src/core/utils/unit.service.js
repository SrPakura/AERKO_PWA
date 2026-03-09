// src/core/utils/unit.service.js

/**
 * MOTOR DE CONVERSIÓN DE AERKO_
 * Regla de Oro: IndexedDB SOLO habla en Sistema Métrico (KG, CM).
 * Toda conversión a LB o IN es pura interfaz de usuario (Ilusión).
 */

const FACTORS = {
    LB_TO_KG: 0.453592,
    KG_TO_LB: 2.20462,
    IN_TO_CM: 2.54,
    CM_TO_IN: 0.393701
};

class UnitService {
    
    /**
     * toBase: De la pantalla a la Base de Datos.
     * Convierte el valor introducido en la UI a la unidad BASE (KG o CM).
     * @param {number|string} value - El valor numérico de la UI
     * @param {string} inputUnit - La unidad seleccionada ('KG', 'LB', 'CM', 'IN')
     * @returns {number} Valor en sistema métrico (Métricas base)
     */
    toBase(value, inputUnit) {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;

        const unit = (inputUnit || '').toUpperCase().trim();

        switch (unit) {
            // --- PESO (Base: KG) ---
            case 'LB':
            case 'LBS':
                return Number((num * FACTORS.LB_TO_KG).toFixed(2));
            case 'KG':
                return Number(num.toFixed(2));
            
            // --- MEDIDAS (Base: CM) ---
            case 'IN':
                return Number((num * FACTORS.IN_TO_CM).toFixed(2));
            case 'CM':
                return Number(num.toFixed(2));
            
            // --- OTROS (%, sin alteración) ---
            case '%':
            default:
                return Number(num.toFixed(2));
        }
    }

    /**
     * toDisplay: De la Base de Datos a la pantalla.
     * Convierte el valor métrico puro a la unidad preferida del usuario.
     * @param {number|string} value - El valor métrico (IndexedDB)
     * @param {string} targetUnit - La unidad en la que se debe mostrar ('KG', 'LB', 'CM', 'IN')
     * @returns {number} Valor convertido para pintar en UI
     */
    toDisplay(value, targetUnit) {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;

        const unit = (targetUnit || '').toUpperCase().trim();

        switch (unit) {
            // --- PESO (Viene de: KG) ---
            case 'LB':
            case 'LBS':
                return Number((num * FACTORS.KG_TO_LB).toFixed(2));
            case 'KG':
                return Number(num.toFixed(2));
            
            // --- MEDIDAS (Viene de: CM) ---
            case 'IN':
                return Number((num * FACTORS.CM_TO_IN).toFixed(2));
            case 'CM':
                return Number(num.toFixed(2));
            
            // --- OTROS (%, sin alteración) ---
            case '%':
            default:
                return Number(num.toFixed(2));
        }
    }
}

// Singleton global
export const unitService = new UnitService();