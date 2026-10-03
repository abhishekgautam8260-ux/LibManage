import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, radius, spacing } from "../theme/colors";

// ============================================================
// BOOKING MODAL
// ============================================================

export default function BookingModal({
  visible,
  seatNumber,
  onClose,
  onConfirm,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  // ==========================================================
  // STATE
  // ==========================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("700");

  // ==========================================================
  // CONFIRM BOOKING
  // ==========================================================

  const handleConfirm = () => {
    Keyboard.dismiss();

    onConfirm({
      seatNumber,
      name,
      phone,
      amountPaid: amount,
    });
  };

  // ==========================================================
  // CLOSE MODAL
  // ==========================================================

  const handleClose = () => {
    Keyboard.dismiss();

    setName("");
    setPhone("");
    setAmount("700");

    onClose();
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalWrapper}>
            {/* ==================================================
                HEADER
            ================================================== */}

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Book Seat</Text>

                <Text style={styles.subtitle}>Seat {seatNumber}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* ==================================================
                NAME
            ================================================== */}

            <Text style={styles.label}>Student Name</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter student name"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { fontSize: 16 }]}
              autoCapitalize="words"
            />

            {/* ==================================================
                PHONE
            ================================================== */}

            <Text style={styles.label}>Phone Number</Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { fontSize: 16 }]}
              keyboardType="phone-pad"
              maxLength={15}
            />

            {/* ==================================================
                AMOUNT
            ================================================== */}

            <Text style={styles.label}>Amount Paid</Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { fontSize: 16 }]}
              keyboardType="numeric"
            />

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleClose}
                style={[styles.button, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirm}
                style={[styles.button, styles.confirmButton]}
              >
                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ============================================================
// DYNAMIC STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // OVERLAY
    // ========================================================

    overlay: {
      flex: 1,

      backgroundColor: "rgba(0, 0, 0, 0.48)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: spacing.md,
    },

    keyboardContainer: {
      width: "100%",

      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // MODAL
    // ========================================================

    modalWrapper: {
      width: "100%",

      maxWidth: 430,

      backgroundColor: colors.card,

      borderRadius: radius.lg,

      padding: spacing.lg,

      borderWidth: 1,
      borderColor: colors.border,

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 20,

      elevation: 12,
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: spacing.lg,
    },

    title: {
      fontSize: 24,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    subtitle: {
      marginTop: 3,

      fontSize: 14,

      color: colors.textSecondary,
    },

    closeButton: {
      width: 36,
      height: 36,

      borderRadius: 18,

      backgroundColor: colors.bg,

      alignItems: "center",
      justifyContent: "center",
    },

    closeText: {
      fontSize: 25,

      lineHeight: 28,

      color: colors.textSecondary,

      fontWeight: "400",
    },

    // ========================================================
    // FORM
    // ========================================================

    label: {
      fontSize: 13,

      fontWeight: "600",

      color: colors.textSecondary,

      marginBottom: 7,
    },

    input: {
      width: "100%",

      minHeight: 48,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: radius.sm,

      paddingHorizontal: 13,
      paddingVertical: 11,

      marginBottom: 14,

      fontSize: 14,

      color: colors.textPrimary,

      backgroundColor: colors.bg,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actions: {
      flexDirection: "row",

      gap: spacing.sm,

      marginTop: spacing.sm,
    },

    button: {
      flex: 1,

      minHeight: 46,

      borderRadius: radius.sm,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 10,
    },

    cancelButton: {
      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    cancelButtonText: {
      fontSize: 14,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    confirmButton: {
      backgroundColor: colors.primaryBlue,
    },

    confirmButtonText: {
      fontSize: 14,

      fontWeight: "600",

      color: "#FFFFFF",
    },
  });
}
