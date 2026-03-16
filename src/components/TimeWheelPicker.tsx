import React, { useRef, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelColumnProps {
    data: string[];
    selectedIndex: number;
    onScrollEnd: (index: number) => void;
}

const WheelColumn = ({ data, selectedIndex, onScrollEnd }: WheelColumnProps) => {
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
        }, 50);
    }, []);

    return (
        <View style={styles.columnContainer}>
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                contentContainerStyle={styles.columnContent}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                    onScrollEnd(Math.max(0, Math.min(index, data.length - 1)));
                }}
                scrollEventThrottle={16}
            >
                {/* padding items */}
                <View style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
                {data.map((item, i) => (
                    <View key={i} style={styles.item}>
                        <Text style={styles.itemText}>{item}</Text>
                    </View>
                ))}
                <View style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
            </ScrollView>
            {/* Selection highlight overlay */}
            <View pointerEvents="none" style={styles.selectionHighlight} />
            {/* Fade top and bottom */}
            <View pointerEvents="none" style={styles.fadeTop} />
            <View pointerEvents="none" style={styles.fadeBottom} />
        </View>
    );
};

interface TimeWheelPickerProps {
    value: string; // "HH:MM"
    onValueChange: (value: string) => void;
}

export const TimeWheelPicker = ({ value, onValueChange }: TimeWheelPickerProps) => {
    const [h, m] = (value || '09:00').split(':');
    const currentHour = useRef(h || '09');
    const currentMinute = useRef(m || '00');

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const hourIndex = hours.indexOf(currentHour.current);
    const minuteIndex = minutes.indexOf(currentMinute.current);

    const handleHourChange = (index: number) => {
        currentHour.current = hours[index];
        onValueChange(`${currentHour.current}:${currentMinute.current}`);
    };

    const handleMinuteChange = (index: number) => {
        currentMinute.current = minutes[index];
        onValueChange(`${currentHour.current}:${currentMinute.current}`);
    };

    return (
        <View style={styles.wrapper}>
            <WheelColumn
                data={hours}
                selectedIndex={hourIndex === -1 ? 9 : hourIndex}
                onScrollEnd={handleHourChange}
            />
            <Text style={styles.colon}>:</Text>
            <WheelColumn
                data={minutes}
                selectedIndex={minuteIndex === -1 ? 0 : minuteIndex}
                onScrollEnd={handleMinuteChange}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: PICKER_HEIGHT,
    },
    columnContainer: {
        width: 64,
        height: PICKER_HEIGHT,
        overflow: 'hidden',
    },
    columnContent: {},
    item: {
        height: ITEM_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontSize: 26,
        fontWeight: '500',
        color: Theme.colors.text,
    },
    selectionHighlight: {
        position: 'absolute',
        top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
        height: ITEM_HEIGHT,
        left: 4,
        right: 4,
        backgroundColor: Theme.colors.primary + '40',
        borderRadius: 12,
    },
    fadeTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT * 2,
        backgroundColor: 'transparent',
        // Semi-white gradient to fade items above selection
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    fadeBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT * 2,
        backgroundColor: 'transparent',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    colon: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.colors.text,
        marginHorizontal: 8,
        marginTop: -4,
    },
});
