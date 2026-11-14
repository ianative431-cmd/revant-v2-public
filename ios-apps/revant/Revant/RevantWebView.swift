import SwiftUI
import WebKit

struct RevantWebView: UIViewRepresentable {
    let path: String

    private static let baseURL = URL(string: "https://revant-v2-ui-premium.onrender.com")!

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let controller = WKUserContentController()
        controller.add(context.coordinator, name: "revantNative")
        controller.addUserScript(
            WKUserScript(source: Self.bridgeScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = controller

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        context.coordinator.webView = webView
        context.coordinator.lastRequestedPath = path
        webView.load(URLRequest(url: Self.url(for: path)))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastRequestedPath != path else { return }
        context.coordinator.lastRequestedPath = path
        webView.load(URLRequest(url: Self.url(for: path)))
    }

    private static func url(for path: String) -> URL {
        URL(string: path, relativeTo: baseURL)!.absoluteURL
    }

    private static let bridgeScript = """
    (function () {
      const nativeHandler = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.revantNative;
      if (!nativeHandler) return;
      window.RevantNative = {
        requestPushPermission: function () {
          nativeHandler.postMessage({ action: "requestPushPermission" });
        },
        startDeliveryActivity: function (payload) {
          nativeHandler.postMessage({ action: "startDeliveryActivity", payload: payload || {} });
        },
        endDeliveryActivity: function (payload) {
          nativeHandler.postMessage({ action: "endDeliveryActivity", payload: payload || {} });
        }
      };
      window.__revantSetPushToken = function (token) {
        window.__revantAPNSToken = token;
        window.dispatchEvent(new CustomEvent("revant:push-token", { detail: { token: token } }));
      };
    })();
    """

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate {
        weak var webView: WKWebView?
        var lastRequestedPath: String?

        override init() {
            super.init()
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(pushTokenDidChange(_:)),
                name: .revantAPNSTokenDidChange,
                object: nil
            )
        }

        deinit {
            NotificationCenter.default.removeObserver(self)
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard
                let body = message.body as? [String: Any],
                let action = body["action"] as? String
            else { return }

            switch action {
            case "requestPushPermission":
                RevantPushRegistration.requestPermission()
            case "startDeliveryActivity":
                guard let payload = body["payload"] as? [String: Any] else { return }
                let orderReference = payload["orderReference"] as? String ?? ""
                let itemTitle = payload["itemTitle"] as? String ?? "Commande Revant"
                let status = payload["status"] as? String ?? "Livraison en cours"
                let detail = payload["detail"] as? String ?? status
                let etaLabel = payload["etaLabel"] as? String ?? "Suivi Revant"
                let progress = (payload["progress"] as? NSNumber)?.doubleValue ?? 0
                Task {
                    await RevantLiveActivityController.startOrUpdate(
                        orderReference: orderReference,
                        itemTitle: itemTitle,
                        status: status,
                        detail: detail,
                        etaLabel: etaLabel,
                        progress: progress
                    )
                }
            case "endDeliveryActivity":
                let payload = body["payload"] as? [String: Any] ?? [:]
                let orderReference = payload["orderReference"] as? String ?? ""
                Task {
                    await RevantLiveActivityController.end(orderReference: orderReference)
                }
            default:
                break
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            deliverStoredPushToken()
        }

        @objc private func pushTokenDidChange(_ notification: Notification) {
            DispatchQueue.main.async { [weak self] in
                self?.deliverStoredPushToken()
            }
        }

        private func deliverStoredPushToken() {
            guard let token = UserDefaults.standard.string(forKey: "revant.apns.deviceToken") else { return }
            webView?.evaluateJavaScript("window.__revantSetPushToken && window.__revantSetPushToken('\(token)')")
        }
    }
}
