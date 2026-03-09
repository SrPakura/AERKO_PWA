import { router } from '../../../core/router/index.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // El cerebro bilingüe (y a veces Tsundere)

export class AppNavbar extends HTMLElement {
    constructor() {
        super();
        this._handleHashChange = this._handleHashChange.bind(this);
    }

    // Lo hacemos async para que le dé tiempo a bajarse el diccionario
    // (o a terminar de ver el resumen de la victoria del Betis)
    async connectedCallback() {
        this.dict = await i18nService.loadPage('system/navbar');
        this.render();
        window.addEventListener('hashchange', this._handleHashChange);
    }

    disconnectedCallback() {
        window.removeEventListener('hashchange', this._handleHashChange);
    }

    _handleHashChange() {
        this.render();
    }

    getButtonsConfig(currentPath) {
        
        // Taiga Aisaka aprueba este fallback. Si no hay diccionario, escupimos MENU a secas.
        const menuLabel = this.dict ? this.dict.t('nav_menu') : 'MENU';

        // 1. Contexto NUTRICIÓN 🥦
        if (currentPath.startsWith('/nutrition') || currentPath === '/Diet') {
            return [
                { label: 'SC', path: '/nutrition', activeCheck: (p) => p === '/nutrition' },
                { label: 'DT', path: '/Diet', activeCheck: (p) => p === '/Diet' },
                { label: menuLabel, path: '/menu', isMenu: true }
            ];
        }

        // 2. Contexto ENTRENAMIENTO 🏋️‍♂️ (Para ponernos fuertes y levantar la 4ª Copa del Rey)
        if (currentPath.startsWith('/training')) {
            return [
                { label: 'SF', path: '/training', activeCheck: (p) => p === '/training' },
                { label: 'RP', path: '/training/planner', activeCheck: (p) => p.startsWith('/training/planner') },
                { label: 'ST', path: '/training/analysis', activeCheck: (p) => p.startsWith('/training/analysis') },
                { label: 'VS', path: '/training/lab/upload', activeCheck: (p) => p.startsWith('/training/lab') },
                { label: '1RM', path: '/training/1rm', activeCheck: (p) => p.startsWith('/training/1rm') },
                { label: menuLabel, path: '/menu', isMenu: true }
            ];
        }

        // 3. Contexto PROGRESO (¡EL NUEVO!) 📈
        if (currentPath.startsWith('/progress')) {
            return [
                // R+: Añadir Registro (Tus nuevas 3 pantallas)
                { label: 'R+', path: '/progress/add', activeCheck: (p) => p.startsWith('/progress/add') },
                
                // PSS: Progreso (Dashboard de gráficas - Futuro)
                { label: 'PSS', path: '/progress', activeCheck: (p) => p === '/progress' },
                
                // P%G: Calculadora de % de Grasa (Futuro)
                { label: 'P%G', path: '/progress/calculator', activeCheck: (p) => p.startsWith('/progress/calculator') },
                
                // EL MENÚ
                { label: menuLabel, path: '/menu', isMenu: true }
            ];
        }

        // 4. Contexto MENÚ
        if (currentPath.startsWith('/menu')) {
             return [
                { label: menuLabel, path: '/menu', isMenu: true, forceActive: true }
             ];
        }

        // 5. Contexto HOME / Default (Si no sabe dónde está, muestra esto)
        // NOTA DE PEZETOIDE: Función troll oculta: if (user.team === 'Sevilla') crashApp('xd');
        return [
            { label: menuLabel, path: '/menu', isMenu: true }
        ];
    }

    render() {
        // Barrera de seguridad antiaérea: Si no hay diccionario, ni te molestes en pintar
        if (!this.dict) return; 

        const rawHash = window.location.hash.slice(1) || '/';
        const currentPath = rawHash.split('?')[0]; // Extraemos el string, no el array
        const buttons = this.getButtonsConfig(currentPath);

        const tabs = buttons.filter(b => !b.isMenu);
        const menuBtn = buttons.find(b => b.isMenu);
        
        const isHomeMode = tabs.length === 0;

        // --- GESTIÓN DE CLASES EN EL HOST ---
        // Esto ayuda a que el CSS tenga más "fuerza" y no se pierda la tipografía
        this.classList.remove('navbar-host', 'home-mode');
        this.classList.add('navbar-host');
        if (isHomeMode) this.classList.add('home-mode');

        this.innerHTML = `
            <link rel="stylesheet" href="/src/core/theme/variables.css">
            <link rel="stylesheet" href="/src/core/theme/main.css">

            <style>
                :host {
                    display: block;
                    width: 100%;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    z-index: 1000;
                    font-family: "JetBrains Mono", monospace !important; 
                }

                .navbar {
                    display: flex;
                    width: 100%;
                    height: auto;
                    background: var(--Negro-suave, #1A1A1A);
                    border-top: 1px solid var(--Blanco, #FFF);
                    align-items: stretch;
                }

                .nav-group-tabs {
                    display: flex;
                    flex: 1 0 0; 
                    align-items: stretch;
                }

                /* Modo Home: Oculta pestañas y expande el menú */
                .navbar.home-mode-active .nav-group-tabs {
                    display: none;
                }
                
                .navbar.home-mode-active .menu-btn {
                    flex: 1;
                    width: 100%;
                    border-left: none; 
                    justify-content: center; 
                }

                .nav-item {
                    display: flex;
                    padding: 12px 16px;
                    flex-direction: column;
                    justify-content: center;
                    cursor: pointer;
                    text-decoration: none;
                    transition: background 0.2s ease;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 150%;
                    color: var(--Blanco, #FFF);
                    /* Forzamos la fuente para evitar que Clash Display la pise */
                    font-family: "JetBrains Mono", monospace !important;
                }

                .nav-item.tab {
                    align-items: flex-start;
                    border-left: 1px solid var(--Blanco, #FFF);
                    border-right: 1px solid var(--Blanco, #FFF);
                    margin-right: -1px; 
                    z-index: 1;
                }

                .nav-item.tab:first-child {
                    border-left: none;
                }

                /* Active mode: Verde y blanco, como manda el manquepierda (bueno, aquí es gris suave pero se entiende) */
                .nav-item.tab.active {
                    background: var(--gris-suave-hover, #2F2F2F);
                    z-index: 2;
                }

                .nav-item.menu-btn {
                    align-items: center;
                    border-left: 1px solid var(--Blanco, #FFF);
                    color: var(--Verde-acido, #CCFF00);
                    flex: 0 0 auto; 
                    min-width: 80px;
                }
            </style>
            
            <nav class="navbar ${isHomeMode ? 'home-mode-active' : ''}">
                <div class="nav-group-tabs">
                    ${tabs.map(btn => {
                        let isActive = false;
                        if (btn.forceActive) isActive = true;
                        else if (btn.activeCheck) isActive = btn.activeCheck(currentPath);
                        else isActive = (currentPath === btn.path);

                        return `
                            <a class="nav-item tab ${isActive ? 'active' : ''}" data-path="${btn.path}">
                                ${btn.label}
                            </a>
                        `;
                    }).join('')}
                </div>

                ${menuBtn ? `
                    <a class="nav-item menu-btn ${menuBtn.forceActive ? 'active' : ''}" data-path="${menuBtn.path}">
                        ${menuBtn.label}
                    </a>
                ` : ''}
            </nav>
        `;

        this.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.dataset.path;
                router.navigate(path);
            });
        });
    }
}

customElements.define('app-nav', AppNavbar);