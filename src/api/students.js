import client from "./client";

// ⚠️ INFERRED FILE — your real `students.js` was not included in the upload,
// so these endpoints are inferred from students.html's fields (Seat, Student,
// Phone, EndDate, Payment, Action + edit modal + seat-change timeline) and
// from the naming pattern used consistently elsewhere (e.g. halfday.js uses
// `/api/student/halfday/library/{id}`, so full-day students likely mirror
// that as `/api/student/library/{id}`).
//
// >>> Please send me the real students.js and I will correct any endpoint,
// >>> field name, or response shape that doesn't match your backend. <<<

// Full-day + all students list for a library.
// Assumed: GET /api/student/library/{libraryId}
export async function getStudents(libraryId) {
  const res = await client.get(`/api/student/library/${libraryId}`);
  return res.data; // expected: [{ id, name, phone, seatNumber, expireDate, amountPaid, bookingDate, status }]
}

// Seat-change history for a single student (drives the "Seat Change History"
// timeline shown in the right panel of students.html).
// Assumed: GET /api/student/{studentId}/seat-history
export async function getSeatChangeHistory(studentId, libraryId) {
  const res = await client.get(
    `/api/student/${studentId}/seat-history/library/${libraryId}`
  );
  return res.data; // expected: [{ date, fromSeat, toSeat, note }]
}

// Update a student's details from the Edit modal (Name / Phone / Seat / EndDate).
// Reuses the same shape as dashboard.js's updateStudent — same backend entity.
export async function updateStudentRecord(
  studentId,
  { name, phone, seatNumber, endDate }
) {
  const res = await client.put(`/api/student/${studentId}`, {
    name,
    phone,
    seatNumber: parseInt(seatNumber, 10),
    expireDate: endDate,
  });
  return res.data;
}

// Create a new full-day student (the "+ Add New Student" button).
// Assumed to mirror halfday.js's create pattern.
export async function createStudent(
  libraryId,
  { name, phone, seatNumber, amountPaid, endDate }
) {
  const res = await client.post(`/api/student/create/library/${libraryId}`, {
    name,
    phone,
    seatNumber: parseInt(seatNumber, 10),
    amountPaid,
    expireDate: endDate,
    studentType: "FULL_DAY",
  });
  return res.data;
}

// Export students to Excel. Assumed: GET returns a file (xlsx) as a blob/binary.
// In RN this needs `expo-file-system` to save the response to disk — left as
// a clearly-marked TODO since it depends on your exact backend response type.
export async function exportStudentsExcel(libraryId) {
  const res = await client.get(`/api/student/export/library/${libraryId}`, {
    responseType: "arraybuffer",
  });
  return res.data;
}

// Import students from an Excel file. Assumed multipart upload.
export async function importStudentsExcel(libraryId, fileUri, fileName) {
  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName || "students.xlsx",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const res = await client.post(
    `/api/student/import/library/${libraryId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return res.data;
}

export async function getStudentsPaginated(
  libraryId,
  { page = 0, search = "", status = "ALL" } = {}
) {
  const res = await client.get(`/api/student/library/${libraryId}/page`, {
    params: {
      page,
      size: 10,
      status,
      search: search.trim(),
    },
  });

  return res.data;
}
