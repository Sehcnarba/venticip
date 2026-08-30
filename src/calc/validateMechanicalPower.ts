import {
  calculateMechanicalPower,
  evaluateMechanicalPower,
  MECHANICAL_POWER_THRESHOLD,
} from "./mechanicalPowerCalculator";

let failures = 0;

function approxEqual(actual: number, expected: number, tolerance = 0.01, label = ""): void {
  const ok = Math.abs(actual - expected) <= tolerance;
  console.log(`${ok ? "OK" : "FAIL"} ${label} — actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}

function equalStr(actual: string, expected: string, label = ""): void {
  const ok = actual === expected;
  console.log(`${ok ? "OK" : "FAIL"} ${label} — actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}

// Caso de referência: RR=15 cpm, Vc=450 mL, Ppico=25, Pplat=20, PEEP=8
// DP = 20 - 8 = 12; Ppico - 0.5*DP = 25 - 6 = 19; Vc em L = 0.45
// MP = 0.098 * 15 * 0.45 * 19 = 12.5685 J/min
{
  const result = calculateMechanicalPower({
    respiratoryRate: 15,
    tidalVolumeMl: 450,
    peakPressure: 25,
    plateauPressure: 20,
    peep: 8,
  });
  approxEqual(result.drivingPressure, 12, 0.001, "reference drivingPressure");
  approxEqual(result.mechanicalPower, 12.5685, 0.001, "reference mechanicalPower");
  equalStr(evaluateMechanicalPower(result.mechanicalPower), "dentro", "reference status (<=17)");
}

// Caso de alto risco: RR=25 cpm, Vc=500 mL, Ppico=35, Pplat=28, PEEP=10
// DP = 18; Ppico - 0.5*DP = 35 - 9 = 26; Vc em L = 0.5
// MP = 0.098 * 25 * 0.5 * 26 = 31.85 J/min
{
  const result = calculateMechanicalPower({
    respiratoryRate: 25,
    tidalVolumeMl: 500,
    peakPressure: 35,
    plateauPressure: 28,
    peep: 10,
  });
  approxEqual(result.drivingPressure, 18, 0.001, "high-risk drivingPressure");
  approxEqual(result.mechanicalPower, 31.85, 0.001, "high-risk mechanicalPower");
  equalStr(evaluateMechanicalPower(result.mechanicalPower), "acima", "high-risk status (>17)");
}

// Caso de baixo esforço: RR=10 cpm, Vc=350 mL, Ppico=15, Pplat=13, PEEP=6
// DP = 7; Ppico - 0.5*DP = 15 - 3.5 = 11.5; Vc em L = 0.35
// MP = 0.098 * 10 * 0.35 * 11.5 = 3.9445 J/min
{
  const result = calculateMechanicalPower({
    respiratoryRate: 10,
    tidalVolumeMl: 350,
    peakPressure: 15,
    plateauPressure: 13,
    peep: 6,
  });
  approxEqual(result.drivingPressure, 7, 0.001, "low-effort drivingPressure");
  approxEqual(result.mechanicalPower, 3.9445, 0.001, "low-effort mechanicalPower");
  equalStr(evaluateMechanicalPower(result.mechanicalPower), "dentro", "low-effort status (<=17)");
}

// Fronteira do limite (17 J/min): exatamente no limite conta como "dentro";
// qualquer valor acima conta como "acima".
{
  equalStr(evaluateMechanicalPower(MECHANICAL_POWER_THRESHOLD), "dentro", "boundary exactly 17 -> dentro");
  equalStr(evaluateMechanicalPower(MECHANICAL_POWER_THRESHOLD + 0.01), "acima", "boundary 17.01 -> acima");
  equalStr(evaluateMechanicalPower(0), "dentro", "boundary 0 -> dentro");
}

if (failures > 0) {
  console.log(`\n${failures} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log("\nTodos os testes passaram.");
}
