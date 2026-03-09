// src/modules/nutrition_smart/components/smart-meal-check-wit.js

import { MealState } from './smart-meal-check-modules/state.js';
import { MealView } from './smart-meal-check-modules/view.js';
import { STYLES } from './smart-meal-check-modules/styles.js';
import { EVENTS, STATUS, ITEM_TYPES } from './smart-meal-check-modules/constants.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class SmartMealCheckWit extends HTMLElement {
    static get observedAttributes() { return ['title', 'status', 'meal-id']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Instanciamos la Memoria (Estado)
        this.state = new MealState();
        
        // Estado visual local (Acordeón)
        this._isOpen = false;
    }

    async connectedCallback() {
        // Cargar diccionario primero
        this.dict = await i18nService.loadPage('nutrition_smart/smart-meal-check-wit');

        // 1. Render Inicial (Esqueleto + Estilos)
        this.shadowRoot.innerHTML = `
            <style>${STYLES}</style>
            ${MealView.getTemplate(this.getAttribute('title'))}
        `;

        // 2. Cachear referencias DOM
        this.dom = {
            header: this.shadowRoot.getElementById('mainHeader'),
            content: this.shadowRoot.getElementById('mainContent'),
            title: this.shadowRoot.getElementById('headerTitle'),
            icon: this.shadowRoot.getElementById('headerIcon')
        };

        // 3. Listeners del Header (Abrir/Cerrar)
        this.dom.header.addEventListener('click', () => this.toggleAccordion());

        // 4. Renderizar contenido inicial
        this.updateView();
    }
    
    // Os cuento un chiste: ¿Sabéis que le dice un pato a un pato? Cuack Cuack. La explicación estará en siguiente documento que, por pura lógica, tengo que tocar para terminar el i18n.

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        
        if (name === 'title' && this.dom) {
            this.dom.title.innerText = newVal;
        }
        if (name === 'status') {
            if (newVal !== STATUS.PENDING) this._isOpen = false;
            this.updateView();
        }
    }

    // --- API PÚBLICA (Lo que llama la vista padre) ---

    setFoods(foodsArray) {
        this.state.init(foodsArray);
        this.updateView();
    }

    setProgress(consumedData) {
        this.state.loadProgress(consumedData);
        this.updateView();
    }
    
    forceOpen() {
        this._isOpen = true;
        this.updateView();
    }

    // --- CORE: ACTUALIZACIÓN DE LA VISTA ---

    updateView() {
        if (!this.dom) return;

        const currentStatus = this.getAttribute('status') || STATUS.PENDING;

        // A. Actualizar Icono Header
        MealView.updateHeaderIcon(this.dom.icon, this._isOpen, currentStatus);

        // B. Gestión del Acordeón (Clase CSS)
        if (this._isOpen) this.dom.content.classList.add('show');
        else this.dom.content.classList.remove('show');

        // C. Renderizar Lista (Delegamos en View.js)
        if (currentStatus !== STATUS.PENDING) {
            // MODO RESUMEN (Solo lectura)
            MealView.renderSummary(this.dom.content, this.state.getLog(), currentStatus, {
                onReset: () => this.resetMeal()
            });
        } else {
            // MODO ACTIVO (Interactivo)
            MealView.renderActive(
                this.dom.content, 
                this.state.getCurrentViewData(), // Datos
                this.state,                      // Estado (para chequear isDone)
                {                                // Handlers (Acciones)
                    onItemClick: (item) => this.handleItemClick(item),
                    onBack: () => this.handleBack(),
                    onOther: () => this.emit(EVENTS.REQUEST_OTHER),
                    onSkip: () => this.finishMeal(STATUS.SKIPPED),
                    onSave: () => this.handleSave() // 🌟 EL NUEVO BOTÓN
                }
            );
        }
    }

    // --- LÓGICA DE INTERACCIÓN (Handlers) ---

    toggleAccordion() {
        this._isOpen = !this._isOpen;
        this.updateView();
    }

    handleBack() {
        this.state.navigateUp();
        this.updateView();
    }

    handleItemClick(item) {
        // 1. Si es Grupo -> Entramos a ver qué hay dentro
        if (item.type === ITEM_TYPES.GROUP) {
            this.state.enterGroup(item);
            this.updateView();
            return;
        }

        // 2. Si ya está hecho -> Desmarcamos
        if (this.state.isItemDone(item.id)) {
            this.state.toggleItem(item);
            this.updateView(); // Simplemente repintamos, SIN auto-guardar
            return;
        }

        // 3. LÓGICA VARIABLE (Pide gramos por teclado)
        const needsKeypad = item.isVariable || item.mode === 'variable';

        if (needsKeypad) {
            this.emit(EVENTS.REQUEST_QTY, {
                item: item,
                callback: (qty) => {
                    this.state.toggleItem(item, qty);
                    this.updateView(); // Simplemente repintamos
                }
            });
        } else {
            // 4. Item normal (Fijo)
            this.state.toggleItem(item);
            this.updateView(); // Simplemente repintamos
        }
    }

    // 🌟 NUEVO EVENTO: GUARDAR MANUALMENTE
    handleSave() {
        // Cogemos el log (puede tener todos los items marcados, o solo 1, o ninguno)
        const currentLog = this.state.getLog();
        const itemsCount = Object.keys(currentLog).length;
        
        // Si le da a guardar sin haber marcado nada, asumimos que se la ha saltado o le avisamos
        if (itemsCount === 0) {
            if(confirm(this.dict.t('alert_empty_save'))) {
                this.finishMeal(STATUS.SKIPPED);
            }
            return;
        }

        // Si hay cosas marcadas, finalizamos con éxito
        this.finishMeal(STATUS.DONE);
    }

    // ❌ ELIMINADA LA FUNCIÓN checkCompletion() ❌

    finishMeal(status) {
        this.setAttribute('status', status);

        if (status === STATUS.SKIPPED) {
            this.state._progress = {}; // Vaciamos los checks internos
            this._isOpen = false;
            this.updateView();
            this.notifyChange(status);
        } 
        else if (status === STATUS.DONE) {
            // 1. Emitimos YA para que el JournalService lo guarde instantáneamente
            this.notifyChange(status);
            
            // 2. Pequeño delay de 300ms solo para que la animación de cierre sea elegante
            setTimeout(() => { 
                this._isOpen = false; 
                this.updateView(); 
            }, 300);
        } 
        else {
            this._isOpen = false;
            this.updateView();
            this.notifyChange(status);
        }
    }

    resetMeal() {
        if (confirm(this.dict.t('alert_reset_meal'))) {
            this.state._progress = {}; 
            
            this.setAttribute('status', STATUS.PENDING);
            this._isOpen = true;
            this.updateView();
            
            // Avisamos al sistema que la comida ahora está vacía
            this.notifyChange(STATUS.PENDING);
        }
    }

    // --- EVENTOS SALIENTES ---

    notifyChange(status) {
        this.emit(EVENTS.MEAL_COMPLETED, {
            mealId: this.getAttribute('meal-id'),
            status: status,
            log: this.state.getLog()
        });
    }

    emit(eventName, detail = {}) {
        this.dispatchEvent(new CustomEvent(eventName, {
            detail,
            bubbles: true,
            composed: true
        }));
    }
}

// Registramos el componente
customElements.define('smart-meal-check-wit', SmartMealCheckWit);