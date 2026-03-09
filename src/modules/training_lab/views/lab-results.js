// src/modules/training_lab/views/lab-results.js

import { router } from '../../../core/router/index.js';
import { db } from '../../../core/db/index.js';

// --- NUESTROS FICHAJES ---
import { labStore } from '../store/lab.store.js';
import { labService } from '../services/lab.service.js';
import { biomechanics } from '../utils/biomechanics.js';
// 🟢 NUEVO FICHAJE DE INVIERNO: El míster que sabe qué táctica aplicar
import { getExerciseLogic } from '../utils/exercises/index.js'; 
import { DrawingUtils, PoseLandmarker } from '../../../assets/lib/mediapipe/vision_bundle.js';
import { ICONS } from '../../../core/theme/icons.js'; // Traemos los iconos para el header

import { i18nService } from '../../../core/i18n/i18n.service.js'; // Este archivo es casi tan largo como un juego de persona... Espera, ¿Persona? *Empieza momento de autismo severo* DISTURBING THE PEEEAACEEEEEEEEE LOOK INTO MY EYESSSSSSS... Perdón, solo quería decir que la saga persona es una autentica maravilla

import '../../system/components/btn.js';

export class TrainingLabResults extends HTMLElement {
    constructor() {
        super();
        // ✂️ ADIÓS SHADOW DOM: Las puertas del Villamarín están abiertas. 
        // Ya no hay shadowRoot, usamos el DOM normal.
        
        // La pizarra del vestuario: Estado puramente visual
        this.videoUrl = null;
        this.poseData = []; 
        this.animationFrameId = null;
        this.currentExercise = 'squat'; 
        this.currentFrameLandmarks = null; 
    }

    async connectedCallback() {
        // Fichamos el diccionario específico de esta pantalla SIUUUUUUUU - El bicho CR7 >>> Messi
        const dict = await i18nService.loadPage('training_lab/lab-results');
        this.t = dict.t; // Guardamos el método t()

        this.render();
        setTimeout(async () => {
            await this._loadData();
            // ✂️ Hemos quitado el this.render() de aquí para no borrar el vídeo
            this._attachListeners(); 
        }, 0);
    }

    disconnectedCallback() {
        // Limpiamos la RAM (El vídeo temporal y el bucle de dibujado)
        if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        labStore.reset(); // Vaciamos la pizarra del VAR
    }

    // --- CARGA DE DATOS ---
    async _loadData() {
        const state = labStore.getState();
        let videoFile = state.tempVideoFile;
        this.poseData = state.tempAnalysisData;

        // Si recargan, recuperamos del banquillo (IndexedDB)
        if (!this.poseData || this.poseData.length === 0) {
            const dataRecord = await db.get('public_store', 'temp_analysis_data');
            if (dataRecord && dataRecord.data) {
                this.poseData = dataRecord.data;
            }
        }

        if (!videoFile || !this.poseData || this.poseData.length === 0) {
            console.warn('[VISION LAB] Faltan datos o vídeo. Volviendo al inicio...');
            router.navigate('/training/lab/upload');
            return;
        }

        console.log(`[VISION LAB] Datos cargados. ${this.poseData.length} frames listos. ¡Musho Betis!`);

        // 🟢 1. APLICAMOS EL AMORTIGUADOR PREMIUM
        this.poseData = biomechanics.applyPremiumSmoothing(this.poseData, 0.85);

        // 🟢 2. CALCULAMOS EL LADO BUENO GLOBAL Y EL PUNTO MÁS BAJO (Sticking point)
        this.globalBestSide = biomechanics.getGlobalBestSide(this.poseData);
        this.stickingPointTime = biomechanics.findStickingPoint(this.poseData, this.currentExercise, this.globalBestSide);
        
        // 🟢 NUEVO: GENERAMOS EL INFORME DE DATOS
        this.analysisReport = biomechanics.generateReport(this.poseData, this.currentExercise, this.globalBestSide);

        // Preparamos el reproductor
        this.videoUrl = URL.createObjectURL(videoFile);
        const videoEl = this.querySelector('#result-video');
        videoEl.src = this.videoUrl;

        // Ajustamos el Canvas al tamaño real del terreno de juego
        videoEl.onloadedmetadata = () => {
            const canvas = this.querySelector('#overlay-canvas');
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
        };
        
        this.analysisReport = biomechanics.generateReport(this.poseData, this.currentExercise, this.globalBestSide);
        this._updateReportUI(); // 🟢 Actualizamos la interfaz con los datos iniciales

        // Preparamos el reproductor (esto ya lo tienes igual)
        this.videoUrl = URL.createObjectURL(videoFile);
    }

    _attachListeners() {
        const videoEl = this.querySelector('#result-video');
        const btnBack = this.querySelector('#btn-back');
        const btnSave = this.querySelector('#btn-save');
        const canvas = this.querySelector('#overlay-canvas');
        const selectExercise = this.querySelector('#exercise-select');
        
        // 🟢 NUEVOS FICHAJES: Contenedor táctil y botón de Play
        const videoTouchArea = this.querySelector('#video-touch-area');
        const playIndicator = this.querySelector('#play-pause-indicator');

        // Bucle de dibujado y ocultar icono de Play al arrancar
        videoEl.addEventListener('play', () => {
            playIndicator.classList.add('hidden');
            this._renderLoop();
        });

        // Mostrar icono de Play al pausar
        videoEl.addEventListener('pause', () => {
            playIndicator.classList.remove('hidden');
        });

        // --- CONTROL TÁCTIL (MODO REELS/TIKTOK) ---
        videoTouchArea.addEventListener('click', (e) => {
            // Evitamos que se pause si el usuario está tocando el selector o el botón de guardar
            if (e.target.closest('.video-overlay-bar')) return;

            if (videoEl.paused) {
                videoEl.play();
            } else {
                videoEl.pause();
            }
        });

        // Botón Atrás
        btnBack.addEventListener('click', () => {
            window.history.back();
        });
        
        // --- DELEGACIÓN: GRABAR VÍDEO Y GUARDAR NOTA ---
        btnSave.addEventListener('click', async () => {
            btnSave.style.pointerEvents = 'none';
            btnSave.style.opacity = '0.5';

            // 1. Guardamos la nota histórica en la base de datos
            try {
                const historyRecord = await db.get('training_vault', 'lab_history');
                const labHistory = historyRecord ? historyRecord.data : [];
                
                labHistory.push({
                    id: `LAB_${Date.now()}`,
                    timestamp: Date.now(),
                    exercise: this.currentExercise,
                    score: this.analysisReport.score
                });

                await db.put('training_vault', { id: 'lab_history', data: labHistory });
                console.log('[VISION LAB] Nota técnica guardada en el historial.');
            } catch (e) {
                console.error('[VISION LAB] Error guardando historial:', e);
            }

            // 2. Descargamos el vídeo
            labService.startRecording(canvas, videoEl, this.currentExercise, () => {
                btnSave.style.pointerEvents = 'auto';
                btnSave.style.opacity = '1';
                console.log('¡Vídeo Guardado!');
            });
        });

        // 🟢 VELOCIDAD MODO CINE (Por defecto a 0.75x)
        videoEl.playbackRate = 0.75;

        // --- SELECTOR DE EJERCICIOS ---
        selectExercise.addEventListener('change', (e) => {
            this.currentExercise = e.target.value;
            this.stickingPointTime = biomechanics.findStickingPoint(this.poseData, this.currentExercise, this.globalBestSide);
            
            // 🟢 REGENERAMOS EL INFORME Y ACTUALIZAMOS SOLO LOS TEXTOS
            this.analysisReport = biomechanics.generateReport(this.poseData, this.currentExercise, this.globalBestSide);
            this._updateReportUI(); // Llamamos a nuestra nueva función
        });
    }

    // ====================================================================
    // --- EL DIBUJADO VISUAL (La magia en el césped) ---
    // ====================================================================

    // 🟢 NUEVO FICHAJE: Función helper para pintar un ángulo sin repetir código
    _drawAngle(ctx, canvas, pA_3d, pB_3d, pC_3d, pA_2d, pB_2d, pC_2d, isTorso = false) {
        if (!pA_3d || !pB_3d || !pC_3d || !pA_2d || !pB_2d || !pC_2d) return;

        // 1. Calcular el valor en grados
        let angle;
        if (isTorso) {
            angle = biomechanics.calculateTorsoAngle(pA_3d, pB_3d); // pB es la cadera, pA el hombro
        } else {
            angle = biomechanics.calculateAngle(pA_3d, pB_3d, pC_3d);
        }

        // 2. Coordenadas de pantalla para pintar el quesito
        const pxA = pA_2d.x * canvas.width;
        const pyA = pA_2d.y * canvas.height;
        const pxB = pB_2d.x * canvas.width; // El Vértice
        const pyB = pB_2d.y * canvas.height;
        const pxC = pC_2d.x * canvas.width;
        const pyC = pC_2d.y * canvas.height;

        let diff, angle1, angle2;

        if (isTorso) {
            // Quesito especial para la plomada (vertical)
            angle1 = Math.atan2(pyA - pyB, pxA - pxB);
            angle2 = Math.atan2(pyB - 100 - pyB, pxB - pxB); // Línea vertical imaginaria hacia arriba
        } else {
            // Quesito normal
            angle1 = Math.atan2(pyA - pyB, pxA - pxB);
            angle2 = Math.atan2(pyC - pyB, pxC - pxB);
        }

        ctx.beginPath();
        diff = angle2 - angle1;
        while (diff <= -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        const counterclockwise = diff < 0;

        ctx.arc(pxB, pyB, 40, angle1, angle2, counterclockwise);
        ctx.strokeStyle = '#CCFF00';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 3. Estilos de texto WCAG Compliant (Gigante y con borde negro grueso)
        const midAngle = angle1 + diff / 2;
        const textX = pxB + Math.cos(midAngle) * 60;
        const textY = pyB + Math.sin(midAngle) * 60;

        ctx.font = '800 36px "JetBrains Mono"'; // ¡Aprobado por la WCAG!
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 8;
        ctx.strokeText(`${angle}°`, textX, textY);
        
        ctx.fillStyle = '#CCFF00';
        ctx.fillText(`${angle}°`, textX, textY);
    }
    
    // 🟢 EL VIDEOMARCADOR TONTO: Pinta lo que le manden, sin preguntar.
    _updateReportUI() {
    const dataSection = this.querySelector('.data-section');
    if (!dataSection || !this.analysisReport) return;

    let htmlOutput = `
        <span class="block-title">${this.t('res_global_analysis')}</span>
        <span class="block-line">${this.t('res_score_prefix')}${this.analysisReport.score}/100</span>
    `;

    if (this.analysisReport.metrics) {
        this.analysisReport.metrics.forEach(block => {
            let linesHtml = block.lines.map(line => {
                let text = '';
                
                // CASO 1: Formato Squat (usa labelKey y value/valueKey)
                if (line.labelKey) {
                    let val = line.valueKey ? this.t(line.valueKey) : (line.value || '');
                    text = `${this.t(line.labelKey)}${val}`;
                } 
                // CASO 2: Formato Bench / Deadlift (usa key, vars y verdictKey)
                else if (line.key) {
                    // Clonamos las variables para no mutar el objeto original
                    let finalVars = line.vars ? { ...line.vars } : {};
                    
                    // Inyectamos el veredicto traducido dentro de las variables
                    if (line.verdictKey) {
                        finalVars.verdict = this.t(line.verdictKey);
                    } else if (line.fallback) {
                        finalVars.verdict = line.fallback;
                    }
                    
                    text = this.t(line.key, finalVars);
                }

                return `<span class="block-line">${text}</span>`;
            }).join('');

            htmlOutput += `
                <br>
                <span class="block-title">${this.t(block.titleKey)}</span>
                ${linesHtml}
            `;
        });
    }

    dataSection.innerHTML = htmlOutput;
}

    _renderLoop() {
        const videoEl = this.querySelector('#result-video');
        const canvas = this.querySelector('#overlay-canvas');
        if (!canvas) return; 
        
        const ctx = canvas.getContext('2d');
        if (!this.drawingUtils) this.drawingUtils = new DrawingUtils(ctx);
        if (videoEl.paused || videoEl.ended) return;

        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const currentTimeMs = videoEl.currentTime * 1000;
        
        const currentFrameData = biomechanics.getInterpolatedFrame(this.poseData, currentTimeMs);
        if (currentFrameData) this.currentFrameLandmarks = currentFrameData.landmarks;

        if (currentFrameData && currentFrameData.landmarks) {
            
            // Pintamos el esqueleto base
            this.drawingUtils.drawConnectors(currentFrameData.landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: '#CCFF00', lineWidth: 4 });
            this.drawingUtils.drawLandmarks(currentFrameData.landmarks, { color: '#CCFF00', radius: 6 });

            // Ya no calculamos el bestSide por frame, usamos el GLOBAL
            const side = this.globalBestSide;
            const wLm = currentFrameData.worldLandmarks; // 3D
            const lm = currentFrameData.landmarks;       // 2D
            
            // 🟢 PINTAMOS LOS ÁNGULOS SEGÚN EL EJERCICIO (DELEGADO AL MÍSTER)
            const logic = getExerciseLogic(this.currentExercise);
            logic.drawOverlay(ctx, canvas, wLm, lm, side, this._drawAngle.bind(this));
        }

        this.animationFrameId = requestAnimationFrame(() => this._renderLoop());
    }

    render() {
        // Iconos custom
        const iconDownload = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
                <path d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;

        const iconPlay = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="var(--Blanco)">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `;

        this.innerHTML = `
            <style>
                @import url('/src/core/theme/variables.css');
                @import url('/src/core/theme/main.css');

                training-lab-results {
                    display: block;
                    width: 100%;
                    height: 100dvh;
                    background: var(--Negro-suave);
                    overflow-y: auto;
                    scrollbar-width: none; 
                }

                .app-screen {
                    display: flex;
                    flex-direction: column;
                    width: 100%;
                    max-width: 480px;
                    margin: 0 auto;
                }

                /* --- CABECERA GLOBAL --- */
                .header-nav {
                    display: flex;
                    align-items: center;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--Blanco);
                    padding-top: calc(env(safe-area-inset-top) + 16px);
                    background: var(--Negro-suave);
                }
                
                .header-nav button {
                    background: transparent;
                    border: none;
                    padding: 0;
                    margin-right: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .header-title {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    font-weight: 500;
                }

                /* --- CONTENEDOR DEL VÍDEO (Táctil) --- */
                .player-container {
                    position: relative;
                    width: 100%;
                    background: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    border-bottom: 1px solid var(--Blanco);
                    cursor: pointer; /* Indica que se puede tocar */
                }

                /* La barra superior integrada */
                .video-overlay-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--Blanco);
                    z-index: 10;
                    background: rgba(26, 26, 26, 0.7); 
                    backdrop-filter: blur(4px);
                    cursor: default; /* No hereda el pointer del vídeo */
                }

                .exercise-select-wrapper {
                    flex: 1;
                    position: relative;
                    border-right: 1px solid var(--Blanco);
                }

                .exercise-select-wrapper select {
                    width: 100%;
                    appearance: none;
                    background: transparent;
                    border: none;
                    color: var(--Blanco);
                    padding: 16px;
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    cursor: pointer;
                    outline: none;
                }

                .exercise-select-wrapper::after {
                    content: '▼';
                    position: absolute;
                    right: 16px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--Blanco);
                    pointer-events: none;
                    font-size: 10px;
                }

                .btn-overlay-save {
                    background: transparent;
                    border: none;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .btn-overlay-save:active {
                    background: rgba(255,255,255,0.1);
                }

                /* 🟢 EL REPRODUCTOR SIN CONTROLES */
                #result-video {
                    width: 100%;
                    max-height: 65vh; 
                    object-fit: contain;
                }

                #overlay-canvas {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none; 
                    object-fit: contain;
                }

                /* 🟢 EL BOTÓN DE PLAY FLOTANTE */
                .play-icon-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 64px;
                    height: 64px;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    pointer-events: none; /* Los clicks lo traspasan hacia el contenedor */
                    z-index: 5;
                    transition: opacity 0.2s ease, transform 0.2s ease;
                    opacity: 1; /* Visible por defecto al estar pausado */
                }

                .play-icon-overlay.hidden {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(1.2); /* Pequeño zoom al desaparecer */
                }

                .play-icon-overlay svg {
                    margin-left: 4px; /* Centra visualmente el triángulo */
                }

                /* --- SECCIÓN DE DATOS --- */
                .data-section {
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    padding-bottom: calc(env(safe-area-inset-bottom) + 24px);
                }

                .code-title {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 16px;
                    margin: 0 0 12px 0;
                }
                .code-title.green { color: var(--Verde-acido); }

                .metrics-text {
                    color: var(--Blanco);
                    font-family: "JetBrains Mono", monospace;
                    font-size: 14px;
                    margin: 0;
                    line-height: 150%;
                }
            </style>

            <div class="app-screen">
                
                <div class="header-nav">
                    <button id="btn-back">
                        ${ICONS.ARROW_LEFT}
                    </button>
                    <span class="header-title">${this.t('res_header_title')}</span>
                </div>
                
                <div class="player-container" id="video-touch-area">
                    
                    <div class="video-overlay-bar">
                        <div class="exercise-select-wrapper">
                            <select id="exercise-select">
                                <option value="squat">${this.t('res_opt_squat')}</option>
                                <option value="bench">${this.t('res_opt_bench')}</option>
                                <option value="deadlift">${this.t('res_opt_deadlift')}</option>
                            </select>
                        </div>
                        <button class="btn-overlay-save" id="btn-save">
                            ${iconDownload}
                        </button>
                    </div>

                    <video id="result-video" playsinline muted loop></video>
                    <canvas id="overlay-canvas"></canvas>
                    
                    <div class="play-icon-overlay" id="play-pause-indicator">
                        ${iconPlay}
                    </div>
                </div>

                <div class="data-section">
                ${this.analysisReport ? `
                    <div>
                        <p class="code-title green">${this.t('res_global_analysis')}</p>
                        <p class="metrics-text">${this.t('res_score_prefix')}${this.analysisReport.score}/100</p>
                    </div>
                    ${this.analysisReport.metrics ? this.analysisReport.metrics.map(block => `
                        <div>
                            <p class="code-title green">${this.t(block.titleKey)}</p>
                            ${block.lines.map(line => `<p class="metrics-text">${this.t(line.key, line.vars)}</p>`).join('')}
                        </div>
                    `).join('') : ''}
                ` : `
                    <div>
                        <p class="code-title green">${this.t('res_processing_title')}</p>
                        <p class="metrics-text">${this.t('res_processing_desc')}</p>
                    </div>
                `}
            </div>
        </div>
    `;
    }
}

customElements.define('training-lab-results', TrainingLabResults);