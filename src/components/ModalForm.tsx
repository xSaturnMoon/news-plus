import React from 'react';
import {
    Modal,
    View,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.container}
                    >
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
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: Theme.spacing.lg,
    },
    container: {
        width: '100%',
    },
    content: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.lg,
        maxHeight: '90%',
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
