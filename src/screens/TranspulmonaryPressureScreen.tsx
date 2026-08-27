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
  calculateTranspulmonaryPressures,
  evaluateExpiratoryTarget,
  isDrivingWithinTarget,
  isInspiratoryWithinTarget,
  PressureUnit,
} from "../calc/transpulmonaryCalculator";

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmentedRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.segmentedOption, selected && styles.segmentedOptionSelected]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.segmentedLabel, selected && styles.segmentedLabelSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function fmt(n: number, decimals = 1) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pt-PT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function parseInput(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v.replace(",", "."));
  return isNaN(n) ? null : n;
}

interface PressureField {
  key: "peep" | "pplat" | "pEsee" | "pEsei";
  label: string;
  helper: string;
  placeholder: string;
}

const FIELDS: PressureField[] = [
  {
    key: "peep",
    label: "PEEP",
    helper: "Pressão das vias aéreas no fim da expiração",
    placeholder: "ex: 8",
  },
  {
    key: "pplat",
    label: "Pplat",
    helper: "Pressão das vias aéreas no fim da inspiração (plateau)",
    placeholder: "ex: 22",
  },
  {
    key: "pEsee",
    label: "PEsee",
    helper: "Pressão esofágica no fim da expiração",
    placeholder: "ex: 5,4",
  },
  {
    key: "pEsei",
    label: "PEsei",
    helper: "Pressão esofágica no fim da inspiração",
    placeholder: "ex: 16,3",
  },
];

function StatusPill({ ok, okText, badText }: { ok: boolean; okText: string; badText: string }) {
  return (
    <View style={[styles.pill, ok ? styles.pillGood : styles.pillWarn]}>
      <Text style={[styles.pillText, ok ? styles.pillTextGood : styles.pillTextWarn]}>
        {ok ? okText : badText}
      </Text>
    </View>
  );
}

export interface TranspulmonaryPressureScreenProps {
  onBack: () => void;
}

export default function TranspulmonaryPressureScreen({ onBack }: TranspulmonaryPressureScreenProps) {
  const [unit, setUnit] = useState<PressureUnit>("cmH2O");
  const [values, setValues] = useState<Record<PressureField["key"], string>>({
    peep: "",
    pplat: "",
    pEsee: "",
    pEsei: "",
  });

  const setField = (key: PressureField["key"], v: string) => setValues((prev) => ({ ...prev, [key]: v }));

  const parsed = useMemo(() => {
    const peep = parseInput(values.peep);
    const pplat = parseInput(values.pplat);
    const pEsee = parseInput(values.pEsee);
    const pEsei = parseInput(values.pEsei);
    if (peep === null || pplat === null || pEsee === null || pEsei === null) return null;
    return { peep, pplat, pEsee, pEsei };
  }, [values]);

  const result = useMemo(() => {
    if (!parsed) return null;
    return calculateTranspulmonaryPressures(parsed, unit);
  }, [parsed, unit]);

  const expiratoryStatus = result ? evaluateExpiratoryTarget(result.plExpiratory) : null;
  const inspiratoryOk = result ? isInspiratoryWithinTarget(result.plInspiratory) : null;
  const drivingOk = result ? isDrivingWithinTarget(result.drivingPl) : null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pressão Transpulmonar</Text>
        <Text style={styles.subtitle}>Balão Esofágico — Sonda Nutrivent™</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Unidade de entrada</Text>
          <SegmentedControl
            value={unit}
            onChange={setUnit}
            options={[
              { label: "cmH2O", value: "cmH2O" },
              { label: "mmHg", value: "mmHg" },
            ]}
          />
          {unit === "mmHg" && (
            <Text style={styles.helperTextInline}>
              Os valores são convertidos automaticamente para cmH2O (×1,36) antes do cálculo.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Pressões medidas ({unit})</Text>

          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>
                {field.label} <Text style={styles.fieldHelper}>— {field.helper}</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={values[field.key]}
                onChangeText={(v) => setField(field.key, v)}
                keyboardType="decimal-pad"
                placeholder={field.placeholder}
                accessibilityLabel={`${field.label} em ${unit}`}
              />
            </View>
          ))}
        </View>

        {!parsed && (
          <View style={styles.card}>
            <Text style={styles.helperText}>
              Introduz PEEP, Pplat, PEsee e PEsei para calcular a pressão transpulmonar.
            </Text>
          </View>
        )}

        {result && (
          <View style={[styles.card, styles.resultCard]}>
            <Text style={styles.sectionLabel}>Resultado</Text>

            {unit === "mmHg" && (
              <>
                <Text style={styles.subSectionLabel}>Valores convertidos para cmH2O</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>PEEP: {fmt(result.peepCmH2O)}</Text>
                  <Text style={styles.metricText}>Pplat: {fmt(result.pplatCmH2O)}</Text>
                  <Text style={styles.metricText}>PEsee: {fmt(result.pEseeCmH2O)}</Text>
                  <Text style={styles.metricText}>PEsei: {fmt(result.pEseiCmH2O)}</Text>
                </View>
                <View style={styles.divider} />
              </>
            )}

            <View style={styles.resultBlock}>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultName}>PL expiratória (PLee)</Text>
                {expiratoryStatus && (
                  <StatusPill
                    ok={expiratoryStatus === "dentro"}
                    okText="Dentro do alvo"
                    badText={expiratoryStatus === "atelectrauma" ? "Risco de atelectrauma" : "Risco de barotrauma"}
                  />
                )}
              </View>
              <View style={styles.bigResultRow}>
                <Text style={styles.bigResultValue}>{fmt(result.plExpiratory)}</Text>
                <Text style={styles.bigResultUnit}>cmH2O</Text>
              </View>
              <Text style={styles.resultTargetText}>Alvo: 0 a 5 cmH2O (&lt;0 atelectrauma; &gt;5 barotrauma)</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultBlock}>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultName}>PL inspiratória (PLei)</Text>
                {inspiratoryOk !== null && (
                  <StatusPill ok={inspiratoryOk} okText="Dentro do alvo" badText="Acima do alvo" />
                )}
              </View>
              <View style={styles.bigResultRow}>
                <Text style={styles.bigResultValue}>{fmt(result.plInspiratory)}</Text>
                <Text style={styles.bigResultUnit}>cmH2O</Text>
              </View>
              <Text style={styles.resultTargetText}>Alvo: &lt;20 cmH2O</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultBlock}>
              <View style={styles.resultHeaderRow}>
                <Text style={styles.resultName}>Driving PL (DPl)</Text>
                {drivingOk !== null && <StatusPill ok={drivingOk} okText="Dentro do alvo" badText="Acima do alvo" />}
              </View>
              <View style={styles.bigResultRow}>
                <Text style={styles.bigResultValue}>{fmt(result.drivingPl)}</Text>
                <Text style={styles.bigResultUnit}>cmH2O</Text>
              </View>
              <Text style={styles.resultTargetText}>Alvo: &lt;12 cmH2O</Text>
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
  helperTextInline: { fontSize: 12, color: "#7A8894", marginTop: 8, fontStyle: "italic" },
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
  segmentedRow: { flexDirection: "row", marginTop: 8, gap: 8, flexWrap: "wrap" },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EEF2F5",
    borderWidth: 1,
    borderColor: "#EEF2F5",
  },
  segmentedOptionSelected: { backgroundColor: "#12283C", borderColor: "#12283C" },
  segmentedLabel: { fontSize: 13, color: "#33404B", fontWeight: "600" },
  segmentedLabelSelected: { color: "#FFFFFF" },
  helperText: { color: "#5B6B7A", fontSize: 13, textAlign: "center" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", rowGap: 4, columnGap: 8 },
  metricText: { fontSize: 13, color: "#33404B" },
  divider: { height: 1, backgroundColor: "#E1EAE4", marginVertical: 12 },
  resultBlock: {},
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  resultName: { fontSize: 14, fontWeight: "700", color: "#1F5A3B" },
  bigResultRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginTop: 6 },
  bigResultValue: { fontSize: 36, fontWeight: "800", color: "#1F5A3B" },
  bigResultUnit: { fontSize: 15, color: "#1F5A3B", marginLeft: 8, fontWeight: "600" },
  resultTargetText: { fontSize: 12, color: "#5B6B7A", textAlign: "center", marginTop: 4 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  pillGood: { backgroundColor: "#DCEFE2" },
  pillWarn: { backgroundColor: "#FFF6E5" },
  pillText: { fontSize: 11, fontWeight: "700" },
  pillTextGood: { color: "#1F5A3B" },
  pillTextWarn: { color: "#7A5B12" },
  disclaimer: { fontSize: 11, color: "#8894A0", textAlign: "center", marginTop: 8, lineHeight: 16 },
});
