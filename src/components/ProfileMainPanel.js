import React, { useMemo, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";
import { useTheme } from "../context/ThemeContext";

export default function ProfileMainPanel({
  profile,
  employees,
  employeesLoading,

  isAdmin,
  canManageEmployees,

  onSaveAdminProfile,
  onSaveLibraryProfile,

  onAddEmployee,
  onEditEmployee,
  onToggleEmployeeStatus,
  onDeleteEmployee,
  onRefreshEmployees,
}) {
  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const { width } = useWindowDimensions();

  // Desktop >= 768
  // Mobile < 768
  const isMobile = width < 768;

  const [selectedSection, setSelectedSection] = useState(
    isAdmin ? "admin" : "library"
  );

  const [editingAdmin, setEditingAdmin] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState(false);

  const [adminName, setAdminName] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [libraryName, setLibraryName] = useState("");
  const [totalSeats, setTotalSeats] = useState("");

  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingLibrary, setSavingLibrary] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeFormVisible, setEmployeeFormVisible] = useState(false);

  const [employeeName, setEmployeeName] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [employeeUsername, setEmployeeUsername] = useState("");
  const [employeePassword, setEmployeePassword] = useState("");
  const [employeeRole, setEmployeeRole] = useState("RECEPTIONIST");

  const [savingEmployee, setSavingEmployee] = useState(false);

  // =========================================================
  // SECTION SELECTION
  // =========================================================

  const selectSection = (section) => {
    setSelectedSection(section);

    setEditingAdmin(false);
    setEditingLibrary(false);
    setEditingEmployee(null);
    setEmployeeFormVisible(false);
  };

  // =========================================================
  // ADMIN EDIT
  // =========================================================

  const startAdminEdit = () => {
    setAdminName(profile?.adminName || "");
    setAdminPhone(profile?.adminPhone || "");

    setEditingAdmin(true);
  };

  const cancelAdminEdit = () => {
    setEditingAdmin(false);
  };

  const saveAdmin = async () => {
    const name = adminName.trim();

    if (!name) {
      Alert.alert("Validation", "Admin name is required.");
      return;
    }

    try {
      setSavingAdmin(true);

      console.log("💾 Saving admin:", {
        name,
      });

      const success = await onSaveAdminProfile({
        name,
      });

      console.log("✅ Admin save result:", success);

      if (success !== false) {
        setEditingAdmin(false);
      }
    } catch (error) {
      console.error("❌ Admin save failed:", error);

      Alert.alert(
        "Update Failed",
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Unable to update admin profile."
      );
    } finally {
      setSavingAdmin(false);
    }
  };

  // =========================================================
  // LIBRARY EDIT
  // =========================================================

  const startLibraryEdit = () => {
    setLibraryName(profile?.libraryName || "");

    setTotalSeats(
      profile?.totalSeats != null ? String(profile.totalSeats) : ""
    );

    setEditingLibrary(true);
  };

  const cancelLibraryEdit = () => {
    setEditingLibrary(false);
  };

  const saveLibrary = async () => {
    const name = libraryName.trim();
    const seats = Number(totalSeats);

    if (!name) {
      Alert.alert("Validation", "Library name is required.");
      return;
    }

    if (!Number.isInteger(seats) || seats <= 0) {
      Alert.alert(
        "Validation",
        "Total seats must be a valid number greater than 0."
      );
      return;
    }

    try {
      setSavingLibrary(true);

      const success = await onSaveLibraryProfile({
        libraryName: name,
        totalSeats: seats,
      });

      if (success !== false) {
        setEditingLibrary(false);
      }
    } finally {
      setSavingLibrary(false);
    }
  };

  // =========================================================
  // EMPLOYEE
  // =========================================================

  const startAddEmployee = () => {
    setEditingEmployee(null);

    setEmployeeName("");
    setEmployeePhone("");
    setEmployeeUsername("");
    setEmployeePassword("");
    setEmployeeRole("RECEPTIONIST");

    setEmployeeFormVisible(true);
  };

  const startEditEmployee = (employee) => {
    setEditingEmployee(employee);

    setEmployeeName(employee?.name || "");
    setEmployeePhone(employee?.phone || "");
    setEmployeeUsername(employee?.username || "");
    setEmployeePassword("");
    setEmployeeRole(employee?.role || "RECEPTIONIST");

    setEmployeeFormVisible(true);
  };

  const cancelEmployeeEdit = () => {
    setEditingEmployee(null);
    setEmployeeFormVisible(false);
  };

  const saveEmployee = async () => {
    console.log("🟢 Employee save started");

    const name = employeeName.trim();
    const phone = employeePhone.trim();
    const username = employeeUsername.trim();
    const password = employeePassword.trim();

    console.log("📝 Employee form:", {
      name,
      phone,
      username,
      role: employeeRole,
      passwordEntered: !!password,
      passwordLength: password.length,
      isEdit: !!editingEmployee,
    });

    // =========================
    // VALIDATION
    // =========================

    if (!name) {
      console.log("❌ Validation failed: name");
      Alert.alert("Validation", "Employee name is required.");
      return;
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      console.log(
        "❌ Validation failed: phone",
        phone,
        "length:",
        phone.length
      );

      Alert.alert("Validation", "Please enter a valid 10 digit phone number.");
      return;
    }

    if (!username) {
      console.log("❌ Validation failed: username");

      Alert.alert("Validation", "Username is required.");
      return;
    }

    if (!editingEmployee && !password) {
      console.log("❌ Validation failed: password");

      Alert.alert("Validation", "Password is required.");
      return;
    }

    if (password && password.length < 6) {
      console.log("❌ Validation failed: password length");

      Alert.alert("Validation", "Password must contain at least 6 characters.");
      return;
    }

    if (!employeeRole) {
      console.log("❌ Validation failed: role");

      Alert.alert("Validation", "Please select an employee role.");
      return;
    }

    // =========================
    // BUILD PAYLOAD
    // =========================

    const form = {
      name,
      phone,
      username: username.toLowerCase(),
      password,
      role: employeeRole,
    };

    console.log("📤 Employee payload:", {
      ...form,
      password: "********",
    });

    try {
      setSavingEmployee(true);

      console.log("🚀 Calling parent onEditEmployee...");

      const success = await onEditEmployee(editingEmployee, form);

      console.log("📥 Employee save result:", success);

      if (success !== false) {
        console.log("✅ Employee save successful");

        setEditingEmployee(null);

        setEmployeeFormVisible(false);

        setEmployeeName("");
        setEmployeePhone("");
        setEmployeeUsername("");
        setEmployeePassword("");
        setEmployeeRole("RECEPTIONIST");
      }
    } catch (error) {
      console.error("❌ Employee save error:", error);
    } finally {
      setSavingEmployee(false);
    }
  };

  // =========================================================
  // RIGHT PANEL
  // =========================================================

  const renderRightPanel = () => {
    if (selectedSection === "admin") {
      return (
        <AdminPanel
          profile={profile}
          colors={colors}
          styles={styles}
          editing={editingAdmin}
          adminName={adminName}
          adminPhone={adminPhone}
          saving={savingAdmin}
          onEdit={startAdminEdit}
          onCancel={cancelAdminEdit}
          onSave={saveAdmin}
          setAdminName={setAdminName}
          setAdminPhone={setAdminPhone}
          isAdmin={isAdmin}
          isMobile={isMobile}
        />
      );
    }

    if (selectedSection === "library") {
      return (
        <LibraryPanel
          profile={profile}
          colors={colors}
          styles={styles}
          editing={editingLibrary}
          libraryName={libraryName}
          totalSeats={totalSeats}
          saving={savingLibrary}
          onEdit={startLibraryEdit}
          onCancel={cancelLibraryEdit}
          onSave={saveLibrary}
          setLibraryName={setLibraryName}
          setTotalSeats={setTotalSeats}
          isAdmin={isAdmin}
          isMobile={isMobile}
        />
      );
    }

    if (selectedSection === "employees") {
      return (
        <EmployeePanel
          employees={employees}
          loading={employeesLoading}
          colors={colors}
          styles={styles}
          editingEmployee={editingEmployee}
          employeeName={employeeName}
          employeePhone={employeePhone}
          employeeUsername={employeeUsername}
          employeePassword={employeePassword}
          employeeRole={employeeRole}
          saving={savingEmployee}
          onAdd={startAddEmployee}
          onEdit={startEditEmployee}
          onCancel={cancelEmployeeEdit}
          onSave={saveEmployee}
          onToggleStatus={onToggleEmployeeStatus}
          onDelete={onDeleteEmployee}
          onRefresh={onRefreshEmployees}
          employeeFormVisible={employeeFormVisible}
          setEmployeeName={setEmployeeName}
          setEmployeePhone={setEmployeePhone}
          setEmployeeUsername={setEmployeeUsername}
          setEmployeePassword={setEmployeePassword}
          setEmployeeRole={setEmployeeRole}
          isAdmin={isAdmin}
          isMobile={isMobile}
        />
      );
    }

    return null;
  };

  // =========================================================
  // MOBILE
  // =========================================================

  if (isMobile) {
    return (
      <KeyboardAvoidingView
        style={styles.mobileWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.mobileContent}
        >
          {/* MOBILE PAGE HEADER */}
          <View style={styles.mobileIntro}>
            <Text style={styles.mobileTitle}>Profile Settings</Text>

            <Text style={styles.mobileSubtitle}>Manage your library</Text>
          </View>

          {/* MOBILE SECTION SELECTOR */}
          <View style={styles.mobileSelector}>
            {isAdmin && (
              <SectionButton
                icon="user"
                title="Admin Information"
                subtitle="Personal information"
                selected={selectedSection === "admin"}
                colors={colors}
                styles={styles}
                onPress={() => selectSection("admin")}
                isMobile
              />
            )}

            <SectionButton
              icon="building"
              title="Library Information"
              subtitle="Library details"
              selected={selectedSection === "library"}
              colors={colors}
              styles={styles}
              onPress={() => selectSection("library")}
              isMobile
            />

            {isAdmin && canManageEmployees && (
              <SectionButton
                icon="users"
                title="Employee Management"
                subtitle={`${employees.length} employees`}
                selected={selectedSection === "employees"}
                colors={colors}
                styles={styles}
                onPress={() => selectSection("employees")}
                isMobile
              />
            )}
          </View>

          {/* MOBILE SELECTED CONTENT */}
          <View style={styles.mobilePanel}>{renderRightPanel()}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================
  // DESKTOP
  // =========================================================

  return (
    <View style={styles.wrapper}>
      <View style={styles.masterDetail}>
        {/* LEFT */}
        <View style={styles.leftPanel}>
          <Text style={styles.leftPanelTitle}>Profile Settings</Text>

          <Text style={styles.leftPanelSubtitle}>Manage your library</Text>

          <View style={styles.menuContainer}>
            {isAdmin && (
              <SectionButton
                icon="user"
                title="Admin Information"
                subtitle="Personal information"
                selected={selectedSection === "admin"}
                colors={colors}
                styles={styles}
                onPress={() => selectSection("admin")}
              />
            )}

            <SectionButton
              icon="building"
              title="Library Information"
              subtitle="Library details"
              selected={selectedSection === "library"}
              colors={colors}
              styles={styles}
              onPress={() => selectSection("library")}
            />

            {isAdmin && canManageEmployees && (
              <SectionButton
                icon="users"
                title="Employee Management"
                subtitle={`${employees.length} employees`}
                selected={selectedSection === "employees"}
                colors={colors}
                styles={styles}
                onPress={() => selectSection("employees")}
              />
            )}
          </View>
        </View>

        {/* RIGHT */}
        <View style={styles.rightPanel}>{renderRightPanel()}</View>
      </View>
    </View>
  );
}

// =========================================================
// SECTION BUTTON
// =========================================================

function SectionButton({
  icon,
  title,
  subtitle,
  selected,
  colors,
  styles,
  onPress,
  isMobile = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.sectionButton,
        isMobile && styles.mobileSectionButton,
        selected && styles.sectionButtonSelected,
      ]}
    >
      <View
        style={[
          styles.sectionButtonIcon,
          selected && styles.sectionButtonIconSelected,
        ]}
      >
        <FontAwesome6
          name={icon}
          size={15}
          color={selected ? colors.primaryBlue : colors.textSecondary}
        />
      </View>

      <View style={styles.sectionButtonText}>
        <Text
          style={[
            styles.sectionButtonTitle,
            selected && styles.sectionButtonTitleSelected,
          ]}
        >
          {title}
        </Text>

        <Text style={styles.sectionButtonSubtitle}>{subtitle}</Text>
      </View>

      {selected && (
        <FontAwesome6
          name="chevron-right"
          size={11}
          color={colors.primaryBlue}
        />
      )}
    </TouchableOpacity>
  );
}

// =========================================================
// ADMIN PANEL
// =========================================================

function AdminPanel({
  profile,
  colors,
  styles,
  editing,
  adminName,
  adminPhone,
  saving,
  onEdit,
  onCancel,
  onSave,
  setAdminName,
  setAdminPhone,
  isAdmin,
  isMobile,
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.panelScrollContent,
        isMobile && styles.mobilePanelContent,
      ]}
    >
      <PanelHeader
        icon="user"
        title="Admin Information"
        subtitle="Manage administrator account information"
        styles={styles}
        colors={colors}
        editing={editing}
        onEdit={onEdit}
        isAdmin={isAdmin}
        isMobile={isMobile}
      />

      {editing ? (
        <View
          style={[styles.editContainer, isMobile && styles.mobileEditContainer]}
        >
          <FormField
            label="Admin Name"
            value={adminName}
            onChangeText={setAdminName}
            placeholder="Enter admin name"
            icon="user"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <FormField
            label="Phone Number"
            value={adminPhone}
            placeholder="Phone number"
            icon="phone"
            styles={styles}
            colors={colors}
            editable={false}
            isMobile={isMobile}
          />

          <Text
            style={[
              styles.formFieldHint,
              {
                marginTop: -8,
                marginBottom: 18,
              },
            ]}
          >
            Phone number cannot be changed.
          </Text>

          <ActionButtons
            saving={saving}
            onCancel={onCancel}
            onSave={onSave}
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />
        </View>
      ) : (
        <View
          style={[
            styles.detailsContainer,
            isMobile && styles.mobileDetailsContainer,
          ]}
        >
          <DetailRow
            icon="user"
            label="Name"
            value={profile?.adminName}
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <DetailRow
            icon="phone"
            label="Phone Number"
            value={profile?.adminPhone}
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <DetailRow
            icon="shield-halved"
            label="Account Type"
            value="Administrator"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />
        </View>
      )}
    </ScrollView>
  );
}
// =========================================================
// LIBRARY PANEL
// =========================================================

function LibraryPanel({
  profile,
  colors,
  styles,
  editing,
  libraryName,
  totalSeats,
  saving,
  onEdit,
  onCancel,
  onSave,
  setLibraryName,
  setTotalSeats,
  isAdmin,
  isMobile,
}) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.panelScrollContent,
        isMobile && styles.mobilePanelContent,
      ]}
    >
      <PanelHeader
        icon="building"
        title="Library Information"
        subtitle="Manage your library details"
        styles={styles}
        colors={colors}
        editing={editing}
        onEdit={onEdit}
        isAdmin={isAdmin}
        isMobile={isMobile}
      />

      {editing ? (
        <View
          style={[styles.editContainer, isMobile && styles.mobileEditContainer]}
        >
          <FormField
            label="Library Name"
            value={libraryName}
            onChangeText={setLibraryName}
            placeholder="Enter library name"
            icon="building"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <FormField
            label="Total Seats"
            value={totalSeats}
            onChangeText={setTotalSeats}
            placeholder="Enter total seats"
            keyboardType="number-pad"
            icon="chair"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <View
            style={[styles.infoNotice, isMobile && styles.mobileInfoNotice]}
          >
            <FontAwesome6
              name="circle-info"
              size={14}
              color={colors.primaryBlue}
            />

            <Text style={styles.infoNoticeText}>
              Changing total seats may affect your existing seat configuration.
            </Text>
          </View>

          <ActionButtons
            saving={saving}
            onCancel={onCancel}
            onSave={onSave}
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />
        </View>
      ) : (
        <View
          style={[
            styles.detailsContainer,
            isMobile && styles.mobileDetailsContainer,
          ]}
        >
          <DetailRow
            icon="building"
            label="Library Name"
            value={profile?.libraryName}
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <DetailRow
            icon="chair"
            label="Total Seats"
            value={
              profile?.totalSeats != null ? String(profile.totalSeats) : "-"
            }
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />
        </View>
      )}
    </ScrollView>
  );
}

// =========================================================
// EMPLOYEE PANEL
// =========================================================

function EmployeePanel({
  employees,
  loading,
  colors,
  styles,
  editingEmployee,

  employeeName,
  employeePhone,
  employeeUsername,
  employeePassword,
  employeeRole,

  saving,

  onAdd,
  onEdit,
  onCancel,
  onSave,
  onToggleStatus,
  onDelete,
  onRefresh,

  employeeFormVisible,

  setEmployeeName,
  setEmployeePhone,
  setEmployeeUsername,
  setEmployeePassword,
  setEmployeeRole,

  isAdmin,
  isMobile,
}) {
  const showForm = employeeFormVisible;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.panelScrollContent,
        isMobile && styles.mobilePanelContent,
      ]}
    >
      {/* =====================================================
            HEADER
        ====================================================== */}

      <View
        style={[styles.panelHeaderRow, isMobile && styles.mobilePanelHeaderRow]}
      >
        <View
          style={[
            styles.panelHeaderLeft,
            isMobile && styles.mobilePanelHeaderLeft,
          ]}
        >
          <View
            style={[
              styles.panelHeaderIcon,
              isMobile && styles.mobilePanelHeaderIcon,
            ]}
          >
            <FontAwesome6 name="users" size={17} color={colors.primaryBlue} />
          </View>

          <View style={styles.panelHeaderTextWrap}>
            <Text
              style={[styles.panelTitle, isMobile && styles.mobilePanelTitle]}
            >
              Employee Management
            </Text>

            <Text
              style={[
                styles.panelSubtitle,
                isMobile && styles.mobilePanelSubtitle,
              ]}
            >
              Manage staff access to your library
            </Text>
          </View>
        </View>

        {!showForm && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              isMobile && styles.mobilePrimaryButton,
            ]}
            onPress={onAdd}
            activeOpacity={0.85}
          >
            <FontAwesome6 name="plus" size={13} color="#fff" />

            <Text style={styles.primaryButtonText}>Add Employee</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* =====================================================
            EMPLOYEE FORM
        ====================================================== */}

      {showForm ? (
        <View
          style={[styles.editContainer, isMobile && styles.mobileEditContainer]}
        >
          <View
            style={[styles.formTopRow, isMobile && styles.mobileFormTopRow]}
          >
            <Text
              style={[styles.formTitle, isMobile && styles.mobileFormTitle]}
            >
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </Text>

            <TouchableOpacity onPress={onCancel} style={styles.backButton}>
              <FontAwesome6
                name="arrow-left"
                size={13}
                color={colors.textSecondary}
              />

              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          <FormField
            label="Employee Name"
            value={employeeName}
            onChangeText={setEmployeeName}
            placeholder="Enter employee name"
            icon="user"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <FormField
            label="Phone Number"
            value={employeePhone}
            onChangeText={(value) =>
              setEmployeePhone(value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="Enter 10 digit phone number"
            keyboardType="phone-pad"
            maxLength={10}
            icon="phone"
            styles={styles}
            colors={colors}
            editable={!saving}
            isMobile={isMobile}
          />
          <FormField
            label="Username"
            value={employeeUsername}
            onChangeText={setEmployeeUsername}
            placeholder="Enter username"
            icon="at"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <FormField
            label={editingEmployee ? "New Password" : "Password"}
            value={employeePassword}
            onChangeText={setEmployeePassword}
            placeholder={
              editingEmployee
                ? "Leave blank to keep current password"
                : "Enter password"
            }
            icon="lock"
            styles={styles}
            colors={colors}
            isMobile={isMobile}
          />

          <Text
            style={[styles.fieldLabel, isMobile && styles.mobileFieldLabel]}
          >
            Role
          </Text>

          <View style={[styles.roleRow, isMobile && styles.mobileRoleRow]}>
            {[
              {
                value: "MANAGER",
                label: "Manager",
              },
              {
                value: "RECEPTIONIST",
                label: "Receptionist",
              },
              {
                value: "ACCOUNTANT",
                label: "Accountant",
              },
            ].map((role) => {
              const selected = employeeRole === role.value;

              return (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setEmployeeRole(role.value)}
                  style={[
                    styles.roleButton,
                    isMobile && styles.mobileRoleButton,
                    selected && styles.roleButtonSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      isMobile && styles.mobileRoleButtonText,
                      selected && styles.roleButtonTextSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ActionButtons
            saving={saving}
            onCancel={onCancel}
            onSave={onSave}
            styles={styles}
            colors={colors}
            saveText={editingEmployee ? "Update Employee" : "Create Employee"}
            isMobile={isMobile}
          />
        </View>
      ) : (
        <>
          {/* =====================================================
                LOADING
            ====================================================== */}

          {loading ? (
            <View
              style={[
                styles.employeeLoading,
                isMobile && styles.mobileEmployeeLoading,
              ]}
            >
              <ActivityIndicator size="large" color={colors.primaryBlue} />

              <Text style={styles.loadingText}>Loading employees...</Text>
            </View>
          ) : employees.length === 0 ? (
            <EmptyEmployees
              styles={styles}
              colors={colors}
              onAdd={onAdd}
              isMobile={isMobile}
            />
          ) : (
            <View
              style={[
                styles.employeeList,
                isMobile && styles.mobileEmployeeList,
              ]}
            >
              {employees.map((employee) => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  styles={styles}
                  colors={colors}
                  onEdit={() => onEdit(employee)}
                  onToggleStatus={() => onToggleStatus(employee)}
                  onDelete={() => onDelete(employee)}
                  isMobile={isMobile}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

// =========================================================
// PANEL HEADER
// =========================================================

function PanelHeader({
  icon,
  title,
  subtitle,
  styles,
  colors,
  editing,
  onEdit,
  isAdmin,
  isMobile,
}) {
  return (
    <View
      style={[styles.panelHeaderRow, isMobile && styles.mobilePanelHeaderRow]}
    >
      <View
        style={[
          styles.panelHeaderLeft,
          isMobile && styles.mobilePanelHeaderLeft,
        ]}
      >
        <View
          style={[
            styles.panelHeaderIcon,
            isMobile && styles.mobilePanelHeaderIcon,
          ]}
        >
          <FontAwesome6 name={icon} size={17} color={colors.primaryBlue} />
        </View>

        <View style={styles.panelHeaderTextWrap}>
          <Text
            style={[styles.panelTitle, isMobile && styles.mobilePanelTitle]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.panelSubtitle,
              isMobile && styles.mobilePanelSubtitle,
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {isAdmin && !editing && (
        <TouchableOpacity
          style={[styles.outlineButton, isMobile && styles.mobileOutlineButton]}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <FontAwesome6 name="pen" size={12} color={colors.primaryBlue} />

          <Text style={styles.outlineButtonText}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =========================================================
// DETAIL ROW
// =========================================================

function DetailRow({ icon, label, value, styles, colors, isMobile }) {
  return (
    <View style={[styles.detailRow, isMobile && styles.mobileDetailRow]}>
      <View style={[styles.detailIcon, isMobile && styles.mobileDetailIcon]}>
        <FontAwesome6 name={icon} size={14} color={colors.textMuted} />
      </View>

      <View style={[styles.detailText, isMobile && styles.mobileDetailText]}>
        <Text
          style={[styles.detailLabel, isMobile && styles.mobileDetailLabel]}
        >
          {label}
        </Text>

        <Text
          style={[styles.detailValue, isMobile && styles.mobileDetailValue]}
          numberOfLines={2}
        >
          {value || "-"}
        </Text>
      </View>
    </View>
  );
}

// =========================================================
// FORM FIELD
// =========================================================

// =========================================================
// FORM FIELD
// =========================================================

// =========================================================
// FORM FIELD
// =========================================================

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
  icon,
  styles,
  colors,
  editable = true,
  secureTextEntry = false,
  isMobile = false,
}) {
  return (
    <View style={[styles.formField, isMobile && styles.mobileFormField]}>
      <Text style={[styles.fieldLabel, isMobile && styles.mobileFieldLabel]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          isMobile && styles.mobileInputWrapper,
          !editable && styles.disabledInputWrapper,
        ]}
      >
        <FontAwesome6 name={icon} size={14} color={colors.textMuted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          secureTextEntry={secureTextEntry}
          style={[styles.input, isMobile && styles.mobileInput]}
        />

        {!editable && (
          <FontAwesome6 name="lock" size={12} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
}

// =========================================================
// ACTION BUTTONS
// =========================================================

function ActionButtons({
  saving,
  onCancel,
  onSave,
  styles,
  colors,
  saveText = "Save Changes",
  isMobile,
}) {
  const handleSavePress = () => {
    console.log("🖱️ SAVE BUTTON PRESSED");

    if (saving) {
      console.log("⏳ Save already in progress");
      return;
    }

    if (typeof onSave !== "function") {
      console.error("❌ onSave is not a function:", onSave);
      return;
    }

    onSave();
  };

  const handleCancelPress = () => {
    console.log("🖱️ CANCEL BUTTON PRESSED");

    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  return (
    <View
      style={[styles.actionButtons, isMobile && styles.mobileActionButtons]}
    >
      <TouchableOpacity
        style={[styles.cancelButton, isMobile && styles.mobileCancelButton]}
        onPress={handleCancelPress}
        disabled={saving}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveButton, isMobile && styles.mobileSaveButton]}
        onPress={handleSavePress}
        disabled={saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <FontAwesome6 name="check" size={13} color="#fff" />

            <Text style={styles.saveButtonText}>{saveText}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
// =========================================================
// EMPLOYEE ROW
// =========================================================

function EmployeeRow({
  employee,
  styles,
  colors,
  onEdit,
  onToggleStatus,
  onDelete,
  isMobile = false,
}) {
  const roleLabel =
    employee.role === "MANAGER"
      ? "Manager"
      : employee.role === "RECEPTIONIST"
      ? "Receptionist"
      : employee.role === "ACCOUNTANT"
      ? "Accountant"
      : employee.role || "-";

  const handleVacatePress = () => {
    console.log("================================");
    console.log("🚨 VACATE BUTTON PRESSED 🚨");
    console.log("EMPLOYEE ID:", employee?.id);
    console.log("EMPLOYEE NAME:", employee?.name);
    console.log("EMPLOYEE ACTIVE:", employee?.active);
    console.log("ON TOGGLE STATUS:", typeof onToggleStatus);
    console.log("================================");

    if (!employee?.id) {
      console.error("❌ Employee ID missing");
      return;
    }

    if (typeof onToggleStatus !== "function") {
      console.error("❌ onToggleStatus is NOT a function:", onToggleStatus);
      return;
    }

    console.log("➡️ Calling onToggleStatus...");

    onToggleStatus();
  };

  return (
    <View
      style={[
        styles.employeeRow,
        isMobile && styles.mobileEmployeeRow,
        !employee.active && styles.employeeRowInactive,
      ]}
    >
      {/* =========================
          AVATAR
      ========================= */}

      <View
        style={[styles.employeeAvatar, isMobile && styles.mobileEmployeeAvatar]}
      >
        <Text
          style={[
            styles.employeeAvatarText,
            isMobile && styles.mobileEmployeeAvatarText,
          ]}
        >
          {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
        </Text>
      </View>

      {/* =========================
          EMPLOYEE INFO
      ========================= */}

      <View
        style={[styles.employeeInfo, isMobile && styles.mobileEmployeeInfo]}
      >
        <Text
          style={[styles.employeeName, isMobile && styles.mobileEmployeeName]}
          numberOfLines={1}
        >
          {employee.name}
        </Text>

        <Text
          style={[styles.employeePhone, isMobile && styles.mobileEmployeePhone]}
          numberOfLines={1}
        >
          {employee.phone || "-"}
        </Text>

        <View
          style={[
            styles.employeeMetaRow,
            isMobile && styles.mobileEmployeeMetaRow,
          ]}
        >
          <View style={[styles.roleBadge, isMobile && styles.mobileRoleBadge]}>
            <Text
              style={[
                styles.roleBadgeText,
                isMobile && styles.mobileRoleBadgeText,
              ]}
            >
              {roleLabel}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isMobile && styles.mobileStatusBadge,
              employee.active ? styles.statusActive : styles.statusInactive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isMobile && styles.mobileStatusText,
                employee.active
                  ? styles.statusActiveText
                  : styles.statusInactiveText,
              ]}
            >
              {employee.active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      {/* =========================
          ACTIONS
      ========================= */}

      <View
        style={[
          styles.employeeActions,
          isMobile && styles.mobileEmployeeActions,
        ]}
      >
        {/* EDIT */}
        <TouchableOpacity
          style={[styles.iconButton, isMobile && styles.mobileIconButton]}
          onPress={() => {
            console.log("✏️ EMPLOYEE EDIT CLICKED", employee?.id);
            onEdit?.();
          }}
          activeOpacity={0.6}
        >
          <FontAwesome6
            name="pen"
            size={12}
            color={colors.primaryBlue}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* VACATE */}
        <TouchableOpacity
          style={[
            styles.iconButton,
            isMobile && styles.mobileIconButton,
            {
              marginLeft: 6,
              cursor: "pointer",
            },
          ]}
          onPress={() => {
            console.log("🚨🚨 VACATE CLICKED 🚨🚨");
            console.log("EMPLOYEE ID:", employee?.id);
            console.log("EMPLOYEE NAME:", employee?.name);
            console.log("EMPLOYEE ACTIVE:", employee?.active);

            if (typeof onToggleStatus !== "function") {
              console.error(
                "❌ onToggleStatus is NOT a function",
                onToggleStatus
              );
              return;
            }

            console.log("➡️ Calling onToggleStatus");
            onToggleStatus();
          }}
          onPressIn={() => {
            console.log("🔥 VACATE PRESS IN");
          }}
          activeOpacity={0.6}
        >
          <FontAwesome6
            name={employee?.active ? "user-slash" : "user-check"}
            size={12}
            color={employee?.active ? colors.warning : colors.success}
            pointerEvents="none"
          />
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity
          style={[styles.iconButton, isMobile && styles.mobileIconButton]}
          onPress={() => {
            console.log("🗑️ DELETE CLICKED", employee?.id);

            if (!onDelete) {
              console.error("❌ onDelete is missing");
              return;
            }

            onDelete();
          }}
          activeOpacity={0.6}
        >
          <FontAwesome6 name="trash" size={12} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =========================================================
// EMPTY EMPLOYEES
// =========================================================

function EmptyEmployees({ styles, colors, onAdd, isMobile }) {
  return (
    <View
      style={[styles.emptyEmployees, isMobile && styles.mobileEmptyEmployees]}
    >
      <View style={[styles.emptyIcon, isMobile && styles.mobileEmptyIcon]}>
        <FontAwesome6 name="users" size={24} color={colors.textMuted} />
      </View>

      <Text style={[styles.emptyTitle, isMobile && styles.mobileEmptyTitle]}>
        No employees yet
      </Text>

      <Text
        style={[styles.emptySubtitle, isMobile && styles.mobileEmptySubtitle]}
      >
        Add employees to give your library staff access.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, isMobile && styles.mobilePrimaryButton]}
        onPress={onAdd}
        activeOpacity={0.85}
      >
        <FontAwesome6 name="plus" size={13} color="#fff" />

        <Text style={styles.primaryButtonText}>Add Employee</Text>
      </TouchableOpacity>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

function createStyles(colors) {
  return StyleSheet.create({
    disabledInputWrapper: {
      opacity: 0.65,
    },

    disabledInput: {
      color: colors.textSecondary,
    },
    // =====================================================
    // DESKTOP WRAPPER
    // =====================================================

    wrapper: {
      flex: 1,
      width: "100%",
    },

    masterDetail: {
      flex: 1,
      flexDirection: "row",
      gap: 18,
      minHeight: 520,
    },

    // =====================================================
    // LEFT PANEL
    // =====================================================

    leftPanel: {
      width: 285,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: 18,
    },

    leftPanelTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    leftPanelSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 18,
    },

    menuContainer: {
      gap: 8,
    },

    sectionButton: {
      minHeight: 70,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "transparent",
    },

    sectionButtonSelected: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.primaryBlue,
    },

    sectionButtonIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.borderLight,
    },

    sectionButtonIconSelected: {
      backgroundColor: colors.card,
    },

    sectionButtonText: {
      flex: 1,
      marginLeft: 11,
    },

    sectionButtonTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    sectionButtonTitleSelected: {
      color: colors.primaryBlue,
    },

    sectionButtonSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textMuted,
    },

    // =====================================================
    // RIGHT PANEL
    // =====================================================

    rightPanel: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      overflow: "hidden",
    },

    panelScrollContent: {
      padding: 24,
      paddingBottom: 40,
    },

    panelHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 26,
    },

    panelHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },

    panelHeaderTextWrap: {
      flex: 1,
      minWidth: 0,
    },

    panelHeaderIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },

    panelTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    panelSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
    },

    // =====================================================
    // BUTTONS
    // =====================================================

    outlineButton: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    outlineButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primaryBlue,
    },

    primaryButton: {
      height: 38,
      paddingHorizontal: 14,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    primaryButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#fff",
    },

    // =====================================================
    // DETAILS
    // =====================================================

    detailsContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    detailRow: {
      minHeight: 76,
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    detailIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },

    detailText: {
      marginLeft: 13,
      flex: 1,
      minWidth: 0,
    },

    detailLabel: {
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: 4,
    },

    detailValue: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    // =====================================================
    // FORMS
    // =====================================================

    editContainer: {
      maxWidth: 620,
    },

    formField: {
      marginBottom: 18,
    },

    fieldLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      marginBottom: 7,
    },

    inputWrapper: {
      height: 46,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderRadius: 10,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
    },

    input: {
      flex: 1,
      marginLeft: 10,
      color: colors.textPrimary,
      fontSize: 13,
      paddingVertical: 0,
      outlineStyle: "none",
    },

    infoNotice: {
      minHeight: 48,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      paddingHorizontal: 13,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 22,
    },

    infoNoticeText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 17,
      color: colors.textSecondary,
    },

    actionButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 6,
    },

    cancelButton: {
      height: 40,
      paddingHorizontal: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    cancelButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    saveButton: {
      minWidth: 130,
      height: 40,
      paddingHorizontal: 18,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 7,
    },

    saveButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#fff",
    },

    // =====================================================
    // EMPLOYEE
    // =====================================================

    employeeLoading: {
      minHeight: 250,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 10,
      fontSize: 12,
      color: colors.textMuted,
    },

    employeeList: {
      gap: 10,
    },

    employeeRow: {
      minHeight: 86,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
    },

    employeeRowInactive: {
      opacity: 0.62,
    },

    employeeAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    employeeAvatarText: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.primaryBlue,
    },

    employeeInfo: {
      flex: 1,
      marginLeft: 12,
      minWidth: 0,
    },

    employeeName: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    employeePhone: {
      marginTop: 3,
      fontSize: 11,
      color: colors.textMuted,
    },

    employeeMetaRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 6,
      flexWrap: "wrap",
    },

    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.borderLight,
    },

    roleBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },

    statusActive: {
      backgroundColor: colors.successBg,
    },

    statusInactive: {
      backgroundColor: colors.dangerBg,
    },

    statusText: {
      fontSize: 9,
      fontWeight: "700",
    },

    statusActiveText: {
      color: colors.success,
    },

    statusInactiveText: {
      color: colors.danger,
    },

    employeeActions: {
      flexDirection: "row",
      gap: 5,
      marginLeft: 10,
    },

    iconButton: {
      width: 31,
      height: 31,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    emptyEmployees: {
      minHeight: 300,
      alignItems: "center",
      justifyContent: "center",
      padding: 30,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    emptySubtitle: {
      maxWidth: 300,
      textAlign: "center",
      marginTop: 6,
      marginBottom: 18,
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
    },

    formTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 22,
    },

    formTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },

    backButtonText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    roleRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 22,
    },

    roleButton: {
      minHeight: 38,
      paddingHorizontal: 13,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },

    roleButtonSelected: {
      borderColor: colors.primaryBlue,
      backgroundColor: colors.statBlueBg,
    },

    roleButtonText: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    roleButtonTextSelected: {
      color: colors.primaryBlue,
    },

    // =====================================================
    // MOBILE
    // =====================================================

    mobileWrapper: {
      flex: 1,
      width: "100%",
    },

    mobileContent: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 30,
    },

    mobileIntro: {
      marginBottom: 14,
    },

    mobileTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: colors.textPrimary,
    },

    mobileSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: colors.textSecondary,
    },

    mobileSelector: {
      marginBottom: 12,
    },

    mobileSectionButton: {
      width: "100%",
      minHeight: 68,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      marginBottom: 8,
    },

    mobilePanel: {
      width: "100%",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      overflow: "hidden",
    },

    mobilePanelContent: {
      padding: 16,
      paddingBottom: 30,
    },

    mobilePanelHeaderRow: {
      marginBottom: 20,
      alignItems: "center",
    },

    mobilePanelHeaderLeft: {
      width: "100%",
      flex: 1,
    },

    mobilePanelHeaderIcon: {
      width: 40,
      height: 40,
      borderRadius: 11,
      marginRight: 10,
    },

    mobilePanelHeaderText: {
      flex: 1,
      minWidth: 0,
    },

    mobilePanelTitle: {
      fontSize: 17,
      lineHeight: 22,
    },

    mobilePanelSubtitle: {
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },

    mobileOutlineButton: {
      marginTop: 10,
      alignSelf: "flex-start",
      height: 36,
    },

    mobilePrimaryButton: {
      minHeight: 38,
      alignSelf: "flex-start",
    },

    mobileDetailsContainer: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    mobileDetailRow: {
      minHeight: 70,
      paddingVertical: 10,
    },

    mobileDetailIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
    },

    mobileDetailText: {
      marginLeft: 11,
    },

    mobileDetailLabel: {
      fontSize: 11,
    },

    mobileDetailValue: {
      fontSize: 14,
      lineHeight: 20,
    },

    mobileEditContainer: {
      width: "100%",
      maxWidth: "100%",
    },

    mobileFormField: {
      marginBottom: 16,
    },

    mobileFieldLabel: {
      fontSize: 12,
      marginBottom: 7,
    },

    mobileInputWrapper: {
      height: 48,
      borderRadius: 10,
    },

    mobileInput: {
      fontSize: 14,
      minHeight: 44,
    },

    mobileInfoNotice: {
      marginBottom: 18,
    },

    mobileActionButtons: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },

    mobileCancelButton: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 12,
    },

    mobileSaveButton: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 10,
    },

    mobileFormTopRow: {
      marginBottom: 18,
    },

    mobileFormTitle: {
      fontSize: 16,
    },

    mobileRoleRow: {
      width: "100%",
      gap: 7,
      marginBottom: 18,
    },

    mobileRoleButton: {
      flexGrow: 1,
      minWidth: "30%",
      paddingHorizontal: 9,
    },

    mobileRoleButtonText: {
      fontSize: 10,
    },

    mobileEmployeeLoading: {
      minHeight: 180,
    },

    mobileEmployeeList: {
      gap: 8,
    },

    mobileEmployeeRow: {
      width: "100%",
      minHeight: 82,
      padding: 10,
      borderRadius: 11,
    },

    mobileEmployeeAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },

    mobileEmployeeAvatarText: {
      fontSize: 15,
    },

    mobileEmployeeInfo: {
      marginLeft: 9,
      marginRight: 5,
    },

    mobileEmployeeName: {
      fontSize: 13,
    },

    mobileEmployeePhone: {
      fontSize: 10,
      marginTop: 2,
    },

    mobileEmployeeMetaRow: {
      marginTop: 5,
      gap: 4,
    },

    mobileRoleBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    mobileRoleBadgeText: {
      fontSize: 8,
    },

    mobileStatusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
    },

    mobileStatusText: {
      fontSize: 8,
    },

    mobileEmployeeActions: {
      marginLeft: 4,
      gap: 4,
    },

    mobileIconButton: {
      width: 29,
      height: 29,
      borderRadius: 7,
    },

    mobileEmptyEmployees: {
      minHeight: 230,
      paddingHorizontal: 20,
      paddingVertical: 25,
    },

    mobileEmptyIcon: {
      width: 54,
      height: 54,
      borderRadius: 17,
    },

    mobileEmptyTitle: {
      fontSize: 15,
    },

    mobileEmptySubtitle: {
      maxWidth: 270,
      fontSize: 11,
      lineHeight: 17,
    },
  });
}
