// src/modules/nutrition/components/macro-badge.js
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppMacroBadge extends HTMLElement {
    // Observamos los atributos para re-renderizar si cambian
    static get observedAttributes() { return ['p', 'c', 'f']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.dict = null;
        this._initialized = false;
    }

    async connectedCallback() {
        this.dict = await i18nService.loadPage('nutrition_core/macro-badge');
        this._initialized = true;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._initialized) this.render();
    }

    render() {
        // Textos del diccionario
        const labelP = this.dict ? this.dict.t('macro_p') : 'P:';
        const labelC = this.dict ? this.dict.t('macro_c') : 'C:';
        const labelF = this.dict ? this.dict.t('macro_f') : 'G:';

        // Obtenemos valores, asegurando un fallback a '0'
        const p = this.getAttribute('p') || '0';
        const c = this.getAttribute('c') || '0';
        const f = this.getAttribute('f') || '0';

        this.shadowRoot.innerHTML = `
        <style>
            /* Importamos variables globales del sistema (colores, etc.) */
            @import url('/src/core/theme/variables.css');

            /* Reset interno */
            * { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: inline-block;
            }

            /* --- CLASE ATÓMICA: .macros --- */
            .macros {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                
                /* Tipografía del Design System */
                font-family: 'JetBrains Mono', monospace; 
                font-size: 14px;
                font-weight: 400;
                line-height: 140%;
                text-align: center;
                white-space: nowrap; /* Evita roturas de línea */
            }

            .macros__label {
                color: var(--Verde-acido);
            }

            .macros__value {
                color: var(--Blanco);
            }

            .macros__separator {
                color: var(--Blanco);
                opacity: 0.5;
            }
        </style>

        <div class="macros">
            <span class="macros__label">${labelP}</span>
            <span class="macros__value">${p}g</span>
            
            <span class="macros__separator">|</span>
            
            <span class="macros__label">${labelC}</span>
            <span class="macros__value">${c}g</span>
            
            <span class="macros__separator">|</span>
            
            <span class="macros__label">${labelF}</span>
            <span class="macros__value">${f}g</span>
        </div>
        `;
    }
}

customElements.define('app-macro-badge', AppMacroBadge);