// src/modules/training_planner/components/routine-card.js

import { ICONS } from '../../../core/theme/icons.js'; // Usaremos tus iconos centralizados si están, o los SVG directos
import { i18nService } from '../../../core/i18n/i18n.service.js'; // Ya no hay más chistes.

export class TrainingRoutineCard extends HTMLElement {
    static get observedAttributes() { return ['title', 'count', 'last-performed']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        // Cargamos el diccionario
        this.i18n = await i18nService.loadPage('training_planner/routine-card');
        this.render();
        this._attachListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            this._attachListeners();
        }
    }

    // Método para inyectar datos complejos (Objeto Rutina completo)
    set data(routine) {
        this.setAttribute('title', routine.name);
        this.setAttribute('count', routine.exercises ? routine.exercises.length : 0);
        this.setAttribute('id', routine.id); // Guardamos el ID en el host para referencias
        
        if (routine.lastPerformed) {
            this.setAttribute('last-performed', routine.lastPerformed);
        }
    }

    _formatLastPerformed(timestamp) {
        // Función segura por si el i18n aún no ha cargado del todo
        const t = (key, vars) => this.i18n ? this.i18n.t(key, vars) : '';

        if (!timestamp) return t('lbl_new') || 'Nueva';
        const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
        
        if (days === 0) return t('lbl_today') || 'Hoy';
        if (days === 1) return t('lbl_yesterday') || 'Ayer';
        
        // Pasamos la variable {{days}} al traductor
        return t('lbl_days_ago', { days: days }) || `Hace ${days} días`;
    }

    render() {
        // Fallback rápido
        const t = (key) => this.i18n ? this.i18n.t(key) : '';

        const title = this.getAttribute('title') || t('fallback_title') || 'Rutina Sin Nombre';
        const count = parseInt(this.getAttribute('count') || '0');
        const lastPerf = this.getAttribute('last-performed');
        const lastPerfText = lastPerf ? ` • ${this._formatLastPerformed(parseInt(lastPerf))}` : '';
        
        // Lógica de plural/singular
        const exerciseWord = count === 1 ? (t('lbl_exercise_count_single') || 'ejercicio') : (t('lbl_exercise_count_plural') || 'ejercicios');

        // TUS ICONOS SVG (Los he extraído de tu HTML para encapsularlos)
        const iconEdit = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.8379 11.3242L9.16211 17H7V14.8379L12.6758 9.16211L14.8379 11.3242ZM17 9.16211L15.5303 10.6318L13.3682 8.46973L14.8379 7L17 9.16211Z" fill="white"/>
            </svg>`;
        
        const iconTrash = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.85714 7.71502V6.42854C9.85714 6.31488 9.9023 6.20588 9.98267 6.12552C10.063 6.04515 10.1721 6 10.2857 6H13.7143C13.828 6 13.937 6.04515 14.0173 6.12552C14.0977 6.20588 14.1429 6.31488 14.1429 6.42854V7.71502H17.5714C17.6851 7.71502 17.7941 7.76017 17.8745 7.84054C17.9548 7.9209 18 8.0299 18 8.14356C18 8.25722 17.9548 8.36622 17.8745 8.44659C17.7941 8.52695 17.6851 8.5721 17.5714 8.5721H6.42857C6.31491 8.5721 6.2059 8.52695 6.12553 8.44659C6.04515 8.36622 6 8.25722 6 8.14356C6 8.0299 6.04515 7.9209 6.12553 7.84054C6.2059 7.76017 6.31491 7.71502 6.42857 7.71502H9.85714ZM10.7143 7.71502H13.2857V6.85794H10.7143V7.71502ZM7.71429 18C7.60062 18 7.49161 17.9549 7.41124 17.8745C7.33087 17.7941 7.28571 17.6851 7.28571 17.5715V8.5721H16.7143V17.5715C16.7143 17.6851 16.6691 17.7941 16.5888 17.8745C16.5084 17.9549 16.3994 18 16.2857 18H7.71429ZM10.7143 15.4288C10.8279 15.4288 10.937 15.3836 11.0173 15.3032C11.0977 15.2229 11.1429 15.1139 11.1429 15.0002V10.7148C11.1429 10.6011 11.0977 10.4921 11.0173 10.4118C10.937 10.3314 10.8279 10.2863 10.7143 10.2863C10.6006 10.2863 10.4916 10.3314 10.4112 10.4118C10.3309 10.4921 10.2857 10.6011 10.2857 10.7148V15.0002C10.2857 15.1139 10.3309 15.2229 10.4112 15.3032C10.4916 15.3836 10.6006 15.4288 10.7143 15.4288ZM13.2857 15.4288C13.3994 15.4288 13.5084 15.3836 13.5888 15.3032C13.6691 15.2229 13.7143 15.1139 13.7143 15.0002V10.7148C13.7143 10.6011 13.6691 10.4921 13.5888 10.4118C13.5084 10.3314 13.3994 10.2863 13.2857 10.2863C13.1721 10.2863 13.063 10.3314 12.9827 10.4118C12.9023 10.4921 12.8571 10.6011 12.8571 10.7148V15.0002C12.8571 15.1139 12.9023 15.2229 12.9827 15.3032C13.063 15.3836 13.1721 15.4288 13.2857 15.4288Z" fill="white"/>
            </svg>`;

        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    max-width: 412px;
                }

                .rutina-card {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    background-color: var(--Negro-suave);
                    /* Gap negativo visual se maneja con margen en el hijo */
                }

                /* CAJÓN MADRE (Info + Clickable) */
                .cajon-madre {
                    display: flex;
                    padding: 16px;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 8px;
                    flex: 1; /* Ocupa todo el espacio sobrante */
                    border: 1px solid var(--Blanco);
                    z-index: 1; 
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .cajon-madre:active {
                    background: rgba(255, 255, 255, 0.05);
                }

                .rutina-titulo {
                    color: var(--Blanco);
                    font-family: "Clash Display", sans-serif;
                    font-size: 24px;
                    font-weight: 600;
                    line-height: 120%;
                    margin: 0;
                }

                .rutina-ejercicios {
                    color: var(--Verde-acido); /* Ajustado a tu variable global */
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 150%;
                }

                /* MENU LATERAL (Botones) */
                .menu-lateral {
                    display: flex;
                    flex-direction: column;
                    margin-left: -1px; /* Colapso de bordes */
                }

                .cajon-icono {
                    display: flex;
                    width: 48px; /* Ajuste fino */
                    height: 48px; /* Aseguramos cuadrado */
                    justify-content: center;
                    align-items: center;
                    border: 1px solid var(--Blanco);
                    background: transparent;
                    cursor: pointer;
                    margin-bottom: -1px; /* Colapso vertical */
                    padding: 0;
                    transition: all 0.2s ease;
                }

                .cajon-icono:last-child {
                    margin-bottom: 0;
                }

                .cajon-icono:hover {
                    background: var(--gris-suave-hover);
                }
                
                .cajon-icono:active {
                    background: var(--Blanco);
                }
                
                /* Invertir color icono al hacer click */
                .cajon-icono:active svg path {
                    fill: var(--Negro-suave);
                }

            </style>

            <div class="rutina-card">
                
                <div class="cajon-madre" id="main-area">
                    <h3 class="rutina-titulo">// ${title}</h3>
                    <span class="rutina-ejercicios">
                        ${count} ${exerciseWord}${lastPerfText}
                    </span>
                </div>

                <div class="menu-lateral">
                    <button class="cajon-icono" id="btn-edit" aria-label="${t('aria_edit') || 'Editar'}">
                        ${iconEdit}
                    </button>
                    <button class="cajon-icono" id="btn-delete" aria-label="${t('aria_delete') || 'Eliminar'}">
                        ${iconTrash}
                    </button>
                </div>

            </div>
        `;
    }

    _attachListeners() {
        // 1. Click en la tarjeta principal -> Jugar / Ver Detalle
        const mainArea = this.shadowRoot.getElementById('main-area');
        if (mainArea) {
            mainArea.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('play', {
                    detail: { id: this.getAttribute('id') },
                    bubbles: true,
                    composed: true
                }));
            });
        }

        // 2. Click en Editar
        const btnEdit = this.shadowRoot.getElementById('btn-edit');
        if (btnEdit) {
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que dispare el 'play'
                this.dispatchEvent(new CustomEvent('edit', {
                    detail: { id: this.getAttribute('id') },
                    bubbles: true,
                    composed: true
                }));
            });
        }

        // 3. Click en Borrar
        const btnDelete = this.shadowRoot.getElementById('btn-delete');
        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                // Confirmación visual o lógica delegada al padre
                this.dispatchEvent(new CustomEvent('delete', {
                    detail: { id: this.getAttribute('id') },
                    bubbles: true,
                    composed: true
                }));
            });
        }
    }
}

customElements.define('training-routine-card', TrainingRoutineCard);