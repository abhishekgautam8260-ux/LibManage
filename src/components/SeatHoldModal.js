import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";
import { holdSeat } from "../api/dashboard";

export default function SeatHoldModal({
  visible,
  seatNumber,
  libraryId,
  onClose,
  onSuccess,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  // ============================================================
  // STATE
  // ============================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [days, setDays] = useState(1);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ============================================================
  // RESET WHEN MODAL OPENS
  // ============================================================

  useEffect(() => {
    if (visible) {
      setName("");
      setPhone("");
      setDays(1);
      setLoading(false);
      setError("");
    }
  }, [visible]);

  // ============================================================
  // CLOSE
  // ============================================================

  const handleClose = () => {
    if (loading) {
      return;
    }

    setError("");

    onClose?.();
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validate = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter the person's name.");
      return false;
    }

    if (!libraryId) {
      setError("Library information is missing.");
      return false;
    }

    if (!seatNumber) {
      setError("Seat information is missing.");
      return false;
    }

    if (days !== 1 && days !== 2) {
      setError("Please select 1 Day or 2 Days.");
      return false;
    }

    return true;
  };

  // ============================================================
  // HOLD SEAT
  // ============================================================

  const handleHold = async () => {
    if (loading) {
      return;
    }

    setError("");

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      const response = await holdSeat({
        libraryId,
        seatNumber,
        name: name.trim(),
        phone: phone.trim(),
        days,
      });

      console.log("✅ Seat hold successful:", response);

      /*
       * Let DashboardScreen refresh seats
       * and close this modal.
       */
      onSuccess?.(response);
    } catch (err) {
      console.error("❌ Seat hold failed:", err);

      const serverMessage = err?.response?.data?.message;

      if (serverMessage) {
        setError(serverMessage);
      } else if (err?.response?.status === 409) {
        setError("This seat is already occupied or held.");
      } else {
        setError("Unable to hold this seat. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // DURATION BUTTON
  // ============================================================

  const renderDurationButton = (value, label) => {
    const selected = days === value;

    return (
      <TouchableOpacity
        key={value}
        activeOpacity={0.75}
        disabled={loading}
        onPress={() => {
          setDays(value);
          setError("");
        }}
        style={[
          styles.durationButton,
          selected && styles.durationButtonSelected,
        ]}
      >
        <Text
          style={[styles.durationText, selected && styles.durationTextSelected]}
        >
          {label}
        </Text>

        {selected && <View style={styles.selectedDot} />}
      </TouchableOpacity>
    );
  };

  // ============================================================
  // MODAL
  // ============================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* BACKDROP */}

        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* PANEL */}

        <View style={styles.panel}>
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Hold Seat</Text>

              <Text style={styles.subtitle}>
                Temporarily reserve seat{" "}
                <Text style={styles.seatHighlight}>#{seatNumber}</Text>
              </Text>
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* SEAT BADGE */}

          <View style={styles.seatBadge}>
            <Text style={styles.seatBadgeNumber}>{seatNumber}</Text>

            <Text style={styles.seatBadgeLabel}>SEAT</Text>
          </View>

          {/* NAME */}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>

            <TextInput
              value={name}
              onChangeText={(value) => {
                setName(value);
                setError("");
              }}
              placeholder="Enter person's name"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="words"
              editable={!loading}
              returnKeyType="next"
              style={styles.input}
            />
          </View>

          {/* PHONE */}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Phone
              <Text style={styles.optionalText}> (optional)</Text>
            </Text>

            <TextInput
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setError("");
              }}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textFaint}
              keyboardType="phone-pad"
              editable={!loading}
              returnKeyType="done"
              style={styles.input}
            />
          </View>

          {/* DURATION */}

          <View style={styles.durationSection}>
            <Text style={styles.inputLabel}>Hold Duration</Text>

            <View style={styles.durationRow}>
              {renderDurationButton(1, "1 Day")}

              {renderDurationButton(2, "2 Days")}
            </View>
          </View>

          {/* INFO */}

          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>⏱</Text>

            <Text style={styles.infoText}>
              This seat will automatically become available after the selected
              hold duration.
            </Text>
          </View>

          {/* ERROR */}

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>!</Text>

              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ACTIONS */}

          <View style={styles.actions}>
            <TouchableOpacity
              disabled={loading}
              onPress={handleClose}
              activeOpacity={0.75}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={loading}
              onPress={handleHold}
              activeOpacity={0.8}
              style={[styles.holdButton, loading && styles.holdButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.holdText}>Hold Seat</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================
// STYLES
// ============================================================

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.55)",
    },

    panel: {
      width: "91%",
      maxWidth: 440,

      backgroundColor: colors.card,

      borderRadius: 22,

      padding: 20,

      borderWidth: 1,
      borderColor: colors.border,

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,

      elevation: 12,
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    },

    title: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    subtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textSecondary,
    },

    seatHighlight: {
      fontWeight: "800",
      color: colors.warning,
    },

    closeButton: {
      width: 36,
      height: 36,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.borderLight,
    },

    closeText: {
      fontSize: 26,
      lineHeight: 28,
      fontWeight: "400",
      color: colors.textSecondary,
    },

    // ========================================================
    // SEAT BADGE
    // ========================================================

    seatBadge: {
      alignSelf: "center",

      width: 70,
      height: 70,

      borderRadius: 18,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.warningBg,

      borderWidth: 1.5,
      borderColor: colors.warning,

      marginBottom: 18,
    },

    seatBadgeNumber: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.warning,
    },

    seatBadgeLabel: {
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 1,
      color: colors.warning,
      marginTop: 1,
    },

    // ========================================================
    // INPUTS
    // ========================================================

    inputContainer: {
      marginBottom: 14,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 7,
    },

    optionalText: {
      fontWeight: "500",
      color: colors.textMuted,
    },

    input: {
      height: 48,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      backgroundColor: colors.bg,

      paddingHorizontal: 14,

      fontSize: 15,

      color: colors.textPrimary,
    },

    // ========================================================
    // DURATION
    // ========================================================

    durationSection: {
      marginTop: 2,
      marginBottom: 14,
    },

    durationRow: {
      flexDirection: "row",
      gap: 10,
    },

    durationButton: {
      flex: 1,

      minHeight: 48,

      borderRadius: 12,

      borderWidth: 1.5,
      borderColor: colors.border,

      backgroundColor: colors.bg,

      alignItems: "center",
      justifyContent: "center",

      flexDirection: "row",
      gap: 8,
    },

    durationButtonSelected: {
      borderColor: colors.warning,
      backgroundColor: colors.warningBg,
    },

    durationText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    durationTextSelected: {
      color: colors.warning,
    },

    selectedDot: {
      width: 7,
      height: 7,

      borderRadius: 4,

      backgroundColor: colors.warning,
    },

    // ========================================================
    // INFO
    // ========================================================

    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",

      backgroundColor: colors.borderLight,

      borderRadius: 12,

      padding: 11,

      marginBottom: 12,
    },

    infoIcon: {
      fontSize: 16,
      marginRight: 8,
    },

    infoText: {
      flex: 1,

      fontSize: 11.5,
      lineHeight: 17,

      color: colors.textSecondary,
    },

    // ========================================================
    // ERROR
    // ========================================================

    errorBox: {
      flexDirection: "row",
      alignItems: "center",

      backgroundColor: colors.dangerBg,

      borderRadius: 10,

      paddingHorizontal: 11,
      paddingVertical: 9,

      marginBottom: 12,
    },

    errorIcon: {
      width: 20,
      height: 20,

      borderRadius: 10,

      textAlign: "center",
      lineHeight: 20,

      marginRight: 8,

      fontSize: 12,
      fontWeight: "900",

      color: colors.danger,

      backgroundColor: colors.card,
    },

    errorText: {
      flex: 1,

      fontSize: 12,
      fontWeight: "600",

      color: colors.danger,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actions: {
      flexDirection: "row",
      gap: 10,

      marginTop: 4,
    },

    cancelButton: {
      flex: 1,

      height: 48,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.card,
    },

    cancelText: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    holdButton: {
      flex: 1,

      height: 48,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.warning,
    },

    holdButtonDisabled: {
      opacity: 0.65,
    },

    holdText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#FFFFFF",
    },
  });
