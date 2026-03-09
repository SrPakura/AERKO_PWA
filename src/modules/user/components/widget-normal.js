// src/modules/user/components/widget-normal.js
import '../../../modules/system/components/widget.js';
import { router } from '../../../core/router/index.js';
import { SHORTCUT_REGISTRY } from '../shortcut.registry.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class WidgetNormal extends HTMLElement {
    static get observedAttributes() { return ['shortcut-id']; }

    constructor() {
        super();
        this._config = null;
        this.dict = null;
    }

    async connectedCallback() {
        this.dict = await i18nService.loadPage('user/registry');
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'shortcut-id' && oldValue !== newValue) {
            this._config = SHORTCUT_REGISTRY[newValue];
            if (this.dict) this.render();
        }
    }

    render() {
        if (!this._config || !this.dict) return;

        // Pintamos el componente visual base de Aerko_ usando la llave traducida
        this.innerHTML = `
            <app-widget 
                variant="simple" 
                text="${this.dict.t(this._config.textKey)}"
                arrow
                clickable
            ></app-widget>
        `;

        // Le añadimos el listener para navegar
        const widgetEl = this.querySelector('app-widget');
        widgetEl.addEventListener('click', () => {
            router.navigate(this._config.path);
        });
    }
}

customElements.define('widget-normal', WidgetNormal);