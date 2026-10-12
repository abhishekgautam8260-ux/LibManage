import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { SUBSCRIPTION_API_ENABLED } from "../api/config";
import {
  getSubscription,
  renewSubscription as renewSubscriptionRequest,
  startSubscriptionTrial,
} from "../api/subscriptions";

const SubscriptionContext = createContext(null);
const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_DAYS = 5;

export const MOCK_PLANS = [
  { id: "MONTHLY", name: "Monthly", durationMonths: 1, price: 4999 },
  { id: "QUARTERLY", name: "Quarterly", durationMonths: 3, price: 12999 },
  { id: "YEARLY", name: "Yearly", durationMonths: 12, price: 29999 },
];

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function addMonths(value, months) {
  const date = new Date(value);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() < originalDay) date.setDate(0);
  return date;
}

function makeTrial() {
  const now = new Date();
  return {
    status: "TRIAL",
    planId: "TRIAL",
    planName: "Free 5-day demo",
    price: 0,
    startedAt: now.toISOString(),
    expiresAt: addDays(now, 5).toISOString(),
    renewedAt: null,
  };
}

export function SubscriptionProvider({ children }) {
  const { libraryId, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (authLoading) return;
      if (!libraryId) {
        setSubscription(null);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      setSubscriptionError("");
      if (SUBSCRIPTION_API_ENABLED) {
        try {
          let dto;
          try {
            dto = await getSubscription(libraryId);
          } catch (error) {
            if (error?.response?.status !== 404) throw error;
            dto = await startSubscriptionTrial(libraryId);
          }
          if (!dto?.status || !dto?.expiresAt) {
            throw new Error(
              "The subscription API returned an incomplete response."
            );
          }
          if (active)
            setSubscription({ ...dto, planId: dto.planCode, source: "API" });
        } catch (error) {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Could not load subscription from the server.";
          if (active) {
            setSubscription(null);
            setSubscriptionError(message);
          }
        } finally {
          if (active) setSubscriptionLoading(false);
        }
        return;
      }

      const storageKey = `MOCK_SUBSCRIPTION_${libraryId}`;
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        let value = stored ? JSON.parse(stored) : null;
        if (!value?.status || !value?.expiresAt) {
          value = makeTrial();
          await AsyncStorage.setItem(storageKey, JSON.stringify(value));
        }
        if (active) setSubscription(value);
      } catch (error) {
        console.warn(
          "Could not load mock subscription; starting a demo trial.",
          error
        );
        const trial = makeTrial();
        if (active) setSubscription(trial);
      } finally {
        if (active) setSubscriptionLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [libraryId, authLoading]);

  const renewSubscription = useCallback(
    async (planId) => {
      const plan = MOCK_PLANS.find((item) => item.id === planId);
      if (!plan || !libraryId)
        throw new Error("Choose a valid subscription plan.");

      if (SUBSCRIPTION_API_ENABLED) {
        const dto = await renewSubscriptionRequest(libraryId, planId);
        if (!dto?.status || !dto?.expiresAt) {
          throw new Error(
            "The subscription API returned an incomplete response."
          );
        }
        const next = { ...dto, planId: dto.planCode, source: "API" };
        setSubscription(next);
        setSubscriptionError("");
        setNow(Date.now());
        return next;
      }

      const startedAt = new Date();
      const next = {
        status: "ACTIVE",
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        startedAt: startedAt.toISOString(),
        expiresAt: addMonths(startedAt, plan.durationMonths).toISOString(),
        renewedAt: startedAt.toISOString(),
      };
      await AsyncStorage.setItem(
        `MOCK_SUBSCRIPTION_${libraryId}`,
        JSON.stringify(next)
      );
      setSubscription(next);
      setNow(Date.now());
      return next;
    },
    [libraryId]
  );

  const subscriptionInfo = useMemo(() => {
    if (!subscription) {
      return {
        phase: "UNAVAILABLE",
        isLocked: SUBSCRIPTION_API_ENABLED,
        showProfileNotice: false,
        daysToExpiry: null,
        graceEndsAt: null,
        subscriptionError,
      };
    }

    if (subscription.source === "API") {
      const phase = subscription.status;
      const isLocked = Boolean(subscription.accessLocked);
      const daysToExpiry = Number.isFinite(subscription.daysToExpiry)
        ? subscription.daysToExpiry
        : Math.ceil(
            (new Date(subscription.expiresAt).getTime() - now) / DAY_MS
          );
      const graceEndsAt = subscription.graceEndsAt || null;
      return {
        phase,
        isLocked,
        daysToExpiry,
        graceEndsAt,
        graceDaysRemaining: subscription.graceDaysRemaining ?? null,
        showProfileNotice:
          ((phase === "TRIAL" || phase === "ACTIVE") && daysToExpiry <= 3) ||
          phase === "GRACE" ||
          phase === "EXPIRED",
        subscriptionError: "",
      };
    }

    const expiry = new Date(subscription.expiresAt).getTime();
    const daysToExpiry = Math.ceil((expiry - now) / DAY_MS);
    const isTrial = subscription.status === "TRIAL";
    const graceEndsAt = isTrial
      ? null
      : addDays(subscription.expiresAt, GRACE_DAYS);
    const graceDaysRemaining = graceEndsAt
      ? Math.max(0, Math.ceil((new Date(graceEndsAt).getTime() - now) / DAY_MS))
      : null;
    const isLocked = isTrial
      ? now >= expiry
      : now >= new Date(graceEndsAt).getTime();
    const phase = isTrial
      ? now >= expiry
        ? "TRIAL_EXPIRED"
        : "TRIAL"
      : now < expiry
      ? "ACTIVE"
      : isLocked
      ? "EXPIRED"
      : "GRACE";

    return {
      phase,
      isLocked,
      daysToExpiry,
      graceEndsAt,
      graceDaysRemaining,
      showProfileNotice:
        (isTrial && daysToExpiry <= 3) ||
        (!isTrial &&
          (daysToExpiry <= 3 || phase === "GRACE" || phase === "EXPIRED")),
      subscriptionError: "",
    };
  }, [subscription, now, subscriptionError]);

  const value = {
    subscription,
    subscriptionLoading,
    renewSubscription,
    ...subscriptionInfo,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const value = useContext(SubscriptionContext);
  if (!value) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return value;
}
