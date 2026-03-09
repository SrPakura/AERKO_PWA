// src/modules/progress_calculators/routes.js

// Importamos la vista para que el navegador registre el <progress-fat-calculator>
import './views/fat-calculator.js';

export const progressCalculatorsRoutes = {
    // Cuando el usuario vaya a esta ruta, creamos el componente
    '/progress/calculator': () => document.createElement('progress-fat-calculator')
};