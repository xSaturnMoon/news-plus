import ActivityKit
import WidgetKit
import SwiftUI
import AppIntents

// MARK: - Attributes
struct ShoppingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var items: [ShoppingActivityItem]
        var lastUpdated: Date
    }
    var listName: String
}

struct ShoppingActivityItem: Codable, Hashable, Identifiable {
    var id: String
    var name: String
    var quantity: String
    var isChecked: Bool
}

// MARK: - App Intent for Interactivity
struct ToggleItemIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Toggle Shopping Item"
    static var description = IntentDescription("Toggles the checked state of a shopping item.")

    @Parameter(title: "Item ID")
    var itemId: String

    @Parameter(title: "List Name")
    var listName: String

    init() {}
    init(itemId: String, listName: String) {
        self.itemId = itemId
        self.listName = listName
    }

    func perform() async throws -> some IntentResult {
        // Find the active activity for this list
        let activities = Activity<ShoppingAttributes>.activities
        guard let activity = activities.first(where: { $0.attributes.listName == listName }) else {
            return .result()
        }

        // Create new state with toggled item
        var updatedItems = activity.content.state.items
        if let index = updatedItems.firstIndex(where: { $0.id == itemId }) {
            updatedItems[index].isChecked.toggle()
        }

        let updatedContentState = ShoppingAttributes.ContentState(
            items: updatedItems,
            lastUpdated: Date()
        )

        // Update the activity state
        await activity.update(using: updatedContentState)
        
        return .result()
    }
}

// MARK: - Widget implementation
@main
struct ShoppingWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShoppingAttributes.self) { context in
            LockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.attributes.listName, systemImage: "cart.fill")
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(context.state.items.filter { !$0.isChecked }.count) rimasti")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    CompactListView(items: context.state.items)
                }
            } compactLeading: {
                Image(systemName: "cart.fill").foregroundColor(.green)
            } compactTrailing: {
                Text("\(context.state.items.filter { !$0.isChecked }.count)")
            } minimal: {
                Image(systemName: "cart.fill").foregroundColor(.green)
            }
        }
    }
}

struct LockScreenView: View {
    let context: ActivityViewContext<ShoppingAttributes>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                HStack(spacing: 6) {
                    Image(systemName: "cart.fill")
                    Text(context.attributes.listName)
                        .fontWeight(.bold)
                }
                .foregroundColor(.green)
                
                Spacer()
                
                Text(context.state.lastUpdated, style: .time)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Divider()
            
            VStack(alignment: .leading, spacing: 12) {
                ForEach(context.state.items.prefix(6)) { item in
                    HStack {
                        // The interactive button!
                        Button(intent: ToggleItemIntent(itemId: item.id, listName: context.attributes.listName)) {
                            ZStack {
                                Circle()
                                    .stroke(item.isChecked ? Color.green : Color.gray.opacity(0.3), lineWidth: 1)
                                    .frame(width: 24, height: 24)
                                
                                if item.isChecked {
                                    Circle()
                                        .fill(Color.green)
                                        .frame(width: 14, height: 14)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name)
                                .font(.system(size: 16, weight: item.isChecked ? .regular : .medium))
                                .strikethrough(item.isChecked)
                                .foregroundColor(item.isChecked ? .secondary : .primary)
                            
                            if !item.quantity.isEmpty {
                                Text(item.quantity)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        Spacer()
                    }
                }
                
                if context.state.items.count > 6 {
                    Text("+ altri \(context.state.items.count - 6) prodotti...")
                        .font(.caption)
                        .italic()
                        .foregroundColor(.secondary)
                        .padding(.leading, 30)
                }
            }
        }
        .padding()
        .background(Color(white: 0.98))
    }
}

struct CompactListView: View {
    let items: [ShoppingActivityItem]
    var body: some View {
        HStack(spacing: 4) {
             ForEach(items.prefix(3).filter { !$0.isChecked }) { item in
                 Text(item.name)
                     .font(.caption2)
                     .padding(.horizontal, 6)
                     .padding(.vertical, 2)
                     .background(Color.green.opacity(0.1))
                     .cornerRadius(4)
             }
        }
    }
}
