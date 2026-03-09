// src/modules/auth/components/lock-screen.js
import { router } from '../../../core/router/index.js';
import { authService } from '../services/auth.service.js'; // <-- IMPORTANTE: Ahora usamos el servicio
import { bus } from '../../../core/bus/index.js';
import '../../system/components/keypad.js';
import { userService } from '../../user/services/user.service.js';

// IMPORTAMOS LOS SERVICIOS DE DATOS TOCAPELOTAS
import { nutritionService } from '../../nutrition_core/services/nutrition.service.js';
import { progressService } from '../../progress_core/services/progress.service.js';

export class AuthLockScreen extends HTMLElement {
    constructor() {
        super();
        this.pin = ""; 
    }

    connectedCallback() {
        this.render();
        this.addListeners();
        this.updatePinDisplay(); 
    }

    render() {
        this.innerHTML = `
        <div class="screen-locked">
            <div class="terminal-header">
                <img src="/assets/img/logo_ascii.png" alt="Aerko System" style="width: 100%; max-width: 340px; image-rendering: pixelated; margin-bottom: 24px;">
                <div class="log-container">
                    <p class="log-text log-text--green">> System initiation...</p>
                    <p class="log-text log-text--white">> Password required...</p>
                </div>
            </div>

            <div class="pin-section">
                <div class="pin-inputs-row" id="pin-display"></div>
            </div>

            <div class="keyboard-container">
                <app-keypad mode="numeric"></app-keypad>
            </div>
        </div>
        `;
    }

    updatePinDisplay() {
        const container = this.querySelector('#pin-display');
        const slots = Array(4).fill(null).map((_, i) => {
            if (i < this.pin.length) return `<div class="pin-box">*</div>`; 
            if (i === this.pin.length) return `<div class="pin-box"><div class="cursor-bar"></div></div>`; 
            return `<div class="pin-box"></div>`; 
        }).join('');
        container.innerHTML = slots;
    }

    addListeners() {
        const keypad = this.querySelector('app-keypad');
        keypad.addEventListener('input', (e) => {
            if (this.pin.length < 4) {
                this.pin += e.detail;
                this.updatePinDisplay();
            }
        });
        keypad.addEventListener('delete', () => {
            this.pin = this.pin.slice(0, -1);
            this.updatePinDisplay();
        });
        keypad.addEventListener('ok', () => {
            this.handleLogin();
        });
    }

    async handleLogin() {
        if (this.pin.length !== 4) return;
        console.log('Intentando desbloquear con:', this.pin);

        // Usamos el servicio de auth real (que verifica el Canario)
        const success = await authService.verifyPin(this.pin);

        if (success) {
            // ¡NUEVO! LA LLAVE YA ESTÁ EN LA RAM: Mandamos a los reponedores a por los datos
            // Usamos await para que no nos mande al Home hasta que los datos estén listos
            await userService.init();
            await nutritionService.init();
            await progressService.init();

            bus.emit('SYSTEM_NOTIFY', { message: 'System Unlocked', type: 'success' });
            router.navigate('/'); 
        } else {
            bus.emit('SYSTEM_NOTIFY', { message: 'Password Incorrect', type: 'error' });
            this.pin = "";
            this.updatePinDisplay();
        }
    }
}

customElements.define('app-lock-screen', AuthLockScreen);