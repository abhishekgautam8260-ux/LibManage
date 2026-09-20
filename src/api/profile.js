import client from "./client";

// Mirrors profile.js: GET /api/profile/library/{libraryId}
export async function getProfile(libraryId) {
  const res = await client.get(`/api/profile/library/${libraryId}`);
  return res.data; // { adminName, adminPhone, libraryName, totalSeats }
}
