import client from "./client";

// Subscription API contract: docs/subscription-api-contract.md

export async function getSubscription(libraryId) {
  const response = await client.get(`/api/subscriptions/library/${libraryId}`);
  return response.data;
}

// Idempotently create the library's five-day trial if no subscription exists.
export async function startSubscriptionTrial(libraryId) {
  const response = await client.post(
    `/api/subscriptions/library/${libraryId}/trial`,
    {}
  );
  return response.data;
}

export async function renewSubscription(libraryId, planCode) {
  const response = await client.post(
    `/api/subscriptions/library/${libraryId}/renew`,
    { planCode }
  );
  return response.data;
}

export async function getSubscriptionHistory(libraryId) {
  const response = await client.get(
    `/api/subscriptions/library/${libraryId}/history`
  );
  return response.data;
}
