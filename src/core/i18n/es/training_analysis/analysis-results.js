export default {
    "res_loading": "Analizando fibras...",
    "res_error_desc": "Hubo un error al analizar tus datos.",
    "res_error_btn": "Volver",
    "res_header_title": "Análisis/{{startDay}}-{{endDay}}_{{month}}_{{year}}",
    "res_tab_vol": "Volumen",
    "res_tab_deseq": "Desequilibrios",
    "res_empty_vol": "No hay datos suficientes esta semana.",
    "deseq_empty": [
        "Todo está perfecto, no hay desequilibrios.",
        "Buen trabajo, no hay desequilibrios."
    ],
    // CORRECCIÓN: "está semana" -> "esta semana" (esta no lleva tilde cuando acompaña al sustantivo)
    "deseq_intro": [
        "Vaya, hay como mínimo un desequilibrio.",
        "Esta semana has tenido desequilibrios."
    ],
    "deseq_item_under": "Has infra-entrenado el/la {{headName}}. Has hecho {{real}} series, pero lo ideal hubieran sido {{ideal}}.",
    // CORRECCIÓN: Variables corregidas a minúsculas ({{Real}} -> {{real}}, {{ideal}}) para coincidir con tu código JS.
    "deseq_item_over": "Has sobre-entrenado el/la {{headName}}. Has hecho {{real}} series cuando lo ideal sería bajar a las {{ideal}}."
};