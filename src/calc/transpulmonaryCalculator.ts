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
 * Todas as pressões de entrada podem ser introduzidas em cmH2O ou em mmHg;
 * quando a unidade escolhida é mmHg, os valores são convertidos para cmH2O
 * antes do cálculo (fator 1,36, igual à célula K4 da folha: `=I4*1,36`).
 */

export type PressureUnit = "cmH2O" | "mmHg";

/** Fator de conversão mmHg -> cmH2O usado na folha original (célula K4). */
export const MMHG_TO_CMH2O = 1.36;

export interface PressureInputs {
  /** PEEP — pressão das vias aéreas no fim da expiração. */
  peep: number;
  /** Pplat — pressão das vias aéreas no fim da inspiração (plateau). */
  pplat: number;
  /** PEsee — pressão esofágica no fim da expiração. */
  pEsee: number;
  /** PEsei — pressão esofágica no fim da inspiração. */
  pEsei: number;
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
}

/** Converte um valor de pressão para cmH2O, de acordo com a unidade de entrada. */
export function toCmH2O(value: number, unit: PressureUnit): number {
  return unit === "mmHg" ? value * MMHG_TO_CMH2O : value;
}

/** Calcula as pressões transpulmonares a partir dos 4 valores medidos. */
export function calculateTranspulmonaryPressures(
  inputs: PressureInputs,
  unit: PressureUnit
): TranspulmonaryResult {
  const peep = toCmH2O(inputs.peep, unit);
  const pplat = toCmH2O(inputs.pplat, unit);
  const pEsee = toCmH2O(inputs.pEsee, unit);
  const pEsei = toCmH2O(inputs.pEsei, unit);

  const plExpiratory = peep - pEsee;
  const plInspiratory = pplat - pEsei;
  const drivingPl = pplat - peep - (pEsei - pEsee);

  return {
    peepCmH2O: peep,
    pplatCmH2O: pplat,
    pEseeCmH2O: pEsee,
    pEseiCmH2O: pEsei,
    plExpiratory,
    plInspiratory,
    drivingPl,
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

/** PL inspiratória dentro do alvo (< 20 cmH2O)? */
export function isInspiratoryWithinTarget(plInspiratory: number): boolean {
  return plInspiratory < 20;
}

/** Driving PL dentro do alvo (< 12 cmH2O)? */
export function isDrivingWithinTarget(drivingPl: number): boolean {
  return drivingPl < 12;
}
