import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Theme } from './src/theme';
import { Header, Body } from './src/components/Typography';
import { CalendarScreen } from './src/screens/CalendarScreen';
import { WeatherScreen } from './src/screens/WeatherScreen';
import { NewsScreen } from './src/screens/NewsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { initDatabase } from './src/services/database';
import { setupNotifications } from './src/services/notifications';
import { Settings as SettingsIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

type Tab = 'Calendario' | 'Meteo' | 'Notizie' | 'Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Calendario');
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      await setupNotifications();
      setDbReady(true);
    };
    initialize();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Calendario': return <CalendarScreen />;
      case 'Meteo': return <WeatherScreen />;
      case 'Notizie': return <NewsScreen />;
      case 'Settings': return <SettingsScreen />;
      default: return <CalendarScreen />;
    }
  };

  const TabButton = ({ title, active }: { title: Tab, active: boolean }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(title)}
      style={[
        styles.tabButton,
        active ? styles.tabButtonActive : null,
        active ? Theme.shadows.light : null
      ]}
    >
      <Body style={[styles.tabText, active ? styles.tabTextActive : null] as any}>{title}</Body>
    </TouchableOpacity>
  );

  if (!dbReady) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <Header>news+</Header>
        <TouchableOpacity onPress={() => setActiveTab('Settings')}>
          <SettingsIcon {...({ color: activeTab === 'Settings' ? Theme.colors.primary : Theme.colors.text, size: 28 } as any)} />
        </TouchableOpacity>
      </View>

      {/* Segmented Control / Top Tabs */}
      <View style={styles.tabBar}>
        <TabButton title="Calendario" active={activeTab === 'Calendario'} />
        <TabButton title="Meteo" active={activeTab === 'Meteo'} />
        <TabButton title="Notizie" active={activeTab === 'Notizie'} />
      </View>

      <Animated.View
        key={activeTab}
        entering={FadeIn.duration(400)}
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.background,
    marginHorizontal: Theme.spacing.lg,
    padding: 6,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Theme.colors.white,
  },
  tabText: {
    fontSize: 14,
    color: Theme.colors.textLight,
  },
  tabTextActive: {
    color: Theme.colors.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
