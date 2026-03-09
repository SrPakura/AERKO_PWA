import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppMealSection extends HTMLElement {
    static get observedAttributes() { return ['title']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        this.dict = await i18nService.loadPage('nutrition_smart/meal-section');
        this.render();
        this._setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        if (!this.dict) return; // Barrera de seguridad
        const title = this.getAttribute('title') || this.dict.t('fallback_title');
        
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            
            /* RESET BÁSICO */
            * { margin: 0; padding: 0; box-sizing: border-box; }

            :host {
                display: block;
                width: 100%;
            }

            /* --- COMPONENTE: CARD COMIDA COMPLETA (WRAPPER) --- */
            .card-comida-container {
                display: flex;
                width: 100%;
                align-items: stretch; 
            }

            /* --- CAJÓN PRINCIPAL (LEFT) --- */
            .meal-drawer {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
                
                flex-grow: 1; 
                /* width: auto;  <-- ELIMINAR O CAMBIAR */
                width: 0; /* TRUCO: Forzamos el ancho base a 0 para que flex-grow mande */
                min-width: 0; /* CRÍTICO: Permite que el contenedor se encoja y active el scroll hijo */
                
                height: fit-content;
                padding: 16px;
                border: 1px solid var(--Blanco);
                border-right: none; 
                background-color: var(--Negro-suave);
            }

            .meal-drawer__title {
                font-family: 'Clash Display', sans-serif;
                color: var(--Blanco);
                font-size: 24px;
                font-weight: 600;
                line-height: 120%;
                margin: 0;
                text-transform: none; 
            }

            /* --- CARRUSEL --- */
            .carousel-alimentos {
                display: flex;
                gap: 8px;
                width: 100%;
                overflow-x: auto;
                overflow-y: hidden;
                scroll-behavior: smooth;
                padding-bottom: 4px;
                scrollbar-width: none; 
                -ms-overflow-style: none;
            }
            .carousel-alimentos::-webkit-scrollbar { display: none; }

            ::slotted(*) {
                flex-shrink: 0;
            }

            /* --- SIDEBAR ACTIONS (RIGHT) --- */
            .sidebar-actions {
                display: flex;
                flex-direction: column;
                width: 40px; /* Ancho EXTERNO de la caja */
                flex-shrink: 0;
                
                border-top: 1px solid var(--Blanco);
                border-right: 1px solid var(--Blanco);
                border-bottom: 1px solid var(--Blanco);
                border-left: 1px solid var(--Blanco); 
                
                background-color: transparent;
            }

            /* --- BOTONES (El arreglo está aquí) --- */
            .sidebar-btn {
                width: 100%; /* CAMBIO 1: Ocupa el hueco disponible (38px), no 40px */
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 0;
                cursor: pointer;
                transition: background 0.1s; /* Transición rápida para tacto */
            }

            .sidebar-btn svg {
                width: 14px; height: 14px;
                fill: var(--Blanco);
                transition: fill 0.1s;
            }

            .sidebar-btn--edit {
                border-bottom: 1px solid var(--Blanco);
            }

            .sidebar-btn--delete {
                border-top: 1px solid var(--Blanco);
            }

            .sidebar-drag {
                flex-grow: 1;
                width: 100%; /* CAMBIO 2: Lo mismo para el drag */
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: grab;
            }
            
            .sidebar-drag svg {
                width: 10px; height: 38px;
                fill: var(--Blanco);
            }

            /* --- ESTADO ACTIVE (TÁCTIL) --- */
            /* CAMBIO 3: Quitamos hover y ponemos active */
            
            .sidebar-btn:active {
                background-color: var(--gris-suave-hover);
            }
            .sidebar-btn:active svg {
                fill: var(--Verde-acido);
            }
            
            /* El botón de borrar se pone rojo al pulsar */
            .sidebar-btn--delete:active svg {
                fill: #FF4F4F;
            }

            .sidebar-drag:active {
                cursor: grabbing;
                background-color: rgba(255,255,255,0.05); /* Feedback sutil al arrastrar */
            }

        </style>

        <article class="card-comida-container">
            
            <section class="meal-drawer">
                <h3 class="meal-drawer__title">${title}</h3>

                <div class="carousel-alimentos">
                    <slot></slot>
                </div>
            </section>

            <aside class="sidebar-actions">
    <button class="sidebar-btn sidebar-btn--edit" id="btn-edit-section" aria-label="${this.dict.t('aria_edit')}">
        ${ICONS.EDIT}
    </button>

    <div class="sidebar-drag drag-handle" aria-label="${this.dict.t('aria_reorder')}">
        ${ICONS.DRAG_HANDLE}
    </div>

    <button class="sidebar-btn sidebar-btn--delete" id="btn-delete-section" aria-label="${this.dict.t('aria_delete')}">
        ${ICONS.TRASH}
    </button>
</aside>

        </article>
        `;
    }

    _setupListeners() {
        this.shadowRoot.getElementById('btn-edit-section').addEventListener('click', (e) => {
            e.stopPropagation();
            this.dispatchEvent(new CustomEvent('edit-section', { bubbles: true, composed: true }));
        });

        this.shadowRoot.getElementById('btn-delete-section').addEventListener('click', (e) => {
            e.stopPropagation();
            this.dispatchEvent(new CustomEvent('delete-section', { bubbles: true, composed: true }));
        });
    }
}

customElements.define('app-meal-section', AppMealSection);