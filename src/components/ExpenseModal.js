import React, { useEffect, useState } from "react";

import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  useWindowDimensions,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";

import AppInput from "./AppInput";
import PrimaryButton from "./PrimaryButton";

import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, spacing } from "../theme/colors";

// ============================================================
// CATEGORIES
// ============================================================

const CATEGORIES = [
  {
    key: "Electricity",
    label: "Electricity",
    description: "Power & electricity bills",
    icon: "bolt",
    color: "#f59e0b",
    bg: "#fff7e6",
  },
  {
    key: "Water",
    label: "Water",
    description: "Water & utility bills",
    icon: "droplet",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    key: "Employee",
    label: "Employee",
    description: "Staff salary & payments",
    icon: "user-tie",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    key: "Wifi",
    label: "WiFi",
    description: "Internet & connectivity",
    icon: "wifi",
    color: "#06b6d4",
    bg: "#ecfeff",
  },
  {
    key: "Rent",
    label: "Rent",
    description: "Library rent & property",
    icon: "house",
    color: "#ef4444",
    bg: "#fef2f2",
  },
  {
    key: "Other",
    label: "Other",
    description: "Other library expenses",
    icon: "receipt",
    color: "#64748b",
    bg: "#f8fafc",
  },
];

// ============================================================
// TODAY
// ============================================================

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ============================================================
// CATEGORY FINDER
// ============================================================

function getCategory(category) {
  return (
    CATEGORIES.find(
      (item) => item.key.toLowerCase() === String(category || "").toLowerCase()
    ) || CATEGORIES[CATEGORIES.length - 1]
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ExpenseModal({
  visible,
  initial,
  onClose,
  onSave,
  loading,
}) {
  const { width } = useWindowDimensions();

  // Mobile = bottom sheet
  // Tablet/Desktop = centered modal
  const isLargeScreen = width >= 768;
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  // ==========================================================
  // STATE
  // ==========================================================

  const [category, setCategory] = useState("Other");

  const [amount, setAmount] = useState("");

  const [date, setDate] = useState(getToday());

  const [status, setStatus] = useState("PAID");

  const [comment, setComment] = useState("");

  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // ==========================================================
  // INITIALIZE FORM
  // ==========================================================

  useEffect(() => {
    if (!visible) return;

    setCategory(initial?.category || "Other");

    setAmount(initial ? String(initial.amount ?? "") : "");

    setDate(initial?.expenseDate || getToday());

    setStatus(initial?.status || "PAID");

    setComment(initial?.comment || "");

    setCategoryPickerVisible(false);
  }, [visible, initial]);

  // ==========================================================
  // SELECTED CATEGORY
  // ==========================================================

  const selectedCategory = getCategory(category);

  // ==========================================================
  // SAVE
  // ==========================================================

  const handleSave = () => {
    Keyboard.dismiss();

    const finalDate = date?.trim() || getToday();

    onSave({
      category: category || "Other",

      amount,

      expenseDate: finalDate,

      status,

      comment: comment.trim(),
    });
  };

  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {
    if (loading) return;

    Keyboard.dismiss();

    setCategoryPickerVisible(false);

    onClose();
  };

  // ==========================================================
  // OPEN CATEGORY PICKER
  // ==========================================================

  const openCategoryPicker = () => {
    if (loading) return;

    Keyboard.dismiss();

    setCategoryPickerVisible(true);
  };

  // ==========================================================
  // CLOSE CATEGORY PICKER
  // ==========================================================

  const closeCategoryPicker = () => {
    setCategoryPickerVisible(false);
  };

  // ==========================================================
  // SELECT CATEGORY
  // ==========================================================

  const handleCategorySelect = (selected) => {
    setCategory(selected.key);

    setCategoryPickerVisible(false);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, isLargeScreen && styles.largeScreenOverlay]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ====================================================
            BACKDROP
        ==================================================== */}

        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* ====================================================
            MAIN SHEET
        ==================================================== */}

        <View style={[styles.sheet, isLargeScreen && styles.largeScreenSheet]}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <FontAwesome6
                  name={initial ? "pen" : "receipt"}
                  size={15}
                  color={colors.primaryBlue}
                />
              </View>

              <View style={styles.headerTextWrap}>
                <Text style={styles.title}>
                  {initial ? "Edit Expense" : "Add Expense"}
                </Text>

                <Text style={styles.subtitle}>
                  {initial
                    ? "Update your library expenditure"
                    : "Record a new library expenditure"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleClose}
              disabled={loading}
              style={styles.closeButton}
              hitSlop={10}
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {/* ==================================================
              FORM
          ================================================== */}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            {/* =================================================
                CATEGORY
            ================================================= */}

            <FormSection
              icon="layer-group"
              title="Expense Category"
              colors={colors}
            />

            <Pressable
              style={styles.categorySelector}
              onPress={openCategoryPicker}
              disabled={loading}
              android_ripple={{
                color: "#eaf2ff",
              }}
            >
              <View style={styles.categorySelectorLeft}>
                <View
                  style={[
                    styles.categoryIcon,
                    {
                      backgroundColor: isDarkMode
                        ? colors.statBlueBg
                        : selectedCategory.bg,
                    },
                  ]}
                >
                  <FontAwesome6
                    name={selectedCategory.icon}
                    size={16}
                    color={selectedCategory.color}
                  />
                </View>

                <View style={styles.categoryTextWrap}>
                  <Text style={styles.categoryName}>
                    {selectedCategory.label}
                  </Text>

                  <Text style={styles.categoryDescription}>
                    {selectedCategory.description}
                  </Text>
                </View>
              </View>

              <View style={styles.chevronBox}>
                <FontAwesome6
                  name="chevron-right"
                  size={10}
                  color={colors.textSecondary}
                />
              </View>
            </Pressable>

            {/* =================================================
                AMOUNT
            ================================================= */}

            <FormSection
              icon="indian-rupee-sign"
              title="Amount"
              colors={colors}
            />

            <View style={styles.amountContainer}>
              <View style={styles.currencyBox}>
                <Text style={styles.currencyText}>₹</Text>
              </View>

              <AppInput
                value={amount}
                onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                placeholder="0"
                style={styles.amountInput}
              />

              <Text style={styles.amountHint}>INR</Text>
            </View>

            {/* =================================================
                DATE
            ================================================= */}

            <FormSection icon="calendar" title="Expense Date" colors={colors} />

            <View style={styles.dateContainer}>
              <View style={styles.dateIconBox}>
                <FontAwesome6
                  name="calendar"
                  size={14}
                  color={colors.primaryBlue}
                />
              </View>

              <AppInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                style={styles.dateInput}
              />

              {date === getToday() && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>TODAY</Text>
                </View>
              )}
            </View>

            {/* =================================================
                COMMENT
            ================================================= */}

            <View style={styles.commentHeader}>
              <FormSection
                icon="comment"
                title="Comment"
                colors={colors}
                noMargin
              />

              <Text style={styles.optional}>Optional</Text>
            </View>

            <View style={styles.commentContainer}>
              <AppInput
                value={comment}
                onChangeText={setComment}
                placeholder="Add a note about this expense..."
                multiline
                style={styles.commentInput}
              />
            </View>

            <Text style={styles.helperText}>
              Add any useful details, invoice number, or payment reference.
            </Text>

            {/* =================================================
                STATUS
            ================================================= */}

            <FormSection
              icon="circle-check"
              title="Payment Status"
              colors={colors}
            />

            <View style={styles.statusRow}>
              {/* PAID */}

              <Pressable
                style={[
                  styles.statusCard,
                  status === "PAID" && styles.statusCardPaid,
                ]}
                onPress={() => setStatus("PAID")}
                disabled={loading}
              >
                <View
                  style={[
                    styles.statusIcon,
                    status === "PAID" && styles.statusIconPaid,
                  ]}
                >
                  <FontAwesome6
                    name="circle-check"
                    size={14}
                    color={status === "PAID" ? "#10b981" : colors.textMuted}
                  />
                </View>

                <View style={styles.statusTextWrap}>
                  <Text
                    style={[
                      styles.statusTitle,
                      status === "PAID" && styles.statusTitleActive,
                    ]}
                  >
                    Paid
                  </Text>

                  <Text style={styles.statusSubtitle}>Payment completed</Text>
                </View>

                {status === "PAID" && (
                  <View style={styles.selectedCheck}>
                    <FontAwesome6 name="check" size={9} color="#fff" />
                  </View>
                )}
              </Pressable>

              {/* PENDING */}

              <Pressable
                style={[
                  styles.statusCard,
                  status === "PENDING" && styles.statusCardPending,
                ]}
                onPress={() => setStatus("PENDING")}
                disabled={loading}
              >
                <View
                  style={[
                    styles.statusIcon,
                    status === "PENDING" && styles.statusIconPending,
                  ]}
                >
                  <FontAwesome6
                    name="clock"
                    size={14}
                    color={status === "PENDING" ? "#f59e0b" : colors.textMuted}
                  />
                </View>

                <View style={styles.statusTextWrap}>
                  <Text
                    style={[
                      styles.statusTitle,
                      status === "PENDING" && styles.statusTitlePending,
                    ]}
                  >
                    Pending
                  </Text>

                  <Text style={styles.statusSubtitle}>
                    Payment not completed
                  </Text>
                </View>

                {status === "PENDING" && (
                  <View
                    style={[styles.selectedCheck, styles.selectedCheckPending]}
                  >
                    <FontAwesome6 name="check" size={9} color="#fff" />
                  </View>
                )}
              </Pressable>
            </View>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <View style={styles.actionArea}>
              <PrimaryButton
                title={initial ? "Update Expense" : "Save Expense"}
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                style={styles.saveButton}
              />

              <Pressable
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* ==================================================
              CATEGORY PICKER

              IMPORTANT:
              This is now a REAL Modal instead of a View
              inside the Add Expense sheet.
          ================================================== */}

          <Modal
            visible={categoryPickerVisible}
            transparent
            animationType="slide"
            statusBarTranslucent
            presentationStyle="overFullScreen"
            onRequestClose={closeCategoryPicker}
          >
            <View style={styles.categoryModalOverlay}>
              <Pressable
                style={styles.categoryBackdrop}
                onPress={closeCategoryPicker}
              />

              <View style={styles.categoryPanel}>
                <View style={styles.pickerHeader}>
                  <View style={styles.pickerHeaderLeft}>
                    <View style={styles.pickerHeaderIcon}>
                      <FontAwesome6
                        name="layer-group"
                        size={15}
                        color={colors.primaryBlue}
                      />
                    </View>

                    <View style={styles.pickerHeaderTextWrap}>
                      <Text style={styles.pickerTitle}>Select Category</Text>

                      <Text style={styles.pickerSubtitle}>
                        Choose an expense category
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={closeCategoryPicker}
                    style={styles.closeButton}
                    hitSlop={10}
                  >
                    <FontAwesome6
                      name="xmark"
                      size={14}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.categoryList}
                  contentContainerStyle={styles.categoryListContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {CATEGORIES.map((item) => {
                    const active = item.key === category;

                    return (
                      <Pressable
                        key={item.key}
                        style={[
                          styles.categoryRow,
                          active && styles.categoryRowActive,
                        ]}
                        onPress={() => handleCategorySelect(item)}
                      >
                        <View
                          style={[
                            styles.categoryRowIcon,
                            {
                              backgroundColor: isDarkMode
                                ? colors.statBlueBg
                                : item.bg,
                            },
                          ]}
                        >
                          <FontAwesome6
                            name={item.icon}
                            size={15}
                            color={item.color}
                          />
                        </View>

                        <View style={styles.categoryRowTextWrap}>
                          <Text
                            style={[
                              styles.categoryRowText,
                              active && styles.categoryRowTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>

                          <Text style={styles.categoryRowDescription}>
                            {item.description}
                          </Text>
                        </View>

                        {active && (
                          <View style={styles.checkCircle}>
                            <FontAwesome6 name="check" size={10} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================
// FORM SECTION
// ============================================================

function FormSection({ icon, title, colors, noMargin = false }) {
  const styles = createStyles(colors);

  return (
    <View style={[styles.formSection, noMargin && styles.formSectionNoMargin]}>
      <View style={styles.formSectionIcon}>
        <FontAwesome6 name={icon} size={11} color={colors.primaryBlue} />
      </View>

      <Text style={styles.formSectionTitle}>{title}</Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    // ========================================================
    // OVERLAY
    // ========================================================

    overlay: {
      flex: 1,

      justifyContent: "flex-end",

      backgroundColor: "rgba(0, 0, 0, 0.48)",
    },
    largeScreenOverlay: {
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 24,
    },

    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },

    // ========================================================
    // SHEET
    // ========================================================

    sheet: {
      width: "100%",

      maxHeight: "94%",

      backgroundColor: colors.card,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      overflow: "hidden",

      borderWidth: 1,
      borderBottomWidth: 0,

      borderColor: colors.border,
    },
    largeScreenSheet: {
      width: "100%",
      maxWidth: 680,
      maxHeight: "88%",

      alignSelf: "center",

      borderRadius: 20,

      overflow: "hidden",

      elevation: 12,

      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 10,
      },
    },

    // ========================================================
    // HEADER
    // ========================================================

    header: {
      minHeight: 76,

      paddingHorizontal: spacing.md,

      paddingVertical: 12,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      backgroundColor: colors.card,

      borderBottomWidth: 1,

      borderBottomColor: colors.border,
    },

    headerLeft: {
      flexDirection: "row",

      alignItems: "center",

      flex: 1,

      minWidth: 0,
    },

    headerIcon: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 11,
    },

    headerTextWrap: {
      flex: 1,

      minWidth: 0,
    },

    title: {
      fontSize: 18,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    subtitle: {
      marginTop: 3,

      fontSize: 11.5,

      color: colors.textSecondary,
    },

    closeButton: {
      width: 36,
      height: 36,

      borderRadius: 18,

      backgroundColor: colors.bg,

      alignItems: "center",

      justifyContent: "center",

      marginLeft: 10,
    },

    // ========================================================
    // SCROLL
    // ========================================================

    scroll: {
      flexGrow: 0,
    },

    scrollContent: {
      paddingHorizontal: spacing.md,

      paddingTop: 16,

      paddingBottom: 24,
    },

    // ========================================================
    // FORM SECTION
    // ========================================================

    formSection: {
      flexDirection: "row",

      alignItems: "center",

      marginTop: 17,

      marginBottom: 9,
    },

    formSectionNoMargin: {
      marginTop: 0,

      marginBottom: 0,
    },

    formSectionIcon: {
      width: 26,
      height: 26,

      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 8,
    },

    formSectionTitle: {
      fontSize: 13,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    // ========================================================
    // CATEGORY SELECTOR
    // ========================================================

    categorySelector: {
      minHeight: 66,

      width: "100%",

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      paddingHorizontal: 11,

      paddingVertical: 9,

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: 12,
    },

    categorySelectorLeft: {
      flexDirection: "row",

      alignItems: "center",

      flex: 1,

      minWidth: 0,
    },

    categoryIcon: {
      width: 42,
      height: 42,

      borderRadius: 11,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 10,
    },

    categoryTextWrap: {
      flex: 1,

      minWidth: 0,
    },

    categoryName: {
      fontSize: 14,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    categoryDescription: {
      marginTop: 3,

      fontSize: 11,

      color: colors.textSecondary,
    },

    chevronBox: {
      width: 30,
      height: 30,

      borderRadius: 15,

      backgroundColor: colors.card,

      alignItems: "center",

      justifyContent: "center",

      marginLeft: 8,

      borderWidth: 1,

      borderColor: colors.border,
    },

    // ========================================================
    // AMOUNT
    // ========================================================

    amountContainer: {
      minHeight: 52,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: 12,

      paddingLeft: 10,

      paddingRight: 9,
    },

    currencyBox: {
      width: 34,
      height: 34,

      borderRadius: 9,

      backgroundColor: colors.statGreenBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 7,
    },

    currencyText: {
      fontSize: 17,

      fontWeight: "800",

      color: colors.primaryGreen,
    },

    amountInput: {
      flex: 1,

      marginBottom: 0,

      paddingHorizontal: 4,

      paddingVertical: 8,

      minHeight: 48,

      borderWidth: 0,

      backgroundColor: "transparent",

      fontSize: 16,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    amountHint: {
      fontSize: 10,

      fontWeight: "700",

      color: colors.textMuted,

      marginLeft: 5,
    },

    // ========================================================
    // DATE
    // ========================================================

    dateContainer: {
      minHeight: 52,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: 12,

      paddingLeft: 9,

      paddingRight: 9,
    },

    dateIconBox: {
      width: 34,
      height: 34,

      borderRadius: 9,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 7,
    },

    dateInput: {
      flex: 1,

      marginBottom: 0,

      paddingHorizontal: 4,

      paddingVertical: 8,

      minHeight: 48,

      borderWidth: 0,

      backgroundColor: "transparent",

      fontSize: 14,

      color: colors.textPrimary,
    },

    todayBadge: {
      paddingHorizontal: 8,

      paddingVertical: 5,

      borderRadius: 8,

      backgroundColor: colors.successBg,

      marginLeft: 5,
    },

    todayText: {
      fontSize: 9,

      fontWeight: "800",

      color: colors.success,
    },

    // ========================================================
    // COMMENT
    // ========================================================

    commentHeader: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      marginTop: 17,

      marginBottom: 9,
    },

    optional: {
      fontSize: 10,

      fontWeight: "600",

      color: colors.textMuted,
    },

    commentContainer: {
      minHeight: 90,

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: 12,

      paddingHorizontal: 10,

      paddingTop: 6,
    },

    commentInput: {
      minHeight: 76,

      marginBottom: 0,

      borderWidth: 0,

      backgroundColor: "transparent",

      paddingHorizontal: 3,

      paddingVertical: 8,

      textAlignVertical: "top",

      fontSize: 13,

      color: colors.textPrimary,
    },

    helperText: {
      fontSize: 10.5,

      lineHeight: 15,

      color: colors.textMuted,

      marginTop: 6,

      marginLeft: 2,
    },

    // ========================================================
    // STATUS
    // ========================================================

    statusRow: {
      flexDirection: "row",

      gap: 10,
    },

    statusCard: {
      flex: 1,

      minHeight: 70,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 9,

      paddingVertical: 9,

      borderRadius: 12,

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    statusCardPaid: {
      backgroundColor: colors.successBg,

      borderColor: colors.success,
    },

    statusCardPending: {
      backgroundColor: colors.warningBg,

      borderColor: colors.warning,
    },

    statusIcon: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 8,
    },

    statusIconPaid: {
      backgroundColor: colors.successBg,
    },

    statusIconPending: {
      backgroundColor: colors.warningBg,
    },

    statusTextWrap: {
      flex: 1,

      minWidth: 0,
    },

    statusTitle: {
      fontSize: 12.5,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    statusTitleActive: {
      color: colors.success,
    },

    statusTitlePending: {
      color: colors.warning,
    },

    statusSubtitle: {
      marginTop: 2,

      fontSize: 9.5,

      lineHeight: 13,

      color: colors.textMuted,
    },

    selectedCheck: {
      width: 18,
      height: 18,

      borderRadius: 9,

      backgroundColor: colors.success,

      alignItems: "center",

      justifyContent: "center",

      marginLeft: 4,
    },

    selectedCheckPending: {
      backgroundColor: colors.warning,
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actionArea: {
      marginTop: 22,

      gap: 9,
    },

    saveButton: {
      minHeight: 48,

      borderRadius: 12,
    },

    cancelButton: {
      minHeight: 44,

      borderRadius: 11,

      alignItems: "center",

      justifyContent: "center",

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    cancelText: {
      fontSize: 13,

      fontWeight: "600",

      color: colors.textSecondary,
    },

    // ========================================================
    // CATEGORY MODAL OVERLAY
    // ========================================================

    categoryModalOverlay: {
      flex: 1,

      justifyContent: "flex-end",

      backgroundColor: "transparent",
    },

    categoryBackdrop: {
      ...StyleSheet.absoluteFillObject,

      backgroundColor: "rgba(0, 0, 0, 0.48)",
    },

    // ========================================================
    // CATEGORY PANEL
    // ========================================================

    categoryPanel: {
      width: "100%",

      maxHeight: "88%",

      backgroundColor: colors.card,

      borderTopLeftRadius: 22,

      borderTopRightRadius: 22,

      overflow: "hidden",

      borderWidth: 1,

      borderBottomWidth: 0,

      borderColor: colors.border,
    },

    pickerHeader: {
      minHeight: 72,

      paddingHorizontal: spacing.md,

      paddingVertical: 10,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      borderBottomWidth: 1,

      borderBottomColor: colors.border,
    },

    pickerHeaderLeft: {
      flexDirection: "row",

      alignItems: "center",

      flex: 1,

      minWidth: 0,
    },

    pickerHeaderTextWrap: {
      flex: 1,

      minWidth: 0,
    },

    pickerHeaderIcon: {
      width: 40,
      height: 40,

      borderRadius: 11,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 10,
    },

    pickerTitle: {
      fontSize: 16,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    pickerSubtitle: {
      marginTop: 2,

      fontSize: 10.5,

      color: colors.textSecondary,
    },

    categoryList: {
      flexGrow: 0,
    },

    categoryListContent: {
      paddingHorizontal: spacing.md,

      paddingTop: 10,

      paddingBottom: Platform.OS === "ios" ? 28 : 18,
    },

    categoryRow: {
      minHeight: 64,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 9,

      paddingVertical: 8,

      marginBottom: 8,

      borderRadius: 12,

      backgroundColor: colors.bg,

      borderWidth: 1,

      borderColor: colors.border,
    },

    categoryRowActive: {
      borderColor: colors.primaryBlue,

      backgroundColor: colors.statBlueBg,
    },

    categoryRowIcon: {
      width: 40,
      height: 40,

      borderRadius: 10,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 10,
    },

    categoryRowTextWrap: {
      flex: 1,

      minWidth: 0,
    },

    categoryRowText: {
      fontSize: 13,

      fontWeight: "700",

      color: colors.textPrimary,
    },

    categoryRowTextActive: {
      color: colors.primaryBlue,
    },

    categoryRowDescription: {
      marginTop: 2,

      fontSize: 10.5,

      color: colors.textSecondary,
    },

    checkCircle: {
      width: 22,
      height: 22,

      borderRadius: 11,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",

      justifyContent: "center",

      marginLeft: 8,
    },
  });
}
