import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TimeWheelPickerProps {
    value: string; // "HH:MM"
    onValueChange: (value: string) => void;
}

export const TimeWheelPicker = ({ value, onValueChange }: TimeWheelPickerProps) => {
    const { theme } = useTheme();

    // Auto-format come HH:MM e validazione orario
    const handleChange = (text: string) => {
        let digits = text.replace(/[^0-9]/g, '');
        
        // Smart padding for hours
        if (digits.length >= 1) {
            if (parseInt(digits[0], 10) > 2) {
                digits = '0' + digits;
            }
        }
        // Limit hours to 23
        if (digits.length >= 2) {
            let hours = parseInt(digits.substring(0, 2), 10);
            if (hours > 23) digits = '23' + digits.substring(2);
        }
        // Smart padding for minutes
        if (digits.length >= 3) {
            if (parseInt(digits[2], 10) > 5) {
                digits = digits.substring(0, 2) + '0' + digits.substring(2);
            }
        }
        // Limit minutes to 59
        if (digits.length >= 4) {
            let minutes = parseInt(digits.substring(2, 4), 10);
            if (minutes > 59) digits = digits.substring(0, 2) + '59';
        }
        
        // Keep max 4 digits
        digits = digits.substring(0, 4);

        let formatted = digits;
        if (digits.length > 2) {
            formatted = digits.substring(0, 2) + ':' + digits.substring(2);
        }
        onValueChange(formatted);
    };

    return (
        <View style={styles.wrapper}>
            <TextInput
                style={[
                    styles.input, 
                    { 
                        color: theme.colors.text, 
                        borderColor: theme.colors.border,
                        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                    }
                ]}
                value={value}
                onChangeText={handleChange}
                keyboardType="numeric"
                placeholder="09:00"
                placeholderTextColor={theme.colors.textLight + '50'}
                maxLength={5}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
    },
    input: {
        width: '100%',
        height: 50,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        borderWidth: 1,
        borderRadius: 12,
    },
});
