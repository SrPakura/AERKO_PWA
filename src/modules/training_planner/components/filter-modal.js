// src/modules/training_planner/components/filter-modal.js

import { trainingStore } from '../../training_core/store/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // Chat, se que el chiste de los patos no os gusto, así que voy con otro. Van dos abuelos en una moto y gta 6 se vuelve a retrasar. Me cago en todos los...

export class TrainingFilterModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Estado interno
        this.activeTab = 'material'; // 'material' | 'muscle'
        this.selectedCategory = [];  // gym, weights, bodyweight
        this.selectedMuscles = [];   // IDs de músculos
        
        this.musclesList = []; // Se cargará desde el Store
    }

    async connectedCallback() {
        // Cargar lista de músculos para tenerla lista
        this.musclesList = trainingStore.getMuscles() || [];
        this.i18n = await i18nService.loadPage('training_planner/filter-modal');
        this.render();
        this._attachListeners();
    }

    /**
     * Método público para abrir el modal con filtros pre-cargados si existen
     */
    open(currentFilters) {
        // Restaurar estado
        if (currentFilters.type === 'category') {
            this.activeTab = 'material';
            this.selectedCategory = currentFilters.values;
            this.selectedMuscles = [];
        } else if (currentFilters.type === 'muscle') {
            this.activeTab = 'muscle';
            this.selectedMuscles = currentFilters.values;
            this.selectedCategory = [];
        } else {
            // Limpio
            this.activeTab = 'material';
            this.selectedCategory = [];
            this.selectedMuscles = [];
        }

        this.render();
        this._attachListeners();
        this.style.display = 'flex'; // Mostrar
    }

    close() {
        this.style.display = 'none';
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); /* Backdrop oscuro */
                    backdrop-filter: blur(2px);
                    z-index: 999;
                    
                    /* Oculto por defecto */
                    display: none; 
                    
                    /* Centrado o posicionado según diseño? */
                    /* El diseño parece un dropdown que sale debajo del header */
                    /* Pero para mobile es más seguro hacerlo full screen o centrado */
                    justify-content: center;
                    align-items: flex-start;
                    padding-top: 120px; /* Dejamos hueco para ver el header de la app */
                }

                .modal-box {
                    width: 90%;
                    max-width: 400px;
                    background: var(--Negro-suave);
                    border: 1px solid var(--Blanco);
                    display: flex;
                    flex-direction: column;
                }

                /* --- TABS HEADER --- */
                .tabs-row {
                    display: flex;
                    width: 100%;
                    height: 48px;
                    border-bottom: 1px solid var(--Blanco);
                }

                .tab-btn {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    font-weight: 500;
                    text-transform: uppercase;
                    cursor: pointer;
                    opacity: 0.5;
                    transition: all 0.2s;
                    
                    /* Borde derecho para el primero */
                    border-right: 1px solid var(--Blanco);
                }
                .tab-btn:last-child { border-right: none; }

                .tab-btn.active {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.1);
                }

                /* --- BODY (Opciones) --- */
                .options-container {
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px; /* Lo que pediste */
                    max-height: 400px;
                    overflow-y: auto;
                }

                /* --- CHECKBOX ROW --- */
                .check-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    user-select: none;
                }

                .checkbox {
                    width: 20px;
                    height: 20px;
                    border: 1px solid var(--Blanco);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }

                .checkbox.checked {
                    background: var(--Blanco);
                }

                /* Icono tick (interno) */
                .tick {
                    display: none;
                    width: 12px;
                    height: 12px;
                    background: var(--Negro-suave);
                }
                .checkbox.checked .tick { display: block; }

                .label-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    text-transform: uppercase;
                }

                /* --- FOOTER (Aplicar) --- */
                .footer-row {
                    display: flex;
                    padding: 12px;
                    border-top: 1px solid var(--Blanco);
                    gap: 8px;
                }

                .btn-action {
                    flex: 1;
                    padding: 12px;
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    color: var(--Blanco);
                    font-family: "JetBrains Mono";
                    cursor: pointer;
                    text-transform: uppercase;
                }
                .btn-action.primary {
                    background: var(--Verde-acido);
                    color: var(--Negro-suave);
                    border-color: var(--Verde-acido);
                    font-weight: 700;
                }

            </style>

            <div class="modal-box" id="modal-box">
                <div class="tabs-row">
                    <button class="tab-btn ${this.activeTab === 'material' ? 'active' : ''}" 
                        id="tab-material">${this.i18n ? this.i18n.t('tab_material') : 'Material'}</button>
                    <button class="tab-btn ${this.activeTab === 'muscle' ? 'active' : ''}" 
                        id="tab-muscle">${this.i18n ? this.i18n.t('tab_muscle') : 'Músculo(s)'}</button>
                </div>

                <div class="options-container" id="list-container">
                    ${this._renderOptions()}
                </div>

                <div class="footer-row">
                    <button class="btn-action" id="btn-clear">${this.i18n ? this.i18n.t('btn_clear') : 'Borrar'}</button>
                    <button class="btn-action primary" id="btn-apply">${this.i18n ? this.i18n.t('btn_apply') : 'Aplicar'}</button>
                </div>
            </div>
            
            <div style="position:absolute; width:100%; height:100%; z-index:-1;" id="backdrop"></div>
        `;
    }

    _renderOptions() {
        // Fallback seguro por si se llama antes de cargar i18n
        const t = (key) => this.i18n ? this.i18n.t(key) : '';

        if (this.activeTab === 'material') {
            const options = [
                { id: 'gym', label: t('opt_mat_gym') || 'GYM' },
                { id: 'weights', label: t('opt_mat_weights') || 'WEIGHTS' },
                { id: 'bodyweight', label: t('opt_mat_bodyweight') || 'BODYWEIGHTS' }
            ];
            return options.map(opt => this._createCheckRow(opt.id, opt.label, this.selectedCategory.includes(opt.id))).join('');
        } else {
            // Renderizar Músculos (Solo los Padres)
            return this.musclesList.map(m => {
                // Traducimos el nombre de la BD usando tData
                const name = i18nService.tData(m.name);
                return this._createCheckRow(m.id, name, this.selectedMuscles.includes(m.id));
            }).join('');
        }
    }

    _createCheckRow(id, label, isChecked) {
        return `
            <div class="check-row" data-id="${id}">
                <div class="checkbox ${isChecked ? 'checked' : ''}">
                    <div class="tick"></div>
                </div>
                <span class="label-text">${label}</span>
            </div>
        `;
    }

    _attachListeners() {
        // 1. Cambio de Tab
        this.shadowRoot.getElementById('tab-material').addEventListener('click', () => {
            this.activeTab = 'material';
            // Al cambiar de tab, PODRÍAMOS limpiar la otra selección si queremos ser estrictos visualmente
            // Según tu orden "solo uno al mismo tiempo", al cambiar de tab cambiamos de modo
            this.render();
            this._attachListeners();
        });

        this.shadowRoot.getElementById('tab-muscle').addEventListener('click', () => {
            this.activeTab = 'muscle';
            this.render();
            this._attachListeners();
        });

        // 2. Toggles de los Checkboxes
        this.shadowRoot.querySelectorAll('.check-row').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.id;
                
                if (this.activeTab === 'material') {
                    // Toggle en Material
                    if (this.selectedCategory.includes(id)) {
                        this.selectedCategory = this.selectedCategory.filter(c => c !== id);
                    } else {
                        this.selectedCategory.push(id);
                    }
                    // Si toco material, borro músculos (Mutuamente exclusivo)
                    this.selectedMuscles = [];
                } else {
                    // Toggle en Músculos
                    if (this.selectedMuscles.includes(id)) {
                        this.selectedMuscles = this.selectedMuscles.filter(m => m !== id);
                    } else {
                        this.selectedMuscles.push(id);
                    }
                    // Si toco músculos, borro material
                    this.selectedCategory = [];
                }
                
                this.render();
                this._attachListeners();
            });
        });

        // 3. Botones Finales
        this.shadowRoot.getElementById('btn-apply').addEventListener('click', () => {
            this._emitFilterChange();
            this.close();
        });

        this.shadowRoot.getElementById('btn-clear').addEventListener('click', () => {
            this.selectedCategory = [];
            this.selectedMuscles = [];
            this._emitFilterChange();
            this.close();
        });

        // Cerrar al clickar fuera
        this.shadowRoot.getElementById('backdrop').addEventListener('click', () => {
            this.close();
        });
    }

    _emitFilterChange() {
        let payload = { type: 'none', values: [] };

        if (this.selectedCategory.length > 0) {
            payload = { type: 'category', values: this.selectedCategory };
        } else if (this.selectedMuscles.length > 0) {
            payload = { type: 'muscle', values: this.selectedMuscles };
        }

        this.dispatchEvent(new CustomEvent('filter-change', {
            detail: payload,
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('training-filter-modal', TrainingFilterModal);