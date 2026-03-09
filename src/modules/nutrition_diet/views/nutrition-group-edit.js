import { router } from '../../../core/router/index.js';
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
// NUEVO: Importamos los servicios especializados
import { pantryService } from '../../nutrition_core/services/pantry.service.js';
import { journalService } from '../../nutrition_core/services/journal.service.js';

import { ICONS } from '../../../core/theme/icons.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

import '../../system/components/btn.js';
import '../../system/components/navbar.js';
import '../components/adjuster-card.js';
import '../../nutrition_core/components/food-card.js';

export class NutritionGroupEdit extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.mealId = null;
        this.groupId = null;
        
        this.groupDef = null; // La definición del grupo en la Despensa (Pantry)
        this.hydratedItems = []; // Ingredientes con datos completos (nombre, macros base)

        // Índice del ingrediente que estamos editando actualmente (-1 = ninguno)
        this.editingIndex = -1;
        this.dict = null; // Aquí guardaremos las traducciones, porque sno, no aparecen por magia...
    }

    async connectedCallback() {
        // 1. Inicializar servicios
        await nutritionService.init();
        await Promise.all([pantryService.init(), journalService.init()]);

        // 1.5. ¡Cargar el diccionario con el prefijo correcto!
        this.dict = await i18nService.loadPage('nutrition_diet/nutrition-group-edit');

        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.mealId = params.get('meal'); // ej: 'plan_meal_0'
        this.groupId = params.get('id');  // ej: 'G_1708...'

        // 2. [CORRECCIÓN]: Buscar el grupo en la DESPENSA, no en el Log
        // Los grupos existen independientemente de si están en una comida hoy o no
        const groupData = pantryService.getFoodById(this.groupId);

        if (!groupData || groupData.type !== 'group') {
            alert(this.dict.t('group_edit_err_not_found'));
            window.history.back();
            return;
        }

        // Clonamos para no mutar el store directamente hasta guardar
        this.groupDef = JSON.parse(JSON.stringify(groupData));

        // 3. Hidratar ingredientes (Cruzar refId con datos reales)
        this._hydrateIngredients();

        this.render();
        this.setupListeners();
    }

    _hydrateIngredients() {
        this.hydratedItems = this.groupDef.items.map(item => {
            // Buscamos el alimento original (Pechuga, Arroz...)
            const baseFood = pantryService.getFoodById(item.refId);
            
            if (!baseFood) return null;

            // Calculamos los macros actuales de ese ingrediente dentro del grupo
            const ratio = (item.grams || 0) / 100;

            return {
                ...item, // refId, mode, grams
                name: pantryService.getFoodName(baseFood, i18nService.getPreferences().lang),
                base: { // Macros base (por 100g) para el adjuster
                    k: baseFood.k,
                    p: baseFood.p,
                    c: baseFood.c,
                    f: baseFood.f
                },
                calculated: { // Macros reales en el plato
                    k: Math.round(baseFood.k * ratio),
                    p: parseFloat((baseFood.p * ratio).toFixed(1)),
                    c: parseFloat((baseFood.c * ratio).toFixed(1)),
                    f: parseFloat((baseFood.f * ratio).toFixed(1))
                }
            };
        }).filter(Boolean); // Eliminamos nulos si algo falló
    }

    render() {
        // --- 1. PREPARACIÓN DE DATOS (Lógica Actual Intacta) ---
        let activeItem = null;
        let baseK = 0, baseP = 0, baseC = 0, baseF = 0;

        if (this.editingIndex !== -1 && this.hydratedItems[this.editingIndex]) {
            activeItem = this.hydratedItems[this.editingIndex];
            baseK = activeItem.base.k;
            baseP = activeItem.base.p;
            baseC = activeItem.base.c;
            baseF = activeItem.base.f;
        }

        const groupName = pantryService.getFoodName(this.groupDef, 'es');

        // --- 2. RENDERIZADO VISUAL (Tu Plantilla Perfecta) ---
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
                gap: 24px;
                flex: 1;
            }

            /* SECCIÓN LISTA DE INGREDIENTES */
            .ingredients-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .section-label {
                color: var(--gris-hover);
                font-family: "JetBrains Mono";
                font-size: 12px;
                opacity: 0.7;
            }

            /* Tarjeta de ingrediente seleccionable */
            .ingredient-row {
                opacity: 0.8;
                transition: all 0.2s;
                cursor: pointer;
                border: 1px solid transparent;
            }
            .ingredient-row.active {
                opacity: 1;
                border-color: var(--Verde-acido);
            }

            /* SECCIÓN EDITOR (Aparece al clicar un ingrediente) */
            .editor-area {
                display: flex;
                flex-direction: column;
                gap: 16px;
                padding-top: 16px;
                border-top: 1px solid rgba(255,255,255,0.1);
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
        </style>

        <div class="header" id="btn-back">
            <div class="icon-back">${ICONS.ARROW_LEFT}</div>
            <span class="title-text">${this.dict.t('group_edit_header')} / ${groupName}</span>
        </div>

        <main class="content">
            <div class="ingredients-list">
                <span class="section-label">${this.dict.t('group_edit_label_ingredients')} (${this.hydratedItems.length})</span>
                
                ${this.hydratedItems.map((item, index) => {
                    const p = item.calculated ? item.calculated.p : '-';
                    const c = item.calculated ? item.calculated.c : '-';
                    const f = item.calculated ? item.calculated.f : '-';
                    const isActive = index === this.editingIndex;
                    
                    return `
                    <div class="ingredient-row ${isActive ? 'active' : ''}" data-index="${index}">
                        <app-food-card 
                            label="${item.name} (${item.grams || 0}g)" 
                            p="${p}" c="${c}" f="${f}"
                            style="pointer-events: none;"> </app-food-card>
                    </div>
                    `;
                }).join('')}
            </div>

            ${this.editingIndex !== -1 && activeItem ? `
                <div class="editor-area">
                    <span class="section-label">${this.dict.t('group_edit_label_editing', { foodName: activeItem.name })}</span>
                    
                    <nutrition-adjuster-card
                        id="adjuster"
                        label="${activeItem.name}"
                        grams="${activeItem.grams || 100}"
                        k="${baseK}" p="${baseP}" c="${baseC}" f="${baseF}"
                        mode="${activeItem.mode || 'fixed'}" 
                        step="1"
                    ></nutrition-adjuster-card>

                    <app-btn variant="secondary" label="${this.dict.t('group_edit_btn_del_item')}" id="btn-delete-item" style="opacity:0.7; transform:scale(0.9)"></app-btn>
                </div>
            ` : `
                <div style="text-align:center; padding: 20px; opacity: 0.5; font-family:'JetBrains Mono'; color:white; font-size:14px;">
                    ${this.dict.t('group_edit_hint_empty')}
                </div>
            `}
        </main>

        <div class="action-section">
            <app-btn variant="primary" label="${this.dict.t('group_edit_btn_save')}" id="btn-save-group"></app-btn>
            <app-btn variant="secondary" label="${this.dict.t('group_edit_btn_del_group')}" id="btn-delete-group" style="color: #FF4444; border-color: #FF4444;"></app-btn>
        </div>
        `;
    }

    setupListeners() {
        this.shadowRoot.getElementById('btn-back').addEventListener('click', () => window.history.back());

        // A. CLIC EN LA LISTA (SELECCIONAR INGREDIENTE)
        const rows = this.shadowRoot.querySelectorAll('.ingredient-row');
        rows.forEach(row => {
            row.addEventListener('click', () => {
                const newIndex = parseInt(row.dataset.index);
                // Toggle selección
                this.editingIndex = (this.editingIndex === newIndex) ? -1 : newIndex;
                this.render();
                this.setupListeners();
            });
        });

        // B. ADJUSTER (Si está visible)
        const adjuster = this.shadowRoot.getElementById('adjuster');
        if (adjuster) {
            adjuster.addEventListener('change', (e) => {
                // Actualizamos el ingrediente temporalmente
                const item = this.hydratedItems[this.editingIndex];
                item.mode = e.detail.mode;
                item.grams = e.detail.grams;
                
                // Actualizamos también los calculados para feedback visual inmediato (aunque la logica real ocurre en save)
                item.calculated = e.detail.calculated;
                
                // Actualizamos el array "real" groupDef.items sincronizandolo
                this.groupDef.items[this.editingIndex].grams = item.grams;
                this.groupDef.items[this.editingIndex].mode = item.mode;
            });

            // BORRAR INGREDIENTE INDIVIDUAL
            const btnDelItem = this.shadowRoot.getElementById('btn-delete-item');
            if (btnDelItem) {
                btnDelItem.addEventListener('click', () => {
                    if (confirm(this.dict.t('group_edit_confirm_del_item'))) {
                        // Borrar de hydratedItems
                        this.hydratedItems.splice(this.editingIndex, 1);
                        // Borrar de groupDef
                        this.groupDef.items.splice(this.editingIndex, 1);
                        
                        this.editingIndex = -1;
                        this.render();
                        this.setupListeners();
                    }
                });
            }
        }

        // C. GUARDAR GRUPO (ACTUALIZAR DEFINICIÓN EN PANTRY)
        this.shadowRoot.getElementById('btn-save-group').addEventListener('click', async () => {
            if (this.hydratedItems.length === 0) {
                return alert(this.dict.t('group_edit_alert_empty_group'));
            }

            try {
                // 1. Recalcular Totales del Grupo
                // Sumamos los macros calculados de todos los ingredientes
                const newTotals = this.hydratedItems.reduce((acc, item) => ({
                    k: acc.k + (item.calculated.k || 0),
                    p: acc.p + (item.calculated.p || 0),
                    c: acc.c + (item.calculated.c || 0),
                    f: acc.f + (item.calculated.f || 0)
                }), { k: 0, p: 0, c: 0, f: 0 });

                // 2. Actualizar Objeto del Grupo
                this.groupDef.k = Math.round(newTotals.k);
                this.groupDef.p = parseFloat(newTotals.p.toFixed(1));
                this.groupDef.c = parseFloat(newTotals.c.toFixed(1));
                this.groupDef.f = parseFloat(newTotals.f.toFixed(1));

                // 3. Guardar en Pantry (Esto actualiza la definición G_XXX para siempre)
                await pantryService.saveCustomFood(this.groupDef);

                // No hace falta tocar el journalService, porque la plantilla solo apunta al ID (G_XXX)
                // y acabamos de actualizar lo que significa ese ID.
                
                window.history.back();

            } catch (e) {
                console.error(e);
                alert(this.dict.t('group_edit_err_save'));
            }
        });

        // D. BORRAR GRUPO ENTERO (QUITAR DE LA COMIDA)
        this.shadowRoot.getElementById('btn-delete-group').addEventListener('click', async () => {
            if (confirm(this.dict.t('group_edit_confirm_del_group'))) {
                try {
                    // 1. Cargar el plan
                    const plan = await journalService.getMealPlan(this.mealId);
                    
                    // 2. Filtrar
                    const originalLength = plan.items.length;
                    plan.items = plan.items.filter(i => i.refId !== this.groupId);

                    if (plan.items.length === originalLength) {
                        console.warn("El grupo no estaba en el plan (¿Ya borrado?)");
                    }

                    // 3. Guardar Plan actualizado
                    await journalService.saveMealPlan(
                        plan.id, plan.order, plan.label, plan.time, plan.notification || false, plan.items, plan.isVisible
                    );
                    // Aquí también se jode

                    window.history.back();
                } catch (e) {
                    console.error(e);
                    alert(this.dict.t('group_edit_err_del_group'));
                }
            }
        });
    }
}

customElements.define('nutrition-group-edit', NutritionGroupEdit);