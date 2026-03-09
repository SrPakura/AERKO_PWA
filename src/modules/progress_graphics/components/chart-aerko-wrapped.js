// src/modules/progress_graphics/components/chart-aerko-wrapped.js

import { wrappedService } from '../services/wrapped.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // [cite: 64, 104]

export class ChartAerkoWrapped extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = null;
        this._interval = null;
        this.dict = null; // Almacén del diccionario [cite: 90]
    }

    set data(val) {
        this._data = val;
        if (this.isConnected && this.dict) {
            this._checkCooldownAndRender();
        }
    }

    async connectedCallback() {
        // Fase de Fontanería: Carga asíncrona del diccionario [cite: 72, 73]
        this.dict = await i18nService.loadPage('progress_graphics/chart-aerko-wrapped');
        await this._checkCooldownAndRender();
    }

    disconnectedCallback() {
        if (this._interval) clearInterval(this._interval);
    }

    async _checkCooldownAndRender() {
        const status = await wrappedService.getCooldownStatus();
        this.render(status);
        this._attachListeners(status.canGenerate);

        if (!status.canGenerate) {
            this._startCountdown(status.remainingMs);
        }
    }

    _formatTime(ms) {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24));
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((ms % (1000 * 60)) / 1000);
        
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const ss = s.toString().padStart(2, '0');

        // Interpolación manual con diccionarios 
        return `${this.dict.t('wrap_cd_prefix')}${d}${this.dict.t('wrap_cd_d')}${hh}${this.dict.t('wrap_cd_h')}${mm}${this.dict.t('wrap_cd_m')}${ss}${this.dict.t('wrap_cd_s')}`;
    }

    _startCountdown(initialRemaining) {
        let remaining = initialRemaining;
        const btn = this.shadowRoot.querySelector('#btn-download');
        
        if (this._interval) clearInterval(this._interval);
        
        this._interval = setInterval(() => {
            remaining -= 1000;
            if (remaining <= 0) {
                clearInterval(this._interval);
                this._checkCooldownAndRender(); 
            } else {
                if (btn) btn.setAttribute('label', this._formatTime(remaining));
            }
        }, 1000);
    }

    render(status = { canGenerate: true }) {
        if (!this.dict) return; // Seguridad: no pintar sin traducciones [cite: 83]

        const btnVariant = status.canGenerate ? 'primary' : 'secondary';
        const btnLabel = status.canGenerate ? this.dict.t('wrap_btn_download') : this._formatTime(status.remainingMs);
        const disabledAttr = status.canGenerate ? '' : 'disabled';

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                @import url('/src/modules/system/components/btn.css');

                :host {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    flex: 1;
                    box-sizing: border-box;
                }

                .text-block {
                    display: flex;
                    flex-direction: column;
                    gap: 24px; 
                    color: var(--Blanco, #FFFFFF);
                    font-family: var(--font-body, "JetBrains Mono", monospace);
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 150%;
                }

                .text-block p {
                    margin: 0;
                }

                .action-wrapper {
                    display: flex;
                    width: 100%;
                    margin-top: auto;
                    padding-top: 32px; 
                }

                app-btn {
                    width: 100%;
                    display: block;
                }
            </style>

            <div class="text-block">
                <p>${this.dict.t('wrap_intro_1')}</p>
                <p>${this.dict.t('wrap_intro_2')}</p>
                <p>${this.dict.t('wrap_intro_3')} ${this.dict.t('wrap_intro_4')}</p>
                <p>${this.dict.t('wrap_intro_5')}</p>
                <p>${this.dict.t('wrap_intro_6')}</p>
            </div>
            
            <div class="action-wrapper">
                <app-btn variant="${btnVariant}" label="${btnLabel}" id="btn-download" ${disabledAttr}></app-btn>
            </div>
        `;
    }

    _attachListeners(canGenerate) {
        const btn = this.shadowRoot.querySelector('#btn-download');
        if (btn && canGenerate) {
            btn.addEventListener('click', () => {
                this._generateAndDownload();
            });
        }
    }

    async _generateAndDownload() {
        const status = await wrappedService.getCooldownStatus();
        if (!status.canGenerate) {
            alert(this.dict.t('wrap_alert_hacker'));
            return;
        }

        const btn = this.shadowRoot.querySelector('#btn-download');
        btn.setAttribute('label', this.dict.t('wrap_btn_processing'));
        btn.style.pointerEvents = 'none'; 

        try {
            await wrappedService.generatePoster(this._data);
            this._checkCooldownAndRender();
        } catch (error) {
            console.error("🔴 [UI WRAPPED] Error:", error);
            alert(this.dict.t('wrap_alert_error'));
            btn.setAttribute('label', this.dict.t('wrap_btn_download'));
            btn.style.pointerEvents = 'auto';
        }
    }
}

if (!customElements.get('chart-aerko-wrapped')) {
    customElements.define('chart-aerko-wrapped', ChartAerkoWrapped);
}