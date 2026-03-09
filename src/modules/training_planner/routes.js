// src/modules/training_planner/routes.js

// Importamos las vistas que hemos creado
import './views/planner.js';
import './views/exercise-selector.js';
import './views/routine-create.js';
import './views/exercise-create.js'; // <--- ¡FICHAJE NUEVO!

export const trainingPlannerRoutes = {
    // 1. La Home del Planificador (Lista de rutinas para editar)
    '/training/planner': () => document.createElement('training-planner-view'),
    
    // 2. Rutinas
    '/training/planner/routine/create': () => document.createElement('training-routine-create'),
    '/training/planner/routine/edit/:id': () => document.createElement('training-routine-create'), // Por si usas params en router
    
    // 3. Ejercicios
    '/training/planner/exercises': () => document.createElement('training-exercise-selector'),
    '/training/planner/exercise/create': () => document.createElement('training-exercise-create'),
    '/training/planner/exercise/edit/:id': () => document.createElement('training-exercise-create'),
};