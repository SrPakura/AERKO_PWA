// src/modules/nutrition_diet/components/add-trigger.js
import { ICONS } from '../../../core/theme/icons.js';
// NUEVO: Importamos el servicio de i18n
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppAddTrigger extends HTMLElement {
    static get observedAttributes() { return ['label']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.dict = null; // Guardamos el diccionario
    }

    async connectedCallback() {
        // Cargamos el diccionario específico del componente
        await i18nService.loadPage('nutrition_diet/add-trigger');
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Solo renderizamos si el diccionario ya cargó (para evitar fallos si cambia muy rápido)
        if (oldValue !== newValue && this.dict) {
            this.render();
        }
    }

    render() {
        // Si no le pasan un label por atributo, usamos la traducción por defecto
        const label = this.getAttribute('label') || this.dict.t('trigger_default_label');

        // Lógica de escalado SVG (viewBox)
        const iconSvg = ICONS.PLUS
            .replace('<svg', '<svg viewBox="0 0 16 16"')
            .replace('width="16"', 'width="100%"')
            .replace('height="16"', 'height="100%"');

        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');

            /* RESET */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            :host {
                display: inline-flex;
            }

            .drawer-add {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                width: max-content; 
                min-width: 140px; 

                padding: 16px;
                gap: 16px;
                
                border: 1px solid var(--Blanco);
                background: var(--Negro-suave);
                
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease;
                
                height: 100%; 
            }

            /* HOVER STATE */
            @media (hover: hover) {
                .drawer-add:hover {
                    background: var(--gris-suave-hover);
                    border-color: var(--Verde-acido);
                }
                .drawer-add:hover .drawer-add__text {
                    color: var(--Verde-acido);
                }
                .drawer-add:hover .drawer-add__icon svg {
                    fill: var(--Verde-acido);
                }
            }
            
            .drawer-add:active {
                background: rgba(255, 255, 255, 0.1);
            }

            /* TAMAÑO ICONO AJUSTADO (36x36) */
            .drawer-add__icon {
                display: flex;
                width: 36px;
                height: 36px;
                justify-content: center;
                align-items: center;
            }

            .drawer-add__icon svg {
                width: 100%; 
                height: 100%;
                fill: var(--Blanco);
                transition: fill 0.2s ease;
            }

            .drawer-add__text {
                color: var(--Blanco);
                font-family: 'Clash Display', sans-serif;
                font-size: 20px;
                font-weight: 600;
                line-height: 120%;
                white-space: nowrap; 
                transition: color 0.2s ease;
            }
        </style>

        <div class="drawer-add">
            <div class="drawer-add__icon">
                ${iconSvg}
            </div>
            <span class="drawer-add__text">${label}</span>
        </div>
        `;
    }
}

customElements.define('app-add-trigger', AppAddTrigger);