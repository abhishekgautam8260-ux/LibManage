import React from "react";
import { TextInput, StyleSheet } from "react-native";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, radius } from "../theme/colors";

// ============================================================
// APP INPUT
// ============================================================

export default function AppInput(props) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  const { style, placeholderTextColor, ...restProps } = props;

  return (
    <TextInput
      {...restProps}
      placeholderTextColor={placeholderTextColor || colors.textMuted}
      style={[styles.input, style]}
    />
  );
}

// ============================================================
// DYNAMIC STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    input: {
      width: "100%",

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: radius.sm,

      paddingHorizontal: 12,
      paddingVertical: 12,

      marginBottom: 12,

      fontSize: 14,

      color: colors.textPrimary,

      backgroundColor: colors.card,
    },
  });
}
