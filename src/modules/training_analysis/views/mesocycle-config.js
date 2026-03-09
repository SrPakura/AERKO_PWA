// src/modules/training_analysis/views/mesocycle-config.js

import { router } from '../../../core/router/index.js';
import { ICONS } from '../../../core/theme/icons.js';

import { trainingStore } from '../../training_core/store/index.js';
import { db } from '../../../core/db/index.js'; 

import { i18nService } from '../../../core/i18n/i18n.service.js'; // Y aquí va el penultimo módulo

// Importamos componentes del sistema
import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/segment-select.js';

export class AnalysisMesocycleConfig extends HTMLElement {
    constructor() {
        super();
        // Estado por defecto
        this.selectedFocus = 'hipertrofia'; // 'fuerza', 'hipertrofia', 'resistencia'
        this.selectedDuration = '4'; // 3 a 8 semanas
    }

    async connectedCallback() {
    // 1. Cargamos el diccionario de esta pantalla
    this.i18n = await i18nService.loadPage('training_analysis/mesocycle-config');
    
    // 2. Ejecutamos el resto del ciclo de vida
    this.render();
    this._initComponents();
    this._attachListeners();
}

    render() {
        // SVG para el icono de información de la tarjeta
        const infoIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

                /* 1. HEADER */
                .header-bar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    flex-shrink: 0;
                    border-bottom: 1px solid var(--Blanco);
                    /* Padding lateral y abajo */
                    padding: 16px 24px; 
                    /* Sobrescribimos solo el de arriba con la zona segura del notch */
                    padding-top: calc(env(safe-area-inset-top) + 16px); 
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

                /* 2. CONTENIDO PRINCIPAL */
                .content-section {
                    /* 1. Ocupa el espacio disponible */
                    flex: 1; 
    
                    /* 2. Configuración de contenedor */
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start; /* Alinea el contenido al inicio del eje vertical */
    
                    /* 3. Espaciado y diseño */
                    gap: 32px;
                    padding: 32px 24px;
    
                    /* 4. Comportamiento del scroll */
                    overflow-y: auto;
                    scrollbar-width: none; /* Oculta scrollbar en Firefox */
                }

                .content-section::-webkit-scrollbar { display: none; }

                /* 3. INFO CARD */
                .info-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 24px;
                    border: 1px solid var(--Blanco);
                    margin-top: 8px; /* Un poco de aire extra */
                }

                .info-icon {
                    color: var(--Blanco);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .info-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    font-weight: 400;
                    line-height: 150%;
                    text-align: center;
                    opacity: 0.9;
                }

                /* 4. FOOTER (BOTÓN) */
                .action-section {
                    flex-shrink: 0;
                    padding: 0 24px calc(env(safe-area-inset-bottom) + 24px) 24px;
                }
            </style>

            <div class="screen-container">
                
                <header class="header-bar">
                    <button class="back-btn" id="btn-back">
                        ${ICONS.ARROW_LEFT}
                    </button>
                    <span class="screen-title">${this.i18n.t('meso_header_title')}</span>
                </header>

                <main class="content-section">
                    
                    <app-input-card label="${this.i18n.t('meso_lbl_focus')}">
                        <app-segment-select id="focus-select"></app-segment-select>
                    </app-input-card>

                    <app-input-card label="${this.i18n.t('meso_lbl_duration')}">
                        <app-segment-select id="duration-select"></app-segment-select>
                    </app-input-card>

                    <div class="info-card">
                        <div class="info-icon">${infoIcon}</div>
                        <span class="info-text">${this.i18n.t('meso_info_text')}</span>
                    </div>

                </main>

                <footer class="action-section">
                    <app-btn id="btn-start" label="${this.i18n.t('meso_btn_start')}" variant="primary"></app-btn>
                </footer>

            </div>
        `;
    }

    _initComponents() {
        // 1. Configurar Selector de Enfoque
        const focusSelect = this.querySelector('#focus-select');
        if (focusSelect) {
            focusSelect.setOptions([
    { label: this.i18n.t('meso_opt_strength'), value: 'fuerza' },
    { label: this.i18n.t('meso_opt_hypertrophy'), value: 'hipertrofia' },
    { label: this.i18n.t('meso_opt_endurance'), value: 'resistencia' }
]);
            // Forzamos el valor por defecto visualmente
            focusSelect.setAttribute('value', this.selectedFocus);
            focusSelect._value = this.selectedFocus; // Internal state sync
        }

        // 2. Configurar Selector de Duración (Generamos de 3 a 8 dinámicamente)
        const durationSelect = this.querySelector('#duration-select');
        if (durationSelect) {
            const weeks = [3, 4, 5, 6, 7, 8].map(n => ({
                label: n.toString(),
                value: n.toString()
            }));
            durationSelect.setOptions(weeks);
            
            durationSelect.setAttribute('value', this.selectedDuration);
            durationSelect._value = this.selectedDuration;
        }
    }

    _attachListeners() {
        // A. Botón Atrás
        this.querySelector('#btn-back').addEventListener('click', () => {
            history.back(); // O router.navigate('/training')
        });

        // B. Capturar cambios en los Segment Selects
        this.querySelector('#focus-select').addEventListener('change', (e) => {
            this.selectedFocus = e.detail.value;
        });

        this.querySelector('#duration-select').addEventListener('change', (e) => {
            this.selectedDuration = e.detail.value;
        });

        // C. Guardar y Arrancar Mesociclo
        this.querySelector('#btn-start').addEventListener('click', () => {
            
            // Creamos el objeto de configuración del mesociclo
            const newMesocycle = {
                focus: this.selectedFocus,
                totalWeeks: parseInt(this.selectedDuration),
                currentWeek: 1, // Empezamos siempre en la semana 1
                startDate: Date.now()
            };

            console.log("[ANALYSIS] Mesocycle Started:", newMesocycle);

            // Guardamos en el Store (RAM) para que la pantalla del Selector cambie su UI
            trainingStore.state.mesocycle = newMesocycle;
            
            // Aquí puedes añadir la persistencia a la Base de Datos si hace falta:
            db.put('public_store', { id: 'current_mesocycle', data: newMesocycle });

            // Volvemos a la pantalla principal de entrenamiento (Donde está el Hub de rutinas)
            router.navigate('/training');
        });
    }
}

customElements.define('training-analysis-meso-config', AnalysisMesocycleConfig);