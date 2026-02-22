import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Body, Caption } from '../Typography';
import { Theme } from '../../theme';
import { Droplets, Wind, Thermometer, Eye, Gauge } from 'lucide-react-native';

interface WeatherDetailsProps {
    current: {
        humidity: number;
        windSpeed: number;
        feelsLike: number;
        visibility: number;
        pressure: number;
    };
}

const DetailCard = ({ icon: Icon, label, value, unit }: any) => (
    <View style={styles.detailCard}>
        <View style={styles.labelRow}>
            <Icon size={14} color={Theme.colors.textLight} />
            <Caption style={styles.label}>{label}</Caption>
        </View>
        <Body style={styles.value}>{value}{unit}</Body>
    </View>
);

export const WeatherDetails: React.FC<WeatherDetailsProps> = ({ current }) => {
    return (
        <View style={styles.container}>
            <View style={styles.grid}>
                <DetailCard icon={Thermometer} label="PERCEPITA" value={current.feelsLike} unit="°" />
                <DetailCard icon={Droplets} label="UMIDITÀ" value={current.humidity} unit="%" />
                <DetailCard icon={Wind} label="VENTO" value={current.windSpeed} unit=" km/h" />
                <DetailCard icon={Eye} label="VISIBILITÀ" value={(current.visibility / 1000).toFixed(1)} unit=" km" />
                <DetailCard icon={Gauge} label="PRESSIONE" value={current.pressure} unit=" hPa" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: Theme.spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.sm,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        color: Theme.colors.textLight,
        marginLeft: 6,
        fontSize: 10,
        fontWeight: 'bold',
    },
    value: {
        color: Theme.colors.text,
        fontSize: 20,
        fontWeight: 'bold',
    },
});