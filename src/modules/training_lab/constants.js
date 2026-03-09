// src/modules/training_lab/constants.js

export const AI_MODELS = {
    lite: {
        id: 'lite',
        name: 'Lite',
        size: '1.3 MB',
        url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        msgKey: 'model_lite_msg' // <-- REGLA DE ORO: Usamos la key
    },
    full: {
        id: 'full',
        name: 'Full',
        size: '3.3 MB',
        url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
        msgKey: 'model_full_msg' // <-- REGLA DE ORO: Usamos la key
    },
    heavy: {
        id: 'heavy',
        name: 'Heavy',
        size: '9.6 MB',
        url: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
        msgKey: 'model_heavy_msg' // <-- REGLA DE ORO: Usamos la key
    }
};

// Ella era claramente amarilla. Por eso hoy en día no puedo escuchar Yellow (de coldplay) sin llorar (_: