// src/modules/nutrition_smart/views/diet.js 

// 1. Router y Core 
import { router } from '../../../core/router/index.js';
import { nutritionStore } from '../../nutrition_core/store/index.js';
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';

// NUEVOS SERVICIOS 
import { journalService } from '../../nutrition_core/services/journal.service.js';
import { pantryService } from '../../nutrition_core/services/pantry.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// 2. Componentes de UI (Prestados de nutrition_diet) 
import '../../nutrition_diet/components/food-card-large.js';
import '../../nutrition_diet/components/add-trigger.js';

// 3. Componentes Locales (Layout de secciones) 
import '../components/meal-section.js';

// 4. Sistema 
import '../../system/components/navbar.js';
import { ICONS } from '../../../core/theme/icons.js'; // Opcional, por si queremos usar iconos extra 

export class NutritionDiet extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sortableInstance = null;
        this.plans = []; // Nueva lógica: Aquí guardamos las plantillas 
    }

    async connectedCallback() {
        // 1. Inicialización completa de servicios
        await nutritionService.init();
        await Promise.all([journalService.init(), pantryService.init()]);
        
        // Cargar diccionario, porque cargar con mi belleza es difícil (creo que la locura me está consumiendo)
        this.dict = await i18nService.loadPage('nutrition_smart/diet');

        // 2. Cargar datos
        await this.loadData();

        // 3. Renderizar y Configurar
        this.render();
        this._setupEventListeners();
        this._initSectionSorting();
    }

    disconnectedCallback() {
        if (this.sortableInstance) this.sortableInstance.destroy();
    }

    // --- NUEVA LÓGICA: CARGA DE DATOS --- 
    async loadData() {
        const planIds = nutritionStore.getMealPlanIds();
        const promises = planIds.map(id => journalService.getMealPlan(id));
        const rawPlans = await Promise.all(promises);
        this.plans = rawPlans.filter(p => p);
    }

    // --- NUEVA LÓGICA: HELPER HIDRATACIÓN --- 
    _hydrateItems(items) {
        if (!items || items.length === 0) return [];

        return items.map(item => {
            const foodData = pantryService.getFoodById(item.refId);
            if (!foodData) return null;

            // 1. SI ES UN GRUPO: Lógica especial 
            if (foodData.type === 'group') {
                // Sumamos los macros reales de sus ingredientes 
                const groupTotals = (foodData.items || []).reduce((acc, ing) => {
                    const ingData = pantryService.getFoodById(ing.refId);
                    if (!ingData) return acc;

                    // Si el ingrediente dentro del grupo tiene gramos, calculamos su ratio 
                    const ingRatio = (ing.grams || 0) / 100;
                    return {
                        k: acc.k + (ingData.k * ingRatio),
                        p: acc.p + (ingData.p * ingRatio),
                        c: acc.c + (ingData.c * ingRatio),
                        f: acc.f + (ingData.f * ingRatio)
                    };
                }, { k: 0, p: 0, c: 0, f: 0 });

                return {
                    ...foodData,
                    ...item,
                    // Sustituimos "100" por un texto visual 
                    grams: this.dict.t('lbl_group_grams'),
                    calculated: {
                        k: Math.round(groupTotals.k),
                        p: parseFloat(groupTotals.p.toFixed(1)),
                        c: parseFloat(groupTotals.c.toFixed(1)),
                        f: parseFloat(groupTotals.f.toFixed(1))
                    }
                };
            }

            // 2. LÓGICA NORMAL (Alimentos sueltos o recetas) 
            else {
                const ratio = (item.mode === 'fixed' && item.grams) ? item.grams / 100 : 1;

                return {
                    ...foodData,
                    ...item,
                    calculated: {
                        k: Math.round(foodData.k * ratio),
                        p: parseFloat((foodData.p * ratio).toFixed(1)),
                        c: parseFloat((foodData.c * ratio).toFixed(1)),
                        f: parseFloat((foodData.f * ratio).toFixed(1))
                    }
                };
            }
        }).filter(Boolean);
    }

    render() {
        // MANTENIDO: Variables de cálculos antiguos por si las usas en el futuro en el header 
        const goal = nutritionStore.getDietGoal() || { targetKcal: 0, minKcal: 0, maxKcal: 0 };
        const targetP = goal.targetP || Math.round((goal.targetKcal * 0.30) / 4);
        const targetC = goal.targetC || Math.round((goal.targetKcal * 0.40) / 4);
        const targetF = goal.targetF || Math.round((goal.targetKcal * 0.30) / 9);

        // --- TEMPLATE INTACTO (CSS + HTML ORIGINAL) --- 
        this.shadowRoot.innerHTML = ` 
        <style> 
            @import url('/src/core/theme/variables.css'); 

            /* --- LAYOUT ESTRUCTURAL (El "Fix" del Scroll) --- */ 
            :host { 
                display: block; 
                width: 100%; 
                height: 100dvh; /* Altura total del viewport */ 
                background: var(--Negro-suave); 
                overflow: hidden; /* El host no scrollea */ 
            } 

            .app-screen { 
                display: flex; 
                flex-direction: column; 
                height: 100%; 
                width: 100%; 
                max-width: 480px; /* Ancho máximo app móvil */ 
                margin: 0 auto; 
                padding-bottom: 0 !important; 
                padding-top: 0 !important; 
            } 

            /* --- BLOQUE 1: HEADER (Fijo) --- */ 
            .screen-header { 
                flex-shrink: 0; 
                width: 100%; 
                background: var(--Negro-suave); 
                border-bottom: 1px solid var(--Blanco); 
                padding: max(24px, env(safe-area-inset-top)) 24px 24px 24px; 
                 
                display: flex; 
                flex-direction: column; 
                gap: 16px; 
                z-index: 10; 
            } 

            .title-h1 { 
                font-family: 'Clash Display', sans-serif; 
                font-size: 32px; /* Ligeramente ajustado para header fijo */ 
                font-weight: 700; 
                color: var(--Verde-acido); 
                margin: 0; 
                line-height: 100%; 
            } 

            .stats-row { 
                display: flex; 
                justify-content: space-between; 
                align-items: flex-start; 
                width: 100%; 
                gap: 16px; 
            } 

            .macros-block { 
                display: flex; 
                flex-direction: column; 
                gap: 4px; 
                flex-shrink: 0; 
            } 

            .macro-item { 
                font-family: 'JetBrains Mono', monospace; 
                font-size: 14px; 
                color: var(--Blanco); 
                line-height: 140%; 
            } 

            .macro-label { 
                color: var(--Verde-acido); 
                font-weight: 700; 
                margin-right: 8px; 
            } 

            .advice-block { 
                text-align: right; /* Alineado a la derecha para equilibrio */ 
                font-size: 14px; 
                line-height: 140%; 
                font-family: 'JetBrains Mono', monospace; 
                color: var(--Blanco); 
                opacity: 0.8; 
                font-weight: 400; 
                max-width: 60%; 
            } 

            /* --- BLOQUE 2: MAIN CONTENT (Scrollable) --- */ 
            .screen-content { 
                flex: 1; /* Ocupa todo el espacio sobrante */ 
                overflow-y: auto; /* Aquí vive el scroll */ 
                overflow-x: hidden; 
                 
                display: flex; 
                flex-direction: column; 
                gap: 16px; 
                padding: 24px; 
                 
                /* Ocultar barra de scroll estética */ 
                scrollbar-width: none; 
            } 
            .screen-content::-webkit-scrollbar { display: none; } 

            /* Botón Añadir Comida */ 
            .btn-add-meal { 
                display: flex; 
                width: 100%; 
                padding: 16px; 
                justify-content: center; 
                align-items: center; 
                background: transparent; 
                 
                /* CAMBIO: Borde sólido y blanco puro */ 
                border: 1px solid var(--Blanco);  
                color: var(--Blanco); 
                 
                font-family: "JetBrains Mono", monospace; 
                font-size: 14px; 
                font-weight: 400; 
                cursor: pointer; 
                text-transform: uppercase; 
                transition: all 0.2s ease; 
                 
                /* CAMBIO: Opacidad al 100% siempre */ 
                opacity: 1;  
            } 
            .btn-add-meal:hover { opacity: 1; border-style: solid; } 
            .btn-add-meal:active { background: rgba(255, 255, 255, 0.1); } 

            /* Estilos para Drag & Drop (SortableJS) */ 
            .sortable-ghost { 
                opacity: 0.4; 
                background: rgba(255, 255, 255, 0.05); 
            } 
            .sortable-drag { 
                cursor: grabbing; 
            } 

            /* --- BLOQUE 3: FOOTER (Fijo) --- */ 
            .screen-footer { 
                flex-shrink: 0; 
                width: 100%; 
                z-index: 100; 
                background: var(--Negro-suave); 
            } 
        </style> 

        <div class="app-screen"> 
            <header class="screen-header"> 
                <h1 class="title-h1">${this.dict.t('title_diet')}</h1>
            </header> 

            <main class="screen-content" id="meals-container"> 
                ${this.plans.map(plan => this._renderSection(plan)).join('')} 
                 
                <button class="btn-add-meal ignore-drag" id="btn-add-meal"> 
                    ${this.dict.t('btn_add_meal')}
                </button> 
            </main> 

            <footer class="screen-footer"> 
                <app-nav></app-nav> 
            </footer> 
        </div> 
        `;
    }

    // --- LÓGICA NUEVA + HTML ANTIGUO --- 
    _renderSection(plan) {
        const foodList = this._hydrateItems(plan.items);

        const cardsHtml = foodList.length > 0 ? foodList.map(item => {
            const isVar = item.mode === 'variable';

            return ` 
                <app-food-card-large 
                    label="${pantryService.getFoodName(item, 'es')} ${isVar ? this.dict.t('lbl_var_suffix') : ''}"
                    grams="${isVar ? this.dict.t('lbl_var_grams') : item.grams}"
                    k="${item.calculated.k}"  
                    p="${item.calculated.p}"  
                    c="${item.calculated.c}"  
                    f="${item.calculated.f}" 
                    data-id="${item.refId}" 
                    data-section="${plan.id}" 
                    data-type="${item.type || 'food'}"  
                ></app-food-card-large> 
            `;
        }).join('') : '';

        const addTriggerHtml = ` 
            <app-add-trigger  
                label="Añadir_Alimento"  
                data-section="${plan.id}" 
            ></app-add-trigger> 
        `;

        return ` 
            <app-meal-section  
                title="// ${plan.label} (${plan.time})" 
                data-id="${plan.id}" 
            > 
                ${cardsHtml} 
                ${addTriggerHtml} 
            </app-meal-section> 
        `;
    }

    _setupEventListeners() {
        const mainContent = this.shadowRoot.getElementById('meals-container');

        // 1. Navegación a Añadir Alimento 
        this.shadowRoot.querySelectorAll('app-add-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const section = trigger.dataset.section;
                router.navigate(`/nutrition/add-food?meal=${section}`);
            });
        });

        // 2. Botón Añadir Sección (Comida) 
        const btnAdd = this.shadowRoot.getElementById('btn-add-meal');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                router.navigate('/nutrition/create-meal');
            });
        }

        // 3. Event Delegation 
        if (mainContent) {

            // --- BORRAR ALIMENTO (NUEVA LÓGICA) --- 
            mainContent.addEventListener('delete', async (e) => {
                const card = e.target;
                const refId = card.dataset.id;
                const planId = card.dataset.section;

                if(confirm(this.dict.t('alert_delete_food'))) {
                    try {
                        const plan = this.plans.find(p => p.id === planId);
                        if (!plan) return;

                        plan.items = plan.items.filter(i => i.refId !== refId);

                        await journalService.saveMealPlan(
                            plan.id,
                            plan.order,
                            plan.label,
                            plan.time,
                            plan.notification || false,
                            plan.items,
                            plan.isVisible
                        );

                        await this.loadData();
                        this.render();
                        this._setupEventListeners();
                        this._initSectionSorting();
                    } catch (err) {
                        console.error(err);
                        alert(this.dict.t('alert_delete_food_err'));
                    }
                }
            });

            // --- EDITAR ALIMENTO (NUEVA LÓGICA) --- 
            mainContent.addEventListener('edit-food', (e) => {
                const card = e.target;
                const type = card.dataset.type;
                const id = card.dataset.id;
                const meal = card.dataset.section;

                if (type === 'group') {
                    router.navigate(`/nutrition/edit-group?id=${id}&meal=${meal}`);
                } else {
                    router.navigate(`/nutrition/edit-food?id=${id}&meal=${meal}`);
                }
            });

            // --- BORRAR SECCIÓN (NUEVA LÓGICA) --- 
            mainContent.addEventListener('delete-section', async (e) => {
                const sectionEl = e.target;
                const planId = sectionEl.dataset.id;

                if(confirm(this.dict.t('alert_delete_section'))) {
                    try {
                        const plan = this.plans.find(p => p.id === planId);
                        if (plan) {
                            await journalService.saveMealPlan(plan.id, plan.order, plan.label, plan.time, plan.notification || false, plan.items, false);

                            const currentIds = nutritionStore.getMealPlanIds();
                            const newIds = currentIds.filter(id => id !== planId);
                            nutritionStore.setMealPlanIds(newIds);

                            await this.loadData();
                            this.render();
                            this._setupEventListeners();
                            this._initSectionSorting();
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }
            });

            // --- EDITAR SECCIÓN (MANTENIDO) --- 
            mainContent.addEventListener('edit-section', (e) => {
                const sectionEl = e.target;
                const id = sectionEl.dataset.id;
                router.navigate('/nutrition/meal-config?id=' + id);
            });
        }
    }

    _initSectionSorting() {
        const container = this.shadowRoot.getElementById('meals-container');
        if (!container) return;

        if (this.sortableInstance) this.sortableInstance.destroy();

        this.sortableInstance = new window.Sortable(container, {
            animation: 150,
            draggable: 'app-meal-section',
            delay: 100, // Recuperado de la versión nueva para móviles 
            handle: '.drag-handle',

            // Filtro seguro de la versión antigua 
            filter: (evt) => {
                if (evt.target.closest('.ignore-drag')) return true;
                return false;
            },

            // Callback de la versión nueva 
            onEnd: async (evt) => {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;

                if (oldIndex === newIndex) return;

                const movedItem = this.plans.splice(oldIndex, 1);
                this.plans.splice(newIndex, 0, movedItem[0]);

                const newOrderIds = this.plans.map(p => p.id);
                nutritionStore.setMealPlanIds(newOrderIds);

                console.log("[DIET] Nuevo orden:", newOrderIds);
            }
        });
    }
}

customElements.define('nutrition-diet', NutritionDiet);