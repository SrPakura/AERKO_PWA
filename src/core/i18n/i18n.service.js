// src/core/i18n/i18n.service.js - Me estoy dando cuenta que el código se acerca a su fin y todavía no he insultado a Elon Cucks... Bueno, ya será en otro proyecto, no vaya a ser que me atropelle con su "render de playstation 1 que se niega a cargar" ahhh coche. PD: Si lo está leyendo cucks, jodete que a mi todavía no me han puesto los cuernos (que yo sepa, a lo mejor soy el cornudo de andalucia. Es broma, a mi lo peor que me han hecho es cambiarme por un caballo. Tal cuá, mi segunda novia Zaida literalmente prefirió pasar más tiempo con su caballo que conmigo. Pero bueno, nos seguimos llevando bien, de vez en cuando hablo con ella.)

import { db } from '../db/index.js';
import { bus } from '../bus/index.js';
import { SUPPORTED_LANGUAGES, DEFAULT_LANG, DEFAULT_MODE } from './config.js';

const STORE_NAME = 'public_store';
const PREFS_KEY = 'app_preferences';

class I18nService {
    constructor() {
        this._currentLang = DEFAULT_LANG;
        this._currentMode = DEFAULT_MODE; // 'a', 'b', o 'c'
        this.dictionaries = {}; // Caché en RAM ultra-rápida
    }

    async init() {
        try {
            const record = await db.get(STORE_NAME, PREFS_KEY);
            if (record && record.data) {
                this._currentLang = record.data.lang || DEFAULT_LANG;
                this._currentMode = record.data.mode || DEFAULT_MODE;
            }
        } catch (error) {
            console.error('[I18N] Error cargando preferencias:', error);
        }
    }

    getPreferences() {
        return { lang: this._currentLang, mode: this._currentMode };
    }

    // =========================================================
    // MOTOR DE TRADUCCIÓN: CARGA Y LÓGICA
    // =========================================================

    /**
     * Carga un diccionario dinámicamente. 
     * Implementa la cascada: Intenta cargar el archivo de modo, si falla, carga el neutro.
     * @param {string} pageName - Nombre del archivo sin extensión (ej: 'menu')
     * @returns {Promise<Object>} Objeto con la función t() inyectada
     */
    async loadPage(pageName) {
        // 1. Caché RAM ultra-rápida (0ms)
        if (this.dictionaries[pageName]) {
            return this.dictionaries[pageName];
        }

        const lang = this._currentLang;
        const mode = this._currentMode;

        // Mapeamos el caracter de modo al sufijo de la carpeta
        let modeSuffix = '';
        if (mode === 'b') modeSuffix = '_zen';
        if (mode === 'c') modeSuffix = '_tsu';

        const basePath = `/src/core/i18n/${lang}/${pageName}.js`;
        const modePath = modeSuffix ? `/src/core/i18n/${lang}${modeSuffix}/${pageName}.js` : basePath;

        let baseData = {};
        let modeData = {};

        // 2. Cargar SIEMPRE el archivo base/neutro primero (Dimensión A)
        try {
            const baseModule = await import(basePath);
            baseData = baseModule.default || {};
        } catch (e) {
            console.warn(`[I18N] ⚠️ Fallo al cargar base: ${basePath}`, e);
        }

        // 3. Cargar el archivo con personalidad (Dimensión B o C) si aplica
        if (modePath !== basePath) {
            try {
                const modeModule = await import(modePath);
                modeData = modeModule.default || {};
            } catch (e) {
                // Si falla el modo, no crasheamos, simplemente usamos el baseData puro
            }
        }

        // MERGE MAGISTRAL: Spread operator. Lo de la derecha (modo) pisa a lo de la izquierda (base)
        const mergedData = { ...baseData, ...modeData };

        // 4. Fabricamos el "Envoltorio" (Wrapper)
        const dictWrapper = {
            data: mergedData,
            t: (key, vars = {}) => {
                let text = dictWrapper.data[key];
                let finalId = key; // Por defecto, el ID es la clave tal cual (ej: add_alert_delete_error)
                
                if (text === undefined) return `[${key}]`;

                if (Array.isArray(text)) {
                    // Si es un array, sacamos el índice exacto para saber qué variante salió
                    const randomIndex = Math.floor(Math.random() * text.length);
                    text = text[randomIndex];
                    finalId = `${key}-${randomIndex}`; // El ID pasa a ser clave-indice (ej: add_bottom_hint-2)
                }

                if (vars && typeof text === 'string') {
                    for (const [vKey, vValue] of Object.entries(vars)) {
                        text = text.replace(new RegExp(`{{${vKey}}}`, 'g'), vValue);
                    }
                }

                // --- CHIVATO SILENCIOSO ---
                // Si el modo actual es 'c' (Tsundere), mandamos a guardar el ID en segundo plano.
                // Al no poner "await", el código sigue de largo y la UI no se congela ni 1 milisegundo.
                if (this._currentMode === 'c') {
                    this._registerTsundereLog(finalId);
                }

                return text;
            }
        };

        // 5. Guardar en caché y retornar
        this.dictionaries[pageName] = dictWrapper;
        return dictWrapper;
    }

    /**
     * Traductor para objetos nativos de la Base de Datos (Dimensión D)
     * Ej: muscle.name -> {"es": "Pecho", "en": "Chest"}
     * @param {Object} dbObject - Objeto con claves de idioma
     * @returns {string} El texto en el idioma actual o fallback
     */
    tData(dbObject) {
        if (!dbObject || typeof dbObject !== 'object') return '';
        
        // Prioridad 1: Idioma actual
        if (dbObject[this._currentLang]) return dbObject[this._currentLang];
        
        // Prioridad 2: Idioma Default
        if (dbObject[DEFAULT_LANG]) return dbObject[DEFAULT_LANG];
        
        // Prioridad 3: Lo primero que pillemos
        return Object.values(dbObject)[0] || '';
    }
    
    // --- NUEVO: MOTOR DE COLECCIÓN TSUNDERE ---
    async _registerTsundereLog(logId) {
        try {
            // 1. Miramos si ya hay una lista guardada en la base de datos
            const record = await db.get(STORE_NAME, 'tsundere_collection');
            const unlocked = (record && record.data) ? record.data : [];

            // 2. Si el insulto ya está en la lista, nos piramos (ahorramos batería y recursos)
            if (unlocked.includes(logId)) return;

            // 3. Si es un insulto nuevo, lo metemos a la lista y guardamos en la DB
            unlocked.push(logId);
            await db.put(STORE_NAME, { id: 'tsundere_collection', data: unlocked });
        } catch (error) {
            console.error('[I18N] Error guardando el insulto en la colección:', error);
        }
    }

    // =========================================================
    // SETTERS & EVENTOS
    // =========================================================

    async setLanguage(langId) {
        this._currentLang = langId;
        
        // SEGURIDAD: Comprobar si el idioma nuevo soporta el modo actual
        const langConfig = SUPPORTED_LANGUAGES.find(l => l.id === langId);
        if (langConfig && !langConfig.type.includes(this._currentMode)) {
            this._currentMode = 'a'; 
        }

        // VACIAR CACHÉ RAM: Al cambiar el idioma, las traducciones cacheadas ya no sirven
        this.dictionaries = {}; 
        await this._saveAndEmit();
    }

    async setMode(modeChar) {
        this._currentMode = modeChar;
        // VACIAR CACHÉ RAM: Al cambiar el modo, hay que recargar los insultos/frases zen
        this.dictionaries = {};
        await this._saveAndEmit();
    }

    async _saveAndEmit() {
        const newData = { lang: this._currentLang, mode: this._currentMode };
        try {
            await db.put(STORE_NAME, { id: PREFS_KEY, data: newData });
            bus.emit('APP_PREFERENCES_UPDATED', newData);
        } catch (error) {
            console.error('[I18N] Error guardando preferencias:', error);
        }
    }
}

export const i18nService = new I18nService();