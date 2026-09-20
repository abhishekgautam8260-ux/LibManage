import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, radius, spacing } from "../theme/colors";

// ============================================================
// PRIMARY BUTTON
// ============================================================

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  variant = "primary",
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  const isOutline = variant === "outline";
  const isLight = variant === "light";
  const isDanger = variant === "danger";

  const buttonDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={buttonDisabled}
      style={[
        styles.base,

        isOutline && styles.outline,
        isLight && styles.light,
        isDanger && styles.danger,

        buttonDisabled && styles.disabled,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? colors.primaryBlue : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.text,

            isOutline && {
              color: colors.primaryBlue,
            },

            isLight && {
              color: colors.primaryBlue,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ============================================================
// DYNAMIC STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // BASE
    // ========================================================

    base: {
      minHeight: 46,

      paddingHorizontal: spacing.md,

      borderRadius: radius.sm,

      backgroundColor: colors.gradientStart,

      alignItems: "center",
      justifyContent: "center",

      flexDirection: "row",
    },

    // ========================================================
    // OUTLINE
    // ========================================================

    outline: {
      backgroundColor: "transparent",

      borderWidth: 1,
      borderColor: colors.primaryBlue,
    },

    // ========================================================
    // LIGHT
    // ========================================================

    light: {
      backgroundColor: isDarkModeSafe(colors),
    },

    // ========================================================
    // DANGER
    // ========================================================

    danger: {
      backgroundColor: colors.danger,
    },

    // ========================================================
    // DISABLED
    // ========================================================

    disabled: {
      opacity: 0.55,
    },

    // ========================================================
    // TEXT
    // ========================================================

    text: {
      color: "#FFFFFF",

      fontSize: 15,
      fontWeight: "600",

      textAlign: "center",
    },
  });
}

// ============================================================
// LIGHT BUTTON BACKGROUND
// ============================================================

function isDarkModeSafe(colors) {
  // Keep the light variant visible in both themes.
  // In dark mode we use a subtle blue surface.
  if (colors.card === darkColors.card) {
    return "#1E3A5F";
  }

  return "#E8F4FF";
}
