// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Modal,
//   Pressable,
//   Switch,
// } from "react-native";

// import { FontAwesome6 } from "@expo/vector-icons";
// import { useNavigation } from "@react-navigation/native";
// import { useAuth } from "../context/AuthContext";
// import { checkLibraryExists } from "../api/library";
// import { colors } from "../theme/colors";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// export default function Header() {
//   const navigation = useNavigation();
//   const insets = useSafeAreaInsets();

//   const { libraryName, name, signOut } = useAuth();

//   const [menuOpen, setMenuOpen] = useState(false);

//   const [displayLibraryName, setDisplayLibraryName] = useState(
//     libraryName || "Your Library"
//   );

//   const [displayName, setDisplayName] = useState(name || "Admin User");

//   const [darkMode, setDarkMode] = useState(false);

//   useEffect(() => {
//     setDisplayLibraryName(libraryName || "Your Library");
//     setDisplayName(name || "Admin User");
//   }, [libraryName, name]);

//   useEffect(() => {
//     /*
//      * Fetch latest library information.
//      * This is kept as a fallback in case libraryName/name
//      * are not available immediately from AuthContext.
//      */
//     checkLibraryExists()
//       .then((data) => {
//         if (data?.libraryName) {
//           setDisplayLibraryName(data.libraryName);
//         }

//         if (!name && data?.adminName) {
//           setDisplayName(data.adminName);
//         }
//       })
//       .catch(() => {
//         // Keep AuthContext values as fallback.
//       });
//   }, [libraryName, name]);

//   const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || "A";

//   const handleLogout = async () => {
//     setMenuOpen(false);
//     await signOut();
//   };

//   const handleLanguage = () => {
//     setMenuOpen(false);

//     // Language screen can be added later.
//     // navigation.navigate("Language");
//   };

//   return (
//     <View
//       style={[
//         styles.header,
//         {
//           paddingTop: insets.top + 8,
//         },
//       ]}
//     >
//       {/* ================= LEFT SIDE ================= */}
//       <View style={styles.leftSection}>
//         {/* App Logo */}
//         <View style={styles.logoContainer}>
//           <FontAwesome6 name="book-open" size={18} color="#fff" />
//         </View>

//         {/* App + Library Name */}
//         <View style={styles.brandContainer}>
//           <Text style={styles.appName}>LibManage</Text>

//           <Text
//             style={styles.libraryName}
//             numberOfLines={1}
//             ellipsizeMode="tail"
//           >
//             {displayLibraryName}
//           </Text>
//         </View>
//       </View>

//       {/* ================= RIGHT SIDE ================= */}
//       <View style={styles.rightSection}>
//         {/* Admin / Employee Avatar */}
//         <TouchableOpacity
//           onPress={() => setMenuOpen(true)}
//           style={styles.profileBtn}
//           activeOpacity={0.8}
//         >
//           <Text style={styles.profileInitial}>{firstLetter}</Text>
//         </TouchableOpacity>

//         {/* Settings Button */}
//         <TouchableOpacity
//           onPress={() => setMenuOpen(true)}
//           style={styles.settingsBtn}
//           activeOpacity={0.8}
//         >
//           <FontAwesome6 name="gear" size={21} color={colors.primaryBlue} />
//         </TouchableOpacity>
//       </View>

//       {/* ================= SETTINGS MENU ================= */}
//       <Modal
//         visible={menuOpen}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setMenuOpen(false)}
//       >
//         <Pressable
//           style={styles.menuOverlay}
//           onPress={() => setMenuOpen(false)}
//         >
//           <Pressable
//             style={[
//               styles.menu,
//               {
//                 top: insets.top + 68,
//               },
//             ]}
//             onPress={(e) => e.stopPropagation()}
//           >
//             {/* User Header */}
//             <View style={styles.menuHeaderContainer}>
//               <View style={styles.menuAvatar}>
//                 <Text style={styles.menuAvatarText}>{firstLetter}</Text>
//               </View>

//               <View style={styles.menuUserInfo}>
//                 <Text style={styles.menuHeader} numberOfLines={1}>
//                   {displayName}
//                 </Text>

//                 <Text style={styles.menuSubHeader} numberOfLines={1}>
//                   {displayLibraryName}
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.divider} />

//             {/* Language */}
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={handleLanguage}
//               activeOpacity={0.7}
//             >
//               <View style={styles.menuIconContainer}>
//                 <FontAwesome6 name="globe" size={18} color="#333" />
//               </View>

//               <Text style={styles.menuText}>Language</Text>

//               <FontAwesome6 name="chevron-right" size={13} color="#888" />
//             </TouchableOpacity>

//             {/* Dark Mode */}
//             <View style={styles.menuItem}>
//               <View style={styles.menuIconContainer}>
//                 <FontAwesome6 name="moon" size={18} color="#333" />
//               </View>

//               <Text style={styles.menuText}>Dark Mode</Text>

//               <Switch
//                 value={darkMode}
//                 onValueChange={setDarkMode}
//                 trackColor={{
//                   false: "#D1D5DB",
//                   true: colors.primaryBlue,
//                 }}
//                 thumbColor="#fff"
//               />
//             </View>

//             <View style={styles.divider} />

//             {/* Logout */}
//             <TouchableOpacity
//               style={styles.menuItem}
//               onPress={handleLogout}
//               activeOpacity={0.7}
//             >
//               <View style={styles.menuIconContainer}>
//                 <FontAwesome6
//                   name="right-from-bracket"
//                   size={18}
//                   color={colors.danger}
//                 />
//               </View>

//               <Text
//                 style={[
//                   styles.menuText,
//                   {
//                     color: colors.danger,
//                   },
//                 ]}
//               >
//                 Logout
//               </Text>
//             </TouchableOpacity>
//           </Pressable>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   /* ================= HEADER ================= */

//   header: {
//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 20,
//     paddingBottom: 12,

//     backgroundColor: "#fff",

//     borderBottomWidth: 1,
//     borderBottomColor: "#eaeaea",
//   },

//   /* ================= LEFT ================= */

//   leftSection: {
//     flex: 1,

//     flexDirection: "row",
//     alignItems: "center",

//     minWidth: 0,
//   },

//   logoContainer: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: colors.primaryBlue,
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 10,
//   },

//   brandContainer: {
//     flex: 1,
//     minWidth: 0,
//   },

//   appName: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: "#111827",
//     lineHeight: 21,
//   },

//   libraryName: {
//     marginTop: 1,
//     fontSize: 12,
//     fontWeight: "500",
//     color: "#6B7280",
//     maxWidth: "100%",
//   },

//   /* ================= RIGHT ================= */

//   rightSection: {
//     flexDirection: "row",
//     alignItems: "center",

//     gap: 10,

//     marginLeft: 10,
//   },

//   profileBtn: {
//     width: 46,
//     height: 46,

//     borderRadius: 23,

//     backgroundColor: colors.primaryBlue,

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   profileInitial: {
//     color: "#fff",
//     fontSize: 18,
//     fontWeight: "700",
//   },

//   settingsBtn: {
//     width: 46,
//     height: 46,

//     borderRadius: 14,

//     backgroundColor: "#EEF4FF",

//     alignItems: "center",
//     justifyContent: "center",
//   },

//   /* ================= OVERLAY ================= */

//   menuOverlay: {
//     flex: 1,

//     backgroundColor: "rgba(0,0,0,0.15)",
//   },

//   /* ================= MENU ================= */

//   menu: {
//     position: "absolute",

//     right: 16,

//     width: 285,

//     backgroundColor: "#fff",

//     borderRadius: 18,

//     overflow: "hidden",

//     shadowColor: "#000",
//     shadowOpacity: 0.15,
//     shadowRadius: 14,

//     shadowOffset: {
//       width: 0,
//       height: 7,
//     },

//     elevation: 8,
//   },

//   /* ================= MENU USER ================= */

//   menuHeaderContainer: {
//     flexDirection: "row",
//     alignItems: "center",

//     paddingHorizontal: 16,
//     paddingVertical: 15,
//   },

//   menuAvatar: {
//     width: 42,
//     height: 42,

//     borderRadius: 21,

//     backgroundColor: colors.primaryBlue,

//     alignItems: "center",
//     justifyContent: "center",

//     marginRight: 12,
//   },

//   menuAvatarText: {
//     color: "#fff",

//     fontSize: 18,
//     fontWeight: "700",
//   },

//   menuUserInfo: {
//     flex: 1,
//     minWidth: 0,
//   },

//   menuHeader: {
//     fontSize: 16,

//     fontWeight: "700",

//     color: "#111827",
//   },

//   menuSubHeader: {
//     marginTop: 2,

//     fontSize: 13,

//     color: "#6B7280",
//   },

//   /* ================= MENU ITEMS ================= */

//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",

//     minHeight: 54,

//     paddingHorizontal: 16,
//   },

//   menuIconContainer: {
//     width: 30,

//     alignItems: "flex-start",
//     justifyContent: "center",
//   },

//   menuText: {
//     flex: 1,

//     fontSize: 16,

//     color: "#333",

//     marginLeft: 4,
//   },

//   divider: {
//     height: 1,

//     backgroundColor: "#EEEEEE",

//     marginVertical: 3,
//   },
// });

import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Switch,
} from "react-native";

import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import { checkLibraryExists } from "../api/library";

import { lightColors, darkColors } from "../theme/colors";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { libraryName, name, signOut } = useAuth();

  const { isDarkMode, setDarkMode } = useTheme();

  const theme = isDarkMode ? darkColors : lightColors;

  const [menuOpen, setMenuOpen] = useState(false);

  const [displayLibraryName, setDisplayLibraryName] = useState(
    libraryName || "Your Library"
  );

  const [displayName, setDisplayName] = useState(name || "Admin User");

  useEffect(() => {
    setDisplayLibraryName(libraryName || "Your Library");

    setDisplayName(name || "Admin User");
  }, [libraryName, name]);

  useEffect(() => {
    checkLibraryExists()
      .then((data) => {
        if (data?.libraryName) {
          setDisplayLibraryName(data.libraryName);
        }

        if (!name && data?.adminName) {
          setDisplayName(data.adminName);
        }
      })
      .catch(() => {});
  }, [libraryName, name]);

  const firstLetter = displayName?.trim()?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
  };

  const handleLanguage = () => {
    setMenuOpen(false);

    // Language screen can be added later.
  };

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 8,
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
      ]}
    >
      {/* LEFT */}
      <View style={styles.leftSection}>
        <View
          style={[
            styles.logoContainer,
            {
              backgroundColor: theme.primaryBlue,
            },
          ]}
        >
          <FontAwesome6 name="book-open" size={18} color="#fff" />
        </View>

        <View style={styles.brandContainer}>
          <Text
            style={[
              styles.appName,
              {
                color: theme.textPrimary,
              },
            ]}
          >
            LibManage
          </Text>

          <Text
            style={[
              styles.libraryName,
              {
                color: theme.textSecondary,
              },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayLibraryName}
          </Text>
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.rightSection}>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={[
            styles.profileBtn,
            {
              backgroundColor: theme.primaryBlue,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.profileInitial}>{firstLetter}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={[
            styles.settingsBtn,
            {
              backgroundColor: theme.bg,
            },
          ]}
          activeOpacity={0.8}
        >
          <FontAwesome6 name="gear" size={21} color={theme.primaryBlue} />
        </TouchableOpacity>
      </View>

      {/* SETTINGS MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuOpen(false)}
        >
          <Pressable
            style={[
              styles.menu,
              {
                top: insets.top + 68,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            {/* USER */}
            <View style={styles.menuHeaderContainer}>
              <View
                style={[
                  styles.menuAvatar,
                  {
                    backgroundColor: theme.primaryBlue,
                  },
                ]}
              >
                <Text style={styles.menuAvatarText}>{firstLetter}</Text>
              </View>

              <View style={styles.menuUserInfo}>
                <Text
                  style={[
                    styles.menuHeader,
                    {
                      color: theme.textPrimary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                <Text
                  style={[
                    styles.menuSubHeader,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayLibraryName}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            {/* LANGUAGE */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLanguage}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  {
                    backgroundColor: theme.bg,
                  },
                ]}
              >
                <FontAwesome6
                  name="globe"
                  size={18}
                  color={theme.textSecondary}
                />
              </View>

              <Text
                style={[
                  styles.menuText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                Language
              </Text>

              <FontAwesome6
                name="chevron-right"
                size={13}
                color={theme.textMuted}
              />
            </TouchableOpacity>

            {/* DARK MODE */}
            <View style={styles.menuItem}>
              <View
                style={[
                  styles.menuIconContainer,
                  {
                    backgroundColor: theme.bg,
                  },
                ]}
              >
                <FontAwesome6
                  name="moon"
                  size={18}
                  color={theme.textSecondary}
                />
              </View>

              <Text
                style={[
                  styles.menuText,
                  {
                    color: theme.textPrimary,
                  },
                ]}
              >
                Dark Mode
              </Text>

              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{
                  false: "#D1D5DB",
                  true: theme.primaryBlue,
                }}
                thumbColor="#fff"
              />
            </View>

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.border,
                },
              ]}
            />

            {/* LOGOUT */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  {
                    backgroundColor: theme.dangerBg,
                  },
                ]}
              >
                <FontAwesome6
                  name="right-from-bracket"
                  size={18}
                  color={theme.danger}
                />
              </View>

              <Text
                style={[
                  styles.menuText,
                  {
                    color: theme.danger,
                  },
                ]}
              >
                Logout
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  brandContainer: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },

  appName: {
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "800",
  },

  libraryName: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
    fontWeight: "500",
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 10,
  },

  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  profileInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  settingsBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  menu: {
    position: "absolute",
    right: 14,
    width: 300,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 8,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  menuHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  menuAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  menuAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  menuUserInfo: {
    flex: 1,
    marginLeft: 12,
  },

  menuHeader: {
    fontSize: 15,
    fontWeight: "700",
  },

  menuSubHeader: {
    fontSize: 12,
    marginTop: 3,
  },

  divider: {
    height: 1,
    marginVertical: 6,
  },

  menuItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
  },
});
