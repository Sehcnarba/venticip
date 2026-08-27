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
import RulerSlider from "../components/RulerSlider";
import { calculateTidalVolume, Sex } from "../calc/tidalVolumeCalculator";

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
            <Text style={[styles.segmentedLabel, selected && styles.segmentedLabelSelected]}>{opt.label}</Text>
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

export interface VentilationLimitsScreenProps {
  onBack: () => void;
}

export default function VentilationLimitsScreen({ onBack }: VentilationLimitsScreenProps) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [sex, setSex] = useState<Sex>("M");
  const [respiratoryRate, setRespiratoryRate] = useState(16);

  const weightKg = parseInput(weight);
  const heightCm = parseInput(height);
  const hasValidInput = weightKg !== null && heightCm !== null && weightKg > 0 && heightCm > 0;

  const result = useMemo(() => {
    if (!hasValidInput || weightKg === null || heightCm === null) return null;
    return calculateTidalVolume({ weightKg, heightCm, sex }, respiratoryRate);
  }, [hasValidInput, weightKg, heightCm, sex, respiratoryRate]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onBack} style={styles.backButton} accessibilityRole="button">
          <Text style={styles.backButtonText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Limites de Ventilação Mecânica</Text>
        <Text style={styles.subtitle}>Volume Corrente (Vc) e Volume Minuto (VM)</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Dados do doente</Text>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>Peso (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="ex: 70"
                accessibilityLabel="Peso em quilogramas"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={styles.flex}>
              <Text style={styles.fieldLabel}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                placeholder="ex: 170"
                accessibilityLabel="Altura em centímetros"
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Sexo (necessário para o peso ideal)</Text>
          <SegmentedControl
            value={sex}
            onChange={setSex}
            options={[
              { label: "Masculino", value: "M" },
              { label: "Feminino", value: "F" },
            ]}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Frequência respiratória</Text>
          <View style={{ marginTop: 10 }}>
            <RulerSlider
              label="FR inicial"
              value={respiratoryRate}
              onChange={setRespiratoryRate}
              min={8}
              max={40}
              step={1}
              unit="cpm"
            />
          </View>
        </View>

        {!hasValidInput && (
          <View style={styles.card}>
            <Text style={styles.helperText}>Introduz o peso e a altura do doente para calcular o Vc e o VM.</Text>
          </View>
        )}

        {result && (
          <View style={[styles.card, styles.resultCard]}>
            <Text style={styles.sectionLabel}>Resultado</Text>

            <View style={styles.metricsRow}>
              <Text style={styles.metricText}>
                IMC: {fmt(result.bmi)} kg/m² ({result.bmiCategory})
              </Text>
              <Text style={styles.metricText}>
                Peso usado: {fmt(result.weightForCalcKg)} kg
                {result.usesIdealWeight ? " (peso ideal)" : " (peso real)"}
              </Text>
            </View>
            {result.usesIdealWeight && (
              <Text style={styles.helperTextInline}>
                IMC fora do intervalo normal (18,5–24,9) — usa-se o peso ideal (fórmula de Devine),
                em vez do peso real, para calcular o Vc.
              </Text>
            )}

            <View style={styles.divider} />

            <View style={styles.resultBlock}>
              <Text style={styles.resultName}>Volume corrente (Vc)</Text>
              <View style={styles.bigResultRow}>
                <Text style={styles.bigResultValue}>
                  {fmt(result.tidalVolumeMinMl, 0)}–{fmt(result.tidalVolumeMaxMl, 0)}
                </Text>
                <Text style={styles.bigResultUnit}>mL</Text>
              </View>
              <Text style={styles.resultTargetText}>6 a 8 mL/kg do peso usado</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.resultBlock}>
              <Text style={styles.resultName}>Volume minuto (VM)</Text>
              <View style={styles.bigResultRow}>
                <Text style={styles.bigResultValue}>
                  {fmt(result.minuteVolumeMinLPerMin)}–{fmt(result.minuteVolumeMaxLPerMin)}
                </Text>
                <Text style={styles.bigResultUnit}>L/min</Text>
              </View>
              <Text style={styles.resultTargetText}>Vc × FR ({respiratoryRate} cpm)</Text>
            </View>
          </View>
        )}

        <Text style={styles.disclaimer}>
          Esta aplicação é uma ferramenta de apoio ao cálculo para profissionais de saúde. Não
          substitui o julgamento clínico nem a verificação por um segundo profissional. Confirme
          sempre os valores antes de ajustar a ventilação.
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
  fieldLabel: { fontSize: 13, color: "#5B6B7A", marginBottom: 6 },
  helperTextInline: { fontSize: 12, color: "#7A8894", marginTop: 6, fontStyle: "italic" },
  row: { flexDirection: "row" },
  input: {
    borderWidth: 1,
    borderColor: "#D6DEE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FBFCFD",
    color: "#12283C",
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
  resultName: { fontSize: 14, fontWeight: "700", color: "#1F5A3B", textAlign: "center" },
  bigResultRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", marginTop: 6 },
  bigResultValue: { fontSize: 30, fontWeight: "800", color: "#1F5A3B" },
  bigResultUnit: { fontSize: 15, color: "#1F5A3B", marginLeft: 8, fontWeight: "600" },
  resultTargetText: { fontSize: 12, color: "#5B6B7A", textAlign: "center", marginTop: 4 },
  disclaimer: { fontSize: 11, color: "#8894A0", textAlign: "center", marginTop: 8, lineHeight: 16 },
});
