// src/modules/progress_graphics/views/dashboard.js

import { router } from '../../../core/router/index.js';
import { ICONS } from '../../../core/theme/icons.js';
import { progressService } from '../../progress_core/services/progress.service.js';
import { progressStore } from '../../progress_core/store/index.js'; // <-- ¡Este es el que faltaba! Y si, este comentario es de gemini porque el editor de pop_os tiene algo raro que es capaz de seleccionar una línea por la cara, y cuando le doy al enter para dar un salto de línea, borra lo seleccionado. Gracias system76 por recordarme que linux no es para los despistados. 
// Ojo, llevo varios días pensado en este comentario. Cabe aclarar, amo a pop!_os, el editor no tiene un fallo, es que no lo sabía usar (quien no tiene un error de capa 8 para ragebaitear al pobre desarrollador). Mucho amor a Linux y mucho, pero mucho mucho mucho asco a windows.
import { db } from '../../../core/db/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';


export class ProgressDashboard extends HTMLElement {
    constructor() {
        super();
        this.currentChart = 'evolucion-corporal';
        this.allData = {}; // Aquí guardaremos todo el JSON en crudo de la DB
    }

    async connectedCallback() {
        // 1. Descargamos TODOS los datos de golpe (Cero lag después)
        await this._loadAllData();
        
        // Otra vez el puto i18n. Estoy tan quemado que ya me da igual que esté mal o bien
        this.dict = await i18nService.loadPage('progress_graphics/dashboard');
        
        // 2. Pintamos la carcasa (Header + Selector + Nav)
        this.render();
        
        // 3. Activamos los listeners del selector
        this._attachListeners();
        
        // 4. Inyectamos la primera gráfica por defecto
        this.renderChart(this.currentChart);
    }

    async _loadAllData() {
        // Obtenemos los datos directamente de las bóvedas
        const sessionsRecord = await db.get('training_vault', 'training_sessions');
        const exercisesRecord = await db.get('training_vault', 'master_exercises');
        const labRecord = await db.get('training_vault', 'lab_history'); // <-- NUEVO

        this.allData = {
            progressRecords: progressStore.getRecords(),
            trainingSessions: sessionsRecord?.data || [],
            masterExercises: exercisesRecord?.data || [],
            labHistory: labRecord?.data || [], // <-- NUEVO
            nutritionLogs: [] 
        };
        
        console.log('🔴 [DASHBOARD] Datos extraídos de la BD:', this.allData);
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

                /* 1. Título Principal */
                .main-title {
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 48px; 
                    font-weight: 700;
                    line-height: 100%;
                    margin: 0;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px;
                }

                /* 2. Franja del Selector (Bordes blancos) */
                .selector-strip {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 16px 24px;
                    box-sizing: border-box;
                    border-top: 1px solid var(--Blanco);
                    border-bottom: 1px solid var(--Blanco);
                    position: relative;
                }

                /* El truco del select transparente */
                .native-select {
                    background: transparent;
                    border: none;
                    color: var(--Verde-acido);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    font-weight: 400; 
                    padding: 0;
                    margin: 0;
                    outline: none;
                    appearance: none;
                    cursor: pointer;
                    width: 100%;
                    z-index: 2; 
                }

                .native-select option {
                    color: black; 
                }

                .arrow-icon {
                    position: absolute;
                    right: 24px;
                    top: 50%;
                    transform: translateY(-50%);
                    pointer-events: none;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--Blanco);
                    z-index: 1;
                }

                /* 3. Contenedor de la Gráfica */
                .chart-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    overflow-y: auto;
                    scrollbar-width: none; 
                }
                .chart-container::-webkit-scrollbar { display: none; }

                /* 4. Footer */
                .footer-section {
                    flex-shrink: 0;
                    background: var(--Negro-suave);
                }
            </style>

            <div class="screen-container">
                
                <h1 class="main-title">${this.dict.t('dash_title')}</h1>

                <div class="selector-strip">
                    <select id="chart-selector" class="native-select">
                        <option value="evolucion-corporal">${this.dict.t('dash_opt_body')}</option>
<option value="evolucion-medidas">${this.dict.t('dash_opt_measures')}</option>
<option value="timeline-fotos">${this.dict.t('dash_opt_timeline')}</option>
<option disabled>──────────</option>
<option value="fuerza-especifica">${this.dict.t('dash_opt_strength_spec')}</option>
<option value="fuerza-global">${this.dict.t('dash_opt_strength_glob')}</option>
<option value="evolucion-tecnica">${this.dict.t('dash_opt_tech')}</option>
<option disabled>──────────</option>
<option value="radar-muscular">${this.dict.t('dash_opt_radar')}</option>
<option value="mapa-calor">${this.dict.t('dash_opt_heatmap')}</option>
<option disabled>──────────</option>
<option value="aerko-wrapped">${this.dict.t('dash_opt_wrapped')}</option>
                    </select>
                    
                    <div class="arrow-icon">
                        ${ICONS.ARROW_DOWN}
                    </div>
                </div>

                <main class="chart-container" id="switch-board"></main>

                <footer class="footer-section">
                    <app-nav></app-nav>
                </footer>
            </div>
        `;
    }

    _attachListeners() {
        const selector = this.querySelector('#chart-selector');
        selector.addEventListener('change', (e) => {
            this.currentChart = e.target.value;
            this.renderChart(this.currentChart);
        });
    }

    renderChart(chartId) {  
        const board = this.querySelector('#switch-board');
        board.innerHTML = ''; 

        let chartElement;

        switch(chartId) {
            case 'evolucion-corporal':
                chartElement = document.createElement('chart-body-evolution');
                break;
                
            case 'evolucion-medidas':
                chartElement = document.createElement('chart-measures-evolution');
                break;
                
            case 'timeline-fotos':
                chartElement = document.createElement('chart-timeline-fotos');
                break;
                
            case 'fuerza-especifica':
                chartElement = document.createElement('chart-specific-strength');
                break;
                
            case 'fuerza-global':
                chartElement = document.createElement('chart-global-strength');
                break;
                
            case 'evolucion-tecnica':
                chartElement = document.createElement('chart-lab-evolution');
                break;
            
            case 'radar-muscular':
                chartElement = document.createElement('chart-radar-muscle');
                break;
                
            case 'mapa-calor':
                chartElement = document.createElement('chart-diet-heatmap');
                break;

            case 'aerko-wrapped':
                chartElement = document.createElement('chart-aerko-wrapped');
                break;
            
            // 2. Si la palabra no coincide con ningún case, saltará esta alarma roja
            default:
                console.error(`🔴 [DASHBOARD ERROR] El ID "${chartId}" no existe en el switch.`);
        }

        if (chartElement) {
            chartElement.data = this.allData;
            board.appendChild(chartElement);
        }
    }
}

customElements.define('progress-dashboard', ProgressDashboard);