// src/modules/system/components/keypad-modal.js
import './keypad.js';
import { unitService } from '../../../core/utils/unit.service.js';

export class AppKeypadModal extends HTMLElement {
    constructor() {
        super();
        this._handlePopState = this._handlePopState.bind(this);
        
        this.resolvePromise = null;
        this.onUnitChangeCallback = null;

        this.currentString = "";
        this.currentUnit = "";
        this.unitOptions = "";
    }

    connectedCallback() {
        this.render();
        this.dialog = this.querySelector('.modal-backdrop');
        this.keypad = this.querySelector('app-keypad');
        this.preview = this.querySelector('#modal-preview');
        this.label = this.querySelector('#modal-label');
    }

    render() {
        this.innerHTML = `
            <div class="modal-backdrop">
                <div class="modal-sheet">
                    <div class="modal-header">
                        <span class="modal-label" id="modal-label">EDITAR</span>
                        <div class="modal-value-preview" id="modal-preview"></div>
                    </div>
                    <app-keypad></app-keypad>
                </div>
            </div>
        `;
    }

    open(label, currentValue, mode = 'numeric', currentUnit = '', unitOptions = '', onUnitChange = null) {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            this.onUnitChangeCallback = onUnitChange;

            // 1. Configurar UI
            this.label.innerText = `// ${label}`;
            // Convertimos a string y aseguramos que si es null sea ""
            this.currentString = (currentValue || "").toString();
            this.currentUnit = currentUnit;
            this.unitOptions = unitOptions;
            
            this.updatePreview();

            // 2. Configurar Keypad
            this.keypad.setAttribute('mode', mode);
            if (mode === 'dynamic') {
                this.keypad.setAttribute('unit-value', currentUnit);
                this.keypad.setAttribute('unit-options', unitOptions);
            }

            // 3. Mostrar Modal y GESTIONAR HISTORIAL (FIX ROUTER)
            this.dialog.classList.add('visible');

            // TRUCO NINJA: Empujamos un estado PERO mantenemos la misma URL.
            // Así el Router no salta, pero el botón Atrás funciona.
            history.pushState({ modalOpen: true }, '', window.location.hash);
            
            window.addEventListener('popstate', this._handlePopState);
            this.attachKeypadListeners();
        });
    }

    updatePreview() {
        this.preview.innerText = this.currentString;
    }

    close(returnValue = null) {
        this.dialog.classList.remove('visible');
        window.removeEventListener('popstate', this._handlePopState);
        this.detachKeypadListeners();
        
        if (this.resolvePromise) {
            this.resolvePromise(returnValue);
            this.resolvePromise = null;
            this.onUnitChangeCallback = null;
        }
    }

    attachKeypadListeners() {
        this.onInput = (e) => {
            const char = e.detail;
            
            // 1. Evitar doble punto
            if (char === '.' && this.currentString.includes('.')) return;

            // 2. LÓGICA DEL CERO (MEJORADA)
            // Reconocemos '0', '0.00' y '00.0' (y ahora otro porque si le pongo 00 ocurren bugs) como ceros válidos para ser reemplazados al escribir
           const isZero = ['0', '0.00', '00.0', '--'].includes(this.currentString);

            // Si el valor actual es un "cero" y NO estamos escribiendo un punto -> Reemplazar el valor
            if (isZero && char !== '.') {
                this.currentString = char;
            } 
            else {
                // Comportamiento normal: Concatenar el carácter
                this.currentString += char;
            }
            
            this.updatePreview();
        };

        this.onDelete = () => {
            this.currentString = this.currentString.slice(0, -1);
            // Si borramos todo, dejamos un 0 para mantener la estética
            if (this.currentString === '' || this.currentString === '-') {
                this.currentString = '0'; 
            }
            this.updatePreview();
        };

        this.onOk = () => {
            // Esto dispara _handlePopState gracias al historial
            history.back(); 
        };

        this.onUnitCycle = () => {
            // 1. Averiguar cuál es la siguiente unidad a la que vamos a cambiar
            const units = this.unitOptions.split(',').map(u => u.trim());
            const nextIndex = (units.indexOf(this.currentUnit) + 1) % units.length;
            const newUnit = units[nextIndex];

            // 2. MAGIA DE CONVERSIÓN:
            // Solo convertimos si hay un número escrito válido (mayor que 0 o distinto de "")
            if (this.currentString !== "" && this.currentString !== "0") {
                // A) Pasamos lo que hay escrito a la base métrica real (KG/CM)
                const baseValue = unitService.toBase(this.currentString, this.currentUnit);
                
                // B) Transformamos esa base real a la nueva unidad visual
                const displayValue = unitService.toDisplay(baseValue, newUnit);
                
                // C) Actualizamos el string del teclado para que no haya decimales infinitos
                this.currentString = displayValue.toString();
            }

            // 3. Actualizamos las variables de estado con la nueva unidad
            this.currentUnit = newUnit;
            this.keypad.setAttribute('unit-value', newUnit);

            // 4. Refrescamos la pantalla del teclado al instante
            this.updatePreview();

            // 5. Avisar en tiempo real al formulario que abrió el modal
            if (this.onUnitChangeCallback) {
                this.onUnitChangeCallback(newUnit);
            }
        };

        this.keypad.addEventListener('input', this.onInput);
        this.keypad.addEventListener('delete', this.onDelete);
        this.keypad.addEventListener('ok', this.onOk);
        this.keypad.addEventListener('unit-cycle', this.onUnitCycle);
    }

    detachKeypadListeners() {
        if (this.onInput) {
            this.keypad.removeEventListener('input', this.onInput);
            this.keypad.removeEventListener('delete', this.onDelete);
            this.keypad.removeEventListener('ok', this.onOk);
            this.keypad.removeEventListener('unit-cycle', this.onUnitCycle);
        }
    }

    _handlePopState(e) {
        // Al dar atrás (o OK), cerramos devolviendo el valor final
        this.close({ 
            value: this.currentString, 
            unit: this.currentUnit 
        }); 
    }
}

customElements.define('app-keypad-modal', AppKeypadModal);