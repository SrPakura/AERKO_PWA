import { db } from '../../../core/db/index.js';
import { trainingStore } from '../store/index.js';

const MUSCLES_PATH = '/src/assets/data/muscles.json';
const EXERCISES_PATH = '/src/assets/data/exercises.json';

const VAULT_NAME = 'training_vault';
const ROUTINES_KEY = 'user_routines';
const EXERCISES_KEY = 'master_exercises'; // <--- Nueva clave para la DB

class TrainingService {
    constructor() {
        this.isReady = false;
    }

    async init() {
        if (this.isReady) return;
        console.log('[TRAINING] Initializing Core (Local First Mode)...');

        try {
            // 1. Cargar Datos y comprobar DB (AÑADIMOS LA BÚSQUEDA DEL MESOCICLO)
            const [musclesData, exercisesRecord, routinesRecord, mesocycleRecord] = await Promise.all([
                this._fetchJson(MUSCLES_PATH),
                db.get(VAULT_NAME, EXERCISES_KEY),
                db.get(VAULT_NAME, ROUTINES_KEY),
                db.get('public_store', 'current_mesocycle') // <-- Buscamos el mesociclo
            ]);

            // 2. Configurar Músculos
            trainingStore.setMuscles(musclesData);

            // 3. Lógica de "Siembra" (Seeding) para Ejercicios
            let finalExercises = [];

            if (!exercisesRecord) {
                console.warn('[TRAINING] DB vacía. Realizando volcado inicial desde JSON...');
                const jsonExercises = await this._fetchJson(EXERCISES_PATH);
                finalExercises = jsonExercises;
                await db.put(VAULT_NAME, { id: EXERCISES_KEY, data: finalExercises });
            } else {
                console.log('[TRAINING] Cargando ejercicios desde almacenamiento local (User Data).');
                finalExercises = exercisesRecord.data;
            }

            trainingStore.setExercises(finalExercises);

            // 4. Configurar Rutinas
            if (routinesRecord) {
                trainingStore.setRoutines(routinesRecord.data);
            }

            // 5. 🟢⚪ MOTOR DEL TIEMPO: CALCULAR LA SEMANA DEL MESOCICLO
            if (mesocycleRecord && mesocycleRecord.data) {
                const meso = mesocycleRecord.data;
                const now = Date.now();
                const msPerWeek = 7 * 24 * 60 * 60 * 1000; // Milisegundos en 7 días
                
                // Calculamos cuántas semanas enteras han pasado desde la fecha de inicio
                const weeksPassed = Math.floor((now - meso.startDate) / msPerWeek);
                meso.currentWeek = 1 + weeksPassed; // Semana 1 + las que hayan pasado

                // Si ya hemos superado las semanas totales, lo borramos (fin de ciclo)
                if (meso.currentWeek > meso.totalWeeks) {
                    console.log('[TRAINING] Mesociclo terminado. Limpiando...');
                    await db.delete('public_store', 'current_mesocycle');
                    trainingStore.state.mesocycle = null;
                } else {
                    console.log(`[TRAINING] Mesociclo activo: Semana ${meso.currentWeek} de ${meso.totalWeeks}`);
                    // Lo actualizamos en la DB (por si ha cambiado de semana) y en la RAM
                    await db.put('public_store', { id: 'current_mesocycle', data: meso });
                    trainingStore.state.mesocycle = meso;
                }
            }

            this.isReady = true;
            console.log(`[TRAINING] Ready. ${finalExercises.length} exercises available.`);

        } catch (error) {
            console.error('[TRAINING] Init failed:', error);
        }
    }

    // --- GESTIÓN DE EJERCICIOS (CRUD MAESTRO) ---

    /**
     * Crea o Edita un ejercicio en la Base de Datos Maestra
     * @param {Object} exercise - El objeto ejercicio completo
     */
    async saveExercise(exercise) {
        const currentExercises = trainingStore.getAllExercises();
        const index = currentExercises.findIndex(e => e.id === exercise.id);
        
        let newExercises = [...currentExercises];

        if (index >= 0) {
            // Edición: Sobrescribimos el existente
            newExercises[index] = exercise;
            console.log(`[TRAINING] Exercise edited: ${exercise.name}`);
        } else {
            // Creación: Añadimos al final
            newExercises.push(exercise);
            console.log(`[TRAINING] New exercise created: ${exercise.name}`);
        }

        // 1. Actualizar RAM (Store)
        trainingStore.setExercises(newExercises);
        
        // 2. Actualizar DB (Persistencia)
        await db.put(VAULT_NAME, { id: EXERCISES_KEY, data: newExercises });
    }

    /**
     * Elimina un ejercicio de la Base de Datos Maestra
     * @param {string} id - ID del ejercicio
     */
    async deleteExercise(id) {
        const currentExercises = trainingStore.getAllExercises();
        const newExercises = currentExercises.filter(e => e.id !== id);

        // 1. Actualizar RAM
        trainingStore.setExercises(newExercises);

        // 2. Actualizar DB
        await db.put(VAULT_NAME, { id: EXERCISES_KEY, data: newExercises });
        console.log(`[TRAINING] Exercise deleted: ${id}`);
    }


    // --- GESTIÓN DE RUTINAS ---

    async saveRoutine(routine) {
        const currentRoutines = trainingStore.getRoutines();
        
        const index = currentRoutines.findIndex(r => r.id === routine.id);
        let newRoutines = [...currentRoutines];

        if (index >= 0) {
            newRoutines[index] = routine;
        } else {
            newRoutines.push(routine);
        }

        trainingStore.setRoutines(newRoutines);
        await db.put(VAULT_NAME, { id: ROUTINES_KEY, data: newRoutines });
        console.log('[TRAINING] Routine saved.');
    }

    async deleteRoutine(id) {
        const currentRoutines = trainingStore.getRoutines().filter(r => r.id !== id);
        trainingStore.setRoutines(currentRoutines);
        await db.put(VAULT_NAME, { id: ROUTINES_KEY, data: currentRoutines });
    }
    
    async addExerciseToRoutine(routineId, exerciseId) {
        const routines = trainingStore.getRoutines();
        const routine = routines.find(r => r.id === routineId);

        if (!routine) {
            console.error(`[TRAINING] Error: Routine ${routineId} not found.`);
            return;
        }

        const newExerciseRef = {
            id: exerciseId,
            addedAt: Date.now() 
        };

        const updatedRoutine = {
            ...routine,
            exercises: [...(routine.exercises || []), newExerciseRef]
        };

        await this.saveRoutine(updatedRoutine);
        console.log(`[TRAINING] Exercise ${exerciseId} added to routine ${routine.name}`);
    }

    // --- HELPERS ---
    async _fetchJson(path) {
        const res = await fetch(path);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        return await res.json();
    }
}

export const trainingService = new TrainingService();