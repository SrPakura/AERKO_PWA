export default {
    "res_loading": "Analyse des fibres...",
    "res_error_desc": "Il y a eu une erreur lors de l'analyse de tes données.",
    "res_error_btn": "Retour",
    "res_header_title": "Analyse/{{startDay}}-{{endDay}}_{{month}}_{{year}}",
    "res_tab_vol": "Volume",
    "res_tab_deseq": "Déséquilibres",
    "res_empty_vol": "Pas assez de données cette semaine.",
    "deseq_empty": [
        "Tout est parfait, aucun déséquilibre.",
        "Bon boulot, aucun déséquilibre."
    ],
    // CORRECCIÓN: "está semana" -> "esta semana" (esta no lleva tilde cuando acompaña al sustantivo)
    "deseq_intro": [
        "Aïe, il y a au moins un déséquilibre.",
        "Cette semaine, tu as eu des déséquilibres."
    ],
    "deseq_item_under": "Tu as sous-entraîné le/la {{headName}}. Tu as fait {{real}} séries, mais l'idéal aurait été {{ideal}}.",
    // CORRECCIÓN: Variables corregidas a minúsculas ({{Real}} -> {{real}}, {{ideal}}) para coincidir con tu código JS.
    "deseq_item_over": "Tu as sur-entraîné le/la {{headName}}. Tu as fait {{real}} séries alors que l'idéal serait de descendre à {{ideal}}."
};