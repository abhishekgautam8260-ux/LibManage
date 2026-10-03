import client from "./client";

// Mirrors halfday.js: GET /api/student/halfday/library/{libraryId}
export async function getHalfDayStudents(libraryId) {
  const res = await client.get(`/api/student/halfday/library/${libraryId}`);
  return res.data; // [{ id, name, phone, halfDaySlot, expiryDate, amount, startDate }]
}

// Mirrors createHalfDayStudent(): POST /api/student/create/library/{libraryId}
export async function createHalfDayStudent(
  libraryId,
  { name, phone, amount, halfDaySlot }
) {
  const res = await client.post(`/api/student/create/library/${libraryId}`, {
    name,
    phone,
    amount: parseInt(amount, 10),
    studentType: "HALF_DAY",
    halfDaySlot,
  });
  return res.data;
}

export const updateHalfDayStudent = async (studentId, payload) => {
  const response = await client.put(
    `/api/student/halfday/${studentId}`,
    payload
  );

  return response.data;
};

// halfday.js references a `vacate(id)` call on the table row but never
// defines it in the file you shared — assumed to reuse the same vacate
// pattern as the full-day flow (POST /api/vacate/{seatNumber}), but for
// half-day students without seats this may instead be a DELETE by id.
// Verify against your backend once you share the missing piece.
export async function vacateHalfDayStudent(studentId) {
  const res = await client.delete(`/api/student/halfday/${studentId}`);

  return res.data;
}
