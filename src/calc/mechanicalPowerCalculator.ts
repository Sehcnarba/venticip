// Mechanical Power (fórmula simplificada, ventilação controlada a volume)
//
//   MP = 0,098 × RR × Vc × [ Ppico − 1/2 × (Pplat − PEEP) ]
//
// onde RR = frequência respiratória (ciclos/min), Vc = volume corrente (litros),
// Ppico = pressão de pico das vias aéreas (cmH2O), Pplat = pressão de plateau
// (cmH2O), PEEP = pressão expiratória final positiva (cmH2O). Resultado em J/min.
//
// Referência: Gattinoni L, et al. Mechanical power and development of
// ventilator-induced lung injury. Anesthesiology. 2016.

export interface MechanicalPowerInputs {
  /** Frequência respiratória, em ciclos/min. */
  respiratoryRate: number;
  /** Volume corrente, em mL (convertido internamente para litros). */
  tidalVolumeMl: number;
  /** Pressão de pico das vias aéreas, em cmH2O. */
  peakPressure: number;
  /** Pressão de plateau, em cmH2O. */
  plateauPressure: number;
  /** PEEP, em cmH2O. */
  peep: number;
}

export interface MechanicalPowerResult {
  /** Driving pressure convencional = Pplat − PEEP, em cmH2O. */
  drivingPressure: number;
  /** Mechanical power, em J/min. */
  mechanicalPower: number;
}

/**
 * Limite de referência citado na literatura (Serpa Neto A, et al. Mechanical
 * power of ventilation is associated with mortality in critically ill
 * patients... Intensive Care Med. 2018) como associado a maior risco de
 * lesão pulmonar/mortalidade acima deste valor.
 */
export const MECHANICAL_POWER_THRESHOLD = 17;

export function calculateMechanicalPower(inputs: MechanicalPowerInputs): MechanicalPowerResult {
  const { respiratoryRate, tidalVolumeMl, peakPressure, plateauPressure, peep } = inputs;
  const tidalVolumeL = tidalVolumeMl / 1000;
  const drivingPressure = plateauPressure - peep;
  const mechanicalPower = 0.098 * respiratoryRate * tidalVolumeL * (peakPressure - 0.5 * drivingPressure);
  return { drivingPressure, mechanicalPower };
}

export type MechanicalPowerStatus = "dentro" | "acima";

export function evaluateMechanicalPower(mechanicalPower: number): MechanicalPowerStatus {
  return mechanicalPower > MECHANICAL_POWER_THRESHOLD ? "acima" : "dentro";
}
