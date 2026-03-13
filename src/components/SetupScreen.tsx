import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ImageBackground, useWindowDimensions, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { ChevronRight, ArrowLeft, Shield, User, Power, Globe } from 'lucide-react-native';
import { useSettings, INITIAL_USER } from '../context/SettingsContext';
import { useOS } from '../hooks/useOS';

const WALLPAPER = require('../../assets/wallpaper.png');

const AnimatedStep = ({ children }: { children: React.ReactNode }) => (
    <Animated.View 
        entering={FadeIn.duration(600).delay(200)} 
        exiting={FadeOut.duration(300)} 
        style={styles.content}
    >
        {children}
    </Animated.View>
);

export const SetupScreen = () => {
    const { width: scrW, height: scrH } = useWindowDimensions();
    const { settings, updateSettings } = useSettings();
    const { setState } = useOS();

    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleNext = () => {
        setError('');
        if (step === 1) {
            if (!name || !fullName) {
                setError('Completa tutti i campi prima di proseguire.');
                return;
            }
        }
        if (step === 2) {
            if (!password || password !== confirmPassword) {
                setError('Le password non corrispondono o sono vuote.');
                return;
            }
            if (password.length < 4) {
                setError('La password deve essere di almeno 4 caratteri.');
                return;
            }
        }
        setStep(step + 1);
    };

    const handleFinish = () => {
        updateSettings({
            isSetupComplete: true,
            password: password,
            user: {
                ...settings.user,
                name: name,
                fullName: fullName,
                avatar: settings.user.avatar || INITIAL_USER.avatar
            }
        });
        setState('BOOT');
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <AnimatedStep>
                        <Animated.View entering={FadeIn.delay(400).springify()}>
                            <Globe size={80} color="#fff" style={styles.mainIcon} />
                        </Animated.View>
                        <Animated.Text entering={FadeIn.delay(600).springify()} style={styles.title}>Benvenuto in Obsidian OS</Animated.Text>
                        <Animated.Text entering={FadeIn.delay(800).springify()} style={styles.subtitle}>Configura il tuo nuovo Mac virtuale in pochi semplici passi.</Animated.Text>
                        <Animated.View entering={FadeIn.delay(1000).springify()}>
                            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>Inizia</Text>
                                <ChevronRight size={18} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    </AnimatedStep>
                );
            case 1:
                return (
                    <AnimatedStep>
                        <Animated.View entering={FadeIn.delay(400).springify()}>
                            <User size={64} color="#fff" style={styles.mainIcon} />
                        </Animated.View>
                        <Animated.Text entering={FadeIn.delay(500).springify()} style={styles.title}>Crea il tuo account</Animated.Text>
                        <Animated.Text entering={FadeIn.delay(600).springify()} style={styles.subtitle}>Inserisci i tuoi dati per personalizzare il sistema.</Animated.Text>
                        
                        <Animated.View entering={FadeIn.delay(700).springify()} style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nome Completo</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Esempio: Tobia Rossi"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </Animated.View>

                        <Animated.View entering={FadeIn.delay(800).springify()} style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nome Utente</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Esempio: tobia"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="none"
                            />
                        </Animated.View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Animated.View entering={FadeIn.delay(900).springify()} style={styles.btnRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(0)}>
                                <ArrowLeft size={18} color="#fff" />
                                <Text style={styles.backBtnText}>Indietro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>Continua</Text>
                                <ChevronRight size={18} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    </AnimatedStep>
                );
            case 2:
                return (
                    <AnimatedStep>
                        <Animated.View entering={FadeIn.delay(400).springify()}>
                            <Shield size={64} color="#fff" style={styles.mainIcon} />
                        </Animated.View>
                        <Animated.Text entering={FadeIn.delay(500).springify()} style={styles.title}>Proteggi il tuo Mac</Animated.Text>
                        <Animated.Text entering={FadeIn.delay(600).springify()} style={styles.subtitle}>Crea una password sicura per il tuo account.</Animated.Text>
                        
                        <Animated.View entering={FadeIn.delay(700).springify()} style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Scegli una password"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </Animated.View>

                        <Animated.View entering={FadeIn.delay(800).springify()} style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Conferma Password</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="Ripeti la password"
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                        </Animated.View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Animated.View entering={FadeIn.delay(900).springify()} style={styles.btnRow}>
                            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                                <ArrowLeft size={18} color="#fff" />
                                <Text style={styles.backBtnText}>Indietro</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>Continua</Text>
                                <ChevronRight size={18} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    </AnimatedStep>
                );
            case 3:
                return (
                    <AnimatedStep>
                        <Animated.View entering={FadeIn.delay(200).springify()}>
                            <Power size={64} color="#fff" style={styles.mainIcon} />
                        </Animated.View>
                        <Animated.Text entering={FadeIn.delay(400).springify()} style={styles.title}>Tutto pronto!</Animated.Text>
                        <Animated.Text entering={FadeIn.delay(600).springify()} style={styles.subtitle}>Le modifiche sono state salvate. Riavvia per iniziare a usare Obsidian OS.</Animated.Text>
                        
                        <Animated.View entering={FadeIn.delay(800).springify()}>
                            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#30D158', marginTop: 40 }]} onPress={handleFinish}>
                                <Text style={styles.nextBtnText}>Riavvia</Text>
                                <Power size={18} color="#fff" />
                            </TouchableOpacity>
                        </Animated.View>
                    </AnimatedStep>
                );
            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <ImageBackground source={WALLPAPER} style={styles.background}>
                <Animated.View 
                    entering={FadeIn.duration(1500)}
                    style={styles.overlay}
                >
                    <BlurView intensity={30} tint="dark" style={styles.centerBox}>
                        <View style={{ flex: 1 }}>
                            {renderStep()}
                        </View>
                    </BlurView>

                    <TouchableOpacity 
                        style={styles.skipBtn} 
                        onPress={handleFinish}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.skipBtnText}>Salta (Test)</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerBox: {
        width: 600,
        height: 520,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        padding: 40,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainIcon: {
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 16,
    },
    inputLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        color: '#fff',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    btnRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    backBtnText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
    },
    errorText: {
        color: '#FF453A',
        fontSize: 13,
        marginBottom: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
    skipBtn: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        padding: 10,
    },
    skipBtnText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        fontWeight: '500',
    }
});
