// src/modules/training_lab/routes.js

import { db } from '../../core/db/index.js';

import './views/lab-setup-form.js';
import './views/lab-setup-download.js';
import './views/lab-upload.js'; 
import './views/lab-results.js'; // <-- 1. AÑADIMOS ESTO: Importamos la nueva pantalla

export const trainingLabRoutes = {
    
    '/training/lab/setup': () => document.createElement('training-lab-setup-form'),
    '/training/lab/download': () => document.createElement('training-lab-setup-download'),
    
    '/training/lab/upload': async () => {
        try {
            const config = await db.get('public_store', 'training_lab_config');

            if (!config) {
                window.location.hash = '/training/lab/setup';
                return;
            }

            if (config && config.is_downloaded === false) {
                window.location.hash = '/training/lab/download';
                return; 
            }

            // Todo OK, devolvemos el componente base
            return document.createElement('training-lab-upload');

        } catch (error) {
            console.error('Error en el Guard del Training Lab:', error);
            window.location.hash = '/training/lab/setup';
        }
    },

    // <-- 2. AÑADIMOS ESTO: La ruta para el Modo Cine
    '/training/lab/results': () => document.createElement('training-lab-results')
};