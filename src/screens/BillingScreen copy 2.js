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
  Platform,
  useWindowDimensions,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome6 } from "@expo/vector-icons";
import Svg, { G, Circle } from "react-native-svg";

import Header from "../components/Header";
import ExpenseModal from "../components/ExpenseModal";
import DesktopLayout from "../components/DesktopLayout";

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
  // RESPONSIVE LAYOUT
  // ==========================================================

  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === "web" && width >= 1000;

  // ==========================================================
  // THEME
  // ==========================================================

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const desktopStyles = useMemo(
    () => createDesktopBillingStyles(colors),
    [colors]
  );

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
    if (isDesktop) {
      return (
        <DesktopLayout
          activeRoute="Billing"
          title="Billing"
          subtitle="Track your library finances"
        >
          <View style={desktopStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />

            <Text style={desktopStyles.loadingText}>Loading billing...</Text>
          </View>
        </DesktopLayout>
      );
    }

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />

        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  // ============================================================
  // DESKTOP SCREEN
  // ============================================================

  if (isDesktop) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bg,
          },
        ]}
      >
        <DesktopLayout
          activeRoute="Billing"
          title="Billing"
          subtitle="Track your library finances"
        >
          <DesktopBillingContent
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            selectedMonthName={selectedMonthName}
            monthlyRevenue={monthlyRevenue}
            monthlyExpenses={monthlyExpenses}
            monthlyProfit={monthlyProfit}
            averageProfit={averageProfit}
            monthlyExpensesList={monthlyExpensesList}
            categoryBreakdown={categoryBreakdown}
            monthLoading={monthLoading}
            isDarkMode={isDarkMode}
            colors={colors}
            styles={desktopStyles}
            onMonthPress={() => setMonthPickerVisible(true)}
            onAddExpense={openAddExpense}
            onEditExpense={openEditExpense}
            onDeleteExpense={handleDelete}
          />
        </DesktopLayout>

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
  // MOBILE SCREEN
  // ============================================================

  return (
    <View style={styles.container}>
      <Header />

      <FlatList
        data={monthlyExpensesList}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* ==================================================
                BILLING PERIOD
            ================================================== */}

            <View style={styles.mobilePeriodRow}>
              <View>
                <Text style={styles.mobilePeriodLabel}>Billing</Text>

                <Text style={styles.mobilePeriodTitle}>
                  {selectedMonthName} {selectedYear}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.mobilePeriodButton}
                activeOpacity={0.8}
                onPress={() => setMonthPickerVisible(true)}
              >
                <FontAwesome6
                  name="calendar-days"
                  size={14}
                  color={colors.primaryBlue}
                />

                <Text style={styles.mobilePeriodButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <View style={styles.summaryGridMobile}>
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
                label="Profit"
                value={monthlyProfit}
                icon="chart-line"
                iconBg={isDarkMode ? colors.statBlueBg : "#eff6ff"}
                iconColor={colors.primaryBlue}
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
              styles={styles}
              colors={colors}
              isDarkMode={isDarkMode}
              onMonthPress={() => setMonthPickerVisible(true)}
            />

            {/* ==================================================
                EXPENSE HEADER
            ================================================== */}

            <View style={styles.expensesHeader}>
              <View>
                <Text style={styles.expensesTitle}>Expenses</Text>

                <Text style={styles.expensesSubtitle}>
                  {monthlyExpensesList.length} transaction
                  {monthlyExpensesList.length === 1 ? "" : "s"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addExpenseButtonMobile}
                activeOpacity={0.8}
                onPress={openAddExpense}
              >
                <FontAwesome6 name="plus" size={12} color="#fff" />

                <Text style={styles.addExpenseButtonMobileText}>
                  Add Expense
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <ExpenseRow
            item={item}
            styles={styles}
            colors={colors}
            isDarkMode={isDarkMode}
            onEdit={openEditExpense}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <EmptyExpenses
            styles={styles}
            colors={colors}
            onAddExpense={openAddExpense}
          />
        }
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
          BILLING PERIOD PICKER
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
// DESKTOP BILLING CONTENT
// ============================================================

function DesktopBillingContent({
  selectedMonth,
  selectedYear,
  selectedMonthName,
  monthlyRevenue,
  monthlyExpenses,
  monthlyProfit,
  averageProfit,
  monthlyExpensesList,
  categoryBreakdown,
  monthLoading,
  isDarkMode,
  colors,
  styles,
  onMonthPress,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ======================================================
          PERIOD TOOLBAR
      ====================================================== */}

      <View style={styles.periodToolbar}>
        <View>
          <Text style={styles.periodLabel}>
            {selectedMonthName} {selectedYear}
          </Text>

          <Text style={styles.periodDescription}>
            Review revenue, expenses and profitability
          </Text>
        </View>

        <View style={styles.periodActions}>
          <TouchableOpacity
            style={styles.periodButton}
            activeOpacity={0.8}
            onPress={onMonthPress}
          >
            <FontAwesome6
              name="calendar-days"
              size={13}
              color={colors.primaryBlue}
            />

            <Text style={styles.periodButtonText}>
              {selectedMonthName.slice(0, 3)} {selectedYear}
            </Text>

            <FontAwesome6
              name="chevron-down"
              size={9}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addExpenseButton}
            activeOpacity={0.8}
            onPress={onAddExpense}
          >
            <FontAwesome6 name="plus" size={12} color="#fff" />

            <Text style={styles.addExpenseButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <View style={styles.summaryGrid}>
        <DesktopBillingSummaryCard
          label="Revenue"
          value={monthlyRevenue}
          icon="money-bill-wave"
          iconBg={isDarkMode ? colors.successBg : "#ecfdf5"}
          iconColor={isDarkMode ? "#4ADE80" : "#10b981"}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Expenses"
          value={monthlyExpenses}
          icon="arrow-trend-down"
          iconBg={isDarkMode ? colors.dangerBg : "#fef2f2"}
          iconColor={isDarkMode ? "#F87171" : "#ef4444"}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Net Profit"
          value={monthlyProfit}
          icon="chart-line"
          iconBg={isDarkMode ? colors.statBlueBg : "#eff6ff"}
          iconColor={colors.primaryBlue}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Avg. Profit"
          value={averageProfit}
          icon="chart-pie"
          iconBg={isDarkMode ? colors.statPurpleBg : "#f5f3ff"}
          iconColor={isDarkMode ? "#A78BFA" : "#8b5cf6"}
          styles={styles}
        />
      </View>

      {/* ======================================================
          FINANCIAL OVERVIEW
      ====================================================== */}

      <DesktopFinancialOverview
        monthName={selectedMonthName}
        year={selectedYear}
        loading={monthLoading}
        breakdown={categoryBreakdown}
        totalExpenses={monthlyExpenses}
        revenue={monthlyRevenue}
        profit={monthlyProfit}
        onMonthPress={onMonthPress}
        colors={colors}
        styles={styles}
        isDarkMode={isDarkMode}
      />

      {/* ======================================================
          EXPENSES SECTION
      ====================================================== */}

      <View style={styles.expensesSection}>
        <View style={styles.expensesSectionHeader}>
          <View>
            <Text style={styles.expensesTitle}>Expenses</Text>

            <Text style={styles.expensesSubtitle}>
              {monthlyExpensesList.length} transaction
              {monthlyExpensesList.length === 1 ? "" : "s"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.sectionAddButton}
            activeOpacity={0.8}
            onPress={onAddExpense}
          >
            <FontAwesome6 name="plus" size={11} color="#fff" />

            <Text style={styles.sectionAddButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {monthlyExpensesList.length === 0 ? (
          <DesktopEmptyExpenses
            styles={styles}
            colors={colors}
            onAddExpense={onAddExpense}
          />
        ) : (
          <View style={styles.expenseTable}>
            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <View style={styles.expenseTableHeader}>
              <View style={styles.categoryColumn}>
                <Text style={styles.tableHeaderText}>CATEGORY</Text>
              </View>

              <View style={styles.dateColumn}>
                <Text style={styles.tableHeaderText}>DATE</Text>
              </View>

              <View style={styles.statusColumn}>
                <Text style={styles.tableHeaderText}>STATUS</Text>
              </View>

              <View style={styles.commentColumn}>
                <Text style={styles.tableHeaderText}>COMMENT</Text>
              </View>

              <Text style={[styles.tableHeaderText, styles.amountColumn]}>
                AMOUNT
              </Text>

              <Text style={[styles.tableHeaderText, styles.actionColumn]}>
                ACTION
              </Text>
            </View>

            {/* ==================================================
                TABLE ROWS
            ================================================== */}

            {monthlyExpensesList.map((item, index) => {
              const info = getCategoryInfo(item.category, isDarkMode);

              const isLast = index === monthlyExpensesList.length - 1;

              const status = String(item.status || "PAID").toUpperCase();

              const isPaid = status === "PAID";

              return (
                <View
                  key={String(item.id)}
                  style={[
                    styles.expenseTableRow,
                    isLast && styles.expenseTableRowLast,
                  ]}
                >
                  {/* CATEGORY */}

                  <View style={styles.categoryCell}>
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: info.bg,
                        },
                      ]}
                    >
                      <FontAwesome6
                        name={info.icon}
                        size={12}
                        color={info.color}
                      />
                    </View>

                    <Text style={styles.categoryText} numberOfLines={1}>
                      {String(item.category || "Other")
                        .charAt(0)
                        .toUpperCase() +
                        String(item.category || "Other").slice(1)}
                    </Text>
                  </View>

                  {/* DATE */}

                  <View style={styles.dateCell}>
                    <FontAwesome6
                      name="calendar-day"
                      size={10}
                      color={colors.textFaint}
                    />

                    <Text style={styles.dateText}>
                      {formatDate(item.expenseDate)}
                    </Text>
                  </View>

                  {/* STATUS */}

                  <View style={styles.statusCell}>
                    <View
                      style={[
                        styles.desktopStatusBadge,
                        isPaid
                          ? styles.desktopPaidBadge
                          : styles.desktopPendingBadge,
                      ]}
                    >
                      <View
                        style={[
                          styles.desktopStatusDot,
                          isPaid
                            ? styles.desktopPaidDot
                            : styles.desktopPendingDot,
                        ]}
                      />

                      <Text
                        style={[
                          styles.desktopStatusText,
                          isPaid
                            ? styles.desktopPaidText
                            : styles.desktopPendingText,
                        ]}
                      >
                        {isPaid ? "PAID" : "PENDING"}
                      </Text>
                    </View>
                  </View>

                  {/* COMMENT */}

                  <View style={styles.commentCell}>
                    {item.comment ? (
                      <>
                        <FontAwesome6
                          name="comment"
                          size={9}
                          color={colors.textFaint}
                        />

                        <Text style={styles.commentText} numberOfLines={1}>
                          {item.comment}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noCommentText}>—</Text>
                    )}
                  </View>

                  {/* AMOUNT */}

                  <View style={styles.amountCell}>
                    <Text style={styles.amountText}>
                      {formatMoney(item.amount)}
                    </Text>
                  </View>

                  {/* ACTIONS */}

                  <View style={styles.actionsCell}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.tableActionButton}
                      onPress={() => onEditExpense(item)}
                    >
                      <FontAwesome6
                        name="pen"
                        size={10}
                        color={colors.primaryBlue}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.tableActionButton,
                        styles.tableDeleteButton,
                      ]}
                      onPress={() => onDeleteExpense(item.id)}
                    >
                      <FontAwesome6
                        name="trash"
                        size={10}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ============================================================
// DESKTOP SUMMARY CARD
// ============================================================

function DesktopBillingSummaryCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  styles,
}) {
  return (
    <View style={styles.desktopSummaryCard}>
      <View style={styles.desktopSummaryTop}>
        <View>
          <Text style={styles.desktopSummaryLabel}>{label}</Text>

          <Text style={styles.desktopSummaryValue}>{formatMoney(value)}</Text>
        </View>

        <View
          style={[
            styles.desktopSummaryIcon,
            {
              backgroundColor: iconBg,
            },
          ]}
        >
          <FontAwesome6 name={icon} size={16} color={iconColor} />
        </View>
      </View>
    </View>
  );
}
// ============================================================
// DESKTOP FINANCIAL OVERVIEW
// ============================================================

function DesktopFinancialOverview({
  monthName,
  year,
  loading,
  breakdown,
  totalExpenses,
  revenue,
  profit,
  onMonthPress,
  colors,
  styles,
  isDarkMode,
}) {
  const chartTotal = profit >= 0 ? revenue : totalExpenses;

  const profitPercentage =
    revenue > 0 && profit > 0 ? (profit / revenue) * 100 : 0;

  const expensePercentage = revenue > 0 ? (totalExpenses / revenue) * 100 : 0;

  return (
    <View style={styles.desktopOverviewCard}>
      {/* ======================================================
          HEADER
      ====================================================== */}

      <View style={styles.desktopOverviewHeader}>
        <View>
          <Text style={styles.desktopOverviewTitle}>Expense vs Profit</Text>

          <Text style={styles.desktopOverviewSubtitle}>
            Overall financial overview
          </Text>
        </View>

        <TouchableOpacity
          style={styles.desktopPeriodButton}
          activeOpacity={0.8}
          onPress={onMonthPress}
        >
          <FontAwesome6
            name="calendar-days"
            size={11}
            color={colors.primaryBlue}
          />

          <Text style={styles.desktopPeriodButtonText}>
            {monthName.slice(0, 3)} {year}
          </Text>

          <FontAwesome6
            name="chevron-down"
            size={8}
            color={colors.primaryBlue}
          />
        </TouchableOpacity>
      </View>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {loading ? (
        <View style={styles.desktopChartLoading}>
          <ActivityIndicator size="small" color={colors.primaryBlue} />
        </View>
      ) : (
        <>
          {/* ==================================================
              CHART + BREAKDOWN
          ================================================== */}

          <View style={styles.desktopOverviewBody}>
            <DonutChart
              data={breakdown}
              total={chartTotal}
              revenue={revenue}
              profit={profit}
              styles={styles}
              colors={colors}
              isDarkMode={isDarkMode}
            />

            <View style={styles.desktopBreakdownList}>
              {breakdown.length === 0 ? (
                <View style={styles.desktopNoData}>
                  <FontAwesome6
                    name="receipt"
                    size={18}
                    color={colors.textFaint}
                  />

                  <Text style={styles.desktopNoDataText}>
                    No financial data available for this month.
                  </Text>
                </View>
              ) : (
                breakdown.map((item) => {
                  const isProfit = item.type === "profit";

                  return (
                    <View key={item.key} style={styles.desktopBreakdownRow}>
                      <View
                        style={[
                          styles.desktopBreakdownDot,
                          {
                            backgroundColor: item.info.color,
                          },
                        ]}
                      />

                      <Text
                        style={styles.desktopBreakdownName}
                        numberOfLines={1}
                      >
                        {isProfit
                          ? "Profit"
                          : item.key.charAt(0).toUpperCase() +
                            item.key.slice(1)}
                      </Text>

                      <Text
                        style={[
                          styles.desktopBreakdownPercent,
                          isProfit && styles.desktopProfitText,
                        ]}
                      >
                        {Math.round(item.percentage || 0)}%
                      </Text>

                      <Text
                        style={[
                          styles.desktopBreakdownAmount,
                          isProfit && styles.desktopProfitText,
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
              FINANCIAL STRIP
          ================================================== */}

          <View style={styles.desktopFinanceStrip}>
            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>TOTAL EXPENSES</Text>

              <Text style={styles.desktopFinanceExpense}>
                {formatMoney(totalExpenses)}
              </Text>

              <Text style={styles.desktopFinanceHint}>
                {expensePercentage.toFixed(1)}% of revenue
              </Text>
            </View>

            <View style={styles.desktopFinanceDivider} />

            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>NET PROFIT</Text>

              <Text
                style={
                  profit >= 0
                    ? styles.desktopFinanceProfit
                    : styles.desktopFinanceLoss
                }
              >
                {formatMoney(profit)}
              </Text>

              <Text style={styles.desktopFinanceHint}>
                {profitPercentage.toFixed(1)}% margin
              </Text>
            </View>

            <View style={styles.desktopFinanceDivider} />

            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>REVENUE</Text>

              <Text style={styles.desktopFinanceRevenue}>
                {formatMoney(revenue)}
              </Text>

              <Text style={styles.desktopFinanceHint}>
                Selected billing period
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ============================================================
// FINANCIAL OVERVIEW - MOBILE
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
                      <View
                        style={[
                          styles.breakdownDot,
                          {
                            backgroundColor: item.info.color,
                          },
                        ]}
                      />

                      <View style={styles.breakdownNameWrap}>
                        <Text style={styles.breakdownName} numberOfLines={1}>
                          {isProfit
                            ? "Profit"
                            : item.key.charAt(0).toUpperCase() +
                              item.key.slice(1)}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.breakdownPercent,
                          isProfit && styles.profitPercent,
                        ]}
                      >
                        {Math.round(item.percentage || 0)}%
                      </Text>

                      <Text style={styles.breakdownAmount}>
                        {formatMoney(item.amount)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>

          {/* ==================================================
              FINANCIAL SUMMARY
          ================================================== */}

          <View style={styles.financeSummary}>
            <View style={styles.financeSummaryItem}>
              <Text style={styles.financeSummaryLabel}>Expenses</Text>

              <Text style={styles.financeSummaryExpense}>
                {formatMoney(totalExpenses)}
              </Text>

              <Text style={styles.financeSummaryHint}>
                {expensePercentage.toFixed(1)}% of revenue
              </Text>
            </View>

            <View style={styles.financeSummaryDivider} />

            <View style={styles.financeSummaryItem}>
              <Text style={styles.financeSummaryLabel}>Profit</Text>

              <Text
                style={
                  profit >= 0
                    ? styles.financeSummaryProfit
                    : styles.financeSummaryLoss
                }
              >
                {formatMoney(profit)}
              </Text>

              <Text style={styles.financeSummaryHint}>
                {profitPercentage.toFixed(1)}% margin
              </Text>
            </View>

            <View style={styles.financeSummaryDivider} />

            <View style={styles.financeSummaryItem}>
              <Text style={styles.financeSummaryLabel}>Revenue</Text>

              <Text style={styles.financeSummaryRevenue}>
                {formatMoney(revenue)}
              </Text>

              <Text style={styles.financeSummaryHint}>Current period</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ============================================================
// DONUT CHART
// ============================================================

function DonutChart({
  data = [],
  total = 0,
  revenue = 0,
  profit = 0,
  styles,
  colors,
  isDarkMode,
}) {
  const size = 180;
  const strokeWidth = 25;

  const radiusValue = (size - strokeWidth) / 2;

  const circumference = 2 * Math.PI * radiusValue;

  const safeTotal = Number(total || 0);

  if (!data.length || safeTotal <= 0) {
    return (
      <View style={styles.donutEmpty}>
        <View style={styles.emptyDonutRing} />

        <Text style={styles.donutEmptyAmount}>
          {formatMoney(revenue || total)}
        </Text>
      </View>
    );
  }

  let offset = 0;

  return (
    <View style={styles.donutWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {data.map((item) => {
            const amount = Number(item.amount || 0);

            if (amount <= 0) {
              return null;
            }

            const length = (amount / safeTotal) * circumference;

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
// EXPENSE ROW - MOBILE
// ============================================================

function ExpenseRow({ item, styles, colors, isDarkMode, onEdit, onDelete }) {
  const info = getCategoryInfo(item.category, isDarkMode);

  const status = String(item.status || "PAID").toUpperCase();

  const isPaid = status === "PAID";

  return (
    <View style={styles.expenseRow}>
      {/* ==================================================
          TOP
      ================================================== */}

      <View style={styles.expenseRowTop}>
        <View style={styles.expenseCategoryWrap}>
          <View
            style={[
              styles.expenseCategoryIcon,
              {
                backgroundColor: info.bg,
              },
            ]}
          >
            <FontAwesome6 name={info.icon} size={13} color={info.color} />
          </View>

          <View style={styles.expenseCategoryText}>
            <Text style={styles.expenseCategoryName} numberOfLines={1}>
              {String(item.category || "Other")
                .charAt(0)
                .toUpperCase() + String(item.category || "Other").slice(1)}
            </Text>

            <Text style={styles.expenseDate}>
              {formatDate(item.expenseDate)}
            </Text>
          </View>
        </View>

        <Text style={styles.expenseAmount}>{formatMoney(item.amount)}</Text>
      </View>

      {/* ==================================================
          BOTTOM
      ================================================== */}

      <View style={styles.expenseRowBottom}>
        <View
          style={[
            styles.expenseStatusBadge,
            isPaid ? styles.expensePaidBadge : styles.expensePendingBadge,
          ]}
        >
          <View
            style={[
              styles.expenseStatusDot,
              isPaid ? styles.expensePaidDot : styles.expensePendingDot,
            ]}
          />

          <Text
            style={[
              styles.expenseStatusText,
              isPaid ? styles.expensePaidText : styles.expensePendingText,
            ]}
          >
            {isPaid ? "PAID" : "PENDING"}
          </Text>
        </View>

        <View style={styles.expenseActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.expenseActionButton}
            onPress={() => onEdit(item)}
          >
            <FontAwesome6 name="pen" size={10} color={colors.primaryBlue} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.expenseActionButton, styles.expenseDeleteButton]}
            onPress={() => onDelete(item.id)}
          >
            <FontAwesome6 name="trash" size={10} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ==================================================
          COMMENT
      ================================================== */}

      {item.comment ? (
        <View style={styles.commentRow}>
          <FontAwesome6 name="comment" size={9} color={colors.textFaint} />

          <Text style={styles.expenseComment} numberOfLines={2}>
            {item.comment}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ============================================================
// EMPTY EXPENSES
// ============================================================

function EmptyExpenses({ styles, colors, onAddExpense }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <FontAwesome6 name="receipt" size={21} color={colors.textFaint} />
      </View>

      <Text style={styles.emptyTitle}>No expenses this month</Text>

      <Text style={styles.emptySubtitle}>
        Your library expenses will appear here.
      </Text>

      {onAddExpense ? (
        <TouchableOpacity
          style={styles.emptyAddButton}
          activeOpacity={0.8}
          onPress={onAddExpense}
        >
          <FontAwesome6 name="plus" size={11} color="#fff" />

          <Text style={styles.emptyAddButtonText}>Add Expense</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ============================================================
// DESKTOP EMPTY EXPENSES
// ============================================================

function DesktopEmptyExpenses({ styles, colors, onAddExpense }) {
  return (
    <View style={styles.desktopEmptyCard}>
      <View style={styles.desktopEmptyIcon}>
        <FontAwesome6 name="receipt" size={20} color={colors.textFaint} />
      </View>

      <Text style={styles.desktopEmptyTitle}>No expenses this month</Text>

      <Text style={styles.desktopEmptySubtitle}>
        Your library expenses will appear here.
      </Text>

      {onAddExpense ? (
        <TouchableOpacity
          style={styles.emptyAddButton}
          activeOpacity={0.8}
          onPress={onAddExpense}
        >
          <FontAwesome6 name="plus" size={10} color="#fff" />

          <Text style={styles.emptyAddButtonText}>Add Expense</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
// ============================================================
// MOBILE STYLES
// ============================================================

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
    // MOBILE PERIOD HEADER
    // ==========================================================

    mobilePeriodRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    mobilePeriodLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    mobilePeriodTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
      marginTop: 2,
    },

    mobilePeriodButton: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    mobilePeriodButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    // ==========================================================
    // SUMMARY
    // ==========================================================

    summarySection: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },

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
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: "center",
      maxWidth: 260,
    },

    // ==========================================================
    // PERIOD PICKER
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

// ============================================================
// DESKTOP BILLING STYLES
// ============================================================

function createDesktopBillingStyles(colors) {
  return StyleSheet.create({
    loadingContainer: {
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

    scroll: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scrollContent: {
      padding: 24,
      paddingBottom: 40,
    },

    // ========================================================
    // PERIOD TOOLBAR
    // ========================================================

    periodToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
      gap: 20,
    },

    periodLabel: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    periodDescription: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
    },

    periodActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    periodButton: {
      minWidth: 155,
      height: 42,
      paddingHorizontal: 14,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },

    periodButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    addExpenseButton: {
      height: 42,
      paddingHorizontal: 15,
      borderRadius: 11,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    addExpenseButtonText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },

    // ========================================================
    // DESKTOP SUMMARY
    // ========================================================

    summaryGrid: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 16,
    },

    desktopSummaryCard: {
      flex: 1,
      minHeight: 108,
      padding: 18,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    desktopSummaryTop: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    desktopSummaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    desktopSummaryValue: {
      marginTop: 9,
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopSummaryIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // DESKTOP FINANCIAL OVERVIEW
    // ========================================================

    desktopOverviewCard: {
      backgroundColor: colors.card,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      marginBottom: 20,
    },

    desktopOverviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },

    desktopOverviewTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopOverviewSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textSecondary,
    },

    desktopPeriodButton: {
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    desktopPeriodButtonText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopChartLoading: {
      minHeight: 270,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopOverviewBody: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 215,
    },

    desktopBreakdownList: {
      flex: 1,
      marginLeft: 30,
      gap: 13,
    },

    desktopBreakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 28,
    },

    desktopBreakdownDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 9,
    },

    desktopBreakdownName: {
      flex: 1,
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    desktopBreakdownPercent: {
      width: 48,
      textAlign: "right",
      fontSize: 11,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    desktopBreakdownAmount: {
      width: 95,
      textAlign: "right",
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopProfitText: {
      color: colors.success,
    },

    desktopNoData: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    desktopNoDataText: {
      maxWidth: 260,
      textAlign: "center",
      fontSize: 12,
      lineHeight: 18,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP FINANCE STRIP
    // ========================================================

    desktopFinanceStrip: {
      marginTop: 12,
      padding: 15,
      borderRadius: 13,
      backgroundColor: colors.borderLight,
      flexDirection: "row",
      alignItems: "center",
    },

    desktopFinanceItem: {
      flex: 1,
    },

    desktopFinanceDivider: {
      width: 1,
      height: 50,
      backgroundColor: colors.border,
      marginHorizontal: 18,
    },

    desktopFinanceLabel: {
      fontSize: 10,
      color: colors.textFaint,
      marginBottom: 4,
    },

    desktopFinanceExpense: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.danger,
    },

    desktopFinanceProfit: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.success,
    },

    desktopFinanceLoss: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.danger,
    },

    desktopFinanceRevenue: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopFinanceHint: {
      marginTop: 3,
      fontSize: 9,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP EXPENSE SECTION
    // ========================================================

    expensesSection: {
      backgroundColor: colors.card,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
    },

    expensesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 15,
    },

    expensesTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    expensesSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textSecondary,
    },

    sectionAddButton: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    sectionAddButtonText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },

    // ========================================================
    // DESKTOP TABLE
    // ========================================================

    expenseTable: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      overflow: "hidden",
    },

    expenseTableHeader: {
      minHeight: 42,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.borderLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    tableHeaderText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    expenseTableRow: {
      minHeight: 68,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    expenseTableRowLast: {
      borderBottomWidth: 0,
    },

    categoryColumn: {
      width: "23%",
    },

    dateColumn: {
      width: "15%",
    },

    statusColumn: {
      width: "13%",
    },

    commentColumn: {
      flex: 1,
    },

    amountColumn: {
      width: 95,
      textAlign: "right",
    },

    actionColumn: {
      width: 72,
      textAlign: "right",
    },

    categoryCell: {
      width: "23%",
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 12,
    },

    categoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 9,
    },

    categoryText: {
      flex: 1,
      fontSize: 11,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    dateCell: {
      width: "15%",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingRight: 8,
    },

    dateText: {
      fontSize: 10,
      color: colors.textSecondary,
    },

    statusCell: {
      width: "13%",
    },

    desktopStatusBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
    },

    desktopPaidBadge: {
      backgroundColor: colors.successBg,
    },

    desktopPendingBadge: {
      backgroundColor: colors.warningBg,
    },

    desktopStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },

    desktopPaidDot: {
      backgroundColor: colors.success,
    },

    desktopPendingDot: {
      backgroundColor: colors.warning,
    },

    desktopStatusText: {
      fontSize: 8,
      fontWeight: "800",
    },

    desktopPaidText: {
      color: colors.success,
    },

    desktopPendingText: {
      color: colors.warning,
    },

    commentCell: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingRight: 8,
      minWidth: 0,
    },

    commentText: {
      flex: 1,
      fontSize: 10,
      color: colors.textSecondary,
    },

    noCommentText: {
      fontSize: 12,
      color: colors.textFaint,
    },

    amountCell: {
      width: 95,
      alignItems: "flex-end",
    },

    amountText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    actionsCell: {
      width: 72,
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 6,
    },

    tableActionButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    tableDeleteButton: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.dangerBg,
    },

    // ========================================================
    // DESKTOP EMPTY STATE
    // ========================================================

    desktopEmptyCard: {
      minHeight: 210,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.borderLight,
    },

    desktopEmptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    desktopEmptyTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopEmptySubtitle: {
      marginTop: 4,
      fontSize: 11,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP DONUT CHART
    // ========================================================

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
  });
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

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* MONTH / YEAR TABS */}

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

          {/* ==================================================
              YEAR SELECTOR
          ================================================== */}

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
