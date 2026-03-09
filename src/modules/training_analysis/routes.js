// src/modules/training_analysis/routes.js

import './views/mesocycle-config.js';
import './views/analysis-dashboard.js'; 
import './views/analysis-results.js'; 

export const trainingAnalysisRoutes = {
    '/training/analysis/mesocycle': () => document.createElement('training-analysis-meso-config'),
    '/training/analysis': () => document.createElement('training-analysis-dashboard'),
    '/training/analysis/results': () => document.createElement('training-analysis-results') 
};