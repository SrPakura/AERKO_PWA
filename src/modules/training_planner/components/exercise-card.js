// src/modules/training_planner/components/exercise-card.js

import { ICONS } from '../../../core/theme/icons.js';
import { trainingStore } from '../../training_core/store/index.js'; 
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class TrainingExerciseCard extends HTMLElement {

    static get observedAttributes() { return ['title', 'subtitle']; }

    constructor() {
        super();
    }

    async connectedCallback() {
        // Me gustan los patos. Sartre decía el hombre está condenado a ser libre. Considero que es un afirmación realista, pero en parte de lameculos. Por eso me decanto más por Camus. Yo claramente soy Sisifo.
        this.i18n = await i18nService.loadPage('training_planner/exercise-card');
        this.render();
        this._attachListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this.render();
            this._attachListeners();
        }
    }

    set data(exercise) {
        this.setAttribute('id', exercise.id);
        
        // Helper rápido por si 'data' se inyecta antes de que connectedCallback termine
        const t = (key) => this.i18n ? this.i18n.t(key) : '';

        // 1. NOMBRE (Pasamos el objeto entero a tData)
        const name = i18nService.tData(exercise.name);
        this.setAttribute('title', name || t('fallback_title') || 'Ejercicio');

        // 2. MÚSCULOS (Lógica nueva con Store y tData)
        let muscleText = t('fallback_muscle') || 'General';

        if (exercise.impact && exercise.impact.targets && exercise.impact.targets.length > 0) {
            const allMuscles = trainingStore.getMuscles();

            const muscleNames = exercise.impact.targets.map(targetId => {
                const muscleObj = allMuscles.find(m => m.id === targetId);
                return muscleObj ? i18nService.tData(muscleObj.name) : targetId;
            });

            // Usamos el nuevo separador visual "  /  "
            muscleText = muscleNames.slice(0, 2).join('  /  ');
        }

        this.setAttribute('subtitle', muscleText);
    }

    render() {
        // Fallback seguro usando el i18n si ya cargó
        const fallbackTitle = this.i18n ? this.i18n.t('fallback_title') : 'Ejercicio';
        const ariaDel = this.i18n ? this.i18n.t('aria_delete') : 'Eliminar';
        
        const title = this.getAttribute('title') || `// ${fallbackTitle}`;
        const subtitle = this.getAttribute('subtitle') || '';

        this.innerHTML = `
            <style>
                training-exercise-card {
                    display: flex;
                    width: 100%;
                    min-width: 0; 
                    box-sizing: border-box;
                    margin-bottom: 8px;
                }

                .ejercicio-card-container {
                    display: flex;
                    width: 100%;
                    align-items: stretch; 
                    background-color: var(--Negro-suave);
                    position: relative;
                    font-family: 'JetBrains Mono', monospace;
                    box-sizing: border-box;
                }

                .ejercicio-info-box {
                    display: flex;
                    padding: 16px;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 1; 
                    min-width: 0;
                    border: 1px solid var(--Blanco);
                    z-index: 1; 
                }

                .ejercicio-title {
                    color: var(--Blanco);
                    font-family: 'Clash Display', sans-serif;
                    font-size: 20px;
                    font-weight: 600;
                    line-height: 120%;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }

                .ejercicio-subtitle {
                    color: var(--Verde-acido);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                    font-weight: 400;
                    line-height: 150%;
                    margin: 0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }

                .ejercicio-delete-btn {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 56px; 
                    min-width: 56px;
                    border: 1px solid var(--Blanco);
                    border-left: none; 
                    background: transparent;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                }

                .ejercicio-delete-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .ejercicio-delete-btn:active {
                    background: var(--Blanco);
                }

                .ejercicio-delete-btn svg {
                    width: 24px;
                    height: 24px;
                    fill: var(--Blanco);
                    display: block;
                }
                
                .ejercicio-delete-btn:active svg path {
                    fill: var(--Negro-suave);
                }
            </style>

            <div class="ejercicio-card-container">
                <div class="ejercicio-info-box">
                    <h3 class="ejercicio-title">// ${title}</h3>
                    <p class="ejercicio-subtitle">${subtitle}</p>
                </div>

                <button class="ejercicio-delete-btn" id="btn-delete" type="button" aria-label="${ariaDel}">
                    ${ICONS.TRASH}
                </button>
            </div>
        `;
    }

    _attachListeners() {
        const btnDelete = this.querySelector('#btn-delete');
        if (btnDelete) {
            const newBtn = btnDelete.cloneNode(true);
            btnDelete.parentNode.replaceChild(newBtn, btnDelete);
            newBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dispatchEvent(new CustomEvent('delete', {
                    detail: { id: this.getAttribute('id') },
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }
}

customElements.define('training-exercise-card', TrainingExerciseCard);