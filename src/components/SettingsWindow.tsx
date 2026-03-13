import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, TextInput, ScrollView, Animated as RNAnimated, Switch, Image, Alert } from 'react-native';
import Animated, { FadeIn, FadeOut, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { X, Minus, Maximize2, Search, Wifi, Bluetooth, Monitor, Paintbrush, ImageIcon, Check, User, Camera, RotateCcw, ChevronRight, Shield, Volume2, VolumeX } from 'lucide-react-native';
import { PanResponder, LayoutChangeEvent } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSettings, INITIAL_USER } from '../context/SettingsContext';
import { useOS } from '../hooks/useOS';

interface Props {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

const SIDEBAR_ITEMS = [
    { id: 'profile', label: 'Profilo', icon: User, color: '#A2A2A2' },
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi, color: '#0A84FF' },
    { id: 'bluetooth', label: 'Bluetooth', icon: Bluetooth, color: '#0A84FF' },
    { id: 'network', label: 'Rete', icon: Monitor, color: '#0A84FF' },
    { id: 'appearance', label: 'Aspetto', icon: Paintbrush, color: '#5E5CE6' },
    { id: 'dock', label: 'Desktop e Dock', icon: Monitor, color: '#FF9F0A' },
    { id: 'wallpaper', label: 'Sfondo', icon: ImageIcon, color: '#32ADE6' },
    { id: 'sound', label: 'Suono', icon: Volume2, color: '#FF3B30' },
    { id: 'reset', label: 'Privacy e Reset', icon: RotateCcw, color: '#FF453A' },
];

const SettingsSlider: React.FC<{
    min: number;
    max: number;
    value: number;
    onChange: (v: number) => void;
    accentColor: string;
}> = ({ min, max, value, onChange, accentColor }) => {
    const trackRef = React.useRef<View>(null);
    const [trackWidth, setTrackWidth] = React.useState(0);

    const onLayout = (e: any) => {
        setTrackWidth(e.nativeEvent.layout.width);
    };

    const updateValue = (clientX: number) => {
        if (trackWidth === 0) return;
        const boundedX = Math.max(0, Math.min(clientX, trackWidth));
        const percentage = boundedX / trackWidth;
        const newValue = min + (max - min) * percentage;
        onChange(newValue);
    };

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                updateValue(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt, gestureState) => {
                updateValue(evt.nativeEvent.locationX);
            },
        })
    ).current;

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <View 
            ref={trackRef} 
            style={styles.sliderTrack} 
            onLayout={onLayout}
            {...panResponder.panHandlers}
        >
            <View style={[styles.sliderFill, { width: `${percentage}%`, backgroundColor: accentColor }]} />
            <View style={[styles.sliderThumb, { left: `${percentage}%` }]} />
        </View>
    );
};

export const SettingsWindow: React.FC<Props> = ({ onClose, onMinimize, isMinimized }) => {
    const { width: scrW, height: scrH } = useWindowDimensions();
    const { settings, updateSettings } = useSettings();

    const [activePane, setActivePane] = useState('profile');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetStep, setResetStep] = useState(0); // 0: buttons, 1: password, 2: confirm 1, 3: confirm 2
    const [resetType, setResetType] = useState<'USER' | 'FULL' | null>(null);
    const [confirmPass, setConfirmPass] = useState('');
    const { setIsResetting, setResetType: setGlobalResetType } = useOS();

    // Geometry
    const W_W = 750;
    const W_H = 600;
    const winX = useSharedValue((scrW - W_W) / 2);
    const winY = useSharedValue(Math.max(44, (scrH - W_H) / 2));
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    const minimizeAnim = useSharedValue(0);
    React.useEffect(() => {
        minimizeAnim.value = withSpring(isMinimized ? 1 : 0, { damping: 30, stiffness: 200 });
    }, [isMinimized]);

    const dragGesture = Gesture.Pan()
        .onStart(() => {
            offsetX.value = winX.value;
            offsetY.value = winY.value;
        })
        .onUpdate((e) => {
            winX.value = offsetX.value + e.translationX;
            winY.value = Math.max(32, offsetY.value + e.translationY);
        });

    const animatedWinStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: winX.value },
            { translateY: winY.value + (minimizeAnim.value * (scrH - winY.value)) },
            { scale: 1 - (minimizeAnim.value * 0.8) }
        ] as any,
        width: W_W,
        height: W_H,
        opacity: withSpring(isMinimized ? 0 : 1),
    }));

    const renderContent = () => {
        switch (activePane) {
            case 'profile':
                const AVATARS = ['🍎', '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐸', '🚀', '🎸', '🎮', '📸'];
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Profilo Utente</Text>
                        
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarLargeContainer}>
                                <TouchableOpacity style={styles.avatarLargeBtn} onPress={() => setShowAvatarPicker(!showAvatarPicker)}>
                                    <Text style={{ fontSize: 40 }}>{settings.user.avatar.includes('http') ? '' : settings.user.avatar}</Text>
                                    {settings.user.avatar.includes('http') && <Image source={{ uri: settings.user.avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />}
                                    <View style={styles.cameraIconBadge}>
                                        <Camera size={14} color="#fff" />
                                    </View>
                                </TouchableOpacity>
                                
                                {showAvatarPicker && (
                                    <View style={styles.avatarPickerDropdown}>
                                        <BlurView intensity={90} tint="dark" style={styles.pickerBlur}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPickerList}>
                                                {AVATARS.map(av => (
                                                    <TouchableOpacity key={av} style={styles.avatarOption} onPress={() => {
                                                        updateSettings({ user: { ...settings.user, avatar: av } });
                                                        setShowAvatarPicker(false);
                                                    }}>
                                                        <Text style={{ fontSize: 24 }}>{av}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                                <TouchableOpacity 
                                                    style={[styles.avatarOption, { width: 100 }]} 
                                                    onPress={() => {
                                                        const url = prompt('Inserisci l\'URL dell\'immagine:');
                                                        if (url) {
                                                            updateSettings({ user: { ...settings.user, avatar: url } });
                                                            setShowAvatarPicker(false);
                                                        }
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 10 }}>Carica URL</Text>
                                                </TouchableOpacity>
                                            </ScrollView>
                                        </BlurView>
                                    </View>
                                )}
                            </View>
                            <View style={styles.profileHeaderInfo}>
                                <Text style={styles.userNameText}>{settings.user.fullName}</Text>
                                <Text style={styles.userSubText}>ID Apple: {settings.user.name.toLowerCase()}@icloud.com</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Nome Utente</Text>
                                <TextInput 
                                    style={styles.paneInput}
                                    value={settings.user.name}
                                    onChangeText={(val) => updateSettings({ user: { ...settings.user, name: val } })}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Nome Completo</Text>
                                <TextInput 
                                    style={styles.paneInput}
                                    value={settings.user.fullName}
                                    onChangeText={(val) => updateSettings({ user: { ...settings.user, fullName: val } })}
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Password</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <TextInput 
                                        style={[styles.paneInput, { width: 120 }]}
                                        placeholder="Nuova password"
                                        placeholderTextColor="#666"
                                        secureTextEntry
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                    />
                                    <TouchableOpacity 
                                        style={[styles.smallActionBtn, { backgroundColor: settings.accentColor }]}
                                        onPress={() => {
                                            if (newPassword) {
                                                updateSettings({ password: newPassword });
                                                setNewPassword('');
                                                alert('Password aggiornata con successo!');
                                            }
                                        }}
                                    >
                                        <Text style={styles.actionBtnText}>Salva</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Opzioni Extra</Text>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Login Automatico</Text>
                                <Switch 
                                    value={settings.loginAutomatically} 
                                    onValueChange={(val) => updateSettings({ loginAutomatically: val })} 
                                    trackColor={{ false: '#39393D', true: '#30D158' }} 
                                    thumbColor={'#fff'} 
                                />
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Consenti Handoff</Text>
                                <Switch 
                                    value={settings.handoffEnabled} 
                                    onValueChange={(val) => updateSettings({ handoffEnabled: val })} 
                                    trackColor={{ false: '#39393D', true: '#30D158' }} 
                                    thumbColor={'#fff'} 
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'reset':
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Trasferisci o Inizializza</Text>
                        
                        {resetStep === 0 ? (
                            <View>
                                <Text style={styles.sectionTitle}>Assistente di inizializzazione</Text>
                                <View style={styles.section}>
                                    <TouchableOpacity style={styles.resetRow} onPress={() => { setResetType('USER'); setResetStep(1); }}>
                                        <View>
                                            <Text style={styles.rowLabelMain}>Elimina Utente Corrente</Text>
                                            <Text style={styles.rowSubLabel}>Rimuove i dati di {settings.user.name}, mantiene le impostazioni di sistema.</Text>
                                        </View>
                                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                    <View style={styles.divider} />
                                    <TouchableOpacity style={styles.resetRow} onPress={() => { setResetType('FULL'); setResetStep(1); }}>
                                        <View>
                                            <Text style={styles.rowLabelMain}>Inizializza tutti i contenuti e le impostazioni</Text>
                                            <Text style={styles.rowSubLabel}>Cancella tutto e ripristina le impostazioni di fabbrica.</Text>
                                        </View>
                                        <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.verificationContainer}>
                                {resetStep === 1 && (
                                    <Animated.View entering={FadeIn} style={styles.verifyStep}>
                                        <Shield size={48} color={settings.accentColor} style={{ marginBottom: 20 }} />
                                        <Text style={styles.verifyTitle}>Verifica Identità</Text>
                                        <Text style={styles.verifySub}>Inserisci la tua password per proseguire con l'inizializzazione.</Text>
                                        <TextInput 
                                            style={styles.verifyInput}
                                            placeholder="Password"
                                            placeholderTextColor="#666"
                                            secureTextEntry
                                            value={confirmPass}
                                            onChangeText={setConfirmPass}
                                            autoFocus
                                        />
                                        <View style={styles.verifyBtnRow}>
                                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetStep(0)}>
                                                <Text style={styles.cancelBtnText}>Annulla</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.confirmBtn, { backgroundColor: settings.accentColor }]} 
                                                onPress={() => {
                                                    if (confirmPass === settings.password) {
                                                        setResetStep(2);
                                                        setConfirmPass('');
                                                    } else {
                                                        alert('Password errata.');
                                                    }
                                                }}
                                            >
                                                <Text style={styles.confirmBtnText}>Verifica</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )}
                                {resetStep === 2 && (
                                    <Animated.View entering={FadeIn} style={styles.verifyStep}>
                                        <RotateCcw size={48} color="#FF453A" style={{ marginBottom: 20 }} />
                                        <Text style={styles.verifyTitle}>Sei sicuro?</Text>
                                        <Text style={styles.verifySub}>Questa azione non può essere annullata. Tutti i dati verranno eliminati.</Text>
                                        <View style={styles.verifyBtnRow}>
                                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetStep(0)}>
                                                <Text style={styles.cancelBtnText}>Annulla</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.confirmBtn, { backgroundColor: '#FF453A' }]} 
                                                onPress={() => setResetStep(3)}
                                            >
                                                <Text style={styles.confirmBtnText}>Confermo</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )}
                                {resetStep === 3 && (
                                    <Animated.View entering={FadeIn} style={styles.verifyStep}>
                                        <Shield size={48} color="#FF453A" style={{ marginBottom: 20 }} />
                                        <Text style={styles.verifyTitle}>Ultima Conferma</Text>
                                        <Text style={styles.verifySub}>Fai clic su Inizializza per avviare il processo di cancellazione.</Text>
                                        <View style={styles.verifyBtnRow}>
                                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setResetStep(0)}>
                                                <Text style={styles.cancelBtnText}>Annulla</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.confirmBtn, { backgroundColor: '#FF453A' }]} 
                                                onPress={() => {
                                                    setGlobalResetType(resetType);
                                                    setIsResetting(true);
                                                    onClose();
                                                }}
                                            >
                                                <Text style={styles.confirmBtnText}>Inizializza Ora</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                )}
                            </View>
                        )}
                    </View>
                );

            case 'appearance':
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Aspetto</Text>
                        
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Tema di sistema</Text>
                            <View style={styles.themeSelector}>
                                {[
                                    { id: 'light', label: 'Chiaro', img: '#F0F0F0' },
                                    { id: 'dark', label: 'Scuro', img: '#1E1E1E' },
                                    { id: 'auto', label: 'Automatico', img: 'linear-gradient' }
                                ].map(t => (
                                    <TouchableOpacity 
                                        key={t.id} 
                                        style={styles.themeOption}
                                        onPress={() => updateSettings({ theme: t.id as any })}
                                    >
                                        <View style={[
                                            styles.themePreview, 
                                            settings.theme === t.id && { borderColor: settings.accentColor },
                                            { backgroundColor: t.id === 'auto' ? '#555' : t.img }
                                        ]}>
                                            {t.id === 'auto' && <View style={{ flex: 1, backgroundColor: '#eee', width: '50%' }} />}
                                            <View style={styles.themePreviewInner} />
                                        </View>
                                        <Text style={[styles.themeLabel, settings.theme === t.id && { color: settings.accentColor, fontWeight: '600' }]}>{t.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Colore in evidenza</Text>
                            <View style={styles.colorGrid}>
                                {[
                                    { name: 'Multicolore', hex: '#0066CC', multi: true },
                                    { name: 'Blu', hex: '#0A84FF' },
                                    { name: 'Viola', hex: '#BF5AF2' },
                                    { name: 'Rosa', hex: '#FF375F' },
                                    { name: 'Rosso', hex: '#FF453A' },
                                    { name: 'Arancione', hex: '#FF9F0A' },
                                    { name: 'Giallo', hex: '#FFD60A' },
                                    { name: 'Verde', hex: '#30D158' },
                                    { name: 'Grigio', hex: '#8E8E93' },
                                ].map(c => (
                                    <TouchableOpacity 
                                        key={c.hex}
                                        style={[
                                            styles.colorDot, 
                                            { backgroundColor: c.hex }, 
                                            settings.accentColor === c.hex && { borderColor: '#fff', borderWidth: 2 }
                                        ]}
                                        onPress={() => updateSettings({ accentColor: c.hex })}
                                    >
                                        {settings.accentColor === c.hex && (
                                            <View style={styles.colorDotInner} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 'dock':
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Desktop e Dock</Text>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Dock</Text>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Dimensioni</Text>
                                <View style={{ width: 150 }}>
                                    <SettingsSlider 
                                        min={0.5} 
                                        max={1.5} 
                                        value={settings.dockSize} 
                                        onChange={(val) => updateSettings({ dockSize: val })} 
                                        accentColor={settings.accentColor}
                                    />
                                </View>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Ingrandimento</Text>
                                <Switch 
                                    value={settings.dockMagnification} 
                                    onValueChange={(val) => updateSettings({ dockMagnification: val })}
                                    trackColor={{ false: '#39393D', true: '#30D158' }}
                                    thumbColor={'#fff'}
                                />
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Desktop</Text>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Mostra icone sulla scrivania</Text>
                                <Switch 
                                    value={true} 
                                    trackColor={{ false: '#39393D', true: '#30D158' }}
                                    thumbColor={'#fff'}
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'wifi':
            case 'bluetooth':
                const isWifi = activePane === 'wifi';
                const isEnabled = isWifi ? settings.wifiEnabled : settings.bluetoothEnabled;
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>{isWifi ? 'Wi-Fi' : 'Bluetooth'}</Text>
                        <View style={styles.section}>
                            <View style={[styles.row, { paddingVertical: 12 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.largeIconBg, { backgroundColor: isEnabled ? '#0A84FF' : '#8E8E93' }]}>
                                        {isWifi ? <Wifi size={24} color="#fff" /> : <Bluetooth size={24} color="#fff" />}
                                    </View>
                                    <View>
                                        <Text style={styles.rowLabel}>{isWifi ? 'Wi-Fi' : 'Bluetooth'}</Text>
                                    </View>
                                </View>
                                <Switch 
                                    value={isEnabled} 
                                    onValueChange={(val) => isWifi ? updateSettings({ wifiEnabled: val }) : updateSettings({ bluetoothEnabled: val })}
                                    trackColor={{ false: '#39393D', true: '#30D158' }}
                                    thumbColor={'#fff'}
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'wallpaper':
                  const WALLPAPERS = [
                      { id: 'sonoma', label: 'Sonoma', type: 'image', value: require('../../assets/wallpaper.png') },
                      { id: 'dark-blue', label: 'Abisso', type: 'color', value: '#1a2a6c' },
                      { id: 'sunset', label: 'Tramonto', type: 'color', value: '#b21f1f' },
                      { id: 'emerald', label: 'Smeraldo', type: 'color', value: '#004d40' },
                      { id: 'obsidian', label: 'Ossidiana', type: 'color', value: '#121212' },
                      { id: 'pro', label: 'Pro Space', type: 'image', value: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80' },
                      { id: 'nature', label: 'Montagne', type: 'image', value: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80' },
                  ];
                  return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Sfondo Desktop</Text>
                        <View style={styles.wallpaperGrid}>
                            {WALLPAPERS.map((wp) => (
                                <TouchableOpacity 
                                    key={wp.id} 
                                    style={[
                                        styles.wallpaperThumbnail, 
                                        settings.wallpaper === wp.value && { borderColor: settings.accentColor }
                                    ]}
                                    onPress={() => updateSettings({ wallpaper: wp.value })}
                                >
                                    {wp.type === 'color' ? (
                                        <View style={[styles.wallpaperPreviewMock, { backgroundColor: wp.value as string }]} />
                                    ) : (
                                        <Image source={typeof wp.value === 'number' ? wp.value : { uri: wp.value }} style={{ flex: 1 }} />
                                    )}
                                    <View style={styles.wpLabelContainer}>
                                        <Text style={styles.wpLabel}>{wp.label}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                  );
            case 'sound':
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Suono</Text>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Volume di uscita</Text>
                            <View style={styles.row}>
                                <Volume2 size={18} color="rgba(255,255,255,0.4)" />
                                <View style={{ flex: 1, marginHorizontal: 15 }}>
                                    <SettingsSlider 
                                        min={0} 
                                        max={1} 
                                        value={settings.volume} 
                                        onChange={(val) => updateSettings({ volume: val })} 
                                        accentColor={settings.accentColor}
                                    />
                                </View>
                                <Volume2 size={18} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Effetti sonori</Text>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Riproduci effetti sonori di feedback</Text>
                                <Switch 
                                    value={true} 
                                    trackColor={{ false: '#39393D', true: '#30D158' }} 
                                    thumbColor={'#fff'} 
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'network':
                return (
                    <View style={styles.paneContent}>
                        <Text style={styles.paneTitle}>Rete</Text>
                        <View style={styles.section}>
                             <View style={styles.row}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={[styles.largeIconBg, { backgroundColor: '#FF9F0A' }]}>
                                        <Shield size={22} color="#fff" />
                                    </View>
                                    <Text style={styles.rowLabel}>Firewall</Text>
                                </View>
                                <Text style={{ color: '#30D158', fontSize: 13 }}>Attivo</Text>
                             </View>
                        </View>
                    </View>
                );
        }
    };

    return (
        <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={[styles.window, animatedWinStyle]}
            pointerEvents={isMinimized ? 'none' : 'auto'}
        >
            <BlurView intensity={80} tint="dark" style={styles.container}>
                
                {/* ── Sidebar ── */}
                <View style={styles.sidebar}>
                    <GestureDetector gesture={dragGesture}>
                        <View style={styles.sidebarDragArea}>
                            <View style={styles.trafficLights}>
                                <TouchableOpacity style={[styles.dot, { backgroundColor: '#FF5F57' }]} onPress={onClose} />
                                <TouchableOpacity style={[styles.dot, { backgroundColor: '#FFBD2E' }]} onPress={onMinimize} />
                                <TouchableOpacity style={[styles.dot, { backgroundColor: '#28C840' }]} />
                            </View>
                        </View>
                    </GestureDetector>
                    
                    <View style={styles.searchBar}>
                        <Search size={14} color="#8E8E93" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search"
                            placeholderTextColor="#8E8E93"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    <ScrollView style={styles.sidebarScroll}>
                        {SIDEBAR_ITEMS.map(item => (
                            <TouchableOpacity 
                                key={item.id}
                                style={[styles.sidebarItem, activePane === item.id && { backgroundColor: settings.accentColor }]}
                                onPress={() => setActivePane(item.id)}
                            >
                                <View style={[styles.sidebarIconBg, { backgroundColor: item.color }]}>
                                    <item.icon size={12} color="#fff" />
                                </View>
                                <Text style={styles.sidebarItemText}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ── Main Content Pane ── */}
                <View style={styles.mainPane}>
                    <GestureDetector gesture={dragGesture}>
                        <View style={styles.mainDragArea} />
                    </GestureDetector>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {renderContent()}
                    </ScrollView>
                </View>

            </BlurView>
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
        zIndex: 2500, // Settings usually stay on top of regular windows
    },
    container: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
    },
    sidebar: {
        width: 220,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    sidebarDragArea: {
        height: 52,
        paddingHorizontal: 16,
        justifyContent: 'center',
        cursor: 'move' as any,
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        marginHorizontal: 12,
        paddingHorizontal: 8,
        height: 28,
        borderRadius: 6,
        gap: 6,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 13,
        outlineStyle: 'none' as any,
    },
    sidebarScroll: {
        paddingHorizontal: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 8,
        marginBottom: 2,
    },
    sidebarItemActive: {
        backgroundColor: '#0A84FF',
    },
    sidebarIconBg: {
        width: 22,
        height: 22,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sidebarItemText: {
        color: '#fff',
        fontSize: 13,
    },
    mainPane: {
        flex: 1,
        backgroundColor: 'rgba(30, 30, 35, 0.5)',
    },
    mainDragArea: {
        height: 52,
        width: '100%',
        cursor: 'move' as any,
    },
    scrollContent: {
        padding: 30,
        paddingTop: 0,
    },
    paneContent: {
        flex: 1,
    },
    paneTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#1E1E1E',
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    themeSelector: {
        flexDirection: 'row',
        gap: 20,
    },
    themeOption: {
        alignItems: 'center',
        gap: 8,
    },
    themePreview: {
        width: 60,
        height: 40,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    themePreviewInner: {
        flex: 1,
        backgroundColor: 'rgba(128,128,128,0.2)',
        borderRadius: 4,
        margin: 4,
    },
    themeOptionActive: {
        // Active visual state
    },
    themeLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
    },
    themePreviewActive: {
        borderColor: '#0A84FF',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    colorDotActive: {
        borderWidth: 2,
        borderColor: '#fff',
    },
    colorDotInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    rowLabel: {
        color: '#fff',
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    },
    sliderMock: {
        width: 150,
        height: 20,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 6,
        backgroundColor: '#39393D',
        borderRadius: 3,
        width: '100%',
        position: 'relative',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 3,
    },
    sliderThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        top: -6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    largeIconBg: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    wallpaperGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    wallpaperThumbnail: {
        width: 120,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    wallpaperActive: {
        borderColor: '#0A84FF',
    },
    wallpaperPreviewMock: {
        flex: 1,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wpLabelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        padding: 4,
    },
    wpLabel: {
        color: '#fff',
        fontSize: 10,
        textAlign: 'center',
    },
    // Profile Styles
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        gap: 20,
    },
    avatarLargeContainer: {
        width: 80,
        height: 80,
    },
    avatarLargeBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#666',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1E1E1E',
    },
    profileHeaderInfo: {
        justifyContent: 'center',
    },
    userNameText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    userSubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
    },
    paneInput: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        color: '#fff',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        width: 200,
        fontSize: 13,
        textAlign: 'right',
    },
    avatarPickerDropdown: {
        position: 'absolute',
        top: 90,
        left: 0,
        zIndex: 100,
        width: 300,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    pickerBlur: {
        padding: 10,
    },
    avatarPickerList: {
        gap: 10,
        paddingRight: 10,
    },
    avatarOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    smallActionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    resetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    rowLabelMain: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    rowSubLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: 2,
    },
    verificationContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
    },
    verifyStep: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    verifyTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    verifySub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
    },
    verifyInput: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        color: '#fff',
        width: '100%',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    verifyBtnRow: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    confirmBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    cancelBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cancelBtnText: {
        color: '#fff',
        fontSize: 14,
    }
});
