// src/modules/user/shortcut.registry.js

/**
 * REGISTRO CENTRAL DE ACCESOS DIRECTOS (SHORTCUTS)
 * Aquí se definen todos los widgets disponibles para la pantalla de inicio.
 */

export const SHORTCUT_REGISTRY = {
    // ==========================================
    // 🟢 ESPECIALES (Variante: highlight)
    // Ocupan 2 columnas, tienen título verde y texto dinámico.
    // ==========================================
    'smart_checks': {
        id: 'smart_checks',
        variant: 'highlight',
        titleKey: 'title_smart_checks',
        defaultTextKey: 'text_loading',
        path: '/nutrition'
    },
    'smart_training': {
        id: 'smart_training',
        variant: 'highlight',
        titleKey: 'title_smart_training',
        defaultTextKey: 'text_loading',
        path: '/training'
    },
    'smart_progress': {
        id: 'smart_progress',
        variant: 'highlight',
        titleKey: 'title_smart_progress',
        defaultTextKey: 'text_loading',
        path: '/progress/add'
    },

    // ==========================================
    // ⚪ NORMALES (Variante: simple)
    // Ocupan 1 columna, texto blanco.
    // ==========================================
    'diet': {
        id: 'diet',
        variant: 'simple',
        textKey: 'text_diet',
        path: '/Diet'
    },
    'training_planner': {
        id: 'training_planner',
        variant: 'simple',
        textKey: 'text_planner',
        path: '/training/planner'
    },
    'training_analysis': {
        id: 'training_analysis',
        variant: 'simple',
        textKey: 'text_analysis',
        path: '/training/analysis'
    },
    'analyze_form': {
        id: 'analyze_form',
        variant: 'simple',
        textKey: 'text_form',
        path: '/training/lab/upload'
    },
    'calc_1rm': {
        id: 'calc_1rm',
        variant: 'simple',
        textKey: 'text_1rm',
        path: '/training/1rm'
    },
    'add_record': {
        id: 'add_record',
        variant: 'simple',
        textKey: 'text_record',
        path: '/progress/add'
    },
    'progress_dashboard': {
        id: 'progress_dashboard',
        variant: 'simple',
        textKey: 'text_dashboard',
        path: '/progress'
    },
    'calc_fat': {
        id: 'calc_fat',
        variant: 'simple',
        textKey: 'text_fat',
        path: '/progress/calculator'
    }
};

/**
 * CONFIGURACIÓN POR DEFECTO PARA USUARIOS NUEVOS
 */
export const DEFAULT_SHORTCUTS = [
    'diet',
    'add_record'
];