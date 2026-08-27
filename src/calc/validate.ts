/**
 * Script de validação do motor de cálculo.
 *
 * Corre com: npx tsx src/calc/validate.ts
 * (não depende de React Native — pode correr em qualquer ambiente Node.)
 */
import {
  calculateTranspulmonaryPressures,
  evaluateExpiratoryTarget,
  isDrivingWithinTarget,
  isInspiratoryWithinTarget,
  toCmH2O,
} from "./transpulmonaryCalculator";

const EPSILON = 1e-6;
let allPass = true;

function approxEqual(a: number, b: number, label: string) {
  const diff = Math.abs(a - b);
  const status = diff < EPSILON ? "OK  " : "FAIL";
  console.log(`[${status}] ${label}: esperado=${b} obtido=${a} (dif=${diff.toExponential(3)})`);
  allPass = allPass && diff < EPSILON;
}

function equalStr(a: string, b: string, label: string) {
  const ok = a === b;
  console.log(`[${ok ? "OK  " : "FAIL"}] ${label}: esperado="${b}" obtido="${a}"`);
  allPass = allPass && ok;
}

function equalBool(a: boolean, b: boolean, label: string) {
  const ok = a === b;
  console.log(`[${ok ? "OK  " : "FAIL"}] ${label}: esperado=${b} obtido=${a}`);
  allPass = allPass && ok;
}

// ============================================================
// Caso de referência da folha "Balão Esofágico (com valores alvo).xlsx"
// PEEP=8, Pplat=22, PEsee=5,4, PEsei=16,3 (todos em cmH2O)
// -> PLee=2,6 ; PLei=5,7 ; DPl=3,1
// ============================================================
console.log("=== Caso de referência (entrada em cmH2O) ===");
{
  const r = calculateTranspulmonaryPressures(
    { peep: 8, pplat: 22, pEsee: 5.4, pEsei: 16.3 },
    "cmH2O"
  );
  approxEqual(r.plExpiratory, 2.5999999999999996, "PL expiratória (PLee)");
  approxEqual(r.plInspiratory, 5.699999999999999, "PL inspiratória (PLei)");
  approxEqual(r.drivingPl, 3.0999999999999996, "Driving PL (DPl)");
  equalStr(evaluateExpiratoryTarget(r.plExpiratory), "dentro", "Estado PL expiratória");
  equalBool(isInspiratoryWithinTarget(r.plInspiratory), true, "PL inspiratória dentro do alvo (<20)");
  equalBool(isDrivingWithinTarget(r.drivingPl), true, "Driving PL dentro do alvo (<12)");
}

// ============================================================
// Mesmo caso, mas com os 4 valores introduzidos em mmHg
// (mmHg x 1,36 = cmH2O, célula K4 da folha: `=I4*1,36`)
// Os valores em mmHg são os cmH2O de referência a dividir por 1,36.
// ============================================================
console.log("\n=== Mesmo caso, entrada em mmHg (deve dar o mesmo resultado em cmH2O) ===");
{
  const toMmHg = (cmH2O: number) => cmH2O / 1.36;
  const r = calculateTranspulmonaryPressures(
    {
      peep: toMmHg(8),
      pplat: toMmHg(22),
      pEsee: toMmHg(5.4),
      pEsei: toMmHg(16.3),
    },
    "mmHg"
  );
  approxEqual(r.peepCmH2O, 8, "PEEP convertida para cmH2O");
  approxEqual(r.pplatCmH2O, 22, "Pplat convertida para cmH2O");
  approxEqual(r.pEseeCmH2O, 5.4, "PEsee convertida para cmH2O");
  approxEqual(r.pEseiCmH2O, 16.3, "PEsei convertida para cmH2O");
  approxEqual(r.plExpiratory, 2.5999999999999996, "PL expiratória (PLee)");
  approxEqual(r.plInspiratory, 5.699999999999999, "PL inspiratória (PLei)");
  approxEqual(r.drivingPl, 3.0999999999999996, "Driving PL (DPl)");
}

// ============================================================
// Conversor simples (exemplo do protocolo: 12 mmHg = 16,3 cmH2O)
// ============================================================
console.log("\n=== Conversor mmHg -> cmH2O (exemplo do protocolo) ===");
{
  approxEqual(toCmH2O(12, "mmHg"), 16.32, "12 mmHg em cmH2O");
}

// ============================================================
// Estados de alvo — PL expiratória
// ============================================================
console.log("\n=== Estados de alvo da PL expiratória (0 a 5 cmH2O) ===");
{
  equalStr(evaluateExpiratoryTarget(-0.5), "atelectrauma", "PLee = -0,5 (risco de atelectrauma)");
  equalStr(evaluateExpiratoryTarget(0), "dentro", "PLee = 0 (limite inferior, dentro)");
  equalStr(evaluateExpiratoryTarget(5), "dentro", "PLee = 5 (limite superior, dentro)");
  equalStr(evaluateExpiratoryTarget(5.1), "barotrauma", "PLee = 5,1 (risco de barotrauma)");
}

// ============================================================
// Estados de alvo — PL inspiratória (<20) e Driving PL (<12)
// ============================================================
console.log("\n=== Estados de alvo da PL inspiratória e Driving PL ===");
{
  equalBool(isInspiratoryWithinTarget(19.9), true, "PLei = 19,9 (dentro do alvo)");
  equalBool(isInspiratoryWithinTarget(20), false, "PLei = 20 (fora do alvo)");
  equalBool(isDrivingWithinTarget(11.9), true, "DPl = 11,9 (dentro do alvo)");
  equalBool(isDrivingWithinTarget(12), false, "DPl = 12 (fora do alvo)");
}

console.log(`\n${allPass ? "TODOS OS TESTES PASSARAM" : "EXISTEM FALHAS"}`);
process.exit(allPass ? 0 : 1);
