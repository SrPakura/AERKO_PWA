// src/modules/training_core/store/index.js

class TrainingStore {
    constructor() {
        this.state = {
            muscles: [],
            exercises: [],
            routines: [],
            draftRoutine: null,
            
            // ESTADO DE SESIÓN ACTIVA (El partido en juego)
            activeSession: null, 
            /* Estructura de activeSession en RAM:
               {
                 id: "uuid...",
                 routineId: "...",
                 startTime: timestamp,
                 exercises: [ 
                    { id: "bench_press", name: "...", sets: [...] } 
                 ],
                 status: 'running' | 'paused'
               }
            */

            // SNAPSHOT (Los Récords actuales para comparar en tiempo real)
            snapshot: {} 
        };
    }

    // --- SETTERS DE DATOS MAESTROS ---
    setMuscles(data) { this.state.muscles = data; }
    setExercises(data) { this.state.exercises = data; }
    setRoutines(data) { this.state.routines = data || []; }
    setDraftRoutine(routine) { this.state.draftRoutine = routine; }

    // --- MÉTODOS DE SESIÓN ---

    // Iniciar el partido
    startSession(sessionObj) {
        this.state.activeSession = sessionObj;
    }

    // Cargar los récords (Snapshot) en RAM
    setSnapshot(data) {
        this.state.snapshot = data || {};
    }

    // Añadir un set a un ejercicio específico en tiempo real
    addSetToSession(exerciseId, set) {
        if (!this.state.activeSession) return;
        
        const exercise = this.state.activeSession.exercises.find(e => e.id === exerciseId);
        if (exercise) {
            if (!exercise.sets) exercise.sets = [];
            exercise.sets.push(set);
        }
    }

    // Actualizar un set existente (para corregir peso/reps)
    updateSetInSession(exerciseId, setIndex, updatedSet) {
        if (!this.state.activeSession) return;

        const exercise = this.state.activeSession.exercises.find(e => e.id === exerciseId);
        if (exercise && exercise.sets[setIndex]) {
            exercise.sets[setIndex] = { ...exercise.sets[setIndex], ...updatedSet };
        }
    }

    // Eliminar un set (por si el usuario lo borra)
    removeSetFromSession(exerciseId, setIndex) {
        if (!this.state.activeSession) return;

        const exercise = this.state.activeSession.exercises.find(e => e.id === exerciseId);
        if (exercise && exercise.sets) {
            exercise.sets.splice(setIndex, 1);
        }
    }

    // Cambiar estado de la sesión (pausar/reanudar)
    updateSessionStatus(status) {
        if (this.state.activeSession) {
            this.state.activeSession.status = status;
        }
    }

    // Terminar el partido
    clearSession() {
        this.state.activeSession = null;
    }
    
    // --- GESTIÓN DEL BORRADOR (DRAFT) --- 
    // Recuperar el borrador actual
    getDraftRoutine() {
        return this.state.draftRoutine;
    }

    // Actualizar nombre del borrador (Input de texto)
    updateDraftName(name) {
        if (this.state.draftRoutine) {
            this.state.draftRoutine.name = name;
        }
    }

    // Añadir ejercicio al borrador (Desde el Selector)
    addExerciseToDraft(exerciseId) {
        if (!this.state.draftRoutine) return;

        // Evitamos duplicados si el ejercicio ya está
        const exists = this.state.draftRoutine.exercises.find(e => e.id === exerciseId);
        
        if (!exists) {
            this.state.draftRoutine.exercises.push({
                id: exerciseId,
                addedAt: Date.now()
            });
        }
    }

    // Quitar ejercicio del borrador (Botón papelera)
    removeExerciseFromDraft(exerciseId) {
        if (!this.state.draftRoutine) return;

        this.state.draftRoutine.exercises = this.state.draftRoutine.exercises.filter(
            ex => ex.id !== exerciseId
        );
    }

    // --- GETTERS ---
    getMuscles() { return this.state.muscles; } 
    getAllExercises() { return this.state.exercises; }
    getExerciseById(id) { return this.state.exercises.find(e => e.id === id); }
    getRoutines() { return this.state.routines; }
    getRoutineById(id) { return this.state.routines.find(r => r.id === id); }
    
    // Getters de Sesión
    getActiveSession() { return this.state.activeSession; }
    getSnapshot() { return this.state.snapshot; }
    
    // Obtener el récord de un ejercicio específico
    getExerciseSnapshot(exerciseId) {
        return this.state.snapshot[exerciseId] || null;
    }
}

export const trainingStore = new TrainingStore();