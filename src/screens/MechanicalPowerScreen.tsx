import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  calculateMechanicalPower,
  evaluateMechanicalPower,
  MECHANICAL_POWER_THRESHOLD,
} from "../calc/mechanicalPowerCalculator";

function fmt(n: number, decimals = 1) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pt-PT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function parseInput(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
}

type FieldKey = "respiratoryRate" | "tidalVolumeMl" | "peakPressure" | "plateauPressure" | "peep";

interface InputField {
  key: FieldKey;
  label: string;
  helper: string;
  unit: string;
  placeholder: string;
}

const FIELDS: InputField[] = [
  {
    key: "respiratoryRate",
    label: "RR",
    helper: "Frequência respiratória",
    unit: "cpm",
    placeholder: "ex: 15",
  },
  {
    key: "tidalVolumeMl",
    label: "VT",
    helper: "Volume corrente",
    unit: "mL",
    placeholder: "ex: 450",
  },
  {
    key: "peakPressure",
    label: "Ppico",
    helper: "Pressão de pico das vias aéreas",
    unit: "cmH2O",
    placeholder: "ex: 25",
  },
  {
    key: "plateauPressure",
    label: "Pplat",
    helper: "Pressão de plateau",
    unit: "cmH2O",
    placeholder: "ex: 20",
  },
  {
    key: "peep",
    label: "PEEP",
    helper: "Pressão expiratória final positiva",
    unit: "cmH2O",
    placeholder: "ex: 8",
  },
];

type Severity = "good" | "bad";

export interface MechanicalPowerScreenProps {
  onBack: () => void;
}

export default function MechanicalPowerScreen({ onBack }: MechanicalPowerScreenProps) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    respiratoryRate: "",
    tidalVolumeMl: "",
    peakPressure: "",
    plateauPressure: "",
    peep: "",
  });

  const setField = (key: FieldKey, v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const parsed = useMemo(() => {
    const respiratoryRate = parseInput(values.respiratoryRate);
    const tidalVolumeMl = parseInput(values.tidalVolumeMl);
    const peakPressure = parseInput(values.peakPressure);
    const plateauPressure = parseInput(values.plateauPressure);
    const peep = parseInput(values.peep);
    if (
      respiratoryRate === null ||
      tidalVolumeMl === null ||
      peakPressure === null ||
      plateauPressure === null ||
      peep === null
    ) {
      return null;
    }
    return { respiratoryRate, tidalVolumeMl, peakPressure, plateauPressure, peep };
  }, [values]);

  const result = useMemo(() => (parsed ? calculateMechanicalPower(parsed) : null), [parsed]);

  const status = result ? evaluateMechanicalPower(result.mechanicalPower) : null;
  const severity: Severity | null = status === "dentro" ? "good" : status === "acima" ? "bad" : null;
  const statusLabel = status === "acima" ? "Acima do valor de referência" : "Dentro do valor de referência";

  const nameStyle = severity === "bad" ? styles.resultNameBad : styles.resultNameGood;
  const valueStyle = severity === "bad" ? styles.bigResultValueBad : styles.bigResultValueGood;
  const unitStyle = severity === "bad" ? styles.bigResultUnitBad : styles.bigResultUnitGood;
  const pillStyle = severity === "bad" ? styles.pillBad : styles.pillGood;
  const pillTextStyle = severity === "bad" ? styles.pillTextBad : styles.pillTextGood;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mechanical Power</Text>
        <Text style={styles.subtitle}>Energia mecânica transferida ao pulmão por minuto</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Parâmetros do ventilador</Text>

          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {field.label} <Text style={styles.fieldHelper}>— {field.helper}</Text>
              </Text>
              <View style={styles.fieldInputRow}>
                <TextInput
                  style={[styles.input, styles.fieldInputFlex]}
                  value={values[field.key]}
                  onChangeText={(v) => setField(field.key, v)}
                  keyboardType="decimal-pad"
                  placeholder={field.placeholder}
                  accessibilityLabel={`${field.label} em ${field.unit}`}
                />
                <Text style={styles.fieldUnit}>{field.unit}</Text>
              </View>
            </View>
          ))}
        </View>

        {!parsed && (
          <View style={styles.card}>
            <Text style={styles.helperText}>
              Introduz a RR, o VT, a Ppico, a Pplat e a PEEP para calcular a mechanical power.
            </Text>
          </View>
        )}

        {result && (
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
        )}

        {result && status === "acima" && (
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  fieldBlock: { marginTop: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "700", color: "#12283C" },
  fieldHelper: { fontSize: 12, fontWeight: "400", color: "#5B6B7A" },
  fieldInputRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  fieldInputFlex: { flex: 1, marginTop: 0 },
  fieldUnit: { fontSize: 13, fontWeight: "600", color: "#5B6B7A", minWidth: 48 },
  input: {
    borderWidth: 1,
    borderColor: "#D6DEE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FBFCFD",
    color: "#12283C",
    marginTop: 6,
  },
  helperText: { color: "#5B6B7A", fontSize: 13, textAlign: "center" },
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
