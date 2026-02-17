import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../theme';

interface ButtonSoftProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'accent' | 'error';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export const ButtonSoft = ({
    onPress,
    title,
    variant = 'primary',
    style,
    textStyle,
    disabled
}: ButtonSoftProps) => {
    const getBackgroundColor = () => {
        if (disabled) return Theme.colors.border;
        switch (variant) {
            case 'primary': return Theme.colors.primary;
            case 'secondary': return Theme.colors.secondary;
            case 'accent': return Theme.colors.accent;
            case 'error': return Theme.colors.error;
            default: return Theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return Theme.colors.textLight;
        if (variant === 'error') return Theme.colors.errorText;
        return Theme.colors.text;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor() },
                Theme.shadows.light,
                style
            ]}
        >
            <Text style={[Theme.typography.button, { color: getTextColor() }, textStyle]}>
                {title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: Theme.spacing.md,
        paddingHorizontal: Theme.spacing.xl,
        borderRadius: Theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52, // Accessibility: touch target > 44px
    },
});
