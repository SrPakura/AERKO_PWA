// src/modules/settings/views/mode-selector.js

import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';
import { SUPPORTED_LANGUAGES, MODES_INFO } from '../../../core/i18n/config.js';
import '../../system/components/btn.js';

export class SettingsModeSelector extends HTMLElement {
    constructor() {
        super();
        this.prefs = i18nService.getPreferences();
        this.selectedModeChar = this.prefs.mode;
        this.dict = null; // Preparamos la variable
        
        // Obtenemos qué modos soporta el idioma actual
        const currentLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === this.prefs.lang);
        this.availableModes = currentLangConfig ? currentLangConfig.type : 'a';
    }

    // AÑADIDO: Hacemos la función async y cargamos el diccionario
    async connectedCallback() {
        this.dict = await i18nService.loadPage('system/config');
        this.render();
        this.addListeners();
    }

    render() {
        // Barrera de seguridad
        if (!this.dict) return;

        const isAlreadyActive = this.selectedModeChar === this.prefs.mode;
        const currentInfo = MODES_INFO[this.selectedModeChar];

        // Determinar estilo del botón (Verde si es nuevo, Blanco si ya está activo)
        const btnVariant = isAlreadyActive ? 'secondary' : 'primary';
        
        // Determinar qué llave usar para traducir el label del botón
        const btnLabelKey = isAlreadyActive ? 'btn_already_selected' : 'btn_save';

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                .settings-screen {
                    display: flex; flex-direction: column; width: 100%; height: 100dvh; background: var(--Negro-suave);
                }

                .content-scroll {
                    flex: 1; display: flex; flex-direction: column; padding: 24px 0 0 0; 
                    overflow-y: auto; scrollbar-width: none;
                    border-bottom: 1px solid var(--Blanco);
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                .desc-container {
                    padding: 0 24px 48px 24px;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    line-height: 150%;
                    white-space: pre-wrap; 
                }

                .modes-list {
                    display: flex; flex-direction: column; width: 100%;
                    border-top: 1px solid var(--Blanco);
                    margin-top: auto; 
                }

                .mode-row {
                    padding: 24px; text-align: center; cursor: pointer;
                    border-bottom: 1px solid var(--Blanco);
                    font-family: 'JetBrains Mono', monospace; font-size: 16px; color: var(--Blanco);
                    transition: background 0.2s ease;
                }
                .mode-row.active {
                    color: var(--Verde-acido);
                }
                .mode-row:hover { background: rgba(255,255,255,0.05); }

                .footer-section {
                    background: var(--Negro-suave); padding: 0 24px 24px 24px; flex-shrink: 0;
                }
                .spacer-24 { height: 24px; }
            </style>

            <div class="settings-screen">
                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('mode_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    <div class="desc-container">${this.dict.t(currentInfo.descKey)}</div>
                    
                    <div class="modes-list">
                        ${this.availableModes.includes('b') ? `<div class="mode-row ${this.selectedModeChar === 'b' ? 'active' : ''}" data-char="b">${this.dict.t(MODES_INFO['b'].labelKey)}</div>` : ''}
                        ${this.availableModes.includes('a') ? `<div class="mode-row ${this.selectedModeChar === 'a' ? 'active' : ''}" data-char="a">${this.dict.t(MODES_INFO['a'].labelKey)}</div>` : ''}
                        ${this.availableModes.includes('c') ? `<div class="mode-row ${this.selectedModeChar === 'c' ? 'active' : ''}" data-char="c">${this.dict.t(MODES_INFO['c'].labelKey)}</div>` : ''}
                    </div>
                </main>

                <section class="footer-section">
                    <div class="spacer-24"></div>
                    <app-btn variant="${btnVariant}" label="${this.dict.t(btnLabelKey)}" id="btn-save" style="width: 100%; display: block;" ${isAlreadyActive ? 'disabled' : ''}></app-btn>
                </section>
            </div>
        `;
    }

    addListeners() {
        this.querySelector('#btn-back').addEventListener('click', () => window.history.back());

        this.querySelectorAll('.mode-row').forEach(row => {
            row.addEventListener('click', () => {
                this.selectedModeChar = row.dataset.char;
                this.render(); 
                this.addListeners();
            });
        });

        this.querySelector('#btn-save').addEventListener('click', async () => {
            if (this.selectedModeChar !== this.prefs.mode) {
                await i18nService.setMode(this.selectedModeChar);
                window.history.back();
            }
        });
    }
}
customElements.define('settings-mode-selector', SettingsModeSelector);