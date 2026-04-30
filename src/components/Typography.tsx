import React from 'react';
import { Text, TextStyle, TextProps, StyleProp } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export const Header: React.FC<TextProps> = ({ children, style, ...props }) => {
    const { theme } = useTheme();
    return <Text style={[theme.typography.header, style]} {...props}>{children}</Text>;
};

export const SubHeader: React.FC<TextProps> = ({ children, style, ...props }) => {
    const { theme } = useTheme();
    return <Text style={[theme.typography.subheader, style]} {...props}>{children}</Text>;
};

export const Body: React.FC<TextProps> = ({ children, style, ...props }) => {
    const { theme } = useTheme();
    return <Text style={[theme.typography.body, style]} {...props}>{children}</Text>;
};

export const Caption: React.FC<TextProps> = ({ children, style, ...props }) => {
    const { theme } = useTheme();
    return <Text style={[theme.typography.caption, style]} {...props}>{children}</Text>;
};
