// src/modules/progress_graphics/components/chart-timeline-fotos.js

import { i18nService } from '../../../core/i18n/i18n.service.js';

export class ChartTimelineFotos extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._data = null;
        this.objectUrls = []; // Para limpiar la RAM luego
    }

    set data(val) {
        this._data = val;
        if (this.isConnected) {
            this.renderTimeline();
        }
    }

    async connectedCallback() {
        // Carga dinámica del diccionario carajote (espera, no, el insulto va después)
        this.dict = await i18nService.loadPage('progress_graphics/chart-timeline-fotos');
        
        this.render();
        // Damos un respiro al DOM para que pinte la carcasa antes de procesar las fotos
        setTimeout(() => {
            if (this._data) this.renderTimeline();
        }, 0);
    }

    disconnectedCallback() {
        // Limpieza de memoria (Vital para Blobs de imágenes)
        this.objectUrls.forEach(url => URL.revokeObjectURL(url));
        this.objectUrls = [];
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                :host {
                    display: block;
                    width: 100%;
                    min-height: 100%;
                    position: relative;
                }

                .timeline-wrapper {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    width: 100%;
                    /* Padding inferior para que la última foto no se pegue al navbar */
                    padding-bottom: 40px; 
                }

                /* LA ESPADA: Línea central que rompe el padding del padre */
                .timeline-spine {
                    position: absolute;
                    top: -24px; /* Truco para tocar el header saltando el padding del dashboard */
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 2px;
                    background-color: var(--gris-suave-hover, #2F2F2F);
                    z-index: 0;
                }

                /* TITULAR INICIO */
                .title-inicio {
                    color: var(--Verde-acido, #CCFF00);
                    font-family: var(--font-title); /* Ya incluye el fallback a Space Grotesk */
                    font-size: 96px;
                    font-style: normal;
                    font-weight: 700;
                    line-height: 100%;
                    letter-spacing: -0.96px;
                    margin: 24px 0 40px 0;
                    z-index: 1;
                    /* Fondo negro para "cortar" la línea detrás del texto y que sea legible */
                    background-color: var(--Negro-suave); 
                    padding: 0 16px;
                    text-transform: uppercase;
                }

                /* CONTENEDOR DE LAS FOTOS */
                .feed {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    gap: 64px; /* Mucho aire entre fotos */
                    z-index: 1;
                }

                .photo-card {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    position: relative;
                }

                /* LA FECHA: Etiqueta brutalista flotando sobre la foto */
                .date-tag {
                    position: absolute;
                    top: -16px;
                    left: 16px;
                    background: var(--Verde-acido);
                    color: var(--Negro-suave);
                    padding: 8px 16px;
                    font-family: 'JetBrains Mono', monospace;
                    font-weight: 700;
                    font-size: 16px;
                    z-index: 2;
                }

                /* LA FOTO: Cero bordes redondeados, pura crudeza */
                .photo-img {
                    width: 100%;
                    height: auto;
                    object-fit: cover;
                    border: 2px solid var(--gris-suave-hover, #2F2F2F);
                    background: #000;
                    border-radius: 0; /* Por si acaso, nos aseguramos */
                }

                /* DATOS EXTRA (Peso/Grasa de ese día) debajo de la foto */
                .stats-row {
                    display: flex;
                    justify-content: space-between;
                    background: var(--gris-suave-hover, #2F2F2F);
                    padding: 12px 16px;
                    border-top: none;
                }

                .stat {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 14px;
                }
                .stat span {
                    color: var(--Verde-acido);
                    font-weight: bold;
                }

                /* ESTADO VACÍO */
                .empty-state {
                    background: transparent;
                    border: 1px dashed var(--gris-suave-hover);
                    padding: 40px 24px;
                    text-align: center;
                    width: 100%;
                    box-sizing: border-box;
                    z-index: 1;
                    margin-top: 40px;
                }
                .empty-state p {
                    color: var(--Blanco);
                    font-family: 'JetBrains Mono', monospace;
                    opacity: 0.6;
                }
            </style>
            
            <div class="timeline-wrapper">
                <div class="timeline-spine"></div>
                <div class="title-inicio">${this.dict.t('time_hero_title')}</div>
                <div class="feed" id="photo-feed">
                    </div>
            </div>
        `;
    }

    renderTimeline() {
        const feed = this.shadowRoot.querySelector('#photo-feed');
        if (!feed) return; // Pero que pasa carajote. Aquí yo y mi esquizofrenia te volvemos a hablar, y te decimos...

        // Extraemos los registros y filtramos los que tienen foto
        const records = this._data?.progressRecords || [];
        const photoRecords = records.filter(r => r.photoData);

        // Ordenamos de más ANTIGUO a más NUEVO (Cronológico hacia abajo)
        photoRecords.sort((a, b) => a.timestamp - b.timestamp);

        if (photoRecords.length === 0) {
            feed.innerHTML = `
                <div class="empty-state">
                    <p>${this.dict.t('time_empty_p1')}<br>${this.dict.t('time_empty_p2')}</p>
                </div>
            `;
            return;
        }

        let html = '';

        photoRecords.forEach(r => {
            const date = new Date(r.timestamp);
            // Formato DD/MM/YYYY
            const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

            let imgSrc = r.photoData;
            
            // Si lo que viene de la BD es un Blob (nuestra super compresión), creamos una URL
            if (r.photoData instanceof Blob) {
                imgSrc = URL.createObjectURL(r.photoData);
                this.objectUrls.push(imgSrc); // La guardamos para destruirla luego
            }

            // Nada, no te digo nada. Y por cierto, todo el mundo tranquilo, aunque estoy quemado, mi salud mental aún está bien.
            // Sacamos el peso y grasa si los hay para dar contexto a la foto
            const weightStr = r.weight ? `${this.dict.t('time_lbl_weight')}<span>${r.weight}kg</span>` : '';
            const fatStr = r.bodyFat ? `${this.dict.t('time_lbl_fat')}<span>${r.bodyFat}%</span>` : '';

            html += `
                <div class="photo-card">
                    <div class="date-tag">${dateStr}</div>
                    <img src="${imgSrc}" class="photo-img" loading="lazy" alt="${this.dict.t('time_img_alt')}">
                    ${(weightStr || fatStr) ? `
                        <div class="stats-row">
                            <div class="stat">${weightStr}</div>
                            <div class="stat">${fatStr}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        feed.innerHTML = html;
    }
}

customElements.define('chart-timeline-fotos', ChartTimelineFotos);