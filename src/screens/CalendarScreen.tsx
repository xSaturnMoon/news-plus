import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, TextStyle, StyleProp } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import { ModalForm } from '../components/ModalForm';
import { Plus, Bell, Trash2 } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { it } from 'date-fns/locale';
import * as db from '../services/database';

export const CalendarScreen = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<db.CalendarEvent[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<db.CalendarEvent | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
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
            endTime,
            date: format(selectedDate, 'yyyy-MM-dd'),
            notifications: JSON.stringify([]),
            enabled: 1,
        });

        setModalVisible(false);
        loadEvents();
    };

    const handleEventPress = (event: db.CalendarEvent) => {
        setSelectedEvent(event);

        // Carica dati salvati se presenti
        let savedDate = event.date;
        let savedTime = event.startTime;

        try {
            const data = JSON.parse(event.notifications || '{}');
            if (data.notifDate) savedDate = data.notifDate;
            if (data.notifTime) savedTime = data.notifTime;
        } catch (e) { /* vecchio formato */ }

        setNotifDate(savedDate);
        setNotifTime(savedTime);
        setDetailModalVisible(true);
    };

    const handleScheduleNotif = async () => {
        if (!selectedEvent || !notifDate || !notifTime) return;

        try {
            // Validate formats
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            const timeRegex = /^\d{2}:\d{2}$/;

            if (!dateRegex.test(notifDate) || !timeRegex.test(notifTime)) {
                Alert.alert('Errore', 'Formato data (YYYY-MM-DD) o ora (HH:MM) non valido');
                return;
            }

            const [year, month, day] = notifDate.split('-').map(Number);
            const [hour, minute] = notifTime.split(':').map(Number);
            const scheduledDate = new Date(year, month - 1, day, hour, minute);

            if (scheduledDate.getTime() <= Date.now()) {
                Alert.alert('Errore', 'La data della notifica deve essere nel futuro');
                return;
            }

            const notifications = require('../services/notifications');

            // Cancel existing if any
            let existingIds: string[] = [];
            try {
                const data = JSON.parse(selectedEvent.notifications || '[]');
                existingIds = Array.isArray(data) ? data : (data.ids || []);
            } catch (e) { }

            for (const id of existingIds) {
                await notifications.cancelNotification(id);
            }

            // Schedule new
            const notifId = await notifications.scheduleNotification(
                `Promemoria: ${selectedEvent.title}`,
                `Evento previsto per le ${selectedEvent.startTime}`,
                scheduledDate
            );

            if (notifId) {
                const updated = {
                    ...selectedEvent,
                    notifications: JSON.stringify({
                        ids: [notifId],
                        notifDate: notifDate,
                        notifTime: notifTime
                    }),
                    enabled: 1
                };
                await db.updateEvent(updated);
                setSelectedEvent(updated);
                loadEvents();
                Alert.alert('Successo', 'Notifica programmata correttamente! 🔔');
            }
        } catch (error) {
            console.error('Error scheduling notification:', error);
            Alert.alert('Errore', 'Impossibile programmare la notifica');
        }
    };

    const handleDeleteEvent = async () => {
        if (selectedEvent?.id) {
            // Cancel notifications too
            try {
                const notifications = require('../services/notifications');
                let existingIds: string[] = [];
                try {
                    const data = JSON.parse(selectedEvent.notifications || '[]');
                    existingIds = Array.isArray(data) ? data : (data.ids || []);
                } catch (e) { }

                for (const id of existingIds) {
                    await notifications.cancelNotification(id);
                }
            } catch (e) { console.error(e); }

            await db.deleteEvent(selectedEvent.id);
            setDetailModalVisible(false);
            loadEvents();
        }
    };

    const renderDay = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.date === dateStr);
        const today = format(new Date(), 'yyyy-MM-dd') === dateStr;

        return (
            <CardSoft
                key={dateStr}
                style={[
                    styles.dayCard,
                    today ? styles.todayCard : null
                ]}
            >
                <View style={styles.dayHeader}>
                    <SubHeader style={[styles.dayNumber, today ? styles.todayText : null]}>
                        {format(day, 'd')}
                    </SubHeader>
                    <Caption style={[styles.dayName, today ? styles.todayText : null]}>
                        {format(day, 'EEEE', { locale: it })}
                    </Caption>
                </View>

                <View style={styles.eventContainer}>
                    {dayEvents.map((event, idx) => (
                        <TouchableOpacity
                            key={idx}
                            onPress={() => handleEventPress(event)}
                            style={[styles.eventBadge, today ? { backgroundColor: 'rgba(255,255,255,0.4)' } : null]}
                        >
                            <Caption numberOfLines={1} style={[styles.eventText, today ? styles.todayText : null]}>
                                {event.startTime} {event.title}
                            </Caption>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddPress(day)}
                >
                    <Plus {...({ size: 18, color: today ? Theme.colors.text : Theme.colors.textLight } as any)} />
                </TouchableOpacity>
            </CardSoft>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.monthHeader}>
                <ButtonSoft title="<" onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navBtn} />
                <Header>{format(currentMonth, 'MMMM yyyy', { locale: it })}</Header>
                <ButtonSoft title=">" onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.grid}>
                    {daysInMonth.map(renderDay)}
                </View>
            </ScrollView>

            {/* Add Modal */}
            <ModalForm
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="Nuovo Evento"
            >
                <Body style={styles.label}>Titolo</Body>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Es: Visita medica"
                />

                <Body style={styles.label}>Orario Inizio</Body>
                <TextInput
                    style={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="Es: 10:30"
                />

                <Body style={styles.label}>Orario Fine (Opzionale)</Body>
                <TextInput
                    style={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="Es: 11:30"
                />

                <ButtonSoft
                    title="Salva"
                    onPress={handleSaveEvent}
                    style={{ marginTop: Theme.spacing.lg }}
                />
            </ModalForm>

            {/* Detail Modal */}
            <ModalForm
                visible={detailModalVisible}
                onClose={() => setDetailModalVisible(false)}
                title="Dettaglio Evento"
            >
                {selectedEvent && (
                    <View>
                        <SubHeader>{selectedEvent.title}</SubHeader>
                        <Body>{selectedEvent.startTime} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}</Body>
                        <Body style={{ marginTop: Theme.spacing.md }}>Data: {selectedEvent.date}</Body>

                        <View style={styles.notificationSection}>
                            <View style={styles.switchRow}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Bell size={20} color={Theme.colors.primary} style={{ marginRight: 8 }} />
                                    <Body style={{ fontWeight: 'bold' }}>Notifica Personalizzata</Body>
                                </View>
                                <Switch
                                    value={selectedEvent.enabled === 1}
                                    onValueChange={async (val) => {
                                        const updated = { ...selectedEvent, enabled: val ? 1 : 0 };
                                        await db.updateEvent(updated);
                                        setSelectedEvent(updated);
                                        loadEvents();
                                    }}
                                />
                            </View>

                            {selectedEvent.enabled === 1 && (
                                <View style={styles.notifControls}>
                                    <Caption style={styles.notifLabel}>Quando vuoi ricevere l'avviso?</Caption>
                                    <View style={styles.notifInputs}>
                                        <View style={{ flex: 1, marginRight: 10 }}>
                                            <Caption>Giorno</Caption>
                                            <TextInput
                                                style={styles.smallInput}
                                                value={notifDate}
                                                placeholder="Data"
                                                onChangeText={setNotifDate}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Caption>Ora</Caption>
                                            <TextInput
                                                style={styles.smallInput}
                                                value={notifTime}
                                                placeholder="Ora"
                                                onChangeText={setNotifTime}
                                            />
                                        </View>
                                    </View>
                                    <ButtonSoft
                                        title="Programma Notifica"
                                        onPress={handleScheduleNotif}
                                        style={{ marginTop: 10, minHeight: 40 }}
                                    />
                                </View>
                            )}
                        </View>

                        <ButtonSoft
                            variant="error"
                            title="Elimina Evento"
                            onPress={handleDeleteEvent}
                            style={{ marginTop: Theme.spacing.xl }}
                        />
                    </View>
                )}
            </ModalForm>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Theme.spacing.md,
    },
    navBtn: {
        backgroundColor: 'transparent',
        paddingHorizontal: Theme.spacing.md,
        minHeight: 40,
    },
    scroll: {
        padding: Theme.spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    dayCard: {
        width: '48%', // Approx 2 columns
        minHeight: 110,
        marginBottom: Theme.spacing.md,
        paddingBottom: Theme.spacing.sm,
    },
    dayHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    dayNumber: {
        fontSize: 22,
        color: Theme.colors.textLight,
        fontWeight: 'bold',
    },
    dayName: {
        fontSize: 12,
        color: Theme.colors.textLight,
        textTransform: 'capitalize',
    },
    eventContainer: {
        marginTop: Theme.spacing.xs,
        flex: 1,
    },
    eventBadge: {
        backgroundColor: Theme.colors.secondary,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
        marginBottom: 3,
    },
    eventText: {
        fontSize: 11,
        color: Theme.colors.text,
    },
    addButton: {
        alignSelf: 'flex-end',
        padding: 4,
    },
    label: {
        marginTop: Theme.spacing.md,
        marginBottom: Theme.spacing.xs,
        fontWeight: '600',
    },
    input: {
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.sm,
        padding: Theme.spacing.md,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Theme.spacing.sm,
    },
    notificationSection: {
        marginTop: Theme.spacing.xl,
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border,
    },
    notifControls: {
        marginTop: Theme.spacing.md,
        backgroundColor: Theme.colors.secondary + '20', // Light transparency
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
    },
    notifLabel: {
        marginBottom: 8,
        color: Theme.colors.text,
        fontWeight: '600',
    },
    notifInputs: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    smallInput: {
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.sm,
        padding: 8,
        fontSize: 14,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        marginTop: 4,
    },
    todayCard: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
        borderWidth: 1,
    },
    todayText: {
        color: Theme.colors.text,
        fontWeight: 'bold',
    },
});