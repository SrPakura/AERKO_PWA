// src/modules/nutrition_smart/components/smart-meal-check-modules/styles.js

export const STYLES = `
    /* Importamos variables globales */
    @import url('/src/core/theme/variables.css');

    :host {
        display: block;
        width: 100%;
        box-sizing: border-box;
        font-family: "JetBrains Mono", monospace;

        /* --- VARIABLES LOCALES --- */
        --bg-color: var(--Negro-suave); /* Color solicitado */
        --border-color: var(--Blanco);
        --accent-green: var(--Verde-acido);
        
        /* Ajuste para móviles muy estrechos */
        min-width: 0; 
    }

    * {
        box-sizing: border-box;
        margin: 0; 
        padding: 0;
    }

    .smart-container {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 100%; /* Asegura que no rompa el layout padre */
    }

    /* --- HEADER --- */
    .drawer-header {
        display: flex;
        width: 100%;
        padding: 12px;
        justify-content: space-between;
        align-items: center;
        
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        
        cursor: pointer;
        user-select: none;
        position: relative;
        z-index: 2; /* Para quedar por encima del contenido al colapsar */
        transition: border-color 0.3s ease;
    }

    .drawer-header span { 
        font-size: 14px;
        line-height: 140%;
        color: var(--Blanco);
    }

    .icon-container { 
        width: 24px; 
        height: 24px; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: var(--Blanco);
    }

    .icon-container svg {
        width: 100%;
        height: 100%;
    }

    /* --- CONTENIDO ANIMADO (Acordeón) --- */
    .drawer-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 16px;
        
        background: var(--bg-color);
        border: 1px solid var(--border-color);
        
        /* TRUCO VISUAL: Fusionar borde superior con el header */
        margin-top: -1px;
        
        /* Estado CERRADO (Default) */
        max-height: 0;
        opacity: 0;
        padding: 0 12px; 
        overflow: hidden;
        border-color: transparent; /* El borde desaparece al cerrar */
        
        /* ANIMACIÓN DE TU PROTOTIPO */
        transition: 
            max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), 
            opacity 0.3s ease, 
            padding 0.4s ease,
            border-color 0.4s ease;
    }

    /* Estado ABIERTO (Clase toggleada por JS) */
    .drawer-content.show {
        max-height: 800px; /* Altura máxima segura */
        opacity: 1;
        padding: 16px 12px; /* Recuperamos el padding */
        border-color: var(--border-color);
    }

    /* --- ITEMS DE LISTA --- */
    .content-item {
        display: flex;
        padding: 4px 0; /* Compacto como en el prototipo */
        align-items: center;
        gap: 8px;
        width: 100%;
        
        border-bottom: 1px solid var(--border-color);
        justify-content: space-between;
        
        cursor: pointer;
        color: var(--Blanco);
        transition: color 0.3s ease, opacity 0.2s ease;
    }
    
    .content-item span { 
        font-size: 14px;
        line-height: 140%;
    }

    .meta-text { 
        font-size: 14px; /* Igualamos tamaño base */
        opacity: 1; 
    }

    /* Hover solo en desktop */
    @media (hover: hover) {
        .content-item:hover { 
            opacity: 0.7;
        }
    }

    /* --- ESTADOS DE COLOR --- */
    
    /* Item Seleccionado / Completado */
    .selected-green { 
        color: var(--accent-green) !important;
    }
    
    .selected-green .meta-text { 
        color: var(--accent-green);
    }

    /* Texto con énfasis (Ej: __G) */
    .accent-text b { 
        color: var(--accent-green);
        font-weight: 400; 
    }

    /* --- BOTÓN GUARDAR (NUEVO) --- */
    .save-action-wrapper {
        margin-top: 8px;
        display: flex;
        width: 100%;
    }
    
    .btn-save {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: var(--accent-green);
        color: var(--Negro-suave);
        border: 1px solid var(--accent-green);
        font-family: 'JetBrains Mono', monospace;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-transform: uppercase;
    }

    .btn-save:active {
        background: var(--Negro-suave);
        color: var(--accent-green);
    }

    /* --- ESTADOS DEL COMPONENTE PADRE (Reflejados en Header) --- */
    
    /* Cuando la comida está completada (DONE) */
    :host([status="DONE"]) .icon-container { 
        color: var(--accent-green);
    }

    /* Cuando la comida está saltada (SKIPPED) */
    :host([status="SKIPPED"]) .drawer-header { 
        opacity: 0.5;
        border-style: dashed; 
    }
    
    .content-item.is-variable span {
        text-decoration: none; /* Adiós subrayado */
    }
`;