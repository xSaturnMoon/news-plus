import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useOS } from '../hooks/useOS';
import { BootScreen } from './BootScreen';
import { LoginScreen } from './LoginScreen';
import { DesktopScreen } from './DesktopScreen';
import { SetupScreen } from './SetupScreen';
import { ResetOverlay } from './ResetOverlay';
import { useSettings } from '../context/SettingsContext';

export const OSContainer = () => {
  const { state, setState, isSleeping, setIsSleeping, nightLight, brightness } = useOS();
  const { settings } = useSettings();

  React.useEffect(() => {
    if (state === 'BOOT') {
      const timer = setTimeout(() => {
        if (settings.loginAutomatically) {
          setState('DESKTOP');
        } else {
          setState('LOGIN');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state, setState, settings.loginAutomatically]);

  const renderScreen = () => {
    if (!settings.isSetupComplete) {
      return <SetupScreen />;
    }

    switch (state) {
      case 'BOOT':
        return <BootScreen />;
      case 'LOGIN':
        return <LoginScreen />;
      case 'DESKTOP':
        return <DesktopScreen />;
      case 'SHUTDOWN':
        throw new Error("KERNEL PANIC: System terminated unexpectedly. Power off initiated.");
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <ResetOverlay />
      {renderScreen()}

      {/* Night Light Tint Overlay */}
      {nightLight && <View pointerEvents="none" style={styles.nightLightOverlay} />}

      {/* Brightness Dimming Overlay */}
      <View
        pointerEvents="none"
        style={[
          styles.brightnessOverlay,
          { opacity: 1 - brightness }
        ]}
      />

      {isSleeping && (
        <Pressable
          style={styles.sleepOverlay}
          onPress={() => setIsSleeping(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sleepOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 9999,
  },
  nightLightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 150, 0, 0.15)',
    zIndex: 9990,
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 9995,
  },
});
