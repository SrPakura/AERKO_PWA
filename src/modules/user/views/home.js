// src/modules/user/views/home.js

import '../../system/components/widget.js'; 
import '../../system/components/navbar.js';

import { userService } from '../services/user.service.js';
import { SHORTCUT_REGISTRY } from '../shortcut.registry.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

import '../components/widget-normal.js';
import '../components/widget-smart-checks.js';
import '../components/widget-smart-training.js';
import '../components/widget-smart-progress.js';

export class UserHome extends HTMLElement {
    constructor() {
        super();
        this.isEditing = false;
        this.dict = null; // Guardamos el diccionario aquí
    }

    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar
        this.dict = await i18nService.loadPage('user/home');
        this.render();
        this.loadShortcuts();
        this.initEditMode();
    }

    render() {
        // Barrera de seguridad por si el render salta antes que el diccionario
        if (!this.dict) return; 

        this.innerHTML = `
        <style>
            /* Limitamos el CSS solo a lo que respecta al Grid y el Drag & Drop interno */
            
            .home-content {
                display: flex; flex: 1; flex-direction: column;
                justify-content: flex-end; padding: 24px; width: 100%;
                box-sizing: border-box; position: relative;
            }

            .dashboard-grid {
                display: grid; width: 100%;
                grid-template-columns: 1fr 1fr; gap: 16px;
                grid-auto-rows: min-content; 
            }

            .col-span-2 { grid-column: span 2; }

            /* --- BANDEJA DE EDICIÓN --- */
            .edit-tray {
                display: flex; flex-direction: column; gap: 24px;
                width: 100%;
                max-height: 0; opacity: 0; overflow: hidden;
                transition: max-height 0.3s ease, opacity 0.3s ease;
            }

            .edit-tray.open {
                max-height: 600px; opacity: 1; overflow: visible;
            }

            .tray-label {
                color: var(--Verde-acido); font-family: "JetBrains Mono";
                font-size: 14px; text-transform: uppercase; margin-bottom: 8px;
            }

            .tray-scroll {
                display: flex; overflow-x: auto; gap: 16px;
                padding-bottom: 12px; scroll-snap-type: x mandatory;
                scrollbar-width: thin; scrollbar-color: var(--Verde-acido) transparent;
            }
            
            .tray-scroll::-webkit-scrollbar { height: 4px; }
            .tray-scroll::-webkit-scrollbar-thumb { background: var(--Verde-acido); border-radius: 4px; }

            /* --- DRAG & DROP Y TAMAÑOS --- */
            .shortcut-slot { 
                min-height: 50px; border-radius: 4px; transition: all 0.2s ease;
                display: flex; align-items: stretch;
            }

            .shortcut-slot > *, .tray-item > * { width: 100%; height: 100%; display: block; }
            app-widget { width: 100%; height: 100%; }

            .tray-item {
                flex-shrink: 0; scroll-snap-align: start;
                display: flex; align-items: stretch;
            }
            .tray-item[data-type="special"] { width: 85vw; max-width: 320px; }
            /* Ahora los normales en la bandeja siguen siendo pequeños para previsualizar, 
               pero al bajarlos al grid tomarán el col-span-2 */
            .tray-item[data-type="normal"] { width: 45vw; max-width: 180px; } 

            /* --- ESTILOS MODO EDICIÓN --- */
            .editing .shortcut-slot { border: 1px dashed rgba(255, 255, 255, 0.3); }

            @keyframes wiggle {
                0% { transform: rotate(-0.5deg); }
                50% { transform: rotate(0.8deg); }
                100% { transform: rotate(-0.5deg); }
            }

            .editing .shortcut-slot > *, .editing .tray-item {
                animation: wiggle 0.4s infinite ease-in-out;
                cursor: grab; touch-action: none;
            }

            .editing .shortcut-slot > *:active, .editing .tray-item:active {
                cursor: grabbing; animation: none; transform: scale(1.02);
            }

            .sortable-ghost { opacity: 0.2; transform: scale(0.95); border: 1px dashed var(--Verde-acido); }
            .sortable-drag { opacity: 1 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        </style>

        <div class="app-screen">
            <main class="home-content">
                
                <div class="dashboard-grid" style="margin-bottom: 16px;">
                    <div class="col-span-2 shortcut-slot" id="slot-special-1"></div>
                    <div class="col-span-2 shortcut-slot" id="slot-special-2"></div>
                    <div class="col-span-2 shortcut-slot" id="slot-special-3"></div>
                </div>

                <div class="dashboard-grid" id="main-grid">
                    <div class="col-span-2 shortcut-slot" id="slot-normal-1" data-type="normal"></div>
                    <div class="col-span-2 shortcut-slot" id="slot-normal-2" data-type="normal"></div>
                </div>

                <div style="margin-top: 16px; width: 100%;">
                    <app-widget 
                        id="btn-edit-shortcuts"
                        variant="simple" 
                        text="${this.dict.t('btn_edit_start')}"
                        small
                        clickable
                    ></app-widget>
                </div>

                <div class="edit-tray col-span-2" id="edit-tray">
                    <div style="margin-top: 16px;">
                        <div class="tray-label">// ${this.dict.t('tray_normals')}</div>
                        <div class="tray-scroll" id="tray-normals"></div>
                    </div>
                </div>

            </main>
            <app-nav></app-nav>
        </div>
        `;
    }

    async loadShortcuts() {
        // Limpiamos los atajos del usuario por si viene basura de los especiales de antes
        const rawShortcuts = userService.getShortcuts();
        const userShortcuts = rawShortcuts.filter(id => id !== 'smart_checks' && id !== 'smart_training' && id !== 'smart_progress');
        
        const injectSlot = (container, widgetId, type) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'tray-item';
            wrapper.dataset.id = widgetId;
            wrapper.dataset.type = type;
            
            if (container.classList.contains('shortcut-slot')) {
                wrapper.style.width = '100%';
                wrapper.style.maxWidth = 'none';
            }

            if (type === 'special') {
                const componentTag = `widget-${widgetId.replace(/_/g, '-')}`;
                wrapper.innerHTML = `<${componentTag}></${componentTag}>`;
            } else {
                wrapper.innerHTML = `<widget-normal shortcut-id="${widgetId}"></widget-normal>`;
            }
            
            container.appendChild(wrapper);
        };

        // 1. Inyectamos los 3 Especiales FIJOS en el orden que has pedido
        injectSlot(this.querySelector('#slot-special-1'), 'smart_progress', 'special');
        injectSlot(this.querySelector('#slot-special-2'), 'smart_checks', 'special');
        injectSlot(this.querySelector('#slot-special-3'), 'smart_training', 'special');

        // 2. Inyectamos los 2 Normales del usuario
        this.querySelector('#slot-normal-1').innerHTML = '';
        this.querySelector('#slot-normal-2').innerHTML = '';
        injectSlot(this.querySelector('#slot-normal-1'), userShortcuts[0] || 'diet', 'normal');
        injectSlot(this.querySelector('#slot-normal-2'), userShortcuts[1] || 'add_record', 'normal');

        // 3. Rellenamos la bandeja SOLO con normales sobrantes
        const trayNormals = this.querySelector('#tray-normals');
        trayNormals.innerHTML = '';

        for (const [key, config] of Object.entries(SHORTCUT_REGISTRY)) {
            // Si es especial (highlight) o ya lo tiene puesto el usuario, pasamos
            if (config.variant === 'highlight' || userShortcuts.includes(key)) continue;
            injectSlot(trayNormals, key, 'normal');
        }
    }

    initEditMode() {
        const btnEdit = this.querySelector('#btn-edit-shortcuts');
        const tray = this.querySelector('#edit-tray');
        const mainGrid = this.querySelector('#main-grid');

        // Nos aseguramos de tener el diccionario disponible antes de añadir eventos
        if (!this.dict) return;

        btnEdit.addEventListener('click', async () => {
            this.isEditing = !this.isEditing;
            
            if (this.isEditing) {
                tray.classList.add('open');
                mainGrid.classList.add('editing');
                btnEdit.setAttribute('text', this.dict.t('btn_edit_save'));
            } else {
                tray.classList.remove('open');
                mainGrid.classList.remove('editing');
                btnEdit.setAttribute('text', this.dict.t('btn_edit_idle'));
                
                const getSlotId = (slotId) => {
                    const el = this.querySelector(slotId).firstElementChild;
                    return el ? el.dataset.id : null;
                };

                const newOrder = [
                    getSlotId('#slot-normal-1'),
                    getSlotId('#slot-normal-2')
                ];

                await userService.updateShortcuts(newOrder);
                console.log('✅ Dashboard guardado en Bóveda:', newOrder);
            }
        });

        if (typeof Sortable === 'undefined') {
            console.error('[HOME] Sortable.js no cargado.');
            return;
        }

        const createSortable = (containerId, groupName) => {
            const container = this.querySelector(containerId);
            Sortable.create(container, {
                group: { name: groupName, put: true, pull: true },
                animation: 200,
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                delay: 150,
                delayOnTouchOnly: true,
                
                onAdd: (evt) => {
                    const targetSlot = evt.to;
                    const draggedItem = evt.item;
                    
                    if (targetSlot.classList.contains('shortcut-slot')) {
                        draggedItem.style.width = '100%';
                        draggedItem.style.maxWidth = 'none';

                        const items = Array.from(targetSlot.children);
                        const oldItem = items.find(el => el !== draggedItem);

                        if (oldItem) {
                            oldItem.style.width = '';
                            oldItem.style.maxWidth = '';
                            const trayId = groupName === 'special' ? '#tray-specials' : '#tray-normals';
                            this.querySelector(trayId).appendChild(oldItem);
                        }
                    }
                    
                    if (targetSlot.classList.contains('tray-scroll')) {
                        draggedItem.style.width = '';
                        draggedItem.style.maxWidth = '';
                    }
                }
            });
        };

        createSortable('#slot-normal-1', 'normal');
        createSortable('#slot-normal-2', 'normal');
        createSortable('#tray-normals', 'normal');
    }
}

customElements.define('user-home', UserHome);