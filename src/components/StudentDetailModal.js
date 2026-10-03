import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";
import { lightColors, darkColors } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function StudentDetailModal({
  visible,
  student,
  seatNumber,
  seats = [],
  onClose,
  onUpdate,
  onVacate,
  loading = false,
}) {
  // ==========================================================
  // THEME
  // ==========================================================

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();

  const isDesktopWeb = Platform.OS === "web" && width >= 1024;

  const styles = createStyles(colors, isDesktopWeb);

  // ==========================================================
  // STATE
  // ==========================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  const [expiryDate, setExpiryDate] = useState(new Date());

  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [selectedSeat, setSelectedSeat] = useState(null);

  const [seatPickerVisible, setSeatPickerVisible] = useState(false);

  // ==========================================================
  // LOAD STUDENT DETAILS
  // ==========================================================

  useEffect(() => {
    if (!student) return;

    setName(student.name ?? "");

    setPhone(student.phone ?? "");

    setAmountPaid(
      student.amountPaid !== null && student.amountPaid !== undefined
        ? String(student.amountPaid)
        : ""
    );

    if (student.expiryDate) {
      setExpiryDate(parseApiDate(student.expiryDate));
    } else {
      setExpiryDate(new Date());
    }

    setSelectedSeat(
      student.seatNumber ?? student.seat?.seatNumber ?? seatNumber ?? null
    );
  }, [student, seatNumber, visible]);

  // ==========================================================
  // PARSE API DATE
  // ==========================================================

  const parseApiDate = (dateString) => {
    if (!dateString) {
      return new Date();
    }

    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
  };

  // ==========================================================
  // FORMAT DISPLAY DATE
  // ==========================================================

  const formatDisplayDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }

    const day = String(date.getDate()).padStart(2, "0");

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // ==========================================================
  // FORMAT API DATE
  // ==========================================================

  const formatApiDate = (date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==========================================================
  // CURRENT STUDENT SEAT
  // ==========================================================

  const currentSeatNumber =
    student?.seatNumber ?? student?.seat?.seatNumber ?? seatNumber ?? null;

  // ==========================================================
  // AVAILABLE SEATS
  // ==========================================================

  const availableSeats = useMemo(() => {
    if (!Array.isArray(seats)) {
      return selectedSeat ? [Number(selectedSeat)] : [];
    }

    const result = seats
      .filter((seat) => {
        const number = seat?.seatNumber ?? seat?.number ?? seat?.seatId;

        if (number === undefined || number === null) {
          return false;
        }

        const isCurrentSeat = Number(number) === Number(selectedSeat);

        const isOccupied = seat?.occupied === true || seat?.isOccupied === true;

        // Current seat is always allowed.
        // Other seats must be vacant.
        return isCurrentSeat || !isOccupied;
      })
      .map((seat) => Number(seat?.seatNumber ?? seat?.number ?? seat?.seatId))
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort((a, b) => a - b);

    // ======================================================
    // SAFETY
    // Make sure current seat is always available
    // even if API response doesn't contain it.
    // ======================================================

    if (selectedSeat !== null && !result.includes(Number(selectedSeat))) {
      result.unshift(Number(selectedSeat));
    }

    return result;
  }, [seats, selectedSeat]);

  // ==========================================================
  // JOINING DATE
  // ==========================================================

  const joiningDate =
    student?.bookingDate ?? student?.joinDate ?? student?.joiningDate ?? "-";

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (date) => {
    if (!date) return "-";

    // YYYY-MM-DD
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");

      return `${day}-${month}-${year}`;
    }

    return String(date);
  };

  // ==========================================================
  // UPDATE STUDENT
  // ==========================================================

  const handleUpdate = () => {
    if (!selectedSeat) {
      Alert.alert("Seat Required", "Please select a seat.");

      return;
    }

    if (!name.trim()) {
      Alert.alert("Required", "Student name is required.");

      return;
    }

    if (!phone.trim()) {
      Alert.alert("Required", "Phone number is required.");

      return;
    }

    const payload = {
      name: name.trim(),

      phone: phone.trim(),

      amountPaid: amountPaid.trim() === "" ? null : Number(amountPaid),

      expireDate: formatApiDate(expiryDate),

      seatNumber: Number(selectedSeat),
    };

    onUpdate(payload);
  };

  // ==========================================================
  // NO STUDENT / LOADING
  // ==========================================================

  if (!student) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />

            <Text style={styles.loadingText}>Loading student details...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <>
      {/* ======================================================
          MAIN STUDENT MODAL
      ====================================================== */}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalContainer}>
            {/* ==================================================
                HEADER
            ================================================== */}

            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>Student Details</Text>

                <Text style={styles.subtitle}>Seat {selectedSeat}</Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={loading}
              >
                <FontAwesome6
                  name="xmark"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* =================================================
                  SEAT
              ================================================= */}

              <Text style={styles.label}>Seat Number</Text>

              <TouchableOpacity
                style={styles.seatSelector}
                onPress={() => {
                  console.log("🪑 Seat selector clicked");

                  console.log("Current seat:", selectedSeat);

                  console.log("Available seats:", availableSeats);

                  setSeatPickerVisible(true);
                }}
                disabled={loading}
              >
                <View style={styles.seatSelectorLeft}>
                  <View style={styles.seatIcon}>
                    <FontAwesome6
                      name="chair"
                      size={17}
                      color={colors.primaryBlue}
                    />
                  </View>

                  <View>
                    <Text style={styles.seatSmallText}>Current / New Seat</Text>

                    <Text style={styles.seatValue}>Seat {selectedSeat}</Text>
                  </View>
                </View>

                <FontAwesome6
                  name="chevron-down"
                  size={14}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* =================================================
                  STUDENT NAME
              ================================================= */}

              <View style={styles.desktopFieldRow}>
                <View style={styles.desktopField}>
                  <Text style={styles.label}>Student Name</Text>

                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    placeholder="Enter student name"
                    placeholderTextColor={colors.textMuted}
                    editable={!loading}
                  />
                </View>

                <View style={styles.desktopField}>
                  <Text style={styles.label}>Phone Number</Text>

                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* =================================================
                  JOINING DATE
              ================================================= */}

              <View style={styles.desktopFieldRow}>
                {/* JOINING DATE */}

                <View style={styles.desktopField}>
                  <Text style={styles.label}>Joining Date</Text>

                  <View style={[styles.input, styles.readOnlyInput]}>
                    <Text style={styles.readOnlyText}>
                      {formatDate(joiningDate)}
                    </Text>
                  </View>
                </View>

                {/* EXPIRY DATE */}

                <View style={styles.desktopField}>
                  <Text style={styles.label}>Expiry Date</Text>

                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => {
                      console.log("📅 Expiry date clicked");

                      setDatePickerVisible(true);
                    }}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateInputContent}>
                      <Text style={styles.dateInputText}>
                        {formatDisplayDate(expiryDate)}
                      </Text>

                      <FontAwesome6
                        name="calendar-days"
                        size={16}
                        color={colors.primaryBlue}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* =================================================
                  AMOUNT
              ================================================= */}

              <View style={styles.desktopFieldRow}>
                <View style={styles.desktopField}>
                  <Text style={styles.label}>Amount Paid</Text>

                  <View style={styles.amountContainer}>
                    <Text style={styles.rupee}>₹</Text>

                    <TextInput
                      value={amountPaid}
                      onChangeText={setAmountPaid}
                      style={styles.amountInput}
                      placeholder="700"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* Empty space on desktop */}
                <View style={styles.desktopField} />
              </View>

              {/* =================================================
                  UPDATE
              ================================================= */}

              <View style={styles.desktopActionRow}>
                {/* UPDATE */}

                <TouchableOpacity
                  style={[
                    styles.updateButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={handleUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome6
                        name="floppy-disk"
                        size={15}
                        color="#FFFFFF"
                      />

                      <Text style={styles.updateButtonText}>
                        Update Student
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* VACATE */}

                <TouchableOpacity
                  style={[
                    styles.vacateButton,
                    loading && styles.disabledVacateButton,
                  ]}
                  onPress={() => {
                    if (
                      currentSeatNumber === null ||
                      currentSeatNumber === undefined
                    ) {
                      return;
                    }

                    onVacate(currentSeatNumber);
                  }}
                  disabled={loading}
                >
                  <FontAwesome6 name="chair" size={15} color={colors.danger} />

                  <Text style={styles.vacateButtonText}>Vacate Seat</Text>
                </TouchableOpacity>
              </View>

              {/* =================================================
                  CANCEL
              ================================================= */}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* ==================================================
                SEAT PICKER
            ================================================== */}

            {seatPickerVisible && (
              <View style={styles.seatPickerOverlay}>
                <View style={styles.seatPickerContainer}>
                  {/* HEADER */}

                  <View style={styles.pickerHeader}>
                    <View>
                      <Text style={styles.pickerTitle}>Change Seat</Text>

                      <Text style={styles.pickerSubtitle}>
                        Select a vacant seat
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.pickerClose}
                      onPress={() => setSeatPickerVisible(false)}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* CURRENT SEAT */}

                  <View style={styles.currentSeatBanner}>
                    <FontAwesome6
                      name="circle-check"
                      size={17}
                      color={colors.primaryBlue}
                    />

                    <Text style={styles.currentSeatText}>
                      Current seat:{" "}
                      <Text style={styles.currentSeatBold}>{selectedSeat}</Text>
                    </Text>
                  </View>

                  {/* SEAT LIST */}

                  <ScrollView
                    style={styles.seatList}
                    showsVerticalScrollIndicator={false}
                  >
                    {availableSeats.length === 0 ? (
                      <View style={styles.emptySeats}>
                        <FontAwesome6
                          name="chair"
                          size={28}
                          color={colors.textMuted}
                        />

                        <Text style={styles.emptySeatTitle}>
                          No vacant seats
                        </Text>

                        <Text style={styles.emptySeatText}>
                          There are currently no other vacant seats available.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.seatGrid}>
                        {availableSeats.map((seat) => {
                          const isSelected =
                            Number(selectedSeat) === Number(seat);

                          const isCurrent = Number(seatNumber) === Number(seat);

                          return (
                            <TouchableOpacity
                              key={seat}
                              style={[
                                styles.seatOption,
                                isSelected && styles.selectedSeatOption,
                              ]}
                              activeOpacity={0.7}
                              onPress={() => {
                                console.log("🪑 Seat selected:", seat);

                                setSelectedSeat(seat);

                                setSeatPickerVisible(false);
                              }}
                            >
                              {isSelected && (
                                <View style={styles.checkBadge}>
                                  <FontAwesome6
                                    name="check"
                                    size={9}
                                    color="#FFFFFF"
                                  />
                                </View>
                              )}

                              <Text
                                style={[
                                  styles.seatOptionText,
                                  isSelected && styles.selectedSeatOptionText,
                                ]}
                              >
                                {seat}
                              </Text>

                              {isCurrent && (
                                <Text style={styles.currentLabel}>Current</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </ScrollView>

                  {/* DONE */}

                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setSeatPickerVisible(false)}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ==================================================
                EXPIRY DATE PICKER
            ================================================== */}

            <Modal
              visible={datePickerVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setDatePickerVisible(false)}
            >
              <View style={styles.datePickerOverlay}>
                <View style={styles.datePickerContainer}>
                  {/* HEADER */}

                  <View style={styles.datePickerHeader}>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.datePickerTitle}>
                        Select Expiry Date
                      </Text>

                      <Text style={styles.datePickerSubtitle}>
                        Choose when the subscription expires
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.pickerClose}
                      onPress={() => setDatePickerVisible(false)}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* DATE PICKER */}

                  {/* ==================================================
    DATE PICKER
================================================== */}

                  <View style={styles.datePickerWrapper}>
                    {isDesktopWeb ? (
                      <input
                        type="date"
                        value={formatDateForInput(expiryDate)}
                        min={formatDateForInput(new Date())}
                        onChange={(event) => {
                          const value = event.target.value;

                          if (!value) {
                            return;
                          }

                          const [year, month, day] = value
                            .split("-")
                            .map(Number);

                          const selectedDate = new Date(year, month - 1, day);

                          console.log(
                            "📅 Desktop expiry date selected:",
                            selectedDate
                          );

                          setExpiryDate(selectedDate);
                        }}
                        style={{
                          width: "100%",
                          height: 52,
                          padding: "0 14px",
                          borderRadius: 12,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.card,
                          color: colors.textPrimary,
                          fontSize: 16,
                          fontWeight: "600",
                          outline: "none",
                          boxSizing: "border-box",
                          colorScheme: isDarkMode ? "dark" : "light",
                        }}
                      />
                    ) : (
                      <DateTimePicker
                        value={expiryDate || new Date()}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        themeVariant={isDarkMode ? "dark" : "light"}
                        textColor={colors.textPrimary}
                        onChange={(event, selectedDate) => {
                          console.log("📅 Date picker event:", event.type);

                          if (selectedDate) {
                            console.log(
                              "📅 Selected expiry date:",
                              selectedDate
                            );

                            setExpiryDate(selectedDate);
                          }

                          if (Platform.OS === "android") {
                            setDatePickerVisible(false);
                          }
                        }}
                        style={styles.datePicker}
                      />
                    )}
                  </View>

                  {/* SELECTED DATE PREVIEW */}

                  <View style={styles.selectedDatePreview}>
                    <FontAwesome6
                      name="calendar-days"
                      size={17}
                      color={colors.primaryBlue}
                    />

                    <Text style={styles.selectedDateText}>
                      {formatDisplayDate(expiryDate)}
                    </Text>
                  </View>

                  {/* DONE */}

                  <TouchableOpacity
                    style={styles.dateDoneButton}
                    onPress={() => {
                      console.log(
                        "✅ Expiry date confirmed:",
                        formatDisplayDate(expiryDate)
                      );

                      setDatePickerVisible(false);
                    }}
                  >
                    <Text style={styles.dateDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
function formatDateForInput(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createStyles(colors, isDesktopWeb) {
  return StyleSheet.create({
    // ==========================================================
    // MAIN MODAL
    // ==========================================================

    overlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.48)",

      justifyContent: "center",
      alignItems: "center",

      paddingHorizontal: isDesktopWeb ? 24 : 18,
      paddingVertical: isDesktopWeb ? 24 : 0,
    },

    modalContainer: {
      width: isDesktopWeb ? 780 : "100%",

      maxWidth: isDesktopWeb ? 820 : undefined,

      maxHeight: isDesktopWeb ? "88%" : "90%",

      backgroundColor: colors.card,

      borderRadius: isDesktopWeb ? 22 : 28,

      overflow: "hidden",

      borderWidth: isDesktopWeb ? 1 : 0,

      borderColor: colors.border,

      shadowColor: "#000",

      shadowOpacity: isDesktopWeb ? 0.28 : 0.18,

      shadowRadius: isDesktopWeb ? 28 : 20,

      shadowOffset: {
        width: 0,
        height: isDesktopWeb ? 14 : 10,
      },

      elevation: isDesktopWeb ? 14 : 10,
    },

    header: {
      paddingHorizontal: isDesktopWeb ? 24 : 22,

      paddingTop: isDesktopWeb ? 18 : 22,

      paddingBottom: isDesktopWeb ? 14 : 16,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      borderBottomWidth: 1,

      borderBottomColor: colors.borderLight,
    },

    headerTextContainer: {
      flex: 1,
    },

    title: {
      fontSize: isDesktopWeb ? 21 : 24,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    subtitle: {
      marginTop: 3,

      fontSize: isDesktopWeb ? 12 : 14,

      fontWeight: "600",

      color: colors.primaryBlue,
    },

    closeButton: {
      width: isDesktopWeb ? 36 : 38,

      height: isDesktopWeb ? 36 : 38,

      borderRadius: isDesktopWeb ? 18 : 19,

      backgroundColor: colors.borderLight,

      alignItems: "center",

      justifyContent: "center",
    },

    scrollContent: {
      paddingHorizontal: 22,
      paddingTop: 8,
      paddingBottom: 24,
    },

    // ==========================================================
    // LABELS
    // ==========================================================

    label: {
      fontSize: isDesktopWeb ? 12 : 14,

      fontWeight: "600",

      color: colors.textSecondary,

      marginTop: isDesktopWeb ? 12 : 16,

      marginBottom: isDesktopWeb ? 6 : 7,
    },

    // ==========================================================
    // INPUTS
    // ==========================================================
    input: {
      height: isDesktopWeb ? 46 : 52,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: isDesktopWeb ? 11 : 14,

      paddingHorizontal: isDesktopWeb ? 13 : 15,

      fontSize: isDesktopWeb ? 14 : 16,

      color: colors.textPrimary,

      backgroundColor: colors.card,
    },

    readOnlyInput: {
      justifyContent: "center",
      backgroundColor: colors.borderLight,
    },

    readOnlyText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    // ==========================================================
    // SEAT SELECTOR
    // ==========================================================

    seatSelector: {
      height: 64,

      borderWidth: 1.5,
      borderColor: isBlueBorder(colors) ? "#3B82F6" : colors.border,

      borderRadius: 16,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      backgroundColor: colors.seatVacant,
    },

    seatSelectorLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    seatIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,

      backgroundColor: isDarkColors(colors) ? "#1E3A5F" : "#E8F0FF",

      alignItems: "center",
      justifyContent: "center",

      marginRight: 12,
    },

    seatSmallText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },

    seatValue: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    // ==========================================================
    // AMOUNT
    // ==========================================================

    amountContainer: {
      height: isDesktopWeb ? 46 : 52,

      borderWidth: 1,

      borderColor: colors.border,

      borderRadius: isDesktopWeb ? 11 : 14,

      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: isDesktopWeb ? 13 : 15,

      backgroundColor: colors.card,
    },

    rupee: {
      fontSize: isDesktopWeb ? 16 : 18,

      fontWeight: "700",

      color: colors.textSecondary,

      marginRight: 8,
    },

    amountInput: {
      flex: 1,

      fontSize: isDesktopWeb ? 14 : 16,

      color: colors.textPrimary,
    },

    // ==========================================================
    // BUTTONS
    // ==========================================================

    updateButton: {
      height: isDesktopWeb ? 48 : 54,

      flex: isDesktopWeb ? 1 : undefined,

      borderRadius: isDesktopWeb ? 12 : 16,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 9,

      marginTop: isDesktopWeb ? 0 : 24,
    },

    updateButtonText: {
      color: "#FFFFFF",

      fontSize: isDesktopWeb ? 14 : 16,

      fontWeight: "700",
    },

    disabledButton: {
      opacity: 0.6,
    },

    vacateButton: {
      height: isDesktopWeb ? 48 : 52,

      flex: isDesktopWeb ? 1 : undefined,

      borderRadius: isDesktopWeb ? 12 : 16,

      borderWidth: 1,

      borderColor: colors.danger,

      backgroundColor: colors.dangerBg,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 8,

      marginTop: isDesktopWeb ? 0 : 12,
    },

    vacateButtonText: {
      color: colors.danger,

      fontSize: isDesktopWeb ? 14 : 16,

      fontWeight: "700",
    },

    disabledVacateButton: {
      opacity: 0.5,
    },

    cancelButton: {
      height: isDesktopWeb ? 38 : 50,

      alignItems: "center",

      justifyContent: "center",

      marginTop: isDesktopWeb ? 2 : 4,
    },

    cancelText: {
      color: colors.primaryBlue,

      fontSize: isDesktopWeb ? 13 : 16,

      fontWeight: "600",
    },

    // ==========================================================
    // SEAT PICKER
    // ==========================================================

    seatPickerOverlay: {
      position: "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor: "rgba(0,0,0,0.45)",

      justifyContent: "flex-end",

      zIndex: 999,
      elevation: 999,
    },

    seatPickerContainer: {
      backgroundColor: colors.card,

      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,

      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 24,

      maxHeight: "75%",
    },

    pickerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 16,
    },

    pickerTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    pickerSubtitle: {
      marginTop: 3,
      fontSize: 13,
      color: colors.textSecondary,
    },

    pickerClose: {
      width: 38,
      height: 38,

      borderRadius: 19,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    currentSeatBanner: {
      minHeight: 44,

      paddingHorizontal: 14,

      borderRadius: 12,

      backgroundColor: isDarkColors(colors) ? "#1E3A5F" : "#EFF6FF",

      flexDirection: "row",
      alignItems: "center",

      marginBottom: 14,
    },

    currentSeatText: {
      marginLeft: 9,
      fontSize: 14,
      color: colors.textSecondary,
    },

    currentSeatBold: {
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    seatList: {
      marginBottom: 12,
    },

    seatGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",

      gap: 10,

      paddingBottom: 8,
    },

    seatOption: {
      width: 64,
      height: 58,

      borderRadius: 14,

      borderWidth: 1,
      borderColor: colors.seatBorder,

      backgroundColor: colors.seatVacant,

      alignItems: "center",
      justifyContent: "center",

      position: "relative",
    },

    selectedSeatOption: {
      backgroundColor: colors.primaryBlue,
      borderColor: colors.primaryBlue,
    },

    seatOptionText: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    selectedSeatOptionText: {
      color: "#FFFFFF",
    },

    checkBadge: {
      position: "absolute",

      top: 5,
      right: 5,

      width: 16,
      height: 16,

      borderRadius: 8,

      backgroundColor: colors.success,

      alignItems: "center",
      justifyContent: "center",
    },

    currentLabel: {
      position: "absolute",

      bottom: 3,

      fontSize: 7,
      fontWeight: "700",

      color: colors.primaryBlue,
    },

    doneButton: {
      height: 52,

      borderRadius: 15,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",
      justifyContent: "center",

      marginTop: 4,
    },

    doneButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    // ==========================================================
    // EMPTY SEATS
    // ==========================================================

    emptySeats: {
      alignItems: "center",
      justifyContent: "center",

      paddingVertical: 40,
    },

    emptySeatTitle: {
      marginTop: 12,

      fontSize: 17,
      fontWeight: "700",

      color: colors.textSecondary,
    },

    emptySeatText: {
      marginTop: 5,

      textAlign: "center",

      fontSize: 13,
      color: colors.textSecondary,

      maxWidth: 260,
    },

    // ==========================================================
    // LOADING
    // ==========================================================

    loadingModal: {
      width: "80%",

      backgroundColor: colors.card,

      borderRadius: 22,

      padding: 30,

      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 14,

      fontSize: 15,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    // ==========================================================
    // DATE PICKER
    // ==========================================================

    datePickerOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.48)",

      justifyContent: "center",
      alignItems: "center",

      paddingHorizontal: 20,
    },

    datePickerContainer: {
      width: isDesktopWeb ? 520 : "100%",

      maxWidth: isDesktopWeb ? 520 : undefined,

      backgroundColor: colors.card,

      borderRadius: isDesktopWeb ? 20 : 26,

      paddingHorizontal: isDesktopWeb ? 24 : 20,

      paddingTop: isDesktopWeb ? 20 : 22,

      paddingBottom: isDesktopWeb ? 20 : 20,

      borderWidth: isDesktopWeb ? 1 : 0,

      borderColor: colors.border,
    },

    datePickerHeader: {
      flexDirection: "row",

      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 10,
    },

    datePickerTitle: {
      fontSize: 22,

      fontWeight: "800",

      color: colors.textPrimary,
    },

    datePickerSubtitle: {
      marginTop: 4,

      fontSize: 14,

      color: colors.textSecondary,
    },

    datePickerWrapper: {
      width: "100%",

      height: isDesktopWeb ? 52 : 220,

      alignItems: "center",

      justifyContent: "center",

      overflow: "hidden",
    },

    datePicker: {
      width: "100%",
      height: 220,
    },

    selectedDatePreview: {
      height: isDesktopWeb ? 44 : 48,

      borderRadius: isDesktopWeb ? 10 : 12,

      backgroundColor: isDarkColors(colors) ? "#1E3A5F" : "#EFF6FF",

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "center",

      gap: 9,

      marginBottom: isDesktopWeb ? 12 : 14,
    },

    selectedDateText: {
      fontSize: 16,

      fontWeight: "700",

      color: colors.primaryBlue,
    },

    dateDoneButton: {
      height: isDesktopWeb ? 46 : 54,

      borderRadius: isDesktopWeb ? 12 : 16,

      backgroundColor: colors.primaryBlue,

      alignItems: "center",

      justifyContent: "center",
    },

    dateDoneButtonText: {
      color: "#FFFFFF",

      fontSize: isDesktopWeb ? 14 : 17,

      fontWeight: "700",
    },
    desktopFieldRow: {
      flexDirection: isDesktopWeb ? "row" : "column",

      gap: isDesktopWeb ? 14 : 0,
    },

    desktopField: {
      flex: isDesktopWeb ? 1 : undefined,

      width: isDesktopWeb ? undefined : "100%",
    },

    dateInputContent: {
      flex: 1,

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",
    },

    dateInputText: {
      fontSize: isDesktopWeb ? 14 : 16,

      color: colors.textPrimary,

      fontWeight: "500",
    },

    desktopActionRow: {
      flexDirection: isDesktopWeb ? "row" : "column",

      gap: isDesktopWeb ? 12 : 0,

      marginTop: isDesktopWeb ? 18 : 24,
    },
  });
}

// ============================================================
// THEME HELPERS
// ============================================================

function isDarkColors(colors) {
  return colors?.card === darkColors.card;
}

function isBlueBorder(colors) {
  return isDarkColors(colors);
}
