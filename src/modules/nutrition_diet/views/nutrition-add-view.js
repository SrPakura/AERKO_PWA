// src/modules/nutrition_diet/views/nutrition-add-view.js

import { ICONS } from '../../../core/theme/icons.js';
// 1. IMPORTANTE: Importamos al Almacenero (Pantry) y al Director (Nutrition)
import { pantryService } from '../../nutrition_core/services/pantry.service.js'; 
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js'; 
import { i18nService } from '../../../core/i18n/i18n.service.js'; // NUEVO: Importamos el servicio de idiomas
import '../../nutrition_core/components/food-card.js';

export class NutritionAddView extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Estado para Lazy Loading
        this.allFoods = [];      // Todos los alimentos ordenados
        this.renderedCount = 0;  // Cuántos hemos pintado
        this.chunkSize = 20;     // De cuánto en cuánto cargamos
        this.isSearching = false; // ¿Estamos filtrando?
        
        // ESTADO NUEVO: Guardamos a qué comida vamos a añadir
        this.targetMeal = 'default';
        this.shouldAutoComplete = false;
        
        // Binding para el scanner
        this.onScanSuccess = this.onScanSuccess.bind(this);
    }

    async connectedCallback() {
        // 0. CAPTURAR EL MEAL DE LA URL
        const hashParts = window.location.hash.split('?');
        if (hashParts.length > 1) {
            const params = new URLSearchParams(hashParts[1]);
            this.targetMeal = params.get('meal') || 'default';
            this.shouldAutoComplete = params.get('autoComplete') === 'true';
        }

        // 1. Asegurar que TODO el sistema está listo
        await nutritionService.init(); 
        
        // 1.5 Cargar diccionario de traducciones
        this.dict = await i18nService.loadPage('nutrition_diet/add-view');
        
        // 2. Usamos el PantryService para traer TODO
        this.allFoods = pantryService.searchFood(''); 
        
        // 3. Ordenamos alfabéticamente A-Z usando el nuevo helper de idioma
        this.allFoods.sort((a, b) => {
            // ASIGNACIÓN DE PUNTUACIÓN
            let scoreA = (a.type === 'group') ? 3 : (a.id.startsWith('C_') || a.category === 'Created') ? 2 : 1;
            let scoreB = (b.type === 'group') ? 3 : (b.id.startsWith('C_') || b.category === 'Created') ? 2 : 1;

            // COMPARACIÓN
            if (scoreA !== scoreB) {
                return scoreB - scoreA; // El que tenga más puntos sube arriba
            }

            // DESEMPATE: Si tienen los mismos puntos, ordenamos por nombre (A-Z)
            const nameA = pantryService.getFoodName(a, 'es');
            const nameB = pantryService.getFoodName(b, 'es');
            return nameA.localeCompare(nameB);
        });

        // 4. Renderizar
        this.render();
        this.setupListeners();
        this.loadMoreFoods(); // Carga los primeros 20
        this.setupInfiniteScroll();
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            @import url('/src/core/theme/variables.css');

            :host {
                display: flex;
                flex-direction: column;
                width: 100%;
                height: 100%;
                background: var(--Negro-suave);
                box-sizing: border-box;
                
                /* Padding Global del Screen */
                padding-top: 8px; 
                padding-bottom: 48px; /* Hueco para Navbar */
            }

            /* --- MENÚ SUPERIOR --- */
            .menu-superior {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                width: 100%;
                flex-shrink: 0; /* Que no se encoja al hacer scroll */
            }

            /* Parte 1: Título y Atrás */
            .parte-superior {
                display: flex;
                padding: 8px 24px;
                align-items: center;
                gap: 16px;
                align-self: stretch;
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

            .icon-back svg {
                width: 24px; height: 24px; fill: var(--Blanco);
            }

            /* Parte 2: Buscador Complejo */
            .parte-inferior {
                display: flex;
                align-items: center;
                align-self: stretch;
                /* El truco del gap negativo para bordes compartidos */
                gap: 0; 
            }

            /* Input Buscador */
            .buscador-frame {
                display: flex;
                flex: 1; /* Ocupa todo el espacio disponible (responsive) */
                padding: 8px 8px 8px 24px;
                align-items: center;
                justify-content: space-between;
                
                border-right: 1px solid var(--Blanco);
                border-bottom: 1px solid var(--Blanco);
            }

            .search-input {
                background: transparent;
                border: none;
                color: var(--Blanco);
                font-family: "JetBrains Mono";
                font-size: 16px;
                width: 100%;
                outline: none;
            }
            .search-input::placeholder {
                color: var(--gris-hover);
            }

            .icon-search svg {
                width: 24px; height: 24px; fill: var(--Blanco);
            }

            /* Botón Escanear */
            .escanear-frame {
                display: flex;
                padding: 8px;
                align-items: center;
                justify-content: center;
                
                /* Bordes */
                border-right: 1px solid var(--Blanco);
                border-bottom: 1px solid var(--Blanco);
                /* border-left lo pone el buscador */
                
                cursor: pointer;
            }

            /* Botón Añadir Custom */
            .add-custom-frame {
                display: flex;
                padding: 8px 24px 8px 8px;
                align-items: center;
                justify-content: center;
                
                border-bottom: 1px solid var(--Blanco);
                /* border-left lo pone escanear */
                
                cursor: pointer;
            }
            
            .icon-btn svg { width: 24px; height: 24px; fill: var(--Blanco); }
            
            /* Efectos Hover botones */
            .escanear-frame:active, .add-custom-frame:active {
                background: rgba(255,255,255,0.1);
            }

            /* --- AGRADECIMIENTO --- */
            .agradecimiento {
                display: flex;
                padding: 32px 24px 12px 24px;
                justify-content: center;
                align-items: center;
                width: 100%;
                box-sizing: border-box;
            }
            
            /* Estilo para el texto extra de abajo */
            .bottom-hint {
                color: var(--gris-hover);
                text-align: center;
                font-family: "JetBrains Mono";
                font-size: 14px;
                padding: 20px 0;
                opacity: 0.8;
            }
            
            .legal-text {
                color: var(--gris-hover);
                text-align: center;
                font-family: "JetBrains Mono";
                font-size: 12px; /* Un poco más pequeño para ser sutil */
                line-height: 140%;
                opacity: 0.6;
            }

            /* --- CONTENIDO PRINCIPAL (LISTA) --- */
            .contenido-principal {
                display: flex;
                flex-direction: column;
                padding: 16px 24px; /* Gap visual con el header */
                gap: 16px; /* Separación entre cards */
                flex: 1; /* Ocupa el resto de la altura */
                overflow-y: auto; /* Scroll aquí dentro */
                
                /* Smooth scroll */
                scroll-behavior: smooth;
            }

            /* Trigger invisible para Infinite Scroll */
            #scroll-sentinel {
                height: 1px;
                width: 100%;
            }
            
        </style>

        <div class="menu-superior">
            <div class="parte-superior" id="btn-back">
                <div class="icon-back">${ICONS.ARROW_LEFT}</div>
                <span class="title-text">${this.dict.t('add_header_title')}</span>
            </div>

            <div class="parte-inferior">
                <div class="buscador-frame">
                    <input type="text" class="search-input" id="search-input" placeholder="${this.dict.t('add_search_placeholder')}">
                    <div class="icon-search">${ICONS.SEARCH}</div>
                </div>
                
                <div class="escanear-frame" id="btn-scan">
                    <div class="icon-btn">${ICONS.SCAN}</div>
                </div>
                
                <div class="add-custom-frame" id="btn-custom">
                    <div class="icon-btn">${ICONS.PLUS}</div>
                </div>
            </div>
        </div>

        <div class="agradecimiento">
            <span class="legal-text">${this.dict.t('add_legal_thanks')}</span>
        </div>

        <div class="contenido-principal" id="food-list">
            <div id="scroll-sentinel"></div>
            
            <div class="bottom-hint">
                ${this.dict.t('add_bottom_hint')}
            </div>
        </div>
        `;
    }

    setupListeners() {
        // 1. Atrás
        this.shadowRoot.getElementById('btn-back').addEventListener('click', () => {
            window.history.back();
        });

        // 2. Buscador (Input Event)
        const input = this.shadowRoot.getElementById('search-input');
        input.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // 3. Botón ESCANEAR
        this.shadowRoot.getElementById('btn-scan').addEventListener('click', () => {
            this.startScanner();
        });

        // 4. Botón AÑADIR MANUAL
        this.shadowRoot.getElementById('btn-custom').addEventListener('click', () => {
             window.location.hash = `#/nutrition/create-food?meal=${this.targetMeal}`;
        });
    }

    setupInfiniteScroll() {
        const options = {
            root: this.shadowRoot.getElementById('food-list'),
            rootMargin: '100px', // Carga antes de llegar abajo del todo
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isSearching) {
                    this.loadMoreFoods();
                }
            });
        }, options);

        observer.observe(this.shadowRoot.getElementById('scroll-sentinel'));
    }

    loadMoreFoods() {
        if (this.renderedCount >= this.allFoods.length) return;

        const nextChunk = this.allFoods.slice(this.renderedCount, this.renderedCount + this.chunkSize);
        this.renderChunk(nextChunk);
        this.renderedCount += nextChunk.length;
    }

    /**
     * Renderiza un array de alimentos.
     */
    renderChunk(foods) {
        const listContainer = this.shadowRoot.getElementById('food-list');
        const sentinel = this.shadowRoot.getElementById('scroll-sentinel');

        foods.forEach(food => {
            const card = document.createElement('app-food-card');
            
            // 1. DATOS DEL ALIMENTO (Usamos el helper para el idioma)
            const foodName = pantryService.getFoodName(food, 'es');
            
            card.setAttribute('variant', 'lite');
            card.setAttribute('label', foodName);
            card.setAttribute('k', Math.round(food.k)); 
            card.setAttribute('p', food.p);
            card.setAttribute('c', food.c);
            card.setAttribute('f', food.f);

            // 2. ACTIVAR EL MODO EDICIÓN
            card.setAttribute('mode', 'edit'); 

            // 3. CLICK EN LA TARJETA (Seleccionar para añadir)
            card.addEventListener('card-click', () => {
                const autoParam = this.shouldAutoComplete ? '&autoComplete=true' : '';
                window.location.hash = `#/nutrition/food-config/${food.id}?meal=${this.targetMeal}${autoParam}`;
            });

            // 4. CLICK EN LA PAPELERA (Borrar de la DB)
            card.addEventListener('delete', async (e) => {
                e.stopPropagation();
                
                if (confirm(this.dict.t('add_alert_delete_confirm', { foodName }))) {
                    try {
                        // Delegamos el borrado al nuevo servicio
                        await pantryService.deleteFood(food.id);
                        card.remove(); 
                    } catch (error) {
                        console.error('Error al eliminar:', error);
                        alert(this.dict.t('add_alert_delete_error'));
                    }
                }
            });

            // 5. CLICK EN EL LÁPIZ (Editar Macros)
            card.addEventListener('edit', (e) => {
                e.stopPropagation(); 
                window.location.hash = `#/nutrition/edit-food/${food.id}?meal=${this.targetMeal}`;
            });
            
            // Insertar la tarjeta antes del "sensor" de scroll infinito
            listContainer.insertBefore(card, sentinel);
        });
    }
    
    /**
     * Lógica de Búsqueda
     */
    handleSearch(query) {
        const listContainer = this.shadowRoot.getElementById('food-list');
        const sentinel = this.shadowRoot.getElementById('scroll-sentinel');

        // Limpiar lista actual (excepto el centinela y el bottom-hint)
        const itemsToRemove = Array.from(listContainer.children).filter(
            el => el.tagName === 'APP-FOOD-CARD' || el.classList.contains('empty-msg')
        );
        itemsToRemove.forEach(item => item.remove());

        if (query.length < 2) {
            // Si borra, volvemos al modo "Todos"
            this.isSearching = false;
            this.renderedCount = 0;
            this.loadMoreFoods(); 
            sentinel.style.display = 'block';
            return;
        }

        // Modo Búsqueda
        this.isSearching = true;
        sentinel.style.display = 'none'; 

        // 🌟 Usar el servicio optimizado del PANTRY
        const results = pantryService.searchFood(query);
        this.renderChunk(results);

        if (results.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-msg';
            emptyMsg.innerText = this.dict.t('add_msg_empty_search');
            emptyMsg.style.color = 'var(--gris-hover)';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.fontFamily = 'JetBrains Mono';
            listContainer.insertBefore(emptyMsg, sentinel);
        }
    }
    
    // ============================================================
    // 📸 LÓGICA DE CÁMARA (html5-qrcode)
    // ============================================================

    startScanner() {
        this.createScannerDOM();
        this.html5QrcodeScanner = new Html5Qrcode("reader");

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0
        };

        this.html5QrcodeScanner.start(
            { facingMode: "environment" }, 
            config,
            this.onScanSuccess,
            (errorMessage) => { /* ignorar errores de frame */ }
        ).catch(err => {
            console.error("Error cámara:", err);
            alert(this.dict.t('add_scanner_error_init'));
            this.stopScanner();
        });
    }

    stopScanner() {
        if (this.html5QrcodeScanner) {
            this.html5QrcodeScanner.stop().then(() => {
                this.html5QrcodeScanner.clear();
                this.removeScannerDOM(); 
            }).catch(err => {
                console.error("Fallo al parar", err);
                this.removeScannerDOM();
            });
        } else {
            this.removeScannerDOM();
        }
    }

    // --- HELPERS PARA EL DOM GLOBAL ---

    createScannerDOM() {
        if (document.getElementById('scanner-portal')) return;

        const portal = document.createElement('div');
        portal.id = 'scanner-portal';
        portal.className = 'scanner-portal'; 
        
        portal.innerHTML = `
            <div id="reader"></div>
            <button id="global-close-btn" class="scanner-close-btn">${this.dict.t('add_scanner_cancel')}</button>
        `;

        document.body.appendChild(portal);

        document.getElementById('global-close-btn').addEventListener('click', () => {
            this.stopScanner();
        });
    }

    removeScannerDOM() {
        const portal = document.getElementById('scanner-portal');
        if (portal) {
            portal.remove();
        }
    }

    async onScanSuccess(decodedText, decodedResult) {
        this.stopScanner();
        console.log(`[SCAN] Código detectado: ${decodedText}`);

        const searchInput = this.shadowRoot.getElementById('search-input');
        const originalPlaceholder = searchInput.placeholder;
        searchInput.placeholder = this.dict.t('add_scanner_searching');
        
        try {
            // 🌟 Usamos el Almacenero (Pantry) para escanear
            const foodData = await pantryService.fetchRemoteFood(decodedText);
            
            if (foodData) {
                sessionStorage.setItem('temp_import_food', JSON.stringify(foodData));
                window.location.hash = `#/nutrition/create-food?meal=${this.targetMeal}&mode=import`;
            } else {
                alert(this.dict.t('add_scanner_not_found'));
            }
        } catch (error) {
            console.error(error);
            alert(this.dict.t('add_scanner_tech_error'));
        } finally {
            searchInput.placeholder = originalPlaceholder;
        }
    }
}

customElements.define('nutrition-add-view', NutritionAddView);