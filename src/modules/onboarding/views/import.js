// src/modules/onboarding/views/import.js
import { router } from '../../../core/router/index.js';
import { onboardingStore } from '../store/index.js';
import { ICONS } from '../../../core/theme/icons.js';
import { authService } from '../../auth/services/auth.service.js'; // Necesario para finalizar el onboarding
import { i18nService } from '../../../core/i18n/i18n.service.js'; // <-- IMPORTANTE: Servicio de idiomas

export class OnboardingImport extends HTMLElement {
    constructor() {
        super();
        
        // APLICANDO LA REGLA DE ORO: Usamos titleKey en lugar de title hardcodeado
        this.categories = [
            {
                titleKey: "import_cat_all",
                apps: [
                    { id: 'aerko', name: 'Aerko_', icon: 'icon_aerko.png' }
                ]
            },
            {
                titleKey: "import_cat_training",
                apps: [
                    { id: 'hevy', name: 'Hevy', icon: 'icon_hevy.png' },
                    { id: 'strong', name: 'Strong', icon: 'icon_strong.png' },
                    { id: 'lyfta', name: 'Lyfta', icon: 'icon_lyfta.png' }
                ]
            },
            {
                titleKey: "import_cat_body",
                apps: [
                    { id: 'google_fit', name: 'Google Fit', icon: 'icon_googlefit.png' },
                    { id: 'apple_health', name: 'Apple Health', icon: 'icon_applehealth.png' },
                    { id: 'samsung_health', name: 'Samsung Health', icon: 'icon_samsunghealth.png' }
                ]
            },
            {
                titleKey: "import_cat_other",
                apps: [
                    { id: 'generic', name: 'Archivo CSV / JSON', icon: 'icon_generic.png' }
                ]
            }
        ];

        this._handleBack = this._handleBack.bind(this);
        this._handleAppClick = this._handleAppClick.bind(this);
        this._handleFinish = this._handleFinish.bind(this);
    }

    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar
        this.dict = await i18nService.loadPage('onboarding/import');
        
        this.render();
        this.addListeners();
    }

    disconnectedCallback() {
        this.removeListeners();
    }

    render() {
        // Barrera de seguridad antiaérea
        if (!this.dict) return;

        const successMsg = onboardingStore.getSuccessMessage();

        // 1. BANNER FLOTANTE (TOAST) BRUTALISTA
        const bannerHtml = successMsg ? `
            <div id="success-toast" style="
                position: absolute; 
                top: 72px; /* Justo debajo del header */
                left: 50%; 
                transform: translateX(-50%); 
                width: calc(100% - 48px);
                padding: 16px; 
                background: var(--Negro-suave); 
                border: 1px solid var(--Verde-acido); 
                color: var(--Verde-acido); 
                font-family: 'JetBrains Mono', monospace; 
                font-size: 14px;
                text-align: center;
                z-index: 100;
                box-shadow: 0 10px 30px rgba(0,0,0,0.8);
                transition: opacity 0.4s ease, transform 0.4s ease;
            ">
                ${successMsg}
            </div>
        ` : '';

        // 2. FOOTER CONDICIONAL 
        const footerHtml = successMsg ? `
            <div style="width: 100%; padding: 0 24px 24px 24px; margin-top: auto;">
                <app-btn variant="primary" id="btn-finish-onboarding">${this.dict.t('import_btn_dashboard')}</app-btn>
            </div>
        ` : `
            <span class="coming-soon-text">${this.dict.t('import_coming_soon')}</span>
        `;

        this.innerHTML = `
        <div class="app-screen screen-onboarding"> 
            
            <div class="section-header" id="btn-back">
                ${ICONS.ARROW_LEFT}
                <span class="header-title-small">${this.dict.t('import_header')}</span>
            </div>

            ${bannerHtml}

            <div class="import-list-container">
                ${this.categories.map(cat => `
                    <div class="category-group">
                        <span class="category-title">${this.dict.t(cat.titleKey)}</span>
                        
                        ${cat.apps.map(app => `
                            <div class="app-row" data-id="${app.id}" data-name="${app.name}">
                                <div class="app-icon-box">
                                    <img src="/assets/icons/${app.icon}" 
                                         class="app-icon-img" 
                                         alt="${app.name}"
                                         onerror="this.style.display='none'">
                                </div>
                                <div class="app-info-box">
                                    <span class="app-name">${app.name}</span>
                                    <div style="width:20px; height:20px;">
                                        ${ICONS.ARROW_RIGHT_CIRCLE}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}

                ${footerHtml}
            </div>

        </div>
        `;
    }

    addListeners() {
        this.querySelector('#btn-back').addEventListener('click', this._handleBack);
        this.querySelector('.import-list-container').addEventListener('click', this._handleAppClick);
        
        const btnFinish = this.querySelector('#btn-finish-onboarding');
        if (btnFinish) {
            btnFinish.addEventListener('click', this._handleFinish);
        }

        // --- MAGIA DEL TOAST TEMPORAL ---
        const toast = this.querySelector('#success-toast');
        if (toast) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translate(-50%, -10px)';
                
                setTimeout(() => {
                    toast.remove();
                }, 400); 
            }, 1450);
        }
    }

    removeListeners() {
        this.querySelector('#btn-back').removeEventListener('click', this._handleBack);
        this.querySelector('.import-list-container').removeEventListener('click', this._handleAppClick);
        
        const btnFinish = this.querySelector('#btn-finish-onboarding');
        if (btnFinish) {
            btnFinish.removeEventListener('click', this._handleFinish);
        }
    }

    // --- HANDLERS ---

    _handleBack() {
        router.navigate('/onboarding/welcome');
    }

    _handleAppClick(e) {
        const row = e.target.closest('.app-row');
        if (!row) return;

        const appData = {
            id: row.dataset.id,
            name: row.dataset.name
        };

        // Si hacen click para importar otra app, limpiamos el mensaje de éxito
        onboardingStore.setSuccessMessage(null);
        onboardingStore.setSelectedApp(appData);
        router.navigate('/onboarding/import-action');
    }

    async _handleFinish() {
        // Firmamos el contrato y entramos
        await authService.completeOnboarding();
        onboardingStore.reset();
        router.navigate('/');
    }
}

customElements.define('onboarding-import', OnboardingImport);