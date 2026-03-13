import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useOS } from '../hooks/useOS';

interface MenuItemProps {
    label: string;
    onPress?: () => void;
    shortcut?: string;
    hasSubmenu?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, onPress, shortcut, hasSubmenu }) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        activeOpacity={0.5}
    >
        <Text style={styles.menuItemLabel}>{label}</Text>
        <View style={styles.menuItemRight}>
            {shortcut && <Text style={styles.shortcutText}>{shortcut}</Text>}
            {hasSubmenu && <ChevronRight size={14} color="rgba(255,255,255,0.4)" />}
        </View>
    </TouchableOpacity>
);

const Separator = () => <View style={styles.separator} />;

export const SystemMenu = () => {
    const { setState, setIsSleeping, setActiveMenu } = useOS();

    return (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.menuContainer}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <MenuItem label="Standby" onPress={() => { setIsSleeping(true); setActiveMenu(null); }} />
                <MenuItem label="Riavvia..." onPress={() => { setState('BOOT'); setActiveMenu(null); }} />
                <MenuItem label="Spegni..." onPress={() => { setState('SHUTDOWN'); setActiveMenu(null); }} />
                <Separator />
                <MenuItem label="Blocca schermo" shortcut="^ ⌘ Q" />
                <MenuItem label="Logout" shortcut="⇧ ⌘ Q" onPress={() => { setState('LOGIN'); setActiveMenu(null); }} />
            </BlurView>
        </Animated.View>
    );
};

export const DesktopMenu = () => {
    const [showCreateSubmenu, setShowCreateSubmenu] = useState(false);

    return (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(100)} style={styles.menuContainer}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                <MenuItem label="Background" />
                <View>
                    <MenuItem
                        label="Create"
                        hasSubmenu
                        onPress={() => setShowCreateSubmenu(!showCreateSubmenu)}
                    />
                    {showCreateSubmenu && (
                        <View style={styles.submenuContainer}>
                            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                                <MenuItem label="File" />
                                <MenuItem label="Folder" />
                            </BlurView>
                        </View>
                    )}
                </View>
            </BlurView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    menuContainer: {
        position: 'absolute',
        top: 32,
        left: 8,
        width: 260,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 2000,
    },
    submenuContainer: {
        position: 'absolute',
        top: 0,
        left: 250,
        width: 200,
        borderRadius: 8,
        overflow: 'hidden',
        zIndex: 2001,
    },
    blurContainer: {
        padding: 6,
        backgroundColor: 'rgba(40, 40, 40, 0.7)',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    menuItemLabel: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '400',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    shortcutText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
        marginHorizontal: 8,
    },
});
