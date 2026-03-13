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
import Animated, { FadeIn, FadeOutDown, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useOS } from '../hooks/useOS';

// Authentic Spotify splash – dark green bg, white Spotify logo, bottom wordmark
const SPOTIFY_SPLASH = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Spotify</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background-color: #121212;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
        }
        .logo-wrap {
            animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
        @keyframes pop {
            from { opacity: 0; transform: scale(0.7); }
            to   { opacity: 1; transform: scale(1); }
        }
        svg { width: 96px; height: 96px; }
        .wordmark {
            margin-top: 28px;
            color: #fff;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: fadeIn 0.6s 0.3s ease both;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    </style>
</head>
<body>
    <div class="logo-wrap">
        <!-- Official Spotify logo SVG -->
        <svg viewBox="0 0 168 168" xmlns="http://www.w3.org/2000/svg">
            <path fill="#1ED760" d="M84,0C37.7,0,0,37.7,0,84s37.7,84,84,84s84-37.7,84-84S130.3,0,84,0z M122.5,121.2
                c-1.6,2.6-5,3.5-7.6,1.9c-20.8-12.7-47-15.6-77.8-8.5c-3,0.7-6-1.2-6.7-4.2c-0.7-3,1.2-6,4.2-6.7
                c33.7-7.7,62.7-4.4,86.1,9.9C123.4,115.2,124.1,118.6,122.5,121.2z M133,97.4c-2,3.3-6.3,4.3-9.6,2.3
                c-23.8-14.6-60-18.8-88.2-10.3c-3.5,1.1-7.2-0.9-8.3-4.4c-1.1-3.5,0.9-7.2,4.4-8.3c32.2-9.7,72.2-5,99.5,11.7
                C134.1,90.4,135,94.1,133,97.4z M134,72.9c-28.6-17-75.8-18.6-103.1-10.3c-4.3,1.3-8.9-1.1-10.2-5.4
                c-1.3-4.3,1.1-8.9,5.4-10.2c31.3-9.5,83.3-7.7,116.2,11.9c3.9,2.3,5.2,7.3,2.9,11.2C142.9,73.9,137.9,75.2,134,72.9z"/>
        </svg>
    </div>
    <div class="wordmark">Spotify</div>
</body>
</html>`;

const TOPBAR = 32;

interface SpotifyWindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

// --- JS Script to inject into Spotify Web Player ---
const RUN_ONCE_JS = `
  window.__spotifyControl = {
    playPause: () => {
      const btn = document.querySelector('button[data-testid="control-button-playpause"]');
      if(btn) btn.click();
    },
    next: () => {
      const btn = document.querySelector('button[data-testid="control-button-skip-forward"]');
      if(btn) btn.click();
    },
    prev: () => {
      const btn = document.querySelector('button[data-testid="control-button-skip-back"]');
      if(btn) btn.click();
    }
  };

  let lastState = null;
  setInterval(() => {
    try {
      // Find Now Playing details
      const titleEl = document.querySelector('[data-testid="context-item-info-title"] a');
      const artistEl = document.querySelector('[data-testid="context-item-info-subtitles"] a');
      const coverEl = document.querySelector('[data-testid="cover-art-image"]');
      const playBtn = document.querySelector('button[data-testid="control-button-playpause"]');
      
      const title = titleEl ? titleEl.innerText : 'Nessun brano';
      const artist = artistEl ? artistEl.innerText : '';
      const cover = coverEl ? coverEl.src : '';
      
      // Determine if playing by checking the play/pause button aria-label
      // Usually "Pause" when playing, "Play" when paused
      let isPlaying = false;
      if (playBtn) {
        const ariaLabel = playBtn.getAttribute('aria-label') || '';
        isPlaying = ariaLabel.includes('Pause') || ariaLabel.includes('Pausa');
      }

      const currentState = JSON.stringify({ title, artist, cover, isPlaying });
      if (currentState !== lastState) {
        lastState = currentState;
        window.ReactNativeWebView.postMessage(currentState);
      }
    } catch (e) {}
  }, 1000);
  true;
`;

export const SpotifyWindow = ({ onClose, onMinimize, isMinimized }: SpotifyWindowProps) => {
    const { width, height } = useWindowDimensions();
    const { setSpotifyState, spotifyControl } = useOS();
    const webViewRef = useRef<any>(null);
    const [isMaximized, setIsMaximized] = useState(false);
    const [showSplash, setShowSplash] = useState(true);
    const splashOpacity = useSharedValue(1);

    const WIN_W = isMaximized ? width : Math.min(1100, width * 0.88);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(740, height * 0.88);

    const posX = useSharedValue((width - WIN_W) / 2);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 - 20));

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
        
        // Register methods to global control object
        spotifyControl.playPause = () => webViewRef.current?.injectJavaScript("window.__spotifyControl && window.__spotifyControl.playPause(); true;");
        spotifyControl.next = () => webViewRef.current?.injectJavaScript("window.__spotifyControl && window.__spotifyControl.next(); true;");
        spotifyControl.prev = () => webViewRef.current?.injectJavaScript("window.__spotifyControl && window.__spotifyControl.prev(); true;");

        return () => clearTimeout(t);
    }, []);

    const splashStyle = useAnimatedStyle(() => ({ opacity: splashOpacity.value }));

    const spotifyUrl = 'https://open.spotify.com';

    return (
        <Animated.View style={[styles.window, windowStyle]}>
            {/* Title bar */}
            <View style={styles.titleBar}>
                <View
                    style={styles.trafficLights}
                    onStartShouldSetResponder={() => true}
                    onResponderTerminationRequest={() => false}
                >
                    <TouchableOpacity
                        style={[styles.dot, { backgroundColor: '#FF5F57' }]}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                    />
                    <TouchableOpacity
                        style={[styles.dot, { backgroundColor: '#FFBD2E' }]}
                        onPress={onMinimize}
                        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                    />
                    <TouchableOpacity
                        style={[styles.dot, { backgroundColor: '#28CA41' }]}
                        onPress={() => setIsMaximized(v => !v)}
                        hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
                    />
                </View>
                <View style={styles.dragArea} {...panResponder.panHandlers}>
                    <Text style={styles.titleText}>Spotify</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {showSplash && (
                    <Animated.View style={[StyleSheet.absoluteFill, splashStyle]}>
                        {Platform.OS === 'web' ? (
                            <iframe
                                title="Spotify Splash"
                                srcDoc={SPOTIFY_SPLASH}
                                style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                            />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return <WebView source={{ html: SPOTIFY_SPLASH }} style={{ flex: 1 }} />;
                            })()
                        )}
                    </Animated.View>
                )}

                {!showSplash && (
                    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(400)}>
                        {Platform.OS === 'web' ? (
                            <iframe
                                title="Spotify"
                                src={spotifyUrl}
                                allow="autoplay; clipboard-read; clipboard-write; fullscreen"
                                style={{ flex: 1, border: 'none', width: '100%', height: '100%', backgroundColor: '#121212' }}
                            />
                        ) : (
                            (() => {
                                const { WebView } = require('react-native-webview');
                                return (
                                    <WebView
                                        ref={webViewRef}
                                        source={{ uri: spotifyUrl }}
                                        style={{ flex: 1 }}
                                        allowsInlineMediaPlayback
                                        mediaPlaybackRequiresUserAction={false}
                                        javaScriptEnabled
                                        domStorageEnabled
                                        sharedCookiesEnabled
                                        injectedJavaScript={RUN_ONCE_JS}
                                        onMessage={(event: any) => {
                                            try {
                                                const data = JSON.parse(event.nativeEvent.data);
                                                if (data && data.title) {
                                                    setSpotifyState(data);
                                                }
                                            } catch (e) {}
                                        }}
                                        userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                                    />
                                );
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
        backgroundColor: '#121212',
        ...Platform.select({
            web: { boxShadow: '0px 20px 60px rgba(0,0,0,0.6)' },
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
        backgroundColor: '#000',
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
    dot: {
        width: 13,
        height: 13,
        borderRadius: 6.5,
    },
    titleText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 13,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        backgroundColor: '#121212',
    },
});
