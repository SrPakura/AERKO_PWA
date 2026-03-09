// src/modules/progress_graphics/routes.js

import './views/dashboard.js';

export const progressGraphicsRoutes = {
    '/progress': () => document.createElement('progress-dashboard'),
};