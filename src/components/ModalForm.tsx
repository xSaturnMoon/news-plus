import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { SubHeader } from './Typography';
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';

interface ModalFormProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const ModalForm = ({ visible, onClose, title, children }: ModalFormProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const blurTint = isDark ? 'systemChromeMaterialDark' : 'light';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.overlay}>
                    {/* Snappy backdrop animation */}
                    <Animated.View 
                        entering={FadeIn.duration(200)}
                        style={StyleSheet.absoluteFill}
                    >
                        <BlurView intensity={30} tint={blurTint} style={StyleSheet.absoluteFill} />
                        <Pressable style={styles.backdrop} onPress={onClose} />
                    </Animated.View>

                    {/* Snappy, non-bouncy content animation */}
                    <Animated.View 
                        entering={SlideInUp.duration(250).withCallback(() => {})}
                        style={[
                            styles.contentContainer, 
                            theme.shadows.medium,
                            { borderColor: theme.colors.border }
                        ]}
                    >
                        <View style={{ width: '100%' }}>
                            <View style={[styles.glassCard, { backgroundColor: isDark ? 'rgba(20, 20, 24, 0.85)' : 'rgba(255, 255, 255, 0.95)' }]}>
                                <BlurView intensity={40} tint={blurTint} style={StyleSheet.absoluteFill} />
                                <View style={styles.header}>
                                    <SubHeader style={styles.titleText}>{title}</SubHeader>
                                    <TouchableOpacity 
                                        onPress={onClose} 
                                        style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                    >
                                        <X color={theme.colors.text} size={20} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.body}>
                                    {children}
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-start', // iOS style: top sheets
        paddingHorizontal: 0,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    contentContainer: {
        width: '100%',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderTopWidth: 0,
    },
    glassCard: {
        padding: 24,
        paddingTop: 60, // More space for top sheets
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 20,
        fontWeight: '800',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    body: {
        width: '100%',
    },
});
