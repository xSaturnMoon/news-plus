import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../theme/ThemeContext';

interface CardSoftProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export const CardSoft = ({ children, style }: CardSoftProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={[
                styles.cardContainer,
                {
                    borderColor: theme.colors.border,
                    borderRadius: theme.borderRadius.lg,
                },
                theme.shadows.medium,
                style
            ]}
        >
            <BlurView 
                intensity={isDark ? 15 : 25} 
                tint={isDark ? 'dark' : 'light'} 
                style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.card }]} 
            />
            <View style={[styles.innerContent, { padding: theme.spacing.md }]}>
                {children}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginVertical: 8,
        borderWidth: 1,
        overflow: 'hidden',
    },
    innerContent: {
        width: '100%',
    },
});
