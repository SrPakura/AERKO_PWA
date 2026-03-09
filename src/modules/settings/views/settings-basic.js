// src/modules/settings/views/settings-basic.js

import { ICONS } from '../../../core/theme/icons.js';
import { userService } from '../../user/services/user.service.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // <-- INYECTAMOS i18n

// Importamos los componentes del sistema
import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js';
import '../../system/components/unit-toggle.js';
import '../../system/components/keypad-modal.js';

export class SettingsBasic extends HTMLElement {
    constructor() {
        super();
        this.dict = null; // Preparamos la variable del diccionario

        // Hidratamos el estado con lo que ya tenga el usuario guardado
        const profile = userService.getProfile();
        
        // RECUPERAMOS LAS UNIDADES GUARDADAS (O por defecto)
        this.state = {
            gender: profile.gender || 'XX',
            age: profile.age || '--',
            unitHeight: profile.heightUnit || 'CM',
            unitWeight: profile.weightUnit || 'KG'
        };

        // PASAMOS DE LA BASE DE DATOS (Métrico puro) A LA VISTA
        this.state.height = profile.height 
            ? unitService.toDisplay(profile.height, this.state.unitHeight) 
            : '--';
            
        this.state.weight = profile.weight 
            ? unitService.toDisplay(profile.weight, this.state.unitWeight) 
            : '00.0';
    }

    async connectedCallback() {
        // Carga asíncrona del diccionario de esta vista
        this.dict = await i18nService.loadPage('settings/basic');
        this.render();
        this.addListeners();
    }

    render() {
        // Barrera de seguridad antiaérea
        if (!this.dict) return;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                /* Estructura Principal */
                .settings-screen {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    height: 100dvh;
                    background: var(--Negro-suave);
                }

                /* FRAME 2: El contenido con scroll y el borde blanco abajo */
                .content-scroll {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 24px;
                    gap: 24px;
                    overflow-y: auto;
                    scrollbar-width: none;
                    border-bottom: 1px solid var(--Blanco); /* Borde exigido por diseño */
                }
                .content-scroll::-webkit-scrollbar { display: none; }

                /* FRAME 3: El Footer con padding superior 0 */
                .footer-section {
                    background: var(--Negro-suave);
                    padding: 0 24px 24px 24px; /* Lateral 24, Inferior 24, Superior 0 */
                    flex-shrink: 0;
                }
                
                .spacer-24 {
                    height: 24px; /* Un espaciador interno para que el botón no toque la línea, respetando el padding top 0 */
                }

                .value-text {
                    flex: 1;
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 16px;
                }
            </style>

            <div class="settings-screen">
                <app-keypad-modal id="settings-keypad"></app-keypad-modal>

                <div id="btn-back" style="padding: calc(env(safe-area-inset-top) + 24px) 24px 24px 24px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid var(--Blanco); cursor: pointer; background: var(--Negro-suave); position: sticky; top: 0; z-index: 10;">
                    ${ICONS.ARROW_LEFT}
                    <span style="color: var(--Blanco); font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500;">
                        ${this.dict.t('basic_header')}
                    </span>
                </div>

                <main class="content-scroll">
                    
                    <app-input-card label="${this.dict.t('basic_genetic')}" grid="2">
                        <app-box id="gen-xx" clickable ${this.state.gender === 'XX' ? 'active' : ''}>XX</app-box>
                        <app-box id="gen-xy" clickable ${this.state.gender === 'XY' ? 'active' : ''}>XY</app-box>
                    </app-input-card>

                    <app-input-card label="${this.dict.t('basic_age')}">
                        <app-box id="box-age" clickable>
                            <span class="value-text" id="val-age">${this.state.age}</span>
                        </app-box>
                    </app-input-card>

                    <app-input-card label="${this.dict.t('basic_height')}">
                        <app-box id="box-height" clickable>
                            <span class="value-text" id="val-height">${this.state.height}</span>
                            <app-unit-toggle options="CM, IN" value="${this.state.unitHeight}" id="toggle-height"></app-unit-toggle>
                        </app-box>
                    </app-input-card>

                    <app-input-card label="${this.dict.t('basic_weight')}">
                        <app-box id="box-weight" clickable>
                            <span class="value-text" id="val-weight">${this.state.weight}</span>
                            <app-unit-toggle options="KG, LB, ST" value="${this.state.unitWeight}" id="toggle-weight"></app-unit-toggle>
                        </app-box>
                    </app-input-card>

                </main>

                <section class="footer-section">
                    <div class="spacer-24"></div>
                    <app-btn variant="primary" label="${this.dict.t('btn_save')}" id="btn-save" style="width: 100%; display: block;"></app-btn>
                </section>
            </div>
        `;
    }

    addListeners() {
        const modal = this.querySelector('#settings-keypad');

        // --- NAVEGACIÓN (VOLVER) ---
        this.querySelector('#btn-back').addEventListener('click', () => {
            window.history.back(); 
        });

        // --- GÉNERO ---
        this.querySelector('#gen-xx').addEventListener('click', () => this.setGender('XX'));
        this.querySelector('#gen-xy').addEventListener('click', () => this.setGender('XY'));

        // --- EDAD ---
        this.querySelector('#box-age').addEventListener('click', async () => {
            // Inyectamos traducción al modal
            const result = await modal.open(this.dict.t('basic_age'), this.state.age, 'numeric');
            if (result !== null) {
                this.state.age = result.value; 
                this.querySelector('#val-age').innerText = result.value;
            }
        });

        // --- ALTURA ---
        this.querySelector('#box-height').addEventListener('click', async () => {
            // Inyectamos traducción al modal
            const result = await modal.open(this.dict.t('basic_height'), this.state.height, 'dynamic', this.state.unitHeight, 'CM, IN', (newUnit) => {
                this.state.unitHeight = newUnit; 
                this.querySelector('#toggle-height').setAttribute('value', newUnit);
            });

            if (result !== null) {
                this.state.height = result.value;
                this.state.unitHeight = result.unit;
                this.querySelector('#val-height').innerText = result.value;
                this.querySelector('#toggle-height').setAttribute('value', result.unit);
            }
        });

        // --- PESO ---
        this.querySelector('#box-weight').addEventListener('click', async () => {
            // Inyectamos traducción al modal
            const result = await modal.open(this.dict.t('modal_weight'), this.state.weight, 'dynamic', this.state.unitWeight, 'KG, LB, ST', (newUnit) => {
                this.state.unitWeight = newUnit; 
                this.querySelector('#toggle-weight').setAttribute('value', newUnit);
            });

            if (result !== null) {
                this.state.weight = result.value;
                this.state.unitWeight = result.unit;
                this.querySelector('#val-weight').innerText = result.value;
                this.querySelector('#toggle-weight').setAttribute('value', result.unit);
            }
        });

        // --- GUARDADO ---
        this.querySelector('#btn-save').addEventListener('click', async () => {
            
            // TRADUCIMOS DE VUELTA A MÉTRICO (KG y CM puros) PARA LA BD
            // Y GUARDAMOS LA PREFERENCIA DE UNIDAD DEL USUARIO
            await userService.updateBiometrics({
                gender: this.state.gender,
                age: this.state.age,
                
                // Guardamos el número en Base (Métrico)
                height: unitService.toBase(this.state.height, this.state.unitHeight),
                weight: unitService.toBase(this.state.weight, this.state.unitWeight),
                
                // Guardamos la preferencia visual del usuario para toda la app
                heightUnit: this.state.unitHeight,
                weightUnit: this.state.unitWeight
            });

            // Retorno táctico a los ajustes
            window.history.back();
        });
    }

    setGender(val) {
        this.state.gender = val;
        // Para no re-renderizar todo, tocamos las clases a mano
        const boxXX = this.querySelector('#gen-xx');
        const boxXY = this.querySelector('#gen-xy');
        
        if (val === 'XX') {
            boxXX.setAttribute('active', '');
            boxXY.removeAttribute('active');
        } else {
            boxXY.setAttribute('active', '');
            boxXX.removeAttribute('active');
        }
    }
}

customElements.define('settings-basic', SettingsBasic);