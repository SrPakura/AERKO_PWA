// src/modules/training_analysis/views/analysis-results.js

import { router } from '../../../core/router/index.js';
import { analysisService } from '../../training_core/services/analysis.service.js';
import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AnalysisResults extends HTMLElement {
    constructor() {
        super();
        this.report = null;
        this.isLoading = true;
        this.activeTab = 'volumen'; // 'volumen' o 'desequilibrios'
        this.dateString = "";
    }

    async connectedCallback() {
    // 1. PRIMERO cargamos el diccionario (esperamos a que termine)
    this.i18n = await i18nService.loadPage('training_analysis/analysis-results');
    
    // 2. AHORA SÍ, pintamos la pantalla de carga porque ya tenemos 'this.i18n'
    this.renderLoading();
        
        // 1. Calculamos los últimos 7 días y montamos el título dinámico (Ej: 9-15_01_2026)
        const end = new Date();
        const start = new Date(end.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        const startDay = start.getDate();
        const endDay = end.getDate();
        const month = String(end.getMonth() + 1).padStart(2, '0');
        const year = end.getFullYear();
        
        this.dateString = this.i18n.t('res_header_title', { 
    startDay: startDay, 
    endDay: endDay, 
    month: month, 
    year: year 
});

        // 2. Pedimos los datos al motor
        try {
            this.report = await analysisService.calculateWeeklyVolume(start.getTime(), end.getTime());
            this.isLoading = false;
            this.render();
            this._attachListeners();
        } catch (error) {
            console.error("Error al generar resultados:", error);
            this.isLoading = false;
            this.renderError();
        }
    }

    renderLoading() {
        this.innerHTML = `
            <div style="display:flex; height:100dvh; width:100%; justify-content:center; align-items:center; background:var(--Negro-suave); color:var(--Verde-acido); font-family:'JetBrains Mono';">
                ${this.i18n.t('res_loading')}
            </div>
        `;
    }

    renderError() {
        this.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:24px; height:100dvh; width:100%; justify-content:center; align-items:center; background:var(--Negro-suave); color:white; font-family:'JetBrains Mono'; padding:24px; text-align:center;">
                <span>${this.i18n.t('res_error_desc')}</span>
                <button onclick="window.history.back()" style="padding:12px; background:var(--Verde-acido); border:none; font-family:'JetBrains Mono'; font-weight:bold; cursor:pointer;">${this.i18n.t('res_error_btn')}</button>
            </div>
        `;
    }

    // --- MÉTODOS DE RENDERIZADO POR PESTAÑAS ---

    _renderVolumenTab() {
       if (!this.report) return `<div class="empty-state">${this.i18n.t('res_empty_vol')}</div>`;

        // Juntamos todos los músculos analizados (los que están bien y los que están mal)
        const allMuscles = [...this.report.optimal, ...this.report.alerts];
        
        // Mapeo de colores según el status que escupe el analysisService
        const getStyleForStatus = (status) => {
            switch(status) {
                case 'GREY': return 'background: #333333; color: var(--Blanco); border-color: #333333;'; // MV
                case 'LIGHT_GREEN': return 'background: #4A90E2; color: var(--Blanco); border-color: #4A90E2;'; // MEV
                case 'ACID_GREEN': return 'background: var(--Verde-acido); color: var(--Negro-suave); border-color: var(--Verde-acido);'; // MAV
                case 'RED': return 'background: #FF7E4F; color: var(--Negro-suave); border-color: #FF7E4F;'; // MRV
                default: return 'background: transparent; color: var(--Blanco); border-color: var(--Blanco);';
            }
        };

        const listHtml = allMuscles.map(item => `
            <div class="muscle-box" style="${getStyleForStatus(item.status)}">
                ${item.muscleName}
            </div>
        `).join('');

        return `
            <div class="legend-grid">
                <div class="legend-box" style="background:#333333; color:white;">MV</div>
                <div class="legend-box" style="background:#4A90E2; color:white;">MEV</div>
                <div class="legend-box" style="background:var(--Verde-acido); color:var(--Negro-suave);">MAV</div>
                <div class="legend-box" style="background:#FF7E4F; color:var(--Negro-suave);">MRV</div>
            </div>
            <div class="muscle-list">
                ${listHtml}
            </div>
        `;
    }

    _renderDesequilibriosTab() {
    // Si no hay datos, mostramos el mensaje de vacío
    if (!this.report || !this.report.alerts || this.report.alerts.length === 0) {
        return `<div class="empty-state">${this.i18n.t('deseq_empty')}</div>`;
    }

    // Arrancamos el HTML con el texto introductorio (aquí va tu insulto Tsundere)
    let html = `<div class="desequilibrios-container">
                    <span class="deseq-text">${this.i18n.t('deseq_intro')}</span>
                    <ul style="color: var(--Blanco); font-family: 'JetBrains Mono'; font-size: 14px; line-height: 150%;">`;

    // Recorremos los músculos que tienen alertas
    this.report.alerts.forEach(muscle => {
        if (muscle.headAlerts && muscle.headAlerts.length > 0) {
            
            muscle.headAlerts.forEach(alert => {
                // Decidimos la clave del diccionario según el tipo
                const i18nKey = alert.type === 'under' ? 'deseq_item_under' : 'deseq_item_over';
                
                // Pedimos la traducción inyectándole las variables para que reemplace los {{}}
                const translatedText = this.i18n.t(i18nKey, {
                    headName: alert.name,
                    real: alert.real,
                    ideal: alert.ideal
                });

                // Lo metemos como un puntito de la lista (viñeta)
                html += `<li style="margin-bottom: 8px;">${translatedText}</li>`;
            });
        }
    });

    html += `</ul></div>`;
    return html;
}

    render() {
        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    min-height: 100dvh;
                    background-color: var(--Negro-suave);
                    color: var(--Blanco);
                }

                .screen-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 480px;
                    min-height: 100dvh;
                    margin: 0 auto;
                }

                /* 1. HEADER REUTILIZABLE */
                .header-bar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: calc(env(safe-area-inset-top) + 16px) 24px 16px 24px;
                    flex-shrink: 0;
                }
                
                .back-btn {
                    background: none;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    color: var(--Blanco);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                }

                .back-btn svg {
                    width: 100%;
                    height: 100%;
                    fill: currentColor;
                }

                .screen-title {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--Blanco);
                }

                /* 2. SELECTOR DE TABS */
                .tabs-container {
                    display: flex;
                    width: 100%;
                    border-bottom: 1px solid var(--Blanco);
                    border-top: 1px solid var(--Blanco);
                }

                .tab-btn {
                    flex: 1;
                    padding: 16px 0;
                    background: transparent;
                    border: none;
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    cursor: pointer;
                    text-align: center;
                    transition: background 0.2s, color 0.2s;
                }

                .tab-btn.active {
                    background: var(--Blanco);
                    color: var(--Negro-suave);
                    font-weight: 700;
                }

                /* 3. CONTENIDO DE LA PESTAÑA */
                .tab-content {
                    padding: 24px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                /* LEYENDA (Volumen) */
                .legend-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    border: 1px solid var(--Blanco);
                }

                .legend-box {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 12px 4px;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 12px;
                    font-weight: 700;
                    border-right: 1px solid var(--Blanco);
                }
                .legend-box:last-child { border-right: none; }

                /* LISTA DE MÚSCULOS (Volumen) */
                .muscle-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .muscle-box {
                    display: flex;
                    padding: 16px;
                    justify-content: center;
                    align-items: center;
                    border: 1px solid; /* El color se inyecta por JS */
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    font-weight: 500;
                }

                /* TEXTOS DESEQUILIBRIOS */
                .desequilibrios-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .deseq-text {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    line-height: 150%;
                    color: var(--Blanco);
                }

                .empty-state {
                    font-family: "JetBrains Mono", monospace;
                    text-align: center;
                    opacity: 0.5;
                    margin-top: 40px;
                }
            </style>

            <div class="screen-container">
                <header class="header-bar">
                    <button class="back-btn" id="btn-back">
                        ${ICONS.ARROW_LEFT}
                    </button>
                    <span class="screen-title">${this.dateString}</span>
                </header>

                <div class="tabs-container">
                    <button class="tab-btn ${this.activeTab === 'volumen' ? 'active' : ''}" data-tab="volumen">${this.i18n.t('res_tab_vol')}</button>
<button class="tab-btn ${this.activeTab === 'desequilibrios' ? 'active' : ''}" data-tab="desequilibrios">${this.i18n.t('res_tab_deseq')}</button>
                </div>

                <div class="tab-content" id="tab-content">
                    ${this.activeTab === 'volumen' ? this._renderVolumenTab() : this._renderDesequilibriosTab()}
                </div>
            </div>
        `;
    }

    _attachListeners() {
        // 1. Botón Atrás
        const btnBack = this.querySelector('#btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                history.back(); // Vuelve a la pantalla de aviso
            });
        }

        // 2. Cambio de Pestañas
        const tabBtns = this.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                if (this.activeTab !== targetTab) {
                    this.activeTab = targetTab;
                    this.render(); // Repintamos con la nueva pestaña activa
                    this._attachListeners(); // Re-enganchamos listeners porque render() destruye el DOM
                }
            });
        });
    }
}

customElements.define('training-analysis-results', AnalysisResults);