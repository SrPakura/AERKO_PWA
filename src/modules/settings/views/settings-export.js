// src/modules/settings/views/settings-export.js

import { ICONS } from '../../../core/theme/icons.js';
import { bus } from '../../../core/bus/index.js';
import { exportService } from '../services/export.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js';

export class SettingsExport extends HTMLElement {
    constructor() {
        super();
        // Por defecto, queremos que se exporte todo - Eddit del 5 de marzo, mañana salgo, aunque eso si, llueve. Yo sintiendolo mucho en el corazón, ya puede haber una nueva dana que si mis amigos no sé presentan, voy a buscarlos a su casa a buscarlos uno por uno. Solo puedo salir 3 horas porque mi perro se queda con mis padres y tampoco me fio mucho de que sean capaces de sacarlo a mear, pero bueno, por lo menos salgo, vamoooooooo. En fin, es bastante duro todo, porque claro, mientras no me acuerdo, creo que se he superado a María completamente, pero por otro lado, en estos días atrás que he escrito sobre ella, fu. Ya he dicho que he llorado, pero es que no puedo otra cosa. Quiero que me comprendáis, si me hubiera quedado con ella hoy en día todavía estaría repitiendo 4 de la eso. Con ella era feliz, estaba comodo, pero sabía perfectamente que no podía seguir así. Tengo mucha hambre de comerme el mundo, y cuando estaba con ella, pues bueno, casi repito segundo de la eso. Después de estos años, he evolucionado muchisimo en la vida. Me he centrado en mi mismo, en quererme, en crecer. Me encantan las matemáticas, la física, el deporte (literalmente soy un enfermo del deporte, no me puedo estar quieto, aunque llevo 3 meses sin entrenar para hacer esta app), he empezado a pensar, a leer, a priorizarme. No me arrepiento de nada, si no lo hubiera hecho hoy en día no sería quien soy. Si hubiera seguido con ella, todavía sería un niño en la vida. Lo triste es que la primera vez que lo dejamos, me fuí con zaida a los 4 días. Zaida creía que yo la iba a querer como quería a Maria, y yo creía que iba a amarla igual que a María. Claramente no, con Zaida comprendí la diferencia entre amor y soledad acompañada. Después de Taiga, volví con María. Allí comprendí que realmente me quería. Me perdono que la dejase una primera vez por pura inmadurez, y me acepto como si nada hubiera pasado. No le importaba que fuese feo, que fuese bajito, que hubiese ganado peso, que no hubiese hecho nada en mi vida... Simplemente le importaba que fuera yo, y joder, como no voy a llorar recordandola o escribiendo esto? Si María está leyendo esto, de verdad, lo siento. Me gustaría volver a encontrarte, darte un abrazo y despedirme de una vez, pero tengo miedo, no solo de que ya no seas la María que recuerdo, de que ya no me aceptes indondicionalmente o que no me quieras. Miedo de caer, miedo de que todo haya sido para nada. Miedo de haberme equivocado. Se que nunca lo leerá, así que para el que me lea, por favor, no seas como yo. Tremendo texto he escrito en verdad, pobre el que lo tenga que leer
        this.selectedVaults = [
            'public_store', 
            'user_vault', 
            'progress_vault', 
            'training_vault', 
            'nutrition_vault'
        ];
        this.dict = null;
    }

    async connectedCallback() {
        // Carga asíncrona del diccionario de esta vista
        this.dict = await i18nService.loadPage('settings/export');
        this.render();
        this.addListeners();
    }

    render() {
        if (!this.dict) return;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                .settings-screen {
                    display: flex;
                    flex-direction: column; width: 100%; height: 100dvh; background: var(--Negro-suave);
                }

                .content-scroll {
                    flex: 1;
                    display: flex; flex-direction: column; padding: 24px; gap: 32px;
                    overflow-y: auto; scrollbar-width: none;
                    border-bottom: 1px solid var(--Blanco);
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                .footer-section {
                    background: var(--Negro-suave);
                    padding: 0 24px 24px 24px; flex-shrink: 0;
                }
                .spacer-24 { height: 24px; }

                .info-box {
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    padding: 16px;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    line-height: 150%;
                }
            </style>

            <div class="settings-screen">
                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('export_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    <div class="info-box">
                        ${this.dict.t('export_desc')} <br><br>
                        <span style="color: var(--Verde-acido);">${this.dict.t('export_note_title')}</span> 
                        ${this.dict.t('export_note_desc')}
                    </div>

                    <app-input-card label="${this.dict.t('export_label_vaults')}" grid="1">
                        <app-box class="vault-toggle" data-vault="public_store" clickable active>${this.dict.t('vault_public')}</app-box>
                        <app-box class="vault-toggle" data-vault="user_vault" clickable active>${this.dict.t('vault_user')}</app-box>
                        <app-box class="vault-toggle" data-vault="progress_vault" clickable active>${this.dict.t('vault_progress')}</app-box>
                        <app-box class="vault-toggle" data-vault="training_vault" clickable active>${this.dict.t('vault_training')}</app-box>
                        <app-box class="vault-toggle" data-vault="nutrition_vault" clickable active>${this.dict.t('vault_nutrition')}</app-box>
                    </app-input-card>
                    
                </main>

                <section class="footer-section">
                    <div class="spacer-24"></div>
                    <app-btn variant="primary" label="${this.dict.t('btn_export')}" id="btn-export" style="width: 100%; display: block;"></app-btn>
                </section>
            </div>
        `;
    }

    addListeners() {
        if (!this.dict) return;

        // --- NAVEGACIÓN ---
        this.querySelector('#btn-back').addEventListener('click', () => window.history.back());

        // --- LÓGICA DE LAS CAJAS (TOGGLES) ---
        this.querySelectorAll('.vault-toggle').forEach(box => {
            box.addEventListener('click', () => {
                const vaultName = box.dataset.vault;
                
                if (this.selectedVaults.includes(vaultName)) {
                    this.selectedVaults = this.selectedVaults.filter(v => v !== vaultName);
                    box.removeAttribute('active');
                } else {
                    this.selectedVaults.push(vaultName);
                    box.setAttribute('active', '');
                }

                // Control del botón: Si no hay nada seleccionado, lo deshabilitamos
                const btnExport = this.querySelector('#btn-export');
                if (this.selectedVaults.length === 0) {
                    btnExport.setAttribute('disabled', 'true');
                } else {
                    btnExport.removeAttribute('disabled');
                }
            });
        });

        // --- BOTÓN DE EXPORTACIÓN ---
        const btnExport = this.querySelector('#btn-export');
        btnExport.addEventListener('click', async () => {
            if (this.selectedVaults.length === 0) return;

            try {
                // Estado de "Pensando..." para que el usuario no machaque el botón
                btnExport.setAttribute('label', this.dict.t('btn_processing'));
                btnExport.setAttribute('disabled', 'true');

                // Llamada al servicio
                await exportService.exportData(this.selectedVaults);

                // Grito al bus del sistema para mostrar una notificación de éxito
                bus.emit('SYSTEM_NOTIFY', { message: this.dict.t('notify_export_success'), type: 'success' });

            } catch (error) {
                console.error('[EXPORTACIÓN FALLIDA]', error);
                
                // Si el error empieza por err_, lo tratamos como llave de diccionario. Si no, error por defecto.
                const errorMsg = error.message.startsWith('err_') 
                    ? this.dict.t(error.message) 
                    : this.dict.t('notify_export_error');
                    
                bus.emit('SYSTEM_NOTIFY', { message: errorMsg, type: 'error' });
            } finally {
                // Volvemos al estado original del botón
                btnExport.setAttribute('label', this.dict.t('btn_export'));
                btnExport.removeAttribute('disabled');
            }
        });
    }
}

customElements.define('settings-export', SettingsExport);