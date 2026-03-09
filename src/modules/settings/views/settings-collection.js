// src/modules/settings/views/settings-collection.js

import { router } from '../../../core/router/index.js';
import { db } from '../../../core/db/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';
import { TSUNDERE_MANIFEST } from '../../../core/i18n/tsundere-manifest.js';
import { ICONS } from '../../../core/theme/icons.js'; // Asegúrate de tener ICONS.ARROW_LEFT y ARROW_DOWN

export class SettingsCollection extends HTMLElement {
    constructor() {
        super();
        this.unlockedIds = [];
        this.activeTab = 'capa_8'; // Pestaña por defecto (CAPA_8 o app)
        this.currentModuleId = TSUNDERE_MANIFEST[0]?.id || ''; // Primer módulo del manifiesto
        
        this.uiDict = null; // Diccionario para los textos de la interfaz (Atrás, categorías)
        this.moduleDict = null; // Diccionario dinámico del módulo seleccionado
        this.isLoading = true;
    }

    async connectedCallback() {
        // 1. Cargamos el diccionario de settings para traducir la UI y los nombres del Select
        this.uiDict = await i18nService.loadPage('settings/dashboard');

        // 2. Rescatamos los IDs desbloqueados de la base de datos
        try {
            const record = await db.get('public_store', 'tsundere_collection');
            this.unlockedIds = (record && record.data) ? record.data : [];
        } catch (error) {
            console.error('[COLECCIÓN] Error cargando los desbloqueos:', error);
            this.unlockedIds = [];
        }

        // 3. Cargamos los datos del primer módulo por defecto
        await this.loadModuleData(this.currentModuleId);
    }

    async loadModuleData(moduleId) {
        this.isLoading = true;
        this.render(); // Repinta en estado de carga (opcional)

        const moduleConfig = TSUNDERE_MANIFEST.find(m => m.id === moduleId);
        if (moduleConfig) {
            // Cargamos dinámicamente el diccionario de la página seleccionada
            this.moduleDict = await i18nService.loadPage(moduleConfig.dictionaryPath);
        }
        
        this.isLoading = false;
        this.render();
        this._attachListeners();
    }

    render() {
        if (this.isLoading) {
            this.innerHTML = `<div style="color: var(--Verde-acido); padding: 24px;">Cargando Bóveda...</div>`;
            return;
        }

        // --- LÓGICA DE PROCESAMIENTO DE CARTAS Y MARCADOR ---
        let unlockedCount = 0;
        let totalCount = 0;
        let cardsHtml = '';

        const moduleConfig = TSUNDERE_MANIFEST.find(m => m.id === this.currentModuleId);
        const filteredInsults = moduleConfig ? moduleConfig.insults.filter(i => i.tab === this.activeTab) : [];

        filteredInsults.forEach(insult => {
            // Extraemos el valor del diccionario actual
            const dictValue = this.moduleDict.data[insult.key];
            
            // Seguridad: Si la key no existe en el diccionario, la saltamos o mostramos error
            if (!dictValue) return;

            // PATRÓN 3: Lógica para distinguir Arrays de Strings
            if (Array.isArray(dictValue)) {
                dictValue.forEach((text, index) => {
                    totalCount++;
                    const fullId = `${insult.key}-${index}`; // Ej: add_bottom_hint-2
                    const isUnlocked = this.unlockedIds.includes(fullId);
                    if (isUnlocked) unlockedCount++;
                    cardsHtml += this._generateCardHtml(fullId, text, isUnlocked);
                });
            } else {
                totalCount++;
                const isUnlocked = this.unlockedIds.includes(insult.key);
                if (isUnlocked) unlockedCount++;
                cardsHtml += this._generateCardHtml(insult.key, dictValue, isUnlocked);
            }
        });

        // --- RENDERIZADO DEL HTML Y CSS --- Alejandro, acuerdate de arreglar está pedazo de mierda visualmente. En fin, hoy es 5 de marzo, mañana salgo!!!!!
        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    height: 100dvh;
                    background-color: var(--Negro-suave);
                    color: var(--Blanco);
                    overflow: hidden;
                }

                .screen-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                }

                /* HEADER FIJO */
                .header-section {
                    display: flex;
                    align-items: center;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px;
                    border-bottom: 1px solid var(--Blanco);
                }

                .back-btn {
                    background: none;
                    border: none;
                    color: var(--Blanco);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    margin-right: 16px;
                }

                .header-title {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    margin: 0;
                    text-transform: uppercase;
                }

                /* PATRÓN 1: PESTAÑAS (TABS) */
                .tabs-container {
                    display: flex;
                    width: 100%;
                    border-bottom: 1px solid var(--Blanco);
                }

                .tab-btn {
                    flex: 1;
                    background: transparent;
                    color: var(--Blanco);
                    border: none;
                    padding: 16px 0;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    text-transform: uppercase;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: opacity 0.2s;
                }

                .tab-btn.active {
                    opacity: 1;
                    /* Simula el borde activo de tu diseño */
                    box-shadow: inset 0 -2px 0 var(--Blanco); 
                }

                /* PATRÓN 3: MARCADOR GIGANTE */
                .marker-section {
                    display: flex;
                    justify-content: center;
                    align-items: baseline;
                    padding: 32px 0;
                    border-bottom: 1px solid var(--Blanco);
                }

                .main-stat {
                    font-family: 'Clash Display', 'JetBrains Mono', sans-serif;
                    font-size: 96px; /* Tamaño máximo para el desbloqueado */
                    font-weight: 700;
                    color: var(--Verde-acido);
                    line-height: 80%;
                    margin: 0;
                }

                .sub-stat {
                    font-family: 'Clash Display', 'JetBrains Mono', sans-serif;
                    font-size: 48px; /* Tamaño menor para el total */
                    font-weight: 400;
                    color: var(--Blanco);
                    line-height: 80%;
                }

                /* PATRÓN 2: SELECTOR DESPLEGABLE */
                .selector-wrapper {
                    position: relative;
                    width: 100%;
                    border-bottom: 1px solid var(--Blanco);
                }

                .aerko-select {
                    width: 100%;
                    appearance: none;
                    background: transparent;
                    border: none;
                    color: var(--Verde-acido);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    padding: 16px 24px;
                    cursor: pointer;
                    outline: none;
                }

                .select-icon {
                    position: absolute;
                    right: 24px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--Verde-acido);
                    pointer-events: none;
                }

                /* LISTA DE INSULTOS (SCROLL) */
                .cards-list {
                    flex: 1;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .cards-list::-webkit-scrollbar { display: none; }

                .insult-card {
                    padding: 24px;
                    border-bottom: 1px solid var(--Blanco);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .insult-id {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: bold;
                }

                .insult-id.unlocked { color: var(--Verde-acido); }
                .insult-id.locked { color: var(--Blanco); }

                .insult-text {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    color: var(--Blanco);
                    opacity: 0.8;
                    line-height: 140%;
                }
            </style>

            <div class="screen-container">
                <header class="header-section">
                    <button class="back-btn" id="btn-back">
                        ${ICONS.ARROW_LEFT || '←'}
                    </button>
                    <h1 class="header-title">Colección_Insultos</h1>
                </header>

                <div class="tabs-container">
                    <button class="tab-btn ${this.activeTab === 'capa_8' ? 'active' : ''}" data-tab="capa_8">CAPA_8</button>
                    <button class="tab-btn ${this.activeTab === 'app' ? 'active' : ''}" data-tab="app">APP</button>
                </div>

                <div class="marker-section">
                    <span class="main-stat">${unlockedCount}</span>
                    <span class="sub-stat">/${totalCount}</span>
                </div>

                <div class="selector-wrapper">
                    <select id="dictionary-selector" class="aerko-select">
                        ${TSUNDERE_MANIFEST.map(mod => `
                            <option value="${mod.id}" ${mod.id === this.currentModuleId ? 'selected' : ''}>
                                ${this.uiDict ? this.uiDict.t(mod.labelKey) : mod.labelKey}
                            </option>
                        `).join('')}
                    </select>
                    <div class="select-icon">${ICONS.ARROW_DOWN || '▼'}</div>
                </div>

                <div class="cards-list">
                    ${cardsHtml || '<div class="insult-card"><span class="insult-text">No hay registros en esta categoría.</span></div>'}
                </div>
            </div>
        `;
    }

    _generateCardHtml(id, text, isUnlocked) {
        return `
            <div class="insult-card">
                <span class="insult-id ${isUnlocked ? 'unlocked' : 'locked'}">
                    ${id}
                </span>
                <span class="insult-text">
                    ${isUnlocked ? text : '¿?'}
                </span>
            </div>
        `;
    }

    _attachListeners() {
        // Evento: Botón Atrás
        const btnBack = this.querySelector('#btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                // Asumo que usas history, si usas router pon router.navigate('/settings')
                window.history.back(); 
            });
        }

        // Evento: Pestañas (Capa 8 / App)
        const tabBtns = this.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                if (this.activeTab !== targetTab) {
                    this.activeTab = targetTab;
                    this.render(); 
                    this._attachListeners(); 
                }
            });
        });

        // Evento: Selector de Módulo
        const selector = this.querySelector('#dictionary-selector');
        if (selector) {
            selector.addEventListener('change', (e) => {
                this.currentModuleId = e.target.value;
                this.loadModuleData(this.currentModuleId); // Esto dispara re-render solo cuando carga
            });
        }
    }
}

// Registrar el componente
if (!customElements.get('settings-collection')) {
    customElements.define('settings-collection', SettingsCollection);
}