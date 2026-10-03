import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome6 } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

import Header from "../components/Header";
import AppInput from "../components/AppInput";
import PrimaryButton from "../components/PrimaryButton";

import { useAuth } from "../context/AuthContext";

import {
  getStudentsPaginated,
  getSeatChangeHistory,
  updateStudentRecord,
  deleteStudentRecord,
  importStudentsExcel,
  exportStudentsExcel,
} from "../api/students";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

import DesktopLayout from "../components/DesktopLayout";
import { getSeats, vacateSeat } from "../api/dashboard";
// ============================================================
// CONSTANTS
// ============================================================

const PAGE_SIZE = 10;

const TABS = [
  {
    key: "ALL",
    label: "All",
  },
  {
    key: "ACTIVE",
    label: "Active",
  },
  {
    key: "EXPIRED",
    label: "Expired",
  },
];

// ============================================================
// SCREEN
// ============================================================

export default function StudentsScreen() {
  // ============================================================
  // VACATE STUDENT FROM MOBILE STUDENT LIST
  // ============================================================

  const handleVacateStudent = async (student) => {
    if (!canManageSeats) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to vacate seats."
      );
      return;
    }

    const seatNumber = Number(student?.seatNumber);

    if (!seatNumber) {
      Alert.alert("Error", "Seat number not found.");
      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");
      return;
    }

    console.log("🪑 Starting vacate:", {
      studentId: student?.id,
      seatNumber,
      libraryId,
    });

    // =========================================================
    // WEB CONFIRMATION
    // =========================================================
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to vacate Seat ${seatNumber}?`
      );

      if (!confirmed) {
        console.log("❌ Vacate cancelled by user");
        return;
      }

      try {
        console.log("🪑 Calling vacateSeat:", {
          libraryId,
          seatNumber,
        });

        await vacateSeat(libraryId, seatNumber);

        console.log("✅ Seat vacated successfully:", seatNumber);

        await loadStudents(page, false);

        if (selected?.id === student?.id) {
          setSelected(null);
          setHistory([]);
        }

        window.alert(`Seat ${seatNumber} has been vacated successfully.`);
      } catch (err) {
        console.error("❌ Vacate student failed:", err);

        window.alert(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Could not vacate the seat."
        );
      }

      return;
    }

    // =========================================================
    // MOBILE / NATIVE CONFIRMATION
    // =========================================================
    Alert.alert(
      "Vacate Seat",
      `Are you sure you want to vacate Seat ${seatNumber}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Vacate",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🪑 Calling vacateSeat:", {
                libraryId,
                seatNumber,
              });

              await vacateSeat(libraryId, seatNumber);

              console.log("✅ Seat vacated successfully:", seatNumber);

              await loadStudents(page, false);

              if (selected?.id === student?.id) {
                setSelected(null);
                setHistory([]);
              }

              Alert.alert(
                "Success",
                `Seat ${seatNumber} has been vacated successfully.`
              );
            } catch (err) {
              console.error("❌ Vacate student failed:", err);

              Alert.alert(
                "Vacate Failed",
                err?.response?.data?.message ||
                  err?.response?.data?.error ||
                  err?.message ||
                  "Could not vacate the seat."
              );
            }
          },
        },
      ]
    );
  };
  const { libraryId, canManageSeats } = useAuth();

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { width } = useWindowDimensions();

  const isDesktop = Platform.OS === "web" && width >= 1000;

  // ==========================================================
  // STUDENTS
  // ==========================================================

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // FILTER / SEARCH
  // ==========================================================

  const [activeTab, setActiveTab] = useState("ALL");

  const [search, setSearch] = useState("");

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [totalStudents, setTotalStudents] = useState(0);

  // ==========================================================
  // PROFILE
  // ==========================================================

  const [selected, setSelected] = useState(null);

  const [history, setHistory] = useState([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  // ==========================================================
  // EDIT
  // ==========================================================

  const [editVisible, setEditVisible] = useState(false);

  const [editName, setEditName] = useState("");

  const [editPhone, setEditPhone] = useState("");

  const [editSeat, setEditSeat] = useState("");

  const [editEndDate, setEditEndDate] = useState("");

  const [editEndDateValue, setEditEndDateValue] = useState(new Date());

  const [availableSeats, setAvailableSeats] = useState([]);

  const [saving, setSaving] = useState(false);
  // EDIT PICKERS
  const [seatPickerVisible, setSeatPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // ==========================================================
  // IMPORT / EXPORT
  // ==========================================================

  const [importing, setImporting] = useState(false);

  const [exporting, setExporting] = useState(false);

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  const loadStudents = useCallback(
    async (requestedPage = 0, showLoader = true) => {
      if (!libraryId) {
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await getStudentsPaginated(libraryId, {
          page: requestedPage,
          search,
          status: activeTab,
        });

        // ----------------------------------------------------
        // CONTENT
        // ----------------------------------------------------

        setStudents(Array.isArray(response?.content) ? response.content : []);

        // ----------------------------------------------------
        // PAGINATION INFO
        // ----------------------------------------------------

        const currentPage = Number.isInteger(response?.number)
          ? response.number
          : requestedPage;

        setPage(currentPage);

        setTotalPages(Number(response?.totalPages || 0));

        setTotalStudents(Number(response?.totalElements || 0));
      } catch (err) {
        console.error("❌ Failed to load students:", err);

        Alert.alert(
          "Couldn't load students",
          err?.response?.data?.message ||
            "Please check your internet connection and try again."
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [libraryId, search, activeTab]
  );

  // ============================================================
  // INITIAL / FILTER / SEARCH LOAD
  // ============================================================

  useEffect(() => {
    if (!libraryId) {
      return;
    }

    const timer = setTimeout(
      () => {
        loadStudents(0);
      },
      search.trim().length > 0 ? 350 : 0
    );

    return () => clearTimeout(timer);
  }, [libraryId, search, activeTab, loadStudents]);

  // ============================================================
  // SCREEN FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      if (!libraryId) {
        return;
      }

      /*
       * Don't reset the user's current page
       * every time they return to the screen.
       *
       * Just refresh the current page.
       */

      loadStudents(page, false);
    }, [libraryId, page])
  );

  // ============================================================
  // Delete Student
  // ============================================================

  const handleDelete = async () => {
    if (!selected || !libraryId) {
      return;
    }

    const studentName = selected.name || "this student";

    let confirmed = false;

    if (Platform.OS === "web") {
      confirmed = window.confirm(
        `Are you sure you want to delete ${studentName}?\n\nThis action cannot be undone.`
      );
    } else {
      confirmed = await new Promise((resolve) => {
        Alert.alert(
          "Delete Student",
          `Are you sure you want to delete ${studentName}?\n\nThis action cannot be undone.`,
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(false),
            },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => resolve(true),
            },
          ]
        );
      });
    }

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);

      console.log("🗑️ Deleting student:", selected.id);
      console.log("🏢 Library:", libraryId);

      await deleteStudentRecord(selected.id, libraryId);

      // Close student details
      setSelected(null);

      // Clear history
      setHistory([]);

      Alert.alert(
        "Student Deleted",
        `${studentName} has been deleted successfully.`
      );

      // Reload current page
      await loadStudents(page, true);
    } catch (err) {
      console.error("❌ Delete student failed:", err);

      Alert.alert(
        "Delete Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete student."
      );
    } finally {
      setSaving(false);
    }
  };
  // ============================================================
  // CHANGE TAB
  // ============================================================

  const handleTabChange = (tab) => {
    if (tab === activeTab) {
      return;
    }

    Keyboard.dismiss();

    setActiveTab(tab);

    // Search remains intact.
    // useEffect will reset page to 0.
    setPage(0);
  };

  // ============================================================
  // NEXT PAGE
  // ============================================================

  const handleNextPage = () => {
    if (loading) {
      return;
    }

    if (page >= totalPages - 1) {
      return;
    }

    loadStudents(page + 1);
  };

  // ============================================================
  // PREVIOUS PAGE
  // ============================================================

  const handlePreviousPage = () => {
    if (loading) {
      return;
    }

    if (page <= 0) {
      return;
    }

    loadStudents(page - 1);
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    if (!libraryId) {
      return;
    }

    setRefreshing(true);

    try {
      await loadStudents(page, false);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================
  // OPEN STUDENT PROFILE
  // ============================================================

  const openStudent = async (student) => {
    setSelected(student);

    setHistory([]);

    setHistoryLoading(true);

    try {
      const h = await getSeatChangeHistory(student.id, libraryId);

      setHistory(Array.isArray(h) ? h : []);
    } catch (err) {
      console.error("Failed to load seat history:", err);

      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ============================================================
  // CLOSE PROFILE
  // ============================================================

  const closeProfile = () => {
    setSelected(null);

    setHistory([]);
  };

  // ============================================================
  // OPEN EDIT
  // ============================================================

  const openEdit = async (student) => {
    setSelected(student);

    setEditName(student.name || "");
    setEditPhone(student.phone || "");

    const currentSeat = Number(student.seatNumber);
    setEditSeat(String(currentSeat));

    const existingEndDate = student.expireDate || student.endDate || "";

    setEditEndDate(existingEndDate);

    setEditEndDateValue(parseStudentDate(existingEndDate));

    setEditVisible(true);

    try {
      const seatsResponse = await getSeats(libraryId);

      const seats = Array.isArray(seatsResponse) ? seatsResponse : [];

      const selectableSeats = seats
        .filter((seat) => {
          const number = seat?.seatNumber ?? seat?.number ?? seat?.seatId;

          if (number === undefined || number === null) {
            return false;
          }

          const isCurrentSeat = Number(number) === currentSeat;

          const isOccupied =
            seat?.occupied === true || seat?.isOccupied === true;

          return isCurrentSeat || !isOccupied;
        })
        .map((seat) => Number(seat?.seatNumber ?? seat?.number ?? seat?.seatId))
        .filter((value, index, array) => array.indexOf(value) === index)
        .sort((a, b) => a - b);

      setAvailableSeats(selectableSeats);
    } catch (error) {
      console.error("❌ Failed to load available seats:", error);

      setAvailableSeats([currentSeat]);
    }
  };

  const toLocalDateTime = (date) => {
    if (!date) {
      return null;
    }

    const value = String(date).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return `${value}T00:00:00`;
    }

    return value;
  };

  // ============================================================
  // SAVE EDIT
  // ============================================================

  const saveEdit = async () => {
    if (!selected) {
      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");
      return;
    }

    if (!editName.trim()) {
      Alert.alert("Validation", "Student name is required.");
      return;
    }

    if (!editSeat) {
      Alert.alert("Validation", "Please select a seat.");
      return;
    }

    if (!editEndDate) {
      Alert.alert("Validation", "Please select an end date.");
      return;
    }

    setSaving(true);

    const payload = {
      name: editName.trim(),
      phone: editPhone.trim(),
      seatNumber: Number(editSeat),
      endDate: toLocalDateTime(editEndDate),
    };

    console.log("📝 Updating student:", {
      currentSeatNumber: selected.seatNumber,
      newSeatNumber: Number(editSeat),
      libraryId,
      payload,
    });

    try {
      await updateStudentRecord(
        Number(selected.seatNumber),
        Number(libraryId),
        payload
      );

      console.log("✅ Student updated successfully");

      setEditVisible(false);

      setSelected(null);

      await loadStudents(page, false);

      Alert.alert("Success", "Student updated successfully.");
    } catch (err) {
      console.error("❌ Save student failed:", err);

      console.error("Status:", err?.response?.status);

      console.error("Response:", err?.response?.data);

      Alert.alert(
        "Save failed",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to update student."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // IMPORT EXCEL
  // ============================================================

  const handleImport = async () => {
    if (!libraryId) {
      Alert.alert("Library not found", "Please reload the app and try again.");

      return;
    }

    if (importing) {
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets?.[0];

      if (!file?.uri) {
        Alert.alert("Invalid file", "Unable to read the selected Excel file.");

        return;
      }

      setImporting(true);

      const response = await importStudentsExcel(
        libraryId,
        file.uri,
        file.name || "students.xlsx"
      );

      const imported = Number(response?.importedCount || 0);
      const [editEndDateValue, setEditEndDateValue] = useState(new Date());

      const skipped = Number(response?.skippedCount || 0);

      const failed = Number(response?.failedCount || 0);

      const message =
        `Imported: ${imported}\n` +
        `Skipped: ${skipped}\n` +
        `Failed: ${failed}`;

      Alert.alert("Import Completed", message, [
        {
          text: "OK",
          onPress: () => {
            loadStudents(0, true);
          },
        },
      ]);
    } catch (err) {
      console.error("❌ Import failed:", err);

      Alert.alert(
        "Import Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to import the Excel file."
      );
    } finally {
      setImporting(false);
    }
  };

  // ============================================================
  // EXPORT EXCEL
  // ============================================================

  const handleExport = async () => {
    if (!libraryId) {
      Alert.alert("Library not found", "Please reload the app and try again.");
      return;
    }

    if (exporting) {
      return;
    }

    try {
      setExporting(true);

      console.log("📤 Export started");
      console.log("🏢 Library ID:", libraryId);

      const fileData = await exportStudentsExcel(libraryId);

      console.log("✅ Export API response received");
      console.log("📦 Data type:", typeof fileData);
      console.log("📦 Byte length:", fileData?.byteLength);

      if (Platform.OS === "web") {
        // Convert ArrayBuffer → Blob
        const blob = new Blob([fileData], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        // Create temporary download URL
        const url = window.URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement("a");
        link.href = url;
        link.download = `students_library_${libraryId}.xlsx`;

        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        console.log("✅ Excel download triggered");

        return;
      }

      Alert.alert("Export", "Excel generated successfully.");
    } catch (err) {
      console.error("❌ Export failed:", err);

      console.error("Status:", err?.response?.status);

      console.error("Response:", err?.response?.data);

      Alert.alert(
        "Export Failed",
        err?.response?.data?.message ||
          err?.message ||
          "Unable to export students."
      );
    } finally {
      setExporting(false);
    }
  };

  const parseStudentDate = (value) => {
    if (!value) {
      return new Date();
    }

    const datePart = String(value).split("T")[0];

    const [year, month, day] = datePart.split("-").map(Number);

    if (!year || !month || !day) {
      return new Date();
    }

    return new Date(year, month - 1, day);
  };

  // ============================================================
  // FORMAT STATUS
  // ============================================================

  const getStudentStatus = (student) => {
    const expiry = student?.expireDate || student?.endDate;

    if (!expiry) {
      return "ACTIVE";
    }

    const today = new Date();

    const expiryDate = new Date(expiry);

    today.setHours(0, 0, 0, 0);

    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate < today ? "EXPIRED" : "ACTIVE";
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-");

      return `${day}/${month}/${year}`;
    }

    return String(value);
  };

  // ============================================================
  // PAGINATION RANGE
  // ============================================================

  const getFirstItemNumber = () => {
    if (totalStudents === 0) {
      return 0;
    }

    return page * PAGE_SIZE + 1;
  };

  const getLastItemNumber = () => {
    if (totalStudents === 0) {
      return 0;
    }

    return Math.min((page + 1) * PAGE_SIZE, totalStudents);
  };

  // ============================================================
  // RENDER
  // ============================================================

  if (isDesktop) {
    return (
      <DesktopStudentsLayout
        colors={colors}
        students={students}
        loading={loading}
        refreshing={refreshing}
        search={search}
        setSearch={setSearch}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleRefresh={handleRefresh}
        handleImport={handleImport}
        handleExport={handleExport}
        importing={importing}
        exporting={exporting}
        page={page}
        totalPages={totalPages}
        totalStudents={totalStudents}
        getFirstItemNumber={getFirstItemNumber}
        getLastItemNumber={getLastItemNumber}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
        selected={selected}
        openStudent={openStudent}
        closeProfile={closeProfile}
        history={history}
        historyLoading={historyLoading}
        getStudentStatus={getStudentStatus}
        formatDate={formatDate}
        openEdit={openEdit}
        handleDelete={handleDelete}
        editVisible={editVisible}
        setEditVisible={setEditVisible}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editSeat={editSeat}
        setEditSeat={setEditSeat}
        availableSeats={availableSeats}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        editEndDateValue={editEndDateValue}
        setEditEndDateValue={setEditEndDateValue}
        seatPickerVisible={seatPickerVisible}
        setSeatPickerVisible={setSeatPickerVisible}
        datePickerVisible={datePickerVisible}
        setDatePickerVisible={setDatePickerVisible}
        saveEdit={saveEdit}
        saving={saving}
      />
    );
  }

  // ==========================================================
  // MOBILE
  // ==========================================================

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      <Header title="Student Records & KYC" />

      {/* ======================================================
          SEARCH
      ====================================================== */}

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <FontAwesome6
            name="magnifying-glass"
            size={15}
            color={colors.textMuted}
          />

          <AppInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone or seat no."
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                setSearch("");
              }}
              style={styles.clearSearch}
            >
              <FontAwesome6 name="xmark" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ======================================================
          FILTER TABS
      ====================================================== */}

      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabChange(tab.key)}
              activeOpacity={0.8}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ======================================================
          IMPORT / EXPORT
      ====================================================== */}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.importButton]}
          onPress={handleImport}
          disabled={importing || exporting}
          activeOpacity={0.8}
        >
          {importing ? (
            <ActivityIndicator size="small" color={colors.primaryBlue} />
          ) : (
            <FontAwesome6
              name="file-import"
              size={15}
              color={colors.primaryBlue}
            />
          )}

          <Text style={styles.importButtonText}>
            {importing ? "Importing..." : "Import"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
          disabled={importing || exporting}
          activeOpacity={0.8}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.textSecondary} />
          ) : (
            <FontAwesome6
              name="file-export"
              size={15}
              color={colors.textSecondary}
            />
          )}

          <Text style={styles.exportButtonText}>
            {exporting ? "Exporting..." : "Export"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ======================================================
          STUDENT LIST
      ====================================================== */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />

          <Text style={styles.loadingText}>Loading students...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <FontAwesome6 name="users" size={26} color={colors.textMuted} />
              </View>

              <Text style={styles.emptyTitle}>No students found</Text>

              <Text style={styles.emptySubtitle}>
                {search.trim()
                  ? "Try a different name, phone number or seat number."
                  : activeTab === "EXPIRED"
                  ? "There are no expired students."
                  : activeTab === "ACTIVE"
                  ? "There are no active students."
                  : "No students have been added yet."}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const status = getStudentStatus(item);

            return (
              <View style={styles.studentCard}>
                {/* =========================
                    STUDENT INFORMATION
                ========================= */}
                <TouchableOpacity
                  style={styles.mobileStudentMain}
                  onPress={() => openStudent(item)}
                  activeOpacity={0.82}
                >
                  {/* SEAT */}
                  <View style={styles.seatBadge}>
                    <Text style={styles.seatBadgeText}>
                      {item.seatNumber ?? "-"}
                    </Text>
                  </View>

                  {/* DETAILS */}
                  <View style={styles.studentInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {item.name || "-"}
                    </Text>

                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {item.phone || "No phone number"}
                    </Text>

                    <Text style={styles.rowDate}>
                      {formatDate(item.expireDate || item.endDate)}
                    </Text>

                    <Text style={styles.rowAmount}>
                      ₹{item.amountPaid ?? "-"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* =========================
                    ACTIONS
                ========================= */}
                <View style={styles.mobileActionColumn}>
                  <View style={styles.mobileProfileActionButtons}>
                    {/* EDIT */}
                    <TouchableOpacity
                      style={styles.mobileProfileEditButton}
                      onPress={() => {
                        console.log("✏️ MOBILE EDIT:", item);
                        openEdit(item);
                      }}
                      activeOpacity={0.8}
                    >
                      <FontAwesome6 name="pen" size={15} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* VACATE */}
                    {canManageSeats && (
                      <TouchableOpacity
                        style={styles.mobileProfileVacateButton}
                        onPress={() => {
                          console.log("🪑 MOBILE VACATE CLICKED:", item);
                          handleVacateStudent(item);
                        }}
                        activeOpacity={0.8}
                      >
                        <FontAwesome6 name="chair" size={15} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* STATUS */}
                  <View
                    style={[
                      styles.statusBadge,
                      status === "EXPIRED"
                        ? styles.expiredBadge
                        : styles.activeBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        status === "EXPIRED"
                          ? styles.expiredText
                          : styles.activeText,
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {!loading && totalStudents > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {getFirstItemNumber()}–{getLastItemNumber()} of{" "}
            {totalStudents}
          </Text>

          <View style={styles.paginationControls}>
            <TouchableOpacity
              onPress={handlePreviousPage}
              disabled={page === 0 || loading}
              activeOpacity={0.8}
              style={[
                styles.pageButton,
                (page === 0 || loading) && styles.pageButtonDisabled,
              ]}
            >
              <FontAwesome6
                name="chevron-left"
                size={12}
                color={page === 0 ? colors.textFaint : colors.primaryBlue}
              />

              <Text
                style={[
                  styles.pageButtonText,
                  page === 0 && styles.pageButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleNextPage}
              disabled={page >= totalPages - 1 || loading}
              activeOpacity={0.8}
              style={[
                styles.pageButton,
                (page >= totalPages - 1 || loading) &&
                  styles.pageButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  page >= totalPages - 1 && styles.pageButtonTextDisabled,
                ]}
              >
                Next
              </Text>

              <FontAwesome6
                name="chevron-right"
                size={12}
                color={
                  page >= totalPages - 1 ? colors.textFaint : colors.primaryBlue
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ======================================================
          PROFILE + HISTORY MODAL
      ====================================================== */}

      <Modal
        visible={!!selected && !editVisible}
        transparent
        animationType="slide"
        onRequestClose={closeProfile}
      >
        <Pressable style={styles.overlay} onPress={closeProfile}>
          <Pressable
            style={styles.profileSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>
                      {selected.name?.charAt(0)?.toUpperCase() || "S"}
                    </Text>
                  </View>

                  <Text style={styles.profileName}>{selected.name || "-"}</Text>

                  <Text style={styles.profilePhone}>
                    {selected.phone || "No phone number"}
                  </Text>
                </View>

                <View style={styles.profileDetailsCard}>
                  <DetailRow
                    label="Seat"
                    value={selected.seatNumber}
                    styles={styles}
                  />

                  <DetailRow
                    label="Joined"
                    value={formatDate(selected.bookingDate)}
                    styles={styles}
                  />

                  <DetailRow
                    label="Plan Expires"
                    value={formatDate(selected.expireDate || selected.endDate)}
                    danger={getStudentStatus(selected) === "EXPIRED"}
                    styles={styles}
                  />

                  <DetailRow
                    label="Amount Paid"
                    value={
                      selected.amountPaid != null
                        ? `₹${selected.amountPaid}`
                        : "-"
                    }
                    styles={styles}
                  />

                  <DetailRow
                    label="Status"
                    value={getStudentStatus(selected)}
                    danger={getStudentStatus(selected) === "EXPIRED"}
                    styles={styles}
                  />
                </View>

                <Text style={styles.historyTitle}>Seat Change History</Text>

                {historyLoading ? (
                  <View style={styles.historyLoading}>
                    <ActivityIndicator color={colors.primaryBlue} />

                    <Text style={styles.historyLoadingText}>
                      Loading history...
                    </Text>
                  </View>
                ) : history.length === 0 ? (
                  <View style={styles.noHistory}>
                    <FontAwesome6
                      name="clock-rotate-left"
                      size={20}
                      color={colors.border}
                    />

                    <Text style={styles.emptyText}>
                      No seat change history.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.historyContainer}>
                    {history.map((h, idx) => (
                      <View key={h.id ?? idx} style={styles.historyItem}>
                        <View style={styles.timeline}>
                          <View style={styles.dot} />

                          {idx < history.length - 1 && (
                            <View style={styles.timelineLine} />
                          )}
                        </View>

                        <View style={styles.historyContent}>
                          <Text style={styles.historyText}>
                            Seat {h.oldSeat ?? h.fromSeat ?? "-"} →{" "}
                            {h.newSeat ?? h.toSeat ?? "-"}
                          </Text>

                          <Text style={styles.historyDate}>
                            {formatDateTime(h.changedAt ?? h.date)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <PrimaryButton
                  title="Close"
                  variant="light"
                  onPress={closeProfile}
                  style={{
                    marginTop: spacing.md,
                  }}
                />
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setEditVisible(false)}>
          <Pressable
            style={styles.profileSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.editTitle}>Edit Student</Text>

              <Text style={styles.label}>Name</Text>

              <AppInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Student name"
              />

              <Text style={styles.label}>Phone</Text>

              <AppInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
              />

              <Text style={styles.label}>Seat Number</Text>

              <TouchableOpacity
                style={styles.mobileSelectField}
                onPress={() => setSeatPickerVisible(true)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <View style={styles.mobileSelectLeft}>
                  <FontAwesome6
                    name="chair"
                    size={16}
                    color={colors.primaryBlue}
                  />

                  <Text style={styles.mobileSelectValue}>Seat {editSeat}</Text>
                </View>

                <FontAwesome6
                  name="chevron-down"
                  size={13}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <Modal
                visible={seatPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setSeatPickerVisible(false)}
              >
                <View style={styles.mobilePickerOverlay}>
                  <View
                    style={[
                      styles.mobilePickerContainer,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.mobilePickerHeader}>
                      <View>
                        <Text
                          style={[
                            styles.mobilePickerTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Change Seat
                        </Text>

                        <Text
                          style={[
                            styles.mobilePickerSubtitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          Select an available seat
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setSeatPickerVisible(false)}
                      >
                        <FontAwesome6
                          name="xmark"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      style={styles.mobilePickerList}
                    >
                      <View style={styles.mobilePickerGrid}>
                        {availableSeats.map((seat) => {
                          const selected = Number(editSeat) === Number(seat);

                          return (
                            <TouchableOpacity
                              key={seat}
                              activeOpacity={0.8}
                              style={[
                                styles.mobileSeatOption,
                                {
                                  backgroundColor: selected
                                    ? colors.primaryBlue
                                    : colors.bg,

                                  borderColor: selected
                                    ? colors.primaryBlue
                                    : colors.border,
                                },
                              ]}
                              onPress={() => {
                                setEditSeat(String(seat));
                                setSeatPickerVisible(false);
                              }}
                            >
                              <FontAwesome6
                                name="chair"
                                size={15}
                                color={
                                  selected ? "#FFFFFF" : colors.primaryBlue
                                }
                              />

                              <Text
                                style={[
                                  styles.mobileSeatOptionText,
                                  {
                                    color: selected
                                      ? "#FFFFFF"
                                      : colors.textPrimary,
                                  },
                                ]}
                              >
                                {seat}
                              </Text>

                              {selected && (
                                <FontAwesome6
                                  name="check"
                                  size={10}
                                  color="#FFFFFF"
                                  style={styles.mobileSeatCheck}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>

                    <TouchableOpacity
                      style={[
                        styles.mobilePickerDone,
                        {
                          backgroundColor: colors.primaryBlue,
                        },
                      ]}
                      onPress={() => setSeatPickerVisible(false)}
                    >
                      <Text style={styles.mobilePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <Text style={styles.label}>End Date</Text>

              <TouchableOpacity
                style={styles.mobileSelectField}
                onPress={() => setDatePickerVisible(true)}
                disabled={saving}
                activeOpacity={0.8}
              >
                <View style={styles.mobileSelectLeft}>
                  <FontAwesome6
                    name="calendar-days"
                    size={16}
                    color={colors.primaryBlue}
                  />

                  <Text style={styles.mobileSelectValue}>
                    {editEndDate || "Select end date"}
                  </Text>
                </View>

                <FontAwesome6
                  name="chevron-down"
                  size={13}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
              <Modal
                visible={datePickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDatePickerVisible(false)}
              >
                <View style={styles.mobilePickerOverlay}>
                  <View
                    style={[
                      styles.mobileDatePickerContainer,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.mobilePickerHeader}>
                      <View>
                        <Text
                          style={[
                            styles.mobilePickerTitle,
                            { color: colors.textPrimary },
                          ]}
                        >
                          Select End Date
                        </Text>

                        <Text
                          style={[
                            styles.mobilePickerSubtitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          Choose the subscription expiry date
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => setDatePickerVisible(false)}
                      >
                        <FontAwesome6
                          name="xmark"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>

                    {Platform.OS === "web" ? (
                      <View
                        style={[
                          styles.mobileWebDateInput,
                          {
                            backgroundColor: colors.bg,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <FontAwesome6
                          name="calendar-days"
                          size={18}
                          color={colors.primaryBlue}
                        />

                        <input
                          type="date"
                          value={editEndDate || ""}
                          onChange={(e) => {
                            const value = e.target.value;

                            setEditEndDate(value);

                            if (value) {
                              setEditEndDateValue(parseStudentDate(value));
                            }
                          }}
                          style={{
                            flex: 1,
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            color: colors.textPrimary,
                            fontSize: 16,
                            fontWeight: "600",
                            minWidth: 0,
                          }}
                        />
                      </View>
                    ) : (
                      <DateTimePicker
                        value={editEndDateValue}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          if (!selectedDate) {
                            return;
                          }

                          setEditEndDateValue(selectedDate);

                          const year = selectedDate.getFullYear();
                          const month = String(
                            selectedDate.getMonth() + 1
                          ).padStart(2, "0");
                          const day = String(selectedDate.getDate()).padStart(
                            2,
                            "0"
                          );

                          setEditEndDate(`${year}-${month}-${day}`);

                          if (Platform.OS === "android") {
                            setDatePickerVisible(false);
                          }
                        }}
                      />
                    )}

                    <View style={styles.mobileDatePreview}>
                      <FontAwesome6
                        name="calendar-days"
                        size={15}
                        color={colors.primaryBlue}
                      />

                      <Text
                        style={[
                          styles.mobileDatePreviewText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {editEndDate || "Select date"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.mobilePickerDone,
                        {
                          backgroundColor: colors.primaryBlue,
                        },
                      ]}
                      onPress={() => setDatePickerVisible(false)}
                    >
                      <Text style={styles.mobilePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              <PrimaryButton
                title="Save"
                onPress={saveEdit}
                loading={saving}
                style={{
                  marginTop: spacing.md,
                }}
              />

              <PrimaryButton
                title="Cancel"
                variant="light"
                onPress={() => setEditVisible(false)}
                style={{
                  marginTop: 10,
                }}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({ label, value, danger = false, styles }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>

      <Text style={[styles.detailValue, danger && styles.detailValueDanger]}>
        {value ?? "-"}
      </Text>
    </View>
  );
}

// ============================================================
// DATE TIME FORMATTER
// ============================================================

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

// ============================================================
// DESKTOP STUDENTS LAYOUT
// ============================================================

function DesktopStudentsLayout({
  colors,

  students,
  loading,
  refreshing,

  search,
  setSearch,

  activeTab,
  handleTabChange,

  handleRefresh,
  handleImport,
  handleExport,

  importing,
  exporting,

  page,
  totalPages,
  totalStudents,

  getFirstItemNumber,
  getLastItemNumber,

  handlePreviousPage,
  handleNextPage,

  selected,
  openStudent,
  closeProfile,

  history,
  historyLoading,

  getStudentStatus,
  formatDate,

  openEdit,
  handleDelete,

  editVisible,
  setEditVisible,

  editName,
  setEditName,

  editPhone,
  setEditPhone,

  editSeat,
  setEditSeat,

  availableSeats,

  editEndDate,
  setEditEndDate,

  editEndDateValue,
  setEditEndDateValue,

  seatPickerVisible,
  setSeatPickerVisible,

  datePickerVisible,
  setDatePickerVisible,

  saveEdit,
  saving,
}) {
  const desktopStyles = createDesktopStyles(colors);

  const headerRight = (
    <View style={desktopStyles.countBadge}>
      <FontAwesome6 name="users" size={13} color={colors.primaryBlue} />

      <Text style={desktopStyles.countBadgeText}>{totalStudents} Students</Text>
    </View>
  );

  return (
    <DesktopLayout
      activeRoute="Students"
      title="Students"
      subtitle="Manage student records, seats and subscriptions"
      headerRight={headerRight}
    >
      <View style={desktopStyles.studentsBody}>
        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <View style={desktopStyles.toolbar}>
          {/* SEARCH */}

          <View style={desktopStyles.desktopSearch}>
            <FontAwesome6
              name="magnifying-glass"
              size={14}
              color={colors.textMuted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search students, phone or seat..."
              placeholderTextColor={colors.textFaint}
              style={desktopStyles.desktopSearchInput}
            />

            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearch("")}
                style={desktopStyles.searchClear}
              >
                <FontAwesome6 name="xmark" size={13} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* TABS */}

          <View style={desktopStyles.desktopTabs}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key)}
                  activeOpacity={0.8}
                  style={[
                    desktopStyles.desktopTab,
                    active && desktopStyles.desktopTabActive,
                  ]}
                >
                  <Text
                    style={[
                      desktopStyles.desktopTabText,
                      active && desktopStyles.desktopTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ACTIONS */}

          <View style={desktopStyles.toolbarActions}>
            {/* IMPORT */}

            <TouchableOpacity
              onPress={handleImport}
              disabled={importing || exporting}
              activeOpacity={0.8}
              style={desktopStyles.toolbarButtonSecondary}
            >
              {importing ? (
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              ) : (
                <FontAwesome6
                  name="file-import"
                  size={13}
                  color={colors.primaryBlue}
                />
              )}

              <Text style={desktopStyles.toolbarButtonSecondaryText}>
                {importing ? "Importing..." : "Import"}
              </Text>
            </TouchableOpacity>

            {/* EXPORT */}

            <TouchableOpacity
              onPress={handleExport}
              disabled={importing || exporting}
              activeOpacity={0.8}
              style={desktopStyles.toolbarButtonSecondary}
            >
              {exporting ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <FontAwesome6
                  name="file-export"
                  size={13}
                  color={colors.textSecondary}
                />
              )}

              <Text style={desktopStyles.toolbarButtonSecondaryText}>
                {exporting ? "Exporting..." : "Export"}
              </Text>
            </TouchableOpacity>

            {/* REFRESH */}

            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              activeOpacity={0.8}
              style={desktopStyles.refreshButton}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              ) : (
                <FontAwesome6
                  name="rotate"
                  size={13}
                  color={colors.primaryBlue}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ====================================================
            CONTENT
        ==================================================== */}

        <View style={desktopStyles.content}>
          {/* ==================================================
              STUDENT LIST
          ================================================== */}

          <View style={desktopStyles.listPanel}>
            {/* PANEL HEADER */}

            <View style={desktopStyles.listHeader}>
              <View>
                <Text style={desktopStyles.listTitle}>Student Records</Text>

                <Text style={desktopStyles.listSubtitle}>
                  {totalStudents === 0
                    ? "No students"
                    : `${getFirstItemNumber()}–${getLastItemNumber()} of ${totalStudents}`}
                </Text>
              </View>

              <FontAwesome6 name="users" size={18} color={colors.textMuted} />
            </View>

            {/* LOADING */}

            {loading ? (
              <View style={desktopStyles.desktopLoading}>
                <ActivityIndicator size="large" color={colors.primaryBlue} />

                <Text style={desktopStyles.desktopLoadingText}>
                  Loading students...
                </Text>
              </View>
            ) : students.length === 0 ? (
              /* EMPTY */
              <View style={desktopStyles.desktopEmpty}>
                <View style={desktopStyles.desktopEmptyIcon}>
                  <FontAwesome6
                    name="users"
                    size={28}
                    color={colors.textMuted}
                  />
                </View>

                <Text style={desktopStyles.desktopEmptyTitle}>
                  No students found
                </Text>

                <Text style={desktopStyles.desktopEmptyText}>
                  {search.trim()
                    ? "Try a different search."
                    : activeTab === "EXPIRED"
                    ? "There are no expired students."
                    : activeTab === "ACTIVE"
                    ? "There are no active students."
                    : "No students have been added yet."}
                </Text>
              </View>
            ) : (
              /* STUDENTS */

              <ScrollView
                style={desktopStyles.studentList}
                contentContainerStyle={desktopStyles.studentListContent}
                showsVerticalScrollIndicator={false}
              >
                {students.map((student) => {
                  const status = getStudentStatus(student);

                  const isSelected = selected?.id === student.id;

                  return (
                    <DesktopStudentRow
                      key={student.id}
                      student={student}
                      status={status}
                      selected={isSelected}
                      colors={colors}
                      formatDate={formatDate}
                      onPress={() => openStudent(student)}
                      onEdit={() => openEdit(student)}
                    />
                  );
                })}
              </ScrollView>
            )}

            {/* ==================================================
                PAGINATION
            ================================================== */}

            {!loading && totalStudents > 0 && (
              <View style={desktopStyles.pagination}>
                <Text style={desktopStyles.paginationText}>
                  Showing {getFirstItemNumber()}–{getLastItemNumber()} of{" "}
                  {totalStudents}
                </Text>

                <View style={desktopStyles.paginationButtons}>
                  {/* PREVIOUS */}

                  <TouchableOpacity
                    onPress={handlePreviousPage}
                    disabled={page === 0 || loading}
                    activeOpacity={0.8}
                    style={[
                      desktopStyles.paginationButton,
                      (page === 0 || loading) &&
                        desktopStyles.paginationButtonDisabled,
                    ]}
                  >
                    <FontAwesome6
                      name="chevron-left"
                      size={11}
                      color={page === 0 ? colors.textFaint : colors.primaryBlue}
                    />

                    <Text
                      style={[
                        desktopStyles.paginationButtonText,
                        page === 0 &&
                          desktopStyles.paginationButtonTextDisabled,
                      ]}
                    >
                      Previous
                    </Text>
                  </TouchableOpacity>

                  {/* CURRENT PAGE */}

                  <View style={desktopStyles.pageNumber}>
                    <Text style={desktopStyles.pageNumberText}>
                      {totalPages === 0 ? 0 : page + 1}
                    </Text>
                  </View>

                  <Text style={desktopStyles.pageOfText}>of {totalPages}</Text>

                  {/* NEXT */}

                  <TouchableOpacity
                    onPress={handleNextPage}
                    disabled={page >= totalPages - 1 || loading}
                    activeOpacity={0.8}
                    style={[
                      desktopStyles.paginationButton,
                      (page >= totalPages - 1 || loading) &&
                        desktopStyles.paginationButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        desktopStyles.paginationButtonText,
                        page >= totalPages - 1 &&
                          desktopStyles.paginationButtonTextDisabled,
                      ]}
                    >
                      Next
                    </Text>

                    <FontAwesome6
                      name="chevron-right"
                      size={11}
                      color={
                        page >= totalPages - 1
                          ? colors.textFaint
                          : colors.primaryBlue
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* ==================================================
              DETAILS PANEL
          ================================================== */}

          <View style={desktopStyles.detailsPanel}>
            {selected ? (
              <DesktopStudentDetails
                student={selected}
                colors={colors}
                history={history}
                historyLoading={historyLoading}
                getStudentStatus={getStudentStatus}
                formatDate={formatDate}
                onClose={closeProfile}
                onEdit={() => openEdit(selected)}
                onDelete={handleDelete}
              />
            ) : (
              <View style={desktopStyles.noSelection}>
                <View style={desktopStyles.noSelectionIcon}>
                  <FontAwesome6
                    name="user"
                    size={30}
                    color={colors.textMuted}
                  />
                </View>

                <Text style={desktopStyles.noSelectionTitle}>
                  Select a student
                </Text>

                <Text style={desktopStyles.noSelectionText}>
                  Select a student from the list to view their complete profile,
                  subscription details and seat history.
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ======================================================
          EDIT MODAL
      ====================================================== */}

      <DesktopEditModal
        visible={editVisible}
        colors={colors}
        onClose={() => setEditVisible(false)}
        editSeat={editSeat}
        setEditSeat={setEditSeat}
        availableSeats={availableSeats}
        seatPickerVisible={seatPickerVisible}
        setSeatPickerVisible={setSeatPickerVisible}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        editEndDateValue={editEndDateValue}
        setEditEndDateValue={setEditEndDateValue}
        datePickerVisible={datePickerVisible}
        setDatePickerVisible={setDatePickerVisible}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        saveEdit={saveEdit}
        saving={saving}
      />
    </DesktopLayout>
  );
}

// ============================================================
// DESKTOP STUDENT ROW
// ============================================================

function DesktopStudentRow({
  student,
  status,
  selected,
  colors,
  formatDate,
  onPress,
  onEdit,
}) {
  const styles = createDesktopStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.studentRow, selected && styles.studentRowSelected]}
    >
      {/* ====================================================
          AVATAR
      ==================================================== */}

      <View style={styles.studentRowAvatar}>
        <Text style={styles.studentRowAvatarText}>
          {student.name?.charAt(0)?.toUpperCase() || "S"}
        </Text>
      </View>

      {/* ====================================================
          STUDENT INFORMATION
      ==================================================== */}

      <View style={styles.studentRowMain}>
        <View style={styles.studentRowNameLine}>
          <Text style={styles.studentRowName} numberOfLines={1}>
            {student.name || "-"}
          </Text>

          <View
            style={[
              styles.studentStatusBadge,
              status === "EXPIRED"
                ? styles.studentExpiredBadge
                : styles.studentActiveBadge,
            ]}
          >
            <Text
              style={[
                styles.studentStatusText,
                status === "EXPIRED"
                  ? styles.studentExpiredText
                  : styles.studentActiveText,
              ]}
            >
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.studentRowMeta}>
          <View style={styles.studentRowMetaItem}>
            <FontAwesome6 name="phone" size={10} color={colors.textMuted} />

            <Text style={styles.studentRowMetaText}>
              {student.phone || "No phone"}
            </Text>
          </View>

          <View style={styles.studentRowMetaItem}>
            <FontAwesome6 name="chair" size={10} color={colors.textMuted} />

            <Text style={styles.studentRowMetaText}>
              Seat {student.seatNumber ?? "-"}
            </Text>
          </View>
        </View>
      </View>

      {/* ====================================================
          EXPIRY
      ==================================================== */}

      <View style={styles.studentRowExpiry}>
        <Text style={styles.studentRowExpiryLabel}>Expires</Text>

        <Text
          style={[
            styles.studentRowExpiryValue,
            status === "EXPIRED" && styles.studentRowExpiryExpired,
          ]}
        >
          {formatDate(student.expireDate || student.endDate)}
        </Text>
      </View>

      {/* ====================================================
          PAYMENT
      ==================================================== */}

      <View style={styles.studentRowAmount}>
        <Text style={styles.studentRowAmountLabel}>Payment</Text>

        <Text style={styles.studentRowAmountValue}>
          {student.amountPaid != null ? `₹${student.amountPaid}` : "-"}
        </Text>
      </View>

      {/* ====================================================
          EDIT
      ==================================================== */}

      <TouchableOpacity
        onPress={(event) => {
          event?.stopPropagation?.();

          onEdit();
        }}
        activeOpacity={0.8}
        style={styles.studentRowEdit}
      >
        <FontAwesome6 name="pen" size={12} color={colors.primaryBlue} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ============================================================
// DESKTOP STUDENT DETAILS
// ============================================================

function DesktopStudentDetails({
  student,
  colors,
  history,
  historyLoading,
  getStudentStatus,
  formatDate,
  onClose,
  onEdit,
  onDelete,
}) {
  const styles = createDesktopStyles(colors);

  const status = getStudentStatus(student);

  return (
    <View style={styles.detailsWrapper}>
      {/* ====================================================
          DETAILS HEADER
      ==================================================== */}

      <View style={styles.detailsHeader}>
        <View style={styles.detailsHeaderTitleArea}>
          <Text style={styles.detailsHeaderTitle}>Student Details</Text>

          <Text style={styles.detailsHeaderSubtitle}>
            Complete student information
          </Text>
        </View>

        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.8}
          style={styles.detailsClose}
        >
          <FontAwesome6 name="xmark" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ====================================================
          PROFILE
      ==================================================== */}

      <View style={styles.detailsProfile}>
        <View style={styles.detailsAvatar}>
          <Text style={styles.detailsAvatarText}>
            {student.name?.charAt(0)?.toUpperCase() || "S"}
          </Text>
        </View>

        <View style={styles.detailsProfileInfo}>
          <Text style={styles.detailsName}>{student.name || "-"}</Text>

          <View style={styles.detailsPhoneRow}>
            <FontAwesome6 name="phone" size={11} color={colors.textMuted} />

            <Text style={styles.detailsPhone}>
              {student.phone || "No phone number"}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.detailsStatus,
            status === "EXPIRED"
              ? styles.detailsStatusExpired
              : styles.detailsStatusActive,
          ]}
        >
          <View
            style={[
              styles.detailsStatusDot,
              status === "EXPIRED"
                ? styles.detailsStatusDotExpired
                : styles.detailsStatusDotActive,
            ]}
          />

          <Text
            style={[
              styles.detailsStatusText,
              status === "EXPIRED"
                ? styles.detailsStatusTextExpired
                : styles.detailsStatusTextActive,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      {/* ====================================================
          INFORMATION CARDS
      ==================================================== */}

      <View style={styles.detailsCards}>
        <DesktopInfoCard
          icon="chair"
          label="Seat Number"
          value={student.seatNumber ?? "-"}
          colors={colors}
        />

        <DesktopInfoCard
          icon="calendar-plus"
          label="Booking Date"
          value={formatDate(student.bookingDate)}
          colors={colors}
        />

        <DesktopInfoCard
          icon="calendar-xmark"
          label="Expiry Date"
          value={formatDate(student.expireDate || student.endDate)}
          danger={status === "EXPIRED"}
          colors={colors}
        />

        <DesktopInfoCard
          icon="indian-rupee-sign"
          label="Amount Paid"
          value={student.amount != null ? `₹${student.amount}` : "-"}
          colors={colors}
        />
      </View>

      {/* ====================================================
          STUDENT INFORMATION
      ==================================================== */}

      <View style={styles.infoSection}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText}>Student Information</Text>
        </View>

        <View style={styles.infoGrid}>
          <DesktopInfoLine
            label="Full Name"
            value={student.name || "-"}
            colors={colors}
          />

          <DesktopInfoLine
            label="Phone Number"
            value={student.phone || "-"}
            colors={colors}
          />

          <DesktopInfoLine
            label="Student Type"
            value={student.studentType || student.type || "FULL_DAY"}
            colors={colors}
          />

          <DesktopInfoLine
            label="Seat Number"
            value={student.seatNumber ?? "-"}
            colors={colors}
          />
        </View>
      </View>

      {/* ====================================================
          HISTORY
      ==================================================== */}

      <View style={styles.historySection}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionHeadingText}>Seat Change History</Text>

            <Text style={styles.sectionHeadingSubtext}>
              Previous seat assignments
            </Text>
          </View>

          <View style={styles.historyCount}>
            <Text style={styles.historyCountText}>{history.length}</Text>
          </View>
        </View>

        {historyLoading ? (
          <View style={styles.desktopHistoryLoading}>
            <ActivityIndicator size="small" color={colors.primaryBlue} />

            <Text style={styles.desktopHistoryLoadingText}>
              Loading history...
            </Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.desktopNoHistory}>
            <FontAwesome6
              name="clock-rotate-left"
              size={18}
              color={colors.textMuted}
            />

            <Text style={styles.desktopNoHistoryText}>
              No seat change history available.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.desktopHistoryList}
            showsVerticalScrollIndicator={false}
          >
            {history.map((item, index) => (
              <View key={item.id ?? index} style={styles.desktopHistoryItem}>
                <View style={styles.desktopHistoryTimeline}>
                  <View style={styles.desktopHistoryDot} />

                  {index < history.length - 1 && (
                    <View style={styles.desktopHistoryLine} />
                  )}
                </View>

                <View style={styles.desktopHistoryContent}>
                  <Text style={styles.desktopHistoryTitle}>
                    Seat {item.oldSeat ?? item.fromSeat ?? "-"} →{" "}
                    {item.newSeat ?? item.toSeat ?? "-"}
                  </Text>

                  <Text style={styles.desktopHistoryDate}>
                    {formatDateTime(item.changedAt ?? item.date)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ====================================================
          ACTION
      ==================================================== */}

      <View style={styles.detailsFooter}>
        <View style={styles.detailsFooterButtons}>
          {/* EDIT */}
          <TouchableOpacity
            onPress={onEdit}
            activeOpacity={0.85}
            style={styles.desktopEditButton}
          >
            <FontAwesome6 name="pen" size={13} color="#ffffff" />

            <Text style={styles.desktopEditButtonText}>Edit Student</Text>
          </TouchableOpacity>

          {/* DELETE */}
          <TouchableOpacity
            onPress={onDelete}
            activeOpacity={0.85}
            style={styles.desktopDeleteButton}
          >
            <FontAwesome6 name="trash-can" size={13} color="#ffffff" />

            <Text style={styles.desktopDeleteButtonText}>Delete Student</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ============================================================
// DESKTOP INFO CARD
// ============================================================

function DesktopInfoCard({ icon, label, value, danger = false, colors }) {
  const styles = createDesktopStyles(colors);

  return (
    <View style={[styles.infoCard, danger && styles.infoCardDanger]}>
      <View style={[styles.infoCardIcon, danger && styles.infoCardIconDanger]}>
        <FontAwesome6
          name={icon}
          size={13}
          color={danger ? colors.danger : colors.primaryBlue}
        />
      </View>

      <View style={styles.infoCardContent}>
        <Text style={styles.infoCardLabel}>{label}</Text>

        <Text
          style={[styles.infoCardValue, danger && styles.infoCardValueDanger]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// DESKTOP INFO LINE
// ============================================================

function DesktopInfoLine({ label, value, colors }) {
  const styles = createDesktopStyles(colors);

  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLineLabel}>{label}</Text>

      <Text style={styles.infoLineValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

// ============================================================
// DESKTOP EDIT MODAL
// ============================================================

function DesktopEditModal({
  visible,
  colors,
  onClose,

  editName,
  setEditName,

  editSeat,
  setEditSeat,
  availableSeats,

  seatPickerVisible,
  setSeatPickerVisible,

  editEndDate,
  setEditEndDate,

  editEndDateValue,
  setEditEndDateValue,

  datePickerVisible,
  setDatePickerVisible,

  editPhone,
  setEditPhone,

  saveEdit,
  saving,
}) {
  const styles = createDesktopStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.desktopModalOverlay}>
        <View style={styles.desktopEditModal}>
          {/* ==================================================
              HEADER
          ================================================== */}

          <View style={styles.desktopModalHeader}>
            <View>
              <Text style={styles.desktopModalTitle}>Edit Student</Text>

              <Text style={styles.desktopModalSubtitle}>
                Update student information
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.desktopModalClose}
            >
              <FontAwesome6 name="xmark" size={15} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ==================================================
              FORM
          ================================================== */}

          <ScrollView
            style={styles.desktopModalScroll}
            contentContainerStyle={styles.desktopModalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <DesktopField
              label="Student Name"
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter student name"
              colors={colors}
            />

            <DesktopField
              label="Phone Number"
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              colors={colors}
            />

            <Text style={styles.desktopFieldLabel}>Seat Number</Text>

            <TouchableOpacity
              style={styles.desktopSelectField}
              onPress={() => setSeatPickerVisible(true)}
              disabled={saving}
            >
              <View style={styles.desktopSelectLeft}>
                <FontAwesome6
                  name="chair"
                  size={16}
                  color={colors.primaryBlue}
                />

                <Text style={styles.desktopSelectValue}>Seat {editSeat}</Text>
              </View>

              <FontAwesome6
                name="chevron-down"
                size={13}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <Modal
              visible={seatPickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setSeatPickerVisible(false)}
            >
              <View style={styles.seatPickerOverlay}>
                <View
                  style={[
                    styles.seatPickerContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.seatPickerHeader}>
                    <View>
                      <Text
                        style={[
                          styles.seatPickerTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Change Seat
                      </Text>

                      <Text
                        style={[
                          styles.seatPickerSubtitle,
                          { color: colors.textMuted },
                        ]}
                      >
                        Select an available seat
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setSeatPickerVisible(false)}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.seatPickerList}
                    showsVerticalScrollIndicator={false}
                  >
                    <View style={styles.seatPickerGrid}>
                      {availableSeats.map((seat) => {
                        const selected = Number(editSeat) === Number(seat);

                        return (
                          <TouchableOpacity
                            key={seat}
                            style={[
                              styles.seatPickerOption,
                              {
                                backgroundColor: selected
                                  ? colors.primaryBlue
                                  : colors.bg,
                                borderColor: selected
                                  ? colors.primaryBlue
                                  : colors.border,
                              },
                            ]}
                            onPress={() => {
                              console.log(
                                "🪑 Student edit seat selected:",
                                seat
                              );

                              setEditSeat(String(seat));
                              setSeatPickerVisible(false);
                            }}
                          >
                            <FontAwesome6
                              name="chair"
                              size={14}
                              color={selected ? "#FFFFFF" : colors.primaryBlue}
                            />

                            <Text
                              style={{
                                marginTop: 5,
                                fontSize: 14,
                                fontWeight: "700",
                                color: selected
                                  ? "#FFFFFF"
                                  : colors.textPrimary,
                              }}
                            >
                              {seat}
                            </Text>

                            {selected && (
                              <FontAwesome6
                                name="check"
                                size={10}
                                color="#FFFFFF"
                                style={{
                                  position: "absolute",
                                  top: 5,
                                  right: 5,
                                }}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    style={[
                      styles.seatPickerDone,
                      {
                        backgroundColor: colors.primaryBlue,
                      },
                    ]}
                    onPress={() => setSeatPickerVisible(false)}
                  >
                    <Text style={styles.seatPickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Text style={styles.desktopFieldLabel}>End Date</Text>

            <TouchableOpacity
              style={styles.desktopSelectField}
              onPress={() => setDatePickerVisible(true)}
              disabled={saving}
            >
              <View style={styles.desktopSelectLeft}>
                <FontAwesome6
                  name="calendar-days"
                  size={16}
                  color={colors.primaryBlue}
                />

                <Text style={styles.desktopSelectValue}>
                  {editEndDate || "Select end date"}
                </Text>
              </View>

              <FontAwesome6
                name="chevron-down"
                size={13}
                color={colors.textMuted}
              />
            </TouchableOpacity>
            <Modal
              visible={datePickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDatePickerVisible(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View
                  style={[
                    styles.datePickerContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.datePickerHeader}>
                    <View>
                      <Text
                        style={[
                          styles.datePickerTitle,
                          { color: colors.textPrimary },
                        ]}
                      >
                        Select End Date
                      </Text>

                      <Text
                        style={[
                          styles.datePickerSubtitle,
                          { color: colors.textMuted },
                        ]}
                      >
                        Choose the subscription expiry date
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => setDatePickerVisible(false)}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {Platform.OS === "web" ? (
                    <View
                      style={[
                        styles.webDateInputWrapper,
                        {
                          backgroundColor: colors.bg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <FontAwesome6
                        name="calendar-days"
                        size={16}
                        color={colors.primaryBlue}
                      />

                      <input
                        type="date"
                        value={editEndDate || ""}
                        onChange={(e) => {
                          const value = e.target.value;

                          setEditEndDate(value);

                          if (value) {
                            setEditEndDateValue(parseStudentDate(value));
                          }
                        }}
                        style={{
                          flex: 1,
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          color: colors.textPrimary,
                          fontSize: 15,
                          fontWeight: "600",
                          padding: 0,
                          minWidth: 0,
                        }}
                      />
                    </View>
                  ) : (
                    <DateTimePicker
                      value={editEndDateValue}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        if (!selectedDate) {
                          return;
                        }

                        setEditEndDateValue(selectedDate);

                        const year = selectedDate.getFullYear();
                        const month = String(
                          selectedDate.getMonth() + 1
                        ).padStart(2, "0");
                        const day = String(selectedDate.getDate()).padStart(
                          2,
                          "0"
                        );

                        setEditEndDate(`${year}-${month}-${day}`);

                        if (Platform.OS === "android") {
                          setDatePickerVisible(false);
                        }
                      }}
                    />
                  )}

                  <View style={styles.datePreview}>
                    <FontAwesome6
                      name="calendar-days"
                      size={15}
                      color={colors.primaryBlue}
                    />

                    <Text
                      style={[
                        styles.datePreviewText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {editEndDate || "Select date"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.dateDoneButton,
                      {
                        backgroundColor: colors.primaryBlue,
                      },
                    ]}
                    onPress={() => setDatePickerVisible(false)}
                  >
                    <Text style={styles.dateDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </ScrollView>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <View style={styles.desktopModalFooter}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              disabled={saving}
              style={styles.desktopModalCancel}
            >
              <Text style={styles.desktopModalCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveEdit}
              activeOpacity={0.85}
              disabled={saving}
              style={[
                styles.desktopModalSave,
                saving && styles.desktopModalSaveDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <FontAwesome6 name="floppy-disk" size={13} color="#ffffff" />
              )}

              <Text style={styles.desktopModalSaveText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================
// DESKTOP FIELD
// ============================================================

function DesktopField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}) {
  const styles = createDesktopStyles(colors);

  return (
    <View style={styles.desktopField}>
      <Text style={styles.desktopFieldLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={keyboardType}
        style={styles.desktopFieldInput}
        autoCapitalize="none"
      />
    </View>
  );
}
// ============================================================
// DESKTOP STYLES
// ============================================================

function createDesktopStyles(colors) {
  return StyleSheet.create({
    studentCard: {
      flexDirection: "row",
      alignItems: "flex-start",

      width: "100%",

      backgroundColor: colors.card,

      borderRadius: 16,

      paddingVertical: 12,
      paddingHorizontal: 12,

      marginBottom: 10,

      borderWidth: 1,
      borderColor: colors.borderLight,

      minHeight: 108,
    },

    mobileProfileActionButtons: {
      flexDirection: "row",

      alignItems: "center",

      gap: 8,
    },

    mobileProfileEditButton: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    mobileProfileEditText: {
      display: "none",
    },
    mobileProfileVacateButton: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor: colors.dangerBg,

      alignItems: "center",
      justifyContent: "center",
    },

    mobileProfileVacateText: {
      display: "none",
    },

    // ==========================================================
    // MOBILE SELECT FIELDS
    // ==========================================================

    mobileSelectLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    mobileSelectValue: {
      marginLeft: 10,
      flex: 1,

      color: colors.textPrimary,

      fontSize: 15,
      fontWeight: "600",

      includeFontPadding: false,
    },

    // ==========================================================
    // MOBILE PICKER
    // ==========================================================

    mobilePickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 18,
    },

    mobilePickerContainer: {
      width: "100%",
      maxWidth: 430,
      maxHeight: "82%",

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,
    },

    mobileDatePickerContainer: {
      width: "100%",
      maxWidth: 430,

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,

      alignItems: "stretch",
    },

    mobilePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    mobilePickerTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    mobilePickerSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },

    mobilePickerList: {
      maxHeight: 400,
      marginTop: 14,
    },

    mobilePickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",

      rowGap: 10,

      paddingBottom: 8,
    },

    mobileSeatOption: {
      width: "22%",
      minHeight: 62,

      borderRadius: 12,
      borderWidth: 1,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    mobileSeatOptionText: {
      marginTop: 5,

      fontSize: 13,
      fontWeight: "800",
    },

    mobileSeatCheck: {
      position: "absolute",

      top: 6,
      right: 6,
    },

    mobilePickerDone: {
      height: 46,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      marginTop: 14,
    },

    mobilePickerDoneText: {
      color: "#FFFFFF",

      fontSize: 14,
      fontWeight: "800",
    },

    mobileDatePreview: {
      minHeight: 46,

      marginTop: 14,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 11,

      backgroundColor: colors.bg,

      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",
    },

    mobileDatePreviewText: {
      marginLeft: 10,

      fontSize: 14,
      fontWeight: "700",

      color: colors.textPrimary,
    },
    mobileStudentMain: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },
    // ==========================================================
    // MOBILE SELECT FIELDS
    // ==========================================================

    mobileSelectField: {
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
      justifyContent: "space-between",

      marginBottom: 14,
    },

    // ==========================================================
    // MOBILE PICKERS
    // ==========================================================

    mobileDatePreview: {
      minHeight: 46,

      marginTop: 14,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 11,

      backgroundColor: colors.bg,

      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",
    },

    mobileDatePreviewText: {
      marginLeft: 10,

      fontSize: 14,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    // ========================================================
    // MOBILE SELECT FIELD
    // ========================================================

    mobileSelectField: {
      height: 52,
      minHeight: 52,

      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,

      backgroundColor: colors.bg,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 16,
    },

    mobileSelectLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    mobileSelectValue: {
      marginLeft: 10,

      color: colors.textPrimary,

      fontSize: 15,
      fontWeight: "600",

      flexShrink: 1,
    },

    // ========================================================
    // MOBILE PICKER
    // ========================================================

    mobilePickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.55)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 18,
    },

    mobilePickerContainer: {
      width: "100%",
      maxWidth: 430,

      maxHeight: "82%",

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,
    },

    mobileDatePickerContainer: {
      width: "100%",
      maxWidth: 430,

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,

      alignItems: "stretch",
    },

    mobilePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    mobilePickerTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    mobilePickerSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },

    mobilePickerList: {
      maxHeight: 400,

      marginTop: 14,
    },

    mobilePickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",

      justifyContent: "space-between",

      rowGap: 10,

      paddingBottom: 8,
    },

    mobileSeatOption: {
      width: "22%",

      minHeight: 62,

      borderRadius: 12,
      borderWidth: 1,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    mobileSeatOptionText: {
      marginTop: 5,

      fontSize: 13,
      fontWeight: "800",
    },

    mobileSeatCheck: {
      position: "absolute",

      top: 6,
      right: 6,
    },

    mobilePickerDone: {
      height: 46,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      marginTop: 14,
    },

    mobilePickerDoneText: {
      color: "#FFFFFF",

      fontSize: 14,
      fontWeight: "800",
    },

    mobileDatePreview: {
      minHeight: 46,

      marginTop: 14,

      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 11,

      backgroundColor: colors.bg,

      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",
    },

    mobileDatePreviewText: {
      marginLeft: 10,

      fontSize: 14,
      fontWeight: "700",
    },
    // ========================================================
    // SELECT FIELD
    // ========================================================

    desktopSelectField: {
      height: 42,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      backgroundColor: colors.bg,

      paddingHorizontal: 12,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      cursor: "pointer",
    },

    desktopSelectLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    desktopSelectValue: {
      marginLeft: 10,
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "600",
    },

    // ========================================================
    // SEAT PICKER
    // ========================================================

    seatPickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.52)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 20,
      paddingVertical: 30,
    },

    seatPickerContainer: {
      width: 440,
      maxWidth: "94%",
      maxHeight: "78%",

      borderRadius: 16,
      borderWidth: 1,

      padding: 18,

      overflow: "hidden",

      shadowColor: "#000000",
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 10,
      },

      elevation: 12,
    },

    seatPickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    seatPickerTitle: {
      fontSize: 16,
      fontWeight: "800",
    },

    seatPickerSubtitle: {
      fontSize: 10,
      marginTop: 4,
    },

    seatPickerList: {
      maxHeight: 390,
      marginTop: 14,
    },

    seatPickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",

      gap: 10,

      paddingBottom: 8,
    },

    seatPickerOption: {
      width: 62,
      height: 62,

      borderWidth: 1,
      borderRadius: 10,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",

      cursor: "pointer",
    },

    seatPickerDone: {
      height: 42,

      borderRadius: 9,

      marginTop: 14,

      alignItems: "center",
      justifyContent: "center",
    },

    seatPickerDoneText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },

    // ========================================================
    // DATE PICKER
    // ========================================================

    datePickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.52)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 20,
      paddingVertical: 30,
    },

    datePickerContainer: {
      width: 400,
      maxWidth: "94%",

      borderRadius: 16,
      borderWidth: 1,

      padding: 18,

      alignItems: "stretch",

      shadowColor: "#000000",
      shadowOpacity: 0.22,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 10,
      },

      elevation: 12,
    },

    datePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    datePickerTitle: {
      fontSize: 16,
      fontWeight: "800",
    },

    datePickerSubtitle: {
      fontSize: 10,
      marginTop: 4,
    },

    datePreview: {
      minHeight: 42,

      marginTop: 14,

      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,

      backgroundColor: colors.bg,

      paddingHorizontal: 12,

      flexDirection: "row",
      alignItems: "center",
    },

    datePreviewText: {
      marginLeft: 10,

      fontSize: 12,
      fontWeight: "700",
    },

    dateDoneButton: {
      height: 42,

      borderRadius: 9,

      marginTop: 12,

      alignItems: "center",
      justifyContent: "center",
    },

    dateDoneText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "800",
    },
    detailsFooterButtons: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },

    desktopEditButton: {
      flex: 1,
      maxWidth: 180,
      height: 38,
      borderRadius: 8,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    desktopDeleteButton: {
      flex: 1,
      maxWidth: 180,
      height: 38,
      borderRadius: 8,
      backgroundColor: colors.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    desktopEditButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },

    desktopDeleteButtonText: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "700",
    },

    // ========================================================
    // MAIN BODY
    // ========================================================

    studentsBody: {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      overflow: "hidden",
    },

    // ========================================================
    // STUDENT COUNT
    // ========================================================

    countBadge: {
      height: 36,
      paddingHorizontal: 13,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    countBadgeText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },

    // ========================================================
    // TOOLBAR
    // ========================================================

    toolbar: {
      minHeight: 58,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 13,
      padding: 9,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
      flexShrink: 0,
    },

    desktopSearch: {
      height: 39,
      width: 260,
      flexShrink: 0,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 9,
      paddingHorizontal: 11,
      flexDirection: "row",
      alignItems: "center",
    },

    desktopSearchInput: {
      flex: 1,
      minWidth: 0,
      marginLeft: 9,
      color: colors.textPrimary,
      fontSize: 12,
      outlineStyle: "none",
      paddingVertical: 0,
    },

    searchClear: {
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // TABS
    // ========================================================

    desktopTabs: {
      flexDirection: "row",
      flexShrink: 0,
      alignItems: "center",
      backgroundColor: colors.bg,
      borderRadius: 9,
      padding: 3,
    },

    desktopTab: {
      height: 33,
      paddingHorizontal: 14,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopTabActive: {
      backgroundColor: colors.card,
      shadowColor: "#000000",
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      elevation: 1,
    },

    desktopTabText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },

    desktopTabTextActive: {
      color: colors.primaryBlue,
      fontWeight: "700",
    },

    // ========================================================
    // TOOLBAR ACTIONS
    // ========================================================

    toolbarActions: {
      marginLeft: "auto",
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    toolbarButtonSecondary: {
      height: 36,
      paddingHorizontal: 11,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    toolbarButtonSecondaryText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: "600",
    },

    refreshButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
    },

    // ========================================================
    // CONTENT
    // ========================================================

    content: {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      flexDirection: "row",
      gap: 16,
    },

    // ========================================================
    // LEFT LIST PANEL
    // ========================================================

    listPanel: {
      flex: 1.15,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    // ========================================================
    // RIGHT DETAILS PANEL
    // ========================================================

    detailsPanel: {
      flex: 0.85,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    // ========================================================
    // LIST HEADER
    // ========================================================

    listHeader: {
      height: 68,
      flexShrink: 0,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    listTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },

    listSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    // ========================================================
    // STUDENT LIST
    // ========================================================

    studentList: {
      flex: 1,
      minHeight: 0,
    },

    studentListContent: {
      padding: 8,
      paddingBottom: 12,
    },

    // ========================================================
    // STUDENT ROW
    // ========================================================

    studentRow: {
      minHeight: 76,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "transparent",
      paddingHorizontal: 10,
      paddingVertical: 9,
      marginBottom: 5,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      cursor: "pointer",
    },

    studentRowSelected: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.primaryBlue,
    },

    studentRowAvatar: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      flexShrink: 0,
    },

    studentRowAvatarText: {
      color: colors.primaryBlue,
      fontSize: 14,
      fontWeight: "800",
    },

    studentRowMain: {
      flex: 1,
      minWidth: 160,
    },

    studentRowNameLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      minWidth: 0,
    },

    studentRowName: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      maxWidth: 190,
      flexShrink: 1,
    },

    // ========================================================
    // STATUS
    // ========================================================

    statusBadge: {
      marginTop: 8,

      paddingHorizontal: 9,
      paddingVertical: 4,

      borderRadius: radius.pill,

      alignSelf: "flex-end",
    },
    studentActiveBadge: {
      backgroundColor: colors.successBg,
    },

    studentExpiredBadge: {
      backgroundColor: colors.dangerBg,
    },

    studentStatusText: {
      fontSize: 8,
      fontWeight: "800",
      letterSpacing: 0.2,
    },

    studentActiveText: {
      color: colors.success,
    },

    studentExpiredText: {
      color: colors.danger,
    },

    // ========================================================
    // STUDENT META
    // ========================================================

    studentRowMeta: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      gap: 12,
    },

    studentRowMetaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    studentRowMetaText: {
      color: colors.textMuted,
      fontSize: 9,
    },

    // ========================================================
    // EXPIRY
    // ========================================================

    studentRowExpiry: {
      width: 90,
      marginHorizontal: 8,
      flexShrink: 0,
    },

    studentRowExpiryLabel: {
      color: colors.textFaint,
      fontSize: 8,
      marginBottom: 4,
    },

    studentRowExpiryValue: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
    },

    studentRowExpiryExpired: {
      color: colors.danger,
    },

    // ========================================================
    // PAYMENT
    // ========================================================

    studentRowAmount: {
      width: 70,
      marginHorizontal: 7,
      flexShrink: 0,
    },

    studentRowAmountLabel: {
      color: colors.textFaint,
      fontSize: 8,
      marginBottom: 4,
    },

    studentRowAmountValue: {
      color: colors.textPrimary,
      fontSize: 10,
      fontWeight: "700",
    },

    // ========================================================
    // EDIT BUTTON
    // ========================================================

    studentRowEdit: {
      width: 31,
      height: 31,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 5,
      backgroundColor: colors.card,
      flexShrink: 0,
    },

    // ========================================================
    // LOADING
    // ========================================================

    desktopLoading: {
      flex: 1,
      minHeight: 300,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopLoadingText: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 12,
    },

    // ========================================================
    // EMPTY
    // ========================================================

    desktopEmpty: {
      flex: 1,
      minHeight: 300,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
    },

    desktopEmptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 13,
    },

    desktopEmptyTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },

    desktopEmptyText: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: "center",
      marginTop: 6,
      maxWidth: 300,
      lineHeight: 17,
    },

    // ========================================================
    // PAGINATION
    // ========================================================

    pagination: {
      minHeight: 54,
      flexShrink: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
    },

    paginationText: {
      color: colors.textMuted,
      fontSize: 10,
    },

    paginationButtons: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    paginationButton: {
      height: 30,
      paddingHorizontal: 9,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    paginationButtonDisabled: {
      opacity: 0.45,
    },

    paginationButtonText: {
      color: colors.primaryBlue,
      fontSize: 9,
      fontWeight: "600",
    },

    paginationButtonTextDisabled: {
      color: colors.textFaint,
    },

    pageNumber: {
      minWidth: 29,
      height: 30,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },

    pageNumberText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "700",
    },

    pageOfText: {
      color: colors.textMuted,
      fontSize: 9,
      marginHorizontal: 1,
    },

    // ========================================================
    // DETAILS WRAPPER
    // ========================================================

    detailsWrapper: {
      flex: 1,
      minHeight: 0,
    },

    // ========================================================
    // DETAILS HEADER
    // ========================================================

    detailsHeader: {
      height: 68,
      flexShrink: 0,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailsHeaderTitleArea: {
      flex: 1,
      minWidth: 0,
    },

    detailsHeaderTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },

    detailsHeaderSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    detailsClose: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },

    // ========================================================
    // PROFILE
    // ========================================================

    detailsProfile: {
      padding: 18,
      flexShrink: 0,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    detailsAvatar: {
      width: 52,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      flexShrink: 0,
    },

    detailsAvatarText: {
      color: colors.primaryBlue,
      fontSize: 20,
      fontWeight: "800",
    },

    detailsProfileInfo: {
      flex: 1,
      minWidth: 0,
    },

    detailsName: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },

    detailsPhoneRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
    },

    detailsPhone: {
      color: colors.textMuted,
      fontSize: 10,
    },

    // ========================================================
    // DETAIL STATUS
    // ========================================================

    detailsStatus: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 999,
      gap: 6,
      flexShrink: 0,
    },

    detailsStatusActive: {
      backgroundColor: colors.successBg,
    },

    detailsStatusExpired: {
      backgroundColor: colors.dangerBg,
    },

    detailsStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 6,
    },

    detailsStatusDotActive: {
      backgroundColor: colors.success,
    },

    detailsStatusDotExpired: {
      backgroundColor: colors.danger,
    },

    detailsStatusText: {
      fontSize: 8,
      fontWeight: "800",
    },

    detailsStatusTextActive: {
      color: colors.success,
    },

    detailsStatusTextExpired: {
      color: colors.danger,
    },

    // ========================================================
    // INFO CARDS
    // ========================================================

    detailsCards: {
      padding: 14,
      flexShrink: 0,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    infoCard: {
      width: "48%",
      minHeight: 62,
      borderRadius: 10,
      backgroundColor: colors.bg,
      padding: 9,
      flexDirection: "row",
      alignItems: "center",
    },

    infoCardDanger: {
      backgroundColor: colors.dangerBg,
    },

    infoCardIcon: {
      width: 31,
      height: 31,
      borderRadius: 8,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
      flexShrink: 0,
    },

    infoCardIconDanger: {
      backgroundColor: colors.dangerBg,
    },

    infoCardContent: {
      flex: 1,
      minWidth: 0,
    },

    infoCardLabel: {
      color: colors.textMuted,
      fontSize: 8,
      marginBottom: 4,
    },

    infoCardValue: {
      color: colors.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },

    infoCardValueDanger: {
      color: colors.danger,
    },

    // ========================================================
    // STUDENT INFORMATION
    // ========================================================

    infoSection: {
      padding: 14,
      flexShrink: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 11,
    },

    sectionHeadingText: {
      color: colors.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },

    sectionHeadingSubtext: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 3,
    },

    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 9,
    },

    infoLine: {
      width: "48%",
      minWidth: 140,
      paddingVertical: 5,
    },

    infoLineLabel: {
      color: colors.textFaint,
      fontSize: 8,
      marginBottom: 3,
    },

    infoLineValue: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
    },

    // ========================================================
    // HISTORY
    // ========================================================

    historySection: {
      flex: 1,
      minHeight: 150,
      minWidth: 0,
      padding: 14,
    },

    historyCount: {
      minWidth: 24,
      height: 24,
      borderRadius: 7,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 7,
    },

    historyCountText: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: "700",
    },

    desktopHistoryList: {
      flex: 1,
      minHeight: 0,
    },

    desktopHistoryItem: {
      minHeight: 45,
      flexDirection: "row",
    },

    desktopHistoryTimeline: {
      width: 20,
      alignItems: "center",
      position: "relative",
    },

    desktopHistoryDot: {
      width: 7,
      height: 7,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue,
      marginTop: 5,
      zIndex: 2,
    },

    desktopHistoryLine: {
      position: "absolute",
      top: 12,
      bottom: 0,
      width: 1,
      backgroundColor: colors.border,
    },

    desktopHistoryContent: {
      flex: 1,
      paddingLeft: 5,
      paddingBottom: 11,
    },

    desktopHistoryTitle: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
    },

    desktopHistoryDate: {
      color: colors.textFaint,
      fontSize: 8,
      marginTop: 3,
    },

    desktopHistoryLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
    },

    desktopHistoryLoadingText: {
      color: colors.textMuted,
      fontSize: 9,
    },

    desktopNoHistory: {
      minHeight: 70,
      borderRadius: 9,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    desktopNoHistoryText: {
      color: colors.textMuted,
      fontSize: 9,
    },

    // ========================================================
    // DETAILS FOOTER
    // ========================================================

    detailsFooter: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
      alignItems: "center",
    },

    detailsFooterButtons: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      width: "100%",
    },

    desktopEditButtonText: {
      color: "#ffffff",
      fontSize: 11,
      fontWeight: "700",
    },

    // ========================================================
    // NO SELECTION
    // ========================================================

    noSelection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 45,
    },

    noSelectionIcon: {
      width: 66,
      height: 66,
      borderRadius: 18,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15,
    },

    noSelectionTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "700",
    },

    noSelectionText: {
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 16,
      textAlign: "center",
      maxWidth: 290,
      marginTop: 7,
    },

    // ========================================================
    // EDIT MODAL
    // ========================================================

    desktopModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },

    desktopEditModal: {
      width: 460,
      maxWidth: "95%",
      maxHeight: "85%",
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",

      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: {
        width: 0,
        height: 10,
      },

      elevation: 10,
    },

    desktopModalHeader: {
      minHeight: 72,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    desktopModalTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
    },

    desktopModalSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    desktopModalClose: {
      width: 32,
      height: 32,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopModalScroll: {
      maxHeight: 430,
    },

    desktopModalScrollContent: {
      padding: 20,
    },

    // ========================================================
    // MODAL FIELD
    // ========================================================

    desktopField: {
      marginBottom: 15,
    },

    desktopFieldLabel: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      marginBottom: 7,
    },

    desktopFieldInput: {
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 9,
      backgroundColor: colors.bg,
      color: colors.textPrimary,
      fontSize: 11,
      paddingHorizontal: 11,
      outlineStyle: "none",
    },

    // ========================================================
    // MODAL FOOTER
    // ========================================================

    desktopModalFooter: {
      minHeight: 67,
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },

    desktopModalCancel: {
      height: 38,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
    },

    desktopModalCancelText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    },

    desktopModalSave: {
      height: 38,
      paddingHorizontal: 17,
      borderRadius: 8,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    desktopModalSaveDisabled: {
      opacity: 0.65,
    },

    desktopModalSaveText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "700",
    },
  });
}

// ============================================================
// MOBILE STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    mobileActionColumn: {
      width: 88,
      alignItems: "flex-end",
      marginLeft: 8,
    },

    mobileProfileActionButtons: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 7,
    },

    mobileProfileEditButton: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    mobileProfileVacateButton: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: colors.dangerBg,
      alignItems: "center",
      justifyContent: "center",
    },
    mobileStudentMain: {
      flex: 1,

      flexDirection: "row",
      alignItems: "flex-start",

      minWidth: 0,

      paddingTop: 1,
    },
    mobileActionColumn: {
      width: 88,

      alignItems: "flex-end",

      marginLeft: 8,
    },

    mobileProfileActionButtons: {
      flexDirection: "row",

      alignItems: "center",

      justifyContent: "flex-end",

      gap: 7,
    },

    mobileProfileEditButton: {
      width: 40,
      height: 40,

      borderRadius: 11,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    mobileProfileEditText: {
      display: "none",
    },
    mobileProfileVacateButton: {
      width: 40,
      height: 40,

      borderRadius: 11,

      backgroundColor: colors.dangerBg,

      alignItems: "center",
      justifyContent: "center",
    },

    mobileProfileVacateText: {
      display: "none",
    },
    studentCard: {
      position: "relative",

      flexDirection: "row",
      alignItems: "flex-start",

      backgroundColor: colors.card,

      borderRadius: 16,

      paddingVertical: 12,
      paddingLeft: 12,
      paddingRight: 12,

      marginBottom: 10,

      borderWidth: 1,
      borderColor: colors.borderLight,

      minHeight: 112,
    },

    // ==================================
    // SEARCH
    // ==========================================================

    searchWrapper: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: 4,
    },

    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: 13,
      shadowColor: "#000",
      shadowOpacity: 0.03,
      shadowRadius: 5,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      elevation: 1,
    },

    searchInput: {
      flex: 1,
      marginLeft: 9,
      marginRight: 4,
      borderWidth: 0,
      backgroundColor: "transparent",
    },

    clearSearch: {
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 15,
      backgroundColor: colors.borderLight,
    },

    // ==========================================================
    // TABS
    // ==========================================================

    tabsRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: 8,
    },

    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.borderLight,
    },

    tabActive: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.primaryBlue,
    },

    tabText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    tabTextActive: {
      color: colors.primaryBlue,
    },

    // ==========================================================
    // IMPORT / EXPORT
    // ==========================================================

    actionRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: 4,
      gap: 10,
    },

    actionButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
    },

    importButton: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.border,
    },

    exportButton: {
      backgroundColor: colors.card,
      borderColor: colors.border,
    },

    importButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primaryBlue,
    },

    exportButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    // ==========================================================
    // LIST
    // ==========================================================

    listContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: 16,
    },

    studentCard: {
      flexDirection: "row",
      alignItems: "flex-start",

      width: "100%",

      backgroundColor: colors.card,

      borderRadius: 16,

      paddingVertical: 12,
      paddingHorizontal: 12,

      marginBottom: 10,

      borderWidth: 1,
      borderColor: colors.borderLight,

      minHeight: 108,
    },

    seatBadge: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    seatBadgeText: {
      color: colors.primaryBlue,
      fontWeight: "800",
      fontSize: 14,
    },

    studentInfo: {
      flex: 1,

      minWidth: 0,

      marginLeft: 10,

      paddingTop: 2,
    },

    rowName: {
      fontSize: 17,
      fontWeight: "800",

      color: colors.textPrimary,

      lineHeight: 22,
    },

    rowMeta: {
      fontSize: 14,

      color: colors.textPrimary,

      marginTop: 3,

      lineHeight: 19,
    },

    rowDate: {
      fontSize: 13,

      color: colors.textSecondary,

      marginTop: 3,

      lineHeight: 18,
    },

    rowAmount: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    statusBadge: {
      marginTop: 7,

      paddingHorizontal: 9,
      paddingVertical: 4,

      borderRadius: 20,

      alignSelf: "flex-end",
    },

    activeBadge: {
      backgroundColor: colors.successBg,
    },

    expiredBadge: {
      backgroundColor: colors.dangerBg,
    },

    statusText: {
      fontSize: 10,
      fontWeight: "800",

      letterSpacing: 0.5,
    },

    activeText: {
      color: colors.success,
    },

    expiredText: {
      color: colors.danger,
    },

    editBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.borderLight,
    },

    // ==========================================================
    // LOADING
    // ==========================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: colors.textFaint,
    },

    // ==========================================================
    // EMPTY
    // ==========================================================

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 70,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },

    emptyTitle: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "700",
    },

    emptySubtitle: {
      textAlign: "center",
      color: colors.textFaint,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    // ==========================================================
    // PAGINATION
    // ==========================================================

    paginationContainer: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      paddingBottom: 12,
    },

    paginationInfo: {
      textAlign: "center",
      fontSize: 11,
      fontWeight: "600",
      color: colors.textFaint,
      marginBottom: 9,
    },

    paginationControls: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    pageButton: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.borderLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    pageButtonDisabled: {
      backgroundColor: colors.borderLight,
      borderColor: colors.borderLight,
    },

    pageButtonText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primaryBlue,
    },

    pageButtonTextDisabled: {
      color: colors.textFaint,
    },

    pageIndicator: {
      minHeight: 38,
      paddingHorizontal: 13,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    pageIndicatorText: {
      fontSize: 11,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    // ==========================================================
    // MODAL
    // ==========================================================

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },

    profileSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 20,

      maxHeight: "90%",
    },

    // ==========================================================
    // PROFILE
    // ==========================================================

    profileHeader: {
      alignItems: "center",
      marginBottom: spacing.md,
    },

    profileAvatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },

    profileAvatarText: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    profileName: {
      fontSize: 19,
      fontWeight: "800",
      textAlign: "center",
      color: colors.textPrimary,
    },

    profilePhone: {
      textAlign: "center",
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 3,
    },

    profileDetailsCard: {
      backgroundColor: colors.borderLight,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 11,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },

    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },

    detailLabel: {
      color: colors.textSecondary,
      fontSize: 13,
    },

    detailValue: {
      fontWeight: "700",
      fontSize: 13,
      color: colors.textPrimary,
    },

    detailValueDanger: {
      color: colors.danger,
    },

    // ==========================================================
    // HISTORY
    // ==========================================================

    historyTitle: {
      fontSize: 15,
      fontWeight: "800",
      marginBottom: spacing.sm,
      color: colors.textPrimary,
    },

    historyContainer: {
      paddingTop: 2,
    },

    historyItem: {
      flexDirection: "row",
      minHeight: 54,
    },

    timeline: {
      width: 20,
      alignItems: "center",
      position: "relative",
    },

    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.primaryBlue,
      marginTop: 4,
      zIndex: 2,
    },

    timelineLine: {
      position: "absolute",
      top: 13,
      bottom: 0,
      width: 1,
      backgroundColor: colors.border,
    },

    historyContent: {
      flex: 1,
      marginLeft: 7,
      paddingBottom: 10,
    },

    historyText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    historyDate: {
      fontSize: 11,
      color: colors.textFaint,
      marginTop: 3,
    },

    historyLoading: {
      alignItems: "center",
      paddingVertical: 18,
    },

    historyLoadingText: {
      marginTop: 7,
      fontSize: 12,
      color: colors.textFaint,
    },

    noHistory: {
      alignItems: "center",
      paddingVertical: 15,
    },

    emptyText: {
      fontSize: 12,
      color: colors.textFaint,
      marginTop: 7,
      textAlign: "center",
    },

    // ==========================================================
    // EDIT
    // ==========================================================

    editTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },

    label: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
      marginTop: 4,
    },
    // ==========================================================
    // MOBILE SELECT FIELDS
    // ==========================================================

    mobileSelectField: {
      width: "100%",
      height: 52,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      backgroundColor: colors.bg,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 14,
    },

    mobileSelectLeft: {
      flexDirection: "row",
      alignItems: "center",

      flex: 1,
      minWidth: 0,
    },

    mobileSelectValue: {
      marginLeft: 10,

      flex: 1,

      color: colors.textPrimary,

      fontSize: 15,
      fontWeight: "600",

      includeFontPadding: false,
    },

    // ==========================================================
    // MOBILE PICKER
    // ==========================================================

    mobilePickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.55)",

      alignItems: "center",
      justifyContent: "center",

      paddingHorizontal: 18,
    },

    mobilePickerContainer: {
      width: "100%",
      maxWidth: 430,
      maxHeight: "82%",

      backgroundColor: colors.card,

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,
    },

    mobileDatePickerContainer: {
      width: "100%",
      maxWidth: 430,

      backgroundColor: colors.card,

      borderRadius: 18,
      borderWidth: 1,

      padding: 18,
    },

    mobilePickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    mobilePickerTitle: {
      fontSize: 18,
      fontWeight: "800",
    },

    mobilePickerSubtitle: {
      fontSize: 12,
      marginTop: 4,
    },

    mobilePickerList: {
      maxHeight: 400,
      marginTop: 14,
    },

    mobilePickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",

      justifyContent: "space-between",

      rowGap: 10,

      paddingBottom: 8,
    },

    mobileSeatOption: {
      width: "22%",
      minHeight: 62,

      borderRadius: 12,
      borderWidth: 1,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    mobileSeatOptionText: {
      marginTop: 5,

      fontSize: 13,
      fontWeight: "800",
    },

    mobileSeatCheck: {
      position: "absolute",

      top: 6,
      right: 6,
    },

    mobilePickerDone: {
      height: 46,

      borderRadius: 11,

      alignItems: "center",
      justifyContent: "center",

      marginTop: 14,
    },

    mobilePickerDoneText: {
      color: "#FFFFFF",

      fontSize: 14,
      fontWeight: "800",
    },
  });
}
