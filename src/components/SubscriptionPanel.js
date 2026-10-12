import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { lightColors, darkColors, radius } from "../theme/colors";
import { MOCK_PLANS } from "../context/SubscriptionContext";
import { SUBSCRIPTION_API_ENABLED } from "../api/config";

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export function SubscriptionNotice({ status }) {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  if (!status?.showProfileNotice) return null;

  let title;
  let description;
  if (status.phase === "TRIAL") {
    title = status.daysToExpiry <= 1 ? "Your free demo ends soon" : `Your free demo ends in ${status.daysToExpiry} days`;
    description = "Choose a plan in Subscription to keep using the account.";
  } else if (status.phase === "ACTIVE") {
    title = status.daysToExpiry <= 1 ? "Your subscription expires soon" : `Your subscription expires in ${status.daysToExpiry} days`;
    description = "Renew from the Subscription section to avoid interruption.";
  } else if (status.phase === "GRACE") {
    title = "Your subscription has expired";
    description = `${status.graceDaysRemaining} grace days remain. Renew to keep your account active.`;
  } else {
    title = "Your subscription has expired";
    description = "Account access is paused. Renew your plan to restore access.";
  }

  return (
    <View style={[styles.notice, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
      <FontAwesome6 name="triangle-exclamation" size={17} color={colors.warning} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.noticeTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );
}

export default function SubscriptionPanel({
  subscription,
  status,
  onRenew,
  isLocked,
}) {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? darkColors : lightColors;
  const localStyles = makeStyles(colors);
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY");
  const [renewing, setRenewing] = useState(false);
  const [message, setMessage] = useState("");

  const renew = async () => {
    try {
      setRenewing(true);
      await onRenew(selectedPlan);
      setMessage(SUBSCRIPTION_API_ENABLED
        ? "Subscription updated by the server."
        : "Demo renewal activated. No payment was processed.");
    } catch (error) {
      setMessage(error?.message || "Could not renew the demo subscription.");
    } finally {
      setRenewing(false);
    }
  };

  const statusLabel = {
    TRIAL: "Free demo",
    TRIAL_EXPIRED: "Demo expired",
    ACTIVE: "Active",
    GRACE: "Grace period",
    EXPIRED: "Access paused",
  }[status.phase] || "Unavailable";

  return (
    <View style={localStyles.scrollContent}>
      <View style={localStyles.header}>
        <View style={localStyles.headerIcon}>
          <FontAwesome6 name="credit-card" size={19} color={colors.primaryBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={localStyles.title}>Subscription</Text>
          <Text style={localStyles.subtitle}>{SUBSCRIPTION_API_ENABLED ? "Subscription details and renewal" : "Demo subscription details and renewal"}</Text>
        </View>
        <View style={[localStyles.statusBadge, isLocked && localStyles.expiredBadge]}>
          <Text style={[localStyles.statusText, isLocked && localStyles.expiredText]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={localStyles.detailsCard}>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Current plan</Text>
          <Text style={localStyles.detailValue}>{subscription?.planName || "—"}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>Started</Text>
          <Text style={localStyles.detailValue}>{displayDate(subscription?.startedAt)}</Text>
        </View>
        <View style={localStyles.detailRow}>
          <Text style={localStyles.detailLabel}>{status.phase === "TRIAL" ? "Demo ends" : "Expires"}</Text>
          <Text style={localStyles.detailValue}>{displayDate(subscription?.expiresAt)}</Text>
        </View>
        {status.graceEndsAt && (
          <View style={localStyles.detailRow}>
            <Text style={localStyles.detailLabel}>Access pauses after</Text>
            <Text style={localStyles.detailValue}>{displayDate(status.graceEndsAt)}</Text>
          </View>
        )}
        <View style={[localStyles.detailRow, localStyles.lastRow]}>
          <Text style={localStyles.detailLabel}>Price</Text>
          <Text style={localStyles.detailValue}>
            {subscription?.price ? `₹${subscription.price}` : "Free"}
          </Text>
        </View>
      </View>

      <Text style={localStyles.sectionTitle}>Choose a plan</Text>
      <Text style={localStyles.helper}>{SUBSCRIPTION_API_ENABLED ? "The server confirms the plan price and subscription dates." : "Sample prices for this frontend demo."}</Text>
      <View style={localStyles.planList}>
        {MOCK_PLANS.map((plan) => {
          const selected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedPlan(plan.id);
                setMessage("");
              }}
              style={[localStyles.plan, selected && localStyles.selectedPlan]}
            >
              <View style={{ flex: 1 }}>
                <Text style={localStyles.planName}>{plan.name}</Text>
                <Text style={localStyles.planPeriod}>
                  {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}
                </Text>
              </View>
              <Text style={localStyles.planPrice}>₹{plan.price}</Text>
              <FontAwesome6
                name={selected ? "circle-check" : "circle"}
                size={18}
                color={selected ? colors.primaryBlue : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {!!status.subscriptionError && <Text style={localStyles.error}>{status.subscriptionError}</Text>}
      {!!message && <Text style={localStyles.message}>{message}</Text>}
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={renewing}
        onPress={renew}
        style={[localStyles.renewButton, renewing && { opacity: 0.65 }]}
      >
        <FontAwesome6 name="rotate" size={15} color="#fff" />
        <Text style={localStyles.renewText}>{renewing ? "Processing…" : SUBSCRIPTION_API_ENABLED ? "Renew subscription" : "Simulate renewal"}</Text>
      </TouchableOpacity>
      <Text style={localStyles.disclaimer}>
        {SUBSCRIPTION_API_ENABLED ? "Payment processing is not included in this integration; the server activates the selected plan." : "This is local sample data only. No payment is collected and no backend subscription is created."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  noticeTitle: { fontSize: 14, fontWeight: "800" },
  noticeText: { fontSize: 12, lineHeight: 18, marginTop: 3 },
});

function makeStyles(colors) {
  return StyleSheet.create({
    scrollContent: { padding: 22, paddingBottom: 36 },
    header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
    headerIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.statBlueBg, alignItems: "center", justifyContent: "center" },
    title: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
    subtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
    statusBadge: { backgroundColor: colors.statGreenBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
    expiredBadge: { backgroundColor: colors.dangerBg },
    statusText: { color: colors.primaryGreen, fontSize: 11, fontWeight: "800" },
    expiredText: { color: colors.danger },
    detailsCard: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, borderRadius: 14, paddingHorizontal: 16, marginBottom: 22 },
    detailRow: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    lastRow: { borderBottomWidth: 0 },
    detailLabel: { color: colors.textSecondary, fontSize: 13 },
    detailValue: { color: colors.textPrimary, fontSize: 13, fontWeight: "700", textAlign: "right" },
    sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
    helper: { color: colors.textMuted, fontSize: 12, marginTop: 4, marginBottom: 12 },
    planList: { gap: 9 },
    plan: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card },
    selectedPlan: { borderColor: colors.primaryBlue, backgroundColor: colors.statBlueBg },
    planName: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
    planPeriod: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
    planPrice: { color: colors.textPrimary, fontSize: 14, fontWeight: "800" },
    message: { color: colors.primaryGreen, fontSize: 13, fontWeight: "700", marginTop: 14 },
    error: { color: colors.danger, fontSize: 13, fontWeight: "700", marginTop: 14 },
    renewButton: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: colors.primaryBlue, borderRadius: 11, marginTop: 16 },
    renewText: { color: "#fff", fontSize: 14, fontWeight: "800" },
    disclaimer: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 12 },
  });
}
