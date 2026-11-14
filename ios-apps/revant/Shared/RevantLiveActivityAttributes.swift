import ActivityKit

struct RevantDeliveryAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var status: String
        var detail: String
        var etaLabel: String
        var progress: Double
    }

    var orderReference: String
    var itemTitle: String
}
