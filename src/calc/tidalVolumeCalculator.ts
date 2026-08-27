/**
 * Motor de cálculo do volume corrente (Vc) e volume minuto (VM) para o
 * ecrã "Limites de Ventilação Mecânica".
 *
 * Regra clínica (definida pela equipa da UCIP):
 *   1. IMC = peso (kg) / altura (m)²
 *   2. Peso ideal (IBW) — fórmula de Devine, igual à usada no NutriCIP:
 *        Homem:  50   + 0,91 × (altura_cm − 152,4)
 *        Mulher: 45,5 + 0,91 × (altura_cm − 152,4)
 *   3. Peso usado no cálculo: peso real se o IMC estiver dentro do
 *      intervalo normal (18,5–24,9); peso ideal caso contrário (IMC
 *      abaixo do normal, excesso de peso ou obesidade).
 *   4. Volume corrente (Vc) = 6 a 8 mL por kg do peso usado.
 *   5. Volume minuto (VM) = Vc × frequência respiratória (FR).
 */

export type Sex = "M" | "F";

export interface AnthropometricInputs {
  weightKg: number;
  heightCm: number;
  sex: Sex;
}

/** IMC = peso (kg) / altura (m)². */
export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

export type BmiCategory = "abaixo do peso" | "normal" | "excesso de peso" | "obesidade";

/** Classificação da OMS: <18,5 abaixo do peso; 18,5–24,9 normal; 25–29,9 excesso de peso; ≥30 obesidade. */
export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return "abaixo do peso";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "excesso de peso";
  return "obesidade";
}

/** Peso ideal (fórmula de Devine) — igual à usada no NutriCIP. */
export function calculateIdealBodyWeight(heightCm: number, sex: Sex): number {
  const base = sex === "M" ? 50 : 45.5;
  return base + 0.91 * (heightCm - 152.4);
}

export interface TidalVolumeResult {
  bmi: number;
  bmiCategory: BmiCategory;
  /** true se o IMC está fora do normal e por isso se usa o peso ideal. */
  usesIdealWeight: boolean;
  idealBodyWeightKg: number;
  /** Peso realmente usado no cálculo (real ou ideal, consoante o IMC). */
  weightForCalcKg: number;
  /** Volume corrente mínimo (6 mL/kg do peso usado). */
  tidalVolumeMinMl: number;
  /** Volume corrente máximo (8 mL/kg do peso usado). */
  tidalVolumeMaxMl: number;
  /** Volume minuto mínimo (Vc mínimo × FR), em L/min. */
  minuteVolumeMinLPerMin: number;
  /** Volume minuto máximo (Vc máximo × FR), em L/min. */
  minuteVolumeMaxLPerMin: number;
}

/**
 * Calcula o volume corrente e o volume minuto a partir do peso, altura e
 * sexo do doente, e da frequência respiratória (FR, em ciclos/min).
 */
export function calculateTidalVolume(
  inputs: AnthropometricInputs,
  respiratoryRate: number
): TidalVolumeResult {
  const bmi = calculateBmi(inputs.weightKg, inputs.heightCm);
  const bmiCategory = classifyBmi(bmi);
  const idealBodyWeightKg = calculateIdealBodyWeight(inputs.heightCm, inputs.sex);
  const usesIdealWeight = bmiCategory !== "normal";
  const weightForCalcKg = usesIdealWeight ? idealBodyWeightKg : inputs.weightKg;

  const tidalVolumeMinMl = 6 * weightForCalcKg;
  const tidalVolumeMaxMl = 8 * weightForCalcKg;
  const minuteVolumeMinLPerMin = (tidalVolumeMinMl * respiratoryRate) / 1000;
  const minuteVolumeMaxLPerMin = (tidalVolumeMaxMl * respiratoryRate) / 1000;

  return {
    bmi,
    bmiCategory,
    usesIdealWeight,
    idealBodyWeightKg,
    weightForCalcKg,
    tidalVolumeMinMl,
    tidalVolumeMaxMl,
    minuteVolumeMinLPerMin,
    minuteVolumeMaxLPerMin,
  };
}
