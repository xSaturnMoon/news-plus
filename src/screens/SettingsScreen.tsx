import React from 'react';
import { View, StyleSheet, Switch, ScrollView, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Header, Body, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { Moon, Sun, MonitorSmartphone } from 'lucide-react-native';

export const SettingsScreen = () => {
    const { mode, setting, theme, changeThemeSetting } = useTheme();
    const isSystem = setting === 'system';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Header style={styles.title}>Impostazioni</Header>
                
                <View style={styles.section}>
                    <Caption style={styles.sectionLabel}>ASPETTO</Caption>
                    <CardSoft style={styles.settingCard}>
                        {/* System Theme Switch */}
                        <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                                    <MonitorSmartphone size={20} color={theme.colors.primary} />
                                </View>
                                <View style={styles.textContainer}>
                                    <Body style={styles.settingTitle}>Tema del Dispositivo</Body>
                                    <Caption style={styles.settingDesc}>Adatta l'app al tema di sistema</Caption>
                                </View>
                            </View>
                            <View style={styles.switchContainer}>
                                <Switch
                                    value={isSystem}
                                    onValueChange={(val) => changeThemeSetting(val ? 'system' : mode)}
                                    trackColor={{ false: '#D1D1D6', true: theme.colors.primary }}
                                    thumbColor={'#FFFFFF'}
                                    ios_backgroundColor="#D1D1D6"
                                />
                            </View>
                        </View>

                        {/* Manual Dark Mode Switch */}
                        <View style={[styles.settingRow, isSystem && { opacity: 0.5 }]}>
                            <View style={styles.settingInfo}>
                                <View style={[styles.iconCircle, { backgroundColor: theme.colors.primary + '15' }]}>
                                    {mode === 'dark' ? (
                                        <Moon size={20} color={theme.colors.primary} />
                                    ) : (
                                        <Sun size={20} color={theme.colors.primary} />
                                    )}
                                </View>
                                <View style={styles.textContainer}>
                                    <Body style={styles.settingTitle}>Modalità Scura</Body>
                                    <Caption style={styles.settingDesc}>Forza il tema scuro o chiaro</Caption>
                                </View>
                            </View>
                            <View style={styles.switchContainer}>
                                <Switch
                                    disabled={isSystem}
                                    value={mode === 'dark'}
                                    onValueChange={(val) => changeThemeSetting(val ? 'dark' : 'light')}
                                    trackColor={{ false: '#D1D1D6', true: theme.colors.primary }}
                                    thumbColor={'#FFFFFF'}
                                    ios_backgroundColor="#D1D1D6"
                                />
                            </View>
                        </View>
                    </CardSoft>
                </View>

                <View style={styles.emptyContent}>
                    <Caption style={styles.footerText}>Versione 1.0.0 • news+</Caption>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 140,
    },
    title: {
        marginTop: 10,
        marginBottom: 10,
    },
    section: {
        marginBottom: 25,
    },
    sectionLabel: {
        marginLeft: 10,
        marginBottom: 8,
        fontWeight: '800',
        letterSpacing: 1.2,
        opacity: 0.6,
    },
    settingCard: {
        padding: 0, // Let the row handle padding for precision
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64, // Exact fixed height for perfect vertical centering
        paddingHorizontal: 16,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    settingTitle: {
        fontWeight: '700',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'left',
    },
    settingDesc: {
        fontSize: 12,
        opacity: 0.6,
        textAlign: 'left',
    },
    switchContainer: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    emptyContent: {
        marginTop: 50,
        alignItems: 'center',
    },
    footerText: {
        opacity: 0.4,
    }
});
