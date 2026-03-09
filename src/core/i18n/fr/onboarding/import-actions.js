export default {
    "action_header": "Importer_Données",
    "action_source": "/// SOURCE :",
    "action_drop_title": "Importer_données",
    "action_drop_desc_aerko": "Importe ton fichier <br><b>Aerko_Export.json</b>",
    "action_drop_desc_apple": "Touche pour parcourir les fichiers.<br>Importe ton fichier <b>export.xml</b> d'Apple Health",
    "action_drop_desc_health": "Touche pour parcourir les fichiers.<br>Fichiers Takeout acceptés (.csv, .json)",
    "action_drop_desc_training": "Touche pour parcourir les fichiers.<br>.json et .csv de ton ancienne appli acceptés",
    "action_drop_desc_default": "Touche pour parcourir les fichiers.",
    "action_file_ready": "Fichier prêt :<br><span style=\"color: var(--Verde-acido); font-weight: bold;\">{{name}}</span><br><span style=\"font-size:12px; opacity:0.6;\">({{size}} MB)</span>",
    "action_analyzing": "Analyse en cours... {{percent}}%",
    "action_saving": "Sauvegarde dans le coffre...",
    "action_btn_import": "Importer",
    "action_btn_cancel": "Annuler",
    "action_btn_processing": "Traitement en cours...",
    "action_alert_health": "Sélectionne d'abord le fichier d'exportation de santé.",
    "action_alert_training": "Sélectionne d'abord un fichier d'entraînement.",
    "action_alert_aerko": "Sélectionne d'abord le fichier de sauvegarde (backup).",
    "action_alert_error": "Erreur lors du traitement : ",
    "action_success_aerko": "> Données Aerko_ restaurées avec succès.",
    "action_success_health": "> {{count}} entrées biométriques importées.",
    "action_success_training": "> {{count}} séances [{{app}}] importées.",
    
    // --- ERREURS DE SERVICE ---
    "err_health_unsupported": "Source de santé non prise en charge.",
    "err_xml_read": "Erreur de lecture du fichier XML.",
    "err_csv_read": "Erreur de lecture du fichier CSV.",
    "err_json_corrupt": "Le fichier n'est pas un JSON valide ou est corrompu.",
    "err_system_locked": "Le système est verrouillé. Déverrouille d'abord Aerko_ avec ton code PIN.",
    "err_source_unsupported": "Source non prise en charge",
    "err_file_corrupt": "Le format du fichier n'est pas valide ou est corrompu.",
    "err_csv_empty": "CSV vide",
    "err_csv_columns": "Il manque des colonnes obligatoires dans le CSV",
    "err_zip_not_found": "Bibliothèque JSZip introuvable. Ajoute jszip.min.js à ton index.html.",
    "err_zip_corrupt": "Le fichier importé n'est pas un .zip valide ou est corrompu.",
    
    // --- STORE ---
    "unknown_app": "Inconnu"
};