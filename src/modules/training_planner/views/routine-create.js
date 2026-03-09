// src/modules/training_planner/views/routine-create.js

import { router } from '../../../core/router/index.js';
import { trainingStore } from '../../training_core/store/index.js';
import { trainingService } from '../../training_core/services/training.service.js';
import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Componentes
import '../../system/components/input-card.js';
import '../../system/components/btn.js';
import '../components/exercise-card.js';
import '../components/add-trigger.js';

export class TrainingRoutineCreate extends HTMLElement {
    constructor() {
        super();
        this.routineId = null;
        this.routineName = '';
        this.exercises = [];
        this.dict = null;
    }

    async connectedCallback() {
        await trainingService.init();
        
        this.dict = await i18nService.loadPage('training_planner/routine-create');

        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const paramId = params.get('id');

        let draft = trainingStore.getDraftRoutine();

        if (!draft) {
            if (paramId) {
                const original = trainingStore.getRoutineById(paramId);
                if (original) {
                    draft = JSON.parse(JSON.stringify(original));
                }
            } else {
                draft = {
                    id: crypto.randomUUID(),
                    name: '',
                    exercises: [],
                    createdAt: Date.now(),
                    lastPerformed: null
                };
            }
            trainingStore.setDraftRoutine(draft);
        }

        this.routineId = draft.id;
        this.routineName = draft.name;
        this.exercises = this._hydrateExercises(draft.exercises);

        this.render();
        setTimeout(() => this._attachListeners(), 0);
    }

    _hydrateExercises(refs) {
        return refs.map(ref => {
            const masterData = trainingStore.getExerciseById(ref.id);
            return masterData ? masterData : { id: ref.id, name: this.dict.t('fallback_exercise_name') };
        });
    }

    render() {
        const exercisesHtml = this.exercises.length > 0 
            ? this.exercises.map(ex => `<training-exercise-card id="${ex.id}"></training-exercise-card>`).join('')
            : '';

        this.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            
            training-routine-create {
                display: flex;
                flex-direction: column;
                width: 100%;
                max-width: 480px;
                margin: 0 auto;
                height: 100dvh;
                background-color: var(--Negro-suave);
                overflow: hidden; 
            }
           
            .header-area {
                display: flex;
                padding: 16px 24px;
                align-items: center;
                gap: 16px;
                width: 100%;
                border-bottom: 1px solid var(--Blanco);
                background: var(--Negro-suave);
                flex-shrink: 0;
            }

            .header-back {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                cursor: pointer;
            }
            .header-back svg { fill: var(--Blanco); width: 100%; height: 100%; }

            .header-title {
                color: var(--Blanco);
                font-family: "JetBrains Mono", monospace;
                font-size: 16px;
                font-weight: 400;
                line-height: 150%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .content-area {
                display: flex;
                flex-direction: column;
                padding: 24px;
                gap: 24px; 
                flex: 1; 
                overflow-y: auto;
                scrollbar-width: none;
            }
            .content-area::-webkit-scrollbar { display: none; }

            /* --- CAMBIO 2: ANCHO AL 100% --- */
            .exercises-stack {
                display: flex;
                flex-direction: column;
                width: 100%;
                margin: 0;
                gap: 8px;
            }

            /* --- CAMBIO 1: NUEVA CLASE PARA EL TÍTULO --- */
            .section-label {
                color: var(--Blanco);
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                margin-bottom: 8px;
                display: block;
            }

            .footer-area {
                flex-shrink: 0;
                padding: 24px;
                padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
                background: var(--Negro-suave);
            }

            .input-box {
                width: 100%;
                background: transparent;
                border: 1px solid var(--Blanco);
                color: var(--Blanco);
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                padding: 16px;
                outline: none;
                border-radius: 0;
                box-sizing: border-box;
            }
            .input-box::placeholder {
                color: var(--Blanco);
                opacity: 0.5;
            }
            .input-box:focus {
                background: rgba(255, 255, 255, 0.05);
            }

        </style>

            <div class="header-area">
                <div class="header-back" id="btn-back">
                    ${ICONS.ARROW_LEFT}
                </div>
                <span class="header-title">
                    ${this.routineName ? this.dict.t('header_edit', {name: this.routineName}) : this.dict.t('header_new')}
                </span>
            </div>

            <main class="content-area">
                
                <app-input-card label="${this.dict.t('lbl_name')}">
                    <input type="text" 
                           class="input-box" 
                           id="routine-name-input" 
                           placeholder="${this.dict.t('placeholder_name')}"
                           value="${this.routineName}" 
                           autocomplete="off">
                </app-input-card>

                <div>
                    <span class="section-label">${this.dict.t('lbl_exercise_list')}</span>

                    <div class="exercises-stack" id="stack-list">
                        ${exercisesHtml}
                    </div>
                    
                    <div style="margin-top: 8px;">
                        <training-add-trigger 
                            id="trigger-add" 
                            label="Añadir_Ejercicio">
                        </training-add-trigger>
                    </div>
                </div>

            </main>

            <footer class="footer-area">
                <app-btn 
                    variant="primary" 
                    label="${this.dict.t('btn_save')}"
                    id="action-save">
                </app-btn>
            </footer>
        `;

        this.exercises.forEach(ex => {
            const card = this.querySelector(`[id="${ex.id}"]`);
            if (card) card.data = ex;
        });
    }

    _attachListeners() {
        const btnBack = this.querySelector('#btn-back');
        if (btnBack) {
            btnBack.addEventListener('click', () => {
                 if (confirm(this.dict.t('alert_exit_unsaved'))) {
                     trainingStore.setDraftRoutine(null);
                     window.history.back();
                 }
            });
        }

        const input = this.querySelector('#routine-name-input');
        if (input) {
            input.addEventListener('input', (e) => {
                this.routineName = e.target.value;
                trainingStore.updateDraftName(this.routineName);
                
                const title = this.querySelector('.header-title');
                if (title) title.textContent = this.routineName ? this.dict.t('header_edit', {name: this.routineName}) : this.dict.t('header_new');
            });
        }

        const trigger = this.querySelector('#trigger-add');
        if (trigger) {
            trigger.addEventListener('click', () => {
                router.navigate('/training/planner/exercises');
            });
        }

        const btnSave = this.querySelector('#action-save');
        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                if (!this.routineName.trim()) {
                    alert(this.dict.t('alert_name_required'));
                    return;
                }
                const finalRoutine = trainingStore.getDraftRoutine();
                await trainingService.saveRoutine(finalRoutine);
                trainingStore.setDraftRoutine(null);
                router.navigate('/training/planner');
            });
        }

        const stack = this.querySelector('#stack-list');
        if (stack) {
            stack.addEventListener('delete', (e) => {
                const exerciseId = e.detail.id;
                if (confirm(this.dict.t('alert_remove_exercise'))) {
                    trainingStore.removeExerciseFromDraft(exerciseId);
                    this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
                    this.render();
                    this._attachListeners(); 
                }
            });
        }
    }
}

customElements.define('training-routine-create', TrainingRoutineCreate);