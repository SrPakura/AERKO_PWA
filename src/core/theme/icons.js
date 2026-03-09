// src/core/theme/icons.js

export const ICONS = {
    // 1. Flecha Atrás (Headers de Onboarding/Import)
    ARROW_LEFT: `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"><path fill="#fff" d="M23.335 10.838H2.27l5.717-5.703a.664.664 0 1 0-.941-.94L.195 11.03a.66.66 0 0 0 0 .939l6.85 6.834a.67.67 0 0 0 .469.197.65.65 0 0 0 .468-.197.66.66 0 0 0 0-.939l-5.717-5.703h21.069a.662.662 0 1 0 0-1.323Z"/></svg>
    `,

    // 2. Flecha Derecha en Círculo (Widgets del Dashboard)
    // 2. Flecha Derecha en Círculo (Corregido para que escale a 24x24)
    ARROW_RIGHT_CIRCLE: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none">
            <g fill="#fff">
                <path d="M10 20c5.524 0 10-4.477 10-10S15.524 0 10 0C4.477 0 0 4.477 0 10s4.477 10 10 10ZM10 .8c5.073 0 9.2 4.127 9.2 9.2 0 5.073-4.127 9.2-9.2 9.2C4.926 19.2.8 15.073.8 10 .8 4.927 4.926.8 10 .8Z"/>
                <path d="m10.607 14.299.566.566L16.037 10l-4.864-4.864-.566.565L14.505 9.6H4.8v.8h9.705l-3.898 3.899Z"/>
            </g>
        </svg>
    `,
        
        // 3. Flechas Verticales (Para abrir/cerrar cajones de comida)
    ARROW_UP: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 15L12 9L6 15" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `,

    ARROW_DOWN: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    `,

    // 4. Borrar / Backspace (Teclado Numérico)
    BACKSPACE: `
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none"><g clip-path="url(#a)"><path fill="#fff" fill-rule="evenodd" d="M0 18 13.5 4.5H36v27H13.5L0 18Zm15.284-4.034L19.318 18l-4.034 4.034 3.182 3.182 4.034-4.034 4.034 4.034 3.182-3.182L25.682 18l4.034-4.034-3.182-3.182-4.034 4.034-4.034-4.034-3.182 3.182Z" clip-rule="evenodd"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h36v36H0z"/></clipPath></defs></svg>
         `,

    // 5. Nube / Upload (Pantalla Import Action)
    UPLOAD_CLOUD: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 21" width="100%" height="100%" fill="none"><path fill="#fff" fill-rule="evenodd" d="M8.586 6.163 11.2 2.995V14.4a.8.8 0 1 0 1.6 0V2.965l2.64 3.198a.8.8 0 0 0 1.135 0 .81.81 0 0 0 0-1.14L12.621.228a.79.79 0 0 0-.608-.228.787.787 0 0 0-.608.228L7.45 5.022a.81.81 0 0 0 0 1.14.798.798 0 0 0 1.136 0Zm14.614 6.64a.8.8 0 0 0-.8.8v5.6H1.6v-5.6a.8.8 0 1 0-1.6 0v6.4a.8.8 0 0 0 .8.8h22.4a.8.8 0 0 0 .8-.8v-6.4a.8.8 0 0 0-.8-.8Z" clip-rule="evenodd"/></svg>
         `,
         
         // 6. Cámara / Video Player
    CAMERA_FLIP: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><path fill="#fff" fill-rule="evenodd" d="M24.688 29.053a5.053 5.053 0 1 0 0-10.106 5.053 5.053 0 0 0 0 10.106ZM7.004 8.843h34.11c.695 0 1.259-.587 1.259-1.264 0-.698-.566-1.263-1.261-1.263H7.023A2.522 2.522 0 0 0 4.478 8.85V24h2.526V8.842ZM4.941 30.618c.442.53 1.176.509 1.6 0l4.716-5.66c.441-.53.257-.959-.458-.959H.682c-.694 0-.88.451-.457.96l4.716 5.66Zm34.905 8.539H5.736c-.695 0-1.258.586-1.258 1.263 0 .698.565 1.263 1.26 1.263h34.09a2.522 2.522 0 0 0 2.544-2.533V24h-2.526v15.158Zm2.109-21.808c-.467-.513-1.216-.522-1.69 0l-5.197 5.72c-.466.514-.287.93.428.93h11.237c.703 0 .901-.407.427-.93l-5.205-5.72Z" clip-rule="evenodd"/></svg>
    `,

    TIMER: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none"><path fill="#fff" d="M20.16 0a.96.96 0 0 0-.96.96v1.92a.96.96 0 0 0 .96.96h1.44v2.542C11.215 7.577 3.12 16.42 3.12 27.12 3.12 38.632 12.488 48 24 48c11.512 0 20.88-9.368 20.88-20.88.003-3.94-1.115-7.8-3.226-11.127l2.035-1.647.906 1.12a.96.96 0 0 0 1.35.142l1.493-1.209a.96.96 0 0 0 .141-1.35L42.746 7.08a.96.96 0 0 0-1.35-.143l-1.492 1.21a.96.96 0 0 0-.142 1.349l.907 1.12-2.025 1.638A20.826 20.826 0 0 0 26.4 6.383V3.84h1.44a.96.96 0 0 0 .96-.96V.96a.96.96 0 0 0-.96-.96h-7.68ZM24 9.6c9.696 0 17.52 7.824 17.52 17.52S33.696 44.64 24 44.64A17.494 17.494 0 0 1 6.48 27.12C6.48 17.424 14.304 9.6 24 9.6Zm.001 3.573V27.12l11.151 8.375a13.947 13.947 0 0 0-11.15-22.322Z"/></svg>
    `,

    RECORD: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#FF0000"/></svg>
    `,

    STOP: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" fill="#FF0000" rx="2"/></svg>
    `,
         
    // Lápiz (Editar)
    EDIT: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" fill="none"><path fill="#fff" d="M7.838 4.324 2.162 10H0V7.838l5.676-5.676 2.162 2.162ZM10 2.162l-1.47 1.47L6.368 1.47 7.838 0 10 2.162Z"/></svg>
        `,

    // Papelera (Borrar/Eliminar)
    TRASH: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" fill="none"><path fill="#fff" d="M3.857 1.715V.429A.429.429 0 0 1 4.286 0h3.428a.429.429 0 0 1 .429.429v1.286h3.428a.429.429 0 1 1 0 .857H.43a.429.429 0 1 1 0-.857h3.428Zm.857 0h2.572V.858H4.714v.857ZM1.714 12a.428.428 0 0 1-.428-.428v-9h9.428v9a.429.429 0 0 1-.428.428H1.714Zm3-2.571A.429.429 0 0 0 5.143 9V4.715a.429.429 0 0 0-.857 0V9a.429.429 0 0 0 .428.429Zm2.572 0A.429.429 0 0 0 7.714 9V4.715a.429.429 0 0 0-.857 0V9a.429.429 0 0 0 .429.429Z"/></svg>
        `,

    // Grip / 6 u 8 puntos (Arrastrar)
    DRAG_HANDLE: `
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="38" fill="none"><path fill="#fff" d="M3 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm7-35a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>
        `,

    // Lupa (Buscar)
    SEARCH: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" fill="none"><path fill="#fff" d="M4.5 7.65a5.85 5.85 0 1 1 11.7 0 5.85 5.85 0 0 1-11.7 0Zm-1.8 0c0 1.791.616 3.439 1.647 4.742l-4.082 4.07a.9.9 0 1 0 1.27 1.275l4.086-4.073A7.65 7.65 0 1 0 2.7 7.65Z"/></svg>
        `,

    // Símbolo Más (Añadir Genérico / Header)
    PLUS: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><path fill="#fff" d="M8 0a1 1 0 0 1 1 1.002V7h5.998a1 1 0 1 1 0 2H9v5.998a1 1 0 1 1-2 0V9H1.002a1 1 0 1 1 0-2H7V1.002A1 1 0 0 1 8 0Z"/></svg>
        `,

    // Código de Barras / Escáner
    SCAN: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 16" fill="none"><path fill="#fff" d="M1 4.5a.5.5 0 0 1-1 0v-2A2.5 2.5 0 0 1 2.5 0h2a.5.5 0 0 1 0 1h-2A1.5 1.5 0 0 0 1 2.5v2ZM15.5 1a.5.5 0 0 1 0-1h2A2.5 2.5 0 0 1 20 2.5v2a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 0 17.5 1h-2Zm-11 14a.5.5 0 0 1 0 1h-2A2.5 2.5 0 0 1 0 13.5v-2a.5.5 0 0 1 1 0v2A1.5 1.5 0 0 0 2.5 15h2ZM19 11.5a.5.5 0 0 1 1 0v2a2.5 2.5 0 0 1-2.5 2.5h-2a.5.5 0 0 1 0-1h2a1.5 1.5 0 0 0 1.5-1.5v-2Zm-16-8a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Zm3 0a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Zm2 0a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Zm2 0a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Zm4 0a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Zm2 0a.5.5 0 0 1 1 0v9a.5.5 0 0 1-1 0v-9Z"/></svg>
        `,
        
        // Check / Confirmar (Círculo con tick)
    CHECK: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M9.66.23a12 12 0 1 1 4.681 23.54A12 12 0 0 1 9.66.23ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5.882 4.185 1.153 1.147L8.32 17.989 4 13.692l1.31-1.302 2.981 2.964L17.695 6l.187.185Z"/></svg>
        `,

    // Cross / Cancelar (Círculo con X)
    CROSS: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path fill="#fff" d="M9.66.23a12 12 0 1 1 4.681 23.54A12 12 0 0 1 9.66.23ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5.845 5.322-4.534 4.594L18 16.667l-1.307 1.323-4.69-4.75L7.306 18 6 16.679l4.7-4.761-4.53-4.59 1.307-1.323 4.529 4.589L16.54 6l1.305 1.322Z"/></svg>
        `,
        
    CIRCLE_EMPTY: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 27 27" fill="none"><path fill="#fff" d="M13.5 27a13.5 13.5 0 1 1 0-26.999 13.5 13.5 0 0 1 0 27Zm0-24.75a11.25 11.25 0 1 0 0 22.5 11.25 11.25 0 0 0 0-22.5Z"/></svg>
    `,
        
        // Embudo (Filtros)
    FUNNEL: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M2 2v3.64l8.18 10V22l3.64-1.82v-4.54l8.18-10V2H2z" stroke="#FFFFFF" stroke-width="1.82" stroke-miterlimit="10"/></svg>
    `,
};