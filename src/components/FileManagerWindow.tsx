import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
    Platform,
    useWindowDimensions,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { 
    ChevronLeft, ChevronRight, Search, Menu, 
    HardDrive, Monitor, Download, FileText, Image as ImageIcon,
    LayoutGrid, List, Columns, Maximize2, X, Minus, Folder, Trash2
} from 'lucide-react-native';

const TOPBAR = 32;

// --- Mock File System Data ---
const FILE_SYSTEM: Record<string, any[]> = {
    'Recenti': [],
    'Applicazioni': [
        { id: 'a1', name: 'Browser', type: 'app', date: '10 Feb 2026', size: '240 MB' },
        { id: 'a2', name: 'Discord', type: 'app', date: '12 Feb 2026', size: '180 MB' },
        { id: 'a3', name: 'Spotify', type: 'app', date: '12 Feb 2026', size: '150 MB' },
        { id: 'a4', name: 'Impostazioni', type: 'app', date: 'System', size: '--' },
    ],
    'Scrivania': [],
    'Documenti': [],
    'Download': [],
    'Cestino': []
};

const SIDEBAR_ITEMS = [
    { title: 'Preferiti', items: [
        { id: 'Recenti', label: 'Recenti', icon: Monitor },
        { id: 'Applicazioni', label: 'Applicazioni', icon: LayoutGrid },
        { id: 'Scrivania', label: 'Scrivania', icon: Monitor },
        { id: 'Documenti', label: 'Documenti', icon: FileText },
        { id: 'Download', label: 'Download', icon: Download },
        { id: 'Cestino', label: 'Cestino', icon: Trash2 },
    ]}
];

interface FileManagerWindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
}

export const FileManagerWindow = ({ 
    onClose, 
    onMinimize, 
    isMinimized, 
    activeTab: externalTab, 
    onTabChange 
}: FileManagerWindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    
    // Internal state fallback if no props provided
    const [internalTab, setInternalTab] = useState('Documenti');
    const activeTab = externalTab !== undefined ? externalTab : internalTab;
    const setActiveTab = onTabChange ? onTabChange : setInternalTab;

    const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');

    const WIN_W = isMaximized ? width : Math.min(900, width * 0.85);
    const WIN_H = isMaximized ? height - TOPBAR : Math.min(600, height * 0.8);

    const posX = useSharedValue((width - WIN_W) / 2);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2 - 20));

    const panRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
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

    const currentFiles = FILE_SYSTEM[activeTab] || [];

    const getFileIcon = (type: string) => {
        switch(type) {
            case 'folder': return <Folder size={48} color="#007AFF" fill="#8cbcf5" />;
            case 'image': return <ImageIcon size={48} color="#FF9500" />;
            case 'app': return <LayoutGrid size={48} color="#DB4437" />;
            default: return <FileText size={48} color="#8E8E93" />;
        }
    };
    const getListIcon = (type: string) => {
        switch(type) {
            case 'folder': return <Folder size={20} color="#007AFF" fill="#8cbcf5" />;
            case 'image': return <ImageIcon size={20} color="#FF9500" />;
            case 'app': return <LayoutGrid size={20} color="#DB4437" />;
            default: return <FileText size={20} color="#8E8E93" />;
        }
    };

    return (
        <Animated.View style={[styles.window, windowStyle]}>
            <BlurView intensity={40} tint="dark" style={styles.blurContainer}>
                
                {/* macOS Toolbar */}
                <View style={styles.toolbar}>
                    {/* Traffic Lights / Drag Handle */}
                    <View style={styles.toolbarLeft} {...panResponder.panHandlers}>
                        <View style={styles.trafficLights} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                            <TouchableOpacity style={[styles.dot, { backgroundColor: '#FF5F57' }]} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }} />
                            <TouchableOpacity style={[styles.dot, { backgroundColor: '#FFBD2E' }]} onPress={onMinimize} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} />
                            <TouchableOpacity style={[styles.dot, { backgroundColor: '#28CA41' }]} onPress={() => setIsMaximized(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }} />
                        </View>
                        
                        {/* Navigation Arrows */}
                        <View style={styles.navArrows}>
                            <TouchableOpacity style={styles.navBtn}>
                                <ChevronLeft size={16} color="#bbb" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.navBtn}>
                                <ChevronRight size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.toolbarTitle}>{activeTab}</Text>
                    </View>

                    {/* View Controls & Search */}
                    <View style={styles.toolbarRight}>
                        <View style={styles.viewControls}>
                            <TouchableOpacity 
                                style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
                                onPress={() => setViewMode('grid')}
                            >
                                <LayoutGrid size={14} color={viewMode === 'grid' ? "#fff" : "#888"} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
                                onPress={() => setViewMode('list')}
                            >
                                <List size={14} color={viewMode === 'list' ? "#fff" : "#888"} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.viewBtn}>
                                <Columns size={14} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchBox}>
                            <Search size={14} color="#8E8E93" />
                            <Text style={styles.searchText}>Cerca</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.mainArea}>
                    {/* Sidebar */}
                    <View style={styles.sidebar}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 10 }}>
                            {SIDEBAR_ITEMS.map((section, idx) => (
                                <View key={idx} style={styles.sidebarSection}>
                                    <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
                                    {section.items.map(item => (
                                        <TouchableOpacity 
                                            key={item.id} 
                                            style={[styles.sidebarItem, activeTab === item.id && styles.sidebarItemActive]}
                                            onPress={() => setActiveTab(item.id)}
                                        >
                                            <item.icon size={16} color={activeTab === item.id ? "#fff" : "#007AFF"} />
                                            <Text style={[styles.sidebarItemText, activeTab === item.id && { color: '#fff', fontWeight: '500' }]}>
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Content Area */}
                    <View style={styles.contentArea}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                            {viewMode === 'grid' ? (
                                <View style={styles.gridContainer}>
                                    {currentFiles.map((file, i) => (
                                        <Animated.View key={file.id} entering={FadeIn.delay(i * 30)}>
                                            <TouchableOpacity style={styles.gridItem}>
                                                {getFileIcon(file.type)}
                                                <Text style={styles.gridItemText} numberOfLines={2}>{file.name}</Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))}
                                </View>
                            ) : (
                                <View style={styles.listContainer}>
                                    <View style={styles.listHeader}>
                                        <Text style={[styles.listCol, { flex: 2 }]}>Nome</Text>
                                        <Text style={[styles.listCol, { flex: 1 }]}>Data modifica</Text>
                                        <Text style={[styles.listCol, { width: 80 }]}>Dimensione</Text>
                                    </View>
                                    {currentFiles.map((file, i) => (
                                        <Animated.View key={file.id} entering={FadeIn.delay(i * 20)}>
                                            <TouchableOpacity style={styles.listItem}>
                                                <View style={[styles.listColWrapper, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
                                                    {getListIcon(file.type)}
                                                    <Text style={styles.listTextName} numberOfLines={1}>{file.name}</Text>
                                                </View>
                                                <Text style={[styles.listTextSub, { flex: 1 }]}>{file.date}</Text>
                                                <Text style={[styles.listTextSub, { width: 80 }]}>{file.size}</Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))}
                                </View>
                            )}
                            
                            {currentFiles.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>Nessun elemento</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
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
        backgroundColor: '#1E1E1E',
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
    blurContainer: {
        flex: 1,
        backgroundColor: 'rgba(30, 30, 30, 0.4)',
    },
    toolbar: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    toolbarLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        height: '100%',
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
        marginRight: 20,
        zIndex: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    navArrows: {
        flexDirection: 'row',
        gap: 4,
        marginRight: 16,
    },
    navBtn: {
        padding: 4,
    },
    toolbarTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    toolbarRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    viewControls: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        padding: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    viewBtn: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    viewBtnActive: {
        backgroundColor: '#444',
        ...Platform.select({
            web: { boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }
        })
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        paddingHorizontal: 8,
        height: 26,
        width: 150,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    searchText: {
        fontSize: 12,
        color: '#8E8E93',
        marginLeft: 6,
    },
    mainArea: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: 180,
        borderRightWidth: 1,
        borderRightColor: 'rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    sidebarSection: {
        marginBottom: 16,
    },
    sidebarSectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#888',
        marginBottom: 6,
        paddingHorizontal: 10,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginBottom: 2,
    },
    sidebarItemActive: {
        backgroundColor: '#007AFF',
    },
    sidebarItemText: {
        fontSize: 13,
        color: '#ccc',
        marginLeft: 8,
    },
    contentArea: {
        flex: 1,
        backgroundColor: '#1E1E1E',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 20,
    },
    gridItem: {
        width: 80,
        alignItems: 'center',
    },
    gridItemText: {
        marginTop: 6,
        fontSize: 12,
        color: '#fff',
        textAlign: 'center',
    },
    listContainer: {
        width: '100%',
    },
    listHeader: {
        flexDirection: 'row',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        marginBottom: 8,
    },
    listCol: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    listColWrapper: {
        gap: 10,
    },
    listTextName: {
        fontSize: 13,
        color: '#fff',
    },
    listTextSub: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#aaa',
    }
});
