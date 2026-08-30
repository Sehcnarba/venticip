import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import RulerSlider from "../components/RulerSlider";
import {
  calculateMechanicalPower,
  evaluateMechanicalPower,
  MECHANICAL_POWER_THRESHOLD,
} from "../calc/mechanicalPowerCalculator";

function fmt(n: number, decimals = 1) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pt-PT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

type FieldKey = "respiratoryRate" | "tidalVolumeMl" | "peakPressure" | "plateauPressure" | "peep";

interface SliderField {
  key: FieldKey;
  label: string;
  helper: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const FIELDS: SliderField[] = [
  { key: "respiratoryRate", label: "RR", helper: "Frequência respiratória", unit: "cpm", min: 8, max: 40, step: 1 },
  { key: "tidalVolumeMl", label: "Vc", helper: "Volume corrente", unit: "mL", min: 100, max: 800, step: 10 },
  {
    key: "peakPressure",
    label: "Ppico",
    helper: "Pressão de pico das vias aéreas",
    unit: "cmH2O",
    min: 0,
    max: 60,
    step: 1,
  },
  { key: "plateauPressure", label: "Pplat", helper: "Pressão de plateau", unit: "cmH2O", min: 0, max: 50, step: 1 },
  {
    key: "peep",
    label: "PEEP",
    helper: "Pressão expiratória final positiva",
    unit: "cmH2O",
    min: 0,
    max: 24,
    step: 1,
  },
];

// Valores iniciais das réguas — coincidem com o caso de referência validado
// em src/calc/validateMechanicalPower.ts (MP ≈ 12,57 J/min, dentro do alvo).
const DEFAULT_VALUES: Record<FieldKey, number> = {
  respiratoryRate: 15,
  tidalVolumeMl: 450,
  peakPressure: 25,
  plateauPressure: 20,
  peep: 8,
};

type Severity = "good" | "bad";

export interface MechanicalPowerScreenProps {
  onBack: () => void;
}

export default function MechanicalPowerScreen({ onBack }: MechanicalPowerScreenProps) {
  const [values, setValues] = useState<Record<FieldKey, number>>(DEFAULT_VALUES);

  const setField = (key: FieldKey, v: number) => setValues((prev) => ({ ...prev, [key]: v }));

  // Recalculado em tempo real a cada movimento de qualquer régua.
  const result = useMemo(() => calculateMechanicalPower(values), [values]);

  const status = evaluateMechanicalPower(result.mechanicalPower);
  const severity: Severity = status === "acima" ? "bad" : "good";
  const statusLabel = status === "acima" ? "Acima do valor de referência" : "Dentro do valor de referência";

  const nameStyle = severity === "bad" ? styles.resultNameBad : styles.resultNameGood;
  const valueStyle = severity === "bad" ? styles.bigResultValueBad : styles.bigResultValueGood;
  const unitStyle = severity === "bad" ? styles.bigResultUnitBad : styles.bigResultUnitGood;
  const pillStyle = severity === "bad" ? styles.pillBad : styles.pillGood;
  const pillTextStyle = severity === "bad" ? styles.pillTextBad : styles.pillTextGood;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
        <Text style={styles.backButtonText}>‹ Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Mechanical Power</Text>
      <Text style={styles.subtitle}>Energia mecânica transferida ao pulmão por minuto</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Parâmetros do ventilador</Text>
        <Text style={styles.helperTextInline}>
          Move as réguas — o resultado é recalculado em tempo real.
        </Text>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldBlock}>
            <Text style={styles.fieldHelper}>{field.helper}</Text>
            <RulerSlider
              label={field.label}
              value={values[field.key]}
              onChange={(v) => setField(field.key, v)}
              min={field.min}
              max={field.max}
              step={field.step}
              unit={field.unit}
            />
          </View>
        ))}
      </View>

      <View style={[styles.card, styles.resultCard]}>
        <Text style={styles.sectionLabel}>Resultado</Text>

        <Text style={styles.subSectionLabel}>Driving Pressure convencional (Pplat − PEEP)</Text>
        <View style={styles.metricsRow}>
          <Text style={styles.metricText}>{fmt(result.drivingPressure)} cmH2O</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.resultHeaderRow}>
          <Text style={[styles.resultName, nameStyle]}>Mechanical Power (MP)</Text>
          <View style={[styles.pill, pillStyle]}>
            <Text style={[styles.pillText, pillTextStyle]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.bigResultRow}>
          <Text style={[styles.bigResultValue, valueStyle]}>{fmt(result.mechanicalPower)}</Text>
          <Text style={[styles.bigResultUnit, unitStyle]}>J/min</Text>
        </View>
        <Text style={styles.resultTargetText}>
          Referência: ≤{MECHANICAL_POWER_THRESHOLD} J/min (Serpa Neto et al., 2018)
        </Text>
      </View>

      {status === "acima" && (
        <View style={[styles.card, styles.suggestionCard]}>
          <Text style={styles.sectionLabel}>Sugestão de atuação</Text>
          <View style={styles.suggestionRow}>
            <Text style={[styles.suggestionBullet, styles.textBad]}>•</Text>
            <Text style={[styles.suggestionText, styles.textBad]}>
              Rever volume corrente, PEEP, driving pressure e frequência respiratória, no sentido
              de reduzir a energia mecânica transferida ao pulmão.
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Esta aplicação é uma ferramenta de apoio ao cálculo para profissionais de saúde. Não
        substitui o julgamento clínico nem a verificação por um segundo profissional. Confirme
        sempre os valores lidos no monitor/ventilador antes de ajustar a ventilação.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#F4F6F8" },
  backButton: { alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 4, marginBottom: 4 },
  backButtonText: { fontSize: 15, color: "#12283C", fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "700", color: "#12283C", textAlign: "center" },
  subtitle: {
    fontSize: 13,
    color: "#5B6B7A",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  resultCard: { borderWidth: 1, borderColor: "#CFE3D8", backgroundColor: "#F2FAF5" },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#12283C", textTransform: "uppercase", letterSpacing: 0.4 },
  subSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B6B7A",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  helperTextInline: { fontSize: 12, color: "#7A8894", marginTop: 6, fontStyle: "italic" },
  fieldBlock: { marginTop: 20 },
  fieldHelper: { fontSize: 12, color: "#7A8894", marginBottom: 6 },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", rowGap: 4, columnGap: 8 },
  metricText: { fontSize: 13, color: "#33404B" },
  divider: { height: 1, backgroundColor: "#E1EAE4", marginVertical: 12 },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  resultName: { fontSize: 14, fontWeight: "700" },
  resultNameGood: { color: "#1F5A3B" },
  resultNameBad: { color: "#B23B3B" },
  bigResultRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginTop: 6 },
  bigResultValue: { fontSize: 36, fontWeight: "800" },
  bigResultValueGood: { color: "#1F5A3B" },
  bigResultValueBad: { color: "#B23B3B" },
  bigResultUnit: { fontSize: 15, marginLeft: 8, fontWeight: "600" },
  bigResultUnitGood: { color: "#1F5A3B" },
  bigResultUnitBad: { color: "#B23B3B" },
  resultTargetText: { fontSize: 12, color: "#5B6B7A", textAlign: "center", marginTop: 4 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  pillGood: { backgroundColor: "#DCEFE2" },
  pillBad: { backgroundColor: "#FBE4E4" },
  pillText: { fontSize: 11, fontWeight: "700" },
  pillTextGood: { color: "#1F5A3B" },
  pillTextBad: { color: "#B23B3B" },
  suggestionCard: { borderWidth: 1, borderColor: "#F3C6C6" },
  suggestionRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, gap: 8 },
  suggestionBullet: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  suggestionText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  textBad: { color: "#B23B3B" },
  disclaimer: { fontSize: 11, color: "#8894A0", textAlign: "center", marginTop: 8, lineHeight: 16 },
});
