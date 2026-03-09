// src/modules/nutrition_smart/routes.js

import { nutritionService } from '../nutrition_core/services/nutrition.service.js';
import { nutritionStore } from '../nutrition_core/store/index.js';

import './views/smart-checks.js'; 
import './views/diet.js';

export const nutritionSmartRoutes = {
  '/nutrition': async () => {
    await nutritionService.init();
    const goal = nutritionStore.getDietGoal();

    if (goal && goal.targetKcal > 0) {
      // --- CAMBIO 2: Crear el elemento con la etiqueta correcta ---
      return document.createElement('nutrition-smart-checks');
      // (Antes era: return document.createElement('smart-checks-wit');) [4]
    }

    window.location.hash = '/nutrition/wizard/form';
    return;
  },

  '/Diet': () => document.createElement('nutrition-diet'),
};
