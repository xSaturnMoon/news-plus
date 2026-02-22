import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Theme } from '../theme';
import { SubHeader, Body } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { Calendar, CloudSun, Newspaper, ShoppingCart } from 'lucide-react-native';

interface HomeScreenProps {
    onNavigate: (section: 'Calendario' | 'Meteo' | 'Notizie' | 'Spesa') => void;
}

export const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
    const menuItems = [
        {
            id: 'Calendario',
            title: 'Calendario',
            icon: Calendar,
            color: '#E3F2FD', // Pastel Blue
            iconColor: '#1E88E5',
        },
        {
            id: 'Meteo',
            title: 'Meteo',
            icon: CloudSun,
            color: '#FFF3E0', // Pastel Orange
            iconColor: '#F4511E',
        },
        {
            id: 'Notizie',
            title: 'Notizie',
            icon: Newspaper,
            color: '#F1F8E9', // Pastel Green
            iconColor: '#43A047',
        },
        {
            id: 'Spesa',
            title: 'Spesa',
            icon: ShoppingCart,
            color: '#F3E5F5', // Pastel Purple
            iconColor: '#8E24AA',
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.grid}>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        onPress={() => onNavigate(item.id as any)}
                        activeOpacity={0.7}
                        style={styles.cardContainer}
                    >
                        <CardSoft style={[styles.card, { backgroundColor: item.color }]}>
                            <View style={styles.iconWrapper}>
                                <item.icon color={item.iconColor} size={32} />
                            </View>
                            <SubHeader style={styles.cardTitle}>{item.title}</SubHeader>
                            <Body style={styles.cardDesc}>Visualizza {item.title.toLowerCase()}</Body>
                        </CardSoft>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.white,
    },
    content: {
        padding: Theme.spacing.lg,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    cardContainer: {
        width: '100%',
        marginBottom: Theme.spacing.md,
    },
    card: {
        padding: Theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    iconWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        padding: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.md,
        marginBottom: 4,
    },
    cardTitle: {
        marginTop: 0,
        fontSize: 19,
        fontWeight: '700',
        color: '#333',
    },
    cardDesc: {
        fontSize: 12,
        color: 'rgba(0, 0, 0, 0.5)',
        marginTop: 2,
    },
});
