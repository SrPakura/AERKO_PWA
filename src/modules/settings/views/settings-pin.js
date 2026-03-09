// src/modules/settings/views/settings-pin.js

import { ICONS } from '../../../core/theme/icons.js';
import { authService } from '../../auth/services/auth.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // INYECTAMOS EL TRADUCTOR

import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js';
import '../../system/components/keypad-modal.js';

export class SettingsPin extends HTMLElement {
    constructor() {
        super();
        this.hasSecurity = false;
        this.config = null;
        this.dict = null; // Variable para el diccionario
        
        // La "Pizarra Temporal" para no guardar en BD con cada clic
        this.localVaults = []; 
    }

    async connectedCallback() {
        // Cargamos el diccionario de forma asíncrona
        this.dict = await i18nService.loadPage('settings/pin');

        this.hasSecurity = await authService.hasPin();
        this.config = await authService._getConfig(); 
        
        // Copiamos la configuración real a nuestra pizarra temporal
        this.localVaults = [...this.config.protected_vaults];
        
        this.render();
        this.addListeners();
    }

    render() {
        // Bloqueo de seguridad si el diccionario no ha cargado
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
                    border-bottom: 1px solid var(--Blanco);
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                .footer-section {
                    background: var(--Negro-suave); padding: 0 24px 24px 24px; flex-shrink: 0;
                    display: flex; flex-direction: column; gap: 16px; /* Gap añadido para separar botones múltiples */
                }
                .spacer-24 { height: 24px; }

                .warning-box {
                    border: 1px solid #FF4F4F;
                    background: rgba(255, 79, 79, 0.05);
                    padding: 16px;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    line-height: 150%;
                }
                .text-red { color: #FF4F4F; font-weight: bold; }
            </style>

            <app-keypad-modal id="pin-keypad"></app-keypad-modal>

            <div class="settings-screen">
                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('pin_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    ${!this.hasSecurity ? `
                        <div class="warning-box">
                            <span class="text-red">${this.dict.t('pin_warning_off_title')}</span> 
                            <br><br>
                            ${this.dict.t('pin_warning_off_desc')}
                        </div>
                    ` : `
                        <div class="warning-box" style="border-color: var(--Blanco); background: transparent;">
                            <span class="text-red">${this.dict.t('pin_warning_on_title')}</span>
                            ${this.dict.t('pin_warning_on_desc')}
                        </div>
                    `}

                    <app-input-card label="${this.dict.t('pin_label_vaults')}" grid="1">
                        <app-box class="vault-toggle" data-vault="user_vault" clickable ${this.localVaults.includes('user_vault') ? 'active' : ''}>${this.dict.t('vault_user')}</app-box>
                        <app-box class="vault-toggle" data-vault="progress_vault" clickable ${this.localVaults.includes('progress_vault') ? 'active' : ''}>${this.dict.t('vault_progress')}</app-box>
                        <app-box class="vault-toggle" data-vault="training_vault" clickable ${this.localVaults.includes('training_vault') ? 'active' : ''}>${this.dict.t('vault_training')}</app-box>
                        <app-box class="vault-toggle" data-vault="nutrition_vault" clickable ${this.localVaults.includes('nutrition_vault') ? 'active' : ''}>${this.dict.t('vault_nutrition')}</app-box>
                    </app-input-card>
                    
                </main>

                <section class="footer-section">
                    <div class="spacer-24"></div>
                    ${!this.hasSecurity ? `
                        <app-btn variant="primary" label="${this.dict.t('btn_activate_pin')}" id="btn-activate" style="width: 100%; display: block;"></app-btn>
                    ` : `
                        <app-btn variant="primary" label="${this.dict.t('btn_save')}" id="btn-save" style="width: 100%; display: block;"></app-btn>
                        <app-btn variant="secondary" label="${this.dict.t('btn_disable_pin')}" id="btn-disable" style="width: 100%; display: block; border-color: #FF4F4F; color: #FF4F4F;"></app-btn>
                    `}
                </section>
            </div>
        `;
    }

    addListeners() {
        // --- NAVEGACIÓN ---
        this.querySelector('#btn-back').addEventListener('click', () => window.history.back());

        const modal = this.querySelector('#pin-keypad');

        // --- CAJAS DE BÓVEDAS (Modifican solo la RAM / localVaults) ---
        this.querySelectorAll('.vault-toggle').forEach(box => {
            box.addEventListener('click', () => {
                const vaultName = box.dataset.vault;
                
                // Si la bóveda está marcada, la quitamos. Si no, la ponemos.
                if (this.localVaults.includes(vaultName)) {
                    this.localVaults = this.localVaults.filter(v => v !== vaultName);
                    box.removeAttribute('active'); // Actualización visual al vuelo
                } else {
                    this.localVaults.push(vaultName);
                    box.setAttribute('active', ''); // Actualización visual al vuelo
                }
            });
        });

        // --- BOTÓN: ACTIVAR PIN (Estado 1) ---
        this.querySelector('#btn-activate')?.addEventListener('click', async () => {
            const res = await modal.open(this.dict.t('modal_create_pin'), '', 'numeric');
            if (res && res.value && res.value.length === 4) {
                // 1. Guardamos las cajas que haya elegido ANTES de activar la seguridad
                await authService.updateProtectedVaults(this.localVaults);
                // 2. Ejecutamos la magia criptográfica del PIN
                await authService.enableSecurity(res.value);
                // 3. Recargamos la vista (pasará automáticamente al Estado 2)
                this.connectedCallback(); 
            } else if (res && res.value.length !== 4) {
                alert(this.dict.t('alert_pin_length'));
            }
        });

        // --- BOTÓN: GUARDAR (Estado 2) ---
        this.querySelector('#btn-save')?.addEventListener('click', async () => {
            // Guardamos la configuración de las bóvedas en DB y volvemos atrás
            await authService.updateProtectedVaults(this.localVaults);
            window.history.back(); 
        });

        // --- BOTÓN: DESACTIVAR SEGURIDAD (Estado 2) ---
        this.querySelector('#btn-disable')?.addEventListener('click', async () => {
            const res = await modal.open(this.dict.t('modal_enter_pin'), '', 'numeric');
            if (res && res.value) {
                const success = await authService.disableSecurity(res.value);
                if (success) {
                    alert(this.dict.t('alert_pin_disabled'));
                    // Recargamos la vista (pasará automáticamente al Estado 1)
                    this.connectedCallback(); 
                } else {
                    alert(this.dict.t('alert_pin_wrong'));
                }
            }
        });
    }
}

customElements.define('settings-pin', SettingsPin);