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
  evaluateDrivingTarget,
  evaluateExpiratoryTarget,
  evaluateInspiratoryTarget,
  PressureUnit,
} from "../calc/transpulmonaryCalculator";

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact = false,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.segmentedRow}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.segmentedOption,
              compact && styles.segmentedOptionCompact,
              selected && styles.segmentedOptionSelected,
            ]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              style={[
                styles.segmentedLabel,
                compact && styles.segmentedLabelCompact,
                selected && styles.segmentedLabelSelected,
              ]}
            >
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

type FieldKey = "peep" | "pplat" | "pEsee" | "pEsei";

interface PressureField {
  key: FieldKey;
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

const UNIT_OPTIONS: { label: string; value: PressureUnit }[] = [
  { label: "cmH2O", value: "cmH2O" },
  { label: "mmHg", value: "mmHg" },
];

type Severity = "good" | "warn" | "bad" | "neutral";

function StatusPill({ severity, label }: { severity: Severity; label: string }) {
  const pillStyle =
    severity === "good"
      ? styles.pillGood
      : severity === "warn"
      ? styles.pillWarn
      : severity === "bad"
      ? styles.pillBad
      : styles.pillNeutral;
  const textStyle =
    severity === "good"
      ? styles.pillTextGood
      : severity === "warn"
      ? styles.pillTextWarn
      : severity === "bad"
      ? styles.pillTextBad
      : styles.pillTextNeutral;
  return (
    <View style={[styles.pill, pillStyle]}>
      <Text style={[styles.pillText, textStyle]}>{label}</Text>
    </View>
  );
}

function ResultBlock({
  name,
  value,
  severity,
  statusLabel,
  targetText,
}: {
  name: string;
  value: number;
  severity: Severity;
  statusLabel: string;
  targetText: React.ReactNode;
}) {
  const nameStyle =
    severity === "good"
      ? styles.resultNameGood
      : severity === "warn"
      ? styles.resultNameWarn
      : severity === "bad"
      ? styles.resultNameBad
      : styles.resultNameNeutral;
  const valueStyle =
    severity === "good"
      ? styles.bigResultValueGood
      : severity === "warn"
      ? styles.bigResultValueWarn
      : severity === "bad"
      ? styles.bigResultValueBad
      : styles.bigResultValueNeutral;
  const unitStyle =
    severity === "good"
      ? styles.bigResultUnitGood
      : severity === "warn"
      ? styles.bigResultUnitWarn
      : severity === "bad"
      ? styles.bigResultUnitBad
      : styles.bigResultUnitNeutral;

  return (
    <View style={styles.resultBlock}>
      <View style={styles.resultHeaderRow}>
        <Text style={[styles.resultName, nameStyle]}>{name}</Text>
        <StatusPill severity={severity} label={statusLabel} />
      </View>
      <View style={styles.bigResultRow}>
        <Text style={[styles.bigResultValue, valueStyle]}>{fmt(value)}</Text>
        <Text style={[styles.bigResultUnit, unitStyle]}>cmH2O</Text>
      </View>
      <Text style={styles.resultTargetText}>{targetText}</Text>
    </View>
  );
}

export interface TranspulmonaryPressureScreenProps {
  onBack: () => void;
}

export default function TranspulmonaryPressureScreen({ onBack }: TranspulmonaryPressureScreenProps) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    peep: "",
    pplat: "",
    pEsee: "",
    pEsei: "",
  });
  const [units, setUnits] = useState<Record<FieldKey, PressureUnit>>({
    peep: "cmH2O",
    pplat: "cmH2O",
    pEsee: "cmH2O",
    pEsei: "cmH2O",
  });

  const setField = (key: FieldKey, v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  const setUnit = (key: FieldKey, u: PressureUnit) => setUnits((prev) => ({ ...prev, [key]: u }));

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
    return calculateTranspulmonaryPressures({
      peep: { value: parsed.peep, unit: units.peep },
      pplat: { value: parsed.pplat, unit: units.pplat },
      pEsee: { value: parsed.pEsee, unit: units.pEsee },
      pEsei: { value: parsed.pEsei, unit: units.pEsei },
    });
  }, [parsed, units]);

  const anyMmHg = FIELDS.some((f) => units[f.key] === "mmHg");

  const expiratoryStatus = result ? evaluateExpiratoryTarget(result.plExpiratory) : null;
  const inspiratoryStatus = result ? evaluateInspiratoryTarget(result.plInspiratory) : null;
  const drivingStatus = result ? evaluateDrivingTarget(result.drivingPl) : null;

  // PL expiratória tem 3 estados clínicos distintos: dentro do alvo (verde),
  // risco de atelectrauma por PEEP insuficiente (amarelo) e risco de
  // barotrauma por PEEP excessiva (vermelho — o mais grave dos dois desvios).
  const expiratorySeverity: Severity | null =
    expiratoryStatus === "dentro" ? "good" : expiratoryStatus === "atelectrauma" ? "warn" : expiratoryStatus === "barotrauma" ? "bad" : null;
  const expiratoryLabel =
    expiratoryStatus === "dentro"
      ? "Dentro do alvo"
      : expiratoryStatus === "atelectrauma"
      ? "Risco de atelectrauma"
      : "Risco de barotrauma";

  // PL inspiratória e Driving PL: dentro do alvo (verde), acima do alvo
  // (amarelo), ou negativo — clinicamente sem sentido, provável erro nos
  // valores introduzidos (cinzento + "Rever valores").
  const severityForLimit = (status: "dentro" | "acima" | "revisar" | null): Severity | null =>
    status === "dentro" ? "good" : status === "acima" ? "warn" : status === "revisar" ? "neutral" : null;
  const labelForLimit = (status: "dentro" | "acima" | "revisar" | null): string =>
    status === "acima" ? "Acima do alvo" : status === "revisar" ? "Rever valores" : "Dentro do alvo";

  const inspiratorySeverity = severityForLimit(inspiratoryStatus);
  const drivingSeverity = severityForLimit(drivingStatus);

  // Sugestões de atuação: PEEP a mais/a menos para a PL expiratória fora do
  // alvo, e revisão dos parâmetros ventilatórios quando a PL inspiratória ou
  // o Driving PL ficam acima do alvo. O estado "revisar" (negativo) já tem a
  // sua própria indicação (cinzento) e não gera sugestão adicional aqui.
  const suggestions: { text: string; severity: "warn" | "bad" }[] = [];
  if (expiratoryStatus === "atelectrauma") {
    suggestions.push({ text: "Considerar aumentar a PEEP.", severity: "warn" });
  }
  if (expiratoryStatus === "barotrauma") {
    suggestions.push({ text: "Considerar reduzir a PEEP.", severity: "bad" });
  }
  if (inspiratoryStatus === "acima" || drivingStatus === "acima") {
    suggestions.push({
      text: "Rever volume corrente, frequência ventilatória e relação I:E.",
      severity: "warn",
    });
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pressão Transpulmonar</Text>
        <Text style={styles.subtitle}>Balão Esofágico — Sonda Nutrivent™</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Pressões medidas</Text>
          <Text style={styles.helperTextInline}>
            Cada valor pode ser introduzido em cmH2O ou mmHg — a conversão (×1,36) é feita
            automaticamente antes do cálculo.
          </Text>

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
                  accessibilityLabel={`${field.label} em ${units[field.key]}`}
                />
                <SegmentedControl
                  compact
                  value={units[field.key]}
                  onChange={(u) => setUnit(field.key, u)}
                  options={UNIT_OPTIONS}
                />
              </View>
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

            {anyMmHg && (
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

            <Text style={styles.subSectionLabel}>Driving Pressure convencional (Pplat − PEEP)</Text>
            <View style={styles.metricsRow}>
              <Text style={styles.metricText}>{fmt(result.drivingPressureConventional)} cmH2O</Text>
            </View>
            <View style={styles.divider} />

            {expiratorySeverity && (
              <ResultBlock
                name="PL expiratória (PLee)"
                value={result.plExpiratory}
                severity={expiratorySeverity}
                statusLabel={expiratoryLabel}
                targetText={<>Alvo: 0 a 5 cmH2O (&lt;0 atelectrauma; &gt;5 barotrauma)</>}
              />
            )}

            <View style={styles.divider} />

            {inspiratorySeverity && (
              <ResultBlock
                name="PL inspiratória (PLei)"
                value={result.plInspiratory}
                severity={inspiratorySeverity}
                statusLabel={labelForLimit(inspiratoryStatus)}
                targetText={<>Alvo: &lt;20 cmH2O</>}
              />
            )}

            <View style={styles.divider} />

            {drivingSeverity && (
              <ResultBlock
                name="Driving PL (DPl)"
                value={result.drivingPl}
                severity={drivingSeverity}
                statusLabel={labelForLimit(drivingStatus)}
                targetText={<>Alvo: &lt;12 cmH2O</>}
              />
            )}
          </View>
        )}

        {result && suggestions.length > 0 && (
          <View style={[styles.card, styles.suggestionCard]}>
            <Text style={styles.sectionLabel}>Sugestão de atuação</Text>
            {suggestions.map((s, i) => (
              <View key={i} style={styles.suggestionRow}>
                <Text style={[styles.suggestionBullet, s.severity === "bad" ? styles.textBad : styles.textWarn]}>
                  •
                </Text>
                <Text style={[styles.suggestionText, s.severity === "bad" ? styles.textBad : styles.textWarn]}>
                  {s.text}
                </Text>
              </View>
            ))}
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
  fieldInputRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8, flexWrap: "wrap" },
  fieldInputFlex: { flex: 1, minWidth: 100, marginTop: 0 },
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
  segmentedRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  segmentedOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#EEF2F5",
    borderWidth: 1,
    borderColor: "#EEF2F5",
  },
  segmentedOptionCompact: { paddingVertical: 6, paddingHorizontal: 10 },
  segmentedOptionSelected: { backgroundColor: "#12283C", borderColor: "#12283C" },
  segmentedLabel: { fontSize: 13, color: "#33404B", fontWeight: "600" },
  segmentedLabelCompact: { fontSize: 12 },
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
  resultName: { fontSize: 14, fontWeight: "700" },
  resultNameGood: { color: "#1F5A3B" },
  resultNameWarn: { color: "#92660D" },
  resultNameBad: { color: "#B23B3B" },
  resultNameNeutral: { color: "#5B6B7A" },
  bigResultRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginTop: 6 },
  bigResultValue: { fontSize: 36, fontWeight: "800" },
  bigResultValueGood: { color: "#1F5A3B" },
  bigResultValueWarn: { color: "#92660D" },
  bigResultValueBad: { color: "#B23B3B" },
  bigResultValueNeutral: { color: "#8894A0" },
  bigResultUnit: { fontSize: 15, marginLeft: 8, fontWeight: "600" },
  bigResultUnitGood: { color: "#1F5A3B" },
  bigResultUnitWarn: { color: "#92660D" },
  bigResultUnitBad: { color: "#B23B3B" },
  bigResultUnitNeutral: { color: "#8894A0" },
  resultTargetText: { fontSize: 12, color: "#5B6B7A", textAlign: "center", marginTop: 4 },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  pillGood: { backgroundColor: "#DCEFE2" },
  pillWarn: { backgroundColor: "#FFF6E5" },
  pillBad: { backgroundColor: "#FBE4E4" },
  pillNeutral: { backgroundColor: "#E7EAED" },
  pillText: { fontSize: 11, fontWeight: "700" },
  pillTextGood: { color: "#1F5A3B" },
  pillTextWarn: { color: "#92660D" },
  pillTextBad: { color: "#B23B3B" },
  pillTextNeutral: { color: "#5B6B7A" },
  suggestionCard: { borderWidth: 1, borderColor: "#F0E0BE" },
  suggestionRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, gap: 8 },
  suggestionBullet: { fontSize: 14, lineHeight: 19, fontWeight: "700" },
  suggestionText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  textWarn: { color: "#92660D" },
  textBad: { color: "#B23B3B" },
  disclaimer: { fontSize: 11, color: "#8894A0", textAlign: "center", marginTop: 8, lineHeight: 16 },
});
