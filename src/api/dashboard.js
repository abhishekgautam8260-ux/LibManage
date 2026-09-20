import client from "./client";

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getDashboardStats(libraryId) {
  console.log("🔍 Calling Dashboard API with libraryId:", libraryId);

  try {
    const res = await client.get(`/api/dashboards/${libraryId}`);

    console.log("✅ Dashboard API response:", res.status, res.data);

    return res.data;
  } catch (err) {
    console.error("❌ Dashboard API FAILED");

    console.error("Status:", err?.response?.status);

    console.error("URL:", err?.config?.url);

    console.error("Base URL:", err?.config?.baseURL);

    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// GET SEATS FOR LIBRARY
// ============================================================

export async function getSeats(libraryId) {
  const res = await client.get(`/api/seats/library/${libraryId}`);

  return res.data;
}

// ============================================================
// GET ALL SEATS
// ============================================================

export async function getAllSeats() {
  const res = await client.get("/api/seats");

  return res.data;
}

// ============================================================
// BOOK SEAT
// ============================================================

export async function bookSeat({
  libraryId,
  seatNumber,
  name,
  phone,
  amountPaid,
  studentType = "FULL_DAY",
  holdId = null,
}) {
  console.log("📦 Booking:", {
    libraryId,
    seatNumber,
    name,
    phone,
    amountPaid,
    studentType,
    holdId,
  });

  const res = await client.post("/api/book", {
    libraryId,
    seatNumber,
    name,
    phone,
    amountPaid,
    studentType,
    holdId,
  });

  return res.data;
}
// ============================================================
// VACATE SEAT
// ============================================================

export async function vacateSeat(libraryId, seatNumber) {
  const res = await client.post(
    `/api/vacate/libraryId/${libraryId}/seatId/${seatNumber}`
  );

  return res.data;
}

// ============================================================
// GET STUDENT BY SEAT
// ============================================================

export async function getStudentBySeat(seatNumber, libraryId) {
  const res = await client.get(
    `/api/student/seat/${seatNumber}/library/${libraryId}`
  );

  return res.data;
}

// ============================================================
// UPDATE STUDENT
// ============================================================

export const updateStudent = async (currentSeatNumber, libraryId, payload) => {
  console.log("📝 Updating student:", {
    currentSeatNumber,
    libraryId,
    payload,
  });

  const response = await client.put(
    `/api/student/${currentSeatNumber}/library/${libraryId}`,
    payload
  );

  return response.data;
};

// ============================================================
// RENEW STUDENT
// ============================================================

export async function renewStudent(studentId) {
  console.log("🔄 Renewing student:", studentId);

  try {
    const response = await client.post(`/api/student/${studentId}/renew`);

    console.log("✅ Renew response:", response.status, response.data);

    return response.data;
  } catch (err) {
    console.error("❌ Renew student failed");

    console.error("Status:", err?.response?.status);

    console.error("URL:", err?.config?.url);

    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// HOLD ALERT
// ============================================================

export async function holdStudentAlert(studentId, days) {
  console.log("⏸️ Holding student alert:", {
    studentId,
    days,
  });

  try {
    const response = await client.post(`/api/student/${studentId}/hold`, {
      days,
    });

    console.log("✅ Hold response:", response.status, response.data);

    return response.data;
  } catch (err) {
    console.error("❌ Hold student alert failed");

    console.error("Status:", err?.response?.status);

    console.error("URL:", err?.config?.url);

    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// SEAT HOLD
// ============================================================

export async function holdSeat({ libraryId, seatNumber, name, phone, days }) {
  console.log("⏸️ Holding seat:", {
    libraryId,
    seatNumber,
    name,
    phone,
    days,
  });

  try {
    const res = await client.post("/api/seat-holds", {
      libraryId,
      seatNumber,
      name,
      phone,
      days,
    });

    console.log("✅ Seat hold created:", res.status, res.data);

    return res.data;
  } catch (err) {
    console.error("❌ Seat hold failed");
    console.error("Status:", err?.response?.status);
    console.error("URL:", err?.config?.url);
    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// GET CURRENT SEAT HOLD
// ============================================================

export async function getSeatHold(libraryId, seatNumber) {
  try {
    const res = await client.get(
      `/api/seat-holds/library/${libraryId}/seat/${seatNumber}`
    );

    return res.data;
  } catch (err) {
    // 404 simply means the seat currently has no active hold.
    if (err?.response?.status === 404) {
      return null;
    }

    console.error("❌ Failed to get seat hold:", err);

    throw err;
  }
}

// ============================================================
// CANCEL SEAT HOLD
// ============================================================

export async function cancelSeatHold(holdId) {
  console.log("❌ Cancelling seat hold:", holdId);

  try {
    const res = await client.delete(`/api/seat-holds/${holdId}`);

    console.log("✅ Seat hold cancelled:", res.status, res.data);

    return res.data;
  } catch (err) {
    console.error("❌ Failed to cancel seat hold");
    console.error("Status:", err?.response?.status);
    console.error("URL:", err?.config?.url);
    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// EXPIRED SEAT HOLD ALERTS
// ============================================================

export async function getSeatHoldAlerts(libraryId) {
  try {
    const res = await client.get(`/api/seat-holds/alerts/${libraryId}`);

    console.log("🚨 Seat hold alerts:", res.data);

    return res.data || [];
  } catch (err) {
    console.error("❌ Failed to load seat hold alerts");
    console.error("Status:", err?.response?.status);
    console.error("URL:", err?.config?.url);
    console.error("Response:", err?.response?.data);

    throw err;
  }
}

// ============================================================
// GET EXPIRING STUDENTS
// ============================================================

export async function getExpiringAlerts(libraryId) {
  const res = await client.get(`/api/student/expiring-soon/${libraryId}`);

  return res.data;
}

// ============================================================
// GET EXPIRED STUDENTS
// ============================================================

export async function getExpiredAlerts(libraryId) {
  const res = await client.get(`/api/student/expired/${libraryId}`);

  return res.data;
}

// ============================================================
// GET HELD ALERTS
// ============================================================

export async function getHeldAlerts(libraryId) {
  const res = await client.get(`/api/student/held-alerts/${libraryId}`);

  return res.data;
}

// ============================================================
// GET ALL DASHBOARD ALERTS
// ============================================================

export async function getExpiryAlerts(libraryId) {
  console.log("🚨 Loading subscription + seat hold alerts:", libraryId);

  try {
    const [expired, expiring, held, seatHoldAlerts] = await Promise.all([
      getExpiredAlerts(libraryId),
      getExpiringAlerts(libraryId),
      getHeldAlerts(libraryId),
      getSeatHoldAlerts(libraryId),
    ]);

    console.log("🔴 Expired:", expired);
    console.log("🟠 Expiring:", expiring);
    console.log("⏸️ Student Held:", held);
    console.log("🪑 Seat Hold Expired:", seatHoldAlerts);

    return [...expired, ...expiring, ...held, ...seatHoldAlerts];
  } catch (err) {
    console.error("❌ Failed to load dashboard alerts");

    console.error("Status:", err?.response?.status);

    console.error("URL:", err?.config?.url);

    console.error("Response:", err?.response?.data);

    throw err;
  }
}

export async function getActiveSeatHolds(libraryId) {
  const res = await client.get(`/api/seat-holds/library/${libraryId}/active`);

  return res.data || [];
}
