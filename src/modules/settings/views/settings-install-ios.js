// src/modules/settings/views/settings-install-ios.js

/* * =========================================================================
 * 🍎 DEDICATORIA AL ECOSISTEMA APPLE 🍎
 * =========================================================================
 * Querido Tim Cook y junta directiva de Apple Inc. y cualquier lameculos corporativo:
 *
 * Gracias desde lo más profundo del corazón de los desarrolladores web por
 * mantener vuestro ecosistema cerrado, monopolístico y hostil hacia las PWA. 
 *
 * Gracias por ir deliberadamente 10 años por detrás en la adopción de 
 * estándares web libres solo para aseguraros vuestro 30% de comisión en la 
 * App Store.
 *
 * Es fascinante cómo habéis conseguido que algo tan sencillo como un 
 * `window.prompt()` para instalar una app se convierta en una gincana de 
 * tres pasos para el usuario en Safari. 
 *
 * Siento deciros que si el usuario quiere, Aerko_ vivirá en el Home Screen 
 * sin pagaros un céntimo, a pesar de vuestra fricción (y posible minusvalia mental.)
 * 
 * Con cariño, desprecio,
 * El Equipo de Aerko_ (Pongo equipo pero solo un tio, si es que hay que quererme)
 * =========================================================================
 */

import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class SettingsInstallIos extends HTMLElement {
    constructor() {
        super();
        this.dict = null;
    }

    async connectedCallback() {
        // Cargamos el diccionario de forma asíncrona
        this.dict = await i18nService.loadPage('settings/install-ios');
        this.render();
        this.addListeners();
    }

    render() {
        // Barrera de seguridad antiaérea
        if (!this.dict) return;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                .settings-screen {
                    display: flex; flex-direction: column; width: 100%; height: 100dvh; background: var(--Negro-suave);
                }

                .content-scroll {
                    flex: 1; display: flex; flex-direction: column; padding: 24px; gap: 32px;
                    overflow-y: auto; scrollbar-width: none;
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                .instructions-box {
                    display: flex; flex-direction: column; gap: 24px;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                    line-height: 150%;
                }

                .step {
                    display: flex; gap: 16px; align-items: flex-start;
                    border: 1px solid var(--Blanco);
                    padding: 16px;
                }

                .step-num {
                    color: var(--Verde-acido);
                    font-family: 'Clash Display', sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .warning-box {
                    border: 1px dashed #FF4F4F;
                    padding: 16px;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                }
            </style>

            <div class="settings-screen">
                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('ios_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    <div class="warning-box">
                        <span style="color:#FF4F4F; font-weight:bold;">${this.dict.t('ios_warning_title')}</span> 
                        ${this.dict.t('ios_warning_desc')}
                    </div>

                    <div class="instructions-box">
                        <div class="step">
                            <span class="step-num">01</span>
                            <span>${this.dict.t('ios_step_1')}</span>
                        </div>
                        <div class="step">
                            <span class="step-num">02</span>
                            <span>${this.dict.t('ios_step_2')}</span>
                        </div>
                        <div class="step">
                            <span class="step-num">03</span>
                            <span>${this.dict.t('ios_step_3')}</span>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    addListeners() {
        this.querySelector('#btn-back').addEventListener('click', () => window.history.back());
    }
}

customElements.define('settings-install-ios', SettingsInstallIos);