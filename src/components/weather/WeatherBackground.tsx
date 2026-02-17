import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../theme';

interface WeatherBackgroundProps {
    condition: string;
    children: React.ReactNode;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition, children }) => {
    const getBackgroundColor = () => {
        const c = condition.toLowerCase();
        if (c.includes('clear')) return '#E3F2FD'; // Soft Pastel Blue
        if (c.includes('cloud')) return '#F5F5F5'; // Soft Light Grey
        if (c.includes('rain') || c.includes('drizzle')) return '#E1F5FE'; // Very Light Blue
        if (c.includes('thunder')) return '#EDE7F6'; // Light Pastel Purple
        if (c.includes('snow')) return '#FFFFFF'; // White
        return Theme.colors.background; // Default soft background
    };

    return (
        <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
