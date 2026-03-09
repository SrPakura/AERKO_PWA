export class AppSectionHeader extends HTMLElement {
    static get observedAttributes() { return ['title', 'tag', 'text']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const title = this.getAttribute('title') || '';
        const tag = this.getAttribute('tag');   // Texto Izquierda
        const text = this.getAttribute('text'); // Texto Derecha

        // Lógica de visualización:
        // Si no hay tag ni text, no pintamos la fila de abajo para respetar el gap
        const hasSubtitle = tag || text;

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                @import url('/src/modules/system/components/section-header.css');
            </style>
            
            <header class="header-container">
                <h1 class="title">${title}</h1>
                
                ${hasSubtitle ? `
                    <div class="subtitle-row">
                        ${tag ? `<div class="left-text">${tag}</div>` : ''}
                        ${text ? `<div class="right-text">${text}</div>` : ''}
                    </div>
                ` : ''}
            </header>
        `;
    }
}

customElements.define('app-section-header', AppSectionHeader);