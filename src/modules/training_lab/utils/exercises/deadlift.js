// src/modules/training_lab/utils/exercises/deadlift.js

export const DeadliftLogic = {
    id: 'deadlift',
    startFromBottom: true,
    
    // Punto más bajo: La cadera al inicio del levantamiento (donde más baja suele estar)
    getStickingJoint: (bestSide) => bestSide === 'left' ? 23 : 24,

    // Para el tempo, miramos la muñeca, porque nos interesa el movimiento exacto de la barra
    getTempoJoint: (bestSide) => bestSide === 'left' ? 15 : 16,

    // El VAR: Evaluación de la técnica a lo largo de todo el movimiento
    evaluateForm: (bottomFrame, bestSide, calcAngle, calcTorsoAngle, tempoData, poseData) => {
        // 1. Identificamos a los jugadores según el lado bueno
        const s = bestSide === 'left' ? 11 : 12; // Hombro
        const h = bestSide === 'left' ? 23 : 24; // Cadera
        const k = bestSide === 'left' ? 25 : 26; // Rodilla
        const a = bestSide === 'left' ? 27 : 28; // Tobillo
        const w = bestSide === 'left' ? 15 : 16; // Muñeca (Barra)

        let score = 100;

        // 2. Buscar el fotograma del bloqueo (Lockout - Punto más alto de la muñeca)
        let topFrame = bottomFrame;
        let highestY = bottomFrame.landmarks[w].y; // En MediaPipe, Y=0 es arriba
        
        // Si nos han pasado el partido entero (poseData), buscamos el final de la concéntrica
        if (poseData && poseData.length > 0) {
            const bottomTime = bottomFrame.time;
            const concentricFrames = poseData.filter(f => f.time >= bottomTime);
            concentricFrames.forEach(f => {
                if (f.landmarks[w].y < highestY) {
                    highestY = f.landmarks[w].y;
                    topFrame = f;
                }
            });
        }

        // ==========================================
        // MÉTRICA 1: TRAYECTORIA DE LA BARRA
        // ==========================================
        const startBarX = bottomFrame.landmarks[w].x;
        const endBarX = topFrame.landmarks[w].x;
        // Diferencia en porcentaje respecto al ancho de pantalla
        const barDeviation = Math.abs(startBarX - endBarX) * 100; 
        
        let pathTextKey = "";
        if (barDeviation <= 2.5) { 
            pathTextKey = "deadlift_path_perfect"; 
        } else if (barDeviation <= 5.0) { 
            pathTextKey = "deadlift_path_slight"; 
            score -= 5; 
        } else { 
            pathTextKey = "deadlift_path_away"; 
            score -= 15; 
        }

        // ==========================================
        // MÉTRICA 2: BLOQUEO FINAL (LOCKOUT)
        // ==========================================
        const lockoutHipAngle = calcAngle(topFrame.landmarks[s], topFrame.landmarks[h], topFrame.landmarks[k]);
        const lockoutKneeAngle = calcAngle(topFrame.landmarks[h], topFrame.landmarks[k], topFrame.landmarks[a]);
        
        let lockoutTextKey = "";
        if (lockoutHipAngle >= 170 && lockoutKneeAngle >= 170) {
            if (lockoutHipAngle > 190) { // Dependiendo del cálculo, un arco inverso
                lockoutTextKey = "deadlift_lockout_hyperext";
                score -= 10;
            } else {
                lockoutTextKey = "deadlift_lockout_solid";
            }
        } else {
            lockoutTextKey = "deadlift_lockout_incomplete";
            score -= 15;
        }

        // ==========================================
        // MÉTRICA 3: POSICIÓN DE INICIO Y SINCRONIZACIÓN
        // ==========================================
        const startHipAngle = calcAngle(bottomFrame.landmarks[s], bottomFrame.landmarks[h], bottomFrame.landmarks[k]);
        const startTorsoAngle = calcTorsoAngle(bottomFrame.landmarks[s], bottomFrame.landmarks[h]);
        
        let postureTextKey = "deadlift_posture_correct";
        // Si el torso está casi paralelo al suelo (>75º de inclinación) en el inicio
        if (startTorsoAngle > 75) {
            postureTextKey = "deadlift_posture_high";
            score -= 10;
        }

        // 📦 EL PAQUETE DE DATOS: Construimos el informe estructurado para la UI
        const metrics = [
            {
                titleKey: "deadlift_title_path",
                lines: [
                    { key: "deadlift_lbl_deviation", vars: { dev: barDeviation.toFixed(1) } },
                    { key: "deadlift_lbl_verdict", verdictKey: pathTextKey }
                ]
            },
            {
                titleKey: "deadlift_title_lockout",
                lines: [
                    { key: "deadlift_lbl_hip_ext", vars: { angle: lockoutHipAngle } },
                    { key: "deadlift_lbl_knee_ext", vars: { angle: lockoutKneeAngle } },
                    { key: "deadlift_lbl_verdict", verdictKey: lockoutTextKey }
                ]
            },
            {
                titleKey: "deadlift_title_posture",
                lines: [
                    { key: "deadlift_lbl_torso_inc", vars: { angle: startTorsoAngle } },
                    { key: "deadlift_lbl_hip_angle", vars: { angle: startHipAngle } },
                    { key: "deadlift_lbl_verdict", verdictKey: postureTextKey }
                ]
            },
            {
                titleKey: "deadlift_title_tempo",
                lines: [
                    { key: "deadlift_lbl_eccentric", vars: { eccentric: tempoData.eccentric } },
                    { key: "deadlift_lbl_concentric", vars: { concentric: tempoData.concentric } },
                    { key: "deadlift_lbl_verdict", verdictKey: tempoData.tempoTextKey, fallback: tempoData.tempoText }
                ]
            }
        ];

        return { score: Math.max(0, score), metrics };
    },

    // El videomarcador: Pintamos las líneas en el Canvas
    drawOverlay: (ctx, canvas, wLm, lm, bestSide, drawAngle) => {
        const s = bestSide === 'left' ? 11 : 12; // Hombro
        const h = bestSide === 'left' ? 23 : 24; // Cadera
        const k = bestSide === 'left' ? 25 : 26; // Rodilla
        const a = bestSide === 'left' ? 27 : 28; // Tobillo

        // Ángulo de la bisagra de cadera
        drawAngle(ctx, canvas, wLm[s], wLm[h], wLm[k], lm[s], lm[h], lm[k]);
        
        // Ángulo de la rodilla (empuje de piernas)
        drawAngle(ctx, canvas, wLm[h], wLm[k], wLm[a], lm[h], lm[k], lm[a]);
        
        // La plomada (Inclinación del torso respecto a la vertical imaginaria)
        drawAngle(ctx, canvas, wLm[s], wLm[h], null, lm[s], lm[h], null, true);
    }
};