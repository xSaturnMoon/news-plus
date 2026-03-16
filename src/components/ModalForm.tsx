import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { Theme } from '../theme';
import { SubHeader } from './Typography';
import { X } from 'lucide-react-native';

interface ModalFormProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const ModalForm = ({ visible, onClose, title, children }: ModalFormProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Full-screen overlay: tap backdrop to close */}
            <View style={styles.overlay} pointerEvents="box-none">
                <Pressable style={styles.backdrop} onPress={onClose} />
                {/* Card: plain View so scroll gestures pass through freely */}
                <View style={[styles.content, Theme.shadows.medium]}>
                    <View style={styles.header}>
                        <SubHeader>{title}</SubHeader>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                            <X {...({ color: Theme.colors.text, size: 24 } as any)} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.body}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        width: '100%',
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        paddingBottom: Theme.spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Theme.spacing.lg,
    },
    body: {
        width: '100%',
    },
});
