import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';

const CHANNEL_ID = 'high-priority-events';

export const setupNotifications = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Permessi notifiche negati');
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
    } catch (error) {
        console.error('Errore durante setupNotifications:', error);
        return false;
    }
};

export const getPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
};

export const scheduleNotification = async (title: string, body: string, date: Date) => {
    try {
        // Verifica permessi prima di programmare
        const status = await getPermissionStatus();
        if (status !== 'granted') {
            throw new Error(`Permessi non concessi (Stato attuale: ${status})`);
        }

        const seconds = Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));
        console.log(`Programmo notifica tra ${seconds} secondi...`);

        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
                badge: 1,
                // @ts-ignore
                channelId: CHANNEL_ID,
            },
            trigger: {
                type: 'timeInterval',
                seconds: seconds,
            } as any,
        });

        console.log(`Notifica programmata (ID: ${id}) per il ${date.toLocaleString()}`);
        return id;
    } catch (error: any) {
        console.error('Errore durante scheduleNotification:', error);
        // Lanciamo l'errore così il chiamante può mostrare il messaggio specifico
        throw error;
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
