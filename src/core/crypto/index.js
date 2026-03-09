// src/core/crypto/index.js

/**
 * CONFIGURACIÓN DE SEGURIDAD
 * Estándares actuales de la industria (NIST guidelines)
 */
const ALGORITHM_AES = 'AES-GCM';
const ALGORITHM_KDF = 'PBKDF2';
const HASH_ALGO = 'SHA-256';
const KEY_LENGTH = 256;
const KDF_ITERATIONS = 100000; // Balance entre seguridad y rendimiento móvil

class CryptoService {
    constructor() {
        /** @type {CryptoKey|null} Llave maestra en memoria (RAM) */
        this.key = null; 
    }

    /**
     * Inicia una sesión segura derivando la clave maestra del PIN.
     * @param {string} pin - El PIN numérico del usuario.
     * @param {string} salt - Sal única del usuario (OBLIGATORIA).
     * @returns {Promise<boolean>} True si la clave se generó correctamente.
     */
    async initSession(pin, salt) {
        // FIX DE SEGURIDAD 1.5.6: Obligatoriedad de Sal
        if (!salt) {
            console.error('[CRYPTO] Security Violation: Attempted to derive key without Salt.');
            throw new Error('SECURITY_ERROR_MISSING_SALT');
        }

        try {
            this.key = await this._deriveKey(pin, salt);
            console.log('%c[CRYPTO] Session Key Generated (RAM Only).', 'color: #BEFF00');
            return true;
        } catch (e) {
            console.error('[CRYPTO] Critical Error deriving key:', e);
            return false;
        }
    }

    /**
     * Cierra la sesión y borra la clave de la memoria.
     * Debe llamarse al bloquear la pantalla o minimizar la app.
     */
    lock() {
        this.key = null;
        console.log('%c[CRYPTO] Session Locked. RAM wiped.', 'color: orange');
    }

    /**
     * Cifra un objeto JavaScript.
     * @param {Object} data - Objeto a cifrar.
     * @returns {Promise<{iv: number[], content: number[]}>} Objeto serializable con IV y contenido cifrado.
     */
    async encrypt(data) {
        if (!this.key) throw new Error("Security Violation: No active session.");

        // 1. Preparar datos
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(JSON.stringify(data));

        // 2. Generar Vector de Inicialización (IV) único
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        // 3. Cifrar (AES-GCM)
        const encryptedContent = await window.crypto.subtle.encrypt(
            { name: ALGORITHM_AES, iv: iv },
            this.key,
            encodedData
        );

        // 4. Retornar formato amigable para JSON/IndexedDB
        return {
            iv: Array.from(iv),
            content: Array.from(new Uint8Array(encryptedContent))
        };
    }

    /**
     * Descifra un paquete cifrado.
     * @param {{iv: number[], content: number[]}} encryptedPackage 
     * @returns {Promise<Object>} El objeto original desencriptado.
     */
    async decrypt(encryptedPackage) {
        if (!this.key) throw new Error("Security Violation: No active session.");

        // 1. Reconstruir Arrays tipados
        const iv = new Uint8Array(encryptedPackage.iv);
        const content = new Uint8Array(encryptedPackage.content);

        try {
            // 2. Intentar descifrar
            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: ALGORITHM_AES, iv: iv },
                this.key,
                content
            );

            // 3. Decodificar a JSON
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedContent));

        } catch (e) {
            console.warn('[CRYPTO] Decryption failed. Reason: Wrong PIN or Data Corruption.');
            throw new Error('DECRYPTION_FAILED');
        }
    }

    // ============================================================
    // MÉTODOS PRIVADOS (Helpers)
    // ============================================================

    /**
     * Convierte el PIN en una CryptoKey utilizable.
     * @private
     */
    async _deriveKey(pin, salt) {
        const encoder = new TextEncoder();
        
        // A. Importar el PIN como material de clave "crudo"
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            encoder.encode(pin),
            { name: ALGORITHM_KDF },
            false,
            ["deriveKey"]
        );

        // B. Derivar la clave AES final
        return window.crypto.subtle.deriveKey(
            {
                name: ALGORITHM_KDF,
                salt: encoder.encode(salt),
                iterations: KDF_ITERATIONS,
                hash: HASH_ALGO
            },
            keyMaterial,
            { name: ALGORITHM_AES, length: KEY_LENGTH },
            true, 
            ["encrypt", "decrypt"]
        );
    }
}

export const cryptoService = new CryptoService();