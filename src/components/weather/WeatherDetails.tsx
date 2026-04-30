import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Body, Caption } from '../Typography';
import { Droplets, Wind, Thermometer, Eye, Gauge } from 'lucide-react-native';
import { CardSoft } from '../CardSoft';

interface WeatherDetailsProps {
    current: {
        humidity: number;
        windSpeed: number;
        feelsLike: number;
        visibility: number;
        pressure: number;
    };
}

const DetailCard = ({ icon: Icon, label, value, unit }: any) => {
    const { theme } = useTheme();
    return (
        <CardSoft style={styles.detailCard}>
            <View style={styles.labelRow}>
                <Icon size={14} color={theme.colors.textLight} />
                <Caption style={[styles.label, { color: theme.colors.textLight }]}>{label}</Caption>
            </View>
            <Body style={[styles.value, { color: theme.colors.text }]}>{value}{unit}</Body>
        </CardSoft>
    );
};

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ current }) => {
    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <DetailCard icon={Thermometer} label="PERCEPITA" value={Math.round(current.feelsLike)} unit="°" />
                <DetailCard icon={Droplets} label="UMIDITÀ" value={current.humidity} unit="%" />
                <DetailCard icon={Wind} label="VENTO" value={Math.round(current.windSpeed)} unit=" km/h" />
                <DetailCard icon={Eye} label="VISIBILITÀ" value={(current.visibility / 1000).toFixed(1)} unit=" km" />
                <DetailCard icon={Gauge} label="PRESSIONE" value={current.pressure} unit=" hPa" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailCard: {
        width: '48.5%',
        marginBottom: 10,
        padding: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        marginLeft: 8,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    value: {
        fontSize: 22,
        fontWeight: '800',
    },
});