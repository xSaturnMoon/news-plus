import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
    Platform,
    useWindowDimensions,
    Animated as RNAnimated,
} from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, withSequence, runOnJS } from 'react-native-reanimated';
import { X, Minus, Maximize2 } from 'lucide-react-native';

// ---- Discord Splash Screen HTML ----
const DISCORD_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Discord</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #313338;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 40px;
            animation: logoFadeIn 0.6s ease-out;
        }
        @keyframes logoFadeIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
        }
        .discord-logo {
            width: 80px;
            height: 80px;
        }
        .loading-bar-track {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: rgba(255,255,255,0.08);
            overflow: hidden;
        }
        .loading-bar {
            height: 100%;
            background: #5865F2;
            width: 0%;
            animation: load 2.2s ease-out forwards;
            border-radius: 0 2px 2px 0;
        }
        @keyframes load {
            0%   { width: 0%; }
            30%  { width: 35%; }
            60%  { width: 68%; }
            85%  { width: 85%; }
            100% { width: 99%; }
        }
    </style>
</head>
<body>
    <div class="logo-container">
        <svg class="discord-logo" viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg">
            <path fill="#5865F2" d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
        </svg>
    </div>
    <div class="loading-bar-track">
        <div class="loading-bar"></div>
    </div>
</body>
</html>`;

interface DiscordWindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const DiscordWindow = ({ onClose, onMinimize, isMinimized }: DiscordWindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const scaleAnim = useSharedValue(isMinimized ? 0 : 1);
    const splashOpacity = useSharedValue(1);

    // Window size — when maximized, leave 32px for the top menu bar
    const TOPBAR = 32;
    const WIN_W = isMaximized ? width : Math.min(1100, width * 0.88);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(740, height * 0.88);

    // Position state — start at least 32px from top
    const posX = useSharedValue((width - WIN_W) / 2);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 - 20));

    // Drag — clamp Y to never go above the top bar
    const panRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isMaximized,
            onMoveShouldSetPanResponder: () => !isMaximized,
            onPanResponderGrant: (_, s) => {
                panRef.current.offsetX = posX.value;
                panRef.current.offsetY = posY.value;
            },
            onPanResponderMove: (_, s) => {
                posX.value = panRef.current.offsetX + s.dx;
                posY.value = Math.max(TOPBAR, panRef.current.offsetY + s.dy);
            },
        })
    ).current;

    const windowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isMinimized ? 0.001 : 1, { damping: 20, stiffness: 260 }) }],
        opacity: isMinimized ? withTiming(0, { duration: 150 }) : withTiming(1, { duration: 200 }),
        left: isMaximized ? withSpring(0, { damping: 25, stiffness: 400 }) : posX.value,
        top: isMaximized ? withSpring(TOPBAR, { damping: 25, stiffness: 400 }) : posY.value,
        width: isMaximized ? withSpring(WIN_W, { damping: 25, stiffness: 400 }) : WIN_W,
        height: isMaximized ? withSpring(WIN_H, { damping: 25, stiffness: 400 }) : WIN_H,
    }), [isMinimized, isMaximized, WIN_W, WIN_H]);

    // After splash, fade to Discord app
    useEffect(() => {
        const t = setTimeout(() => {
            splashOpacity.value = withTiming(0, { duration: 400 });
            setTimeout(() => setShowSplash(false), 420);
        }, 2600);
        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({
        opacity: splashOpacity.value,
    }));

    const discordUrl = 'https://discord.com/app';

    return (
        <Animated.View style={[styles.window, windowStyle]}>
            {/* Title bar: traffic lights + drag area */}
            <View style={styles.titleBar}>
                {/* Traffic lights: separate from pan responder to avoid event interception */}
                <View 
                    style={styles.trafficLights}
                    onStartShouldSetResponder={() => true}
                    onResponderTerminationRequest={() => false}
                >
                    <TouchableOpacity 
                        style={[styles.trafficLight, { backgroundColor: '#FF5F57' }]} 
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                    />
                    <TouchableOpacity 
                        style={[styles.trafficLight, { backgroundColor: '#FFBD2E' }]} 
                        onPress={onMinimize}
                        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                    />
                    <TouchableOpacity 
                        style={[styles.trafficLight, { backgroundColor: '#28CA41' }]} 
                        onPress={() => setIsMaximized(v => !v)}
                        hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
                    />
                </View>
                {/* Drag area covers the rest */}
                <View style={styles.dragArea} {...panResponder.panHandlers}>
                    <Text style={styles.titleText}>Discord</Text>
                </View>
            </View>

            {/* Content: Splash or Discord Web App */}
            <View style={styles.content}>
                {showSplash ? (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle]}>
                        {Platform.OS === 'web' ? (
                            <iframe
                                title="Discord Splash"
                                srcDoc={DISCORD_SPLASH}
                                style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                            />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: DISCORD_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                ) : null}

                {!showSplash ? (
                    <Animated.View style={[StyleSheet.absoluteFill, { opacity: 1 }]} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe
                                title="Discord"
                                src={discordUrl}
                                allow="microphone; camera; fullscreen; clipboard-read; clipboard-write"
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#313338',
                                }}
                            />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return (
                                    <WebView
                                        source={{ uri: discordUrl }}
                                        style={{ flex: 1 }}
                                        allowsInlineMediaPlayback
                                        mediaPlaybackRequiresUserAction={false}
                                        javaScriptEnabled
                                        domStorageEnabled
                                        sharedCookiesEnabled
                                        userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                    />
                                );
                            })()
                        )}
                    </Animated.View>
                ) : null}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    window: {
        position: 'absolute',
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#313338',
        ...Platform.select({
            web: {
                boxShadow: '0px 20px 60px rgba(0,0,0,0.6)',
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                elevation: 20,
            }
        })
    },
    titleBar: {
        height: 38,
        backgroundColor: '#1e1f22',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 10,
    },
    dragArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trafficLight: {
        width: 13,
        height: 13,
        borderRadius: 6.5,
    },
    titleText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        backgroundColor: '#313338',
    },
});
