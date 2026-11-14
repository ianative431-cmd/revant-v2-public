import ActivityKit
import SwiftUI
import WidgetKit

struct RevantDeliveryLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RevantDeliveryAttributes.self) { context in
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Label("Livraison Revant", systemImage: "shippingbox.fill")
                        .font(.caption.weight(.semibold))
                    Spacer()
                    Text(context.attributes.orderReference)
                        .font(.caption2.monospaced())
                        .foregroundStyle(.secondary)
                }

                Text(context.attributes.itemTitle)
                    .font(.headline)
                    .lineLimit(1)

                HStack {
                    Text(context.state.status)
                        .font(.subheadline.weight(.medium))
                    Spacer()
                    Text(context.state.etaLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                ProgressView(value: context.state.progress)
                Text(context.state.detail)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            .padding()
            .activityBackgroundTint(Color(red: 0.96, green: 0.94, blue: 0.90))
            .activitySystemActionForegroundColor(.black)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label("Revant", systemImage: "shippingbox.fill")
                        .font(.caption.weight(.bold))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(Int(context.state.progress * 100))%")
                        .font(.caption.monospacedDigit())
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(context.attributes.itemTitle)
                            .font(.subheadline.weight(.semibold))
                            .lineLimit(1)
                        Text(context.state.status)
                            .font(.caption)
                        ProgressView(value: context.state.progress)
                        Text(context.state.detail)
                            .font(.caption2)
                            .lineLimit(2)
                    }
                }
            } compactLeading: {
                Image(systemName: "shippingbox.fill")
            } compactTrailing: {
                Text("\(Int(context.state.progress * 100))%")
                    .font(.caption2.monospacedDigit())
            } minimal: {
                Image(systemName: "shippingbox.fill")
            }
            .keylineTint(.orange)
            .widgetURL(URL(string: "https://revant-v2-ui-premium.onrender.com/compte/commandes"))
        }
    }
}

@main
struct RevantLiveActivityBundle: WidgetBundle {
    var body: some Widget {
        RevantDeliveryLiveActivity()
    }
}
