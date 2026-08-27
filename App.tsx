import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import HomeScreen from "./src/screens/HomeScreen";
import TranspulmonaryPressureScreen from "./src/screens/TranspulmonaryPressureScreen";
import SignatureFooter from "./src/components/SignatureFooter";

type Screen = "home" | "transpulmonary";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.flex}>
          {screen === "home" && (
            <HomeScreen onOpenTranspulmonaryPressure={() => setScreen("transpulmonary")} />
          )}
          {screen === "transpulmonary" && (
            <TranspulmonaryPressureScreen onBack={() => setScreen("home")} />
          )}
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
