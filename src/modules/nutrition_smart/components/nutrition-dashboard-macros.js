// src/modules/nutrition_smart/components/nutrition-macro-card.js

export class NutritionMacroCard extends HTMLElement {
    // Observamos: Etiqueta (Ej: "Proteínas"), Valor Actual y Total
    static get observedAttributes() { 
        return ['label', 'value', 'total']; 
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.updateStats();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.updateStats();
        }
    }

    updateStats() {
        if (!this.shadowRoot) return;

        const val = parseInt(this.getAttribute('value') || 0);
        const total = parseInt(this.getAttribute('total') || 100); // Evitar división por 0 default

        // 1. Actualizar Textos
        const currentEl = this.shadowRoot.querySelector('.macro-current');
        const targetEl = this.shadowRoot.querySelector('.macro-target');
        
        if (currentEl) currentEl.innerText = `${val}g`;
        if (targetEl) targetEl.innerText = `/${total}`;

        // 2. Actualizar Barra
        const barFill = this.shadowRoot.querySelector('.macro-bar-fill');
        if (barFill) {
            // Calculamos porcentaje (tope 100%)
            const pct = total > 0 ? Math.min((val / total) * 100, 100) : 0;
            barFill.style.width = `${pct}%`;
        }
    }

    render() {
        // Obtenemos el título (Ej: Proteínas)
        const label = this.getAttribute('label') || 'Macro';

        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');

            /* RESET & HOST */
            :host { 
                display: block; 
                width: 100%; 
                box-sizing: border-box; 
            }

            /* --- ESTILOS PIXEL PERFECT (Desde compo_smart.css) --- */
            
            .macro-card {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
                padding: 16px;
                
                background: var(--negro-suave, #1A1A1A);
                /* Borde GRIS según diseño */
                border: 1px solid var(--gris-hover, #E5E5E5); 
                
                width: 100%;
                height: 100%; /* Para que llene la celda del grid */
                box-sizing: border-box;
            }

            .macro-title {
                color: var(--blanco, #FFFFFF);
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                font-weight: 400;
                line-height: 140%;
            }

            .macro-content {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
                width: 100%;
                margin-top: auto; /* Empuja el contenido abajo si la caja crece */
            }

            .macro-stats {
                display: flex;
                align-items: baseline; 
                justify-content: flex-start;
                width: 100%;
                gap: 2px; /* Pequeño ajuste visual */
            }

            .macro-current {
                color: var(--verde-acido, #CCFF00);
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                font-weight: 500;
                line-height: 100%;
            }

            .macro-target {
                color: var(--gris-hover, #E5E5E5);
                font-family: 'JetBrains Mono', monospace;
                font-size: 12px;
                font-weight: 500;
                line-height: 130%;
            }

            .macro-bar-bg {
                width: 100%;
                height: 5px;
                background: var(--gris-suave-hover, #2F2F2F);
                display: flex;
                align-items: center;
            }

            .macro-bar-fill {
                height: 100%;
                background: var(--verde-acido, #CCFF00);
                width: 0%;
                transition: width 0.3s ease;
            }
        </style>

        <div class="macro-card">
            <div class="macro-title">${label}</div>

            <div class="macro-content">
                <div class="macro-stats">
                    <span class="macro-current">0g</span>
                    <span class="macro-target">/0</span>
                </div>

                <div class="macro-bar-bg">
                    <div class="macro-bar-fill"></div>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('nutrition-macro-card', NutritionMacroCard);