import React, { createContext, useContext, useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

// ============================================================
// THEME CONTEXT
// ============================================================

const ThemeContext = createContext(null);

const THEME_KEY = "APP_THEME";

// ============================================================
// THEME PROVIDER
// ============================================================

export function ThemeProvider({ children }) {
  const systemTheme = Appearance.getColorScheme();

  const [isDarkMode, setIsDarkMode] = useState(systemTheme === "dark");

  const [themeLoading, setThemeLoading] = useState(true);

  // ==========================================================
  // LOAD SAVED THEME
  // ==========================================================

  useEffect(() => {
    loadTheme();
  }, []);

  // ==========================================================
  // LOAD THEME
  // ==========================================================

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_KEY);

      // ------------------------------------------------------
      // USER HAS SAVED DARK MODE
      // ------------------------------------------------------

      if (storedTheme === "dark") {
        setIsDarkMode(true);
      }

      // ------------------------------------------------------
      // USER HAS SAVED LIGHT MODE
      // ------------------------------------------------------
      else if (storedTheme === "light") {
        setIsDarkMode(false);
      }

      // ------------------------------------------------------
      // NO SAVED PREFERENCE
      // USE DEVICE THEME
      // ------------------------------------------------------
      else {
        setIsDarkMode(Appearance.getColorScheme() === "dark");
      }
    } catch (error) {
      console.log("❌ Failed to load theme:", error);
    } finally {
      setThemeLoading(false);
    }
  };

  // ==========================================================
  // TOGGLE DARK MODE
  // ==========================================================

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;

      // Update UI immediately
      setIsDarkMode(newValue);

      // Persist preference
      await AsyncStorage.setItem(THEME_KEY, newValue ? "dark" : "light");
    } catch (error) {
      console.log("❌ Failed to save theme:", error);
    }
  };

  // ==========================================================
  // SET DARK MODE
  // ==========================================================

  const setDarkMode = async (value) => {
    try {
      const newValue = Boolean(value);

      // Update UI
      setIsDarkMode(newValue);

      // Persist preference
      await AsyncStorage.setItem(THEME_KEY, newValue ? "dark" : "light");
    } catch (error) {
      console.log("❌ Failed to save theme:", error);
    }
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        themeLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================
// USE THEME
// ============================================================

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
