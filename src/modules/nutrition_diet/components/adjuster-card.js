import { ICONS } from '../../../core/theme/icons.js';
import '../../system/components/keypad-modal.js';
// NUEVO: Importar servicio de i18n
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class NutritionAdjusterCard extends HTMLElement {
    static get observedAttributes() { 
        return ['label', 'grams', 'k', 'p', 'c', 'f', 'mode', 'step']; 
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.state = {
            grams: 100,
            base: { k: 0, p: 0, c: 0, f: 0 },
            mode: 'variable', 
            step: 1 // 🔥 CAMBIO: Default a 1g
        };
        
        this.dict = null; // Guardamos el diccionario aquí
    }

    async connectedCallback() {
        // Cargar el diccionario primero
        this.dict = await i18nService.loadPage('nutrition_diet/adjuster-card');
        
        this.render();
        this._initFromAttributes();
        this.setupListeners();
        this.recalculate();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal && this.isConnected && this.dict) {
            this._initFromAttributes();
            this.recalculate();
        }
    }

    _initFromAttributes() {
        this.state.grams = parseFloat(this.getAttribute('grams')) || 100;
        this.state.step = parseFloat(this.getAttribute('step')) || 1; // Leemos el step
        this.state.mode = this.getAttribute('mode') || 'variable';
        
        this.state.base = {
            k: parseFloat(this.getAttribute('k')) || 0,
            p: parseFloat(this.getAttribute('p')) || 0,
            c: parseFloat(this.getAttribute('c')) || 0,
            f: parseFloat(this.getAttribute('f')) || 0
        };
    }

    render() {
        const label = this.getAttribute('label') || this.dict.t('adjuster_default_label');
        
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            /* 🔥 FIX CRÍTICO: Importamos estilos del modal y del keypad dentro del Shadow DOM */
            @import url('/src/modules/system/components/keypad-modal.css');
            @import url('/src/modules/system/components/keypad.css');
            
            :host {
                display: block;
                width: 100%;
                font-family: 'JetBrains Mono', monospace;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }

            .card-interactiva {
                display: flex;
                flex-direction: column;
                width: 100%;
            }

            .card-alimento-completo {
                display: flex;
                flex-direction: column;
                align-self: stretch;
                border: 1px solid var(--Blanco);
                background: var(--Negro-suave);
            }

            .nombre-alimento {
                display: flex;
                padding: 16px;
                align-items: center;
                gap: 10px;
                align-self: stretch;
                border-bottom: 1px solid var(--Blanco);
                color: var(--Blanco);
                font-size: 14px;
                font-weight: 400;
                line-height: 140%;
                text-transform: uppercase;
            }

            .frame-detalles {
                display: flex;
                align-items: stretch;
                align-self: stretch;
                min-height: 120px;
            }

            /* CONTROLES */
            .controles {
                display: flex;
                flex-direction: column;
                width: 60px;
                border-right: 1px solid var(--Blanco);
            }

            .btn-control {
                display: flex;
                flex: 1;
                justify-content: center;
                align-items: center;
                background: transparent;
                border: none;
                cursor: pointer;
                transition: background 0.2s;
                color: var(--Blanco);
            }
            .btn-control:active { background: rgba(255,255,255,0.1); }
            
            .btn-control--up { border-bottom: 1px solid var(--Blanco); }
            
            .arrow-icon { width: 19px; height: 11px; fill: var(--Blanco); }
            .rotated { transform: rotate(180deg); }

            /* GRAMOS */
            .gramos {
                display: flex;
                flex: 1;
                padding: 16px;
                justify-content: center;
                align-items: center;
                border-right: 1px solid var(--Blanco);
                cursor: pointer;
            }
            .gramos:active { background: rgba(255,255,255,0.05); }

            .gramos__content {
                display: flex;
                align-items: baseline;
                gap: 4px;
            }

            .gramos__valor {
                color: var(--Verde-acido);
                font-family: 'Clash Display', sans-serif;
                font-size: 48px;
                font-weight: 700;
                line-height: 100%;
            }

            .gramos__unidad {
                color: var(--Blanco);
                font-family: 'Clash Display', sans-serif;
                font-size: 24px; 
                font-weight: 600;
            }

            /* MACROS */
            .macros-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
                padding: 16px;
                gap: 8px;
                min-width: 100px;
                font-size: 14px;
            }
            
            /* Clase para ocultar macros */
            .hidden { display: none !important; }
            
            .macro-row { display: flex; justify-content: space-between; gap: 12px; width: 100%; }
            .label { color: var(--Verde-acido); font-weight: 700; }
            .value { color: var(--Blanco); }

            /* MODOS */
            .modos {
                display: flex;
                align-items: flex-start;
                margin-top: -1px; 
            }

            .modo-item {
                flex: 1;
                padding: 16px;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 1px solid var(--Blanco);
                background: transparent;
                color: var(--Blanco);
                font-family: 'JetBrains Mono', monospace;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .modo-item + .modo-item { margin-left: -1px; }

            .modo-item.active {
                background: rgba(204, 255, 0, 0.2); 
                color: var(--Verde-acido);
                border-color: var(--Blanco); 
                font-weight: 700;
            }
        </style>

        <article class="card-interactiva">
            <div class="card-alimento-completo">
                <header class="nombre-alimento">
                    // ${label}
                </header>

                <div class="frame-detalles">
                    <aside class="controles">
                        <button class="btn-control btn-control--up" id="btn-up">
                            <svg class="arrow-icon" viewBox="0 0 19 11">
                                <path d="M1.20379 11L8.09978e-07 9.9165L9.5 -8.30516e-07L19 9.9165L17.7962 11L9.5 2.34025L1.20379 11Z"/>
                            </svg>
                        </button>
                        <button class="btn-control btn-control--down" id="btn-down">
                            <svg class="arrow-icon rotated" viewBox="0 0 19 11">
                                <path d="M1.20379 11L8.09978e-07 9.9165L9.5 -8.30516e-07L19 9.9165L17.7962 11L9.5 2.34025L1.20379 11Z"/>
                            </svg>
                        </button>
                    </aside>

                    <section class="gramos" id="display-gramos">
                        <div class="gramos__content">
                            <span class="gramos__valor" id="val-grams">${this.state.grams}</span>
                            <span class="gramos__unidad" id="unit-label">G</span>
                        </div>
                    </section>

                    <section class="macros-info" id="macros-container">
                        <div class="macro-row"><span class="label">K:</span> <span class="value" id="val-k">0</span></div>
                        <div class="macro-row"><span class="label">P:</span> <span class="value" id="val-p">0</span></div>
                        <div class="macro-row"><span class="label">C:</span> <span class="value" id="val-c">0</span></div>
                        <div class="macro-row"><span class="label">G:</span> <span class="value" id="val-f">0</span></div>
                    </section>
                </div>
            </div>

            <footer class="modos">
                <button class="modo-item ${this.state.mode === 'variable' ? 'active' : ''}" data-mode="variable">
                    ${this.dict.t('adjuster_btn_mode_var')}
                </button>
                <button class="modo-item ${this.state.mode === 'fixed' ? 'active' : ''}" data-mode="fixed">
                    ${this.dict.t('adjuster_btn_mode_fixed')}
                </button>
            </footer>
        </article>
        
        <app-keypad-modal id="adjuster-keypad"></app-keypad-modal>
        `;
    }

    recalculate() {
        const els = {
            grams: this.shadowRoot.getElementById('val-grams'),
            unit: this.shadowRoot.getElementById('unit-label'),
            macros: this.shadowRoot.getElementById('macros-container'),
            k: this.shadowRoot.getElementById('val-k'),
            p: this.shadowRoot.getElementById('val-p'),
            c: this.shadowRoot.getElementById('val-c'),
            f: this.shadowRoot.getElementById('val-f')
        };

        if (!els.grams) return;

        // 1. Modo VARIABLE (Elegir Día)
        if (this.state.mode === 'variable') {
            els.grams.innerText = "--"; 
            els.grams.style.opacity = "0.5";
            els.unit.innerText = "VAR";
            
            // 🔥 CAMBIO: Ocultamos el bloque de macros entero para no ver bugs
            els.macros.classList.add('hidden');
            return;
        }

        // 2. Modo FIJO (Predefinida)
        els.macros.classList.remove('hidden'); // Mostrar macros
        els.grams.style.opacity = "1";
        els.grams.innerText = this.state.grams;
        els.unit.innerText = "G";

        const ratio = this.state.grams / 100;
        
        els.k.innerText = Math.round(this.state.base.k * ratio);
        els.p.innerText = (this.state.base.p * ratio).toFixed(1);
        els.c.innerText = (this.state.base.c * ratio).toFixed(1);
        els.f.innerText = (this.state.base.f * ratio).toFixed(1);
    }

    setupListeners() {
        this.shadowRoot.getElementById('btn-up').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state.mode === 'variable') this._forceMode('fixed');
            this._updateGrams(this.state.grams + this.state.step);
        });

        this.shadowRoot.getElementById('btn-down').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state.mode === 'variable') this._forceMode('fixed');
            this._updateGrams(this.state.grams - this.state.step);
        });

        this.shadowRoot.getElementById('display-gramos').addEventListener('click', async () => {
            if (this.state.mode === 'variable') this._forceMode('fixed');
            
            const modal = this.shadowRoot.getElementById('adjuster-keypad');
            const res = await modal.open('Gramos', this.state.grams, 'numeric');
            
            if (res && res.value) {
                this._updateGrams(parseFloat(res.value));
            }
        });

        const modeBtns = this.shadowRoot.querySelectorAll('.modo-item');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newMode = e.target.dataset.mode;
                this._setMode(newMode);
            });
        });
    }

    _updateGrams(val) {
        if (val < 0) val = 0;
        this.state.grams = val;
        this.recalculate();
        this._emitChange();
    }

    _setMode(newMode) {
        this.state.mode = newMode;
        const btns = this.shadowRoot.querySelectorAll('.modo-item');
        btns.forEach(b => {
            if (b.dataset.mode === newMode) b.classList.add('active');
            else b.classList.remove('active');
        });
        this.recalculate();
        this._emitChange();
    }

    _forceMode(mode) {
        if (this.state.mode !== mode) {
            this._setMode(mode);
        }
    }

    _emitChange() {
        this.dispatchEvent(new CustomEvent('change', {
            detail: {
                grams: this.state.mode === 'fixed' ? this.state.grams : null,
                mode: this.state.mode,
                calculated: {
                    k: parseFloat(this.shadowRoot.getElementById('val-k').innerText) || 0,
                    p: parseFloat(this.shadowRoot.getElementById('val-p').innerText) || 0,
                    c: parseFloat(this.shadowRoot.getElementById('val-c').innerText) || 0,
                    f: parseFloat(this.shadowRoot.getElementById('val-f').innerText) || 0
                }
            },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('nutrition-adjuster-card', NutritionAdjusterCard);