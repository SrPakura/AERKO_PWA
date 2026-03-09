export default {
    "res_loading": "Analisando fibras...",
    "res_error_desc": "Houve um erro ao analisar seus dados.",
    "res_error_btn": "Voltar",
    "res_header_title": "Análise/{{startDay}}-{{endDay}}_{{month}}_{{year}}",
    "res_tab_vol": "Volume",
    "res_tab_deseq": "Desequilíbrios",
    "res_empty_vol": "Não há dados suficientes esta semana.",
    "deseq_empty": [
        "Tudo está perfeito, não há desequilíbrios.",
        "Bom trabalho, não há desequilíbrios."
    ],
    // CORREÇÃO: "está semana" -> "esta semana" (esta não leva acento quando acompanha o substantivo)
    "deseq_intro": [
        "Nossa, há no mínimo um desequilíbrio.",
        "Esta semana você teve desequilíbrios."
    ],
    "deseq_item_under": "Você subtreinou o(a) {{headName}}. Fez {{real}} séries, mas o ideal teriam sido {{ideal}}.",
    // CORREÇÃO: Variáveis corrigidas para minúsculas ({{Real}} -> {{real}}, {{ideal}}) para coincidir com seu código JS.
    "deseq_item_over": "Você sobretreinou o(a) {{headName}}. Fez {{real}} séries quando o ideal seria baixar para {{ideal}}."
};