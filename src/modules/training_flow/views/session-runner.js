import { router } from '../../../core/router/index.js';
import { ICONS } from '../../../core/theme/icons.js';
// Importo las cositas complejas jajaja (14 de febrero y estoy trabajando, sin novia, sin ganas de nada más que matar a besos a mi pŕoxima novia :3. En fin, cuando termine el trabajo voy a volver a salir, a ver si conozco a alguien que la vida en mi cuarto es muy monotoma)
import { analysisService } from '../../training_core/services/analysis.service.js';
import { trainingStore } from '../../training_core/store/index.js';

import { unitService } from '../../../core/utils/unit.service.js';
import { userService } from '../../user/services/user.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // Y pensar que hice ese archivo el 14 de febrero eh. Ya es 3 de marzo, pero eh chavales, algún día encontraré a mi Taiga. (Aclaración rápida porque me lo veo venir, no soy pedofilo, no me gustan las niñas pequeñas. No tengo preferencias físicas, solo me gustan las personas maduras, inteligentes, y amables. Buenas personas en este mundo, aunque sean del betis (del madrid ya no acepto, lo siento). Gracias por la atención)

// Componentes
import '../../system/components/btn.js';

export class TrainingSessionRunner extends HTMLElement {
    constructor() {
        super();
        // Estado interno
        this.stream = null;
        this.mediaRecorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.timerEnabled = false; // El toggle del crono (10s)
        this.facingMode = 'environment'; // 'user' (selfie) o 'environment' (trasera)
        this.exerciseId = null; // NUEVA LÍNEA: Aquí guardaremos el ID del ejercicio
        
        // Referencias DOM
        this.videoEl = null;
    }

    async connectedCallback() {
        // NUEVAS LÍNEAS: Leer el ID de la URL
        const cleanPath = window.location.hash.split('?')[0];
        const parts = cleanPath.split('/');
        this.exerciseId = parts[parts.length - 1]; 
        
        // AÑADIR ESTA LÍNEA
        this.i18n = await i18nService.loadPage('training_flow/session-runner');

        this.render();
        this.videoEl = this.querySelector('video');
        
        // Disparamos el cálculo asíncrono
        this._loadRecommendation();
        
        // Inicializamos listeners
        this._attachListeners();
    }

    disconnectedCallback() {
        // CRÍTICO: Apagar la cámara al salir para no fundir batería
        this.stopCamera();
    }

    async initCamera() {
        try {
            if (this.stream) this.stopCamera();

            const constraints = {
                audio: false, // Muted por defecto
                video: {
                    facingMode: this.facingMode,
                    height: { ideal: 720 } // Pedimos 720p nativo
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoEl.srcObject = this.stream;
        } catch (err) {
            console.error("Error cámara:", err);
            // Fallback visual si falla (ej: emulador)
            this.videoEl.parentElement.style.background = '#333';
            this.videoEl.parentElement.innerHTML += `<p style="color:white;text-align:center;padding-top:50%">${this.i18n.t('runner_cam_error_fallback')}</p>`;
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    render() {
        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');

                training-session-runner {
                    display: flex;
                    flex-direction: column;
                    height: 100dvh;
                    background-color: var(--Negro-suave);
                    overflow: hidden;
                    gap: 24px;
                }

                /* 1. HEADER (Recomendación) */
                .runner-header {
                    display: flex;
                    padding: 16px 24px;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }

                .recommendation-text {
                    color: var(--Verde-acido);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 150%;
                    text-align: center;
                }

                /* 2. CONTENIDO PRINCIPAL (Video Frame) */
                .video-container {
                    flex: 1;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 0 24px;
                    position: relative;
                }

                .camera-frame {
                    width: 100%;
                    height: 100%;
                    max-height: 80vh; /* Seguridad */
                    
                    /* Proporción intentada 9:16, pero flexible */
                    aspect-ratio: 9/16; 
                    
                    border: 1px solid var(--Blanco);
                    position: relative;
                    overflow: hidden;
                    background: #000;
                }

                video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover; /* Clave para no deformar */
                    transform: scaleX(1); /* Se invierte dinámicamente si es selfie */
                }

                /* OVERLAYS */
                
                /* Cuenta atrás gigante */
                .countdown-layer {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: rgba(0,0,0,0.5);
                    z-index: 10;
                    
                    color: var(--Verde-acido);
                    font-family: "Clash Display", sans-serif;
                    font-size: 120px;
                    font-weight: 700;
                    display: none; /* Oculto por defecto */
                }
                .countdown-layer.active { display: flex; }

                /* Frame de Botones (Sobre el video) */
                .controls-layer {
                    position: absolute;
                    bottom: 24px;
                    left: 0; 
                    width: 100%;
                    
                    display: flex;
                    justify-content: center;
                    gap: 24px;
                    z-index: 5;
                    padding: 0 24px; /* Respetamos el padding del padre */
                }

                /* ESTILO DE BOTÓN CUADRADO (Spec) */
                .cam-btn {
                    display: flex;
                    padding: 16px;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    
                    border-radius: 4px;
                    border: 1px solid var(--Blanco);
                    background: rgba(26, 26, 26, 0.50);
                    backdrop-filter: blur(4px);
                    
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--Blanco);
                }

                .cam-btn:active {
                    background: rgba(204, 255, 0, 0.2);
                    border-color: var(--Verde-acido);
                }
                
                /* Estado Activo (Para el Timer) */
                .cam-btn.active {
                    border-color: var(--Verde-acido);
                    color: var(--Verde-acido);
                    background: rgba(26, 26, 26, 0.8);
                }

                .cam-btn svg {
                    width: 48px;
                    height: 48px;
                    fill: currentColor; 
                    stroke: currentColor;
                }
                
                /* El botón de grabar (Rojo) */
                #btn-record svg circle:last-child {
                    fill: #FF0000;
                    stroke: none;
                }
                #btn-record.recording {
                    border-color: #FF0000;
                    background: rgba(255, 0, 0, 0.1);
                }

                /* 3. FOOTER (Botones Finales) */
                .runner-footer {
                    flex-shrink: 0;   /* Prohibido encogerse o moverse */
                    padding: 0 24px 24px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    background: var(--Negro-suave);
                }
                
                /* Placeholder que tapa todo */
                .camera-placeholder {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: #000;
                    z-index: 20; /* Por encima de todo */
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                }
                .placeholder-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    color: var(--Blanco);
                    opacity: 0.7;
                }
                .camera-placeholder.hidden {
                    display: none;
                }
            </style>

            <header class="runner-header">
                <span class="recommendation-text" id="recommendation-text">${this.i18n.t('runner_rec_calculating')}</span>
            </header>

            <div class="video-container">
                <div class="camera-frame">
                    <video autoplay playsinline muted></video>
                    
                    <div class="camera-placeholder" id="btn-activate-cam">
                        <div class="placeholder-content">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                            <span>${this.i18n.t('runner_cam_hint')}</span>
                        </div>
                    </div>

                    <div class="countdown-layer" id="countdown-display">3</div>

                    <div class="controls-layer">
                        <div class="cam-btn" id="btn-timer">
                            ${ICONS.TIMER}
                        </div>
                        <div class="cam-btn" id="btn-record">
                            ${ICONS.RECORD}
                        </div>
                        <div class="cam-btn" id="btn-flip">
                            ${ICONS.CAMERA_FLIP}
                        </div>
                    </div>
                </div>
            </div>

            <footer class="runner-footer">
                <app-btn variant="secondary" label="${this.i18n.t('runner_btn_finish')}" id="action-finish"></app-btn>
                <app-btn variant="primary" label="${this.i18n.t('runner_btn_rest')}" id="action-rest"></app-btn>
            </footer>
        `;
    }

    _attachListeners() {
        // A. TIMER TOGGLE
        const btnTimer = this.querySelector('#btn-timer');
        btnTimer.addEventListener('click', () => {
            this.timerEnabled = !this.timerEnabled;
            // Feedback visual: Verde si está activo
            btnTimer.classList.toggle('active', this.timerEnabled);
        });

        // B. FLIP CAMERA
        const btnFlip = this.querySelector('#btn-flip');
        btnFlip.addEventListener('click', async () => {
            this.facingMode = (this.facingMode === 'environment') ? 'user' : 'environment';
            // Invertir espejo si es selfie
            this.videoEl.style.transform = (this.facingMode === 'user') ? 'scaleX(-1)' : 'scaleX(1)';
            await this.initCamera();
        });

        // C. RECORD LOGIC
        const btnRecord = this.querySelector('#btn-record');
        btnRecord.addEventListener('click', () => {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                if (this.timerEnabled) {
                    this.startCountdown();
                } else {
                    this.startRecording();
                }
            }
        });

        // D. NAVEGACIÓN
        // Botón Blanco: Terminar Ejercicio (SIN crono)
        this.querySelector('#action-finish').addEventListener('click', () => {
            // Usamos el ID real que hemos guardado arriba
            router.navigate(`/training/rest/${this.exerciseId}`); 
        });

        // Botón Verde: Descanso (CON crono)
        this.querySelector('#action-rest').addEventListener('click', () => {
            // Usamos el ID real y le decimos que ponga el crono
            router.navigate(`/training/rest/${this.exerciseId}?mode=rest`);
        });
        
        const btnActivate = this.querySelector('#btn-activate-cam');
        btnActivate.addEventListener('click', async () => {
            await this.initCamera();
            btnActivate.classList.add('hidden'); // Ocultamos el telón
        });
    }

    // --- LÓGICA DE GRABACIÓN ---

    startCountdown() {
        const display = this.querySelector('#countdown-display');
        display.classList.add('active');
        let count = 10;
        display.innerText = count;

        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                display.innerText = count;
            } else {
                clearInterval(interval);
                display.classList.remove('active');
                this.startRecording(); // EMPEZAMOS
            }
        }, 1000);
    }

    startRecording() {
        if (!this.stream) return;
        
        this.chunks = [];
        // Intentar codecs óptimos
        const options = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
            ? { mimeType: 'video/webm; codecs=vp9' } 
            : { mimeType: 'video/webm' };

        try {
            this.mediaRecorder = new MediaRecorder(this.stream, options);
        } catch (e) {
            // Safari fallback (mp4)
            this.mediaRecorder = new MediaRecorder(this.stream);
        }

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
            this.saveVideo();
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        
        // UI Update
        const btnRecord = this.querySelector('#btn-record');
        btnRecord.classList.add('recording');
        btnRecord.innerHTML = ICONS.STOP; // Cambiamos al cuadrado de stop
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;

            // UI Update
            const btnRecord = this.querySelector('#btn-record');
            btnRecord.classList.remove('recording');
            btnRecord.innerHTML = ICONS.RECORD; // Volvemos al círculo rojo
        }
    }

    saveVideo() {
        const blob = new Blob(this.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Comportamiento MVP: Descargar archivo
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `aerko_set_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log("Video guardado/descargado");
    }
    
    async _loadRecommendation() {
        const textEl = this.querySelector('#recommendation-text');
        if (!textEl) return;

        const mesocycle = trainingStore.state.mesocycle;
        if (!mesocycle) {
            textEl.innerText = this.i18n.t('runner_rec_empty');
            return;
        }

        try {
            const suggestions = await analysisService.generateSuggestion(
                this.exerciseId, 
                mesocycle.currentWeek, 
                mesocycle.totalWeeks
            );

            if (!suggestions || suggestions.length === 0) {
                textEl.innerText = this.i18n.t('runner_rec_first');
            } else {
                // 1. Obtenemos la preferencia del usuario (Si no existe, KG por defecto)
                const userProfile = userService.getProfile();
                const prefUnit = userProfile.weightUnit || 'KG';

                // 2. Traducimos el Top Set (que viene de la BD en KG puros) a la vista del usuario
                const topSet = suggestions[0];
                const displayWeight = unitService.toDisplay(topSet.kg, prefUnit);

                // 3. Pintamos con la unidad dinámica
                textEl.innerText = this.i18n.t('runner_rec_format', {
                    weight: displayWeight,
                    unit: prefUnit,
                    reps: topSet.reps
                });
            }
        } catch (error) {
            console.error("Error al calcular recomendación:", error);
            // ANTES: textEl.innerText = "Sugerencia no disponible";
            textEl.innerText = this.i18n.t('runner_rec_unavailable');
        }
    }
}

customElements.define('training-session-runner', TrainingSessionRunner);