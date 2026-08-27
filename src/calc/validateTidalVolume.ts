/**
 * Script de validação do motor de cálculo do volume corrente/minuto.
 *
 * Corre com: npx tsx src/calc/validateTidalVolume.ts
 * (não depende de React Native — pode correr em qualquer ambiente Node.)
 */
import {
  calculateBmi,
  calculateIdealBodyWeight,
  calculateTidalVolume,
  classifyBmi,
} from "./tidalVolumeCalculator";

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
// IBW (Devine) — mesmo caso de referência usado no NutriCIP
// (altura 174 cm, homem -> 69,656 kg)
// ============================================================
console.log("=== Peso ideal (Devine), caso de referência do NutriCIP ===");
{
  approxEqual(calculateIdealBodyWeight(174, "M"), 69.65599999999999, "IBW homem, 174 cm");
}

// ============================================================
// Caso 1: IMC obesidade (peso 100 kg, altura 174 cm, homem) -> usa peso ideal
// ============================================================
console.log("\n=== Caso 1: IMC de obesidade -> usa peso ideal ===");
{
  const bmi = calculateBmi(100, 174);
  approxEqual(bmi, 33.029462280354075, "IMC");
  equalStr(classifyBmi(bmi), "obesidade", "Categoria do IMC");

  const r = calculateTidalVolume({ weightKg: 100, heightCm: 174, sex: "M" }, 16);
  equalBool(r.usesIdealWeight, true, "Usa peso ideal");
  approxEqual(r.weightForCalcKg, 69.65599999999999, "Peso usado no cálculo (ideal)");
  approxEqual(r.tidalVolumeMinMl, 417.93599999999996, "Vc mínimo (6 mL/kg)");
  approxEqual(r.tidalVolumeMaxMl, 557.2479999999999, "Vc máximo (8 mL/kg)");
  approxEqual(r.minuteVolumeMinLPerMin, 6.686975999999999, "VM mínimo (Vc min x FR)");
  approxEqual(r.minuteVolumeMaxLPerMin, 8.915967999999999, "VM máximo (Vc max x FR)");
}

// ============================================================
// Caso 2: IMC normal (peso 70 kg, altura 175 cm, mulher) -> usa peso real
// ============================================================
console.log("\n=== Caso 2: IMC normal -> usa peso real ===");
{
  const bmi = calculateBmi(70, 175);
  approxEqual(bmi, 22.857142857142858, "IMC");
  equalStr(classifyBmi(bmi), "normal", "Categoria do IMC");

  const r = calculateTidalVolume({ weightKg: 70, heightCm: 175, sex: "F" }, 14);
  equalBool(r.usesIdealWeight, false, "Usa peso real (não ideal)");
  approxEqual(r.weightForCalcKg, 70, "Peso usado no cálculo (real)");
  approxEqual(r.tidalVolumeMinMl, 420, "Vc mínimo (6 mL/kg)");
  approxEqual(r.tidalVolumeMaxMl, 560, "Vc máximo (8 mL/kg)");
  approxEqual(r.minuteVolumeMinLPerMin, 5.88, "VM mínimo (Vc min x FR)");
  approxEqual(r.minuteVolumeMaxLPerMin, 7.84, "VM máximo (Vc max x FR)");
}

// ============================================================
// Caso 3: IMC abaixo do peso (peso 45 kg, altura 165 cm, mulher) -> usa peso ideal
// ============================================================
console.log("\n=== Caso 3: IMC abaixo do peso -> usa peso ideal ===");
{
  const bmi = calculateBmi(45, 165);
  equalStr(classifyBmi(bmi), "abaixo do peso", "Categoria do IMC");
  const r = calculateTidalVolume({ weightKg: 45, heightCm: 165, sex: "F" }, 18);
  equalBool(r.usesIdealWeight, true, "Usa peso ideal");
  approxEqual(r.idealBodyWeightKg, calculateIdealBodyWeight(165, "F"), "Peso ideal calculado corretamente");
}

// ============================================================
// Fronteiras da classificação do IMC
// ============================================================
console.log("\n=== Fronteiras da classificação do IMC ===");
{
  equalStr(classifyBmi(18.4), "abaixo do peso", "IMC 18,4");
  equalStr(classifyBmi(18.5), "normal", "IMC 18,5 (limite inferior do normal)");
  equalStr(classifyBmi(24.9), "normal", "IMC 24,9 (dentro do normal)");
  equalStr(classifyBmi(25), "excesso de peso", "IMC 25 (limite do excesso de peso)");
  equalStr(classifyBmi(29.9), "excesso de peso", "IMC 29,9");
  equalStr(classifyBmi(30), "obesidade", "IMC 30 (limite da obesidade)");
}

console.log(`\n${allPass ? "TODOS OS TESTES PASSARAM" : "EXISTEM FALHAS"}`);
process.exit(allPass ? 0 : 1);
