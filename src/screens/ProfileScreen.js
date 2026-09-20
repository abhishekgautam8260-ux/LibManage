// import React, { useCallback, useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   Alert,
//   RefreshControl,
//   KeyboardAvoidingView,
//   Platform,
// } from "react-native";

// import { FontAwesome6 } from "@expo/vector-icons";

// import Header from "../components/Header";
// import { useAuth } from "../context/AuthContext";
// import { getProfile } from "../api/profile";

// import {
//   getEmployees,
//   createEmployee,
//   updateEmployee,
//   updateEmployeeStatus,
//   deleteEmployee,
// } from "../api/employee";

// import { colors, radius, spacing } from "../theme/colors";

// // =========================================================
// // PROFILE SCREEN
// // =========================================================

// export default function ProfileScreen() {
//   const { libraryId, signOut, isAdmin, canManageEmployees } = useAuth();

//   const [profile, setProfile] = useState(null);

//   const [employees, setEmployees] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [employeesLoading, setEmployeesLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   // =======================================================
//   // ONE EMPLOYEE MODAL
//   //
//   // "list" -> Employee list
//   // "form" -> Add/Edit employee
//   // =======================================================

//   const [employeeModalVisible, setEmployeeModalVisible] = useState(false);

//   const [employeeModalMode, setEmployeeModalMode] = useState("list");

//   const [editingEmployee, setEditingEmployee] = useState(null);

//   // =========================================================
//   // LOAD PROFILE
//   // =========================================================

//   const loadProfile = useCallback(async () => {
//     if (!libraryId) return;

//     try {
//       const data = await getProfile(libraryId);

//       setProfile(data);
//     } catch (error) {
//       console.log("❌ Profile load failed:", error);

//       Alert.alert(
//         "Unable to load profile",
//         error?.message || "Something went wrong while loading your profile."
//       );
//     }
//   }, [libraryId]);

//   // =========================================================
//   // LOAD EMPLOYEES
//   // =========================================================

//   const loadEmployees = useCallback(async () => {
//     if (!libraryId || !canManageEmployees) return;

//     try {
//       setEmployeesLoading(true);

//       const data = await getEmployees(libraryId);

//       setEmployees(Array.isArray(data) ? data : []);
//     } catch (error) {
//       console.log("❌ Employee loading failed:", error);

//       Alert.alert(
//         "Unable to load employees",
//         error?.message || "Something went wrong while loading employees."
//       );
//     } finally {
//       setEmployeesLoading(false);
//     }
//   }, [libraryId, canManageEmployees]);

//   // =========================================================
//   // INITIAL LOAD
//   // =========================================================

//   useEffect(() => {
//     const loadData = async () => {
//       if (!libraryId) {
//         setLoading(false);
//         return;
//       }

//       setLoading(true);

//       try {
//         await loadProfile();

//         if (canManageEmployees) {
//           await loadEmployees();
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [libraryId, loadProfile, loadEmployees, canManageEmployees]);

//   // =========================================================
//   // REFRESH
//   // =========================================================

//   const handleRefresh = async () => {
//     setRefreshing(true);

//     try {
//       await loadProfile();

//       if (canManageEmployees) {
//         await loadEmployees();
//       }
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   // =========================================================
//   // OPEN EMPLOYEE MANAGEMENT
//   // =========================================================

//   const openEmployeeManagement = async () => {
//     setEmployeeModalMode("list");
//     setEditingEmployee(null);
//     setEmployeeModalVisible(true);

//     await loadEmployees();
//   };

//   // =========================================================
//   // OPEN ADD EMPLOYEE
//   // =========================================================

//   const handleAddEmployee = () => {
//     setEditingEmployee(null);
//     setEmployeeModalMode("form");
//   };

//   // =========================================================
//   // OPEN EDIT EMPLOYEE
//   // =========================================================

//   const handleEditEmployee = (employee) => {
//     console.log("✏️ Editing employee:", employee);

//     setEditingEmployee(employee);
//     setEmployeeModalMode("form");
//   };

//   // =========================================================
//   // BACK TO EMPLOYEE LIST
//   // =========================================================

//   const handleBackToEmployeeList = () => {
//     setEditingEmployee(null);
//     setEmployeeModalMode("list");
//   };

//   // =========================================================
//   // CLOSE EMPLOYEE MODAL
//   // =========================================================

//   const closeEmployeeModal = () => {
//     setEmployeeModalVisible(false);
//     setEmployeeModalMode("list");
//     setEditingEmployee(null);
//   };

//   // =========================================================
//   // SAVE EMPLOYEE
//   // =========================================================

//   const handleSaveEmployee = async (form) => {
//     if (!libraryId) {
//       Alert.alert("Library unavailable", "Library information is missing.");

//       return false;
//     }

//     try {
//       if (editingEmployee) {
//         await updateEmployee(editingEmployee.id, libraryId, form);

//         await loadEmployees();

//         Alert.alert(
//           "Employee Updated",
//           "Employee details have been updated successfully."
//         );
//       } else {
//         await createEmployee(libraryId, form);

//         await loadEmployees();

//         Alert.alert(
//           "Employee Created",
//           "Employee has been created successfully."
//         );
//       }

//       // Return to employee list
//       setEditingEmployee(null);
//       setEmployeeModalMode("list");

//       return true;
//     } catch (error) {
//       console.log("❌ Employee save failed:", error);

//       Alert.alert(
//         editingEmployee ? "Update Failed" : "Creation Failed",
//         error?.message || "Unable to save employee."
//       );

//       return false;
//     }
//   };

//   // =========================================================
//   // TOGGLE EMPLOYEE STATUS
//   // =========================================================

//   const handleToggleStatus = (employee) => {
//     const nextStatus = !employee.active;

//     Alert.alert(
//       nextStatus ? "Activate Employee?" : "Deactivate Employee?",

//       nextStatus
//         ? `${employee.name} will be able to log in again.`
//         : `${employee.name} will no longer be able to log in.`,

//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },

//         {
//           text: nextStatus ? "Activate" : "Deactivate",

//           onPress: async () => {
//             try {
//               await updateEmployeeStatus(employee.id, libraryId, nextStatus);

//               await loadEmployees();
//             } catch (error) {
//               console.log("❌ Employee status update failed:", error);

//               Alert.alert(
//                 "Update Failed",
//                 error?.message || "Unable to update employee status."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   // =========================================================
//   // DELETE EMPLOYEE
//   // =========================================================

//   const handleDeleteEmployee = (employee) => {
//     Alert.alert(
//       "Delete Employee?",

//       `Are you sure you want to permanently delete ${employee.name}?`,

//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },

//         {
//           text: "Delete",
//           style: "destructive",

//           onPress: async () => {
//             try {
//               await deleteEmployee(employee.id, libraryId);

//               await loadEmployees();

//               Alert.alert("Deleted", "Employee deleted successfully.");
//             } catch (error) {
//               console.log("❌ Employee delete failed:", error);

//               Alert.alert(
//                 "Delete Failed",
//                 error?.message || "Unable to delete employee."
//               );
//             }
//           },
//         },
//       ]
//     );
//   };

//   // =========================================================
//   // LOGOUT
//   // =========================================================

//   const handleLogout = () => {
//     Alert.alert(
//       "Logout",
//       "Are you sure you want to logout?",

//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },

//         {
//           text: "Logout",
//           style: "destructive",
//           onPress: signOut,
//         },
//       ]
//     );
//   };

//   // =========================================================
//   // LOADING
//   // =========================================================

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color={colors.primaryBlue} />
//       </View>
//     );
//   }

//   // =========================================================
//   // UI
//   // =========================================================

//   return (
//     <View style={styles.container}>
//       <Header title="Profile Details" />

//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor={colors.primaryBlue}
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         {/* ================================================= */}
//         {/* ADMIN INFORMATION */}
//         {/* ================================================= */}

//         <View style={styles.card}>
//           <SectionHeader icon="user" title="Admin Information" />

//           <InfoRow icon="user" label="Name" value={profile?.adminName} />

//           <InfoRow icon="phone" label="Phone" value={profile?.adminPhone} />
//         </View>

//         {/* ================================================= */}
//         {/* LIBRARY INFORMATION */}
//         {/* ================================================= */}

//         <View style={styles.card}>
//           <SectionHeader icon="building" title="Library Information" />

//           <InfoRow
//             icon="building"
//             label="Library Name"
//             value={profile?.libraryName}
//           />

//           <InfoRow
//             icon="chair"
//             label="Total Seats"
//             value={
//               profile?.totalSeats != null ? String(profile.totalSeats) : "-"
//             }
//           />
//         </View>

//         {/* ================================================= */}
//         {/* EMPLOYEE MANAGEMENT */}
//         {/* ================================================= */}

//         {isAdmin && canManageEmployees && (
//           <TouchableOpacity
//             activeOpacity={0.82}
//             style={styles.employeeManagementCard}
//             onPress={openEmployeeManagement}
//           >
//             <View style={styles.employeeManagementLeft}>
//               <View style={styles.employeeManagementIcon}>
//                 <FontAwesome6
//                   name="users"
//                   size={17}
//                   color={colors.primaryBlue}
//                 />
//               </View>

//               <View style={styles.employeeManagementText}>
//                 <Text style={styles.employeeManagementTitle}>
//                   Employee Management
//                 </Text>

//                 <Text style={styles.employeeManagementSubtitle}>
//                   Manage staff access to your library
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.employeeManagementRight}>
//               <View style={styles.employeeCount}>
//                 <Text style={styles.employeeCountText}>{employees.length}</Text>
//               </View>

//               <FontAwesome6 name="chevron-right" size={13} color="#9CA3AF" />
//             </View>
//           </TouchableOpacity>
//         )}

//         {/* ================================================= */}
//         {/* ACCOUNT */}
//         {/* ================================================= */}

//         <View style={styles.accountCard}>
//           <TouchableOpacity
//             activeOpacity={0.8}
//             style={styles.logoutButton}
//             onPress={handleLogout}
//           >
//             <View style={styles.logoutIcon}>
//               <FontAwesome6
//                 name="right-from-bracket"
//                 size={16}
//                 color="#DC2626"
//               />
//             </View>

//             <Text style={styles.logoutText}>Logout</Text>

//             <FontAwesome6 name="chevron-right" size={13} color="#9CA3AF" />
//           </TouchableOpacity>
//         </View>

//         <View style={{ height: 30 }} />
//       </ScrollView>

//       {/* ================================================= */}
//       {/* SINGLE EMPLOYEE MODAL */}
//       {/* ================================================= */}

//       <EmployeeManagementModal
//         visible={employeeModalVisible}
//         mode={employeeModalMode}
//         employees={employees}
//         loading={employeesLoading}
//         employee={editingEmployee}
//         onClose={closeEmployeeModal}
//         onBack={handleBackToEmployeeList}
//         onAdd={handleAddEmployee}
//         onEdit={handleEditEmployee}
//         onToggleStatus={handleToggleStatus}
//         onDelete={handleDeleteEmployee}
//         onSave={handleSaveEmployee}
//       />
//     </View>
//   );
// }

// // =========================================================
// // SECTION HEADER
// // =========================================================

// function SectionHeader({ icon, title }) {
//   return (
//     <View style={styles.sectionHeader}>
//       <View style={styles.sectionIcon}>
//         <FontAwesome6 name={icon} size={15} color={colors.primaryBlue} />
//       </View>

//       <Text style={styles.cardTitle}>{title}</Text>
//     </View>
//   );
// }

// // =========================================================
// // INFO ROW
// // =========================================================

// function InfoRow({ icon, label, value }) {
//   return (
//     <View style={styles.infoRow}>
//       <FontAwesome6
//         name={icon}
//         size={13}
//         color="#9CA3AF"
//         style={styles.infoIcon}
//       />

//       <Text style={styles.infoLabel}>{label}</Text>

//       <Text style={styles.infoValue}>{value ?? "-"}</Text>
//     </View>
//   );
// }

// // =========================================================
// // SINGLE EMPLOYEE MANAGEMENT MODAL
// // =========================================================

// function EmployeeManagementModal({
//   visible,
//   mode,
//   employees,
//   loading,
//   employee,
//   onClose,
//   onBack,
//   onAdd,
//   onEdit,
//   onToggleStatus,
//   onDelete,
//   onSave,
// }) {
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       onRequestClose={mode === "form" ? onBack : onClose}
//     >
//       <KeyboardAvoidingView
//         style={styles.modalOverlay}
//         behavior={Platform.OS === "ios" ? "padding" : undefined}
//       >
//         <View
//           style={[
//             styles.managementModalContainer,
//             mode === "form" && styles.formModalContainer,
//           ]}
//         >
//           {mode === "list" ? (
//             <EmployeeListView
//               employees={employees}
//               loading={loading}
//               onClose={onClose}
//               onAdd={onAdd}
//               onEdit={onEdit}
//               onToggleStatus={onToggleStatus}
//               onDelete={onDelete}
//             />
//           ) : (
//             <EmployeeFormView
//               employee={employee}
//               onBack={onBack}
//               onClose={onClose}
//               onSave={onSave}
//             />
//           )}
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// }

// // =========================================================
// // EMPLOYEE LIST VIEW
// // =========================================================

// function EmployeeListView({
//   employees,
//   loading,
//   onClose,
//   onAdd,
//   onEdit,
//   onToggleStatus,
//   onDelete,
// }) {
//   return (
//     <View style={styles.listView}>
//       {/* HEADER */}

//       <View style={styles.managementHeader}>
//         <View style={styles.managementHeaderLeft}>
//           <View style={styles.managementHeaderIcon}>
//             <FontAwesome6 name="users" size={17} color={colors.primaryBlue} />
//           </View>

//           <View>
//             <Text style={styles.modalTitle}>Employee Management</Text>

//             <Text style={styles.modalSubtitle}>
//               {employees.length}{" "}
//               {employees.length === 1 ? "employee" : "employees"} in your
//               library
//             </Text>
//           </View>
//         </View>

//         <TouchableOpacity style={styles.closeButton} onPress={onClose}>
//           <FontAwesome6 name="xmark" size={18} color="#6B7280" />
//         </TouchableOpacity>
//       </View>

//       {/* CONTENT */}

//       {loading ? (
//         <View style={styles.managementLoading}>
//           <ActivityIndicator size="large" color={colors.primaryBlue} />

//           <Text style={styles.loadingText}>Loading employees...</Text>
//         </View>
//       ) : (
//         <ScrollView
//           style={styles.managementScroll}
//           contentContainerStyle={styles.managementScrollContent}
//           showsVerticalScrollIndicator={false}
//           keyboardShouldPersistTaps="handled"
//         >
//           {employees.length === 0 ? (
//             <EmptyEmployees onAdd={onAdd} />
//           ) : (
//             employees.map((employee) => (
//               <EmployeeCard
//                 key={employee.id}
//                 employee={employee}
//                 onEdit={() => onEdit(employee)}
//                 onToggleStatus={() => onToggleStatus(employee)}
//                 onDelete={() => onDelete(employee)}
//               />
//             ))
//           )}
//         </ScrollView>
//       )}

//       {/* FOOTER */}

//       <View style={styles.managementFooter}>
//         <TouchableOpacity
//           activeOpacity={0.85}
//           style={styles.addEmployeeButton}
//           onPress={onAdd}
//         >
//           <FontAwesome6 name="plus" size={14} color="#fff" />

//           <Text style={styles.addEmployeeText}>Add Employee</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// // =========================================================
// // EMPLOYEE CARD
// // =========================================================

// function EmployeeCard({ employee, onEdit, onToggleStatus, onDelete }) {
//   const roleLabel =
//     employee.role === "MANAGER"
//       ? "Manager"
//       : employee.role === "RECEPTIONIST"
//       ? "Receptionist"
//       : employee.role === "ACCOUNTANT"
//       ? "Accountant"
//       : employee.role;

//   return (
//     <View
//       style={[
//         styles.employeeCard,
//         !employee.active && styles.employeeCardInactive,
//       ]}
//     >
//       {/* TOP */}

//       <View style={styles.employeeTopRow}>
//         <View style={styles.avatar}>
//           <Text style={styles.avatarText}>
//             {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
//           </Text>
//         </View>

//         <View style={styles.employeeDetails}>
//           <Text
//             style={[
//               styles.employeeName,
//               !employee.active && styles.inactiveText,
//             ]}
//             numberOfLines={1}
//           >
//             {employee.name}
//           </Text>

//           <Text style={styles.username}>@{employee.username}</Text>

//           <View style={styles.badgeRow}>
//             <View style={styles.roleBadge}>
//               <Text style={styles.roleBadgeText}>{roleLabel}</Text>
//             </View>

//             <View
//               style={[
//                 styles.statusBadge,
//                 employee.active ? styles.statusActive : styles.statusInactive,
//               ]}
//             >
//               <View
//                 style={[
//                   styles.statusDot,
//                   employee.active
//                     ? styles.statusDotActive
//                     : styles.statusDotInactive,
//                 ]}
//               />

//               <Text
//                 style={[
//                   styles.statusText,
//                   employee.active
//                     ? styles.statusTextActive
//                     : styles.statusTextInactive,
//                 ]}
//               >
//                 {employee.active ? "Active" : "Inactive"}
//               </Text>
//             </View>
//           </View>
//         </View>
//       </View>

//       {/* PHONE */}

//       {employee.phone ? (
//         <View style={styles.employeePhoneRow}>
//           <FontAwesome6 name="phone" size={12} color="#9CA3AF" />

//           <Text style={styles.employeePhone}>{employee.phone}</Text>
//         </View>
//       ) : null}

//       {/* ACTIONS */}

//       <View style={styles.employeeActions}>
//         <TouchableOpacity
//           style={styles.secondaryAction}
//           activeOpacity={0.8}
//           onPress={onEdit}
//         >
//           <FontAwesome6 name="pen" size={12} color={colors.primaryBlue} />

//           <Text style={styles.secondaryActionText}>Edit</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.secondaryAction}
//           activeOpacity={0.8}
//           onPress={onToggleStatus}
//         >
//           <FontAwesome6
//             name={employee.active ? "user-slash" : "user-check"}
//             size={12}
//             color={employee.active ? "#D97706" : "#16A34A"}
//           />

//           <Text
//             style={[
//               styles.secondaryActionText,
//               {
//                 color: employee.active ? "#D97706" : "#16A34A",
//               },
//             ]}
//           >
//             {employee.active ? "Deactivate" : "Activate"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.deleteAction}
//           activeOpacity={0.8}
//           onPress={onDelete}
//         >
//           <FontAwesome6 name="trash" size={12} color="#DC2626" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// // =========================================================
// // EMPTY EMPLOYEE STATE
// // =========================================================

// function EmptyEmployees({ onAdd }) {
//   return (
//     <View style={styles.emptyEmployees}>
//       <View style={styles.emptyIcon}>
//         <FontAwesome6 name="user-plus" size={20} color={colors.primaryBlue} />
//       </View>

//       <Text style={styles.emptyTitle}>No employees yet</Text>

//       <Text style={styles.emptySubtitle}>
//         Add staff members to help manage your library.
//       </Text>

//       <TouchableOpacity
//         activeOpacity={0.8}
//         style={styles.emptyButton}
//         onPress={onAdd}
//       >
//         <Text style={styles.emptyButtonText}>Add First Employee</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// // =========================================================
// // EMPLOYEE FORM VIEW
// // =========================================================

// function EmployeeFormView({ employee, onBack, onClose, onSave }) {
//   const isEditing = !!employee;

//   const [name, setName] = useState("");
//   const [phone, setPhone] = useState("");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("RECEPTIONIST");

//   const [saving, setSaving] = useState(false);

//   // =======================================================
//   // INITIALIZE FORM
//   // =======================================================

//   useEffect(() => {
//     if (employee) {
//       setName(employee.name || "");
//       setPhone(employee.phone || "");
//       setUsername(employee.username || "");
//       setPassword("");

//       setRole(employee.role || "RECEPTIONIST");
//     } else {
//       setName("");
//       setPhone("");
//       setUsername("");
//       setPassword("");
//       setRole("RECEPTIONIST");
//     }
//   }, [employee]);

//   // =======================================================
//   // SUBMIT
//   // =======================================================

//   const handleSubmit = async () => {
//     if (!name.trim()) {
//       Alert.alert("Name Required", "Please enter employee name.");

//       return;
//     }

//     if (!username.trim()) {
//       Alert.alert("Username Required", "Please enter a username.");

//       return;
//     }

//     if (!isEditing && !password.trim()) {
//       Alert.alert("Password Required", "Please enter a password.");

//       return;
//     }

//     if (password.trim() && password.trim().length < 6) {
//       Alert.alert(
//         "Weak Password",
//         "Password should contain at least 6 characters."
//       );

//       return;
//     }

//     const payload = {
//       name: name.trim(),

//       phone: phone.trim() || null,

//       username: username.trim().toLowerCase(),

//       role,
//     };

//     // Password:
//     // Create -> required
//     // Edit -> optional

//     if (password.trim()) {
//       payload.password = password.trim();
//     }

//     // Keep existing active state
//     // when editing

//     if (isEditing) {
//       payload.active = employee.active;
//     }

//     try {
//       setSaving(true);

//       await onSave(payload);
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <View style={styles.formView}>
//       {/* ================================================= */}
//       {/* HEADER */}
//       {/* ================================================= */}

//       <View style={styles.formHeader}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={onBack}
//           disabled={saving}
//         >
//           <FontAwesome6
//             name="arrow-left"
//             size={16}
//             color={colors.primaryBlue}
//           />
//         </TouchableOpacity>

//         <View style={styles.formHeaderText}>
//           <Text style={styles.modalTitle}>
//             {isEditing ? "Edit Employee" : "Add Employee"}
//           </Text>

//           <Text style={styles.modalSubtitle}>
//             {isEditing
//               ? "Update employee access"
//               : "Create staff login credentials"}
//           </Text>
//         </View>

//         <TouchableOpacity
//           style={styles.closeButton}
//           onPress={onClose}
//           disabled={saving}
//         >
//           <FontAwesome6 name="xmark" size={18} color="#6B7280" />
//         </TouchableOpacity>
//       </View>

//       {/* ================================================= */}
//       {/* FORM */}
//       {/* ================================================= */}

//       <ScrollView
//         style={styles.formScroll}
//         contentContainerStyle={styles.formScrollContent}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//         <InputField
//           label="Employee Name"
//           placeholder="e.g. Rahul Sharma"
//           value={name}
//           onChangeText={setName}
//           icon="user"
//           editable={!saving}
//         />

//         <InputField
//           label="Phone"
//           placeholder="e.g. 9876543210"
//           value={phone}
//           onChangeText={setPhone}
//           icon="phone"
//           keyboardType="phone-pad"
//           editable={!saving}
//         />

//         <InputField
//           label="Username"
//           placeholder="e.g. rahul"
//           value={username}
//           onChangeText={setUsername}
//           icon="at"
//           autoCapitalize="none"
//           editable={!saving}
//         />

//         <InputField
//           label={isEditing ? "New Password" : "Password"}
//           placeholder={
//             isEditing
//               ? "Leave blank to keep current password"
//               : "Enter login password"
//           }
//           value={password}
//           onChangeText={setPassword}
//           icon="lock"
//           secureTextEntry
//           autoCapitalize="none"
//           editable={!saving}
//         />

//         {/* ================================================= */}
//         {/* ROLE */}
//         {/* ================================================= */}

//         <Text style={styles.inputLabel}>Employee Role</Text>

//         <View style={styles.roleOptions}>
//           <RoleOption
//             title="Manager"
//             subtitle="Most management access"
//             value="MANAGER"
//             selected={role === "MANAGER"}
//             onPress={() => setRole("MANAGER")}
//             disabled={saving}
//           />

//           <RoleOption
//             title="Receptionist"
//             subtitle="Students & seats"
//             value="RECEPTIONIST"
//             selected={role === "RECEPTIONIST"}
//             onPress={() => setRole("RECEPTIONIST")}
//             disabled={saving}
//           />

//           <RoleOption
//             title="Accountant"
//             subtitle="Billing & payments"
//             value="ACCOUNTANT"
//             selected={role === "ACCOUNTANT"}
//             onPress={() => setRole("ACCOUNTANT")}
//             disabled={saving}
//           />
//         </View>

//         <View style={styles.formBottomSpace} />
//       </ScrollView>

//       {/* ================================================= */}
//       {/* FOOTER */}
//       {/* ================================================= */}

//       <View style={styles.modalFooter}>
//         <TouchableOpacity
//           style={styles.cancelButton}
//           onPress={onBack}
//           disabled={saving}
//         >
//           <Text style={styles.cancelButtonText}>Back</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.saveButton, saving && styles.saveButtonDisabled]}
//           onPress={handleSubmit}
//           disabled={saving}
//         >
//           {saving ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <>
//               <FontAwesome6
//                 name={isEditing ? "check" : "plus"}
//                 size={13}
//                 color="#fff"
//               />

//               <Text style={styles.saveButtonText}>
//                 {isEditing ? "Save Changes" : "Create Employee"}
//               </Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// // =========================================================
// // INPUT FIELD
// // =========================================================

// function InputField({
//   label,
//   placeholder,
//   value,
//   onChangeText,
//   icon,
//   secureTextEntry,
//   keyboardType,
//   autoCapitalize,
//   editable = true,
// }) {
//   return (
//     <View style={styles.inputContainer}>
//       <Text style={styles.inputLabel}>{label}</Text>

//       <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
//         <FontAwesome6 name={icon} size={14} color="#9CA3AF" />

//         <TextInput
//           style={styles.input}
//           placeholder={placeholder}
//           placeholderTextColor="#9CA3AF"
//           value={value}
//           onChangeText={onChangeText}
//           secureTextEntry={secureTextEntry}
//           keyboardType={keyboardType}
//           autoCapitalize={autoCapitalize || "words"}
//           editable={editable}
//         />
//       </View>
//     </View>
//   );
// }

// // =========================================================
// // ROLE OPTION
// // =========================================================

// function RoleOption({ title, subtitle, value, selected, onPress, disabled }) {
//   return (
//     <TouchableOpacity
//       activeOpacity={0.8}
//       style={[styles.roleOption, selected && styles.roleOptionSelected]}
//       onPress={onPress}
//       disabled={disabled}
//     >
//       <View style={[styles.radio, selected && styles.radioSelected]}>
//         {selected && <View style={styles.radioInner} />}
//       </View>

//       <View style={styles.roleContent}>
//         <Text style={[styles.roleTitle, selected && styles.roleTitleSelected]}>
//           {title}
//         </Text>

//         <Text style={styles.roleSubtitle}>{subtitle}</Text>
//       </View>
//     </TouchableOpacity>
//   );
// }

// // =========================================================
// // STYLES
// // =========================================================

// const styles = StyleSheet.create({
//   // =======================================================
//   // MAIN
//   // =======================================================

//   container: {
//     flex: 1,
//     backgroundColor: colors.bg,
//   },

//   center: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: colors.bg,
//   },

//   scrollContent: {
//     padding: spacing.md,
//     paddingBottom: 40,
//   },

//   // =======================================================
//   // GENERAL CARDS
//   // =======================================================

//   card: {
//     backgroundColor: "#fff",
//     borderRadius: radius.lg,
//     padding: spacing.md,
//     marginBottom: spacing.md,

//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 12,

//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 2,
//   },

//   sectionHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },

//   sectionIcon: {
//     width: 34,
//     height: 34,
//     borderRadius: 10,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 10,
//   },

//   cardTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: colors.textPrimary,
//   },

//   infoRow: {
//     minHeight: 42,

//     flexDirection: "row",
//     alignItems: "center",

//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//   },

//   infoIcon: {
//     width: 24,
//   },

//   infoLabel: {
//     width: 105,

//     fontSize: 13,
//     color: colors.textSecondary,
//     fontWeight: "600",
//   },

//   infoValue: {
//     flex: 1,

//     fontSize: 14,
//     color: colors.textPrimary,
//     fontWeight: "600",
//   },

//   // =======================================================
//   // EMPLOYEE MANAGEMENT COMPACT CARD
//   // =======================================================

//   employeeManagementCard: {
//     backgroundColor: "#fff",

//     borderRadius: radius.lg,

//     minHeight: 76,

//     paddingHorizontal: spacing.md,

//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",

//     marginBottom: spacing.md,

//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 12,

//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 2,
//   },

//   employeeManagementLeft: {
//     flexDirection: "row",
//     alignItems: "center",

//     flex: 1,
//   },

//   employeeManagementIcon: {
//     width: 42,
//     height: 42,

//     borderRadius: 12,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 11,
//   },

//   employeeManagementText: {
//     flex: 1,
//   },

//   employeeManagementTitle: {
//     fontSize: 15,
//     fontWeight: "700",

//     color: colors.textPrimary,
//   },

//   employeeManagementSubtitle: {
//     marginTop: 3,

//     fontSize: 11,
//     color: colors.textSecondary,
//   },

//   employeeManagementRight: {
//     flexDirection: "row",
//     alignItems: "center",

//     gap: 10,
//   },

//   employeeCount: {
//     minWidth: 34,
//     height: 34,

//     borderRadius: 17,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   employeeCountText: {
//     color: colors.primaryBlue,

//     fontSize: 14,
//     fontWeight: "800",
//   },

//   // =======================================================
//   // ACCOUNT
//   // =======================================================

//   accountCard: {
//     backgroundColor: "#fff",

//     borderRadius: radius.lg,

//     overflow: "hidden",

//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 10,

//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },

//     elevation: 2,
//   },

//   logoutButton: {
//     minHeight: 58,

//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: spacing.md,
//   },

//   logoutIcon: {
//     width: 34,
//     height: 34,

//     borderRadius: 10,

//     backgroundColor: "#FEF2F2",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 10,
//   },

//   logoutText: {
//     flex: 1,

//     fontSize: 14,
//     fontWeight: "700",

//     color: "#DC2626",
//   },

//   // =======================================================
//   // MODAL
//   // =======================================================

//   modalOverlay: {
//     flex: 1,

//     backgroundColor: "rgba(0,0,0,0.45)",

//     justifyContent: "flex-end",
//   },

//   managementModalContainer: {
//     backgroundColor: "#F8FAFC",

//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,

//     height: "88%",

//     overflow: "hidden",
//   },

//   formModalContainer: {
//     backgroundColor: "#fff",

//     height: "92%",

//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,

//     overflow: "hidden",
//   },

//   listView: {
//     flex: 1,
//   },

//   formView: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },

//   // =======================================================
//   // MANAGEMENT HEADER
//   // =======================================================

//   managementHeader: {
//     backgroundColor: "#fff",

//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",

//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 15,

//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",

//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//   },

//   managementHeaderLeft: {
//     flexDirection: "row",
//     alignItems: "center",

//     flex: 1,
//   },

//   managementHeaderIcon: {
//     width: 42,
//     height: 42,

//     borderRadius: 12,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 11,
//   },

//   modalTitle: {
//     fontSize: 19,
//     fontWeight: "800",

//     color: colors.textPrimary,
//   },

//   modalSubtitle: {
//     fontSize: 12,

//     color: colors.textSecondary,

//     marginTop: 4,
//   },

//   closeButton: {
//     width: 38,
//     height: 38,

//     borderRadius: 19,

//     backgroundColor: "#F3F4F6",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   // =======================================================
//   // EMPLOYEE LIST
//   // =======================================================

//   managementScroll: {
//     flex: 1,
//   },

//   managementScrollContent: {
//     padding: 16,
//     paddingBottom: 20,
//   },

//   managementLoading: {
//     flex: 1,

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   loadingText: {
//     marginTop: 8,

//     fontSize: 12,
//     color: colors.textSecondary,
//   },

//   managementFooter: {
//     backgroundColor: "#fff",

//     paddingHorizontal: 16,
//     paddingTop: 10,

//     paddingBottom: Platform.OS === "ios" ? 24 : 14,

//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//   },

//   // =======================================================
//   // ADD EMPLOYEE BUTTON
//   // =======================================================

//   addEmployeeButton: {
//     height: 48,

//     borderRadius: 13,

//     backgroundColor: colors.primaryBlue,

//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",

//     shadowColor: colors.primaryBlue,

//     shadowOpacity: 0.2,
//     shadowRadius: 8,

//     shadowOffset: {
//       width: 0,
//       height: 4,
//     },

//     elevation: 3,
//   },

//   addEmployeeText: {
//     color: "#fff",

//     fontSize: 14,
//     fontWeight: "700",

//     marginLeft: 8,
//   },

//   // =======================================================
//   // EMPLOYEE CARD
//   // =======================================================

//   employeeCard: {
//     backgroundColor: "#fff",

//     borderRadius: radius.lg,

//     padding: spacing.md,

//     marginBottom: 10,

//     shadowColor: "#000",
//     shadowOpacity: 0.04,
//     shadowRadius: 10,

//     shadowOffset: {
//       width: 0,
//       height: 3,
//     },

//     elevation: 2,
//   },

//   employeeCardInactive: {
//     opacity: 0.72,
//   },

//   employeeTopRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//   },

//   avatar: {
//     width: 46,
//     height: 46,

//     borderRadius: 23,

//     backgroundColor: "#DBEAFE",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 11,
//   },

//   avatarText: {
//     fontSize: 18,
//     fontWeight: "800",

//     color: colors.primaryBlue,
//   },

//   employeeDetails: {
//     flex: 1,
//   },

//   employeeName: {
//     fontSize: 15,
//     fontWeight: "700",

//     color: colors.textPrimary,
//   },

//   inactiveText: {
//     color: "#6B7280",
//   },

//   username: {
//     marginTop: 2,

//     fontSize: 12,
//     color: "#9CA3AF",
//   },

//   badgeRow: {
//     flexDirection: "row",
//     alignItems: "center",

//     marginTop: 8,

//     flexWrap: "wrap",
//   },

//   roleBadge: {
//     backgroundColor: "#F3F4F6",

//     paddingHorizontal: 9,
//     paddingVertical: 5,

//     borderRadius: 7,

//     marginRight: 7,
//   },

//   roleBadgeText: {
//     fontSize: 10,
//     fontWeight: "800",

//     color: "#4B5563",

//     textTransform: "uppercase",
//   },

//   statusBadge: {
//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 8,
//     paddingVertical: 5,

//     borderRadius: 7,
//   },

//   statusActive: {
//     backgroundColor: "#ECFDF5",
//   },

//   statusInactive: {
//     backgroundColor: "#FEF2F2",
//   },

//   statusDot: {
//     width: 6,
//     height: 6,

//     borderRadius: 3,

//     marginRight: 5,
//   },

//   statusDotActive: {
//     backgroundColor: "#16A34A",
//   },

//   statusDotInactive: {
//     backgroundColor: "#DC2626",
//   },

//   statusText: {
//     fontSize: 10,
//     fontWeight: "800",
//   },

//   statusTextActive: {
//     color: "#15803D",
//   },

//   statusTextInactive: {
//     color: "#B91C1C",
//   },

//   employeePhoneRow: {
//     flexDirection: "row",
//     alignItems: "center",

//     marginTop: 12,
//     paddingTop: 10,

//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//   },

//   employeePhone: {
//     marginLeft: 8,

//     fontSize: 12,
//     color: colors.textSecondary,
//   },

//   employeeActions: {
//     flexDirection: "row",
//     alignItems: "center",

//     marginTop: 12,
//     paddingTop: 10,

//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",
//   },

//   secondaryAction: {
//     height: 36,

//     paddingHorizontal: 11,

//     borderRadius: 9,

//     backgroundColor: "#F8FAFC",

//     flexDirection: "row",
//     alignItems: "center",

//     marginRight: 7,
//   },

//   secondaryActionText: {
//     marginLeft: 6,

//     fontSize: 11,
//     fontWeight: "700",

//     color: colors.primaryBlue,
//   },

//   deleteAction: {
//     marginLeft: "auto",

//     width: 36,
//     height: 36,

//     borderRadius: 9,

//     backgroundColor: "#FEF2F2",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   // =======================================================
//   // EMPTY STATE
//   // =======================================================

//   emptyEmployees: {
//     backgroundColor: "#fff",

//     borderRadius: radius.lg,

//     padding: 24,

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   emptyIcon: {
//     width: 50,
//     height: 50,

//     borderRadius: 25,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",

//     marginBottom: 10,
//   },

//   emptyTitle: {
//     fontSize: 15,
//     fontWeight: "700",

//     color: colors.textPrimary,
//   },

//   emptySubtitle: {
//     fontSize: 12,
//     lineHeight: 18,

//     textAlign: "center",

//     color: colors.textSecondary,

//     marginTop: 5,

//     maxWidth: 260,
//   },

//   emptyButton: {
//     marginTop: 14,

//     paddingHorizontal: 16,

//     height: 38,

//     borderRadius: 10,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   emptyButtonText: {
//     color: colors.primaryBlue,

//     fontSize: 12,
//     fontWeight: "700",
//   },

//   // =======================================================
//   // FORM HEADER
//   // =======================================================

//   formHeader: {
//     backgroundColor: "#fff",

//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 16,
//     paddingTop: 18,
//     paddingBottom: 14,

//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },

//   backButton: {
//     width: 38,
//     height: 38,

//     borderRadius: 19,

//     backgroundColor: "#EFF6FF",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 11,
//   },

//   formHeaderText: {
//     flex: 1,
//   },

//   // =======================================================
//   // FORM
//   // =======================================================

//   formScroll: {
//     flex: 1,
//   },

//   formScrollContent: {
//     padding: 20,
//     paddingBottom: 10,
//   },

//   inputContainer: {
//     marginBottom: 16,
//   },

//   inputLabel: {
//     fontSize: 13,
//     fontWeight: "700",

//     color: colors.textPrimary,

//     marginBottom: 7,
//   },

//   inputWrapper: {
//     minHeight: 48,

//     borderWidth: 1,
//     borderColor: "#E5E7EB",

//     borderRadius: 12,

//     backgroundColor: "#FAFAFA",

//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 13,
//   },

//   inputDisabled: {
//     opacity: 0.6,
//   },

//   input: {
//     flex: 1,

//     marginLeft: 10,

//     color: colors.textPrimary,

//     fontSize: 14,

//     paddingVertical: 10,
//   },

//   formBottomSpace: {
//     height: 30,
//   },

//   // =======================================================
//   // ROLE OPTIONS
//   // =======================================================

//   roleOptions: {
//     marginTop: 2,
//   },

//   roleOption: {
//     minHeight: 62,

//     borderWidth: 1,
//     borderColor: "#E5E7EB",

//     borderRadius: 12,

//     paddingHorizontal: 13,

//     flexDirection: "row",
//     alignItems: "center",

//     marginBottom: 9,
//   },

//   roleOptionSelected: {
//     borderColor: colors.primaryBlue,

//     backgroundColor: "#EFF6FF",
//   },

//   radio: {
//     width: 20,
//     height: 20,

//     borderRadius: 10,

//     borderWidth: 1.5,
//     borderColor: "#D1D5DB",

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 11,
//   },

//   radioSelected: {
//     borderColor: colors.primaryBlue,
//   },

//   radioInner: {
//     width: 10,
//     height: 10,

//     borderRadius: 5,

//     backgroundColor: colors.primaryBlue,
//   },

//   roleContent: {
//     flex: 1,
//   },

//   roleTitle: {
//     fontSize: 13,
//     fontWeight: "700",

//     color: colors.textPrimary,
//   },

//   roleTitleSelected: {
//     color: colors.primaryBlue,
//   },

//   roleSubtitle: {
//     fontSize: 11,

//     color: colors.textSecondary,

//     marginTop: 2,
//   },

//   // =======================================================
//   // FORM FOOTER
//   // =======================================================

//   modalFooter: {
//     flexDirection: "row",

//     padding: 16,

//     borderTopWidth: 1,
//     borderTopColor: "#F3F4F6",

//     gap: 10,

//     backgroundColor: "#fff",
//   },

//   cancelButton: {
//     flex: 0.8,

//     height: 48,

//     borderRadius: 12,

//     backgroundColor: "#F3F4F6",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   cancelButtonText: {
//     color: "#4B5563",

//     fontSize: 13,
//     fontWeight: "700",
//   },

//   saveButton: {
//     flex: 1.5,

//     height: 48,

//     borderRadius: 12,

//     backgroundColor: colors.primaryBlue,

//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   saveButtonDisabled: {
//     opacity: 0.65,
//   },

//   saveButtonText: {
//     color: "#fff",

//     fontSize: 13,
//     fontWeight: "700",

//     marginLeft: 7,
//   },
// });

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
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";

import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../api/profile";

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

  const { libraryId, isAdmin, canManageEmployees } = useAuth();

  const [profile, setProfile] = useState(null);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // =======================================================
  // ONE EMPLOYEE MODAL
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

  const handleSaveEmployee = async (form) => {
    if (!libraryId) {
      Alert.alert("Library unavailable", "Library information is missing.");

      return false;
    }

    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, libraryId, form);

        await loadEmployees();

        Alert.alert(
          "Employee Updated",
          "Employee details have been updated successfully."
        );
      } else {
        await createEmployee(libraryId, form);

        await loadEmployees();

        Alert.alert(
          "Employee Created",
          "Employee has been created successfully."
        );
      }

      // Return to employee list
      setEditingEmployee(null);
      setEmployeeModalMode("list");

      return true;
    } catch (error) {
      console.log("❌ Employee save failed:", error);

      Alert.alert(
        editingEmployee ? "Update Failed" : "Creation Failed",
        error?.message || "Unable to save employee."
      );

      return false;
    }
  };

  // =========================================================
  // TOGGLE EMPLOYEE STATUS
  // =========================================================

  const handleToggleStatus = (employee) => {
    const nextStatus = !employee.active;

    Alert.alert(
      nextStatus ? "Activate Employee?" : "Deactivate Employee?",

      nextStatus
        ? `${employee.name} will be able to log in again.`
        : `${employee.name} will no longer be able to log in.`,

      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: nextStatus ? "Activate" : "Deactivate",

          onPress: async () => {
            try {
              await updateEmployeeStatus(employee.id, libraryId, nextStatus);

              await loadEmployees();
            } catch (error) {
              console.log("❌ Employee status update failed:", error);

              Alert.alert(
                "Update Failed",
                error?.message || "Unable to update employee status."
              );
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // DELETE EMPLOYEE
  // =========================================================

  const handleDeleteEmployee = (employee) => {
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

          onPress: async () => {
            try {
              await deleteEmployee(employee.id, libraryId);

              await loadEmployees();

              Alert.alert("Deleted", "Employee deleted successfully.");
            } catch (error) {
              console.log("❌ Employee delete failed:", error);

              Alert.alert(
                "Delete Failed",
                error?.message || "Unable to delete employee."
              );
            }
          },
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
  // UI
  // =========================================================

  return (
    <View style={styles.container}>
      <Header title="Profile Details" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primaryBlue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================= */}
        {/* ADMIN INFORMATION */}
        {/* ================================================= */}

        <View style={styles.card}>
          <SectionHeader icon="user" title="Admin Information" />

          <InfoRow icon="user" label="Name" value={profile?.adminName} />

          <InfoRow icon="phone" label="Phone" value={profile?.adminPhone} />
        </View>

        {/* ================================================= */}
        {/* LIBRARY INFORMATION */}
        {/* ================================================= */}

        <View style={styles.card}>
          <SectionHeader icon="building" title="Library Information" />

          <InfoRow
            icon="building"
            label="Library Name"
            value={profile?.libraryName}
          />

          <InfoRow
            icon="chair"
            label="Total Seats"
            value={
              profile?.totalSeats != null ? String(profile.totalSeats) : "-"
            }
          />
        </View>

        {/* ================================================= */}
        {/* EMPLOYEE MANAGEMENT */}
        {/* ================================================= */}

        {isAdmin && canManageEmployees && (
          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.employeeManagementCard}
            onPress={openEmployeeManagement}
          >
            <View style={styles.employeeManagementLeft}>
              <View style={styles.employeeManagementIcon}>
                <FontAwesome6
                  name="users"
                  size={17}
                  color={colors.primaryBlue}
                />
              </View>

              <View style={styles.employeeManagementText}>
                <Text style={styles.employeeManagementTitle}>
                  Employee Management
                </Text>

                <Text style={styles.employeeManagementSubtitle}>
                  Manage staff access to your library
                </Text>
              </View>
            </View>

            <View style={styles.employeeManagementRight}>
              <View style={styles.employeeCount}>
                <Text style={styles.employeeCountText}>{employees.length}</Text>
              </View>

              <FontAwesome6
                name="chevron-right"
                size={13}
                color={colors.textFaint}
              />
            </View>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ================================================= */}
      {/* SINGLE EMPLOYEE MODAL */}
      {/* ================================================= */}

      <EmployeeManagementModal
        visible={employeeModalVisible}
        mode={employeeModalMode}
        employees={employees}
        loading={employeesLoading}
        employee={editingEmployee}
        onClose={closeEmployeeModal}
        onBack={handleBackToEmployeeList}
        onAdd={handleAddEmployee}
        onEdit={handleEditEmployee}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteEmployee}
        onSave={handleSaveEmployee}
      />
    </View>
  );
}

// =========================================================
// SECTION HEADER
// =========================================================

function SectionHeader({ icon, title }) {
  const { colors, styles } = useScreenTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <FontAwesome6 name={icon} size={15} color={colors.primaryBlue} />
      </View>

      <Text style={styles.cardTitle}>{title}</Text>
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
        color={colors.textFaint}
        style={styles.infoIcon}
      />

      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value ?? "-"}</Text>
    </View>
  );
}

// =========================================================
// SINGLE EMPLOYEE MANAGEMENT MODAL
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
          <FontAwesome6 name="xmark" size={18} color={colors.textSecondary} />
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
      style={[
        styles.employeeCard,
        !employee.active && styles.employeeCardInactive,
      ]}
    >
      {/* TOP */}

      <View style={styles.employeeTopRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {employee.name ? employee.name.charAt(0).toUpperCase() : "E"}
          </Text>
        </View>

        <View style={styles.employeeDetails}>
          <Text
            style={[
              styles.employeeName,
              !employee.active && styles.inactiveText,
            ]}
            numberOfLines={1}
          >
            {employee.name}
          </Text>

          <Text style={styles.username}>@{employee.username}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{roleLabel}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                employee.active ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  employee.active
                    ? styles.statusDotActive
                    : styles.statusDotInactive,
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  employee.active
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {employee.active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* PHONE */}

      {employee.phone ? (
        <View style={styles.employeePhoneRow}>
          <FontAwesome6 name="phone" size={12} color={colors.textFaint} />

          <Text style={styles.employeePhone}>{employee.phone}</Text>
        </View>
      ) : null}

      {/* ACTIONS */}

      <View style={styles.employeeActions}>
        <TouchableOpacity
          style={styles.secondaryAction}
          activeOpacity={0.8}
          onPress={onEdit}
        >
          <FontAwesome6 name="pen" size={12} color={colors.primaryBlue} />

          <Text style={styles.secondaryActionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          activeOpacity={0.8}
          onPress={onToggleStatus}
        >
          <FontAwesome6
            name={employee.active ? "user-slash" : "user-check"}
            size={12}
            color={employee.active ? colors.warning : colors.success}
          />

          <Text
            style={[
              styles.secondaryActionText,
              {
                color: employee.active ? colors.warning : colors.success,
              },
            ]}
          >
            {employee.active ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteAction}
          activeOpacity={0.8}
          onPress={onDelete}
        >
          <FontAwesome6 name="trash" size={12} color={colors.danger} />
        </TouchableOpacity>
      </View>
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

    // Password:
    // Create -> required
    // Edit -> optional

    if (password.trim()) {
      payload.password = password.trim();
    }

    // Keep existing active state
    // when editing

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
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

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
          <FontAwesome6 name="xmark" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ================================================= */}
      {/* FORM */}
      {/* ================================================= */}

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
          onChangeText={setPhone}
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

        {/* ================================================= */}
        {/* ROLE */}
        {/* ================================================= */}

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

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

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
        <FontAwesome6 name={icon} size={14} color={colors.textFaint} />

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
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
  const { colors, styles } = useScreenTheme();

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
//
// =========================================================
// STYLES
// =========================================================

function createStyles(colors) {
  return StyleSheet.create({
    // =======================================================
    // MAIN
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
    // GENERAL CARDS
    // =======================================================

    card: {
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,

      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
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
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    infoRow: {
      minHeight: 42,

      flexDirection: "row",
      alignItems: "center",

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    infoIcon: {
      width: 24,
    },

    infoLabel: {
      width: 105,

      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "600",
    },

    infoValue: {
      flex: 1,

      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "600",
    },

    // =======================================================
    // EMPLOYEE MANAGEMENT COMPACT CARD
    // =======================================================

    employeeManagementCard: {
      backgroundColor: colors.card,

      borderRadius: radius.lg,

      minHeight: 76,

      paddingHorizontal: spacing.md,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      marginBottom: spacing.md,

      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 12,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    employeeManagementLeft: {
      flexDirection: "row",
      alignItems: "center",

      flex: 1,
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
    },

    employeeManagementTitle: {
      fontSize: 15,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    employeeManagementSubtitle: {
      marginTop: 3,

      fontSize: 11,
      color: colors.textSecondary,
    },

    employeeManagementRight: {
      flexDirection: "row",
      alignItems: "center",

      gap: 10,
    },

    employeeCount: {
      minWidth: 34,
      height: 34,

      borderRadius: 17,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    employeeCountText: {
      color: colors.primaryBlue,

      fontSize: 14,
      fontWeight: "800",
    },

    // =======================================================
    // MODAL
    // =======================================================

    modalOverlay: {
      flex: 1,

      backgroundColor: "rgba(0,0,0,0.45)",

      justifyContent: "flex-end",
    },

    managementModalContainer: {
      backgroundColor: colors.bg,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,

      height: "88%",

      overflow: "hidden",
    },

    formModalContainer: {
      backgroundColor: colors.card,

      height: "92%",

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

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",

      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15,

      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,

      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },

    managementHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",

      flex: 1,
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
      fontSize: 19,
      fontWeight: "800",

      color: colors.textPrimary,
    },

    modalSubtitle: {
      fontSize: 12,

      color: colors.textSecondary,

      marginTop: 4,
    },

    closeButton: {
      width: 38,
      height: 38,

      borderRadius: 19,

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
      padding: 16,
      paddingBottom: 20,
    },

    managementLoading: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      marginTop: 8,

      fontSize: 12,
      color: colors.textSecondary,
    },

    managementFooter: {
      backgroundColor: colors.card,

      paddingHorizontal: 16,
      paddingTop: 10,

      paddingBottom: Platform.OS === "ios" ? 24 : 14,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    // =======================================================
    // ADD EMPLOYEE BUTTON
    // =======================================================

    addEmployeeButton: {
      height: 48,

      borderRadius: 13,

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
      color: "#fff",

      fontSize: 14,
      fontWeight: "700",

      marginLeft: 8,
    },

    // =======================================================
    // EMPLOYEE CARD
    // =======================================================

    employeeCard: {
      backgroundColor: colors.card,

      borderRadius: radius.lg,

      padding: spacing.md,

      marginBottom: 10,

      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 10,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    employeeCardInactive: {
      opacity: 0.72,
    },

    employeeTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },

    avatar: {
      width: 46,
      height: 46,

      borderRadius: 23,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    avatarText: {
      fontSize: 18,
      fontWeight: "800",

      color: colors.primaryBlue,
    },

    employeeDetails: {
      flex: 1,
    },

    employeeName: {
      fontSize: 15,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    inactiveText: {
      color: colors.textMuted,
    },

    username: {
      marginTop: 2,

      fontSize: 12,
      color: colors.textMuted,
    },

    badgeRow: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 8,

      flexWrap: "wrap",
    },

    roleBadge: {
      backgroundColor: colors.borderLight,

      paddingHorizontal: 9,
      paddingVertical: 5,

      borderRadius: 7,

      marginRight: 7,
    },

    roleBadgeText: {
      fontSize: 10,
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
      fontSize: 10,
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

      marginTop: 12,
      paddingTop: 10,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    employeePhone: {
      marginLeft: 8,

      fontSize: 12,
      color: colors.textSecondary,
    },

    employeeActions: {
      flexDirection: "row",
      alignItems: "center",

      marginTop: 12,
      paddingTop: 10,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },

    secondaryAction: {
      height: 36,

      paddingHorizontal: 11,

      borderRadius: 9,

      backgroundColor: colors.borderLight,

      flexDirection: "row",
      alignItems: "center",

      marginRight: 7,
    },

    secondaryActionText: {
      marginLeft: 6,

      fontSize: 11,
      fontWeight: "700",

      color: colors.primaryBlue,
    },

    deleteAction: {
      marginLeft: "auto",

      width: 36,
      height: 36,

      borderRadius: 9,

      backgroundColor: colors.dangerBg,

      alignItems: "center",
      justifyContent: "center",
    },

    // =======================================================
    // EMPTY STATE
    // =======================================================

    emptyEmployees: {
      backgroundColor: colors.card,

      borderRadius: radius.lg,

      padding: 24,

      alignItems: "center",
      justifyContent: "center",

      borderWidth: 1,
      borderColor: colors.border,
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
      fontSize: 15,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    emptySubtitle: {
      fontSize: 12,
      lineHeight: 18,

      textAlign: "center",

      color: colors.textSecondary,

      marginTop: 5,

      maxWidth: 260,
    },

    emptyButton: {
      marginTop: 14,

      paddingHorizontal: 16,

      height: 38,

      borderRadius: 10,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",
    },

    emptyButtonText: {
      color: colors.primaryBlue,

      fontSize: 12,
      fontWeight: "700",
    },

    // =======================================================
    // FORM HEADER
    // =======================================================

    formHeader: {
      backgroundColor: colors.card,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 14,

      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },

    backButton: {
      width: 38,
      height: 38,

      borderRadius: 19,

      backgroundColor: colors.statBlueBg,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
    },

    formHeaderText: {
      flex: 1,
    },

    // =======================================================
    // FORM
    // =======================================================

    formScroll: {
      flex: 1,
    },

    formScrollContent: {
      padding: 20,
      paddingBottom: 10,
    },

    inputContainer: {
      marginBottom: 16,
    },

    inputLabel: {
      fontSize: 13,
      fontWeight: "700",

      color: colors.textPrimary,

      marginBottom: 7,
    },

    inputWrapper: {
      minHeight: 48,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      backgroundColor: colors.borderLight,

      flexDirection: "row",
      alignItems: "center",

      paddingHorizontal: 13,
    },

    inputDisabled: {
      opacity: 0.6,
    },

    input: {
      flex: 1,

      marginLeft: 10,

      color: colors.textPrimary,

      fontSize: 14,

      paddingVertical: 10,
    },

    formBottomSpace: {
      height: 30,
    },

    // =======================================================
    // ROLE OPTIONS
    // =======================================================

    roleOptions: {
      marginTop: 2,
    },

    roleOption: {
      minHeight: 62,

      borderWidth: 1,
      borderColor: colors.border,

      borderRadius: 12,

      paddingHorizontal: 13,

      flexDirection: "row",
      alignItems: "center",

      marginBottom: 9,

      backgroundColor: colors.card,
    },

    roleOptionSelected: {
      borderColor: colors.primaryBlue,

      backgroundColor: colors.statBlueBg,
    },

    radio: {
      width: 20,
      height: 20,

      borderRadius: 10,

      borderWidth: 1.5,
      borderColor: colors.border,

      alignItems: "center",
      justifyContent: "center",

      marginRight: 11,
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
      fontSize: 13,
      fontWeight: "700",

      color: colors.textPrimary,
    },

    roleTitleSelected: {
      color: colors.primaryBlue,
    },

    roleSubtitle: {
      fontSize: 11,

      color: colors.textSecondary,

      marginTop: 2,
    },

    // =======================================================
    // FORM FOOTER
    // =======================================================

    modalFooter: {
      flexDirection: "row",

      padding: 16,

      borderTopWidth: 1,
      borderTopColor: colors.borderLight,

      gap: 10,

      backgroundColor: colors.card,
    },

    cancelButton: {
      flex: 0.8,

      height: 48,

      borderRadius: 12,

      backgroundColor: colors.borderLight,

      alignItems: "center",
      justifyContent: "center",
    },

    cancelButtonText: {
      color: colors.textSecondary,

      fontSize: 13,
      fontWeight: "700",
    },

    saveButton: {
      flex: 1.5,

      height: 48,

      borderRadius: 12,

      backgroundColor: colors.primaryBlue,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },

    saveButtonDisabled: {
      opacity: 0.65,
    },

    saveButtonText: {
      color: "#fff",

      fontSize: 13,
      fontWeight: "700",

      marginLeft: 7,
    },
  });
}
