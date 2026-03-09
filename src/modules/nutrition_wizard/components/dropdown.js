// src/modules/nutrition_wizard/components/dropdown.js

import { ICONS } from '../../../core/theme/icons.js';
// 🟢 INYECTAMOS EL TRADUCTOR
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class AppDropdown extends HTMLElement {
    constructor() {
        super();
        this.options = [];
        this.value = null;
        this.isOpen = false;
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    async connectedCallback() {
        // Cargamos el diccionario específico del componente
        this.dict = await i18nService.loadPage('nutrition_wizard/dropdown');
        
        this.render();
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.contains(e.target)) {
                this.close();
            }
        });
    }

    setOptions(options, selectedValue = null) {
        this.options = options;
        if (selectedValue !== null) this.value = selectedValue;
        this.render();
    }

    setValue(val) {
        this.value = val;
        this.render();
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.render();
    }

    close() {
        this.isOpen = false;
        this.render();
    }

    select(val) {
        this.value = val;
        this.isOpen = false;
        this.render();
        this.dispatchEvent(new CustomEvent('change', { detail: { value: val } }));
    }

    render() {
        // Bloqueo de seguridad: Evitar renderizado si el diccionario no ha cargado
        if (!this.dict) return;

        // Reemplazo del texto duro por la traducción
        const selectedOption = this.options.find(o => o.value === this.value) || 
                               this.options[0] || 
                               { label: this.dict.t('dropdown_default'), value: null };

        // --- CORRECCIÓN: Usamos la clave exacta ARROW_DOWN ---
        const arrowIcon = ICONS.ARROW_DOWN; 

        this.innerHTML = `
        <style>
            .app-dropdown {
                position: relative;
                width: 100%;
                font-family: 'JetBrains Mono', monospace;
            }

            .dropdown-trigger {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
                padding: 12px;
                border: 1px solid var(--Blanco, #FFF);
                background: var(--Negro-suave, #1A1A1A);
                cursor: pointer;
                color: var(--Blanco, #FFF);
                user-select: none;
            }

            .dropdown-list {
                display: none;
                flex-direction: column;
                width: 100%;
                border: 1px solid var(--Blanco, #FFF);
                border-top: none;
                background: var(--Negro-suave, #1A1A1A);
                position: absolute;
                top: 100%;
                left: 0;
                z-index: 100;
            }

            .dropdown-list.open {
                display: flex;
            }

            .dropdown-option {
                padding: 12px;
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
                color: var(--Blanco, #FFF);
                font-size: 14px;
            }

            .dropdown-option:hover {
                background: rgba(255,255,255,0.05);
            }

            .dropdown-option.selected {
                color: var(--Verde-acido, #CCFF00);
            }

            /* Contenedor del icono para poder rotarlo */
            .icon-container {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                transition: transform 0.2s ease;
            }
            
            /* Esta clase hace la magia de convertir ARROW_DOWN en UP */
            .icon-container.rotated {
                transform: rotate(180deg);
            }
            
            /* Aseguramos que el SVG llene el contenedor */
            .icon-container svg {
                width: 100%;
                height: 100%;
                /* Si tus iconos tienen stroke="#FFFFFF", esto no es estrictamente necesario,
                   pero ayuda si usas 'currentColor' */
                stroke: var(--Blanco, #FFF); 
            }
        </style>

        <div class="app-dropdown">
            <div class="dropdown-trigger" id="trigger">
                <span>${selectedOption.label}</span>
                <div class="icon-container ${this.isOpen ? 'rotated' : ''}">
                    ${arrowIcon}
                </div>
            </div>
            
            <div class="dropdown-list ${this.isOpen ? 'open' : ''}">
                ${this.options.map(opt => `
                    <div class="dropdown-option ${opt.value === this.value ? 'selected' : ''}" data-val="${opt.value}">
                        <span>${opt.label}</span>
                        ${opt.value === this.value ? '<span style="color:var(--Verde-acido)">●</span>' : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        `;

        this.querySelector('#trigger').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.querySelectorAll('.dropdown-option').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.select(el.dataset.val); 
            });
        });
    }
}

customElements.define('app-dropdown', AppDropdown);