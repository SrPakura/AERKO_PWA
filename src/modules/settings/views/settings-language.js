// src/modules/settings/views/settings-language.js

import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';
import { SUPPORTED_LANGUAGES } from '../../../core/i18n/config.js';
import '../../system/components/btn.js';

export class SettingsLanguage extends HTMLElement {
    constructor() {
        super();
        this.prefs = i18nService.getPreferences();
        this.selectedLang = this.prefs.lang;
        this.dict = null; // Preparamos la variable para el diccionario
    }

    async connectedCallback() {
        // Aprovechamos que ya cargábamos system/config para traducir los nombres de los idiomas
        this.dict = await i18nService.loadPage('system/config');
        this.render();
        this.addListeners();
    }

    render() {
        // Barrera de seguridad
        if (!this.dict) return;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                .settings-screen {
                    display: flex; flex-direction: column; width: 100%; height: 100dvh; background: var(--Negro-suave);
                }

                .content-scroll {
                    flex: 1; display: flex; flex-direction: column; padding: 24px; gap: 24px;
                    overflow-y: auto; scrollbar-width: none;
                    border-bottom: 1px solid var(--Blanco);
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                .footer-section {
                    background: var(--Negro-suave); padding: 0 24px 24px 24px; flex-shrink: 0;
                }
                .spacer-24 { height: 24px; }

                /* CARTA DE IDIOMA (Diseño de captura) */
                .lang-card {
                    display: flex; flex-direction: column; width: 100%;
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .lang-card.active { border-color: var(--Verde-acido); }

                .lang-header {
                    padding: 16px; font-family: 'JetBrains Mono', monospace; font-size: 16px; color: var(--Blanco);
                }
                .lang-card.active .lang-header { color: var(--Verde-acido); }

                .lang-modes {
                    display: flex; border-top: 1px solid var(--Blanco);
                }
                .lang-card.active .lang-modes { border-top-color: var(--Verde-acido); }

                .mode-badge {
                    flex: 1; padding: 12px; text-align: center;
                    font-family: 'JetBrains Mono', monospace; font-size: 14px; color: var(--Blanco);
                    border-right: 1px solid var(--Blanco);
                }
                .lang-card.active .mode-badge { border-right-color: var(--Verde-acido); }
                .mode-badge:last-child { border-right: none; }
                
                /* Elimino la clase .disabled porque ya no la usaremos, si no lo tiene, no se pinta */
            </style>

            <div class="settings-screen">
                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('lang_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    ${SUPPORTED_LANGUAGES.map(lang => {
                        const isActive = lang.id === this.selectedLang;
                        const hasZen = lang.type.includes('b');
                        const hasTsu = lang.type.includes('c');
                        
                        return `
                        <div class="lang-card ${isActive ? 'active' : ''}" data-id="${lang.id}">
                            <div class="lang-header">${this.dict.t(lang.nameKey)}</div>
                            <div class="lang-modes">
                                <div class="mode-badge">${this.dict.t('mode_default_label')}</div>
                                ${hasZen ? `<div class="mode-badge">${this.dict.t('lang_badge_zen')}</div>` : ''}
                                ${hasTsu ? `<div class="mode-badge">${this.dict.t('lang_badge_tsu')}</div>` : ''}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </main>

                <section class="footer-section">
                    <div class="spacer-24"></div>
                    <app-btn variant="primary" label="${this.dict.t('btn_save')}" id="btn-save" style="width: 100%; display: block;"></app-btn>
                </section>
            </div>
        `;
    }

    addListeners() {
        this.querySelector('#btn-back').addEventListener('click', () => window.history.back());

        this.querySelectorAll('.lang-card').forEach(card => {
            card.addEventListener('click', () => {
                this.selectedLang = card.dataset.id;
                this.render(); 
                this.addListeners(); 
            });
        });

        this.querySelector('#btn-save').addEventListener('click', async () => {
            await i18nService.setLanguage(this.selectedLang);
            window.history.back();
        });
    }
}
customElements.define('settings-language', SettingsLanguage);