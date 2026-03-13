import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    PanResponder,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { X, Minus, Maximize2 } from 'lucide-react-native';

const TOPBAR = 32;

interface WindowProps {
    onClose: () => void;
    onMinimize: () => void;
    isMinimized: boolean;
}

export const CalculatorWindow = ({ onClose, onMinimize, isMinimized }: WindowProps) => {
    const { width, height } = useWindowDimensions();
    const [isMaximized, setIsMaximized] = useState(false);
    
    // Calculator State
    const [displayValue, setDisplayValue] = useState('0');
    const [previousValue, setPreviousValue] = useState<string | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForNewValue, setWaitingForNewValue] = useState(false);

    // Default window dimensions for calculator
    const WIN_W = isMaximized ? width : 240;
    const WIN_H = isMaximized ? height - TOPBAR : 360;

    const posX = useSharedValue((width - WIN_W) / 2);
    const posY = useSharedValue(Math.max(TOPBAR, (height - WIN_H) / 2));

    const panRef = useRef({ offsetX: 0, offsetY: 0 });
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

    // Calculator Logic
    const handleNumber = (num: string) => {
        if (waitingForNewValue) {
            setDisplayValue(num);
            setWaitingForNewValue(false);
        } else {
            setDisplayValue(displayValue === '0' ? num : displayValue + num);
        }
    };

    const handleOperator = (op: string) => {
        if (operator && !waitingForNewValue) {
            calculateResult();
        } else {
            setPreviousValue(displayValue);
        }
        setOperator(op);
        setWaitingForNewValue(true);
    };

    const calculateResult = () => {
        if (!operator || previousValue === null) return;
        
        const prev = parseFloat(previousValue);
        const curr = parseFloat(displayValue);
        let result = 0;

        switch (operator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '×': result = prev * curr; break;
            case '÷': result = prev / curr; break;
        }

        // Handle floating point precision issues visually
        const resultString = String(Math.round(result * 10000000) / 10000000);
        setDisplayValue(resultString);
        setPreviousValue(resultString);
        setOperator(null);
        setWaitingForNewValue(true);
    };

    const handleClear = () => {
        setDisplayValue('0');
        setPreviousValue(null);
        setOperator(null);
        setWaitingForNewValue(false);
    };

    const handlePercentage = () => {
        const value = parseFloat(displayValue) / 100;
        setDisplayValue(String(value));
    };

    const handleToggleSign = () => {
        const value = parseFloat(displayValue) * -1;
        setDisplayValue(String(value));
    };

    const handleDecimal = () => {
        if (waitingForNewValue) {
            setDisplayValue('0.');
            setWaitingForNewValue(false);
        } else if (displayValue.indexOf('.') === -1) {
            setDisplayValue(displayValue + '.');
        }
    };

    const renderButton = (label: string, type: 'number' | 'operator' | 'action' | 'zero', onPress: () => void) => {
        let btnStyle = styles.btnNumber;
        let textStyle = styles.btnTextNumber;

        if (type === 'operator') {
            btnStyle = styles.btnOperator;
            textStyle = styles.btnTextOperator;
        } else if (type === 'action') {
            btnStyle = styles.btnAction;
            textStyle = styles.btnTextAction;
        } else if (type === 'zero') {
            btnStyle = [styles.btnNumber, styles.btnZero] as any;
        }

        const isActiveOperator = operator === label && waitingForNewValue;

        return (
            <TouchableOpacity 
                style={[
                    styles.btnBase, 
                    btnStyle, 
                    isActiveOperator && { backgroundColor: '#fff' }
                ]} 
                onPress={onPress}
                activeOpacity={0.7}
            >
                <Text style={[textStyle, isActiveOperator && { color: '#FF9500' }]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <Animated.View style={[styles.window, windowStyle]}>
            <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
                {/* macOS Toolbar (Draggable area) */}
                <View style={styles.toolbar} {...panResponder.panHandlers}>
                    <View style={styles.trafficLights} onStartShouldSetResponder={() => true} onResponderTerminationRequest={() => false}>
                        <TouchableOpacity style={[styles.dot, { backgroundColor: '#FF5F57' }]} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }} />
                        <TouchableOpacity style={[styles.dot, { backgroundColor: '#FFBD2E' }]} onPress={onMinimize} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} />
                        <TouchableOpacity style={[styles.dot, { backgroundColor: '#28CA41' }]} onPress={() => setIsMaximized(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }} />
                    </View>
                </View>

                {/* Calculator Display */}
                <View style={styles.displayContainer}>
                    <Text 
                        style={[styles.displayText, displayValue.length > 8 && { fontSize: 32 }, displayValue.length > 11 && { fontSize: 24 }]} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                    >
                        {displayValue}
                    </Text>
                </View>

                {/* Calculator Keypad */}
                <View style={styles.keypad}>
                    <View style={styles.row}>
                        {renderButton(displayValue !== '0' || previousValue ? 'C' : 'AC', 'action', handleClear)}
                        {renderButton('+/-', 'action', handleToggleSign)}
                        {renderButton('%', 'action', handlePercentage)}
                        {renderButton('÷', 'operator', () => handleOperator('÷'))}
                    </View>
                    <View style={styles.row}>
                        {renderButton('7', 'number', () => handleNumber('7'))}
                        {renderButton('8', 'number', () => handleNumber('8'))}
                        {renderButton('9', 'number', () => handleNumber('9'))}
                        {renderButton('×', 'operator', () => handleOperator('×'))}
                    </View>
                    <View style={styles.row}>
                        {renderButton('4', 'number', () => handleNumber('4'))}
                        {renderButton('5', 'number', () => handleNumber('5'))}
                        {renderButton('6', 'number', () => handleNumber('6'))}
                        {renderButton('-', 'operator', () => handleOperator('-'))}
                    </View>
                    <View style={styles.row}>
                        {renderButton('1', 'number', () => handleNumber('1'))}
                        {renderButton('2', 'number', () => handleNumber('2'))}
                        {renderButton('3', 'number', () => handleNumber('3'))}
                        {renderButton('+', 'operator', () => handleOperator('+'))}
                    </View>
                    <View style={styles.row}>
                        {renderButton('0', 'zero', () => handleNumber('0'))}
                        {renderButton(',', 'number', handleDecimal)}
                        {renderButton('=', 'operator', calculateResult)}
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
        borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(30,30,30,0.6)',
        ...Platform.select({
            web: { boxShadow: '0px 20px 60px rgba(0,0,0,0.5)' },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                elevation: 15,
            }
        })
    },
    blurContainer: {
        flex: 1,
    },
    toolbar: {
        height: 38,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    trafficLights: {
        flexDirection: 'row',
        gap: 8,
        zIndex: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    displayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    displayText: {
        color: '#fff',
        fontSize: 48,
        fontWeight: '300',
    },
    keypad: {
        paddingHorizontal: 10,
        paddingBottom: 16,
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    btnBase: {
        height: 48,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
    },
    btnZero: {
        flex: 2.1, // Approx twice the width + gap
        alignItems: 'flex-start',
        paddingLeft: 20,
    },
    btnNumber: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    btnTextNumber: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '500',
    },
    btnOperator: {
        backgroundColor: '#FF9500',
    },
    btnTextOperator: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '500',
    },
    btnAction: {
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    btnTextAction: {
        color: '#000',
        fontSize: 20,
        fontWeight: '500',
    },
});
