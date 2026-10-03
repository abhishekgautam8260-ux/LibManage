import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome6 } from "@expo/vector-icons";

import HomeStack from "./HomeStack";
import BillingScreen from "../screens/BillingScreen";
import StudentsScreen from "../screens/StudentsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HalfDayStudentsScreen from "../screens/HalfDayStudentsScreen";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";
import { Platform, useWindowDimensions } from "react-native";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const {
    userType,
    role,
    libraryId,
    canViewDashboard,
    canViewStudents,
    canManageBilling,
  } = useAuth();

  const { width } = useWindowDimensions();

  const isDesktopWeb = Platform.OS === "web" && width >= 1000;

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  console.log("🔐 MAIN TABS AUTH:", {
    userType,
    role,
    libraryId,
    canViewDashboard,
    canViewStudents,
    canManageBilling,
  });

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // =====================================================
        // HEADER
        // =====================================================

        headerShown: false,

        // =====================================================
        // TAB COLORS
        // =====================================================

        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textMuted,

        // =====================================================
        // TAB BAR
        // =====================================================

        tabBarStyle: isDesktopWeb
          ? {
              display: "none",
            }
          : {
              height: 64,
              paddingBottom: 8,
              paddingTop: 6,
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopWidth: 1,
            },

        // =====================================================
        // TAB LABEL
        // =====================================================

        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "600",
        },

        // =====================================================
        // TAB ICON
        // =====================================================

        tabBarIcon: ({ color }) => {
          const icons = {
            Home: "house",
            Billing: "wallet",
            Students: "user-graduate",
            HalfDayStudents: "clock",
            Profile: "user",
          };

          return (
            <FontAwesome6
              name={icons[route.name] || "circle"}
              size={18}
              color={color}
            />
          );
        },
      })}
    >
      {/* =====================================================
          HOME / DASHBOARD
      ===================================================== */}

      {canViewDashboard && (
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            title: "Home",
          }}
        />
      )}

      {/* =====================================================
          BILLING
      ===================================================== */}

      {canManageBilling && (
        <Tab.Screen
          name="Billing"
          component={BillingScreen}
          options={{
            title: "Billing",
          }}
        />
      )}

      {/* =====================================================
          STUDENTS
      ===================================================== */}

      {canViewStudents && (
        <Tab.Screen
          name="Students"
          component={StudentsScreen}
          options={{
            title: "Students",
          }}
        />
      )}

      {/* =====================================================
          HALF DAY STUDENTS
      ===================================================== */}

      <Tab.Screen
        name="HalfDayStudents"
        component={HalfDayStudentsScreen}
        options={{
          title: "Half Day",
        }}
      />

      {/* =====================================================
          PROFILE
      ===================================================== */}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
    </Tab.Navigator>
  );
}
