import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, ThemeMode } from './index';

export type ThemeSetting = 'system' | 'dark' | 'light';

interface ThemeContextType {
    mode: ThemeMode; // resolved mode
    setting: ThemeSetting;
    theme: ReturnType<typeof getTheme>;
    toggleTheme: () => void; // legacy
    changeThemeSetting: (setting: ThemeSetting) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [setting, setSetting] = useState<ThemeSetting>('system');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        const saved = await AsyncStorage.getItem('theme_setting') as ThemeSetting;
        if (saved && ['system', 'dark', 'light'].includes(saved)) {
            setSetting(saved);
        }
    };

    const changeThemeSetting = async (newSetting: ThemeSetting) => {
        setSetting(newSetting);
        await AsyncStorage.setItem('theme_setting', newSetting);
    };

    const toggleTheme = async () => {
        const newMode = resolvedMode === 'dark' ? 'light' : 'dark';
        changeThemeSetting(newMode);
    };

    const resolvedMode: ThemeMode = setting === 'system' ? (systemColorScheme || 'dark') : setting;
    const theme = getTheme(resolvedMode);

    return (
        <ThemeContext.Provider value={{ mode: resolvedMode, setting, theme, toggleTheme, changeThemeSetting }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
