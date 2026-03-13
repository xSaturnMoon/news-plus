import React, { useState } from 'react';
import { View, StyleSheet, Text, ImageBackground, TouchableOpacity, Pressable, Linking, Platform, LayoutAnimation } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Wifi, Battery, Volume2, Search, Sun, Cloud, Layout, Compass, Mail, Map, Image as ImageIcon, Video, Calendar, User, FileText, Bell, Tv, Music, Radio, ShoppingBag, Settings, Trash2, Chrome, LayoutGrid, Folder } from 'lucide-react-native';
import { ControlCenter } from './ControlCenter';
import { SystemMenu, DesktopMenu } from './Menus';
import { ChromeWindow } from './ChromeWindow';
import { SettingsWindow } from './SettingsWindow';
import { AppDrawer, ALL_APPS } from './AppDrawer';
import { DiscordWindow } from './DiscordWindow';
import { SpotifyWindow } from './SpotifyWindow';
import { FileManagerWindow } from './FileManagerWindow';
import { VSCodeWindow } from './VSCodeWindow';
import { GeminiWindow } from './GeminiWindow';
import { ClaudeWindow } from './ClaudeWindow';
import { CalculatorWindow } from './CalculatorWindow';
import { WhatsAppWindow } from './WhatsAppWindow';
import { launchAmethyst } from '../../modules/amethyst';
import { GeForceNowWindow } from './GeForceNowWindow';
import Window from './Window';
import { DockIcon } from './DockIcon';
import { useOS } from '../hooks/useOS';
import { useSettings } from '../context/SettingsContext';

// WALLPAPER is now dynamic from settings
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const DOCK_APPS = [
  { id: 'chrome', icon: Chrome, color: '#DB4437' },
  { id: 'filemanager', icon: Folder, color: '#007AFF', isFolder: true },
  { id: 'settings', icon: Settings, color: '#8E8E93' },
    { id: 'minecraft', icon: LayoutGrid, color: '#3c8527', name: 'Minecraft' },
];

export const DesktopScreen = () => {
  const { 
    showControlCenter, setShowControlCenter, 
    wifi, volume, time,
    activeMenu, setActiveMenu,
    isAppDrawerOpen, setIsAppDrawerOpen,
    addToHistory,
    weather,
    batteryLevel,
  } = useOS();

  const { settings } = useSettings();
  const [chromeStatus, setChromeStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [settingsStatus, setSettingsStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [discordStatus, setDiscordStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [spotifyStatus, setSpotifyStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [fileManagerStatus, setFileManagerStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [fileManagerTab, setFileManagerTab] = useState('Documenti');
  
  const [vscodeStatus, setVscodeStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [geminiStatus, setGeminiStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [claudeStatus, setClaudeStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [calculatorStatus, setCalculatorStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [whatsappStatus, setWhatsappStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  const [geforceNowStatus, setGeforceNowStatus] = useState<'closed' | 'open' | 'minimized'>('closed');
  
  const [activeWindow, setActiveWindow] = useState('');
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const [maximizedWindows, setMaximizedWindows] = useState<Record<string, boolean>>({});
  const [isDockHovered, setIsDockHovered] = useState(false);

  const formattedDate = time.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  const formattedTime = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false });

  const closeAllMenus = () => {
    setActiveMenu(null);
    setShowControlCenter(false);
    setIsAppDrawerOpen(false);
  };

  const openApp = (appId: string) => {
    addToHistory(appId);
    setIsAppDrawerOpen(false);
    if (appId === 'chrome') {
      setChromeStatus('open');
    } else if (appId === 'settings') {
      setSettingsStatus('open');
    } else if (appId === 'discord') {
      setDiscordStatus('open');
    } else if (appId === 'spotify') {
      setSpotifyStatus('open');
    } else if (appId === 'filemanager') {
      setFileManagerTab('Documenti'); // default via app drawer
      setFileManagerStatus('open');
    } else if (appId === 'vscode') {
      setVscodeStatus('open');
    } else if (appId === 'gemini') {
      setGeminiStatus('open');
    } else if (appId === 'claude') {
      setClaudeStatus('open');
    } else if (appId === 'calculator') {
      setCalculatorStatus('open');
    } else if (appId === 'minecraft') {
      launchAmethyst();
    } else if (appId === 'geforcenow') {
      setGeforceNowStatus('open');
      setActiveWindow('geforcenow');
    }
  };

  const toggleMaximize = (appId: string) => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
    });
    setMaximizedWindows(prev => ({
      ...prev,
      [appId]: !prev[appId]
    }));
    // If we maximize/unmaximize, we might want to hide/show dock
    setIsAppFullscreen(!maximizedWindows[appId]);
  };

  const animatedDockStyle = useAnimatedStyle(() => {
    const shouldHide = isAppFullscreen && !isDockHovered;
    return {
      transform: [
        {
          translateY: withSpring(shouldHide ? 120 : 0, {
            damping: 25,
            stiffness: 400,
          }),
        },
      ],
    };
  }, [isAppFullscreen, isDockHovered]);

  const openAppIds = [
      chromeStatus !== 'closed' ? 'chrome' : null,
      settingsStatus !== 'closed' ? 'settings' : null,
      discordStatus !== 'closed' ? 'discord' : null,
      spotifyStatus !== 'closed' ? 'spotify' : null,
      fileManagerStatus !== 'closed' ? 'filemanager' : null,
      vscodeStatus !== 'closed' ? 'vscode' : null,
      geminiStatus !== 'closed' ? 'gemini' : null,
      claudeStatus !== 'closed' ? 'claude' : null,
      calculatorStatus !== 'closed' ? 'calculator' : null,
      whatsappStatus !== 'closed' ? 'whatsapp' : null,
      geforceNowStatus !== 'closed' ? 'geforcenow' : null,
  ].filter(Boolean) as string[];

  const unpinnedOpenApps = ALL_APPS.filter(app => 
      openAppIds.includes(app.id) && !DOCK_APPS.find(d => d.id === app.id)
  );

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Pressable style={styles.container} onPress={closeAllMenus}  onPressIn={() => setIsDockHovered(true)} onPressOut={() => setIsDockHovered(false)}>
        <ImageBackground 
            source={typeof settings.wallpaper === 'number' ? settings.wallpaper : { uri: settings.wallpaper }} 
            style={[
                styles.background, 
                typeof settings.wallpaper === 'string' && settings.wallpaper.startsWith('#') && { backgroundColor: settings.wallpaper }
            ]}
        >
        
        {/* macOS Top Bar */}
        <BlurView intensity={25} tint={settings.theme === 'light' ? 'light' : 'dark'} style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity 
              style={[styles.topBarItem, activeMenu === 'SYSTEM' && styles.topBarItemActive]} 
              onPress={() => setActiveMenu(activeMenu === 'SYSTEM' ? null : 'SYSTEM')}
            >
              <Text style={[styles.topBarText, { fontSize: 18, color: '#fff' }]}>◻️</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.topBarItem, activeMenu === 'DESKTOP' && styles.topBarItemActive]} 
              onPress={() => setActiveMenu(activeMenu === 'DESKTOP' ? null : 'DESKTOP')}
            >
              <Text style={[styles.topBarTextBold, settings.theme === 'light' && { color: '#000' }]}>Desktop</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.topBarItem}>
              <Text style={styles.topBarText}>Information</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarText}>{`${formattedDate}   ${formattedTime}`}</Text>
          </View>

          <View style={styles.topBarRight}>
            <View style={styles.statusIconsContainer}>
              <View style={styles.weatherItem}>
                {weather?.icon === 'rain' ? <Cloud size={14} color="#fff" /> :
                 weather?.icon === 'snow' ? <Cloud size={14} color="#cef" /> :
                 weather?.icon === 'storm' ? <Cloud size={14} color="#f99" /> :
                 <Sun size={14} color="#fff" />}
                <Text style={styles.topBarText}>
                  {weather ? `${weather.tempC}°C` : '--°C'}
                </Text>
              </View>
              <Search size={14} color="#fff" />
              <TouchableOpacity onPress={() => setShowControlCenter(!showControlCenter)}>
                <View style={[styles.controlIcon, { transform: [{ rotate: '90deg' }] }]}>
                  <View style={styles.pillIcon} />
                  <View style={[styles.pillIcon, { opacity: 0.6 }]} />
                </View>
              </TouchableOpacity>
              <View style={styles.systemIcons}>
                {wifi && <Wifi size={14} color="#fff" />}
                <Volume2 size={14} color="#fff" />
                <Battery size={18} color="#fff" />
                {batteryLevel !== null && (
                  <Text style={[styles.topBarText, { marginLeft: 3, fontSize: 11 }]}>
                    {Math.round(batteryLevel * 100)}%
                  </Text>
                )}
              </View>
            </View>
          </View>
        </BlurView>

        {/* Global Overlays */}
        {(activeMenu || showControlCenter) && (
            <>
                <Pressable 
                    style={[StyleSheet.absoluteFill, { zIndex: 1998 }]} 
                    onPress={closeAllMenus} 
                />
                <View style={[StyleSheet.absoluteFill, { zIndex: 2999 }]} pointerEvents="box-none">
                    {activeMenu === 'SYSTEM' && (
                        <View style={styles.systemMenuContainer} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                            <SystemMenu />
                        </View>
                    )}
                    {activeMenu === 'DESKTOP' && (
                        <View style={styles.desktopMenuContainer} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                            <DesktopMenu />
                        </View>
                    )}
                    {showControlCenter && (
                        <View style={styles.controlCenterContainer} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                            <ControlCenter onClose={() => setShowControlCenter(false)} onOpenApp={openApp} />
                        </View>
                    )}
                </View>
            </>
        )}

        {/* App Drawer: rendered directly like windows, not inside overlay */}
        {isAppDrawerOpen && (
            <>
                <Pressable
                    style={[StyleSheet.absoluteFill, { zIndex: 2000 }]}
                    onPress={() => setIsAppDrawerOpen(false)}
                />
                <View style={{ zIndex: 2001, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
                    <AppDrawer onClose={() => setIsAppDrawerOpen(false)} onOpenApp={openApp} />
                </View>
            </>
        )}

        {/* Bottom hover area to reveal dock when in fullscreen */}
        {isAppFullscreen && (
            <View 
                style={styles.dockHoverArea}
                {...Platform.select({
                    web: {
                        onPointerEnter: () => setIsDockHovered(true),
                        onPointerLeave: () => setIsDockHovered(false),
                    }
                })}
            />
        )}

        {/* macOS Dock */}
        <Animated.View 
            style={[
                styles.dockWrapper, 
                animatedDockStyle,
                { bottom: 20 * settings.dockSize }
            ]}
            {...Platform.select({
                web: {
                    onPointerEnter: () => setIsDockHovered(true),
                    onPointerLeave: () => setIsDockHovered(false),
                }
            })}
        >
          <View style={[styles.dockShadowContainer, { borderRadius: 28 * settings.dockSize }]}>
            <BlurView 
                intensity={70} 
                tint={settings.theme === 'light' ? 'light' : 'dark'} 
                style={[
                    styles.dockContainer, 
                    { 
                        paddingHorizontal: 12 * settings.dockSize, 
                        paddingTop: 12 * settings.dockSize, 
                        paddingBottom: 12 * settings.dockSize, 
                        borderRadius: 28 * settings.dockSize, // Rounded rectangle instead of pure pill
                        overflow: 'hidden' // Absolutely required to clip BlurView
                    }
                ]}
              >
              <View style={[styles.dockApps, { gap: 10 * settings.dockSize }]}>
                  {DOCK_APPS.map((app) => {
                      const baseSize = 58 * settings.dockSize;
                      return (
                          <DockIcon
                              key={app.id}
                              id={app.id}
                              icon={app.icon}
                              color={app.color}
                              baseSize={baseSize}
                              maxScale={1.4}
                              dockSize={settings.dockSize}
                              isLight={settings.theme === 'light'}
                              hasIndicator={
                                  (app.id === 'chrome' && chromeStatus !== 'closed') ||
                                  (app.id === 'settings' && settingsStatus !== 'closed') ||
                                  (app.id === 'filemanager' && fileManagerStatus !== 'closed')
                              }
                              onPress={() => {
                                  if (app.id === 'chrome') setChromeStatus(s => s === 'open' ? 'minimized' : 'open');
                                  else if (app.id === 'settings') setSettingsStatus(s => s === 'open' ? 'minimized' : 'open');
                                  else if (app.id === 'filemanager') {
                                      if (fileManagerStatus === 'closed') setFileManagerTab('Documenti');
                                      setFileManagerStatus(s => s === 'open' ? 'minimized' : 'open');
                                  } else if (app.id === 'minecraft') {
                                      import('../../modules/amethyst').then(m => m.launchAmethyst());
                                  }
                              }}
                          />
                      );
                  })}
              </View>

              {unpinnedOpenApps.length > 0 && (
                  <>
                      <View style={[styles.dockSeparator, { height: 40 * settings.dockSize, marginHorizontal: 12 * settings.dockSize }]} />
                      <View style={[styles.dockApps, { gap: 10 * settings.dockSize }]}>
                          {unpinnedOpenApps.map((app) => {
                              const baseSize = 58 * settings.dockSize;
                              return (
                                  <DockIcon
                                      key={app.id}
                                      id={app.id}
                                      icon={app.icon}
                                      color={app.color}
                                      baseSize={baseSize}
                                      maxScale={1.4}
                                      dockSize={settings.dockSize}
                                      isLight={settings.theme === 'light'}
                                      hasIndicator={true}
                                      onPress={() => {
                                          if (app.id === 'chrome') setChromeStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'settings') setSettingsStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'filemanager') {
                                              if (fileManagerStatus === 'closed') setFileManagerTab('Documenti');
                                              setFileManagerStatus(s => s === 'open' ? 'minimized' : 'open');
                                          }
                                          else if (app.id === 'discord') setDiscordStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'spotify') setSpotifyStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'vscode') setVscodeStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'gemini') setGeminiStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'claude') setClaudeStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'calculator') setCalculatorStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'whatsapp') setWhatsappStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'geforcenow') setGeforceNowStatus(s => s === 'open' ? 'minimized' : 'open');
                                          else if (app.id === 'minecraft') import('../../modules/amethyst').then(m => m.launchAmethyst());
                                      }}
                                  />
                              );
                          })}
                      </View>
                  </>
              )}

              <View style={[styles.dockSeparator, { height: 40 * settings.dockSize, marginHorizontal: 12 * settings.dockSize }]} />
              
              <View style={{ flexDirection: 'row', gap: 10 * settings.dockSize, alignItems: 'center', justifyContent: 'center' }}>
                  <DockIcon
                      id="trash"
                      icon={Trash2}
                      color="#F2F2F7"
                      baseSize={58 * settings.dockSize}
                      maxScale={1.4}
                      dockSize={settings.dockSize}
                      isLight={settings.theme === 'light'}
                      hasIndicator={false}
                      onPress={() => {
                          setFileManagerTab('Cestino');
                          setFileManagerStatus('open');
                      }}
                  />
                  <DockIcon
                      id="appdrawer"
                      icon={LayoutGrid}
                      color="#F2F2F7"
                      baseSize={58 * settings.dockSize}
                      maxScale={1.4}
                      dockSize={settings.dockSize}
                      isLight={settings.theme === 'light'}
                      hasIndicator={false}
                      onPress={() => setIsAppDrawerOpen(!isAppDrawerOpen)}
                  />
              </View>
            </BlurView>
          </View>
        </Animated.View>

        {/* Chrome in-app window */}
        {chromeStatus !== 'closed' && (
            <ChromeWindow 
                onClose={() => {
                    setChromeStatus('closed');
                    setIsAppFullscreen(false);
                }} 
                onMinimize={() => setChromeStatus('minimized')}
                isMinimized={chromeStatus === 'minimized'}
                onFullscreenChange={setIsAppFullscreen}
            />
        )}

        {/* System Settings window */}
        {settingsStatus !== 'closed' && (
            <SettingsWindow 
                onClose={() => setSettingsStatus('closed')}
                onMinimize={() => setSettingsStatus('minimized')}
                isMinimized={settingsStatus === 'minimized'}
            />
        )}

        {/* Discord window */}
        {discordStatus !== 'closed' && (
            <DiscordWindow
                onClose={() => setDiscordStatus('closed')}
                onMinimize={() => setDiscordStatus('minimized')}
                isMinimized={discordStatus === 'minimized'}
            />
        )}

        {/* Spotify window */}
        {spotifyStatus !== 'closed' && (
            <SpotifyWindow
                onClose={() => setSpotifyStatus('closed')}
                onMinimize={() => setSpotifyStatus('minimized')}
                isMinimized={spotifyStatus === 'minimized'}
            />
        )}

        {/* File Manager window */}
        {fileManagerStatus !== 'closed' && (
            <FileManagerWindow
                onClose={() => setFileManagerStatus('closed')}
                onMinimize={() => setFileManagerStatus('minimized')}
                isMinimized={fileManagerStatus === 'minimized'}
                activeTab={fileManagerTab}
                onTabChange={setFileManagerTab}
            />
        )}

        {/* VS Code window */}
        {vscodeStatus !== 'closed' && (
            <VSCodeWindow
                onClose={() => setVscodeStatus('closed')}
                onMinimize={() => setVscodeStatus('minimized')}
                isMinimized={vscodeStatus === 'minimized'}
            />
        )}

        {/* Gemini window */}
        {geminiStatus !== 'closed' && (
            <GeminiWindow
                onClose={() => setGeminiStatus('closed')}
                onMinimize={() => setGeminiStatus('minimized')}
                isMinimized={geminiStatus === 'minimized'}
            />
        )}

        {/* Claude window */}
        {claudeStatus !== 'closed' && (
            <ClaudeWindow
                onClose={() => setClaudeStatus('closed')}
                onMinimize={() => setClaudeStatus('minimized')}
                isMinimized={claudeStatus === 'minimized'}
            />
        )}

        {/* Calculator window */}
        {calculatorStatus !== 'closed' && (
            <CalculatorWindow
                onClose={() => setCalculatorStatus('closed')}
                onMinimize={() => setCalculatorStatus('minimized')}
                isMinimized={calculatorStatus === 'minimized'}
            />
        )}

      {/* WhatsApp */}
      {whatsappStatus !== 'closed' && (
        <WhatsAppWindow 
          isMinimized={whatsappStatus === 'minimized'}
          onClose={() => setWhatsappStatus('closed')}
          onMinimize={() => setWhatsappStatus('minimized')}
        />
      )}

      {/* GeForce Now */}
      {geforceNowStatus !== 'closed' && (
          <GeForceNowWindow 
            onClose={() => {
                setGeforceNowStatus('closed');
                setIsAppFullscreen(false);
            }}
            onMinimize={() => setGeforceNowStatus('minimized')}
            isMinimized={geforceNowStatus === 'minimized'}
            onFullscreenChange={setIsAppFullscreen}
          />
      )}

      </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  topBar: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 1001,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarItem: {
    paddingHorizontal: 8,
    height: 24,
    justifyContent: 'center',
    borderRadius: 4,
  },
  topBarItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  controlIcon: {
    gap: 2,
    alignItems: 'center',
  },
  pillIcon: {
    width: 14,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  systemIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  topBarTextBold: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  dockWrapper: {
    position: 'absolute',
    bottom: 15, // Closer to bottom edge
    width: '100%',
    alignItems: 'center',
  },
  dockShadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 20,
  },
  dockContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Slightly more opaque glass
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
  },
  dockApps: {
    flexDirection: 'row',
  },
  dockSeparator: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 0.5,
    borderLeftColor: 'rgba(0,0,0,0.2)',
    height: 34,
  },
  dockItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemMenuContainer: {
    position: 'absolute',
    top: 32,
    left: 12,
  },
  desktopMenuContainer: {
    position: 'absolute',
    top: 32,
    left: 80,
  },
  controlCenterContainer: {
    // No absolute positioning here, the component itself handles it
  },
  dockHoverArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 1000,
  },
  maximizedWindow: {
    top: 32, // Just below top bar
    left: 0,
    width: '100%',
    height: '100%',
    // Dock is handled by animatedDockStyle
  },
});
