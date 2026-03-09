// src/modules/onboarding/views/welcome.js
import { router } from '../../../core/router/index.js';
import { authService } from '../../auth/services/auth.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // <-- IMPORTANTE: Servicio de idiomas

export class OnboardingWelcome extends HTMLElement {
    constructor() {
        super();
        // Inicializamos variables para el swipe
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        // Bindeamos los métodos para poder usarlos en add/removeEventListener
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);
    }

    /**
     * Ciclo de Vida: Cuando el componente entra en el DOM
     */
    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar
        this.dict = await i18nService.loadPage('onboarding/welcome');
        
        this.render();
        this.addListeners();
    }

    /**
     * Ciclo de Vida: Cuando el componente sale del DOM (Limpieza)
     * VITAL para evitar memory leaks y "zombies" escuchando eventos.
     */
    disconnectedCallback() {
        this.removeListeners();
    }

    render() {
        // Barrera de seguridad antiaérea
        if (!this.dict) return;

        // Mantenemos la estructura HTML exacta para no romper CSS
        this.innerHTML = `
        <div class="app-screen screen-onboarding" id="welcome-screen">
            
            <div class="ascii-container">
                <img src="/assets/img/logo_ascii.png" class="ascii-img" alt="Aerko System">
            </div>

            <div class="logs-container">
                <p class="log-line log-green">> System initiation...</p>
                <p class="log-line log-green">> System iniciated</p>
                <p class="log-line log-white">> Onboarding on process...</p>
                <p class="log-line log-white">> Waiting for human interaction...</p>
                <p class="log-line log-white">><span class="cursor-block"></span></p>
            </div>

            <div class="content-wrapper">
                <h1 class="title-welcome">${this.dict.t('welcome_title')}</h1>
                <p class="body-welcome">
                    ${this.dict.t('welcome_desc')}
                </p>
            </div>

            <div class="buttons-container">
                <app-btn variant="secondary" id="btn-skip">${this.dict.t('welcome_btn_skip')}</app-btn>
                <app-btn variant="primary" id="btn-continue">${this.dict.t('welcome_btn_continue')}</app-btn>
            </div>

            <div style="margin-top: auto;"> 
                <a class="text-link-action" id="link-import">${this.dict.t('welcome_link_import')}</a>
            </div>

        </div>
        `;
    }

    addListeners() {
        // 1. Navegación (Click Events)
        
        // Modificado: Ahora el botón saltar completa el proceso en el authService antes de navegar
        this.querySelector('#btn-skip').addEventListener('click', async () => {
            // Firmamos el contrato primero
            await authService.completeOnboarding();
            // Y ahora sí, con los papeles en regla, pasamos
            router.navigate('/');
        });

        this.querySelector('#btn-continue').addEventListener('click', () => router.navigate('/onboarding/wizard'));
        this.querySelector('#link-import').addEventListener('click', () => router.navigate('/onboarding/import'));

        // 2. Gestos (Swipe)
        // Añadimos el listener al propio componente (this)
        this.addEventListener('touchstart', this._handleTouchStart, { passive: true });
        this.addEventListener('touchend', this._handleTouchEnd, { passive: true });
    }

    removeListeners() {
        // Limpiamos los eventos globales del componente para liberar memoria
        this.removeEventListener('touchstart', this._handleTouchStart);
        this.removeEventListener('touchend', this._handleTouchEnd);
    }

    // --- LÓGICA INTERNA ---

    _handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
    }

    _handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this._calculateSwipe();
    }

    _calculateSwipe() {
        const threshold = 50; 
        const diff = this.touchEndX - this.touchStartX;

        if (Math.abs(diff) < threshold) return; 

        if (diff < 0) {
            // SWIPE LEFT (<---) -> Importar
            router.navigate('/onboarding/import');
        } 
        else {
            // SWIPE RIGHT (--->) -> Wizard
            router.navigate('/onboarding/wizard');
        }
    }
}

// Registro del Web Component
customElements.define('onboarding-welcome', OnboardingWelcome);