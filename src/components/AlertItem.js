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
// DATE HELPERS
// ============================================================

function parseLocalDate(dateStr) {
  if (!dateStr) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  date.setHours(0, 0, 0, 0);

  return date;
}

// ============================================================
// EXPIRY STATUS
// ============================================================

function getExpiryStatus(expireDateStr) {
  if (!expireDateStr) return null;

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const expiry = parseLocalDate(expireDateStr);

  if (!expiry) return null;

  const diffDays = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "expired";
  }

  if (diffDays <= 3) {
    return "expiring-soon";
  }

  return null;
}

// ============================================================
// EXPIRED DAYS AGO
// ============================================================

function getExpiredText(expireDateStr) {
  if (!expireDateStr) return "";

  const expiry = parseLocalDate(expireDateStr);

  if (!expiry) return "";

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - expiry) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Expired today";
  }

  if (diffDays === 1) {
    return "Expired 1 day ago";
  }

  return `Expired ${diffDays} days ago`;
}

// ============================================================
// FORMAT HOLD DATE
// ============================================================

function formatHoldDate(dateString) {
  if (!dateString) {
    return "";
  }

  const date = parseLocalDate(dateString);

  if (!date) {
    return "";
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AlertItem({ student, onPress }) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  const expireDate = student.expireDate || student.expiryDate;

  const status = getExpiryStatus(expireDate);

  const isHeld = !!student.alertHoldUntil;

  // ==========================================================
  // WHATSAPP
  // ==========================================================

  const sendWhatsApp = () => {
    const msg =
      `Hello ${student.name} 👋\n\n` +
      `Your library seat (Seat No: ${student.seatNumber}) ` +
      `subscription has expired.\n\n` +
      `Please renew to continue your seat.\n\n` +
      `Thank you 🙏`;

    const phone = String(student.phone || "").replace(/\D/g, "");

    if (!phone) {
      return;
    }

    Linking.openURL(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`);
  };

  // ==========================================================
  // CALL
  // ==========================================================

  const callStudent = () => {
    const phone = String(student.phone || "").replace(/\D/g, "");

    if (!phone) {
      return;
    }

    Linking.openURL(`tel:${phone}`);
  };

  // ==========================================================
  // HELD CARD
  // ==========================================================

  if (isHeld) {
    return (
      <View style={styles.heldWrapper}>
        <TouchableOpacity
          style={styles.heldItem}
          activeOpacity={0.75}
          onPress={onPress}
        >
          <View style={styles.top}>
            <View style={styles.userRow}>
              <View style={styles.heldAvatar}>
                <FontAwesome6 name="user" size={14} color={colors.textMuted} />
              </View>

              <View>
                <Text style={styles.heldName}>{student.name}</Text>

                <Text style={styles.heldMeta}>Seat: {student.seatNumber}</Text>
              </View>
            </View>

            <View style={styles.holdBadge}>
              <FontAwesome6 name="pause" size={10} color={colors.textMuted} />

              <Text style={styles.holdBadgeText}>HOLD</Text>
            </View>
          </View>

          <Text style={styles.holdText}>Alert temporarily held</Text>

          <Text style={styles.holdUntilText}>
            Until {formatHoldDate(student.alertHoldUntil)}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================================
  // NORMAL ALERT
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
          <View style={styles.avatar}>
            <FontAwesome6 name="user" size={14} color={colors.textMuted} />
          </View>

          <View>
            <Text style={styles.name}>{student.name}</Text>

            <Text style={styles.meta}>Seat: {student.seatNumber}</Text>
          </View>
        </View>

        <Text
          style={
            status === "expired" ? styles.statusExpired : styles.statusExpiring
          }
        >
          {status === "expired" ? "EXPIRED" : "EXPIRING SOON"}
        </Text>
      </View>

      {/* ======================================================
          EXPIRED DAYS
          ====================================================== */}

      {status === "expired" && (
        <Text style={styles.expiredDays}>{getExpiredText(expireDate)}</Text>
      )}

      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.whatsapp}
          activeOpacity={0.8}
          onPress={sendWhatsApp}
        >
          <FontAwesome6 name="whatsapp" size={14} color="#FFFFFF" />

          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>

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
    // NORMAL ALERT
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

    avatar: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor: colors.bg,

      alignItems: "center",
      justifyContent: "center",
    },

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
    // STATUS
    // ========================================================

    statusExpired: {
      fontSize: 12,

      fontWeight: "700",

      color: colors.danger,
    },

    statusExpiring: {
      fontSize: 12,

      fontWeight: "700",

      color: colors.warning,
    },

    expiredDays: {
      marginTop: 8,

      fontSize: 13,

      fontWeight: "700",

      color: colors.danger,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actions: {
      flexDirection: "row",

      gap: 10,

      marginTop: 12,
    },

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

    // ========================================================
    // HELD ALERT
    // ========================================================

    heldWrapper: {
      opacity: 0.62,
    },

    heldItem: {
      backgroundColor: colors.bg,

      borderRadius: radius.lg,

      padding: spacing.md,

      marginBottom: spacing.sm,

      borderWidth: 1,

      borderColor: colors.border,
    },

    heldAvatar: {
      width: 40,
      height: 40,

      borderRadius: 20,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",
    },

    heldName: {
      fontWeight: "600",

      fontSize: 14,

      color: colors.textSecondary,
    },

    heldMeta: {
      fontSize: 12,

      color: colors.textMuted,
    },

    holdBadge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      paddingHorizontal: 9,

      paddingVertical: 5,

      borderRadius: 10,

      backgroundColor: colors.borderLight,
    },

    holdBadgeText: {
      fontSize: 10,

      fontWeight: "800",

      color: colors.textMuted,
    },

    holdText: {
      marginTop: 10,

      fontSize: 12,

      fontWeight: "600",

      color: colors.textMuted,
    },

    holdUntilText: {
      marginTop: 3,

      fontSize: 11,

      color: colors.textFaint,
    },
  });
}
