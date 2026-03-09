// src/modules/progress_entry/routes.js

// 1. Pantalla principal (Biometría básica y candado de 20h)
import './views/record-add.js';

// 2. Pantalla de Medidas (La crearemos en la Fase 3)
import './views/record-measures.js';

// 3. Pantalla de Pliegues (La crearemos en la Fase 3)
import './views/record-folds.js';

export const progressEntryRoutes = {
    // Pantalla 1: Biometría (La base)
    '/progress/add': () => document.createElement('progress-record-add'),
    
    // Pantalla 2: Medidas corporales
    '/progress/add/measures': () => document.createElement('progress-record-measures'),
    
    // Pantalla 3: Pliegues
    '/progress/add/folds': () => document.createElement('progress-record-folds')
};