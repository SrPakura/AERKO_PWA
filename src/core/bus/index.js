// src/core/bus/index.js

class EventBus {
    constructor() {
        this.events = {};
        // Para debuguear qué pasa por las venas de la app
        this.debug = true; 
    }

    /**
     * Suscribirse a un evento
     * @param {string} eventName - Nombre del evento (ej: 'USER_UPDATED')
     * @param {Function} callback - Función a ejecutar
     */
    on(eventName, callback) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(callback);
    }

    /**
     * Dejar de escuchar un evento
     * @param {string} eventName 
     * @param {Function} callback 
     */
    off(eventName, callback) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }

    /**
     * Emitir un evento (Gritar al sistema)
     * @param {string} eventName 
     * @param {any} data - Datos adjuntos
     */
    emit(eventName, data = null) {
        if (this.debug) {
            console.log(`%c[BUS] Event: ${eventName}`, 'color: #00bcd4', data);
        }

        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error handling event ${eventName}:`, error);
                }
            });
        }
    }
}

// Exportamos singleton
export const bus = new EventBus();