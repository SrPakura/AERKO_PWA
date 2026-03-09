// src/modules/training_core/services/session.service.js
import { db } from '../../../core/db/index.js'; // [cite: 23]
import { trainingStore } from '../store/index.js';

const VAULT_NAME = 'training_vault';
const SESSIONS_KEY = 'training_sessions';     // Historial completo
const SNAPSHOT_KEY = 'exercise_snapshot';     // Foto fija de mejores marcas

class SessionService {

    // --- INICIO DEL PARTIDO ---

    /**
     * Arranca una sesión basada en una rutina.
     * @param {string} routineId 
     */
    async startSession(routineId) {
        console.log(`[SESSION] Warming up for routine: ${routineId}`);

        // 1. Recuperar la rutina base
        const routine = trainingStore.getRoutineById(routineId);
        if (!routine) throw new Error("Rutina no encontrada en RAM");

        // 2. Cargar Snapshot (Récords) de la DB si no está en RAM
        let snapshot = trainingStore.getSnapshot();
        if (Object.keys(snapshot).length === 0) {
            const record = await db.get(VAULT_NAME, SNAPSHOT_KEY);
            snapshot = record ? record.data : {};
            trainingStore.setSnapshot(snapshot);
        }

        // 3. "Hidratar" los ejercicios (Convertir IDs en objetos usables)
        // Esto permite mostrar el nombre y músculos durante el entreno
        const hydratedExercises = routine.exercises.map(simpleEx => {
            const masterEx = trainingStore.getExerciseById(simpleEx.id);
            return {
                id: simpleEx.id,
                name: masterEx ? (masterEx.name.es || masterEx.name) : null,
                nameKey: masterEx ? null : "core_fallback_exercise",
                target: masterEx ? masterEx.impact : {}, // Para análisis biomecánico futuro
                sets: [] // Array vacío para empezar a meter series
            };
        });

        // 4. Crear el Objeto de Sesión
        const newSession = {
            id: crypto.randomUUID(), // ID único de sesión
            routineId: routineId,
            routineName: routine.name,
            startTime: Date.now(),
            exercises: hydratedExercises,
            status: 'active'
        };

        // 5. Guardar en Store (RAM)
        trainingStore.startSession(newSession);
        console.log('[SESSION] Whistle blown! Match started.', newSession);
        return newSession;
    }

    // --- DURANTE EL PARTIDO ---

    /**
     * Registra una serie completada.
     * @param {string} exerciseId 
     * @param {number} kg 
     * @param {number} reps 
     * @param {number} rir 
     */
    logSet(exerciseId, kg, reps, rir) {
        const session = trainingStore.getActiveSession();
        if (!session) {
            console.error("No hay sesión activa");
            return;
        }

        const set = {
            kg: parseFloat(kg),
            reps: parseInt(reps),
            rir: parseInt(rir),
            timestamp: Date.now()
        };

        // 1. Actualizamos el estado en RAM
        trainingStore.addSetToSession(exerciseId, set);

        // 2. Comprobación de Récord en Tiempo Real (Gamificación)
        // Calculamos e1RM: Peso * (1 + (0.0333 * Reps))
        const e1RM = set.kg * (1 + (0.0333 * set.reps));
        const previousBest = trainingStore.getExerciseSnapshot(exerciseId);

        let isRecord = false;
        if (previousBest) {
            const prevE1RM = previousBest.lastKg * (1 + (0.0333 * previousBest.lastReps));
            if (e1RM > prevE1RM) isRecord = true;
        } else {
            isRecord = true; // Primer registro es récord siempre
        }

        if (isRecord) {
            console.log(`%c[SESSION] 🏆 NEW RECORD! e1RM: ${e1RM.toFixed(1)}kg`, 'color: #CCFF00');
            // Aquí podrías emitir un evento al Bus para lanzar confetti
        }
    }

    // --- FINAL DEL PARTIDO ---

    /**
     * Termina la sesión, guarda historial y actualiza snapshot.
     */
    async finishSession() {
        const session = trainingStore.getActiveSession();
        if (!session) return;

        session.endTime = Date.now();
        session.duration = Math.floor((session.endTime - session.startTime) / 1000); // Segundos
        session.status = 'completed';

        console.log('[SESSION] Final whistle. Processing stats...');

        try {
            // A. GUARDAR HISTORIAL (Append only)
            // Leemos el array actual, añadimos y guardamos
            const historyRecord = await db.get(VAULT_NAME, SESSIONS_KEY);
            const history = historyRecord ? historyRecord.data : [];
            
            // Limpiamos la sesión para guardar solo lo necesario (Data Contract)
            const cleanSession = {
                id: session.id,
                timestamp: session.endTime,
                routineId: session.routineId,
                duration: session.duration,
                exercises: session.exercises.map(ex => ({
                    id: ex.id,
                    sets: ex.sets // Guardamos los sets tal cual
                })).filter(ex => ex.sets.length > 0) // Solo ejercicios que realmente se hicieron
            };

            history.push(cleanSession);
            await db.put(VAULT_NAME, { id: SESSIONS_KEY, data: history });

            // B. ACTUALIZAR SNAPSHOT (La mejor marca)
            // Iteramos sobre lo que acabamos de entrenar
            const currentSnapshot = trainingStore.getSnapshot();
            let snapshotUpdated = false;

            session.exercises.forEach(ex => {
                if (ex.sets.length === 0) return;

                // Buscamos el mejor set de HOY basado en e1RM
                let bestSetToday = null;
                let maxE1RM = 0;

                ex.sets.forEach(set => {
                    const val = set.kg * (1 + (0.0333 * set.reps));
                    if (val > maxE1RM) {
                        maxE1RM = val;
                        bestSetToday = set;
                    }
                });

                // Comparamos con el histórico
                const prevStats = currentSnapshot[ex.id];
                let isNewRecord = false;

                if (!prevStats) {
                    isNewRecord = true;
                } else {
                    const prevMax = prevStats.lastKg * (1 + (0.0333 * prevStats.lastReps));
                    if (maxE1RM > prevMax) isNewRecord = true;
                }

                // Si es récord (o no existía), actualizamos la Foto Fija
                if (isNewRecord && bestSetToday) {
                    currentSnapshot[ex.id] = {
                        lastKg: bestSetToday.kg,
                        lastReps: bestSetToday.reps,
                        lastRir: bestSetToday.rir,
                        timestamp: Date.now() // Importante para detectar degradación
                    };
                    snapshotUpdated = true;
                }
            });

            if (snapshotUpdated) {
                await db.put(VAULT_NAME, { id: SNAPSHOT_KEY, data: currentSnapshot });
                trainingStore.setSnapshot(currentSnapshot); // Actualizamos RAM también
            }

            // C. LIMPIEZA
            trainingStore.clearSession();
            console.log('[SESSION] Stats saved. Shower time.');
            return true;

        } catch (error) {
            console.error('[SESSION] Critical Error saving session:', error);
            throw error;
        }
    }
    
    // Método para cancelar/abortar (Borrar de RAM sin guardar)
    cancelSession() {
        trainingStore.clearSession();
        console.log('[SESSION] Match cancelled.');
    }
}

export const sessionService = new SessionService();