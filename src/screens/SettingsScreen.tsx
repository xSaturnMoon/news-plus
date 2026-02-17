import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Switch, TextInput, Alert, ScrollView } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as db from '../services/database';

export const SettingsScreen = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [weatherKey, setWeatherKey] = useState('');
    const [newsKey, setNewsKey] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const nEnabled = await AsyncStorage.getItem('notifications_enabled');
        const wKey = await AsyncStorage.getItem('weather_api_key');
        const nKey = await AsyncStorage.getItem('news_api_key');

        if (nEnabled !== null) setNotificationsEnabled(nEnabled === 'true');
        if (wKey) setWeatherKey(wKey);
        if (nKey) setNewsKey(nKey);
    };

    const saveSettings = async () => {
        await AsyncStorage.setItem('notifications_enabled', String(notificationsEnabled));
        await AsyncStorage.setItem('weather_api_key', weatherKey);
        await AsyncStorage.setItem('news_api_key', newsKey);
        Alert.alert('Salvato', 'Le impostazioni sono state salvate correttamente.');
    };

    const handleClearData = () => {
        Alert.alert(
            'Conferma',
            'Vuoi davvero eliminare tutti gli eventi dal calendario?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: async () => {
                        await db.clearAllEvents();
                        Alert.alert('Fatto', 'Tutti gli eventi sono stati rimossi.');
                    }
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <CardSoft>
                <SubHeader>Notifiche Generali</SubHeader>
                <View style={styles.row}>
                    <Body>Abilita avvisi</Body>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                </View>
            </CardSoft>

            <CardSoft>
                <SubHeader>Chiavi API</SubHeader>
                <Caption style={styles.help}>Queste chiavi sono necessarie per il meteo e le notizie.</Caption>

                <Body style={styles.label}>OpenWeatherMap Key</Body>
                <TextInput
                    style={styles.input}
                    value={weatherKey}
                    onChangeText={setWeatherKey}
                    placeholder="Inserisci API Key Meteo"
                    secureTextEntry
                />

                <Body style={styles.label}>News API Key (Opzionale)</Body>
                <TextInput
                    style={styles.input}
                    value={newsKey}
                    onChangeText={setNewsKey}
                    placeholder="Inserisci API Key Notizie"
                    secureTextEntry
                />

                <ButtonSoft
                    title="Salva Impostazioni"
                    onPress={saveSettings}
                    style={{ marginTop: Theme.spacing.md }}
                />
            </CardSoft>

            <CardSoft>
                <SubHeader>Manutenzione</SubHeader>
                <ButtonSoft
                    title="Invia Notifica di Prova (5s)"
                    onPress={async () => {
                        const { scheduleNotification } = require('../services/notifications');
                        const testDate = new Date(Date.now() + 5000); // 5 secondi
                        const id = await scheduleNotification(
                            'Test Notifica',
                            'Se leggi questo, le notifiche funzionano! 🎉',
                            testDate
                        );
                        if (id) {
                            Alert.alert('Inviata', 'La notifica arriverà tra 5 secondi. Chiudi l\'app o mettila in background!');
                        } else {
                            Alert.alert('Errore', 'Impossibile inviare la notifica. Controlla i permessi.');
                        }
                    }}
                    style={{ marginTop: Theme.spacing.md }}
                />
                <ButtonSoft
                    variant="error"
                    title="Elimina tutti gli eventi"
                    onPress={handleClearData}
                    style={{ marginTop: Theme.spacing.md }}
                />
            </CardSoft>

            <View style={styles.footer}>
                <Caption>news+ v1.0.0</Caption>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
        padding: Theme.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Theme.spacing.md,
    },
    help: {
        marginBottom: Theme.spacing.md,
    },
    label: {
        marginTop: Theme.spacing.md,
        marginBottom: Theme.spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.sm,
        padding: Theme.spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    footer: {
        padding: Theme.spacing.xl,
        alignItems: 'center',
    },
});
