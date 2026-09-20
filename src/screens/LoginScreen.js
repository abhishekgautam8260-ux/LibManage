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

import { login, employeeLogin } from "../api/auth";

import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [loginType, setLoginType] = useState("ADMIN");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const isAdmin = loginType === "ADMIN";

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert(
        "Missing details",
        `Please enter your ${
          isAdmin ? "phone number" : "username"
        } and password.`
      );
      return;
    }

    setLoading(true);

    try {
      console.log(`🔐 ${isAdmin ? "Admin" : "Employee"} login started`);

      let data;

      if (isAdmin) {
        // ==============================
        // ADMIN LOGIN
        // ==============================

        data = await login({
          phone: identifier.trim(),
          password,
        });
      } else {
        // ==============================
        // EMPLOYEE LOGIN
        // ==============================

        data = await employeeLogin({
          username: identifier.trim(),
          password,
        });
      }

      console.log("✅ Login response:", data);

      if (!data?.token) {
        throw new Error("Authentication token was not received.");
      }

      // Store complete authentication response
      await signIn(data);

      console.log("✅ Authentication successful");
    } catch (err) {
      console.log("❌ Login error:", err);

      let message = "Invalid credentials. Please try again.";

      if (err?.response?.status === 403) {
        message = "Your account is inactive or you do not have access.";
      } else if (err?.response?.status === 401) {
        message = "Invalid username/phone or password.";
      } else if (err?.message) {
        message = err.message;
      }

      Alert.alert("Login failed", message);
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
        {/* ==============================
            HEADER
        ============================== */}

        <Text style={styles.heading}>Welcome Back</Text>

        <Text style={styles.subtitle}>Login to manage your library</Text>

        {/* ==============================
            LOGIN TYPE SWITCH
        ============================== */}

        <View style={styles.switchContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.switchButton, isAdmin && styles.activeSwitch]}
            onPress={() => {
              setLoginType("ADMIN");
              setIdentifier("");
              setPassword("");
            }}
          >
            <Text
              style={[styles.switchText, isAdmin && styles.activeSwitchText]}
            >
              Admin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.switchButton, !isAdmin && styles.activeSwitch]}
            onPress={() => {
              setLoginType("EMPLOYEE");
              setIdentifier("");
              setPassword("");
            }}
          >
            <Text
              style={[styles.switchText, !isAdmin && styles.activeSwitchText]}
            >
              Employee
            </Text>
          </TouchableOpacity>
        </View>

        {/* ==============================
            USERNAME / PHONE
        ============================== */}

        <AppInput
          placeholder={isAdmin ? "Phone Number" : "Username"}
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType={isAdmin ? "phone-pad" : "default"}
          autoCapitalize={isAdmin ? "none" : "none"}
          autoCorrect={false}
        />

        {/* ==============================
            PASSWORD
        ============================== */}

        <AppInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* ==============================
            FORGOT PASSWORD
        ============================== */}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            // Forgot password can be implemented later
          }}
        >
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* ==============================
            LOGIN BUTTON
        ============================== */}

        <PrimaryButton
          title="Log In"
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: 4 }}
        />

        {/* ==============================
            SIGNUP
        ============================== */}

        {isAdmin && (
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
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
    maxWidth: 360,

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
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.lg,
  },

  switchContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f3f5",
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },

  switchButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
  },

  activeSwitch: {
    backgroundColor: "#fff",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  switchText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  activeSwitchText: {
    color: colors.primaryBlue,
  },

  forgot: {
    textAlign: "right",
    fontSize: 13,
    color: "#666",
    marginBottom: spacing.md,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
  },

  signupText: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  signupLink: {
    fontSize: 14,
    color: colors.primaryGreen,
    fontWeight: "700",
  },
});
