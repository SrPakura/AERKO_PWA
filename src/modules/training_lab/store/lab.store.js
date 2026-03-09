// src/modules/training_lab/store/lab.store.js

class LabStore {
    constructor() {
        // Inicializamos la pizarra del VAR en blanco al arrancar
        this.reset();
    }

    /**
     * Devuelve el store a su estado de fábrica.
     * Fundamental para limpiar la memoria (RAM) cuando el usuario sale del laboratorio.
     */
    reset() {
        this.state = {
            tempVideoFile: null,      // El archivo de vídeo original que sube el usuario
            tempAnalysisData: null,   // Los puntos del esqueleto (landmarks) calculados por la IA
            currentExercise: 'squat'  // El ejercicio seleccionado por defecto
        };
    }

    /**
     * Guarda el archivo de vídeo temporalmente en la RAM
     */
    setVideoFile(file) {
        this.state.tempVideoFile = file;
    }

    /**
     * Guarda los datos matemáticos generados por la IA
     */
    setAnalysisData(data) {
        this.state.tempAnalysisData = data;
    }

    /**
     * Actualiza cualquier parte de la pizarra (Merge)
     */
    update(partialData) {
        this.state = { ...this.state, ...partialData };
    }

    /**
     * Devuelve una foto actual de toda la pizarra.
     */
    getState() {
        // Devolvemos una copia para evitar que alguien modifique los datos originales por accidente
        return { ...this.state };
    }
}

// Exportamos el Singleton (Una única pizarra del VAR para todo el laboratorio)
export const labStore = new LabStore();