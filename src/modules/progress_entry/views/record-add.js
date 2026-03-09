// src/modules/progress_entry/views/record-add.js

import { progressService } from '../../progress_core/services/progress.service.js';
import { progressStore } from '../../progress_core/store/index.js';
import { router } from '../../../core/router/index.js';
import { ICONS } from '../../../core/theme/icons.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Componentes
import '../../../modules/system/components/btn.js';
import '../../../modules/system/components/input-card.js';
import '../../../modules/system/components/box.js';
import '../../../modules/system/components/keypad-modal.js';
import '../../../modules/system/components/unit-toggle.js';
import '../../../modules/system/components/navbar.js';

export class ProgressRecordAdd extends HTMLElement {
    constructor() {
        super();
        this.sequence = ['weight', 'fat', 'height', 'muscle'];
        this.canAdd = true;
    }

    async connectedCallback() {
        // 1. Cargamos el diccionario ANTES de hacer nada
        this.dict = await i18nService.loadPage('progress_entry/record');
        
        // 2. Ahora sí, el flujo normal
        this.canAdd = progressService.canAddRecord();
        this._loadDraft();
        this.render();

        if (this.canAdd) {
            this._attachListeners();
            this._updateUI();
            this._checkCanSave();
        }
    }

    _loadDraft() {
        const draft = progressStore.getDraft();
        this.data = {
            weight: { value: draft.weight?.value || "", unit: draft.weight?.unit || 'KG', options: 'KG, LB, ST', label: this.dict.t('record_add_lbl_weight') },
            fat:    { value: draft.fat?.value || "",    unit: draft.fat?.unit || '%',   options: '%',         label: this.dict.t('record_add_lbl_fat') },
            height: { value: draft.height?.value || "", unit: draft.height?.unit || 'M',  options: 'M, FT',     label: this.dict.t('record_add_lbl_height') },
            muscle: { value: draft.muscle?.value || "", unit: draft.muscle?.unit || 'KG', options: 'KG, LB, ST, %', label: this.dict.t('record_add_lbl_muscle') },
            photo:  { value: draft.photo?.value || null } 
        };

        progressStore.updateDraft({
            weight: this.data.weight,
            fat: this.data.fat,
            height: this.data.height,
            muscle: this.data.muscle,
            photo: this.data.photo
        });
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

                .helper-text {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 150%;
                    text-align: center;
                    margin: 0 0 16px 0;
                    opacity: 0.8;
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

                /* EXTRAS */
                .cooldown-message {
                    display: flex;
                    padding: 24px;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    border: 1px solid var(--Verde-acido);
                    background: rgba(204, 255, 0, 0.05);
                    text-align: center;
                    margin-top: 40px;
                }

                .cooldown-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    line-height: 150%;
                }

                .toast {
                    position: fixed;
                    bottom: 80px; 
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: var(--Verde-acido);
                    color: var(--Negro-suave);
                    border: 1px solid var(--Negro-suave);
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

                /* --- ESTILOS NUEVOS PARA LA FOTO --- */
                .photo-upload-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                }

                .photo-label {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 150%;
                }

                .upload-box {
                    border: 1px dashed var(--Verde-acido);
                    padding: 24px 20px;
                    text-align: center;
                    cursor: pointer;
                    background: rgba(204,255,0,0.05);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 120px;
                    transition: all 0.2s ease;
                    position: relative;
                    overflow: hidden;
                }

                .upload-box:hover {
                    background: rgba(204,255,0,0.1);
                }

                .upload-box.has-image {
                    border-style: solid;
                    padding: 0;
                }

                .photo-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                }

                .upload-icon {
                    width: 32px;
                    height: 32px;
                    margin-bottom: 8px;
                }

                .upload-title {
                    color: var(--Blanco);
                    font-family: 'Clash Display';
                    margin: 8px 0 4px 0;
                    font-size: 18px;
                }

                .upload-desc {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono';
                    opacity: 0.7;
                    font-size: 12px;
                    margin: 0;
                }
            </style>

            <app-keypad-modal id="progress-modal"></app-keypad-modal>
            <div id="toast" class="toast">${this.dict.t('record_toast_success')}</div>

            <div class="screen-container">
                <header class="header-section">
                    <h1 class="screen-title">${this.dict.t('record_title')}</h1>
                </header>

                <main class="content-scroll">
                    ${!this.canAdd ? `
                        <div class="cooldown-message">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--Verde-acido)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span class="cooldown-text">${this.dict.t('record_add_cooldown')}</span>
                        </div>
                    ` : `
                        <div class="form-stack">
                            <app-input-card label="${this.dict.t('record_add_lbl_weight')}">
                                <app-box id="box-weight" clickable>
                                    <span id="val-weight" class="value-text"></span>
                                    <app-unit-toggle id="unit-weight"></app-unit-toggle>
                                </app-box>
                            </app-input-card>

                            <app-input-card label="${this.dict.t('record_add_lbl_fat')}">
                                <app-box id="box-fat" clickable>
                                    <span id="val-fat" class="value-text"></span>
                                    <app-unit-toggle id="unit-fat"></app-unit-toggle>
                                </app-box>
                            </app-input-card>

                            <app-input-card label="${this.dict.t('record_add_lbl_muscle')}">
                                <app-box id="box-muscle" clickable>
                                    <span id="val-muscle" class="value-text"></span>
                                    <app-unit-toggle id="unit-muscle"></app-unit-toggle>
                                </app-box>
                            </app-input-card>

                            <div class="photo-upload-container">
                                <span class="photo-label">${this.dict.t('record_add_lbl_photo')}</span>
                                <input type="file" id="photo-input" style="display: none;" accept="image/*">
                                <div id="upload-box" class="upload-box">
                                    </div>
                            </div>

                        </div>

                        <div class="action-wrapper-bottom">
                            <p class="helper-text">${this.dict.t('record_add_helper')}</p>
                            <div class="btn-group">
                                <app-btn id="btn-go-measures" label="${this.dict.t('record_btn_go_measures')}" variant="secondary"></app-btn>
<app-btn id="btn-go-folds" label="${this.dict.t('record_btn_go_folds')}" variant="secondary"></app-btn>
<app-btn id="btn-save" label="${this.dict.t('record_btn_save')}" variant="primary" disabled></app-btn>
                            </div>
                        </div>
                    `}
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
            if (box) {
                box.addEventListener('click', () => {
                    this._openModalForField(fieldKey, modal);
                });
            }
        });

        // --- LISTENERS PARA LA FOTO ---
        const uploadBox = this.querySelector('#upload-box');
        const fileInput = this.querySelector('#photo-input');

        if (uploadBox && fileInput) {
            uploadBox.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target.result;
                    this.data.photo.value = base64String;
                    progressStore.updateDraft({ photo: this.data.photo });
                    this._updateUI();
                    this._checkCanSave();
                };
                reader.readAsDataURL(file);
            });
        }
        // -----------------------------

        this.querySelector('#btn-go-measures')?.addEventListener('click', () => {
            router.navigate('/progress/add/measures');
        });
        this.querySelector('#btn-go-folds')?.addEventListener('click', () => {
            router.navigate('/progress/add/folds');
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
        }
    }

    _updateUI() {
        Object.keys(this.data).forEach(key => {
            if (key === 'photo') return; // La foto se maneja aparte

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

        // --- ACTUALIZACIÓN UI DE LA FOTO ---
        const uploadBox = this.querySelector('#upload-box');
        if (uploadBox) {
            if (this.data.photo.value) {
                uploadBox.classList.add('has-image');
                uploadBox.innerHTML = `<img src="${this.data.photo.value}" class="photo-preview" alt="Preview">`;
            } else {
                uploadBox.classList.remove('has-image');
                uploadBox.innerHTML = `
                    <div class="upload-icon">${ICONS.UPLOAD_CLOUD}</div>
                    <h3 class="upload-title">${this.dict.t('record_add_photo_title')}</h3>
                    <p class="upload-desc">${this.dict.t('record_add_photo_desc')}</p>
                `;
            }
        }
    }

    _checkCanSave() {
        const draft = progressStore.getDraft();
        let hasValidData = false;

        for (const key in draft) {
            const item = draft[key];
            // Validar si es una métrica numérica válida
            if (item && key !== 'photo' && item.value !== "" && parseFloat(item.value) > 0) {
                hasValidData = true;
                break;
            }
            // Validar si hay una foto
            if (key === 'photo' && item && item.value) {
                hasValidData = true;
                break;
            }
        }

        const btnSave = this.querySelector('#btn-save');
        if (btnSave) {
            if (hasValidData) {
                btnSave.removeAttribute('disabled');
            } else {
                btnSave.setAttribute('disabled', 'true');
            }
        }
    }

    async _handleSave() {
        const btnSave = this.querySelector('#btn-save');
        if (btnSave.hasAttribute('disabled')) return;

        const draft = progressStore.getDraft();
        const recordToSave = {};

        for (const [key, field] of Object.entries(draft)) {
            // Guardar valores numéricos
            if (key !== 'photo' && field && field.value !== "" && parseFloat(field.value) > 0) {
                let finalKey = key;
                if (key === 'fat') finalKey = 'bodyFat';
                if (key === 'muscle') finalKey = 'muscleMass';
                
                // 🔥 LA ADUANA MÉTRICA: Purificamos a base (KG/CM) antes de guardar
                recordToSave[finalKey] = unitService.toBase(field.value, field.unit);
            }
            
            // Guardar la foto
            if (key === 'photo' && field && field.value) {
                recordToSave.photoData = field.value;
            }
        }

        await progressService.addRecord(recordToSave);
        
        // 1. Mostrar Toast
        const toast = this.querySelector('#toast');
        if (toast) {
            toast.classList.add('show');
        }

        // 2. Animación de salida de los inputs (Suave y limpia)
        const formStack = this.querySelector('.form-stack');
        const actionBottom = this.querySelector('.action-wrapper-bottom');

        if (formStack && actionBottom) {
            formStack.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            actionBottom.style.transition = 'opacity 0.4s ease, transform 0.4s ease';

            formStack.style.opacity = '0';
            formStack.style.transform = 'translateY(10px)';
            actionBottom.style.opacity = '0';
            actionBottom.style.transform = 'translateY(10px)';

            // 3. Esperamos que termine la animación, cambiamos estado y re-renderizamos
            setTimeout(() => {
                this.canAdd = false; // Actualizamos estado interno
                this.render();       // Esto pintará automáticamente el cooldown-message
            }, 400); // 400ms coincide con el tiempo de transición
        }
    }
}

customElements.define('progress-record-add', ProgressRecordAdd);