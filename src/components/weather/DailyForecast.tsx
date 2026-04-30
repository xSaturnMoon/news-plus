import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Body, Caption } from '../Typography';
import { CardSoft } from '../CardSoft';

interface DailyForecastProps {
    data: Array<{
        date: string;
        dateKey: string;
        tempMin: number;
        tempMax: number;
        icon: string;
        popMax: number;
    }>;
    getWeatherEmoji: (icon: string) => string;
    onPressDay?: (dateKey: string, dayName: string) => void;
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ data, getWeatherEmoji, onPressDay }) => {
    const { theme } = useTheme();
    return (
        <CardSoft style={styles.card}>
            {data.map((day, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.row, { borderBottomColor: theme.colors.border }, index === data.length - 1 && styles.noBorder]}
                    onPress={() => onPressDay?.(day.dateKey, day.date)}
                    activeOpacity={0.7}
                >
                    <Body style={[styles.dayName, { color: theme.colors.text }]}>{day.date}</Body>
                    <View style={styles.iconContainer}>
                        <Text style={styles.emoji}>{getWeatherEmoji(day.icon)}</Text>
                        {day.popMax > 0 && <Caption style={[styles.pop, { color: theme.colors.primary }]}>{day.popMax}%</Caption>}
                    </View>
                    <View style={styles.tempRange}>
                        <Caption style={[styles.minTemp, { color: theme.colors.textLight }]}>{day.tempMin}°</Caption>
                        <View style={styles.barContainer}>
                            <View style={[styles.barBg, { backgroundColor: theme.colors.primary + '20' }]} />
                        </View>
                        <Body style={[styles.maxTemp, { color: theme.colors.text }]}>{day.tempMax}°</Body>
                    </View>
                </TouchableOpacity>
            ))}
        </CardSoft>
    );
};

const styles = StyleSheet.create({
    card: {
        marginVertical: 15,
        paddingHorizontal: 15,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    dayName: {
        flex: 1.5,
        textTransform: 'capitalize',
        fontWeight: '800',
        fontSize: 17,
    },
    iconContainer: {
        flex: 1,
        alignItems: 'center',
    },
    emoji: {
        fontSize: 26,
    },
    pop: {
        fontSize: 10,
        fontWeight: '900',
    },
    tempRange: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    minTemp: {
        width: 40,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: '700',
    },
    maxTemp: {
        fontWeight: '800',
        width: 40,
        textAlign: 'right',
        fontSize: 17,
    },
    barContainer: {
        flex: 1,
        height: 4,
        marginHorizontal: 12,
        justifyContent: 'center',
    },
    barBg: {
        height: 4,
        borderRadius: 2,
    }
});