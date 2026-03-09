// src/modules/training_lab/services/lab.service.js

import { db } from '../../../core/db/index.js';
import { labStore } from '../store/lab.store.js';
import { AI_MODELS } from '../constants.js';
// 1. Importamos el servicio de i18n
import { i18nService } from '../../../core/i18n/i18n.service.js';

class LabService {
    
    // ====================================================================
    // 1. DESCARGA Y GESTIÓN DE MODELOS (Cache API)
    // ====================================================================

    /**
     * Descarga el modelo y lo guarda en la Cache API para uso offline.
     * Actualiza la configuración en IndexedDB al terminar.
     */
    async downloadModel(modelId) {
        const model = AI_MODELS[modelId];
        if (!model) throw new Error('Modelo no reconocido');

        // Abrimos la caché específica para nuestros modelos IA
        const cache = await caches.open('aerko-ai-models-v1');
        const response = await fetch(model.url);
        
        if (!response.ok) throw new Error('Fallo en la descarga del modelo');

        // Guardamos la respuesta cruda en la caché
        await cache.put(model.url, response.clone());

        // Actualizamos la BD para que no vuelva a salir el flujo de setup
        let config = await db.get('public_store', 'training_lab_config');
        if (!config) config = { id: 'training_lab_config' };
        
        config.is_downloaded = true;
        config.selected_model = modelId;
        await db.put('public_store', config);

        console.log(`[LAB SERVICE] Modelo ${model.name} descargado y guardado en caché.`);
        return true;
    }

    /**
     * Busca el modelo en la Cache API y lo carga en memoria (Buffer)
     */
    async loadModelBufferFromCache() {
        const config = await db.get('public_store', 'training_lab_config');
        if (!config || !config.selected_model) throw new Error('No hay modelo configurado');

        const modelUrl = AI_MODELS[config.selected_model].url;
        const cache = await caches.open('aerko-ai-models-v1');
        const cachedResponse = await cache.match(modelUrl);

        if (!cachedResponse) throw new Error('El modelo no está en la caché. Necesita descarga.');

        console.log(`[LAB SERVICE] Modelo cargado desde la RAM.`);
        return await cachedResponse.arrayBuffer();
    }

    // ====================================================================
    // 2. ANÁLISIS BIOMECÁNICO (Orquestación del Web Worker)
    // ====================================================================

    /**
   * Inicia el análisis de un vídeo usando el Web Worker.
   */
  async analyzeVideo(videoFile, videoElement, onCompleteCallback) {
    console.log('[LAB SERVICE] 🎬 Iniciando análisis biomecánico (Modo Ping-Pong)...');
    
    // Cargamos el diccionario de idiomas para esta sesión
    const dict = await i18nService.loadPage('training_lab/lab-service');

    // 1. Guardamos el archivo
    labStore.setVideoFile(videoFile);
    const modelBuffer = await this.loadModelBufferFromCache();
    
    // Oye, tengo una pregunta si eres hombre. ¿Tu te comerías una polla? Si tu respuesta ha sido "No, soy hetero", "No, no soy gay/otras palabras malsonantes (cuidado con tu homofobía)", o parecidas, yo que tu tendría cuidado. Quiero decir, yo no me comería una polla, pero simplemente porque no me gustan. Yo estoy seguro de ser hetero, pero tu... (Quería hacer un trolleo, pero me ha salido bastante mal xd)
    // 2. Preparamos el lienzo oculto
    const targetWidth = 480;
    const targetHeight = 640;
    const offscreen = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    
    // 3. Invocamos al Worker que arreglamos antes
    const worker = new Worker(new URL('../views/pose-worker.js?v=' + Date.now(), import.meta.url), { type: 'module' });
    
    worker.postMessage({
      type: 'INIT',
      payload: { modelBuffer: modelBuffer }
    });

    // Variables de control de tráfico
    let lastProcessedTime = -1;
    let isVideoFinished = false;

    // SEGURO: Si el vídeo llega al final de forma natural, levantamos la bandera
    videoElement.onended = () => {
      isVideoFinished = true;
    };

    // 4. LA FUNCIÓN MÁGICA: Solo extrae un frame cuando se le llama
    const sendNextFrame = () => {
      // Si el vídeo ya acabó, cerramos el chiringuito y pedimos la cuenta
      if (videoElement.ended || isVideoFinished) {
        console.log('[LAB SERVICE] ⏹️ Vídeo terminado. Pidiendo resultados al worker...');
        worker.postMessage({ type: 'COMPLETE' });
        return;
      }

      const currentTimeMs = Math.round(videoElement.currentTime * 1000);
      
      // MediaPipe exige que el tiempo siempre avance. Si el vídeo está pausado o cargando, esperamos.
      if (currentTimeMs <= lastProcessedTime) {
        setTimeout(sendNextFrame, 33); // Lo intentamos de nuevo en un ratito
        return;
      }

      lastProcessedTime = currentTimeMs;

      // Calcamos el frame
      ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      
      // Le lanzamos la pelota al Worker
      worker.postMessage({
        type: 'PROCESS_FRAME',
        payload: {
          imageData: imageData,
          timestamp: currentTimeMs
        }
      });
    };
    
    // 5. ESCUCHAMOS AL WORKER
    worker.onmessage = async (e) => {
      const { type, data, error } = e.data;
      
      if (type === 'READY') {
        console.log('[LAB SERVICE] 🟢 Worker READY. Preparando vídeo desde el inicio...');
        videoElement.muted = true;
        videoElement.currentTime = 0; // FUNDAMENTAL: Empezamos de cero por si el usuario lo reprodujo antes
        
        videoElement.play().then(() => {
          console.log('[LAB SERVICE] ▶️ Vídeo en marcha. Mandando el primer frame...');
          sendNextFrame(); // Sacamos de centro
        }).catch(err => {
          console.error('[LAB SERVICE] Error reproduciendo:', err);
          // ALERTA 1 TRADUCIDA
          alert(dict.t('alert_play_error'));
        });
      }
      
      else if (type === 'FRAME_DONE') {
        // EL PING-PONG: La IA dice que ya ha digerido el frame. Le mandamos el siguiente.
        sendNextFrame();
      }
      
      else if (type === 'RESULT_FINAL') {
        console.log(`[LAB SERVICE] 🏁 Análisis completado. Poses detectadas: ${data.length}`);
        
        // Seguro por si el vídeo estaba en negro o demasiado lejos
        if (data.length === 0) {
          // ALERTA 2 TRADUCIDA
          alert(dict.t('alert_no_pose'));
          worker.terminate();
          // Restauramos la UI para que pueda subir otro
          const ui = document.querySelector('training-lab-upload');
          if(ui && ui.shadowRoot) {
             const vp = ui.shadowRoot.getElementById('view-processing');
             const vw = ui.shadowRoot.getElementById('view-preview');
             if(vp && vw) { vp.classList.replace('view-active', 'hidden'); vw.classList.replace('hidden', 'view-active'); }
          }
          return;
        }

        // Éxito Total
        await db.put('public_store', { id: 'temp_analysis_data', data: data });
        labStore.setAnalysisData(data);
        worker.terminate();
        console.log('[LAB SERVICE] 🎉 Worker despedido. Cambiando a resultados...');
        if (onCompleteCallback) onCompleteCallback();
      }
      
      else if (type === 'ERROR') {
        console.error('[LAB SERVICE] 🚨 ERROR DEL WORKER:', error);
        worker.terminate();
        // ALERTA 3 TRADUCIDA (Concatenando el error técnico al final)
        alert(dict.t('alert_analysis_error') + error);
        
        // Restauramos la UI
        const ui = document.querySelector('training-lab-upload');
        if(ui && ui.shadowRoot) {
            const vp = ui.shadowRoot.getElementById('view-processing');
            const vw = ui.shadowRoot.getElementById('view-preview');
            if(vp && vw) { vp.classList.replace('view-active', 'hidden'); vw.classList.replace('hidden', 'view-active'); }
        }
      }
    };
  }

    // ====================================================================
    // 3. GRABACIÓN DE PANTALLA (Estudio de Grabación)
    // ====================================================================

    /**
     * Graba el Canvas visual y devuelve un enlace con el vídeo final.
     */
    startRecording(canvas, videoElement, exerciseName, onCompleteCallback) {
        console.log('[LAB SERVICE] Grabando resultados...');
        
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        const chunks = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            // Descarga automática ninja
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Aerko_Analisis_${exerciseName}.webm`;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            console.log('[LAB SERVICE] Grabación guardada.');
            if (onCompleteCallback) onCompleteCallback();
        };

        // 1. Fase A: Guardamos el estado del loop y lo quitamos
        const wasLooping = videoElement.loop;
        videoElement.loop = false;

        // 2. Fase B: Reiniciamos, reproducimos y grabamos
        videoElement.currentTime = 0;
        videoElement.play();
        recorder.start();

        // 3. Fase C: Cuando acaba el vídeo naturalmente (porque no hay loop)
        videoElement.onended = () => {
            recorder.stop();
            videoElement.onended = null; // Limpiamos el evento
            
            // Le devolvemos el loop y volvemos a darle al play para que la UI siga fluida
            if (wasLooping) {
                videoElement.loop = true;
                videoElement.play();
            }
        };
    }
}

export const labService = new LabService();