import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOutDown, Layout } from 'react-native-reanimated';
import { Search, Chrome, Settings, MessageSquare, LayoutGrid, Clock, Music, Folder, Code, Sparkles, Bot, Calculator, MessageCircle, Gamepad2 } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';
import { useOS } from '../hooks/useOS';
import { useWindowDimensions } from 'react-native';

export const ALL_APPS = [
    { id: 'chrome', name: 'Browser', icon: Chrome, color: '#DB4437' },
    { id: 'filemanager', name: 'File Manager', icon: Folder, color: '#007AFF' },
    { id: 'discord', name: 'Discord', icon: MessageSquare, color: '#5865F2' },
    { id: 'settings', name: 'Impostazioni', icon: Settings, color: '#8E8E93' },
    { id: 'obsidian', name: 'Obsidian OS', icon: LayoutGrid, color: '#007AFF' },
    { id: 'spotify', name: 'Spotify', icon: Music, color: '#1ED760' },
    { id: 'vscode', name: 'VS Code', icon: Code, color: '#0066b8' },
    { id: 'gemini', name: 'Gemini', icon: Sparkles, color: '#9B72CB' },
    { id: 'claude', name: 'Claude', icon: Bot, color: '#D37A5C' },
    { id: 'calculator', name: 'Calcolatrice', icon: Calculator, color: '#FF9500' },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
    { id: 'minecraft', name: 'Minecraft', icon: LayoutGrid, color: '#3c8527' },
    { id: 'geforcenow', name: 'GeForce Now', icon: Gamepad2, color: '#76b900' },
];

interface AppDrawerProps {
    onClose: () => void;
    onOpenApp: (appId: string) => void;
}

export const AppDrawer = ({ onClose, onOpenApp }: AppDrawerProps) => {
    const { settings } = useSettings();
    const { appHistory } = useOS();
    const { width, height } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredApps = ALL_APPS.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Build recent history list from app IDs
    const recentApps = appHistory
        .map(id => ALL_APPS.find(a => a.id === id))
        .filter(Boolean) as typeof ALL_APPS;

    const isLight = settings.theme === 'light';
    const textColor = isLight ? '#000' : '#fff';
    const subtextColor = isLight ? '#666' : '#aaa';
    const panelBg = isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 30, 30, 0.65)';
    const borderColor = isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)';
    const itemBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)';

    const drawerWidth = Math.min(720, width - 40);
    const drawerHeight = Math.min(580, height - 160);

    return (
        <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOutDown.duration(180)}
            style={[
                styles.container,
                {
                    width: drawerWidth,
                    height: drawerHeight,
                }
            ]}
        >
            <BlurView
                intensity={Platform.OS === 'web' ? 70 : 100}
                tint={isLight ? 'light' : 'dark'}
                style={[
                    styles.glassPanel,
                    { backgroundColor: panelBg, borderColor }
                ]}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={17} color={subtextColor} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor }]}
                        placeholder="Cerca app, impostazioni e documenti"
                        placeholderTextColor={subtextColor}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Split Layout */}
                <View style={styles.contentArea}>

                    {/* Left: All Apps list */}
                    <View style={styles.leftColumn}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Tutte le app</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredApps.map((app, index) => (
                                <Animated.View key={app.id} entering={FadeIn.delay(index * 30)}>
                                    <TouchableOpacity
                                        style={[styles.listItem, { backgroundColor: itemBg }]}
                                        onPress={() => onOpenApp(app.id)}
                                    >
                                        <View style={styles.listIcon}>
                                            <app.icon size={20} color={app.color} />
                                        </View>
                                        <Text style={[styles.listName, { color: textColor }]}>{app.name}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                            {filteredApps.length === 0 && (
                                <Text style={[styles.emptyText, { color: subtextColor }]}>Nessuna app trovata.</Text>
                            )}
                        </ScrollView>
                    </View>

                    {/* Right: Pinned Grid + Recent History */}
                    <View style={styles.rightColumn}>

                        {/* Pinned Grid */}
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Preferiti</Text>
                        <Animated.View style={styles.appsGrid} layout={Layout}>
                            {filteredApps.map((app, index) => (
                                <Animated.View key={`grid-${app.id}`} entering={FadeIn.delay(80 + index * 40).springify()}>
                                    <TouchableOpacity
                                        style={styles.gridItem}
                                        onPress={() => onOpenApp(app.id)}
                                    >
                                        <View style={[styles.gridIconBox, { backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.12)' }]}>
                                            <app.icon size={28} color={app.color} />
                                        </View>
                                        <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>{app.name}</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </Animated.View>

                        {/* Recent History */}
                        <View style={styles.recentHeader}>
                            <Clock size={14} color={subtextColor} />
                            <Text style={[styles.sectionTitle, { color: textColor, marginBottom: 0, marginLeft: 6 }]}>Aperti di recente</Text>
                        </View>

                        <View style={styles.recentList}>
                            {recentApps.length === 0 ? (
                                <Text style={[styles.emptyText, { color: subtextColor }]}>Nessuna app aperta di recente.</Text>
                            ) : (
                                recentApps.map((app, index) => (
                                    <Animated.View key={`recent-${app.id}-${index}`} entering={FadeIn.delay(index * 30)}>
                                        <TouchableOpacity
                                            style={[styles.recentItem, { backgroundColor: itemBg }]}
                                            onPress={() => onOpenApp(app.id)}
                                        >
                                            <View style={styles.recentIcon}>
                                                <app.icon size={18} color={app.color} />
                                            </View>
                                            <Text style={[styles.recentName, { color: textColor }]}>{app.name}</Text>
                                        </TouchableOpacity>
                                    </Animated.View>
                                ))
                            )}
                        </View>

                    </View>
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        zIndex: 2000,
        ...Platform.select({
            web: {
                boxShadow: '0px 20px 50px rgba(0,0,0,0.45), inset 0px 1px 1px rgba(255,255,255,0.25)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.4,
                shadowRadius: 30,
            }
        })
    },
    glassPanel: {
        flex: 1,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 22,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(150,150,150,0.12)',
        borderRadius: 22,
        paddingHorizontal: 16,
        marginBottom: 20,
        height: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        outlineStyle: 'none' as any,
    },
    contentArea: {
        flex: 1,
        flexDirection: 'row',
        gap: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 14,
    },
    leftColumn: {
        flex: 1,
        borderRightWidth: 1,
        borderRightColor: 'rgba(150,150,150,0.12)',
        paddingRight: 20,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 4,
    },
    listIcon: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listName: {
        fontSize: 13,
        fontWeight: '400',
    },
    rightColumn: {
        flex: 2,
    },
    appsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: 24,
    },
    gridItem: {
        alignItems: 'center',
        width: 72,
    },
    gridIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 7,
        ...Platform.select({
            web: {
                boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
            }
        })
    },
    gridName: {
        fontSize: 11,
        fontWeight: '400',
        textAlign: 'center',
    },
    recentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    recentList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 10,
    },
    recentIcon: {
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentName: {
        fontSize: 13,
        fontWeight: '400',
    },
    emptyText: {
        fontSize: 13,
        marginTop: 10,
    }
});
