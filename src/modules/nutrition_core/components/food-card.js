import './macro-badge.js'; 
import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppFoodCard extends HTMLElement {
    static get observedAttributes() { 
        return ['label', 'p', 'c', 'f']; 
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.dict = null;
        this._initialized = false;
    }

    async connectedCallback() {
        // Cargamos el diccionario dinámicamente
        this.dict = await i18nService.loadPage('nutrition_core/food-card');
        this._initialized = true;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Solo renderizamos si el componente ya ha cargado todo
        if (oldValue !== newValue && this._initialized) this.render();
    }

    render() {
        // Fallbacks seguros por si render se ejecuta una fracción de segundo antes
        const defaultLabel = this.dict ? this.dict.t('card_default_label') : 'Alimento';
        const ariaEdit = this.dict ? this.dict.t('aria_edit') : 'Editar';
        const ariaDelete = this.dict ? this.dict.t('aria_delete') : 'Borrar';

        const label = this.getAttribute('label') || defaultLabel;
        const p = this.getAttribute('p') || '0';
        const c = this.getAttribute('c') || '0';
        const f = this.getAttribute('f') || '0';
        
        const displayLabel = label.startsWith('//') ? label : `// ${label}`;

        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: block;
                width: 100%;
                /* Nos aseguramos de que el host no tenga overflow */
                overflow: hidden; 
            }

            .card-comida-container {
                display: flex;
                width: 100%;
                align-items: stretch;
                min-height: 80px; 
            }

            /* --- IZQUIERDA: INFO --- */
            .meal-drawer {
                flex-grow: 1;
                /* --- EL FIX: Forzar ancho 0 para que flex-grow mande --- */
                width: 0; 
                min-width: 0;
                /* ------------------------------------------------------ */
                
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 16px;
                border: 1px solid var(--Blanco);
                border-right: none; 
                background: var(--Negro-suave);
                transition: background 0.2s ease;
                cursor: pointer;
            }

            @media (hover: hover) {
                .meal-drawer:hover { background: var(--gris-suave-hover); }
                .meal-drawer:hover .food-item__title { color: var(--Verde-acido); }
            }
            .meal-drawer:active { background: rgba(255, 255, 255, 0.1); }

            .food-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
                width: 100%;
                /* Aseguramos que el contenido no desborde al drawer */
                overflow: hidden; 
            }

            .food-item__title {
                color: var(--Blanco);
                font-family: 'Clash Display', sans-serif;
                font-size: 24px;
                font-weight: 600;
                line-height: 120%;
                
                /* Truncado de texto */
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%; /* Ocupa todo el ancho del drawer */
                
                transition: color 0.2s ease;
            }

            /* --- DERECHA: ACCIONES --- */
            .sidebar-actions {
                display: flex;
                flex-direction: column;
                width: 44px; 
                flex-shrink: 0; /* Importante: que no se aplaste nunca */
                border: 1px solid var(--Blanco);
                border-left: 1px solid var(--Blanco);
                background: var(--Negro-suave);
            }

            .sidebar-btn {
                flex-grow: 1;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: none;
                padding: 0; 
                margin: 0;
                cursor: pointer;
                transition: background 0.2s ease;
            }

            .sidebar-btn--edit {
                border-bottom: 1px solid var(--Blanco);
            }

            .sidebar-btn svg {
                width: 14px; 
                height: 14px;
                fill: var(--Blanco);
                display: block; 
                transition: fill 0.2s ease;
            }

            @media (hover: hover) {
                .sidebar-btn:hover { background: var(--gris-suave-hover); }
                .sidebar-btn:hover svg { fill: var(--Verde-acido); }
                .sidebar-btn--delete:hover svg { fill: #FF4F4F; }
            }
        </style>

        <div class="card-comida-container">
            <div class="meal-drawer" id="main-click-area">
                <article class="food-item">
                    <h3 class="food-item__title">${displayLabel}</h3>
                    <app-macro-badge p="${p}" c="${c}" f="${f}"></app-macro-badge>
                </article>
            </div>

            <aside class="sidebar-actions">
                <button class="sidebar-btn sidebar-btn--edit" id="btn-edit" aria-label="${ariaEdit}">
                    ${ICONS.EDIT}
                </button>
                <button class="sidebar-btn sidebar-btn--delete" id="btn-delete" aria-label="${ariaDelete}">
                    ${ICONS.TRASH}
                </button>
            </aside>
        </div>
        `;

        // Reasignamos listeners porque el innerHTML acaba de destruir los nodos anteriores
        this.addListeners();
    }

    addListeners() {
        const btnEdit = this.shadowRoot.getElementById('btn-edit');
        const btnDelete = this.shadowRoot.getElementById('btn-delete');
        const mainArea = this.shadowRoot.getElementById('main-click-area');

        if (btnEdit) {
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('edit', { bubbles: true, composed: true }));
            });
        }

        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('delete', { bubbles: true, composed: true }));
            });
        }

        if (mainArea) {
            mainArea.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('card-click', { bubbles: true, composed: true }));
            });
        }
    }
}

customElements.define('app-food-card', AppFoodCard);