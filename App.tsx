import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Theme } from './src/theme';
import { Header, Body } from './src/components/Typography';
import { HomeScreen } from './src/screens/HomeScreen';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { WeatherScreen } from './src/screens/WeatherScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ShoppingListScreen } from './src/screens/ShoppingListScreen';
import { initDatabase } from './src/services/database';
import { setupNotifications } from './src/services/notifications';
import { ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

type Section = 'Home' | 'Calendario' | 'Meteo' | 'Notizie' | 'Spesa';

export default function App() {
  const [activeSection, setActiveSection] = useState<Section>('Home');
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      const notifsEnabled = await setupNotifications();
      if (!notifsEnabled) {
        const { Alert } = require('react-native');
        Alert.alert(
          'Permessi Notifiche',
          'L\'app non ha i permessi per inviare notifiche. Senza di questi, non riceverai gli avvisi del calendario. Controlla le impostazioni di iOS.'
        );
      }
      setDbReady(true);
    };
    initialize();
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'Home': return <HomeScreen onNavigate={setActiveSection} />;
      case 'Calendario': return <CalendarScreen />;
      case 'Meteo': return <WeatherScreen />;
      case 'Notizie': return <NewsScreen />;
      case 'Spesa': return <ShoppingListScreen />;
      default: return <HomeScreen onNavigate={setActiveSection} />;
    }
  };

  if (!dbReady) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {activeSection !== 'Home' && (
            <TouchableOpacity
              onPress={() => setActiveSection('Home')}
              style={styles.backButton}
            >
              <ChevronLeft color={Theme.colors.text} size={28} />
            </TouchableOpacity>
          )}
          <Header style={styles.logoText}>news+</Header>
        </View>
      </View>

      <Animated.View
        key={activeSection}
        entering={activeSection === 'Home' ? FadeIn.duration(400) : SlideInRight.duration(400)}
        style={styles.content}
      >
        {renderContent()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    backgroundColor: Theme.colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Theme.spacing.sm,
    marginLeft: -Theme.spacing.xs,
  },
  logoText: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
});
