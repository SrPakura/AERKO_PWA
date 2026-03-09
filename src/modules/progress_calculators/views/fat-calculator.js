// src/modules/progress_calculators/views/fat-calculator.js

import { router } from '../../../core/router/index.js';
import { progressStore } from '../../progress_core/store/index.js';
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Importamos componentes
import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js';
import '../../system/components/keypad-modal.js';
import '../../system/components/navbar.js';
import '../../system/components/unit-toggle.js';

export class ProgressFatCalculator extends HTMLElement {
    constructor() {
        super();
        
        // --- ESTADO INICIAL ---
        this.age = null; 
        this.gender = null; 
        
        // Estructura idéntica al store de pliegues
        this.folds = {
            pectoral: '',
            abdominal: '',
            quadriceps_fold: '',
            suprailiac: '',
            triceps_fold: '',
            subscapular: '',
            midaxillary: ''
        };

        this.usedFormula = ''; 
        this.foldLabels = {};

        this.foldLabels = {
            pectoral: 'Pectoral',
            abdominal: 'Abdominal',
            quadriceps_fold: 'Cuádriceps',
            suprailiac: 'Suprailíaco',
            triceps_fold: 'Tríceps',
            subscapular: 'Subescapular',
            midaxillary: 'Axilar_Medio'
        };
    }

    async connectedCallback() {
        // 1. Cargar traducciones
    this.dict = await i18nService.loadPage('progress_calculators/fat-calculator');
    
    // 2. Asignar valores iniciales ahora que tenemos diccionario
    this.usedFormula = this.dict.t('calc_formula_none');
    this.foldLabels = {
        pectoral: this.dict.t('fold_pectoral'),
        abdominal: this.dict.t('fold_abdominal'),
        quadriceps_fold: this.dict.t('fold_quadriceps'),
        suprailiac: this.dict.t('fold_suprailiac'),
        triceps_fold: this.dict.t('fold_triceps'),
        subscapular: this.dict.t('fold_subscapular'),
        midaxillary: this.dict.t('fold_midaxillary')
    };
    
        await this._loadUserData();
        this._loadFromDraft();
        this.render();
        this._attachListeners();
        this._updateResultsUI();
    }

    // 1. OBTENER DATOS TRANSVERSALES (Edad y Sexo desde el User Service)
    async _loadUserData() {
        const profile = userService.getProfile();
        if (profile.age) this.age = profile.age;
        if (profile.gender) this.gender = profile.gender;
    }

    // 2. CARGAR PLIEGUES DESDE EL BORRADOR
    _loadFromDraft() {
        const draft = progressStore.getDraft();
        
        Object.keys(this.folds).forEach(key => {
            if (draft[key] && draft[key].value !== "") {
                this.folds[key] = draft[key].value;
            }
        });

        if (draft.fat && draft.fat.value !== "") {
            this.resultFat = parseFloat(draft.fat.value);
        }
    }

    render() {
        // ¿Faltan datos vitales? Mostramos los inputs condicionales
        const needsProfileData = !this.age || !this.gender;

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

                /* HEADER (Estilo 1RM) */
                .header-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px;
                    border-bottom: 1px solid var(--Blanco);
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

                /* Panel de resultados */
                .result-panel {
                    display: flex;
                    border: 1px solid var(--Blanco);
                    background: var(--Negro-suave);
                }

                .rm-main {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 16px 24px;
                    min-width: 120px;
                    border-right: 1px solid rgba(255,255,255,0.2);
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

                /* Disclaimer */
                .disclaimer-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    padding: 12px 16px;
                }

                .disclaimer-text {
                    font-family: "JetBrains Mono", monospace;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.7);
                    line-height: 150%;
                }

                .formula-tag {
                    color: var(--Verde-acido);
                    font-weight: bold;
                    display: block;
                    margin-top: 4px;
                }

                /* SCROLL PRINCIPAL */
                .content-scroll {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow-y: auto;
                    scrollbar-width: none;
                }
                .content-scroll::-webkit-scrollbar { display: none; }

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

                .placeholder-text {
                    opacity: 0.3; /* Estado vacío */
                }

                .split-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .action-wrapper-bottom {
                    margin-top: auto;
                    padding-top: 32px;
                }

                /* Mensaje de alerta suave si faltan datos */
                .alert-msg {
                    color: #FF7E4F;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .footer-section {
                    flex-shrink: 0;
                    background: var(--Negro-suave);
                }
            </style>

            <app-keypad-modal id="modal-keypad"></app-keypad-modal>

            <div class="screen-container">
                
                <header class="header-section">
                    <h1 class="screen-title">${this.dict.t('calc_title')}</h1>
                    
                    <div class="result-panel">
                        <div class="rm-main">
                            <span class="rm-label-main">${this.dict.t('calc_lbl_fat')}</span>
                            <span class="rm-value-main" id="ui-fat-val">
                                ${this.resultFat > 0 ? this.resultFat : '--'}<span style="font-size:0.6em; margin-left:4px">%</span>
                            </span>
                        </div>
                        <div class="disclaimer-container">
                            <span class="disclaimer-text">
                                ${this.dict.t('calc_disclaimer')}
                                <span class="formula-tag" id="ui-formula-val">${this.dict.t('calc_lbl_algorithm')} ${this.usedFormula}</span>
                            </span>
                        </div>
                    </div>
                </header>

                <main class="content-scroll">
                    <div class="form-stack">
                        
                        ${needsProfileData ? `
                            <div class="alert-msg">${this.dict.t('calc_alert_missing')}</div>
                            <div class="split-row">
                                <app-input-card label="${this.dict.t('calc_lbl_age')}">
                                    <app-box id="box-age" clickable>
                                        <span id="val-age" class="value-text ${this.age ? '' : 'placeholder-text'}">${this.age || '25'}</span>
                                    </app-box>
                                </app-input-card>
                                <app-input-card label="${this.dict.t('calc_lbl_gender')}">
                                    <app-box id="box-gender" clickable>
                                        <span id="val-gender" class="value-text ${this.gender ? '' : 'placeholder-text'}">
                                            ${this.gender === 'M' ? this.dict.t('calc_gender_m') : (this.gender === 'F' ? this.dict.t('calc_gender_f') : this.dict.t('calc_gender_none'))}
                                        </span>
                                    </app-box>
                                </app-input-card>
                            </div>
                        ` : ''}

                        ${Object.keys(this.folds).map(key => `
                            <app-input-card label="${this.foldLabels[key]} (mm)">
                                <app-box id="box-${key}" clickable>
                                    <span id="val-${key}" class="value-text ${this.folds[key] === '' ? 'placeholder-text' : ''}">
                                        ${this.folds[key] !== '' ? this.folds[key] : '0'}
                                    </span>
                                </app-box>
                            </app-input-card>
                        `).join('')}

                    </div>

                    <div class="action-wrapper-bottom">
                        <app-btn id="btn-calc" label="${this.dict.t('calc_btn_save')}" variant="primary"></app-btn>
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

        // Listeners para los datos del perfil (si están visibles)
        this.querySelector('#box-age')?.addEventListener('click', async () => {
            const current = this.age || 25;
            const result = await modal.open(this.dict.t('calc_lbl_age'), current, 'numeric');
            if (result && result.value) {
                this.age = parseInt(result.value);
                const span = this.querySelector('#val-age');
                span.innerText = this.age;
                span.classList.remove('placeholder-text');
                
                // Guardar en el perfil global silenciosamente
                await userService.updateBiometrics({ age: this.age });
            }
        });

        this.querySelector('#box-gender')?.addEventListener('click', async () => {
            // Un toggle rápido
            this.gender = this.gender === 'M' ? 'F' : 'M';
            const span = this.querySelector('#val-gender');
            span.innerText = this.gender === 'M' ? this.dict.t('calc_gender_m') : this.dict.t('calc_gender_f');
            span.classList.remove('placeholder-text');
            
            // Guardar en el perfil global silenciosamente
            await userService.updateBiometrics({ gender: this.gender });
        });

        // Listeners Pliegues
        Object.keys(this.folds).forEach(key => {
            const box = this.querySelector(`#box-${key}`);
            if (box) {
                box.addEventListener('click', async () => {
                    const result = await modal.open(this.foldLabels[key], this.folds[key], 'numeric');
                    if (result) {
                        const cleanVal = (result.value === "0" || result.value === "") ? "" : result.value;
                        this.folds[key] = cleanVal;
                        
                        const span = this.querySelector(`#val-${key}`);
                        span.innerText = cleanVal !== "" ? cleanVal : "0";
                        if (cleanVal !== "") span.classList.remove('placeholder-text');
                        else span.classList.add('placeholder-text');
                    }
                });
            }
        });

        // Listener Calcular y volver (Guardamos y volvemos a la pantalla principal de progreso)
        this.querySelector('#btn-calc')?.addEventListener('click', () => {
            this._calculateFat();
        });
    }

    _calculateFat() {
        // Validación estricta: No se calcula sin Edad y Sexo
        if (!this.age || !this.gender) {
            this.usedFormula = this.dict.t('calc_formula_err_data');
            this.resultFat = 0;
            this._updateResultsUI();
            return;
        }

        const p = parseFloat(this.folds.pectoral) || 0;
        const ab = parseFloat(this.folds.abdominal) || 0;
        const th = parseFloat(this.folds.quadriceps_fold) || 0;
        const tr = parseFloat(this.folds.triceps_fold) || 0;
        const sub = parseFloat(this.folds.subscapular) || 0;
        const sup = parseFloat(this.folds.suprailiac) || 0;
        const mid = parseFloat(this.folds.midaxillary) || 0;

        const isMale = this.gender === 'M';

        const has7 = (p > 0 && ab > 0 && th > 0 && tr > 0 && sub > 0 && sup > 0 && mid > 0);
        const hasMale3 = (p > 0 && ab > 0 && th > 0);
        const hasFemale3 = (tr > 0 && sup > 0 && th > 0);
        
        let bodyDensity = 0;
        this.usedFormula = this.dict.t('calc_formula_err_folds');

        // 1. Jackson-Pollock 7
        if (has7) {
            const sum7 = p + ab + th + tr + sub + sup + mid;
            this.usedFormula = this.dict.t('calc_formula_jp7');
            if (isMale) {
                bodyDensity = 1.112 - (0.00043499 * sum7) + (0.00000055 * sum7 * sum7) - (0.00028826 * this.age);
            } else {
                bodyDensity = 1.097 - (0.00046971 * sum7) + (0.00000056 * sum7 * sum7) - (0.00012828 * this.age);
            }
        } 
        // 2. Jackson-Pollock 3
        else {
            if (isMale && hasMale3) {
                const sum3 = p + ab + th;
                this.usedFormula = this.dict.t('calc_formula_jp3');
                bodyDensity = 1.10938 - (0.0008267 * sum3) + (0.0000016 * sum3 * sum3) - (0.0002574 * this.age);
            } 
            else if (!isMale && hasFemale3) {
                const sum3 = tr + sup + th;
                this.usedFormula = 'Jackson-Pollock 3';
                bodyDensity = 1.0994921 - (0.0009929 * sum3) + (0.0000023 * sum3 * sum3) - (0.0001392 * this.age);
            }
        }

        // 3. Ecuación de Siri
        if (bodyDensity > 0) {
            let fatPercent = (495 / bodyDensity) - 450;
            fatPercent = Math.max(2, Math.min(70, fatPercent)); 
            this.resultFat = Math.round(fatPercent * 10) / 10; 
            
            // LA MAGIA: Guardamos directamente en el store (Draft)
            progressStore.updateDraft({
                fat: { value: this.resultFat.toString(), unit: '%' }
            });

        } else {
            this.resultFat = 0; 
        }

        this._updateResultsUI();
    }

    _updateResultsUI() {
        const valSpan = this.querySelector('#ui-fat-val');
        const formulaSpan = this.querySelector('#ui-formula-val');
        const panel = this.querySelector('.result-panel');

        if (valSpan) {
            valSpan.innerHTML = `${this.resultFat > 0 ? this.resultFat : '--'}<span style="font-size:0.6em; margin-left:4px;">%</span>`;
        }
        if (formulaSpan) {
            formulaSpan.innerText = `${this.dict.t('calc_lbl_algorithm')} ${this.usedFormula}`;
            formulaSpan.style.color = this.resultFat > 0 ? 'var(--Verde-acido)' : '#FF7E4F'; 
        }

        if (panel) {
            panel.style.transition = 'opacity 0.1s';
            panel.style.opacity = '0.5';
            setTimeout(() => panel.style.opacity = '1', 150);
        }
    }
}

if (!customElements.get('progress-fat-calculator')) {
    customElements.define('progress-fat-calculator', ProgressFatCalculator);
}