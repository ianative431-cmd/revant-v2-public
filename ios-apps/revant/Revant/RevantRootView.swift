import SwiftUI

private enum RevantTab: String, CaseIterable, Identifiable {
    case home
    case categories
    case messages
    case cart
    case account

    var id: String { rawValue }

    var title: String {
        switch self {
        case .home: return "Accueil"
        case .categories: return "Catégorie"
        case .messages: return "Message"
        case .cart: return "Panier"
        case .account: return "Mon Revante"
        }
    }

    var symbol: String {
        switch self {
        case .home: return "house"
        case .categories: return "square.grid.2x2"
        case .messages: return "bubble.left.and.bubble.right"
        case .cart: return "bag"
        case .account: return "person.crop.circle"
        }
    }

    var path: String {
        switch self {
        case .home: return "/"
        case .categories: return "/categories"
        case .messages: return "/messages"
        case .cart: return "/panier"
        case .account: return "/compte"
        }
    }
}

struct RevantRootView: View {
    @State private var selectedTab: RevantTab = .home

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Revant")
                        .font(.system(size: 21, weight: .bold, design: .rounded))
                    Text("Acheter · Vendre · Découvrir")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: RevantPushRegistration.requestPermission) {
                    Image(systemName: "bell.badge")
                        .font(.system(size: 17, weight: .semibold))
                        .frame(width: 42, height: 42)
                        .contentShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Activer les notifications")
                .accessibilityHint("Les alertes de commande et de livraison peuvent être personnalisées dans les réglages de notifications.")
                .background {
                    if #available(iOS 26.0, *) {
                        Circle().fill(.clear).glassEffect(.regular)
                    } else {
                        Circle().fill(.ultraThinMaterial)
                    }
                }
            }
            .padding(.horizontal, 18)
            .padding(.top, 8)
            .padding(.bottom, 10)

            RevantWebView(path: selectedTab.path)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            RevantTabBar(selection: $selectedTab)
                .padding(.horizontal, 14)
                .padding(.top, 8)
                .padding(.bottom, 6)
        }
        .background(Color(uiColor: .systemBackground))
        .tint(Color(red: 0.96, green: 0.42, blue: 0.09))
    }
}

private struct RevantTabBar: View {
    @Binding var selection: RevantTab

    var body: some View {
        HStack(spacing: 4) {
            ForEach(RevantTab.allCases) { tab in
                Button {
                    selection = tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.symbol)
                            .font(.system(size: 18, weight: selection == tab ? .semibold : .regular))
                        Text(tab.title)
                            .font(.caption2.weight(selection == tab ? .semibold : .medium))
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                    }
                    .foregroundStyle(selection == tab ? Color.accentColor : Color.secondary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selection == tab ? .isSelected : [])
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .background {
            if #available(iOS 26.0, *) {
                Capsule().fill(.clear).glassEffect(.regular)
            } else {
                Capsule().fill(.ultraThinMaterial)
            }
        }
    }
}
