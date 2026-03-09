// src/modules/system/components/keypad.js
import './unit-toggle.js';

export class AppKeypad extends HTMLElement {
    static get observedAttributes() { return ['mode', 'unit-value', 'unit-options']; }

    constructor() {
        super();
        this.mode = 'numeric'; 
        this.unitValue = 'KG';
        this.unitOptions = 'KG, LB';
        
        // VARIABLE ANTI-ANSIEDAD
        this.lastClickTime = 0;
    }

    connectedCallback() {
        this.render();
        this.addListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'mode') this.mode = newValue;
            if (name === 'unit-value') this.unitValue = newValue;
            if (name === 'unit-options') this.unitOptions = newValue;
            this.render();
        }
    }

    get _backspaceIcon() {
        return `<svg width="24" height="24" viewBox="0 0 24 24" style="pointer-events: none;"><path fill="currentColor" d="M22,3H7C6.31,3 5.77,3.35 5.41,3.88L0,12L5.41,20.11C5.77,20.64 6.31,21 7,21H22A2,2 0 0,0 24,19V5A2,2 0 0,0 22,3M19,15.59L17.59,17L14,13.41L10.41,17L9,15.59L12.59,12L9,8.41L10.41,7L14,10.59L17.59,7L19,8.41L15.41,12L19,15.59Z" /></svg>`;
    }

    render() {
        // Generamos botones con estilo grid-area inline o clases
        // Nota: Usamos style="grid-area: n1" para los números para ser explícitos
        const nums = [1,2,3,4,5,6,7,8,9,0].map(n => 
            `<div class="key" style="grid-area: n${n}" data-value="${n}">${n}</div>`
        ).join('');
        
        const btnDot = `<div class="key" style="grid-area: dot" data-value=".">.</div>`;
        const btnDelete = `<div class="key area-del" data-action="delete">${this._backspaceIcon}</div>`;
        const btnOk = `<div class="key area-ok" data-action="ok">OK</div>`;

        let unitBtn = '';
        if (this.mode === 'numeric') {
            // Si es numérico simple, dejamos el hueco vacío o extendemos el 0 (opcional)
            // Para tu diseño actual, dejaremos el hueco unit vacío o pondremos un placeholder
            unitBtn = `<div class="key area-unit" style="opacity:0; pointer-events:none"></div>`;
        } else {
            unitBtn = `
                <div class="key area-unit" data-action="toggle-unit" id="btn-unit" style="padding:0;">
                    <app-unit-toggle 
                        options="${this.unitOptions}" 
                        value="${this.unitValue}"
                        style="pointer-events: none;">
                    </app-unit-toggle>
                </div>
            `;
        }

        this.innerHTML = `
            <div class="keyboard">
                ${nums} ${btnDot} ${btnDelete} ${btnOk} ${unitBtn}
            </div>
        `;
        
        this.addListeners();
    }

    addListeners() {
        const newKeyboard = this.querySelector('.keyboard');
        if(!newKeyboard) return;

        newKeyboard.addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (!key) return;

            // --- LÓGICA ANTI-ANSIEDAD (THROTTLE) ---
            const now = Date.now();
            // Si han pasado menos de 120ms desde el último click, ignoramos
            if (now - this.lastClickTime < 120) return;
            this.lastClickTime = now;
            // ----------------------------------------

            key.classList.add('active');
            setTimeout(() => key.classList.remove('active'), 100);

            const { value, action } = key.dataset;

            if (value) this.emitEvent('input', value);
            else if (action === 'delete') this.emitEvent('delete');
            else if (action === 'ok') this.emitEvent('ok');
            else if (action === 'toggle-unit') this.emitEvent('unit-cycle'); 
        });
    }

    emitEvent(name, detail = null) {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
    }
}
customElements.define('app-keypad', AppKeypad);