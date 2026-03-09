// src/modules/training_flow/routes.js

// 1. Importamos los archivos para que se registren los customElements al cargar el módulo
import './views/session-selector.js';
import './views/session-hub.js'; 
import './views/session-runner.js';
import './views/session-rest.js';

export const trainingFlowRoutes = {
    // Pantalla 1: Selector de Rutina
    '/training': () => document.createElement('training-session-selector'),
    
    // Pantalla 2: Hub de la Sesión (Lista de ejercicios)
    '/training/session': () => document.createElement('training-session-hub'),

    // Pantalla 3: Ejercicio activo
    '/training/runner/:id': () => document.createElement('training-session-runner'),
    
    // Pantalla 4: Descanso
    '/training/rest/:id': () => document.createElement('training-session-rest')
};
