import client from "./client";

// ============================================================
// GET BILLING SUMMARY
// ============================================================

export async function getBillingSummary(libraryId, year, month) {
  const res = await client.get(`/api/billing/summary/${libraryId}`, {
    params: {
      year,
      month,
    },
  });

  return res.data;
}

// ============================================================
// GET ALL EXPENSES
// ============================================================

export async function getExpenses(libraryId) {
  const res = await client.get(`/api/billing/expenses/library/${libraryId}`);

  return res.data;
}

// ============================================================
// CREATE EXPENSE
// ============================================================

export async function createExpense(
  libraryId,
  { category, amount, expenseDate, status, comment }
) {
  const res = await client.post(`/api/expenses/library/${libraryId}`, {
    category: category || "Other",

    amount: parseInt(amount, 10),

    expenseDate,

    status: status || "PAID",

    comment: comment?.trim() || "",
  });

  return res.data;
}

// ============================================================
// UPDATE EXPENSE
// ============================================================

export async function updateExpense(
  expenseId,
  libraryId,
  { category, amount, expenseDate, status, comment }
) {
  const res = await client.put(
    `/api/billing/expenses/${expenseId}/library/${libraryId}`,
    {
      category: category || "Other",

      amount: parseInt(amount, 10),

      expenseDate,

      status: status || "PAID",

      comment: comment?.trim() || "",
    }
  );

  return res.data;
}

// ============================================================
// DELETE EXPENSE
// ============================================================

export async function deleteExpense(expenseId, libraryId) {
  const res = await client.delete(
    `/api/billing/expenses/${expenseId}/library/${libraryId}`
  );

  return res.data;
}
