import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Platform, Dimensions, AppState } from 'react-native';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { WeatherScreen } from './src/screens/WeatherScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { FloatingTabBar, Section } from './src/components/FloatingTabBar';
import { initDatabase } from './src/services/database';
import { setupNotifications } from './src/services/notifications';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import Animated, { FadeIn } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function AppContent() {
  const [activeSection, setActiveSection] = useState<Section>('Calendario');
  const [dbReady, setDbReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      await setupNotifications();
      const notifications = require('./src/services/notifications');
      await notifications.clearBadge();
      setDbReady(true);
    };
    initialize();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        const notifications = require('./src/services/notifications');
        notifications.clearBadge();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'Calendario': return <CalendarScreen />;
      case 'Meteo': return <WeatherScreen />;
      case 'Notizie': return <NewsScreen />;
      case 'Spesa': return <ShoppingListScreen />;
      case 'Impostazioni': return <SettingsScreen />;
      default: return <CalendarScreen />;
    }
  };

  if (!dbReady) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme.mode === 'dark' ? "light-content" : "dark-content"} />
      
      <Animated.View
        key={activeSection}
        entering={FadeIn.duration(300)}
        style={styles.content}
      >
        {renderContent()}
      </Animated.View>

      <FloatingTabBar 
        activeSection={activeSection} 
        onNavigate={setActiveSection} 
      />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Deepest base
  },
  content: {
    flex: 1,
    height: SCREEN_HEIGHT, // Ensure it fills the screen
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight,
  },
});
