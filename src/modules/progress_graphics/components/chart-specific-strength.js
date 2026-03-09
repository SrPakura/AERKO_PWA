// src/modules/progress_graphics/components/chart-specific-strength.js

import { ICONS } from '../../../core/theme/icons.js';
import { oneRmService } from '../../training_core/services/1rm.service.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // 1. IMPORTAMOS EL SERVICIO

export class ChartSpecificStrength extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartInstance = null;
        this._data = null;
        
        this.validExercises = []; // Ejercicios con al menos 2 registros
        this.currentExerciseId = null; 
    }

    set data(val) {
        this._data = val;
        this._processAvailableExercises();
        if (this.isConnected) {
            this.render();
            setTimeout(() => {
                if (this.validExercises.length > 0) this.renderChart();
            }, 0);
        }
    }

    _processAvailableExercises() {
        if (!this._data || !this._data.trainingSessions) return;

        const sessions = this._data.trainingSessions;
        const exerciseCounts = {};

        // 1. Contamos en cuántas sesiones aparece cada ejercicio
        sessions.forEach(session => {
            session.exercises.forEach(ex => {
                if (!exerciseCounts[ex.id]) exerciseCounts[ex.id] = 0;
                exerciseCounts[ex.id]++;
            });
        });

        // 2. Filtramos los que tienen >= 2 sesiones para poder trazar una línea
        const masterExercises = this._data.masterExercises || [];
        
        this.validExercises = Object.keys(exerciseCounts)
            .filter(id => exerciseCounts[id] >= 2)
            .map(id => {
                const masterInfo = masterExercises.find(m => m.id === id);
                return {
                    id: id,
                    // 2. CORRECCIÓN HARDCODEO 'ES': Usamos tData para el nombre del ejercicio
                    name: masterInfo ? i18nService.tData(masterInfo.name) : id
                };
            });

        // Seleccionamos el primero por defecto si existe
        if (this.validExercises.length > 0 && !this.currentExerciseId) {
            this.currentExerciseId = this.validExercises[0].id;
        }
    }

    async connectedCallback() { // 3. AÑADIMOS ASYNC
        // 4. CARGAMOS EL DICCIONARIO
        this.dict = await i18nService.loadPage('progress_graphics/chart-specific-strength');

        if (!this.shadowRoot.innerHTML) {
            this.render();
            // (El render ya llama a this._attachListeners() por dentro)
        }
        
        // --- EL CABLE QUE FALTABA CONECTAR ---
        // Le damos 0ms al DOM para que el canvas exista físicamente y le ordenamos pintar
        setTimeout(() => {
            if (this.validExercises.length > 0) {
                this.renderChart();
            }
        }, 0);
    }

    disconnectedCallback() {
        if (this.chartInstance) this.chartInstance.destroy();
    }

    render() {
        if (this.validExercises.length === 0) {
            this.shadowRoot.innerHTML = `
                <style>
                    @import url('/src/core/theme/variables.css');
                    .empty-state {
                        border: 1px dashed var(--gris-suave-hover);
                        padding: 40px 24px;
                        text-align: center;
                        border-radius: 4px;
                    }
                    .empty-state p {
                        color: var(--Blanco);
                        font-family: 'JetBrains Mono', monospace;
                        opacity: 0.6;
                    }
                </style>
                <div class="empty-state">
                    <p>${this.dict.t('spec_empty_p1')}<br>${this.dict.t('spec_empty_p2')}</p>
                </div>
            `;
            return;
        }

        const optionsHtml = this.validExercises.map(ex => {
            return `<option value="${ex.id}" style="color: black;" ${ex.id === this.currentExerciseId ? 'selected' : ''}>${ex.name}</option>`;
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

                .exercise-selector-box {
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

                .chart-container {
                    position: relative;
                    flex: 1;
                    width: 100%;
                    min-height: 250px;
                }

                canvas { width: 100% !important; height: 100% !important; }
            </style>
            
            <div class="exercise-selector-box">
                <select id="exercise-select" class="native-select">
                    ${optionsHtml}
                </select>
                <div class="arrow-icon">${ICONS.ARROW_DOWN}</div>
            </div>

            <div class="chart-container">
                <canvas id="strengthChart"></canvas>
            </div>
        `;
        
        this._attachListeners();
    }

    _attachListeners() {
        const select = this.shadowRoot.querySelector('#exercise-select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.currentExerciseId = e.target.value;
                this.updateChartData(); 
            });
        }
    }

    _getStrengthData() {
        const sessions = this._data?.trainingSessions || [];
        const relevantSessions = sessions
            .filter(s => s.exercises.some(ex => ex.id === this.currentExerciseId))
            .sort((a, b) => a.timestamp - b.timestamp);

        const labels = [];
        const values = [];

        const profile = userService.getProfile();
        const weightUnit = profile.weightUnit || 'KG';

        relevantSessions.forEach(session => {
            const date = new Date(session.timestamp);
            labels.push(`${date.getDate()}/${date.getMonth() + 1}`);

            const exData = session.exercises.find(ex => ex.id === this.currentExerciseId);
            
            let max1RM = 0;
            if (exData && exData.sets) {
                exData.sets.forEach(set => {
                    const e1RM = oneRmService.calculate1RM(set.kg, set.reps);
                    if (e1RM > max1RM) max1RM = e1RM;
                });
            }
            
            const baseRounded = Math.round(max1RM * 10) / 10;
            values.push(unitService.toDisplay(baseRounded, weightUnit));
        });

        return { labels, values, unit: weightUnit };
    }

    updateChartData() {
        if (!this.chartInstance) return;
        const dataObj = this._getStrengthData();
        
        const exInfo = this.validExercises.find(e => e.id === this.currentExerciseId);
        
        this.chartInstance.data.labels = dataObj.labels;
        this.chartInstance.data.datasets[0].data = dataObj.values;
        // 6. SUSTITUIMOS FALLBACK LABEL
        this.chartInstance.data.datasets[0].label = exInfo ? exInfo.name : this.dict.t('spec_lbl_chart_fallback');
        
        this.chartInstance.update(); 
    }

    renderChart() {
        if (typeof Chart === 'undefined') return;

        const canvas = this.shadowRoot.querySelector('#strengthChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (this.chartInstance) this.chartInstance.destroy();

        const dataObj = this._getStrengthData();
        const exInfo = this.validExercises.find(e => e.id === this.currentExerciseId);

        const verdeAcido = '#CCFF00';
        const verdeTranslucido = 'rgba(204, 255, 0, 0.15)'; 
        const fontMono = '"JetBrains Mono", monospace';
        const gridSutil = 'rgba(255, 255, 255, 0.1)';
        
        // Ey, esto está muy aburrido. ¿Alguna vez he comentado que por está app me van a pagar entre 0 euros y 5 denuncias?

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dataObj.labels,
                datasets: [{
                    // 7. SUSTITUIMOS FALLBACK LABEL EN RENDER
                    label: exInfo ? exInfo.name : this.dict.t('spec_lbl_chart_fallback'),
                    data: dataObj.values,
                    borderColor: verdeAcido,
                    backgroundColor: verdeTranslucido,
                    fill: true, 
                    tension: 0.4, 
                    borderWidth: 2,
                    pointRadius: 0, 
                    pointHoverRadius: 6, 
                    pointHoverBackgroundColor: '#1A1A1A',
                    pointHoverBorderColor: verdeAcido,
                    pointHoverBorderWidth: 2
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
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            // 8. TOOLTIP DINÁMICO
                            label: (context) => `${this.dict.t('spec_tt_e1rm')}${context.parsed.y} ${dataObj.unit}`
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
                        grid: { color: gridSutil, drawBorder: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            font: { family: fontMono, size: 11 }
                        }
                    }
                }
            }
        });
    }
}

customElements.define('chart-specific-strength', ChartSpecificStrength);