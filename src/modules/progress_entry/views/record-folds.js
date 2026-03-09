// src/modules/progress_entry/views/record-folds.js

import { progressService } from '../../progress_core/services/progress.service.js';
import { progressStore } from '../../progress_core/store/index.js';
import { router } from '../../../core/router/index.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Componentes
import '../../../modules/system/components/btn.js';
import '../../../modules/system/components/input-card.js';
import '../../../modules/system/components/box.js';
import '../../../modules/system/components/keypad-modal.js';
import '../../../modules/system/components/unit-toggle.js';
import '../../../modules/system/components/navbar.js';

export class ProgressRecordFolds extends HTMLElement {
    constructor() {
        super();
        this.sequence = [
            'pectoral', 'abdominal', 'quadriceps_fold', 
            'suprailiac', 'triceps_fold', 'subscapular', 'midaxillary'
        ];
    }

    async connectedCallback() {
        // Redirección de seguridad
        if (!progressService.canAddRecord()) {
            router.navigate('/progress/add');
            return;
        }

        // 1. Cargamos el diccionario
        this.dict = await i18nService.loadPage('progress_entry/record');

        // 2. Flujo normal
        this._loadDraft();
        this.render();
        this._attachListeners();
        this._updateUI();
        this._checkCanSave();
    }

    _loadDraft() {
        const draft = progressStore.getDraft();
        const defaultOpts = { unit: 'MM', options: 'MM' }; 
        
        this.data = {
            pectoral:        { value: draft.pectoral?.value || "",        ...defaultOpts, label: this.dict.t('record_folds_pectoral') },
            abdominal:       { value: draft.abdominal?.value || "",       ...defaultOpts, label: this.dict.t('record_folds_abdominal') },
            quadriceps_fold: { value: draft.quadriceps_fold?.value || "", ...defaultOpts, label: this.dict.t('record_folds_quadriceps') },
            suprailiac:      { value: draft.suprailiac?.value || "",      ...defaultOpts, label: this.dict.t('record_folds_suprailiac') },
            triceps_fold:    { value: draft.triceps_fold?.value || "",    ...defaultOpts, label: this.dict.t('record_folds_triceps') },
            subscapular:     { value: draft.subscapular?.value || "",     ...defaultOpts, label: this.dict.t('record_folds_subscapular') },
            midaxillary:     { value: draft.midaxillary?.value || "",     ...defaultOpts, label: this.dict.t('record_folds_midaxillary') }
        };

        this.hasVisitedMeasures = draft.neck && draft.neck.value !== "";

        const partialDraft = {};
        Object.keys(this.data).forEach(k => partialDraft[k] = this.data[k]);
        progressStore.updateDraft(partialDraft);
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

                /* HEADER FIJO */
                .header-section {
                    display: flex;
                    flex-direction: column;
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

                /* ZONA DE BOTONES AL FONDO */
                .action-wrapper-bottom {
                    margin-top: auto;
                    padding-top: 32px;
                    display: flex;
                    flex-direction: column;
                }

                .btn-group {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* FOOTER */
                .footer-section {
                    flex-shrink: 0;
                    background: var(--Negro-suave);
                }

                /* TOAST */
                .toast {
                    position: fixed;
                    bottom: 80px; 
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: var(--Verde-acido);
                    color: var(--Negro-suave);
                    padding: 12px 24px;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 500;
                    opacity: 0;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 9999;
                    pointer-events: none;
                }
                .toast.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            </style>

            <app-keypad-modal id="progress-modal"></app-keypad-modal>
            <div id="toast" class="toast">${this.dict.t('record_toast_success')}</div>

            <div class="screen-container">
                
                <header class="header-section">
                    <h1 class="screen-title">${this.dict.t('record_title')}</h1>
                </header>

                <main class="content-scroll">
                    <div class="form-stack">
                        ${Object.keys(this.data).map(key => `
                            <app-input-card label="/ ${this.data[key].label}">
                                <app-box id="box-${key}" clickable>
                                    <span id="val-${key}" class="value-text"></span>
                                    <app-unit-toggle id="unit-${key}"></app-unit-toggle>
                                </app-box>
                            </app-input-card>
                        `).join('')}
                    </div>

                    <div class="action-wrapper-bottom">
                        <div class="btn-group">
                            ${!this.hasVisitedMeasures ? `
                                <app-btn id="btn-go-measures" label="${this.dict.t('record_btn_go_measures')}" variant="secondary"></app-btn>
` : ''}
<app-btn id="btn-save" label="${this.dict.t('record_btn_save')}" variant="primary" disabled></app-btn>
                        </div>
                    </div>
                </main>
                
                <footer class="footer-section">
                    <app-nav></app-nav>
                </footer>
            </div>
        `;
    }

    _attachListeners() {
        const modal = this.querySelector('#progress-modal');

        this.sequence.forEach(fieldKey => {
            const box = this.querySelector(`#box-${fieldKey}`);
            if (box) box.addEventListener('click', () => this._openModalForField(fieldKey, modal));
        });

        this.querySelector('#btn-go-measures')?.addEventListener('click', () => {
            router.navigate('/progress/add/measures');
        });

        this.querySelector('#btn-save')?.addEventListener('click', () => this._handleSave());
    }

    async _openModalForField(fieldKey, modal) {
        const fieldData = this.data[fieldKey];
        const result = await modal.open(
            fieldData.label, 
            fieldData.value, 
            'dynamic', 
            fieldData.unit, 
            fieldData.options,
            (newUnit) => {
                this.querySelector(`#unit-${fieldKey}`).setAttribute('value', newUnit);
                this.data[fieldKey].unit = newUnit;
                progressStore.updateDraft({ [fieldKey]: this.data[fieldKey] });
            }
        );

        if (result) {
            const cleanValue = (result.value === "0" || result.value === "") ? "" : result.value;
            this.data[fieldKey].value = cleanValue;
            this.data[fieldKey].unit = result.unit;
            
            progressStore.updateDraft({ [fieldKey]: this.data[fieldKey] });
            this._updateUI();
            this._checkCanSave();
            
            // ELIMINADO: Ya no hay salto forzado al siguiente input.
        }
    }

    _updateUI() {
        Object.keys(this.data).forEach(key => {
            const field = this.data[key];
            const valSpan = this.querySelector(`#val-${key}`);
            const unitToggle = this.querySelector(`#unit-${key}`);
            
            if (valSpan) {
                valSpan.innerText = field.value !== "" ? field.value : "0";
                valSpan.style.opacity = field.value !== "" ? "1" : "0.3";
            }
            if (unitToggle) {
                unitToggle.setAttribute('options', field.options);
                unitToggle.setAttribute('value', field.unit);
            }
        });
    }

    _checkCanSave() {
        const draft = progressStore.getDraft();
        let hasValidData = false;

        for (const key in draft) {
            const item = draft[key];
            if (item && item.value !== "" && parseFloat(item.value) > 0) {
                hasValidData = true;
                break;
            }
        }

        const btnSave = this.querySelector('#btn-save');
        if (btnSave) {
            if (hasValidData) btnSave.removeAttribute('disabled');
            else btnSave.setAttribute('disabled', 'true');
        }
    }

    async _handleSave() {
        const btnSave = this.querySelector('#btn-save');
        if (btnSave.hasAttribute('disabled')) return;

        const draft = progressStore.getDraft();
        const recordToSave = {};

        for (const [key, field] of Object.entries(draft)) {
            if (field && field.value !== "" && parseFloat(field.value) > 0) {
                let finalKey = key;
                if (key === 'fat') finalKey = 'bodyFat';
                if (key === 'muscle') finalKey = 'muscleMass';
                
                // 🔥 LA ADUANA MÉTRICA: Purificamos a base (KG/CM) antes de guardar
                recordToSave[finalKey] = unitService.toBase(field.value, field.unit);
            }
        }

        await progressService.addRecord(recordToSave);
        
        const toast = this.querySelector('#toast');
        if (toast) toast.classList.add('show');

        setTimeout(() => router.navigate('/progress/add'), 1500);
    }
}

customElements.define('progress-record-folds', ProgressRecordFolds);