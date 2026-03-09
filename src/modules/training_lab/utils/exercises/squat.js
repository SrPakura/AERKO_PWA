// src/modules/training_lab/utils/exercises/squat.js

// import { i18nService } from '../../../../core/i18n/i18n.service.js'; Al final no hace falta, Gemini me ha llamado inutil por intentar esto. ¿Qué más puedo decir? Yo creo que podemos terminar diciendo que Laufey es lo que escucha un verdadero gigachad, haruka cakamura es el mejor compositor del mundo y me suda los cojones, que morat>>>morad, y no sé que más decir. La soundtrack de minecraft es lo que escucho para dormir.

export const SquatLogic = {
    id: 'squat',
    
    // 1. ¿Qué articulación marca el punto más bajo del ejercicio? (La cadera)
    getStickingJoint: (bestSide) => bestSide === 'left' ? 23 : 24,

    // 🟢 NUEVO: ¿Qué articulación miramos para el tempo? (La cadera)
    getTempoJoint: (bestSide) => bestSide === 'left' ? 23 : 24,

    // 2. El VAR: Evaluación de la técnica
    evaluateForm: (bottomFrame, bestSide, calcAngle, calcTorsoAngle, tempoData) => {
        const s = bestSide === 'left' ? 11 : 12; // Hombro
        const h = bestSide === 'left' ? 23 : 24; // Cadera
        const k = bestSide === 'left' ? 25 : 26; // Rodilla
        const a = bestSide === 'left' ? 27 : 28; // Tobillo

        let score = 100;
        const romAngle = calcAngle(bottomFrame.landmarks[h], bottomFrame.landmarks[k], bottomFrame.landmarks[a]);
        const torsoAngle = calcTorsoAngle(bottomFrame.landmarks[s], bottomFrame.landmarks[h]);

        let depthTextKey = ""; 
        let torsoTextKey = "";

        // Profundidad
        if (romAngle <= 90) { 
            depthTextKey = 'squat_depth_atg'; 
        } else if (romAngle <= 105) { 
            depthTextKey = 'squat_depth_parallel'; 
            score -= 5; 
        } else { 
            depthTextKey = 'squat_depth_half'; 
            score -= 20; 
        }

        // Torso
        if (torsoAngle <= 45) { 
            torsoTextKey = 'squat_torso_exc'; 
        } else if (torsoAngle <= 60) { 
            torsoTextKey = 'squat_torso_ok'; 
            score -= 10; 
        } else { 
            torsoTextKey = 'squat_torso_bad'; 
            score -= 25; 
        }

        // 📦 EL PAQUETE DE DATOS ESTRUCTURADO
        // Devolvemos las keys para que la Vista (lab-results.js) se encargue de la magia.
        // Usamos labelKey para la etiqueta, y valueKey o value dependiendo de si hay que traducirlo o no.
        const metrics = [
            {
                titleKey: 'squat_title_rom',
                lines: [
                    { labelKey: 'squat_lbl_knee', value: `${romAngle}°` },
                    { labelKey: 'squat_lbl_verdict', valueKey: depthTextKey }
                ]
            },
            {
                titleKey: 'squat_title_posture',
                lines: [
                    { labelKey: 'squat_lbl_torso_inc', value: `${torsoAngle}°` },
                    { labelKey: 'squat_lbl_verdict', valueKey: torsoTextKey }
                ]
            },
            {
                titleKey: 'squat_title_tempo',
                lines: [
                    { labelKey: 'squat_lbl_eccentric', value: `${tempoData.eccentric}s` },
                    { labelKey: 'squat_lbl_concentric', value: `${tempoData.concentric}s` },
                    // NOTA: temporalmente usamos value o valueKey para el tempo, 
                    // ya que luego refactorizaremos biomechanics.js para que devuelva una key
                    { labelKey: 'squat_lbl_verdict', valueKey: tempoData.tempoTextKey, value: tempoData.tempoText }
                ]
            }
        ];

        return { score, metrics };
    },

    // 3. Pintar en el Canvas (Los quesitos)
    drawOverlay: (ctx, canvas, wLm, lm, bestSide, drawAngle) => {
        const s = bestSide === 'left' ? 11 : 12;
        const h = bestSide === 'left' ? 23 : 24;
        const k = bestSide === 'left' ? 25 : 26;
        const a = bestSide === 'left' ? 27 : 28;
        const f = bestSide === 'left' ? 31 : 32;

        drawAngle(ctx, canvas, wLm[h], wLm[k], wLm[a], lm[h], lm[k], lm[a]); // Rodilla
        drawAngle(ctx, canvas, wLm[s], wLm[h], wLm[k], lm[s], lm[h], lm[k]); // Cadera
        drawAngle(ctx, canvas, wLm[k], wLm[a], wLm[f], lm[k], lm[a], lm[f]); // Tobillo
        drawAngle(ctx, canvas, wLm[s], wLm[h], null, lm[s], lm[h], null, true); // Torso
    }
};