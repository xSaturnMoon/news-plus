import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
    Platform,
    useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const WHATSAPP_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #111B21;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        svg { width: 72px; height: 72px; color: #00A884; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }
        .progress-bar {
            width: 300px;
            height: 3px;
            background-color: rgba(255,255,255,0.1);
            border-radius: 3px;
            margin-top: 40px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background-color: #00A884;
            width: 0%;
            animation: load 2s ease-out forwards;
        }
        @keyframes load {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .text {
            color: rgba(255,255,255,0.5);
            margin-top: 10px;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.96 2.02c-5.46 0-9.87 4.41-9.87 9.87 0 1.74.45 3.42 1.32 4.9L2 22l5.35-1.4c1.44.82 3.08 1.25 4.79 1.25 5.46 0 9.87-4.41 9.87-9.87s-4.42-9.87-9.87-9.87" fill="#00A884"/>
        <path d="M12.06 4.14A7.88 7.88 0 0 1 19.98 12c0 2.15-.84 4.13-2.3 5.6-1.5 1.5-3.46 2.33-5.61 2.33-1.47 0-2.88-.36-4.14-1.04l-.3-.16-3.08.8.84-3.01-.18-.28A7.85 7.85 0 0 1 4.14 12c0-4.35 3.55-7.9 7.9-7.9m0-2.12C6.54 2.02 2.06 6.5 2.06 12c0 1.75.46 3.46 1.33 4.97L2 22l5.22-1.37c1.45.83 3.1 1.27 4.8 1.27 5.5 0 9.98-4.48 9.98-9.98s-4.48-9.98-9.98-9.98" fill="#fff"/>
        <path d="M9.13 7.82c-.22-.49-.46-.5-.67-.51h-.57c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.72 0 1.6 1.17 3.15 1.33 3.37.16.22 2.3 3.5 5.56 4.9 3.26 1.4 3.26.93 3.86.87.6-.05 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38s-1.93-.95-2.23-1.06c-.3-.11-.52-.16-.73.16-.22.33-.84 1.06-1.03 1.28-.19.22-.38.25-.71.08-.33-.16-1.38-.51-2.62-1.62-.96-.86-1.61-1.93-1.8-2.25-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.57-.08-.16-.73-1.77-1-2.42" fill="#fff"/>
    </svg>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <div class="text">WhatsApp</div>
</body>
</html>`;

const TOPBAR = 32;

interface WindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const WhatsAppWindow = ({ onClose, onMinimize, isMinimized }: WindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useSharedValue(1);

    const WIN_W = isMaximized ? width : Math.min(1000, width * 0.85);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(750, height * 0.85);

    const posX = useSharedValue((width - WIN_W) / 2 - 20);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 + 20));

    const panRef = useRef({ offsetX: 0, offsetY: 0 });
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !isMaximized,
            onMoveShouldSetPanResponder: () => !isMaximized,
            onPanResponderGrant: () => {
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

    useEffect(() => {
        const t = setTimeout(() => {
            splashOpacity.value = withTiming(0, { duration: 500 });
            setTimeout(() => setShowSplash(false), 520);
        }, 2200);
        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
    const url = 'https://web.whatsapp.com/';

    return (
        <Animated.View style={[styles.window, windowStyle]}>
            <View style={styles.titleBar}>
                <View
                    style={styles.trafficLights}
                    onStartShouldSetResponder={() => true}
                    onResponderTerminationRequest={() => false}
                >
                    <TouchableOpacity style={[styles.dot, { backgroundColor: '#FF5F57' }]} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }} />
                    <TouchableOpacity style={[styles.dot, { backgroundColor: '#FFBD2E' }]} onPress={onMinimize} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} />
                    <TouchableOpacity style={[styles.dot, { backgroundColor: '#28CA41' }]} onPress={() => setIsMaximized(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }} />
                </View>
                <View style={styles.dragArea} {...panResponder.panHandlers}>
                    <Text style={styles.titleText}>WhatsApp</Text>
                </View>
            </View>

            <View style={styles.content}>
                {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle, { zIndex: 10 }]}>
                        {Platform.OS === 'web' ? (
                            <iframe srcDoc={WHATSAPP_SPLASH} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: WHATSAPP_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                )}
                {!showSplash && (
                    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe src={url} style={{ flex: 1, border: 'none', width: '100%', height: '100%', backgroundColor: '#111B21' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView 
                                    userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
                                    source={{ uri: url }} 
                                    style={{ flex: 1 }} 
                                    javaScriptEnabled 
                                    domStorageEnabled 
                                />
                            })()
                        )}
                    </Animated.View>
                )}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    window: {
        position: 'absolute',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#111B21',
        ...Platform.select({
            web: { boxShadow: '0px 25px 70px rgba(0,0,0,0.6)' },
            default: {
                shadowColor: '#000', shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.5, shadowRadius: 50, elevation: 25,
            }
        })
    },
    titleBar: {
        height: 38,
        backgroundColor: '#2A2F32',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 10,
    },
    dot: { width: 12, height: 12, borderRadius: 6 },
    dragArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 50, 
    },
    titleText: {
        color: '#A0A0A0',
        fontSize: 12,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        backgroundColor: '#111B21',
    },
});
