import AsyncStorage from "@react-native-async-storage/async-storage";

const HOST_URL = "http://192.168.31.27:8080";
// 🔥 IMPORTANT:
// Replace this with the same backend URL you are already using
// in your other API files.

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem("TOKEN");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function handleResponse(response) {
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.message || data?.error || "Something went wrong";

    throw new Error(message);
  }

  return data;
}

// =========================================================
// GET ALL EMPLOYEES
// =========================================================

export async function getEmployees(libraryId) {
  if (!libraryId) {
    throw new Error("Library ID is required");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/library/${libraryId}`,
    {
      method: "GET",
      headers,
    }
  );

  return handleResponse(response);
}

// =========================================================
// CREATE EMPLOYEE
// =========================================================

export async function createEmployee(libraryId, payload) {
  if (!libraryId) {
    throw new Error("Library ID is required");
  }

  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/library/${libraryId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
}

// =========================================================
// GET SINGLE EMPLOYEE
// =========================================================

export async function getEmployee(employeeId, libraryId) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/${employeeId}/library/${libraryId}`,
    {
      method: "GET",
      headers,
    }
  );

  return handleResponse(response);
}

// =========================================================
// UPDATE EMPLOYEE
// =========================================================

export async function updateEmployee(employeeId, libraryId, payload) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/${employeeId}/library/${libraryId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(payload),
    }
  );

  return handleResponse(response);
}

// =========================================================
// ACTIVATE / DEACTIVATE
// =========================================================

export async function updateEmployeeStatus(employeeId, libraryId, active) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/${employeeId}/library/${libraryId}/status?active=${active}`,
    {
      method: "PATCH",
      headers,
    }
  );

  return handleResponse(response);
}

// =========================================================
// DELETE EMPLOYEE
// =========================================================

export async function deleteEmployee(employeeId, libraryId) {
  const headers = await getAuthHeaders();

  const response = await fetch(
    `${HOST_URL}/api/employees/${employeeId}/library/${libraryId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  return handleResponse(response);
}
