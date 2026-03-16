import Foundation
import WidgetKit

@objc(AppGroupModule)
class AppGroupModule: NSObject {
    private let appGroupId = "group.com.dshampoo.newsplus"

    @objc func writeString(_ key: String, value: String) {
        let defaults = UserDefaults(suiteName: appGroupId)
        defaults?.set(value, forKey: key)
        defaults?.synchronize()
    }

    @objc func reloadWidget() {
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
