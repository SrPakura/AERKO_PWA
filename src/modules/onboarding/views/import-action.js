// src/modules/onboarding/views/import-action.js
import { router } from '../../../core/router/index.js';
import { onboardingStore } from '../store/index.js';
import { ICONS } from '../../../core/theme/icons.js';
import { parserService } from '../services/parser.service.js';
import { healthParserService } from '../services/health-parser.service.js';
import { db } from '../../../core/db/index.js';
import { progressService } from '../../progress_core/services/progress.service.js'; 
import { userService } from '../../user/services/user.service.js'; 
import { importService } from '../services/import.service.js';
import { i18nService } from '../../../core/i18n/i18n.service.js'; // <-- IMPORTANTE: Servicio de idiomas

export class OnboardingImportAction extends HTMLElement {
    constructor() {
        super();
        this.selectedApp = onboardingStore.getSelectedApp();
        
        // Estado local
        this.selectedFileContent = null; 
        this.selectedFileObject = null;  
        this.selectedFileName = '';
        
        // Clasificamos si es una fuente de salud o de entrenamiento
        this.isHealthSource = ['apple_health', 'google_fit', 'samsung_health'].includes(this.selectedApp.id);
        
        // Bindings
        this._handleBack = this._handleBack.bind(this);
        this._handleImport = this._handleImport.bind(this);
        this._handleDropzone = this._handleDropzone.bind(this);
        this._handleFileSelect = this._handleFileSelect.bind(this);
    }

    async connectedCallback() {
        // Cargamos el diccionario ANTES de renderizar
        // Nota: asumo que has guardado el diccionario que me pasaste como 'onboarding/import-action'
        this.dict = await i18nService.loadPage('onboarding/import-actions');

        this.render();
        this.addListeners();
        this._setupInputAccept(); 
    }

    disconnectedCallback() {
        this.removeListeners();
    }

    _setupInputAccept() {
        const fileInput = this.querySelector('#file-input');
        if (!fileInput) return;
        
        const statusText = this.querySelector('#file-status-text');

        if (this.selectedApp.id === 'aerko') {
            fileInput.setAttribute('accept', '.json');
            statusText.innerHTML = this.dict.t('action_drop_desc_aerko');
            return;
        }

        if (this.selectedApp.id === 'apple_health') {
            fileInput.setAttribute('accept', '.xml');
            statusText.innerHTML = this.dict.t('action_drop_desc_apple');
        } else if (this.isHealthSource) {
             fileInput.setAttribute('accept', '.csv,.json,.zip');
             statusText.innerHTML = this.dict.t('action_drop_desc_health');
        } else {
             fileInput.setAttribute('accept', '.csv,.json');
             statusText.innerHTML = this.dict.t('action_drop_desc_training');
        }
    }

    render() {
        if (!this.dict) return;

        // Si no hay ID, pintamos el "Desconocido" traducido
        const appNameDisplay = this.selectedApp.id ? this.selectedApp.name : this.dict.t(this.selectedApp.name);

        this.innerHTML = `
        <div class="app-screen screen-import-action">
            
            <div class="section-header" id="btn-back">
                 ${ICONS.ARROW_LEFT}
                 <span class="header-title-small">${this.dict.t('action_header')}</span>
            </div>

            <div class="source-indicator">
                ${this.dict.t('action_source')} <span class="source-name">[${appNameDisplay}]</span>
            </div>

            <div class="action-content-wrapper">
                <div class="action-dropzone" id="drop-area" style="cursor: pointer; position: relative;">
                    <div style="width:48px; height:48px; margin-bottom:16px;">
                        ${ICONS.UPLOAD_CLOUD}
                    </div>
                    
                    <h3 class="drop-title">${this.dict.t('action_drop_title')}</h3>
                    
                    <p class="drop-desc" id="file-status-text">
                        ${this.dict.t('action_drop_desc_default')}
                    </p>
                    
                    <div id="progress-bar-container" style="display: none; width: 80%; margin-top: 16px;">
                        <div style="width: 100%; background: rgba(255,255,255,0.1); border-radius: 4px; height: 8px; overflow: hidden;">
                            <div id="progress-bar-fill" style="width: 0%; height: 100%; background: var(--Verde-acido); transition: width 0.2s ease;"></div>
                        </div>
                        <p id="progress-text" style="color: var(--Verde-acido); font-family: 'JetBrains Mono'; font-size: 12px; margin-top: 8px; margin-bottom: 0;">0%</p>
                    </div>
                </div>
                
                <input type="file" id="file-input" style="display: none;">
            </div>

            <div class="action-footer">
                <app-btn variant="primary" id="btn-import">${this.dict.t('action_btn_import')}</app-btn>
                <app-btn variant="secondary" id="btn-cancel">${this.dict.t('action_btn_cancel')}</app-btn>
            </div>

        </div>
        `;
    }

    addListeners() {
        this.querySelector('#btn-back').addEventListener('click', this._handleBack);
        this.querySelector('#btn-cancel').addEventListener('click', this._handleBack);
        this.querySelector('#btn-import').addEventListener('click', this._handleImport);
        
        this.querySelector('#drop-area').addEventListener('click', this._handleDropzone);
        this.querySelector('#file-input').addEventListener('change', this._handleFileSelect);
    }

    removeListeners() {
        this.querySelector('#btn-back').removeEventListener('click', this._handleBack);
        this.querySelector('#btn-cancel').removeEventListener('click', this._handleBack);
        this.querySelector('#btn-import').removeEventListener('click', this._handleImport);
        this.querySelector('#drop-area').removeEventListener('click', this._handleDropzone);
        this.querySelector('#file-input').removeEventListener('change', this._handleFileSelect);
    }

    _handleBack() {
        router.navigate('/onboarding/import');
    }

    _handleDropzone() {
        if (this.querySelector('#btn-import').getAttribute('label') !== this.dict.t('action_btn_processing')) {
            this.querySelector('#file-input').click();
        }
    }

    _handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.selectedFileName = file.name;
        this.selectedFileObject = file; 
        
        const statusText = this.querySelector('#file-status-text');
        statusText.innerHTML = this.dict.t('action_file_ready', { 
            name: file.name, 
            size: (file.size / 1024 / 1024).toFixed(2) 
        });

        if (!this.isHealthSource) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.selectedFileContent = event.target.result;
            };
            reader.readAsText(file);
        } else {
            this.selectedFileContent = null; 
        }
    }

    async _handleImport() {
        if (this.isHealthSource && !this.selectedFileObject) {
             alert(this.dict.t('action_alert_health')); 
             return;
        }
        if (!this.isHealthSource && !this.selectedFileContent) {
            alert(this.dict.t('action_alert_training')); 
            return;
        }

        const btnImport = this.querySelector('#btn-import');
        btnImport.setAttribute('label', this.dict.t('action_btn_processing')); 
        
        try {
            const sourceId = this.selectedApp.id; 
            
            // --- RUTA VIP: BACKUP DE AERKO ---
            if (sourceId === 'aerko') {
                if (!this.selectedFileObject) {
                    alert(this.dict.t('action_alert_aerko')); 
                    return;
                }
                
                await importService.importAerkoBackup(this.selectedFileObject);
                console.log('%c[IMPORT] Backup de Aerko restaurado con éxito.', 'color: #CCFF00');
                
                onboardingStore.setSuccessMessage(this.dict.t('action_success_aerko'));
                
                router.navigate('/onboarding/import');
                return; 
            }

            // --- RUTA A: IMPORTACIÓN DE SALUD (Biometría) ---
            if (this.isHealthSource) {
                
                this.querySelector('#progress-bar-container').style.display = 'block';
                const progressFill = this.querySelector('#progress-bar-fill');
                const progressText = this.querySelector('#progress-text');

                const healthData = await healthParserService.parseHealthData(
                    this.selectedFileObject, 
                    sourceId, 
                    (percent) => {
                        progressFill.style.width = `${percent}%`;
                        progressText.innerText = this.dict.t('action_analyzing', { percent: percent });
                    }
                );

                progressText.innerText = this.dict.t('action_saving');

                const historyRecord = await db.get('progress_vault', 'user_progress_history');
                const currentHistory = historyRecord && historyRecord.data ? historyRecord.data : [];
                
                const newAerkoRecords = healthData.records.map(r => ({
                    id: `PRG_IMP_${r.timestamp}`,
                    ...r
                }));

                const newHistory = [...currentHistory, ...newAerkoRecords]
                                    .sort((a, b) => b.timestamp - a.timestamp); 
                
                await db.put('progress_vault', { id: 'user_progress_history', data: newHistory });

                const updates = {};
                if (healthData.profile.age) updates.age = healthData.profile.age;
                if (healthData.profile.gender) updates.gender = healthData.profile.gender;
                
                if (newHistory.length > 0) {
                     const latest = newHistory[0];
                     if (latest.weight) updates.weight = latest.weight;
                     if (latest.bodyFat) updates.bodyFat = latest.bodyFat;
                     if (latest.height) updates.height = latest.height;
                }
                
                if (Object.keys(updates).length > 0) {
                    await userService.updateBiometrics(updates);
                }

                console.log(`%c[IMPORT] ${newAerkoRecords.length} registros biométricos inyectados.`, 'color: #CCFF00');
                onboardingStore.setSuccessMessage(this.dict.t('action_success_health', { count: newAerkoRecords.length }));

            } 
            // --- RUTA B: IMPORTACIÓN DE ENTRENAMIENTO ---
            else {
                const aerkoSessions = await parserService.parseData(this.selectedFileContent, sourceId);

                const historyRecord = await db.get('training_vault', 'training_sessions');
                const currentHistory = historyRecord && historyRecord.data ? historyRecord.data : [];
                
                const newHistory = [...currentHistory, ...aerkoSessions];
                await db.put('training_vault', { id: 'training_sessions', data: newHistory });

                console.log(`%c[IMPORT] ${aerkoSessions.length} sesiones inyectadas en vena.`, 'color: #CCFF00');
                onboardingStore.setSuccessMessage(this.dict.t('action_success_training', { 
                    count: aerkoSessions.length, 
                    app: this.selectedApp.name 
                }));
            }

            router.navigate('/onboarding/import');

        } catch (error) {
            console.error("Fallo en la importación:", error);
            // TRADUCCIÓN MÁGICA DE ERRORES:
            alert(this.dict.t('action_alert_error') + this.dict.t(error.message));
            
            btnImport.setAttribute('label', this.dict.t('action_btn_import')); 
            
            if(this.isHealthSource) {
                 this.querySelector('#progress-bar-container').style.display = 'none';
            }
        }
    }
}

customElements.define('onboarding-import-action', OnboardingImportAction);