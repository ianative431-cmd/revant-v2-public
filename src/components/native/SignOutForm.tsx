"use client";

type Props = {
  action: () => Promise<void>;
};

export default function SignOutForm({ action }: Props) {
  async function handleSignOut() {
    const liveActivities = window.__revantLiveActivityTokens ?? [];
    const uniqueActivities = new Map(
      liveActivities
        .filter((item) => item.activityId && item.orderReference)
        .map((item) => [item.activityId as string, item])
    );

    for (const activity of uniqueActivities.values()) {
      window.RevantNative?.endDeliveryActivity?.({
        orderReference: activity.orderReference as string,
      });
    }

    const cleanupRequests: Promise<unknown>[] = [];
    const deviceToken = window.__revantAPNSToken;
    if (deviceToken) {
      cleanupRequests.push(fetch("/api/native/push-token", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: deviceToken }),
      }).catch(() => null));
    }

    for (const activity of uniqueActivities.values()) {
      cleanupRequests.push(fetch("/api/native/live-activity-token", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.activityId }),
      }).catch(() => null));
    }

    await Promise.all(cleanupRequests);
    window.__revantAPNSToken = undefined;
    window.__revantLiveActivityTokens = [];
    await action();
  }

  return (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="w-full rounded-full border border-brand-accent py-3 text-sm font-medium"
      >
        Se déconnecter
      </button>
    </form>
  );
}
