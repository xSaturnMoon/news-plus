import { NativeModules, Platform } from 'react-native';

const { AppGroupModule } = NativeModules;

interface ReminderEntry {
    title: string;
    time: string;
    date: string;
}

/**
 * Syncs the next upcoming reminder to the App Group UserDefaults,
 * making it available to the lock screen WidgetKit extension.
 */
export async function syncNextReminderToWidget(
    events: Array<{ title: string; notifications?: string; enabled?: number }>
): Promise<void> {
    if (Platform.OS !== 'ios') return;
    if (!AppGroupModule) return;

    try {
        const now = new Date();

        // Collect all future reminders from all enabled events
        const upcoming: Array<ReminderEntry & { scheduledMs: number }> = [];

        for (const event of events) {
            if (event.enabled !== 1) continue;
            try {
                const raw = JSON.parse(event.notifications || '[]');
                const notifs = Array.isArray(raw) ? raw : (raw?.ids ? [raw] : []);
                for (const n of notifs) {
                    const notifDate = n.notifDate || '';
                    const notifTime = n.notifTime || '';
                    if (!notifDate || !notifTime) continue;

                    const [y, mo, d] = notifDate.split('-').map(Number);
                    const [h, mi] = notifTime.split(':').map(Number);
                    const scheduledDate = new Date(y, mo - 1, d, h, mi);

                    if (scheduledDate.getTime() > now.getTime()) {
                        upcoming.push({
                            title: event.title,
                            time: notifTime,
                            date: notifDate,
                            scheduledMs: scheduledDate.getTime(),
                        });
                    }
                }
            } catch { /* skip malformed */ }
        }

        // Sort and pick the soonest
        upcoming.sort((a, b) => a.scheduledMs - b.scheduledMs);
        const next = upcoming[0];

        if (next) {
            AppGroupModule.writeString('nextReminderTitle', next.title);
            AppGroupModule.writeString('nextReminderTime', next.time);
            AppGroupModule.writeString('nextReminderDate', next.date);
        } else {
            AppGroupModule.writeString('nextReminderTitle', '');
            AppGroupModule.writeString('nextReminderTime', '');
            AppGroupModule.writeString('nextReminderDate', '');
        }

        AppGroupModule.reloadWidget();
    } catch (e) {
        console.warn('[widgetSync] Failed to sync widget data:', e);
    }
}
