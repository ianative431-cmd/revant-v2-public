import ActivityKit
import Foundation

@available(iOS 16.2, *)
enum RevantLiveActivityController {
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
            _ = try Activity.request(
                attributes: attributes,
                content: ActivityContent(state: state, staleDate: Date().addingTimeInterval(15 * 60)),
                pushType: nil
            )
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
        }
    }
}
