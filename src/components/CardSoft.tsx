import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../theme';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface CardSoftProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'white' | 'pastel';
}

const styles = StyleSheet.create({
    card: {
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.lg,
        marginVertical: Theme.spacing.sm,
    },
});

export const CardSoft = ({ children, style, variant = 'white' }: CardSoftProps) => {
    return (
        <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={[
                styles.card,
                { backgroundColor: variant === 'white' ? Theme.colors.card : Theme.colors.primary },
                Theme.shadows.light as any,
                style
            ]}
        >
            {children}
        </Animated.View>
    );
};
