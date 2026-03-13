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

const GEMINI_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Gemini</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #131314;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .star {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4285F4, #9B72CB, #D96570);
            mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.9961 0C11.9961 6.62742 17.3686 12 23.9961 12C17.3686 12 11.9961 17.3726 11.9961 24C11.9961 17.3726 6.62354 12 0.0150919 12C6.6346 12 11.9961 6.62742 11.9961 0Z"/></svg>') center/contain no-repeat;
            -webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.9961 0C11.9961 6.62742 17.3686 12 23.9961 12C17.3686 12 11.9961 17.3726 11.9961 24C11.9961 17.3726 6.62354 12 0.0150919 12C6.6346 12 11.9961 6.62742 11.9961 0Z"/></svg>') center/contain no-repeat;
            animation: spin 3s ease-in-out infinite alternate;
        }
        @keyframes spin {
            from { transform: scale(0.9) rotate(-10deg); }
            to { transform: scale(1.1) rotate(10deg); filter: hue-rotate(30deg); }
        }
        .wordmark {
            margin-top: 30px;
            color: #E2E2E2;
            font-size: 28px;
            font-weight: 400;
            letter-spacing: -0.5px;
            animation: fadeIn 0.8s 0.2s ease both;
        }
        @keyframes fadeIn { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="star"></div>
    <div class="wordmark">Gemini</div>
</body>
</html>`;

const TOPBAR = 32;

interface WindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const GeminiWindow = ({ onClose, onMinimize, isMinimized }: WindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useSharedValue(1);

    const WIN_W = isMaximized ? width : Math.min(1000, width * 0.8);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(750, height * 0.85);

    const posX = useSharedValue((width - WIN_W) / 2 + 30);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 + 30));

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
        }, 3000);
        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));
    const url = 'https://gemini.google.com/app';

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
                    <Text style={styles.titleText}>Google Gemini</Text>
                </View>
            </View>

            <View style={styles.content}>
                {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle, { zIndex: 10 }]}>
                        {Platform.OS === 'web' ? (
                            <iframe srcDoc={GEMINI_SPLASH} style={{ flex: 1, border: 'none', width: '100%', height: '100%' }} />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: GEMINI_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                )}
                {!showSplash && (
                    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe src={url} style={{ flex: 1, border: 'none', width: '100%', height: '100%', backgroundColor: '#131314' }} />
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
        backgroundColor: '#131314',
        ...Platform.select({
            web: { boxShadow: '0px 25px 70px rgba(0,0,0,0.7)' },
            default: {
                shadowColor: '#000', shadowOffset: { width: 0, height: 25 },
                shadowOpacity: 0.6, shadowRadius: 50, elevation: 25,
            }
        })
    },
    titleBar: {
        height: 44,
        backgroundColor: '#1E1F22',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
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
    },
    content: {
        flex: 1,
        backgroundColor: '#131314',
    },
});
