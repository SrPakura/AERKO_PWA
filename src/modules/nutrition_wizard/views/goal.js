// src/modules/nutrition_wizard/views/goal.js

// 1. Router: Subimos 3 niveles para llegar a 'src/core'
import { router } from '../../../core/router/index.js';

// 2. Core de Nutrición: Salimos a 'modules' y entramos en 'nutrition_core'
import { nutritionStore } from '../../nutrition_core/store/index.js';
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
import { wizardService } from '../../nutrition_core/services/wizard.service.js';
import { wizardStore } from '../store/wizard.store.js'; 
import { calculatorService, GOALS, SPEED } from '../../nutrition_core/services/calculator.service.js';

// 3. Componentes del Sistema: Salimos a 'modules' y entramos en 'system'
import '../../system/components/select-list.js';
import '../../system/components/segment-select.js';

// 🟢 INYECTAMOS EL TRADUCTOR
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class NutritionWizardGoal extends HTMLElement {
    constructor() {
        super();
        this.state = {
            goalType: GOALS.LOSE, 
            speed: 'normal'
        };
        
        // REGLA DE ORO: Opciones Objetivo (Sin texto duro, usamos labelKey)
        this.goalOptions = [
            { value: GOALS.GAIN, labelKey: 'opt_goal_gain' },
            { value: GOALS.MAINTAIN, labelKey: 'opt_goal_maintain' },
            { value: GOALS.LOSE, labelKey: 'opt_goal_lose' }
        ];

        // REGLA DE ORO: Opciones Velocidad (Sin texto duro, usamos labelKey)
        this.speedOptions = [
            { value: 'safe', labelKey: 'opt_speed_safe' },
            { value: 'normal', labelKey: 'opt_speed_normal' },
            { value: 'fast', labelKey: 'opt_speed_fast' }
        ];
    }

    async connectedCallback() {
        // Cargamos el diccionario de esta pantalla
        this.dict = await i18nService.loadPage('nutrition_wizard/goal');
        this.render();
        this.addListeners();
    }

    render() {
    if (!this.dict) return;

    // Solo mostramos velocidad si NO es mantener peso
    const showSpeed = this.state.goalType !== GOALS.MAINTAIN;

    this.innerHTML = `
        <div class="wizard-screen">
            <app-section-header 
                title="${this.dict.t('title_goal')}"
                text="${this.dict.t('desc_goal')}"
            ></app-section-header>

            <main class="wizard-content">
                
                <app-input-card label="${this.dict.t('label_goal')}">
                    <app-select-list id="goal-selector"></app-select-list>
                </app-input-card>

                <div id="speed-container" style="width: 100%; display: ${showSpeed ? 'block' : 'none'}">
                    <app-input-card label="${this.dict.t('label_speed')}">
                        <app-select-list id="speed-selector"></app-select-list>
                    </app-input-card>
                </div>

            </main>

            <section class="wizard-buttons">
                <app-btn variant="primary" label="${this.dict.t('btn_finish')}" id="btn-finish"></app-btn>
            </section>
        </div>
    `;

        // Traducimos al vuelo las opciones de objetivo
        const translatedGoals = this.goalOptions.map(opt => ({
            value: opt.value,
            label: this.dict.t(opt.labelKey)
        }));

        // Traducimos al vuelo las opciones de velocidad
        const translatedSpeeds = this.speedOptions.map(opt => ({
            value: opt.value,
            label: this.dict.t(opt.labelKey)
        }));

        // 1. Configurar Objetivo
        const goalSelector = this.querySelector('#goal-selector');
        goalSelector.setOptions(translatedGoals);
        goalSelector.setAttribute('value', this.state.goalType);

        // 2. Configurar Velocidad (si existe)
        const speedSelector = this.querySelector('#speed-selector');
        speedSelector.setOptions(translatedSpeeds);
        speedSelector.setAttribute('value', this.state.speed);
    }

    addListeners() {
        // A. CAMBIO DE OBJETIVO
        this.querySelector('#goal-selector').addEventListener('change', (e) => {
            const newVal = e.detail.value;
            this.state.goalType = newVal;

            // Lógica visual: Mostrar/Ocultar velocidad sin re-renderizar todo
            const speedContainer = this.querySelector('#speed-container');
            if (newVal === GOALS.MAINTAIN) {
                speedContainer.style.display = 'none';
            } else {
                speedContainer.style.display = 'block';
            }
        });

        // B. CAMBIO DE VELOCIDAD
        this.querySelector('#speed-selector').addEventListener('change', (e) => {
            this.state.speed = e.detail.value;
        });

        // C. FINALIZAR
        this.querySelector('#btn-finish').addEventListener('click', () => {
            this.calculateAndSave();
        });
    }

    // MODIFICADO: Ahora es async para esperar a la BD
    async calculateAndSave() {
        try {
            // 1. Guardamos lo que el usuario acaba de elegir en pantalla (Objetivo y Velocidad)
            // Lo metemos en la "pizarra" temporal (wizardStore)
            wizardStore.update({
                goalType: this.state.goalType,
                speed: this.state.speed
            });

            // 2. ¡LA CLAVE! Llamamos al experto (WizardService)
            await wizardService.saveStandardGoal();

            // 3. Nos vamos al Dashboard
            router.navigate('/nutrition');

        } catch (error) {
            console.error("Error al guardar la dieta:", error);
            // Alert traducido según la dimensión
            alert(this.dict.t('alert_error_save'));
        }
    }

    _getActivityFactor(level) {
        const map = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'extreme': 1.9
        };
        return map[level] || 1.2;
    }
}

customElements.define('nutrition-wizard-goal', NutritionWizardGoal);