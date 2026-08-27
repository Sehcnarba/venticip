import React from "react";
import { StyleSheet, Text, View } from "react-native";

/** Pequena assinatura fixa no fundo da app, visível em todos os ecrãs. */
export default function SignatureFooter() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>abranches-qol</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: 6, alignItems: "center", backgroundColor: "#F4F6F8" },
  text: { fontSize: 10, color: "#B7C1CA", letterSpacing: 0.5 },
});
