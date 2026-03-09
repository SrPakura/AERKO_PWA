// src/modules/system/components/btn.js

export class AppBtn extends HTMLElement {
    // 1. AÑADIDO: 'label' a la lista de vigilancia
    static get observedAttributes() { return ['variant', 'label']; }

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            // OPTIMIZACIÓN: Si solo cambia el texto y el botón ya existe,
            // actualizamos solo el texto sin re-renderizar todo el HTML.
            if (name === 'label') {
                const btn = this.querySelector('button.btn');
                if (btn) {
                    btn.innerText = newValue;
                    return; // Salimos para no ejecutar render()
                }
            }
            // Para otros cambios (variant), re-renderizamos clases
            this.render();
        }
    }

    render() {
        const variant = this.getAttribute('variant') || 'primary';
        const type = this.getAttribute('type') || 'button';
        // Capturamos el label nuevo
        const label = this.getAttribute('label');

        let btn = this.querySelector('button.btn');

        if (!btn) {
            // A. Primera vez (Montaje)
            // Prioridad: ¿Tiene atributo label? Úsalo. Si no, usa el HTML interno (slot)
            const content = label ? label : this.innerHTML;

            this.innerHTML = `
                <button class="btn btn--${variant}" type="${type}">
                    ${content}
                </button>
            `;
        } else {
            // B. Actualización (Update)
            btn.className = `btn btn--${variant}`;
            btn.setAttribute('type', type);
            
            // Si hay label definido, forzamos la actualización del texto
            if (label) {
                btn.innerText = label;
            }
        }
    }
}

customElements.define('app-btn', AppBtn);