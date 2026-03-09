// src/core/db/index.js
import { cryptoService } from '../crypto/index.js';

const DB_NAME = 'AerkoDB';
const DB_VERSION = 3;

// Definimos las "Bóvedas" (Stores) según la arquitectura
const STORES = [
    'public_store',    // Configuración, UI state (No cifrado)
    'user_vault',      // Datos biométricos (Cifrado)
    'nutrition_vault', // Dietas y logs (Cifrado)
    'training_vault',  // Rutinas (Cifrado)
    'progress_vault'   // Fotos y medidas (Cifrado)
];

class Database {
    constructor() {
        this.db = null;
    }
    
    _isProtected(storeName) {
        return storeName !== 'public_store';
    }

    /**
     * Abre la conexión con IndexedDB y crea las stores si es la primera vez.
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // 1. Si la versión cambia o no existe la DB -> Crear Tablas
            request.onupgradeneeded = (event) => {
                console.log('[DB] Upgrading database scheme...');
                const db = event.target.result;

                STORES.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        // Creamos la store. keyPath: 'id' significa que cada objeto debe tener un id único.
                        db.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            };

            // 2. Éxito al abrir
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log(`[DB] ${DB_NAME} v${DB_VERSION} initialized.`);
                resolve(this.db);
            };

            // 3. Error
            request.onerror = (event) => {
                console.error('[DB] Connection failed:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Guarda un dato en una store.
     * @param {string} storeName - Nombre de la bóveda (ej: 'user_vault')
     * @param {object} data - Objeto a guardar (Debe tener propiedad 'id')
     */
    async put(storeName, data) {
        // 1. Si no es bóveda protegida o NO hay llave en RAM, guardamos en texto plano
        if (!this._isProtected(storeName) || !cryptoService.key) {
            return this._transaction(storeName, 'readwrite', store => store.put(data));
        }

        // 2. SEGURO ANTI-DOBLE CIFRADO: Si ya viene cifrado (Fase 2), lo dejamos pasar
        if (data.data && data.data.iv && data.data.content) {
            return this._transaction(storeName, 'readwrite', store => store.put(data));
        }

        // 3. Separamos el 'id' del resto de las propiedades (payload)
        const { id, ...payload } = data;

        // 4. Ciframos todo lo que no sea el ID
        const encryptedData = await cryptoService.encrypt(payload);

        // 5. Reconstruimos y guardamos
        const recordToSave = {
            id: id,
            data: encryptedData
        };

        return this._transaction(storeName, 'readwrite', store => store.put(recordToSave));
    }

    /**
     * Recupera un dato. Si está cifrado y tenemos la llave, lo descifra de forma transparente.
     */
    async get(storeName, id) {
        // 1. Obtenemos el registro tal cual está en la base de datos
        const record = await this._transaction(storeName, 'readonly', store => store.get(id));

        // 2. Si no existe, no es bóveda protegida, no hay llave, o no está cifrado, lo devolvemos crudo
        if (!record || !this._isProtected(storeName) || !cryptoService.key || !record.data || !record.data.iv) {
            return record;
        }

        // 3. Desciframos el contenido
        const decryptedPayload = await cryptoService.decrypt(record.data);

        // 4. Reconstruimos el objeto original para el frontend
        return {
            id: record.id,
            ...decryptedPayload
        };
    }

    /**
     * Obtiene TODOS los datos. Descifra los que estén protegidos.
     */
    async getAll(storeName) {
        const records = await this._transaction(storeName, 'readonly', store => store.getAll());

        // Si no es bóveda protegida o no hay llave, devolvemos la lista cruda
        if (!this._isProtected(storeName) || !cryptoService.key) {
            return records;
        }

        // Desciframos en paralelo todos los registros que lo necesiten
        return Promise.all(records.map(async (record) => {
            if (record.data && record.data.iv) {
                const decryptedPayload = await cryptoService.decrypt(record.data);
                return { id: record.id, ...decryptedPayload };
            }
            return record; 
        }));
    }

    /**
     * Borra un dato por su ID.
     * @param {string} storeName 
     * @param {string} id 
     */
    async delete(storeName, id) {
        return this._transaction(storeName, 'readwrite', store => store.delete(id));
    }

    // Helper privado para manejar transacciones y promesas
    _transaction(storeName, mode, callback) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized. Call init() first.'));
                return;
            }
            
            const transaction = this.db.transaction([storeName], mode);
            const store = transaction.objectStore(storeName);
            const request = callback(store);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }
}

// Singleton: Exportamos una única instancia para toda la app
export const db = new Database();