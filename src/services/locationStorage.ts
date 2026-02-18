import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'weather_saved_locations';

export interface LocationInfo {
    id: string;
    cityName: string;
    isCurrentLocation: boolean;
}

export const getSavedLocations = async (): Promise<LocationInfo[]> => {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Moltissime città di default per un'esperienza ricca da subito
        return [
            { id: 'current', cityName: 'Posizione Attuale', isCurrentLocation: true },
            { id: 'roma', cityName: 'Roma', isCurrentLocation: false },
        ];
    } catch (error) {
        console.error('Error getting saved locations:', error);
        return [{ id: 'current', cityName: 'Posizione Attuale', isCurrentLocation: true }];
    }
};

export const saveLocation = async (location: LocationInfo) => {
    try {
        const current = await getSavedLocations();
        const updated = [...current, location];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving location:', error);
    }
};

export const removeLocation = async (id: string) => {
    try {
        const current = await getSavedLocations();
        const updated = current.filter(loc => loc.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
        console.error('Error removing location:', error);
    }
};
