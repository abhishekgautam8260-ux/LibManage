import React from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider } from "./src/context/AuthContext";
import { SubscriptionProvider } from "./src/context/SubscriptionContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

import RootNavigator from "./src/navigation/RootNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <AppContent />
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
