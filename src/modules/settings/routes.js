// src/modules/settings/routes.js

import './views/settings-dashboard.js';
import './views/settings-basic.js';
import './views/settings-language.js';
import './views/mode-selector.js';
import './views/settings-pin.js';
import './views/settings-install-ios.js';
import './views/settings-export.js';
import './views/settings-collection.js';

export const settingsRoutes = {
    '/settings': () => document.createElement('settings-dashboard'),
    '/settings/basic': () => document.createElement('settings-basic'),
    '/settings/language': () => document.createElement('settings-language'),
    '/settings/mode': () => document.createElement('settings-mode-selector'),
    '/settings/pin': () => document.createElement('settings-pin'),
    '/settings/install-ios': () => document.createElement('settings-install-ios'),
    '/settings/export': () => document.createElement('settings-export'),
    '/settings/collection': () => document.createElement('settings-collection'),
};