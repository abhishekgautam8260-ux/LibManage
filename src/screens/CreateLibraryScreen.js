import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import AppInput from "../components/AppInput";
import PrimaryButton from "../components/PrimaryButton";
import { createLibrary } from "../api/library";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/colors";

// Mirrors createlibrary.html + create-library.js exactly, including the
// 401/403 -> force logout handling.
export default function CreateLibraryScreen() {
  const { setLibrary, signOut } = useAuth();
  const [libraryName, setLibraryName] = useState("");
  const [totalSeats, setTotalSeats] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const data = await createLibrary({ libraryName, totalSeats, logoUrl });
      await setLibrary(data?.libraryId ?? data?.id, libraryName);
    } catch (err) {
      if (err.isAuthExpired) {
        Alert.alert("Session expired", "Please login again.");
        await signOut();
        return;
      }
      Alert.alert("Failed to create library", err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.heading}>Create Your Library</Text>

        <AppInput placeholder="Library Name" value={libraryName} onChangeText={setLibraryName} />
        <AppInput
          placeholder="Total Seats"
          value={totalSeats}
          onChangeText={setTotalSeats}
          keyboardType="numeric"
        />
        <AppInput placeholder="Logo URL (optional)" value={logoUrl} onChangeText={setLogoUrl} />

        <PrimaryButton title="Create Library" onPress={handleCreate} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#dff5e6", padding: spacing.lg },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 400,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heading: { fontSize: 24, fontWeight: "700", marginBottom: spacing.lg, color: colors.textPrimary },
});
