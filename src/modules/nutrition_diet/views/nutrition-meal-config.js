import { router } from '../../../core/router/index.js';

// CORREGIDO: Store centralizado en nutrition_core
import { nutritionStore } from '../../nutrition_core/store/index.js';
// CORREGIDO: Servicio centralizado en nutrition_core
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
// CORREGIDO: Nuevo "Contable" de comidas
import { journalService } from '../../nutrition_core/services/journal.service.js';

import { ICONS } from '../../../core/theme/icons.js';

import { i18nService } from '../../../core/i18n/i18n.service.js';

// Componentes del sistema (Estos están OK, la ruta relativa es correcta)
import '../../system/components/input-card.js';
import '../../system/components/segment-select.js';
import '../../system/components/btn.js';
import '../../system/components/navbar.js';

export class NutritionMealConfig extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.mealId = null;
        this.dict = null;
        this.state = {
            label: '',
            time: '09:00',
            notification: false
        };
    }

    async connectedCallback() {
        this.dict = await i18nService.loadPage('nutrition_diet/nutrition-meal-config');
        await nutritionService.init();

        // 1. Obtener ID de la URL (ej: ?id=breakfast)
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
            const params = new URLSearchParams(hashParts[1]);
            this.mealId = params.get('id');
            await this._loadData();
        } else {
            // Si no hay ID, algo va mal, volvemos
            alert(this.dict.t('meal_config_err_no_id'));
            window.history.back();
            return;
        }

        this.render();
        this.setupListeners();
        this._toggleTimeInput(this.state.notification);
    }

    async _loadData() {
        try {
            // Buscamos la comida usando el nuevo servicio
            const plan = await journalService.getMealPlan(this.mealId);
            
            if (plan) {
                this.state.label = plan.label;
                // Si es 'Any', ponemos una hora por defecto para que el input no falle
                this.state.time = (plan.time && plan.time !== 'Any') ? plan.time : '09:00';
                // (Nota: Si quieres añadir 'notification' en el futuro, mételo en el esquema de journalService)
                this.state.notification = plan.notification || false; 
                
                // Forzamos un re-render para que los inputs cojan los valores cargados asíncronamente
                this.render();
                this.setupListeners();
                this._toggleTimeInput(this.state.notification);
            } else {
                alert(this.dict.t('meal_config_err_not_found'));
                window.history.back();
            }
        } catch (e) {
            console.error("Error cargando configuración de comida:", e);
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            @import url('/src/modules/system/components/btn.css');
            @import url('/src/modules/system/components/navbar.css');
            
            * { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                min-height: 100dvh;
                background: var(--Negro-suave);
                
                /* FRAME PRINCIPAL */
                padding-top: 8px;
                padding-bottom: 0px;
                gap: 24px;
            }

            /* --- HEADER --- */
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
                line-height: 150%;
            }
            .icon-back svg { width: 24px; height: 24px; fill: var(--Blanco); }

            /* --- CONTENIDO --- */
            .main-content {
                display: flex;
                padding: 0 24px;
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
                flex: 1 0 0; 
                align-self: stretch;
            }

            .input-line {
                width: 100%;
                background: transparent;
                border: none;
                border: 1px solid var(--Blanco); 
                padding: 12px;
                color: var(--Blanco);
                font-family: 'JetBrains Mono', monospace; 
                font-size: 16px;
                outline: none;
                border-radius: 0; 
            }
            .input-line::placeholder { color: var(--gris-hover); opacity: 0.5; }
            input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
            .disabled-block { opacity: 0.5; pointer-events: none; }

            /* --- BOTONES (Action Section) --- */
            .action-section {
                padding: 0 24px 24px 24px; 
                display: flex;
                flex-direction: column;
                /* 🔥 AQUÍ ESTÁ EL GAP DE 24PX DEL FIGMA 🔥 */
                gap: 24px; 
            }
            
            /* Estilo del wrapper */
            app-btn {
                width: 100%;
                display: block;
            }

            /* 🔥 EL FIX DEL BOTÓN (Mantenemos esto para que se vean grandes) 🔥 */
            app-btn .btn {
                width: 100% !important; 
                justify-content: center;
            }

            /* --- NAV --- */
            .nav-container {
                position: fixed;
                bottom: 0; left: 0; width: 100%; z-index: 100;
            }
        </style>

        <div class="header" id="btn-back">
            <div class="icon-back">${ICONS.ARROW_LEFT}</div>
            <span class="title-text">${this.dict.t('meal_config_header')}/[${this.state.label}]</span>
        </div>

        <main class="main-content">
            <app-input-card label="${this.dict.t('meal_config_label_name')}">
                <input type="text" class="input-line" id="input-name" 
                       value="${this.state.label}" autocomplete="off">
            </app-input-card>

            <app-input-card label="${this.dict.t('meal_config_label_notif')}">
                <app-segment-select id="notification-toggle"></app-segment-select>
            </app-input-card>

            <div id="group-time" style="width: 100%">
                <app-input-card label="${this.dict.t('meal_config_label_time')}">
                    <input type="time" class="input-line" id="input-time" 
                           value="${this.state.time}">
                </app-input-card>
            </div>
        </main>

        <div class="action-section">
            <app-btn 
                variant="secondary" 
                label="${this.dict.t('meal_config_btn_edit_foods')}"
                id="btn-edit-foods">
            </app-btn>

            <app-btn 
                variant="primary" 
                label="${this.dict.t('meal_config_btn_save')}"
                id="btn-save">
            </app-btn>
        </div>
        `;

        const toggle = this.shadowRoot.getElementById('notification-toggle');
        toggle.setOptions([
            { value: 'off', label: this.dict.t('meal_config_toggle_off') }, 
            { value: 'on', label: this.dict.t('meal_config_toggle_on') }  
        ]);
        toggle.setAttribute('value', this.state.notification ? 'on' : 'off'); 
    }

    setupListeners() {
        this.shadowRoot.getElementById('btn-back').addEventListener('click', () => {
            router.navigate('/Diet');
        });

        this.shadowRoot.getElementById('input-name').addEventListener('input', (e) => {
            this.state.label = e.target.value;
        });

        const toggle = this.shadowRoot.getElementById('notification-toggle');
        
        // Le añadimos 'async' porque vamos a esperar la respuesta del usuario
        toggle.addEventListener('change', async (e) => {
            const wantsOn = e.detail.value === 'on';

            if (wantsOn) {
                // El usuario quiere encenderlas, llamamos al portero
                const hasPermission = await this._requestNotificationPermission();
                
                if (!hasPermission) {
                    // Si no hay permiso, obligamos al toggle a volver a OFF visualmente
                    toggle.setAttribute('value', 'off'); 
                    // Y mantenemos el estado apagado por debajo
                    this.state.notification = false;     
                    this._toggleTimeInput(false);        
                    return; // Cortamos la ejecución aquí, no pasa a la discoteca
                }
            }

            // Si llegamos aquí, es porque:
            // A) El usuario quería apagar el toggle (wantsOn es false)
            // B) El usuario quería encenderlo Y nos dio permiso
            this.state.notification = wantsOn;
            this._toggleTimeInput(wantsOn);
        });

        this.shadowRoot.getElementById('input-time').addEventListener('change', (e) => {
            this.state.time = e.target.value;
        });

        // --- BOTÓN FINALIZAR (GUARDAR) ---
        this.shadowRoot.getElementById('btn-save').addEventListener('click', () => {
            this.handleSave();
        });

        // --- BOTÓN EDITAR ALIMENTOS (NUEVA RUTA) ---
        this.shadowRoot.getElementById('btn-edit-foods').addEventListener('click', () => {
            // Navegamos a la futura pantalla pasando el ID de la comida
            router.navigate(`/nutrition/edit-meal-foods?id=${this.mealId}`);
        });
    }

    _toggleTimeInput(isEnabled) {
        const group = this.shadowRoot.getElementById('group-time');
        if (isEnabled) {
            group.classList.remove('disabled-block');
        } else {
            group.classList.add('disabled-block');
        }
    }
    
    async _requestNotificationPermission() {
        // 1. ¿El navegador es del año de la pera y no soporta notificaciones?
        if (!('Notification' in window)) {
            alert('Tu navegador no soporta notificaciones locales.');
            return false;
        }

        // 2. Si ya nos dio permiso en el pasado, ¡vía libre (VIP)!
        if (Notification.permission === 'granted') {
            return true;
        }

        // 3. Si nos bloqueó en el pasado (lista negra), se lo decimos
        if (Notification.permission === 'denied') {
            alert('Las notificaciones están bloqueadas. Actívalas en los ajustes de tu navegador o móvil.');
            return false;
        }

        // 4. Si nunca le hemos preguntado, le sacamos el popup del navegador
        const permission = await Notification.requestPermission();
        
        // Si acepta devuelve true, si rechaza devuelve false
        return permission === 'granted'; 
    }

    async handleSave() {
        if (!this.state.label.trim()) {
            alert(this.dict.t('meal_config_alert_name_req'));
            return;
        }

        try {
            // 1. Recuperamos el plan antiguo para mantener sus items y su orden
            const oldPlan = await journalService.getMealPlan(this.mealId);
            
            if (!oldPlan) throw new Error("Meal plan no encontrado");

            // 2. Guardamos pisando el antiguo pero actualizando nombre, hora Y NOTIFICACIÓN
            // (El servicio ya respeta los items existentes si le pasas el mismo ID)
            await journalService.saveMealPlan(
                this.mealId, 
                oldPlan.order, 
                this.state.label, 
                this.state.time,
                this.state.notification, // AQUÍ VA EL NUEVO PASAJERO CHU CHU
                Array.isArray(oldPlan.items) ? oldPlan.items : [], // <-- ESCUDO: Si no es un array, mandamos uno vacío para que no explote nada
                oldPlan.isVisible        // Le pasamos si era visible o no
            );
           
            // 3. Volver
            router.navigate('/nutrition');

        } catch (e) {
            console.error(e);
            alert(this.dict.t('meal_config_err_save'));
        }
    }
}

customElements.define('nutrition-meal-config', NutritionMealConfig);