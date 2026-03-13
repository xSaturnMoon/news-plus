import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Pressable,
    Modal,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
    X,
    Minus,
    Maximize2,
    ChevronLeft,
    ChevronRight,
    RotateCw,
    Search,
    Plus,
    Settings,
} from 'lucide-react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface Shortcut { id: string; title: string; url: string; }

const DEFAULT_SHORTCUTS: Shortcut[] = [];

const CHROME_NEW_TAB = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <style>
        body {
            background-color: #202124; color: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex; flex-direction: column; align-items: center;
            height: 100vh; margin: 0; padding-top: 12vh; box-sizing: border-box;
        }
        .logo { font-size: 72px; font-weight: 500; letter-spacing: -3px; margin-bottom: 28px; }
        .logo span:nth-child(1) { color: #4285F4; }
        .logo span:nth-child(2) { color: #EA4335; }
        .logo span:nth-child(3) { color: #FBBC05; }
        .logo span:nth-child(4) { color: #4285F4; }
        .logo span:nth-child(5) { color: #34A853; }
        .logo span:nth-child(6) { color: #EA4335; }
        .search-box {
            background-color: #303134; border-radius: 24px; width: 80%; max-width: 580px; height: 46px;
            display: flex; align-items: center; padding: 0 16px; border: 1px solid #5F6368;
        }
        .search-box:focus-within { box-shadow: 0 1px 6px 0 rgba(0,0,0,0.3); }
        .search-icon { color: #9AA0A6; margin-right: 12px; display: flex; align-items: center; }
        .search-input { background: transparent; border: none; color: white; font-size: 16px; flex: 1; outline: none; }
        .shortcuts-wrapper { display: flex; flex-direction: column; align-items: center; margin-top: 36px; }
        .shortcuts { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; max-width: 600px; }
        .shortcut { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 12px; border-radius: 8px; width: 80px; position: relative; }
        .shortcut:hover { background-color: rgba(255,255,255,0.1); }
        .shortcut-icon { width: 48px; height: 48px; background-color: #303134; border-radius: 50%; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 12px; box-sizing: border-box; }
        .shortcut-icon img { width: 100%; height: 100%; object-fit: contain; }
        .shortcut-title { font-size: 12px; text-align: center; color: #e8eaed; word-break: break-all; margin-top: 4px; }
        .del-btn { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #aaa; border: none; border-radius: 50%; width: 18px; height: 18px; cursor: pointer; font-size: 12px; display: none; line-height: 18px; text-align: center; padding:0; }
        .shortcut:hover .del-btn { display: block; }
        .add-btn { width: 80px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 12px; border-radius: 8px; }
        .add-btn:hover { background-color: rgba(255,255,255,0.1); }
        .add-icon { width: 48px; height: 48px; background-color: #303134; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; color: #9AA0A6; }
        .add-label { font-size: 12px; color: #9AA0A6; }
        /* Modal */
        .modal-bg { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:100; align-items:center; justify-content:center; }
        .modal-bg.show { display:flex; }
        .modal { background:#303134; border-radius:12px; padding:24px; width:300px; display:flex; flex-direction:column; gap:14px; }
        .modal h3 { margin:0; font-size:16px; }
        .modal input { background:#202124; border:1px solid #5F6368; border-radius:8px; color:white; padding:10px 12px; font-size:14px; outline:none; }
        .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
        .btn { padding:8px 16px; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; }
        .btn-cancel { background:#444; color:#ccc; }
        .btn-add { background:#4285F4; color:white; }
    </style>
</head>
<body>
    <div class="logo"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></div>
    <div class="search-box">
        <div class="search-icon"><svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="#9AA0A6"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg></div>
        <input type="text" class="search-input" id="searchInput" placeholder="Search Google or type a URL" />
    </div>

    <div class="shortcuts-wrapper">
        <div class="shortcuts" id="shortcuts">
            <!-- Dynamically populated by React Native via postMessage -->
            <div class="add-btn" onclick="showModal()"><div class="add-icon">+</div><div class="add-label">Add</div></div>
        </div>
    </div>

    <!-- Add shortcut modal -->
    <div class="modal-bg" id="modal">
        <div class="modal">
            <h3>Add Shortcut</h3>
            <input id="mTitle" placeholder="Name (e.g. Gmail)" />
            <input id="mUrl" placeholder="URL (e.g. https://gmail.com)" />
            <div class="modal-actions">
                <button class="btn btn-cancel" onclick="hideModal()">Cancel</button>
                <button class="btn btn-add" onclick="addShortcut()">Add</button>
            </div>
        </div>
    </div>

    <script>
        function nav(url) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'nav',url})); window.location.href=url; }
        function del(id) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'del',id})); }
        function showModal() { document.getElementById('modal').classList.add('show'); }
        function hideModal() { document.getElementById('modal').classList.remove('show'); }
        function addShortcut() {
            const title = document.getElementById('mTitle').value.trim();
            let url = document.getElementById('mUrl').value.trim();
            if (!title || !url) return;
            if (!url.startsWith('http')) url = 'https://' + url;
            const id = Date.now().toString();
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'add',id,title,url}));
            hideModal();
        }
        // Listen for shortcut updates from React Native safely
        window.addEventListener('message', function(event) {
            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                if (data && data.type === 'update_shortcuts') {
                    const scContainer = document.getElementById('shortcuts');
                    let newHtml = '';
                    data.shortcuts.forEach(function(s) {
                        const domain = new URL(s.url).hostname;
                        const safeUrl = s.url.replace(/'/g, "\\\\'");
                        const safeId = s.id.replace(/'/g, "\\\\'");
                        newHtml += '<div class="shortcut" onclick="nav(\\'' + safeUrl + '\\')">' +
                            '<button class="del-btn" onclick="event.stopPropagation();del(\\'' + safeId + '\\')">×</button>' +
                            '<div class="shortcut-icon"><img src="https://s2.googleusercontent.com/s2/favicons?domain=' + domain + '&sz=64" alt="icon"/></div>' +
                            '<div class="shortcut-title">' + s.title + '</div>' +
                        '</div>';
                    });
                    newHtml += '<div class="add-btn" onclick="showModal()"><div class="add-icon">+</div><div class="add-label">Add</div></div>';
                    scContainer.innerHTML = newHtml;
                }
            } catch(e) {}
        });

        document.getElementById('searchInput').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const query = this.value; let target = query.trim();
                if (!target.startsWith('http://') && !target.startsWith('https://')) {
                    if (!target.includes('.') || target.includes(' ')) { target = 'https://www.google.com/search?q=' + encodeURIComponent(target); }
                    else { target = 'https://' + target; }
                }
                window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'nav',url:target}));
            }
        });

        window.addEventListener('load', function() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'request_shortcuts'}));
        });
    </script>
</body>
</html>
`;

interface Props { 
    onClose: () => void; 
    onMinimize: () => void;
    isMinimized: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

// --- macOS Traffic Lights with Hover functionality ---
interface TrafficLightProps {
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
}

const TrafficLights = ({ onClose, onMinimize, onMaximize }: TrafficLightProps) => {
    const [hovered, setHovered] = useState(false);

    return (
        <View 
            style={styles.trafficLights}
            {...Platform.select({
                web: {
                    onPointerEnter: () => setHovered(true),
                    onPointerLeave: () => setHovered(false),
                }
            })}
        >
            <Pressable onPress={onClose} style={[styles.dot, { backgroundColor: '#FF5F57' }]}>
                {hovered && <X size={8} color="#4c0000" strokeWidth={3} />}
            </Pressable>
            <Pressable onPress={onMinimize} style={[styles.dot, { backgroundColor: '#FFBD2E' }]}>
                {hovered && <Minus size={8} color="#5a3d00" strokeWidth={3} />}
            </Pressable>
            <Pressable onPress={onMaximize} style={[styles.dot, { backgroundColor: '#28C840' }]}>
                {hovered && <Maximize2 size={6} color="#004d00" strokeWidth={3} />}
            </Pressable>
        </View>
    );
};


type ChromeTab = {
    id: string;
    url: string;
    inputUrl: string;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
    isLoading: boolean;
};
const TabContent = ({ tab, active, onWebRef, updateTab, desktopUA, CHROME_NEW_TAB, onMessage, zoomLevel, isDark }: { 
    tab: ChromeTab, active: boolean, onWebRef: (ref: any) => void, updateTab: any, desktopUA: string, CHROME_NEW_TAB: string, onMessage?: (msg: string) => void, zoomLevel: number, isDark: boolean
}) => {
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(active ? 1 : 0, { duration: 150 }),
        zIndex: active ? 10 : 0,
    }), [active]);

    const isNewTab = tab.url === 'chrome://newtab';

    return (
        <Animated.View 
            style={[StyleSheet.absoluteFill, animatedStyle]}
            pointerEvents={active ? 'auto' : 'none'}
        >
            {Platform.OS === 'web' ? (
                <View 
                    style={styles.webview}
                    // @ts-ignore
                    dangerouslySetInnerHTML={{
                        __html: `
                            <iframe
                                id="chrome-iframe-${tab.id}"
                                src="${isNewTab ? '' : (tab.url || '').replace(/"/g, '&quot;')}"
                                srcdoc='${isNewTab ? CHROME_NEW_TAB.replace(/'/g, "&apos;") : ""}'
                                style="width: 100%; height: 100%; border: none; background-color: #fff;"
                                allowfullscreen="true"
                                webkitallowfullscreen="true"
                                mozallowfullscreen="true"
                                oallowfullscreen="true"
                                msallowfullscreen="true"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen *"
                            ></iframe>
                        `
                    }}
                    ref={(r) => {
                        if (!r) return;
                        // On web, we need to find the iframe inside the div to shim it
                        const iframe = (r as any).querySelector?.('iframe');
                        if (iframe) {
                            iframe.goBack = () => { try { iframe.contentWindow?.history.back(); } catch(e) {} };
                            iframe.goForward = () => { try { iframe.contentWindow?.history.forward(); } catch(e) {} };
                            iframe.reload = () => { try { iframe.contentWindow?.location.reload(); } catch(e) {} };
                            onWebRef(iframe);
                        }
                    }}
                />
            ) : (
                <WebView
                    ref={onWebRef}
                    source={isNewTab ? { html: CHROME_NEW_TAB } : { uri: tab.url }}
                    style={styles.webview}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsFullscreenVideo={true}
                    userAgent={desktopUA}
                    // Execute script when tab loads first
                    injectedJavaScript={`
                        window.applySettings = function(zoom, dark) {
                            try {
                                document.body.style.transform = 'scale(' + zoom + ')';
                                document.body.style.transformOrigin = '0 0';
                                document.body.style.width = (100 / zoom) + '%';
                                if (dark) {
                                    document.documentElement.style.backgroundColor = '#202124';
                                } else {
                                    document.documentElement.style.backgroundColor = '#FFFFFF';
                                }
                            } catch(e) {}
                        };
                        // YouTube Fullscreen Shim for Desktop Player
                        if (window.location.host.includes('youtube.com')) {
                            // Helper to trigger native fullscreen on a video element
                            const goFullscreen = (v) => {
                                if (v && v.webkitEnterFullscreen) {
                                    v.webkitEnterFullscreen();
                                    return true;
                                }
                                return false;
                            };

                            // Overwrite requestFullscreen
                            const originalRequest = Element.prototype.requestFullscreen || Element.prototype.webkitRequestFullscreen;
                            Element.prototype.requestFullscreen = function() {
                                const video = this.tagName === 'VIDEO' ? this : this.querySelector('video');
                                if (video && goFullscreen(video)) return Promise.resolve();
                                return originalRequest ? originalRequest.apply(this, arguments) : Promise.reject();
                            };

                            // Specifically for YouTube's custom buttons
                            document.addEventListener('click', (e) => {
                                if (e.target.closest('.ytp-fullscreen-button')) {
                                    const video = document.querySelector('video');
                                    if (video) goFullscreen(video);
                                }
                            }, true);
                        }
                        window.applySettings(${zoomLevel}, ${isDark});
                        true;
                    `}
                    onNavigationStateChange={(state) => {
                        updateTab(tab.id, {
                            canGoBack: state.canGoBack || tab.url !== 'chrome://newtab',
                            canGoForward: state.canGoForward,
                            title: state.title || tab.title
                        });
                        // IMPORTANT: Only update inputUrl so the URL bar syncs, but do NOT update tab.url 
                        // as doing so will change the <WebView source> prop which causes an endless 
                        // 'ERR_TOO_MANY_REDIRECTS' reload cycle inside the WebView when traversing links!
                        if (state.url && !state.url.startsWith('about:blank') && state.url !== tab.url) {
                            updateTab(tab.id, { inputUrl: state.url });
                        }
                    }}
                    onMessage={(event) => {
                        if (onMessage) onMessage(event.nativeEvent.data);
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState={false}
                />
            )}
        </Animated.View>
    );
};

export const ChromeWindow: React.FC<Props> = ({ onClose, onMinimize, isMinimized, onFullscreenChange }) => {
    const { width: scrW, height: scrH } = useWindowDimensions();

    // --- Custom shortcuts stored in AsyncStorage ---
    const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('browser_shortcuts').then(v => {
            if (v) {
                try { 
                    const parsed = JSON.parse(v);
                    setShortcuts(parsed);
                } catch {} 
            }
            setHydrated(true);
        });
    }, []);

    const handleWebMessage = (msg: string, tabId: string) => {
        try {
            const data = JSON.parse(msg);
            if (data.type === 'add') {
                setShortcuts(prev => {
                    const nu = [...prev, { id: data.id, title: data.title, url: data.url }];
                    AsyncStorage.setItem('browser_shortcuts', JSON.stringify(nu));
                    return nu;
                });
            } else if (data.type === 'del') {
                setShortcuts(prev => {
                    const nu = prev.filter(s => s.id !== data.id);
                    AsyncStorage.setItem('browser_shortcuts', JSON.stringify(nu));
                    return nu;
                });
            } else if (data.type === 'nav') {
                updateTab(tabId, { url: data.url, inputUrl: data.url });
            } else if (data.type === 'request_shortcuts') {
                const payload = JSON.stringify({ type: 'update_shortcuts', shortcuts });
                webRefs.current[tabId]?.injectJavaScript(`
                    try { window.dispatchEvent(new MessageEvent('message', { data: decodeURIComponent('${encodeURIComponent(payload)}') })); } catch(e) {}
                    true;
                `);
            }
        } catch {}
    };

    const [tabs, setTabs] = useState<ChromeTab[]>([
        { id: '1', url: 'chrome://newtab', inputUrl: '', title: 'New Tab', canGoBack: false, canGoForward: false, isLoading: true }
    ]);
    const [activeTabId, setActiveTabId] = useState('1');
    const webRefs = useRef<{ [key: string]: WebView | null }>({}); 

    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDark, setIsDark] = useState(true);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);

    // Apply zoom dynamically without reloading
    useEffect(() => {
        Object.values(webRefs.current).forEach(ref => {
            if (ref && 'injectJavaScript' in ref) {
                ref.injectJavaScript(`if(window.applySettings) window.applySettings(${zoomLevel}, ${isDark}); true;`);
            }
        });
    }, [zoomLevel, isDark]);

    // Push shortcuts to webview dynamically without reloading
    useEffect(() => {
        if (!hydrated) return; // Wait until we actually loaded shortcuts from disk
        const payload = JSON.stringify({ type: 'update_shortcuts', shortcuts });
        Object.values(webRefs.current).forEach(ref => {
            if (ref && 'injectJavaScript' in ref) {
                ref.injectJavaScript(`
                    try { window.dispatchEvent(new MessageEvent('message', { data: decodeURIComponent('${encodeURIComponent(payload)}') })); } catch(e) {}
                    true;
                `);
            }
        });
    }, [shortcuts]);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    const updateTab = (id: string, updates: Partial<ChromeTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const addTab = () => {
        const newId = Math.random().toString(36).substring(2, 9);
        setTabs(prev => [...prev, { id: newId, url: 'chrome://newtab', inputUrl: '', title: 'New Tab', canGoBack: false, canGoForward: false, isLoading: true }]);
        setActiveTabId(newId);
    };

    const closeTab = (id: string) => {
        if (tabs.length === 1) {
            onClose();
            return;
        }
        setTabs(prev => prev.filter(t => t.id !== id));
        if (activeTabId === id) {
            const index = tabs.findIndex(t => t.id === id);
            const nextTab = tabs[index - 1] || tabs[index + 1];
            if (nextTab) setActiveTabId(nextTab.id);
        }
    };

    // -- Window dragging / resizing state --
    const [isMax, setIsMax] = useState(false);
    
    // Default window geometry
    const W_W = Math.min(scrW * 0.85, 900);
    const W_H = Math.min(scrH * 0.8, 700);
    const START_X = (scrW - W_W) / 2;
    const START_Y = Math.max(44, (scrH - W_H) / 2 - 20);

    const winX = useSharedValue(START_X);
    const winY = useSharedValue(START_Y);
    const winW = useSharedValue(W_W);
    const winH = useSharedValue(W_H);

    // Keep track of drag offsets and previous unmaximized state
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);
    const prevWinX = useSharedValue(START_X);
    const prevWinY = useSharedValue(START_Y);
    const prevWinW = useSharedValue(W_W);
    const prevWinH = useSharedValue(W_H);

    // Minimize animation shared value
    const minimizeAnim = useSharedValue(0);

    useEffect(() => {
        const springConfig = { damping: 30, stiffness: 200 }; // Smoother, less jumpy
        minimizeAnim.value = withSpring(isMinimized ? 1 : 0, springConfig);
        
        // If we minimize while maximized, we must tell the dock to reappear
        if (isMinimized && isMax) {
            if (onFullscreenChange) onFullscreenChange(false);
        } else if (!isMinimized && isMax) {
            // Restore "fullscreen" state for dock when restoring maximized window
            if (onFullscreenChange) onFullscreenChange(true);
        }
    }, [isMinimized, isMax]);

    // For resizing
    const offsetW = useSharedValue(0);
    const offsetH = useSharedValue(0);

    // --- Drag window by title bar ---
    const dragGesture = Gesture.Pan()
        .onStart(() => {
            offsetX.value = winX.value;
            offsetY.value = winY.value;
        })
        .onUpdate((e) => {
            if (isMax) return;
            winX.value = offsetX.value + e.translationX;
            winY.value = Math.max(32, offsetY.value + e.translationY);
        });

    // --- Resize window from bottom right corner ---
    const resizeGesture = Gesture.Pan()
        .onStart(() => {
            offsetW.value = winW.value;
            offsetH.value = winH.value;
        })
        .onUpdate((e) => {
            if (isMax) return;
            winW.value = Math.max(320, offsetW.value + e.translationX);
            winH.value = Math.max(200, offsetH.value + e.translationY);
        });

    // --- Maximize/Restore ---
    const toggleMaximize = () => {
        const springConfig = { damping: 25, stiffness: 400 };
        if (isMax) {
            // Restore to previous geometry using spring animations
            winX.value = withSpring(prevWinX.value, springConfig);
            winY.value = withSpring(prevWinY.value, springConfig);
            winW.value = withSpring(prevWinW.value, springConfig);
            winH.value = withSpring(prevWinH.value, springConfig);
            setIsMax(false);
            if (onFullscreenChange) onFullscreenChange(false);
        } else {
            // Save current geometry before maximizing
            prevWinX.value = winX.value;
            prevWinY.value = winY.value;
            prevWinW.value = winW.value;
            prevWinH.value = winH.value;
            
            // Maximize (crush the dock completely and fill screen minus topbar)
            winX.value = withSpring(0, springConfig);
            winY.value = withSpring(32, springConfig);
            winW.value = withSpring(scrW, springConfig);
            winH.value = withSpring(scrH - 32 + 5, springConfig); // Fill full height to hide bottom
            setIsMax(true);
            if (onFullscreenChange) onFullscreenChange(true);
        }
    };


    const animatedWinStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: winX.value }, 
            { translateY: winY.value + (minimizeAnim.value * (scrH - winY.value)) },
            { scale: 1 - (minimizeAnim.value * 0.8) }
        ] as any,
        width: winW.value,
        height: winH.value,
        opacity: withSpring(isMinimized ? 0 : 1, { damping: 30, stiffness: 200 }),
    }));


    const navigate = (raw: string) => {
        let target = raw.trim();
        if (!target.startsWith('http://') && !target.startsWith('https://') && target !== 'chrome://newtab') {
            if (!target.includes('.') || target.includes(' ')) {
                target = `https://www.google.com/search?q=${encodeURIComponent(target)}`;
            } else {
                target = `https://${target}`;
            }
        }
        updateTab(activeTabId, { url: target, inputUrl: target });
    };

    // Chrome Desktop User Agent
    const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    return (
        <Animated.View
            entering={FadeIn.duration(100)}
            exiting={FadeOut.duration(75)}
            style={[styles.window, animatedWinStyle]}
            pointerEvents={isMinimized ? 'none' : 'auto'}
        >
            {/* ── Title Bar (Draggable Area) ── */}
            <GestureDetector gesture={dragGesture}>
                <Animated.View style={styles.titleBarWrapper}>
                    <BlurView intensity={80} tint="dark" style={styles.titleBar}>
                        <TrafficLights 
                            onClose={onClose} 
                            onMinimize={onMinimize}
                            onMaximize={toggleMaximize} 
                        />

                        {/* Tabs Bar */}
                        <View style={styles.tabsContainer} onPointerDown={(e) => e.stopPropagation()}>
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.tab, activeTabId === tab.id && styles.activeTab]}
                                    onPress={() => setActiveTabId(tab.id)}
                                >
                                    <Text style={[styles.tabText, activeTabId === tab.id && styles.activeTabText]} numberOfLines={1}>
                                        {tab.title}
                                    </Text>
                                    <TouchableOpacity style={styles.closeTabBtn} onPress={() => closeTab(tab.id)}>
                                        <X size={12} color={activeTabId === tab.id ? '#e8eaed' : '#9aa0a6'} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={styles.addTabBtn} onPress={addTab}>
                                <Plus size={16} color="#e8eaed" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Animated.View>
            </GestureDetector>

            {/* ── URL Bar & Navigation (Below Title Bar) ── */}
            <View style={styles.toolbar} onPointerDown={(e) => e.stopPropagation()}>
                <View style={styles.navBtns}>
                    <TouchableOpacity onPress={() => webRefs.current[activeTabId]?.goBack()} disabled={!activeTab.canGoBack}>
                        <ChevronLeft size={20} color={activeTab.canGoBack ? '#e8eaed' : 'rgba(255,255,255,0.3)'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => webRefs.current[activeTabId]?.goForward()} disabled={!activeTab.canGoForward}>
                        <ChevronRight size={20} color={activeTab.canGoForward ? '#e8eaed' : 'rgba(255,255,255,0.3)'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => webRefs.current[activeTabId]?.reload()}>
                        <RotateCw size={16} color={activeTab.isLoading ? '#60a5fa' : '#e8eaed'} />
                    </TouchableOpacity>
                </View>

                {/* URL Input */}
                <View style={[styles.urlBar, !isDark && { backgroundColor: '#f1f3f4' }]}>
                    <Search size={14} color={isDark ? "#9aa0a6" : "#5f6368"} />
                    <TextInput
                        style={[styles.urlInput, !isDark && { color: '#202124' }]}
                        value={activeTab.inputUrl}
                        onChangeText={(text) => updateTab(activeTabId, { inputUrl: text })}
                        onSubmitEditing={() => navigate(activeTab.inputUrl)}
                        returnKeyType="go"
                        autoCapitalize="none"
                        autoCorrect={false}
                        selectTextOnFocus
                        placeholderTextColor={isDark ? "#9aa0a6" : "#5f6368"}
                    />
                </View>
                {/* Settings gear */}
                <TouchableOpacity 
                    style={{ paddingHorizontal: 10 }}
                    onPress={() => setShowSettingsMenu(!showSettingsMenu)}
                >
                    <Settings size={18} color={isDark ? "#9aa0a6" : "#5f6368"} />
                </TouchableOpacity>
            </View>

            {/* Settings Dropdown Menu (MacOS Chrome Style) */}
            {showSettingsMenu && (
                <View style={[styles.settingsMenu, !isDark && { backgroundColor: '#ffffff', borderColor: '#c6c6c6', shadowColor: '#000', shadowOpacity: 0.15 }]} onStartShouldSetResponder={() => true}>
                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>New tab</Text>
                        <Text style={styles.menuShortcut}>⌘T</Text>
                    </View>
                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>New window</Text>
                        <Text style={styles.menuShortcut}>⌘N</Text>
                    </View>
                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>New Incognito window</Text>
                        <Text style={styles.menuShortcut}>⇧⌘N</Text>
                    </View>
                    
                    <View style={[styles.menuDivider, !isDark && { backgroundColor: '#dadce0' }]} />
                    
                    <View style={styles.menuItemZoom}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }, { flex: 1 }]}>Zoom</Text>
                        <View style={styles.zoomRow}>
                            <TouchableOpacity style={[styles.zoomBtnChrome, !isDark && styles.zoomBtnChromeLight]} onPress={() => setZoomLevel(z => Math.max(0.25, z - 0.1))}>
                                <Minus size={14} color={isDark ? "#e8eaed" : "#5f6368"} />
                            </TouchableOpacity>
                            <Text style={[styles.zoomTextChrome, !isDark && { color: '#202124' }]}>{Math.round(zoomLevel * 100)}%</Text>
                            <TouchableOpacity style={[styles.zoomBtnChrome, !isDark && styles.zoomBtnChromeLight]} onPress={() => setZoomLevel(z => Math.min(3, z + 0.1))}>
                                <Plus size={14} color={isDark ? "#e8eaed" : "#5f6368"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.zoomBtnChrome, { marginLeft: 6 }, !isDark && styles.zoomBtnChromeLight]} onPress={() => {}}>
                                <Maximize2 size={12} color={isDark ? "#e8eaed" : "#5f6368"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.menuDivider, !isDark && { backgroundColor: '#dadce0' }]} />

                    <TouchableOpacity style={styles.menuItem} onPress={() => setIsDark(!isDark)}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>Theme: {isDark ? "Dark" : "Light"}</Text>
                        <Text style={styles.menuShortcut}></Text>
                    </TouchableOpacity>

                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>Settings</Text>
                        <Text style={styles.menuShortcut}>⌘,</Text>
                    </View>
                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>Help</Text>
                        <View style={styles.menuSubArrow}>
                            <ChevronRight size={14} color={isDark ? "#9aa0a6" : "#5f6368"} />
                        </View>
                    </View>
                    <View style={styles.menuItem}>
                        <Text style={[styles.menuItemText, !isDark && { color: '#202124' }]}>Exit</Text>
                        <Text style={styles.menuShortcut}>⌘Q</Text>
                    </View>
                </View>
            )}

            {/* ── WebView Area ── */}
            <View style={[styles.webviewContainer, !isDark && { backgroundColor: '#fff' }]} onPointerDown={() => setShowSettingsMenu(false)}>
                {tabs.map(tab => (
                    <TabContent 
                        key={tab.id}
                        tab={tab}
                        active={activeTabId === tab.id}
                        onWebRef={(r) => { webRefs.current[tab.id] = r; }}
                        updateTab={updateTab}
                        desktopUA={desktopUA}
                        CHROME_NEW_TAB={CHROME_NEW_TAB}
                        onMessage={(msg) => handleWebMessage(msg, tab.id)}
                        zoomLevel={zoomLevel}
                        isDark={isDark}
                    />
                ))}
            </View>

            {/* ── Resize Handle (Bottom Right Corner) ── */}
            <GestureDetector gesture={resizeGesture}>
                <Animated.View style={styles.resizeHandle}>
                    <View style={styles.resizeGrip} />
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    window: {
        position: 'absolute',
        top: 0, 
        left: 0,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#1a1a2e',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.7,
        shadowRadius: 40,
        elevation: 30,
        zIndex: 2000,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    titleBarWrapper: {
        height: 40,
        cursor: 'move' as any, // Hand pointer on web
    },
    titleBar: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        gap: 10,
        backgroundColor: '#202124',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 7,
        marginRight: 6,
        paddingVertical: 5,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: '100%',
        gap: 2,
    },
    addTabBtn: {
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        marginLeft: 4,
        marginBottom: 4,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 32,
        minWidth: 120,
        maxWidth: 200,
        backgroundColor: '#292a2d',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 0,
        cursor: 'pointer',
    },
    activeTab: {
        backgroundColor: '#35363a',
    },
    tabText: {
        color: '#9aa0a6',
        fontSize: 12,
        flex: 1,
        marginRight: 8,
    },
    activeTabText: {
        color: '#e8eaed',
    },
    closeTabBtn: {
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },
    toolbar: {
        height: 44,
        backgroundColor: '#35363a',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#202124',
    },
    navBtns: {
        flexDirection: 'row',
        gap: 12,
        marginRight: 10,
        alignItems: 'center',
    },
    urlBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#202124',
        borderRadius: 20,
        paddingHorizontal: 14,
        gap: 8,
        height: 30,
        cursor: 'text' as any,
    },
    urlInput: {
        flex: 1,
        color: '#e8eaed',
        fontSize: 14,
        padding: 0,
        height: '100%',
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#fff', // underlying web bg
    },
    webview: {
        flex: 1,
    },
    // Invisible touch area in bottom right corner to drag/resize
    resizeHandle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 25,
        height: 25,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        cursor: 'se-resize' as any,
        padding: 4,
    },
    resizeGrip: {
        width: 0,
        height: 0,
        borderBottomWidth: 10,
        borderBottomColor: 'rgba(255,255,255,0.2)',
        borderLeftWidth: 10,
        borderLeftColor: 'transparent',
    },
    settingsMenu: {
        position: 'absolute',
        top: 80,
        right: 12,
        width: 280,
        backgroundColor: '#202124',
        borderRadius: 8,
        paddingVertical: 8,
        zIndex: 3000,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#3c4043',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    menuItemZoom: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    menuItemText: {
        color: '#e8eaed',
        fontSize: 13,
    },
    menuShortcut: {
        color: '#9aa0a6',
        fontSize: 12,
    },
    menuSubArrow: {
        marginLeft: 8,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#3c4043',
        marginVertical: 6,
    },
    zoomRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    zoomBtnChrome: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#303134',
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomBtnChromeLight: {
        backgroundColor: '#f1f3f4',
    },
    zoomTextChrome: {
        color: '#e8eaed',
        fontSize: 13,
        width: 44,
        textAlign: 'center',
        fontWeight: '500',
    }
});
