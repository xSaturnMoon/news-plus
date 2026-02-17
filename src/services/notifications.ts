import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'high-priority-events';

export const setupNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Promemoria Calendario',
            importance: Notifications.AndroidImportance.MAX,
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
        });
    }

    return true;
};

export const scheduleNotification = async (title: string, body: string, date: Date) => {
    const now = Date.now();
    const triggerTime = date.getTime();

    // Calcoliamo la differenza in secondi
    let seconds = Math.floor((triggerTime - now) / 1000);

    // Se la differenza è minima o negativa (es. test cliccato subito), 
    // forziamo almeno 1 secondo per evitare l'invio istantaneo
    if (seconds <= 0) seconds = 1;

    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                // @ts-ignore
                channelId: CHANNEL_ID,
            },
            // Per Expo Notifications v0.32+, l'oggetto trigger per intervallo di tempo
            // richiede 'seconds' e opzionalmente 'repeats'.
            trigger: {
                seconds: seconds,
            } as any,
        });

        console.log(`Notifica programmata (ID: ${id}) tra ${seconds} secondi`);
        return id;
    } catch (error) {
        console.error('Errore durante scheduleNotification:', error);
        return null;
    }
};

export const cancelNotification = async (id: string) => {
    try {
        await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) { }
};

export const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
