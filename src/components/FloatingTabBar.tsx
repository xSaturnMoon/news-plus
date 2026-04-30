import React, { useEffect, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Platform, PanResponder
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, CloudSun, Newspaper, ShoppingCart, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

export type Section = 'Calendario' | 'Meteo' | 'Notizie' | 'Spesa' | 'Impostazioni';

const TABS = [
    { id: 'Calendario', icon: Calendar },
    { id: 'Spesa',      icon: ShoppingCart },
    { id: 'Meteo',      icon: CloudSun },
    { id: 'Notizie',    icon: Newspaper },
    { id: 'Impostazioni', icon: Settings },
];

const ITEM_W  = 64;
const ITEM_H  = 54;
const PAD     = 6;
const MAX_IDX = TABS.length - 1;

export const FloatingTabBar = ({ activeSection, onNavigate }: FloatingTabBarProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const activeIndex  = TABS.findIndex(t => t.id === activeSection);
    const tx           = useSharedValue(activeIndex * ITEM_W);
    const dragStartX   = useRef(0);
    const currentIndex = useRef(activeIndex);
    const isDragging   = useRef(false);

    useEffect(() => {
        currentIndex.current = activeIndex;
        if (!isDragging.current) {
            tx.value = withSpring(activeIndex * ITEM_W, {
                damping: 30, stiffness: 300, mass: 0.5,
            });
        }
    }, [activeIndex]);

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder:       () => false,
            onStartShouldSetPanResponderCapture:() => false,
            onMoveShouldSetPanResponder:        (_, { dx, dy }) =>
                Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy),
            onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
                Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy),

            onPanResponderGrant: () => {
                isDragging.current = true;
                dragStartX.current = tx.value;
            },

            onPanResponderMove: (_, { dx }) => {
                const clamped = Math.max(0, Math.min(MAX_IDX * ITEM_W, dragStartX.current + dx));
                tx.value = clamped;
            },

            onPanResponderRelease: (_, { dx }) => {
                isDragging.current = false;
                const raw     = tx.value;
                const nearest = Math.round(Math.max(0, Math.min(MAX_IDX, raw / ITEM_W)));
                tx.value = withSpring(nearest * ITEM_W, { damping: 30, stiffness: 300, mass: 0.5 });
                onNavigate(TABS[nearest].id as Section);
            },

            onPanResponderTerminate: () => {
                isDragging.current = false;
                tx.value = withSpring(currentIndex.current * ITEM_W, {
                    damping: 30, stiffness: 300,
                });
            },
        })
    ).current;

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: tx.value }],
    }));

    const blurTint = isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';

    return (
        <View style={styles.container}>
            <View style={[styles.mainWrapper, { shadowColor: isDark ? '#000' : '#475569' }]}>
                <View style={[styles.glassContainer, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]} {...pan.panHandlers}>
                    <BlurView
                        intensity={Platform.OS === 'ios' ? 80 : 100}
                        tint={blurTint}
                        style={StyleSheet.absoluteFill}
                    />
                    
                    <View style={[styles.innerHighlight, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)' }]} pointerEvents="none" />

                    <Animated.View style={[
                        styles.activeIndicator, 
                        { 
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.6)',
                        },
                        pillStyle
                    ]} pointerEvents="none" />

                    <View style={styles.row}>
                        {TABS.map((tab) => {
                            const isActive = activeSection === tab.id;
                            const activeColor = theme.colors.primary;
                            const inactiveColor = isDark ? '#94A3B8' : '#64748B'; // Solid Slate Grays
                            const color = isActive ? activeColor : inactiveColor;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    onPress={() => onNavigate(tab.id as Section)}
                                    activeOpacity={0.8}
                                    style={styles.tab}
                                >
                                    <tab.icon
                                        color={color}
                                        size={24}
                                        strokeWidth={isActive ? 3 : 2.5}
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        </View>
    );
};

interface FloatingTabBarProps {
    activeSection: Section;
    onNavigate: (section: Section) => void;
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 25,
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        zIndex: 1000,
    },
    mainWrapper: {
        borderRadius: 32,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        backgroundColor: 'transparent',
    },
    glassContainer: {
        flexDirection: 'row',
        paddingHorizontal: PAD,
        paddingVertical: PAD,
        borderRadius: 30,
        borderWidth: 1,
        overflow: 'hidden',
    },
    innerHighlight: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 30,
        borderWidth: 0.5,
        zIndex: 0,
    },
    activeIndicator: {
        position: 'absolute',
        left: PAD,
        top: PAD,
        width: ITEM_W,
        height: ITEM_H,
        borderRadius: 26,
        borderWidth: 0.5,
        zIndex: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    tab: {
        width: ITEM_W,
        height: ITEM_H,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
