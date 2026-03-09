// src/modules/training_lab/views/lab-upload.js - Juro que este es el último.

import { ICONS } from '../../../core/theme/icons.js';
import { router } from '../../../core/router/index.js';
import { labService } from '../services/lab.service.js'; // <-- El mediocentro organizador, el Isco del equipo

import '../../system/components/section-header.js';
import '../../system/components/navbar.js';
import '../../system/components/btn.js';

import { i18nService } from '../../../core/i18n/i18n.service.js'; // Ahora si, vamos con esa lista. Los voy a ordenar por categoría (principal, si tiene más de una, se jode el resto), pero no por calidad:

// ROMANCE: Plastic memories, Toradora! (Canon oficial en Aerko_), lovely complex (arriba los bajitos), las quintillizas, higehiro, ao haru ride.

// DEPORTE: Hajime no ippo, Haikyuu!!, inazuma eleven, y se que me olvida justo uno.

// DRAMA / DEPRESIÓN ABSOLUTA: look back (cine puro, la he visto 3 veces y he llorado 3 veces), A silent voice, i want to eat your pancreas, La tumba de las luciernagas (Todavía no la he podido terminar).

// SCI-FI / CYBERPUNK / MECHA (El futuro distópico) THRILLER PSICOLÓGICO / MINDFUCK: cowboy bebop (la cabra), EVANGELION (el original, nada de remasters), cyberpunk edgerunners (AOTY indiscutible), darling in the franxx, texhnolyze, classroom of the elite, Gokusen (este realmente no sé donde metelro) y ahora si, dos goats extras que no sabía donde meter: Serial experiments lain (10/10), Steins;gate.

// ACCIÓN / SHONEN / SOBRENATURAL: AOT (Shingeki), mob psycho 100, dandadan.

// FANTASÍA / AVENTURA: Frieren (simplemente arte).

// PD: Y estoy seguro de que me he olvidado de la mitad todavia.

/**
 * Vista de subida para el laboratorio de entrenamiento.
 * Aquí es donde el usuario pone el balón en juego para que la IA haga magia.
 */
export class TrainingLabUpload extends HTMLElement {
  constructor() {
    super();
    this.previewUrl = null; // URL temporal, como una cesión de invierno
    this.selectedFile = null; // El archivo titular
  }

  async connectedCallback() {
    // Fichamos el diccionario específico de esta pantalla
    const dict = await i18nService.loadPage('training_lab/lab-upload');
    this.t = dict.t; // Nos guardamos el método t() en la clase

    this.render();
    this._attachListeners();
  }

  disconnectedCallback() {
    // Cuando el jugador sale del campo, limpiamos las botas para no gastar RAM
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  /**
   * Gestionamos los eventos como si fuera una final de Copa.
   */
  _attachListeners() {
    const uploadBox = this.querySelector('#upload-box');
    const fileInput = this.querySelector('#video-input');
    const viewUpload = this.querySelector('#view-upload');
    const viewPreview = this.querySelector('#view-preview');
    const viewProcessing = this.querySelector('#view-processing');
    const videoPlayer = this.querySelector('#video-player');
    const btnAnalyze = this.querySelector('#btn-analyze');

    // Al tocar la caja de subida, disparamos el selector de archivos (el desmarque)
    uploadBox.addEventListener('click', () => fileInput.click());

    // Cuando el usuario elige el vídeo (el fichaje estrella)
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.selectedFile = file;

      // 1. Limpiamos la jugada anterior (memoria)
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);

      // 2. Creamos el pase directo: URL temporal para ver el vídeo
      this.previewUrl = URL.createObjectURL(file);
      videoPlayer.src = this.previewUrl;

      // 3. Cambiamos de sistema táctico (Ocultamos subida, mostramos preview)
      // Usamos .view-active para no chocar con el estilo de la navbar
      viewUpload.classList.replace('view-active', 'hidden');
      viewPreview.classList.replace('hidden', 'view-active');
    });

    // Botón Analizar: Aquí le pasamos el balón al mediocentro (labService)
    btnAnalyze.addEventListener('click', async () => {
      // 1. Entra el equipo de análisis al campo (mostramos spinner)
      viewPreview.classList.replace('view-active', 'hidden');
      viewProcessing.classList.replace('hidden', 'view-active');

      // 2. Pausamos el vídeo para que el procesador no se canse antes de tiempo
      videoPlayer.pause();

      try {
        // 3. LA JUGADA MAESTRA: El servicio gestiona el Worker y los datos.
        // Esperamos el pitido final para navegar a los resultados.
        await labService.analyzeVideo(this.selectedFile, videoPlayer, () => {
          router.navigate('/training/lab/results');
        });
      } catch (error) {
        // Si hay una contra y nos marcan gol (error fatal)
        console.error('[VISION LAB] Error en el análisis:', error);
        alert(this.t('upload_alert_error')); 

        // Restauramos el dibujo táctico original
        viewProcessing.classList.replace('view-active', 'hidden');
        viewPreview.classList.replace('hidden', 'view-active');
      }
    });
  }

  /**
   * Renderizamos la interfaz con los colores de nuestra bandera.
   */
  render() {
    this.innerHTML = `
      <style>
        @import url('/src/core/theme/variables.css');
        @import url('/src/core/theme/main.css');

        training-lab-upload {
          display: block;
          width: 100%;
          height: 100dvh;
          background: var(--Negro-suave);
          overflow: hidden;
        }

        .app-screen {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        .screen-header { 
          flex-shrink: 0; 
          width: 100%; 
          padding-top: max(12px, env(safe-area-inset-top)); 
          background: var(--Negro-suave); 
          z-index: 10; 
        }

        .screen-footer { 
          flex-shrink: 0; 
          width: 100%; 
          z-index: 100; 
          background: var(--Negro-suave); 
        }

        .screen-content {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          display: flex;
          flex-direction: column;
          scrollbar-width: none;
        }

        .screen-content::-webkit-scrollbar { display: none; }

        /* --- VISTAS / ESTADOS (Como los cambios de Pellegrini) --- */
        .hidden { display: none !important; }
        
        /* Renombramos .active a .view-active para evitar colisiones con la Navbar */
        .view-active { 
          display: flex; 
          flex-direction: column; 
          width: 100%; 
          height: 100%; 
          justify-content: center; 
          align-items: center; 
          gap: 24px; 
        }

        /* --- VISTA 1: CAJA DE SUBIDA --- */
        .upload-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 100%;
          max-width: 380px;
          aspect-ratio: 16 / 9;
          border: 2px dashed var(--Verde-acido); /* El verde que nos guía */
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          padding: 24px;
          box-sizing: border-box;
        }

        .upload-box:active { 
          background: rgba(204, 255, 0, 0.05); 
          transform: scale(0.98); 
        }

        .upload-icon { width: 48px; height: 48px; margin-bottom: 16px; }
        .upload-icon svg { width: 100%; height: 100%; fill: var(--Blanco); }

        .upload-title { 
          color: var(--Blanco); 
          font-family: 'Clash Display', sans-serif; 
          font-size: 24px; 
          font-weight: 600; 
          margin: 0 0 12px 0; 
        }

        .upload-subtitle { 
          color: var(--Blanco); 
          font-family: "JetBrains Mono", monospace; 
          font-size: 14px; 
          opacity: 0.8; 
          margin: 0; 
          line-height: 150%; 
        }

        /* --- VISTA 2: PREVIEW --- */
        #view-preview.view-active { justify-content: flex-start; }
        
        .video-container {
          width: 100%;
          max-height: 55vh; 
          background: #000;
          border: 1px solid var(--Blanco);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
        }

        video { width: 100%; height: 100%; object-fit: contain; }
        
        .warning-text {
          color: var(--Blanco);
          font-family: "JetBrains Mono", monospace;
          font-size: 14px;
          text-align: center;
          line-height: 150%;
          margin: 0;
        }

        /* --- VISTA 3: PROCESANDO (El esfuerzo no se negocia) --- */
        #view-processing.view-active { 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center; 
          gap: 24px; 
          text-align: center; 
        }

        .spinner-aerko {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(204, 255, 0, 0.1);
          border-top: 3px solid var(--Verde-acido);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>

      <div class="app-screen">
        <header class="screen-header">
          <app-section-header title="${this.t('upload_header_title')}" text=""></app-section-header>
        </header>

        <main class="screen-content">
          <input type="file" id="video-input" style="display:none;" 
                 accept="video/mp4, video/quicktime, video/x-matroska, video/webm">

          <!-- Estado inicial: Esperando la posesión -->
          <div id="view-upload" class="view-active">
            <div class="upload-box" id="upload-box">
              <div class="upload-icon">${ICONS.UPLOAD_CLOUD}</div>
              <h2 class="upload-title">${this.t('upload_box_title')}</h2>
              <p class="upload-subtitle">${this.t('upload_box_desc')}</p>
            </div>
          </div>

          <!-- Estado Preview: Revisando el VAR -->
          <div id="view-preview" class="hidden">
            <div class="video-container">
              <video id="video-player" controls playsinline></video>
            </div>
            
            <p class="warning-text">${this.t('upload_warning_angle')}</p>
            <app-btn id="btn-analyze" variant="primary" label="${this.t('upload_btn_analyze')}"></app-btn>
          </div>

          <!-- Estado Procesando: Sudando la camiseta -->
          <div id="view-processing" class="hidden">
            <div class="spinner-aerko"></div>
            <h2 class="upload-title">${this.t('upload_processing_title')}</h2>
            <p class="warning-text">${this.t('upload_processing_desc')}</p>
          </div>
        </main>

        <footer class="screen-footer">
          <app-nav></app-nav>
        </footer>
      </div>
    `;
  }
}

// Inscripción del componente en la liga de Custom Elements
customElements.define('training-lab-upload', TrainingLabUpload);