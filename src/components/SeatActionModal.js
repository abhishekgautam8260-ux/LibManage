import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";

export default function SeatActionModal({
  visible,
  seatNumber,
  onClose,
  onBook,
  onHold,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  // ============================================================
  // BOOK
  // ============================================================

  const handleBook = () => {
    onBook?.();
  };

  // ============================================================
  // HOLD
  // ============================================================

  const handleHold = () => {
    onHold?.();
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
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Seat {seatNumber}</Text>

              <Text style={styles.subtitle}>Available Seat</Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* SEAT BADGE */}

          <View style={styles.seatBadge}>
            <Text style={styles.seatBadgeNumber}>{seatNumber}</Text>

            <Text style={styles.seatBadgeLabel}>AVAILABLE</Text>
          </View>

          {/* ACTIONS */}

          <View style={styles.options}>
            {/* BOOK */}

            <TouchableOpacity
              activeOpacity={0.78}
              onPress={handleBook}
              style={styles.optionCard}
            >
              <View
                style={[styles.optionIconContainer, styles.bookIconContainer]}
              >
                <Text style={styles.optionIcon}>📚</Text>
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Book Seat</Text>

                <Text style={styles.optionSubtitle}>
                  Add student and payment details
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            {/* HOLD */}

            <TouchableOpacity
              activeOpacity={0.78}
              onPress={handleHold}
              style={styles.optionCard}
            >
              <View
                style={[styles.optionIconContainer, styles.holdIconContainer]}
              >
                <Text style={styles.optionIcon}>⏸</Text>
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Hold Seat</Text>

                <Text style={styles.optionSubtitle}>
                  Reserve temporarily for 1–2 days
                </Text>
              </View>

              <Text
                style={[
                  styles.arrow,
                  {
                    color: colors.warning,
                  },
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* CANCEL */}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    // ========================================================
    // OVERLAY
    // ========================================================

    overlay: {
      flex: 1,

      justifyContent: "center",
      alignItems: "center",
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor: "rgba(0, 0, 0, 0.55)",
    },

    // ========================================================
    // PANEL
    // ========================================================

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

    headerTextContainer: {
      flex: 1,
    },

    title: {
      fontSize: 22,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    subtitle: {
      marginTop: 4,

      fontSize: 13,

      color: colors.primaryGreen,

      fontWeight: "600",
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
    // SEAT BADGE
    // ========================================================

    seatBadge: {
      alignSelf: "center",

      width: 76,
      height: 76,

      borderRadius: 20,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.successBg,

      borderWidth: 1.5,

      borderColor: colors.primaryGreen,

      marginBottom: 20,
    },

    seatBadgeNumber: {
      fontSize: 26,

      fontWeight: "900",

      color: colors.primaryGreen,
    },

    seatBadgeLabel: {
      fontSize: 7.5,

      fontWeight: "900",

      letterSpacing: 0.7,

      color: colors.primaryGreen,

      marginTop: 2,
    },

    // ========================================================
    // OPTIONS
    // ========================================================

    options: {
      gap: 12,
    },

    optionCard: {
      minHeight: 76,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 14,
      paddingVertical: 12,

      borderRadius: 15,

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    optionIconContainer: {
      width: 48,
      height: 48,

      borderRadius: 14,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 13,
    },

    bookIconContainer: {
      backgroundColor: colors.statBlueBg,
    },

    holdIconContainer: {
      backgroundColor: colors.warningBg,
    },

    optionIcon: {
      fontSize: 21,
    },

    optionContent: {
      flex: 1,
    },

    optionTitle: {
      fontSize: 15,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    optionSubtitle: {
      fontSize: 11.5,

      lineHeight: 16,

      marginTop: 3,

      color: colors.textSecondary,
    },

    arrow: {
      fontSize: 28,

      lineHeight: 30,

      color: colors.primaryBlue,

      marginLeft: 8,
    },

    // ========================================================
    // CANCEL
    // ========================================================

    cancelButton: {
      height: 46,

      alignItems: "center",
      justifyContent: "center",

      marginTop: 14,

      borderRadius: 12,

      backgroundColor: colors.borderLight,
    },

    cancelText: {
      fontSize: 14,

      fontWeight: "700",

      color: colors.textSecondary,
    },
  });
