/**
 * Motor de cálculo da pressão transpulmonar (balão esofágico Nutrivent™).
 *
 * Portado, valor a valor, das folhas `Balão Esofágico.xlsx` e
 * `Balão Esofágico (com valores alvo).xlsx` — ver `validate.ts`.
 *
 * Fórmulas (idênticas às da folha, células B8:C10):
 *   PLee (PL expiratória) = PEEP        − PEsee
 *   PLei (PL inspiratória) = Pplat       − PEsei
 *   DPl  (Driving PL)      = (Pplat − PEEP) − (PEsei − PEsee)
 *
 * onde:
 *   PEEP  — pressão das vias aéreas no fim da expiração
 *   Pplat — pressão das vias aéreas no fim da inspiração (pressão de plateau)
 *   PEsee — pressão esofágica no fim da expiração
 *   PEsei — pressão esofágica no fim da inspiração
 *
 * Cada uma das 4 pressões de entrada tem a sua própria unidade (cmH2O ou
 * mmHg) — por exemplo, a PEEP pode ser lida em cmH2O e a Pplat em mmHg no
 * mesmo cálculo. Um valor em mmHg é convertido para cmH2O antes do cálculo
 * (fator 1,36, igual à célula K4 da folha: `=I4*1,36`).
 */

export type PressureUnit = "cmH2O" | "mmHg";

/** Fator de conversão mmHg -> cmH2O usado na folha original (célula K4). */
export const MMHG_TO_CMH2O = 1.36;

/** Um valor de pressão medido, com a unidade em que foi introduzido. */
export interface PressureFieldInput {
  value: number;
  unit: PressureUnit;
}

export interface PressureInputs {
  /** PEEP — pressão das vias aéreas no fim da expiração. */
  peep: PressureFieldInput;
  /** Pplat — pressão das vias aéreas no fim da inspiração (plateau). */
  pplat: PressureFieldInput;
  /** PEsee — pressão esofágica no fim da expiração. */
  pEsee: PressureFieldInput;
  /** PEsei — pressão esofágica no fim da inspiração. */
  pEsei: PressureFieldInput;
}

export interface TranspulmonaryResult {
  /** Valores de entrada já convertidos para cmH2O (para mostrar ao utilizador). */
  peepCmH2O: number;
  pplatCmH2O: number;
  pEseeCmH2O: number;
  pEseiCmH2O: number;
  /** Pressão transpulmonar expiratória (PLee). Alvo: 0 a 5 cmH2O. */
  plExpiratory: number;
  /** Pressão transpulmonar inspiratória (PLei). Alvo: < 20 cmH2O. */
  plInspiratory: number;
  /** Driving pressure transpulmonar (DPl). Alvo: < 12 cmH2O. */
  drivingPl: number;
  /**
   * Driving pressure convencional do sistema respiratório (ΔP = Pplat − PEEP),
   * a medida "clássica" (não transpulmonar) usada na literatura de ventilação
   * protetora — mostrada como referência ao lado do resultado.
   */
  drivingPressureConventional: number;
}

/** Converte um valor de pressão para cmH2O, de acordo com a unidade de entrada. */
export function toCmH2O(value: number, unit: PressureUnit): number {
  return unit === "mmHg" ? value * MMHG_TO_CMH2O : value;
}

/**
 * Calcula as pressões transpulmonares a partir dos 4 valores medidos.
 * Cada valor é convertido para cmH2O de acordo com a sua própria unidade
 * antes de entrar nas fórmulas — as 4 unidades podem ser diferentes entre si.
 */
export function calculateTranspulmonaryPressures(inputs: PressureInputs): TranspulmonaryResult {
  const peep = toCmH2O(inputs.peep.value, inputs.peep.unit);
  const pplat = toCmH2O(inputs.pplat.value, inputs.pplat.unit);
  const pEsee = toCmH2O(inputs.pEsee.value, inputs.pEsee.unit);
  const pEsei = toCmH2O(inputs.pEsei.value, inputs.pEsei.unit);

  const plExpiratory = peep - pEsee;
  const plInspiratory = pplat - pEsei;
  const drivingPl = pplat - peep - (pEsei - pEsee);
  const drivingPressureConventional = pplat - peep;

  return {
    peepCmH2O: peep,
    pplatCmH2O: pplat,
    pEseeCmH2O: pEsee,
    pEseiCmH2O: pEsei,
    plExpiratory,
    plInspiratory,
    drivingPl,
    drivingPressureConventional,
  };
}

export type ExpiratoryTargetStatus = "atelectrauma" | "dentro" | "barotrauma";

/**
 * Avalia a PL expiratória contra o alvo 0–5 cmH2O
 * (< 0: risco de atelectrauma; > 5: risco de barotrauma).
 */
export function evaluateExpiratoryTarget(plExpiratory: number): ExpiratoryTargetStatus {
  if (plExpiratory < 0) return "atelectrauma";
  if (plExpiratory > 5) return "barotrauma";
  return "dentro";
}

/**
 * Estado de um limite "de teto" (PL inspiratória, Driving PL): dentro do
 * alvo, acima do alvo, ou negativo — caso em que o valor não faz sentido
 * clínico e deve ser revisto (erro provável nos valores introduzidos).
 */
export type LimitTargetStatus = "dentro" | "acima" | "revisar";

/** PL inspiratória: alvo < 20 cmH2O; negativa não faz sentido clínico. */
export function evaluateInspiratoryTarget(plInspiratory: number): LimitTargetStatus {
  if (plInspiratory < 0) return "revisar";
  if (plInspiratory >= 20) return "acima";
  return "dentro";
}

/** Driving PL: alvo < 12 cmH2O; negativo não faz sentido clínico. */
export function evaluateDrivingTarget(drivingPl: number): LimitTargetStatus {
  if (drivingPl < 0) return "revisar";
  if (drivingPl >= 12) return "acima";
  return "dentro";
}
