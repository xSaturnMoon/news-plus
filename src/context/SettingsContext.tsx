import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
const osStorage = {
    getItem: async (key: string) => {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            }
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            return await AsyncStorage.getItem(key);
        } catch (e) {
            return null;
        }
    },
    setItem: async (key: string, value: string) => {
        try {
            if (Platform.OS === 'web') {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, value);
                }
                return;
            }
            // Dynamic require to prevent initialization on web
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await AsyncStorage.setItem(key, value);
        } catch (e) {
            console.warn("Storage setItem failed", e);
        }
    }
};

export type OSTheme = 'light' | 'dark' | 'auto';

interface SettingsState {
    theme: OSTheme;
    accentColor: string;
    wallpaper: string;
    dockSize: number;
    dockMagnification: boolean;
    wifiEnabled: boolean;
    bluetoothEnabled: boolean;
    airplaneMode: boolean;
    nightShift: boolean;
    volume: number;
    brightness: number;
    batteryPercentage: number;
    powerSaver: boolean;
    
    isSetupComplete: boolean;
    password: string;
    loginAutomatically: boolean;
    handoffEnabled: boolean;
    user: {
        name: string;
        fullName: string;
        avatar: string;
    };
}

export const INITIAL_USER = {
    name: 'Tobia',
    fullName: 'Giuseppe Castagna',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&h=200&q=80',
};

export const DEFAULT_SETTINGS: SettingsState = {
    theme: 'dark',
    accentColor: '#0066CC',
    wallpaper: require('../../assets/wallpaper.png'),
    dockSize: 1.0,
    dockMagnification: true,
    wifiEnabled: true,
    bluetoothEnabled: true,
    airplaneMode: false,
    nightShift: false,
    volume: 0.8,
    brightness: 1.0,
    batteryPercentage: 85,
    powerSaver: false,
    isSetupComplete: false,
    password: '',
    loginAutomatically: true,
    handoffEnabled: true,
    user: INITIAL_USER
};

interface SettingsContextType {
    settings: SettingsState;
    updateSettings: (newSettings: Partial<SettingsState>) => void;
    clearSettings: () => void;
}

const defaultSettings: SettingsState = DEFAULT_SETTINGS;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const stored = await osStorage.getItem('@os_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                    console.log("[Persistence] Loaded settings successfully");
                }
            } catch (e) {
                console.error("[Persistence] Hydration failed:", e);
            } finally {
                setIsLoaded(true);
            }
        };
        init();
    }, []);

    // Effect to automatically save settings whenever they change
    useEffect(() => {
        if (isLoaded) {
            osStorage.setItem('@os_settings', JSON.stringify(settings))
                .catch(err => console.error("[Persistence] Save error:", err));
        }
    }, [settings, isLoaded]);

    const updateSettings = (updates: Partial<SettingsState>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    const clearSettings = async () => {
        setSettings(DEFAULT_SETTINGS);
        await osStorage.setItem('@os_settings', JSON.stringify(DEFAULT_SETTINGS));
    };

    if (!isLoaded) return null;

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, clearSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
