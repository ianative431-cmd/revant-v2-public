import SwiftUI
import UserNotifications

@main
struct RevantApp: App {
    @UIApplicationDelegateAdaptor(RevantAppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            RevantRootView()
        }
    }
}

final class RevantAppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        UserDefaults.standard.set(token, forKey: "revant.apns.deviceToken")
        NotificationCenter.default.post(name: .revantAPNSTokenDidChange, object: token)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NSLog("Revant: APNs registration failed: %@", error.localizedDescription)
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .badge, .sound])
    }
}

extension Notification.Name {
    static let revantAPNSTokenDidChange = Notification.Name("revant.apns.token.didChange")
    static let revantLiveActivityTokenDidChange = Notification.Name("revant.liveActivity.token.didChange")
}
