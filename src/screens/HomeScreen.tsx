import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export interface HomeScreenProps {
  onOpenTranspulmonaryPressure: () => void;
}

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

const COMING_SOON: Omit<MenuItem, "onPress">[] = [
  {
    icon: "🔒",
    title: "Limites de Ventilação Mecânica",
    subtitle: "Consulta rápida de limites de segurança da ventilação (em breve)",
  },
];

export default function HomeScreen({ onOpenTranspulmonaryPressure }: HomeScreenProps) {
  const items: MenuItem[] = [
    {
      icon: "🎈",
      title: "Pressão Transpulmonar",
      subtitle: "Balão esofágico (Nutrivent™) — PL inspiratória, expiratória e driving PL",
      onPress: onOpenTranspulmonaryPressure,
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

      {COMING_SOON.map((item) => (
        <View key={item.title} style={[styles.menuCard, styles.menuCardDisabled]}>
          <View style={[styles.menuIcon, styles.menuIconDisabled]}>
            <Text style={styles.menuIconText}>{item.icon}</Text>
          </View>
          <View style={styles.menuTextWrap}>
            <Text style={[styles.menuTitle, styles.menuTitleDisabled]}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
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
  menuCardDisabled: { opacity: 0.55 },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#EAF2EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuIconDisabled: { backgroundColor: "#EEF2F5" },
  menuIconText: { fontSize: 20 },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: "700", color: "#12283C", flexShrink: 1 },
  menuTitleDisabled: { color: "#5B6B7A" },
  menuSubtitle: { fontSize: 12, color: "#5B6B7A", marginTop: 2, flexShrink: 1 },
  chevron: { fontSize: 22, color: "#B7C1CA", marginLeft: 8 },
});
