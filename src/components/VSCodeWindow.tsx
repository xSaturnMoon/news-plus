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

const VSCODE_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>VS Code</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #1E1E1E;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .logo-wrap {
            animation: pulse 1s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes pulse {
            from { transform: scale(0.95); opacity: 0.8; }
            to   { transform: scale(1.05); opacity: 1; }
        }
        svg { width: 96px; height: 96px; }
        .wordmark {
            margin-top: 32px;
            color: #CCCCCC;
            font-size: 24px;
            font-weight: 300;
            letter-spacing: 1px;
            animation: fadeIn 0.6s 0.3s ease both;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    </style>
</head>
<body>
    <div class="logo-wrap">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.5 18.5L23 14.5V9.5L17.5 5.5V18.5Z" fill="#0066b8"/>
            <path d="M2.5 15.5L1 14V10L2.5 8.5L6.5 12L2.5 15.5Z" fill="#0066b8"/>
            <path d="M17.5 18.5L6.5 12L17.5 5.5L10.5 1.5L2.5 8.5L17.5 18.5Z" fill="#1f9cf0"/>
            <path d="M17.5 5.5L6.5 12L17.5 18.5L10.5 22.5L2.5 15.5L17.5 5.5Z" fill="#007acc"/>
        </svg>
    </div>
    <div class="wordmark">Visual Studio Code</div>
</body>
</html>`;

const TOPBAR = 32;

interface WindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const VSCodeWindow = ({ onClose, onMinimize, isMinimized }: WindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useSharedValue(1);

    const WIN_W = isMaximized ? width : Math.min(1200, width * 0.9);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(800, height * 0.9);

    const posX = useSharedValue((width - WIN_W) / 2);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2));

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
        }, 2500);
        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
    const url = 'https://vscode.dev/';

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
                    <Text style={styles.titleText}>Visual Studio Code</Text>
                </View>
            </View>

            <View style={styles.content}>
                {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle, { zIndex: 10 }]}>
                        {Platform.OS === 'web' ? (
                            <iframe srcDoc={VSCODE_SPLASH} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: VSCODE_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                )}
                {!showSplash && (
                    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe src={url} allow="fullscreen; clipboard-read; clipboard-write" style={{ flex: 1, border: 'none', width: '100%', height: '100%', backgroundColor: '#1E1E1E' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ uri: url }} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled />
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
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#1E1E1E',
        ...Platform.select({
            web: { boxShadow: '0px 20px 60px rgba(0,0,0,0.6)' },
            default: {
                shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5, shadowRadius: 40, elevation: 20,
            }
        })
    },
    titleBar: {
        height: 38,
        backgroundColor: '#181818',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2d2d2d',
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 10,
    },
    dot: { width: 13, height: 13, borderRadius: 6.5 },
    dragArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 50, // offset for lights
    },
    titleText: {
        color: '#858585',
        fontSize: 12,
        fontWeight: '500',
    },
    content: {
        flex: 1,
        backgroundColor: '#1E1E1E',
    },
});
