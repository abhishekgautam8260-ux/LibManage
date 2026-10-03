import React, { useEffect } from "react";

import { View, Text, StyleSheet, useWindowDimensions } from "react-native";

import { useNavigation } from "@react-navigation/native";

import Header from "./Header";

import { lightColors, darkColors } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

// ============================================================
// DESKTOP LAYOUT
// ============================================================
//
// This is the COMMON DESKTOP SHELL for:
//
// Dashboard
// Students
// Billing
// Half Day Students
// Profile
//
// The GLOBAL HEADER comes from the existing Header.js component.
// We do NOT recreate the header here.
//
// Each screen only provides:
//
// <DesktopLayout>
//    screen-specific content
// </DesktopLayout>
//
// ============================================================

export default function DesktopLayout({
  activeRoute,
  title,
  subtitle,
  headerRight = null,
  children,
}) {
  const navigation = useNavigation();

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const { width } = useWindowDimensions();

  const isDesktop = width >= 1000;

  // ============================================================
  // HIDE MOBILE TAB BAR ON DESKTOP
  // ============================================================

  useEffect(() => {
    const parent = navigation.getParent?.();

    if (!parent) {
      return;
    }

    if (isDesktop) {
      try {
        parent.setOptions({
          tabBarStyle: {
            display: "none",
          },
        });
      } catch (error) {
        console.log("Unable to hide desktop tab bar:", error);
      }
    }

    return () => {
      if (!isDesktop) {
        return;
      }

      try {
        parent.setOptions({
          tabBarStyle: undefined,
        });
      } catch (error) {
        console.log("Unable to restore tab bar:", error);
      }
    };
  }, [navigation, isDesktop]);

  // ============================================================
  // NAVIGATION
  // ============================================================

  const navigate = (route) => {
    try {
      navigation.navigate(route);
      return;
    } catch (error) {
      console.log(`Current navigator could not navigate to ${route}.`);
    }

    try {
      const parent = navigation.getParent?.();

      if (parent) {
        parent.navigate(route);
        return;
      }
    } catch (error) {
      console.error(`Parent navigation failed for ${route}:`, error);
    }

    console.error(`Desktop navigation failed for ${route}`);
  };

  // ============================================================
  // LAYOUT
  // ============================================================

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      {/* ======================================================
          GLOBAL HEADER

          IMPORTANT:
          This is the EXACT SAME Header component already used
          by DashboardScreen.js.

          So whatever we change in Header.js will automatically
          reflect on Dashboard, Students, Billing, Half Day and
          Profile.
      ====================================================== */}

      <View style={styles.globalHeader}>
        <Header />
      </View>

      {/* ======================================================
          DESKTOP AREA
      ====================================================== */}

      <View style={styles.desktopArea}>
        {/* ====================================================
            SIDEBAR
        ==================================================== */}

        <DesktopSidebar
          activeRoute={activeRoute}
          colors={colors}
          onNavigate={navigate}
        />

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <View style={styles.main}>
          {/* ==================================================
              PAGE HEADER

              Example:

              Students
              Manage student records, seats and subscriptions
          ================================================== */}

          <View
            style={[
              styles.pageHeader,
              {
                backgroundColor: colors.bg,
              },
            ]}
          >
            <View style={styles.pageHeaderText}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.textPrimary,
                  },
                ]}
              >
                {title}
              </Text>

              {!!subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {subtitle}
                </Text>
              )}
            </View>

            {headerRight ? (
              <View style={styles.headerRight}>{headerRight}</View>
            ) : null}
          </View>

          {/* ==================================================
              SCREEN CONTENT

              This is the ONLY part that changes between:

              Dashboard
              Students
              Billing
              Half Day
              Profile
          ================================================== */}

          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// DESKTOP SIDEBAR
// ============================================================

function DesktopSidebar({ activeRoute, colors, onNavigate }) {
  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colors.card,
          borderRightColor: colors.border,
        },
      ]}
    >
      {/* ======================================================
          BRAND
      ====================================================== */}

      <View>
        {/* ====================================================
            NAVIGATION
        ==================================================== */}

        <View style={styles.navigation}>
          <SidebarItem
            icon="house"
            label="Dashboard"
            active={activeRoute === "Dashboard"}
            colors={colors}
            onPress={() => onNavigate("Home")}
          />

          <SidebarItem
            icon="users"
            label="Students"
            active={activeRoute === "Students"}
            colors={colors}
            onPress={() => onNavigate("Students")}
          />

          <SidebarItem
            icon="file-invoice-dollar"
            label="Billing"
            active={activeRoute === "Billing"}
            colors={colors}
            onPress={() => onNavigate("Billing")}
          />

          <SidebarItem
            icon="clock"
            label="Half Day Students"
            active={activeRoute === "HalfDayStudents"}
            colors={colors}
            onPress={() => onNavigate("HalfDayStudents")}
          />

          <SidebarItem
            icon="user"
            label="Profile"
            active={activeRoute === "Profile"}
            colors={colors}
            onPress={() => onNavigate("Profile")}
          />
        </View>
      </View>

      {/* ======================================================
          SIDEBAR FOOTER
      ====================================================== */}

      <View
        style={[
          styles.bottom,
          {
            borderTopColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.helpIcon,
            {
              backgroundColor: colors.bg,
            },
          ]}
        >
          <Text
            style={[
              styles.infoText,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            i
          </Text>
        </View>

        <View>
          <Text
            style={[
              styles.helpTitle,
              {
                color: colors.textPrimary,
              },
            ]}
          >
            LibManage
          </Text>

          <Text
            style={[
              styles.helpSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            Library dashboard
          </Text>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// SIDEBAR ITEM
// ============================================================

function SidebarItem({ icon, label, active = false, colors, onPress }) {
  const FontAwesome6 = require("@expo/vector-icons").FontAwesome6;

  return (
    <View>
      <SidebarTouchable
        icon={icon}
        label={label}
        active={active}
        colors={colors}
        onPress={onPress}
        FontAwesome6={FontAwesome6}
      />
    </View>
  );
}

// ============================================================
// SIDEBAR TOUCHABLE
// ============================================================

function SidebarTouchable({
  icon,
  label,
  active,
  colors,
  onPress,
  FontAwesome6,
}) {
  const { TouchableOpacity } = require("react-native");

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.item,
        active && {
          backgroundColor: colors.statBlueBg,
        },
      ]}
    >
      {/* Icon */}

      <View
        style={[
          styles.itemIcon,
          active && {
            backgroundColor: colors.primaryBlue,
          },
        ]}
      >
        <FontAwesome6
          name={icon}
          size={16}
          color={active ? "#FFFFFF" : colors.textSecondary}
        />
      </View>

      {/* Text */}

      <Text
        style={[
          styles.itemText,
          {
            color: active ? colors.primaryBlue : colors.textSecondary,
          },
          active && {
            fontWeight: "700",
          },
        ]}
      >
        {label}
      </Text>

      {/* Arrow */}

      {active && (
        <FontAwesome6
          name="chevron-right"
          size={9}
          color={colors.primaryBlue}
        />
      )}
    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // ROOT
  // ==========================================================

  root: {
    flex: 1,

    height: "100vh",
    minHeight: "100vh",

    overflow: "hidden",
  },

  // ==========================================================
  // GLOBAL HEADER
  // ==========================================================

  globalHeader: {
    width: "100%",

    flexShrink: 0,

    zIndex: 100,
  },

  // ==========================================================
  // DESKTOP AREA
  // ==========================================================

  desktopArea: {
    flex: 1,

    flexDirection: "row",

    minHeight: 0,
  },

  // ==========================================================
  // SIDEBAR
  // ==========================================================

  sidebar: {
    width: 225,

    flexShrink: 0,

    borderRightWidth: 1,

    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,

    justifyContent: "space-between",
  },

  // ==========================================================
  // BRAND
  // ==========================================================

  brand: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 7,

    marginBottom: 14,
  },

  logo: {
    width: 34,
    height: 34,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  logoText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "900",
  },

  brandText: {
    flex: 1,
  },

  appName: {
    fontSize: 14,

    fontWeight: "800",
  },

  appSubtitle: {
    fontSize: 8,

    marginTop: 1,
  },

  divider: {
    height: 1,

    marginHorizontal: 7,

    marginBottom: 14,
  },

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  navigation: {
    gap: 6,
  },

  item: {
    height: 46,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
  },

  itemIcon: {
    width: 32,
    height: 32,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",
  },

  itemText: {
    flex: 1,

    fontSize: 14,

    fontWeight: "600",
  },

  // ==========================================================
  // SIDEBAR FOOTER
  // ==========================================================

  bottom: {
    borderTopWidth: 1,

    paddingTop: 12,

    paddingHorizontal: 7,

    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  helpIcon: {
    width: 28,
    height: 28,

    borderRadius: 7,

    alignItems: "center",
    justifyContent: "center",
  },

  infoText: {
    fontSize: 15,

    fontWeight: "800",
  },

  helpTitle: {
    fontSize: 10,

    fontWeight: "700",
  },

  helpSubtitle: {
    fontSize: 7,

    marginTop: 1,
  },

  // ==========================================================
  // MAIN
  // ==========================================================

  main: {
    flex: 1,

    minWidth: 0,
    minHeight: 0,
  },

  // ==========================================================
  // PAGE HEADER
  // ==========================================================

  pageHeader: {
    minHeight: 72,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 20,
    paddingVertical: 12,

    flexShrink: 0,
  },

  pageHeaderText: {
    flex: 1,

    minWidth: 0,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 10,

    marginTop: 3,
  },

  headerRight: {
    flexDirection: "row",

    alignItems: "center",

    marginLeft: 15,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  body: {
    flex: 1,

    minHeight: 0,

    minWidth: 0,
  },
});
