// src/modules/training_strength/views/calculator.js

import { router } from '../../../core/router/index.js';
import { oneRmService } from '../../training_core/services/1rm.service.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // INYECCIÓN I18N

// Importamos componentes
import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js';
import '../../system/components/keypad-modal.js';
import '../../system/components/navbar.js';
import '../../system/components/unit-toggle.js';

export class TrainingStrengthCalculator extends HTMLElement {
    constructor() {
        super();
        this.weight = 80;
        this.reps = 1;
        this.unit = 'KG';
        this.results = oneRmService.generateRMTable(this.weight, this.reps);
        this.dict = null; // Guardará nuestro diccionario
    }

    async connectedCallback() {
        // Carga asíncrona del diccionario ANTES de renderizar
        this.dict = await i18nService.loadPage('training_strength/calculator');
        
        this.render();
        this._attachListeners();
        this._updateResultsUI();
    }

    render() {
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
                    height: 100dvh;
                    max-width: 480px;
                    margin: 0 auto;
                }

                /* 1. HEADER EXPANDIDO (Título + Panel dentro) */
                .header-section {
                    display: flex;
                    flex-direction: column; /* Apilamos Título y Panel */
                    gap: 16px;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px;
                    border-bottom: 1px solid var(--Blanco);
                    /* La línea separadora que pedías */
                    background: var(--Negro-suave);
                    flex-shrink: 0;
                    z-index: 10;
                }

                .screen-title {
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 32px;
                    font-weight: 700;
                    line-height: 100%;
                    margin: 0;
                    text-transform: uppercase;
                }

                /* Panel de resultados (Ahora dentro del Header) */
                .result-panel {
                    display: flex;
                    border: 1px solid var(--Blanco);
                    background: var(--Negro-suave);
                }

                /* Izquierda: 1RM Principal */
                .rm-main {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 16px 24px;
                    /* border-right REMOVIDO según instrucciones */
                    min-width: 100px;
                }

                .rm-label-main {
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    line-height: 100%;
                    margin-bottom: 4px;
                }

                .rm-value-main {
                    color: var(--Blanco);
                    font-family: "Clash Display", sans-serif;
                    font-size: 32px;
                    font-weight: 700;
                    line-height: 100%;
                    white-space: nowrap;
                }

                /* Derecha: Grid sin bordes internos */
                .rm-grid {
                    flex: 1;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    padding: 12px 16px;
                    gap: 4px 16px;
                    align-content: center;
                    border-left: 1px solid rgba(255,255,255,0.2);
                    /* Opcional: Separador sutil vertical solo si quieres separar el grid del 1RM, si no, quítalo */
                }

                .rm-item {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 13px;
                    color: var(--Blanco);
                    white-space: nowrap;
                    display: flex;
                    justify-content: space-between;
                    /* Alineación limpia */
                }

                .rm-item span {
                    color: var(--Verde-acido);
                }

                /* 2. MAIN "SPACE-BETWEEN" */
                .content-scroll {
                    flex: 1;
                    /* Ocupa todo el alto disponible */
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                /* Inputs arriba */
                .form-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .value-text {
                    flex: 1;
                    font-size: 16px;
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                }

                /* Botón "Empujado" al fondo */
                .action-wrapper-bottom {
                    margin-top: auto;
                    /* <--- ESTA ES LA CLAVE DEL "MAX GAP" */
                    padding-top: 32px;
                    /* Un poco de aire mínimo por si acaso */
                }

                /* 3. FOOTER (Solo Navbar) */
                .footer-section {
                    flex-shrink: 0;
                    background: var(--Negro-suave);
                }
            </style>

            <app-keypad-modal id="modal-keypad"></app-keypad-modal>

            <div class="screen-container">
                
                <header class="header-section">
                    <h1 class="screen-title">${this.dict.t('title_calc_1rm')}</h1>
                    
                    <div class="result-panel">
                        <div class="rm-main">
                            <span class="rm-label-main">${this.dict.t('label_1rm_main')}</span>
                            <span class="rm-value-main" id="ui-1rm-val">
                                ${this.weight}<span style="font-size:0.6em; margin-left:4px">${this.unit}</span>
                            </span>
                        </div>
                        <div class="rm-grid" id="ui-rm-grid">
                            </div>
                    </div>
                </header>

                <main class="content-scroll">
                    
                    <div class="form-stack">
                        <app-input-card label="${this.dict.t('label_weight')}">
                            <app-box id="box-weight" clickable>
                                <span id="val-weight" class="value-text">${this.weight}</span>
                                <app-unit-toggle id="unit-toggle" options="KG, LB, ST" value="${this.unit}"></app-unit-toggle>
                            </app-box>
                        </app-input-card>

                        <app-input-card label="${this.dict.t('label_reps')}">
                            <app-box id="box-reps" clickable>
                                <span id="val-reps" class="value-text">${this.reps}</span>
                            </app-box>
                        </app-input-card>
                    </div>

                    <div class="action-wrapper-bottom">
                        <app-btn id="btn-calc" label="${this.dict.t('btn_calculate')}" variant="primary"></app-btn>
                    </div>

                </main>

                <footer class="footer-section">
                    <app-nav></app-nav>
                </footer>

            </div>
        `;
    }

    _attachListeners() {
        const modal = this.querySelector('#modal-keypad');
        this.querySelector('#box-weight').addEventListener('click', async () => {
            const result = await modal.open(
                this.dict.t('modal_weight'), this.weight, 'dynamic', this.unit, 'KG, LB, ST',
                (newUnit) => {
                    // 1. Cuando cambian la unidad DENTRO del modal:
                    // Convertimos el peso "al vuelo" para que la UI principal se mantenga sincronizada
                    const toggle = this.querySelector('#unit-toggle');
                    if (toggle) toggle.setAttribute('value', newUnit);
                    
                    // Asumimos que this.weight siempre está en la "vieja" unidad en este punto
                    // Lo pasamos a métrico puro, y de ahí a la nueva unidad.
                    const baseWeight = unitService.toBase(this.weight, this.unit);
                    this.weight = unitService.toDisplay(baseWeight, newUnit);
                    this.unit = newUnit;
                    
                    // Actualizamos el número visual del cajón de peso
                    this.querySelector('#val-weight').innerText = this.weight;
                }
            );
            // 2. Cuando el modal se cierra con un valor:
            if (result) {
                this.weight = parseFloat(result.value);
                this.unit = result.unit;
                
                this.querySelector('#val-weight').innerText = this.weight;
                const toggle = this.querySelector('#unit-toggle');
                if (toggle) toggle.setAttribute('value', this.unit);
            }
        });

        this.querySelector('#box-reps').addEventListener('click', async () => {
            const result = await modal.open(this.dict.t('modal_reps'), this.reps, 'numeric');
            if (result) {
                this.reps = parseInt(result.value) || 1;
                this.querySelector('#val-reps').innerText = this.reps;
            }
        });

        this.querySelector('#btn-calc').addEventListener('click', () => {
            // El servicio genera la tabla basándose en el número crudo que le pasemos.
            // Si this.weight es LB, la tabla ya saldrá calculada para LB.
            this.results = oneRmService.generateRMTable(this.weight, this.reps);
            this._updateResultsUI();
            
            // Feedback visual sutil
            const panel = this.querySelector('.result-panel');
            panel.style.opacity = '0.7';
            setTimeout(() => panel.style.opacity = '1', 150);
        });
    }

    _updateResultsUI() {
        // Pintamos el 1RM Principal
        this.querySelector('#ui-1rm-val').innerHTML = 
            `${this.results['1RM']}<span style="font-size:0.6em; margin-left:4px;">${this.unit}</span>`;
            
        // Pintamos el Grid de repeticiones secundarias
        const gridContainer = this.querySelector('#ui-rm-grid');
        let gridHtml = '';
        for (let i = 2; i <= 7; i++) {
            gridHtml += `
                <div class="rm-item">
                    <span>${i}RM:</span> ${this.results[`${i}RM`]}
                </div>
            `;
        }
        gridContainer.innerHTML = gridHtml;
    }
}

customElements.define('training-strength-calculator', TrainingStrengthCalculator);