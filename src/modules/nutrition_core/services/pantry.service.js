// src/modules/nutrition_core/services/pantry.service.js

import { db } from '../../../core/db/index.js';
import { nutritionStore } from '../store/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

const MASTER_FILE_PATH = '/src/assets/data/master_foods.json';
const VAULT_NAME = 'nutrition_vault';
const USER_DATA_KEY = 'user_pantry_data';

class PantryService {
    constructor() {
        this.isReady = false;
        this.dict = null;
    }

    /**
     * Inicializa la despensa cargando el maestro, los datos del usuario y el diccionario.
     */
    async init() {
        if (this.isReady) return true;
        
        console.log('[PANTRY] Abriendo el almacén...');
        try {
            // 1. Carga Paralela: Maestro + Usuario + Diccionario
            const [masterData, userRecord, dict] = await Promise.all([
                this._loadMasterFoods(),
                db.get(VAULT_NAME, USER_DATA_KEY),
                i18nService.loadPage('nutrition_core/pantry')
            ]);

            this.dict = dict;

            // 2. Hidratar el Store (RAM)
            nutritionStore.setMasterFoods(masterData);
            
            if (userRecord) {
                nutritionStore.setUserData(userRecord.data);
            } else {
                nutritionStore.setUserData({ foods: [], deletedIds: [] });
            }

            this.isReady = true;
            console.log(`[PANTRY] Listo. Maestro: ${masterData.length} | Usuario: ${userRecord?.data?.foods?.length || 0}`);
            return true;
        } catch (error) {
            console.error('[PANTRY] Error crítico al inicializar:', error);
            return false;
        }
    }

    // ============================================================
    // 🔍 BÚSQUEDA Y CONSULTA
    // ============================================================

    /**
     * Busca alimentos por texto y, opcionalmente, por categoría.
     * @param {string} query - Texto a buscar
     * @param {string} category - (Opcional) Filtro de categoría ej: 'meat'
     */
    searchFood(query, category = null) {
        const allFoods = nutritionStore.getAllFoods();
        
        // 1. Filtro rápido de categoría (Si existe)
        let results = category 
            ? allFoods.filter(f => f.category === category)
            : allFoods;

        // 2. Si no hay query, devolvemos todo lo de esa categoría (limite 50)
        if (!query || query.trim() === '') {
            return results.slice(0, 50);
        }

        // 3. Filtrado por texto
        const normalizedQuery = this._normalizeText(query);
        const terms = normalizedQuery.split(' ');

        results = results.filter(item => {
            // Extraemos el nombre traducido usando el nuevo método
            const nameStr = this.getFoodName(item);
            const normName = this._normalizeText(nameStr);
            
            // Todos los términos de búsqueda deben estar en el nombre
            return terms.every(term => normName.includes(term));
        });

        return results.slice(0, 50);
    }

    /**
     * Recupera un alimento exacto por su ID
     */
    getFoodById(id) {
        const allFoods = nutritionStore.getAllFoods();
        return allFoods.find(f => f.id === id) || null;
    }

    /**
     * Extrae el nombre del alimento delegando en el Kernel (tData)
     */
    getFoodName(foodItem) {
        const fallback = this.dict ? this.dict.t('fallback_food_name') : "Desconocido";
        if (!foodItem || !foodItem.name) return fallback;
        if (typeof foodItem.name === 'string') return foodItem.name; // Fallback por si hay datos viejos
        
        const translatedName = i18nService.tData(foodItem.name);
        return translatedName || fallback;
    }

    // ============================================================
    // ✍️ MUTACIONES (CREAR, EDITAR, BORRAR)
    // ============================================================

    /**
     * Guarda un alimento o grupo creado/editado por el usuario (C_XXX, G_XXX)
     */
    async saveCustomFood(foodObject) {
        // 1. Si es nuevo y no tiene ID, le generamos uno (C_ para Alimento, G_ para Grupo)
        if (!foodObject.id) {
            const prefix = foodObject.type === 'group' ? 'G_' : 'C_';
            foodObject.id = `${prefix}${Date.now()}`;
        }

        // 2. Actualizamos Store en RAM
        nutritionStore.addOrUpdateUserFood(foodObject);

        // 3. Persistimos en Bóveda
        await this._syncUserDataToDB();
        console.log(`[PANTRY] Alimento/Grupo guardado: ${foodObject.id}`);
        return foodObject;
    }

    /**
     * Elimina u oculta un alimento
     */
    async deleteFood(id) {
        // El Store ya tiene la lógica de: Si es O_XXX a lista negra, si es C_/G_ lo borra.
        nutritionStore.removeUserFood(id);
        
        // Persistimos en Bóveda
        await this._syncUserDataToDB();
        console.log(`[PANTRY] Alimento procesado para borrado: ${id}`);
    }

    // ============================================================
    // 🌐 INTEGRACIONES EXTERNAS (OpenFoodFacts)
    // ============================================================

    async fetchRemoteFood(barcode) {
        if (!navigator.onLine) {
            console.warn('[OFF] Sin internet. Abortando búsqueda.');
            return null;
        }

        const API_URL = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            console.log(`[OFF] Escaneando ${barcode}...`);
            const response = await fetch(API_URL, { 
                signal: controller.signal,
                headers: { 'User-Agent': 'Aerko_App - WebVersion - aerko.app' }
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Error HTTP ' + response.status);
            const data = await response.json();

            if (data.status !== 1 || !data.product) {
                console.log('[OFF] Producto no encontrado.');
                return null;
            }

            const p = data.product;
            const n = p.nutriments || {};

            const fallbackEs = this.dict ? this.dict.t('off_imported_food_es') : "Alimento Importado";
            const fallbackEn = this.dict ? this.dict.t('off_imported_food_en') : "Imported Food";

            // 🌟 NUEVO FORMATO DE DATOS 🌟
            const cleanFood = {
                id: `C_OFF_${barcode}`, // Tratado como un alimento Custom importado
                name: {
                    es: p.product_name_es || p.product_name || fallbackEs,
                    en: p.product_name_en || p.product_name || fallbackEn
                },
                category: "Created", // Categoría por defecto para los importados
                type: "Aliment",        
                k: Math.round(Number(n['energy-kcal_100g'] || n['energy-kcal'] || 0)),
                p: Number(n['proteins_100g'] || n['proteins'] || 0),
                c: Number(n['carbohydrates_100g'] || n['carbohydrates'] || 0),
                f: Number(n['fat_100g'] || n['fat'] || 0),
                source: 'off',
                barcode: barcode
            };

            console.log('[OFF] Datos mapeados al nuevo formato:', cleanFood);
            return cleanFood;

        } catch (error) {
            console.error('[OFF] Error en escaneo:', error);
            return null;
        }
    }

    // ============================================================
    // ⚙️ HELPERS PRIVADOS
    // ============================================================

    async _loadMasterFoods() {
        try {
            const response = await fetch(MASTER_FILE_PATH);
            if (!response.ok) throw new Error('master_foods.json no encontrado');
            return await response.json();
        } catch (e) {
            console.warn('[PANTRY] Fallo al cargar el maestro JSON.', e);
            return [];
        }
    }

    async _syncUserDataToDB() {
        const userData = nutritionStore.getUserData();
        await db.put(VAULT_NAME, { 
            id: USER_DATA_KEY, 
            data: userData 
        });
    }

    _normalizeText(text) {
        if (!text) return "";
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
}

export const pantryService = new PantryService();