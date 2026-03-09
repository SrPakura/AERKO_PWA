// src/modules/system/components/input-card.js

export class AppInputCard extends HTMLElement {
    static get observedAttributes() { return ['label', 'grid']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'label') {
                const el = this.shadowRoot.querySelector('.label');
                if (el) el.innerText = `// ${newValue}`;
            }
            // El atributo 'grid' se maneja solo por CSS (:host([grid="2"]))
        }
    }

    render() {
        const labelText = this.getAttribute('label') || 'Label';

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                @import url('/src/modules/system/components/input-card.css');
            </style>

            <span class="label">// ${labelText}</span>

            <div class="input-container">
                <slot></slot>
            </div>
        `;
    }
}

customElements.define('app-input-card', AppInputCard);