import React from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";
import DesktopLayout from "../components/DesktopLayout";

import SeatGrid from "./SeatGrid";
import SeatHoldAlertItem from "./SeatHoldAlertItem";
import AlertItem from "./AlertItem";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function DesktopDashboard({
  navigation,

  stats,
  seats,

  combinedAlerts,
  visibleAlerts,
  showAllAlerts,
  setShowAllAlerts,

  refreshing,
  onRefresh,

  canManageSeats,

  onVacantPress,
  onOccupiedPress,
  onHeldPress,

  onAlertStudentPress,

  onActiveHoldPress,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;
  const { height } = useWindowDimensions();

  const styles = createStyles(colors);
  const desktopScrollbarStyle = {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
  };

  return (
    <DesktopLayout
      activeRoute="Dashboard"
      title="Dashboard"
      subtitle="Overview of your library"
      headerRight={
        <View style={styles.headerStatus}>
          <View
            style={[
              styles.onlineDot,
              {
                backgroundColor: colors.primaryGreen,
              },
            ]}
          />
        </View>
      }
    >
      {/* ============================================================
          MAIN AREA
          ============================================================ */}

      <View style={styles.mainArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primaryBlue}
            />
          }
        >
          {/* ========================================================
              STAT CARDS
              ======================================================== */}

          <View style={styles.statGrid}>
            <DesktopStatCard
              title="Total Seats"
              value={stats.totalSeats}
              subtitle="Library capacity"
              icon="chair"
              iconBackground={colors.statPurpleBg}
              iconColor={colors.statPurple}
              colors={colors}
              onPress={() => navigation.navigate("Students")}
            />

            <DesktopStatCard
              title="Seats Filled"
              value={stats.filledSeats}
              subtitle="Full day active"
              icon="user"
              iconBackground={colors.statOrangeBg}
              iconColor={colors.statOrange}
              colors={colors}
              onPress={() => navigation.navigate("Students")}
            />

            <DesktopStatCard
              title="Seats Vacant"
              value={stats.vacantSeats}
              subtitle="Available now"
              icon="check"
              iconBackground={colors.statGreenBg}
              iconColor={colors.statGreen}
              colors={colors}
              onPress={() => navigation.navigate("Students")}
            />

            <DesktopStatCard
              title="Half Day Students"
              value={stats.halfDayStudents}
              subtitle="Morning / Evening"
              icon="clock"
              iconBackground={colors.statBlueBg}
              iconColor={colors.statBlue}
              colors={colors}
              onPress={() => navigation.navigate("HalfDayStudents")}
            />
          </View>

          {/* ========================================================
              MAIN DASHBOARD GRID
              ======================================================== */}

          <View style={styles.dashboardGrid}>
            {/* ======================================================
                LEFT - SEAT LAYOUT
                ====================================================== */}

            <View
              style={[
                styles.panel,
                styles.seatPanel,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.panelHeader}>
                <View>
                  <Text
                    style={[
                      styles.panelTitle,
                      {
                        color: colors.textPrimary,
                      },
                    ]}
                  >
                    Seat Layout
                  </Text>

                  <Text
                    style={[
                      styles.panelSubtitle,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Manage library seating
                  </Text>
                </View>

                <View
                  style={[
                    styles.seatCountBadge,
                    {
                      backgroundColor: colors.bg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.seatCountText,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    {stats.totalSeats} Seats
                  </Text>
                </View>
              </View>

              {/* LEGEND */}

              <View style={styles.legend}>
                <LegendItem
                  color={colors.textFaint}
                  label="Booked"
                  colors={colors}
                />

                <LegendItem
                  color={colors.primaryGreen}
                  label="Vacant"
                  colors={colors}
                />

                <LegendItem
                  color={colors.warning}
                  label="Held"
                  colors={colors}
                />
              </View>

              {/* SEAT GRID */}

              <View
                style={[
                  styles.seatGridContainer,
                  {
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <SeatGrid
                  seats={seats}
                  onVacantPress={onVacantPress}
                  onOccupiedPress={onOccupiedPress}
                  onHeldPress={onHeldPress}
                />
              </View>
            </View>

            {/* ======================================================
                RIGHT - ALERTS
                ====================================================== */}

            <View
              style={[
                styles.panel,
                styles.alertPanel,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.panelHeader}>
                <View>
                  <Text
                    style={[
                      styles.panelTitle,
                      {
                        color: colors.textPrimary,
                      },
                    ]}
                  >
                    Subscription Alerts
                  </Text>

                  <Text
                    style={[
                      styles.panelSubtitle,
                      {
                        color: colors.textSecondary,
                      },
                    ]}
                  >
                    Pending actions
                  </Text>
                </View>

                {combinedAlerts.length > 0 && (
                  <View
                    style={[
                      styles.alertCountBadge,
                      {
                        backgroundColor: colors.dangerBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.alertCountText,
                        {
                          color: colors.danger,
                        },
                      ]}
                    >
                      {combinedAlerts.length}
                    </Text>
                  </View>
                )}
              </View>

              {/* ALERT LIST */}

              {visibleAlerts.length === 0 ? (
                <View style={styles.emptyAlerts}>
                  {/* existing empty alert content */}
                </View>
              ) : (
                <ScrollView
                  style={[
                    styles.alertList,
                    {
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    },
                  ]}
                  contentContainerStyle={styles.alertListContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                >
                  {visibleAlerts.map((item) => {
                    const key =
                      item.alertType === "SEAT_HOLD_ACTIVE"
                        ? `active-hold-${item.id}`
                        : item.alertType === "SEAT_HOLD_EXPIRED"
                        ? `expired-hold-${item.id}`
                        : `student-${
                            item.id ?? `${item.seatNumber}-${item.phone}`
                          }`;

                    return (
                      <View key={key} style={styles.alertItemWrapper}>
                        {item.alertType === "SEAT_HOLD_ACTIVE" ? (
                          <SeatHoldAlertItem
                            alert={item}
                            onPress={() => onActiveHoldPress(item)}
                          />
                        ) : item.alertType === "SEAT_HOLD_EXPIRED" ? (
                          <SeatHoldAlertItem alert={item} onPress={() => {}} />
                        ) : (
                          <AlertItem
                            student={item}
                            onPress={() => onAlertStudentPress(item)}
                          />
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* VIEW ALL */}

              {combinedAlerts.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.75}
                  onPress={() => setShowAllAlerts(!showAllAlerts)}
                >
                  <Text
                    style={[
                      styles.viewAllText,
                      {
                        color: colors.primaryBlue,
                      },
                    ]}
                  >
                    {showAllAlerts
                      ? "Show Less"
                      : `View All Alerts (${combinedAlerts.length})`}
                  </Text>

                  <FontAwesome6
                    name={showAllAlerts ? "chevron-up" : "chevron-down"}
                    size={11}
                    color={colors.primaryBlue}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ========================================================
              QUICK ACTIONS
              ======================================================== */}

          <View style={styles.quickSection}>
            <Text
              style={[
                styles.quickTitle,
                {
                  color: colors.textPrimary,
                },
              ]}
            >
              Quick Access
            </Text>

            <View style={styles.quickGrid}>
              <QuickAction
                icon="users"
                title="Students"
                subtitle="Manage students"
                color={colors.primaryBlue}
                background={colors.statBlueBg}
                colors={colors}
                onPress={() => navigation.navigate("Students")}
              />

              <QuickAction
                icon="file-invoice-dollar"
                title="Billing"
                subtitle="View collections"
                color={colors.statGreen}
                background={colors.statGreenBg}
                colors={colors}
                onPress={() => navigation.navigate("Billing")}
              />

              <QuickAction
                icon="clock"
                title="Half Day"
                subtitle="Morning / evening"
                color={colors.statOrange}
                background={colors.statOrangeBg}
                colors={colors}
                onPress={() => navigation.navigate("HalfDayStudents")}
              />

              <QuickAction
                icon="user-gear"
                title="Profile"
                subtitle="Account & staff"
                color={colors.statPurple}
                background={colors.statPurpleBg}
                colors={colors}
                onPress={() => navigation.navigate("Profile")}
              />
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    </DesktopLayout>
  );
}

/* ================================================================
   STAT CARD
   ================================================================ */

function DesktopStatCard({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor,
  colors,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={[
        stylesHelper.statCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={stylesHelper.statCardLeft}>
        <Text
          style={[
            stylesHelper.statTitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            stylesHelper.statValue,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          {value}
        </Text>

        <Text
          style={[
            stylesHelper.statSubtitle,
            {
              color: colors.textMuted,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          stylesHelper.statIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <FontAwesome6 name={icon} size={19} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
}

/* ================================================================
   LEGEND
   ================================================================ */

function LegendItem({ color, label, colors }) {
  return (
    <View style={stylesHelper.legendItem}>
      <View
        style={[
          stylesHelper.legendDot,
          {
            backgroundColor: color,
          },
        ]}
      />

      <Text
        style={[
          stylesHelper.legendText,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ================================================================
   QUICK ACTION
   ================================================================ */

function QuickAction({
  icon,
  title,
  subtitle,
  color,
  background,
  colors,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        stylesHelper.quickAction,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          stylesHelper.quickIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <FontAwesome6 name={icon} size={17} color={color} />
      </View>

      <View style={stylesHelper.quickText}>
        <Text
          style={[
            stylesHelper.quickActionTitle,
            {
              color: colors.textPrimary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            stylesHelper.quickActionSubtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <FontAwesome6 name="chevron-right" size={11} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

/* ================================================================
   MAIN STYLES
   ================================================================ */

function createStyles(colors, height) {
  return StyleSheet.create({
    page: {
      flex: 1,
      flexDirection: "row",
      minHeight: 0,
    },

    mainArea: {
      flex: 1,
      minWidth: 0,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 28,
      paddingTop: 26,
      paddingBottom: 40,
      maxWidth: 1700,
      width: "100%",
      alignSelf: "center",
    },

    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },

    pageTitle: {
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
    },

    pageSubtitle: {
      fontSize: 13,
      marginTop: 4,
    },

    headerStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    onlineText: {
      fontSize: 12,
      fontWeight: "600",
    },

    statGrid: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 20,
    },

    dashboardGrid: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 20,
    },

    panel: {
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 14,
      shadowOffset: {
        width: 0,
        height: 5,
      },

      elevation: 2,
    },

    seatPanel: {
      flex: 1,
      minWidth: 0,
    },

    alertPanel: {
      width: 390,
      flexShrink: 0,
      minHeight: 0,
      overflow: "hidden",
    },

    alertList: {
      width: "100%",
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    },

    alertListContent: {
      paddingBottom: 10,
    },

    alertItemWrapper: {
      width: "100%",
      marginBottom: 8,
    },

    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    panelTitle: {
      fontSize: 17,
      fontWeight: "800",
    },

    panelSubtitle: {
      fontSize: 12,
      marginTop: 3,
    },

    seatCountBadge: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 999,
    },

    seatCountText: {
      fontSize: 11,
      fontWeight: "700",
    },

    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      marginBottom: 14,
    },

    seatGridContainer: {
      borderWidth: 1,
      borderRadius: 15,

      // Let the container size itself based on the seats
      paddingVertical: 20,
      paddingHorizontal: 20,

      alignItems: "center",
      alignSelf: "stretch",

      overflow: "hidden",
    },

    alertCountBadge: {
      minWidth: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
    },

    alertCountText: {
      fontSize: 12,
      fontWeight: "800",
    },

    alertList: {
      width: "100%",
      height: 520,
      minHeight: 0,
      overflowY: "auto",
      overflowX: "hidden",
      scrollbarWidth: "thin",
    },

    alertListContent: {
      paddingBottom: 10,
    },

    alertItemWrapper: {
      width: "100%",
      marginBottom: 8,
    },

    emptyAlerts: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 20,
    },

    emptyIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
    },

    emptySubtitle: {
      fontSize: 12,
      marginTop: 4,
      textAlign: "center",
    },

    viewAllButton: {
      marginTop: 5,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    viewAllText: {
      fontSize: 12,
      fontWeight: "700",
    },

    quickSection: {
      marginTop: 22,
    },

    quickTitle: {
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 12,
    },

    quickGrid: {
      flexDirection: "row",
      gap: 14,
    },

    bottomSpace: {
      height: 20,
    },
  });
}

/* ================================================================
   SIDEBAR STYLES
   ================================================================ */

const sidebarStyles = StyleSheet.create({
  container: {
    width: 225,
    flexShrink: 0,
    borderRightWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 14,
  },

  navigation: {
    gap: 5,
  },

  item: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
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
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "600",
  },

  bottom: {
    marginTop: "auto",
    paddingTop: 14,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
  },

  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  helpTitle: {
    fontSize: 11,
    fontWeight: "700",
  },

  helpSubtitle: {
    fontSize: 9,
    marginTop: 2,
  },
});

/* ================================================================
   SMALL COMPONENT STYLES
   ================================================================ */

const stylesHelper = StyleSheet.create({
  statCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 122,
    borderRadius: 16,
    borderWidth: 1,
    padding: 17,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 1,
  },

  statCardLeft: {
    flex: 1,
    minWidth: 0,
  },

  statTitle: {
    fontSize: 12,
    fontWeight: "600",
  },

  statValue: {
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },

  statSubtitle: {
    fontSize: 10,
    marginTop: 4,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  legendText: {
    fontSize: 11,
    fontWeight: "600",
  },

  quickAction: {
    flex: 1,
    minHeight: 68,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  quickText: {
    flex: 1,
    marginLeft: 10,
  },

  quickActionTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  quickActionSubtitle: {
    fontSize: 10,
    marginTop: 3,
  },
});
