export default {
    "action_header": "Importar_Datos",
    "action_source": "/// FUENTE:",
    "action_drop_title": "Importar_datos",
    "action_drop_desc_aerko": "Sube tu archivo <br><b>Aerko_Export.json</b>",
    "action_drop_desc_apple": "Toca para explorar archivos.<br>Sube tu archivo <b>export.xml</b> de Apple Health",
    "action_drop_desc_health": "Toca para explorar archivos.<br>Se aceptan archivos de Takeout (.csv, .json)",
    "action_drop_desc_training": "Toca para explorar archivos.<br>Se aceptan .json y .csv de tu app anterior",
    "action_drop_desc_default": "Toca para explorar archivos.",
    "action_file_ready": "Archivo listo:<br><span style=\"color: var(--Verde-acido); font-weight: bold;\">{{name}}</span><br><span style=\"font-size:12px; opacity:0.6;\">({{size}} MB)</span>",
    "action_analyzing": "Analizando... {{percent}}%",
    "action_saving": "Guardando en bóveda...",
    "action_btn_import": "Importar",
    "action_btn_cancel": "Cancelar",
    "action_btn_processing": "Procesando...",
    "action_alert_health": "Selecciona el archivo de exportación de salud primero.",
    "action_alert_training": "Selecciona un archivo de entrenamientos primero.",
    "action_alert_aerko": "Selecciona el archivo de backup primero.",
    "action_alert_error": "Error al procesar: ",
    "action_success_aerko": "> Datos de Aerko_ restaurados correctamente.",
    "action_success_health": "> {{count}} registros de biometría importados.",
    "action_success_training": "> {{count}} registros de [{{app}}] importados.",
    
    // --- ERRORES DE SERVICIOS ---
    "err_health_unsupported": "Fuente de salud no soportada.",
    "err_xml_read": "Error leyendo el archivo XML.",
    "err_csv_read": "Error leyendo el archivo CSV.",
    "err_json_corrupt": "El archivo no es un JSON válido o está corrupto.",
    "err_system_locked": "El sistema está bloqueado. Desbloquea Aerko_ con tu PIN primero.",
    "err_source_unsupported": "Fuente no soportada",
    "err_file_corrupt": "El formato del archivo no es válido o está corrupto.",
    "err_csv_empty": "CSV vacío",
    "err_csv_columns": "Faltan columnas obligatorias en el CSV",
    "err_zip_not_found": "Librería JSZip no encontrada. Añade jszip.min.js en tu index.html.",
    "err_zip_corrupt": "El archivo subido no es un .zip válido o está corrupto.",
    
    // --- STORE ---
    "unknown_app": "Desconocido"
};