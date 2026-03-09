// src/modules/training_lab/utils/exercises/bench.js

export const BenchLogic = {
    id: 'bench',
    // OMITIMOS startFromBottom: El Press Banca es una "V" (Empieza arriba, baja al pecho, sube).
    // Nuestra obra maestra biomechanics.js lo detectará automáticamente.

    // El punto de control para el Press Banca es la muñeca (el recorrido de la barra)
    getStickingJoint: (bestSide) => bestSide === 'left' ? 15 : 16,
    getTempoJoint: (bestSide) => bestSide === 'left' ? 15 : 16,

    // El VAR del empuje
    evaluateForm: (bottomFrame, bestSide, calcAngle, calcTorsoAngle, tempoData, poseData) => {
        // 1. Alineamos a los jugadores
        const s = bestSide === 'left' ? 11 : 12; // Hombro
        const e = bestSide === 'left' ? 13 : 14; // Codo
        const w = bestSide === 'left' ? 15 : 16; // Muñeca

        let score = 100;

        // ==========================================
        // MÉTRICA 1: RANGO DE MOVIMIENTO (ROM)
        // ==========================================
        // Calculamos el ángulo del codo en el punto más bajo del movimiento.
        // Si llega a 90° o menos, la barra está tocando (o rozando) el pecho.
        const bottomElbowAngle = calcAngle(bottomFrame.landmarks[s], bottomFrame.landmarks[e], bottomFrame.landmarks[w]);
        
        let romTextKey = "";
        if (bottomElbowAngle <= 90) {
            romTextKey = "bench_rom_full";
        } else if (bottomElbowAngle <= 110) {
            romTextKey = "bench_rom_almost";
            score -= 10;
        } else {
            romTextKey = "bench_rom_half";
            score -= 25; // Tarjeta roja directa por hacer ego-lifting
        }

        // ==========================================
        // MÉTRICA 2: ESTABILIDAD ARTICULAR (Antebrazo Vertical)
        // ==========================================
        // En el fondo del movimiento, la muñeca debe estar alineada verticalmente con el codo.
        // Medimos la diferencia de la coordenada X entre el codo y la muñeca.
        const elbowX = bottomFrame.landmarks[e].x;
        const wristX = bottomFrame.landmarks[w].x;
        const forearmDeviation = Math.abs(elbowX - wristX) * 100; 

        let forearmTextKey = "";
        if (forearmDeviation <= 3.0) {
            forearmTextKey = "bench_forearm_perfect";
        } else if (forearmDeviation <= 6.0) {
            forearmTextKey = "bench_forearm_slight";
            score -= 5;
        } else {
            forearmTextKey = "bench_forearm_bad";
            score -= 15;
        }

        // ==========================================
        // MÉTRICA 3: TRAYECTORIA DE LA BARRA (Bar Path)
        // ==========================================
        // Buscamos el fotograma de inicio (bloqueo inicial) justo antes de empezar a bajar.
        let topFrame = poseData[0];
        let highestY = topFrame.landmarks[w].y; // Y=0 es arriba en la pantalla
        
        for (let i = 0; i < poseData.length; i++) {
            if (poseData[i].time >= bottomFrame.time) break; // Solo evaluamos la bajada
            if (poseData[i].landmarks[w].y < highestY) {
                highestY = poseData[i].landmarks[w].y;
                topFrame = poseData[i];
            }
        }

        // Diferencia del eje X entre el bloqueo arriba y el toque en el pecho
        const startWristX = topFrame.landmarks[w].x;
        const bottomWristX = bottomFrame.landmarks[w].x;
        const barPathDiff = Math.abs(startWristX - bottomWristX) * 100;

        let pathTextKey = "";
        // En la banca buscamos una "J" invertida (ligero desplazamiento hacia el pecho)
        if (barPathDiff >= 2.0 && barPathDiff <= 8.0) {
            pathTextKey = "bench_path_optimal"; 
        } else if (barPathDiff < 2.0) {
            pathTextKey = "bench_path_guillotine"; // Bajó demasiado recto hacia los hombros/cuello
            score -= 15;
        } else {
            pathTextKey = "bench_path_sway";
            score -= 10;
        }

        // 📦 EL PAQUETE DE DATOS
        // Estructurado para que la vista pueda usar t(line.key, line.vars)
        const metrics = [
            {
                titleKey: "bench_title_rom",
                lines: [
                    { key: "bench_lbl_elbow", vars: { angle: bottomElbowAngle } },
                    { key: "bench_lbl_verdict", verdictKey: romTextKey }
                ]
            },
            {
                titleKey: "bench_title_stability",
                lines: [
                    { key: "bench_lbl_deviation", vars: { dev: forearmDeviation.toFixed(1) } },
                    { key: "bench_lbl_verdict", verdictKey: forearmTextKey }
                ]
            },
            {
                titleKey: "bench_title_path",
                lines: [
                    { key: "bench_lbl_displacement", vars: { diff: barPathDiff.toFixed(1) } },
                    { key: "bench_lbl_verdict", verdictKey: pathTextKey }
                ]
            },
            {
                titleKey: "bench_title_tempo",
                lines: [
                    { key: "bench_lbl_eccentric", vars: { eccentric: tempoData.eccentric } },
                    { key: "bench_lbl_concentric", vars: { concentric: tempoData.concentric } },
                    { key: "bench_lbl_verdict", verdictKey: tempoData.tempoTextKey, fallback: tempoData.tempoText }
                ]
            }
        ];

        return { score: Math.max(0, score), metrics };
    },

    // El videomarcador para pintar los quesitos
    drawOverlay: (ctx, canvas, wLm, lm, bestSide, drawAngle) => {
        const s = bestSide === 'left' ? 11 : 12; // Hombro
        const e = bestSide === 'left' ? 13 : 14; // Codo
        const w = bestSide === 'left' ? 15 : 16; // Muñeca
        const h = bestSide === 'left' ? 23 : 24; // Cadera (solo para referencia base)

        // 1. Ángulo del codo (Extensión de los tríceps)
        drawAngle(ctx, canvas, wLm[s], wLm[e], wLm[w], lm[s], lm[e], lm[w]);
        
        // 2. Ángulo del hombro (Apertura del brazo respecto al torso)
        drawAngle(ctx, canvas, wLm[h], wLm[s], wLm[e], lm[h], lm[s], lm[e]);
    }
};