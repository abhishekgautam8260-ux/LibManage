import React, { useCallback, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome6 } from "@expo/vector-icons";
import Svg, { G, Circle } from "react-native-svg";

import Header from "../components/Header";
import ExpenseModal from "../components/ExpenseModal";

import { useAuth } from "../context/AuthContext";

import {
  getBillingSummary,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../api/billing";

import { lightColors, darkColors, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

// ============================================================
// CATEGORY INFORMATION
// ============================================================

const CATEGORY_INFO = {
  electricity: {
    icon: "bolt",
    emoji: "⚡",
    color: "#f59e0b",
    bg: "#fff7e6",
  },

  water: {
    icon: "droplet",
    emoji: "💧",
    color: "#3b82f6",
    bg: "#eff6ff",
  },

  employee: {
    icon: "user-tie",
    emoji: "👨‍💼",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },

  wifi: {
    icon: "wifi",
    emoji: "📶",
    color: "#06b6d4",
    bg: "#ecfeff",
  },

  rent: {
    icon: "house",
    emoji: "🏠",
    color: "#ef4444",
    bg: "#fef2f2",
  },

  other: {
    icon: "receipt",
    emoji: "📦",
    color: "#64748b",
    bg: "#f8fafc",
  },
};

function getCategoryInfo(category = "", isDarkMode = false) {
  const key = String(category).toLowerCase();

  const info = CATEGORY_INFO[key] || CATEGORY_INFO.other;

  if (!isDarkMode) {
    return info;
  }

  const darkBackgrounds = {
    electricity: "#3d2e12",
    water: "#1e3a8a",
    employee: "#312e81",
    wifi: "#083344",
    rent: "#3f1d1d",
    other: "#273449",
  };

  return {
    ...info,
    bg: darkBackgrounds[key] || darkBackgrounds.other,
  };
}

// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

// ============================================================
// DATE FORMAT
// ============================================================

function formatDate(dateString) {
  if (!dateString) return "";

  const parts = String(dateString).split("-");

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(year, month - 1, day);

    return `${String(day).padStart(2, "0")} ${date.toLocaleString("en-IN", {
      month: "short",
    })} ${year}`;
  }

  return dateString;
}

// ============================================================
// MONTHS
// ============================================================

const MONTHS = Array.from({ length: 12 }, (_, index) => {
  const date = new Date(2000, index, 1);

  return {
    month: index + 1,

    label: date.toLocaleString("en-IN", {
      month: "long",
    }),

    short: date.toLocaleString("en-IN", {
      month: "short",
    }),
  };
});

// ============================================================
// YEARS
// ============================================================

function getAvailableYears() {
  const currentYear = new Date().getFullYear();

  return Array.from(
    {
      length: currentYear - 2000 + 1,
    },
    (_, index) => currentYear - index
  );
}

// ============================================================
// MAIN SCREEN
// ============================================================

export default function BillingScreen() {
  const { libraryId } = useAuth();

  const { isDarkMode } = useTheme();

  // ==========================================================
  // THEME
  // ==========================================================

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  // ==========================================================
  // DATE
  // ==========================================================

  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // ==========================================================
  // STATE
  // ==========================================================

  const [summary, setSummary] = useState(null);

  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [monthLoading, setMonthLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);

  // ==========================================================
  // CURRENT DATE
  // ==========================================================

  const currentDate = new Date();

  const currentYear = currentDate.getFullYear();

  const currentMonth = currentDate.getMonth() + 1;

  // ==========================================================
  // LOAD EXPENSES
  // ==========================================================

  const loadExpenses = useCallback(async () => {
    if (!libraryId) return;

    try {
      const data = await getExpenses(libraryId);

      setExpenses(data || []);
    } catch (error) {
      console.error("Expenses load failed:", error);

      throw error;
    }
  }, [libraryId]);

  // ==========================================================
  // LOAD MONTH SUMMARY
  // ==========================================================

  const loadSummary = useCallback(
    async (year, month, initial = false) => {
      if (!libraryId) return;

      try {
        if (initial) {
          setLoading(true);
        } else {
          setMonthLoading(true);
        }

        const data = await getBillingSummary(libraryId, year, month);

        setSummary(data);
      } catch (error) {
        console.error("Billing summary failed:", error);

        Alert.alert(
          "Billing Error",
          error?.response?.data?.message ||
            error?.message ||
            "Unable to load billing information."
        );
      } finally {
        if (initial) {
          setLoading(false);
        } else {
          setMonthLoading(false);
        }
      }
    },
    [libraryId]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  const load = useCallback(async () => {
    if (!libraryId) return;

    try {
      setLoading(true);

      const now = new Date();

      const year = now.getFullYear();

      const month = now.getMonth() + 1;

      setSelectedYear(year);

      setSelectedMonth(month);

      const [summaryData, expenseData] = await Promise.all([
        getBillingSummary(libraryId, year, month),

        getExpenses(libraryId),
      ]);

      setSummary(summaryData);

      setExpenses(expenseData || []);
    } catch (error) {
      console.error("Billing load failed:", error);

      Alert.alert(
        "Billing Error",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  }, [libraryId]);

  // ==========================================================
  // SCREEN FOCUS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ==========================================================
  // CHANGE MONTH
  // ==========================================================

  const changeMonth = async (month) => {
    if (selectedYear === currentYear && month > currentMonth) {
      return;
    }

    setSelectedMonth(month);

    setMonthPickerVisible(false);

    await loadSummary(selectedYear, month);
  };

  // ==========================================================
  // CHANGE YEAR
  // ==========================================================

  const changeYear = async (year) => {
    if (year > currentYear || year < 2000) {
      return;
    }

    let month = selectedMonth;

    if (year === currentYear && month > currentMonth) {
      month = currentMonth;
    }

    setSelectedYear(year);

    setSelectedMonth(month);

    await loadSummary(year, month);
  };

  // ==========================================================
  // MONTH NAME
  // ==========================================================

  const selectedMonthName = MONTHS[selectedMonth - 1]?.label || "";

  // ==========================================================
  // SUMMARY VALUES
  // ==========================================================

  const monthlyRevenue = Number(summary?.monthlyRevenue || 0);

  const monthlyExpenses = Number(summary?.monthlyExpenses || 0);

  const monthlyProfit = Number(summary?.monthlyProfit || 0);

  const averageProfit = Number(summary?.averageMonthlyProfit || 0);

  // ==========================================================
  // MONTH EXPENSE LIST
  // ==========================================================

  const monthlyExpensesList = useMemo(() => {
    return expenses
      .filter((item) => {
        if (!item.expenseDate) {
          return false;
        }

        const [year, month] = String(item.expenseDate).split("-").map(Number);

        return year === selectedYear && month === selectedMonth;
      })
      .sort((a, b) =>
        String(b.expenseDate || "").localeCompare(String(a.expenseDate || ""))
      );
  }, [expenses, selectedYear, selectedMonth]);

  // ============================================================
  // CATEGORY + PROFIT BREAKDOWN
  // ============================================================

  const categoryBreakdown = useMemo(() => {
    const map = {};

    monthlyExpensesList.forEach((item) => {
      const key = String(item.category || "Other").toLowerCase();

      map[key] = (map[key] || 0) + Number(item.amount || 0);
    });

    const expenseItems = Object.entries(map)
      .map(([key, amount]) => ({
        key,
        type: "expense",
        amount,
        info: getCategoryInfo(key, isDarkMode),
      }))
      .sort((a, b) => b.amount - a.amount);

    if (monthlyProfit > 0) {
      expenseItems.push({
        key: "profit",

        type: "profit",

        amount: monthlyProfit,

        percentage:
          monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0,

        info: {
          icon: "chart-line",
          emoji: "📈",

          color: isDarkMode ? "#4ADE80" : "#10b981",

          bg: isDarkMode ? colors.successBg : "#ecfdf5",
        },
      });
    }

    return expenseItems.map((item) => ({
      ...item,

      percentage: monthlyRevenue > 0 ? (item.amount / monthlyRevenue) * 100 : 0,
    }));
  }, [
    monthlyExpensesList,
    monthlyRevenue,
    monthlyProfit,
    isDarkMode,
    colors.successBg,
  ]);

  // ============================================================
  // SAVE EXPENSE
  // ============================================================

  const handleSave = async (payload) => {
    if (!payload.amount || Number(payload.amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");

      return;
    }

    if (!payload.expenseDate) {
      Alert.alert("Invalid Date", "Please enter an expense date.");

      return;
    }

    setSaving(true);

    try {
      if (editing) {
        await updateExpense(editing.id, libraryId, payload);
      } else {
        await createExpense(libraryId, payload);
      }

      setModalVisible(false);

      setEditing(null);

      await loadExpenses();

      await loadSummary(selectedYear, selectedMonth);

      Alert.alert(
        editing ? "Expense Updated" : "Expense Added",

        editing
          ? "Expense has been updated successfully."
          : "Expense has been added successfully."
      );
    } catch (error) {
      console.error("Expense save failed:", error);

      Alert.alert(
        "Save Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to save expense."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE EXPENSE
  // ============================================================

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Expense?",

      "This expense will be permanently removed.",

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Delete",
          style: "destructive",

          onPress: async () => {
            try {
              await deleteExpense(id, libraryId);

              await loadExpenses();

              await loadSummary(selectedYear, selectedMonth);
            } catch (error) {
              console.error("Delete expense failed:", error);

              Alert.alert(
                "Delete Failed",
                error?.response?.data?.message ||
                  error?.message ||
                  "Unable to delete expense."
              );
            }
          },
        },
      ]
    );
  };

  // ============================================================
  // OPEN ADD EXPENSE
  // ============================================================

  const openAddExpense = () => {
    setEditing(null);

    setModalVisible(true);
  };

  // ============================================================
  // OPEN EDIT EXPENSE
  // ============================================================

  const openEditExpense = (item) => {
    setEditing(item);

    setModalVisible(true);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />

        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  // ============================================================
  // SCREEN
  // ============================================================

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
        },
      ]}
    >
      <Header title="Billing" />

      <FlatList
        data={monthlyExpensesList}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* ==================================================
                SUMMARY
            ================================================== */}

            <View style={styles.summaryGrid}>
              <SummaryCard
                label="Revenue"
                value={monthlyRevenue}
                icon="money-bill-wave"
                iconBg={isDarkMode ? colors.successBg : "#ecfdf5"}
                iconColor={isDarkMode ? "#4ADE80" : "#10b981"}
                styles={styles}
              />

              <SummaryCard
                label="Expenses"
                value={monthlyExpenses}
                icon="arrow-trend-down"
                iconBg={isDarkMode ? colors.dangerBg : "#fef2f2"}
                iconColor={isDarkMode ? "#F87171" : "#ef4444"}
                styles={styles}
              />

              <SummaryCard
                label="Net Profit"
                value={monthlyProfit}
                icon="chart-line"
                iconBg={isDarkMode ? colors.statBlueBg : "#eff6ff"}
                iconColor={
                  monthlyProfit >= 0 ? colors.primaryBlue : colors.danger
                }
                styles={styles}
              />

              <SummaryCard
                label="Avg. Profit"
                value={averageProfit}
                icon="chart-pie"
                iconBg={isDarkMode ? colors.statPurpleBg : "#f5f3ff"}
                iconColor={isDarkMode ? "#A78BFA" : "#8b5cf6"}
                styles={styles}
              />
            </View>

            {/* ==================================================
                FINANCIAL OVERVIEW
            ================================================== */}

            <FinancialOverview
              monthName={selectedMonthName}
              year={selectedYear}
              loading={monthLoading}
              breakdown={categoryBreakdown}
              totalExpenses={monthlyExpenses}
              revenue={monthlyRevenue}
              profit={monthlyProfit}
              onMonthPress={() => setMonthPickerVisible(true)}
              styles={styles}
              colors={colors}
              isDarkMode={isDarkMode}
            />

            {/* ==================================================
                EXPENSE HEADER
            ================================================== */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleArea}>
                <Text style={styles.sectionTitle}>Expenses</Text>

                <Text style={styles.sectionSubtitle}>
                  {monthlyExpensesList.length} transaction
                  {monthlyExpensesList.length === 1 ? "" : "s"} in{" "}
                  {selectedMonthName}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.addButton}
                onPress={openAddExpense}
              >
                <FontAwesome6 name="plus" size={11} color="#fff" />

                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={<EmptyExpenses styles={styles} colors={colors} />}
        renderItem={({ item, index }) => {
          const info = getCategoryInfo(item.category, isDarkMode);

          const isPaid = String(item.status || "PAID").toUpperCase() === "PAID";

          return (
            <View
              style={[
                styles.expenseCard,
                index === monthlyExpensesList.length - 1 &&
                  styles.expenseCardLast,
              ]}
            >
              {/* LEFT ICON */}

              <View
                style={[
                  styles.expenseIcon,
                  {
                    backgroundColor: info.bg,
                  },
                ]}
              >
                <FontAwesome6 name={info.icon} size={17} color={info.color} />
              </View>

              {/* MAIN DETAILS */}

              <View style={styles.expenseMain}>
                <View style={styles.expenseTopRow}>
                  <Text style={styles.expenseCategory} numberOfLines={1}>
                    {item.category || "Other"}
                  </Text>

                  <Text style={styles.expenseAmount}>
                    {formatMoney(item.amount)}
                  </Text>
                </View>

                <View style={styles.expenseMetaRow}>
                  <View style={styles.dateContainer}>
                    <FontAwesome6
                      name="calendar-days"
                      size={9}
                      color={colors.textFaint}
                    />

                    <Text style={styles.expenseDate}>
                      {formatDate(item.expenseDate)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isPaid ? styles.paidBadge : styles.pendingBadge,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        isPaid ? styles.paidDot : styles.pendingDot,
                      ]}
                    />

                    <Text
                      style={[
                        styles.statusText,
                        isPaid ? styles.paidText : styles.pendingText,
                      ]}
                    >
                      {isPaid ? "PAID" : "PENDING"}
                    </Text>
                  </View>
                </View>

                {!!item.comment && (
                  <View style={styles.commentRow}>
                    <FontAwesome6
                      name="message"
                      size={8}
                      color={colors.textFaint}
                    />

                    <Text style={styles.expenseComment} numberOfLines={1}>
                      {item.comment}
                    </Text>
                  </View>
                )}
              </View>

              {/* ACTIONS */}

              <View style={styles.actionColumn}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.editButton}
                  onPress={() => openEditExpense(item)}
                >
                  <FontAwesome6
                    name="pen"
                    size={10}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.editButton, styles.deleteButton]}
                  onPress={() => handleDelete(item.id)}
                >
                  <FontAwesome6 name="trash" size={10} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* ========================================================
          EXPENSE MODAL
      ======================================================== */}

      <ExpenseModal
        visible={modalVisible}
        initial={editing}
        loading={saving}
        onClose={() => {
          if (saving) return;

          setModalVisible(false);

          setEditing(null);
        }}
        onSave={handleSave}
      />

      {/* ========================================================
          MONTH / YEAR PICKER
      ======================================================== */}

      <BillingPeriodPicker
        visible={monthPickerVisible}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectMonth={changeMonth}
        onSelectYear={changeYear}
        onClose={() => setMonthPickerVisible(false)}
        styles={styles}
        colors={colors}
        isDarkMode={isDarkMode}
      />
    </View>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ label, value, icon, iconBg, iconColor, styles }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryCardTop}>
        <Text style={styles.summaryLabel}>{label}</Text>

        <View
          style={[
            styles.summaryIcon,
            {
              backgroundColor: iconBg,
            },
          ]}
        >
          <FontAwesome6 name={icon} size={13} color={iconColor} />
        </View>
      </View>

      <Text style={styles.summaryValue}>{formatMoney(value)}</Text>
    </View>
  );
}

// ============================================================
// FINANCIAL OVERVIEW
// ============================================================

function FinancialOverview({
  monthName,
  year,
  loading,
  breakdown,
  totalExpenses,
  revenue,
  profit,
  onMonthPress,
  styles,
  colors,
  isDarkMode,
}) {
  const chartData = breakdown;

  const chartTotal = profit >= 0 ? revenue : totalExpenses;

  const profitPercentage =
    revenue > 0 && profit > 0 ? (profit / revenue) * 100 : 0;

  const expensePercentage = revenue > 0 ? (totalExpenses / revenue) * 100 : 0;

  return (
    <View style={styles.overviewCard}>
      {/* ==================================================
          HEADER
      ================================================== */}

      <View style={styles.overviewHeader}>
        <View style={styles.overviewTitleArea}>
          <Text style={styles.chartTitle}>Expense vs Profit</Text>

          <Text style={styles.chartSubtitle}>Overall financial overview</Text>
        </View>

        <TouchableOpacity
          style={styles.periodSelector}
          onPress={onMonthPress}
          activeOpacity={0.8}
        >
          <View style={styles.calendarIconBox}>
            <FontAwesome6
              name="calendar-days"
              size={11}
              color={colors.primaryBlue}
            />
          </View>

          <View>
            <Text style={styles.periodSelectorText}>
              {monthName.slice(0, 3)} {year}
            </Text>

            <Text style={styles.periodSelectorHint}>Change period</Text>
          </View>

          <FontAwesome6
            name="chevron-down"
            size={9}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator size="small" color={colors.primaryBlue} />
        </View>
      ) : (
        <>
          {/* ==================================================
              CHART + LEGEND
          ================================================== */}

          <View style={styles.donutSection}>
            <DonutChart
              data={chartData}
              total={chartTotal}
              revenue={revenue}
              profit={profit}
              styles={styles}
              colors={colors}
              isDarkMode={isDarkMode}
            />

            <View style={styles.breakdownList}>
              {breakdown.length === 0 ? (
                <View style={styles.noBreakdownBox}>
                  <FontAwesome6
                    name="receipt"
                    size={15}
                    color={colors.textFaint}
                  />

                  <Text style={styles.noBreakdown}>
                    No financial data available for this month.
                  </Text>
                </View>
              ) : (
                breakdown.map((item) => {
                  const isProfit = item.type === "profit";

                  return (
                    <View key={item.key} style={styles.breakdownRow}>
                      {/* DOT */}

                      <View
                        style={[
                          styles.breakdownDot,
                          {
                            backgroundColor: item.info.color,
                          },
                        ]}
                      />

                      {/* NAME */}

                      <View style={styles.breakdownNameWrap}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {isProfit
                            ? "Profit"
                            : item.key.charAt(0).toUpperCase() +
                              item.key.slice(1)}
                        </Text>
                      </View>

                      {/* PERCENTAGE */}

                      <Text
                        style={[
                          styles.breakdownPercent,
                          isProfit && styles.profitPercent,
                        ]}
                      >
                        {Math.round(item.percentage)}%
                      </Text>

                      {/* AMOUNT */}

                      <Text
                        style={[
                          styles.breakdownAmount,
                          isProfit && styles.profitAmount,
                        ]}
                      >
                        {formatMoney(item.amount)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* ==================================================
              EXPENSE / PROFIT SUMMARY
          ================================================== */}

          <View style={styles.financeStrip}>
            {/* EXPENSE */}

            <View style={styles.financeItem}>
              <View style={styles.financeLabelRow}>
                <View
                  style={[
                    styles.financeMiniDot,
                    {
                      backgroundColor: isDarkMode ? "#F87171" : "#ef4444",
                    },
                  ]}
                />

                <Text style={styles.financeLabel}>Expenses</Text>
              </View>

              <Text style={styles.financeExpense}>
                {formatMoney(totalExpenses)}
              </Text>

              <Text style={styles.financePercentage}>
                {Math.round(expensePercentage)}% of revenue
              </Text>
            </View>

            {/* DIVIDER */}

            <View style={styles.financeDivider} />

            {/* PROFIT */}

            <View style={styles.financeItem}>
              <View style={styles.financeLabelRow}>
                <View
                  style={[
                    styles.financeMiniDot,
                    {
                      backgroundColor:
                        profit >= 0
                          ? isDarkMode
                            ? "#4ADE80"
                            : "#10b981"
                          : isDarkMode
                          ? "#F87171"
                          : "#ef4444",
                    },
                  ]}
                />

                <Text style={styles.financeLabel}>
                  {profit >= 0 ? "Profit" : "Loss"}
                </Text>
              </View>

              <Text
                style={profit >= 0 ? styles.financeProfit : styles.financeLoss}
              >
                {formatMoney(Math.abs(profit))}
              </Text>

              {profit >= 0 ? (
                <Text style={styles.financePercentage}>
                  {Math.round(profitPercentage)}% of revenue
                </Text>
              ) : (
                <Text style={styles.financeLossPercentage}>
                  Loss this month
                </Text>
              )}
            </View>
          </View>

          {/* ==================================================
              PROFIT MESSAGE
          ================================================== */}

          {profit > 0 && revenue > 0 && (
            <View style={styles.profitMessage}>
              <View style={styles.profitMessageIcon}>
                <FontAwesome6
                  name="arrow-trend-up"
                  size={11}
                  color={isDarkMode ? "#4ADE80" : "#059669"}
                />
              </View>

              <View style={styles.profitMessageTextWrap}>
                <Text style={styles.profitMessageTitle}>
                  {Math.round(profitPercentage)}% of your revenue is profit
                </Text>

                <Text style={styles.profitMessageSubtitle}>
                  Revenue minus expenses
                </Text>
              </View>

              <Text style={styles.profitMessageAmount}>
                {formatMoney(profit)}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ============================================================
// DONUT CHART
// ============================================================

function DonutChart({
  data,
  total,
  revenue,
  profit,
  styles,
  colors,
  isDarkMode,
}) {
  const size = 180;

  const strokeWidth = 28;

  const radiusValue = (size - strokeWidth) / 2;

  const circumference = 2 * Math.PI * radiusValue;

  // ==========================================================
  // EMPTY
  // ==========================================================

  if (!total || !data.length) {
    return (
      <View style={styles.donutEmpty}>
        <View style={styles.emptyDonutRing}>
          <FontAwesome6 name="chart-pie" size={16} color={colors.textFaint} />

          <Text style={styles.donutEmptyAmount}>₹0</Text>

          <Text style={styles.donutCenterLabel}>NO DATA</Text>
        </View>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* ==================================================
              BACKGROUND RING
          ================================================== */}

          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radiusValue}
            stroke={isDarkMode ? "#334155" : "#eef2f7"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* ==================================================
              SEGMENTS
          ================================================== */}

          {data.map((item) => {
            const length = (item.amount / total) * circumference;

            const currentOffset = offset;

            offset += length;

            return (
              <Circle
                key={item.key}
                cx={size / 2}
                cy={size / 2}
                r={radiusValue}
                stroke={item.info.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>

      {/* ==================================================
          CENTER
      ================================================== */}

      <View style={styles.donutCenter}>
        <View style={styles.donutCenterIcon}>
          <FontAwesome6
            name="chart-line"
            size={11}
            color={
              profit >= 0
                ? isDarkMode
                  ? "#4ADE80"
                  : "#10b981"
                : isDarkMode
                ? "#F87171"
                : "#ef4444"
            }
          />
        </View>

        <Text style={styles.donutCenterAmount}>
          {formatMoney(revenue || total)}
        </Text>

        <Text style={styles.donutCenterLabel}>TOTAL REVENUE</Text>
      </View>
    </View>
  );
}

// ============================================================
// EMPTY EXPENSES
// ============================================================

function EmptyExpenses({ styles, colors }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <FontAwesome6 name="receipt" size={21} color={colors.textFaint} />
      </View>

      <Text style={styles.emptyTitle}>No expenses this month</Text>

      <Text style={styles.emptySubtitle}>
        Your library expenses will appear here.
      </Text>
    </View>
  );
}

// ============================================================
// BILLING PERIOD PICKER
// ============================================================

function BillingPeriodPicker({
  visible,
  selectedMonth,
  selectedYear,
  currentYear,
  currentMonth,
  onSelectMonth,
  onSelectYear,
  onClose,
  styles,
  colors,
  isDarkMode,
}) {
  const years = useMemo(() => getAvailableYears(), []);

  const [yearMode, setYearMode] = useState(false);

  React.useEffect(() => {
    if (!visible) {
      setYearMode(false);
    }
  }, [visible]);

  const isMonthLocked = (month) => {
    return selectedYear === currentYear && month > currentMonth;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.periodOverlay}>
        {/* BACKDROP */}

        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* MODAL */}

        <View style={styles.periodModal}>
          {/* HEADER */}

          <View style={styles.periodModalHeader}>
            <View style={styles.periodHeaderLeft}>
              <View style={styles.periodHeaderIcon}>
                <FontAwesome6
                  name={yearMode ? "calendar" : "calendar-days"}
                  size={15}
                  color={colors.primaryBlue}
                />
              </View>

              <View>
                <Text style={styles.periodModalTitle}>
                  {yearMode ? "Select Year" : "Select Month"}
                </Text>

                <Text style={styles.periodModalSubtitle}>
                  {yearMode
                    ? "Choose billing year"
                    : `Billing period • ${selectedYear}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* YEAR / MONTH TABS */}

          <View style={styles.periodTabs}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.periodTab, !yearMode && styles.periodTabActive]}
              onPress={() => setYearMode(false)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  !yearMode && styles.periodTabTextActive,
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.periodTab, yearMode && styles.periodTabActive]}
              onPress={() => setYearMode(true)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  yearMode && styles.periodTabTextActive,
                ]}
              >
                Year
              </Text>
            </TouchableOpacity>
          </View>

          {/* ====================================================
              YEAR SELECTOR
          ==================================================== */}

          {yearMode ? (
            <ScrollView
              style={styles.yearScroll}
              contentContainerStyle={styles.yearGrid}
              showsVerticalScrollIndicator={false}
            >
              {years.map((year) => {
                const active = year === selectedYear;

                return (
                  <TouchableOpacity
                    key={year}
                    activeOpacity={0.8}
                    style={[styles.yearItem, active && styles.yearItemActive]}
                    onPress={async () => {
                      await onSelectYear(year);

                      setYearMode(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.yearItemText,
                        active && styles.yearItemTextActive,
                      ]}
                    >
                      {year}
                    </Text>

                    {active && (
                      <View style={styles.yearCheck}>
                        <FontAwesome6 name="check" size={8} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            // ==================================================
            // MONTH SELECTOR
            // ==================================================

            <View style={styles.monthGrid}>
              {MONTHS.map((item) => {
                const active = item.month === selectedMonth;

                const locked = isMonthLocked(item.month);

                return (
                  <TouchableOpacity
                    key={item.month}
                    disabled={locked}
                    activeOpacity={0.8}
                    style={[
                      styles.monthItem,

                      active && !locked && styles.monthItemActive,

                      locked && styles.monthItemLocked,
                    ]}
                    onPress={() => onSelectMonth(item.month)}
                  >
                    <Text
                      style={[
                        styles.monthItemText,

                        active && !locked && styles.monthItemTextActive,

                        locked && styles.monthItemTextLocked,
                      ]}
                    >
                      {item.short}
                    </Text>

                    {locked ? (
                      <FontAwesome6
                        name="lock"
                        size={8}
                        color={isDarkMode ? "#64748B" : "#cbd5e1"}
                      />
                    ) : active ? (
                      <View style={styles.monthCheck}>
                        <FontAwesome6
                          name="check"
                          size={8}
                          color={colors.primaryBlue}
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* FOOTER */}

          {!yearMode && (
            <View style={styles.periodFooter}>
              <FontAwesome6
                name="circle-info"
                size={10}
                color={colors.textFaint}
              />

              <Text style={styles.periodFooterText}>
                Future months are locked until their month begins.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    // ==========================================================
    // CONTAINER
    // ==========================================================

    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },

    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: colors.textSecondary,
    },

    listContent: {
      padding: spacing.md,
      paddingBottom: 50,
    },

    // ==========================================================
    // SUMMARY
    // ==========================================================

    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 11,
      marginBottom: 14,
    },

    summaryCard: {
      width: "48.2%",
      backgroundColor: colors.card,

      borderRadius: 18,

      padding: 15,

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,

      borderWidth: 1,
      borderColor: colors.border,
    },

    summaryCardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    summaryLabel: {
      fontSize: 12,
      fontWeight: "400",
      color: colors.textSecondary,
    },

    summaryIcon: {
      width: 29,
      height: 29,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    summaryValue: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 10,
    },

    // ==========================================================
    // OVERVIEW
    // ==========================================================

    overviewCard: {
      backgroundColor: colors.card,

      borderRadius: 20,

      padding: 16,

      marginBottom: 20,

      shadowColor: "#000",
      shadowOpacity: 0.045,
      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,

      borderWidth: 1,
      borderColor: colors.border,
    },

    overviewHeader: {
      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",

      marginBottom: 10,
    },

    overviewTitleArea: {
      flex: 1,

      paddingRight: 8,
    },

    chartTitle: {
      fontSize: 16,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    chartSubtitle: {
      fontSize: 12,

      color: colors.textSecondary,

      marginTop: 3,
    },

    periodSelector: {
      flexDirection: "row",

      alignItems: "center",

      gap: 7,

      paddingHorizontal: 9,

      paddingVertical: 8,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,
    },

    calendarIconBox: {
      width: 25,

      height: 25,

      borderRadius: 8,

      backgroundColor: colors.card,

      alignItems: "center",

      justifyContent: "center",
    },

    periodSelectorText: {
      fontSize: 11,

      fontWeight: "800",

      color: colors.primaryBlue,
    },

    periodSelectorHint: {
      fontSize: 8,

      color: colors.textSecondary,

      marginTop: 1,
    },

    chartLoading: {
      height: 270,

      alignItems: "center",

      justifyContent: "center",
    },

    // ==========================================================
    // DONUT
    // ==========================================================

    donutSection: {
      flexDirection: "row",

      alignItems: "center",

      minHeight: 210,
    },

    donutWrap: {
      width: 180,

      height: 180,

      alignItems: "center",

      justifyContent: "center",
    },

    donutCenter: {
      position: "absolute",

      width: 110,

      alignItems: "center",

      justifyContent: "center",
    },

    donutCenterIcon: {
      width: 24,

      height: 24,

      borderRadius: 8,

      backgroundColor: colors.successBg,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 4,
    },

    donutCenterAmount: {
      fontSize: 16,

      fontWeight: "800",

      color: colors.textPrimary,

      textAlign: "center",
    },

    donutCenterLabel: {
      fontSize: 7,

      fontWeight: "800",

      color: colors.textFaint,

      marginTop: 3,

      textAlign: "center",

      letterSpacing: 0.3,
    },

    donutEmpty: {
      width: 180,

      height: 180,

      alignItems: "center",

      justifyContent: "center",
    },

    emptyDonutRing: {
      width: 150,

      height: 150,

      borderRadius: 75,

      borderWidth: 25,

      borderColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",
    },

    donutEmptyAmount: {
      fontSize: 14,

      fontWeight: "800",

      color: colors.textPrimary,

      marginTop: 5,
    },

    // ==========================================================
    // BREAKDOWN
    // ==========================================================

    breakdownList: {
      flex: 1,

      marginLeft: 7,

      gap: 10,

      minWidth: 0,
    },

    breakdownRow: {
      flexDirection: "row",

      alignItems: "center",

      minWidth: 0,
    },

    breakdownDot: {
      width: 8,

      height: 8,

      borderRadius: 4,

      marginRight: 7,
    },

    breakdownNameWrap: {
      flex: 1,

      minWidth: 0,
    },

    breakdownName: {
      fontSize: 11,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    breakdownPercent: {
      width: 31,

      fontSize: 10,

      fontWeight: "700",

      color: colors.textPrimary,

      textAlign: "right",
    },

    profitPercent: {
      color: colors.success,

      fontWeight: "800",
    },

    breakdownAmount: {
      width: 62,

      fontSize: 10,

      fontWeight: "700",

      color: colors.textPrimary,

      textAlign: "right",
    },

    profitAmount: {
      color: colors.success,

      fontWeight: "800",
    },

    noBreakdownBox: {
      alignItems: "flex-start",

      gap: 7,
    },

    noBreakdown: {
      fontSize: 11,

      color: colors.textFaint,

      lineHeight: 17,
    },

    // ==========================================================
    // FINANCE STRIP
    // ==========================================================

    financeStrip: {
      flexDirection: "row",

      alignItems: "center",

      backgroundColor: colors.borderLight,

      borderRadius: 14,

      paddingVertical: 12,

      paddingHorizontal: 14,

      marginTop: 6,
    },

    financeItem: {
      flex: 1,
    },

    financeDivider: {
      width: 1,

      height: 43,

      backgroundColor: colors.border,

      marginHorizontal: 14,
    },

    financeLabelRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      marginBottom: 3,
    },

    financeMiniDot: {
      width: 5,

      height: 5,

      borderRadius: 3,
    },

    financeLabel: {
      fontSize: 10,

      color: colors.textFaint,
    },

    financeExpense: {
      fontSize: 15,

      fontWeight: "700",

      color: colors.danger,
    },

    financeRevenue: {
      fontSize: 15,

      fontWeight: "700",

      color: colors.success,
    },

    financeProfit: {
      fontSize: 15,

      fontWeight: "700",

      color: colors.success,
    },

    financeLoss: {
      fontSize: 15,

      fontWeight: "700",

      color: colors.danger,
    },

    financePercentage: {
      fontSize: 8,

      color: colors.textFaint,

      marginTop: 2,
    },

    financeLossPercentage: {
      fontSize: 8,

      color: colors.danger,

      marginTop: 2,

      fontWeight: "600",
    },

    // ==========================================================
    // PROFIT MESSAGE
    // ==========================================================

    profitMessage: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 10,

      paddingHorizontal: 11,

      paddingVertical: 9,

      borderRadius: 12,

      backgroundColor: colors.successBg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    profitMessageIcon: {
      width: 27,

      height: 27,

      borderRadius: 9,

      backgroundColor: colors.successBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 8,
    },

    profitMessageTextWrap: {
      flex: 1,
    },

    profitMessageTitle: {
      fontSize: 10,

      fontWeight: "800",

      color: colors.success,
    },

    profitMessageSubtitle: {
      fontSize: 8,

      color: colors.textSecondary,

      marginTop: 2,
    },

    profitMessageAmount: {
      fontSize: 12,

      fontWeight: "800",

      color: colors.success,
    },

    // ==========================================================
    // SECTION
    // ==========================================================

    sectionHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      marginBottom: 11,
    },

    sectionTitleArea: {
      flex: 1,
    },

    sectionTitle: {
      fontSize: 16,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    sectionSubtitle: {
      fontSize: 12,

      color: colors.textSecondary,

      marginTop: 3,
    },

    addButton: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      backgroundColor: colors.primaryBlue,

      paddingHorizontal: 13,

      paddingVertical: 10,

      borderRadius: 12,

      shadowColor: colors.primaryBlue,

      shadowOpacity: 0.18,

      shadowRadius: 7,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
    },

    addButtonText: {
      color: "#fff",

      fontSize: 12,

      fontWeight: "700",
    },

    // ==========================================================
    // EXPENSE CARD
    // ==========================================================

    expenseCard: {
      backgroundColor: colors.card,

      borderRadius: 17,

      paddingVertical: 12,

      paddingHorizontal: 11,

      marginBottom: 9,

      flexDirection: "row",

      alignItems: "center",

      borderWidth: 1,

      borderColor: colors.borderLight,

      shadowColor: "#000",

      shadowOpacity: 0.035,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 1,
    },

    expenseCardLast: {
      marginBottom: 0,
    },

    expenseIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 11,
    },

    expenseMain: {
      flex: 1,

      minWidth: 0,
    },

    expenseTopRow: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      gap: 8,
    },

    expenseCategory: {
      flex: 1,

      fontSize: 13,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    expenseAmount: {
      fontSize: 14,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    expenseMetaRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 5,

      gap: 8,
    },

    dateContainer: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,
    },

    expenseDate: {
      fontSize: 10,

      color: colors.textFaint,
    },

    statusBadge: {
      flexDirection: "row",

      alignItems: "center",

      gap: 4,

      paddingHorizontal: 7,

      paddingVertical: 3,

      borderRadius: 7,
    },

    paidBadge: {
      backgroundColor: colors.successBg,
    },

    pendingBadge: {
      backgroundColor: colors.warningBg,
    },

    statusDot: {
      width: 5,

      height: 5,

      borderRadius: 3,
    },

    paidDot: {
      backgroundColor: colors.success,
    },

    pendingDot: {
      backgroundColor: colors.warning,
    },

    statusText: {
      fontSize: 7,

      fontWeight: "800",
    },

    paidText: {
      color: colors.success,
    },

    pendingText: {
      color: colors.warning,
    },

    commentRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 5,

      marginTop: 5,

      paddingRight: 4,
    },

    expenseComment: {
      flex: 1,

      fontSize: 9,

      color: colors.textSecondary,
    },

    // ==========================================================
    // ACTIONS
    // ==========================================================

    actionColumn: {
      marginLeft: 8,

      alignItems: "center",

      gap: 6,
    },

    editButton: {
      width: 29,

      height: 29,

      borderRadius: 9,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",

      borderWidth: 1,

      borderColor: colors.border,
    },

    deleteButton: {
      backgroundColor: colors.dangerBg,

      borderColor: colors.border,
    },

    // ==========================================================
    // EMPTY
    // ==========================================================

    emptyCard: {
      backgroundColor: colors.card,

      borderRadius: 18,

      alignItems: "center",

      justifyContent: "center",

      paddingVertical: 38,

      borderWidth: 1,

      borderColor: colors.borderLight,
    },

    emptyIcon: {
      width: 52,

      height: 52,

      borderRadius: 18,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",

      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 14,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    emptySubtitle: {
      fontSize: 11,

      color: colors.textFaint,

      marginTop: 4,
    },

    // ==========================================================
    // PERIOD PICKER OVERLAY
    // ==========================================================

    periodOverlay: {
      flex: 1,

      backgroundColor: "rgba(15,23,42,0.48)",

      justifyContent: "center",

      padding: 20,
    },

    periodModal: {
      backgroundColor: colors.card,

      borderRadius: 23,

      padding: 18,

      maxHeight: "82%",

      shadowColor: "#000",

      shadowOpacity: 0.12,

      shadowRadius: 25,

      shadowOffset: {
        width: 0,
        height: 10,
      },

      elevation: 8,

      borderWidth: 1,

      borderColor: colors.border,
    },

    periodModalHeader: {
      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",

      marginBottom: 15,
    },

    periodHeaderLeft: {
      flexDirection: "row",

      alignItems: "center",

      flex: 1,
    },

    periodHeaderIcon: {
      width: 39,

      height: 39,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 10,
    },

    periodModalTitle: {
      fontSize: 19,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    periodModalSubtitle: {
      fontSize: 11,

      color: colors.textSecondary,

      marginTop: 3,
    },

    closeButton: {
      width: 35,

      height: 35,

      borderRadius: 18,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",
    },

    closeText: {
      fontSize: 25,

      lineHeight: 27,

      color: colors.textSecondary,
    },

    // ==========================================================
    // PERIOD TABS
    // ==========================================================

    periodTabs: {
      flexDirection: "row",

      backgroundColor: colors.borderLight,

      borderRadius: 12,

      padding: 3,

      marginBottom: 15,
    },

    periodTab: {
      flex: 1,

      height: 38,

      borderRadius: 9,

      alignItems: "center",

      justifyContent: "center",
    },

    periodTabActive: {
      backgroundColor: colors.card,

      shadowColor: "#000",

      shadowOpacity: 0.05,

      shadowRadius: 5,

      shadowOffset: {
        width: 0,
        height: 2,
      },

      elevation: 1,
    },

    periodTabText: {
      fontSize: 12,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    periodTabTextActive: {
      color: colors.primaryBlue,

      fontWeight: "800",
    },

    // ==========================================================
    // YEAR GRID
    // ==========================================================

    yearScroll: {
      maxHeight: 390,
    },

    yearGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 9,

      paddingBottom: 3,
    },

    yearItem: {
      width: "31.8%",

      minHeight: 46,

      borderRadius: 12,

      borderWidth: 1,

      borderColor: colors.border,

      alignItems: "center",

      justifyContent: "center",

      flexDirection: "row",

      gap: 5,
    },

    yearItemActive: {
      backgroundColor: colors.statBlueBg,

      borderColor: colors.primaryBlue,
    },

    yearItemText: {
      fontSize: 12,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    yearItemTextActive: {
      color: colors.primaryBlue,

      fontWeight: "800",
    },

    yearCheck: {
      width: 16,

      height: 16,

      borderRadius: 8,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",

      justifyContent: "center",
    },

    // ==========================================================
    // MONTH GRID
    // ==========================================================

    monthGrid: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 9,
    },

    monthItem: {
      width: "31.8%",

      minHeight: 48,

      borderRadius: 13,

      borderWidth: 1,

      borderColor: colors.border,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 6,
    },

    monthItemActive: {
      backgroundColor: colors.statBlueBg,

      borderColor: colors.primaryBlue,
    },

    monthItemLocked: {
      backgroundColor: colors.borderLight,

      borderColor: colors.borderLight,
    },

    monthItemText: {
      fontSize: 12,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    monthItemTextActive: {
      color: colors.primaryBlue,

      fontWeight: "800",
    },

    monthItemTextLocked: {
      color: colors.textFaint,

      fontWeight: "600",
    },

    monthCheck: {
      alignItems: "center",

      justifyContent: "center",
    },

    // ==========================================================
    // PERIOD FOOTER
    // ==========================================================

    periodFooter: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      marginTop: 15,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor: colors.borderLight,
    },

    periodFooterText: {
      flex: 1,

      fontSize: 10,

      color: colors.textFaint,

      lineHeight: 15,
    },
    // ==========================================================
    // PERIOD FOOTER
    // ==========================================================

    periodFooter: {
      flexDirection: "row",

      alignItems: "center",

      gap: 6,

      marginTop: 15,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor: colors.borderLight,
    },

    periodFooterText: {
      flex: 1,

      fontSize: 10,

      color: colors.textFaint,

      lineHeight: 15,
    },
  });
}
