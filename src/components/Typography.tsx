import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { Theme } from '../theme';

interface TypographyProps extends TextProps {
    children: React.ReactNode;
    style?: TextStyle;
}

export const Header = ({ children, style, ...props }: TypographyProps) => (
    <Text style={[Theme.typography.header, style]} {...props}>{children}</Text>
);

export const SubHeader = ({ children, style, ...props }: TypographyProps) => (
    <Text style={[Theme.typography.subheader, style]} {...props}>{children}</Text>
);

export const Body = ({ children, style, ...props }: TypographyProps) => (
    <Text style={[Theme.typography.body, style]} {...props}>{children}</Text>
);

export const Caption = ({ children, style, ...props }: TypographyProps) => (
    <Text style={[Theme.typography.caption, style]} {...props}>{children}</Text>
);
