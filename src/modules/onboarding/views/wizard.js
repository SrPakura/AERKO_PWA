// src/modules/onboarding/views/wizard.js
import { router } from '../../../core/router/index.js';
import { authService } from '../../auth/services/auth.service.js';
import { onboardingStore } from '../store/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // <-- IMPORTANTE: Servicio de idiomas

export class OnboardingWizard extends HTMLElement {
    constructor() {
        super();
        
        // Estado local sincronizado con el Store
        this.currentStepIndex = onboardingStore.getStep() || 0;

        // APLICANDO LA REGLA DE ORO: Guardamos las llaves, no los textos traducidos.
        this.stepsData = [
            {
                id: 2,
                features: [
                    {
                        titleKey: "wizard_feat1_title",
                        textKey: "wizard_feat1_desc"
                    },
                    {
                        titleKey: "wizard_feat2_title",
                        textKey: "wizard_feat2_desc"
                    }
                ],
                btnKey: "wizard_btn_continue"
            },
            {
                id: 3,
                features: [
                    {
                        titleKey: "wizard_feat3_title",
                        textKey: "wizard_feat3_desc"
                    },
                    {
                        titleKey: "wizard_feat4_title",
                        textKey: "wizard_feat4_desc"
                    }
                ],
                btnKey: "wizard_btn_start"
            }
        ];

        // Bindings
        this._handleNext = this._handleNext.bind(this);
        this._handleNavClick = this._handleNavClick.bind(this);
    }

    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar
        this.dict = await i18nService.loadPage('onboarding/wizard');

        this.render();
        this.addListeners();
        // Renderizamos el estado inicial del paso actual
        this.updateStepView(this.currentStepIndex);
    }

    disconnectedCallback() {
        this.removeListeners();
    }

    render() {
        if (!this.dict) return;

        this.innerHTML = `
        <div class="app-screen screen-wizard">
            
            <div class="pagination-wrapper">
                <div class="page-indicator" data-target="welcome">1</div>
                <div class="page-indicator" data-target="step-0">2</div>
                <div class="page-indicator" data-target="step-1">3</div>
            </div>

            <div class="features-list" id="features-container"></div>

            <div class="wizard-footer">
                <app-btn variant="primary" id="btn-action"></app-btn>
            </div>

        </div>
        `;
    }

    /**
     * Actualiza el DOM para reflejar el paso actual (Indicadores, Textos, Botón)
     */
    updateStepView(index) {
        if (!this.dict) return;

        const data = this.stepsData[index];
        const indicators = this.querySelectorAll('.page-indicator');
        const container = this.querySelector('#features-container');

        // 1. GESTIÓN DE INDICADORES (Bolitas)
        // Reset de clases
        indicators.forEach(ind => ind.className = 'page-indicator');

        // La Bolita 1 (Welcome) SIEMPRE está 'completed'
        indicators[0].classList.add('completed');

        if (index === 0) {
            // PASO 2: Smart Training
            indicators[1].classList.add('current'); 
        } else if (index === 1) {
            // PASO 3: Biomecánica
            indicators[1].classList.add('completed');
            indicators[2].classList.add('current');
        }

        // 2. RENDERIZADO DE TEXTOS (Features) traducidos al vuelo
        container.innerHTML = data.features.map(feat => `
            <div class="feature-item">
                <h2 class="title-feature">${this.dict.t(feat.titleKey)}</h2>
                <p class="text-feature">${this.dict.t(feat.textKey)}</p>
            </div>
        `).join('');

        // 3. ACTUALIZAR BOTÓN
        this._updateButtonText(this.dict.t(data.btnKey));
        
        // 4. GUARDAR EN STORE
        onboardingStore.setStep(index);
    }

    _updateButtonText(text) {
        const appBtn = this.querySelector('#btn-action');
        if (!appBtn) return;

        // Intentamos actualizar atributo si el componente lo soporta (Futuro Paso 1.5.2)
        appBtn.setAttribute('label', text);

        // Fallback manual: Buscamos el botón interno y le cambiamos el texto
        // Esto elimina la necesidad del setTimeout porque el DOM ya existe
        const innerBtn = appBtn.querySelector('button');
        if (innerBtn) {
            innerBtn.innerText = text;
        } else {
            // Si app-btn aun no se ha renderizado (caso raro),
            // actualizamos su innerHTML para que cuando nazca tenga el texto bien
            appBtn.innerHTML = text;
        }
    }

    addListeners() {
        // Botón Principal
        this.querySelector('#btn-action').addEventListener('click', this._handleNext);

        // Navegación Bolitas (Delegación de eventos simple)
        this.querySelectorAll('.page-indicator').forEach(ind => {
            ind.addEventListener('click', this._handleNavClick);
        });
    }

    removeListeners() {
        this.querySelector('#btn-action').removeEventListener('click', this._handleNext);
        this.querySelectorAll('.page-indicator').forEach(ind => {
            ind.removeEventListener('click', this._handleNavClick);
        });
    }

    // --- HANDLERS ---

    async _handleNext() {
        if (this.currentStepIndex < this.stepsData.length - 1) {
            // Avanzar paso
            this.currentStepIndex++;
            this.updateStepView(this.currentStepIndex);
        } else {
            // Finalizar Wizard
            await authService.completeOnboarding();
            // Limpiamos el store antes de salir
            onboardingStore.reset();
            router.navigate('/');
        }
    }

    _handleNavClick(e) {
        const target = e.target.dataset.target;
        
        if (target === 'welcome') {
            router.navigate('/onboarding/welcome');
        } else if (target === 'step-0') {
            this.currentStepIndex = 0;
            this.updateStepView(0);
        } else if (target === 'step-1') {
            this.currentStepIndex = 1;
            this.updateStepView(1);
        }
    }
}

customElements.define('onboarding-wizard', OnboardingWizard);