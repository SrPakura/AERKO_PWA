// src/modules/progress_graphics/components/chart-lab-evolution.js

import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class ChartLabEvolution extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartInstance = null;
        this._data = null;
        
        this.validExercises = []; 
        this.currentExercise = null; 
        
        // Inicializamos vacío, se llenará cuando llegue el diccionario
        this.labExercisesMap = {};
    }

    set data(val) {
        this._data = val;
        
        // Si el diccionario ya está cargado, procesamos. Si no, el connectedCallback 
        // se encargará de llamar a render/renderChart cuando termine de cargar.
        if (this.dict) {
            this._processAvailableExercises();
            if (this.isConnected) {
                this.render();
                setTimeout(() => {
                    if (this.validExercises.length > 0) this.renderChart();
                }, 0);
            }
        }
    }

    _processAvailableExercises() {
        const history = this._data?.labHistory || [];
        if (history.length === 0) return;

        // Extraemos los ejercicios únicos que tienen historial en el Lab
        const uniqueExercises = [...new Set(history.map(r => r.exercise))];
        
        // Aquí this.labExercisesMap ya tiene los nombres traducidos (o debería)
        this.validExercises = uniqueExercises.map(ex => ({
            id: ex,
            name: this.labExercisesMap[ex] || ex
        }));

        if (this.validExercises.length > 0 && !this.currentExercise) {
            this.currentExercise = this.validExercises[0].id;
        }
    }

    async connectedCallback() {
        // Cargamos el idioma primero
        this.dict = await i18nService.loadPage('progress_graphics/chart-lab-evolution');
        
        // Construimos el mapa dinámico AHORA que tenemos las traducciones
        this.labExercisesMap = {
            'squat': this.dict.t('lab_map_squat'),
            'bench': this.dict.t('lab_map_bench'),
            'deadlift': this.dict.t('lab_map_deadlift')
        };

        // Si los datos llegaron mientas se descargaba el idioma, los procesamos ahora
        if (this._data) {
            this._processAvailableExercises();
        }

        if (!this.shadowRoot.innerHTML) {
            this.render();
        }
        
        setTimeout(() => {
            if (this.validExercises.length > 0) this.renderChart();
        }, 0);
    }

    disconnectedCallback() {
        if (this.chartInstance) this.chartInstance.destroy();
    }

    render() {
        if (!this.dict) return;
        
        if (this.validExercises.length === 0) {
            this.shadowRoot.innerHTML = `
                <style>
                    @import url('/src/core/theme/variables.css');
                    .empty-state { border: 1px dashed var(--gris-suave-hover); padding: 40px 24px; text-align: center; border-radius: 4px; }
                    .empty-state p { color: var(--Blanco); font-family: 'JetBrains Mono', monospace; opacity: 0.6; }
                </style>
                <div class="empty-state">
                    <p>${this.dict.t('lab_empty_p1')}<br>${this.dict.t('lab_empty_p2')}</p>
                </div>
            `;
            return;
        }

        const optionsHtml = this.validExercises.map(ex => {
            return `<option value="${ex.id}" style="color: black;" ${ex.id === this.currentExercise ? 'selected' : ''}>${ex.name}</option>`;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 350px; gap: 16px; }

                .exercise-selector-box {
                    display: flex; align-items: center; justify-content: space-between; width: 100%;
                    padding: 12px 16px; box-sizing: border-box; border: 1px solid var(--Blanco); position: relative;
                }
                .native-select {
                    background: transparent; border: none; color: var(--Blanco); font-family: 'JetBrains Mono', monospace;
                    font-size: 16px; padding: 0; margin: 0; outline: none; appearance: none; cursor: pointer; width: 100%; z-index: 2;
                }
                .arrow-icon { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--Blanco); z-index: 1; }
                .chart-container { position: relative; flex: 1; width: 100%; min-height: 250px; }
                canvas { width: 100% !important; height: 100% !important; }
            </style>
            
            <div class="exercise-selector-box">
                <select id="exercise-select" class="native-select">${optionsHtml}</select>
                <div class="arrow-icon">${ICONS.ARROW_DOWN}</div>
            </div>
            <div class="chart-container"><canvas id="labChart"></canvas></div>
        `;
        
        this.shadowRoot.querySelector('#exercise-select').addEventListener('change', (e) => {
            this.currentExercise = e.target.value;
            this.updateChartData(); 
        });
    }

    _getLabData() {
        const history = this._data?.labHistory || [];
        const filtered = history
            .filter(r => r.exercise === this.currentExercise)
            .sort((a, b) => a.timestamp - b.timestamp);

        return {
            labels: filtered.map(r => {
                const d = new Date(r.timestamp);
                return `${d.getDate()}/${d.getMonth() + 1}`;
            }),
            values: filtered.map(r => r.score)
        };
    }

    updateChartData() {
        if (!this.chartInstance) return;
        const dataObj = this._getLabData();
        const exInfo = this.validExercises.find(e => e.id === this.currentExercise);
        
        this.chartInstance.data.labels = dataObj.labels;
        this.chartInstance.data.datasets[0].data = dataObj.values;
        this.chartInstance.data.datasets[0].label = `${this.dict.t('lab_lbl_chart')}${exInfo ? exInfo.name : ''}`;
        this.chartInstance.update(); 
    }

    renderChart() {
        if (typeof Chart === 'undefined') return;

        const canvas = this.shadowRoot.querySelector('#labChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (this.chartInstance) this.chartInstance.destroy();

        const dataObj = this._getLabData();
        const exInfo = this.validExercises.find(e => e.id === this.currentExercise);

        const verdeAcido = '#CCFF00';
        const fontMono = '"JetBrains Mono", monospace';

        // Un gradiente azulado/cyan para diferenciar el entorno "Lab" de la fuerza bruta
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 229, 255, 0.3)'); 
        gradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataObj.labels,
                datasets: [{
                    label: `${this.dict.t('lab_lbl_chart')}${exInfo ? exInfo.name : ''}`,
                    data: dataObj.values,
                    borderColor: '#00E5FF', // Azul Cyan "Holográfico"
                    backgroundColor: gradient,
                    fill: true, 
                    tension: 0, // 0 = LÍNEAS RECTAS
                    borderWidth: 2,
                    pointRadius: 4, 
                    pointBackgroundColor: '#1A1A1A',
                    pointBorderColor: '#00E5FF',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8, 
                    pointHoverBackgroundColor: verdeAcido
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleFont: { family: fontMono, size: 12 },
                        bodyFont: { family: fontMono, size: 14, weight: 'bold' },
                        padding: 12,
                        borderColor: 'rgba(0, 229, 255, 0.3)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `${this.dict.t('lab_tt_score')}${context.parsed.y}${this.dict.t('lab_tt_score_suffix')}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { family: fontMono, size: 11 } }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,   // ANCLADO AL 0 ESTRICTO
                        max: 100, // ANCLADO AL 100 ESTRICTO
                        grid: { color: 'rgba(255, 255, 255, 0.1)', borderDash: [5, 5] }, // Rejilla punteada
                        ticks: {
                            color: '#00E5FF',
                            stepSize: 25, 
                            font: { family: fontMono, size: 11 }
                        }
                    }
                }
            }
        });
    }
}

customElements.define('chart-lab-evolution', ChartLabEvolution);