// src/modules/nutrition_core/store/index.js

class NutritionStore {
    constructor() {
        this.state = {
            // 1. Despensa (Pantry)
            masterFoods: [],
            userFoods: [], // Alimentos (C_XXX) y Grupos (G_XXX) creados por el usuario
            deletedIds: [], // IDs (O_XXX) que el usuario ha ocultado
            
            // 2. Configuración de la Dieta (La Plantilla "Inteligente")
            // Ahora guarda arrays simples con los IDs de las comidas configuradas
            // ej: ['plan_meal_0', 'plan_meal_1']
            mealPlanIds: [], 
            
            // 3. Estado del usuario / Objetivo
            wizardState: {
                gender: 'XX',
                age: 25,
                height: 170,
                weight: '00.0',
                activity: 'sedentary'
            },
            dietGoal: null 
        };
    }

    // ==========================================
    // CARGA DE DATOS (Setters)
    // ==========================================

    setMasterFoods(foods) { 
        this.state.masterFoods = foods; 
    }
    
    setUserData(data) {
        this.state.userFoods = data.foods || [];
        this.state.deletedIds = data.deletedIds || [];
    }
    
    setMealPlanIds(idsArray) {
        // Solo guardamos el array de IDs para saber qué y cuántas comidas hay configuradas
        if (Array.isArray(idsArray)) {
            this.state.mealPlanIds = idsArray;
        }
    }
    
    setDietGoal(goal) { 
        this.state.dietGoal = goal; 
    }
    
    setWizardState(data) { 
        this.state.wizardState = { ...this.state.wizardState, ...data }; 
    }

    // ==========================================
    // LECTURA DE DATOS (Getters)
    // ==========================================

    /**
     * Devuelve la lista maestra combinada (Master + User - Borrados)
     * Lista para ser consumida por el PantryService
     */
    getAllFoods() {
        const userMap = new Map(this.state.userFoods.map(f => [f.id, f]));
        const processedMaster = this.state.masterFoods
            .filter(f => !this.state.deletedIds.includes(f.id))
            .filter(f => !userMap.has(f.id)); // El usuario sobrescribe al maestro si hay colisión
            
        return [...processedMaster, ...this.state.userFoods];
    }

    getWizardState() { 
        return this.state.wizardState; 
    }
    
    getDietGoal() { 
        return this.state.dietGoal; 
    }
    
    getUserData() { 
        return { foods: this.state.userFoods, deletedIds: this.state.deletedIds }; 
    }

    getMealPlanIds() {
        return this.state.mealPlanIds;
    }

    // ==========================================
    // MUTACIONES SIMPLES
    // ==========================================

    addOrUpdateUserFood(food) {
        const index = this.state.userFoods.findIndex(f => f.id === food.id);
        if (index >= 0) {
            this.state.userFoods[index] = food;
        } else {
            this.state.userFoods.push(food);
        }
    }

    removeUserFood(id) {
        // Si es un alimento de sistema (O_XXX) no se borra, se añade a la lista negra
        if (id.startsWith('O_')) {
            if (!this.state.deletedIds.includes(id)) {
                this.state.deletedIds.push(id);
            }
        } else {
            // Si es del usuario (C_XXX, G_XXX), lo fulminamos
            this.state.userFoods = this.state.userFoods.filter(f => f.id !== id);
        }
    }
}

// Singleton global
export const nutritionStore = new NutritionStore();