import React, { useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    PanResponder,
    GestureResponderEvent,
    LayoutChangeEvent,
    Image,
    PanResponderGestureState,
} from 'react-native';
import Animated, {
    FadeIn, FadeOut,
    useSharedValue, useAnimatedStyle, useAnimatedReaction,
    withSpring, runOnJS,
} from 'react-native-reanimated';
import {
    Wifi,
    Moon,
    Sun,
    Volume2,
    VolumeX,
    Calculator,
    Layers,
    Bell,
    BellOff,
    SkipBack,
    Pause,
    Play,
    SkipForward,
    Music,
} from 'lucide-react-native';
import { useOS } from '../hooks/useOS';

// ── Design tokens ──────────────────────────────────────────────
// All tiles: white frosted glass
const TILE       = 'rgba(255, 255, 255, 0.18)';   // default tile
const TILE_ACTIVE = 'rgba(255, 255, 255, 0.32)';  // active/on tile

// ── Animated press tile ──────────────────────────────────────────
// Children are INSIDE the Pressable so the full surface is tappable
const SpringTile: React.FC<{
    onPress?: () => void;
    style?: any;
    children: React.ReactNode;
}> = ({ onPress, style, children }) => {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.93, { damping: 20, stiffness: 300 });
    };
    const onPressOut = () => {
        scale.value = withSpring(1, { damping: 14, stiffness: 200 });
    };

    return (
        <Animated.View style={[animStyle, style]}>
            <Pressable
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={styles.tilePress}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};

// ── Draggable slider (UI-thread smooth) ──────────────────────────
const DragSlider: React.FC<{
    label: string;
    value: number;
    onChange: (v: number) => void;
    icon: React.ReactNode;
}> = ({ label, value, onChange, icon }) => {
    const trackWidth = useRef(0);
    // Shared value lives on the UI thread — updates without JS bridge
    const fillPct = useSharedValue(value);

    // Keep shared value in sync if parent changes value externally
    React.useEffect(() => { fillPct.value = value; }, [value]);

    const animFill = useAnimatedStyle(() => ({
        width: `${Math.round(fillPct.value * 100)}%` as any,
    }));

    const updateValue = (x: number) => {
        if (!trackWidth.current) return;
        const v = Math.max(0, Math.min(1, x / trackWidth.current));
        fillPct.value = v;    // instant, on UI thread
        onChange(v);          // sync React state (JS thread, async is fine)
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => updateValue(e.nativeEvent.locationX),
            onPanResponderMove: (e) => updateValue(e.nativeEvent.locationX),
        })
    ).current;

    return (
        <View style={[{ backgroundColor: TILE }, styles.sliderCard]}>
            <View style={styles.sliderInner}>
                <Text style={styles.sliderLabel}>{label}</Text>
                <View
                    style={styles.track}
                    onLayout={(e) => { trackWidth.current = e.nativeEvent.layout.width; }}
                    {...panResponder.panHandlers}
                >
                    <Animated.View style={[styles.fill, animFill]}>
                        <View style={styles.fillIcon}>{icon}</View>
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

interface Props { 
    onClose: () => void; 
    onOpenApp?: (appId: string) => void;
}

export const ControlCenter: React.FC<Props> = ({ onClose, onOpenApp }) => {
    const {
        wifi, setWifi,
        nightLight, setNightLight,
        dnd, setDnd,
        brightness, setBrightness,
        volume, setVolume,
        silentMode, setSilentMode,
        spotifyState, spotifyControl
    } = useOS();

    // helpers — shared Tile + individual ref widths no longer needed
    const Tile = ({ active = false, onPress, style, children }: {
        active?: boolean; onPress?: () => void; style?: any; children: React.ReactNode;
    }) => (
        <SpringTile onPress={onPress} style={[{ backgroundColor: active ? TILE_ACTIVE : TILE }, style]}>
            {children}
        </SpringTile>
    );

    return (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.panel}>
            <View style={styles.shell}>

                {/* ══ ROW 1: Left column (Wi-Fi + Focus)  |  Media ══ */}
                <View style={styles.row}>
                    {/* Left column */}
                    <View style={styles.leftCol}>

                        {/* Wi-Fi */}
                        <Tile active={wifi} onPress={() => setWifi(!wifi)} style={styles.smallPill}>
                            <View style={styles.pillContent}>
                                <View style={styles.circle}><Wifi size={15} color="#fff" /></View>
                                <View>
                                    <Text style={styles.tileTitle}>Wi-Fi</Text>
                                    <Text style={styles.tileSub}>{wifi ? 'bbsn-5G' : 'Off'}</Text>
                                </View>
                            </View>
                        </Tile>

                        {/* Focus */}
                        <Tile active={dnd} onPress={() => setDnd(!dnd)} style={styles.smallPill}>
                            <View style={styles.pillContent}>
                                <View style={styles.circle}>
                                    <Moon size={15} color="#fff" fill={dnd ? '#fff' : 'transparent'} />
                                </View>
                                <Text style={styles.tileTitle}>Focus</Text>
                            </View>
                        </Tile>

                    </View>

                    {/* Media */}
                    <Tile style={styles.mediaWrap}>
                        <View style={styles.mediaInner}>
                            {spotifyState.cover ? (
                                <Image source={{ uri: spotifyState.cover }} style={styles.art} />
                            ) : (
                                <View style={[styles.art, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                                    <Music size={24} color="#666" />
                                </View>
                            )}
                            <Text style={styles.songName} numberOfLines={1}>{spotifyState.title}</Text>
                            <Text style={styles.songArtist} numberOfLines={1}>{spotifyState.artist}</Text>
                            <View style={styles.mediaCtrl}>
                                <SpringTile onPress={spotifyControl.prev} style={styles.mediaBtn}>
                                    <SkipBack size={15} color="#fff" />
                                </SpringTile>
                                <SpringTile onPress={spotifyControl.playPause} style={[styles.mediaBtn, styles.playBtn]}>
                                    {spotifyState.isPlaying ? (
                                        <Pause size={14} color="#fff" fill="#fff" />
                                    ) : (
                                        <Play size={14} color="#fff" fill="#fff" style={{ marginLeft: 2 }} />
                                    )}
                                </SpringTile>
                                <SpringTile onPress={spotifyControl.next} style={styles.mediaBtn}>
                                    <SkipForward size={15} color="#fff" />
                                </SpringTile>
                            </View>
                        </View>
                    </Tile>
                </View>

                {/* ══ 4 circle buttons ══ */}
                <View style={styles.btnRow}>
                    <Tile active={nightLight} onPress={() => setNightLight(!nightLight)} style={styles.circBtn}>
                        <View style={styles.circInner}><Sun size={22} color="#fff" /></View>
                    </Tile>
                    <Tile 
                        style={styles.circBtn} 
                        onPress={() => {
                            if(onOpenApp) onOpenApp('calculator');
                            onClose();
                        }}
                    >
                        <View style={styles.circInner}><Calculator size={22} color="#fff" /></View>
                    </Tile>
                    <Tile style={styles.circBtn}>
                        <View style={styles.circInner}><Layers size={22} color="#fff" /></View>
                    </Tile>
                    <Tile active={silentMode} onPress={() => setSilentMode(!silentMode)} style={styles.circBtn}>
                        <View style={styles.circInner}>
                            {silentMode ? <BellOff size={22} color="#fff" /> : <Bell size={22} color="#fff" />}
                        </View>
                    </Tile>
                </View>

                {/* ══ Sound Slider ══ */}
                <DragSlider
                    label="Sound"
                    value={volume}
                    onChange={setVolume}
                    icon={silentMode
                        ? <VolumeX size={12} color="rgba(60,60,80,0.9)" />
                        : <Volume2 size={12} color="rgba(60,60,80,0.9)" />}
                />

                {/* ══ Display Slider ══ */}
                <DragSlider
                    label="Display"
                    value={brightness}
                    onChange={setBrightness}
                    icon={<Sun size={12} color="rgba(60,60,80,0.9)" />}
                />

            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    panel: {
        position: 'absolute',
        top: 44,
        right: 14,
        width: 322,
        zIndex: 1000,
        borderRadius: 26,
        overflow: 'hidden',
    },
    shell: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        padding: 11,
        gap: 9,
    },

    tilePress: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    // ── Row ──────────────────────────────────────────────────────
    row: {
        flexDirection: 'row',
        gap: 9,
    },

    // ── Left column (Wi-Fi + Focus) ───────────────────────────────
    leftCol: {
        flex: 1,
        gap: 9,
        alignSelf: 'stretch',
    },
    smallPill: {
        flex: 1,
        borderRadius: 18,
        overflow: 'hidden',
    },
    pillContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tileTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    tileSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        marginTop: 1,
    },

    // ── Media ─────────────────────────────────────────────────────
    mediaWrap: {
        width: 128,
        borderRadius: 18,
        overflow: 'hidden',
    },
    mediaInner: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        gap: 3,
    },
    art: {
        width: 52,
        height: 52,
        borderRadius: 10,
        marginBottom: 3,
    },
    songName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    songArtist: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 10,
        textAlign: 'center',
    },
    mediaCtrl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    mediaBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    playBtn: {
        backgroundColor: 'rgba(255,255,255,0.30)',
    },

    // ── 4 circle buttons ─────────────────────────────────────────
    btnRow: {
        flexDirection: 'row',
        gap: 9,
    },
    circBtn: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 999,
        overflow: 'hidden',
    },
    circInner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Sliders ──────────────────────────────────────────────────
    sliderCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    sliderInner: {
        padding: 10,
        gap: 7,
    },
    sliderLabel: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 2,
    },
    track: {
        height: 26,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 13,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 13,
        justifyContent: 'center',
        paddingLeft: 7,
        minWidth: 26,
    },
    fillIcon: {
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
