// src/modules/user/routes.js

// 1. Importamos el componente Home (Side-effect import para registrar <user-home>)
import './views/home.js';

// 2. Importamos la nueva vista de Menú (Función directa)
import { MenuView } from './views/menu.js';

export const userRoutes = {
    // RUTA RAÍZ: Dashboard principal
    '/': () => document.createElement('user-home'),
    
    // RUTA MENÚ: La pantalla "brutalista" con las opciones grandes
    '/menu': MenuView,

    // RUTA PERFIL: (Mantenemos tu placeholder actual)
    '/profile': () => {
        return '<div class="app-screen"><h1 class="text-h1" style="color:var(--Verde-acido); padding:24px;">Profile_</h1><app-nav style="position:fixed;bottom:0;width:100%"></app-nav></div>';
    }
};