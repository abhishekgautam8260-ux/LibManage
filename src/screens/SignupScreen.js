import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import AppInput from "../components/AppInput";
import PrimaryButton from "../components/PrimaryButton";

import { signup } from "../api/auth";
import { useAuth } from "../context/AuthContext";

import { colors, radius, spacing } from "../theme/colors";

export default function SignupScreen({ navigation }) {
  const { signIn } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert("Signup failed", "Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Signup failed", "Please enter your phone number.");
      return;
    }

    if (!password) {
      Alert.alert("Signup failed", "Please enter a password.");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Signup failed", "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      console.log("📝 Admin signup started");

      const data = await signup({
        name: name.trim(),
        phone: phone.trim(),
        password,
      });

      console.log("✅ Signup response:", data);

      if (!data?.token) {
        throw new Error("Authentication token was not received.");
      }

      /*
       * IMPORTANT
       *
       * Pass the COMPLETE response to AuthContext.
       *
       * Do NOT use:
       *
       * signIn(data.token)
       *
       * because that loses userType/userId/etc.
       */
      await signIn(data);

      console.log("✅ Signup authentication successful");
    } catch (err) {
      console.log("❌ Signup error:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        err?.message ||
        "Unable to create account.";

      Alert.alert("Signup failed", String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Create Admin Account</Text>

        <Text style={styles.subtitle}>
          Create your administrator account to manage your library.
        </Text>

        <AppInput
          placeholder="Admin Name"
          value={name}
          onChangeText={setName}
        />

        <AppInput
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <AppInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <AppInput
          placeholder="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />

        <PrimaryButton
          title="Create Admin Account"
          onPress={handleSignup}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account? </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.switchLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dff5e6",
    padding: spacing.lg,
  },

  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 380,
    padding: spacing.xl,
    borderRadius: radius.lg,

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,

    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 6,
  },

  heading: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    color: colors.textPrimary,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.lg,
    color: colors.textSecondary,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },

  switchText: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  switchLink: {
    fontSize: 14,
    color: colors.primaryGreen,
    fontWeight: "700",
  },
});
