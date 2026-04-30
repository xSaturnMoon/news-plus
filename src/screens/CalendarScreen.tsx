import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, TextStyle, StyleProp, Text, Platform } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import { ModalForm } from '../components/ModalForm';
import { TimeWheelPicker } from '../components/TimeWheelPicker';
import { Plus, Bell, Trash2, Calendar, Clock } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import * as db from '../services/database';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const CalendarScreen = () => {
    const { theme, mode } = useTheme();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<db.CalendarEvent[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [remindersModalVisible, setRemindersModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<db.CalendarEvent | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [hasEndTime, setHasEndTime] = useState(true);
    // Reanimated for the FINE box toggle
    const endTimeOpacity = useSharedValue(1);
    const endTimeScale = useSharedValue(1);
    const animatedEndStyle = useAnimatedStyle(() => ({
        opacity: endTimeOpacity.value,
        transform: [{ scale: endTimeScale.value }],
    }));
    // Notif state
    const [notifDate, setNotifDate] = useState('');
    const [notifTime, setNotifTime] = useState('');

    useEffect(() => {
        loadEvents();
    }, [currentMonth]);

    const loadEvents = async () => {
        const allEvents = await db.getAllEvents();
        setEvents(allEvents);
    };

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const handleAddPress = (date: Date) => {
        setSelectedDate(date);
        setTitle('');
        setStartTime('');
        setEndTime('');
        setHasEndTime(true);
        endTimeOpacity.value = 1;
        endTimeScale.value = 1;
        setModalVisible(true);
    };

    const handleSaveEvent = async () => {
        if (!title || !startTime || !selectedDate) {
            Alert.alert('Errore', 'Inserisci titolo e orario di inizio');
            return;
        }

        await db.addEvent({
            title,
            startTime,
            endTime: hasEndTime ? endTime : '',
            date: format(selectedDate, 'yyyy-MM-dd'),
            notifications: JSON.stringify([]),
            enabled: 1,
        });

        setModalVisible(false);
        loadEvents();
    };

    const handleEventPress = (event: db.CalendarEvent) => {
        setSelectedEvent(event);
        setNotifDate(event.date);
        setNotifTime(event.startTime);
        setDetailModalVisible(true);
    };

    const handleScheduleNotif = async () => {
        if (!selectedEvent || !notifDate || !notifTime) return;
        try {
            const notifications = require('../services/notifications');
            const [year, month, day] = notifDate.split('-').map(Number);
            const [hour, minute] = notifTime.split(':').map(Number);
            const scheduledDate = new Date(year, month - 1, day, hour, minute);

            if (scheduledDate.getTime() <= Date.now()) {
                Alert.alert('Errore', 'La data deve essere nel futuro');
                return;
            }

            const notifId = await notifications.scheduleNotification(
                `Promemoria: ${selectedEvent.title}`,
                `Evento previsto per le ${selectedEvent.startTime}`,
                scheduledDate
            );

            if (notifId) {
                let currentNotifs = [];
                try { currentNotifs = JSON.parse(selectedEvent.notifications || '[]'); } catch(e) {}
                const updatedNotifs = [...currentNotifs, { id: notifId, notifDate, notifTime }];
                const updated = { ...selectedEvent, notifications: JSON.stringify(updatedNotifs), enabled: 1 };
                await db.updateEvent(updated);
                setSelectedEvent(updated);
                loadEvents();
                Alert.alert('Successo', 'Notifica programmata! 🔔');
            }
        } catch (error) { Alert.alert('Errore', 'Impossibile programmare la notifica'); }
    };

    const handleDeleteNotif = async (notifId: string) => {
        if (!selectedEvent) return;
        try {
            const notifications = require('../services/notifications');
            await notifications.cancelNotification(notifId);
            
            let currentNotifs = [];
            try { currentNotifs = JSON.parse(selectedEvent.notifications || '[]'); } catch(e) {}
            
            const updatedNotifs = currentNotifs.filter((n: any) => n.id !== notifId);
            const updated = { ...selectedEvent, notifications: JSON.stringify(updatedNotifs) };
            
            await db.updateEvent(updated);
            setSelectedEvent(updated);
            loadEvents();
        } catch (error) {
            console.error(error);
        }
    };

    const deleteEventWithNotifications = async (event: db.CalendarEvent) => {
        try {
            const notifications = require('../services/notifications');
            let notifs = [];
            try { notifs = JSON.parse(event.notifications || '[]'); } catch(e) {}
            
            for (const n of notifs) {
                if (n.id) {
                    await notifications.cancelNotification(n.id);
                }
            }
        } catch (error) {
            console.error('Error cancelling notifications:', error);
        }
        await db.deleteEvent(event.id!);
        loadEvents();
    };

    const handleDeleteEvent = async () => {
        if (selectedEvent) {
            await deleteEventWithNotifications(selectedEvent);
            setDetailModalVisible(false);
        }
    };

    const renderDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.date === dateStr);
        const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

        return (
            <CardSoft
                key={dateStr}
                style={[
                    styles.dayCard,
                    isToday && { 
                        backgroundColor: theme.colors.primary + '20',
                        borderColor: theme.colors.primary,
                        borderWidth: 1.5,
                    }
                ]}
            >
                <View style={styles.dayHeader}>
                    <SubHeader style={[styles.dayNumber, isToday && { color: theme.colors.primary }]}>
                        {format(day, 'd')}
                    </SubHeader>
                    <Caption style={[styles.dayName, isToday && { color: theme.colors.primary }]}>
                        {format(day, 'EEEE', { locale: it })}
                    </Caption>
                </View>

                <View style={styles.eventContainer}>
                    {dayEvents.map((event, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => handleEventPress(event)}
                            style={[styles.eventBadge, { backgroundColor: theme.colors.primary + '15' }]}
                        >
                            <Caption numberOfLines={1} style={[styles.eventText, { color: theme.colors.text }]}>
                                {event.startTime} {event.title}
                            </Caption>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.colors.primary + '10' }]}
                    onPress={() => handleAddPress(day)}
                >
                    <Plus size={18} color={isToday ? theme.colors.primary : theme.colors.textLight} />
                </TouchableOpacity>
            </CardSoft>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.screenHeader}>
                <Header style={styles.screenTitle}>Calendario</Header>
                <TouchableOpacity 
                    onPress={() => setRemindersModalVisible(true)} 
                    style={[styles.remindersBtn, { borderColor: theme.colors.border }]}
                >
                    <Bell size={24} color={theme.colors.textLight} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.monthHeader}>
                <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={[styles.navBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Body style={[styles.navBtnText, { color: theme.colors.textLight }]}>‹</Body>
                </TouchableOpacity>
                
                <Header style={styles.monthTitle}>
                    {format(currentMonth, 'MMMM yyyy', { locale: it }).toUpperCase()}
                </Header>
                
                <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={[styles.navBtn, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Body style={[styles.navBtnText, { color: theme.colors.textLight }]}>›</Body>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.grid}>
                    {daysInMonth.map(renderDay)}
                </View>
                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Add Modal */}
            <ModalForm
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Nuovo Evento"
            >
                <View style={[styles.modernInputContainer, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    <TextInput
                        style={[styles.modernTextInput, { color: theme.colors.text }]}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Titolo dell'evento..."
                        placeholderTextColor={theme.colors.textLight + '80'}
                    />
                </View>

                <View style={styles.timePickerRow}>
                    <View style={[styles.timePickerCard, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Caption style={styles.timeLabel}>INIZIO</Caption>
                        <TimeWheelPicker value={startTime} onValueChange={setStartTime} />
                    </View>
                    <Animated.View style={[styles.timePickerCard, { backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }, animatedEndStyle]}>
                        <TouchableOpacity onPress={() => {
                            const next = !hasEndTime;
                            setHasEndTime(next);
                            endTimeOpacity.value = withTiming(next ? 1 : 0.38, { duration: 180 });
                            endTimeScale.value = withTiming(next ? 1 : 0.95, { duration: 180 });
                        }}>
                            <Caption style={[
                                styles.timeLabel,
                                !hasEndTime && { textDecorationLine: 'line-through', color: theme.colors.textLight + '60' }
                            ]}>FINE</Caption>
                        </TouchableOpacity>
                        <TimeWheelPicker value={endTime} onValueChange={setEndTime} />
                    </Animated.View>
                </View>

                <ButtonSoft title="Salva Evento" onPress={handleSaveEvent} style={styles.saveBtn} />
            </ModalForm>

            {/* Reminders Modal */}
            <ModalForm
                visible={remindersModalVisible}
                onClose={() => setRemindersModalVisible(false)}
                title="Tutti i Promemoria"
            >
                <ScrollView style={{ maxHeight: 400 }}>
                    {(() => {
                        const allReminders = events.flatMap(event => {
                            try {
                                const notifs = JSON.parse(event.notifications || '[]');
                                return notifs.map((n: any) => ({ ...n, event }));
                            } catch (e) { return []; }
                        }).sort((a, b) => `${a.notifDate} ${a.notifTime}`.localeCompare(`${b.notifDate} ${b.notifTime}`));

                        if (allReminders.length === 0) {
                            return (
                                <Body style={{ textAlign: 'center', opacity: 0.5, marginVertical: 40 }}>
                                    Nessun promemoria attivo
                                </Body>
                            );
                        }

                        return allReminders.map((reminder, idx) => (
                            <View key={reminder.id || idx} style={[styles.reminderItem, { borderBottomColor: theme.colors.border }]}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <Bell size={14} color={theme.colors.primary} />
                                        <SubHeader style={{ fontSize: 16 }}>{reminder.event.title}</SubHeader>
                                    </View>
                                    <Caption>Notifica alle {reminder.notifTime} del {format(parseISO(reminder.notifDate), 'd MMM', { locale: it })}</Caption>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteNotif(reminder.id)}>
                                    <Trash2 size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                            </View>
                        ));
                    })()}
                </ScrollView>
                <ButtonSoft 
                    title="Chiudi" 
                    onPress={() => setRemindersModalVisible(false)} 
                    variant="outline" 
                    style={{ marginTop: 20 }} 
                />
            </ModalForm>

            {/* Detail Modal */}
            <ModalForm
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                title="Dettagli Evento"
            >
                {selectedEvent && (
                    <View>
                        <Header>{selectedEvent.title}</Header>
                        <SubHeader style={{ marginTop: 10, opacity: 0.8 }}>Data: {format(parseISO(selectedEvent.date), 'd MMMM yyyy', { locale: it })}</SubHeader>
                        <SubHeader style={{ opacity: 0.8 }}>Orario: {selectedEvent.startTime} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}</SubHeader>
                        
                        <View style={[styles.modernInputContainer, { marginTop: 20, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <SubHeader style={{ fontSize: 16, marginBottom: 10 }}>Imposta Promemoria</SubHeader>
                            <Caption style={{ marginBottom: 10, opacity: 0.6 }}>Orario in cui ricevere la notifica:</Caption>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <TimeWheelPicker value={notifTime} onValueChange={setNotifTime} />
                                </View>
                                <ButtonSoft title="Salva" onPress={handleScheduleNotif} variant="outline" style={{ flex: 1, height: 60, justifyContent: 'center' }} />
                            </View>
                        </View>

                        {(() => {
                            let notifs = [];
                            try { notifs = JSON.parse(selectedEvent.notifications || '[]'); } catch(e) {}
                            if (notifs.length > 0) {
                                return (
                                    <View style={{ marginTop: 5 }}>
                                        <Caption style={{ marginBottom: 10, fontWeight: 'bold' }}>PROMEMORIA ATTIVI:</Caption>
                                        {notifs.map((n: any, i: number) => (
                                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, backgroundColor: theme.colors.primary + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <Bell size={16} color={theme.colors.primary} />
                                                    <Body style={{ fontSize: 15, fontWeight: '600' }}>Alle {n.notifTime}</Body>
                                                </View>
                                                <TouchableOpacity onPress={() => handleDeleteNotif(n.id)} style={{ padding: 4, backgroundColor: theme.colors.error + '20', borderRadius: 6 }}>
                                                    <Trash2 size={16} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                );
                            }
                            return null;
                        })()}
                        
                        <View style={{ marginTop: 25 }}>
                            <ButtonSoft title="Elimina Evento" onPress={handleDeleteEvent} style={{ backgroundColor: theme.colors.error + '20' }} />
                        </View>
                    </View>
                )}
            </ModalForm>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    screenHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingTop: 10 
    },
    screenTitle: { paddingHorizontal: 0 },
    remindersBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 20,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginHorizontal: 20,
        letterSpacing: 1.5,
        textAlign: 'center',
        minWidth: 160,
    },
    navBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBtnText: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
    scroll: { padding: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    dayCard: { width: '48.5%', minHeight: 110, marginBottom: 15, padding: 10 },
    dayHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 },
    dayNumber: { fontSize: 22, fontWeight: '800' },
    dayName: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
    eventContainer: { marginTop: 5, flex: 1 },
    eventBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, marginBottom: 3 },
    eventText: { fontSize: 10, fontWeight: '600' },
    addButton: { alignSelf: 'flex-end', padding: 5, borderRadius: 10 },
    modernInputContainer: { borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 20 },
    modernTextInput: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
    timePickerRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    timePickerCard: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 16 },
    timeLabel: { fontSize: 10, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
    saveBtn: { marginTop: 10 },
    reminderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
});
