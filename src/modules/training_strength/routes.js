// src/modules/training_strength/routes.js

// 1. Importamos la vista para que el Custom Element se registre
import './views/calculator.js';

export const trainingStrengthRoutes = {
    // Cuando la URL sea #/training/1rm, creamos y devolvemos el componente
    '/training/1rm': () => document.createElement('training-strength-calculator')
};