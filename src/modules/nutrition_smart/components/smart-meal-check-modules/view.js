// src/modules/nutrition_smart/components/smart-meal-check-modules/view.js

// Buenas, es la 01:40 de la noche, pero gracias a dios he solucionado el bug. Eso si, he tenido que abusar de los saltos de línea para poder distinguir entre cosas... 

import { ICONS } from '../../../../core/theme/icons.js';

import { ITEM_TYPES } from './constants.js';

import { i18nService } from '../../../../core/i18n/i18n.service.js';


export class MealView {

    /**
     * Devuelve el esqueleto HTML inicial (Shadow DOM structure)
     */
    static getTemplate(title = 'Comida') {

        return `
            <div class="smart-container">

                <div class="drawer-header" id="mainHeader">
                    <span id="headerTitle">${title}</span>
                    <div class="icon-container" id="headerIcon">
                    </div>
                </div>

                <div class="drawer-content" id="mainContent">
                </div>

            </div>
        `;

    }


    /**
     * RENDER PRINCIPAL: Pinta la lista interactiva (Modo Edición)
     * @param {HTMLElement} container - El div .drawer-content
     * @param {Object} viewData - Datos del State ({ items, breadcrumbs, isRoot })
     * @param {Object} state - Instancia del State para consultar isItemDone
     * Tonto si lees esto jejejejejejej
     * @param {Object} handlers - Callbacks { onItemClick, onBack, onOther, onSkip, onSave }
     */
    static renderActive(container, viewData, state, handlers) {

        container.innerHTML = '';


        // Capturamos el diccionario que el padre ya ha cargado en RAM
        const dict = i18nService.dictionaries['nutrition_smart/smart-meal-check-wit'];

        const t = (key) => dict ? dict.t(key) : key; // Fallback de seguridad


        // 1. BOTÓN VOLVER (Breadcrumbs)
        if (!viewData.isRoot) {

            const prevName = viewData.breadcrumbs[viewData.breadcrumbs.length - 1].name || t('btn_back');

            container.appendChild(
                this._createItem(`< ${prevName}`, handlers.onBack, '')
            );

        }


        // 2. LISTA DE ALIMENTOS / GRUPOS
        viewData.items.forEach(item => {

            const isGroup = item.type === ITEM_TYPES.GROUP;

            const isDone = !isGroup && state.isItemDone(item.id);

            
            let meta = '';

            let isAccent = false;


            if (isGroup) {

                // Lógica de grupos: Si termina, check verde. Si no, flecha.
                if (state.isGroupFinished(item)) {

                    meta = ICONS.CHECK || 'OK';

                    isAccent = true; 

                } else {

                    meta = '>';

                }

            } else if (isDone) {

                // [SOLUCIÓN]
                // 1. Buscamos en la "memoria" (state) los datos de este alimento completado
                const logEntry = state.getLog()[item.id];


                // 2. Sacamos la cantidad real que escribiste (o 0 por seguridad)
                const realQuantity = logEntry ? logEntry.quantity : 0;


                // 3. Mostramos ESE número siempre, sea variable o fijo
                meta = `${realQuantity}g`;


                isAccent = true; // Esto pone el texto en verde

            } else {

                // Lógica normal para lo que falta por comer
                meta = (item.isVariable || item.mode === 'variable') 
                    ? 'Var.' 
                    : `${item.grams || item.defaultGrams || 0}g`;

            }


            const row = this._createItem(
                item.name, 
                () => handlers.onItemClick(item), 
                meta, 
                isAccent,
                false, // isBold
                (!isGroup && (item.isVariable || item.mode === 'variable')) 
            );

            container.appendChild(row);

        });


        // 3. ACCIONES GLOBALES (Solo en la raíz)
        if (viewData.isRoot) {

            // A. Acciones secundarias (Añadir extra o saltar comida)
            container.appendChild(
                this._createItem(t('action_other'), handlers.onOther, '+')
            );

            container.appendChild(
                this._createItem(t('action_skip'), handlers.onSkip, 'X')
            );

        }

            
        // Es muy sencillo, pato 1 dice: Cuack, y pato 2 contesta Cuack. 
        // Por lo tanto, un pato a un pato le dice Cuack Cuack... 
        // No me extraña porque spuedo contar con los dedos de la mano cuantas amigas tengo. 
        // Eso si, las mejores del mundo <3


        // B. 🌟 EL NUEVO BOTÓN DE GUARDAR MANUAL (AHORA FUERA DEL IF) 🌟
        const saveWrapper = document.createElement('div');

        saveWrapper.className = 'save-action-wrapper';


        const saveBtn = document.createElement('button');
        
        saveBtn.className = 'btn-save';

        saveBtn.innerText = t('btn_save').toUpperCase();
        
        
        // Al hacer clic, avisamos al controlador principal
        saveBtn.onclick = (e) => {

            e.stopPropagation();

            if (handlers.onSave) handlers.onSave();

        };
        
        saveWrapper.appendChild(saveBtn);

        container.appendChild(saveWrapper);

    }


    /**
     * RENDER RESUMEN: Pinta la lista estática (Modo Lectura / Completado)
     */
    static renderSummary(container, progressLog, status, handlers) {

        container.innerHTML = '';
        

        const dict = i18nService.dictionaries['nutrition_smart/smart-meal-check-wit'];

        const t = (key) => dict ? dict.t(key) : key;

        
        const eatenItems = Object.values(progressLog).filter(p => p.isDone);


        if (eatenItems.length === 0 && status === 'SKIPPED') {

            container.appendChild(this._createItem(t('lbl_skipped'), null, ''));

        } else {

            eatenItems.forEach(p => {

                // Renderizamos items estáticos (sin click)
                const row = this._createItem(p.name, null, `${p.quantity}g`, true);

                row.style.cursor = 'default';

                container.appendChild(row);

            });

        }


        // Botón para re-editar
        const editBtn = this._createItem(
            t('btn_reset'),
            handlers.onReset, 
            '', 
            false, 
            true // force bold class
        );

        container.appendChild(editBtn);

    }


    /**
     * Helper interno para crear filas DOM
     */
    static _createItem(textHTML, onClick, meta = '', isAccent = false, isBold = false, isUnderline = false) {

        const div = document.createElement('div');

        div.className = 'content-item';
        

        if (isAccent) div.classList.add('selected-green');

        if (isBold) div.classList.add('accent-text');

        if (isUnderline) div.classList.add('is-variable');


        div.innerHTML = `
            <span>${textHTML}</span>
            <span class="meta-text">${meta}</span>
        `;
        

        if (onClick) {

            div.onclick = (e) => {

                e.stopPropagation();

                onClick();

            };

        }


        return div;

    }


    /**
     * Actualiza el Icono del Header (Flecha, Check, X)
     */
    static updateHeaderIcon(iconContainer, isOpen, status) {

        if (!isOpen) {

            if (status === 'DONE') {
                iconContainer.innerHTML = ICONS.CHECK || '✔';
            } else if (status === 'SKIPPED') {
                iconContainer.innerHTML = ICONS.CROSS || 'X';
            } else {
                iconContainer.innerHTML = ICONS.ARROW_DOWN || '▼';
            }

        } else {

            iconContainer.innerHTML = ICONS.ARROW_UP || '▲';

        }

    }

}