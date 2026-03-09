// src/modules/progress_graphics/components/chart-diet-heatmap.js

import { db } from '../../../core/db/index.js';
import { nutritionStore } from '../../nutrition_core/store/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class ChartDietHeatmap extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        this.dict = await i18nService.loadPage('progress_graphics/chart-diet-heatmap');
        this.render();
        this.loadAndRenderHeatmap();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                
                :host { 
                    display: flex; 
                    flex-direction: column;
                    width: 100%; 
                    height: 100%;
                    min-height: 450px;
                    font-family: "JetBrains Mono", monospace; 
                    color: var(--Blanco, #FFFFFF); 
                    box-sizing: border-box;
                }
                
                /* HERO SECTION: Estética Brutalista */
                .hero {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 32px 16px;
                    margin-bottom: 24px;
                }

                .hero-label {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                }

                .hero-percentage {
                    font-family: 'Clash Display', sans-serif;
                    font-size: 96px;
                    font-weight: 700;
                    color: var(--Verde-acido, #CCFF00);
                    line-height: 0.9;
                    letter-spacing: -2px;
                    margin: 0;
                }

                /* GRID CONTENEDOR INFINITO */
                .heatmap-wrapper {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    flex: 1;
                    overflow-y: auto;
                    scrollbar-width: none; /* Oculta scroll en Firefox */
                    padding-bottom: 40px; /* Para que la última no pegue con el navbar */
                }
                .heatmap-wrapper::-webkit-scrollbar { display: none; /* Oculta scroll Chrome */ }

                .grid-inner {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                /* CABECERA (L M X J V S D) */
                .header-row {
                    display: flex;
                    gap: 12px;
                    margin-left: 72px; /* Margen para salvar la etiqueta 'Sem X' */
                    margin-bottom: 8px;
                }

                .day-label {
                    width: 28px;
                    text-align: center;
                    font-size: 14px;
                    color: var(--Blanco);
                }

                /* FILAS DE SEMANAS */
                .week-row {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                }

                .week-label {
                    width: 60px;
                    font-size: 14px;
                    color: var(--Blanco);
                    text-align: right;
                }

                /* LOS DÍAS (CUADRADOS) */
                .day-square {
                    width: 28px;
                    height: 28px;
                    border-radius: 2px;
                    transition: transform 0.1s ease;
                    cursor: help;
                    box-sizing: border-box;
                }

                .day-square:hover {
                    transform: scale(1.15);
                }

                /* CÓDIGO DE COLORES */
                .day-square.perfect { background: var(--Verde-acido, #CCFF00); }
                .day-square.close   { background: var(--verde-lima-hover, #DFFF4F); }
                .day-square.off     { background: #FF7E4F; }
                .day-square.empty   { 
                    background: transparent; 
                    border: 1px dashed var(--gris-suave-hover, #2F2F2F); 
                }

                .loading { text-align: center; opacity: 0.5; margin-top: 40px; }
            </style>
            
            <div class="hero" id="hero-section">
                <div class="hero-label">${this.dict.t('heat_lbl_hero')}</div>
                <div class="hero-percentage" id="percentage-ui">--%</div>
            </div>
            
            <div class="heatmap-wrapper" id="heatmap-container">
                <div class="loading">${this.dict.t('heat_lbl_loading')}</div>
            </div>
        `;
    }

    async loadAndRenderHeatmap() {
        const container = this.shadowRoot.querySelector('#heatmap-container');
        const percentageUi = this.shadowRoot.querySelector('#percentage-ui');

        try {
            // 1. Obtenemos el objetivo Global como Fallback
            const globalGoal = nutritionStore.getDietGoal();
            const globalTarget = globalGoal?.targetKcal || 2000;
            const globalMin = globalGoal?.minKcal || Math.round(globalTarget * 0.95);
            const globalMax = globalGoal?.maxKcal || Math.round(globalTarget * 1.05);

            // 2. Traemos todos los registros de la DB
            const allDocs = await db.getAll('nutrition_vault');
            const logs = allDocs.filter(doc => doc.id && doc.id.startsWith('log_'));

            // 3. Agrupamos por Día e inyectamos los "Snapshots"
            const dailyData = {};
            let oldestTimestamp = Infinity;
            let oldestDateStr = null;

            logs.forEach(log => {
                const parts = log.date.split('_'); // [DD, MM, YYYY]
                if (parts.length === 3) {
                    const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    
                    if (!dailyData[isoDate]) {
                        dailyData[isoDate] = { kcal: 0, target: null, min: null, max: null };
                    }
                    
                    dailyData[isoDate].kcal += (log.totals?.k || 0);

                    // Si este registro tiene una foto fija del objetivo en su época, la usamos
                    if (log.goalSnapshot && !dailyData[isoDate].target) {
                        dailyData[isoDate].target = log.goalSnapshot.targetKcal;
                        dailyData[isoDate].min = log.goalSnapshot.minKcal;
                        dailyData[isoDate].max = log.goalSnapshot.maxKcal;
                    }

                    const ts = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
                    if (ts < oldestTimestamp) {
                        oldestTimestamp = ts;
                        oldestDateStr = isoDate;
                    }
                }
            });

            // 4. Lógica de Fechas
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let startDate = new Date(today);
            if (oldestDateStr) {
                const [y, m, d] = oldestDateStr.split('-');
                startDate = new Date(y, parseInt(m) - 1, d);
            } else {
                startDate.setDate(startDate.getDate() - 28); // 4 Semanas de "cáscara" si está vacío
            }

            // Alinear al Lunes
            const startDayOfWeek = startDate.getDay();
            const diffToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
            startDate.setDate(startDate.getDate() + diffToMonday);

            // Alinear al Domingo
            let endDate = new Date(today);
            const endDayOfWeek = endDate.getDay();
            const diffToSunday = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
            endDate.setDate(endDate.getDate() + diffToSunday);

            // 5. Motor de Renderizado y GAMIFICACIÓN
            let html = '<div class="grid-inner">';
            html += `
                <div class="header-row">
                    <div class="day-label">${this.dict.t('heat_lbl_day_l')}</div><div class="day-label">${this.dict.t('heat_lbl_day_m')}</div>
                    <div class="day-label">${this.dict.t('heat_lbl_day_x')}</div><div class="day-label">${this.dict.t('heat_lbl_day_j')}</div>
                    <div class="day-label">${this.dict.t('heat_lbl_day_v')}</div><div class="day-label">${this.dict.t('heat_lbl_day_s')}</div>
                    <div class="day-label">${this.dict.t('heat_lbl_day_d')}</div>
                </div>
            `;

            let currentDate = new Date(startDate);
            let weekNumber = 1;
            
            let totalPoints = 0;
            let totalDays = 0; // El denominador de nuestra fórmula

            while (currentDate <= endDate) {
                html += `<div class="week-row"><div class="week-label">${this.dict.t('heat_lbl_week')}${weekNumber}</div>`;
                
                for (let i = 0; i < 7; i++) {
                    const y = currentDate.getFullYear();
                    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const d = String(currentDate.getDate()).padStart(2, '0');
                    const isoStr = `${y}-${m}-${d}`;
                    const displayDate = `${d}/${m}/${y}`;
                    
                    const data = dailyData[isoStr] || { kcal: 0 };
                    const kcal = data.kcal;

                    // Asignamos reglas: El Snapshot Histórico, o el Global actual si no existe
                    let target = data.target || globalTarget;
                    let min = data.min || globalMin;
                    let max = data.max || globalMax;

                    // Salvavidas por si la dieta custom no tenía min/max
                    if (!data.min && target) {
                        min = Math.round(target * 0.95);
                        max = Math.round(target * 1.05);
                    }

                    let statusClass = 'empty';
                    let points = 0;
                    let tooltipText = this.dict.t('heat_tt_empty');

                    if (kcal > 0) {
                        // REGLA 1: Idóneo (Verde Ácido) -> 1 pto
                        if (kcal >= min && kcal <= max) {
                            statusClass = 'perfect';
                            points = 1;
                            tooltipText = `${kcal}${this.dict.t('heat_tt_perfect')}`;
                        } 
                        // REGLA 2: Margen del ±10% (Verde Lima) -> 0.6 ptos
                        else if (kcal >= (target * 0.90) && kcal <= (target * 1.10)) {
                            statusClass = 'close';
                            points = 0.6;
                            tooltipText = `${kcal}${this.dict.t('heat_tt_close')}`;
                        } 
                        // REGLA 3: Desviado (Naranja) -> 0.2 ptos
                        else {
                            statusClass = 'off';
                            points = 0.2;
                            tooltipText = `${kcal}${this.dict.t('heat_tt_off')}`;
                        }
                    } else if (currentDate > today) {
                        tooltipText = this.dict.t('heat_tt_future');
                    }

                    // Sumamos para el porcentaje final (todos los días del grid suman al denominador)
                    totalPoints += points;
                    totalDays++;

                    const titleAttr = `title="${displayDate}: ${tooltipText}"`;
                    html += `<div class="day-square ${statusClass}" ${titleAttr}></div>`;
                    
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                html += `</div>`;
                weekNumber++;
            }
            html += '</div>';

            // 6. Cálculo Final: Puntos conseguidos / Puntos posibles
            const finalPercentage = totalDays > 0 ? Math.round((totalPoints / totalDays) * 100) : 0;
            
            // 7. Inyectamos en el DOM
            percentageUi.innerText = `${finalPercentage}%`;
            container.innerHTML = html;

            // Scroll automático hasta abajo (para ver la semana actual)
            setTimeout(() => {
                container.scrollTop = container.scrollHeight;
            }, 100);

        } catch (error) {
            console.error('🔴 [HEATMAP ERROR CRÍTICO]', error);
            container.innerHTML = `<div style="color: #FF7E4F; padding: 16px;">${this.dict.t('heat_err_ui')}${error.message}</div>`;
        }
    }
}

if (!customElements.get('chart-diet-heatmap')) {
    customElements.define('chart-diet-heatmap', ChartDietHeatmap);
}