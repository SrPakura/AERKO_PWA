// src/modules/progress_graphics/components/chart-radar-muscle.js

import { analysisService } from '../../training_core/services/analysis.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // Oye, esto del i18n quema, pero quema más saber que mis usuarios masoquistas disfrutarán del texto que provoca mi sufrimiento. Cuack

export class ChartRadarMuscle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartInstance = null;
        
        // El grupo activo por defecto
        this.currentGroup = 'torso'; 

        // Diccionario de grupos anatómicos con los IDs EXACTOS de tu muscles.json
        this.muscleGroups = {
            'torso': [
                'pectoralis_major', 
                'latissimus_dorsi', 
                'trapezius', 
                'deltoids_anterior', 
                'deltoids_lateral', 
                'deltoids_posterior', 
                'upper_back', 
                'serratus_anterior'
            ],
            'arms_core': [
                'biceps_brachii', 
                'triceps_brachii', 
                'brachialis', 
                'forearms', 
                'abdominals', 
                'erector_spinae'
            ],
            'legs': [
                'quadriceps_femoris', 
                'hamstrings', 
                'gluteal_group', 
                'calves', 
                'adductors', 
                'tibialis_anterior'
            ]
        };

        // Guardamos los datos en memoria para cambiar de pestaña rápido sin recargar
        this.rawReport = null;
        this.masterMuscles = [];
    }

    set data(val) {
        if (this.isConnected) {
            this.render();
            this.loadDataAndRender();
        }
    }

    async connectedCallback() { // 2. HACEMOS ASYNC
        // 3. CARGAMOS EL DICCIONARIO
        this.dict = await i18nService.loadPage('progress_graphics/chart-radar-muscle');
        
        if (!this.shadowRoot.innerHTML) {
            this.render();
        }
        this.loadDataAndRender();
    }

    disconnectedCallback() {
        if (this.chartInstance) this.chartInstance.destroy();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host { display: block; width: 100%; height: 100%; min-height: 450px; }

                .hero-section {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 24px 16px 16px 16px; border-bottom: none;
                }

                .hero-title {
                    color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 14px;
                    text-transform: uppercase; letter-spacing: 2px; opacity: 0.7; margin: 0 0 16px 0;
                }

                /* TABS BRUTALISTAS */
                .tab-bar {
                    display: flex; width: 100%; border: 1px solid var(--Blanco);
                }
                .tab-btn {
                    flex: 1; background: transparent; border: none; border-right: 1px solid var(--Blanco);
                    color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 12px;
                    padding: 12px 4px; cursor: pointer; text-transform: uppercase; transition: all 0.2s;
                    opacity: 0.5;
                }
                .tab-btn:last-child { border-right: none; }
                .tab-btn.active {
                    background: var(--Verde-acido); color: var(--Negro-suave); font-weight: bold; opacity: 1;
                }

                .chart-container { 
                    position: relative; width: 100%; height: 100%; min-height: 300px; 
                    display: flex; justify-content: center; align-items: center;
                    padding: 24px 0; box-sizing: border-box;
                }
                
                canvas { width: 100% !important; height: 100% !important; max-height: 350px; }

                .empty-state { padding: 40px 24px; text-align: center; width: 100%; }
                .empty-state p { color: var(--Blanco); font-family: 'JetBrains Mono', monospace; opacity: 0.6; }
                
                .loader { color: var(--Verde-acido); font-family: 'JetBrains Mono', monospace; font-size: 14px; text-transform: uppercase; animation: pulse 1.5s infinite; }
                @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            </style>
            
            <div class="hero-section">
                <h2 class="hero-title">${this.dict.t('radar_hero_title')}</h2>
                <div class="tab-bar">
                    <button class="tab-btn ${this.currentGroup === 'torso' ? 'active' : ''}" data-group="torso">${this.dict.t('radar_tab_torso')}</button>
                    <button class="tab-btn ${this.currentGroup === 'arms_core' ? 'active' : ''}" data-group="arms_core">${this.dict.t('radar_tab_arms')}</button>
                    <button class="tab-btn ${this.currentGroup === 'legs' ? 'active' : ''}" data-group="legs">${this.dict.t('radar_tab_legs')}</button>
                </div>
            </div>

            <div class="chart-container" id="radar-wrapper">
                <div class="loader">${this.dict.t('radar_lbl_loading')}</div>
            </div>
        `;

        // Listeners para las pestañas
        const tabs = this.shadowRoot.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Actualizamos UI de la pestaña
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Actualizamos estado y repintamos la gráfica (Sin recargar datos)
                this.currentGroup = e.target.getAttribute('data-group');
                this._renderChartForGroup();
            });
        });
    }

    async loadDataAndRender() {
        const wrapper = this.shadowRoot.querySelector('#radar-wrapper');
        if (!wrapper) return;

        const endDate = Date.now();
        const startDate = endDate - (30 * 24 * 60 * 60 * 1000);

        try {
            // 1. Descargamos la maestra
            const response = await fetch('/src/assets/data/muscles.json');
            this.masterMuscles = await response.json();

            // 2. Calculamos el volumen
            this.rawReport = await analysisService.calculateWeeklyVolume(startDate, endDate);

            if (!this.rawReport || (this.rawReport.alerts.length === 0 && this.rawReport.optimal.length === 0)) {
                // 5. EMPTY STATES SUSTITUIDOS
                wrapper.innerHTML = `<div class="empty-state"><p>${this.dict.t('radar_empty_p1')}<br>${this.dict.t('radar_empty_p2')}</p></div>`;
                return;
            }

            // 3. Preparamos el Canvas e inyectamos
            wrapper.innerHTML = '<canvas id="radarChart"></canvas>';
            
            // 4. Pintamos el grupo seleccionado
            this._renderChartForGroup();

        } catch (error) { 
            console.error('[RADAR] Error:', error);
            // 6. ERROR ESTADO SUSTITUIDO
            wrapper.innerHTML = `<div class="empty-state"><p>${this.dict.t('radar_err_p1')}</p></div>`;
        }
    }

    _renderChartForGroup() {
        const canvas = this.shadowRoot.querySelector('#radarChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // FILTRADO EDITADO: Usamos la lista de IDs permitidos para el grupo actual
        const allowedIds = this.muscleGroups[this.currentGroup];
        
        // Solo incluimos los músculos cuyo ID exacto esté en la lista permitida
        const groupMuscles = this.masterMuscles.filter(m => 
            allowedIds.includes(m.id)
        );

        // Cruzamos con el volumen entrenado
        const trainedMuscles = [...this.rawReport.alerts, ...this.rawReport.optimal];
        const labels = [];
        const data = [];

        groupMuscles.forEach(muscleDef => {
            // 7. ELIMINAMOS EL HARCODEO 'ES' Y USAMOS tData()
            labels.push(i18nService.tData(muscleDef.name)); 
            
            const trainedData = trainedMuscles.find(t => t.muscleId === muscleDef.id);
            data.push(trainedData ? trainedData.volume : 0);
        });

        if (this.chartInstance) this.chartInstance.destroy();

        const verdeAcido = '#CCFF00';
        const fontMono = '"JetBrains Mono", monospace';

        this.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    // 8. ETIQUETA DATASET
                    label: this.dict.t('radar_lbl_chart'),
                    data: data,
                    backgroundColor: 'rgba(204, 255, 0, 0.25)',
                    borderColor: verdeAcido,
                    pointBackgroundColor: verdeAcido,
                    pointBorderColor: '#1A1A1A',
                    pointBorderWidth: 1,
                    pointHoverBackgroundColor: '#FFF',
                    pointHoverBorderColor: verdeAcido,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleFont: { family: fontMono, size: 12 },
                        bodyFont: { family: fontMono, size: 14, weight: 'bold' },
                        padding: 12,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            // 9. TOOLTIP DINÁMICO
                            label: (context) => `${this.dict.t('radar_tt_vol')}${context.raw}${this.dict.t('radar_tt_vol_suffix')}`
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0, 
                        angleLines: { color: 'rgba(255, 255, 255, 0.08)' }, 
                        grid: { color: 'rgba(255, 255, 255, 0.08)' },      
                        pointLabels: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: { family: fontMono, size: 11 }
                        },
                        ticks: { display: false } 
                    }
                }
            }
        });
    }
}

customElements.define('chart-radar-muscle', ChartRadarMuscle);