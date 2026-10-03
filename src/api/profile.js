import client from "./client";

// =========================================================
// GET PROFILE
// =========================================================

export async function getProfile(libraryId) {
  const res = await client.get(`/api/profile/library/${libraryId}`);

  return res.data;
}

// =========================================================
// UPDATE ADMIN PROFILE
// =========================================================

export async function updateAdminProfile({ name }) {
  const res = await client.put("/api/profile/admin", {
    name,
  });

  return res.data;
}

// =========================================================
// UPDATE LIBRARY PROFILE
// =========================================================

export async function updateLibraryProfile({
  libraryId,
  libraryName,
  totalSeats,
}) {
  const res = await client.put(`/api/profile/library/${libraryId}`, {
    libraryName,
    totalSeats,
  });

  return res.data;
}
