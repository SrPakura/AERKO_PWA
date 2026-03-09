import { router } from '../../../core/router/index.js';
import { nutritionStore } from '../../nutrition_core/store/index.js';
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
import { pantryService } from '../../nutrition_core/services/pantry.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // INYECCIÓN I18N
import { ICONS } from '../../../core/theme/icons.js';
import { db } from '../../../core/db/index.js'; 

// Componentes
import '../../system/components/btn.js';
import '../../system/components/navbar.js';
import '../../system/components/input-card.js';
import '../../system/components/keypad-modal.js';

export class NutritionFoodCreate extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.state = {
            name: '',
            k: 0,
            p: 0,
            c: 0,
            f: 0
        };
        
        // Capturamos el meal de la URL para saber a dónde volver
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        this.targetMeal = params.get('meal') || 'default';
    }

    async connectedCallback() {
        await nutritionService.init();
        
        // CARGA ASÍNCRONA DEL DICCIONARIO
        this.dict = await i18nService.loadPage('nutrition_diet/food-create');
        
        this.render();
        this.setupListeners();
    
        // Comprobar si traemos regalo del escáner
        this.checkForImportedFood(); 
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');
            @import url('/src/modules/system/components/btn.css');
            @import url('/src/modules/system/components/keypad.css'); 
            @import url('/src/modules/system/components/keypad-modal.css');
            
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

            /* HEADER */
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

            /* CONTENIDO */
            .content {
                display: flex;
                flex-direction: column;
                padding: 0 24px;
                gap: 16px;
                flex: 1;
            }

            /* INPUTS ESTILO TERMINAL */
            .input-box {
                display: flex;
                width: 100%;
                padding: 12px;
                justify-content: space-between;
                align-items: center;
                border: 1px solid var(--Blanco);
                background: transparent;
                color: var(--Blanco);
                font-family: 'JetBrains Mono', monospace;
                font-size: 16px;
                outline: none;
                cursor: pointer;
                transition: border-color 0.2s;
            }
            
            .input-box:focus, .input-box:active {
                border-color: var(--Verde-acido);
            }

            .input-placeholder { color: var(--gris-hover); opacity: 0.5; }
            .unit-tag { color: var(--Verde-acido); font-weight: 700; margin-left: 8px; }

            /* Text Input nativo para el nombre */
            input.input-box {
                border-radius: 0;
                appearance: none;
            }

            /* FOOTER */
            .action-section {
                padding: 0 24px 24px 24px;
                margin-top: auto;
            }
            
            app-btn { width: 100%; display: block; }
            app-btn .btn { width: 100% !important; justify-content: center; }
            
            .nav-container { position: fixed; bottom: 0; left: 0; width: 100%; z-index: 100; }
        </style>

        <div class="header" id="btn-back">
            <div class="icon-back">${ICONS.ARROW_LEFT}</div>
            <span class="title-text">${this.dict.t('create_header_title')}</span>
        </div>

        <main class="content">
            <app-input-card label="${this.dict.t('create_label_name')}">
                <input type="text" class="input-box" id="input-name" placeholder="${this.dict.t('create_placeholder_name')}" autocomplete="off">
            </app-input-card>

            <app-input-card label="${this.dict.t('create_label_kcal')}">
                <div class="input-box" id="btn-kcal">
                    <span id="val-kcal" class="input-placeholder">${this.dict.t('create_placeholder_macros')}</span>
                </div>
            </app-input-card>

            <app-input-card label="${this.dict.t('create_label_p')}">
                <div class="input-box" id="btn-p">
                    <span id="val-p" class="input-placeholder">${this.dict.t('create_placeholder_macros')}</span>
                    <span class="unit-tag">[ G ]</span>
                </div>
            </app-input-card>

            <app-input-card label="${this.dict.t('create_label_c')}">
                <div class="input-box" id="btn-c">
                    <span id="val-c" class="input-placeholder">${this.dict.t('create_placeholder_macros')}</span>
                    <span class="unit-tag">[ G ]</span>
                </div>
            </app-input-card>

            <app-input-card label="${this.dict.t('create_label_f')}">
                <div class="input-box" id="btn-f">
                    <span id="val-f" class="input-placeholder">${this.dict.t('create_placeholder_macros')}</span>
                    <span class="unit-tag">[ G ]</span>
                </div>
            </app-input-card>
        </main>

        <div class="action-section">
            <app-btn variant="primary" label="${this.dict.t('create_btn_save')}" id="btn-create"></app-btn>
        </div>
        
        <app-keypad-modal id="modal-keypad"></app-keypad-modal>
        `;
    }

    setupListeners() {
        this.shadowRoot.getElementById('btn-back').addEventListener('click', () => window.history.back());

        // 1. NOMBRE (Input Nativo)
        const nameInput = this.shadowRoot.getElementById('input-name');
        nameInput.addEventListener('input', (e) => {
            this.state.name = e.target.value;
        });

        // 2. MACROS (Keypad Modal)
        const modal = this.shadowRoot.getElementById('modal-keypad');

        const setupMacroInput = (btnId, valId, label, key) => {
            this.shadowRoot.getElementById(btnId).addEventListener('click', async () => {
                // Si el valor es 0, mostramos vacío en el keypad para escribir rápido
                const initialVal = this.state[key] === 0 ? '' : this.state[key];
                
                const res = await modal.open(label, initialVal, 'numeric');
                if (res !== null) {
                    const num = parseFloat(res.value) || 0;
                    this.state[key] = num;
                    
                    // Actualizar vista
                    const el = this.shadowRoot.getElementById(valId);
                    el.innerText = num;
                    el.classList.remove('input-placeholder');
                }
            });
        };

        // Pasamos el label traducido al keypad
        setupMacroInput('btn-kcal', 'val-kcal', this.dict.t('create_modal_kcal'), 'k');
        setupMacroInput('btn-p', 'val-p', this.dict.t('create_modal_p'), 'p');
        setupMacroInput('btn-c', 'val-c', this.dict.t('create_modal_c'), 'c');
        setupMacroInput('btn-f', 'val-f', this.dict.t('create_modal_f'), 'f');

        // 3. CREAR (Guardar)
        this.shadowRoot.getElementById('btn-create').addEventListener('click', () => {
            this.handleCreate();
        });
    }

    async handleCreate() {
        if (!this.state.name.trim()) {
            alert(this.dict.t('create_alert_name_req'));
            return;
        }

        // 1. Crear Objeto Alimento "Crudo" (sin ID)
        const newFood = {
            name: this.state.name, // Usamos 'name' normal, el servicio lo mapeará
            type: 'Aliment',       // Definimos el tipo (Alimento suelto)
            category: 'Created',   // Categoría para saber que es nuestro
            k: this.state.k,
            p: this.state.p,
            c: this.state.c,
            f: this.state.f,
            // (Ya no necesitamos poner grams: 100 ni custom: true, el servicio se encarga)
        };

        try {
            // 2. Pedimos al servicio que guarde el alimento (Él le pondrá el ID "C_..." y hablará con la DB)
            await pantryService.saveCustomFood(newFood);

            // 3. Volver a la pantalla de añadir
            window.location.hash = `#/nutrition/add-food?meal=${this.targetMeal}`;

        } catch (error) {
            console.error(error);
            alert(this.dict.t('create_alert_save_error'));
        }
    }
    
    /**
     * Revisa si venimos de escanear un producto y rellena los datos
     */
    checkForImportedFood() {
        // 1. Mirar si la URL dice mode=import
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        if (params.get('mode') !== 'import') return;

        // 2. Recuperar datos del SessionStorage
        const storedJson = sessionStorage.getItem('temp_import_food');
        if (!storedJson) return;

        try {
            const food = JSON.parse(storedJson);
            console.log("📦 Importando:", food);

            // 3. Actualizar el ESTADO interno (Lo más importante)
            this.state.name = food.n || '';
            this.state.k = food.k || 0;
            this.state.p = food.p || 0;
            this.state.c = food.c || 0;
            this.state.f = food.f || 0;

            // 4. Actualizar la VISTA (Visual)

            // A) Nombre (Input normal)
            const nameInput = this.shadowRoot.getElementById('input-name');
            if (nameInput) nameInput.value = this.state.name;

            // B) Macros (Son Spans, hay que cambiar innerText y quitar el color gris)
            const updateMacroUI = (id, value) => {
                const el = this.shadowRoot.getElementById(id);
                if (el) {
                    el.innerText = value; // Ponemos el número
                    el.classList.remove('input-placeholder'); // Lo ponemos en blanco brillante
                }
            };

            updateMacroUI('val-kcal', this.state.k);
            updateMacroUI('val-p', this.state.p);
            updateMacroUI('val-c', this.state.c);
            updateMacroUI('val-f', this.state.f);

            // 5. Limpieza (Borrar para que no salga siempre)
            sessionStorage.removeItem('temp_import_food');

        } catch (e) {
            console.error("Error importando alimento:", e);
        }
    }
}

customElements.define('nutrition-food-create', NutritionFoodCreate);