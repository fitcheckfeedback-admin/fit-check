import AppIntents
import Foundation

// MARK: - Siri / App Shortcuts for FIT Check (iOS 16+)
//
// Two App Intents read the JSON snapshot the web app mirrors into the shared
// App Group container (see FitCheckSnapshot.swift) and answer Siri directly:
//   "Hey Siri, what should I wear today"
//   "Hey Siri, what's the weather like"
// No new privacy permissions: the intents only read the snapshot file the
// app itself wrote. If the app hasn't produced a snapshot yet, Siri explains
// that and points at the app instead of guessing.

// Snapshot shape written by the FitCheckSnapshot Capacitor plugin.
// tempF / precipChancePct decode as Double for tolerance, then convert.
struct SiriFitSnapshot: Decodable {
    let date: String
    let locationName: String
    let tempF: Double
    let condition: String
    let precipChancePct: Double
    let fitItemNames: [String]
    let fitSummary: String
}

enum SiriSnapshotStore {
    static let appGroupID = "group.app.stylesense.fitcheck"
    static let fileName = "fitcheck-snapshot.json"

    static func load() -> SiriFitSnapshot? {
        guard let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else { return nil }
        let url = container.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(SiriFitSnapshot.self, from: data)
    }
}

struct WhatShouldIWearIntent: AppIntent {
    static var title: LocalizedStringResource = "What should I wear today"
    static var description = IntentDescription("Get today's outfit recommendation from Fit Check.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SiriSnapshotStore.load() else {
            return .result(dialog: "I don't have today's outfit yet. Open Fit Check to get your fit first.")
        }
        let closetPicks = snap.fitItemNames.joined(separator: ", ")
        if closetPicks.isEmpty {
            return .result(dialog: "In \(snap.locationName) it's \(Int(snap.tempF)) degrees and \(snap.condition). \(snap.fitSummary).")
        }
        return .result(dialog: "In \(snap.locationName) it's \(Int(snap.tempF)) degrees and \(snap.condition). \(snap.fitSummary). From your closet: \(closetPicks).")
    }
}

struct WhatsTheWeatherIntent: AppIntent {
    static var title: LocalizedStringResource = "What's the weather like"
    static var description = IntentDescription("Hear the current weather Fit Check is dressing you for.")
    static var openAppWhenRun: Bool = false

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let snap = SiriSnapshotStore.load() else {
            return .result(dialog: "I don't have the weather yet. Open Fit Check once so I can check it for you.")
        }
        var text = "In \(snap.locationName) it's \(Int(snap.tempF)) degrees and \(snap.condition)."
        if snap.precipChancePct >= 20 {
            text += " There's a \(Int(snap.precipChancePct)) percent chance of rain."
        }
        return .result(dialog: "\(text)")
    }
}

struct FitCheckShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: WhatShouldIWearIntent(),
            phrases: [
                "What should I wear today with \(.applicationName)",
                "What should I wear with \(.applicationName) today",
                "What should I wear with \(.applicationName)",
                "What do I wear today with \(.applicationName)",
            ],
            shortTitle: "What to wear",
            systemImageName: "tshirt"
        )
        AppShortcut(
            intent: WhatsTheWeatherIntent(),
            phrases: [
                "What's the weather like with \(.applicationName)",
                "What's the weather like today with \(.applicationName)",
                "How's the weather with \(.applicationName)",
                "What's the weather with \(.applicationName)",
            ],
            shortTitle: "Weather",
            systemImageName: "cloud.sun"
        )
    }
}
