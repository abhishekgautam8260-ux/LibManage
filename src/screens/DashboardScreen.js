import React, { useCallback, useState, useMemo, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
  Platform,
} from "react-native";
import SeatActionModal from "../components/SeatActionModal";

import { FontAwesome6 } from "@expo/vector-icons";
import SeatHoldAlertItem from "../components/SeatHoldAlertItem";

import { useFocusEffect, useNavigation } from "@react-navigation/native";

import Header from "../components/Header";
import DesktopDashboard from "../components/DesktopDashboard";
import SeatGrid from "../components/SeatGrid";
import BookingModal from "../components/BookingModal";
import StudentDetailModal from "../components/StudentDetailModal";
import AlertItem from "../components/AlertItem";

import { useAuth } from "../context/AuthContext";

import {
  getDashboardStats,
  getSeats,
  bookSeat,
  vacateSeat,
  getStudentBySeat,
  updateStudent,
  getExpiryAlerts,
  getActiveSeatHolds,
  renewStudent,
  holdStudentAlert,
  cancelSeatHold,
} from "../api/dashboard";

import SeatHoldModal from "../components/SeatHoldModal";
import HeldSeatModal from "../components/HeldSeatModal";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

// ============================================================
// DATE HELPERS
// ============================================================

function parseLocalDate(dateString) {
  if (!dateString) {
    return null;
  }

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3) {
    return null;
  }

  const [year, month, day] = parts;

  const date = new Date(year, month - 1, day);

  date.setHours(0, 0, 0, 0);

  return date;
}

// ============================================================
// FORMAT DATE
// ============================================================

function formatAlertDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = parseLocalDate(dateString);

  if (!date) {
    return dateString;
  }

  const day = String(date.getDate()).padStart(2, "0");

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// ============================================================
// EXPIRED TEXT
// ============================================================

function getAlertExpiredText(dateString) {
  if (!dateString) {
    return "Expired";
  }

  const expiry = parseLocalDate(dateString);

  if (!expiry) {
    return "Expired";
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today - expiry) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return "Expired today";
  }

  if (diffDays === 1) {
    return "Expired 1 day ago";
  }

  return `Expired ${diffDays} days ago`;
}

// ============================================================
// CHECK EXPIRED
// ============================================================

function isStudentExpired(dateString) {
  if (!dateString) {
    return false;
  }

  const expiry = parseLocalDate(dateString);

  if (!expiry) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return expiry <= today;
}

// ============================================================
// DASHBOARD
// ============================================================

export default function DashboardScreen() {
  const { width } = useWindowDimensions();

  const isDesktopWeb = Platform.OS === "web" && width >= 1024;
  const navigation = useNavigation();
  const { width: screenWidth } = useWindowDimensions();

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { libraryId, canEditStudent, canManageSeats } = useAuth();

  const isDesktop = Platform.OS === "web" && width >= 1024;
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const parent = navigation.getParent();

    if (!parent) {
      return;
    }

    if (isDesktop) {
      // ========================================================
      // DESKTOP WEB
      // Hide bottom tab bar
      // ========================================================

      parent.setOptions({
        tabBarStyle: {
          display: "none",
        },
      });
    } else {
      // ========================================================
      // MOBILE WEB
      // Restore the same tab bar design used by MainTabs
      // ========================================================

      parent.setOptions({
        tabBarStyle: {
          height: 64,

          paddingBottom: 8,
          paddingTop: 6,

          backgroundColor: isDarkMode ? darkColors.card : lightColors.card,

          borderTopColor: isDarkMode ? darkColors.border : lightColors.border,

          borderTopWidth: 1,
        },
      });
    }

    return () => {
      // Restore normal tab bar styling when leaving Dashboard
      parent.setOptions({
        tabBarStyle: {
          height: 64,

          paddingBottom: 8,
          paddingTop: 6,

          backgroundColor: isDarkMode ? darkColors.card : lightColors.card,

          borderTopColor: isDarkMode ? darkColors.border : lightColors.border,

          borderTopWidth: 1,
        },
      });
    };
  }, [navigation, isDesktop, isDarkMode]);

  // ==========================================================
  // DASHBOARD DATA
  // ==========================================================

  const [stats, setStats] = useState({
    totalSeats: 0,
    filledSeats: 0,
    vacantSeats: 0,
    halfDayStudents: 0,
  });

  const [seatActionModalVisible, setSeatActionModalVisible] = useState(false);

  const [seats, setSeats] = useState([]);

  const [alerts, setAlerts] = useState([]);

  const [vacateConfirmVisible, setVacateConfirmVisible] = useState(false);
  const [vacateConfirmSeat, setVacateConfirmSeat] = useState(null);

  const [activeSeatHolds, setActiveSeatHolds] = useState([]);

  const [showAllAlerts, setShowAllAlerts] = useState(false);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  // ==========================================================
  // BOOKING
  // ==========================================================

  const [bookingSeat, setBookingSeat] = useState(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [seatHoldModalVisible, setSeatHoldModalVisible] = useState(false);

  const [heldSeatModalVisible, setHeldSeatModalVisible] = useState(false);

  const [selectedHeldSeat, setSelectedHeldSeat] = useState(null);

  const [bookingLoading, setBookingLoading] = useState(false);

  // ==========================================================
  // STUDENT DETAIL
  // ==========================================================

  const [studentModalSeat, setStudentModalSeat] = useState(null);

  const [studentDetail, setStudentDetail] = useState(null);

  const [studentLoading, setStudentLoading] = useState(false);

  // ==========================================================
  // ALERT STUDENT
  // ==========================================================

  const [selectedAlertStudent, setSelectedAlertStudent] = useState(null);

  const [alertActionLoading, setAlertActionLoading] = useState(false);

  // ==========================================================
  // HOLD
  // ==========================================================

  const [holdModalVisible, setHoldModalVisible] = useState(false);

  const [holdDays, setHoldDays] = useState("3");

  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadAll = useCallback(async () => {
    console.log("🔍 Dashboard libraryId:", libraryId);

    if (!libraryId) {
      console.log("⚠️ Library ID is not available yet.");

      setLoading(false);
      setRefreshing(false);

      return;
    }

    try {
      // ------------------------------------------------------
      // STATS
      // ------------------------------------------------------

      console.log("➡️ 1. Calling getDashboardStats...");

      const statsData = await getDashboardStats(libraryId);

      console.log("✅ 1. Dashboard stats:", statsData);

      // ------------------------------------------------------
      // SEATS
      // ------------------------------------------------------

      console.log("➡️ 2. Calling getSeats...");

      const seatData = await getSeats(libraryId);

      console.log("✅ 2. Seats:", seatData);

      // ------------------------------------------------------
      // ALERTS
      // ------------------------------------------------------

      console.log("➡️ 3. Calling getExpiryAlerts...");

      console.log("➡️ 3. Calling alerts...");

      const [alertData, activeHoldData] = await Promise.all([
        getExpiryAlerts(libraryId).catch((err) => {
          console.error("⚠️ Subscription alerts failed:", {
            status: err?.response?.status,
            url: err?.config?.url,
            data: err?.response?.data,
          });

          return [];
        }),

        getActiveSeatHolds(libraryId).catch((err) => {
          console.error("⚠️ Active seat holds failed:", {
            status: err?.response?.status,
            url: err?.config?.url,
            data: err?.response?.data,
          });

          return [];
        }),
      ]);

      console.log("🚨 Subscription alerts:", alertData);
      console.log("🟠 Active seat holds:", activeHoldData);

      setAlerts(alertData || []);
      setActiveSeatHolds(activeHoldData || []);

      console.log("✅ 3. Alerts:", alertData);

      // ------------------------------------------------------
      // SET STATE
      // ------------------------------------------------------

      setStats(statsData);
      setSeats(seatData);
      setAlerts(alertData);
    } catch (err) {
      console.error("❌ Dashboard load failed");

      console.error("Status:", err?.response?.status);

      console.error("URL:", err?.config?.url);

      console.error("Base URL:", err?.config?.baseURL);

      console.error("Response:", err?.response?.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [libraryId]);

  // ============================================================
  // SCREEN FOCUS
  // ============================================================

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  // ============================================================
  // REFRESH
  // ============================================================

  const onRefresh = () => {
    setRefreshing(true);

    loadAll();
  };

  // ============================================================
  // ALERT CARD CLICK
  // ============================================================

  const handleAlertStudentPress = (student) => {
    console.log("🚨 Alert student clicked:", student);

    const expireDate = student.expireDate || student.expiryDate;

    if (!isStudentExpired(expireDate)) {
      console.log("ℹ️ Student is not expired.");

      return;
    }

    setSelectedAlertStudent(student);
  };
  const handleVacantPress = (seatNumber) => {
    if (!canManageSeats) {
      return;
    }

    console.log("🪑 Vacant seat selected:", seatNumber);

    setBookingSeat(seatNumber);
    setSeatActionModalVisible(true);
  };

  const handleSeatActionHold = () => {
    console.log("⏸️ Hold selected for seat:", bookingSeat);

    setSeatActionModalVisible(false);
    setSeatHoldModalVisible(true);
  };

  // ============================================================
  // VACANT SEAT
  // ============================================================

  const handleSeatActionBook = () => {
    console.log("📚 Book Seat selected:", bookingSeat);

    setSeatActionModalVisible(false);
    setSelectedHeldSeat(null);
    setBookingModalVisible(true);
  };

  const handleHeldPress = (seat) => {
    if (!canManageSeats) {
      return;
    }

    console.log("🟠 Held seat selected:", seat);

    setSelectedHeldSeat(seat);

    setHeldSeatModalVisible(true);
  };

  const handleSeatHoldSuccess = async (response) => {
    console.log("✅ Seat hold created successfully:", response);

    setSeatHoldModalVisible(false);

    /*
     * Refresh seats immediately so the seat changes
     * from VACANT → HELD.
     */
    try {
      await loadAll();
      if (libraryId) {
        const updatedSeats = await getSeats(libraryId);

        setSeats(updatedSeats || []);
      }
    } catch (error) {
      console.error("❌ Failed to refresh seats after hold:", error);
    }
  };

  const handleHeldSeatCancelled = async () => {
    console.log("✅ Held seat cancelled");

    setHeldSeatModalVisible(false);

    setSelectedHeldSeat(null);

    try {
      if (libraryId) {
        const updatedSeats = await getSeats(libraryId);

        setSeats(updatedSeats || []);

        /*
         * Refresh alerts too because an expired hold
         * may have been removed/cancelled.
         */
        const updatedAlerts = await getExpiryAlerts(libraryId);

        setAlerts(updatedAlerts || []);
      }
    } catch (error) {
      console.error("❌ Failed to refresh after cancelling hold:", error);
    }
  };

  const handleBookHeldSeat = async (seat) => {
    console.log("📚 Booking held seat:", seat);

    if (!seat) {
      console.log("❌ No held seat received");
      return;
    }

    if (!canManageSeats) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to book seats."
      );
      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");
      return;
    }

    const seatNumber = seat.seatNumber;
    const name = seat.holdName;
    const phone = seat.holdPhone;
    const holdId = seat.holdId;

    if (!seatNumber || !name || !phone || !holdId) {
      console.log("❌ Missing held seat information:", {
        seatNumber,
        name,
        phone,
        holdId,
      });

      Alert.alert("Booking Error", "Required hold information is missing.");

      return;
    }

    try {
      setBookingLoading(true);

      console.log("🚀 Converting held seat into booking:", {
        libraryId,
        seatNumber,
        name,
        phone,
        holdId,
      });

      await bookSeat({
        libraryId,
        seatNumber,
        name,
        phone,

        // Your current monthly/full-day price
        amountPaid: 700,

        studentType: "FULL_DAY",

        // VERY IMPORTANT:
        // This connects the booking with the existing hold.
        holdId,
      });

      console.log(`✅ Seat ${seatNumber} booked successfully`);

      // Close held-seat modal
      setHeldSeatModalVisible(false);

      // Clear selected hold
      setSelectedHeldSeat(null);

      // Clear booking seat
      setBookingSeat(null);

      // Refresh dashboard + seats + alerts
      await loadAll();

      Alert.alert(
        "Booking Successful",
        `Seat ${seatNumber} has been booked successfully.`
      );
    } catch (err) {
      console.error("❌ Held seat booking failed:", {
        status: err?.response?.status,
        url: err?.config?.url,
        response: err?.response?.data,
        message: err?.message,
      });

      Alert.alert(
        "Booking Failed",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to book this seat."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // ============================================================
  // OCCUPIED SEAT
  // ============================================================

  const handleOccupiedPress = async (seatNumber) => {
    console.log("🪑 Opening occupied seat:", seatNumber);

    setStudentLoading(true);

    setStudentModalSeat(seatNumber);

    setStudentDetail(null);

    try {
      console.log("➡️ Fetching student for seat:", seatNumber);

      const student = await getStudentBySeat(seatNumber, libraryId);

      console.log("✅ Student received:", student);

      setStudentDetail(student);
    } catch (err) {
      console.error("❌ Failed to load student:", err);

      console.error("Response:", err?.response?.data);

      Alert.alert("Error", "Could not load student details.");

      setStudentModalSeat(null);
    } finally {
      setStudentLoading(false);
    }
  };

  // ============================================================
  // BOOK SEAT
  // ============================================================

  const confirmBooking = async ({ seatNumber, name, phone, amountPaid }) => {
    if (!canManageSeats) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to book seats."
      );

      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");

      return;
    }

    setBookingLoading(true);

    try {
      console.log("🔍 Booking with:", {
        libraryId,
        seatNumber,
        name,
        phone,
        amountPaid,
        studentType: "FULL_DAY",
        holdId: selectedHeldSeat?.holdId || null,
      });

      await bookSeat({
        libraryId,
        seatNumber,
        name,
        phone,
        amountPaid,
        studentType: "FULL_DAY",
        holdId: selectedHeldSeat?.holdId || null,
      });

      setBookingModalVisible(false);
      setBookingSeat(null);
      setSelectedHeldSeat(null);

      await loadAll();
    } catch (err) {
      console.error("❌ Booking failed:", {
        status: err?.response?.status,

        url: err?.config?.url,

        response: err?.response?.data,

        message: err?.message,
      });

      Alert.alert(
        "Booking failed",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to book seat."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  // ============================================================
  // RENEW EXPIRED STUDENT
  // ============================================================

  const handleRenewAlertStudent = async () => {
    if (!canEditStudent) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to renew students."
      );

      return;
    }

    if (!selectedAlertStudent?.id) {
      Alert.alert("Error", "Student ID is missing.");

      return;
    }

    try {
      setAlertActionLoading(true);

      console.log("🔄 Renewing student:", selectedAlertStudent.id);

      const response = await renewStudent(selectedAlertStudent.id);

      console.log("✅ Renewal successful:", response);

      const studentName = selectedAlertStudent.name;

      setSelectedAlertStudent(null);

      Alert.alert(
        "Renewed Successfully",
        `${studentName} has been renewed for 1 month.`
      );

      await loadAll();
    } catch (err) {
      console.error("❌ Renewal failed:", err);

      Alert.alert(
        "Renewal Failed",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Could not renew student."
      );
    } finally {
      setAlertActionLoading(false);
    }
  };

  // ============================================================
  // HOLD EXPIRED STUDENT ALERT
  // ============================================================

  const handleHoldAlertStudent = async () => {
    if (!canEditStudent) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to manage student alerts."
      );

      return;
    }

    if (!selectedAlertStudent?.id) {
      Alert.alert("Error", "Student ID is missing.");

      return;
    }

    const days = Number(holdDays);

    if (!Number.isInteger(days) || days <= 0) {
      Alert.alert("Invalid Days", "Please enter a valid number of days.");

      return;
    }

    if (days > 365) {
      Alert.alert("Invalid Days", "Hold cannot be more than 365 days.");

      return;
    }

    try {
      setAlertActionLoading(true);

      console.log("⏸️ Holding alert:", {
        studentId: selectedAlertStudent.id,
        days,
      });

      const response = await holdStudentAlert(selectedAlertStudent.id, days);

      console.log("✅ Alert held:", response);

      const studentName = selectedAlertStudent.name;

      setHoldModalVisible(false);

      setSelectedAlertStudent(null);

      setHoldDays("3");

      Alert.alert(
        "Alert Held",
        `${studentName}'s alert has been held for ${days} days.`
      );

      await loadAll();
    } catch (err) {
      console.error("❌ Hold failed:", err);

      Alert.alert(
        "Hold Failed",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Could not hold alert."
      );
    } finally {
      setAlertActionLoading(false);
    }
  };

  // ============================================================
  // UPDATE STUDENT
  // ============================================================

  const handleUpdateStudent = async (payload) => {
    if (!canEditStudent) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to edit students."
      );

      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");

      return;
    }

    if (!studentModalSeat) {
      Alert.alert("Error", "Current seat not found.");

      return;
    }

    setStudentLoading(true);

    try {
      console.log("📝 Updating student:", {
        currentSeatNumber: studentModalSeat,

        libraryId,

        payload,
      });

      await updateStudent(studentModalSeat, libraryId, payload);

      Alert.alert("Success", "Student updated successfully.");

      setStudentModalSeat(null);

      setStudentDetail(null);

      await loadAll();
    } catch (err) {
      console.error("❌ Student update failed:", err);

      Alert.alert(
        "Update failed",
        err?.response?.data?.message ||
          err?.message ||
          "Could not update student."
      );
    } finally {
      setStudentLoading(false);
    }
  };

  // ============================================================
  // VACATE
  // ============================================================

  const handleVacate = async (seatNumberOverride = null) => {
    if (!canManageSeats) {
      Alert.alert(
        "Access Restricted",
        "You don't have permission to vacate seats."
      );

      return;
    }

    const seatToVacate =
      typeof seatNumberOverride === "object"
        ? seatNumberOverride?.seatNumber
        : seatNumberOverride ?? studentModalSeat;
    console.log("🪑 Vacating seat:", {
      seatNumberOverride,
      studentModalSeat,
      seatToVacate,
      type: typeof seatToVacate,
    });

    if (!seatToVacate) {
      Alert.alert("Error", "Seat number not found.");

      return;
    }

    if (!libraryId) {
      Alert.alert("Error", "Library not loaded. Please refresh.");

      return;
    }

    try {
      console.log("🪑 Vacating seat:", seatToVacate);

      await vacateSeat(libraryId, seatToVacate);

      setStudentModalSeat(null);

      setStudentDetail(null);

      setSelectedAlertStudent(null);

      await loadAll();
    } catch (err) {
      console.error("❌ Vacate failed:", err);

      Alert.alert(
        "Vacate failed",
        err?.response?.data?.message || err?.message || "Could not vacate seat."
      );
    }
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  // ============================================================
  // ALERT LIMIT
  // ============================================================

  const combinedAlerts = [...activeSeatHolds, ...alerts];

  const visibleAlerts = showAllAlerts
    ? combinedAlerts
    : combinedAlerts.slice(0, 3);

  // ============================================================
  // UI
  // ============================================================

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
      }}
    >
      {isDesktopWeb ? (
        <>
          <DesktopDashboard
            navigation={navigation}
            stats={stats}
            seats={seats}
            combinedAlerts={combinedAlerts}
            visibleAlerts={visibleAlerts}
            showAllAlerts={showAllAlerts}
            setShowAllAlerts={setShowAllAlerts}
            refreshing={refreshing}
            onRefresh={onRefresh}
            canManageSeats={canManageSeats}
            onVacantPress={handleVacantPress}
            onOccupiedPress={handleOccupiedPress}
            onHeldPress={handleHeldPress}
            onAlertStudentPress={handleAlertStudentPress}
            onActiveHoldPress={(item) => {
              const matchingSeat = seats.find(
                (seat) => seat.seatNumber === item.seatNumber
              );

              if (matchingSeat) {
                setSelectedHeldSeat(matchingSeat);
                setHeldSeatModalVisible(true);
              }
            }}
          />
        </>
      ) : (
        <>
          <Header />
          <ScrollView
            contentContainerStyle={{
              padding: spacing.md,
              paddingBottom: 40,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primaryBlue}
              />
            }
          >
            {/* ====================================================
            STAT CARDS
            ==================================================== */}

            <View style={styles.statGrid}>
              {/* TOTAL SEATS */}

              <TouchableOpacity
                style={styles.statCardWrapper}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Students")}
              >
                <StatCard
                  title="Total Seats"
                  value={stats.totalSeats}
                  sub="Library capacity"
                  icon="chair"
                  bg={colors.statPurpleBg}
                  color={colors.statPurple}
                  styles={styles}
                />
              </TouchableOpacity>

              {/* SEATS FILLED */}

              <TouchableOpacity
                style={styles.statCardWrapper}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Students")}
              >
                <StatCard
                  title="Seats Filled"
                  value={stats.filledSeats}
                  sub="Full day active"
                  icon="user"
                  bg={colors.statOrangeBg}
                  color={colors.statOrange}
                  styles={styles}
                />
              </TouchableOpacity>

              {/* SEATS VACANT */}

              <TouchableOpacity
                style={styles.statCardWrapper}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Students")}
              >
                <StatCard
                  title="Seats Vacant"
                  value={stats.vacantSeats}
                  sub="Available"
                  icon="check"
                  bg={colors.statGreenBg}
                  color={colors.statGreen}
                  styles={styles}
                />
              </TouchableOpacity>

              {/* HALF DAY */}

              <TouchableOpacity
                style={styles.statCardWrapper}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("HalfDayStudents")}
              >
                <StatCard
                  title="Half Day Students"
                  value={stats.halfDayStudents}
                  sub="Morning / Evening"
                  icon="clock"
                  bg={colors.statBlueBg}
                  color={colors.statBlue}
                  styles={styles}
                />
              </TouchableOpacity>
            </View>

            {/* ====================================================
            SUBSCRIPTION ALERTS
            ==================================================== */}

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subscription Alerts</Text>

              <Text style={styles.cardSubtitle}>
                Pending actions for students
              </Text>

              {visibleAlerts.length === 0 ? (
                <Text style={styles.emptyText}>No pending alerts</Text>
              ) : (
                <View style={styles.alertSliderWrapper}>
                  <ScrollView
                    horizontal
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    nestedScrollEnabled
                    decelerationRate="fast"
                    snapToInterval={width * 0.82 + 12}
                    snapToAlignment="start"
                    contentContainerStyle={styles.alertSliderContent}
                  >
                    {visibleAlerts.map((item, index) => (
                      <View
                        key={
                          item.alertType === "SEAT_HOLD_ACTIVE"
                            ? `active-hold-${item.id}`
                            : item.alertType === "SEAT_HOLD_EXPIRED"
                            ? `expired-hold-${item.id}`
                            : `student-${
                                item.id ?? `${item.seatNumber}-${item.phone}`
                              }`
                        }
                        style={[
                          styles.alertSlide,
                          {
                            width: width * 0.82,
                          },
                        ]}
                      >
                        {item.alertType === "SEAT_HOLD_ACTIVE" ? (
                          <SeatHoldAlertItem
                            alert={item}
                            onPress={() => {
                              const matchingSeat = seats.find(
                                (seat) => seat.seatNumber === item.seatNumber
                              );

                              if (matchingSeat) {
                                setSelectedHeldSeat(matchingSeat);
                                setHeldSeatModalVisible(true);
                              }
                            }}
                          />
                        ) : item.alertType === "SEAT_HOLD_EXPIRED" ? (
                          <SeatHoldAlertItem alert={item} onPress={() => {}} />
                        ) : (
                          <AlertItem
                            student={item}
                            onPress={() => handleAlertStudentPress(item)}
                          />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {alerts.length > 3 && (
                <TouchableOpacity
                  onPress={() => setShowAllAlerts(!showAllAlerts)}
                >
                  <Text style={styles.viewAll}>
                    {showAllAlerts ? "Show Less" : "View All Alerts"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ====================================================
            SEAT LAYOUT
            ==================================================== */}

            <View
              style={[
                styles.card,
                {
                  marginTop: spacing.md,
                },
              ]}
            >
              <View style={styles.seatHeader}>
                <View>
                  <Text style={styles.cardTitle}>Seat Layout</Text>

                  <Text style={styles.cardSubtitle}>
                    Fill here your fav seat...
                  </Text>
                </View>
              </View>

              {/* LEGEND */}

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <FontAwesome6
                    name="circle"
                    size={8}
                    color={colors.textFaint}
                  />

                  <Text style={styles.legendText}>Booked</Text>
                </View>

                <View style={styles.legendItem}>
                  <FontAwesome6
                    name="circle"
                    size={8}
                    color={colors.primaryGreen}
                  />

                  <Text style={styles.legendText}>Vacant</Text>
                </View>
              </View>

              <SeatGrid
                seats={seats}
                onVacantPress={handleVacantPress}
                onOccupiedPress={handleOccupiedPress}
                onHeldPress={handleHeldPress}
              />
            </View>
          </ScrollView>
        </>
      )}

      {/* ======================================================
          BOOKING MODAL
          ====================================================== */}

      <BookingModal
        visible={bookingModalVisible}
        seatNumber={bookingSeat}
        onClose={() => {
          setBookingModalVisible(false);
          setBookingSeat(null);
          setSelectedHeldSeat(null);
        }}
        onConfirm={confirmBooking}
        loading={bookingLoading}
      />
      <SeatHoldModal
        visible={seatHoldModalVisible}
        seatNumber={selectedHeldSeat?.seatNumber || bookingSeat}
        libraryId={libraryId}
        onClose={() => {
          if (!bookingLoading) {
            setSeatHoldModalVisible(false);
          }
        }}
        onSuccess={handleSeatHoldSuccess}
      />
      <HeldSeatModal
        visible={heldSeatModalVisible}
        seat={selectedHeldSeat}
        onClose={() => {
          setHeldSeatModalVisible(false);
          setSelectedHeldSeat(null);
        }}
        onBook={handleBookHeldSeat}
        onCancelled={handleHeldSeatCancelled}
      />

      <SeatActionModal
        visible={seatActionModalVisible}
        seatNumber={bookingSeat}
        onClose={() => {
          setSeatActionModalVisible(false);
          setBookingSeat(null);
        }}
        onBook={handleSeatActionBook}
        onHold={handleSeatActionHold}
      />

      {/* ======================================================
          STUDENT DETAIL MODAL
          ====================================================== */}

      <StudentDetailModal
        visible={!!studentModalSeat}
        student={studentDetail}
        seatNumber={studentModalSeat}
        seats={seats}
        onClose={() => {
          setStudentModalSeat(null);
          setStudentDetail(null);
        }}
        onUpdate={handleUpdateStudent}
        onVacate={handleVacate}
        loading={studentLoading}
        canEdit={canEditStudent}
        canVacate={canManageSeats}
      />

      {/* ======================================================
          EXPIRED STUDENT ACTION MODAL
          ====================================================== */}

      <Modal
        visible={!!selectedAlertStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlertStudent(null)}
      >
        <View style={styles.alertModalOverlay}>
          <View
            style={[
              styles.alertModalContainer,
              isDesktop && styles.alertModalContainerDesktop,
            ]}
          >
            {/* HEADER */}

            <View style={styles.alertModalHeader}>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.alertModalTitle}>Expired Student</Text>

                <Text style={styles.alertModalSubtitle}>
                  Take action on this subscription
                </Text>
              </View>

              <TouchableOpacity
                style={styles.alertModalClose}
                onPress={() => setSelectedAlertStudent(null)}
              >
                <FontAwesome6
                  name="xmark"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* STUDENT */}

            {selectedAlertStudent && (
              <View style={styles.alertStudentBox}>
                <View style={styles.alertStudentAvatar}>
                  <FontAwesome6
                    name="user"
                    size={22}
                    color={colors.textSecondary}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.alertStudentName}>
                    {selectedAlertStudent.name}
                  </Text>

                  <Text style={styles.alertStudentSeat}>
                    Seat {selectedAlertStudent.seatNumber}
                  </Text>
                </View>
              </View>
            )}

            {/* DETAILS */}

            {selectedAlertStudent && (
              <View style={styles.alertDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Joining Date</Text>

                  <Text style={styles.detailValue}>
                    {formatAlertDate(selectedAlertStudent.bookingDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expired Date</Text>

                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: colors.danger,
                        fontWeight: "700",
                      },
                    ]}
                  >
                    {formatAlertDate(
                      selectedAlertStudent.expireDate ||
                        selectedAlertStudent.expiryDate
                    )}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fees</Text>

                  <Text style={styles.detailValue}>
                    ₹ {selectedAlertStudent.amount ?? 0}
                  </Text>
                </View>

                <View style={styles.expiredBadge}>
                  <FontAwesome6
                    name="triangle-exclamation"
                    size={14}
                    color={colors.danger}
                  />

                  <Text style={styles.expiredBadgeText}>
                    {getAlertExpiredText(
                      selectedAlertStudent.expireDate ||
                        selectedAlertStudent.expiryDate
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* =================================================
                ACTIONS
                ================================================= */}

            {canEditStudent && (
              <View style={styles.alertActionRow}>
                {/* RENEW */}

                <TouchableOpacity
                  style={styles.renewButton}
                  disabled={alertActionLoading}
                  onPress={handleRenewAlertStudent}
                >
                  {alertActionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <FontAwesome6 name="rotate" size={16} color="#FFFFFF" />

                      <Text style={styles.renewButtonText}>Renew</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* VACATE */}

                {canManageSeats && (
                  <TouchableOpacity
                    style={styles.vacateAlertButton}
                    disabled={alertActionLoading}
                    onPress={() => {
                      console.log("🚨 VACATE BUTTON CLICKED");

                      if (!selectedAlertStudent) {
                        return;
                      }

                      console.log(
                        "🚨 Opening vacate confirmation for seat:",
                        selectedAlertStudent.seatNumber
                      );

                      setVacateConfirmSeat(selectedAlertStudent.seatNumber);
                      setVacateConfirmVisible(true);
                    }}
                  >
                    <FontAwesome6
                      name="chair"
                      size={16}
                      color={colors.danger}
                    />

                    <Text style={styles.vacateAlertText}>Vacate</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* HOLD */}

            {canEditStudent && (
              <TouchableOpacity
                style={styles.holdButton}
                disabled={alertActionLoading}
                onPress={() => setHoldModalVisible(true)}
              >
                <FontAwesome6
                  name="pause"
                  size={15}
                  color={colors.textSecondary}
                />

                <Text style={styles.holdButtonText}>Hold Alert</Text>
              </TouchableOpacity>
            )}

            {/* =================================================
                HOLD MODAL
                ================================================= */}

            {holdModalVisible && (
              <View style={styles.holdOverlay}>
                <View style={styles.holdContainer}>
                  <View style={styles.holdHeader}>
                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.holdTitle}>Hold Alert</Text>

                      <Text style={styles.holdSubtitle}>
                        Temporarily hide this expired alert
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.holdCloseButton}
                      onPress={() => setHoldModalVisible(false)}
                    >
                      <FontAwesome6
                        name="xmark"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.holdQuestion}>
                    How many days do you want to hold this alert?
                  </Text>

                  <TextInput
                    value={holdDays}
                    onChangeText={setHoldDays}
                    keyboardType="number-pad"
                    placeholder="3"
                    placeholderTextColor={colors.textFaint}
                    style={styles.holdDaysInput}
                    selectTextOnFocus
                  />

                  <Text style={styles.holdHint}>
                    The student will return to the expired alerts after this
                    period.
                  </Text>

                  <View style={styles.holdActionRow}>
                    <TouchableOpacity
                      style={styles.holdCancelButton}
                      disabled={alertActionLoading}
                      onPress={() => setHoldModalVisible(false)}
                    >
                      <Text style={styles.holdCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.holdConfirmButton}
                      disabled={alertActionLoading}
                      onPress={handleHoldAlertStudent}
                    >
                      {alertActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.holdConfirmText}>Hold Alert</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            {vacateConfirmVisible && (
              <View style={styles.vacateConfirmOverlay}>
                <View style={styles.vacateConfirmContainer}>
                  <View style={styles.vacateConfirmIcon}>
                    <FontAwesome6
                      name="triangle-exclamation"
                      size={22}
                      color={colors.danger}
                    />
                  </View>

                  <Text style={styles.vacateConfirmTitle}>Vacate Seat</Text>

                  <Text style={styles.vacateConfirmMessage}>
                    Are you sure you want to vacate Seat {vacateConfirmSeat}?
                  </Text>

                  <View style={styles.vacateConfirmActions}>
                    <TouchableOpacity
                      style={styles.vacateConfirmCancel}
                      disabled={alertActionLoading}
                      onPress={() => {
                        console.log("🚨 VACATE CANCELLED");

                        setVacateConfirmVisible(false);
                        setVacateConfirmSeat(null);
                      }}
                    >
                      <Text style={styles.vacateConfirmCancelText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.vacateConfirmButton}
                      disabled={alertActionLoading}
                      onPress={async () => {
                        console.log(
                          "🚨 CONFIRM VACATE CLICKED:",
                          vacateConfirmSeat
                        );

                        setAlertActionLoading(true);

                        try {
                          await handleVacate(vacateConfirmSeat);

                          console.log(
                            "✅ Seat vacated successfully:",
                            vacateConfirmSeat
                          );

                          setVacateConfirmVisible(false);
                          setVacateConfirmSeat(null);
                        } catch (error) {
                          console.error(
                            "❌ Vacate confirmation failed:",
                            error
                          );
                        } finally {
                          setAlertActionLoading(false);
                        }
                      }}
                    >
                      {alertActionLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.vacateConfirmButtonText}>
                          Vacate
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({ title, value, sub, icon, bg, color, styles }) {
  return (
    <View style={styles.statCard}>
      <View>
        <Text style={styles.statTitle}>{title}</Text>

        <Text style={styles.statValue}>{value}</Text>

        <Text style={styles.statSub}>{sub}</Text>
      </View>

      <View
        style={[
          styles.statIcon,
          {
            backgroundColor: bg,
          },
        ]}
      >
        <FontAwesome6 name={icon} size={18} color={color} />
      </View>
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

function createStyles(colors) {
  return StyleSheet.create({
    vacateConfirmOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },

    vacateConfirmContainer: {
      width: "90%",
      maxWidth: 420,

      // Use your card/surface color instead of page background
      backgroundColor: colors.card,

      borderRadius: 18,
      padding: 24,
      alignItems: "center",

      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
    },
    vacateConfirmTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    vacateConfirmMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },

    vacateConfirmIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(220, 38, 38, 0.10)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },

    vacateConfirmTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
    },

    vacateConfirmMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },

    vacateConfirmActions: {
      flexDirection: "row",
      width: "100%",
      gap: 12,
    },

    vacateConfirmCancel: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    vacateConfirmCancelText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    vacateConfirmButton: {
      flex: 1,
      height: 46,
      borderRadius: 10,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },

    vacateConfirmButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    // ========================================================
    // GENERAL
    // ========================================================

    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },

    // ========================================================
    // STAT GRID
    // ========================================================

    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 14,
      marginBottom: spacing.md,
    },

    statCardWrapper: {
      width: "48%",
    },

    statCard: {
      width: "100%",
      borderRadius: 24,
      padding: 20,
      position: "relative",
      backgroundColor: colors.card,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      minHeight: 110,

      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    statTitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },

    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
    },

    statSub: {
      fontSize: 11,
      color: colors.textFaint,
    },

    statIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // CARD
    // ========================================================

    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    cardSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
      marginBottom: spacing.sm,
    },

    emptyText: {
      color: colors.textFaint,
      textAlign: "center",
      paddingVertical: 20,
    },

    viewAll: {
      textAlign: "center",
      color: colors.primaryBlue,
      fontWeight: "600",
      marginTop: 10,
    },

    // ========================================================
    // ALERT SLIDER
    // ========================================================

    alertSliderWrapper: {
      width: "100%",
    },

    alertSliderContent: {
      paddingRight: 10,
    },

    alertSlide: {
      marginRight: 12,
    },

    // ========================================================
    // SEAT HEADER
    // ========================================================

    seatHeader: {
      marginBottom: spacing.sm,
    },

    legend: {
      flexDirection: "row",
      gap: 20,
      marginBottom: spacing.md,
    },

    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },

    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // ========================================================
    // ALERT STUDENT MODAL
    // ========================================================

    alertModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },

    alertModalContainer: {
      width: "100%",
      backgroundColor: colors.card,
      borderRadius: 26,
      padding: 20,
      maxHeight: "90%",
      position: "relative",
    },
    alertModalContainerDesktop: {
      width: "92%",
      maxWidth: 900,
      maxHeight: "88%",
      padding: 24,
      borderRadius: 26,
    },

    alertModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },

    alertModalTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    alertModalSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textSecondary,
    },

    alertModalClose: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // STUDENT BOX
    // ========================================================

    alertStudentBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 15,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },

    alertStudentAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    alertStudentName: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    alertStudentSeat: {
      marginTop: 3,
      fontSize: 13,
      color: colors.textSecondary,
    },

    // ========================================================
    // DETAILS
    // ========================================================

    alertDetails: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      padding: 15,
    },

    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 9,
    },

    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    expiredBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 8,
      padding: 10,
      borderRadius: 12,
      backgroundColor: colors.dangerBg,
    },

    expiredBadgeText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.danger,
    },

    // ========================================================
    // RENEW / VACATE
    // ========================================================

    alertActionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 18,
    },

    renewButton: {
      flex: 1,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    renewButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },

    vacateAlertButton: {
      flex: 1,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },

    vacateAlertText: {
      color: colors.danger,
      fontSize: 16,
      fontWeight: "700",
    },

    // ========================================================
    // HOLD BUTTON
    // ========================================================

    holdButton: {
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.borderLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 10,
    },

    holdButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },

    // ========================================================
    // HOLD MODAL
    // ========================================================

    holdOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
      elevation: 999,
    },

    holdContainer: {
      width: "92%",
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,

      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 20,

      shadowOffset: {
        width: 0,
        height: 8,
      },

      elevation: 10,
    },

    holdHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    holdTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    holdSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.textSecondary,
    },

    holdCloseButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },

    holdQuestion: {
      marginTop: 18,
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    holdDaysInput: {
      height: 58,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 15,
      marginTop: 12,
      paddingHorizontal: 18,
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      backgroundColor: colors.card,
    },

    holdHint: {
      textAlign: "center",
      marginTop: 10,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textFaint,
    },

    holdActionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 20,
    },

    holdCancelButton: {
      flex: 1,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },

    holdCancelText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    holdConfirmButton: {
      flex: 1,
      height: 52,
      borderRadius: 15,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
    },

    holdConfirmText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#FFFFFF",
    },
  });
}
