import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";
import { cancelSeatHold } from "../api/dashboard";

export default function HeldSeatModal({
  visible,
  seat,
  onClose,
  onBook,
  onCancelled,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // RESET
  // ============================================================

  useEffect(() => {
    if (visible) {
      setLoading(false);
      setError("");
    }
  }, [visible]);

  // ============================================================
  // SAFE VALUES
  // ============================================================

  const seatNumber = seat?.seatNumber;

  const holdId = seat?.holdId;

  const holdName = seat?.holdName || "Unknown";

  const holdPhone = seat?.holdPhone || "";

  const holdUntil = seat?.holdUntil;

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatHoldUntil = (value) => {
    if (!value) {
      return "Unknown";
    }

    try {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return String(value);
      }

      return date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(value);
    }
  };

  // ============================================================
  // CANCEL HOLD
  // ============================================================

  const handleCancel = async () => {
    if (!holdId || loading) {
      return;
    }

    setError("");

    try {
      setLoading(true);

      await cancelSeatHold(holdId);

      console.log("✅ Seat hold cancelled:", holdId);

      onCancelled?.();
    } catch (err) {
      console.error("❌ Cancel seat hold failed:", err);

      const serverMessage = err?.response?.data?.message;

      setError(serverMessage || "Unable to cancel the hold. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // BOOK
  // ============================================================

  const handleBook = () => {
    console.log("🟢 BOOK BUTTON CLICKED");
    console.log("🪑 Held seat:", seat);
    console.log("⏳ Loading:", loading);
    console.log("📞 onBook exists:", typeof onBook);

    if (loading) {
      console.log("⚠️ Book blocked because loading=true");
      return;
    }

    if (!seat) {
      console.log("❌ Book blocked: seat is missing");
      return;
    }

    if (typeof onBook !== "function") {
      console.log("❌ Book blocked: onBook callback is missing");
      return;
    }

    console.log("🚀 Calling onBook with seat:", seat);

    onBook(seat);
  };

  // ============================================================
  // WHATSAPP
  // ============================================================

  const handleWhatsApp = async () => {
    if (!holdPhone) {
      return;
    }

    const cleanPhone = String(holdPhone).replace(/\D/g, "");

    if (!cleanPhone) {
      return;
    }

    /*
     * India country code.
     *
     * If the number already starts with 91,
     * don't add it again.
     */
    const formattedPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone}`;

    const url = `https://wa.me/${formattedPhone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("❌ WhatsApp open failed:", err);
    }
  };

  // ============================================================
  // CALL
  // ============================================================

  const handleCall = async () => {
    if (!holdPhone) {
      return;
    }

    const url = `tel:${holdPhone}`;

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error("❌ Call failed:", err);
    }
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
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* BACKDROP */}

        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* PANEL */}

        <View style={styles.panel}>
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Held Seat</Text>

              <Text style={styles.subtitle}>Temporary seat reservation</Text>
            </View>

            <TouchableOpacity
              disabled={loading}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* SEAT */}

          <View style={styles.seatSection}>
            <View style={styles.seatBadge}>
              <Text style={styles.seatNumber}>{seatNumber}</Text>

              <Text style={styles.seatLabel}>HELD</Text>
            </View>

            <View style={styles.seatInfo}>
              <Text style={styles.infoTitle}>Seat {seatNumber}</Text>

              <Text style={styles.infoSubtitle}>
                This seat is temporarily reserved.
              </Text>
            </View>
          </View>

          {/* PROSPECT DETAILS */}

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>

              <Text numberOfLines={1} style={styles.detailValue}>
                {holdName}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone</Text>

              <Text numberOfLines={1} style={styles.detailValue}>
                {holdPhone || "Not provided"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Held Until</Text>

              <Text
                numberOfLines={2}
                style={[
                  styles.detailValue,
                  {
                    color: colors.warning,
                  },
                ]}
              >
                {formatHoldUntil(holdUntil)}
              </Text>
            </View>
          </View>

          {/* CONTACT BUTTONS */}

          {!!holdPhone && (
            <View style={styles.contactRow}>
              <TouchableOpacity
                disabled={loading}
                onPress={handleWhatsApp}
                activeOpacity={0.75}
                style={styles.contactButton}
              >
                <Text style={styles.contactIcon}>💬</Text>

                <Text style={styles.contactText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={loading}
                onPress={handleCall}
                activeOpacity={0.75}
                style={styles.contactButton}
              >
                <Text style={styles.contactIcon}>📞</Text>

                <Text style={styles.contactText}>Call</Text>
              </TouchableOpacity>
            </View>
          )}

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
              onPress={handleCancel}
              activeOpacity={0.75}
              style={styles.cancelButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.danger} />
              ) : (
                <Text style={styles.cancelText}>Cancel Hold</Text>
              )}
            </TouchableOpacity>

            <Pressable
              disabled={loading}
              onPress={() => {
                console.log("🟢 WEB BOOK BUTTON PRESSED");
                handleBook();
              }}
              style={({ pressed }) => [
                styles.bookButton,
                pressed && styles.bookButtonPressed,
                loading && styles.bookButtonDisabled,
              ]}
            >
              <Text style={styles.bookText}>
                {loading ? "Booking..." : "Book This Seat"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
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
      zIndex: 0,
    },

    panel: {
      width: "91%",
      maxWidth: 440,

      backgroundColor: colors.card,
      position: "relative",
      zIndex: 10,
      elevation: 10,

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

      marginBottom: 18,
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
      color: colors.textSecondary,
    },

    // ========================================================
    // SEAT
    // ========================================================

    seatSection: {
      flexDirection: "row",
      alignItems: "center",

      marginBottom: 18,
    },

    seatBadge: {
      width: 68,
      height: 68,

      borderRadius: 17,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.warningBg,

      borderWidth: 1.5,
      borderColor: colors.warning,

      marginRight: 14,
    },

    seatNumber: {
      fontSize: 24,
      fontWeight: "900",
      color: colors.warning,
    },

    seatLabel: {
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.8,
      color: colors.warning,
      marginTop: 1,
    },

    seatInfo: {
      flex: 1,
    },

    infoTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    infoSubtitle: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 4,
      color: colors.textSecondary,
    },

    // ========================================================
    // DETAILS
    // ========================================================

    detailsCard: {
      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      paddingHorizontal: 14,
      paddingVertical: 4,

      marginBottom: 12,
    },

    detailRow: {
      minHeight: 48,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
      marginRight: 12,
    },

    detailValue: {
      flex: 1,

      textAlign: "right",

      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    divider: {
      height: 1,
      backgroundColor: colors.border,
    },

    // ========================================================
    // CONTACT
    // ========================================================

    contactRow: {
      flexDirection: "row",
      gap: 10,

      marginBottom: 12,
    },

    contactButton: {
      flex: 1,

      height: 42,

      borderRadius: 11,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",

      flexDirection: "row",
      gap: 7,
    },

    contactIcon: {
      fontSize: 15,
    },

    contactText: {
      fontSize: 12,
      fontWeight: "700",
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

      marginTop: 2,
    },

    cancelButton: {
      flex: 1,

      height: 48,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,

      borderColor: colors.danger,

      backgroundColor: colors.dangerBg,
    },

    cancelText: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.danger,
    },

    bookButton: {
      flex: 1,

      height: 48,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.primaryGreen,

      position: "relative",
      zIndex: 20,

      elevation: 20,

      cursor: "pointer",
    },

    bookButtonPressed: {
      opacity: 0.75,
    },

    bookButtonDisabled: {
      opacity: 0.55,
    },

    bookText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#FFFFFF",
    },
  });
