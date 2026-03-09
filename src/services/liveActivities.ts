// import * as LiveActivities from 'expo-live-activities'; // Removido por erro de resolução
import { ShoppingItem } from './database';
import * as notifications from './notifications';

const LiveActivities: any = {
    startActivity: async () => {
        console.log("Live Activity starting (Requires IPA Build)");
        return null; // Return null so we trigger fallback
    },
    updateActivity: async () => { console.log("Live Activity updating (Requires IPA Build)"); },
    endActivity: async () => { console.log("Live Activity ending (Requires IPA Build)"); },
};

export interface ShoppingActivityItem {
    id: string;
    name: string;
    quantity: string;
    isChecked: boolean;
}

export const startShoppingLiveActivity = async (listName: string, items: ShoppingItem[]) => {
    try {
        const activityItems: ShoppingActivityItem[] = items.map(item => ({
            id: String(item.id),
            name: item.name,
            quantity: item.quantity,
            isChecked: item.checked === 1
        }));

        const attributes = { listName };
        const contentState = {
            items: activityItems,
            lastUpdated: new Date()
        };

        // Tenta avviare la Live Activity reale
        const activityId = await LiveActivities.startActivity(attributes, contentState);

        // --- FALLBACK PER EXPO GO ---
        // Se non riusciamo ad avviare la Live Activity (es. siamo in Expo Go),
        // mandiamo una notifica standard persistente come "piano B".
        if (!activityId) {
            const pendingItems = items.filter(i => i.checked === 0);
            const listItems = pendingItems
                .map(i => `• ${i.name.toUpperCase()} (${i.quantity})`)
                .join('\n');

            const body = listItems;

            await notifications.scheduleNotification(
                '🛒 Lista Della Spesa',
                body,
                new Date(Date.now() + 500)
            );
            return 'fallback-notification';
        }

        return activityId;
    } catch (error) {
        console.error('Error starting Live Activity:', error);
        return null;
    }
};

export const updateShoppingLiveActivity = async (activityId: string, items: ShoppingItem[]) => {
    try {
        const activityItems: ShoppingActivityItem[] = items.map(item => ({
            id: String(item.id),
            name: item.name,
            quantity: item.quantity,
            isChecked: item.checked === 1
        }));

        const contentState = {
            items: activityItems,
            lastUpdated: new Date()
        };

        await LiveActivities.updateActivity(activityId, contentState);
    } catch (error) {
        console.error('Error updating Live Activity:', error);
    }
};

export const endShoppingLiveActivity = async (activityId: string) => {
    try {
        await LiveActivities.endActivity(activityId);
    } catch (error) {
        console.error('Error ending Live Activity:', error);
    }
};
