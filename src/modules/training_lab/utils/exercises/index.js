// src/modules/training_lab/utils/exercises/index.js

import { SquatLogic } from './squat.js';
import { BenchLogic } from './bench.js';
import { DeadliftLogic } from './deadlift.js';

// El registro oficial de ejercicios soportados por el laboratorio
const EXERCISE_REGISTRY = {
    'squat': SquatLogic,
    'bench': BenchLogic,
    'deadlift': DeadliftLogic
};

/**
 * Devuelve la lógica completa (Estrategia) para un ejercicio concreto.
 * @param {string} exerciseId - Ej: 'squat'
 */
export const getExerciseLogic = (exerciseId) => {
    // Si buscamos algo que no existe, devolvemos sentadilla por defecto para que no rompa la app
    return EXERCISE_REGISTRY[exerciseId] || EXERCISE_REGISTRY['squat'];
};