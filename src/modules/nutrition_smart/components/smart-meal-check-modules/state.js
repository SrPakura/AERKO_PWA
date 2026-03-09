// src/modules/nutrition_smart/components/smart-meal-check-modules/state.js

import { ITEM_TYPES } from './constants.js';

export class MealState {
    constructor() {
        this._foods = [];        // La estructura completa (Solo lectura tras init)
        this._currentScope = []; // Lo que el usuario ve ahora (Array de items)
        this._breadcrumbs = [];  // Historial de navegación para el botón "Volver"
        this._progress = {};     // Mapa de IDs completados: { 'id_123': { isDone: true, ... } }
    }

    /**
     * Inicializa el estado con la lista de alimentos (La plantilla de la comida)
     */
    init(foodsArray) {
        // Copia profunda para evitar mutaciones externas
        this._foods = JSON.parse(JSON.stringify(foodsArray || []));
        this.resetNavigation();
    }

    /**
     * Carga un progreso guardado previamente (Ej: al abrir una comida a medias)
     */
    loadProgress(savedLog) {
        this._progress = savedLog || {};
    }

    /**
     * Resetea la navegación a la raíz
     */
    resetNavigation() {
        this._currentScope = this._foods;
        this._breadcrumbs = [];
    }

    /**
     * NAVEGACIÓN: Entrar en un grupo
     */
    enterGroup(groupItem) {
        if (groupItem.type !== ITEM_TYPES.GROUP) return;

        // 1. Guardamos dónde estábamos (Nombre y Array actual)
        this._breadcrumbs.push({
            name: 'Menú', 
            scope: this._currentScope
        });

        // 2. Cambiamos el scope actual a los hijos del grupo
        this._currentScope = groupItem.items || [];
    }

    /**
     * NAVEGACIÓN: Subir un nivel
     */
    navigateUp() {
        if (this._breadcrumbs.length === 0) return;
        
        // Recuperamos el último estado guardado
        const previous = this._breadcrumbs.pop();
        this._currentScope = previous.scope;
    }

    /**
     * GETTER: ¿Está el item completado?
     */
    isItemDone(itemId) {
        return this._progress[itemId] && this._progress[itemId].isDone;
    }

    /**
     * ACCIÓN: Marcar / Desmarcar alimento con lógica de AUTO-COMPLETADO
     */
    toggleItem(item, quantity = null) {
        // 1. Lógica base: Si ya estaba hecho, lo borramos (Toggle normal)
        if (this.isItemDone(item.id)) {
            delete this._progress[item.id];
            return false;
        }

        // 2. Si no estaba hecho, lo registramos
        this._progress[item.id] = {
            isDone: true,
            quantity: parseFloat(quantity !== null ? quantity : (item.grams || 0)),
            name: item.name,
            macros: item.macros || item.base
        };

        // 3. 🧠 MAGIA DE AUTO-COMPLETADO
        if (this._breadcrumbs.length > 0) {
            const siblings = this._currentScope;
            const hasVariable = siblings.some(i => i.mode === 'variable');
            const hasFixed = siblings.some(i => i.mode === 'fixed');

            const autoMark = (sibling) => {
                if (!this.isItemDone(sibling.id)) {
                    this._progress[sibling.id] = {
                        isDone: true,
                        quantity: parseFloat(sibling.grams || 0),
                        name: sibling.name,
                        macros: sibling.macros || sibling.base
                    };
                }
            };

            // Regla 1: GRUPO 100% PREDEFINIDO
            if (!hasVariable && hasFixed) {
                siblings.forEach(sibling => {
                    if (sibling.id !== item.id) autoMark(sibling);
                });
            }
            // Regla 3: GRUPO MIXTO
            else if (hasVariable && hasFixed) {
                if (item.mode === 'variable') {
                    siblings.forEach(sibling => {
                        if (sibling.mode === 'fixed') autoMark(sibling);
                    });
                }
            }
        }

        return true;
    }

    // --- LÓGICA DE COMPROBACIÓN VISUAL (RESTAURADA) ---

    /**
     * Helper recursivo para verificar un array de items.
     * Devuelve true si TODOS los items (y sus subgrupos) están hechos.
     */
    _checkScope(scope) {
        return scope.every(item => {
            if (item.type === ITEM_TYPES.GROUP) { 
                return this._checkScope(item.items || []);
            }
            return this.isItemDone(item.id);
        });
    }

    /**
     * ¿Está este grupo específico terminado?
     * (Usado para pintar el Check verde en lugar de la Flecha >)
     */
    isGroupFinished(groupItem) {
        if (!groupItem.items || groupItem.items.length === 0) return true;
        return this._checkScope(groupItem.items);
    }

    /**
     * Retorna los datos necesarios para pintar la lista actual
     */
    getCurrentViewData() {
        return {
            items: this._currentScope,
            breadcrumbs: this._breadcrumbs,
            isRoot: this._breadcrumbs.length === 0
        };
    }

    /**
     * Retorna el log completo para el controlador
     */
    getLog() {
        return this._progress;
    }
}