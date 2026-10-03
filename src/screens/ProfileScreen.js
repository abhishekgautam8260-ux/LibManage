import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";

import ProfileMainPanel from "../components/ProfileMainPanel";

import { FontAwesome6 } from "@expo/vector-icons";

import Header from "../components/Header";
import DesktopLayout from "../components/DesktopLayout";

import { useAuth } from "../context/AuthContext";

import {
  getProfile,
  updateAdminProfile,
  updateLibraryProfile,
} from "../api/profile";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from "../api/employee";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

// =========================================================
// THEME
// =========================================================

function useScreenTheme() {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  return {
    colors,
    styles,
  };
}

// =========================================================
// PROFILE SCREEN
// =========================================================

export default function ProfileScreen() {
  const { colors, styles } = useScreenTheme();

  const { libraryId, signOut, isAdmin, canManageEmployees } = useAuth();

  const { width } = useWindowDimensions();

  /*
   * Desktop/Web layout.
   *
   * The shared DesktopLayout provides:
   * - Sidebar
   * - Header
   * - Navigation
   *
   * Mobile keeps the existing Header.
   */
  const isDesktop = Platform.OS === "web" && width >= 1000;

  const [profile, setProfile] = useState(null);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // =======================================================
  // PROFILE EDIT MODALS
  // =======================================================

  const [adminEditVisible, setAdminEditVisible] = useState(false);

  const [libraryEditVisible, setLibraryEditVisible] = useState(false);

  // =======================================================
  // EMPLOYEE MODAL
  //
  // "list" -> Employee list
  // "form" -> Add/Edit employee
  // =======================================================

  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);

  const [employeeModalMode, setEmployeeModalMode] = useState("list");

  const [editingEmployee, setEditingEmployee] = useState(null);

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  const loadProfile = useCallback(async () => {
    if (!libraryId) return;

    try {
      const data = await getProfile(libraryId);

      setProfile(data);
    } catch (error) {
      console.log("❌ Profile load failed:", error);

      Alert.alert(
        "Unable to load profile",
        error?.message || "Something went wrong while loading your profile."
      );
    }
  }, [libraryId]);

  // =========================================================
  // LOAD EMPLOYEES
  // =========================================================

  const loadEmployees = useCallback(async () => {
    if (!libraryId || !canManageEmployees) return;

    try {
      setEmployeesLoading(true);

      const data = await getEmployees(libraryId);

      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("❌ Employee loading failed:", error);

      Alert.alert(
        "Unable to load employees",
        error?.message || "Something went wrong while loading employees."
      );
    } finally {
      setEmployeesLoading(false);
    }
  }, [libraryId, canManageEmployees]);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    const loadData = async () => {
      if (!libraryId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        await loadProfile();

        if (canManageEmployees) {
          await loadEmployees();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [libraryId, loadProfile, loadEmployees, canManageEmployees]);

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadProfile();

      if (canManageEmployees) {
        await loadEmployees();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================================
  // OPEN ADMIN PROFILE EDIT
  // =========================================================

  const openAdminProfileEdit = () => {
    if (!isAdmin) return;

    setAdminEditVisible(true);
  };

  // =========================================================
  // OPEN LIBRARY PROFILE EDIT
  // =========================================================

  const openLibraryProfileEdit = () => {
    if (!isAdmin) return;

    setLibraryEditVisible(true);
  };

  // =========================================================
  // SAVE ADMIN PROFILE
  // =========================================================

  const handleSaveAdminProfile = async ({ name, phone }) => {
    try {
      const updated = await updateAdminProfile({
        name,
        phone,
      });

      setProfile(updated);

      Alert.alert(
        "Profile Updated",
        "Admin information has been updated successfully."
      );

      return true;
    } catch (error) {
      console.log("❌ Admin profile update failed:", error);

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update admin information."
      );

      return false;
    }
  };

  // =========================================================
  // SAVE LIBRARY PROFILE
  // =========================================================

  const handleSaveLibraryProfile = async ({ libraryName, totalSeats }) => {
    if (!libraryId) {
      Alert.alert("Library unavailable", "Library information is missing.");

      return false;
    }

    try {
      const updated = await updateLibraryProfile({
        libraryId,
        libraryName,
        totalSeats,
      });

      setProfile(updated);

      Alert.alert(
        "Library Updated",
        "Library information has been updated successfully."
      );

      return true;
    } catch (error) {
      console.log("❌ Library profile update failed:", error);

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to update library information."
      );

      return false;
    }
  };

  // =========================================================
  // OPEN EMPLOYEE MANAGEMENT
  // =========================================================

  const openEmployeeManagement = async () => {
    setEmployeeModalMode("list");

    setEditingEmployee(null);

    setEmployeeModalVisible(true);

    await loadEmployees();
  };

  // =========================================================
  // OPEN ADD EMPLOYEE
  // =========================================================

  const handleAddEmployee = () => {
    setEditingEmployee(null);

    setEmployeeModalMode("form");
  };

  // =========================================================
  // OPEN EDIT EMPLOYEE
  // =========================================================

  const handleEditEmployee = (employee) => {
    console.log("✏️ Editing employee:", employee);

    setEditingEmployee(employee);

    setEmployeeModalMode("form");
  };

  // =========================================================
  // BACK TO EMPLOYEE LIST
  // =========================================================

  const handleBackToEmployeeList = () => {
    setEditingEmployee(null);

    setEmployeeModalMode("list");
  };

  // =========================================================
  // CLOSE EMPLOYEE MODAL
  // =========================================================

  const closeEmployeeModal = () => {
    setEmployeeModalVisible(false);

    setEmployeeModalMode("list");

    setEditingEmployee(null);
  };

  // =========================================================
  // SAVE EMPLOYEE
  // =========================================================

  const handleEmployeeSave = async (editingEmployee, form) => {
    console.log("🚀 handleEmployeeSave called", {
      editingEmployee,
      form,
      libraryId,
    });

    if (!libraryId) {
      Alert.alert("Library unavailable", "Library information is missing.");

      return false;
    }

    try {
      if (editingEmployee) {
        console.log("✏️ Updating employee:", editingEmployee.id);

        const response = await updateEmployee(
          editingEmployee.id,
          libraryId,
          form
        );

        console.log("✅ Update employee response:", response);
      } else {
        console.log("➕ Creating employee:", {
          libraryId,
          form,
        });

        const response = await createEmployee(libraryId, form);

        console.log("✅ Create employee response:", response);
      }

      console.log("🔄 Reloading employees...");

      await loadEmployees();

      Alert.alert(
        editingEmployee ? "Employee Updated" : "Employee Created",
        editingEmployee
          ? "Employee details have been updated successfully."
          : "Employee has been created successfully."
      );

      return true;
    } catch (error) {
      console.error("❌ Employee save failed:", error);

      console.error("❌ Response:", error?.response?.data);

      Alert.alert(
        editingEmployee ? "Update Failed" : "Creation Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to save employee."
      );

      return false;
    }
  };

  // =========================================================
  // TOGGLE EMPLOYEE STATUS
  // =========================================================

  const handleToggleStatus = (employee) => {
    console.log("🔥 EMPLOYEE STATUS CLICKED");
    console.log("👤 Employee:", employee);
    console.log("🆔 Employee ID:", employee?.id);
    console.log("🏢 Library ID:", libraryId);
    console.log("🔵 Current active:", employee?.active);

    const nextStatus = !employee.active;

    console.log("🔄 Next status:", nextStatus);

    const performStatusUpdate = async () => {
      console.log("🚀 performStatusUpdate STARTED");

      try {
        console.log("📡 Calling updateEmployeeStatus...");

        const result = await updateEmployeeStatus(
          employee.id,
          libraryId,
          nextStatus
        );

        console.log("✅ updateEmployeeStatus SUCCESS:", result);

        console.log("🔄 Reloading employees...");
        await loadEmployees();

        console.log("✅ Employees reloaded");

        Alert.alert(
          nextStatus ? "Activated" : "Vacated",
          nextStatus
            ? `${employee.name} can log in again.`
            : `${employee.name} has been vacated.`
        );
      } catch (error) {
        console.log("❌ Employee status update failed:", error);

        Alert.alert(
          "Update Failed",
          error?.message || "Unable to update employee status."
        );
      }
    };

    console.log("🌐 Platform:", Platform.OS);

    if (Platform.OS === "web") {
      console.log("🌐 WEB → Calling performStatusUpdate()");
      performStatusUpdate();
      return;
    }

    console.log("📱 MOBILE → Showing confirmation");

    Alert.alert(
      nextStatus ? "Activate Employee?" : "Vacate Employee?",
      nextStatus
        ? `${employee.name} will be able to log in again.`
        : `${employee.name} will no longer be able to log in.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: nextStatus ? "Activate" : "Vacate",
          onPress: performStatusUpdate,
        },
      ]
    );
  };

  // =========================================================
  // DELETE EMPLOYEE
  // =========================================================

  const handleDeleteEmployee = (employee) => {
    console.log("🗑️ DELETE HANDLER CALLED", employee);

    const confirmDelete = async () => {
      try {
        console.log("🚨 CONFIRMED DELETE");
        console.log("👤 Employee ID:", employee.id);
        console.log("🏢 Library ID:", libraryId);

        if (!employee?.id) {
          console.error("❌ Employee ID missing");
          return;
        }

        if (!libraryId) {
          console.error("❌ Library ID missing");
          return;
        }

        console.log("📡 CALLING DELETE API...");

        const response = await deleteEmployee(employee.id, libraryId);

        console.log("✅ DELETE API RESPONSE:", response);

        await loadEmployees();

        console.log("✅ EMPLOYEE LIST RELOADED");

        if (Platform.OS === "web") {
          window.alert("Employee deleted successfully.");
        } else {
          Alert.alert("Deleted", "Employee deleted successfully.");
        }
      } catch (error) {
        console.error("❌ DELETE API FAILED");
        console.error("❌ Error:", error);
        console.error("❌ Message:", error?.message);

        if (Platform.OS === "web") {
          window.alert(error?.message || "Unable to delete employee.");
        } else {
          Alert.alert(
            "Delete Failed",
            error?.message || "Unable to delete employee."
          );
        }
      }
    };

    // WEB
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to permanently delete ${employee.name}?`
      );

      console.log("🟡 DELETE CONFIRMATION:", confirmed);

      if (!confirmed) {
        console.log("❌ DELETE CANCELLED");
        return;
      }

      confirmDelete();
      return;
    }

    // MOBILE
    Alert.alert(
      "Delete Employee?",
      `Are you sure you want to permanently delete ${employee.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  // =========================================================
  // DESKTOP
  // =========================================================

  if (isDesktop) {
    return (
      <DesktopLayout
        activeRoute="Profile"
        title="Profile"
        subtitle="Manage your account and library settings"
        headerRight={
          isAdmin && canManageEmployees ? (
            <TouchableOpacity
              style={styles.desktopHeaderButton}
              onPress={openEmployeeManagement}
              activeOpacity={0.85}
            >
              <FontAwesome6 name="users" size={12} color="#fff" />

              <Text style={styles.desktopHeaderButtonText}>
                Employees ({employees.length})
              </Text>
            </TouchableOpacity>
          ) : null
        }
      >
        <ScrollView
          style={styles.desktopScroll}
          contentContainerStyle={styles.desktopContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primaryBlue}
            />
          }
        >
          <ProfileMainPanel
            profile={profile}
            employees={employees}
            employeesLoading={employeesLoading}
            isAdmin={isAdmin}
            canManageEmployees={canManageEmployees}
            onSaveAdminProfile={handleSaveAdminProfile}
            onSaveLibraryProfile={handleSaveLibraryProfile}
            onEditEmployee={handleEmployeeSave}
            onToggleEmployeeStatus={handleToggleStatus}
            onDeleteEmployee={handleDeleteEmployee}
            onRefreshEmployees={loadEmployees}
          />
        </ScrollView>
      </DesktopLayout>
    );
  }

  // =========================================================
  // MOBILE
  // =========================================================

  return (
    <View style={styles.container}>
      <Header title="Profile Details" />

      {/* NEW MOBILE PROFILE UI */}
      <ProfileMainPanel
        profile={profile}
        employees={employees}
        employeesLoading={employeesLoading}
        isAdmin={isAdmin}
        canManageEmployees={canManageEmployees}
        onSaveAdminProfile={handleSaveAdminProfile}
        onSaveLibraryProfile={handleSaveLibraryProfile}
        onEditEmployee={handleEmployeeSave}
        onToggleEmployeeStatus={handleToggleStatus}
        onDeleteEmployee={handleDeleteEmployee}
        onRefreshEmployees={loadEmployees}
      />
    </View>
  );
}
// =========================================================
// DESKTOP PROFILE IDENTITY
// =========================================================

function DesktopProfileIdentity({ profile, colors, styles }) {
  const adminName = profile?.adminName || "Admin";

  const libraryName = profile?.libraryName || "Library";

  const initial = adminName.charAt(0).toUpperCase();

  return (
    <View style={styles.desktopIdentityCard}>
      <View style={styles.desktopIdentityLeft}>
        <View style={styles.desktopAvatar}>
          <Text style={styles.desktopAvatarText}>{initial}</Text>
        </View>

        <View style={styles.desktopIdentityText}>
          <Text style={styles.desktopIdentityName}>{adminName}</Text>

          <Text style={styles.desktopIdentityLibrary}>{libraryName}</Text>
        </View>
      </View>

      <View style={styles.desktopIdentityBadge}>
        <FontAwesome6
          name="shield-halved"
          size={12}
          color={colors.primaryBlue}
        />

        <Text style={styles.desktopIdentityBadgeText}>Administrator</Text>
      </View>
    </View>
  );
}

// =========================================================
// MOBILE PROFILE IDENTITY
// =========================================================

function MobileProfileIdentity({ profile, colors, styles }) {
  const adminName = profile?.adminName || "Admin";

  const libraryName = profile?.libraryName || "Library";

  const initial = adminName.charAt(0).toUpperCase();

  return (
    <View style={styles.mobileIdentityCard}>
      <View style={styles.mobileIdentityAvatar}>
        <Text style={styles.mobileIdentityAvatarText}>{initial}</Text>
      </View>

      <View style={styles.mobileIdentityText}>
        <Text style={styles.mobileIdentityName}>{adminName}</Text>

        <Text style={styles.mobileIdentityLibrary}>{libraryName}</Text>

        <View style={styles.mobileIdentityBadge}>
          <FontAwesome6
            name="shield-halved"
            size={10}
            color={colors.primaryBlue}
          />

          <Text style={styles.mobileIdentityBadgeText}>Administrator</Text>
        </View>
      </View>
    </View>
  );
}

// =========================================================
// DESKTOP INFO CARD
// =========================================================

function DesktopInfoCard({
  title,
  icon,
  children,
  styles,
  colors,
  headerAction,
}) {
  return (
    <View style={styles.desktopInfoCard}>
      <View style={styles.desktopInfoHeader}>
        <View style={styles.desktopInfoHeaderLeft}>
          <View style={styles.desktopInfoIcon}>
            <FontAwesome6 name={icon} size={14} color={colors.primaryBlue} />
          </View>

          <Text style={styles.desktopInfoTitle}>{title}</Text>
        </View>

        {headerAction ? headerAction : null}
      </View>

      <View style={styles.desktopInfoBody}>{children}</View>
    </View>
  );
}

// =========================================================
// EDIT PROFILE BUTTON
// =========================================================

function EditProfileButton({ onPress, colors, styles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.editProfileButton}
    >
      <FontAwesome6 name="pen" size={11} color={colors.primaryBlue} />

      <Text style={styles.editProfileButtonText}>Edit</Text>
    </TouchableOpacity>
  );
}

// =========================================================
// SECTION HEADER
// =========================================================

function SectionHeader({ icon, title, action }) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <View style={styles.sectionIcon}>
          <FontAwesome6 name={icon} size={15} color={colors.primaryBlue} />
        </View>

        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      {action ? action : null}
    </View>
  );
}

// =========================================================
// INFO ROW
// =========================================================

function InfoRow({ icon, label, value }) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.infoRow}>
      <FontAwesome6
        name={icon}
        size={13}
        color={colors.textMuted}
        style={styles.infoIcon}
      />

      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue} numberOfLines={1}>
        {value ?? "-"}
      </Text>
    </View>
  );
}

// =========================================================
// PROFILE EDIT MODAL
// =========================================================

function ProfileEditModal({ visible, type, profile, onClose, onSave }) {
  const { colors, styles } = useScreenTheme();

  const isAdmin = type === "admin";

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [libraryName, setLibraryName] = useState("");

  const [totalSeats, setTotalSeats] = useState("");

  const [saving, setSaving] = useState(false);

  // =======================================================
  // INITIALIZE FORM
  // =======================================================

  useEffect(() => {
    if (!visible) return;

    if (isAdmin) {
      setName(profile?.adminName || "");

      setPhone(profile?.adminPhone || "");
    } else {
      setLibraryName(profile?.libraryName || "");

      setTotalSeats(
        profile?.totalSeats != null ? String(profile.totalSeats) : ""
      );
    }
  }, [visible, isAdmin, profile]);

  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async () => {
    if (isAdmin) {
      if (!name.trim()) {
        Alert.alert("Name Required", "Please enter your name.");
        return;
      }
    } else {
      if (!libraryName.trim()) {
        Alert.alert("Library Name Required", "Please enter a library name.");

        return;
      }

      const seats = Number(totalSeats);

      if (!Number.isInteger(seats) || seats <= 0) {
        Alert.alert(
          "Invalid Total Seats",
          "Total seats must be a whole number greater than 0."
        );

        return;
      }
    }

    try {
      setSaving(true);

      const success = isAdmin
        ? await onSave({
            name: name.trim(),
          })
        : await onSave({
            libraryName: libraryName.trim(),
            totalSeats: Number(totalSeats),
          });

      if (success) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!saving) {
          onClose();
        }
      }}
    >
      <KeyboardAvoidingView
        style={styles.profileEditOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.profileEditModal}>
          {/* HEADER */}

          <View style={styles.profileEditHeader}>
            <View style={styles.profileEditHeaderLeft}>
              <View style={styles.profileEditIcon}>
                <FontAwesome6
                  name={isAdmin ? "user" : "building"}
                  size={15}
                  color={colors.primaryBlue}
                />
              </View>

              <View style={styles.profileEditHeaderText}>
                <Text style={styles.profileEditTitle}>
                  {isAdmin ? "Edit Admin Profile" : "Edit Library"}
                </Text>

                <Text style={styles.profileEditSubtitle}>
                  {isAdmin
                    ? "Update your administrator details"
                    : "Update your library information"}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={saving}
            >
              <FontAwesome6 name="xmark" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* FORM CONTENT */}

          <ScrollView
            style={styles.profileEditScroll}
            contentContainerStyle={styles.profileEditContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isAdmin ? (
              <>
                <InputField
                  label="Name"
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  icon="user"
                  editable={!saving}
                />

                <InputField
                  label="Phone"
                  placeholder="Phone number"
                  value={phone}
                  icon="phone"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  editable={false}
                />

                <View style={styles.profileEditHint}>
                  <FontAwesome6
                    name="circle-info"
                    size={12}
                    color={colors.textMuted}
                  />

                  <View style={styles.profileEditHint}>
                    <FontAwesome6
                      name="lock"
                      size={12}
                      color={colors.textMuted}
                    />

                    <Text style={styles.profileEditHintText}>
                      Phone number cannot be changed.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <InputField
                  label="Library Name"
                  placeholder="Enter library name"
                  value={libraryName}
                  onChangeText={setLibraryName}
                  icon="building"
                  editable={!saving}
                />

                <InputField
                  label="Total Seats"
                  placeholder="e.g. 65"
                  value={totalSeats}
                  onChangeText={(value) =>
                    setTotalSeats(value.replace(/\D/g, ""))
                  }
                  icon="chair"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  editable={!saving}
                />

                <View style={styles.profileEditHint}>
                  <FontAwesome6
                    name="circle-info"
                    size={12}
                    color={colors.textMuted}
                  />

                  <Text style={styles.profileEditHintText}>
                    Total seats must be greater than 0. Make sure the new value
                    does not conflict with occupied seats.
                  </Text>
                </View>
              </>
            )}
          </ScrollView>

          {/* FOOTER */}

          <View style={styles.profileEditFooter}>
            <TouchableOpacity
              style={styles.profileEditCancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.profileEditCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.profileEditSaveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome6 name="check" size={12} color="#fff" />

                  <Text style={styles.profileEditSaveText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =========================================================
// EMPLOYEE MANAGEMENT MODAL
// =========================================================

function EmployeeManagementModal({
  visible,
  mode,
  employees,
  loading,
  employee,
  onClose,
  onBack,
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete,
  onSave,
}) {
  const { styles } = useScreenTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={mode === "form" ? onBack : onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.managementModalContainer,
            mode === "form" && styles.formModalContainer,
          ]}
        >
          {mode === "list" ? (
            <EmployeeListView
              employees={employees}
              loading={loading}
              onClose={onClose}
              onAdd={onAdd}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ) : (
            <EmployeeFormView
              employee={employee}
              onBack={onBack}
              onClose={onClose}
              onSave={onSave}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
// =========================================================
// EMPLOYEE LIST VIEW
// =========================================================

function EmployeeListView({
  employees,
  loading,
  onClose,
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.listView}>
      {/* HEADER */}

      <View style={styles.managementHeader}>
        <View style={styles.managementHeaderLeft}>
          <View style={styles.managementHeaderIcon}>
            <FontAwesome6 name="users" size={17} color={colors.primaryBlue} />
          </View>

          <View>
            <Text style={styles.modalTitle}>Employee Management</Text>

            <Text style={styles.modalSubtitle}>
              {employees.length}{" "}
              {employees.length === 1 ? "employee" : "employees"} in your
              library
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <FontAwesome6 name="xmark" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}

      {loading ? (
        <View style={styles.managementLoading}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />

          <Text style={styles.loadingText}>Loading employees...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.managementScroll}
          contentContainerStyle={styles.managementScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {employees.length === 0 ? (
            <EmptyEmployees onAdd={onAdd} />
          ) : (
            employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onEdit={() => onEdit(employee)}
                onToggleStatus={() => onToggleStatus(employee)}
                onDelete={() => onDelete(employee)}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* FOOTER */}

      <View style={styles.managementFooter}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.addEmployeeButton}
          onPress={onAdd}
        >
          <FontAwesome6 name="plus" size={14} color="#fff" />

          <Text style={styles.addEmployeeText}>Add Employee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================
// EMPLOYEE CARD
// =========================================================

function EmployeeCard({ employee, onEdit, onToggleStatus, onDelete }) {
  console.log("🔥🔥 NEW EMPLOYEE CARD CODE RUNNING 🔥🔥", employee?.id);

  const { colors, styles } = useScreenTheme();

  const roleLabel =
    employee.role === "MANAGER"
      ? "Manager"
      : employee.role === "RECEPTIONIST"
      ? "Receptionist"
      : employee.role === "ACCOUNTANT"
      ? "Accountant"
      : employee.role;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 11,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        gap: 8,
      }}
    >
      {/* EDIT */}
      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.statBlueBg,
        }}
        onPress={() => {
          console.log("✏️ EDIT CLICKED", employee?.id);
          onEdit?.();
        }}
      >
        <FontAwesome6 name="pen" size={12} color={colors.primaryBlue} />
      </TouchableOpacity>

      {/* VACATE / ACTIVATE */}
      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: employee.active
            ? colors.warningBg || "#FFF7ED"
            : colors.successBg,
        }}
        onPress={() => {
          console.log("🚨🚨 THIS IS THE NEW VACATE BUTTON", employee?.id);

          if (!onToggleStatus) {
            console.error("❌ onToggleStatus missing");
            return;
          }

          onToggleStatus();
        }}
      >
        <FontAwesome6
          name={employee.active ? "user-slash" : "user-check"}
          size={12}
          color={employee.active ? colors.warning : colors.success}
        />
      </TouchableOpacity>

      {/* DELETE */}
      {/* DELETE - TEMP DISABLED */}
      <TouchableOpacity
        style={[
          styles.iconButton,
          isMobile && styles.mobileIconButton,
          {
            opacity: 0.3,
          },
        ]}
        disabled={true}
      >
        <FontAwesome6 name="trash" size={12} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

// =========================================================
// EMPTY EMPLOYEE STATE
// =========================================================

function EmptyEmployees({ onAdd }) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.emptyEmployees}>
      <View style={styles.emptyIcon}>
        <FontAwesome6 name="user-plus" size={20} color={colors.primaryBlue} />
      </View>

      <Text style={styles.emptyTitle}>No employees yet</Text>

      <Text style={styles.emptySubtitle}>
        Add staff members to help manage your library.
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.emptyButton}
        onPress={onAdd}
      >
        <Text style={styles.emptyButtonText}>Add First Employee</Text>
      </TouchableOpacity>
    </View>
  );
}

// =========================================================
// EMPLOYEE FORM VIEW
// =========================================================

function EmployeeFormView({ employee, onBack, onClose, onSave }) {
  const { colors, styles } = useScreenTheme();

  const isEditing = !!employee;

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [role, setRole] = useState("RECEPTIONIST");

  const [saving, setSaving] = useState(false);

  // =======================================================
  // INITIALIZE FORM
  // =======================================================

  useEffect(() => {
    if (employee) {
      setName(employee.name || "");

      setPhone(employee.phone || "");

      setUsername(employee.username || "");

      setPassword("");

      setRole(employee.role || "RECEPTIONIST");
    } else {
      setName("");
      setPhone("");
      setUsername("");
      setPassword("");
      setRole("RECEPTIONIST");
    }
  }, [employee]);

  // =======================================================
  // SUBMIT
  // =======================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter employee name.");

      return;
    }

    if (!username.trim()) {
      Alert.alert("Username Required", "Please enter a username.");

      return;
    }

    if (!isEditing && !password.trim()) {
      Alert.alert("Password Required", "Please enter a password.");

      return;
    }

    if (password.trim() && password.trim().length < 6) {
      Alert.alert(
        "Weak Password",
        "Password should contain at least 6 characters."
      );

      return;
    }

    const payload = {
      name: name.trim(),

      phone: phone.trim() || null,

      username: username.trim().toLowerCase(),

      role,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (isEditing) {
      payload.active = employee.active;
    }

    try {
      setSaving(true);

      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.formView}>
      {/* HEADER */}

      <View style={styles.formHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={saving}
        >
          <FontAwesome6
            name="arrow-left"
            size={16}
            color={colors.primaryBlue}
          />
        </TouchableOpacity>

        <View style={styles.formHeaderText}>
          <Text style={styles.modalTitle}>
            {isEditing ? "Edit Employee" : "Add Employee"}
          </Text>

          <Text style={styles.modalSubtitle}>
            {isEditing
              ? "Update employee access"
              : "Create staff login credentials"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={saving}
        >
          <FontAwesome6 name="xmark" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* FORM */}

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <InputField
          label="Employee Name"
          placeholder="e.g. Rahul Sharma"
          value={name}
          onChangeText={setName}
          icon="user"
          editable={!saving}
        />

        <InputField
          label="Phone"
          placeholder="e.g. 9876543210"
          value={phone}
          onChangeText={(value) => setPhone(value.replace(/\D/g, ""))}
          icon="phone"
          keyboardType="phone-pad"
          editable={!saving}
        />

        <InputField
          label="Username"
          placeholder="e.g. rahul"
          value={username}
          onChangeText={setUsername}
          icon="at"
          autoCapitalize="none"
          editable={!saving}
        />

        <InputField
          label={isEditing ? "New Password" : "Password"}
          placeholder={
            isEditing
              ? "Leave blank to keep current password"
              : "Enter login password"
          }
          value={password}
          onChangeText={setPassword}
          icon="lock"
          secureTextEntry
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.inputLabel}>Employee Role</Text>

        <View style={styles.roleOptions}>
          <RoleOption
            title="Manager"
            subtitle="Most management access"
            value="MANAGER"
            selected={role === "MANAGER"}
            onPress={() => setRole("MANAGER")}
            disabled={saving}
          />

          <RoleOption
            title="Receptionist"
            subtitle="Students & seats"
            value="RECEPTIONIST"
            selected={role === "RECEPTIONIST"}
            onPress={() => setRole("RECEPTIONIST")}
            disabled={saving}
          />

          <RoleOption
            title="Accountant"
            subtitle="Billing & payments"
            value="ACCOUNTANT"
            selected={role === "ACCOUNTANT"}
            onPress={() => setRole("ACCOUNTANT")}
            disabled={saving}
          />
        </View>

        <View style={styles.formBottomSpace} />
      </ScrollView>

      {/* FOOTER */}

      <View style={styles.modalFooter}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onBack}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <FontAwesome6
                name={isEditing ? "check" : "plus"}
                size={13}
                color="#fff"
              />

              <Text style={styles.saveButtonText}>
                {isEditing ? "Save Changes" : "Create Employee"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================
// INPUT FIELD
// =========================================================

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  icon,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  editable = true,
}) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
        <FontAwesome6 name={icon} size={14} color={colors.textMuted} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || "words"}
          editable={editable}
        />
      </View>
    </View>
  );
}

// =========================================================
// ROLE OPTION
// =========================================================

function RoleOption({ title, subtitle, value, selected, onPress, disabled }) {
  const { styles } = useScreenTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.roleOption, selected && styles.roleOptionSelected]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>

      <View style={styles.roleContent}>
        <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
          {title}
        </Text>

        <Text style={styles.roleSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}
// =========================================================
// PROFILE STYLES
// =========================================================

function createStyles(colors) {
  return StyleSheet.create({
    // =======================================================
    // BASE
    // =======================================================

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

    scrollContent: {
      padding: spacing.md,
      paddingBottom: 40,
    },

    // =======================================================
    // MOBILE PROFILE IDENTITY
    // =======================================================

    mobileIdentityCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,

      padding: 18,
      marginBottom: spacing.md,

      flexDirection: "row",
      alignItems: "center",
    },

    mobileIdentityAvatar: {
      width: 64,
      height: 64,

      borderRadius: 20,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 14,
    },

    mobileIdentityAvatarText: {
      fontSize: 25,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    mobileIdentityText: {
      flex: 1,
      minWidth: 0,
    },

    mobileIdentityName: {
      fontSize: 19,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    mobileIdentityLibrary: {
      marginTop: 3,

      fontSize: 11,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    mobileIdentityBadge: {
      alignSelf: "flex-start",

      marginTop: 9,

      paddingHorizontal: 9,
      paddingVertical: 5,

      borderRadius: 7,

      backgroundColor: colors.statBlueBg,

      flexDirection: "row",
      alignItems: "center",
    },

    mobileIdentityBadgeText: {
      marginLeft: 5,

      fontSize: 9,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    // =======================================================
    // MOBILE INFORMATION CARDS
    // =======================================================

    card: {
      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,
      borderColor: colors.border,

      paddingHorizontal: 14,
      paddingVertical: 8,

      marginBottom: spacing.md,

      overflow: "hidden",
    },

    sectionHeader: {
      minHeight: 48,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: 2,
    },

    sectionHeaderLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    sectionIcon: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    cardTitle: {
      fontSize: 14,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    infoRow: {
      minHeight: 46,

      flexDirection: "row",
      alignItems: "center",

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    infoIcon: {
      width: 26,
    },

    infoLabel: {
      width: 105,

      fontSize: 11,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    infoValue: {
      flex: 1,

      fontSize: 12,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    // =======================================================
    // MOBILE EMPLOYEE MANAGEMENT
    // =======================================================

    employeeManagementCard: {
      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,
      borderColor: colors.border,

      minHeight: 76,

      paddingHorizontal: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: spacing.md,
    },

    employeeManagementLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    employeeManagementIcon: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    employeeManagementText: {
      flex: 1,
      minWidth: 0,
    },

    employeeManagementTitle: {
      fontSize: 13,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    employeeManagementSubtitle: {
      marginTop: 3,

      fontSize: 10,

      color: colors.textSecondary,
    },

    employeeManagementRight: {
      marginLeft: 10,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    employeeCount: {
      minWidth: 32,
      height: 32,

      paddingHorizontal: 8,

      borderRadius: 16,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    employeeCountText: {
      color: colors.primaryBlue,

      fontSize: 13,
      fontWeight: "800",
    },

    // =======================================================
    // DESKTOP SCROLL
    // =======================================================

    desktopScroll: {
      flex: 1,
      backgroundColor: colors.bg,
    },

    desktopContent: {
      padding: 16,
      paddingBottom: 30,

      minHeight: "100%",
    },

    // =======================================================
    // DESKTOP IDENTITY
    // =======================================================

    desktopIdentityCard: {
      minHeight: 92,

      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,
      borderColor: colors.border,

      paddingHorizontal: 18,
      paddingVertical: 14,

      marginBottom: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    desktopIdentityLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    desktopAvatar: {
      width: 58,
      height: 58,

      borderRadius: 17,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 13,
    },

    desktopAvatarText: {
      fontSize: 23,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    desktopIdentityText: {
      minWidth: 0,
    },

    desktopIdentityName: {
      fontSize: 17,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopIdentityLibrary: {
      marginTop: 4,

      fontSize: 11,
      fontWeight: "600",

      color: colors.textSecondary,
    },

    desktopIdentityBadge: {
      paddingHorizontal: 11,
      paddingVertical: 7,

      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopIdentityBadgeText: {
      marginLeft: 6,

      fontSize: 10,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    // =======================================================
    // DESKTOP MAIN GRID
    // =======================================================

    desktopMainGrid: {
      flexDirection: "row",

      alignItems: "flex-start",

      gap: 14,

      width: "100%",
    },

    desktopLeftColumn: {
      width: "42%",

      minWidth: 0,
    },

    desktopRightColumn: {
      flex: 1,

      minWidth: 0,
    },

    // =======================================================
    // EDIT PROFILE BUTTON
    // =======================================================

    editProfileButton: {
      minHeight: 32,

      paddingHorizontal: 9,

      borderRadius: 8,

      backgroundColor: colors.statBlueBg,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 5,
    },

    editProfileButtonText: {
      fontSize: 10,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    // =======================================================
    // DESKTOP INFO CARD
    // =======================================================

    desktopInfoCard: {
      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,
      borderColor: colors.border,

      marginBottom: 14,

      overflow: "hidden",
    },

    desktopInfoHeader: {
      minHeight: 58,

      paddingHorizontal: 15,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    desktopInfoHeaderLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    desktopInfoIcon: {
      width: 34,
      height: 34,

      borderRadius: 10,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    desktopInfoTitle: {
      fontSize: 13,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopInfoBody: {
      paddingHorizontal: 15,
    },

    desktopInfoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    // =======================================================
    // DESKTOP EMPLOYEE CARD
    // =======================================================

    desktopEmployeeCard: {
      minHeight: 82,

      backgroundColor: colors.card,

      borderRadius: 16,

      borderWidth: 1,
      borderColor: colors.border,

      paddingHorizontal: 16,

      flexDirection: "row",
      alignItems: "center",
    },

    desktopEmployeeIcon: {
      width: 44,
      height: 44,

      borderRadius: 13,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 12,
    },

    desktopEmployeeText: {
      flex: 1,
      minWidth: 0,
    },

    desktopEmployeeTitle: {
      fontSize: 14,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    desktopEmployeeSubtitle: {
      marginTop: 4,

      fontSize: 10,

      color: colors.textSecondary,
    },

    desktopEmployeeRight: {
      marginLeft: 12,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    desktopHeaderButton: {
      height: 34,

      paddingHorizontal: 12,

      borderRadius: 9,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 6,
    },

    desktopHeaderButtonText: {
      fontSize: 10,
      fontWeight: "800",

      color: "#FFFFFF",
    },

    // =======================================================
    // PROFILE EDIT MODAL
    // =======================================================

    profileEditOverlay: {
      flex: 1,

      backgroundColor: "rgba(2, 6, 23, 0.68)",

      alignItems: "center",
      justifyContent: "center",

      padding: 20,
    },

    profileEditModal: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "88%",

      backgroundColor: colors.card,

      borderRadius: 20,

      overflow: "hidden",

      borderWidth: 1,
      borderColor: colors.border,

      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: {
        width: 0,
        height: 8,
      },

      elevation: 8,
    },

    profileEditHeader: {
      minHeight: 72,

      paddingHorizontal: 16,

      backgroundColor: colors.card,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    profileEditHeaderLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    profileEditIcon: {
      width: 40,
      height: 40,

      borderRadius: 11,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    profileEditHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    profileEditTitle: {
      fontSize: 16,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    profileEditSubtitle: {
      marginTop: 3,

      fontSize: 10,

      color: colors.textSecondary,
    },

    profileEditScroll: {
      flexGrow: 0,
    },

    profileEditContent: {
      padding: 18,
      paddingBottom: 6,
    },

    profileEditHint: {
      flexDirection: "row",
      alignItems: "flex-start",

      backgroundColor: colors.borderLight,

      borderRadius: 10,

      paddingHorizontal: 11,
      paddingVertical: 10,

      marginTop: 2,
      marginBottom: 8,
    },

    profileEditHintText: {
      flex: 1,

      marginLeft: 8,

      fontSize: 10,
      lineHeight: 15,

      color: colors.textSecondary,
    },

    profileEditFooter: {
      backgroundColor: colors.card,

      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 24 : 14,

      borderTopWidth: 1,
      borderTopColor: colors.border,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    profileEditCancelButton: {
      flex: 1,

      height: 46,

      borderRadius: 10,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    profileEditCancelText: {
      fontSize: 12,
      fontWeight: "800",

      color: colors.textSecondary,
    },

    profileEditSaveButton: {
      flex: 1,

      height: 46,

      borderRadius: 10,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,
    },

    profileEditSaveText: {
      fontSize: 12,
      fontWeight: "800",

      color: "#FFFFFF",
    },

    // =======================================================
    // MODAL
    // =======================================================

    modalOverlay: {
      flex: 1,

      backgroundColor: "rgba(2, 6, 23, 0.68)",

      justifyContent: "flex-end",
    },

    managementModalContainer: {
      width: "100%",

      height: "88%",

      backgroundColor: colors.card,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      overflow: "hidden",
    },

    formModalContainer: {
      width: "100%",

      height: "92%",

      backgroundColor: colors.card,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      overflow: "hidden",
    },

    listView: {
      flex: 1,

      backgroundColor: colors.bg,
    },

    formView: {
      flex: 1,

      backgroundColor: colors.card,
    },

    // =======================================================
    // MANAGEMENT HEADER
    // =======================================================

    managementHeader: {
      backgroundColor: colors.card,

      minHeight: 74,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingHorizontal: 18,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    managementHeaderLeft: {
      flex: 1,

      flexDirection: "row",
      alignItems: "center",

      minWidth: 0,
    },

    managementHeaderIcon: {
      width: 42,
      height: 42,

      borderRadius: 12,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    modalTitle: {
      fontSize: 17,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    modalSubtitle: {
      fontSize: 10,

      color: colors.textSecondary,

      marginTop: 3,
    },

    closeButton: {
      width: 36,
      height: 36,

      borderRadius: 10,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    // =======================================================
    // EMPLOYEE LIST
    // =======================================================

    managementScroll: {
      flex: 1,
    },

    managementScrollContent: {
      padding: 14,
      paddingBottom: 20,
    },

    managementLoading: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 8,

      fontSize: 11,

      color: colors.textSecondary,
    },

    managementFooter: {
      backgroundColor: colors.card,

      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: Platform.OS === "ios" ? 24 : 14,

      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    // =======================================================
    // ADD EMPLOYEE BUTTON
    // =======================================================

    addEmployeeButton: {
      height: 46,

      borderRadius: 11,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      shadowColor: colors.primaryBlue,

      shadowOpacity: 0.2,
      shadowRadius: 8,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    addEmployeeText: {
      color: "#FFFFFF",

      fontSize: 13,
      fontWeight: "800",

      marginLeft: 8,
    },

    // =======================================================
    // EMPLOYEE CARD
    // =======================================================

    employeeCard: {
      backgroundColor: colors.card,

      borderRadius: 14,

      borderWidth: 1,
      borderColor: colors.border,

      padding: 14,

      marginBottom: 10,
    },

    employeeCardInactive: {
      opacity: 0.68,
    },

    employeeTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    avatar: {
      width: 46,
      height: 46,

      borderRadius: 14,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    avatarText: {
      fontSize: 17,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    employeeDetails: {
      flex: 1,
      minWidth: 0,
    },

    employeeName: {
      fontSize: 14,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    inactiveText: {
      color: colors.textMuted,
    },

    username: {
      marginTop: 2,

      fontSize: 10,

      color: colors.textMuted,
    },

    badgeRow: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 7,

      flexWrap: "wrap",
    },

    roleBadge: {
      backgroundColor: colors.borderLight,

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 7,

      marginRight: 7,
    },

    roleBadgeText: {
      fontSize: 9,
      fontWeight: "800",

      color: colors.textSecondary,

      textTransform: "uppercase",
    },

    statusBadge: {
      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 8,
      paddingVertical: 5,

      borderRadius: 7,
    },

    statusActive: {
      backgroundColor: colors.successBg,
    },

    statusInactive: {
      backgroundColor: colors.dangerBg,
    },

    statusDot: {
      width: 6,
      height: 6,

      borderRadius: 3,

      marginRight: 5,
    },

    statusDotActive: {
      backgroundColor: colors.success,
    },

    statusDotInactive: {
      backgroundColor: colors.danger,
    },

    statusText: {
      fontSize: 9,
      fontWeight: "800",
    },

    statusTextActive: {
      color: colors.success,
    },

    statusTextInactive: {
      color: colors.danger,
    },

    employeePhoneRow: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 11,
      paddingTop: 10,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    employeePhone: {
      marginLeft: 8,

      fontSize: 11,

      color: colors.textSecondary,
    },

    employeeActions: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 11,
      paddingTop: 10,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    secondaryAction: {
      height: 34,

      paddingHorizontal: 10,

      borderRadius: 8,

      backgroundColor: colors.borderLight,

      flexDirection: "row",
      alignItems: "center",

      marginRight: 7,
    },

    secondaryActionText: {
      marginLeft: 6,

      fontSize: 10,
      fontWeight: "700",

      color: colors.primaryBlue,
    },

    deleteAction: {
      marginLeft: "auto",

      width: 34,
      height: 34,

      borderRadius: 8,

      backgroundColor: colors.dangerBg,

      alignItems: "center",
      justifyContent: "center",
    },

    // =======================================================
    // EMPTY EMPLOYEES
    // =======================================================

    emptyEmployees: {
      backgroundColor: colors.card,

      borderRadius: 14,

      borderWidth: 1,
      borderColor: colors.border,

      padding: 24,

      alignItems: "center",
      justifyContent: "center",
    },

    emptyIcon: {
      width: 50,
      height: 50,

      borderRadius: 25,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginBottom: 10,
    },

    emptyTitle: {
      fontSize: 14,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    emptySubtitle: {
      fontSize: 11,
      lineHeight: 17,

      textAlign: "center",

      color: colors.textSecondary,

      marginTop: 5,

      maxWidth: 260,
    },

    emptyButton: {
      marginTop: 14,

      paddingHorizontal: 16,

      height: 38,

      borderRadius: 9,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    emptyButtonText: {
      color: colors.primaryBlue,

      fontSize: 11,
      fontWeight: "800",
    },

    // =======================================================
    // FORM HEADER
    // =======================================================

    formHeader: {
      backgroundColor: colors.card,

      minHeight: 68,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 16,

      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    backButton: {
      width: 36,
      height: 36,

      borderRadius: 10,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    formHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    // =======================================================
    // FORM
    // =======================================================

    formScroll: {
      flex: 1,
    },

    formScrollContent: {
      padding: 18,
      paddingBottom: 10,
    },

    inputContainer: {
      marginBottom: 15,
    },

    inputLabel: {
      fontSize: 11,
      fontWeight: "700",

      color: colors.textPrimary,

      marginBottom: 7,
    },

    inputWrapper: {
      minHeight: 46,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 11,

      backgroundColor: colors.bg,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 12,
    },

    inputDisabled: {
      opacity: 0.6,
    },

    input: {
      flex: 1,

      minHeight: 44,

      marginLeft: 10,

      color: colors.textPrimary,

      fontSize: 12,
    },

    // =======================================================
    // ROLE OPTIONS
    // =======================================================

    roleOptions: {
      gap: 8,
    },

    roleOption: {
      minHeight: 60,

      paddingHorizontal: 12,

      borderRadius: 11,

      borderWidth: 1,
      borderColor: colors.border,

      backgroundColor: colors.bg,

      flexDirection: "row",
      alignItems: "center",
    },

    roleOptionSelected: {
      borderColor: colors.primaryBlue,

      backgroundColor: colors.statBlueBg,
    },

    radio: {
      width: 20,
      height: 20,

      borderRadius: 10,

      borderWidth: 2,
      borderColor: colors.textMuted,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 10,
    },

    radioSelected: {
      borderColor: colors.primaryBlue,
    },

    radioInner: {
      width: 10,
      height: 10,

      borderRadius: 5,

      backgroundColor: colors.primaryBlue,
    },

    roleContent: {
      flex: 1,
    },

    roleTitle: {
      fontSize: 12,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    roleTitleSelected: {
      color: colors.primaryBlue,
    },

    roleSubtitle: {
      marginTop: 2,

      fontSize: 9,

      color: colors.textSecondary,
    },

    formBottomSpace: {
      height: 12,
    },

    // =======================================================
    // MODAL FOOTER
    // =======================================================

    modalFooter: {
      backgroundColor: colors.card,

      paddingHorizontal: 16,
      paddingTop: 10,

      paddingBottom: Platform.OS === "ios" ? 24 : 14,

      borderTopWidth: 1,
      borderTopColor: colors.border,

      flexDirection: "row",
      alignItems: "center",

      gap: 9,
    },

    cancelButton: {
      flex: 1,

      height: 46,

      borderRadius: 10,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    cancelButtonText: {
      fontSize: 12,
      fontWeight: "800",

      color: colors.textSecondary,
    },

    saveButton: {
      flex: 1,

      height: 46,

      borderRadius: 10,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",

      gap: 7,
    },

    saveButtonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      fontSize: 12,
      fontWeight: "800",

      color: "#FFFFFF",
    },
  });
}
