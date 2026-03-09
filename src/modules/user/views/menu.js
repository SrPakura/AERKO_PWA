// src/modules/user/views/menu.js
import { router } from '../../../core/router/index.js';
import '../../../modules/system/components/section-header.js';
import { i18nService } from '../../../core/i18n/i18n.service.js';

export async function MenuView() {
    // Cargamos el diccionario específico de esta pantalla
    const dict = await i18nService.loadPage('user/menu');

    const container = document.createElement('div');
    container.className = 'app-screen';
    
    const style = document.createElement('style');
    style.innerHTML = `
        .menu-item {
            cursor: pointer;
            -webkit-text-stroke-width: 1px;
            -webkit-text-stroke-color: var(--Blanco);
            color: transparent; 
            font-family: "JetBrains Mono";
            font-size: 40px;
            font-style: normal;
            font-weight: 400;
            line-height: normal;
            text-decoration: none;
            transition: all 0.2s ease;
        }

        .menu-item:hover, .menu-item:active {
            color: var(--Verde-acido);
            -webkit-text-stroke-color: var(--Verde-acido);
        }

        .menu-list {
            display: flex;
            width: 100%;
            padding: 0 24px;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 48px;
            flex: 1 0 0;
            margin-bottom: 24px;
        }
    `;
    container.appendChild(style);

    const menuOptions = [
        { label: dict.t('nav_home'), path: '/' },
        { label: dict.t('nav_nutrition'), path: '/nutrition' },
        { label: dict.t('nav_training'), path: '/training' },
        { label: dict.t('nav_progress'), path: '/progress/add' },
        { label: dict.t('nav_settings'), path: '/settings' } 
    ];

    container.innerHTML += `
        <app-section-header
            title="${dict.t('menu_title')}"
            text="${dict.t('menu_credits')}"
        ></app-section-header>

        <div class="menu-list">
            ${menuOptions.map(opt => `
                <a class="menu-item" data-path="${opt.path}">${opt.label}</a>
            `).join('')}
        </div>
    `;

    container.querySelectorAll('.menu-item').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.dataset.path;
            router.navigate(path);
        });
    });

    return container;
}