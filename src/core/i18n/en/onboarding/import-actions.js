export default {
    "action_header": "Import_Data",
    "action_source": "/// SOURCE:",
    "action_drop_title": "Import_data",
    "action_drop_desc_aerko": "Upload your file <br><b>Aerko_Export.json</b>",
    "action_drop_desc_apple": "Tap to browse files.<br>Upload your Apple Health <b>export.xml</b> file",
    "action_drop_desc_health": "Tap to browse files.<br>Takeout files (.csv, .json) are accepted",
    "action_drop_desc_training": "Tap to browse files.<br>.json and .csv files from your previous app are accepted",
    "action_drop_desc_default": "Tap to browse files.",
    "action_file_ready": "File ready:<br><span style=\"color: var(--Verde-acido); font-weight: bold;\">{{name}}</span><br><span style=\"font-size:12px; opacity:0.6;\">({{size}} MB)</span>",
    "action_analyzing": "Analyzing... {{percent}}%",
    "action_saving": "Saving in vault...",
    "action_btn_import": "Import",
    "action_btn_cancel": "Cancel",
    "action_btn_processing": "Processing...",
    "action_alert_health": "Please select the health export file first.",
    "action_alert_training": "Please select a workout file first.",
    "action_alert_aerko": "Please select the backup file first.",
    "action_alert_error": "Error processing: ",
    "action_success_aerko": "> Aerko_ data restored successfully.",
    "action_success_health": "> {{count}} biometrics records imported.",
    "action_success_training": "> {{count}} records from [{{app}}] imported.",
    
    // --- ERRORES DE SERVICIOS ---
    "err_health_unsupported": "Unsupported health source.",
    "err_xml_read": "Error reading the XML file.",
    "err_csv_read": "Error reading the CSV file.",
    "err_json_corrupt": "The file is not a valid JSON or is corrupted.",
    "err_system_locked": "System is locked. Unlock Aerko_ with your PIN first.",
    "err_source_unsupported": "Unsupported source.",
    "err_file_corrupt": "The file format is invalid or corrupted.",
    "err_csv_empty": "Empty CSV.",
    "err_csv_columns": "Missing mandatory columns in the CSV.",
    "err_zip_not_found": "JSZip library not found. Add jszip.min.js in your index.html.",
    "err_zip_corrupt": "The uploaded file is not a valid .zip or is corrupted.",
    
    // --- STORE ---
    "unknown_app": "Unknown"
};