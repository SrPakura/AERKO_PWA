// src/modules/system/components/select-list.js

export class AppSelectList extends HTMLElement {
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
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                }

                .option-box {
                    display: flex;
                    padding: 12px;
                    align-items: center;
                    /* ESTADO BASE: Borde blanco, fondo transparente */
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .input-text {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    line-height: 140%;
                    transition: color 0.2s ease;
                }

                /* --- ESTADO SELECCIONADO (FIX: ESTILO NEÓN) --- */
                .option-box.selected {
                    /* NO FONDO, SOLO BORDE VERDE */
                    border-color: var(--Verde-acido);
                    background: transparent;
                }

                .option-box.selected .input-text {
                    /* TEXTO VERDE */
                    color: var(--Verde-acido);
                    font-weight: 500;
                }

                /* HOVER (Solo en desktop/mouse) */
                @media (hover: hover) {
                    .option-box:not(.selected):hover {
                        border-color: var(--Verde-acido);
                    }
                }
            </style>
            
            ${this._options.map(opt => `
                <div class="option-box ${opt.value === this._value ? 'selected' : ''}" 
                     data-val="${opt.value}">
                    <span class="input-text">${opt.label}</span>
                </div>
            `).join('')}
        `;

        this.shadowRoot.querySelectorAll('.option-box').forEach(box => {
            box.addEventListener('click', () => {
                const val = box.dataset.val;
                this._value = val;
                this.setAttribute('value', val);
                
                this.dispatchEvent(new CustomEvent('change', { 
                    detail: { value: val },
                    bubbles: true 
                }));
                
                this.render();
            });
        });
    }
}

customElements.define('app-select-list', AppSelectList);