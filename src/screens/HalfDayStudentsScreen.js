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
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";

import Header from "../components/Header";
import AppInput from "../components/AppInput";
import PrimaryButton from "../components/PrimaryButton";

import { useAuth } from "../context/AuthContext";

import {
  getHalfDayStudents,
  createHalfDayStudent,
  vacateHalfDayStudent,
} from "../api/halfday";

import { colors, radius, spacing } from "../theme/colors";

// ============================================================
// HALF DAY STUDENTS
// ============================================================

export default function HalfDayStudentsScreen() {
  const { libraryId } = useAuth();

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
  // LOAD
  // ==========================================================

  const load = useCallback(() => {
    if (!libraryId) {
      return;
    }

    setLoading(true);

    getHalfDayStudents(libraryId)
      .then((data) => {
        setStudents(data || []);
      })
      .catch((err) => {
        console.error("❌ Half day load failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [libraryId]);

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
    Alert.alert("Vacate this student?", "", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Vacate",
        style: "destructive",
        onPress: async () => {
          try {
            await vacateHalfDayStudent(id);

            load();
          } catch (err) {
            console.error("❌ Failed to vacate half day student:", err);

            Alert.alert(
              "Failed",
              err?.response?.data?.message ||
                err?.message ||
                "Unable to vacate student."
            );
          }
        },
      },
    ]);
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <View style={styles.container}>
      <Header title="Half Day Students" />

      {/* ======================================================
          HEADER
      ====================================================== */}

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

      {/* ======================================================
          STUDENT LIST
      ====================================================== */}

      {loading ? (
        <ActivityIndicator
          style={styles.loading}
          size="large"
          color={colors.primaryBlue}
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
            <TouchableOpacity
              style={styles.row}
              onPress={() => setSelected(item)}
              activeOpacity={0.75}
            >
              <View style={styles.rowInfo}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {item.name}
                </Text>

                <Text style={styles.rowMeta}>{item.phone}</Text>
              </View>

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

              <TouchableOpacity
                onPress={() => handleVacate(item.id)}
                style={styles.vacateBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.vacateBtnText}>Vacate</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ======================================================
          PROFILE PANEL
      ====================================================== */}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelected(null)}>
          <Pressable
            style={styles.profileSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {selected && (
              <>
                <View style={styles.sheetHandle} />

                <Text style={styles.profileName}>{selected.name}</Text>

                <Text style={styles.profileSub}>{selected.phone}</Text>

                <View style={styles.profileDetails}>
                  <DetailRow label="Shift" value={selected.halfDaySlot} />

                  <DetailRow label="Joined" value={selected.startDate} />

                  <DetailRow
                    label="Expires"
                    value={selected.expiryDate}
                    danger
                  />
                </View>

                <PrimaryButton
                  title="Close"
                  variant="light"
                  onPress={() => setSelected(null)}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
            {/* ==================================================
                SHEET
            ================================================== */}

            <Pressable
              style={styles.addSheet}
              onPress={(e) => e.stopPropagation()}
            >
              {/* =================================================
                  HANDLE
              ================================================= */}

              <View style={styles.sheetHandle} />

              {/* =================================================
                  HEADER
              ================================================= */}

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

              {/* =================================================
                  FORM
              ================================================= */}

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
              >
                {/* NAME */}

                <Text style={styles.label}>Name</Text>

                <AppInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter student name"
                />

                {/* PHONE */}

                <Text style={styles.label}>Phone</Text>

                <AppInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />

                {/* SHIFT */}

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

                {/* FEES */}

                <Text style={styles.label}>Fees</Text>

                <AppInput
                  placeholder="400 / 500"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                {/* SAVE */}

                <PrimaryButton
                  title="Save"
                  onPress={handleCreate}
                  loading={saving}
                  style={styles.saveButton}
                />

                {/* CANCEL */}

                <PrimaryButton
                  title="Cancel"
                  variant="light"
                  onPress={closeAddModal}
                  disabled={saving}
                  style={styles.cancelModalButton}
                />

                {/* Extra bottom space so keyboard
                    doesn't hide the last button */}
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
// DETAIL ROW
// ============================================================

function DetailRow({ label, value, danger }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text
        style={[
          styles.detailValue,
          danger && {
            color: colors.danger,
          },
        ]}
      >
        {value ?? "-"}
      </Text>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  headerRow: {
    padding: spacing.md,
    gap: 10,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },

  addBtn: {
    backgroundColor: colors.gradientStart,
    paddingVertical: 11,
    borderRadius: radius.pill,
    alignItems: "center",
  },

  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ==========================================================
  // LIST
  // ==========================================================

  loading: {
    marginTop: 40,
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },

  emptyText: {
    textAlign: "center",
    color: colors.textFaint,
    marginTop: 30,
    fontSize: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,

    backgroundColor: "#fff",

    borderRadius: radius.md,

    padding: spacing.sm,

    marginBottom: spacing.sm,
  },

  rowInfo: {
    flex: 1,
    minWidth: 0,
  },

  rowName: {
    fontWeight: "600",
    color: colors.textPrimary,
    fontSize: 15,
  },

  rowMeta: {
    fontSize: 12,
    color: colors.textFaint,
    marginTop: 3,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  badgeMorning: {
    backgroundColor: "#e0f2fe",
  },

  badgeEvening: {
    backgroundColor: "#fef3c7",
  },

  badgeMorningText: {
    color: "#0369a1",
    fontSize: 11,
    fontWeight: "700",
  },

  badgeEveningText: {
    color: "#92400e",
    fontSize: 11,
    fontWeight: "700",
  },

  vacateBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: radius.sm,
  },

  vacateBtnText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
  },

  // ==========================================================
  // MODAL OVERLAY
  // ==========================================================

  keyboardOverlay: {
    flex: 1,
  },

  overlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.4)",

    justifyContent: "flex-end",
  },

  // ==========================================================
  // PROFILE SHEET
  // ==========================================================

  profileSheet: {
    backgroundColor: "#fff",

    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,

    padding: spacing.lg,

    maxHeight: "75%",
  },

  // ==========================================================
  // ADD SHEET
  // ==========================================================

  addSheet: {
    backgroundColor: "#fff",

    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,

    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,

    maxHeight: "88%",
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,

    backgroundColor: "#d1d5db",

    alignSelf: "center",

    marginBottom: spacing.md,
  },

  // ==========================================================
  // MODAL HEADER
  // ==========================================================

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.sm,
  },

  modalHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  modalSubtitle: {
    fontSize: 13,
    color: colors.textMuted,

    marginTop: 4,
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    backgroundColor: "#f3f4f6",

    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 27,
    lineHeight: 29,

    color: colors.textSecondary,

    fontWeight: "400",
  },

  // ==========================================================
  // FORM SCROLL
  // ==========================================================

  formScroll: {
    flexGrow: 0,
  },

  formContent: {
    paddingTop: 4,
    paddingBottom: 8,
  },

  // ==========================================================
  // PROFILE
  // ==========================================================

  profileName: {
    fontSize: 20,
    fontWeight: "700",

    color: colors.textPrimary,
  },

  profileSub: {
    textAlign: "center",

    color: colors.textSecondary,

    marginTop: 4,
    marginBottom: spacing.md,
  },

  profileDetails: {
    gap: 10,
    marginBottom: spacing.lg,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  detailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  detailValue: {
    fontWeight: "600",
    fontSize: 13,
    color: colors.textPrimary,
  },

  // ==========================================================
  // FORM LABELS
  // ==========================================================

  label: {
    fontSize: 13,

    color: colors.textSecondary,

    marginBottom: 6,
    marginTop: 12,

    fontWeight: "600",
  },

  // ==========================================================
  // SHIFT
  // ==========================================================

  slotRow: {
    gap: 8,
    marginBottom: 4,
  },

  slotChip: {
    paddingVertical: 11,
    paddingHorizontal: 14,

    borderRadius: radius.sm,

    borderWidth: 1,
    borderColor: colors.border,

    backgroundColor: colors.card,
  },

  slotChipActive: {
    backgroundColor: "#e8f1ff",
    borderColor: "#c7dcff",
  },

  slotText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  slotTextActive: {
    color: colors.primaryBlue,
    fontWeight: "700",
    fontSize: 13,
  },

  // ==========================================================
  // BUTTONS
  // ==========================================================

  saveButton: {
    marginTop: spacing.md,
  },

  cancelModalButton: {
    marginTop: 10,
  },

  bottomSpace: {
    height: 20,
  },
});
