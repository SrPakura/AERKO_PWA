// src/modules/training_planner/views/planner.js

import { router } from '../../../core/router/index.js';
import { trainingStore } from '../../training_core/store/index.js';
import { trainingService } from '../../training_core/services/training.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Importamos componentes necesarios
import '../components/routine-card.js';
import '../../system/components/navbar.js';

export class TrainingPlannerView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.dict = null;
    }

    async connectedCallback() {
        // Aseguramos que el core de entrenamiento esté cargado
        await trainingService.init();
        
        this.dict = await i18nService.loadPage('training_planner/planner');
        
        this.render();
    }

    render() {
        // 1. Obtener datos reales
        const routines = trainingStore.getRoutines();

        // 2. Generar HTML de las tarjetas
        // Si no hay rutinas, no pintamos nada (solo saldrá el botón de añadir abajo)
        const cardsHtml = routines.map(routine => {
            // Creamos el elemento programáticamente o como string
            // Como string es más rápido para listas largas
            return `
                <training-routine-card
                    id="${routine.id}"
                    title="${routine.name}"
                    count="${routine.exercises ? routine.exercises.length : 0}"
                    last-performed="${routine.lastPerformed || ''}"
                ></training-routine-card>
            `;
        }).join('');

        // 3. Template Principal (Tu HTML adaptado)
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                @import url('/src/core/theme/main.css'); /* <--- AÑADE ESTA LÍNEA */

                :host {
                    display: block;
                    width: 100%;
                    height: 100dvh;
                    background-color: var(--Negro-suave);
                    overflow: hidden; /* El host no scrollea, scrollea el main */
                }

                /* Contenedor Principal */
                .main-container {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 480px;
                    height: 100%;
                    margin: 0 auto;
                    background: var(--Negro-suave);
                }

                /* HEADER (Fijo) */
                .header-section {
                    display: flex;
                    width: 100%;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 16px;
                    border-bottom: 1px solid var(--Blanco);
                    background: var(--Negro-suave);
                    z-index: 10;
                    flex-shrink: 0;
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

                /* CONTENIDO (Scrollable) */
                .main-content {
                    display: flex;
                    flex-direction: column;
                    padding: 24px; /* Padding general */
                    gap: 16px;     /* Espacio entre tarjetas */
                    
                    flex: 1;       /* Ocupa el resto */
                    overflow-y: auto;
                    
                    /* Ocultar scrollbar estética */
                    scrollbar-width: none;
                }
                .main-content::-webkit-scrollbar { display: none; }

                /* BOTÓN AÑADIR (Al final de la lista) */
                .btn-add-rutina {
                    display: flex;
                    width: 100%;
                    padding: 16px;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    cursor: pointer;
                    flex-shrink: 0;
                    
                    transition: all 0.2s ease;
                    margin-top: 8px; /* Un pelín de aire extra antes del botón */
                }

                .btn-add-rutina:active {
                    background: rgba(255, 255, 255, 0.1);
                }

                .btn-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace !important; /* <--- LA SOLUCIÓN */
                    font-size: 14px;
                    font-weight: 400;
                    line-height: 140%;
                    text-transform: uppercase;
                }

                /* FOOTER (Navbar Fijo) */
                .footer-section {
                    flex-shrink: 0;
                    width: 100%;
                    z-index: 100;
                }
                
                /* Estado Vacio (Mensaje opcional si no hay rutinas) */
                .empty-state {
                    color: var(--Blanco);
                    opacity: 0.5;
                    font-family: "JetBrains Mono";
                    font-size: 14px;
                    text-align: center;
                    margin-top: 40px;
                    margin-bottom: 20px;
                }
            </style>

            <div class="main-container">
                
                <header class="header-section">
                    <h1 class="main-title">${this.dict.t('header_title')}</h1>
                </header>

                <main class="main-content" id="routines-list">
                    ${routines.length === 0 ? 
                        `<div class="empty-state">${this.dict.t('empty_routines')}</div>` 
                        : cardsHtml}
                    
                    <button class="btn-add-rutina" id="btn-add">
                        <span class="btn-text">${this.dict.t('btn_add_routine')}</span>
                    </button>
                </main>

                <footer class="footer-section">
                    <app-nav></app-nav>
                </footer>

            </div>
        `;

        this._attachListeners();
    }

    _attachListeners() {
        const list = this.shadowRoot.getElementById('routines-list');
        const btnAdd = this.shadowRoot.getElementById('btn-add');

        // 1. Navegación a Crear Rutina (NUEVA)
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                // Sin ID = Modo Creación
                router.navigate('/training/planner/routine/create'); 
            });
        }

        // 2. Delegación de Eventos para las Tarjetas
        if (list) {
            
            // A. PLAY (Entrenar)
            list.addEventListener('play', (e) => {
                const id = e.detail.id;
                console.log('[PLANNER] Starting routine:', id);
                // router.navigate(`/training/session/${id}`); // Futuro
            });

            // B. EDIT (Editar) -> AQUÍ ESTÁ EL CAMBIO CLAVE
            list.addEventListener('edit', (e) => {
                const id = e.detail.id;
                console.log('[PLANNER] Editing routine:', id);
                
                // Redirigimos a la pantalla de crear, pero CON ID
                router.navigate(`/training/planner/routine/create?id=${id}`);
            });

            // C. DELETE (Borrar)
            list.addEventListener('delete', (e) => { // Quitamos async innecesario aquí
                const id = e.detail.id;
                if (confirm(this.dict.t('alert_delete_routine'))) {
                    trainingService.deleteRoutine(id).then(() => {
                        this.render(); // Re-renderizamos tras borrar
                    });
                }
            });
        }
    }
}

customElements.define('training-planner-view', TrainingPlannerView);