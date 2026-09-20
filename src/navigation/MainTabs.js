import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome6 } from "@expo/vector-icons";

import HomeStack from "./HomeStack";
import BillingScreen from "../screens/BillingScreen";
import StudentsScreen from "../screens/StudentsScreen";
import ProfileScreen from "../screens/ProfileScreen";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";

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

        tabBarInactiveTintColor: colors.textSecondary,

        // =====================================================
        // TAB BAR
        // =====================================================

        tabBarStyle: {
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
            Profile: "user",
          };

          return (
            <FontAwesome6 name={icons[route.name]} size={18} color={color} />
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
          
          ADMIN
          MANAGER
          ACCOUNTANT
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
          PROFILE
          
          All authenticated users
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
