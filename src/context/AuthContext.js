import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { checkLibraryExists } from "../api/library";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // =========================================================
  // AUTH
  // =========================================================

  const [token, setToken] = useState(null);

  // =========================================================
  // LIBRARY
  // =========================================================

  const [libraryId, setLibraryId] = useState(null);
  const [libraryName, setLibraryName] = useState(null);
  const [hasLibrary, setHasLibrary] = useState(null);

  // =========================================================
  // USER
  // =========================================================

  const [userType, setUserType] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(null);

  // =========================================================
  // LOADING
  // =========================================================

  const [loading, setLoading] = useState(true);

  // =========================================================
  // BOOTSTRAP
  // =========================================================

  const bootstrap = useCallback(async () => {
    setLoading(true);

    try {
      console.log("🔄 Restoring authentication...");

      const storedToken = await AsyncStorage.getItem("TOKEN");

      // =====================================================
      // NO TOKEN
      // =====================================================

      if (!storedToken) {
        console.log("ℹ️ No stored token");

        setToken(null);

        setLibraryId(null);
        setLibraryName(null);
        setHasLibrary(null);

        setUserType(null);
        setRole(null);
        setUserId(null);
        setName(null);

        return;
      }

      // =====================================================
      // TOKEN
      // =====================================================

      setToken(storedToken);

      // =====================================================
      // USER DATA
      // =====================================================

      const storedUserType = await AsyncStorage.getItem("USER_TYPE");

      const storedRole = await AsyncStorage.getItem("ROLE");

      const storedUserId = await AsyncStorage.getItem("USER_ID");

      const storedName = await AsyncStorage.getItem("USER_NAME");

      setUserType(storedUserType);

      setRole(storedRole);

      setUserId(storedUserId ? Number(storedUserId) : null);

      setName(storedName);

      // =====================================================
      // STORED LIBRARY
      // =====================================================

      const storedLibraryId = await AsyncStorage.getItem("LIBRARY_ID");

      const storedLibraryName = await AsyncStorage.getItem("LIBRARY_NAME");

      if (storedLibraryId && !Number.isNaN(Number(storedLibraryId))) {
        setLibraryId(Number(storedLibraryId));
      } else {
        setLibraryId(null);
      }

      if (storedLibraryName) {
        setLibraryName(storedLibraryName);
      } else {
        setLibraryName(null);
      }

      // =====================================================
      // ADMIN
      // =====================================================

      if (storedUserType === "ADMIN") {
        console.log("👑 Restoring ADMIN session");

        try {
          const data = await checkLibraryExists();

          console.log("🏢 Library check:", data);

          // -------------------------------------------------
          // LIBRARY EXISTS
          // -------------------------------------------------

          if (
            data?.exists === true &&
            data?.libraryId !== undefined &&
            data?.libraryId !== null
          ) {
            const id = Number(data.libraryId);

            if (!Number.isNaN(id)) {
              console.log("✅ Setting library ID:", id);

              await AsyncStorage.setItem("LIBRARY_ID", String(id));

              await AsyncStorage.setItem(
                "LIBRARY_NAME",
                data.libraryName || ""
              );

              setLibraryId(id);

              setLibraryName(data.libraryName || null);

              setHasLibrary(true);
            } else {
              console.log("❌ Invalid library ID:", data.libraryId);

              setLibraryId(null);
              setLibraryName(null);
              setHasLibrary(false);
            }
          } else {
            // ------------------------------------------------
            // NO LIBRARY
            // ------------------------------------------------

            console.log("ℹ️ Admin does not have a library yet.");

            await AsyncStorage.removeItem("LIBRARY_ID");

            await AsyncStorage.removeItem("LIBRARY_NAME");

            setLibraryId(null);

            setLibraryName(null);

            setHasLibrary(false);
          }
        } catch (error) {
          console.log("❌ Admin library check failed:", error);

          /*
           * Don't destroy the authentication session
           * because the library API temporarily failed.
           */

          const existingLibraryId = await AsyncStorage.getItem("LIBRARY_ID");

          if (existingLibraryId && !Number.isNaN(Number(existingLibraryId))) {
            setLibraryId(Number(existingLibraryId));

            setHasLibrary(true);
          } else {
            setLibraryId(null);

            setHasLibrary(false);
          }
        }

        return;
      }

      // =====================================================
      // EMPLOYEE
      // =====================================================

      if (storedUserType === "EMPLOYEE") {
        console.log("👤 Restoring EMPLOYEE session");

        const employeeLibraryId = await AsyncStorage.getItem("LIBRARY_ID");

        if (employeeLibraryId && !Number.isNaN(Number(employeeLibraryId))) {
          setLibraryId(Number(employeeLibraryId));

          setHasLibrary(true);
        } else {
          setLibraryId(null);

          setHasLibrary(false);
        }

        return;
      }

      // =====================================================
      // UNKNOWN USER
      // =====================================================

      console.log("⚠️ Unknown user type:", storedUserType);

      throw new Error("Authentication data is incomplete.");
    } catch (error) {
      console.log("❌ Auth bootstrap failed:", error);

      await AsyncStorage.multiRemove([
        "TOKEN",
        "LIBRARY_ID",
        "LIBRARY_NAME",
        "USER_TYPE",
        "ROLE",
        "USER_ID",
        "USER_NAME",
      ]);

      setToken(null);

      setLibraryId(null);
      setLibraryName(null);
      setHasLibrary(null);

      setUserType(null);
      setRole(null);
      setUserId(null);
      setName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // =========================================================
  // SIGN IN
  // =========================================================

  const signIn = async (loginData) => {
    // =======================================================
    // BACKWARD COMPATIBILITY
    // =======================================================

    if (typeof loginData === "string") {
      await AsyncStorage.setItem("TOKEN", loginData);

      setToken(loginData);

      await bootstrap();

      return;
    }

    // =======================================================
    // EXTRACT RESPONSE
    // =======================================================

    const {
      token: newToken,
      userType: newUserType,
      userId: newUserId,
      libraryId: newLibraryId,
      role: newRole,
      name: newName,
      libraryName: newLibraryName,
    } = loginData || {};

    // =======================================================
    // VALIDATE TOKEN
    // =======================================================

    if (!newToken) {
      throw new Error("Authentication token is missing.");
    }

    // =======================================================
    // VALIDATE USER TYPE
    // =======================================================

    if (!newUserType) {
      throw new Error("User type is missing from authentication response.");
    }

    console.log("🔐 Signing in:", {
      userType: newUserType,
      userId: newUserId,
      libraryId: newLibraryId,
      role: newRole,
      name: newName,
    });

    // =======================================================
    // SAVE TOKEN
    // =======================================================

    await AsyncStorage.setItem("TOKEN", newToken);

    // =======================================================
    // SAVE USER TYPE
    // =======================================================

    await AsyncStorage.setItem("USER_TYPE", newUserType);

    // =======================================================
    // SAVE USER ID
    // =======================================================

    if (newUserId !== undefined && newUserId !== null) {
      await AsyncStorage.setItem("USER_ID", String(newUserId));
    } else {
      await AsyncStorage.removeItem("USER_ID");
    }

    // =======================================================
    // SAVE ROLE
    // =======================================================

    if (newRole) {
      await AsyncStorage.setItem("ROLE", newRole);
    } else {
      await AsyncStorage.removeItem("ROLE");
    }

    // =======================================================
    // SAVE NAME
    // =======================================================

    if (newName) {
      await AsyncStorage.setItem("USER_NAME", newName);
    } else {
      await AsyncStorage.removeItem("USER_NAME");
    }

    // =======================================================
    // UPDATE AUTH STATE
    // =======================================================

    setToken(newToken);

    setUserType(newUserType);

    setUserId(
      newUserId !== undefined && newUserId !== null ? Number(newUserId) : null
    );

    setRole(newRole || null);

    setName(newName || null);

    // =======================================================
    // LIBRARY FROM LOGIN RESPONSE
    // =======================================================

    if (
      newLibraryId !== undefined &&
      newLibraryId !== null &&
      !Number.isNaN(Number(newLibraryId))
    ) {
      const id = Number(newLibraryId);

      await AsyncStorage.setItem("LIBRARY_ID", String(id));

      setLibraryId(id);

      setHasLibrary(true);
    } else {
      /*
       * IMPORTANT:
       *
       * Do NOT set NaN.
       */

      await AsyncStorage.removeItem("LIBRARY_ID");

      setLibraryId(null);

      // =====================================================
      // ADMIN WITHOUT LIBRARY
      // =====================================================

      if (newUserType === "ADMIN") {
        console.log("🏢 Checking admin library...");

        try {
          const data = await checkLibraryExists();

          console.log("🏢 Library check:", data);

          if (
            data?.exists === true &&
            data?.libraryId !== undefined &&
            data?.libraryId !== null
          ) {
            const id = Number(data.libraryId);

            if (!Number.isNaN(id)) {
              await AsyncStorage.setItem("LIBRARY_ID", String(id));

              await AsyncStorage.setItem(
                "LIBRARY_NAME",
                data.libraryName || ""
              );

              setLibraryId(id);

              setLibraryName(data.libraryName || null);

              setHasLibrary(true);

              console.log("✅ Admin library loaded:", id);
            } else {
              setLibraryId(null);

              setLibraryName(null);

              setHasLibrary(false);
            }
          } else {
            setLibraryId(null);

            setLibraryName(null);

            setHasLibrary(false);
          }
        } catch (error) {
          console.log("❌ Library check after login failed:", error);

          setLibraryId(null);

          setLibraryName(null);

          setHasLibrary(false);
        }
      }

      // =====================================================
      // EMPLOYEE WITHOUT LIBRARY
      // =====================================================

      if (newUserType === "EMPLOYEE") {
        setLibraryId(null);

        setHasLibrary(false);
      }
    }

    // =======================================================
    // LIBRARY NAME
    // =======================================================

    if (newLibraryName !== undefined && newLibraryName !== null) {
      await AsyncStorage.setItem("LIBRARY_NAME", newLibraryName || "");

      setLibraryName(newLibraryName || null);
    }

    // =======================================================
    // FINISH
    // =======================================================

    setLoading(false);

    console.log("✅ Auth state updated successfully");
  };

  // =========================================================
  // SET LIBRARY
  // =========================================================

  const setLibrary = async (id, libName) => {
    const numericId = Number(id);

    if (id === undefined || id === null || Number.isNaN(numericId)) {
      console.log("❌ Invalid library ID:", id);

      return;
    }

    await AsyncStorage.setItem("LIBRARY_ID", String(numericId));

    await AsyncStorage.setItem("LIBRARY_NAME", libName || "");

    setLibraryId(numericId);

    setLibraryName(libName || null);

    setHasLibrary(true);

    console.log("🏢 Library selected:", {
      id: numericId,
      name: libName,
    });
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const signOut = async () => {
    await AsyncStorage.multiRemove([
      "TOKEN",
      "LIBRARY_ID",
      "LIBRARY_NAME",
      "USER_TYPE",
      "ROLE",
      "USER_ID",
      "USER_NAME",
    ]);

    setToken(null);

    setLibraryId(null);
    setLibraryName(null);
    setHasLibrary(null);

    setUserType(null);
    setRole(null);
    setUserId(null);
    setName(null);
  };

  // =========================================================
  // ROLE HELPERS
  // =========================================================

  const isAdmin = userType === "ADMIN";

  const isEmployee = userType === "EMPLOYEE";

  const isManager = isEmployee && role === "MANAGER";

  const isReceptionist = isEmployee && role === "RECEPTIONIST";

  const isAccountant = isEmployee && role === "ACCOUNTANT";

  // =========================================================
  // PERMISSIONS
  // =========================================================

  const canCreateStudent = isAdmin || isManager || isReceptionist;

  const canEditStudent = isAdmin || isManager || isReceptionist;

  const canDeleteStudent = isAdmin || isManager;

  const canManageSeats = isAdmin || isManager || isReceptionist;

  const canManageBilling = isAdmin || isManager || isAccountant;

  const canManageEmployees = isAdmin;

  const canManageLibrarySettings = isAdmin;

  const canManageAdminProfile = isAdmin;

  const canViewDashboard = isAdmin || isManager || isReceptionist;

  const canViewStudents = isAdmin || isManager || isReceptionist;

  // =========================================================
  // PROVIDER
  // =========================================================

  return (
    <AuthContext.Provider
      value={{
        // AUTH
        token,

        // USER
        userType,
        userId,
        name,
        role,

        // LIBRARY
        libraryId,
        libraryName,
        hasLibrary,

        // APP
        loading,

        // ACTIONS
        signIn,
        signOut,
        refresh: bootstrap,

        // LIBRARY
        setLibrary,

        // ROLE
        isAdmin,
        isEmployee,
        isManager,
        isReceptionist,
        isAccountant,

        // PERMISSIONS
        canViewDashboard,
        canViewStudents,

        canCreateStudent,
        canEditStudent,
        canDeleteStudent,

        canManageSeats,
        canManageBilling,

        canManageEmployees,
        canManageLibrarySettings,
        canManageAdminProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================
// useAuth
// =========================================================

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
