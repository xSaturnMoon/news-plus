import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface ButtonSoftProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'error' | 'outline';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    icon?: React.ReactNode;
}

export const ButtonSoft = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    icon
}: ButtonSoftProps) => {
    const { theme } = useTheme();

    const getBgColor = () => {
        switch (variant) {
            case 'primary': return theme.colors.primary;
            case 'secondary': return theme.colors.secondary;
            case 'error': return theme.colors.error;
            case 'outline': return 'transparent';
            default: return theme.colors.primary;
        }
    };

    const getTextColor = () => {
        if (variant === 'outline') return theme.colors.primary;
        if (variant === 'primary' || variant === 'error') return '#FFFFFF';
        return theme.colors.text;
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                { 
                    backgroundColor: getBgColor(),
                    borderRadius: theme.borderRadius.md,
                },
                variant === 'outline' && { 
                    borderWidth: 1.5, 
                    borderColor: theme.colors.primary 
                },
                style
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={styles.content}>
                {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
                <Text style={[
                    theme.typography.button,
                    { color: getTextColor(), fontWeight: '800' },
                    textStyle
                ]}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
