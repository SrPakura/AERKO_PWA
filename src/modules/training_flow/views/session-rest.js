import { router } from '../../../core/router/index.js';
import { sessionService } from '../../training_core/services/session.service.js';
import { trainingStore } from '../../training_core/store/index.js';
import { unitService } from '../../../core/utils/unit.service.js';
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';
import { oneRmService } from '../../training_core/services/1rm.service.js'; // Hay que meter el feedback jeje

// Importamos componentes del sistema
import '../../system/components/btn.js';
import '../../system/components/input-card.js';
import '../../system/components/box.js'; 
import '../../system/components/keypad-modal.js'; 
import '../../system/components/segment-select.js'; 

export class TrainingSessionRest extends HTMLElement {
    constructor() {
        super();
        this.exerciseId = null;
        this.isRestMode = false;
        
        // Lógica del Crono
        this.defaultTime = parseInt(localStorage.getItem('aerko_global_rest')) || 90;
        this.timeLeft = this.defaultTime;
        this.timerInterval = null;
        
        // ESTADO DE LA SERIE (Variables en memoria)
        this.currentWeight = 0;
        this.currentReps = 0;
        
        // Cargar la unidad preferida del usuario al iniciar la pantalla
        const profile = userService.getProfile();
        this.currentUnit = profile.weightUnit || 'KG'; 
        
        this.selectedRIR = null;
        this.hasSaved = false; // NUEVA LÍNEA: Seguro para evitar guardados fantasma
    }

    async connectedCallback() {
        const cleanPath = window.location.hash.split('?')[0];
        const parts = cleanPath.split('/');
        this.exerciseId = parts[parts.length - 1];

        const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
        this.isRestMode = urlParams.get('mode') === 'rest';

        // AÑADIMOS ESTA LÍNEA
        this.i18n = await i18nService.loadPage('training_flow/session-rest');

        this.render();
        this._initComponents(); 
        this._attachListeners();

        if (this.isRestMode) {
            this.startTimer();
        }
    }

    disconnectedCallback() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    // --- LÓGICA DEL CRONO ---
    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval); // Paramos el crono
                
                // Si NO ha guardado manualmente, forzamos el guardado.
                // Si YA guardó, simplemente navegamos al Runner.
                if (!this.hasSaved) {
                    this.saveSet(true); 
                } else {
                    router.navigate(`/training/runner/${this.exerciseId}`);
                }
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const display = this.querySelector('#timer-display');
        if (!display) return;

        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
    }

    updateGlobalTime(newSeconds) {
        this.defaultTime = newSeconds;
        this.timeLeft = newSeconds;
        localStorage.setItem('aerko_global_rest', newSeconds);
        this.updateTimerDisplay();
    }

    // --- GUARDADO ---
    async saveSet(isEmpty = false) {
        if (this.hasSaved) return; // Seguro activado
        
        let isRecord = false;

        // 🟢 EL TRADUCTOR INVISIBLE: Pasamos lo que hay en pantalla a la unidad Base (KG)
        const baseWeight = unitService.toBase(this.currentWeight, this.currentUnit);

        // 1. Lógica del Récord y Guardado
        if (!isEmpty) {
            // A. Consultamos el récord histórico ANTES de guardar
            const previousBest = trainingStore.getExerciseSnapshot(this.exerciseId);

            // Calculamos el e1RM actual usando el PESO BASE (Kilos exactos)
            const currentE1RM = baseWeight * (1 + (0.0333 * this.currentReps));

            if (!previousBest) {
                isRecord = true; // Primer registro = Récord automático
            } else {
                const prevE1RM = previousBest.lastKg * (1 + (0.0333 * previousBest.lastReps));
                // Comparamos peras con peras (Todo en Kilos)
                if (currentE1RM > prevE1RM || baseWeight > previousBest.lastKg) {
                    isRecord = true;
                }
            }

            // B. Guardamos en el servicio EL PESO BASE (Nunca la ilusión óptica de la UI)
            sessionService.logSet(
                this.exerciseId, 
                baseWeight, 
                this.currentReps, 
                this.selectedRIR
            );
        } else {
             sessionService.logSet(this.exerciseId, 0, 0, 0);
        }

        // 2. Activamos el seguro
        this.hasSaved = true;

        // 3. MAGIA VISUAL Y BIFURCACIÓN DE RUTAS - No sé cambiarlo así que le he pedido ayuda a gemini. Tristisimo lo que hace dormir 3 horas...
        if (this.isRestMode) {
            const formInputs = this.querySelector('.form-inputs');
            const actionContainer = this.querySelector('.action-container');
            const feedbackContainer = this.querySelector('#feedback-pr');
            const prTitle = this.querySelector('#pr-title');
            // NUEVO: Seleccionamos el subtítulo
            const feedbackSubtitle = this.querySelector('.feedback-subtitle');

            if (formInputs) formInputs.style.display = 'none';
            if (actionContainer) actionContainer.style.display = 'none';

            if (feedbackContainer) {
                feedbackContainer.style.display = 'flex';
                
                // --- NUESTRA MAGIA DE 1RM AQUÍ ---
                if (feedbackSubtitle && !isEmpty) {
                    // 1. Pedimos la key al servicio
                    const feedbackKey = oneRmService.getFeedbackMessage(this.currentReps);
                    // 2. Si hay key, la traducimos. Si no (ej: 8 repes), limpiamos el texto
                    feedbackSubtitle.innerText = feedbackKey ? this.i18n.t(feedbackKey) : '';
                } else if (feedbackSubtitle) {
                    feedbackSubtitle.innerText = ''; // Limpiamos si es un descanso vacío
                }
                // ---------------------------------

                if (isRecord && !isEmpty) {
                    // El mensaje de récord SÍ debe mostrar la unidad que eligió el usuario
                    prTitle.innerText = `${this.i18n.t('rest_title_record')}${this.currentWeight}${this.currentUnit}`;
                    prTitle.style.color = 'var(--Verde-acido)'; 
                } else if (!isEmpty) {
                    prTitle.innerText = this.i18n.t('rest_title_completed');
                    prTitle.style.color = 'var(--Blanco)'; 
                } else {
                    prTitle.innerText = this.i18n.t('rest_title_resting');
                    prTitle.style.color = 'var(--Blanco)';
                }
            }

            if (this.timeLeft <= 0) {
                setTimeout(() => {
                    router.navigate(`/training/runner/${this.exerciseId}`);
                }, 1500);
            }

        } else {
            router.navigate('/training/session');
        }
    }

    render() {
        const timerHtml = this.isRestMode ? `
            <div class="timer-card">
                <div class="timer-controls-grid">
                    <button data-add="-30">-30s</button>
                    <button data-add="-10">-10s</button>
                    <button data-add="10">+10s</button>
                    <button data-add="30">+30s</button>
                </div>
                
                <div class="timer-display-area">
                    <span id="timer-display">00:00</span>
                </div>
                
                <div class="timer-footer" id="btn-edit-global">
                    ${this.i18n.t('rest_btn_edit_time')}
                </div>
            </div>
        ` : '';

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    background-color: var(--Negro-suave);
                }

                .rest-screen {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    min-height: 100dvh;
                    max-width: 480px;
                    margin: 0 auto;
                    box-sizing: border-box;
                    padding: calc(env(safe-area-inset-top) + 24px) 24px calc(env(safe-area-inset-bottom) + 24px) 24px;
                }

                .timer-section {
                    flex-shrink: 0;
                    width: 100%;
                }

                .bottom-section {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    gap: 32px;
                    width: 100%;
                    margin-top: 32px;
                    transition: opacity 2s ease, visibility 2s ease;
                }

                .bottom-section.hidden-smooth {
                    opacity: 0;
                    visibility: hidden;
                    pointer-events: none;
                }
                
                /* --- NUEVO: FEEDBACK DE RÉCORD --- */
                .feedback-container {
                    display: none; /* Oculto hasta que guardemos */
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    gap: 16px;
                    animation: fadeIn 0.5s ease forwards;
                    padding-bottom: 32px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .feedback-title {
                    font-family: "Clash Display", sans-serif;
                    font-size: 32px;
                    font-weight: 700;
                    line-height: 110%;
                }

                .feedback-subtitle {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    opacity: 0.8;
                }

                .form-inputs {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .timer-card {
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--Blanco);
                }

                .timer-controls-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    border-bottom: 1px solid var(--Blanco);
                }

                .timer-controls-grid button {
                    background: transparent;
                    border: none;
                    border-right: 1px solid var(--Blanco);
                    color: var(--Blanco);
                    padding: 12px 0;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    cursor: pointer;
                }
                .timer-controls-grid button:last-child {
                    border-right: none;
                }
                .timer-controls-grid button:active {
                    background: rgba(255,255,255,0.1);
                    color: var(--Verde-acido);
                }

                .timer-display-area {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 24px 0;
                    font-family: "Clash Display", sans-serif;
                    font-size: 80px; 
                    font-weight: 700;
                    color: var(--Blanco);
                    line-height: 100%;
                    letter-spacing: 2px;
                }

                .timer-footer {
                    border-top: 1px solid var(--Blanco);
                    padding: 12px;
                    text-align: center;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    color: var(--Blanco);
                    cursor: pointer;
                    text-transform: uppercase;
                    opacity: 0.8;
                }
                .timer-footer:active {
                    background: rgba(255,255,255,0.1);
                }

                .input-value-text {
                    font-size: 18px;
                    color: var(--Blanco);
                }
                
                .unit-text {
                    font-size: 14px;
                    color: var(--Verde-acido);
                    margin-left: 8px;
                }

                .placeholder { opacity: 0.5; }

            </style>

            <app-keypad-modal id="modal-keypad"></app-keypad-modal>

            <div class="rest-screen">
                <div class="timer-section" id="section-timer">
                    ${timerHtml}
                </div>

                <div class="bottom-section" id="section-bottom">
                    <div class="form-inputs">
                        <<app-input-card label="${this.i18n.t('rest_lbl_weight')}">
                            <app-box id="box-weight" clickable>
                                <span id="val-weight" class="input-value-text placeholder">0</span>
                                <span id="val-unit" class="unit-text">[ KG ]</span>
                            </app-box>
                        </app-input-card>

                        <app-input-card label="${this.i18n.t('rest_lbl_reps')}">
                            <app-box id="box-reps" clickable>
                                <span id="val-reps" class="input-value-text placeholder">0</span>
                            </app-box>
                        </app-input-card>

                        <app-input-card label="${this.i18n.t('rest_lbl_rir')}">
                            <app-segment-select id="rir-selector"></app-segment-select>
                        </app-input-card>
                    </div>

                    <div class="action-container">
                        <app-btn id="btn-save" label="${this.i18n.t('rest_btn_save')}" variant="primary"></app-btn>
                    </div>
                    
                    <div class="feedback-container" id="feedback-pr">
                        <span class="feedback-title" id="pr-title"></span>
                        <span class="feedback-subtitle">// 🟢⚪ TODO: Añadir texto dinámico según el modo y traducciones (i18n)</span>
                    </div>
                    
                </div>
            </div>
        `;
    }

    _initComponents() {
        const rirSelector = this.querySelector('#rir-selector');
        if (rirSelector) {
            rirSelector.setOptions([
                { label: '0', value: '0' },
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3+', value: '3' }
            ]);
        }
    }

    _attachListeners() {
        const modal = this.querySelector('#modal-keypad');

        if (this.isRestMode) {
            this.querySelectorAll('.timer-controls-grid button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const add = parseInt(e.target.dataset.add);
                    this.timeLeft += add;
                    if (this.timeLeft < 0) this.timeLeft = 0;
                    this.updateTimerDisplay();
                });
            });

            this.querySelector('#btn-edit-global').addEventListener('click', async () => {
                const result = await modal.open(this.i18n.t('rest_modal_time_title'), this.defaultTime, 'numeric');
                if (result) {
                    this.updateGlobalTime(parseInt(result.value));
                }
            });
        }

        this.querySelector('#box-weight').addEventListener('click', async () => {
            const result = await modal.open(
                this.i18n.t('rest_modal_weight_title'), 
                this.currentWeight || '', 
                'dynamic', 
                this.currentUnit, 
                'KG, LB'
            );

            if (result) {
                this.currentWeight = parseFloat(result.value);
                this.currentUnit = result.unit;

                const valEl = this.querySelector('#val-weight');
                const unitEl = this.querySelector('#val-unit');
                
                valEl.innerText = this.currentWeight;
                valEl.classList.remove('placeholder');
                unitEl.innerText = `[ ${this.currentUnit} ]`;
            }
        });

        this.querySelector('#box-reps').addEventListener('click', async () => {
            const result = await modal.open(
                this.i18n.t('rest_modal_reps_title'),
                this.currentReps || '', 
                'numeric'
            );

            if (result) {
                this.currentReps = parseInt(result.value);
                const valEl = this.querySelector('#val-reps');
                valEl.innerText = this.currentReps;
                valEl.classList.remove('placeholder');
            }
        });

        const rirSelector = this.querySelector('#rir-selector');
        rirSelector.addEventListener('change', (e) => {
            this.selectedRIR = parseInt(e.detail.value);
        });

        this.querySelector('#btn-save').addEventListener('click', () => {
            this.saveSet(false);
        });
    }
}

customElements.define('training-session-rest', TrainingSessionRest);