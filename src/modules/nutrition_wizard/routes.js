// Importamos las vistas (Ahora están "al lado", así que la ruta es corta)
import './views/form.js';
import './views/activity.js';
import './views/goal.js';
import './views/manual-config.js';

export const nutritionWizardRoutes = {
    // 1. El formulario inicial (Peso, Altura, Edad)
    '/nutrition/wizard/form': () => document.createElement('nutrition-wizard-form'),

    // 2. Nivel de actividad física
    '/nutrition/wizard/activity': () => document.createElement('nutrition-wizard-activity'),

    // 3. Selección de objetivo (Perder, Ganar, Mantener)
    '/nutrition/wizard/goal': () => document.createElement('nutrition-wizard-goal'),

    // 4. Configuración Experta (Manual)
    '/nutrition/manual-config': () => document.createElement('nutrition-manual-config'),
};