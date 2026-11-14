import ActivityKit
import Foundation

@available(iOS 16.2, *)
@MainActor
enum RevantLiveActivityController {
    private static var observedActivityIDs = Set<String>()

    static func startOrUpdate(
        orderReference: String,
        itemTitle: String,
        status: String,
        detail: String,
        etaLabel: String,
        progress: Double
    ) async {
        guard !orderReference.isEmpty else { return }

        let state = RevantDeliveryAttributes.ContentState(
            status: status,
            detail: detail,
            etaLabel: etaLabel,
            progress: min(max(progress, 0), 1)
        )

        if let activity = Activity<RevantDeliveryAttributes>.activities.first(where: {
            $0.attributes.orderReference == orderReference
        }) {
            observePushToken(for: activity)
            await activity.update(
                ActivityContent(state: state, staleDate: Date().addingTimeInterval(15 * 60))
            )
            return
        }

        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let attributes = RevantDeliveryAttributes(
            orderReference: orderReference,
            itemTitle: itemTitle.isEmpty ? "Commande Revant" : itemTitle
        )

        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: ActivityContent(state: state, staleDate: Date().addingTimeInterval(15 * 60)),
                pushType: .token
            )
            observePushToken(for: activity)
        } catch {
            NSLog("Revant: unable to start Live Activity: %@", error.localizedDescription)
        }
    }

    static func end(orderReference: String) async {
        let activities = Activity<RevantDeliveryAttributes>.activities.filter {
            $0.attributes.orderReference == orderReference
        }
        for activity in activities {
            await activity.end(nil, dismissalPolicy: .immediate)
            UserDefaults.standard.removeObject(forKey: tokenDefaultsKey(activity.id))
            observedActivityIDs.remove(activity.id)
        }
    }

    private static func observePushToken(for activity: Activity<RevantDeliveryAttributes>) {
        guard !observedActivityIDs.contains(activity.id) else { return }
        observedActivityIDs.insert(activity.id)

        if let currentToken = activity.pushToken {
            publishPushToken(currentToken, for: activity)
        }

        Task {
            for await tokenData in activity.pushTokenUpdates {
                publishPushToken(tokenData, for: activity)
            }
        }
    }

    private static func publishPushToken(_ tokenData: Data, for activity: Activity<RevantDeliveryAttributes>) {
        let token = tokenData.map { String(format: "%02x", $0) }.joined()
        guard token.count == 64 else { return }

        let payload: [String: String] = [
            "token": token,
            "activityId": activity.id,
            "orderReference": activity.attributes.orderReference
        ]
        UserDefaults.standard.set(payload, forKey: tokenDefaultsKey(activity.id))
        NotificationCenter.default.post(name: .revantLiveActivityTokenDidChange, object: payload)
    }

    private static func tokenDefaultsKey(_ activityID: String) -> String {
        "revant.liveActivityToken.\(activityID)"
    }
}
