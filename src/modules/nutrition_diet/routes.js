// Importamos todas las vistas de gestión (Backoffice)
import './views/nutrition-add-view.js';
import './views/nutrition-food-config.js';
import './views/nutrition-meal-config.js';
import './views/nutrition-meal-create.js';
import './views/nutrition-meal-foods-edit.js';
import './views/nutrition-food-create.js';
import './views/nutrition-food-edit.js';
import './views/nutrition-food-macros-edit.js';
import './views/nutrition-group-edit.js';

export const nutritionDietRoutes = {
    // 1. Buscador de Alimentos (El botón "+")
    '/nutrition/add-food': () => document.createElement('nutrition-add-view'),

    // 2. Configurar Alimento (Cuando seleccionas uno del buscador)
    '/nutrition/food-config/:id': () => document.createElement('nutrition-food-config'),

    // 3. Crear Alimento Nuevo (Manual)
    '/nutrition/create-food': () => document.createElement('nutrition-food-create'),

    // 4. Editar Alimento Existente (El lápiz)
    '/nutrition/edit-food': () => document.createElement('nutrition-food-edit'),
    '/nutrition/edit-food/:id': () => document.createElement('nutrition-food-macros-edit'), // Editar macros específicos

    // 5. Gestión de Grupos (Platos combinados)
    '/nutrition/edit-group': () => document.createElement('nutrition-group-edit'),

    // 6. Gestión de Comidas (Configurar "Desayuno", hora, etc)
    '/nutrition/meal-config': () => document.createElement('nutrition-meal-config'),
    '/nutrition/create-meal': () => document.createElement('nutrition-meal-create'),
    '/nutrition/edit-meal-foods': () => document.createElement('nutrition-meal-foods-edit'), // La papelera de la comida
};