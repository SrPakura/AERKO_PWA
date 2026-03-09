// src/modules/onboarding/store/index.js

class OnboardingStore {
    constructor() {
        this.state = {
            currentStep: 0,
            selectedApp: null,
            successMessage: null 
        };
    }

    getStep() { return this.state.currentStep; }
    
    getSelectedApp() {
        // En lugar de texto duro, devolvemos la llave del diccionario
        return this.state.selectedApp || { name: 'unknown_app', id: null };
    }

    getSuccessMessage() { return this.state.successMessage; }

    setStep(stepIndex) { this.state.currentStep = stepIndex; }
    
    setSelectedApp(appData) { this.state.selectedApp = appData; }

    setSuccessMessage(msg) { this.state.successMessage = msg; }

    reset() {
        this.state.currentStep = 0;
        this.state.selectedApp = null;
        this.state.successMessage = null; 
    }
}

export const onboardingStore = new OnboardingStore();