import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CardSoft } from '../CardSoft';
import { Body, Caption } from '../Typography';
import { Theme } from '../../theme';

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
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
                {data.map((item, index) => (
                    <View key={index} style={styles.item}>
                        <Caption style={styles.time}>{item.time}</Caption>
                        <Body style={styles.emoji}>{getWeatherEmoji(item.icon)}</Body>
                        <Body style={styles.temp}>{item.temp}°</Body>
                        {item.pop > 0 && (
                            <Caption style={styles.pop}>{item.pop}%</Caption>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: Theme.spacing.md,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
    },
    scroll: {
        flexDirection: 'row',
    },
    item: {
        alignItems: 'center',
        width: 60,
        marginRight: Theme.spacing.sm,
    },
    time: {
        color: Theme.colors.text,
        fontWeight: 'bold',
    },
    emoji: {
        fontSize: 24,
        marginVertical: 4,
    },
    temp: {
        color: Theme.colors.text,
        fontWeight: 'bold',
    },
    pop: {
        color: Theme.colors.textLight,
        fontSize: 10,
    }
});