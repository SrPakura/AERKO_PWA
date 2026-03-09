import '../../nutrition_core/components/macro-badge.js';
// NUEVO: Importar servicio de i18n
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppFoodCardLarge extends HTMLElement {
    // CORRECCIÓN: Escuchamos 'k' en vez de 'kcal' para sincronizar con home.js
    static get observedAttributes() { return ['label', 'k', 'p', 'c', 'f', 'grams']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.dict = null; // Guardaremos el diccionario aquí
    }

    async connectedCallback() {
        // Cargar el diccionario primero
        this.dict = await i18nService.loadPage('nutrition_diet/food-card-large');
        
        this.render();
        // Evento de click para editar
        this.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('edit-food', { bubbles: true, composed: true }));
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Solo renderizamos si el diccionario ya ha cargado
        if (oldValue !== newValue && this.dict) this.render();
    }

    render() {
        // Usamos la traducción si no se proporciona el label
        const label = this.getAttribute('label') || this.dict.t('card_large_default_label');
        const k = Math.round(this.getAttribute('k') || 0);
        const p = this.getAttribute('p') || '0';
        const c = this.getAttribute('c') || '0';
        const f = this.getAttribute('f') || '0';
        const rawGrams = this.getAttribute('grams') || '0';
        // Si el valor contiene alguna letra (a-z), lo dejamos como está. Si no, le pegamos la "G".
        const displayGrams = /[a-z]/i.test(rawGrams) ? rawGrams : `${rawGrams}G`;

        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            * { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: block;
                /* IMPORTANTE: "HUG" contents. Deja que el CSS interno decida el ancho */
                width: fit-content; 
                cursor: pointer;
            }

            /* --- ESTILOS EXACTOS DE compo_nutri.css --- */

            .food-card-full {
                display: flex;
                flex-direction: column;
                /* El ancho se ajusta al contenido (HUG) */
                width: fit-content; 
                min-width: 160px; /* Un mínimo de seguridad para que no sea enano */
                
                border: 1px solid var(--Blanco);
                background-color: var(--Negro-suave); /* Fondo negro para que no sea transparente */
                box-sizing: border-box;
                transition: background 0.2s ease, border-color 0.2s;
            }

            /* Efecto Hover (añadido para UX) */
            @media (hover: hover) {
                .food-card-full:hover {
                    background-color: var(--gris-suave-hover);
                    border-color: var(--Verde-acido);
                }
            }
            .food-card-full:active {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .food-card-full__header {
                display: flex;
                padding: 12px;
                align-items: center;
                gap: 12px;
                align-self: stretch;
            }

            .food-card-full__title {
                color: var(--Blanco);
                font-family: 'Clash Display', sans-serif;
                font-size: 24px;
                font-weight: 600;
                line-height: 120%;
                margin: 0;
                /* Para textos muy largos, cortamos con puntos suspensivos */
                max-width: 200px; 
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-transform: none;
            }

            .food-card-full__content {
                display: flex;
                flex-direction: column;
                padding: 12px;
                gap: 6px; 
            }

            .food-card-full__stats {
                display: flex;
                justify-content: space-between;
                width: 100%;
                white-space: nowrap;
            }

            .nutri-drawer__stat {
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                font-weight: 400;
                line-height: 140%;
                color: var(--Blanco);
                white-space: nowrap;
            }

            .u-green {
                color: var(--Verde-acido);
                font-weight: 700;
            }

            .food-card-full__divider {
                height: 1px;
                width: 100%;
                background-color: var(--Blanco);
                margin-bottom: 4px; /* Un pelín de aire extra para los macros */
            }

            /* Ajuste para que el componente de macros ocupe el ancho */
            app-macro-badge {
                width: 100%;
                display: block;
            }
        </style>

        <article class="food-card-full">
            
            <header class="food-card-full__header">
                <h3 class="food-card-full__title">${label}</h3>
            </header>

            <div class="food-card-full__content">
                <div class="food-card-full__stats">
                    <span class="nutri-drawer__stat"><span class="u-green">${displayGrams}</span></span>
                    <span class="nutri-drawer__stat"><span class="u-green">${k}</span>Kcal</span>
                </div>

                <div class="food-card-full__divider"></div>

                <app-macro-badge p="${p}" c="${c}" f="${f}"></app-macro-badge>
            </div>

        </article>
        `;
    }
}

customElements.define('app-food-card-large', AppFoodCardLarge);