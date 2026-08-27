import React, { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface RulerSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

/**
 * Régua deslizante sem dependências externas (não usa nenhuma biblioteca de
 * slider — apenas PanResponder/View do React Native core), com marcas tipo
 * régua e botões -/+ para ajuste fino. Usada para a frequência respiratória
 * (FR) no ecrã de Limites de Ventilação Mecânica.
 */
export default function RulerSlider({ label, value, min, max, step = 1, unit, onChange }: RulerSliderProps) {
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);
  const trackWidth = useRef(0);
  const [ready, setReady] = useState(false);

  const clampToStep = (raw: number) => {
    const stepped = Math.round((raw - min) / step) * step + min;
    return Math.min(max, Math.max(min, stepped));
  };

  const updateFromPageX = (pageX: number) => {
    const width = trackWidth.current;
    if (width <= 0) return;
    const relative = pageX - trackPageX.current;
    const ratio = Math.min(1, Math.max(0, relative / width));
    onChange(clampToStep(min + ratio * (max - min)));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => updateFromPageX(evt.nativeEvent.pageX),
        onPanResponderMove: (evt) => updateFromPageX(evt.nativeEvent.pageX),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step]
  );

  const handleLayout = () => {
    trackRef.current?.measure((_x, _y, width, _height, pageX) => {
      trackWidth.current = width;
      trackPageX.current = pageX;
      setReady(true);
    });
  };

  const ratio = (value - min) / (max - min);
  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step);
    return Array.from({ length: count + 1 }, (_, i) => min + i * step);
  }, [min, max, step]);

  const step1 = (delta: number) => onChange(clampToStep(value + delta));

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valueText}>
          {value}
          {unit ? ` ${unit}` : ""}
        </Text>
      </View>

      <View style={styles.controlRow}>
        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => step1(-step)}
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${label}`}
        >
          <Text style={styles.stepButtonText}>−</Text>
        </TouchableOpacity>

        <View
          ref={trackRef}
          style={styles.track}
          onLayout={handleLayout}
          {...panResponder.panHandlers}
        >
          <View style={styles.trackBase} pointerEvents="none" />
          <View style={[styles.trackFill, { width: `${ready ? ratio * 100 : 0}%` }]} pointerEvents="none" />
          <View style={styles.tickRow} pointerEvents="none">
            {ticks.map((t) => (
              <View key={t} style={[styles.tick, t % (step * 5) === 0 && styles.tickMajor]} />
            ))}
          </View>
          <View
            style={[styles.thumb, { left: `${ready ? ratio * 100 : 0}%` }]}
            pointerEvents="none"
          />
        </View>

        <TouchableOpacity
          style={styles.stepButton}
          onPress={() => step1(step)}
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${label}`}
        >
          <Text style={styles.stepButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>{min}</Text>
        <Text style={styles.rangeText}>{max}</Text>
      </View>
    </View>
  );
}

const THUMB_SIZE = 24;

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  label: { fontSize: 14, fontWeight: "700", color: "#12283C" },
  valueText: { fontSize: 18, fontWeight: "800", color: "#1F5A3B" },
  controlRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: { fontSize: 18, fontWeight: "700", color: "#12283C" },
  track: {
    flex: 1,
    height: 34,
    justifyContent: "center",
  },
  tickRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    top: "50%",
    marginTop: -6,
  },
  tick: { width: 1, height: 6, backgroundColor: "#D6DEE5" },
  tickMajor: { height: 12, marginTop: -3, backgroundColor: "#B7C1CA" },
  trackBase: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    marginTop: -2,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#EEF2F5",
  },
  trackFill: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -2,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#12283C",
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: "#12283C",
    marginLeft: -THUMB_SIZE / 2,
    marginTop: -THUMB_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  rangeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  rangeText: { fontSize: 11, color: "#8894A0" },
});
