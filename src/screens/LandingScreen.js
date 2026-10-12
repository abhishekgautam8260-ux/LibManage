import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { darkColors, lightColors } from "../theme/colors";

const seatStates = [
  "taken",
  "taken",
  "free",
  "taken",
  "free",
  "taken",
  "taken",
  "free",
  "taken",
  "free",
  "taken",
  "taken",
];

export default function LandingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const { isDarkMode } = useTheme();
  const desktop = Platform.OS === "web" && width >= 900;
  const colors = isDarkMode ? darkColors : lightColors;
  const styles = makeStyles(colors, desktop);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.shell}>
        <View style={styles.topbar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <FontAwesome6 name="book-open" size={17} color="#fff" />
            </View>
            <Text style={styles.brandName}>LibManage</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Login")}
            style={({ pressed }) => [
              styles.topLogin,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.topLoginText}>Log in</Text>
            <FontAwesome6
              name="arrow-right"
              size={13}
              color={colors.primaryBlue}
            />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.copyColumn}>
            <View style={styles.eyebrow}>
              <View style={styles.liveDot} />
              <Text style={styles.eyebrowText}>
                A calmer way to run your library
              </Text>
            </View>
            <Text style={styles.headline}>
              Your library,{"\n"}
              <Text style={styles.headlineAccent}>beautifully in order.</Text>
            </Text>
            <Text style={styles.description}>
              Manage seats, memberships and daily operations from one simple
              workspace—so you can spend more time helping students learn.
            </Text>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("Login")}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>Go to your library</Text>
                <FontAwesome6 name="arrow-right" size={15} color="#fff" />
              </Pressable>
              <Text style={styles.signInHint}>
                Sign in to continue to your dashboard
              </Text>
            </View>

            <View style={styles.trustRow}>
              <View style={styles.trustIcon}>
                <FontAwesome6
                  name="shield-halved"
                  size={13}
                  color={colors.primaryGreen}
                />
              </View>
              <Text style={styles.trustText}>
                Your library information stays organized and secure
              </Text>
            </View>
          </View>

          <View style={styles.visualColumn}>
            <View style={styles.orb} />
            <View style={styles.dashCard}>
              <View style={styles.dashHeader}>
                <View>
                  <Text style={styles.dashOverline}>LIBRARY OVERVIEW</Text>
                  <Text style={styles.dashTitle}>Today at a glance</Text>
                </View>
                <View style={styles.todayChip}>
                  <View style={styles.liveDot} />
                  <Text style={styles.todayText}>Live</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, styles.statCardGreen]}>
                  <View style={styles.statIconGreen}>
                    <FontAwesome6
                      name="users"
                      size={14}
                      color={colors.primaryGreen}
                    />
                  </View>
                  <Text style={styles.statNumber}>24</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
                <View style={[styles.statCard, styles.statCardBlue]}>
                  <View style={styles.statIconBlue}>
                    <FontAwesome6
                      name="chair"
                      size={14}
                      color={colors.primaryBlue}
                    />
                  </View>
                  <Text style={styles.statNumber}>
                    18<Text style={styles.statTotal}>/30</Text>
                  </Text>
                  <Text style={styles.statLabel}>Seats in use</Text>
                </View>
              </View>

              <View style={styles.seatCard}>
                <View style={styles.seatTitleRow}>
                  <Text style={styles.seatTitle}>Seat layout</Text>
                  <Text style={styles.seatMeta}>Floor 01</Text>
                </View>
                <View style={styles.seatGrid}>
                  {seatStates.map((state, index) => (
                    <View
                      key={index}
                      style={[
                        styles.seat,
                        state === "taken" ? styles.seatTaken : styles.seatFree,
                      ]}
                    >
                      <FontAwesome6
                        name="chair"
                        size={11}
                        color={
                          state === "taken"
                            ? colors.primaryBlue
                            : colors.primaryGreen
                        }
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendTaken]} />
                    <Text style={styles.legendText}>Occupied</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, styles.legendFree]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.floatingNote}>
              <View style={styles.noteIcon}>
                <FontAwesome6 name="check" size={13} color="#fff" />
              </View>
              <View>
                <Text style={styles.noteTitle}>Everything in its place</Text>
                <Text style={styles.noteBody}>
                  Seats and students, together
                </Text>
              </View>
            </View>
            <View style={styles.decorDot} />
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MADE FOR THE PEOPLE WHO MAKE ROOM TO LEARN
          </Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerTag}>
            Simple tools. A better library day.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function makeStyles(colors, desktop) {
  return StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.bg },
    pageContent: { flexGrow: 1, alignItems: "center" },
    shell: {
      width: "100%",
      maxWidth: 1320,
      flex: 1,
      paddingHorizontal: desktop ? 64 : 22,
      paddingTop: desktop ? 30 : 18,
      paddingBottom: desktop ? 20 : 24,
    },
    topbar: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: desktop ? 26 : 20,
    },
    brand: { flexDirection: "row", alignItems: "center", gap: 10 },
    brandMark: {
      width: 37,
      height: 37,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryBlue,
    },
    brandName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: -0.6,
    },
    topLogin: {
      minHeight: 40,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    topLoginText: {
      color: colors.textPrimary,
      fontSize: 13,
      fontWeight: "700",
    },
    hero: {
      flex: 1,
      flexDirection: desktop ? "row" : "column",
      alignItems: "center",
      justifyContent: "space-between",
      gap: desktop ? 42 : 18,
      paddingVertical: desktop ? 28 : 4,
    },
    copyColumn: {
      width: desktop ? "48%" : "100%",
      alignItems: desktop ? "flex-start" : "center",
      paddingVertical: desktop ? 16 : 0,
      zIndex: 1,
    },
    eyebrow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.successBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 99,
      marginBottom: desktop ? 22 : 17,
    },
    liveDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primaryGreen,
    },
    eyebrowText: {
      color: colors.primaryGreenDark,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    headline: {
      color: colors.textPrimary,
      fontSize: desktop ? 58 : 39,
      lineHeight: desktop ? 66 : 46,
      fontWeight: "800",
      letterSpacing: desktop ? -2.8 : -1.8,
      textAlign: desktop ? "left" : "center",
      maxWidth: 600,
    },
    headlineAccent: { color: colors.primaryBlue },
    description: {
      color: colors.textSecondary,
      fontSize: desktop ? 17 : 15,
      lineHeight: desktop ? 27 : 23,
      marginTop: desktop ? 20 : 14,
      maxWidth: 470,
      textAlign: desktop ? "left" : "center",
    },
    actions: {
      width: desktop ? 270 : "100%",
      alignItems: desktop ? "flex-start" : "center",
      marginTop: desktop ? 30 : 23,
    },
    primaryButton: {
      width: "100%",
      minHeight: 54,
      borderRadius: 15,
      paddingHorizontal: 20,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      shadowColor: colors.primaryBlue,
      shadowOpacity: 0.22,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 7 },
      elevation: 4,
    },
    primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
    signInHint: {
      color: colors.textMuted,
      fontSize: 11,
      marginTop: 10,
      textAlign: "center",
    },
    trustRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginTop: desktop ? 32 : 21,
      maxWidth: 390,
    },
    trustIcon: {
      width: 25,
      height: 25,
      borderRadius: 9,
      backgroundColor: colors.successBg,
      alignItems: "center",
      justifyContent: "center",
    },
    trustText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    visualColumn: {
      width: desktop ? "49%" : "100%",
      minHeight: desktop ? 500 : 340,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      paddingVertical: 10,
    },
    orb: {
      position: "absolute",
      width: desktop ? 450 : 310,
      height: desktop ? 450 : 310,
      borderRadius: 999,
      backgroundColor: isDark(colors) ? "#172f48" : "#e5f2eb",
      top: "50%",
      left: "50%",
      marginTop: desktop ? -225 : -155,
      marginLeft: desktop ? -225 : -155,
    },
    dashCard: {
      width: "100%",
      maxWidth: desktop ? 500 : 440,
      borderRadius: 24,
      padding: desktop ? 23 : 17,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#1c3444",
      shadowOpacity: isDark(colors) ? 0.18 : 0.09,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: 15 },
      elevation: 8,
      zIndex: 1,
    },
    dashHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 17,
    },
    dashOverline: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.2,
      marginBottom: 5,
    },
    dashTitle: {
      color: colors.textPrimary,
      fontSize: desktop ? 18 : 16,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    todayChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.successBg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
    },
    todayText: {
      color: colors.primaryGreenDark,
      fontSize: 10,
      fontWeight: "800",
    },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    statCard: {
      flex: 1,
      minHeight: 92,
      borderRadius: 15,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statCardGreen: { backgroundColor: isDark(colors) ? "#142a25" : "#f4faf6" },
    statCardBlue: { backgroundColor: isDark(colors) ? "#18263b" : "#f4f7fd" },
    statIconGreen: {
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor: colors.successBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statIconBlue: {
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    statNumber: {
      color: colors.textPrimary,
      fontSize: 19,
      lineHeight: 22,
      fontWeight: "900",
      letterSpacing: -0.5,
    },
    statTotal: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
    seatCard: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 16,
      padding: desktop ? 15 : 12,
      backgroundColor: colors.bg,
    },
    seatTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11,
    },
    seatTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: "800" },
    seatMeta: { color: colors.textMuted, fontSize: 10 },
    seatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    seat: {
      width: "14.2%",
      flexGrow: 1,
      height: desktop ? 38 : 34,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    seatTaken: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.statBlueBg,
    },
    seatFree: {
      backgroundColor: colors.successBg,
      borderColor: colors.successBg,
    },
    legend: { flexDirection: "row", gap: 16, marginTop: 12 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    legendDot: { width: 7, height: 7, borderRadius: 4 },
    legendTaken: { backgroundColor: colors.primaryBlue },
    legendFree: { backgroundColor: colors.primaryGreen },
    legendText: { color: colors.textMuted, fontSize: 9 },
    floatingNote: {
      position: "absolute",
      zIndex: 2,
      left: desktop ? -16 : 0,
      bottom: desktop ? 31 : 2,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 15,
      paddingHorizontal: 13,
      paddingVertical: 11,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#1c3444",
      shadowOpacity: 0.12,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 5,
    },
    noteIcon: {
      width: 27,
      height: 27,
      borderRadius: 9,
      backgroundColor: colors.primaryGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    noteTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: "800" },
    noteBody: { color: colors.textMuted, fontSize: 9, marginTop: 3 },
    decorDot: {
      position: "absolute",
      zIndex: 0,
      right: desktop ? 3 : 12,
      top: desktop ? 39 : 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.warning,
    },
    footer: {
      flexDirection: desktop ? "row" : "column",
      justifyContent: desktop ? "space-between" : "center",
      alignItems: "center",
      gap: desktop ? 14 : 7,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
      marginTop: 14,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.1,
      textAlign: "center",
    },
    footerLine: {
      display: desktop ? "flex" : "none",
      height: 1,
      flex: 1,
      backgroundColor: colors.border,
    },
    footerTag: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
    pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  });
}

function isDark(colors) {
  return colors.bg === darkColors.bg;
}
