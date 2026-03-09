// src/modules/training_flow/components/routine-row.js
import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppRoutineRow extends HTMLElement {
    static get observedAttributes() { return ['name']; }

    constructor() {
        super();
        // 🚫 ADIÓS SHADOW DOM: Pasamos a Light DOM para heredar fuentes y variables globales sin dolor
        // this.attachShadow({ mode: 'open' }); 
    }

    async connectedCallback() {
        const dict = await i18nService.loadPage('training_flow/routine-row');
        this.t = dict.t;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.t) {
            this.render();
        }
    }

    render() {
        // Si no hay traductor, no pintamos nada todavía
        if (!this.t) return; 

        // Inyectamos la traducción para el caso de que no venga nombre
        const name = this.getAttribute('name') || this.t('row_fallback_name');

        // Usamos this.innerHTML directo.
        // Scoping: Usamos el selector 'app-routine-row' para que el estilo no se escape.
        this.innerHTML = `
            <style>
                /* Estilos integrados - Single File Component */
                
                app-routine-row {
                    display: block;
                    width: 100%;
                    cursor: pointer;
                    /* Evita el tap highlight azul nativo en Android/iOS */
                    -webkit-tap-highlight-color: transparent;
                    box-sizing: border-box;
                }

                .routine-card {
                    display: flex;
                    padding: 16px;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    box-sizing: border-box;
                    
                    /* Borde base */
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    
                    /* Transición solo para el color, rápida */
                    transition: border-color 0.1s ease, background 0.1s ease;
                }

                .routine-name {
                    color: var(--Blanco);
                    /* IMPORTANTE: Al estar en Light DOM, ahora sí pilla la fuente global.
                       Aseguramos JetBrains Mono por si acaso */
                    font-family: 'JetBrains Mono', monospace; 
                    font-size: 18px; 
                    font-weight: 400;
                    line-height: 150%;
                    
                    /* Truncado de texto */
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-right: 16px; /* Aire con el icono */
                }

                .icon-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    
                    /* FIX: Tamaño subido a 24px (Estándar Material/Human Interface) */
                    width: 24px; 
                    height: 24px;
                    
                    color: var(--Blanco);
                    flex-shrink: 0; /* Que no se aplaste si el texto es largo */
                }

                /* Forzamos al SVG a llenar el wrapper */
                .icon-wrapper svg {
                    width: 100%;
                    height: 100%;
                    fill: currentColor;
                }

                /* --- ESTADOS (UX Mobile First) --- */
                /* Solo necesitamos feedback al tocar (:active) */
                
                .routine-card:active {
                    border-color: var(--Verde-acido);
                    background: rgba(204, 255, 0, 0.05); /* Toque sutil verde */
                }

                .routine-card:active .routine-name,
                .routine-card:active .icon-wrapper {
                    color: var(--Verde-acido);
                }
            </style>

            <div class="routine-card">
                <span class="routine-name">${name}</span>
                <div class="icon-wrapper">
                    ${ICONS.ARROW_RIGHT_CIRCLE}
                </div>
            </div>
        `;
    }
}

customElements.define('app-routine-row', AppRoutineRow);