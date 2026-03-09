// src/modules/progress_graphics/components/chart-global-strength.js

import { oneRmService } from '../../training_core/services/1rm.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class ChartGlobalStrength extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.chartInstance = null;
        this._data = null;
        
        this.globalStats = {
            currentIncrease: 0,
            chartLabels: [],
            chartData: []
        };
    }

    set data(val) {
        this._data = val;
        this._calculateGlobalProgress();
        if (this.isConnected) {
            this.render();
            setTimeout(() => {
                if (this.globalStats.chartData.length > 0) this.renderChart();
            }, 0);
        }
    }

    async connectedCallback() {
        // 1. Cargamos el diccionario
        this.dict = await i18nService.loadPage('progress_graphics/chart-global-strength');
        
        // 2. Renderizamos si no está ya renderizado
        if (!this.shadowRoot.innerHTML) {
            this.render();
        }
        
        // EL FIX: Si entra en el DOM y ya tiene datos, ordenamos pintar el canvas sí o sí.
        setTimeout(() => {
            if (this.globalStats.chartData.length > 0) this.renderChart();
        }, 0);
    }

    disconnectedCallback() {
        if (this.chartInstance) this.chartInstance.destroy();
    }

    // EL MOTOR MATEMÁTICO
    _calculateGlobalProgress() {
        const sessions = this._data?.trainingSessions || [];
        if (sessions.length === 0) return;

        const sortedSessions = [...sessions].sort((a, b) => a.timestamp - b.timestamp);

        const baselineMaxes = {}; 
        const currentMaxes = {};  
        
        const labels = [];
        const progressionData = [];

        sortedSessions.forEach(session => {
            const date = new Date(session.timestamp);
            const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
            
            session.exercises.forEach(ex => {
                if (!ex.sets || ex.sets.length === 0) return;

                let maxSession1RM = 0;
                ex.sets.forEach(set => {
                    const e1rm = oneRmService.calculate1RM(set.kg, set.reps);
                    if (e1rm > maxSession1RM) maxSession1RM = e1rm;
                });

                if (!baselineMaxes[ex.id]) {
                    baselineMaxes[ex.id] = maxSession1RM;
                    currentMaxes[ex.id] = maxSession1RM;
                } 
                else if (maxSession1RM > currentMaxes[ex.id]) {
                    currentMaxes[ex.id] = maxSession1RM;
                }
            });

            const exercisesTracked = Object.keys(baselineMaxes);
            if (exercisesTracked.length > 0) {
                let totalImprovement = 0;
                
                exercisesTracked.forEach(id => {
                    const base = baselineMaxes[id];
                    const current = currentMaxes[id];
                    if (base > 0) {
                        const percentIncrease = ((current - base) / base) * 100;
                        totalImprovement += percentIncrease;
                    }
                });

                const averageImprovement = totalImprovement / exercisesTracked.length;
                
                labels.push(dateStr);
                progressionData.push(Math.round(averageImprovement * 10) / 10);
            }
        });

        this.globalStats.chartLabels = labels;
        this.globalStats.chartData = progressionData;
        this.globalStats.currentIncrease = progressionData.length > 0 ? progressionData[progressionData.length - 1] : 0;
    }

    render() {
        if (!this.dict) return;
        
        const hasData = this.globalStats.chartData.length > 0;
        const increase = this.globalStats.currentIncrease;
        
        // Lógica dinámica para textos y signos
        const isPositive = increase >= 0;
        const sign = isPositive ? '+' : '';
        const heroTitle = isPositive ? this.dict.t('glob_title_pos') : this.dict.t('glob_title_neg');

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%; 
                    min-height: 400px;
                }

                .hero-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 16px;
                }

                .hero-title {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    opacity: 0.7;
                    margin: 0 0 8px 0;
                }

                .hero-number {
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 80px;
                    font-weight: 700;
                    line-height: 100%;
                    margin: 0;
                }

                .chart-container {
                    position: relative;
                    flex: 1;
                    width: 100%;
                    min-height: 250px;
                    padding: 0 8px;
                    box-sizing: border-box;
                }

                canvas { width: 100% !important; height: 100% !important; }

                .empty-state {
                    border: 1px dashed var(--gris-suave-hover);
                    padding: 40px 24px;
                    text-align: center;
                    border-radius: 4px;
                    margin-top: 16px;
                }
                .empty-state p {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    opacity: 0.6;
                }
            </style>
            
            ${hasData ? `
                <div class="hero-section">
                    <h2 class="hero-title">${heroTitle}</h2>
                    <h1 class="hero-number">${sign}${increase}%</h1>
                </div>
                <div class="chart-container">
                    <canvas id="globalChart"></canvas>
                </div>
            ` : `
                <div class="empty-state">
                    <p>${this.dict.t('glob_empty_p1')}<br>${this.dict.t('glob_empty_p2')}</p>
                </div>
            `}
        `;
    }

    renderChart() {
        if (typeof Chart === 'undefined') return;

        const canvas = this.shadowRoot.querySelector('#globalChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (this.chartInstance) this.chartInstance.destroy();

        const verdeAcido = '#CCFF00';
        const fontMono = '"JetBrains Mono", monospace';

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(204, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(204, 255, 0, 0.0)');

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.globalStats.chartLabels,
                datasets: [{
                    label: this.dict.t('glob_lbl_chart'),
                    data: this.globalStats.chartData,
                    borderColor: verdeAcido,
                    backgroundColor: gradient,
                    fill: true, 
                    tension: 0.3, 
                    borderWidth: 2,
                    pointRadius: 4, 
                    pointBackgroundColor: '#1A1A1A',
                    pointBorderColor: verdeAcido,
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
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                const val = context.parsed.y;
                                // Lógica dinámica para el prefijo del tooltip
                                const prefix = val >= 0 ? this.dict.t('glob_tt_pos') : this.dict.t('glob_tt_neg');
                                return `${prefix}${val}%`;
                            }
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
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            color: verdeAcido,
                            font: { family: fontMono, size: 11 },
                            callback: function(value) { return (value >= 0 ? '+' : '') + value + '%'; }
                        }
                    }
                }
            }
        });
    }
}

customElements.define('chart-global-strength', ChartGlobalStrength);