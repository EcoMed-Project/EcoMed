export type MedicineInfo = {
  category: string;
  description: string;
};

const EXACT: Record<string, MedicineInfo> = {
  dipirona: { category: "Analgésico e antitérmico", description: "Alivia dores leves a moderadas e reduz a febre." },
  paracetamol: { category: "Analgésico e antitérmico", description: "Indicado para dor e febre, com baixo efeito anti-inflamatório." },
  ibuprofeno: { category: "Anti-inflamatório (AINE)", description: "Reduz dor, febre e inflamação." },
  amoxicilina: { category: "Antibiótico", description: "Combate infecções bacterianas comuns das vias respiratórias e urinárias." },
  "amoxicilina + clavulanato": { category: "Antibiótico associado", description: "Antibiótico de espectro ampliado para bactérias resistentes." },
  losartana: { category: "Anti-hipertensivo", description: "Controla a pressão arterial bloqueando a angiotensina II." },
  captopril: { category: "Anti-hipertensivo", description: "Inibidor da ECA usado no controle da pressão alta e insuficiência cardíaca." },
  omeprazol: { category: "Protetor gástrico", description: "Reduz a produção de ácido no estômago." },
  metformina: { category: "Antidiabético oral", description: "Controla a glicemia em pessoas com diabetes tipo 2." },
  sinvastatina: { category: "Redutor de colesterol", description: "Estatina que reduz o colesterol LDL." },
  "soro fisiológico": { category: "Solução de uso geral", description: "Limpeza nasal, ocular e de feridas." },
  salbutamol: { category: "Broncodilatador", description: "Alivia crises de asma e falta de ar." },
  prednisona: { category: "Corticoide", description: "Anti-inflamatório potente usado em alergias e doenças autoimunes." },
  "vitamina d": { category: "Suplemento vitamínico", description: "Auxilia na saúde óssea e imunológica." },
  sofosbuvir: { category: "Antiviral de ação direta", description: "Tratamento da hepatite C crônica." },
  osimertinibe: { category: "Terapia-alvo oncológica", description: "Inibidor de EGFR usado no câncer de pulmão." },
  imatinibe: { category: "Terapia-alvo oncológica", description: "Inibidor de tirosina quinase para leucemias e tumores GIST." },
  nusinersena: { category: "Terapia gênica (oligonucleotídeo)", description: "Tratamento da atrofia muscular espinhal (AME)." },
  "onasemnogeno abeparvoveque": { category: "Terapia gênica", description: "Terapia gênica de dose única para atrofia muscular espinhal." },
  ivacaftor: { category: "Modulador de CFTR", description: "Tratamento da fibrose cística." },
  "elexacaftor/tezacaftor/ivacaftor": { category: "Modulador de CFTR (tripla terapia)", description: "Tratamento combinado da fibrose cística." },
  migalastate: { category: "Chaperona farmacológica", description: "Tratamento oral da doença de Fabry." },
};

const SUFFIX_RULES: { test: RegExp; info: MedicineInfo }[] = [
  {
    test: /(agalsidase|alglucosidase|elosulfase|idursulfase|laronidase|velaglucerase|glucerase)/i,
    info: {
      category: "Terapia de reposição enzimática",
      description: "Repõe uma enzima ausente em doenças genéticas raras de depósito.",
    },
  },
  {
    test: /(zumabe|ximabe|umabe|cepte|ercepte)$/i,
    info: {
      category: "Medicamento biológico (anticorpo monoclonal)",
      description: "Imunobiológico de alto custo usado em doenças autoimunes, oncológicas ou raras.",
    },
  },
  {
    test: /(tinibe|nibe)$/i,
    info: {
      category: "Terapia-alvo oncológica",
      description: "Inibidor de quinases usado no tratamento de cânceres específicos.",
    },
  },
  {
    test: /(vir)$/i,
    info: { category: "Antiviral", description: "Atua diretamente contra vírus específicos." },
  },
  {
    test: /(cilina|ciclina|micina|floxacino|cef)/i,
    info: { category: "Antibiótico", description: "Combate infecções causadas por bactérias." },
  },
];

export function getMedicineInfo(name: string): MedicineInfo {
  const key = name.trim().toLowerCase();
  if (EXACT[key]) return EXACT[key];
  const partial = Object.keys(EXACT).find((k) => key.includes(k));
  if (partial) return EXACT[partial]!;
  for (const rule of SUFFIX_RULES) {
    if (rule.test.test(key.replace(/\s+\d.*$/, ""))) return rule.info;
  }
  return {
    category: "Medicamento",
    description: "Item triado por profissionais de saúde e disponível para retirada.",
  };
}
