import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated as RNAnimated, Easing } from 'react-native';
import Animated, { FadeIn, FadeOut, withTiming, useSharedValue, useAnimatedStyle, withDelay, runOnJS } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useOS } from '../hooks/useOS';
import { useSettings, INITIAL_USER } from '../context/SettingsContext';

export const ResetOverlay = () => {
    const { isResetting, setIsResetting, setState, resetType, setResetType } = useOS();
    const { clearSettings, updateSettings } = useSettings();
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [phase, setPhase] = useState<'IDLE' | 'WIPING' | 'REBOOTING'>('IDLE');

    const blurIntensity = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);
    const progress = useSharedValue(0);

    const logMessages = [
        "Initializing secure wipe...",
        "Target: /users/tobia/Data",
        "Wiping core application cache...",
        "Cleaning local storage references...",
        "Deleting user credentials...",
        "Unlinking Apple ID...",
        "Purging system logs...",
        "System wipe complete.",
        "Rebooting kernel..."
    ];

    useEffect(() => {
        if (isResetting) {
            startReset();
        }
    }, [isResetting]);

    const startReset = () => {
        setPhase('WIPING');
        blurIntensity.value = withTiming(100, { duration: 2000 });
        overlayOpacity.value = withTiming(1, { duration: 1000 });
        progress.value = withTiming(1, { duration: 5000 });

        // Simulate terminal logs
        logMessages.forEach((msg, i) => {
            setTimeout(() => {
                setTerminalLines(prev => [...prev, `[system] ${msg}`]);
            }, i * 500);
        });

        // Finish animation
        setTimeout(() => {
            setPhase('REBOOTING');
            finishReset();
        }, 6000);
    };

    const finishReset = () => {
        overlayOpacity.value = withTiming(0, { duration: 1000 }, () => {
            runOnJS(completeReset)();
        });
    };

    const completeReset = () => {
        if (resetType === 'FULL') {
            clearSettings();
        } else if (resetType === 'USER') {
            updateSettings({ 
                user: INITIAL_USER, 
                password: '', 
                isSetupComplete: false,
                loginAutomatically: true
            });
        }
        setIsResetting(false);
        setResetType(null); // Clear type
        setState('BOOT');
    };

    const blurStyle = useAnimatedStyle(() => ({
        intensity: blurIntensity.value,
    } as any));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    if (!isResetting) return null;

    return (
        <Animated.View style={[styles.container, overlayStyle]}>
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View style={styles.content}>
                <Text style={styles.mainTitle}>Inizializzazione Sistema</Text>
                
                <View style={styles.terminal}>
                    {terminalLines.map((line, i) => (
                        <Text key={i} style={styles.terminalText}>{line}</Text>
                    ))}
                </View>

                <View style={styles.progressBarContainer}>
                    <Animated.View style={[styles.progressBar, progressBarStyle]} />
                </View>

                <Text style={styles.statusText}>
                    {phase === 'WIPING' ? 'Cancellazione dati in corso...' : 'Riavvio in corso...'}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10000,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
    },
    mainTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        letterSpacing: 1,
    },
    terminal: {
        width: '100%',
        height: 180,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 8,
        padding: 15,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    terminalText: {
        color: '#30D158',
        fontFamily: 'monospace',
        fontSize: 12,
        marginBottom: 4,
    },
    progressBarContainer: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 15,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#fff',
    },
    statusText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    }
});
