// src/modules/user/components/widget-smart-training.js

import '../../system/components/widget.js';
import { router } from '../../../core/router/index.js';
import { db } from '../../../core/db/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export class WidgetSmartTraining extends HTMLElement {
  constructor() {
    super();
    this.dict = null;
  }

  async connectedCallback() {
    // 1. Cargamos el diccionario antes de hacer nada
    this.dict = await i18nService.loadPage('user/smart_training');

    this.render();
    this.addListeners();
    this.loadData();
  }

  render() {
    if (!this.dict) return;

    // Estado de carga inicial con textos del diccionario
    this.innerHTML = `
      <app-widget
        variant="highlight"
        title="${this.dict.t('st_title')}"
        text="${this.dict.t('st_loading')}"
      ></app-widget>
    `;
  }

  addListeners() {
    const widgetBase = this.querySelector('app-widget');
    if (widgetBase) {
      // Al hacer clic, nos lleva al Hub de Entrenamiento
      widgetBase.addEventListener('click', () => {
        router.navigate('/training');
      });
    }
  }

  async loadData() {
    if (!this.dict) return;

    try {
      // 1. Accedemos directamente al historial de entrenamientos en la bóveda
      const record = await db.get('training_vault', 'training_sessions');
      const sessions = record && record.data ? record.data : [];

      // 2. Calculamos el timestamp de inicio del día de hoy (00:00:00)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      // 3. Comprobamos si alguna sesión tiene un timestamp de hoy
      const hasTrainedToday = sessions.some(session => session.timestamp >= startOfDay);

      // 4. Inyectamos el texto dinámico según el resultado
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        if (hasTrainedToday) {
          widgetBase.setAttribute('text', this.dict.t('st_training_today'));
        } else {
          widgetBase.setAttribute('text', this.dict.t('st_not_trained'));
        }
      }
    } catch (error) {
      console.error('[WIDGET SMART TRAINING] Error leyendo historial:', error);
      const widgetBase = this.querySelector('app-widget');
      if (widgetBase) {
        widgetBase.setAttribute('text', this.dict.t('st_error'));
      }
    }
  }
}

customElements.define('widget-smart-training', WidgetSmartTraining);