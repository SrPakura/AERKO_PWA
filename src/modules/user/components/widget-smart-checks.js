// src/modules/user/components/widget-smart-checks.js

import '../../system/components/widget.js'; // Importamos la UI base
import { router } from '../../../core/router/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

// Importamos los servicios del núcleo de nutrición
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
import { journalService } from '../../nutrition_core/services/journal.service.js';
import { nutritionStore } from '../../nutrition_core/store/index.js';

export class WidgetSmartChecks extends HTMLElement {
  constructor() {
    super();
    this.dict = null;
  }

  async connectedCallback() {
    // 1. Cargamos el diccionario antes de hacer nada
    this.dict = await i18nService.loadPage('user/smart_checks');
    
    this.render();
    this.addListeners();
    this.loadData();
  }

  render() {
    if (!this.dict) return;

    // Pintamos el widget base con el estado de "Cargando" del diccionario
    this.innerHTML = `
      <app-widget
        variant="highlight"
        title="${this.dict.t('sc_title')}"
        text="${this.dict.t('sc_loading')}"
      ></app-widget>
    `;
  }

  addListeners() {
    const widgetBase = this.querySelector('app-widget');
    if (widgetBase) {
      // Hacemos que el componente entero sea clickeable y nos lleve a los Smart Checks
      widgetBase.addEventListener('click', () => {
        router.navigate('/nutrition');
      });
    }
  }

  async loadData() {
    if (!this.dict) return;

    try {
      // 1. Aseguramos que los servicios están listados e inicializados en RAM
      await nutritionService.init();

      // 2. Obtenemos las plantillas activas de comidas (Ej: ['plan_meal_0', 'plan_meal_1'])
      const activePlanIds = nutritionStore.getMealPlanIds();
      let pendingCount = 0;
      const today = new Date();

      // 3. Consultamos al "Contable" (journalService) cómo va el día
      for (const planId of activePlanIds) {
        const log = await journalService.getMealLog(today, planId);
        
        // Según tu lógica en SmartChecksScreen, si no hay timestamp es que está PENDING
        if (!log.timestamp) {
          pendingCount++;
        }
      }

      // 4. Inyectamos el texto dinámico según el recuento usando el diccionario
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        let text = '';
        if (activePlanIds.length === 0) {
          text = this.dict.t('sc_no_meals');
        } else if (pendingCount === 0) {
          text = this.dict.t('sc_all_done');
        } else if (pendingCount === 1) {
          text = this.dict.t('sc_one_left');
        } else {
          // Interpolación mágica: inyectamos el número en {{count}}
          text = this.dict.t('sc_many_left', { count: pendingCount });
        }
        
        widgetBase.setAttribute('text', text);
      }
    } catch (error) {
      console.error('[WIDGET SMART CHECKS] Error calculando comidas:', error);
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        widgetBase.setAttribute('text', this.dict.t('sc_error'));
      }
    }
  }
}

customElements.define('widget-smart-checks', WidgetSmartChecks);