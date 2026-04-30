import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { CardSoft } from '../CardSoft';
import { Body, Caption } from '../Typography';

interface HourlyForecastProps {
    data: Array<{
        time: string;
        temp: number;
        icon: string;
        pop: number;
    }>;
    getWeatherEmoji: (icon: string) => string;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ data, getWeatherEmoji }) => {
    const { theme } = useTheme();
    return (
        <CardSoft style={styles.card}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
                {data.map((item, index) => (
                    <View key={index} style={styles.item}>
                        <Caption style={[styles.time, { color: theme.colors.text }]}>{item.time}</Caption>
                        <Text style={styles.emoji}>{getWeatherEmoji(item.icon)}</Text>
                        <Body style={[styles.temp, { color: theme.colors.text }]}>{item.temp}°</Body>
                        {item.pop > 0 && (
                            <Caption style={[styles.pop, { color: theme.colors.primary }]}>{item.pop}%</Caption>
                        )}
                    </View>
                ))}
            </ScrollView>
        </CardSoft>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 15,
        paddingVertical: 15,
    },
    scroll: {
        flexDirection: 'row',
    },
    item: {
        alignItems: 'center',
        width: 65,
    },
    time: {
        fontWeight: '800',
        fontSize: 12,
    },
    emoji: {
        fontSize: 26,
        marginVertical: 6,
    },
    temp: {
        fontWeight: '800',
        fontSize: 17,
    },
    pop: {
        fontSize: 10,
        fontWeight: '900',
        marginTop: 2,
    }
});