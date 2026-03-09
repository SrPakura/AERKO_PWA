// src/modules/onboarding/index.js

// 1. Importamos los archivos para que se ejecute el 'customElements.define'
// No hace falta importar la clase, solo con importar el archivo el navegador lo registra.
import './views/welcome.js';
import './views/wizard.js';
import './views/import.js';
import './views/import-action.js';

export const onboardingRoutes = {
    // 2. Definimos las rutas instanciando los Web Components
    '/onboarding/welcome': () => document.createElement('onboarding-welcome'),
    '/onboarding/wizard': () => document.createElement('onboarding-wizard'),
    '/onboarding/import': () => document.createElement('onboarding-import'),
    '/onboarding/import-action': () => document.createElement('onboarding-import-action'),
};