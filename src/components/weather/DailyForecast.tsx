import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption } from '../Typography';
import { Theme } from '../../theme';

interface DailyForecastProps {
    data: Array<{
        date: string;
        tempMin: number;
        tempMax: number;
        icon: string;
        popMax: number;
    }>;
    getWeatherEmoji: (icon: string) => string;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ data, getWeatherEmoji }) => {
    return (
        <View style={styles.container}>
            {data.map((day, index) => (
                <View key={index} style={styles.row}>
                    <Body style={styles.dayName}>{day.date}</Body>
                    <View style={styles.iconContainer}>
                        <Body style={styles.emoji}>{getWeatherEmoji(day.icon)}</Body>
                        {day.popMax > 0 && <Caption style={styles.pop}>{day.popMax}%</Caption>}
                    </View>
                    <View style={styles.tempRange}>
                        <Caption style={styles.minTemp}>{day.tempMin}°</Caption>
                        <View style={styles.barContainer}>
                            <View style={styles.barBg} />
                            {/* In a real app, we'd calculate the position based on overall min/max */}
                        </View>
                        <Body style={styles.maxTemp}>{day.tempMax}°</Body>
                    </View>
                </View>
            ))}
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
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    dayName: {
        flex: 1.5,
        color: Theme.colors.text,
        textTransform: 'capitalize',
        fontWeight: 'bold',
    },
    iconContainer: {
        flex: 1,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 20,
    },
    pop: {
        color: Theme.colors.textLight,
        fontSize: 10,
        fontWeight: 'bold',
    },
    tempRange: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    minTemp: {
        color: Theme.colors.textLight,
        width: 30,
        textAlign: 'right',
    },
    maxTemp: {
        color: Theme.colors.text,
        fontWeight: 'bold',
        width: 30,
        textAlign: 'right',
    },
    barContainer: {
        flex: 1,
        height: 4,
        marginHorizontal: 10,
        justifyContent: 'center',
    },
    barBg: {
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
    }
});