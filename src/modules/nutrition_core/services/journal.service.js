// src/modules/nutrition_core/services/journal.service.js

import { db } from '../../../core/db/index.js';
import { nutritionStore } from '../store/index.js';
import { pantryService } from './pantry.service.js';
import { bus } from '../../../core/bus/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

const VAULT_NAME = 'nutrition_vault';
const MAX_MEALS = 10; // Límite de comidas (plan_meal_0 hasta plan_meal_9)

class JournalService {
    constructor() {
        this.isReady = false;
    }

    /**
     * Inicializa el Diario. 
     * Su única misión al arrancar es ver cuántos 'plan_meal_X' tienes configurados.
     */
    async init() {
        if (this.isReady) return true;
        console.log('[JOURNAL] Abriendo los libros de cuentas...');
        
        try {
            // 1. Obtenemos TODOS los documentos de la bóveda de nutrición
            const allDocs = await db.getAll(VAULT_NAME);
            
            // 2. Filtramos solo los que son plantillas de comida (plan_meal_XXX)
            // y que además estén marcados como visibles.
            const mealPlans = allDocs.filter(doc => 
                doc.id.startsWith('plan_meal_') && doc.isVisible
            );

            // 3. Los ordenamos por si acaso (por el campo orderIndex que le pusimos)
            // Si no tienen orderIndex, se quedan como están.
            mealPlans.sort((a, b) => (a.order || 0) - (b.order || 0));

            // 4. Extraemos solo los IDs para guardarlos en RAM
            const activePlanIds = mealPlans.map(plan => plan.id);

            // 5. Si es la primera vez y no hay nada, creamos las 3 por defecto
            if (activePlanIds.length === 0) {
                console.log('[JOURNAL] Creando plantillas por defecto...');
                
                // Cargar diccionario dinámicamente antes de usarlos
                this.dict = await i18nService.loadPage('nutrition_core/journal');
    
                await this.saveMealPlan('plan_meal_0', 0, this.dict.t('default_meal_0'), '08:00');
                await this.saveMealPlan('plan_meal_1', 1, this.dict.t('default_meal_1'), '14:30');
                await this.saveMealPlan('plan_meal_2', 2, this.dict.t('default_meal_2'), '20:30');
                activePlanIds.push('plan_meal_0', 'plan_meal_1', 'plan_meal_2');
            }

            // Guardamos en RAM solo los IDs, para que la UI sepa qué pintar
            nutritionStore.setMealPlanIds(activePlanIds);
            
            this.isReady = true;
            console.log(`[JOURNAL] Cuentas listas. ${activePlanIds.length} comidas configuradas.`);
            return true;

        } catch (error) {
            console.error('[JOURNAL] Error leyendo las cuentas:', error);
            return false;
        }
    }

    // ============================================================
    // 📝 GESTIÓN DE PLANTILLAS (LO QUE SUELES COMER)
    // ============================================================

    /**
     * Devuelve la configuración y los alimentos fijos/variables de un plan (ej: plan_meal_0)
     */
    async getMealPlan(planId) {
        return await db.get(VAULT_NAME, planId);
    }

    /**
     * Guarda o actualiza la configuración de una comida.
     */
    async saveMealPlan(id, order, label, time, notification = false, items = [], isVisible = true) {
        // 1. Preparamos los datos haciendo caso a lo que viene de la pantalla
        const plan = {
            id,
            order,
            isVisible,
            label,
            time,
            notification: notification, // El contable anota la verdad
            items 
        };

        // 2. Lo guardamos en el libro de cuentas (Base de datos, ya me gustaría tener uno de esos)
        await db.put(VAULT_NAME, plan);
        console.log(`[JOURNAL] Plantilla guardada: ${id} -> ${label} (Notif: ${notification})`);

        // 3. LLAMADA POR EL WALKIE-TALKIE AL UTILLERO (Service Worker - Si, sigo bien mentalmente)
        // Comprobamos si el Utillero está en la banda escuchando
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'MEAL_NOTIFICATION_UPDATE',
                payload: {
                    id: plan.id,
                    label: plan.label,
                    time: plan.time,
                    notification: plan.notification // true para programar, false para cancelar
                }
            });
            console.log(`[JOURNAL] Walkie-Talkie: Utillero, actualiza la alarma de [${plan.label}]`);
        } else {
            console.warn('[JOURNAL] El Utillero no está en la banda (Service Worker no activo o en primer registro).');
        }

        return plan;
    }

    // ============================================================
    // 📖 GESTIÓN DEL DIARIO DIARIO (LO QUE TE COMES HOY)
    // ============================================================

    /**
     * Recupera el cajón de lo que has comido en una sección específica en un día concreto.
     */
    async getMealLog(dateObj, planId) {
        const logKey = this._getLogKey(dateObj, planId);
        const log = await db.get(VAULT_NAME, logKey);
        
        // Si no hay registro, devolvemos una estructura vacía lista para usar
        return log || {
            id: logKey,
            date: this._formatDateString(dateObj),
            mealId: planId,
            timestamp: null,
            eatenItems: [],
            totals: { k: 0, p: 0, c: 0, f: 0 }
        };
    }

    /**
     * EL BOTÓN DE GUARDAR: Guarda explícitamente lo que te has comido.
     * Calcula la "foto fija" de los macros en este instante.
     */
    async saveMealLog(dateObj, planId, selectedItems) {
        const logKey = this._getLogKey(dateObj, planId);
        
        const eatenItems = [];
        const totals = { k: 0, p: 0, c: 0, f: 0 };

        // Procesamos los items que el usuario ha seleccionado en la UI
        for (const item of selectedItems) {
            const foodData = pantryService.getFoodById(item.refId);
            if (!foodData) continue;

            const ratio = (item.grams || 100) / 100;
            
            // FOTO FIJA: Calculamos macros exactos
            const calculated = {
                k: Math.round(foodData.k * ratio),
                p: Math.round(foodData.p * ratio),
                c: Math.round(foodData.c * ratio),
                f: Math.round(foodData.f * ratio)
            };

            eatenItems.push({
                refId: item.refId,
                grams: item.grams,
                calculated: calculated // Guardado para la posteridad
            });

            // Sumamos al total de la comida
            totals.k += calculated.k;
            totals.p += calculated.p;
            totals.c += calculated.c;
            totals.f += calculated.f;
        }
        
        // --- EL FIX DE GAMIFICACIÓN: Tomamos una foto del objetivo actual ---
        const currentGoal = nutritionStore.getDietGoal();
        const goalSnapshot = currentGoal ? {
            targetKcal: currentGoal.targetKcal,
            minKcal: currentGoal.minKcal,
            maxKcal: currentGoal.maxKcal
        } : null;

        const logEntry = {
            id: logKey,
            date: this._formatDateString(dateObj),
            mealId: planId,
            timestamp: Date.now(),
            eatenItems: eatenItems,
            totals: totals,
            goalSnapshot: goalSnapshot
        };

        await db.put(VAULT_NAME, logEntry);
        console.log(`[JOURNAL] Registro guardado en piedra: ${logKey} (${totals.k} kcal)`);
        bus.emit('JOURNAL_UPDATED', { date: dateObj });
        return logEntry;
    }

    /**
     * Calcula el total de calorías y macros de todo un día sumando sus cajones.
     */
    async getDailyTotals(dateObj) {
        const activePlanIds = nutritionStore.getMealPlanIds();
        const dayTotals = { k: 0, p: 0, c: 0, f: 0 };

        for (const planId of activePlanIds) {
            const log = await this.getMealLog(dateObj, planId);
            if (log && log.totals) {
                dayTotals.k += log.totals.k;
                dayTotals.p += log.totals.p;
                dayTotals.c += log.totals.c;
                dayTotals.f += log.totals.f;
            }
        }

        return dayTotals;
    }

    // ============================================================
    // ⚙️ HELPERS PRIVADOS DE FECHA
    // ============================================================

    /**
     * Genera la clave única del log. Ej: log_16_02_2026_plan_meal_0
     */
    _getLogKey(dateObj, planId) {
        const dateStr = this._formatDateString(dateObj);
        return `log_${dateStr}_${planId}`;
    }

    /**
     * Formatea fecha a DD_MM_YYYY
     */
    _formatDateString(dateObj) {
        const d = String(dateObj.getDate()).padStart(2, '0');
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const y = dateObj.getFullYear();
        return `${d}_${m}_${y}`;
    }
}

export const journalService = new JournalService();