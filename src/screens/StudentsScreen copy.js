// import React, { useCallback, useEffect, useMemo, useState } from "react";

// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TouchableOpacity,
//   ActivityIndicator,
//   Alert,
//   Keyboard,
//   Modal,
//   Pressable,
//   ScrollView,
// } from "react-native";

// import { useFocusEffect } from "@react-navigation/native";
// import { FontAwesome6 } from "@expo/vector-icons";

// import * as DocumentPicker from "expo-document-picker";
// import * as Sharing from "expo-sharing";

// import Header from "../components/Header";
// import AppInput from "../components/AppInput";
// import PrimaryButton from "../components/PrimaryButton";

// import { useAuth } from "../context/AuthContext";

// import {
//   getStudentsPaginated,
//   getSeatChangeHistory,
//   updateStudentRecord,
//   importStudentsExcel,
//   exportStudentsExcel,
// } from "../api/students";

// import { lightColors, darkColors, radius, spacing } from "../theme/colors";

// import { useTheme } from "../context/ThemeContext";

// // ============================================================
// // CONSTANTS
// // ============================================================

// const PAGE_SIZE = 10;

// const TABS = [
//   {
//     key: "ALL",
//     label: "All",
//   },
//   {
//     key: "ACTIVE",
//     label: "Active",
//   },
//   {
//     key: "EXPIRED",
//     label: "Expired",
//   },
// ];

// // ============================================================
// // SCREEN
// // ============================================================

// export default function StudentsScreen() {
//   const { libraryId } = useAuth();

//   const { isDarkMode } = useTheme();

//   const colors = isDarkMode ? darkColors : lightColors;

//   const styles = useMemo(() => createStyles(colors), [colors]);

//   // ==========================================================
//   // STUDENTS
//   // ==========================================================

//   const [students, setStudents] = useState([]);

//   const [loading, setLoading] = useState(true);

//   const [refreshing, setRefreshing] = useState(false);

//   // ==========================================================
//   // FILTER / SEARCH
//   // ==========================================================

//   const [activeTab, setActiveTab] = useState("ALL");

//   const [search, setSearch] = useState("");

//   // ==========================================================
//   // PAGINATION
//   // ==========================================================

//   const [page, setPage] = useState(0);

//   const [totalPages, setTotalPages] = useState(0);

//   const [totalStudents, setTotalStudents] = useState(0);

//   // ==========================================================
//   // PROFILE
//   // ==========================================================

//   const [selected, setSelected] = useState(null);

//   const [history, setHistory] = useState([]);

//   const [historyLoading, setHistoryLoading] = useState(false);

//   // ==========================================================
//   // EDIT
//   // ==========================================================

//   const [editVisible, setEditVisible] = useState(false);

//   const [editName, setEditName] = useState("");

//   const [editPhone, setEditPhone] = useState("");

//   const [editSeat, setEditSeat] = useState("");

//   const [editEndDate, setEditEndDate] = useState("");

//   const [saving, setSaving] = useState(false);

//   // ==========================================================
//   // IMPORT / EXPORT
//   // ==========================================================

//   const [importing, setImporting] = useState(false);

//   const [exporting, setExporting] = useState(false);

//   // ==========================================================
//   // LOAD STUDENTS
//   // ==========================================================

//   const loadStudents = useCallback(
//     async (requestedPage = 0, showLoader = true) => {
//       if (!libraryId) {
//         return;
//       }

//       if (showLoader) {
//         setLoading(true);
//       }

//       try {
//         const response = await getStudentsPaginated(libraryId, {
//           page: requestedPage,
//           search,
//           status: activeTab,
//         });

//         // ----------------------------------------------------
//         // CONTENT
//         // ----------------------------------------------------

//         setStudents(Array.isArray(response?.content) ? response.content : []);

//         // ----------------------------------------------------
//         // PAGINATION INFO
//         // ----------------------------------------------------

//         const currentPage = Number.isInteger(response?.number)
//           ? response.number
//           : requestedPage;

//         setPage(currentPage);

//         setTotalPages(Number(response?.totalPages || 0));

//         setTotalStudents(Number(response?.totalElements || 0));
//       } catch (err) {
//         console.error("❌ Failed to load students:", err);

//         Alert.alert(
//           "Couldn't load students",
//           err?.response?.data?.message ||
//             "Please check your internet connection and try again."
//         );
//       } finally {
//         if (showLoader) {
//           setLoading(false);
//         }
//       }
//     },
//     [libraryId, search, activeTab]
//   );

//   // ============================================================
//   // INITIAL / FILTER / SEARCH LOAD
//   // ============================================================

//   useEffect(() => {
//     if (!libraryId) {
//       return;
//     }

//     const timer = setTimeout(
//       () => {
//         loadStudents(0);
//       },
//       search.trim().length > 0 ? 350 : 0
//     );

//     return () => clearTimeout(timer);
//   }, [libraryId, search, activeTab, loadStudents]);

//   // ============================================================
//   // SCREEN FOCUS
//   // ============================================================

//   useFocusEffect(
//     useCallback(() => {
//       if (!libraryId) {
//         return;
//       }

//       /*
//        * Don't reset the user's current page
//        * every time they return to the screen.
//        *
//        * Just refresh the current page.
//        */

//       loadStudents(page, false);
//     }, [libraryId, page])
//   );

//   // ============================================================
//   // CHANGE TAB
//   // ============================================================

//   const handleTabChange = (tab) => {
//     if (tab === activeTab) {
//       return;
//     }

//     Keyboard.dismiss();

//     setActiveTab(tab);

//     // Search remains intact.
//     // useEffect will reset page to 0.
//     setPage(0);
//   };

//   // ============================================================
//   // NEXT PAGE
//   // ============================================================

//   const handleNextPage = () => {
//     if (loading) {
//       return;
//     }

//     if (page >= totalPages - 1) {
//       return;
//     }

//     loadStudents(page + 1);
//   };

//   // ============================================================
//   // PREVIOUS PAGE
//   // ============================================================

//   const handlePreviousPage = () => {
//     if (loading) {
//       return;
//     }

//     if (page <= 0) {
//       return;
//     }

//     loadStudents(page - 1);
//   };

//   // ============================================================
//   // REFRESH
//   // ============================================================

//   const handleRefresh = async () => {
//     if (!libraryId) {
//       return;
//     }

//     setRefreshing(true);

//     try {
//       await loadStudents(page, false);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   // ============================================================
//   // OPEN STUDENT PROFILE
//   // ============================================================

//   const openStudent = async (student) => {
//     setSelected(student);

//     setHistory([]);

//     setHistoryLoading(true);

//     try {
//       const h = await getSeatChangeHistory(student.id, libraryId);

//       setHistory(Array.isArray(h) ? h : []);
//     } catch (err) {
//       console.error("Failed to load seat history:", err);

//       setHistory([]);
//     } finally {
//       setHistoryLoading(false);
//     }
//   };

//   // ============================================================
//   // CLOSE PROFILE
//   // ============================================================

//   const closeProfile = () => {
//     setSelected(null);

//     setHistory([]);
//   };

//   // ============================================================
//   // OPEN EDIT
//   // ============================================================

//   const openEdit = (student) => {
//     setSelected(student);

//     setEditName(student.name || "");

//     setEditPhone(student.phone || "");

//     setEditSeat(String(student.seatNumber ?? ""));

//     setEditEndDate(student.expireDate || student.endDate || "");

//     setEditVisible(true);
//   };

//   // ============================================================
//   // SAVE EDIT
//   // ============================================================

//   const saveEdit = async () => {
//     if (!selected) {
//       return;
//     }

//     if (!editName.trim()) {
//       Alert.alert("Validation", "Student name is required.");

//       return;
//     }

//     setSaving(true);

//     try {
//       await updateStudentRecord(selected.id, {
//         name: editName.trim(),
//         phone: editPhone.trim(),
//         seatNumber: editSeat,
//         endDate: editEndDate.trim(),
//       });

//       setEditVisible(false);

//       setSelected(null);

//       Alert.alert("Success", "Student updated successfully.");

//       // Refresh current page
//       await loadStudents(page, true);
//     } catch (err) {
//       console.error("Save student failed:", err);

//       Alert.alert(
//         "Save failed",
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to update student."
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ============================================================
//   // IMPORT EXCEL
//   // ============================================================

//   const handleImport = async () => {
//     if (!libraryId) {
//       Alert.alert("Library not found", "Please reload the app and try again.");

//       return;
//     }

//     if (importing) {
//       return;
//     }

//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: [
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//           "application/vnd.ms-excel",
//         ],
//         copyToCacheDirectory: true,
//       });

//       if (result.canceled) {
//         return;
//       }

//       const file = result.assets?.[0];

//       if (!file?.uri) {
//         Alert.alert("Invalid file", "Unable to read the selected Excel file.");

//         return;
//       }

//       setImporting(true);

//       const response = await importStudentsExcel(
//         libraryId,
//         file.uri,
//         file.name || "students.xlsx"
//       );

//       const imported = Number(response?.importedCount || 0);

//       const skipped = Number(response?.skippedCount || 0);

//       const failed = Number(response?.failedCount || 0);

//       let message =
//         `Imported: ${imported}\n` +
//         `Skipped: ${skipped}\n` +
//         `Failed: ${failed}`;

//       Alert.alert("Import Completed", message, [
//         {
//           text: "OK",
//           onPress: () => {
//             loadStudents(0, true);
//           },
//         },
//       ]);
//     } catch (err) {
//       console.error("❌ Import failed:", err);

//       Alert.alert(
//         "Import Failed",
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to import the Excel file."
//       );
//     } finally {
//       setImporting(false);
//     }
//   };

//   // ============================================================
//   // EXPORT EXCEL
//   // ============================================================

//   const handleExport = async () => {
//     if (!libraryId) {
//       Alert.alert("Library not found", "Please reload the app and try again.");

//       return;
//     }

//     if (exporting) {
//       return;
//     }

//     try {
//       setExporting(true);

//       const fileData = await exportStudentsExcel(libraryId);

//       /*
//        * Your API currently returns the Excel response
//        * as arraybuffer.
//        *
//        * The actual saving/sharing implementation depends
//        * on the response representation used by your Axios
//        * client on React Native.
//        *
//        * If your existing client returns a Blob instead,
//        * this section will handle that separately.
//        */

//       if (typeof fileData === "string" && fileData.startsWith("file://")) {
//         if (await Sharing.isAvailableAsync()) {
//           await Sharing.shareAsync(fileData, {
//             mimeType:
//               "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//             dialogTitle: "Export Students",
//           });
//         }

//         return;
//       }

//       Alert.alert(
//         "Export Ready",
//         "The Excel file was generated successfully. If sharing does not open, we may need to adjust the file-saving code for your Axios/Expo version."
//       );
//     } catch (err) {
//       console.error("❌ Export failed:", err);

//       Alert.alert(
//         "Export Failed",
//         err?.response?.data?.message ||
//           err?.message ||
//           "Unable to export students."
//       );
//     } finally {
//       setExporting(false);
//     }
//   };

//   // ============================================================
//   // FORMAT STATUS
//   // ============================================================

//   const getStudentStatus = (student) => {
//     const expiry = student?.expireDate || student?.endDate;

//     if (!expiry) {
//       return "ACTIVE";
//     }

//     const today = new Date();

//     const expiryDate = new Date(expiry);

//     today.setHours(0, 0, 0, 0);

//     expiryDate.setHours(0, 0, 0, 0);

//     return expiryDate < today ? "EXPIRED" : "ACTIVE";
//   };

//   // ============================================================
//   // FORMAT DATE
//   // ============================================================

//   const formatDate = (value) => {
//     if (!value) {
//       return "-";
//     }

//     /*
//      * Keep YYYY-MM-DD readable.
//      */

//     if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
//       const [year, month, day] = value.split("-");

//       return `${day}/${month}/${year}`;
//     }

//     return String(value);
//   };

//   // ============================================================
//   // PAGINATION RANGE
//   // ============================================================

//   const getFirstItemNumber = () => {
//     if (totalStudents === 0) {
//       return 0;
//     }

//     return page * PAGE_SIZE + 1;
//   };

//   const getLastItemNumber = () => {
//     if (totalStudents === 0) {
//       return 0;
//     }

//     return Math.min((page + 1) * PAGE_SIZE, totalStudents);
//   };

//   // ============================================================
//   // RENDER
//   // ============================================================

//   return (
//     <View
//       style={{
//         flex: 1,
//         backgroundColor: colors.bg,
//       }}
//     >
//       <Header title="Student Records & KYC" />

//       {/* ======================================================
//           SEARCH
//       ====================================================== */}

//       <View style={styles.searchWrapper}>
//         <View style={styles.searchBox}>
//           <FontAwesome6
//             name="magnifying-glass"
//             size={15}
//             color={colors.textMuted}
//           />

//           <AppInput
//             value={search}
//             onChangeText={setSearch}
//             placeholder="Search name, phone or seat no."
//             style={styles.searchInput}
//           />

//           {search.length > 0 && (
//             <TouchableOpacity
//               onPress={() => {
//                 Keyboard.dismiss();
//                 setSearch("");
//               }}
//               style={styles.clearSearch}
//             >
//               <FontAwesome6 name="xmark" size={14} color={colors.textMuted} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </View>

//       {/* ======================================================
//           FILTER TABS
//       ====================================================== */}

//       <View style={styles.tabsRow}>
//         {TABS.map((tab) => {
//           const active = activeTab === tab.key;

//           return (
//             <TouchableOpacity
//               key={tab.key}
//               onPress={() => handleTabChange(tab.key)}
//               activeOpacity={0.8}
//               style={[styles.tab, active && styles.tabActive]}
//             >
//               <Text style={[styles.tabText, active && styles.tabTextActive]}>
//                 {tab.label}
//               </Text>
//             </TouchableOpacity>
//           );
//         })}
//       </View>

//       {/* ======================================================
//           IMPORT / EXPORT
//       ====================================================== */}

//       <View style={styles.actionRow}>
//         <TouchableOpacity
//           style={[styles.actionButton, styles.importButton]}
//           onPress={handleImport}
//           disabled={importing || exporting}
//           activeOpacity={0.8}
//         >
//           {importing ? (
//             <ActivityIndicator size="small" color={colors.primaryBlue} />
//           ) : (
//             <FontAwesome6
//               name="file-import"
//               size={15}
//               color={colors.primaryBlue}
//             />
//           )}

//           <Text style={styles.importButtonText}>
//             {importing ? "Importing..." : "Import"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.actionButton, styles.exportButton]}
//           onPress={handleExport}
//           disabled={importing || exporting}
//           activeOpacity={0.8}
//         >
//           {exporting ? (
//             <ActivityIndicator size="small" color={colors.textSecondary} />
//           ) : (
//             <FontAwesome6
//               name="file-export"
//               size={15}
//               color={colors.textSecondary}
//             />
//           )}

//           <Text style={styles.exportButtonText}>
//             {exporting ? "Exporting..." : "Export"}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* ======================================================
//           STUDENT LIST
//       ====================================================== */}

//       {loading ? (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color={colors.primaryBlue} />

//           <Text style={styles.loadingText}>Loading students...</Text>
//         </View>
//       ) : (
//         <FlatList
//           data={students}
//           keyExtractor={(item) => String(item.id)}
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.listContent}
//           refreshing={refreshing}
//           onRefresh={handleRefresh}
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <View style={styles.emptyIcon}>
//                 <FontAwesome6 name="users" size={26} color={colors.textMuted} />
//               </View>

//               <Text style={styles.emptyTitle}>No students found</Text>

//               <Text style={styles.emptySubtitle}>
//                 {search.trim()
//                   ? "Try a different name, phone number or seat number."
//                   : activeTab === "EXPIRED"
//                   ? "There are no expired students."
//                   : activeTab === "ACTIVE"
//                   ? "There are no active students."
//                   : "No students have been added yet."}
//               </Text>
//             </View>
//           }
//           renderItem={({ item }) => {
//             const status = getStudentStatus(item);

//             return (
//               <TouchableOpacity
//                 style={styles.studentCard}
//                 onPress={() => openStudent(item)}
//                 activeOpacity={0.82}
//               >
//                 {/* Seat */}

//                 <View style={styles.seatBadge}>
//                   <Text style={styles.seatBadgeText}>
//                     {item.seatNumber ?? "-"}
//                   </Text>
//                 </View>

//                 {/* Student Info */}

//                 <View style={styles.studentInfo}>
//                   <Text style={styles.rowName} numberOfLines={1}>
//                     {item.name || "-"}
//                   </Text>

//                   <Text style={styles.rowMeta} numberOfLines={1}>
//                     {item.phone || "No phone number"}
//                   </Text>
//                 </View>

//                 {/* Right Info */}

//                 <View style={styles.rightInfo}>
//                   <Text style={styles.rowDate}>
//                     {formatDate(item.expireDate || item.endDate)}
//                   </Text>

//                   <View style={styles.amountStatusRow}>
//                     <Text style={styles.rowAmount}>
//                       ₹{item.amountPaid ?? "-"}
//                     </Text>

//                     <View
//                       style={[
//                         styles.statusBadge,
//                         status === "EXPIRED"
//                           ? styles.expiredBadge
//                           : styles.activeBadge,
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.statusText,
//                           status === "EXPIRED"
//                             ? styles.expiredText
//                             : styles.activeText,
//                         ]}
//                       >
//                         {status}
//                       </Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Edit */}

//                 <TouchableOpacity
//                   onPress={() => openEdit(item)}
//                   style={styles.editBtn}
//                   hitSlop={{
//                     top: 8,
//                     bottom: 8,
//                     left: 8,
//                     right: 8,
//                   }}
//                 >
//                   <FontAwesome6
//                     name="pen"
//                     size={13}
//                     color={colors.primaryBlue}
//                   />
//                 </TouchableOpacity>
//               </TouchableOpacity>
//             );
//           }}
//         />
//       )}

//       {/* ======================================================
//           PAGINATION
//       ====================================================== */}

//       {!loading && totalStudents > 0 && (
//         <View style={styles.paginationContainer}>
//           <Text style={styles.paginationInfo}>
//             Showing {getFirstItemNumber()}–{getLastItemNumber()} of{" "}
//             {totalStudents}
//           </Text>

//           <View style={styles.paginationControls}>
//             {/* Previous */}

//             <TouchableOpacity
//               onPress={handlePreviousPage}
//               disabled={page === 0 || loading}
//               activeOpacity={0.8}
//               style={[
//                 styles.pageButton,
//                 (page === 0 || loading) && styles.pageButtonDisabled,
//               ]}
//             >
//               <FontAwesome6
//                 name="chevron-left"
//                 size={12}
//                 color={page === 0 ? colors.textFaint : colors.primaryBlue}
//               />

//               <Text
//                 style={[
//                   styles.pageButtonText,
//                   page === 0 && styles.pageButtonTextDisabled,
//                 ]}
//               >
//                 Previous
//               </Text>
//             </TouchableOpacity>

//             {/* Page */}

//             <View style={styles.pageIndicator}>
//               <Text style={styles.pageIndicatorText}>
//                 Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
//               </Text>
//             </View>

//             {/* Next */}

//             <TouchableOpacity
//               onPress={handleNextPage}
//               disabled={page >= totalPages - 1 || loading}
//               activeOpacity={0.8}
//               style={[
//                 styles.pageButton,
//                 (page >= totalPages - 1 || loading) &&
//                   styles.pageButtonDisabled,
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.pageButtonText,
//                   page >= totalPages - 1 && styles.pageButtonTextDisabled,
//                 ]}
//               >
//                 Next
//               </Text>

//               <FontAwesome6
//                 name="chevron-right"
//                 size={12}
//                 color={
//                   page >= totalPages - 1 ? colors.textFaint : colors.primaryBlue
//                 }
//               />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* ======================================================
//           PROFILE + HISTORY MODAL
//       ====================================================== */}

//       <Modal
//         visible={!!selected && !editVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={closeProfile}
//       >
//         <Pressable style={styles.overlay} onPress={closeProfile}>
//           <Pressable
//             style={styles.profileSheet}
//             onPress={(e) => e.stopPropagation()}
//           >
//             {selected && (
//               <ScrollView showsVerticalScrollIndicator={false}>
//                 {/* Profile Header */}

//                 <View style={styles.profileHeader}>
//                   <View style={styles.profileAvatar}>
//                     <Text style={styles.profileAvatarText}>
//                       {selected.name?.charAt(0)?.toUpperCase() || "S"}
//                     </Text>
//                   </View>

//                   <Text style={styles.profileName}>{selected.name || "-"}</Text>

//                   <Text style={styles.profilePhone}>
//                     {selected.phone || "No phone number"}
//                   </Text>
//                 </View>

//                 {/* Details */}

//                 <View style={styles.profileDetailsCard}>
//                   <DetailRow
//                     label="Seat"
//                     value={selected.seatNumber}
//                     styles={styles}
//                   />

//                   <DetailRow
//                     label="Joined"
//                     value={formatDate(selected.bookingDate)}
//                     styles={styles}
//                   />

//                   <DetailRow
//                     label="Plan Expires"
//                     value={formatDate(selected.expireDate || selected.endDate)}
//                     danger={getStudentStatus(selected) === "EXPIRED"}
//                     styles={styles}
//                   />

//                   <DetailRow
//                     label="Amount Paid"
//                     value={
//                       selected.amountPaid != null
//                         ? `₹${selected.amountPaid}`
//                         : "-"
//                     }
//                     styles={styles}
//                   />

//                   <DetailRow
//                     label="Status"
//                     value={getStudentStatus(selected)}
//                     danger={getStudentStatus(selected) === "EXPIRED"}
//                     styles={styles}
//                   />
//                 </View>

//                 {/* Seat History */}

//                 <Text style={styles.historyTitle}>Seat Change History</Text>

//                 {historyLoading ? (
//                   <View style={styles.historyLoading}>
//                     <ActivityIndicator color={colors.primaryBlue} />

//                     <Text style={styles.historyLoadingText}>
//                       Loading history...
//                     </Text>
//                   </View>
//                 ) : history.length === 0 ? (
//                   <View style={styles.noHistory}>
//                     <FontAwesome6
//                       name="clock-rotate-left"
//                       size={20}
//                       color={colors.border}
//                     />

//                     <Text style={styles.emptyText}>
//                       No seat change history.
//                     </Text>
//                   </View>
//                 ) : (
//                   <View style={styles.historyContainer}>
//                     {history.map((h, idx) => (
//                       <View key={h.id ?? idx} style={styles.historyItem}>
//                         <View style={styles.timeline}>
//                           <View style={styles.dot} />

//                           {idx < history.length - 1 && (
//                             <View style={styles.timelineLine} />
//                           )}
//                         </View>

//                         <View style={styles.historyContent}>
//                           <Text style={styles.historyText}>
//                             Seat {h.oldSeat ?? h.fromSeat ?? "-"} →{" "}
//                             {h.newSeat ?? h.toSeat ?? "-"}
//                           </Text>

//                           <Text style={styles.historyDate}>
//                             {formatDateTime(h.changedAt ?? h.date)}
//                           </Text>
//                         </View>
//                       </View>
//                     ))}
//                   </View>
//                 )}

//                 <PrimaryButton
//                   title="Close"
//                   variant="light"
//                   onPress={closeProfile}
//                   style={{
//                     marginTop: spacing.md,
//                   }}
//                 />
//               </ScrollView>
//             )}
//           </Pressable>
//         </Pressable>
//       </Modal>

//       {/* ======================================================
//           EDIT MODAL
//       ====================================================== */}

//       <Modal
//         visible={editVisible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setEditVisible(false)}
//       >
//         <Pressable style={styles.overlay} onPress={() => setEditVisible(false)}>
//           <Pressable
//             style={styles.profileSheet}
//             onPress={(e) => e.stopPropagation()}
//           >
//             <ScrollView
//               showsVerticalScrollIndicator={false}
//               keyboardShouldPersistTaps="handled"
//             >
//               <Text style={styles.editTitle}>Edit Student</Text>

//               <Text style={styles.label}>Name</Text>

//               <AppInput
//                 value={editName}
//                 onChangeText={setEditName}
//                 placeholder="Student name"
//               />

//               <Text style={styles.label}>Phone</Text>

//               <AppInput
//                 value={editPhone}
//                 onChangeText={setEditPhone}
//                 keyboardType="phone-pad"
//                 placeholder="Phone number"
//               />

//               <Text style={styles.label}>Seat Number</Text>

//               <AppInput
//                 value={editSeat}
//                 onChangeText={setEditSeat}
//                 keyboardType="numeric"
//                 placeholder="Seat number"
//               />

//               <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>

//               <AppInput
//                 value={editEndDate}
//                 onChangeText={setEditEndDate}
//                 placeholder="YYYY-MM-DD"
//               />

//               <PrimaryButton
//                 title="Save"
//                 onPress={saveEdit}
//                 loading={saving}
//                 style={{
//                   marginTop: spacing.md,
//                 }}
//               />

//               <PrimaryButton
//                 title="Cancel"
//                 variant="light"
//                 onPress={() => setEditVisible(false)}
//                 style={{
//                   marginTop: 10,
//                 }}
//               />
//             </ScrollView>
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// // ============================================================
// // DETAIL ROW
// // ============================================================

// function DetailRow({ label, value, danger, styles }) {
//   return (
//     <View style={styles.detailRow}>
//       <Text style={styles.detailLabel}>{label}</Text>

//       <Text style={[styles.detailValue, danger && styles.detailDanger]}>
//         {value ?? "-"}
//       </Text>
//     </View>
//   );
// }

// // ============================================================
// // DATE TIME FORMAT
// // ============================================================

// function formatDateTime(value) {
//   if (!value) {
//     return "-";
//   }

//   try {
//     const date = new Date(value);

//     if (Number.isNaN(date.getTime())) {
//       return String(value);
//     }

//     return date.toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return String(value);
//   }
// }

// // ============================================================
// // STYLES
// // ============================================================

// const createStyles = (colors) =>
//   StyleSheet.create({
//     // ==========================================================
//     // SEARCH
//     // ==========================================================

//     searchWrapper: {
//       paddingHorizontal: spacing.md,

//       paddingTop: spacing.md,

//       paddingBottom: 4,
//     },

//     searchBox: {
//       flexDirection: "row",

//       alignItems: "center",

//       minHeight: 48,

//       backgroundColor: colors.card,

//       borderWidth: 1,

//       borderColor: colors.border,

//       borderRadius: radius.md,

//       paddingHorizontal: 13,

//       shadowColor: "#000",

//       shadowOpacity: 0.03,

//       shadowRadius: 5,

//       shadowOffset: {
//         width: 0,
//         height: 2,
//       },

//       elevation: 1,
//     },

//     searchInput: {
//       flex: 1,

//       marginLeft: 9,

//       marginRight: 4,

//       borderWidth: 0,

//       backgroundColor: "transparent",
//     },

//     clearSearch: {
//       width: 30,

//       height: 30,

//       alignItems: "center",

//       justifyContent: "center",

//       borderRadius: 15,

//       backgroundColor: colors.borderLight,
//     },

//     // ==========================================================
//     // TABS
//     // ==========================================================

//     tabsRow: {
//       flexDirection: "row",

//       paddingHorizontal: spacing.md,

//       paddingTop: spacing.sm,

//       gap: 8,
//     },

//     tab: {
//       paddingVertical: 8,

//       paddingHorizontal: 16,

//       borderRadius: radius.pill,

//       borderWidth: 1,

//       borderColor: colors.border,

//       backgroundColor: colors.borderLight,
//     },

//     tabActive: {
//       backgroundColor: colors.statBlueBg,

//       borderColor: colors.primaryBlue,
//     },

//     tabText: {
//       fontSize: 13,

//       fontWeight: "600",

//       color: colors.textSecondary,
//     },

//     tabTextActive: {
//       color: colors.primaryBlue,
//     },

//     // ==========================================================
//     // IMPORT / EXPORT
//     // ==========================================================

//     actionRow: {
//       flexDirection: "row",

//       paddingHorizontal: spacing.md,

//       paddingTop: spacing.sm,

//       paddingBottom: 4,

//       gap: 10,
//     },

//     actionButton: {
//       flex: 1,

//       minHeight: 42,

//       borderRadius: radius.md,

//       flexDirection: "row",

//       alignItems: "center",

//       justifyContent: "center",

//       gap: 8,

//       borderWidth: 1,
//     },

//     importButton: {
//       backgroundColor: colors.statBlueBg,

//       borderColor: colors.border,
//     },

//     exportButton: {
//       backgroundColor: colors.card,

//       borderColor: colors.border,
//     },

//     importButtonText: {
//       fontSize: 13,

//       fontWeight: "700",

//       color: colors.primaryBlue,
//     },

//     exportButtonText: {
//       fontSize: 13,

//       fontWeight: "700",

//       color: colors.textSecondary,
//     },

//     // ==========================================================
//     // LIST
//     // ==========================================================

//     listContent: {
//       paddingHorizontal: spacing.md,

//       paddingTop: spacing.sm,

//       paddingBottom: 16,
//     },

//     studentCard: {
//       flexDirection: "row",

//       alignItems: "center",

//       backgroundColor: colors.card,

//       borderRadius: radius.md,

//       padding: spacing.sm,

//       marginBottom: spacing.sm,

//       borderWidth: 1,

//       borderColor: colors.borderLight,

//       shadowColor: "#000",

//       shadowOpacity: 0.025,

//       shadowRadius: 4,

//       shadowOffset: {
//         width: 0,
//         height: 2,
//       },

//       elevation: 1,

//       gap: 10,
//     },

//     seatBadge: {
//       width: 38,

//       height: 38,

//       borderRadius: 11,

//       backgroundColor: colors.statBlueBg,

//       alignItems: "center",

//       justifyContent: "center",
//     },

//     seatBadgeText: {
//       color: colors.primaryBlue,

//       fontWeight: "800",

//       fontSize: 14,
//     },

//     studentInfo: {
//       flex: 1,

//       minWidth: 0,
//     },

//     rowName: {
//       fontSize: 14,

//       fontWeight: "700",

//       color: colors.textPrimary,
//     },

//     rowMeta: {
//       fontSize: 12,

//       color: colors.textFaint,

//       marginTop: 3,
//     },

//     rightInfo: {
//       alignItems: "flex-end",

//       minWidth: 90,
//     },

//     rowDate: {
//       fontSize: 11,

//       color: colors.textSecondary,

//       marginBottom: 4,
//     },

//     amountStatusRow: {
//       flexDirection: "row",

//       alignItems: "center",

//       gap: 6,
//     },

//     rowAmount: {
//       fontSize: 12,

//       fontWeight: "700",

//       color: colors.textPrimary,
//     },

//     statusBadge: {
//       paddingHorizontal: 6,

//       paddingVertical: 3,

//       borderRadius: radius.pill,
//     },

//     activeBadge: {
//       backgroundColor: colors.successBg,
//     },

//     expiredBadge: {
//       backgroundColor: colors.dangerBg,
//     },

//     statusText: {
//       fontSize: 8,

//       fontWeight: "800",

//       letterSpacing: 0.3,
//     },

//     activeText: {
//       color: colors.success,
//     },

//     expiredText: {
//       color: colors.danger,
//     },

//     editBtn: {
//       padding: 8,

//       borderRadius: 8,

//       backgroundColor: colors.borderLight,
//     },

//     // ==========================================================
//     // LOADING
//     // ==========================================================

//     loadingContainer: {
//       flex: 1,

//       alignItems: "center",

//       justifyContent: "center",
//     },

//     loadingText: {
//       marginTop: 10,

//       fontSize: 13,

//       color: colors.textFaint,
//     },

//     // ==========================================================
//     // EMPTY
//     // ==========================================================

//     emptyContainer: {
//       alignItems: "center",

//       justifyContent: "center",

//       paddingTop: 70,

//       paddingHorizontal: 30,
//     },

//     emptyIcon: {
//       width: 58,

//       height: 58,

//       borderRadius: 29,

//       backgroundColor: colors.borderLight,

//       alignItems: "center",

//       justifyContent: "center",

//       marginBottom: 12,
//     },

//     emptyTitle: {
//       textAlign: "center",

//       color: colors.textSecondary,

//       fontSize: 14,

//       fontWeight: "700",
//     },

//     emptySubtitle: {
//       textAlign: "center",

//       color: colors.textFaint,

//       fontSize: 12,

//       lineHeight: 18,

//       marginTop: 5,
//     },

//     // ==========================================================
//     // PAGINATION
//     // ==========================================================

//     paginationContainer: {
//       backgroundColor: colors.card,

//       borderTopWidth: 1,

//       borderTopColor: colors.border,

//       paddingHorizontal: spacing.md,

//       paddingTop: 10,

//       paddingBottom: 12,
//     },

//     paginationInfo: {
//       textAlign: "center",

//       fontSize: 11,

//       fontWeight: "600",

//       color: colors.textFaint,

//       marginBottom: 9,
//     },

//     paginationControls: {
//       flexDirection: "row",

//       alignItems: "center",

//       justifyContent: "center",

//       gap: 8,
//     },

//     pageButton: {
//       minHeight: 38,

//       paddingHorizontal: 12,

//       borderRadius: 10,

//       borderWidth: 1,

//       borderColor: colors.border,

//       backgroundColor: colors.borderLight,

//       flexDirection: "row",

//       alignItems: "center",

//       justifyContent: "center",

//       gap: 7,
//     },

//     pageButtonDisabled: {
//       backgroundColor: colors.borderLight,

//       borderColor: colors.borderLight,
//     },

//     pageButtonText: {
//       fontSize: 11,

//       fontWeight: "700",

//       color: colors.primaryBlue,
//     },

//     pageButtonTextDisabled: {
//       color: colors.textFaint,
//     },

//     pageIndicator: {
//       minHeight: 38,

//       paddingHorizontal: 13,

//       borderRadius: 10,

//       backgroundColor: colors.statBlueBg,

//       alignItems: "center",

//       justifyContent: "center",
//     },

//     pageIndicatorText: {
//       fontSize: 11,

//       fontWeight: "800",

//       color: colors.primaryBlue,
//     },
//     // ==========================================================
//     // MODAL
//     // ==========================================================

//     overlay: {
//       flex: 1,

//       backgroundColor: "rgba(0,0,0,0.45)",

//       justifyContent: "flex-end",
//     },

//     profileSheet: {
//       backgroundColor: colors.card,

//       borderTopLeftRadius: radius.lg,

//       borderTopRightRadius: radius.lg,

//       padding: spacing.lg,

//       maxHeight: "88%",
//     },

//     // ==========================================================
//     // PROFILE
//     // ==========================================================

//     profileHeader: {
//       alignItems: "center",

//       marginBottom: spacing.md,
//     },

//     profileAvatar: {
//       width: 58,

//       height: 58,

//       borderRadius: 29,

//       backgroundColor: colors.statBlueBg,

//       alignItems: "center",

//       justifyContent: "center",

//       marginBottom: 8,
//     },

//     profileAvatarText: {
//       fontSize: 22,

//       fontWeight: "800",

//       color: colors.primaryBlue,
//     },

//     profileName: {
//       fontSize: 19,

//       fontWeight: "800",

//       textAlign: "center",

//       color: colors.textPrimary,
//     },

//     profilePhone: {
//       textAlign: "center",

//       color: colors.textSecondary,

//       fontSize: 13,

//       marginTop: 3,
//     },

//     profileDetailsCard: {
//       backgroundColor: colors.borderLight,

//       borderRadius: radius.md,

//       padding: spacing.md,

//       gap: 11,

//       marginBottom: spacing.lg,

//       borderWidth: 1,

//       borderColor: colors.border,
//     },

//     detailRow: {
//       flexDirection: "row",

//       justifyContent: "space-between",

//       alignItems: "center",
//     },

//     detailLabel: {
//       color: colors.textSecondary,

//       fontSize: 13,
//     },

//     detailValue: {
//       fontWeight: "700",

//       fontSize: 13,

//       color: colors.textPrimary,
//     },

//     detailDanger: {
//       color: colors.danger,
//     },

//     // ==========================================================
//     // HISTORY
//     // ==========================================================

//     historyTitle: {
//       fontSize: 15,

//       fontWeight: "800",

//       marginBottom: spacing.sm,

//       color: colors.textPrimary,
//     },

//     historyContainer: {
//       paddingTop: 2,
//     },

//     historyItem: {
//       flexDirection: "row",

//       minHeight: 54,
//     },

//     timeline: {
//       width: 20,

//       alignItems: "center",

//       position: "relative",
//     },

//     dot: {
//       width: 9,

//       height: 9,

//       borderRadius: 5,

//       backgroundColor: colors.primaryBlue,

//       marginTop: 4,

//       zIndex: 2,
//     },

//     timelineLine: {
//       position: "absolute",

//       top: 13,

//       bottom: 0,

//       width: 1,

//       backgroundColor: colors.border,
//     },

//     historyContent: {
//       flex: 1,

//       marginLeft: 7,

//       paddingBottom: 10,
//     },

//     historyText: {
//       fontSize: 13,

//       fontWeight: "600",

//       color: colors.textPrimary,
//     },

//     historyDate: {
//       fontSize: 11,

//       color: colors.textFaint,

//       marginTop: 3,
//     },

//     historyLoading: {
//       alignItems: "center",

//       paddingVertical: 18,
//     },

//     historyLoadingText: {
//       marginTop: 7,

//       fontSize: 12,

//       color: colors.textFaint,
//     },

//     noHistory: {
//       alignItems: "center",

//       paddingVertical: 15,
//     },

//     emptyText: {
//       fontSize: 12,

//       color: colors.textFaint,

//       marginTop: 7,

//       textAlign: "center",
//     },

//     // ==========================================================
//     // EDIT
//     // ==========================================================

//     editTitle: {
//       fontSize: 20,

//       fontWeight: "800",

//       color: colors.textPrimary,

//       marginBottom: spacing.md,
//     },

//     label: {
//       fontSize: 13,

//       fontWeight: "600",

//       color: colors.textSecondary,

//       marginBottom: 5,

//       marginTop: 5,
//     },
//   });

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

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { FontAwesome6 } from "@expo/vector-icons";

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
  importStudentsExcel,
  exportStudentsExcel,
} from "../api/students";

import { lightColors, darkColors, radius, spacing } from "../theme/colors";

import { useTheme } from "../context/ThemeContext";

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
  const { libraryId } = useAuth();

  const { isDarkMode } = useTheme();

  const colors = isDarkMode ? darkColors : lightColors;

  const styles = useMemo(() => createStyles(colors), [colors]);

  const navigation = useNavigation();

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

  const [saving, setSaving] = useState(false);

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

  const openEdit = (student) => {
    setSelected(student);

    setEditName(student.name || "");

    setEditPhone(student.phone || "");

    setEditSeat(String(student.seatNumber ?? ""));

    setEditEndDate(student.expireDate || student.endDate || "");

    setEditVisible(true);
  };

  // ============================================================
  // SAVE EDIT
  // ============================================================

  const saveEdit = async () => {
    if (!selected) {
      return;
    }

    if (!editName.trim()) {
      Alert.alert("Validation", "Student name is required.");

      return;
    }

    setSaving(true);

    try {
      await updateStudentRecord(selected.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        seatNumber: editSeat,
        endDate: editEndDate.trim(),
      });

      setEditVisible(false);

      setSelected(null);

      Alert.alert("Success", "Student updated successfully.");

      // Refresh current page
      await loadStudents(page, true);
    } catch (err) {
      console.error("Save student failed:", err);

      Alert.alert(
        "Save failed",
        err?.response?.data?.message ||
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

      const skipped = Number(response?.skippedCount || 0);

      const failed = Number(response?.failedCount || 0);

      let message =
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

      const fileData = await exportStudentsExcel(libraryId);

      /*
       * Your API currently returns the Excel response
       * as arraybuffer.
       *
       * The actual saving/sharing implementation depends
       * on the response representation used by your Axios
       * client on React Native.
       *
       * If your existing client returns a Blob instead,
       * this section will handle that separately.
       */

      if (typeof fileData === "string" && fileData.startsWith("file://")) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileData, {
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Export Students",
          });
        }

        return;
      }

      Alert.alert(
        "Export Ready",
        "The Excel file was generated successfully. If sharing does not open, we may need to adjust the file-saving code for your Axios/Expo version."
      );
    } catch (err) {
      console.error("❌ Export failed:", err);

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

    /*
     * Keep YYYY-MM-DD readable.
     */

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
        navigation={navigation}
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
        editVisible={editVisible}
        setEditVisible={setEditVisible}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editSeat={editSeat}
        setEditSeat={setEditSeat}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        saveEdit={saveEdit}
        saving={saving}
      />
    );
  }

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
              <TouchableOpacity
                style={styles.studentCard}
                onPress={() => openStudent(item)}
                activeOpacity={0.82}
              >
                {/* Seat */}

                <View style={styles.seatBadge}>
                  <Text style={styles.seatBadgeText}>
                    {item.seatNumber ?? "-"}
                  </Text>
                </View>

                {/* Student Info */}

                <View style={styles.studentInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {item.name || "-"}
                  </Text>

                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.phone || "No phone number"}
                  </Text>
                </View>

                {/* Right Info */}

                <View style={styles.rightInfo}>
                  <Text style={styles.rowDate}>
                    {formatDate(item.expireDate || item.endDate)}
                  </Text>

                  <View style={styles.amountStatusRow}>
                    <Text style={styles.rowAmount}>
                      ₹{item.amountPaid ?? "-"}
                    </Text>

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

                {/* Edit */}

                <TouchableOpacity
                  onPress={() => openEdit(item)}
                  style={styles.editBtn}
                  hitSlop={{
                    top: 8,
                    bottom: 8,
                    left: 8,
                    right: 8,
                  }}
                >
                  <FontAwesome6
                    name="pen"
                    size={13}
                    color={colors.primaryBlue}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
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
            {/* Previous */}

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

            {/* Page */}

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                Page {totalPages === 0 ? 0 : page + 1} of {totalPages}
              </Text>
            </View>

            {/* Next */}

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
                {/* Profile Header */}

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

                {/* Details */}

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

                {/* Seat History */}

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

              <AppInput
                value={editSeat}
                onChangeText={setEditSeat}
                keyboardType="numeric"
                placeholder="Seat number"
              />

              <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>

              <AppInput
                value={editEndDate}
                onChangeText={setEditEndDate}
                placeholder="YYYY-MM-DD"
              />

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
  navigation,

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

  editVisible,
  setEditVisible,

  editName,
  setEditName,

  editPhone,
  setEditPhone,

  editSeat,
  setEditSeat,

  editEndDate,
  setEditEndDate,

  saveEdit,
  saving,
}) {
  const desktopStyles = createDesktopStyles(colors);

  return (
    <View style={desktopStyles.container}>
      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <DesktopStudentsSidebar colors={colors} navigation={navigation} />

      {/* ======================================================
          MAIN AREA
      ====================================================== */}

      <View style={desktopStyles.main}>
        {/* ====================================================
            TOP HEADER
        ==================================================== */}

        <View style={desktopStyles.topHeader}>
          <View>
            <Text style={desktopStyles.pageTitle}>Students</Text>

            <Text style={desktopStyles.pageSubtitle}>
              Manage student records, seats and subscriptions
            </Text>
          </View>

          <View style={desktopStyles.headerRight}>
            <View style={desktopStyles.countBadge}>
              <FontAwesome6 name="users" size={13} color={colors.primaryBlue} />

              <Text style={desktopStyles.countBadgeText}>
                {totalStudents} Students
              </Text>
            </View>
          </View>
        </View>

        {/* ====================================================
            TOOLBAR
        ==================================================== */}

        <View style={desktopStyles.toolbar}>
          {/* Search */}

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

          {/* Tabs */}

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

          {/* Actions */}

          <View style={desktopStyles.toolbarActions}>
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
              LEFT STUDENT LIST
          ================================================== */}

          <View style={desktopStyles.listPanel}>
            {/* List Header */}

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

            {/* Loading */}

            {loading ? (
              <View style={desktopStyles.desktopLoading}>
                <ActivityIndicator size="large" color={colors.primaryBlue} />

                <Text style={desktopStyles.desktopLoadingText}>
                  Loading students...
                </Text>
              </View>
            ) : students.length === 0 ? (
              /* Empty */

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
              /* Students */

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

                  <View style={desktopStyles.pageNumber}>
                    <Text style={desktopStyles.pageNumberText}>
                      {totalPages === 0 ? 0 : page + 1}
                    </Text>
                  </View>

                  <Text style={desktopStyles.pageOfText}>of {totalPages}</Text>

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
              RIGHT DETAILS PANEL
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
          DESKTOP EDIT MODAL
      ====================================================== */}

      <DesktopEditModal
        visible={editVisible}
        colors={colors}
        onClose={() => setEditVisible(false)}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editSeat={editSeat}
        setEditSeat={setEditSeat}
        editEndDate={editEndDate}
        setEditEndDate={setEditEndDate}
        saveEdit={saveEdit}
        saving={saving}
      />
    </View>
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
      {/* Avatar / Seat */}

      <View style={styles.studentRowAvatar}>
        <Text style={styles.studentRowAvatarText}>
          {student.name?.charAt(0)?.toUpperCase() || "S"}
        </Text>
      </View>

      {/* Main */}

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

      {/* Expiry */}

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

      {/* Amount */}

      <View style={styles.studentRowAmount}>
        <Text style={styles.studentRowAmountLabel}>Payment</Text>

        <Text style={styles.studentRowAmountValue}>
          {student.amountPaid != null ? `₹${student.amountPaid}` : "-"}
        </Text>
      </View>

      {/* Edit */}

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
}) {
  const styles = createDesktopStyles(colors);

  const status = getStudentStatus(student);

  return (
    <View style={styles.detailsWrapper}>
      {/* ======================================================
          DETAILS HEADER
      ====================================================== */}

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

      {/* ======================================================
          PROFILE
      ====================================================== */}

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

      {/* ======================================================
          INFORMATION CARDS
      ====================================================== */}

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
          value={student.amountPaid != null ? `₹${student.amountPaid}` : "-"}
          colors={colors}
        />
      </View>

      {/* ======================================================
          STUDENT INFORMATION
      ====================================================== */}

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

      {/* ======================================================
          HISTORY
      ====================================================== */}

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

      {/* ======================================================
          ACTION
      ====================================================== */}

      <View style={styles.detailsFooter}>
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.85}
          style={styles.desktopEditButton}
        >
          <FontAwesome6 name="pen" size={13} color="#ffffff" />

          <Text style={styles.desktopEditButtonText}>Edit Student</Text>
        </TouchableOpacity>
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
// DESKTOP SIDEBAR
// ============================================================

function DesktopStudentsSidebar({ colors, navigation }) {
  const styles = createDesktopStyles(colors);

  const navigate = (screen) => {
    try {
      navigation.navigate(screen);
    } catch (error) {
      console.error(`Navigation failed for ${screen}:`, error);
    }
  };

  return (
    <View style={styles.sidebar}>
      {/* ====================================================
          BRAND
      ==================================================== */}

      <View style={styles.sidebarBrand}>
        <View style={styles.sidebarLogo}>
          <Text style={styles.sidebarLogoText}>L</Text>
        </View>

        <View style={styles.sidebarBrandText}>
          <Text style={styles.sidebarBrandTitle}>LibManage</Text>

          <Text style={styles.sidebarBrandSubtitle}>Library Dashboard</Text>
        </View>
      </View>

      {/* ====================================================
          NAVIGATION
      ==================================================== */}

      <View style={styles.sidebarNavigation}>
        <DesktopSidebarItem
          icon="chart-pie"
          label="Dashboard"
          colors={colors}
          onPress={() => navigate("Dashboard")}
        />

        <DesktopSidebarItem
          icon="users"
          label="Students"
          active
          colors={colors}
          onPress={() => navigate("Students")}
        />

        <DesktopSidebarItem
          icon="file-invoice-dollar"
          label="Billing"
          colors={colors}
          onPress={() => navigate("Billing")}
        />

        <DesktopSidebarItem
          icon="user-clock"
          label="Half Day Students"
          colors={colors}
          onPress={() => navigate("HalfDayStudents")}
        />

        <DesktopSidebarItem
          icon="user-gear"
          label="Profile"
          colors={colors}
          onPress={() => navigate("Profile")}
        />
      </View>

      {/* ====================================================
          SIDEBAR FOOTER
      ==================================================== */}

      <View style={styles.sidebarFooter}>
        <View style={styles.sidebarFooterLine} />

        <View style={styles.sidebarFooterBrand}>
          <View style={styles.sidebarFooterLogo}>
            <Text style={styles.sidebarFooterLogoText}>L</Text>
          </View>

          <View>
            <Text style={styles.sidebarFooterTitle}>LibManage</Text>

            <Text style={styles.sidebarFooterSubtitle}>Library Management</Text>
          </View>
        </View>

        <Text style={styles.sidebarVersion}>Library Dashboard</Text>
      </View>
    </View>
  );
}

// ============================================================
// DESKTOP SIDEBAR ITEM
// ============================================================

function DesktopSidebarItem({ icon, label, active = false, colors, onPress }) {
  const styles = createDesktopStyles(colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.sidebarItem, active && styles.sidebarItemActive]}
    >
      <View
        style={[styles.sidebarItemIcon, active && styles.sidebarItemIconActive]}
      >
        <FontAwesome6
          name={icon}
          size={15}
          color={active ? colors.primaryBlue : colors.textSecondary}
        />
      </View>

      <Text
        style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}
      >
        {label}
      </Text>

      {active && <View style={styles.sidebarActiveIndicator} />}
    </TouchableOpacity>
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

  editPhone,
  setEditPhone,

  editSeat,
  setEditSeat,

  editEndDate,
  setEditEndDate,

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

            <DesktopField
              label="Seat Number"
              value={editSeat}
              onChangeText={setEditSeat}
              placeholder="Enter seat number"
              keyboardType="numeric"
              colors={colors}
            />

            <DesktopField
              label="End Date"
              value={editEndDate}
              onChangeText={setEditEndDate}
              placeholder="YYYY-MM-DD"
              colors={colors}
            />
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
    // ========================================================
    // MAIN
    // ========================================================

    container: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: colors.bg,
      minHeight: "100vh",
    },

    main: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.bg,
      padding: 28,
      overflow: "hidden",
    },

    // ========================================================
    // SIDEBAR
    // ========================================================

    sidebar: {
      width: 225,
      backgroundColor: colors.card,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingTop: 24,
      paddingHorizontal: 14,
      paddingBottom: 18,
      justifyContent: "space-between",
      flexShrink: 0,
    },

    sidebarBrand: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      marginBottom: 32,
    },

    sidebarLogo: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    sidebarLogoText: {
      color: "#ffffff",
      fontSize: 19,
      fontWeight: "800",
    },

    sidebarBrandText: {
      flex: 1,
    },

    sidebarBrandTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: -0.2,
    },

    sidebarBrandSubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 2,
    },

    sidebarNavigation: {
      flex: 1,
      gap: 5,
    },

    sidebarItem: {
      height: 46,
      borderRadius: 10,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
    },

    sidebarItemActive: {
      backgroundColor: colors.statBlueBg,
    },

    sidebarItemIcon: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },

    sidebarItemIconActive: {
      width: 28,
    },

    sidebarItemText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: "600",
    },

    sidebarItemTextActive: {
      color: colors.primaryBlue,
      fontWeight: "700",
    },

    sidebarActiveIndicator: {
      position: "absolute",
      right: 0,
      top: 11,
      bottom: 11,
      width: 3,
      borderRadius: 3,
      backgroundColor: colors.primaryBlue,
    },

    sidebarFooter: {
      paddingTop: 12,
    },

    sidebarFooterLine: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 14,
    },

    sidebarFooterBrand: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 5,
    },

    sidebarFooterLogo: {
      width: 27,
      height: 27,
      borderRadius: 8,
      backgroundColor: colors.primaryBlue,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },

    sidebarFooterLogoText: {
      color: "#ffffff",
      fontSize: 13,
      fontWeight: "800",
    },

    sidebarFooterTitle: {
      color: colors.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },

    sidebarFooterSubtitle: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 2,
    },

    sidebarVersion: {
      color: colors.textFaint,
      fontSize: 9,
      marginTop: 10,
      paddingHorizontal: 5,
    },

    // ========================================================
    // TOP HEADER
    // ========================================================

    topHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
    },

    pageTitle: {
      color: colors.textPrimary,
      fontSize: 27,
      fontWeight: "800",
      letterSpacing: -0.7,
    },

    pageSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 5,
    },

    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },

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
    },

    desktopSearch: {
      height: 39,
      width: 260,
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

    desktopTabs: {
      flexDirection: "row",
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

    toolbarActions: {
      marginLeft: "auto",
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
      flexDirection: "row",
      gap: 16,
    },

    listPanel: {
      flex: 1.15,
      minWidth: 520,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    detailsPanel: {
      flex: 0.85,
      minWidth: 400,
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
    },

    studentListContent: {
      padding: 8,
    },

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
    },

    studentRowName: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      maxWidth: 190,
    },

    studentStatusBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 999,
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

    studentRowExpiry: {
      width: 90,
      marginHorizontal: 8,
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

    studentRowAmount: {
      width: 70,
      marginHorizontal: 7,
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
    },

    // ========================================================
    // LOADING
    // ========================================================

    desktopLoading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
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
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    // DETAILS
    // ========================================================

    detailsWrapper: {
      flex: 1,
      minHeight: 0,
    },

    detailsHeader: {
      height: 68,
      paddingHorizontal: 18,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailsHeaderTitleArea: {
      flex: 1,
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
    },

    detailsProfile: {
      padding: 18,
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

    detailsStatus: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 999,
      gap: 6,
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
    // INFORMATION SECTION
    // ========================================================

    infoSection: {
      padding: 14,
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
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    desktopEditButton: {
      height: 39,
      borderRadius: 9,
      backgroundColor: colors.primaryBlue,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
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
    // DESKTOP MODAL
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
    // DESKTOP FIELD
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
    // DESKTOP MODAL FOOTER
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
    // ========================================================
    // SEARCH
    // ========================================================

    searchWrapper: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },

    searchBox: {
      height: 46,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
    },

    searchInput: {
      flex: 1,
      marginLeft: 9,
    },

    clearSearch: {
      width: 28,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },

    // ========================================================
    // TABS
    // ========================================================

    tabsRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingTop: 12,
      gap: 8,
    },

    tab: {
      paddingHorizontal: 15,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    tabActive: {
      backgroundColor: colors.statBlueBg,
      borderColor: colors.primaryBlue,
    },

    tabText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "600",
    },

    tabTextActive: {
      color: colors.primaryBlue,
      fontWeight: "700",
    },

    // ========================================================
    // ACTIONS
    // ========================================================

    actionRow: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      gap: 8,
    },

    actionButton: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: 9,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      borderWidth: 1,
    },

    importButton: {
      borderColor: colors.statBlueBg,
      backgroundColor: colors.statBlueBg,
    },

    importButtonText: {
      color: colors.primaryBlue,
      fontSize: 10,
      fontWeight: "700",
    },

    exportButton: {
      borderColor: colors.border,
      backgroundColor: colors.card,
    },

    exportButtonText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
    },

    // ========================================================
    // LOADING
    // ========================================================

    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },

    loadingText: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 10,
    },

    // ========================================================
    // LIST
    // ========================================================

    listContent: {
      padding: spacing.md,
      paddingBottom: 90,
    },

    studentCard: {
      minHeight: 72,
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: "row",
      alignItems: "center",
    },

    seatBadge: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },

    seatBadgeText: {
      color: colors.primaryBlue,
      fontSize: 13,
      fontWeight: "800",
    },

    studentInfo: {
      flex: 1,
      minWidth: 0,
    },

    rowName: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
    },

    rowMeta: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
    },

    rightInfo: {
      alignItems: "flex-end",
      marginLeft: 6,
    },

    rowDate: {
      color: colors.textSecondary,
      fontSize: 9,
      fontWeight: "600",
    },

    amountStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 5,
      gap: 6,
    },

    rowAmount: {
      color: colors.textPrimary,
      fontSize: 9,
      fontWeight: "700",
    },

    statusBadge: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 999,
    },

    activeBadge: {
      backgroundColor: colors.successBg,
    },

    expiredBadge: {
      backgroundColor: colors.dangerBg,
    },

    statusText: {
      fontSize: 7,
      fontWeight: "800",
    },

    activeText: {
      color: colors.success,
    },

    expiredText: {
      color: colors.danger,
    },

    editBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },

    // ========================================================
    // EMPTY
    // ========================================================

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 90,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 13,
    },

    emptyTitle: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: "700",
    },

    emptySubtitle: {
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 16,
      textAlign: "center",
      marginTop: 6,
      maxWidth: 290,
    },

    // ========================================================
    // PAGINATION
    // ========================================================

    paginationContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      minHeight: 58,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    paginationInfo: {
      color: colors.textMuted,
      fontSize: 9,
    },

    paginationControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },

    pageButton: {
      height: 32,
      paddingHorizontal: 9,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    pageButtonDisabled: {
      opacity: 0.45,
    },

    pageButtonText: {
      color: colors.primaryBlue,
      fontSize: 9,
      fontWeight: "600",
    },

    pageButtonTextDisabled: {
      color: colors.textFaint,
    },

    pageIndicator: {
      height: 32,
      paddingHorizontal: 9,
      borderRadius: 8,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
    },

    pageIndicatorText: {
      color: colors.primaryBlue,
      fontSize: 9,
      fontWeight: "700",
    },

    // ========================================================
    // OVERLAY
    // ========================================================

    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      justifyContent: "flex-end",
    },

    profileSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      maxHeight: "92%",
      padding: spacing.md,
    },

    // ========================================================
    // PROFILE
    // ========================================================

    profileHeader: {
      alignItems: "center",
      paddingVertical: 8,
    },

    profileAvatar: {
      width: 62,
      height: 62,
      borderRadius: 20,
      backgroundColor: colors.statBlueBg,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },

    profileAvatarText: {
      color: colors.primaryBlue,
      fontSize: 24,
      fontWeight: "800",
    },

    profileName: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "800",
    },

    profilePhone: {
      color: colors.textMuted,
      fontSize: 10,
      marginTop: 4,
    },

    profileDetailsCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 13,
      marginTop: 14,
    },

    detailRow: {
      minHeight: 43,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    detailLabel: {
      color: colors.textMuted,
      fontSize: 10,
    },

    detailValue: {
      color: colors.textPrimary,
      fontSize: 10,
      fontWeight: "700",
    },

    detailValueDanger: {
      color: colors.danger,
    },

    // ========================================================
    // HISTORY
    // ========================================================

    historyTitle: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: "700",
      marginTop: 18,
      marginBottom: 9,
    },

    historyLoading: {
      minHeight: 70,
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },

    historyLoadingText: {
      color: colors.textMuted,
      fontSize: 9,
    },

    noHistory: {
      minHeight: 65,
      borderRadius: 10,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },

    emptyText: {
      color: colors.textMuted,
      fontSize: 9,
    },

    historyContainer: {
      paddingTop: 4,
    },

    historyItem: {
      minHeight: 45,
      flexDirection: "row",
    },

    timeline: {
      width: 20,
      alignItems: "center",
      position: "relative",
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 7,
      backgroundColor: colors.primaryBlue,
      marginTop: 5,
      zIndex: 2,
    },

    timelineLine: {
      position: "absolute",
      top: 12,
      bottom: 0,
      width: 1,
      backgroundColor: colors.border,
    },

    historyContent: {
      flex: 1,
      paddingLeft: 5,
      paddingBottom: 10,
    },

    historyText: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "600",
    },

    historyDate: {
      color: colors.textFaint,
      fontSize: 8,
      marginTop: 3,
    },

    // ========================================================
    // EDIT
    // ========================================================

    editTitle: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 15,
    },

    label: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: "700",
      marginTop: 10,
      marginBottom: 6,
    },
  });
}
