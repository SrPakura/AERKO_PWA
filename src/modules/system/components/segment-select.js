// src/modules/system/components/segment-select.js

export class AppSegmentSelect extends HTMLElement {
    static get observedAttributes() { return ['value']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._options = [];
        this._value = null;
    }

    connectedCallback() {
        this.render();
    }

    setOptions(opts) {
        this._options = opts;
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'value' && oldValue !== newValue) {
            this._value = newValue;
            this.render();
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: flex;
                    width: 100%;
                    gap: 8px; /* gap-8 del HTML original */
                }

                .segment-option {
                    flex: 1; /* Para que ocupen el mismo ancho */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 12px;
                    
                    /* ESTADO BASE */
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .text {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    line-height: 140%;
                    text-align: center;
                }

                /* --- ESTADO SELECCIONADO (NEÓN) --- */
                .segment-option.selected {
                    border-color: var(--Verde-acido);
                }

                .segment-option.selected .text {
                    color: var(--Verde-acido);
                    font-weight: 500;
                }

                @media (hover: hover) {
                    .segment-option:not(.selected):hover {
                        border-color: var(--Verde-acido);
                    }
                }
            </style>
            
            ${this._options.map(opt => `
                <div class="segment-option ${opt.value === this._value ? 'selected' : ''}" 
                     data-val="${opt.value}">
                    <span class="text">${opt.label}</span>
                </div>
            `).join('')}
        `;

        this.shadowRoot.querySelectorAll('.segment-option').forEach(box => {
            box.addEventListener('click', () => {
                const val = box.dataset.val;
                this._value = val;
                this.setAttribute('value', val); // Reflejar al atributo
                
                this.dispatchEvent(new CustomEvent('change', { 
                    detail: { value: val },
                    bubbles: true 
                }));
                
                this.render();
            });
        });
    }
}

customElements.define('app-segment-select', AppSegmentSelect);