// src/modules/training_analysis/views/analysis-dashboard.js

import { router } from '../../../core/router/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Importamos componentes del sistema
import '../../system/components/btn.js';
import '../../system/components/navbar.js';

export class AnalysisDashboard extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback() {
    // Cargamos el diccionario de esta pantalla
    this.i18n = await i18nService.loadPage('training_analysis/analysis-dashboard');
    
    this.render();
    this._attachListeners();
}

    render() {
        // Icono de información "i"
        const infoIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
        `;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    height: 100dvh;
                    background-color: var(--Negro-suave);
                    overflow: hidden; /* Fundamental: Prohibido el scroll aquí */
                }

                .screen-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100dvh;
                    max-width: 480px;
                    margin: 0 auto;
                    overflow: hidden;
                }

                /* 1. HEADER TITLE */
                .header-title {
                    font-family: "Clash Display", sans-serif;
                    font-size: 32px;
                    font-weight: 800;
                    color: var(--Verde-acido);
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 16px 24px;
                    border-bottom: 1px solid var(--Blanco);
                    flex-shrink: 0;
                }

                /* 2. CONTENIDO PRINCIPAL */
                .content-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .content-section::-webkit-scrollbar { display: none; }

                /* 3. INFO CARD (ESTILO BRUTALISTA) */
                .info-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 24px;
                    padding: 24px 24px;
                    border: 1px solid var(--Blanco);
                }

                .info-icon {
                    color: var(--Blanco);
                }

                .info-text-group {
                    display: flex;
                    flex-direction: column;
                    gap: 24px; /* Separación entre párrafos */
                }

                .info-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    font-weight: 400;
                    line-height: 150%;
                }

                /* 4. FOOTER (BOTÓN) */
                .action-section {
                    flex-shrink: 0;
                    padding: 0 24px 24px 24px; /* Padding bottom asumiendo que el nav está abajo */
                }
            </style>

            <div class="screen-container">
                
                <header class="header-title">
                    ${this.i18n.t('dash_header_title')}
                </header>

                <main class="content-section">
                    
                    <div class="info-card" id="state-warning">
                        <div class="info-icon">${infoIcon}</div>
                        
                        <div class="info-text-group">
    <span class="info-text">${this.i18n.t('dash_info_1')}</span>
    <span class="info-text">${this.i18n.t('dash_info_2')}</span>
    <span class="info-text">${this.i18n.t('dash_info_3')}</span>
</div>
                    </div>

                </main>

                <footer class="action-section">
    <app-btn id="btn-analyze" label="${this.i18n.t('dash_btn_analyze')}" variant="primary"></app-btn>
</footer>
                
                <div class="footer-section">
                    <app-nav></app-nav>
                </div>

            </div>
        `;
    }

    _attachListeners() {
        const btnAnalyze = this.querySelector('#btn-analyze');
        
        btnAnalyze.addEventListener('click', () => {
            // El botón ahora solo navega a la pantalla de resultados
            router.navigate('/training/analysis/results');
        });
    }
}

customElements.define('training-analysis-dashboard', AnalysisDashboard);