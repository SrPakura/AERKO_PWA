export default {
    "res_loading": "Analizando fibras...",
    // CORRECCIÓN: Quitada la repetición de "un pequeño".
    "res_error_desc": "Hemos tenido un pequeño problema al analizar tus datos.",
    "res_error_btn": "Volver",
    "res_header_title": "Análisis/{{startDay}}-{{endDay}}_{{month}}_{{year}}",
    "res_tab_vol": "Volumen",
    "res_tab_deseq": "Desequilibrios",
    "res_empty_vol": "Aún no tenemos datos suficientes para analizar esta semana.",
    // CORRECCIÓN: Los signos de exclamación en español se abren y se cierran (¡...!).
    "deseq_empty": [
        "¡Felicidades, todo está perfecto!",
        "Y encontramos un total de 0 desequilibrios. ¡Bien hecho!"
    ],
    "deseq_intro": [
        "Por desgracia hemos encontrado desequilibrios, pero no te preocupes, es solucionable.",
        "No te alarmes, pero hay algún que otro desequilibrio. Por suerte, ahora que lo sabes, puedes solucionarlo."
    ],
    // CORRECCIÓN: "está semana" -> "esta semana".
    "deseq_item_under": "Mira, esta semana has hecho {{real}} series efectivas para el/la {{headName}}, lo que no está mal, pero hubiera estado mejor llegar a {{ideal}}.",
    // CORRECCIÓN: Variables a camelCase exacto ({{headname}} -> {{headName}}).
    "deseq_item_over": "Bueno, podría ser mucho peor. Has sobre-entrenado el/la {{headName}} con un total de {{real}} series efectivas, lo cual no está mal, pero lo óptimo hubiera sido bajar a las {{ideal}}."
};