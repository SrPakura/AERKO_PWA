export default {
    "res_loading": "Analyzing fibers...",
    "res_error_desc": "There was an error analyzing your data.",
    "res_error_btn": "Back",
    "res_header_title": "Analysis/{{startDay}}-{{endDay}}_{{month}}_{{year}}",
    "res_tab_vol": "Volume",
    "res_tab_deseq": "Imbalances",
    "res_empty_vol": "Not enough data this week.",
    "deseq_empty": [
        "Everything is perfect, no imbalances.",
        "Good job, no imbalances."
    ],
    // CORRECCIÓN: "está semana" -> "esta semana" (esta no lleva tilde cuando acompaña al sustantivo)
    "deseq_intro": [
        "Looks like there is at least one imbalance.",
        "You've had imbalances this week."
    ],
    "deseq_item_under": "You have under-trained the {{headName}}. You did {{real}} sets, but the ideal would have been {{ideal}}.",
    // CORRECCIÓN: Variables corregidas a minúsculas ({{Real}} -> {{real}}, {{ideal}}) para coincidir con tu código JS.
    "deseq_item_over": "You have over-trained the {{headName}}. You did {{real}} sets when the ideal would be to drop to {{ideal}}."
};