// src/modules/training_core/services/analysis.service.js
import { db } from '../../../core/db/index.js';
import { trainingStore } from '../store/index.js'; // 🟢⚪ AÑADIMOS ESTO PARA LEER LA RAM

const VAULT_NAME = 'training_vault';
const SESSIONS_KEY = 'training_sessions';
const EXERCISES_KEY = 'master_exercises'; // Clave para obtener los JSON de ejercicios

class AnalysisService {
    
    // ========================================================================
    // --- 1. CÁLCULO DE PERIODIZACIÓN (BRÚJULA DEL MESOCICLO) ---
    // ========================================================================
    
    /**
     * Devuelve el RIR objetivo dependiendo de la semana actual y la duración del mesociclo.
     */
    getTargetRIR(currentWeek, totalWeeks) {
        if (currentWeek === 1) return 3; // Semana de Intro
        if (currentWeek >= totalWeeks) return 4; // Semana de Descarga (Deload)
        if (currentWeek === totalWeeks - 1) return 0; // Semana de Pico (Peak)

        // Interpolación para semanas de Acumulación (Entre la Intro y el Pico)
        const weeksToProgress = (totalWeeks - 1) - 1; 
        const rirDropPerWeek = 3 / weeksToProgress; 
        
        // Redondeamos a 1 decimal para que sea manejable (ej: 2.5, 1.5...)
        const rawRir = 3 - (rirDropPerWeek * (currentWeek - 1));
        return Math.round(rawRir * 10) / 10;
    }

    // ========================================================================
    // --- 2. EXTRACCIÓN HISTÓRICA (VIAJE EN EL TIEMPO) ---
    // ========================================================================
    
    /**
     * Busca en la base de datos la última vez que el usuario hizo este ejercicio.
     */
    async _getLastSessionSets(exerciseId) {
        const record = await db.get(VAULT_NAME, SESSIONS_KEY);
        if (!record || !record.data || record.data.length === 0) return null;

        const sessions = record.data;
        // Recorremos el historial de sesiones DE MÁS RECIENTE A MÁS ANTIGUA
        for (let i = sessions.length - 1; i >= 0; i--) {
            const session = sessions[i];
            const exercise = session.exercises.find(ex => ex.id === exerciseId);
            if (exercise && exercise.sets && exercise.sets.length > 0) {
                return exercise.sets; // Encontramos la última vez que lo hizo
            }
        }
        return null; // Nunca ha hecho este ejercicio
    }

    /**
     * Limpia la basura (calentamientos) y detecta la serie principal (Top Set).
     */
    _extractEffectiveSets(sets) {
        let topSetIndex = 0;
        let maxE1RM = 0;

        // 1. Buscamos el Top Set usando la fórmula e1RM avanzada (Epley con RIR)
        sets.forEach((set, index) => {
            const rirToUse = set.rir !== null ? set.rir : 0;
            // Fórmula: Peso * (1 + ((Repeticiones + RIR) / 30))
            const e1RM = set.kg * (1 + ((set.reps + rirToUse) / 30));
            
            if (e1RM > maxE1RM) {
                maxE1RM = e1RM;
                topSetIndex = index;
            }
        });

        const topSet = sets[topSetIndex];

        // 2. Filtramos calentamientos (< 65% del peso del Top Set y hechos antes)
        const effectiveSets = sets.filter((set, index) => {
            if (index < topSetIndex && set.kg < (topSet.kg * 0.65)) {
                return false; // Es un calentamiento evidente, lo ignoramos
            }
            return true;
        });

        return { topSet, effectiveSets };
    }

    // ========================================================================
    // --- 3. HELPERS MATEMÁTICOS ---
    // ========================================================================

    /**
     * Redondea un peso al disco de 1.25kg más cercano (salto de 2.5kg total por barra).
     */
    _roundWeight(weight) {
        return Math.round(weight / 2.5) * 2.5;
    }

    // ========================================================================
    // --- 4. MOTOR PRINCIPAL: GENERADOR DE SERIES (PROGRESIÓN) ---
    // ========================================================================

    /**
     * Genera la recomendación exacta de series, pesos y repes para HOY.
     */
    async generateSuggestion(exerciseId, currentWeek, totalWeeks) {
        console.log(`%c[ANALYSIS ENGINE] Booting prediction for Exercise: ${exerciseId}...`, 'color: #CCFF00');

        const pastSets = await this._getLastSessionSets(exerciseId);
        if (!pastSets) {
            console.log('[ANALYSIS ENGINE] No history found. Manual input required.');
            return null; // Caso Edge 1: Nuevo Usuario
        }

        const { topSet, effectiveSets } = this._extractEffectiveSets(pastSets);
        const targetRIR = this.getTargetRIR(currentWeek, totalWeeks);

        // --- PASO 5 (EXCEPCIÓN): SEMANA DE DESCARGA (DELOAD) ---
        if (targetRIR === 4) {
            console.log('%c[ANALYSIS ENGINE] Deload Protocol Activated. Cutting volume & intensity.', 'color: #00bcd4');
            const deloadSets = [];
            // Quitamos 1 serie de volumen por defecto (fatigue management)
            const numSets = Math.max(1, effectiveSets.length - 1); 
            
            for(let i = 0; i < numSets; i++) {
                const oldSet = effectiveSets[i];
                deloadSets.push({
                    kg: this._roundWeight(oldSet.kg * 0.90), // Reducimos peso un 10%
                    reps: oldSet.reps, // Mismas repes
                    rir: 4 // Mucho margen
                });
            }
            return deloadSets;
        }

        // --- PASO 3: NUEVO MOTOR (Proyección de la Serie 1) ---
        const oldRir = topSet.rir !== null ? topSet.rir : 2; // Si no apuntó RIR, asumimos 2 por defecto
        const rirDiff = oldRir - targetRIR; // Diferencia de esfuerzo
        
        // Calculamos el peso base necesario para cumplir el nuevo RIR manteniendo repeticiones
        let newTopKg = this._roundWeight(topSet.kg * (1 + (rirDiff * 0.025)));
        let newTopReps = topSet.reps; 

        // 🟢⚪ LA MAGIA: ADAPTACIÓN BIOMECÁNICA AL FOCO DEL MESOCICLO
        const meso = trainingStore.state.mesocycle;
        const focus = meso ? meso.focus.toLowerCase() : 'general';

        // Calculamos el 1RM virtual con el peso base para poder pivotar a otras repeticiones
        const virtual1RM = newTopKg * (1 + (newTopReps / 30));

        if (focus === 'fuerza' && newTopReps > 5) {
            console.log('[ANALYSIS ENGINE] Focus: Fuerza. Transmutando repes a rango pesado (4).');
            newTopReps = 4;
            newTopKg = this._roundWeight(virtual1RM / (1 + (newTopReps / 30)));
        } 
        else if (focus === 'hipertrofia' && (newTopReps < 8 || newTopReps > 12)) {
            console.log('[ANALYSIS ENGINE] Focus: Hipertrofia. Transmutando repes a rango óptimo (10).');
            newTopReps = 10;
            newTopKg = this._roundWeight(virtual1RM / (1 + (newTopReps / 30)));
        }
        else if (focus === 'resistencia' && newTopReps < 15) {
            console.log('[ANALYSIS ENGINE] Focus: Resistencia. Transmutando repes a rango alto (15).');
            newTopReps = 15;
            newTopKg = this._roundWeight(virtual1RM / (1 + (newTopReps / 30)));
        }

        // --- PASO 4: CLONACIÓN DE PATRONES DE FATIGA ---
        const suggestedSets = [];

        effectiveSets.forEach((oldSet) => {
            // Si es la Serie Principal (Top Set)
            if (oldSet === topSet) {
                suggestedSets.push({
                    kg: newTopKg,
                    reps: newTopReps,
                    rir: targetRIR
                });
                return;
            }

            // Si es una Serie Secundaria, evaluamos su patrón contra el Top Set antiguo
            if (oldSet.kg === topSet.kg) {
                // PATRÓN: STRAIGHT SETS (Mantuvo el peso, así que se fatigó en repes)
                const repsRatio = oldSet.reps / topSet.reps; // Ej: Cayó de 10 a 8 (-20%)
                suggestedSets.push({
                    kg: newTopKg, // Le sugerimos mantener el nuevo peso alto
                    reps: Math.max(1, Math.round(newTopReps * repsRatio)), // Proyectamos la misma caída de repes
                    rir: targetRIR
                });
            } else {
                // PATRÓN: PIRÁMIDE INVERTIDA (Bajó el peso para poder mantener repes)
                const kgRatio = oldSet.kg / topSet.kg; // Ej: Bajó de 100kg a 90kg (-10%)
                suggestedSets.push({
                    kg: this._roundWeight(newTopKg * kgRatio), // Sugerimos que baje el peso en proporción
                    reps: oldSet.reps, // Le pedimos que haga las mismas repes originales
                    rir: targetRIR
                });
            }
        });

        console.log('[ANALYSIS ENGINE] Prediction successful:', suggestedSets);
        return suggestedSets;
    }

    // ========================================================================
    // --- 5. ANÁLISIS DE VOLUMEN Y DESCOMPENSACIÓN (DASHBOARD) ---
    // ========================================================================

    /**
     * Calcula el volumen semanal y detecta descompensaciones analizando el historial y los JSONs maestros.
     * @param {number} startDate Timestamp de inicio (Ej: Lunes)
     * @param {number} endDate Timestamp de fin (Ej: Domingo)
     */
    async calculateWeeklyVolume(startDate, endDate) {
        console.log(`%c[ANALYSIS ENGINE] Calculating Volume from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`, 'color: #CCFF00');

        // 1. Obtener Sesiones de la BD
        const sessionsRecord = await db.get(VAULT_NAME, SESSIONS_KEY);
        if (!sessionsRecord || !sessionsRecord.data) return null;

        // Filtrar sesiones por el rango de fechas solicitado
        const validSessions = sessionsRecord.data.filter(session => 
            session.timestamp >= startDate && session.timestamp <= endDate
        );

        if (validSessions.length === 0) return null;

        // 2. Obtener los Ejercicios Maestros (Para los coeficientes de activación)
        const masterExercisesRecord = await db.get(VAULT_NAME, EXERCISES_KEY);
        const masterExercises = masterExercisesRecord && masterExercisesRecord.data ? masterExercisesRecord.data : [];

        // 3. Obtener Límites Musculares (Hacemos fetch al JSON local)
        let musclesData = [];
        try {
            const response = await fetch('/src/assets/data/muscles.json');
            musclesData = await response.json();
        } catch (error) {
            console.error('[ANALYSIS ENGINE] Error loading muscles.json', error);
            return null;
        }

        // Estructura para agrupar el volumen calculado
        // { "pectoralis_major": { total_volume: 0, heads: { "sternocostal_head": 12, ... } } }
        const volumeTracker = {};

        // 4. ITERAR SOBRE LAS SESIONES Y SERIES (LA CALCULADORA)
        validSessions.forEach(session => {
            session.exercises.forEach(ex => {
                // Buscamos el ejercicio en la base maestra
                const masterEx = masterExercises.find(m => m.id === ex.id);
                if (!masterEx || !masterEx.impact || !masterEx.impact.activation) return; // Si no hay datos, lo saltamos

                // Usamos nuestra función interna para limpiar calentamientos de este ejercicio
                const { effectiveSets } = this._extractEffectiveSets(ex.sets);
                const validSetCount = effectiveSets.length;

                if (validSetCount === 0) return;

                const activations = masterEx.impact.activation;
                const targetMuscles = masterEx.impact.targets || [];

                // Repartimos el volumen a los músculos afectados
                targetMuscles.forEach(muscleId => {
                    if (!volumeTracker[muscleId]) {
                        volumeTracker[muscleId] = { total_volume: 0, heads: {} };
                    }

                    // Calculamos el volumen global del músculo padre (El truco del MAX)
                    const maxActivation = Math.max(...Object.values(activations));
                    volumeTracker[muscleId].total_volume += (validSetCount * maxActivation);

                    // Calculamos el volumen fraccionado de cada cabeza individual
                    Object.entries(activations).forEach(([headId, coefficient]) => {
                        if (!volumeTracker[muscleId].heads[headId]) {
                            volumeTracker[muscleId].heads[headId] = 0;
                        }
                        volumeTracker[muscleId].heads[headId] += (validSetCount * coefficient);
                    });
                });
            });
        });

        // 5. EVALUACIÓN Y SEMÁFOROS (CRUZAR CON MUSCLES.JSON)
        const finalReport = {
            alerts: [],      // Array con las alertas urgentes (rojo/naranja)
            optimal: []      // Array con los músculos en buen estado (verde/gris)
        };

        const TOLERANCE = 0.15; // 15% de margen para descompensaciones

        Object.entries(volumeTracker).forEach(([muscleId, data]) => {
            const muscleDef = musclesData.find(m => m.id === muscleId);
            if (!muscleDef) return;

            const totalVol = data.total_volume;
            let status = 'GREY'; // Mantenimiento (Por defecto)
            
            // Evaluamos el Volumen Total contra MV, MEV, MAV, MRV
            const limits = muscleDef.weekly_limits;
            let isOverload = false;

            if (totalVol >= limits.mv && totalVol < limits.mav) status = 'LIGHT_GREEN'; // MEV
            if (totalVol >= limits.mav && totalVol <= limits.mrv) status = 'ACID_GREEN'; // MAV (Óptimo)
            if (totalVol > limits.mrv) {
                status = 'RED'; // MRV (Peligro)
                isOverload = true;
            }

            // Evaluamos las descompensaciones de las cabezas (La Pizza)
            let headAlerts = [];
            let totalHeadVolume = 0;
            
            Object.values(data.heads).forEach(v => totalHeadVolume += v);

            if (totalHeadVolume > 0 && muscleDef.heads && muscleDef.heads.length > 0) {
                muscleDef.heads.forEach(headDef => {
                    const realVolume = data.heads[headDef.id] || 0;
                    const realRatio = realVolume / totalHeadVolume;
                    const idealRatio = headDef.ideal_ratio || 0;

                    if ((idealRatio - realRatio) > TOLERANCE) {
                        headAlerts.push({
                            type: 'under',
                            name: headDef.name.es, 
                            real: Math.round(realRatio * 100),
                            ideal: Math.round(idealRatio * 100)
                        });
                    } else if ((realRatio - idealRatio) > TOLERANCE) {
                        headAlerts.push({
                            type: 'over',
                            name: headDef.name.es,
                            real: Math.round(realRatio * 100),
                            ideal: Math.round(idealRatio * 100)
                        });
                    }
                }); // <--- AQUÍ: Cerramos el forEach de las cabezas
            }

            // Construimos el objeto de resultado para la UI
            const resultObj = {
                muscleId: muscleId,
                muscleName: muscleDef.name.es,
                volume: Math.round(totalVol * 10) / 10, 
                status: status,
                headAlerts: headAlerts
            };

            if (isOverload || headAlerts.length > 0) {
                finalReport.alerts.push(resultObj);
            } else {
                finalReport.optimal.push(resultObj);
            }
        });

        console.log('[ANALYSIS ENGINE] Weekly Volume Report generated:', finalReport);
        return finalReport;
    }
}

export const analysisService = new AnalysisService();