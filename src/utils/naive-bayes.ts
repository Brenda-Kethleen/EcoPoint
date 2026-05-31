/**
 * EcoPoint - Classificador de Resíduos com Naive Bayes
 *
 * Implementa o algoritmo Naive Bayes para classificar resíduos sólidos
 * com base em atributos como tipo de material e nível de contaminação.
 *
 * Referência: Russell e Norvig (2013, p. 447) — classificação por
 * probabilidades condicionais com múltiplos atributos independentes.
 *
 * Fórmula: P(classe | atributos) ∝ P(classe) × ∏ P(atributo_i | classe)
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MaterialType = 'plastico' | 'papel' | 'metal' | 'organico' | 'vidro' | 'eletronico';
export type ContaminationLevel = 'limpo' | 'contaminado';
export type WasteClass = 'reciclavel' | 'organico' | 'rejeito';

export interface WasteAttributes {
  material: MaterialType;
  contamination: ContaminationLevel;
}

export interface ClassificationResult {
  wasteClass: WasteClass;
  probability: number;
  label: string;
  color: string;
  icon: string;
  disposalInstructions: string;
  tip: string;
}

// ─── Base de conhecimento (dados de treinamento) ──────────────────────────────

/**
 * Probabilidades a priori P(classe) — distribuição das classes no dataset
 */
const PRIOR: Record<WasteClass, number> = {
  reciclavel: 0.50,
  organico: 0.30,
  rejeito: 0.20,
};

/**
 * Probabilidades condicionais P(material | classe)
 * Baseadas em diretrizes de reciclagem do CONAMA e ABNT NBR 10004.
 */
const P_MATERIAL_GIVEN_CLASS: Record<MaterialType, Record<WasteClass, number>> = {
  plastico:    { reciclavel: 0.85, organico: 0.02, rejeito: 0.13 },
  papel:       { reciclavel: 0.80, organico: 0.05, rejeito: 0.15 },
  metal:       { reciclavel: 0.90, organico: 0.01, rejeito: 0.09 },
  vidro:       { reciclavel: 0.75, organico: 0.02, rejeito: 0.23 },
  organico:    { reciclavel: 0.05, organico: 0.90, rejeito: 0.05 },
  eletronico:  { reciclavel: 0.30, organico: 0.01, rejeito: 0.69 },
};

/**
 * Probabilidades condicionais P(contaminação | classe)
 * Resíduos contaminados têm menor chance de reciclagem.
 */
const P_CONTAMINATION_GIVEN_CLASS: Record<ContaminationLevel, Record<WasteClass, number>> = {
  limpo:       { reciclavel: 0.80, organico: 0.60, rejeito: 0.20 },
  contaminado: { reciclavel: 0.20, organico: 0.40, rejeito: 0.80 },
};

// ─── Metadados das classes ────────────────────────────────────────────────────

const CLASS_METADATA: Record<WasteClass, Omit<ClassificationResult, 'wasteClass' | 'probability'>> = {
  reciclavel: {
    label: 'Reciclável',
    color: '#4A7C59',
    icon: 'refresh-circle-outline',
    disposalInstructions:
      'Deposite na lixeira VERDE ou AZUL de coleta seletiva. ' +
      'Certifique-se de que o material está limpo e seco antes do descarte.',
    tip: 'Lave embalagens antes de descartar. Materiais limpos têm maior valor de reciclagem e evitam contaminação de outros resíduos.',
  },
  organico: {
    label: 'Orgânico',
    color: '#8B6914',
    icon: 'leaf-outline',
    disposalInstructions:
      'Deposite na lixeira MARROM de resíduos orgânicos. ' +
      'Se disponível, utilize composteira doméstica para transformar em adubo.',
    tip: 'Resíduos orgânicos representam ~50% do lixo doméstico. A compostagem reduz o volume de lixo e gera adubo natural.',
  },
  rejeito: {
    label: 'Rejeito',
    color: '#D9534F',
    icon: 'trash-outline',
    disposalInstructions:
      'Deposite na lixeira CINZA ou PRETA de resíduos comuns. ' +
      'Eletrônicos e pilhas devem ser levados a pontos de coleta especializados (Ecopontos).',
    tip: 'Rejeitos não podem ser reciclados nem compostados. Reduza a geração preferindo produtos com menos embalagem.',
  },
};

// ─── Classificador ────────────────────────────────────────────────────────────

/**
 * Classifica um resíduo usando o algoritmo Naive Bayes.
 *
 * Para cada classe c, calcula:
 *   score(c) = log P(c) + log P(material|c) + log P(contaminação|c)
 *
 * Usa log-probabilidades para evitar underflow numérico.
 */
export function classifyWaste(attributes: WasteAttributes): ClassificationResult {
  const classes: WasteClass[] = ['reciclavel', 'organico', 'rejeito'];
  const scores: Record<WasteClass, number> = {} as Record<WasteClass, number>;

  // Calcula log-score para cada classe
  for (const cls of classes) {
    const logPrior = Math.log(PRIOR[cls]);
    const logMaterial = Math.log(P_MATERIAL_GIVEN_CLASS[attributes.material][cls]);
    const logContamination = Math.log(P_CONTAMINATION_GIVEN_CLASS[attributes.contamination][cls]);
    scores[cls] = logPrior + logMaterial + logContamination;
  }

  // Converte log-scores para probabilidades (softmax)
  const maxScore = Math.max(...Object.values(scores));
  const expScores: Record<WasteClass, number> = {} as Record<WasteClass, number>;
  let sumExp = 0;

  for (const cls of classes) {
    expScores[cls] = Math.exp(scores[cls] - maxScore);
    sumExp += expScores[cls];
  }

  const probabilities: Record<WasteClass, number> = {} as Record<WasteClass, number>;
  for (const cls of classes) {
    probabilities[cls] = expScores[cls] / sumExp;
  }

  // Seleciona a classe com maior probabilidade
  const bestClass = classes.reduce((a, b) => (probabilities[a] > probabilities[b] ? a : b));

  return {
    wasteClass: bestClass,
    probability: probabilities[bestClass],
    ...CLASS_METADATA[bestClass],
  };
}

/**
 * Retorna todas as probabilidades para exibição detalhada.
 */
export function classifyWasteDetailed(
  attributes: WasteAttributes
): { result: ClassificationResult; allProbabilities: Record<WasteClass, number> } {
  const classes: WasteClass[] = ['reciclavel', 'organico', 'rejeito'];
  const scores: Record<WasteClass, number> = {} as Record<WasteClass, number>;

  for (const cls of classes) {
    const logPrior = Math.log(PRIOR[cls]);
    const logMaterial = Math.log(P_MATERIAL_GIVEN_CLASS[attributes.material][cls]);
    const logContamination = Math.log(P_CONTAMINATION_GIVEN_CLASS[attributes.contamination][cls]);
    scores[cls] = logPrior + logMaterial + logContamination;
  }

  const maxScore = Math.max(...Object.values(scores));
  const expScores: Record<WasteClass, number> = {} as Record<WasteClass, number>;
  let sumExp = 0;

  for (const cls of classes) {
    expScores[cls] = Math.exp(scores[cls] - maxScore);
    sumExp += expScores[cls];
  }

  const allProbabilities: Record<WasteClass, number> = {} as Record<WasteClass, number>;
  for (const cls of classes) {
    allProbabilities[cls] = expScores[cls] / sumExp;
  }

  const bestClass = classes.reduce((a, b) => (allProbabilities[a] > allProbabilities[b] ? a : b));

  const result: ClassificationResult = {
    wasteClass: bestClass,
    probability: allProbabilities[bestClass],
    ...CLASS_METADATA[bestClass],
  };

  return { result, allProbabilities };
}

// ─── Labels para UI ───────────────────────────────────────────────────────────

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  plastico: 'Plástico',
  papel: 'Papel / Papelão',
  metal: 'Metal / Alumínio',
  organico: 'Orgânico (restos de alimento)',
  vidro: 'Vidro',
  eletronico: 'Eletrônico / Pilha / Bateria',
};

export const CONTAMINATION_LABELS: Record<ContaminationLevel, string> = {
  limpo: 'Limpo (sem resíduos de alimento ou óleo)',
  contaminado: 'Contaminado (com resíduos, óleo ou sujeira)',
};
