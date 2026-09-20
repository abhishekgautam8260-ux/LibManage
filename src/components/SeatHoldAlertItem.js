import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, radius, spacing } from "../theme/colors";

// ============================================================
// FORMAT HOLD DATE
// ============================================================

function formatHoldDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ============================================================
// COMPONENT
// ============================================================

export default function SeatHoldAlertItem({ alert, onPress }) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  // ==========================================================
  // WHATSAPP
  // ==========================================================

  const sendWhatsApp = () => {
    const msg =
      `Hello ${alert?.name || ""} 👋\n\n` +
      `Your seat (Seat No: ${alert?.seatNumber}) ` +
      `is currently on temporary hold at the library.\n\n` +
      `Please contact us if you would like to confirm the seat.\n\n` +
      `Thank you 🙏`;

    const phone = String(alert?.phone || "").replace(/\D/g, "");

    if (!phone) {
      return;
    }

    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  // ==========================================================
  // CALL
  // ==========================================================

  const callStudent = () => {
    const phone = String(alert?.phone || "").replace(/\D/g, "");

    if (!phone) {
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  // ==========================================================
  // ACTIVE HOLD CARD
  // ==========================================================

  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.78}
      onPress={onPress}
    >
      {/* ======================================================
          TOP
          ====================================================== */}

      <View style={styles.top}>
        <View style={styles.userRow}>
          {/* USER AVATAR */}
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={14} color={colors.textMuted} />
          </View>

          {/* NAME + SEAT */}
          <View>
            <Text style={styles.name}>{alert?.name || "Unknown"}</Text>

            <Text style={styles.meta}>Seat: {alert?.seatNumber}</Text>
          </View>
        </View>

        {/* ACTIVE */}
        <Text style={styles.statusActive}>ACTIVE</Text>
      </View>

      {/* ======================================================
          HOLD UNTIL
          ====================================================== */}

      <Text style={styles.holdUntil}>
        Hold until {formatHoldDate(alert?.holdUntil)}
      </Text>

      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <View style={styles.actions}>
        {/* WHATSAPP */}
        <TouchableOpacity
          style={styles.whatsapp}
          activeOpacity={0.8}
          onPress={sendWhatsApp}
        >
          <FontAwesome6 name="whatsapp" size={14} color="#FFFFFF" />

          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>

        {/* CALL */}
        <TouchableOpacity
          style={styles.call}
          activeOpacity={0.8}
          onPress={callStudent}
        >
          <FontAwesome6 name="phone" size={14} color={colors.textSecondary} />

          <Text style={styles.callText}>Call</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ============================================================
// DYNAMIC STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // MAIN CARD
    // ========================================================

    item: {
      backgroundColor: colors.card,

      borderRadius: radius.lg,

      padding: spacing.md,

      marginBottom: spacing.sm,

      borderWidth: 1,

      borderColor: colors.border,

      shadowColor: "#000",

      shadowOpacity: 0.06,

      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    // ========================================================
    // TOP
    // ========================================================

    top: {
      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",
    },

    userRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,

      flex: 1,
    },

    // ========================================================
    // AVATAR
    // ========================================================

    avatar: {
      width: 40,

      height: 40,

      borderRadius: 20,

      backgroundColor: colors.bg,

      alignItems: "center",

      justifyContent: "center",
    },

    // ========================================================
    // NAME
    // ========================================================

    name: {
      fontWeight: "600",

      fontSize: 14,

      color: colors.textPrimary,
    },

    meta: {
      fontSize: 12,

      color: colors.textFaint,
    },

    // ========================================================
    // ACTIVE STATUS
    // ========================================================

    statusActive: {
      fontSize: 12,

      fontWeight: "700",

      color: colors.warning,
    },

    // ========================================================
    // HOLD UNTIL
    // ========================================================

    holdUntil: {
      marginTop: 8,

      fontSize: 13,

      fontWeight: "700",

      color: colors.warning,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actions: {
      flexDirection: "row",

      gap: 10,

      marginTop: 12,
    },

    // ========================================================
    // WHATSAPP
    // ========================================================

    whatsapp: {
      flex: 1,

      flexDirection: "row",

      gap: 6,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor: colors.primaryGreen,

      paddingVertical: 10,

      borderRadius: radius.sm,
    },

    whatsappText: {
      color: "#FFFFFF",

      fontWeight: "600",

      fontSize: 13,
    },

    // ========================================================
    // CALL
    // ========================================================

    call: {
      flex: 1,

      flexDirection: "row",

      gap: 6,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor: colors.card,

      borderWidth: 1,

      borderColor: colors.border,

      paddingVertical: 10,

      borderRadius: radius.sm,
    },

    callText: {
      fontWeight: "600",

      fontSize: 13,

      color: colors.textSecondary,
    },
  });
}
