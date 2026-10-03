import React, { useCallback, useState } from "react";

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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";

import Header from "../components/Header";
import DesktopLayout from "../components/DesktopLayout";
import AppInput from "../components/AppInput";
import PrimaryButton from "../components/PrimaryButton";

import { useAuth } from "../context/AuthContext";

import {
  getHalfDayStudents,
  createHalfDayStudent,
  vacateHalfDayStudent,
  updateHalfDayStudent,
} from "../api/halfday";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

// ============================================================
// HALF DAY STUDENTS
// ============================================================

export default function HalfDayStudentsScreen() {
  const navigation = useNavigation();
  const { libraryId } = useAuth();

  const { isDarkMode } = useTheme();

  const themeColors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();

  /*
   * Desktop/tablet web layout.
   *
   * Mobile remains exactly as before.
   */
  const isDesktop = Platform.OS === "web" && width >= 900;
  const styles = createStyles(themeColors);

  // ==========================================================
  // DATA
  // ==========================================================

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);

  // ==========================================================
  // ADD STUDENT
  // ==========================================================

  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [slot, setSlot] = useState("MORNING");

  const [amount, setAmount] = useState("");

  const [saving, setSaving] = useState(false);
  // ==========================================================
  // EDIT HALF DAY STUDENT
  // ==========================================================

  const [editModalVisible, setEditModalVisible] = useState(false);

  const [editingStudent, setEditingStudent] = useState(null);

  const [editName, setEditName] = useState("");

  const [editPhone, setEditPhone] = useState("");

  const [editSlot, setEditSlot] = useState("MORNING");

  const [editAmount, setEditAmount] = useState("");

  const [editExpiryDate, setEditExpiryDate] = useState("");

  const [editExpiryDateValue, setEditExpiryDateValue] = useState(new Date());

  const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);

  const [editSaving, setEditSaving] = useState(false);

  // ==========================================================
  // LOAD
  // ==========================================================

  const load = useCallback(() => {
    if (!libraryId) {
      return;
    }

    setLoading(true);

    getHalfDayStudents(libraryId)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];

        setStudents(list);

        /*
         * Keep selected student valid after refresh.
         */
        setSelected((current) => {
          if (!current) {
            return null;
          }

          return list.find((item) => item.id === current.id) || null;
        });
      })
      .catch((err) => {
        console.error("❌ Half day load failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [libraryId]);

  const handleUpdateHalfDayStudent = async () => {
    if (!editingStudent?.id) {
      Alert.alert("Error", "Student ID is missing.");
      return;
    }

    if (!editName.trim()) {
      Alert.alert("Required", "Please enter student name.");
      return;
    }

    if (!editPhone.trim()) {
      Alert.alert("Required", "Please enter phone number.");
      return;
    }

    if (!editAmount.trim()) {
      Alert.alert("Required", "Please enter fees.");
      return;
    }

    if (!editExpiryDate) {
      Alert.alert("Required", "Please select expiry date.");
      return;
    }

    setEditSaving(true);

    try {
      const payload = {
        name: editName.trim(),
        phone: editPhone.trim(),
        amount: Number(editAmount),
        halfDaySlot: editSlot,
        expiryDate: editExpiryDate,
      };

      console.log("✏️ Updating Half Day student:", {
        id: editingStudent.id,
        payload,
      });

      await updateHalfDayStudent(editingStudent.id, payload);

      Alert.alert("Updated", "Half Day student updated successfully.");

      closeEditModal();

      await load();
    } catch (err) {
      console.error("❌ Half Day update failed:", err?.response?.data || err);

      Alert.alert(
        "Update Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update Half Day student."
      );
    } finally {
      setEditSaving(false);
    }
  };

  // ==========================================================
  // Open Edit Modal
  // ==========================================================

  const openEditModal = (student) => {
    if (!student) {
      return;
    }

    console.log("✏️ Opening Half Day edit:", student);

    setEditingStudent(student);

    setEditName(student.name || "");

    setEditPhone(student.phone || "");

    setEditSlot(student.halfDaySlot || "MORNING");

    setEditAmount(
      student.amount != null
        ? String(student.amount)
        : student.amountPaid != null
        ? String(student.amountPaid)
        : ""
    );

    const existingExpiryDate = student.expiryDate || student.endDate || "";

    setEditExpiryDate(existingExpiryDate);

    if (existingExpiryDate) {
      const parsedDate = new Date(existingExpiryDate);

      if (!Number.isNaN(parsedDate.getTime())) {
        setEditExpiryDateValue(parsedDate);
      }
    }

    setEditDatePickerVisible(false);

    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (editSaving) {
      return;
    }

    setEditModalVisible(false);

    setEditingStudent(null);

    setEditName("");

    setEditPhone("");

    setEditSlot("MORNING");

    setEditAmount("");

    setEditExpiryDate("");
    setEditDatePickerVisible(false);
    setEditExpiryDateValue(new Date());
  };

  // ==========================================================
  // SCREEN FOCUS
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // ==========================================================
  // OPEN ADD MODAL
  // ==========================================================

  const openAddModal = () => {
    setName("");

    setPhone("");

    setSlot("MORNING");

    setAmount("");

    setModalVisible(true);
  };

  // ==========================================================
  // CLOSE ADD MODAL
  // ==========================================================

  const closeAddModal = () => {
    if (saving) {
      return;
    }

    setModalVisible(false);

    setName("");

    setPhone("");

    setSlot("MORNING");

    setAmount("");
  };

  // ==========================================================
  // CREATE STUDENT
  // ==========================================================

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter student name.");

      return;
    }

    if (!phone.trim()) {
      Alert.alert("Required", "Please enter phone number.");

      return;
    }

    if (!amount.trim()) {
      Alert.alert("Required", "Please enter fees.");

      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please try again.");

      return;
    }

    setSaving(true);

    try {
      await createHalfDayStudent(libraryId, {
        name: name.trim(),
        phone: phone.trim(),
        amount: amount.trim(),
        halfDaySlot: slot,
      });

      setModalVisible(false);

      setName("");

      setPhone("");

      setSlot("MORNING");

      setAmount("");

      load();
    } catch (err) {
      console.error("❌ Failed to save half day student:", err);

      Alert.alert(
        "Failed to save student",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save student."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // VACATE
  // ==========================================================

  const handleVacate = (id) => {
    if (!id) {
      console.error("❌ Vacate failed: student ID is missing");
      return;
    }

    console.log("🗑️ Vacate clicked:", id);

    const performVacate = async () => {
      try {
        console.log("🗑️ Vacating Half Day student:", id);

        await vacateHalfDayStudent(id);

        console.log("✅ Half Day student vacated successfully:", id);

        // Clear selected student
        if (selected?.id === id) {
          setSelected(null);
        }

        // Refresh list
        await load();
      } catch (err) {
        console.error(
          "❌ Failed to vacate half day student:",
          err?.response?.data || err
        );

        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Unable to vacate student.";

        if (Platform.OS === "web") {
          window.alert(`Failed\n\n${message}`);
        } else {
          Alert.alert("Failed", message);
        }
      }
    };

    // WEB
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to vacate this Half Day student?"
      );

      if (confirmed) {
        performVacate();
      }

      return;
    }

    // MOBILE
    Alert.alert(
      "Vacate this student?",
      "Are you sure you want to vacate this Half Day student?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Vacate",
          style: "destructive",
          onPress: performVacate,
        },
      ]
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  // ==========================================================
  // UI
  // ==========================================================

  const desktopHeaderRight = (
    <TouchableOpacity
      style={styles.desktopHeaderAddButton}
      onPress={openAddModal}
      activeOpacity={0.8}
    >
      <FontAwesome6 name="plus" size={12} color="#FFFFFF" />

      <Text style={styles.desktopHeaderAddButtonText}>
        Add Half Day Student
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ======================================================
        DESKTOP / TABLET
        ====================================================== */}

      {isDesktop ? (
        <DesktopLayout
          activeRoute="HalfDayStudents"
          title="Half Day Students"
          subtitle="Manage morning and evening shift members"
          headerRight={desktopHeaderRight}
        >
          <View style={styles.desktopPage}>
            <DesktopHalfDayLayout
              students={students}
              loading={loading}
              selected={selected}
              setSelected={setSelected}
              handleVacate={handleVacate}
              onEdit={openEditModal}
              colors={themeColors}
              // EDIT MODAL
              editModalVisible={editModalVisible}
              closeEditModal={closeEditModal}
              editSaving={editSaving}
              editName={editName}
              setEditName={setEditName}
              editPhone={editPhone}
              setEditPhone={setEditPhone}
              editSlot={editSlot}
              setEditSlot={setEditSlot}
              editAmount={editAmount}
              setEditAmount={setEditAmount}
              editExpiryDate={editExpiryDate}
              setEditExpiryDate={setEditExpiryDate}
              handleUpdateHalfDayStudent={handleUpdateHalfDayStudent}
            />
          </View>
        </DesktopLayout>
      ) : (
        <>
          {/* ====================================================
            MOBILE HEADER
            ==================================================== */}

          <Header title="Half Day Students" />

          {/* ====================================================
            MOBILE HEADER CONTENT
            ==================================================== */}

          <View style={styles.headerRow}>
            <Text style={styles.subtitle}>
              Morning & Evening shift members
              {"\n"}
              No fixed seats
            </Text>

            <TouchableOpacity
              style={styles.addBtn}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add Half Day Student</Text>
            </TouchableOpacity>
          </View>

          {/* ====================================================
            MOBILE STUDENT LIST
            ==================================================== */}

          {loading ? (
            <ActivityIndicator
              style={styles.loading}
              size="large"
              color={themeColors.primaryBlue}
            />
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No half day students yet.</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.row}>
                  {/* STUDENT INFO */}
                  <TouchableOpacity
                    style={styles.rowInfo}
                    onPress={() => setSelected(item)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name}
                    </Text>

                    <Text style={styles.rowMeta}>{item.phone}</Text>
                  </TouchableOpacity>

                  {/* SHIFT */}
                  <View
                    style={[
                      styles.badge,
                      item.halfDaySlot === "MORNING"
                        ? styles.badgeMorning
                        : styles.badgeEvening,
                    ]}
                  >
                    <Text
                      style={
                        item.halfDaySlot === "MORNING"
                          ? styles.badgeMorningText
                          : styles.badgeEveningText
                      }
                    >
                      {item.halfDaySlot}
                    </Text>
                  </View>

                  {/* ACTIONS */}
                  <View style={styles.mobileStudentActions}>
                    {/* EDIT */}
                    <TouchableOpacity
                      style={styles.mobileEditBtn}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome6
                        name="pen"
                        size={11}
                        color={themeColors.primaryBlue}
                      />

                      <Text style={styles.mobileEditBtnText}>Edit</Text>
                    </TouchableOpacity>

                    {/* VACATE */}
                    <TouchableOpacity
                      style={styles.vacateBtn}
                      onPress={() => handleVacate(item.id)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome6
                        name="trash"
                        size={11}
                        color={themeColors.danger}
                      />

                      <Text style={styles.vacateBtnText}>Vacate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* ======================================================
        MOBILE STUDENT DETAIL MODAL
        ====================================================== */}

      {!isDesktop && (
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={closeEditModal}
        >
          <KeyboardAvoidingView
            style={styles.keyboardOverlay}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            <Pressable style={styles.overlay} onPress={closeEditModal}>
              <Pressable
                style={styles.addSheet}
                onPress={(e) => e.stopPropagation()}
              >
                {/* HANDLE */}

                <View style={styles.sheetHandle} />

                {/* HEADER */}

                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderText}>
                    <Text style={styles.profileName}>
                      Edit Half Day Student
                    </Text>

                    <Text style={styles.modalSubtitle}>
                      Update student information
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={closeEditModal}
                    disabled={editSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* FORM */}

                <ScrollView
                  style={styles.formScroll}
                  contentContainerStyle={styles.formContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* NAME */}

                  <Text style={styles.label}>Name</Text>

                  <AppInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter student name"
                  />

                  {/* PHONE */}

                  <Text style={styles.label}>Phone</Text>

                  <AppInput
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />

                  {/* SHIFT */}

                  <Text style={styles.label}>Shift</Text>

                  <View style={styles.slotRow}>
                    {["MORNING", "EVENING"].map((value) => (
                      <Pressable
                        key={value}
                        onPress={() => setEditSlot(value)}
                        style={[
                          styles.slotChip,
                          editSlot === value && styles.slotChipActive,
                        ]}
                      >
                        <FontAwesome6
                          name={value === "MORNING" ? "sun" : "moon"}
                          size={12}
                          color={
                            editSlot === value
                              ? "#FFFFFF"
                              : themeColors.textSecondary
                          }
                        />

                        <Text
                          style={
                            editSlot === value
                              ? styles.slotTextActive
                              : styles.slotText
                          }
                        >
                          {value === "MORNING"
                            ? "Morning (6AM–2PM)"
                            : "Evening (2PM–10PM)"}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* FEES */}

                  <Text style={styles.label}>Fees</Text>

                  <AppInput
                    value={editAmount}
                    onChangeText={setEditAmount}
                    placeholder="400 / 500"
                    keyboardType="numeric"
                  />

                  {/* EXPIRY */}

                  <Text style={styles.label}>Expiry Date</Text>

                  <TouchableOpacity
                    style={styles.mobileDateField}
                    onPress={() => setEditDatePickerVisible(true)}
                    disabled={editSaving}
                    activeOpacity={0.8}
                  >
                    <FontAwesome6
                      name="calendar-days"
                      size={16}
                      color={themeColors.primaryBlue}
                    />

                    <Text
                      style={[
                        styles.mobileDateText,
                        !editExpiryDate && styles.mobileDatePlaceholder,
                      ]}
                    >
                      {editExpiryDate || "Select expiry date"}
                    </Text>

                    <FontAwesome6
                      name="chevron-down"
                      size={12}
                      color={themeColors.textMuted}
                    />
                  </TouchableOpacity>
                  <Modal
                    visible={editDatePickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setEditDatePickerVisible(false)}
                  >
                    <View style={styles.datePickerOverlay}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <View>
                            <Text style={styles.datePickerTitle}>
                              Select Expiry Date
                            </Text>

                            <Text style={styles.datePickerSubtitle}>
                              Choose expiry date
                            </Text>
                          </View>

                          <TouchableOpacity
                            onPress={() => setEditDatePickerVisible(false)}
                          >
                            <FontAwesome6
                              name="xmark"
                              size={18}
                              color={themeColors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>

                        <DateTimePicker
                          value={editExpiryDateValue}
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "inline" : "calendar"
                          }
                          onChange={(event, selectedDate) => {
                            if (!selectedDate) {
                              return;
                            }

                            setEditExpiryDateValue(selectedDate);

                            const year = selectedDate.getFullYear();

                            const month = String(
                              selectedDate.getMonth() + 1
                            ).padStart(2, "0");

                            const day = String(selectedDate.getDate()).padStart(
                              2,
                              "0"
                            );

                            setEditExpiryDate(`${year}-${month}-${day}`);

                            if (Platform.OS === "android") {
                              setEditDatePickerVisible(false);
                            }
                          }}
                        />

                        {Platform.OS === "ios" && (
                          <TouchableOpacity
                            style={styles.datePickerDoneButton}
                            onPress={() => setEditDatePickerVisible(false)}
                          >
                            <Text style={styles.datePickerDoneText}>Done</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </Modal>

                  {/* BUTTONS */}

                  <PrimaryButton
                    title={editSaving ? "Updating..." : "Update Student"}
                    onPress={handleUpdateHalfDayStudent}
                    loading={editSaving}
                    style={styles.saveButton}
                  />

                  <PrimaryButton
                    title="Cancel"
                    variant="light"
                    onPress={closeEditModal}
                    disabled={editSaving}
                    style={styles.cancelModalButton}
                  />

                  <View style={styles.bottomSpace} />
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* ======================================================
        ADD HALF DAY STUDENT MODAL
        ====================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          style={styles.keyboardOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <Pressable style={styles.overlay} onPress={closeAddModal}>
            <Pressable
              style={[styles.addSheet, isDesktop && styles.addSheetDesktop]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.sheetHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.profileName}>Add Half Day Student</Text>

                  <Text style={styles.modalSubtitle}>
                    Add a morning or evening shift member
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeAddModal}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
              >
                <Text style={styles.label}>Name</Text>

                <AppInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter student name"
                />

                <Text style={styles.label}>Phone</Text>

                <AppInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>Shift</Text>

                <View style={styles.slotRow}>
                  {["MORNING", "EVENING"].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSlot(s)}
                      style={[
                        styles.slotChip,
                        slot === s && styles.slotChipActive,
                      ]}
                    >
                      <Text
                        style={
                          slot === s ? styles.slotTextActive : styles.slotText
                        }
                      >
                        {s === "MORNING"
                          ? "Morning (6AM–2PM)"
                          : "Evening (2PM–10PM)"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Fees</Text>

                <AppInput
                  placeholder="400 / 500"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <PrimaryButton
                  title="Save"
                  onPress={handleCreate}
                  loading={saving}
                  style={styles.saveButton}
                />

                <PrimaryButton
                  title="Cancel"
                  variant="light"
                  onPress={closeAddModal}
                  disabled={saving}
                  style={styles.cancelModalButton}
                />

                <View style={styles.bottomSpace} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
// ============================================================
// DESKTOP HALF DAY LAYOUT
// ============================================================

function DesktopHalfDayLayout({
  students,
  loading,
  selected,
  setSelected,
  handleVacate,
  onEdit,
  colors,

  // EDIT MODAL
  editModalVisible,
  closeEditModal,
  editSaving,

  editName,
  setEditName,

  editPhone,
  setEditPhone,

  editSlot,
  setEditSlot,

  editAmount,
  setEditAmount,

  editExpiryDate,
  setEditExpiryDate,

  handleUpdateHalfDayStudent,
}) {
  const styles = createStyles(colors);
  React.useEffect(() => {
    if (!loading && students.length > 0 && !selected) {
      setSelected(students[0]);
    }
  }, [loading, students, selected, setSelected]);

  return (
    <View style={styles.desktopWorkspace}>
      {/* ==================================================
          LEFT — STUDENT LIST
          ================================================== */}

      <View style={styles.desktopStudentListPanel}>
        <View style={styles.desktopStudentListHeader}>
          <View>
            <Text style={styles.desktopStudentListTitle}>Students</Text>

            <Text style={styles.desktopStudentListSubtitle}>
              Select a student to view details
            </Text>
          </View>

          <View style={styles.desktopStudentCount}>
            <Text style={styles.desktopStudentCountText}>
              {students.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.desktopCentered}>
            <ActivityIndicator size="small" color={colors.primaryBlue} />

            <Text style={styles.desktopLoadingText}>Loading students...</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={styles.desktopCentered}>
            <View style={styles.desktopEmptyIcon}>
              <FontAwesome6
                name="user-clock"
                size={20}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.desktopEmptyTitle}>No Half Day Students</Text>

            <Text style={styles.desktopEmptySubtitle}>
              Add your first morning or evening shift student.
            </Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.desktopStudentList}
            renderItem={({ item }) => {
              const active = selected?.id === item.id;

              const morning = item.halfDaySlot === "MORNING";

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelected(item)}
                  style={[
                    styles.desktopStudentItem,
                    active && styles.desktopStudentItemActive,
                  ]}
                >
                  <View
                    style={[
                      styles.desktopStudentAvatar,
                      morning
                        ? styles.desktopMorningAvatar
                        : styles.desktopEveningAvatar,
                    ]}
                  >
                    <Text style={styles.desktopStudentAvatarText}>
                      {item.name?.charAt(0)?.toUpperCase() || "S"}
                    </Text>
                  </View>

                  <View style={styles.desktopStudentItemInfo}>
                    <Text
                      style={styles.desktopStudentItemName}
                      numberOfLines={1}
                    >
                      {item.name || "-"}
                    </Text>

                    <Text style={styles.desktopStudentItemPhone}>
                      {item.phone || "-"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.desktopShiftBadge,
                      morning
                        ? styles.desktopShiftMorning
                        : styles.desktopShiftEvening,
                    ]}
                  >
                    <FontAwesome6
                      name={morning ? "sun" : "moon"}
                      size={9}
                      color={morning ? colors.primaryBlue : colors.statOrange}
                    />

                    <Text
                      style={[
                        styles.desktopShiftText,
                        morning
                          ? styles.desktopShiftMorningText
                          : styles.desktopShiftEveningText,
                      ]}
                    >
                      {morning ? "MORNING" : "EVENING"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.desktopArrow,
                      active && styles.desktopArrowActive,
                    ]}
                  >
                    <FontAwesome6
                      name="chevron-right"
                      size={9}
                      color={active ? colors.primaryBlue : colors.textMuted}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* ==================================================
          RIGHT — DETAILS
          ================================================== */}

      <View style={styles.desktopStudentDetailsPanel}>
        {selected ? (
          <DesktopHalfDayDetails
            student={selected}
            handleVacate={handleVacate}
            onEdit={onEdit}
            colors={colors}
            // EDIT MODAL
            editModalVisible={editModalVisible}
            closeEditModal={closeEditModal}
            editSaving={editSaving}
            editName={editName}
            setEditName={setEditName}
            editPhone={editPhone}
            setEditPhone={setEditPhone}
            editSlot={editSlot}
            setEditSlot={setEditSlot}
            editAmount={editAmount}
            setEditAmount={setEditAmount}
            editExpiryDate={editExpiryDate}
            setEditExpiryDate={setEditExpiryDate}
            handleUpdateHalfDayStudent={handleUpdateHalfDayStudent}
          />
        ) : (
          <View style={styles.desktopNoSelection}>
            <View style={styles.desktopNoSelectionIcon}>
              <FontAwesome6
                name="user-clock"
                size={24}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.desktopNoSelectionTitle}>Select a student</Text>

            <Text style={styles.desktopNoSelectionSubtitle}>
              Choose a student from the left panel to view their details.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================
// DESKTOP HALF DAY STUDENT DETAILS
// ============================================================

function DesktopHalfDayDetails({
  student,
  handleVacate,
  onEdit,
  colors,

  // EDIT MODAL
  editModalVisible,
  closeEditModal,
  editSaving,

  editName,
  setEditName,

  editPhone,
  setEditPhone,

  editSlot,
  setEditSlot,

  editAmount,
  setEditAmount,

  editExpiryDate,
  setEditExpiryDate,

  handleUpdateHalfDayStudent,
}) {
  const styles = createStyles(colors);
  const isMorning = student.halfDaySlot === "MORNING";

  return (
    <View style={styles.desktopDetailsContainer}>
      {/* PROFILE HEADER */}

      <View style={styles.desktopDetailsHeader}>
        <View style={styles.desktopDetailsIdentity}>
          <View
            style={[
              styles.desktopDetailsAvatar,
              isMorning
                ? styles.desktopMorningAvatar
                : styles.desktopEveningAvatar,
            ]}
          >
            <Text style={styles.desktopDetailsAvatarText}>
              {student.name?.charAt(0)?.toUpperCase() || "S"}
            </Text>
          </View>

          <View style={styles.desktopDetailsIdentityText}>
            <Text style={styles.desktopDetailsName}>{student.name || "-"}</Text>

            <View style={styles.desktopDetailsPhoneRow}>
              <FontAwesome6 name="phone" size={10} color={colors.textMuted} />

              <Text style={styles.desktopDetailsPhone}>
                {student.phone || "-"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.desktopActionRow}>
          {/* EDIT */}
          <TouchableOpacity
            style={styles.desktopEditButton}
            onPress={() => onEdit(student)}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="pen" size={10} color={colors.primaryBlue} />

            <Text style={styles.desktopEditButtonText}>Edit</Text>
          </TouchableOpacity>

          {/* VACATE */}
          <TouchableOpacity
            style={styles.desktopVacateButton}
            onPress={() => handleVacate(student.id)}
            activeOpacity={0.8}
          >
            <FontAwesome6 name="trash" size={10} color={colors.danger} />

            <Text style={styles.desktopVacateButtonText}>Vacate</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SHIFT */}

      <View style={styles.desktopSection}>
        <Text style={styles.desktopSectionTitle}>Shift</Text>

        <View
          style={[
            styles.desktopShiftCard,
            isMorning ? styles.desktopShiftMorning : styles.desktopShiftEvening,
          ]}
        >
          <View style={styles.desktopShiftIcon}>
            <FontAwesome6
              name={isMorning ? "sun" : "moon"}
              size={13}
              color={isMorning ? colors.primaryBlue : colors.statOrange}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.desktopShiftCardTitle,
                isMorning
                  ? styles.desktopShiftMorningText
                  : styles.desktopShiftEveningText,
              ]}
            >
              {isMorning ? "Morning" : "Evening"}
            </Text>

            <Text style={styles.desktopShiftCardSubtitle}>
              {isMorning ? "6:00 AM – 2:00 PM" : "2:00 PM – 10:00 PM"}
            </Text>
          </View>

          <View style={styles.desktopActiveBadge}>
            <View style={styles.desktopActiveDot} />

            <Text style={styles.desktopActiveText}>ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* STUDENT INFORMATION */}

      <View style={styles.desktopSection}>
        <Text style={styles.desktopSectionTitle}>Student Information</Text>

        <View style={styles.desktopInfoGrid}>
          <DesktopInfoCard
            icon="user"
            label="Student Name"
            value={student.name || "-"}
            colors={colors}
          />

          <DesktopInfoCard
            icon="phone"
            label="Phone Number"
            value={student.phone || "-"}
            colors={colors}
          />

          <DesktopInfoCard
            icon="indian-rupee-sign"
            label="Fees"
            value={
              student.amount != null
                ? `₹${student.amount}`
                : student.amountPaid != null
                ? `₹${student.amountPaid}`
                : "-"
            }
            colors={colors}
          />

          <DesktopInfoCard
            icon="calendar-plus"
            label="Joined"
            value={student.startDate || student.bookingDate || "-"}
            colors={colors}
          />

          <DesktopInfoCard
            icon="calendar-check"
            label="Expires"
            value={student.expiryDate || student.endDate || "-"}
            danger
            colors={colors}
          />
        </View>
      </View>

      {/* MEMBERSHIP */}

      <View style={styles.desktopSection}>
        <Text style={styles.desktopSectionTitle}>Membership</Text>

        <View style={styles.desktopMembershipCard}>
          <View style={styles.desktopMembershipIcon}>
            <FontAwesome6 name="clock" size={14} color={colors.primaryBlue} />
          </View>

          <View style={styles.desktopMembershipText}>
            <Text style={styles.desktopMembershipTitle}>
              Half Day Membership
            </Text>

            <Text style={styles.desktopMembershipSubtitle}>
              {isMorning
                ? "Morning shift membership"
                : "Evening shift membership"}
            </Text>
          </View>
        </View>
      </View>
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.editModalBackdrop} onPress={closeEditModal}>
            <Pressable
              style={styles.editModalContainer}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.editModalHeader}>
                <View>
                  <Text style={styles.editModalTitle}>
                    Edit Half Day Student
                  </Text>

                  <Text style={styles.editModalSubtitle}>
                    Update student information
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={closeEditModal}
                  disabled={editSaving}
                  style={styles.editModalClose}
                >
                  <FontAwesome6
                    name="xmark"
                    size={15}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.editLabel}>Student Name</Text>

                <AppInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter student name"
                />

                <Text style={styles.editLabel}>Phone</Text>

                <AppInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />

                <Text style={styles.editLabel}>Shift</Text>

                <View style={styles.editSlotRow}>
                  {["MORNING", "EVENING"].map((value) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => setEditSlot(value)}
                      activeOpacity={0.8}
                      style={[
                        styles.editSlotButton,
                        editSlot === value && styles.editSlotButtonActive,
                      ]}
                    >
                      <FontAwesome6
                        name={value === "MORNING" ? "sun" : "moon"}
                        size={12}
                        color={
                          editSlot === value ? "#FFFFFF" : colors.textSecondary
                        }
                      />

                      <Text
                        style={[
                          styles.editSlotText,
                          editSlot === value && styles.editSlotTextActive,
                        ]}
                      >
                        {value === "MORNING" ? "Morning" : "Evening"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.editLabel}>Fees</Text>

                <AppInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  placeholder="400 / 500"
                  keyboardType="numeric"
                />

                <Text style={styles.editLabel}>Expiry Date</Text>

                {Platform.OS === "web" ? (
                  <View style={styles.webDateField}>
                    <FontAwesome6
                      name="calendar-days"
                      size={15}
                      color={colors.primaryBlue}
                    />

                    <input
                      type="date"
                      value={editExpiryDate || ""}
                      onChange={(e) => {
                        setEditExpiryDate(e.target.value);
                      }}
                      disabled={editSaving}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: "600",
                        fontFamily: "inherit",
                        cursor: editSaving ? "not-allowed" : "pointer",
                      }}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.mobileDateField}
                    onPress={() => setEditDatePickerVisible(true)}
                    disabled={editSaving}
                  >
                    <FontAwesome6
                      name="calendar-days"
                      size={15}
                      color={colors.primaryBlue}
                    />

                    <Text style={styles.mobileDateText}>
                      {editExpiryDate || "Select expiry date"}
                    </Text>

                    <FontAwesome6
                      name="chevron-down"
                      size={12}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                )}

                <View style={styles.editModalActions}>
                  <TouchableOpacity
                    style={styles.editCancelButton}
                    onPress={closeEditModal}
                    disabled={editSaving}
                  >
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.editSaveButton,
                      editSaving && styles.editSaveButtonDisabled,
                    ]}
                    onPress={handleUpdateHalfDayStudent}
                    disabled={editSaving}
                  >
                    {editSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <FontAwesome6 name="check" size={12} color="#FFFFFF" />

                        <Text style={styles.editSaveText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ============================================================
// DESKTOP INFO CARD
// ============================================================

function DesktopInfoCard({ icon, label, value, danger = false, colors }) {
  const styles = createStyles(colors);
  return (
    <View style={styles.desktopInfoCard}>
      <View style={styles.desktopInfoCardIcon}>
        <FontAwesome6
          name={icon}
          size={13}
          color={danger ? colors.danger : colors.primaryBlue}
        />
      </View>

      <View style={styles.desktopInfoCardContent}>
        <Text style={styles.desktopInfoCardLabel}>{label}</Text>

        <Text
          style={[
            styles.desktopInfoCardValue,
            danger && styles.desktopInfoCardDanger,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
// ============================================================
// MOBILE DETAIL ROW
// ============================================================

function DetailRow({ label, value, danger = false }) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = createStyles(colors);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={[styles.detailValue, danger && styles.detailValueDanger]}>
        {value || "-"}
      </Text>
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    mobileDateField: {
      height: 48,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      backgroundColor: colors.bg,

      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",

      marginBottom: 8,
    },

    mobileDateText: {
      flex: 1,
      marginLeft: 10,

      fontSize: 14,
      fontWeight: "600",

      color: colors.textPrimary,
    },

    mobileDatePlaceholder: {
      color: colors.textMuted,
    },

    datePickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.65)",

      alignItems: "center",
      justifyContent: "center",

      padding: 20,
    },

    datePickerContainer: {
      width: "100%",
      maxWidth: 380,

      borderRadius: 18,

      padding: 20,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,
    },

    datePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 18,
    },

    datePickerTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    datePickerSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textMuted,
    },

    datePickerDoneButton: {
      height: 44,
      marginTop: 18,

      borderRadius: 10,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",
      justifyContent: "center",
    },

    datePickerDoneText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
    },

    webDateField: {
      height: 42,

      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,

      backgroundColor: colors.bg,

      paddingHorizontal: 12,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,

      marginBottom: 8,
    },
    editDateField: {
      height: 52,
      minHeight: 52,
      width: "100%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.bg,
      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
    },

    editDateText: {
      flex: 1,
      marginLeft: 10,
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "600",
    },

    editDatePlaceholder: {
      color: colors.textMuted,
    },

    editDatePickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },

    editDatePickerContainer: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },

    editDatePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },

    editDatePickerTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    editDatePickerSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textMuted,
    },

    editDatePickerDone: {
      height: 46,
      borderRadius: 10,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },

    editDatePickerDoneText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    mobileStudentActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 8,
    },

    mobileEditBtn: {
      height: 34,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
      backgroundColor: colors.primaryBlueBg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    mobileEditBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primaryBlue,
    },

    vacateBtn: {
      height: 34,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.dangerBg,
      backgroundColor: colors.dangerBg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },

    vacateBtnText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.danger,
    },
    editModalOverlay: {
      flex: 1,
    },

    editModalBackdrop: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.55)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 16,
    },

    editModalContainer: {
      width: "100%",
      maxWidth: 520,

      maxHeight: "88%",

      padding: 20,

      borderRadius: 18,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,
    },

    editModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 16,
    },

    editModalTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    editModalSubtitle: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textSecondary,
    },

    editModalClose: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.bg,

      alignItems: "center",
      justifyContent: "center",
    },

    editLabel: {
      marginTop: 10,
      marginBottom: 6,

      fontSize: 11,
      fontWeight: "700",

      color: colors.textSecondary,
    },

    editSlotRow: {
      flexDirection: "row",
      gap: 8,
    },

    editSlotButton: {
      flex: 1,

      minHeight: 42,

      borderRadius: 10,

      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.bg,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,
    },

    editSlotButtonActive: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },

    editSlotText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    editSlotTextActive: {
      color: "#FFFFFF",
    },

    editModalActions: {
      flexDirection: "row",
      gap: 8,

      marginTop: 20,
    },

    editCancelButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      alignItems: "center",
      justifyContent: "center",
    },

    editCancelText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    editSaveButton: {
      flex: 1,

      height: 44,

      borderRadius: 10,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,
    },

    editSaveButtonDisabled: {
      opacity: 0.6,
    },

    editSaveText: {
      fontSize: 11,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    desktopActionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    desktopEditButton: {
      height: 34,
      paddingHorizontal: 12,
      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      borderWidth: 1,
      borderColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,
    },

    desktopEditButtonText: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    // ============================================================
    // MOBILE BASE
    // ============================================================

    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    keyboardOverlay: {
      flex: 1,
    },

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "flex-end",
    },

    desktopModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(2, 6, 23, 0.72)",
      alignItems: "center",
      justifyContent: "center",
    },

    // ============================================================
    // MOBILE HEADER CONTENT
    // ============================================================

    headerRow: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 10,

      backgroundColor: colors.bg,
    },

    subtitle: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.textSecondary,

      marginBottom: 10,
    },

    addBtn: {
      width: "100%",
      minHeight: 42,

      borderRadius: 12,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 15,
    },

    addBtnText: {
      fontSize: 12,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // ============================================================
    // MOBILE STUDENT LIST
    // ============================================================

    loading: {
      marginTop: 30,
    },

    listContent: {
      paddingHorizontal: 12,
      paddingBottom: 100,
    },

    emptyText: {
      marginTop: 30,

      fontSize: 12,
      fontWeight: "600",

      color: colors.textMuted,

      textAlign: "center",
    },

    row: {
      minHeight: 72,

      marginBottom: 8,

      paddingHorizontal: 12,
      paddingVertical: 10,

      borderRadius: 12,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    rowInfo: {
      flex: 1,
      minWidth: 0,

      marginRight: 8,
    },

    rowName: {
      fontSize: 13,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    rowMeta: {
      marginTop: 4,

      fontSize: 10,

      color: colors.textMuted,
    },

    // ============================================================
    // SHIFT BADGES
    // ============================================================

    badge: {
      minHeight: 25,

      paddingHorizontal: 8,

      borderRadius: 7,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      marginRight: 7,
    },

    badgeMorning: {
      backgroundColor: colors.statBlueBg,
    },

    badgeEvening: {
      backgroundColor: colors.statOrangeBg,
    },

    badgeMorningText: {
      fontSize: 8,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    badgeEveningText: {
      fontSize: 8,
      fontWeight: "800",

      color: colors.statOrange,
    },

    // ============================================================
    // VACATE BUTTON
    // ============================================================

    vacateBtn: {
      minHeight: 30,

      paddingHorizontal: 9,

      borderRadius: 7,

      backgroundColor: colors.dangerBg,

      alignItems: "center",
      justifyContent: "center",
    },

    vacateBtnText: {
      fontSize: 9,
      fontWeight: "800",

      color: colors.danger,
    },

    // ============================================================
    // MOBILE STUDENT DETAIL SHEET
    // ============================================================

    profileSheet: {
      width: "100%",

      maxHeight: "82%",

      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 20,

      backgroundColor: colors.card,

      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,

      overflow: "hidden",
    },

    sheetHandle: {
      width: 42,
      height: 4,

      borderRadius: 2,

      alignSelf: "center",

      marginBottom: 16,

      backgroundColor: colors.border,
    },

    profileName: {
      fontSize: 18,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    profileSub: {
      marginTop: 4,

      fontSize: 11,

      color: colors.textSecondary,
    },

    profileDetails: {
      marginTop: 16,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      backgroundColor: colors.bg,

      overflow: "hidden",
    },

    // ============================================================
    // MOBILE DETAIL ROW
    // ============================================================

    detailRow: {
      minHeight: 48,

      paddingHorizontal: 12,
      paddingVertical: 8,

      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailLabel: {
      fontSize: 11,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    detailValue: {
      flex: 1,

      marginLeft: 15,

      fontSize: 11,
      fontWeight: "700",

      color: colors.textPrimary,

      textAlign: "right",
    },

    detailValueDanger: {
      color: colors.danger,
    },

    // ============================================================
    // ADD STUDENT MODAL
    // ============================================================

    addSheet: {
      width: "100%",

      maxHeight: "90%",

      backgroundColor: colors.card,

      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,

      overflow: "hidden",
    },

    addSheetDesktop: {
      width: "min(560px, 92vw)",
      maxWidth: 560,

      maxHeight: "88vh",

      alignSelf: "center",

      borderRadius: 18,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      overflow: "hidden",

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.25,
      shadowRadius: 28,

      elevation: 20,
    },

    modalHeader: {
      minHeight: 68,

      paddingHorizontal: 18,
      paddingVertical: 12,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    modalHeaderText: {
      flex: 1,
      minWidth: 0,

      marginRight: 10,
    },

    modalSubtitle: {
      marginTop: 3,

      fontSize: 10,

      color: colors.textSecondary,
    },

    closeButton: {
      width: 32,
      height: 32,

      borderRadius: 9,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    closeButtonText: {
      fontSize: 21,
      lineHeight: 23,

      color: colors.textSecondary,
    },

    formScroll: {
      flexGrow: 0,
    },

    formContent: {
      paddingHorizontal: 18,
      paddingTop: 6,
      paddingBottom: 20,
    },

    label: {
      marginTop: 14,
      marginBottom: 7,

      fontSize: 11,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    // ============================================================
    // SHIFT SELECTION
    // ============================================================

    slotRow: {
      flexDirection: "row",

      gap: 8,

      marginBottom: 3,
    },

    slotChip: {
      flex: 1,

      minHeight: 46,

      paddingHorizontal: 10,

      borderRadius: 10,

      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.bg,

      alignItems: "center",
      justifyContent: "center",
    },

    slotChipActive: {
      backgroundColor: colors.statBlueBg,

      borderColor: colors.primaryBlue,
    },

    slotText: {
      fontSize: 10,
      fontWeight: "600",

      color: colors.textSecondary,

      textAlign: "center",
    },

    slotTextActive: {
      fontSize: 10,
      fontWeight: "800",

      color: colors.primaryBlue,

      textAlign: "center",
    },

    saveButton: {
      marginTop: 18,
    },

    cancelModalButton: {
      marginTop: 8,
    },

    bottomSpace: {
      height: 10,
    },

    detailRow: {
      minHeight: 48,

      paddingHorizontal: 12,
      paddingVertical: 8,

      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailLabel: {
      fontSize: 11,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    detailValue: {
      flex: 1,

      marginLeft: 15,

      fontSize: 11,
      fontWeight: "700",

      color: colors.textPrimary,

      textAlign: "right",
    },

    detailValueDanger: {
      color: colors.danger,
    },
    addSheetDesktop: {
      width: "min(560px, 92vw)",
      maxWidth: 560,

      maxHeight: "88vh",

      alignSelf: "center",

      borderRadius: 18,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      overflow: "hidden",

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.25,
      shadowRadius: 28,

      elevation: 20,
    },

    desktopPage: {
      flex: 1,
      minHeight: 0,
      padding: 18,
    },

    desktopPageToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
    },

    desktopPageIntro: {
      flex: 1,
      minWidth: 0,
    },

    desktopPageTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopPageSubtitle: {
      marginTop: 4,
      fontSize: 10,
      color: colors.textSecondary,
    },

    desktopPageCount: {
      height: 34,
      paddingHorizontal: 11,
      borderRadius: 9,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    desktopPageCountText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    desktopHeaderAddButton: {
      height: 34,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    desktopHeaderAddButtonText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#FFFFFF",
    },

    // ============================================================
    // MAIN WORKSPACE
    // ============================================================

    desktopWorkspace: {
      flex: 1,
      minHeight: 0,
      flexDirection: "row",
      gap: 14,
    },

    // ============================================================
    // LEFT LIST
    // ============================================================

    desktopStudentListPanel: {
      width: 330,
      minWidth: 300,
      maxWidth: 350,
      minHeight: 0,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      overflow: "hidden",
    },

    desktopStudentListHeader: {
      minHeight: 68,

      paddingHorizontal: 15,
      paddingVertical: 11,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    desktopStudentListTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopStudentListSubtitle: {
      marginTop: 3,
      fontSize: 9,
      color: colors.textMuted,
    },

    desktopStudentCount: {
      width: 32,
      height: 32,
      borderRadius: 9,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    desktopStudentCountText: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopStudentList: {
      padding: 9,
      paddingBottom: 15,
    },

    desktopStudentItem: {
      minHeight: 64,

      paddingHorizontal: 9,
      paddingVertical: 8,

      marginBottom: 7,

      borderRadius: 10,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopStudentItemActive: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.primaryBlue,
    },

    desktopStudentAvatar: {
      width: 38,
      height: 38,

      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 9,
    },

    desktopMorningAvatar: {
      backgroundColor: colors.statBlueBg,
    },

    desktopEveningAvatar: {
      backgroundColor: colors.statOrangeBg,
    },

    desktopStudentAvatarText: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopStudentItemInfo: {
      flex: 1,
      minWidth: 0,
    },

    desktopStudentItemName: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopStudentItemPhone: {
      marginTop: 3,
      fontSize: 8,
      color: colors.textMuted,
    },

    desktopShiftBadge: {
      height: 22,
      paddingHorizontal: 6,

      borderRadius: 6,

      flexDirection: "row",
      alignItems: "center",
      gap: 4,

      marginLeft: 5,
    },

    desktopShiftMorning: {
      backgroundColor: colors.statBlueBg,
    },

    desktopShiftEvening: {
      backgroundColor: colors.statOrangeBg,
    },

    desktopShiftText: {
      fontSize: 7,
      fontWeight: "800",
    },

    desktopShiftMorningText: {
      color: colors.primaryBlue,
    },

    desktopShiftEveningText: {
      color: colors.statOrange,
    },

    desktopArrow: {
      width: 23,
      height: 23,

      borderRadius: 7,

      marginLeft: 5,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    desktopArrowActive: {
      backgroundColor: colors.card,
    },

    desktopCentered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 25,
    },

    desktopLoadingText: {
      marginTop: 8,
      fontSize: 9,
      color: colors.textMuted,
    },

    desktopEmptyIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 9,
    },

    desktopEmptyTitle: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },

    desktopEmptySubtitle: {
      marginTop: 5,
      maxWidth: 220,
      fontSize: 8,
      lineHeight: 13,
      color: colors.textMuted,
      textAlign: "center",
    },

    // ============================================================
    // RIGHT DETAILS
    // ============================================================

    desktopStudentDetailsPanel: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      overflow: "hidden",
    },

    desktopDetailsContainer: {
      flex: 1,
      minHeight: 0,

      padding: 18,
    },

    desktopDetailsHeader: {
      minHeight: 55,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 13,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    desktopDetailsIdentity: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    desktopDetailsAvatar: {
      width: 44,
      height: 44,

      borderRadius: 12,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    desktopDetailsAvatarText: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopDetailsIdentityText: {
      flex: 1,
      minWidth: 0,
    },

    desktopDetailsName: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopDetailsPhoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 3,
    },

    desktopDetailsPhone: {
      fontSize: 8,
      color: colors.textMuted,
    },

    desktopVacateButton: {
      height: 30,
      paddingHorizontal: 10,

      borderRadius: 7,

      backgroundColor: colors.dangerBg,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 5,

      marginLeft: 10,
    },

    desktopVacateButtonText: {
      fontSize: 8,
      fontWeight: "800",
      color: colors.danger,
    },

    // ============================================================
    // DETAILS SECTIONS
    // ============================================================

    desktopSection: {
      marginTop: 15,
    },

    desktopSectionTitle: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: 7,
    },

    desktopShiftCard: {
      minHeight: 52,

      paddingHorizontal: 10,
      paddingVertical: 8,

      borderRadius: 9,

      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    desktopShiftIcon: {
      width: 29,
      height: 29,

      borderRadius: 8,

      backgroundColor: colors.card,

      alignItems: "center",
      justifyContent: "center",
    },

    desktopShiftCardTitle: {
      fontSize: 10,
      fontWeight: "800",
    },

    desktopShiftCardSubtitle: {
      marginTop: 2,
      fontSize: 8,
      color: colors.textSecondary,
    },

    desktopActiveBadge: {
      height: 20,
      paddingHorizontal: 7,

      borderRadius: 6,

      backgroundColor: colors.successBg,

      flexDirection: "row",
      alignItems: "center",

      gap: 4,
    },

    desktopActiveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.success,
    },

    desktopActiveText: {
      fontSize: 7,
      fontWeight: "800",
      color: colors.success,
    },

    // ============================================================
    // INFORMATION CARDS
    // ============================================================

    desktopInfoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    desktopInfoCard: {
      width: "48.8%",
      minHeight: 56,

      paddingHorizontal: 9,
      paddingVertical: 8,

      borderRadius: 9,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopInfoCardIcon: {
      width: 27,
      height: 27,

      borderRadius: 7,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 8,
    },

    desktopInfoCardContent: {
      flex: 1,
      minWidth: 0,
    },

    desktopInfoCardLabel: {
      fontSize: 7,
      color: colors.textMuted,
      marginBottom: 3,
    },

    desktopInfoCardValue: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopInfoCardDanger: {
      color: colors.danger,
    },

    // ============================================================
    // MEMBERSHIP
    // ============================================================

    desktopMembershipCard: {
      minHeight: 55,

      paddingHorizontal: 10,
      paddingVertical: 8,

      borderRadius: 9,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopMembershipIcon: {
      width: 30,
      height: 30,

      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 9,
    },

    desktopMembershipText: {
      flex: 1,
      minWidth: 0,
    },

    desktopMembershipTitle: {
      fontSize: 9,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopMembershipSubtitle: {
      marginTop: 2,
      fontSize: 7,
      color: colors.textMuted,
    },

    // ============================================================
    // EMPTY DETAILS
    // ============================================================

    desktopNoSelection: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 30,
    },

    desktopNoSelectionIcon: {
      width: 55,
      height: 55,

      borderRadius: 15,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 10,
    },

    desktopNoSelectionTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopNoSelectionSubtitle: {
      marginTop: 5,

      maxWidth: 250,

      fontSize: 9,
      lineHeight: 14,

      color: colors.textMuted,

      textAlign: "center",
    },

    desktopContent: {
      flex: 1,
      flexDirection: "row",
      gap: 14,
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 18,
      minHeight: 0,
    },

    // ============================================================
    // LEFT STUDENT LIST
    // ============================================================

    desktopStudentsPanel: {
      width: 360,
      minWidth: 320,
      maxWidth: 390,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      overflow: "hidden",

      minHeight: 0,
    },

    desktopListHeader: {
      minHeight: 68,

      paddingHorizontal: 16,
      paddingVertical: 12,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    desktopListHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    desktopListTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopListSubtitle: {
      marginTop: 3,
      fontSize: 10,
      color: colors.textSecondary,
    },

    desktopCountBadge: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    desktopCountBadgeText: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopStudentList: {
      padding: 10,
      paddingBottom: 16,
    },

    // ============================================================
    // STUDENT CARD
    // ============================================================

    desktopStudentCard: {
      minHeight: 70,

      marginBottom: 8,

      paddingHorizontal: 10,
      paddingVertical: 9,

      flexDirection: "row",
      alignItems: "center",

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 11,
    },

    desktopStudentCardSelected: {
      backgroundColor: colors.statBlueBg,

      borderColor: colors.primaryBlue,
    },

    desktopStudentAvatar: {
      width: 40,
      height: 40,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    desktopMorningAvatar: {
      backgroundColor: colors.statBlueBg,
    },

    desktopEveningAvatar: {
      backgroundColor: colors.statOrangeBg,
    },

    desktopStudentAvatarText: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    desktopStudentMain: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },

    desktopStudentName: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    desktopStudentMeta: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 4,

      gap: 5,
    },

    desktopStudentPhone: {
      flex: 1,

      fontSize: 9,

      color: colors.textSecondary,
    },

    // ============================================================
    // SHIFT BADGE
    // ============================================================

    desktopShiftBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 5,

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 7,

      marginLeft: 6,
    },

    desktopShiftMorning: {
      backgroundColor: colors.statBlueBg,
    },

    desktopShiftEvening: {
      backgroundColor: colors.statOrangeBg,
    },

    desktopShiftText: {
      fontSize: 8,
      fontWeight: "800",
    },

    desktopShiftMorningText: {
      color: colors.primaryBlue,
    },

    desktopShiftEveningText: {
      color: "#a16207",
    },

    desktopSelectArrow: {
      width: 25,
      height: 25,

      borderRadius: 7,

      marginLeft: 6,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor: colors.borderLight,
    },

    desktopSelectArrowActive: {
      backgroundColor: colors.card,
    },

    // ============================================================
    // LEFT EMPTY / LOADING
    // ============================================================

    desktopLoading: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      padding: 30,
    },

    desktopLoadingText: {
      marginTop: 10,

      fontSize: 10,

      color: colors.textSecondary,
    },

    desktopEmptyList: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 30,
    },

    desktopEmptyIcon: {
      width: 48,
      height: 48,

      borderRadius: 14,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 10,
    },

    desktopEmptyTitle: {
      fontSize: 13,
      fontWeight: "800",

      color: colors.textPrimary,

      textAlign: "center",
    },

    desktopEmptySubtitle: {
      marginTop: 5,

      fontSize: 9,
      lineHeight: 14,

      color: colors.textMuted,

      textAlign: "center",
    },

    // ============================================================
    // RIGHT DETAILS PANEL
    // ============================================================

    desktopDetailsPanel: {
      flex: 1,

      minWidth: 0,
      minHeight: 0,

      backgroundColor: colors.card,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 14,

      overflow: "hidden",
    },

    desktopDetailsContainer: {
      flex: 1,

      padding: 20,

      minHeight: 0,
    },

    // ============================================================
    // DETAILS HEADER
    // ============================================================

    desktopDetailsHeader: {
      minHeight: 66,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    desktopDetailsIdentity: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    desktopDetailsAvatar: {
      width: 52,
      height: 52,

      borderRadius: 15,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 12,
    },

    desktopDetailsAvatarText: {
      fontSize: 20,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    desktopDetailsIdentityText: {
      flex: 1,
      minWidth: 0,
    },

    desktopDetailsName: {
      fontSize: 18,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopDetailsPhoneRow: {
      flexDirection: "row",
      alignItems: "center",

      gap: 6,

      marginTop: 5,
    },

    desktopDetailsPhone: {
      fontSize: 10,

      color: colors.textSecondary,
    },

    desktopVacateButton: {
      height: 34,

      paddingHorizontal: 12,

      borderRadius: 8,

      borderWidth: 1,
      borderColor: colors.dangerBg,

      backgroundColor: colors.dangerBg,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,

      marginLeft: 15,
    },

    desktopVacateButtonText: {
      fontSize: 9,
      fontWeight: "800",

      color: colors.danger,
    },

    // ============================================================
    // DIVIDERS
    // ============================================================

    desktopDetailsDivider: {
      height: 1,

      backgroundColor: colors.borderLight,

      marginVertical: 16,
    },

    // ============================================================
    // SECTION HEADINGS
    // ============================================================

    desktopSectionHeading: {
      fontSize: 11,

      fontWeight: "800",

      color: colors.textPrimary,

      marginBottom: 9,
    },

    // ============================================================
    // SHIFT SECTION
    // ============================================================

    desktopShiftSection: {
      paddingVertical: 2,
    },

    desktopLargeShiftBadge: {
      minHeight: 60,

      paddingHorizontal: 12,
      paddingVertical: 10,

      borderRadius: 10,

      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    desktopLargeShiftTitle: {
      fontSize: 12,
      fontWeight: "800",
    },

    desktopLargeShiftSubtitle: {
      marginTop: 3,

      fontSize: 9,

      color: colors.textSecondary,
    },

    // ============================================================
    // INFORMATION GRID
    // ============================================================

    desktopInfoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 9,
    },

    desktopInfoCard: {
      width: "48.8%",

      minHeight: 66,

      paddingHorizontal: 10,
      paddingVertical: 9,

      borderRadius: 10,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopInfoCardIcon: {
      width: 30,
      height: 30,

      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 8,
    },

    desktopInfoCardContent: {
      flex: 1,
      minWidth: 0,
    },

    desktopInfoCardLabel: {
      fontSize: 8,

      color: colors.textMuted,

      marginBottom: 4,
    },

    desktopInfoCardValue: {
      fontSize: 10,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopInfoCardDanger: {
      color: colors.danger,
    },

    // ============================================================
    // SUBSCRIPTION
    // ============================================================

    desktopSubscriptionCard: {
      minHeight: 66,

      paddingHorizontal: 12,
      paddingVertical: 10,

      borderRadius: 10,

      backgroundColor: colors.bg,

      borderWidth: 1,
      borderColor: colors.border,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopSubscriptionIcon: {
      width: 34,
      height: 34,

      borderRadius: 9,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    desktopSubscriptionText: {
      flex: 1,
      minWidth: 0,
    },

    desktopSubscriptionTitle: {
      fontSize: 10,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopSubscriptionSubtitle: {
      marginTop: 3,

      fontSize: 8,

      color: colors.textSecondary,
    },

    desktopSubscriptionStatus: {
      flexDirection: "row",
      alignItems: "center",

      gap: 5,

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 7,

      backgroundColor: colors.successBg,
    },

    desktopActiveDot: {
      width: 5,
      height: 5,

      borderRadius: 3,

      backgroundColor: colors.success,
    },

    desktopActiveText: {
      fontSize: 7,

      fontWeight: "800",

      color: colors.success,
    },

    // ============================================================
    // NO SELECTION
    // ============================================================

    desktopNoSelection: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 40,
    },

    desktopNoSelectionIcon: {
      width: 60,
      height: 60,

      borderRadius: 17,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 12,
    },

    desktopNoSelectionTitle: {
      fontSize: 15,

      fontWeight: "800",

      color: colors.textPrimary,

      textAlign: "center",
    },

    desktopNoSelectionSubtitle: {
      marginTop: 5,

      maxWidth: 280,

      fontSize: 10,
      lineHeight: 15,

      color: colors.textMuted,

      textAlign: "center",
    },
  });
}
