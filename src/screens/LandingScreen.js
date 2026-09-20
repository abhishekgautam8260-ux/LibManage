import React from "react";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { colors, spacing } from "../theme/colors";

// Mirrors newindex.html hero section (title, subtitle, Sign Up / Log In actions).
// The background image (index-background.png) isn't in your uploads — drop it
// into assets/ and reference it below, or leave the solid color fallback.
export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.hero}>
      <View style={styles.overlay}>
        <Text style={styles.title}>
          Welcome to{"\n"}
          <Text style={styles.titleBold}>Library Management Tool</Text>
        </Text>
        <Text style={styles.subtitle}>
          Efficiently manage your library seats, occupancy, and multiple libraries with our powerful system.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton title="Sign Up" onPress={() => navigation.navigate("Signup")} style={styles.fullBtn} />
          <PrimaryButton
            title="Log In"
            variant="outline"
            onPress={() => navigation.navigate("Login")}
            style={styles.fullBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, backgroundColor: "#dff5e6" },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: { fontSize: 30, color: "#222", textAlign: "center", marginBottom: spacing.md },
  titleBold: { fontWeight: "800" },
  subtitle: {
    color: "#555",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 340,
  },
  actions: { width: "100%", gap: 14 },
  fullBtn: { width: "100%" },
});
