import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Image } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export const BootScreen = () => {
  return (
    <Animated.View 
      entering={FadeIn.duration(400)} 
      exiting={FadeOut.duration(400)}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Animated.Image 
          source={require('../../assets/obsidian_logo.png')} 
          style={styles.logo}
          entering={FadeIn.duration(400)}
        />
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 250,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
