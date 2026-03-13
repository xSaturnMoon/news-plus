import React, { useState } from 'react';
import { View, StyleSheet, Text, Image, TextInput, TouchableOpacity, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat } from 'react-native-reanimated';
import { Power, RotateCcw, Moon } from 'lucide-react-native';
import { useOS } from '../hooks/useOS';
import { useSettings } from '../context/SettingsContext';

const WALLPAPER = require('../../assets/wallpaper.png');

export const LoginScreen = () => {
  const { setState, user, setIsSleeping } = useOS();
  const { settings } = useSettings();
  const [password, setPassword] = useState('');
  const [isError, setIsError] = useState(false);

  const shakeOffset = useSharedValue(0);

  const handleLogin = () => {
    if (password === settings.password) {
      setState('DESKTOP');
    } else {
      setIsError(true);
      shakeOffset.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 100 }), 3, true),
        withTiming(0, { duration: 50 }, () => {
          // Reset error state after animation
        })
      );
      setTimeout(() => setIsError(false), 500);
    }
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }],
  }));

  const handleRestart = () => {
    setState('BOOT');
  };

  const handlePowerOff = () => {
    // Simulated power off: go back to boot sequence
    setState('BOOT');
  };

  return (
    <Animated.View
      entering={FadeIn.duration(1000)}
      exiting={FadeOut.duration(800)}
      style={styles.container}
    >
      <ImageBackground source={WALLPAPER} style={styles.background}>
        <View style={styles.overlay}>

          <View style={styles.centerContent}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <Text style={styles.userName}>{user.name}</Text>

            <Animated.View style={[styles.inputContainer, shakeStyle, isError && { borderColor: '#FF453A', borderWidth: 1 }]}>
              <BlurView intensity={30} tint="light" style={styles.inputBlur}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleLogin}
                  selectionColor="#fff"
                />
              </BlurView>
            </Animated.View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
              <Text style={styles.loginBtnText}>Accedi</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setIsSleeping(true)}>
              <View style={styles.iconCircle}>
                <Moon size={18} color="#fff" />
              </View>
              <Text style={styles.actionText}>Sospendi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleRestart}>
              <View style={styles.iconCircle}>
                <RotateCcw size={18} color="#fff" />
              </View>
              <Text style={styles.actionText}>Riavvia</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handlePowerOff}>
              <View style={styles.iconCircle}>
                <Power size={18} color="#fff" />
              </View>
              <Text style={styles.actionText}>Spegni</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ImageBackground>
    </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    marginTop: -40, // Offset to account for bottom bar and feel more centered
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 25,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  inputContainer: {
    width: 220,
    height: 40,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputBlur: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  input: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 60,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  }
});
