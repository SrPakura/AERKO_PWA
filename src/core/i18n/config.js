// src/core/i18n/config.js

// LEYENDA DE MODOS (El código genético del idioma):
// a = Default (Siempre debe estar)
// b = Zen
// c = Tsundere

export const SUPPORTED_LANGUAGES = [
    { id: 'es', nameKey: 'lang_es', type: 'abc' },
    { id: 'en', nameKey: 'lang_en',  type: 'ab' },
    { id: 'pt', nameKey: 'lang_pt', type: 'ab' },
    { id: 'de', nameKey: 'lang_de', type: 'ab' }, 
    { id: 'fr', nameKey: 'lang_fr', type: 'ab' }
];

export const MODES_INFO = {
    'a': { 
        id: 'default', 
        labelKey: 'mode_default_label', 
        descKey: 'mode_default_desc' 
    },
    'b': { 
        id: 'zen', 
        labelKey: 'mode_zen_label', 
        descKey: 'mode_zen_desc' 
    },
    'c': { 
        id: 'tsu', 
        labelKey: 'mode_tsu_label', 
        descKey: 'mode_tsu_desc' 
    }
};

export const DEFAULT_LANG = 'es';
export const DEFAULT_MODE = 'a';