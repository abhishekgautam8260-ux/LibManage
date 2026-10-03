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

  // ==========================================================
  // CATEGORY + PROFIT BREAKDOWN
  // ==========================================================

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

  // ==========================================================
  // SAVE EXPENSE
  // ==========================================================

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

  // ==========================================================
  // DELETE EXPENSE
  // ==========================================================

  const handleDelete = async (id) => {
    console.log("🗑️ Delete expense clicked:", id);

    if (!id) {
      console.error("❌ Delete failed: expense ID is missing");
      return;
    }

    if (!libraryId) {
      console.error("❌ Delete failed: libraryId is missing");
      return;
    }

    // ============================================================
    // DESKTOP WEB
    // ============================================================

    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Delete Expense?\n\nThis expense will be permanently removed."
      );

      if (!confirmed) {
        console.log("ℹ️ Expense deletion cancelled");
        return;
      }

      try {
        console.log("🚀 Deleting expense:", {
          id,
          libraryId,
        });

        await deleteExpense(id, libraryId);

        console.log("✅ Expense deleted successfully:", id);

        await loadExpenses();

        await loadSummary(selectedYear, selectedMonth);
      } catch (error) {
        console.error("❌ Delete expense failed:", error);

        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to delete expense."
        );
      }

      return;
    }

    // ============================================================
    // MOBILE
    // ============================================================

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
              console.log("🚀 Deleting expense:", {
                id,
                libraryId,
              });

              await deleteExpense(id, libraryId);

              console.log("✅ Expense deleted successfully:", id);

              await loadExpenses();

              await loadSummary(selectedYear, selectedMonth);
            } catch (error) {
              console.error("❌ Delete expense failed:", error);

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

  // ==========================================================
  // OPEN ADD EXPENSE
  // ==========================================================

  const openAddExpense = () => {
    setEditing(null);

    setModalVisible(true);
  };

  // ==========================================================
  // OPEN EDIT EXPENSE
  // ==========================================================

  const openEditExpense = (item) => {
    setEditing(item);

    setModalVisible(true);
  };

  // ==========================================================
  // LOADING
  // ==========================================================

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
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />

        <Text style={styles.loadingText}>Loading billing...</Text>
      </View>
    );
  }

  // ==========================================================
  // DESKTOP SCREEN
  // ==========================================================

  if (isDesktop) {
    return (
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
      </DesktopLayout>
    );
  }

  // ==========================================================
  // MOBILE SCREEN
  // ==========================================================

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

            <View style={styles.expensesSectionHeader}>
              <View style={styles.expensesHeaderText}>
                <Text style={styles.expensesTitle}>Expenses</Text>

                <Text style={styles.expensesSubtitle}>
                  {monthlyExpensesList.length} transaction
                  {monthlyExpensesList.length === 1 ? "" : "s"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sectionAddButton}
                activeOpacity={0.8}
                onPress={openAddExpense}
              >
                <FontAwesome6 name="plus" size={11} color="#fff" />

                <Text style={styles.sectionAddButtonText}>Add Expense</Text>
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
          <Text style={styles.periodLabel}>Billing Period</Text>

          <Text style={styles.periodDescription}>
            View revenue, expenses and profit for a specific month.
          </Text>
        </View>

        <View style={styles.periodActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.periodButton}
            onPress={onMonthPress}
          >
            <FontAwesome6
              name="calendar-days"
              size={14}
              color={colors.primaryBlue}
            />

            <Text style={styles.periodButtonText}>
              {selectedMonthName} {selectedYear}
            </Text>

            <FontAwesome6
              name="chevron-down"
              size={10}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addExpenseButton}
            onPress={onAddExpense}
          >
            <FontAwesome6 name="plus" size={12} color="#fff" />

            <Text style={styles.addExpenseButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <View style={styles.summaryGrid}>
        <DesktopBillingSummaryCard
          label="Revenue"
          value={monthlyRevenue}
          icon="money-bill-wave"
          iconColor={isDarkMode ? "#4ADE80" : "#10b981"}
          iconBg={isDarkMode ? colors.successBg : "#ecfdf5"}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Expenses"
          value={monthlyExpenses}
          icon="arrow-trend-down"
          iconColor={isDarkMode ? "#F87171" : "#ef4444"}
          iconBg={isDarkMode ? colors.dangerBg : "#fef2f2"}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Net Profit"
          value={monthlyProfit}
          icon="chart-line"
          iconColor={monthlyProfit >= 0 ? colors.primaryBlue : colors.danger}
          iconBg={isDarkMode ? colors.statBlueBg : "#eff6ff"}
          styles={styles}
        />

        <DesktopBillingSummaryCard
          label="Avg. Profit"
          value={averageProfit}
          icon="chart-pie"
          iconColor={isDarkMode ? "#A78BFA" : "#8b5cf6"}
          iconBg={isDarkMode ? colors.statPurpleBg : "#f5f3ff"}
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
          EXPENSES
      ====================================================== */}

      <View style={styles.expensesSection}>
        <View style={styles.expensesSectionHeader}>
          <View style={styles.expensesHeaderText}>
            <Text style={styles.expensesTitle}>Expenses</Text>

            <Text style={styles.expensesSubtitle}>
              {monthlyExpensesList.length} transaction
              {monthlyExpensesList.length === 1 ? "" : "s"} in{" "}
              {selectedMonthName}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.sectionAddButton}
            onPress={onAddExpense}
          >
            <FontAwesome6 name="plus" size={11} color="#fff" />

            <Text style={styles.sectionAddButtonText}>Add Expense</Text>
          </TouchableOpacity>
        </View>

        {monthlyExpensesList.length === 0 ? (
          <DesktopEmptyExpenses colors={colors} styles={styles} />
        ) : (
          <View style={styles.expenseTable}>
            {/* ==================================================
                TABLE HEADER
            ================================================== */}

            <View style={styles.expenseTableHeader}>
              <Text style={[styles.tableHeaderText, styles.categoryColumn]}>
                Category
              </Text>

              <Text style={[styles.tableHeaderText, styles.dateColumn]}>
                Date
              </Text>

              <Text style={[styles.tableHeaderText, styles.statusColumn]}>
                Status
              </Text>

              <Text style={[styles.tableHeaderText, styles.commentColumn]}>
                Comment
              </Text>

              <Text style={[styles.tableHeaderText, styles.amountColumn]}>
                Amount
              </Text>

              <Text style={[styles.tableHeaderText, styles.actionColumn]}>
                Actions
              </Text>
            </View>

            {/* ==================================================
                TABLE ROWS
            ================================================== */}

            {monthlyExpensesList.map((item, index) => {
              const info = getCategoryInfo(item.category, isDarkMode);

              const isPaid =
                String(item.status || "PAID").toUpperCase() === "PAID";

              return (
                <View
                  key={String(item.id)}
                  style={[
                    styles.expenseTableRow,

                    index === monthlyExpensesList.length - 1 &&
                      styles.expenseTableRowLast,
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
                        size={14}
                        color={info.color}
                      />
                    </View>

                    <Text style={styles.categoryText} numberOfLines={1}>
                      {item.category || "Other"}
                    </Text>
                  </View>

                  {/* DATE */}

                  <View style={styles.dateCell}>
                    <FontAwesome6
                      name="calendar-days"
                      size={11}
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
                          name="message"
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
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.tableActionButton,
                        styles.tableDeleteButton,
                      ]}
                      onPress={() => {
                        console.log("🗑️ DELETE BUTTON PRESSED:", item.id);

                        onDeleteExpense(item.id);
                      }}
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
      <View style={styles.desktopOverviewHeader}>
        <View>
          <Text style={styles.desktopOverviewTitle}>Expense vs Profit</Text>

          <Text style={styles.desktopOverviewSubtitle}>
            Overall financial overview
          </Text>
        </View>

        <TouchableOpacity
          style={styles.desktopPeriodButton}
          onPress={onMonthPress}
          activeOpacity={0.8}
        >
          <FontAwesome6
            name="calendar-days"
            size={13}
            color={colors.primaryBlue}
          />

          <Text style={styles.desktopPeriodButtonText}>
            {monthName.slice(0, 3)} {year}
          </Text>

          <FontAwesome6
            name="chevron-down"
            size={9}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.desktopChartLoading}>
          <ActivityIndicator size="small" color={colors.primaryBlue} />
        </View>
      ) : (
        <>
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
                        {Math.round(item.percentage)}%
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

          <View style={styles.desktopFinanceStrip}>
            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>Expenses</Text>

              <Text style={styles.desktopFinanceExpense}>
                {formatMoney(totalExpenses)}
              </Text>

              <Text style={styles.desktopFinanceHint}>
                {Math.round(expensePercentage)}% of revenue
              </Text>
            </View>

            <View style={styles.desktopFinanceDivider} />

            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>
                {profit >= 0 ? "Profit" : "Loss"}
              </Text>

              <Text
                style={
                  profit >= 0
                    ? styles.desktopFinanceProfit
                    : styles.desktopFinanceLoss
                }
              >
                {formatMoney(Math.abs(profit))}
              </Text>

              <Text style={styles.desktopFinanceHint}>
                {profit >= 0
                  ? `${Math.round(profitPercentage)}% of revenue`
                  : "Loss this month"}
              </Text>
            </View>

            <View style={styles.desktopFinanceDivider} />

            <View style={styles.desktopFinanceItem}>
              <Text style={styles.desktopFinanceLabel}>Revenue</Text>

              <Text style={styles.desktopFinanceRevenue}>
                {formatMoney(revenue)}
              </Text>

              <Text style={styles.desktopFinanceHint}>Total collected</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// ============================================================
// DESKTOP EMPTY EXPENSES
// ============================================================

function DesktopEmptyExpenses({ styles, colors }) {
  return (
    <View style={styles.desktopEmptyCard}>
      <View style={styles.desktopEmptyIcon}>
        <FontAwesome6 name="receipt" size={22} color={colors.textFaint} />
      </View>

      <Text style={styles.desktopEmptyTitle}>No expenses this month</Text>

      <Text style={styles.desktopEmptySubtitle}>
        Your library expenses will appear here.
      </Text>
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
              compact
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
                {profitPercentage.toFixed(1)}% of revenue
              </Text>
            </View>
          </View>

          {/* ==================================================
              PROFIT MESSAGE
          ================================================== */}

          {profit >= 0 && revenue > 0 ? (
            <View style={styles.profitMessage}>
              <View style={styles.profitMessageIcon}>
                <FontAwesome6
                  name="chart-line"
                  size={9}
                  color={colors.success}
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
          ) : null}
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
  compact = false,
}) {
  const size = compact ? 150 : 180;
  const strokeWidth = compact ? 20 : 25;

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
        {/* ==================================================
            BACKDROP
        ================================================== */}

        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* ==================================================
            MODAL
        ================================================== */}

        <View style={styles.periodModal}>
          {/* ==================================================
              HEADER
          ================================================== */}

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

          {/* ==================================================
              MONTH / YEAR TABS
          ================================================== */}

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

          {/* ==================================================
              FOOTER
          ================================================== */}

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
// ============================================================
// BILLING SCREEN STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // ROOT / MOBILE
    // ========================================================

    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scroll: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scrollContent: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 45,
    },
    listContent: {
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 40,
    },

    // ========================================================
    // MOBILE PERIOD HEADER
    // ========================================================

    mobilePeriodRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    mobilePeriodLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 2,
      fontWeight: "500",
    },

    mobilePeriodTitle: {
      fontSize: 17,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    mobilePeriodButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 11,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    mobilePeriodButtonText: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: "600",
    },

    // ========================================================
    // SUMMARY CARDS
    // ========================================================

    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 8,
    },

    summaryCard: {
      width: "48.5%",
      minHeight: 92,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 13,
      paddingVertical: 12,
      marginBottom: 10,
    },

    summaryCardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },

    summaryIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    summaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 5,
      fontWeight: "500",
    },

    summaryValue: {
      fontSize: 18,
      color: colors.textPrimary,
      fontWeight: "800",
      marginTop: 8,
    },

    // ========================================================
    // FINANCIAL OVERVIEW
    // ========================================================

    overviewCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },

    overviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 18,
    },

    overviewTitleArea: {
      flex: 1,
      paddingRight: 10,
    },

    chartTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    chartSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textMuted,
    },

    periodSelector: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 7,
      maxWidth: 130,
    },

    calendarIconBox: {
      width: 25,
      height: 25,
      borderRadius: 7,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 6,
    },

    periodSelectorText: {
      fontSize: 11,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    periodSelectorHint: {
      fontSize: 8,
      color: colors.textMuted,
      marginTop: 1,
    },

    chartLoading: {
      height: 230,
      alignItems: "center",
      justifyContent: "center",
    },

    donutSection: {
      flexDirection: "row",
      alignItems: "center",
      width: "100%",
      minHeight: 185,
    },

    donutWrap: {
      width: 145,
      height: 145,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    donutCenter: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },

    donutCenterIcon: {
      width: 22,
      height: 22,
      borderRadius: 7,
      backgroundColor: colors.successBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },

    donutCenterAmount: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    donutCenterLabel: {
      marginTop: 2,
      fontSize: 7,
      fontWeight: "700",
      color: colors.textMuted,
      letterSpacing: 0.4,
    },

    donutEmpty: {
      width: 150,
      height: 150,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    emptyDonutRing: {
      width: 125,
      height: 125,
      borderRadius: 100,
      borderWidth: 20,
      borderColor: colors.borderLight,
      position: "absolute",
    },

    donutEmptyAmount: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    breakdownList: {
      flex: 1,
      minWidth: 0,
      paddingLeft: 8,
    },

    breakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
      minWidth: 0,
    },

    breakdownDot: {
      width: 7,
      height: 7,
      borderRadius: 10,
      marginRight: 7,
    },

    breakdownNameWrap: {
      flex: 1,
      minWidth: 0,
    },

    breakdownName: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    breakdownPercent: {
      fontSize: 10,
      color: colors.textMuted,
      width: 34,
      textAlign: "right",
      fontWeight: "600",
    },

    profitPercent: {
      color: colors.success,
    },

    breakdownAmount: {
      width: 66,
      textAlign: "right",
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    noBreakdownBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },

    noBreakdown: {
      marginTop: 7,
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
      textAlign: "center",
    },

    // ========================================================
    // FINANCE SUMMARY
    // ========================================================

    financeSummary: {
      flexDirection: "row",
      alignItems: "stretch",
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      marginTop: 10,
      paddingTop: 14,
    },

    financeSummaryItem: {
      flex: 1,
      alignItems: "center",
    },

    financeSummaryDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
      marginHorizontal: 10,
    },

    financeSummaryLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: 4,
      fontWeight: "500",
    },

    financeSummaryExpense: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.danger,
    },

    financeSummaryProfit: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.success,
    },

    financeSummaryLoss: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.danger,
    },

    financeSummaryHint: {
      marginTop: 2,
      fontSize: 8,
      color: colors.textFaint,
    },

    // ========================================================
    // PROFIT MESSAGE
    // ========================================================

    profitMessage: {
      marginTop: 14,
      borderRadius: 10,
      backgroundColor: colors.successBg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 9,
      flexDirection: "row",
      alignItems: "center",
    },

    profitMessageIcon: {
      width: 25,
      height: 25,
      borderRadius: 8,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },

    profitMessageTextWrap: {
      flex: 1,
    },

    profitMessageTitle: {
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    profitMessageSubtitle: {
      fontSize: 8,
      color: colors.textMuted,
      marginTop: 2,
    },

    profitMessageAmount: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.success,
    },

    // ========================================================
    // EXPENSE SECTION
    // ========================================================

    expensesSection: {
      marginTop: 4,
      width: "100%",
    },

    expensesSectionHeader: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      minHeight: 42,
    },
    expensesHeaderText: {
      flex: 1,
      minWidth: 0,
      paddingRight: 10,
    },

    expensesTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    expensesSubtitle: {
      marginTop: 2,
      fontSize: 10,
      color: colors.textMuted,
    },

    addExpenseButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: colors.primaryBlue,
    },

    addExpenseButtonText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },

    sectionAddButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      flexShrink: 0,
      minWidth: 92,
      height: 34,
    },
    sectionAddButtonText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      flexShrink: 0,
    },

    // ========================================================
    // MOBILE EXPENSE ROW
    // ========================================================

    expenseRow: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 13,
      padding: 12,
      marginBottom: 9,
    },

    expenseRowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    expenseCategoryWrap: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    expenseCategoryIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 9,
    },

    expenseCategoryText: {
      flex: 1,
      minWidth: 0,
    },

    expenseCategoryName: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    expenseDate: {
      fontSize: 9,
      color: colors.textMuted,
      marginTop: 3,
    },

    expenseAmount: {
      marginLeft: 10,
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    expenseRowBottom: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 10,
      paddingTop: 9,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    expenseStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    expensePaidBadge: {
      backgroundColor: colors.successBg,
    },

    expensePendingBadge: {
      backgroundColor: colors.warningBg,
    },

    expenseStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 10,
      marginRight: 5,
    },

    expensePaidDot: {
      backgroundColor: colors.success,
    },

    expensePendingDot: {
      backgroundColor: colors.warning,
    },

    expenseStatusText: {
      fontSize: 8,
      fontWeight: "800",
    },

    expensePaidText: {
      color: colors.success,
    },

    expensePendingText: {
      color: colors.warning,
    },

    expenseActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    expenseActionButton: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    expenseDeleteButton: {
      backgroundColor: colors.dangerBg,
    },

    commentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginTop: 8,
      paddingTop: 7,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    expenseComment: {
      flex: 1,
      marginLeft: 6,
      fontSize: 9,
      lineHeight: 13,
      color: colors.textMuted,
    },

    // ========================================================
    // EMPTY STATE
    // ========================================================

    emptyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 30,
      paddingHorizontal: 20,
      alignItems: "center",
    },

    emptyIcon: {
      width: 50,
      height: 50,
      borderRadius: 15,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    emptySubtitle: {
      marginTop: 4,
      fontSize: 10,
      color: colors.textMuted,
      textAlign: "center",
    },

    emptyAddButton: {
      marginTop: 13,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
    },

    emptyAddButtonText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },

    // ========================================================
    // BILLING PERIOD MODAL
    // ========================================================

    periodOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 18,
    },

    periodModal: {
      width: "100%",
      maxWidth: 430,
      maxHeight: "85%",
      backgroundColor: colors.card,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },

    periodModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 13,
    },

    periodHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    periodHeaderIcon: {
      width: 35,
      height: 35,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    periodModalTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    periodModalSubtitle: {
      fontSize: 9,
      color: colors.textMuted,
      marginTop: 2,
    },

    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },

    closeText: {
      fontSize: 21,
      lineHeight: 22,
      color: colors.textSecondary,
      fontWeight: "300",
    },

    periodTabs: {
      flexDirection: "row",
      marginHorizontal: 16,
      backgroundColor: colors.bg,
      borderRadius: 10,
      padding: 3,
      marginBottom: 14,
    },

    periodTab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      borderRadius: 8,
    },

    periodTabActive: {
      backgroundColor: colors.card,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },

    periodTabText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: "600",
    },

    periodTabTextActive: {
      color: colors.primaryBlue,
      fontWeight: "800",
    },

    yearScroll: {
      maxHeight: 300,
    },

    yearGrid: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },

    yearItem: {
      width: "31.5%",
      minHeight: 44,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    yearItemActive: {
      borderColor: colors.primaryBlue,
      backgroundColor: colors.statBlueBg,
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
      position: "absolute",
      top: 4,
      right: 4,
      width: 15,
      height: 15,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
    },

    monthGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 16,
      paddingBottom: 15,
      justifyContent: "space-between",
    },

    monthItem: {
      width: "31.5%",
      minHeight: 47,
      marginBottom: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    monthItemActive: {
      borderColor: colors.primaryBlue,
      backgroundColor: colors.statBlueBg,
    },

    monthItemLocked: {
      opacity: 0.55,
    },

    monthItemText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    monthItemTextActive: {
      color: colors.primaryBlue,
      fontWeight: "800",
    },

    monthItemTextLocked: {
      color: colors.textFaint,
    },

    monthCheck: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 15,
      height: 15,
      borderRadius: 5,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    periodFooter: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    periodFooterText: {
      flex: 1,
      marginLeft: 6,
      fontSize: 8,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP BILLING
    // ========================================================

    desktopRoot: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    desktopScroll: {
      flex: 1,
    },

    desktopScrollContent: {
      padding: 24,
      paddingBottom: 40,
    },

    // ========================================================
    // DESKTOP PERIOD TOOLBAR
    // ========================================================

    periodToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },

    periodLabel: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    periodDescription: {
      marginTop: 4,
      fontSize: 11,
      color: colors.textMuted,
    },

    periodActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    periodButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    periodButtonText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    // ========================================================
    // DESKTOP SUMMARY GRID
    // ========================================================

    desktopSummaryGrid: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 18,
    },

    desktopSummaryCard: {
      flex: 1,
      minWidth: 180,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },

    desktopSummaryTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    desktopSummaryLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    desktopSummaryValue: {
      marginTop: 7,
      fontSize: 22,
      color: colors.textPrimary,
      fontWeight: "800",
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
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 15,
      padding: 18,
      marginBottom: 18,
    },

    desktopOverviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },

    desktopOverviewTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopOverviewSubtitle: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textMuted,
    },

    desktopPeriodButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },

    desktopPeriodButtonText: {
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    desktopChartLoading: {
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopOverviewBody: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 210,
    },

    desktopBreakdownList: {
      flex: 1,
      marginLeft: 35,
      paddingRight: 10,
    },

    desktopBreakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    desktopBreakdownDot: {
      width: 8,
      height: 8,
      borderRadius: 10,
      marginRight: 9,
    },

    desktopBreakdownName: {
      flex: 1,
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    desktopBreakdownPercent: {
      width: 55,
      textAlign: "right",
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: "600",
    },

    desktopBreakdownAmount: {
      width: 95,
      textAlign: "right",
      fontSize: 11,
      color: colors.textPrimary,
      fontWeight: "800",
    },

    desktopProfitText: {
      color: colors.success,
    },

    desktopNoData: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },

    desktopNoDataText: {
      marginTop: 8,
      maxWidth: 230,
      textAlign: "center",
      fontSize: 10,
      lineHeight: 15,
      color: colors.textMuted,
    },

    desktopFinanceStrip: {
      flexDirection: "row",
      alignItems: "stretch",
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      marginTop: 16,
      paddingTop: 15,
    },

    desktopFinanceItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopFinanceDivider: {
      width: 1,
      backgroundColor: colors.borderLight,
      marginHorizontal: 20,
    },

    desktopFinanceLabel: {
      fontSize: 10,
      color: colors.textMuted,
      marginBottom: 4,
    },

    desktopFinanceExpense: {
      fontSize: 15,
      color: colors.danger,
      fontWeight: "800",
    },

    desktopFinanceProfit: {
      fontSize: 15,
      color: colors.success,
      fontWeight: "800",
    },

    desktopFinanceLoss: {
      fontSize: 15,
      color: colors.danger,
      fontWeight: "800",
    },

    desktopFinanceRevenue: {
      fontSize: 15,
      color: colors.primaryBlue,
      fontWeight: "800",
    },

    desktopFinanceHint: {
      marginTop: 2,
      fontSize: 8,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP EXPENSE SECTION
    // ========================================================

    expensesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11,
    },

    expensesTitle: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "800",
    },

    expensesSubtitle: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textMuted,
    },

    expenseTable: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      overflow: "hidden",
    },

    expenseTableHeader: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.bg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 14,
    },

    tableHeaderText: {
      fontSize: 9,
      color: colors.textMuted,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },

    categoryColumn: {
      flex: 1.3,
    },

    dateColumn: {
      width: 115,
    },

    statusColumn: {
      width: 95,
    },

    commentColumn: {
      flex: 1,
    },

    amountColumn: {
      width: 100,
      textAlign: "right",
    },

    actionColumn: {
      width: 82,
      textAlign: "center",
    },

    expenseTableRow: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    expenseTableRowLast: {
      borderBottomWidth: 0,
    },

    categoryCell: {
      flex: 1.3,
      flexDirection: "row",
      alignItems: "center",
      minWidth: 0,
    },

    categoryIcon: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },

    categoryText: {
      flex: 1,
      fontSize: 10,
      color: colors.textPrimary,
      fontWeight: "700",
    },

    dateCell: {
      width: 115,
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    dateText: {
      fontSize: 9,
      color: colors.textSecondary,
    },

    statusCell: {
      width: 95,
    },

    desktopStatusBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
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
      borderRadius: 10,
      marginRight: 5,
    },

    desktopPaidDot: {
      backgroundColor: colors.success,
    },

    desktopPendingDot: {
      backgroundColor: colors.warning,
    },

    desktopStatusText: {
      fontSize: 7,
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
      minWidth: 0,
      gap: 5,
    },

    commentText: {
      flex: 1,
      fontSize: 9,
      color: colors.textMuted,
    },

    noCommentText: {
      fontSize: 10,
      color: colors.textFaint,
    },

    amountCell: {
      width: 100,
      alignItems: "flex-end",
    },

    amountText: {
      fontSize: 11,
      color: colors.textPrimary,
      fontWeight: "800",
    },

    actionsCell: {
      width: 82,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    tableActionButton: {
      width: 34,
      height: 34,

      borderRadius: 9,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",

      zIndex: 20,

      elevation: 20,

      cursor: "pointer",
    },

    tableDeleteButton: {
      backgroundColor: colors.dangerBg,
    },

    // ========================================================
    // DESKTOP EMPTY STATE
    // ========================================================

    desktopEmptyCard: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      minHeight: 220,
      alignItems: "center",
      justifyContent: "center",
      padding: 25,
    },

    desktopEmptyIcon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.bg,
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
      fontSize: 10,
      color: colors.textMuted,
      textAlign: "center",
    },
  });
}

// ============================================================
// DESKTOP BILLING STYLES
// ============================================================

function createDesktopBillingStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },

    loadingText: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textSecondary,
    },

    // ========================================================
    // MAIN DESKTOP SCROLL
    // ========================================================

    scroll: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 28,
    },

    // ========================================================
    // PERIOD TOOLBAR
    // ========================================================

    periodToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
      minHeight: 42,
    },

    periodLabel: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    periodDescription: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textSecondary,
    },

    periodActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    periodButton: {
      height: 36,
      minWidth: 140,
      paddingHorizontal: 11,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    periodButtonText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    addExpenseButton: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    addExpenseButtonText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },

    // ========================================================
    // SUMMARY CARDS
    // ========================================================

    summaryGrid: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },

    desktopSummaryCard: {
      flex: 1,
      height: 88,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    desktopSummaryTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    desktopSummaryLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    desktopSummaryValue: {
      marginTop: 6,
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopSummaryIcon: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // FINANCIAL OVERVIEW
    // ========================================================

    desktopOverviewCard: {
      backgroundColor: colors.card,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
    },

    desktopOverviewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    desktopOverviewTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopOverviewSubtitle: {
      marginTop: 2,
      fontSize: 9,
      color: colors.textSecondary,
    },

    desktopPeriodButton: {
      height: 32,
      paddingHorizontal: 9,
      borderRadius: 8,
      backgroundColor: colors.statBlueBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    desktopPeriodButtonText: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.primaryBlue,
    },

    desktopChartLoading: {
      height: 180,
      alignItems: "center",
      justifyContent: "center",
    },

    // --------------------------------------------------------
    // CHART BODY
    // --------------------------------------------------------

    desktopOverviewBody: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 155,
      maxHeight: 165,
    },

    desktopBreakdownList: {
      flex: 1,
      marginLeft: 20,
      justifyContent: "center",
    },

    desktopBreakdownRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 26,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    desktopBreakdownDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginRight: 8,
    },

    desktopBreakdownName: {
      flex: 1,
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    desktopBreakdownPercent: {
      width: 45,
      textAlign: "right",
      fontSize: 9,
      fontWeight: "600",
      color: colors.textMuted,
    },

    desktopBreakdownAmount: {
      width: 70,
      textAlign: "right",
      fontSize: 10,
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
    },

    desktopNoDataText: {
      marginTop: 7,
      maxWidth: 220,
      textAlign: "center",
      fontSize: 10,
      lineHeight: 14,
      color: colors.textFaint,
    },

    // ========================================================
    // FINANCE STRIP
    // ========================================================

    desktopFinanceStrip: {
      marginTop: 8,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      flexDirection: "row",
      alignItems: "center",
    },

    desktopFinanceItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopFinanceDivider: {
      width: 1,
      height: 38,
      backgroundColor: colors.borderLight,
      marginHorizontal: 12,
    },

    desktopFinanceLabel: {
      fontSize: 8,
      color: colors.textFaint,
      marginBottom: 3,
    },

    desktopFinanceExpense: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.danger,
    },

    desktopFinanceProfit: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.success,
    },

    desktopFinanceLoss: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.danger,
    },

    desktopFinanceRevenue: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopFinanceHint: {
      marginTop: 2,
      fontSize: 7,
      color: colors.textFaint,
    },

    // ========================================================
    // EXPENSE SECTION
    // ========================================================

    expensesSection: {
      backgroundColor: colors.card,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
    },

    expensesSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    expensesTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    expensesSubtitle: {
      marginTop: 2,
      fontSize: 9,
      color: colors.textSecondary,
    },

    sectionAddButton: {
      height: 32,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    sectionAddButtonText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "700",
    },

    // ========================================================
    // EXPENSE TABLE
    // ========================================================

    expenseTable: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
    },

    expenseTableHeader: {
      height: 34,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.borderLight,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    tableHeaderText: {
      fontSize: 7,
      fontWeight: "800",
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },

    expenseTableRow: {
      minHeight: 52,
      paddingHorizontal: 11,
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
      width: 80,
      textAlign: "right",
    },

    actionColumn: {
      width: 62,
      textAlign: "right",
    },

    categoryCell: {
      width: "23%",
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 8,
    },

    categoryIcon: {
      width: 27,
      height: 27,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 7,
    },

    categoryText: {
      flex: 1,
      fontSize: 9,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    dateCell: {
      width: "15%",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingRight: 5,
    },

    dateText: {
      fontSize: 8,
      color: colors.textSecondary,
    },

    statusCell: {
      width: "13%",
    },

    desktopStatusBadge: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },

    desktopPaidBadge: {
      backgroundColor: colors.successBg,
    },

    desktopPendingBadge: {
      backgroundColor: colors.warningBg,
    },

    desktopStatusDot: {
      width: 4,
      height: 4,
      borderRadius: 3,
    },

    desktopPaidDot: {
      backgroundColor: colors.success,
    },

    desktopPendingDot: {
      backgroundColor: colors.warning,
    },

    desktopStatusText: {
      fontSize: 7,
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
      gap: 4,
      paddingRight: 6,
      minWidth: 0,
    },

    commentText: {
      flex: 1,
      fontSize: 8,
      color: colors.textSecondary,
    },

    noCommentText: {
      fontSize: 9,
      color: colors.textFaint,
    },

    amountCell: {
      width: 80,
      alignItems: "flex-end",
    },

    amountText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    actionsCell: {
      width: 82,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      position: "relative",

      zIndex: 30,

      elevation: 30,
    },

    tableActionButton: {
      width: 25,
      height: 25,
      borderRadius: 7,
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
    // EMPTY
    // ========================================================

    desktopEmptyCard: {
      minHeight: 170,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.borderLight,
    },

    desktopEmptyIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    desktopEmptyTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopEmptySubtitle: {
      marginTop: 3,
      fontSize: 9,
      color: colors.textFaint,
    },

    // ========================================================
    // DESKTOP DONUT
    // ========================================================

    donutWrap: {
      width: 160,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },

    donutCenter: {
      position: "absolute",
      width: 100,
      alignItems: "center",
      justifyContent: "center",
    },

    donutCenterIcon: {
      width: 21,
      height: 21,
      borderRadius: 7,
      backgroundColor: colors.successBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
    },

    donutCenterAmount: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },

    donutCenterLabel: {
      fontSize: 6,
      fontWeight: "800",
      color: colors.textFaint,
      marginTop: 2,
      textAlign: "center",
      letterSpacing: 0.3,
    },

    donutEmpty: {
      width: 160,
      height: 160,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyDonutRing: {
      width: 135,
      height: 135,
      borderRadius: 70,
      borderWidth: 22,
      borderColor: colors.borderLight,
    },

    donutEmptyAmount: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textPrimary,
      marginTop: 4,
    },
  });
}
