import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FontAwesome6 } from "@expo/vector-icons";

import HomeStack from "./HomeStack";
import BillingScreen from "../screens/BillingScreen";
import StudentsScreen from "../screens/StudentsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import HalfDayStudentsScreen from "../screens/HalfDayStudentsScreen";

import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors } from "../theme/colors";
import { Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { isLocked: isSubscriptionLocked } = useSubscription();
  const {
    userType,
    role,
    libraryId,
    canViewDashboard,
    canViewStudents,
    canManageBilling,
  } = useAuth();

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

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
      initialRouteName={isSubscriptionLocked ? "Profile" : undefined}
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarLabelPosition: "below-icon",

        tabBarActiveTintColor: colors.primaryBlue,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: isDesktopWeb
          ? {
              display: "none",
            }
          : {
              height: 58 + insets.bottom,

              paddingTop: 4,
              paddingBottom: Math.max(insets.bottom, 6),

              backgroundColor: colors.card,

              borderTopColor: colors.border,
              borderTopWidth: 1,

              elevation: 8,

              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: {
                width: 0,
                height: -2,
              },
            },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 0,
          paddingBottom: 1,
        },

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
              size={17}
              color={color}
            />
          );
        },
      })}
    >
      {/* =====================================================
          HOME / DASHBOARD
      ===================================================== */}

      {!isSubscriptionLocked && canViewDashboard && (
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

      {!isSubscriptionLocked && canManageBilling && (
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

      {!isSubscriptionLocked && canViewStudents && (
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

      {!isSubscriptionLocked && <Tab.Screen
        name="HalfDayStudents"
        component={HalfDayStudentsScreen}
        options={{
          title: "Half Day",

          // Hide Half Day from mobile bottom navigation.
          // Keep the route available for DesktopLayout.
          tabBarButton: isDesktopWeb ? undefined : () => null,
        }}
      />}

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
