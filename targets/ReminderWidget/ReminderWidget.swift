import WidgetKit
import SwiftUI

private let APP_GROUP_ID = "group.com.dshampoo.newsplus"

// MARK: - Data Model

struct ReminderEntry: TimelineEntry {
    let date: Date
    let title: String
    let time: String
    let eventDate: String
    let hasReminder: Bool
}

// MARK: - Timeline Provider

struct ReminderProvider: TimelineProvider {
    func placeholder(in context: Context) -> ReminderEntry {
        ReminderEntry(date: Date(), title: "Dentista", time: "15:00", eventDate: "Oggi", hasReminder: true)
    }

    func getSnapshot(in context: Context, completion: @escaping (ReminderEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ReminderEntry>) -> Void) {
        let entry = loadEntry()
        // Refresh every hour
        let nextRefresh = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextRefresh))
        completion(timeline)
    }

    private func loadEntry() -> ReminderEntry {
        let defaults = UserDefaults(suiteName: APP_GROUP_ID)
        let title = defaults?.string(forKey: "nextReminderTitle") ?? ""
        let time = defaults?.string(forKey: "nextReminderTime") ?? ""
        let eventDate = defaults?.string(forKey: "nextReminderDate") ?? ""
        let hasReminder = !title.isEmpty

        return ReminderEntry(
            date: Date(),
            title: hasReminder ? title : "Nessun promemoria",
            time: time,
            eventDate: eventDate,
            hasReminder: hasReminder
        )
    }
}

// MARK: - Views

struct ReminderInlineView: View {
    var entry: ReminderEntry

    var body: some View {
        if entry.hasReminder {
            Label("\(entry.title) \(entry.time)", systemImage: "bell.fill")
                .font(.caption2)
        } else {
            Label("Nessun promemoria", systemImage: "bell.slash")
                .font(.caption2)
        }
    }
}

struct ReminderRectangularView: View {
    var entry: ReminderEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Label("Prossimo promemoria", systemImage: "bell")
                .font(.caption2)
                .foregroundColor(.secondary)
            if entry.hasReminder {
                Text(entry.title)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                Text("\(entry.eventDate)  \(entry.time)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            } else {
                Text("Nessuno per oggi")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Widget

@main
struct ReminderWidget: Widget {
    let kind = "ReminderWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ReminderProvider()) { entry in
            if #available(iOSApplicationExtension 16.0, *) {
                ContainerRelativeShape()
                    .fill(Color.clear)
                    .overlay(widgetView(entry: entry))
            } else {
                widgetView(entry: entry)
            }
        }
        .configurationDisplayName("Prossimo Promemoria")
        .description("Visualizza il prossimo promemoria nella schermata di blocco.")
        .supportedFamilies([.accessoryInline, .accessoryRectangular])
    }

    @ViewBuilder
    func widgetView(entry: ReminderEntry) -> some View {
        if #available(iOSApplicationExtension 16.0, *) {
            ViewThatFits {
                ReminderRectangularView(entry: entry)
                ReminderInlineView(entry: entry)
            }
        } else {
            ReminderInlineView(entry: entry)
        }
    }
}
