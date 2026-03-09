// src/modules/progress_graphics/components/chart-measures-evolution.js

import { ICONS } from '../../../core/theme/icons.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class ChartMeasuresEvolution extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartInstance = null;
        this._data = null;
        this.currentMeasure = 'waist';
        this.dict = null; // AÑADE ESTO (Preparado para guardar el diccionario)
        
        // MODIFICA EL MAPEO: Usa las keys de i18n
        this.measuresMap = {
            'neck': 'meas_map_neck',
            'shoulder': 'meas_map_shoulder',
            'chest': 'meas_map_chest',
            'arm_relaxed': 'meas_map_arm_rel',
            'arm_flexed': 'meas_map_arm_flex',
            'waist': 'meas_map_waist',
            'hip': 'meas_map_hip',
            'thigh': 'meas_map_thigh',
            'calf': 'meas_map_calf'
        };
    }

    set data(val) {
        this._data = val;
        if (this.isConnected) {
            this.renderChart();
        }
    }

    async connectedCallback() { // AÑADIR ASYNC
        // 1. CARGAMOS EL DICCIONARIO
        this.dict = await i18nService.loadPage('progress_graphics/chart-measures-evolution');
        
        // 2. AHORA SÍ PINTAMOS
        this.render();
        this._attachListeners();
        
        setTimeout(() => {
            if (this._data) this.renderChart();
        }, 0);
    }

    disconnectedCallback() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }

    render() {
        // Generamos las opciones del select dinámicamente
        const optionsHtml = Object.entries(this.measuresMap).map(([key, labelKey]) => {
    return `<option value="${key}" style="color: black;" ${key === this.currentMeasure ? 'selected' : ''}>${this.dict.t(labelKey)}</option>`;
}).join('');

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%; 
                    min-height: 350px;
                    gap: 16px;
                }

                /* --- CAJA DEL SELECTOR --- */
                .measure-selector-box {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 12px 16px;
                    box-sizing: border-box;
                    border: 1px solid var(--Blanco);
                    position: relative;
                }

                .native-select {
                    background: transparent;
                    border: none;
                    color: var(--Blanco);
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

                .arrow-icon {
                    position: absolute;
                    right: 16px;
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

                /* --- CONTENEDOR GRÁFICA --- */
                .chart-container {
                    position: relative;
                    flex: 1;
                    width: 100%;
                    min-height: 250px;
                }

                canvas {
                    width: 100% !important;
                    height: 100% !important;
                }
            </style>
            
            <div class="measure-selector-box">
                <select id="measure-select" class="native-select">
                    ${optionsHtml}
                </select>
                <div class="arrow-icon">
                    ${ICONS.ARROW_DOWN}
                </div>
            </div>

            <div class="chart-container">
                <canvas id="measuresChart"></canvas>
            </div>
        `;
    }

    _attachListeners() {
        const select = this.shadowRoot.querySelector('#measure-select');
        select.addEventListener('change', (e) => {
            this.currentMeasure = e.target.value;
            this.updateChartData(); // Actualizamos sin destruir la gráfica
        });
    }

    // Helper para extraer la data de la medida actual
    _getMeasureData() {
        const records = this._data?.progressRecords || [];
        const sortedRecords = [...records].reverse();
        
        // --- EXTRAEMOS LA UNIDAD DE MEDIDA PREFERIDA ---
        const profile = userService.getProfile();
        // Si no hay preferencia guardada, usamos 'CM' por defecto
        const measureUnit = profile.measureUnit || 'CM'; 
        
        return {
            labels: sortedRecords.map(r => {
                const date = new Date(r.timestamp);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            values: sortedRecords.map(r => {
                const val = r[this.currentMeasure];
                if (!val) return null;
                // Pasamos el valor puro por el filtro visual
                return unitService.toDisplay(val, measureUnit);
            }),
            unit: measureUnit // Guardamos la unidad para usarla en el tooltip luego
        };
    }

    // Se ejecuta al cambiar el selector
    updateChartData() {
        if (!this.chartInstance) return;

        const dataObj = this._getMeasureData();
        this.chartInstance.data.labels = dataObj.labels;
        this.chartInstance.data.datasets[0].data = dataObj.values;
        this.chartInstance.data.datasets[0].label = this.dict.t(this.measuresMap[this.currentMeasure]);
        
        // update() de Chart.js anima el cambio de forma nativa y elegante
        this.chartInstance.update(); 
    }

    renderChart() {
        if (typeof Chart === 'undefined') return;

        const canvas = this.shadowRoot.querySelector('#measuresChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (this.chartInstance) this.chartInstance.destroy();

        const dataObj = this._getMeasureData();

        const verdeAcido = '#CCFF00';
        const verdeTranslucido = 'rgba(204, 255, 0, 0.15)'; // El color del "relleno"
        const fontMono = '"JetBrains Mono", monospace';
        const gridSutil = 'rgba(255, 255, 255, 0.05)';

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataObj.labels,
                datasets: [{
                    label: this.dict.t(this.measuresMap[this.currentMeasure]),
                    data: dataObj.values,
                    borderColor: verdeAcido,
                    backgroundColor: verdeTranslucido,
                    fill: true, // ¡LA MAGIA DEL ÁREA!
                    tension: 0.4, 
                    borderWidth: 2,
                    pointRadius: 0, 
                    pointHoverRadius: 6, 
                    pointHoverBackgroundColor: '#1A1A1A',
                    pointHoverBorderColor: verdeAcido,
                    pointHoverBorderWidth: 2,
                    spanGaps: true // Puentea si hay datos nulos
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleFont: { family: fontMono, size: 12 },
                        bodyFont: { family: fontMono, size: 14, weight: 'bold' },
                        padding: 12,
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: false, // Quitamos el cuadradito de color porque solo hay 1 dato
                        callbacks: {
                            label: (context) => `${context.parsed.y} ${dataObj.unit}` // Adiós al "cm" fijo
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.5)',
                            font: { family: fontMono, size: 11 }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: gridSutil,
                            drawBorder: false,
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)', // Texto gris claro como en tu diseño
                            font: { family: fontMono, size: 11 }
                        }
                    }
                }
            }
        });
    }
}

customElements.define('chart-measures-evolution', ChartMeasuresEvolution);