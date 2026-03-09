// src/modules/training_lab/views/pose-worker.js

console.log('[WORKER INTERNO] 🏁 Archivo pose-worker.js cargado en memoria.');

// TRUCO 1: Ocultamos importScripts
self.importScripts = null;

// TRUCO 2: El 'document' falso (NIVEL DIOS CON INTERCEPTOR DE SCRIPTS)
if (typeof window === 'undefined') {
  self.window = self;
}

if (typeof document === 'undefined') {
  self.document = {
    createElement: function(tag) {
      if (tag === 'canvas') {
        const canvas = new OffscreenCanvas(1, 1);
        canvas.setAttribute = function() {};
        if (!canvas.addEventListener) canvas.addEventListener = function() {};
        return canvas;
      }

      const fakeElement = {
        tagName: tag.toLowerCase(),
        src: '',
        listeners: {},
        setAttribute: function(name, value) { 
          if (name === 'src') this.src = value;
        },
        getAttribute: function(name) { return name === 'src' ? this.src : ''; },
        appendChild: function() {},
        removeChild: function() {},
        addEventListener: function(type, listener) { 
          this.listeners[type] = listener;
        },
        removeEventListener: function() {},
        style: {}
      };
      return fakeElement;
    },
    addEventListener: function() {},
    removeEventListener: function() {},
    head: { appendChild: function() {} },
    body: { 
      appendChild: function(el) { 
        // 🟢 AQUÍ ESTÁ LA MAGIA: Interceptamos el script y lo ejecutamos a la fuerza
        if (el.tagName === 'script' && el.src) {
          console.log(`[WORKER INTERNO] ⚙️ Interceptado: Descargando a la fuerza ${el.src}...`);
          
          fetch(el.src)
            .then(res => res.text())
            .then(code => {
              console.log(`[WORKER INTERNO] ⚙️ Ejecutando código de MediaPipe en RAM...`);
              // Usamos eval global para que MediaPipe se instale en el worker
              const globalEval = eval;
              globalEval(code);
              
              console.log(`[WORKER INTERNO] ✅ ¡Hecho! Simulando evento 'load' para engañar a MediaPipe...`);
              if (el.listeners['load']) el.listeners['load']();
              if (el.onload) el.onload();
            })
            .catch(err => {
              console.error('[WORKER INTERNO] ❌ Error descargando el script interno:', err);
              if (el.listeners['error']) el.listeners['error'](err);
              if (el.onerror) el.onerror(err);
            });
        }
      } 
    }
  };
}

let poseLandmarker = null;
let isReady = false;
const landmarksHistory = [];

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  if(type !== 'PROCESS_FRAME') {
    console.log(`[WORKER INTERNO] 📨 Orden recibida: ${type}`);
  }

  switch (type) {
    case 'INIT':
      try {
        console.log('[WORKER INTERNO] 🚀 Intentando importar vision_bundle.js...');
        const { FilesetResolver, PoseLandmarker } = await import("/src/assets/lib/mediapipe/vision_bundle.js");

        console.log('[WORKER INTERNO] 🔍 Configurando FilesetResolver...');
        const vision = await FilesetResolver.forVisionTasks("/src/assets/lib/mediapipe/wasm");

        console.log('[WORKER INTERNO] 🤖 Llamando a PoseLandmarker.createFromOptions (CPU)...');
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetBuffer: new Uint8Array(payload.modelBuffer),
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
          outputSegmentationMasks: false,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        isReady = true;
        console.log('[WORKER INTERNO] 🟢 ¡MISTERIO RESUELTO! Todo listo. Avisando al Service...');
        self.postMessage({ type: 'READY' });
      } catch (error) {
        console.error('[WORKER INTERNO] ❌ Fallo catastrófico en INIT:', error);
        self.postMessage({ type: 'ERROR', error: error.message || error.toString() });
      }
      break;

    case 'PROCESS_FRAME':
      if (!isReady || !poseLandmarker) return;

      try {
        const results = poseLandmarker.detectForVideo(payload.imageData, payload.timestamp);
        
        if (results && results.landmarks && results.landmarks.length > 0) {
            // LO QUE DEBES PONER (BIEN):
            const bodyLandmarks = results.landmarks[0];
            const bodyWorldLandmarks = results.worldLandmarks[0];

          landmarksHistory.push({
            time: payload.timestamp,
            landmarks: bodyLandmarks,
            worldLandmarks: bodyWorldLandmarks
          });
        }
        self.postMessage({ type: 'FRAME_DONE', time: payload.timestamp });
      } catch (err) {
        console.error('[WORKER INTERNO] ❌ Error procesando el frame:', err);
      }
      break;

    case 'COMPLETE':
      console.log(`[WORKER INTERNO] 📦 Orden COMPLETE. Enviando ${landmarksHistory.length} frames...`);
      self.postMessage({
        type: 'RESULT_FINAL',
        data: landmarksHistory
      });
      break;
  }
};