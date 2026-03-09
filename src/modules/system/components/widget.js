// src/modules/system/components/widget.js
import { ICONS } from '../../../core/theme/icons.js';

export class AppWidget extends HTMLElement {
    
    // 1. DECIMOS AL NAVEGADOR QUÉ ATRIBUTOS VIGILAR
    static get observedAttributes() { return ['title', 'text', 'variant']; }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    // 2. REACCIONAMOS A LOS CAMBIOS EN VIVO
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // Si el componente ya está conectado, actualizamos solo el contenido
            if (this.isConnected) {
                this.updateContent(name, newValue);
            }
        }
    }

    // Actualización quirúrgica del DOM (Mejor rendimiento que re-renderizar todo)
    updateContent(name, value) {
        const titleEl = this.querySelector('.widget-title');
        const descEl = this.querySelector('.widget-desc');      // Texto en variante highlight
        const simpleTextEl = this.querySelector('.widget-text'); // Texto en variante simple

        if (name === 'title' && titleEl) titleEl.innerText = value;
        
        if (name === 'text') {
            if (descEl) descEl.innerText = value;
            if (simpleTextEl) simpleTextEl.innerText = value;
        }

        // Si cambia la variante, es un cambio estructural grande, así que renderizamos todo
        if (name === 'variant') this.render();
    }

    render() {
        const variant = this.getAttribute('variant') || 'simple';
        const title = this.getAttribute('title') || '';
        const text = this.getAttribute('text') || '';
        const hasArrow = this.hasAttribute('arrow');
        const isSmall = this.hasAttribute('small');

        let innerHTML = '';

        if (variant === 'highlight') {
            innerHTML = `
                <div class="widget-content">
                    <h3 class="widget-title">${title}</h3>
                    <p class="widget-desc">${text}</p>
                </div>
                <div class="widget-icon">${ICONS.ARROW_RIGHT_CIRCLE}</div>
            `;
        } else {
            // Variante Simple
            innerHTML = `
                <span class="widget-text">${text}</span>
                ${hasArrow ? `<div class="widget-icon" style="margin-left:auto">${ICONS.ARROW_RIGHT_CIRCLE}</div>` : ''}
            `;
        }

        const cssClass = `widget widget--${variant} ${isSmall ? 'small-text' : ''}`;

        this.innerHTML = `
            <div class="${cssClass}">
                ${innerHTML}
            </div>
        `;
    }
}

if (!customElements.get('app-widget')) {
  customElements.define('app-widget', AppWidget);
}