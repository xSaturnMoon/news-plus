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

const CLAUDE_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Claude</title>
    <style>
        body {
            background-color: #1a1a1a;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
            font-family: "Tiempos Headline", "Georgia", serif;
        }
        .logo-wrap {
            color: #D37A5C;
            animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
        }
        svg { width: 64px; height: 64px; }
        .wordmark {
            margin-top: 24px;
            color: #E2E2E2;
            font-size: 36px;
            font-weight: 500;
            letter-spacing: -0.5px;
            animation: fadeIn 0.8s 0.3s ease both;
        }
        .byline {
            margin-top: 8px;
            color: #6B6861;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            animation: fadeIn 0.8s 0.5s ease both;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    </style>
</head>
<body>
    <div class="logo-wrap">
        <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM14 13.5C13.5 14 13 14.5 13 15V16H11V15C11 13.9 11.9 13 13 13C13.5 13 14 12.5 14 12C14 10.9 13.1 10 12 10C10.9 10 10 10.9 10 12H8C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 12.83 15.7 13.59 15.2 14.16L14 13.5Z"/>
        </svg>
    </div>
    <div class="wordmark">Claude</div>
    <div class="byline">By Anthropic</div>
</body>
</html>`;

const TOPBAR = 32;

interface WindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const ClaudeWindow = ({ onClose, onMinimize, isMinimized }: WindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useSharedValue(1);

    const WIN_W = isMaximized ? width : Math.min(1000, width * 0.8);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(750, height * 0.85);

    const posX = useSharedValue((width - WIN_W) / 2 - 30);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 + 10));

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
            splashOpacity.value = withTiming(0, { duration: 600 });
            setTimeout(() => setShowSplash(false), 620);
        }, 2200);
        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
    const url = 'https://claude.ai/chats';

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
                    <Text style={styles.titleText}>Claude</Text>
                </View>
            </View>

            <View style={styles.content}>
                {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle, { zIndex: 10 }]}>
                        {Platform.OS === 'web' ? (
                            <iframe srcDoc={CLAUDE_SPLASH} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: CLAUDE_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                )}
                {!showSplash && (
                    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe src={url} style={{ flex: 1, border: 'none', width: '100%', height: '100%', backgroundColor: '#1a1a1a' }} />
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
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: '#1a1a1a',
        ...Platform.select({
            web: { boxShadow: '0px 25px 70px rgba(0,0,0,0.3)' },
            default: {
                shadowColor: '#000', shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.25, shadowRadius: 50, elevation: 25,
            }
        })
    },
    titleBar: {
        height: 44,
        backgroundColor: '#262626',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
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
        fontSize: 13,
        fontWeight: '500',
        fontFamily: Platform.OS === 'web' ? '"Tiempos Headline", "Georgia", serif' : undefined,
    },
    content: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
});
