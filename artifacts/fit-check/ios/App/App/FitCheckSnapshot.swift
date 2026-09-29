import Capacitor
import WidgetKit

// MARK: - Fit Check snapshot bridge
// Minimal Capacitor plugin (auto-registered by the Capacitor bridge, same as
// the AppReview plugin) so the web app can mirror today's fit + weather into
// the shared App Group container. The Siri App Shortcuts (App Shortcuts)
// and the WidgetKit home-screen widget read this JSON — neither of them can
// reach the web app's JavaScript state directly.
//
// File: <App Group>/fitcheck-snapshot.json
// Keys: date, locationName, tempF, condition, precipChancePct,
//       fitItemNames, fitSummary
@objc(FitCheckSnapshot)
public class FitCheckSnapshot: CAPPlugin, CAPBridgedPlugin {

    // CAPBridgedPlugin conformance: without this the Capacitor bridge
    // silently skips the plugin during registration (CapacitorPlugin is
    // CAPPlugin & CAPBridgedPlugin), so Siri/widget snapshots never run.
    public let identifier = "FitCheckSnapshotPlugin"
    public let jsName = "FitCheckSnapshot"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveSnapshot", returnType: CAPPluginReturnPromise),
    ]

    static let appGroupID = "group.app.stylesense.fitcheck"
    static let fileName = "fitcheck-snapshot.json"

    @objc func saveSnapshot(_ call: CAPPluginCall) {
        guard let snapshot = call.getObject("snapshot") else {
            call.reject("Missing snapshot payload")
            return
        }
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: Self.appGroupID
        ) else {
            call.reject("App Group container unavailable")
            return
        }
        let fileURL = containerURL.appendingPathComponent(Self.fileName)
        do {
            let data = try JSONSerialization.data(withJSONObject: snapshot, options: [])
            try data.write(to: fileURL, options: .atomic)
            // Nudge widgets to pick up the fresh snapshot promptly.
            WidgetCenter.shared.reloadAllTimelines()
            call.resolve()
        } catch {
            call.reject("Failed to write snapshot: \(error.localizedDescription)")
        }
    }
}
