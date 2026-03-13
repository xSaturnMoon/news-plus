import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';

export type OSState = 'BOOT' | 'LOGIN' | 'DESKTOP' | 'SHUTDOWN';

interface WeatherData {
  tempC: number;
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'storm';
}

interface OSContextType {
  state: OSState;
  setState: (state: OSState) => void;
  user: {
    name: string;
    avatar: string;
  };
  // System States
  wifi: boolean;
  setWifi: (v: boolean) => void;
  bluetooth: boolean;
  setBluetooth: (v: boolean) => void;
  nightLight: boolean;
  setNightLight: (v: boolean) => void;
  dnd: boolean;
  setDnd: (v: boolean) => void;
  brightness: number;
  setBrightness: (v: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  silentMode: boolean;
  setSilentMode: (v: boolean) => void;
  isSleeping: boolean;
  setIsSleeping: (v: boolean) => void;
  showControlCenter: boolean;
  setShowControlCenter: (v: boolean) => void;
  isResetting: boolean;
  setIsResetting: (v: boolean) => void;
  resetType: 'USER' | 'FULL' | null;
  setResetType: (v: 'USER' | 'FULL' | null) => void;
  activeMenu: 'SYSTEM' | 'DESKTOP' | null;
  setActiveMenu: (v: 'SYSTEM' | 'DESKTOP' | null) => void;
  isAppDrawerOpen: boolean;
  setIsAppDrawerOpen: (v: boolean) => void;
  appHistory: string[];
  addToHistory: (appId: string) => void;
  time: Date;
  // Weather
  weather: WeatherData | null;
  // Battery
  batteryLevel: number | null; // 0.0–1.0
  // Spotify Integration
  spotifyState: {
    title: string;
    artist: string;
    cover: string;
    isPlaying: boolean;
  };
  setSpotifyState: (state: any) => void;
  spotifyControl: {
    playPause: () => void;
    next: () => void;
    prev: () => void;
  };
}

const OSContext = createContext<OSContextType | undefined>(undefined);

// Map WMO weather codes to icon type
function wmoToIcon(code: number): WeatherData['icon'] {
  if (code === 0 || code === 1) return 'sun';
  if (code <= 3) return 'cloud';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 95) return 'storm';
  return 'cloud';
}

export const OSProvider = ({ children }: { children: React.ReactNode }) => {
  const { settings, updateSettings } = useSettings();

  const [state, setState] = useState<OSState>('BOOT');
  const [dnd, setDnd] = useState(false);
  const [isSleeping, setIsSleeping] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetType, setResetType] = useState<'USER' | 'FULL' | null>(null);
  const [activeMenu, setActiveMenu] = useState<'SYSTEM' | 'DESKTOP' | null>(null);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [appHistory, setAppHistory] = useState<string[]>([]);
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  // Persistent states mapped to SettingsContext
  const wifi = settings.wifiEnabled;
  const setWifi = (v: boolean) => updateSettings({ wifiEnabled: v });
  
  const bluetooth = settings.bluetoothEnabled;
  const setBluetooth = (v: boolean) => updateSettings({ bluetoothEnabled: v });
  
  const nightLight = settings.nightShift;
  const setNightLight = (v: boolean) => updateSettings({ nightShift: v });
  
  const brightness = settings.brightness;
  const setBrightness = (v: number) => updateSettings({ brightness: v });
  
  const volume = settings.volume;
  const setVolume = (v: number) => updateSettings({ volume: v });
  
  const silentMode = settings.powerSaver;
  const setSilentMode = (v: boolean) => updateSettings({ powerSaver: v });

  const [spotifyState, setSpotifyState] = useState({
    title: 'Nessun brano in riproduzione',
    artist: 'Apri Spotify per sincronizzare',
    cover: '',
    isPlaying: false
  });

  const spotifyControl = useRef({
    playPause: () => {},
    next: () => {},
    prev: () => {}
  }).current;

  const user = useMemo(() => settings.user, [settings.user]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Battery
  useEffect(() => {
    Battery.getBatteryLevelAsync().then(level => {
      setBatteryLevel(level);
    }).catch(() => {});

    const sub = Battery.addBatteryLevelListener(({ batteryLevel: l }) => {
      setBatteryLevel(l);
    });
    return () => sub.remove();
  }, []);

  // Geolocation + Weather
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = loc.coords;

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current_weather=true&temperature_unit=celsius`
        );
        const data = await res.json();
        const cw = data.current_weather;
        setWeather({
          tempC: Math.round(cw.temperature),
          icon: wmoToIcon(cw.weathercode),
        });
      } catch (e) {
        // Silently fail — weather will remain null
      }
    })();
  }, []);

  const addToHistory = (appId: string) => {
    setAppHistory(prev => {
      const filtered = prev.filter(id => id !== appId);
      return [appId, ...filtered].slice(0, 10);
    });
  };

  return (
    <OSContext.Provider value={{
      state, setState, user,
      wifi, setWifi,
      bluetooth, setBluetooth,
      nightLight, setNightLight,
      dnd, setDnd,
      brightness, setBrightness,
      volume, setVolume,
      silentMode, setSilentMode,
      isSleeping, setIsSleeping,
      showControlCenter, setShowControlCenter,
      isResetting, setIsResetting,
      resetType, setResetType,
      activeMenu, setActiveMenu,
      isAppDrawerOpen, setIsAppDrawerOpen,
      appHistory, addToHistory,
      time,
      weather,
      batteryLevel,
      spotifyState, setSpotifyState,
      spotifyControl
    }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
