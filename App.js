import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import RootNavigator from "./src/navigation/RootNavigator";

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  const { isDarkMode } = useTheme();

  return (
    <>
      <StatusBar
        style={isDarkMode ? "light" : "dark"}
        backgroundColor={isDarkMode ? "#0F172A" : "#FFFFFF"}
      />

      <RootNavigator />
    </>
  );
}

// ============================================================
// APP
// ============================================================

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
