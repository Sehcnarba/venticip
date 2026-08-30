import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import TranspulmonaryPressureScreen from "./src/screens/TranspulmonaryPressureScreen";
import VentilationLimitsScreen from "./src/screens/VentilationLimitsScreen";
import MechanicalPowerScreen from "./src/screens/MechanicalPowerScreen";
import ReferencesScreen from "./src/screens/ReferencesScreen";
import SignatureFooter from "./src/components/SignatureFooter";

type Screen = "home" | "transpulmonary" | "limits" | "mechanicalPower" | "references";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.flex}>
          {screen === "home" && (
            <HomeScreen
              onOpenTranspulmonaryPressure={() => setScreen("transpulmonary")}
              onOpenVentilationLimits={() => setScreen("limits")}
              onOpenMechanicalPower={() => setScreen("mechanicalPower")}
              onOpenReferences={() => setScreen("references")}
            />
          )}
          {screen === "transpulmonary" && (
            <TranspulmonaryPressureScreen onBack={() => setScreen("home")} />
          )}
          {screen === "limits" && <VentilationLimitsScreen onBack={() => setScreen("home")} />}
          {screen === "mechanicalPower" && (
            <MechanicalPowerScreen onBack={() => setScreen("home")} />
          )}
          {screen === "references" && <ReferencesScreen onBack={() => setScreen("home")} />}
        </View>
        <SignatureFooter />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F4F6F8" },
  flex: { flex: 1 },
});
