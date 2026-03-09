// src/modules/user/components/widget-smart-progress.js

import '../../system/components/widget.js';
import { router } from '../../../core/router/index.js';
import { progressService } from '../../progress_core/services/progress.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class WidgetSmartProgress extends HTMLElement {
  constructor() {
    super();
    this.dict = null;
  }

  async connectedCallback() {
    // Cargamos el diccionario de progreso
    this.dict = await i18nService.loadPage('user/smart_progress');
    
    this.render();
    this.addListeners();
    this.loadData();
  }

  render() {
    if (!this.dict) return;

    // Estado de carga inicial con el diccionario
    this.innerHTML = `
      <app-widget
        variant="highlight"
        title="${this.dict.t('sp_title')}"
        text="${this.dict.t('sp_loading')}"
      ></app-widget>
    `;
  }

  addListeners() {
    const widgetBase = this.querySelector('app-widget');
    if (widgetBase) {
      // Al hacer clic, nos lleva a la pantalla de añadir registro
      widgetBase.addEventListener('click', () => {
        router.navigate('/progress/add');
      });
    }
  }

  async loadData() {
    if (!this.dict) return;

    try {
      // 1. Aseguramos que el servicio de progreso está inicializado y tiene el historial
      await progressService.init();

      // 2. Le preguntamos al "portero" si el candado de las 20h está abierto
      const canAdd = progressService.canAddRecord();

      // 3. Inyectamos el texto dinámico según el resultado usando el diccionario
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        if (canAdd) {
          widgetBase.setAttribute('text', this.dict.t('sp_can_add'));
        } else {
          widgetBase.setAttribute('text', this.dict.t('sp_cannot_add'));
        }
      }
    } catch (error) {
      console.error('[WIDGET SMART PROGRESS] Error leyendo el candado:', error);
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        widgetBase.setAttribute('text', this.dict.t('sp_error'));
      }
    }
  }
}

// Registramos el componente
customElements.define('widget-smart-progress', WidgetSmartProgress);