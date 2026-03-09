import { trainingStore } from '../../training_core/store/index.js';
import { sessionService } from '../../training_core/services/session.service.js';
import { trainingService } from '../../training_core/services/training.service.js';
import { router } from '../../../core/router/index.js';

import { analysisService } from '../../training_core/services/analysis.service.js';
import { ICONS } from '../../../core/theme/icons.js';

import { i18nService } from '../../../core/i18n/i18n.service.js';

// Componentes
import '../components/routine-row.js'; 
import '../../system/components/navbar.js'; // Importamos la navbar para el footer

export class TrainingSessionSelector extends HTMLElement {
    constructor() {
        super();
        // Usamos Light DOM para mantener coherencia de estilos globales por ahora
        // Si prefieres Shadow DOM como en el planner, descomenta:
        // this.attachShadow({ mode: 'open' }); 
    }

    async connectedCallback() {
        // Aseguramos que el store esté listo
        await trainingService.init();
        
        // 1. Cargamos el diccionario de esta pantalla
        const dict = await i18nService.loadPage('training_flow/session-selector');
        this.t = dict.t; // Guardamos la función t() para usarla fácil
        
        this.render();
        this._attachListeners();
    }

     /**
     * Lógica de pintado de la tarjeta del mesociclo (4 semanas exactas + Lápiz)
     */
    _getMesocycleHTML() {
        const mesocycle = trainingStore.state.mesocycle || null;

        // ESTADO VACÍO
        if (!mesocycle) {
            return `
                <div class="weekly-card empty-state" id="btn-config-meso">
                    <span class="action-link">${this.t('selector_btn_config_meso')}</span>
                </div>
            `;
        }

        // ESTADO ACTIVO
        const currentWeek = mesocycle.currentWeek || 1;
        const totalWeeks = mesocycle.totalWeeks || 4;
        let linesHtml = '';

        // Siempre iteramos 4 veces para tener 4 "slots" fijos en altura
        for (let i = 0; i < 4; i++) {
            const weekIndex = currentWeek + i;
            
            // Si la semana que toca pintar supera el total del mesociclo, pintamos un hueco vacío
            if (weekIndex > totalWeeks) {
                linesHtml += `<div class="meso-line empty-line"></div>`;
                continue;
            }

            // Calculamos RIR y Fase
            const rir = analysisService.getTargetRIR(weekIndex, totalWeeks);
            let phase = this.t('selector_meso_phase_load');
            if (rir === 4) phase = this.t('selector_meso_phase_deload');
            if (rir === 0) phase = this.t('selector_meso_phase_peak');

            const isCurrent = (i === 0);
            const activeClass = isCurrent ? 'current' : '';
            // Usamos espacios duros para alinear perfectamente el texto debajo del ">"
            const prefix = isCurrent ? '> ' : '&nbsp;&nbsp;';

            // AQUÍ METEMOS LA FRASE MAESTRA INYECTADA:
            const weekInfo = this.t('selector_meso_week_info', { 
                week: weekIndex, 
                phase: phase, 
                rir: rir 
            });

            linesHtml += `<div class="meso-line ${activeClass}">${prefix}${weekInfo}</div>`;
        }

        // Devolvemos el HTML con Flexbox (Izquierda los textos, Derecha el Lápiz)
        return `
            <div class="weekly-card">
                <div class="weekly-text">
                    ${linesHtml}
                </div>
                <div class="edit-icon-wrapper" id="btn-edit-meso">
                    ${ICONS.EDIT}
                </div>
            </div>
        `;
    }

    render() {
        const routines = trainingStore.getRoutines();
        const mesocycleCard = this._getMesocycleHTML();

        // Generamos la lista de rutinas
        const routinesHtml = routines.length > 0 
            ? routines.map(r => `
                <app-routine-row 
                    name="${r.name}" 
                    data-id="${r.id}">
                </app-routine-row>
              `).join('')
            : `<div class="no-routines">${this.t('selector_empty_routines')}</div>`;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                /* ESTRUCTURA PRINCIPAL (Igual que Planner) */
                training-session-selector {
                    display: block;
                    width: 100%;
                    height: 100dvh;
                    background-color: var(--Negro-suave);
                    overflow: hidden; 
                }

                .main-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100%;
                    margin: 0 auto;
                }

                /* 1. HEADER (Fijo) */
                .header-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: calc(env(safe-area-inset-top) + 16px) 24px 24px 24px;
                    border-bottom: 1px solid var(--Blanco);
                    background: var(--Negro-suave);
                    flex-shrink: 0;
                    z-index: 10;
                }

                .main-title {
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 40px;
                    font-weight: 700;
                    line-height: 110%;
                    letter-spacing: -0.4px;
                    margin: 0;
                }

                /* TARJETA MESOCICLO (Flexbox Responsive) */
                .weekly-card {
                    display: flex;
                    padding: 12px;
                    justify-content: space-between; /* Texto a la izq, Lápiz a la der */
                    align-items: center; /* Centrado vertical */
                    border: 1px solid var(--Blanco);
                    min-height: 104px; /* Asegura altura mínima para 4 líneas */
                    gap: 16px; /* Separación fluida entre texto y lápiz */
                }

                .weekly-card.empty-state {
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0.8;
                }

                .weekly-text {
                    display: flex;
                    flex-direction: column;
                    gap: 8px; /* El gap nativo en vez de los 131px absolutos */
                    flex: 1; /* Ocupa todo el espacio disponible empujando al lápiz */
                }

                .meso-line {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    line-height: 100%;
                    text-align: left;
                }

                .meso-line.current {
                    color: var(--Verde-acido);
                }

                .meso-line.empty-line {
                    height: 14px; /* Ocupa el mismo alto que una línea de texto para que no colapse */
                }

                /* Contenedor del Lápiz */
                .edit-icon-wrapper {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    flex-shrink: 0; /* Evita que el texto lo aplaste */
                }

                .edit-icon-wrapper svg {
                    width: 18px;
                    height: 18px;
                    fill: var(--Blanco);
                    transition: fill 0.2s ease;
                }

                .edit-icon-wrapper:active svg {
                    fill: var(--Verde-acido);
                }

                .action-link {
                    text-decoration: underline;
                    text-decoration-color: var(--Verde-acido);
                    text-underline-offset: 4px;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    color: var(--Blanco);
                }
                .empty-state:hover .action-link { color: var(--Verde-acido); }

                /* 2. CONTENIDO (Scrollable) */
                .main-content {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    padding: 24px;
                    flex: 1; 
                    overflow-y: auto;
                    scrollbar-width: none;
                    
                    /* Táctica "Dedo Gordo": Alineamos al fondo si hay pocas */
                    justify-content: flex-end; 
                }
                .main-content::-webkit-scrollbar { display: none; }

                .no-routines {
                    color: var(--Blanco);
                    text-align: center;
                    opacity: 0.5;
                    margin-bottom: auto; 
                    margin-top: 24px;
                    font-family: "JetBrains Mono";
                }

                /* 3. FOOTER (Navbar Fijo) */
                .footer-section {
                    flex-shrink: 0;
                    width: 100%;
                    z-index: 100;
                }
            </style>

            <div class="main-container">
                
                <header class="header-section">
                    <h1 class="main-title">${this.t('selector_title')}</h1>
                    ${mesocycleCard} 
                </header>

                <main class="main-content">
                    ${routinesHtml}
                </main>

                <footer class="footer-section">
                    <app-nav></app-nav>
                </footer>

            </div>
        `;
    }

    _attachListeners() {
        // A. Click en Rutinas (Delegación o directo)
        const rows = this.querySelectorAll('app-routine-row');
        rows.forEach(row => {
            row.addEventListener('click', async () => {
                const routineId = row.getAttribute('data-id');
                
                // Feedback visual básico (opcional)
                row.style.opacity = '0.5';

                try {
                    // 1. Arrancar motor
                    await sessionService.startSession(routineId);
                    
                    // 2. Navegar a la pantalla de sesión activa
                    router.navigate('/training/session'); 
                } catch (error) {
                    console.error("Error al iniciar sesión:", error);
                    row.style.opacity = '1'; // Restaurar si falla
                    alert(this.t('selector_err_start'));
                }
            });
        });

        // B. Click en Configurar Mesociclo (Lápiz o Estado Vacío)
        const btnConfig = this.querySelector('#btn-config-meso');
        const btnEdit = this.querySelector('#btn-edit-meso');

        // Función flecha guardada para no repetir código
        const goConfig = () => {
            router.navigate('/training/analysis/mesocycle');
        };

        // Si existe el texto central, le ponemos el click
        if (btnConfig) {
            btnConfig.addEventListener('click', goConfig);
        }

        // Si existe el icono del lápiz, le ponemos el click
        if (btnEdit) {
            btnEdit.addEventListener('click', goConfig);
        }
    }
}

// Importante: Definir el componente para que Router lo pueda instanciar
customElements.define('training-session-selector', TrainingSessionSelector);