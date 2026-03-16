import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { Theme } from '../theme';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

interface WheelPickerProps {
    data: string[];
    value: string;
    onValueChange: (value: string) => void;
}

export const WheelPicker = ({ data, value, onValueChange }: WheelPickerProps) => {
    const scrollY = useSharedValue(0);
    const flatListRef = useRef<Animated.FlatList<any>>(null);
    const [localValue, setLocalValue] = useState(value);

    // Padding data to allow selecting first/last items when snapping to center
    const paddedData = [
        ...Array(Math.floor(VISIBLE_ITEMS / 2)).fill(''),
        ...data,
        ...Array(Math.floor(VISIBLE_ITEMS / 2)).fill('')
    ];

    useEffect(() => {
        const index = data.findIndex(item => item === value);
        if (index !== -1 && index !== data.findIndex(i => i === localValue)) {
            setLocalValue(value);
            // Scroll to initial value on mount
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: index * ITEM_HEIGHT,
                    animated: false
                });
                scrollY.value = index * ITEM_HEIGHT;
            }, 100);
        }
    }, [value, data]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / ITEM_HEIGHT);
        if (index >= 0 && index < data.length) {
            const newValue = data[index];
            if (newValue !== localValue) {
                setLocalValue(newValue);
                onValueChange(newValue);
            }
        }
    };

    const renderItem = ({ item, index }: { item: string, index: number }) => {
        if (!item) {
            return <View style={{ height: ITEM_HEIGHT }} />;
        }

        const realIndex = index - Math.floor(VISIBLE_ITEMS / 2);

        // Required inside worklet
        const rIndex = realIndex;

        const animatedStyle = useAnimatedStyle(() => {
            const currentPosition = scrollY.value / ITEM_HEIGHT;
            const distance = Math.abs(currentPosition - rIndex);
            
            const scale = interpolate(
                distance,
                [0, 1, 2],
                [1.1, 0.9, 0.8],
                Extrapolate.CLAMP
            );

            const opacity = interpolate(
                distance,
                [0, 1, 2],
                [1, 0.4, 0.2],
                Extrapolate.CLAMP
            );

            return {
                transform: [{ scale }],
                opacity,
            };
        });

        return (
            <View style={styles.itemContainer}>
                <Animated.Text style={[styles.itemText, animatedStyle]}>
                    {item}
                </Animated.Text>
            </View>
        );
    };

    return (
        <View style={styles.pickerContainer}>
            <View style={styles.selectionOverlay} pointerEvents="none" />
            <Animated.FlatList
                ref={flatListRef}
                data={paddedData}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
            />
        </View>
    );
};

interface TimeWheelPickerProps {
    value: string; // "HH:MM"
    onValueChange: (value: string) => void;
}

export const TimeWheelPicker = ({ value, onValueChange }: TimeWheelPickerProps) => {
    // Generate arrays
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const [currentHour, setCurrentHour] = useState(value ? value.split(':')[0] : '12');
    const [currentMinute, setCurrentMinute] = useState(value ? value.split(':')[1] : '00');

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            if (h !== currentHour) setCurrentHour(h);
            if (m !== currentMinute) setCurrentMinute(m);
        }
    }, [value]);

    const handleHourChange = (newHour: string) => {
        setCurrentHour(newHour);
        onValueChange(`${newHour}:${currentMinute}`);
    };

    const handleMinuteChange = (newMinute: string) => {
        setCurrentMinute(newMinute);
        onValueChange(`${currentHour}:${newMinute}`);
    };

    return (
        <View style={styles.timePickerRow}>
            <View style={styles.wheelWrapper}>
                <WheelPicker data={hours} value={currentHour} onValueChange={handleHourChange} />
            </View>
            <Text style={styles.colonText}>:</Text>
            <View style={styles.wheelWrapper}>
                <WheelPicker data={minutes} value={currentMinute} onValueChange={handleMinuteChange} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    pickerContainer: {
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
        overflow: 'hidden',
        alignItems: 'center',
    },
    wheelWrapper: {
        width: 60,
        height: ITEM_HEIGHT * VISIBLE_ITEMS,
    },
    itemContainer: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemText: {
        fontSize: 24,
        fontWeight: '600',
        color: Theme.colors.text,
    },
    selectionOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        height: ITEM_HEIGHT,
        width: '100%',
        backgroundColor: Theme.colors.primary + '15',
        borderRadius: Theme.borderRadius.sm,
    },
    colonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginHorizontal: 10,
        ...Theme.shadows.light,
    }
});
