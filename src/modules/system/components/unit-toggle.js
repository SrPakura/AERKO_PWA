// src/modules/system/components/unit-toggle.js

export class AppUnitToggle extends HTMLElement {
    // Observamos 'options' (la lista separada por comas) y 'value' (la seleccionada)
    static get observedAttributes() { return ['options', 'value']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    render() {
        // 1. Obtener datos
        const optionsRaw = this.getAttribute('options') || ''; // Ej: "KG,LB,ST"
        const activeValue = this.getAttribute('value') || '';  // Ej: "KG"
        
        // Limpiamos espacios por si acaso (" KG , LB ")
        const units = optionsRaw.split(',').map(u => u.trim()).filter(u => u);

        // 2. Construir el HTML interno
        // Mapeamos las unidades y añadimos el separador "/" entre ellas
        const unitsHtml = units.map((unit, index) => {
            const isActive = (unit === activeValue);
            const color = isActive ? 'var(--Verde-acido)' : 'inherit';
            
            // Renderizamos la unidad
            let html = `<span style="color: ${color}">${unit}</span>`;
            
            // Si NO es el último, añadimos la barra separadora "/"
            if (index < units.length - 1) {
                html += ` <span class="separator">/</span> `;
            }
            return html;
        }).join('');

        // 3. Render final con estilos encapsulados
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                
                :host {
                    display: inline-flex;
                    align-items: center;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px; /* Ajustable si hereda */
                    font-weight: 500;
                    color: var(--Blanco);
                    user-select: none; /* Para que no se seleccione el texto al hacer click */
                }

                .bracket {
                    margin: 0 4px; /* Aire para los corchetes */
                }

                .separator {
                    color: var(--Blanco);
                    opacity: 0.6; /* Un poco más sutil */
                    margin: 0 4px;
                }
            </style>
            
            <span class="bracket">[</span>
            ${unitsHtml}
            <span class="bracket">]</span>
        `;
    }
}

customElements.define('app-unit-toggle', AppUnitToggle);