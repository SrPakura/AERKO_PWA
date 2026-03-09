// src/modules/training_lab/utils/biomechanics.js

// Acabo de terminar de refactorizar esto, y adivindad quien me ha hablado. Exacto, Zaida. 7 amigas tengo, y ella es una. Lo malo, también es mi ex, y encima me habla para decirme que tiene novio. Sinceramente, solo le he podido decir que me alegro, porque no sé que espera que diga o que haga. ¿Me pongo a llorar? ¿Hago una fiesta? Alguna mujer que me explique si es una indirecta o algo. AYUDAAAA

// 🟢 EL DIRECTOR DEPORTIVO: Importamos el registro de ejercicios. 
// Él sabe a quién tenemos que sacar al campo dependiendo de lo que elija el usuario.
import { getExerciseLogic } from './exercises/index.js';

class BiomechanicsUtils {

    // ====================================================================
    // FÓRMULA MÁGICA 1: Interpolación Lineal (Lerp)
    // El toque sutil de Joaquín. Suaviza la transición entre dos puntos.
    // ====================================================================
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // ====================================================================
    // FÓRMULA MÁGICA 1.5: El Amortiguador Premium (EMA)
    // Filtro para quitar los temblores del móvil de gama baja. 
    // Como un buen césped recién regado en Heliópolis: el balón corre fino.
    // ====================================================================
    applyPremiumSmoothing(poseData, alpha = 0.35) {
        if (!poseData || poseData.length === 0) return poseData;
        const smoothed = JSON.parse(JSON.stringify(poseData));
        for (let i = 1; i < smoothed.length; i++) {
            const prev = smoothed[i - 1];
            const curr = smoothed[i];
            for (let j = 0; j < curr.landmarks.length; j++) {
                curr.landmarks[j].x = (curr.landmarks[j].x * alpha) + (prev.landmarks[j].x * (1 - alpha));
                curr.landmarks[j].y = (curr.landmarks[j].y * alpha) + (prev.landmarks[j].y * (1 - alpha));
                curr.landmarks[j].z = (curr.landmarks[j].z * alpha) + (prev.landmarks[j].z * (1 - alpha));
                
                curr.worldLandmarks[j].x = (curr.worldLandmarks[j].x * alpha) + (prev.worldLandmarks[j].x * (1 - alpha));
                curr.worldLandmarks[j].y = (curr.worldLandmarks[j].y * alpha) + (prev.worldLandmarks[j].y * (1 - alpha));
                curr.worldLandmarks[j].z = (curr.worldLandmarks[j].z * alpha) + (prev.worldLandmarks[j].z * (1 - alpha));
            }
        }
        return smoothed;
    }

    // ====================================================================
    // FÓRMULA MÁGICA 2: El Buscador Fluido (Anti-Tirones)
    // Sincroniza los FPS del vídeo con los FPS de la IA para que no haya desdoblamientos.
    // ====================================================================
    getInterpolatedFrame(poseData, targetTime) {
        if (!poseData || poseData.length === 0) return null;
        let prevFrame = poseData[0];
        let nextFrame = poseData[poseData.length - 1];

        for (let i = 0; i < poseData.length - 1; i++) {
            if (targetTime >= poseData[i].time && targetTime <= poseData[i + 1].time) {
                prevFrame = poseData[i];
                nextFrame = poseData[i + 1];
                break;
            }
        }
        
        if (prevFrame === nextFrame || prevFrame.time === nextFrame.time) return prevFrame;
        
        const timeDiff = nextFrame.time - prevFrame.time;
        const factor = (targetTime - prevFrame.time) / timeDiff;

        const interpolatedLandmarks = prevFrame.landmarks.map((pA, i) => {
            const pB = nextFrame.landmarks[i];
            return {
                x: this.lerp(pA.x, pB.x, factor),
                y: this.lerp(pA.y, pB.y, factor),
                z: this.lerp(pA.z, pB.z, factor),
                visibility: this.lerp(pA.visibility, pB.visibility, factor) 
            };
        });

        const interpolatedWorldLandmarks = prevFrame.worldLandmarks.map((pA, i) => {
            const pB = nextFrame.worldLandmarks[i];
            return {
                x: this.lerp(pA.x, pB.x, factor),
                y: this.lerp(pA.y, pB.y, factor),
                z: this.lerp(pA.z, pB.z, factor),
                visibility: this.lerp(pA.visibility, pB.visibility, factor) 
            };
        });

        return { time: targetTime, landmarks: interpolatedLandmarks, worldLandmarks: interpolatedWorldLandmarks };
    }

    // ====================================================================
    // FÓRMULA MÁGICA 3: El Ojeador de Perfil GLOBAL
    // Decide si te estamos grabando el perfil izquierdo o derecho sumando visibilidad.
    // ====================================================================
    getGlobalBestSide(poseData) {
        let totalLeft = 0;
        let totalRight = 0;
        poseData.forEach(frame => {
            totalLeft += frame.landmarks[11].visibility + frame.landmarks[23].visibility + frame.landmarks[25].visibility + frame.landmarks[27].visibility;
            totalRight += frame.landmarks[12].visibility + frame.landmarks[24].visibility + frame.landmarks[26].visibility + frame.landmarks[28].visibility;
        });
        return totalLeft > totalRight ? 'left' : 'right';
    }

    // ====================================================================
    // FÓRMULA MÁGICA 4: El Transportador de Ángulos Clásico (A-B-C)
    // Calcula los grados de los "quesitos" (ej: Rodilla - Cadera - Tobillo).
    // ====================================================================
    calculateAngle(pA, pB, pC) {
        let radians = Math.atan2(pC.y - pB.y, pC.x - pB.x) - Math.atan2(pA.y - pB.y, pA.x - pB.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return Math.round(angle);
    }

    // ====================================================================
    // FÓRMULA MÁGICA 5: La Plomada (Ángulo del Torso)
    // Calcula cuánto te inclinas hacia adelante respecto a una línea recta imaginaria.
    // ====================================================================
    calculateTorsoAngle(pShoulder, pHip) {
        const dx = Math.abs(pShoulder.x - pHip.x);
        const dy = Math.abs(pHip.y - pShoulder.y);
        const radians = Math.atan2(dx, dy); 
        return Math.round(radians * 180.0 / Math.PI);
    }

    // ====================================================================
    // FÓRMULA MÁGICA 6: El Radar del "Sticking Point" 
    // (¡MÓDULO DELEGADO! Aquí empieza la magia del Patrón Estrategia)
    // ====================================================================
    findStickingPoint(poseData, exercise, bestSide) {
        let lowestY = -1;
        let stickingTime = 0;
        
        // 🟢 PREGUNTAMOS AL MÍSTER: "Oye, en este ejercicio, ¿qué articulación miro?"
        const logic = getExerciseLogic(exercise);
        const targetJoint = logic.getStickingJoint(bestSide);

        // Recorremos el vídeo buscando el punto donde esa articulación bajó más.
        poseData.forEach(frame => {
            const joint = frame.landmarks[targetJoint];
            if (joint && joint.y > lowestY) {
                lowestY = joint.y; 
                stickingTime = frame.time;
            }
        });

        return stickingTime;
    }

    // ====================================================================
    // FÓRMULA MÁGICA 7: El Analista de Datos 
    // ====================================================================
    generateReport(poseData, exercise, bestSide) {
        if (!poseData || poseData.length === 0) return null;

        // 1. Buscamos el fotograma donde estabas más abajo físicamente (El pozo / El suelo)
        const bottomTime = this.findStickingPoint(poseData, exercise, bestSide);
        const bottomIndex = poseData.findIndex(f => f.time === bottomTime);
        const bottomFrame = poseData[bottomIndex] || poseData[0];
        
        // Obtenemos la lógica del ejercicio
        const logic = getExerciseLogic(exercise);
        const tempoJointIndex = logic.getTempoJoint(bestSide);
        
        // 🟢 NUEVO: ¿Es un ejercicio tipo "V" o tipo "A"?
        const isPull = logic.startFromBottom || false; 

        let eccentric = "0.0";
        let concentric = "0.0";
        const noiseTolerance = 0.03; // Evita que los temblores corten el conteo

        if (isPull) {
            // --- MODO PESO MUERTO (Forma de "A") ---
            // Fase 1 (Concéntrica): Desde el suelo hacia adelante hasta el pico más ALTO (menor Y)
            let peakIndex = bottomIndex;
            let minY = bottomFrame.landmarks[tempoJointIndex].y;
            for (let i = bottomIndex; i < poseData.length; i++) {
                let y = poseData[i].landmarks[tempoJointIndex].y;
                if (y < minY) { 
                    minY = y; 
                    peakIndex = i; 
                } else if (y > minY + noiseTolerance) {
                    break; // Empezó a bajar de nuevo
                }
            }

            // Fase 2 (Excéntrica): Desde el pico alto hacia adelante hasta volver ABAJO (mayor Y)
            let endDescentIndex = peakIndex;
            let maxY = minY;
            for (let i = peakIndex; i < poseData.length; i++) {
                let y = poseData[i].landmarks[tempoJointIndex].y;
                if (y > maxY) {
                    maxY = y;
                    endDescentIndex = i;
                } else if (y < maxY - noiseTolerance) {
                    break; // Empezó a subir de nuevo
                }
            }

            concentric = ((poseData[peakIndex].time - bottomTime) / 1000).toFixed(1);
            eccentric = ((poseData[endDescentIndex].time - poseData[peakIndex].time) / 1000).toFixed(1);

        } else {
            // --- MODO SENTADILLA / BANCA (Forma de "V") ---
            let startDescentIndex = bottomIndex;
            let endAscentIndex = bottomIndex;
            let peakYBefore = bottomFrame.landmarks[tempoJointIndex].y;
            let peakYAfter = bottomFrame.landmarks[tempoJointIndex].y;
            
            // Buscar hacia ATRÁS (La bajada)
            for (let i = bottomIndex; i >= 0; i--) {
                let y = poseData[i].landmarks[tempoJointIndex].y;
                if (y < peakYBefore) { peakYBefore = y; startDescentIndex = i; } 
                else if (y > peakYBefore + noiseTolerance) break;
            }

            // Buscar hacia ADELANTE (La subida)
            for (let i = bottomIndex; i < poseData.length; i++) {
                let y = poseData[i].landmarks[tempoJointIndex].y;
                if (y < peakYAfter) { peakYAfter = y; endAscentIndex = i; } 
                else if (y > peakYAfter + noiseTolerance) break;
            }

            eccentric = ((bottomTime - poseData[startDescentIndex].time) / 1000).toFixed(1);
            concentric = ((poseData[endAscentIndex].time - bottomTime) / 1000).toFixed(1);
        }
        
        // ====================================================================
        // 🚀 EL VEREDICTO DEL TIEMPO (AHORA CON i18n)
        // ====================================================================
        let tempoText = "Controlado";
        let tempoTextKey = "tempo_controlled";

        if (parseFloat(concentric) < 1.0 && parseFloat(concentric) > 0) {
            tempoText = "Subida Explosiva";
            tempoTextKey = "tempo_explosive";
        }
        if (parseFloat(eccentric) < 1.0) {
            tempoText = "Bajada muy rápida";
            tempoTextKey = "tempo_fast_eccentric";
        }

        // Empaquetamos todo junto para que el VAR (ejercicios) lo use
        const tempoData = { eccentric, concentric, tempoText, tempoTextKey };

        // 3. Delegamos el análisis técnico al ejercicio
        const evaluation = logic.evaluateForm(
            bottomFrame, 
            bestSide, 
            this.calculateAngle.bind(this), 
            this.calculateTorsoAngle.bind(this),
            tempoData,
            poseData
        );

        if (parseFloat(eccentric) < 1.0) { 
            evaluation.score = Math.max(0, evaluation.score - 10); 
        }

        return evaluation;
    }
}

// Exportamos el analista ya configurado
export const biomechanics = new BiomechanicsUtils();