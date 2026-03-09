// src/modules/nutrition_smart/views/smart-checks.js

import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
import { journalService } from '../../nutrition_core/services/journal.service.js';
import { pantryService } from '../../nutrition_core/services/pantry.service.js';
import { nutritionStore } from '../../nutrition_core/store/index.js';
import { bus } from '../../../core/bus/index.js';
import { router } from '../../../core/router/index.js';
import { ICONS } from '../../../core/theme/icons.js';
import { db } from '../../../core/db/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

import '../../system/components/section-header.js';
import '../../system/components/navbar.js';
import '../../system/components/keypad-modal.js';

import '../components/nutrition-dashboard-kcal.js';
import '../components/smart-meal-check-wit.js';

export class SmartChecksScreen extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._currentDate = new Date();
    }

    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar la UI - Fuera totalmente de coña, estoy deseando ir a por la versión cloud y enfrentarme a retos de ingieneria reales, pero esto de hacer el i18n es agotador eh. Eso si, viva er beti cojones. 
        this.dict = await i18nService.loadPage('nutrition_smart/smart-checks');
        
        this.render();
        this.modal = this.shadowRoot.querySelector('app-keypad-modal');
        
        // Inicializamos los servicios vitales
        await nutritionService.init(); 
        
        await this.loadData();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.unsubscribeJournal) this.unsubscribeJournal();
    }

    // --- GESTIÓN DE EVENTOS ---
    setupEventListeners() {
        // Eventos del DOM (Shadow Root)
        this.shadowRoot.addEventListener('request-quantity', (e) => this.handleRequestQuantity(e));
        this.shadowRoot.addEventListener('request-add-other', (e) => this.handleRequestAddOther(e));
        this.shadowRoot.addEventListener('meal-completed', (e) => this.handleMealCompleted(e));
        
        // Evento para reajustar objetivos
        const adjustBtn = this.shadowRoot.getElementById('btn-adjust');
        if (adjustBtn) {
            adjustBtn.addEventListener('click', () => {
                const isCustom = nutritionService.isCustomGoal();
                router.navigate(isCustom ? '/nutrition/manual-config' : '/nutrition/wizard/form');
            });
        }

        // Eventos del Bus Global
        this.unsubscribe = bus.on('NUTRITION_UPDATED', () => this.loadData());
        // El nuevo evento del JournalService que creamos en la Fase 2
        this.unsubscribeJournal = bus.on('JOURNAL_UPDATED', () => this.updateDashboard());
    }

    // --- LÓGICA DE DATOS ---
    async loadData() {
        try {
            console.log('[SmartChecks] Cargando dieta del día...');
            
            // 1. Actualizamos los totales del Dashboard
            await this.updateDashboard();
            
            // 2. Pintamos la lista de comidas
            await this.renderMeals();
        } catch (error) {
            console.error('[SmartChecks] Error loading data:', error);
        }
    }

    async handleRequestQuantity(e) {
        const { item, callback } = e.detail;
        const modal = this.modal || this.shadowRoot.querySelector('app-keypad-modal');
        
        if (modal) {
            const result = await modal.open(item.name, '', 'numeric', 'G');
            if (result && result.value) callback(result.value);
        } else {
            console.error('[CRÍTICO] No encuentro <app-keypad-modal> en el HTML');
        }
    }

    handleRequestAddOther(e) {
        const mealId = e.target.getAttribute('meal-id');
        router.navigate(`/nutrition/add-food?meal=${mealId}&autoComplete=true`);
    }

    /**
     * MAGIA FASE 4: Al pulsar GUARDAR en un acordeón, se dispara esto.
     */
    async handleMealCompleted(e) {
        const { mealId, status, log } = e.detail;
        
        // 1. Convertimos el "log" (mapa de progreso) en un array limpio de items
        // Usamos Object.entries para extraer la llave (el ID) y el valor (el progreso)
        const selectedItems = Object.entries(log).map(([id, itemProgress]) => {
            return {
                refId: id, // ¡Usamos el DNI directamente!
                grams: itemProgress.quantity
            };
        });

        // 2. Guardamos en el Contable (Journal)
        // Esto creará el log_dd_mm_yyyy_plan_meal_X y calculará la "foto fija"
        if (status === 'DONE' && selectedItems.length > 0) {
            await journalService.saveMealLog(this._currentDate, mealId, selectedItems);
    }
        else if (status === 'SKIPPED') {
            await journalService.saveMealLog(this._currentDate, mealId, []);
        }
        // CASO 3: REINICIAR (PENDIENTE) -> ¡BORRAMOS EL REGISTRO!
        else if (status === 'PENDING') {
            // Utilizamos el método público del journalService si existe, o borramos de la DB
            try {
                const logKey = journalService._getLogKey(this._currentDate, mealId);
                await db.delete('nutrition_vault', logKey);
                // Forzamos la actualización visual
                bus.emit('JOURNAL_UPDATED');
            } catch (err) {
                console.error("Error al borrar registro PENDING:", err);
            }
        }

        // 3. Recargamos la UI
        this.loadData();
    }

    // --- RENDERIZADO Y UI ---
    async updateDashboard() {
        // Obtenemos los totales del día sumando los cajones (O(1))
        const dayTotals = await journalService.getDailyTotals(this._currentDate);
        
        // Obtenemos las metas
        const goal = nutritionStore.getDietGoal() || { targetKcal: 2000, minKcal: 1900, maxKcal: 2100, protein: 0, carbs: 0, fat: 0 };

        // 1. Actualizar Componente KCAL
        const kcalComp = this.shadowRoot.querySelector('nutrition-dashboard-kcal');
        if (kcalComp) {
            kcalComp.setAttribute('consumed', dayTotals.k);
            kcalComp.setAttribute('target', goal.targetKcal);
            kcalComp.setAttribute('min', goal.minKcal);
            kcalComp.setAttribute('max', goal.maxKcal);
            kcalComp.setAttribute('mode', i18nService.getPreferences().mode);
        }

        // 2. Actualizar Macros
        this._updateMacro('p', dayTotals.p, goal.protein);
        this._updateMacro('c', dayTotals.c, goal.carbs);
        this._updateMacro('f', dayTotals.f, goal.fat);
    }

    _updateMacro(type, current = 0, total = 0) {
        const valEl = this.shadowRoot.getElementById(`val-${type}`);
        const barEl = this.shadowRoot.getElementById(`bar-${type}`);
        
        if (valEl) valEl.innerHTML = `${Math.round(current)}<span class="total">/${total}</span>`;
        if (barEl) {
            const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
            barEl.style.width = `${pct}%`;
        }
    }

    async renderMeals() {
        const container = this.shadowRoot.getElementById('meals-list');
        if (!container) return;

        // --- 1. MEMORIA DE ACORDEONES ---
        let openMealId = null;
        const currentElements = Array.from(container.children);
        const openElement = currentElements.find(el => el._isOpen === true);
        if (openElement) {
            openMealId = openElement.getAttribute('meal-id');
        }

        container.innerHTML = ''; 

        // --- 2. LEER QUÉ COMIDAS EXISTEN ---
        const activePlanIds = nutritionStore.getMealPlanIds();

        // --- 3. RECONSTRUCCIÓN ---
        for (const planId of activePlanIds) {
            // Leemos la plantilla (Lo que vas a comer) y el registro (Lo que ya has comido hoy)
            const mealPlan = await journalService.getMealPlan(planId);
            const mealLog = await journalService.getMealLog(this._currentDate, planId);

            if (!mealPlan) continue;

            const mealEl = document.createElement('smart-meal-check-wit');
            mealEl.setAttribute('meal-id', mealPlan.id);
            mealEl.setAttribute('title', mealPlan.label);
            
            // Determinamos el status: 
            // Si el log de hoy tiene items -> DONE
            // Si el log de hoy tiene timestamp pero no items -> SKIPPED
            // Si no hay timestamp -> PENDING
            let currentStatus = 'PENDING';
            if (mealLog.timestamp) {
                currentStatus = mealLog.eatenItems.length > 0 ? 'DONE' : 'SKIPPED';
            }
            mealEl.setAttribute('status', currentStatus);

            // 🌟 MAGIA: Convertimos los IDs crudos (O_001) a objetos completos para la UI
            const uiFoods = [];
            for (const item of mealPlan.items) {
                const fullData = pantryService.getFoodById(item.refId);
                
                if (fullData) {
                    // 1. Preparamos el alimento base (sea suelto o grupo)
                    const hydratedFood = {
                        ...fullData,
                        id: fullData.id,
                        name: pantryService.getFoodName(fullData, 'es'),
                        grams: item.grams,
                        mode: item.mode,
                        type: fullData.type // Conservamos el tipo para saber qué es
                    };

                    // 2. 🌟 EL FIX: Si es un GRUPO, miramos sus tripas y le ponemos nombre a lo de dentro
                    if (fullData.type === 'group' && fullData.items) {
                        hydratedFood.items = fullData.items.map(subItem => {
                            // Buscamos cada ingrediente suelto en el pantry
                            const subFoodData = pantryService.getFoodById(subItem.refId);
                            return {
            ...subItem, // Mantenemos sus gramos y refId originales
            
            // ¡AQUÍ ESTÁ EL DNI! Le decimos explícitamente cuál es su id
            id: subItem.refId, 

            // Y aquí le inyectamos el nombre que antes faltaba:
            name: subFoodData ? pantryService.getFoodName(subFoodData, 'es') : this.dict.t('lbl_unknown_food')
        };
                        });
                    }

                    // 3. Ahora sí, lo metemos a la lista
                    uiFoods.push(hydratedFood);
                } else {
                    // ¡NUEVO! Si NO existe (fue borrado), creamos un "Zombi" visual
                    uiFoods.push({
                        id: item.refId,
                       name: this.dict.t('lbl_deleted_food'),
                        grams: item.grams,
                        mode: item.mode,
                        k: 0, p: 0, c: 0, f: 0 // Macros a cero para que no rompa las sumas
                    });
                }
            }
            
            // Le pasamos la plantilla
            mealEl.setFoods(uiFoods);

            // Si ya has comido (hay log), le pasamos el progreso convertido a formato UI
            if (currentStatus === 'DONE') {
                const consumedData = {};
                mealLog.eatenItems.forEach(eaten => {
    // Buscamos el nombre para que no salga "undefined"
    const foodRef = pantryService.getFoodById(eaten.refId);
    const foodName = foodRef ? pantryService.getFoodName(foodRef, 'es') : this.dict.t('lbl_unknown_food');

    consumedData[eaten.refId] = {
        isDone: true,
        quantity: eaten.grams,
        name: foodName // <--- Aquí la clave
    };
});
                mealEl.setProgress(consumedData);
            }
            
            // Restaurar acordeón abierto
            if (mealPlan.id === openMealId) {
                mealEl.forceOpen();
            }

            container.appendChild(mealEl);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            @import url('/src/modules/system/components/keypad.css');
            @import url('/src/modules/system/components/keypad-modal.css');
            
            /* --- LAYOUT GLOBAL (Estilo home.js) --- */
            :host {
                display: block;
                width: 100%;
                height: 100dvh; /* Ocupa todo el alto disponible */
                background: var(--Negro-suave);
                overflow: hidden; /* Evita scroll en el host, delega al main */
            }

            .app-screen {
                display: flex;
                flex-direction: column;
                height: 100%;
                width: 100%;
                max-width: 480px;
                margin: 0 auto;
                padding-bottom: 0 !important;
            }

            /* --- 1. HEADER --- */
            .screen-header {
                flex-shrink: 0;
                width: 100%;
                padding-top: max(12px, env(safe-area-inset-top));
                background: var(--Negro-suave);
                z-index: 10;
            }

            /* --- 2. MAIN (Scrollable Area) --- */
            .screen-content {
                flex: 1; /* Ocupa el espacio restante */
                overflow-y: auto; /* Scroll aquí */
                overflow-x: hidden;
                padding: 24px 24px 64px 24px; /* Padding unificado */
                display: flex;
                flex-direction: column;
                gap: 24px;
                
                /* Ocultar barra de scroll estéticamente */
                scrollbar-width: none;
            }
            .screen-content::-webkit-scrollbar { display: none; }

            /* --- 3. FOOTER (Fixed Nav) --- */
            .screen-footer {
                flex-shrink: 0;
                width: 100%;
                z-index: 100;
                background: var(--Negro-suave); /* Para tapar contenido al scrollear */
            }

            /* --- COMPONENTES ESPECÍFICOS --- */
            
            /* Grid del Dashboard */
            .dashboard-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            /* Cajas de Macros */
            .box-base {
                display: flex;
                flex-direction: column;
                padding: 12px;
                gap: 12px;
                border: 1px solid var(--Blanco);
                background: transparent;
                border-radius: 4px; /* Un poco de suavizado opcional */
            }

            .macro-box { justify-content: space-between; }
            
            .macro-title {
                color: var(--Blanco);
                font-family: "JetBrains Mono", monospace;
                font-size: 14px;
                line-height: 140%;
            }

            .macro-data {
                color: var(--Verde-acido);
                font-family: "JetBrains Mono", monospace;
                font-size: 16px;
                font-weight: 500;
            }
            .macro-data .total { color: var(--Blanco); opacity: 0.6; font-size: 14px; font-weight: 400; }

            .macro-track { width: 100%; height: 4px; background: var(--gris-suave-hover); border-radius: 2px; }
            .macro-fill { height: 100%; width: 0%; background: var(--Verde-acido); transition: width 0.5s ease; border-radius: 2px; }

            /* Botón Reajustar */
            .adjust-box {
                justify-content: space-between; 
                height: 94.6px;         
                box-sizing: border-box;   
                cursor: pointer;
                transition: background 0.2s;
                flex-direction: row;
                align-items: center;
            }
            .adjust-box:active { background: rgba(255,255,255,0.1); }
            
            .adjust-text {
                color: var(--Blanco);
                font-family: "JetBrains Mono", monospace;
                font-size: 16px;
            }
            .icon-wrapper {
                align-self: center;
                display: flex;
                max-width: 32px;
            }
            .icon-wrapper svg { width: 100%; height: 100%; fill: var(--Blanco); }

            /* Lista de Comidas */
            #meals-list {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding-bottom: 24px; /* Espacio extra al final */
            }
        </style>

        <div class="app-screen">
            <header class="screen-header">
                <app-section-header title="${this.dict.t('title_smart_checks')}"></app-section-header>
            </header>

            <main class="screen-content">
                
                <section class="dashboard-section">
                    <div style="margin-bottom: 8px;">
                        <nutrition-dashboard-kcal></nutrition-dashboard-kcal>
                    </div>

                    <div class="dashboard-grid">
                        <div class="box-base macro-box">
                            <span class="macro-title">${this.dict.t('lbl_macro_p')}</span>
                            <div class="macro-data" id="val-p">0<span class="total">/0</span></div>
                            <div class="macro-track"><div class="macro-fill" id="bar-p"></div></div>
                        </div>

                        <div class="box-base macro-box">
                            <span class="macro-title">${this.dict.t('lbl_macro_c')}</span>
                            <div class="macro-data" id="val-c">0<span class="total">/0</span></div>
                            <div class="macro-track"><div class="macro-fill" id="bar-c"></div></div>
                        </div>

                        <div class="box-base macro-box">
                            <span class="macro-title">${this.dict.t('lbl_macro_f')}</span>
                            <div class="macro-data" id="val-f">0<span class="total">/0</span></div>
                            <div class="macro-track"><div class="macro-fill" id="bar-f"></div></div>
                        </div>

                        <div class="box-base adjust-box" id="btn-adjust">
                            <div class="adjust-text">${this.dict.t('btn_adjust_goals')}</div>
                            <div class="icon-wrapper">${ICONS.ARROW_RIGHT_CIRCLE}</div>
                        </div>
                    </div>
                </section>

                <section id="meals-list">
                    </section>
            
            </main>

            <footer class="screen-footer">
                <app-nav></app-nav>
            </footer>
        </div>

        <app-keypad-modal></app-keypad-modal>
        `;
    }
}

customElements.define('nutrition-smart-checks', SmartChecksScreen);