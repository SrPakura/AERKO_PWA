// src/modules/training_planner/components/add-trigger.js
import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class TrainingAddTrigger extends HTMLElement {
    static get observedAttributes() { return ['label']; }

    constructor() {
        super();
        // 🚫 ADIÓS SHADOW DOM: Comentado para usar Light DOM
        // this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        // Cargamos el diccionario específico de este componente
        this.i18n = await i18nService.loadPage('training_planner/add-trigger');
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const label = this.getAttribute('label') || this.i18n.t('lbl_add_exercise');

        // Lógica de escalado SVG
        const iconSvg = ICONS.PLUS
            .replace('<svg', '<svg viewBox="0 0 16 16"')
            .replace('width="16"', 'width="100%"')
            .replace('height="16"', 'height="100%"');

        // CAMBIO CLAVE: Usamos this.innerHTML directamente
        this.innerHTML = `
        <style>
            /* Al estar en Light DOM, ya heredamos variables.css del index.html */

            /* Scoping manual usando el nombre del tag para no romper nada fuera */
            training-add-trigger {
                display: inline-flex;
                width: 100%;
                box-sizing: border-box;
            }

            /* Clases internas (prefijadas o únicas para evitar colisiones) */
            .drawer-add {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                
                width: 100%; 
                min-height: 120px;

                padding: 16px;
                gap: 16px;
                
                border: 1px solid var(--Blanco);
                background: var(--Negro-suave);
                
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease;
                box-sizing: border-box;
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
                text-align: center;
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

customElements.define('training-add-trigger', TrainingAddTrigger);