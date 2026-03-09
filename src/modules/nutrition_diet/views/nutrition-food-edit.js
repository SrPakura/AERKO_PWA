import { router } from '../../../core/router/index.js';
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
// NUEVO: Importamos los servicios especializados
import { journalService } from '../../nutrition_core/services/journal.service.js';
import { pantryService } from '../../nutrition_core/services/pantry.service.js';
// NUEVO: Importar servicio de i18n
import { i18nService } from '../../../core/i18n/i18n.service.js';

import { ICONS } from '../../../core/theme/icons.js';
import '../../system/components/btn.js';
import '../../system/components/navbar.js';
import '../components/adjuster-card.js';

export class NutritionFoodEdit extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.mealId = null;
        this.foodId = null;
        this.food = null; // Objeto combinado (Plan + Pantry)
        
        // Estado temporal para el Adjuster
        this.tempState = {
            grams: 0,
            mode: 'fixed',
            calculated: {}
        };
        
        // Guardaremos el diccionario aquí
        this.dict = null;
    }

    async connectedCallback() {
        // 0. Cargar el diccionario primero
        this.dict = await i18nService.loadPage('nutrition_diet/nutrition-food-edit');

        // 1. Inicializamos servicios
        await nutritionService.init(); 
        // Aseguramos que el Journal y Pantry estén listos (aunque nutritionService.init() ya lo hace)
        await Promise.all([journalService.init(), pantryService.init()]);

        // 2. Obtener IDs de la URL
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.mealId = params.get('meal'); // ej: 'plan_meal_0'
        this.foodId = params.get('id');   // ej: 'O_001'

        // 3. Cargar la Plantilla de Comida (Meal Plan)
        // [CORRECCIÓN]: Ya no buscamos en el Log Diario, sino en la configuración
        const plan = await journalService.getMealPlan(this.mealId);
        
        if (!plan || !plan.items) {
            alert(this.dict.t('edit_food_err_plan_not_found'));
            window.history.back();
            return;
        }

        // 4. Buscar el item dentro del Plan
        const planItem = plan.items.find(i => i.refId === this.foodId);

        if (!planItem) {
            alert(this.dict.t('edit_food_err_item_not_found'));
            window.history.back();
            return;
        }

        // 5. "Hidratar" el alimento con datos de la Despensa (Pantry)
        // El plan solo tiene {refId, grams}, necesitamos el nombre y macros base del Pantry
        const pantryData = pantryService.getFoodById(this.foodId);

        if (!pantryData) {
            alert(this.dict.t('edit_food_err_pantry_missing'));
            window.history.back();
            return;
        }

        // Fusionamos datos para la vista
        this.food = {
            ...pantryData,      // k, p, c, f base, name...
            grams: planItem.grams,
            mode: planItem.mode || 'fixed'
        };

        // Inicializamos estado temporal
        this.tempState.grams = this.food.grams;
        this.tempState.mode = this.food.mode;
        
        // Calculamos macros iniciales para pasar al adjuster
        this._recalculateTemp(this.food.grams, this.food.mode);

        this.render();
        this.setupListeners();
    }

    // Helper para calcular macros al vuelo para el estado inicial
    _recalculateTemp(grams, mode) {
        if (mode === 'variable') {
            this.tempState.calculated = { k:0, p:0, c:0, f:0 };
            return;
        }
        const ratio = grams / 100;
        this.tempState.calculated = {
            k: Math.round(this.food.k * ratio),
            p: Math.round(this.food.p * ratio),
            c: Math.round(this.food.c * ratio),
            f: Math.round(this.food.f * ratio)
        };
    }

    render() {
        // Datos BASE para el adjuster (por 100g)
        const baseK = this.food.k;
        const baseP = this.food.p;
        const baseC = this.food.c;
        const baseF = this.food.f;

        // Nombre internacionalizado
        const prefs = i18nService.getPreferences();
        const foodName = pantryService.getFoodName(this.food, prefs.lang);

        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            @import url('/src/modules/system/components/btn.css');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                min-height: 100dvh;
                background: var(--Negro-suave);
                padding-top: 8px;
                padding-bottom: 0px;
                gap: 24px;
            }

            .header {
                display: flex;
                padding: 8px 24px;
                align-items: center;
                gap: 16px;
                border-bottom: 1px solid var(--Blanco);
                cursor: pointer;
            }
            .title-text {
                color: var(--Blanco);
                font-family: "JetBrains Mono";
                font-size: 16px;
                font-weight: 400;
            }
            .icon-back svg { width: 24px; height: 24px; fill: var(--Blanco); }

            .content {
                display: flex;
                flex-direction: column;
                padding: 0 24px;
                flex: 1;
                justify-content: center;
            }

            .action-section {
                padding: 0 24px 24px 24px; 
                display: flex;
                flex-direction: column;
                margin-top: auto;
                gap: 16px;
            }
            
            app-btn { width: 100%; display: block; }
            app-btn .btn { width: 100% !important; justify-content: center; }

            .nav-container { position: fixed; bottom: 0; left: 0; width: 100%; z-index: 100; }
        </style>

        <div class="header" id="btn-back">
            <div class="icon-back">${ICONS.ARROW_LEFT}</div>
            <span class="title-text">${this.dict.t('edit_food_header')}</span>
        </div>

        <main class="content">
            <nutrition-adjuster-card
                id="adjuster"
                label="${foodName}"
                grams="${this.tempState.grams}"
                k="${baseK}"
                p="${baseP}"
                c="${baseC}"
                f="${baseF}"
                mode="${this.tempState.mode}" 
                step="5"
            ></nutrition-adjuster-card>
        </main>

        <div class="action-section">
            <app-btn variant="primary" label="${this.dict.t('edit_food_btn_save')}" id="btn-save"></app-btn>
        </div>
        `;
    }

    setupListeners() {
        this.shadowRoot.getElementById('btn-back').addEventListener('click', () => window.history.back());

        const adjuster = this.shadowRoot.getElementById('adjuster');

        // Escuchar cambios en el Adjuster (Gramos o Modo)
        adjuster.addEventListener('change', (e) => {
            this.tempState.grams = e.detail.grams;
            this.tempState.mode = e.detail.mode;
            this.tempState.calculated = e.detail.calculated;
        });

        // GUARDAR CAMBIOS
        this.shadowRoot.getElementById('btn-save').addEventListener('click', async () => {
            
            // Validación básica
            if (this.tempState.mode === 'fixed' && (this.tempState.grams <= 0 || !this.tempState.grams)) {
                return alert(this.dict.t('edit_food_alert_grams_req'));
            }

            try {
                // 1. Recuperar la plantilla actual
                const plan = await journalService.getMealPlan(this.mealId);
                
                // 2. Encontrar el índice del alimento
                const itemIndex = plan.items.findIndex(i => i.refId === this.foodId);
                
                if (itemIndex !== -1) {
                    // 3. Actualizar solo lo necesario (Estructura ligera)
                    plan.items[itemIndex].grams = this.tempState.mode === 'variable' ? 0 : this.tempState.grams;
                    plan.items[itemIndex].mode = this.tempState.mode;

                    // 4. [CORRECCIÓN]: Guardar usando journalService (Persistencia Real)
                    await journalService.saveMealPlan(
                        plan.id,
                        plan.order,
                        plan.label,
                        plan.time,
                        plan.notification || false, // <-- A este hijo de puta también
                        plan.items, // Array actualizado
                        plan.isVisible
                    );
                    
                    // Volver
                    window.history.back();
                } else {
                    alert(this.dict.t('edit_food_err_sync'));
                }
            } catch (error) {
                console.error(error);
                alert(this.dict.t('edit_food_err_save'));
            }
        });
    }
}

customElements.define('nutrition-food-edit', NutritionFoodEdit);