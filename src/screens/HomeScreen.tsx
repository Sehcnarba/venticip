import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface HomeScreenProps {
  onOpenTranspulmonaryPressure: () => void;
  onOpenVentilationLimits: () => void;
  onOpenMechanicalPower: () => void;
  onOpenReferences: () => void;
}

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export default function HomeScreen({
  onOpenTranspulmonaryPressure,
  onOpenVentilationLimits,
  onOpenMechanicalPower,
  onOpenReferences,
}: HomeScreenProps) {
  const items: MenuItem[] = [
    {
      icon: "🎈",
      title: "Pressão Transpulmonar",
      subtitle: "Balão esofágico (Nutrivent™) — PL inspiratória, expiratória e driving PL",
      onPress: onOpenTranspulmonaryPressure,
    },
    {
      icon: "📏",
      title: "Limites de Ventilação Mecânica",
      subtitle: "Volume corrente (Vc) e volume minuto (VM) a partir do peso, altura e FR",
      onPress: onOpenVentilationLimits,
    },
    {
      icon: "⚡",
      title: "Mechanical Power",
      subtitle: "Energia mecânica transferida ao pulmão, a partir da RR, VT, Ppico, Pplat e PEEP",
      onPress: onOpenMechanicalPower,
    },
    {
      icon: "📚",
      title: "Referências",
      subtitle: "Fórmulas e esquemas usados nos cálculos da app",
      onPress: onOpenReferences,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>VentiCIP</Text>
      <Text style={styles.subtitle}>Ferramentas de apoio à ventilação mecânica na UCIP</Text>

      {items.map((item) => (
        <TouchableOpacity key={item.title} style={styles.menuCard} onPress={item.onPress} accessibilityRole="button">
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>{item.icon}</Text>
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#F4F6F8" },
  title: { fontSize: 26, fontWeight: "800", color: "#12283C", textAlign: "center", marginTop: 12 },
  subtitle: {
    fontSize: 13,
    color: "#5B6B7A",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EAF2EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuIconText: { fontSize: 20 },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: "#12283C", flexShrink: 1 },
  menuSubtitle: { fontSize: 12, color: "#5B6B7A", marginTop: 2, flexShrink: 1 },
  chevron: { fontSize: 22, color: "#B7C1CA", marginLeft: 8 },
});
