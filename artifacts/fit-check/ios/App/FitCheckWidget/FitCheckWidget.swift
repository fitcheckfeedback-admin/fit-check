import SwiftUI
import WidgetKit

// MARK: - FIT Check home-screen widget (iOS 16+)
//
// Small + medium WidgetKit widgets showing the fit of the day and the
// current weather. Data comes from the JSON snapshot the app mirrors into
// the shared App Group container (see FitCheckSnapshot.swift in the app
// target) — the widget never touches location or the network itself.

// Snapshot shape written by the FitCheckSnapshot Capacitor plugin.
// tempF / precipChancePct decode as Double for tolerance, then convert.
struct WidgetFitSnapshot: Decodable {
    let date: String
    let locationName: String
    let tempF: Double
    let condition: String
    let precipChancePct: Double
    let fitItemNames: [String]
    let fitSummary: String

    static var placeholder: WidgetFitSnapshot {
        WidgetFitSnapshot(
            date: "2026-09-29",
            locationName: "Dallas, TX",
            tempF: 79,
            condition: "Mainly clear",
            precipChancePct: 10,
            fitItemNames: ["Navy Crewneck Sweater", "Khaki Chinos", "Brown Leather Boots"],
            fitSummary: "Navy crewneck sweater with khaki chinos"
        )
    }
}

enum WidgetSnapshotStore {
    static let appGroupID = "group.app.stylesense.fitcheck"
    static let fileName = "fitcheck-snapshot.json"

    static func load() -> WidgetFitSnapshot? {
        guard let container = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupID
        ) else { return nil }
        let url = container.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(WidgetFitSnapshot.self, from: data)
    }
}

struct FitCheckEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetFitSnapshot?
}

struct FitCheckProvider: TimelineProvider {
    func placeholder(in context: Context) -> FitCheckEntry {
        FitCheckEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (FitCheckEntry) -> Void) {
        completion(FitCheckEntry(date: Date(), snapshot: WidgetSnapshotStore.load() ?? .placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FitCheckEntry>) -> Void) {
        let entry = FitCheckEntry(date: Date(), snapshot: WidgetSnapshotStore.load())
        // The app also nudges WidgetCenter.reloadAllTimelines() whenever it
        // saves a fresh snapshot, so this is only a backstop.
        let refresh = Calendar.current.date(byAdding: .minute, value: 45, to: Date())
            ?? Date().addingTimeInterval(2700)
        completion(Timeline(entries: [entry], policy: .after(refresh)))
    }
}

// MARK: - Views (warm accent, dark-mode aware via system colors)

private let fitAccent = Color(red: 0.96, green: 0.55, blue: 0.10)

private struct EmptyWidgetView: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "tshirt")
                .font(.title2)
                .foregroundStyle(fitAccent)
            Text("Open Fit Check to get today's fit")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct FitCheckSmallView: View {
    let entry: FitCheckEntry

    var body: some View {
        if let s = entry.snapshot {
            VStack(alignment: .leading, spacing: 2) {
                Text(s.locationName.uppercased())
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Text("\(Int(s.tempF))°")
                    .font(.system(size: 38, weight: .bold))
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                Text(s.condition)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer(minLength: 4)
                RoundedRectangle(cornerRadius: 2)
                    .fill(fitAccent)
                    .frame(width: 28, height: 4)
                Text(s.fitItemNames.prefix(2).joined(separator: " · "))
                    .font(.caption2)
                    .lineLimit(2)
            }
            .padding(12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        } else {
            EmptyWidgetView()
        }
    }
}

private struct FitCheckMediumView: View {
    let entry: FitCheckEntry

    var body: some View {
        if let s = entry.snapshot {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(s.locationName.uppercased())
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                    Text("\(Int(s.tempF))°")
                        .font(.system(size: 44, weight: .bold))
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    Text(s.condition)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                    if s.precipChancePct >= 20 {
                        Text("\(Int(s.precipChancePct))% rain")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                VStack(alignment: .leading, spacing: 4) {
                    Text("TODAY'S FIT")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundStyle(fitAccent)
                    ForEach(Array(s.fitItemNames.prefix(4).enumerated()), id: \.offset) { _, name in
                        Text(name)
                            .font(.caption)
                            .lineLimit(1)
                    }
                    if s.fitItemNames.count > 4 {
                        Text("+\(s.fitItemNames.count - 4) more")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(14)
        } else {
            EmptyWidgetView()
        }
    }
}

// MARK: - Widget definitions

struct FitCheckSmallWidget: Widget {
    let kind = "FitCheckSmallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FitCheckProvider()) { entry in
            FitCheckSmallView(entry: entry)
        }
        .configurationDisplayName("Today's Fit")
        .description("Your Fit Check outfit and the current weather at a glance.")
        .supportedFamilies([.systemSmall])
    }
}

struct FitCheckMediumWidget: Widget {
    let kind = "FitCheckMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: FitCheckProvider()) { entry in
            FitCheckMediumView(entry: entry)
        }
        .configurationDisplayName("Today's Fit")
        .description("Your Fit Check outfit, the weather, and rain chance.")
        .supportedFamilies([.systemMedium])
    }
}

@main
struct FitCheckWidgetBundle: WidgetBundle {
    var body: some Widget {
        FitCheckSmallWidget()
        FitCheckMediumWidget()
    }
}
