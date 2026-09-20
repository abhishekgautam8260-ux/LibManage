import client from "./client";

// Mirrors login.js + new-dashboard.js: GET /api/libraries/exists
// -> { exists, libraryId, libraryName }
export async function checkLibraryExists() {
  const res = await client.get("/api/libraries/exists");
  console.log("checkLibraryExists response:", res.data);
  return res.data;
}

// Mirrors create-library.js: POST /api/libraries { libraryName, totalSeats, logoUrl }
export async function createLibrary({ libraryName, totalSeats, logoUrl }) {
  const res = await client.post("/api/libraries", {
    libraryName,
    totalSeats: Number(totalSeats),
    logoUrl,
  });
  return res.data;
}

// Mirrors header.js: GET /api/header -> { libraryName, adminName, logoUrl }
export async function getHeaderInfo() {
  const res = await client.get("/api/header");
  return res.data;
}
