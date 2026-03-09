// src/modules/nutrition_wizard/views/manual-config.js

import { router } from '../../../core/router/index.js';
import { wizardStore } from '../store/wizard.store.js';
import { wizardService } from '../../nutrition_core/services/wizard.service.js';

// Componentes UI
import '../../system/components/keypad-modal.js';
import '../components/dropdown.js';
import '../../system/components/btn.js';
import '../../system/components/section-header.js'; 
import '../../system/components/input-card.js';      
import '../../system/components/box.js';

// 🟢 INYECTAMOS EL TRADUCTOR
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class NutritionManualConfig extends HTMLElement {
    constructor() {
        super();
        
        // Leemos de la pizarra temporal (Store)
        const draft = wizardStore.getState();
        
        this.state = {
            targetKcal: draft.targetKcal || 0,
            protein: draft.protein || 0,
            carbs: draft.carbs || 0,
            fat: draft.fat || 0,
            interval: draft.interval || 0.05
        };

        // REGLA DE ORO: Opciones sin texto duro
        this.intervalOptions = [
            { labelKey: 'opt_margin_comp', value: '0.01' },
            { labelKey: 'opt_margin_strict', value: '0.02' },
            { labelKey: 'opt_margin_normal', value: '0.05' },
            { labelKey: 'opt_margin_lax', value: '0.10' }
        ];
    }

    async connectedCallback() {
        // Carga del diccionario
        this.dict = await i18nService.loadPage('nutrition_wizard/manual-config');
        
        this.render();
        this.initDropdown();
        this.addListeners();
    }

    initDropdown() {
        if (!this.dict) return;

        const dropdown = this.querySelector('#interval-selector');
        if (dropdown) {
            // Traducimos al vuelo las opciones
            const translatedOptions = this.intervalOptions.map(opt => ({
                value: opt.value,
                label: this.dict.t(opt.labelKey)
            }));
            
            // Pasamos el valor actual a String para que el dropdown lo entienda
            dropdown.setOptions(translatedOptions, String(this.state.interval));
        }
    }

    // Actualización quirúrgica del DOM
    updateView() {
        this.querySelector('#val-kcal').innerText = this.state.targetKcal;
        this.querySelector('#val-p').innerText = this.state.protein;
        this.querySelector('#val-c').innerText = this.state.carbs;
        this.querySelector('#val-f').innerText = this.state.fat;
    }

    render() {
        if (!this.dict) return;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                .wizard-screen {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 100dvh;
                    background: var(--Negro-suave);
                    padding-top: 0;
                    padding-bottom: 16px; 
                    gap: 24px;
                }

                .wizard-content {
                    display: flex;
                    flex-direction: column;
                    align-items: stretch;
                    gap: 16px;
                    padding: 0 24px;
                    flex: 1;
                }
                
                .value-text {
                    flex: 1;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                }
                
                .unit-tag {
                    color: var(--Verde-acido);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                }
            </style>

            <div class="wizard-screen">
                <app-keypad-modal id="expert-keypad"></app-keypad-modal>
                
                <app-section-header 
                    title="${this.dict.t('title_manual')}"
                    text="${this.dict.t('desc_manual')}"
                ></app-section-header>

                <main class="wizard-content">
                    
                    <app-input-card label="${this.dict.t('label_kcal')}">
                        <app-box id="box-kcal" clickable>
                            <span class="value-text" id="val-kcal">${this.state.targetKcal}</span>
                            <span class="unit-tag">KCAL</span>
                        </app-box>
                    </app-input-card>

                    <app-input-card label="${this.dict.t('label_proteins')}" grid="3">
                        <app-box id="box-p" clickable style="border-color: #FF4F4F;">
                            <span class="value-text" id="val-p" style="text-align:center;">${this.state.protein}</span>
                            <span class="unit-tag" style="color: #FF4F4F;">P</span>
                        </app-box>
                        <app-box id="box-c" clickable style="border-color: #4FB4FF;">
                            <span class="value-text" id="val-c" style="text-align:center;">${this.state.carbs}</span>
                            <span class="unit-tag" style="color: #4FB4FF;">C</span>
                        </app-box>
                        <app-box id="box-f" clickable style="border-color: #FFD14F;">
                            <span class="value-text" id="val-f" style="text-align:center;">${this.state.fat}</span>
                            <span class="unit-tag" style="color: #FFD14F;">G</span>
                        </app-box>
                    </app-input-card>

                    <app-input-card label="${this.dict.t('label_error_margin')}">
                        <app-dropdown id="interval-selector"></app-dropdown>
                    </app-input-card>
                </main>

                <section class="wizard-buttons" style="padding: 0 24px; display:flex; flex-direction:column; gap:16px;">
                    <app-btn variant="secondary" label="${this.dict.t('btn_back')}" id="btn-back"></app-btn>
                    <app-btn variant="primary" label="${this.dict.t('btn_save_diet')}" id="btn-save"></app-btn>
                </section>
            </div>
        `;
    }

    addListeners() {
        const modal = this.querySelector('#expert-keypad');

        // Función helper para abrir el teclado
        const openKeypad = async (label, key) => {
            const res = await modal.open(label, this.state[key], 'numeric');
            if (res !== null) {
                this.state[key] = parseInt(res.value) || 0;
                this.updateView();
            }
        };

        // Escuchadores de las cajas
        this.querySelector('#box-kcal').addEventListener('click', () => openKeypad(this.dict.t('keypad_kcal'), 'targetKcal'));
        this.querySelector('#box-p').addEventListener('click', () => openKeypad(this.dict.t('keypad_prot'), 'protein'));
        this.querySelector('#box-c').addEventListener('click', () => openKeypad(this.dict.t('keypad_carb'), 'carbs'));
        this.querySelector('#box-f').addEventListener('click', () => openKeypad(this.dict.t('keypad_fat'), 'fat'));

        // Escuchador del Dropdown
        this.querySelector('#interval-selector').addEventListener('change', (e) => {
            this.state.interval = parseFloat(e.detail.value);
        });

        // Navegación
        this.querySelector('#btn-back').addEventListener('click', () => router.navigate('/nutrition/wizard/form'));
        
        // EL GRAN GUARDADO (La magia delegada)
        this.querySelector('#btn-save').addEventListener('click', async () => {
            // 1. Actualizamos la pizarra temporal
            wizardStore.update({
                targetKcal: this.state.targetKcal,
                protein: this.state.protein,
                carbs: this.state.carbs,
                fat: this.state.fat,
                interval: this.state.interval
            });

            // 2. Le decimos al servicio: "Ejecuta la Orden 66 (Modo Custom)"
            await wizardService.saveCustomGoal();

            // 3. Al dashboard
            router.navigate('/nutrition');
        });
    }
}

customElements.define('nutrition-manual-config', NutritionManualConfig);