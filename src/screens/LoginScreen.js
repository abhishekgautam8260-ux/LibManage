import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import AppInput from "../components/AppInput";
import { login, employeeLogin } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { darkColors, lightColors } from "../theme/colors";

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const colors = isDarkMode ? darkColors : lightColors;
  const styles = createStyles(colors, isDesktop);

  const [loginType, setLoginType] = useState("ADMIN");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const isAdmin = loginType === "ADMIN";

  const changeLoginType = (type) => {
    setLoginType(type);
    setIdentifier("");
    setPassword("");
  };

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
      const data = isAdmin
        ? await login({ phone: identifier.trim(), password })
        : await employeeLogin({ username: identifier.trim(), password });

      if (!data?.token)
        throw new Error("Authentication token was not received.");
      await signIn(data);
    } catch (err) {
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

  const openEnquiry = async () => {
    try {
      await Linking.openURL("https://libmanagee.vercel.app");
    } catch {
      Alert.alert(
        "Unable to open website",
        "Please try again or open the website in your browser."
      );
    }
  };

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.shell}>
        <View style={styles.topbar}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              navigation.canGoBack()
                ? navigation.goBack()
                : navigation.navigate("Landing")
            }
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome6
              name="arrow-left"
              size={14}
              color={colors.textPrimary}
            />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <FontAwesome6 name="book-open" size={15} color="#fff" />
            </View>
            <Text style={styles.brandName}>LibManage</Text>
          </View>
        </View>

        <View style={styles.main}>
          {isDesktop && (
            <View style={styles.welcomePanel}>
              <View style={styles.welcomePattern} />
              <View style={styles.welcomeContent}>
                <View style={styles.welcomeIcon}>
                  <FontAwesome6
                    name="book-open-reader"
                    size={23}
                    color="#fff"
                  />
                </View>
                <Text style={styles.welcomeEyebrow}>
                  YOUR LIBRARY WORKSPACE
                </Text>
                <Text style={styles.welcomeTitle}>
                  A little less admin.{"\n"}A lot more learning.
                </Text>
                <Text style={styles.welcomeCopy}>
                  Your seats, students and daily operations are ready when you
                  are.
                </Text>
                <View style={styles.welcomeRule} />
                <View style={styles.welcomeFoot}>
                  <FontAwesome6 name="circle-check" size={14} color="#9EE7BD" />
                  <Text style={styles.welcomeFootText}>
                    Pick up right where your library needs you
                  </Text>
                </View>
              </View>
              <View style={styles.welcomeOrb} />
              <View style={styles.welcomeBadge}>
                <FontAwesome6 name="chair" size={15} color="#9EE7BD" />
                <Text style={styles.welcomeBadgeText}>
                  Your day, in good order
                </Text>
              </View>
            </View>
          )}

          <View style={styles.formPanel}>
            {!isDesktop && (
              <View style={styles.mobileWelcome}>
                <View style={styles.mobileWelcomeIcon}>
                  <FontAwesome6
                    name="sparkles"
                    size={17}
                    color={colors.primaryBlue}
                  />
                </View>
                <Text style={styles.mobileEyebrow}>WELCOME BACK</Text>
                <Text style={styles.heading}>Your library is waiting.</Text>
                <Text style={styles.subtitle}>
                  Sign in to pick up where you left off.
                </Text>
              </View>
            )}

            <View style={styles.formCard}>
              {isDesktop && (
                <View style={styles.formHeading}>
                  <View style={styles.formGreeting}>
                    <View style={styles.formGreetingIcon}>
                      <FontAwesome6
                        name="hand"
                        size={16}
                        color={colors.primaryBlue}
                      />
                    </View>
                    <View style={styles.formGreetingCopy}>
                      <Text style={styles.formGreetingTitle}>Welcome back</Text>
                      <Text style={styles.formGreetingSubtitle}>
                        Sign in to your LibManage workspace
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.fieldLabel}>Sign in as</Text>
              <View style={styles.switchContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isAdmin }}
                  style={({ pressed }) => [
                    styles.switchButton,
                    isAdmin && styles.activeSwitch,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => changeLoginType("ADMIN")}
                >
                  <FontAwesome6
                    name="user-tie"
                    size={13}
                    color={isAdmin ? colors.primaryBlue : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.switchText,
                      isAdmin && styles.activeSwitchText,
                    ]}
                  >
                    Admin
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: !isAdmin }}
                  style={({ pressed }) => [
                    styles.switchButton,
                    !isAdmin && styles.activeSwitch,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => changeLoginType("EMPLOYEE")}
                >
                  <FontAwesome6
                    name="users"
                    size={13}
                    color={!isAdmin ? colors.primaryBlue : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.switchText,
                      !isAdmin && styles.activeSwitchText,
                    ]}
                  >
                    Employee
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>
                {isAdmin ? "Phone number" : "Username"}
              </Text>
              <View style={styles.inputWrap}>
                <FontAwesome6
                  name={isAdmin ? "phone" : "user"}
                  size={15}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <AppInput
                  placeholder={
                    isAdmin ? "Enter your phone number" : "Enter your username"
                  }
                  value={identifier}
                  onChangeText={setIdentifier}
                  keyboardType={isAdmin ? "phone-pad" : "default"}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <FontAwesome6
                  name="lock"
                  size={15}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <AppInput
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, styles.passwordInput]}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    passwordVisible ? "Hide password" : "Show password"
                  }
                  onPress={() => setPasswordVisible((value) => !value)}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <FontAwesome6
                    name={passwordVisible ? "eye-slash" : "eye"}
                    size={15}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert(
                    "Forgot password?",
                    "Please contact your library administrator for help resetting your password."
                  )
                }
                style={({ pressed }) => [
                  styles.forgotWrap,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={loading}
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.pressed,
                  loading && styles.disabled,
                ]}
              >
                {loading ? (
                  <Text style={styles.submitText}>Signing in…</Text>
                ) : (
                  <>
                    <Text style={styles.submitText}>Sign in</Text>
                    <FontAwesome6 name="arrow-right" size={14} color="#fff" />
                  </>
                )}
              </Pressable>

              {isAdmin && (
                <View style={styles.signupRow}>
                  <Text style={styles.signupText}>New to LibManage? </Text>
                  <Pressable accessibilityRole="link" onPress={openEnquiry}>
                    <Text style={styles.signupLink}>Make an enquiry</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View style={styles.secureNote}>
              <FontAwesome6
                name="shield-halved"
                size={12}
                color={colors.primaryGreen}
              />
              <Text style={styles.secureText}>
                Secure access to your library workspace
              </Text>
            </View>
          </View>
        </View>

        {isDesktop && (
          <Text style={styles.footer}>
            LIBMANAGE· A BETTER LIBRARY DAY STARTS HERE
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function createStyles(colors, isDesktop) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.bg },
    pageContent: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: isDesktop ? "center" : "flex-start",
    },
    shell: {
      width: "100%",
      maxWidth: 1240,
      minHeight: isDesktop ? "100%" : undefined,
      paddingHorizontal: isDesktop ? 56 : 20,
      paddingTop: isDesktop ? 25 : 15,
      paddingBottom: 24,
    },
    topbar: {
      minHeight: 43,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: isDesktop ? 26 : 10,
    },
    backButton: {
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    backText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
    brand: { flexDirection: "row", alignItems: "center", gap: 9 },
    brandMark: {
      width: 34,
      height: 34,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryBlue,
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    main: {
      flex: 1,
      flexDirection: isDesktop ? "row" : "column",
      alignItems: "stretch",
      justifyContent: "center",
      gap: isDesktop ? 24 : 0,
    },
    welcomePanel: {
      flex: 1,
      minHeight: 590,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: isDark(colors) ? "#12283a" : "#153d36",
      padding: 42,
      justifyContent: "center",
      position: "relative",
    },
    welcomeContent: { maxWidth: 440, zIndex: 1 },
    welcomePattern: {
      position: "absolute",
      right: -65,
      top: -50,
      width: 360,
      height: 360,
      borderRadius: 180,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
    welcomeOrb: {
      position: "absolute",
      right: -90,
      bottom: -130,
      width: 390,
      height: 390,
      borderRadius: 195,
      backgroundColor: "rgba(67, 154, 116, 0.17)",
    },
    welcomeIcon: {
      width: 50,
      height: 50,
      borderRadius: 16,
      backgroundColor: "rgba(255,255,255,0.12)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 28,
    },
    welcomeEyebrow: {
      color: "#9EE7BD",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.6,
      marginBottom: 15,
    },
    welcomeTitle: {
      color: "#fff",
      fontSize: 37,
      lineHeight: 45,
      fontWeight: "800",
      letterSpacing: -1.4,
    },
    welcomeCopy: {
      color: "#C2D7D0",
      fontSize: 15,
      lineHeight: 24,
      marginTop: 17,
      maxWidth: 360,
    },
    welcomeRule: {
      width: 45,
      height: 3,
      borderRadius: 2,
      backgroundColor: "#79D7A4",
      marginTop: 28,
      marginBottom: 20,
    },
    welcomeFoot: { flexDirection: "row", alignItems: "center", gap: 9 },
    welcomeFootText: { color: "#D5E5DF", fontSize: 12 },
    welcomeBadge: {
      position: "absolute",
      left: 35,
      bottom: 32,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.10)",
      zIndex: 2,
    },
    welcomeBadgeText: { color: "#EAF5EF", fontSize: 11, fontWeight: "700" },
    formPanel: {
      width: isDesktop ? 460 : "100%",
      alignSelf: isDesktop ? "center" : "stretch",
      paddingHorizontal: isDesktop ? 22 : 0,
      paddingVertical: isDesktop ? 20 : 0,
    },
    mobileWelcome: { alignItems: "center", paddingTop: 7, paddingBottom: 25 },
    mobileWelcomeIcon: {
      width: 39,
      height: 39,
      borderRadius: 13,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    mobileEyebrow: {
      color: colors.primaryBlue,
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    heading: {
      color: colors.textPrimary,
      fontSize: isDesktop ? 27 : 25,
      lineHeight: isDesktop ? 33 : 31,
      fontWeight: "900",
      letterSpacing: -0.9,
      textAlign: isDesktop ? "left" : "center",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 7,
      textAlign: isDesktop ? "left" : "center",
    },
    formCard: {
      padding: isDesktop ? 0 : 19,
      borderWidth: isDesktop ? 0 : 1,
      borderColor: colors.border,
      borderRadius: 22,
      backgroundColor: colors.card,
      shadowColor: "#17332d",
      shadowOpacity: isDesktop ? 0 : 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: isDesktop ? 0 : 3,
    },
    formHeading: { marginBottom: 25 },
    formGreeting: { flexDirection: "row", alignItems: "center", gap: 13 },
    formGreetingIcon: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },
    formGreetingCopy: { flex: 1 },
    formGreetingTitle: {
      color: colors.textPrimary,
      fontSize: 26,
      fontWeight: "900",
      letterSpacing: -0.9,
    },
    formGreetingSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    fieldLabel: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "800",
      marginBottom: 8,
      marginTop: 12,
    },
    switchContainer: {
      flexDirection: "row",
      gap: 6,
      padding: 4,
      borderRadius: 13,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    switchButton: {
      flex: 1,
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 10,
    },
    activeSwitch: {
      backgroundColor: colors.card,
      shadowColor: "#152c27",
      shadowOpacity: 0.08,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    switchText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
    activeSwitchText: { color: colors.primaryBlue },
    inputWrap: {
      minHeight: 50,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.bg,
      position: "relative",
    },
    inputIcon: { position: "absolute", left: 14, zIndex: 1 },
    input: {
      flex: 1,
      width: undefined,
      minHeight: 48,
      borderWidth: 0,
      borderRadius: 12,
      backgroundColor: "transparent",
      paddingLeft: 41,
      paddingRight: 12,
      paddingVertical: 12,
      marginBottom: 0,
      fontSize: 13,
    },
    passwordInput: { paddingRight: 42 },
    eyeButton: {
      minWidth: 42,
      minHeight: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    forgotWrap: { alignSelf: "flex-end", paddingVertical: 12 },
    forgot: { color: colors.primaryBlue, fontSize: 11, fontWeight: "700" },
    submitButton: {
      minHeight: 51,
      borderRadius: 13,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 11,
      marginTop: 3,
      shadowColor: colors.primaryBlue,
      shadowOpacity: 0.18,
      shadowRadius: 11,
      shadowOffset: { width: 0, height: 5 },
      elevation: 3,
    },
    submitText: { color: "#fff", fontSize: 14, fontWeight: "800" },
    disabled: { opacity: 0.65 },
    signupRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
      marginTop: 21,
    },
    signupText: { color: colors.textSecondary, fontSize: 12 },
    signupLink: { color: colors.primaryBlue, fontSize: 12, fontWeight: "800" },
    secureNote: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      marginTop: 19,
    },
    secureText: { color: colors.textMuted, fontSize: 10 },
    footer: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
      textAlign: "center",
      paddingTop: 20,
    },
    pressed: { opacity: 0.82 },
  });
}

function isDark(colors) {
  return colors.bg === darkColors.bg;
}
