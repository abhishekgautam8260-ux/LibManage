import client from "./client";

// ============================================================
// ADMIN SIGNUP
// ============================================================
// POST /api/auth/signup
//
// Request:
// {
//   name,
//   phone,
//   password
// }
//
// Expected response:
// {
//   token,
//   userType: "ADMIN",
//   userId,
//   name
// }

export async function signup({ name, phone, password }) {
  const res = await client.post("/api/auth/signup", {
    name,
    phone,
    password,
  });

  return res.data;
}

// ============================================================
// ADMIN LOGIN
// ============================================================
// POST /api/auth/login
//
// Request:
// {
//   phone,
//   password
// }
//
// Expected response:
// {
//   token,
//   userType: "ADMIN",
//   userId,
//   name,
//   libraryId,
//   libraryName
// }

export async function login({ phone, password }) {
  const res = await client.post("/api/auth/login", {
    phone,
    password,
  });

  return res.data;
}

// ============================================================
// EMPLOYEE LOGIN
// ============================================================
// POST /api/auth/employee-login
//
// Request:
// {
//   username,
//   password
// }
//
// Expected response:
// {
//   token,
//   userType: "EMPLOYEE",
//   userId,
//   libraryId,
//   role,
//   name
// }

export async function employeeLogin({ username, password }) {
  const res = await client.post("/api/auth/employee-login", {
    username,
    password,
  });

  return res.data;
}

// ============================================================
// OTP VERIFICATION
// ============================================================
// POST /api/auth/verify-otp
//
// Request:
// {
//   otp
// }

export async function verifyOtp(otp) {
  const res = await client.post("/api/auth/verify-otp", {
    otp,
  });

  return res.data;
}
