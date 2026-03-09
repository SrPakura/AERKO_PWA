// src/modules/nutrition/components/nutrition-dashboard-kcal.js

export class NutritionDashboardKcal extends HTMLElement {
    static get observedAttributes() { return ['consumed', 'target', 'min', 'max', 'mode']; }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.updateVisually();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.updateVisually();
        }
    }

    updateVisually() {
        if (!this.shadowRoot) return;

        // 1. Obtener datos
        const consumed = parseInt(this.getAttribute('consumed') || 0);
        // Usamos max como referencia del 100% visual para simplificar la UI
        const min = parseInt(this.getAttribute('min') || 1900);
        const max = parseInt(this.getAttribute('max') || 2100); 
        const appMode = this.getAttribute('mode') || 'a';

        // 2. Elementos del DOM
        const currentText = this.shadowRoot.querySelector('.stat-current');
        const rangeText = this.shadowRoot.querySelector('.stat-range');
        const fillBar = this.shadowRoot.querySelector('.bar-fill');
        const fillText = this.shadowRoot.querySelector('.fill-text');
        
        // --- NUEVA LÓGICA: Ocultar marcadores en Modo Zen ---
        const markerOrange = this.shadowRoot.querySelector('.marker-orange');
        const markerLime = this.shadowRoot.querySelector('.marker-lime');
        
        if (appMode === 'b') {
            if (markerOrange) markerOrange.style.display = 'none';
            if (markerLime) markerLime.style.display = 'none';
        } else {
            if (markerOrange) markerOrange.style.display = 'block';
            if (markerLime) markerLime.style.display = 'block';
        }

        // 3. Actualizar Textos Header
        if (currentText) currentText.innerText = consumed;
        if (rangeText) rangeText.innerText = `/ ${min}-${max}`;
        
        // 4. Actualizar Texto Interior Barra
        if (fillText) fillText.innerText = consumed;

        // 5. CÁLCULO DE LA BARRA
        // Lógica: Consideramos el "max" como el 100% funcional de la barra antes del overflow
        let percentage = Math.min((consumed / max) * 100, 100);
        
        if (fillBar) {
            fillBar.style.width = `${percentage}%`;

            // --- LÓGICA DE VISIBILIDAD DEL TEXTO (Punto 2) ---
            // Si la barra es muy pequeña (<15%), ocultamos el texto interno
            if (percentage < 15) {
                fillText.style.opacity = '0';
            } else {
                fillText.style.opacity = '1';
            }

            // --- LÓGICA DE COLORES (Estados) ---
            // Reset base
            fillBar.style.backgroundColor = 'var(--Blanco)';
            fillBar.style.color = 'var(--negro-suave)'; // Texto negro sobre blanco

            // Estado: ZONA VERDE (Entre min y max)
            if (consumed >= min && consumed <= max) {
                fillBar.style.backgroundColor = 'var(--verde-acido)';
                // El texto se queda negro (buen contraste con verde ácido)
            }
            // Estado: OVERFLOW (Te has pasado de max)
            else if (consumed > max) {
                // <--- NUEVO: Condicionamos el color naranja al modo
                if (appMode === 'b') {
                    // En modo Zen, si te pasas, se queda en verde amigable
                    fillBar.style.backgroundColor = 'var(--verde-acido)'; 
                } else {
                    // Modos Default/Tsundere: penalización naranja
                    fillBar.style.backgroundColor = 'var(--naranja)'; 
                }
            }
        }
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            /* Importamos variables globales si es necesario, 
               pero definimos las locales críticas aquí para encapsulamiento */
            
            :host {
                display: block;
                width: 100%;
                box-sizing: border-box;
                /* Fuentes heredadas del main.css */
                font-family: var(--font-body, 'JetBrains Mono', monospace);
            }

            /* --- VARIABLES LOCALES (Copia fiel de tu CSS) --- */
            .kcal-card {
                --negro-suave: #1A1A1A;
                --gris-suave-hover: #2F2F2F;
                --gris-hover: #E5E5E5;     
                --blanco: #FFFFFF;
                --verde-lima-hover: #DFFF4F; 
                --verde-acido: #CCFF00;      
                --naranja: #FF7E4F; /* HARDCODEADO SOLICITADO */
                
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 16px;
                padding: 16px;
                background: var(--negro-suave);
                border: 1px solid var(--verde-lima-hover);
                width: 100%;
                box-sizing: border-box;
                border-radius: 4px;  /* Esto redondea el borde de la tarjeta */
                overflow: hidden;
            }

            /* Header */
            .kcal-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                width: 100%;
            }

            .kcal-title {
                margin: 0;
                color: var(--blanco);
                /* Usamos la variable global de fuente o fallback */
                font-family: var(--font-title, 'Clash Display', sans-serif);
                font-size: 24px;
                font-weight: 600;
                line-height: 120%;
            }

            .kcal-stats {
                color: var(--gris-hover);
                font-family: var(--font-body, 'JetBrains Mono', monospace);
                font-size: 12px;
                font-weight: 500;
                line-height: 130%;
            }

            .stat-current {
                color: var(--verde-acido);
            }

            /* Barra Container */
            .kcal-bar-container {
                position: relative;
                width: 100%;
                height: 32px;
                background: var(--gris-suave-hover);
                overflow: hidden; 
            }

            /* Marcadores Estáticos */
            .marker {
                position: absolute;
                top: 0;
                bottom: 0;
                z-index: 1; 
            }

            .marker-orange {
                background: var(--naranja);
                width: 16px;
                right: 0;
            }

            .marker-lime {
                background: var(--verde-acido);
                width: 32px;
                right: 16px; /* Empieza donde acaba el naranja */
            }

            /* Relleno Dinámico */
            .bar-fill {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                background: var(--blanco);
                z-index: 2; /* Tapa los marcadores */
                display: flex;
                align-items: center;
                justify-content: center; /* Centra el texto en la parte visible */
                overflow: hidden;
                
                /* Transición suave para el efecto "vivo" */
                transition: width 0.5s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s ease;
                width: 0%; 
            }

            .fill-text {
                color: var(--negro-suave);
                font-family: var(--font-body, 'JetBrains Mono', monospace);
                font-size: 14px;
                font-weight: 500;
                white-space: nowrap;
                
                /* Transición para ocultar/mostrar */
                transition: opacity 0.2s ease;
                opacity: 0; /* Empieza oculto hasta que JS calcule */
            }

        </style>

        <div class="kcal-card">
            <div class="kcal-header">
                <h3 class="kcal-title">// Kcals</h3>
                <div class="kcal-stats">
                    [ <span class="stat-current">0</span> <span class="stat-range">/ 0-0</span> ]
                </div>
            </div>

            <div class="kcal-bar-container">
                <div class="marker marker-lime"></div>
                <div class="marker marker-orange"></div> 

                <div class="bar-fill">
                    <span class="fill-text">0</span>
                </div>
            </div>
        </div>
        `;
    }
}

customElements.define('nutrition-dashboard-kcal', NutritionDashboardKcal);