import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface WeatherBackgroundProps {
    condition: string;
    children: React.ReactNode;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition, children }) => {
    const { theme, mode } = useTheme();
    const isLight = mode === 'light';

    const getBackgroundColor = () => {
        const c = condition.toLowerCase();
        
        if (isLight) {
            if (c.includes('clear')) return '#F0F9FF'; // Light Sky Blue
            if (c.includes('cloud')) return '#F1F5F9'; // Light Slate
            if (c.includes('rain') || c.includes('drizzle')) return '#E0F2FE'; // Light Rain Blue
            if (c.includes('thunder')) return '#E2E8F0'; // Muted Thunder Grey
            if (c.includes('snow')) return '#F8FAFC'; // Crisp Snow White
            return theme.colors.background;
        } else {
            if (c.includes('clear')) return '#0F172A'; // Deep Night Blue
            if (c.includes('cloud')) return '#1E293B'; // Dark Slate
            if (c.includes('rain') || c.includes('drizzle')) return '#0F172A'; // Dark Stormy Blue
            if (c.includes('thunder')) return '#1E1B4B'; // Dark Indigo
            if (c.includes('snow')) return '#1E293B'; // Cold Dark Grey
            return theme.colors.background;
        }
    };

    const backgroundColor = getBackgroundColor();
    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withTiming(backgroundColor, { duration: 500 })
        };
    }, [backgroundColor]);

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {children}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});