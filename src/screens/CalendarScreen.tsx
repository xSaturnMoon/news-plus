import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert, TextStyle, StyleProp, Text } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import { ModalForm } from '../components/ModalForm';
import { Plus, Bell, Trash2, Watch, Calendar, Type, Clock, List } from 'lucide-react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import * as db from '../services/database';

export const CalendarScreen = () => {
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

        // Reset notif form to default (now we support multiple, so default to empty or event date)
        setNotifDate(event.date);
        setNotifTime(event.startTime);
        
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

            // Parse existing notifications as an array (handling legacy single object format)
            let currentNotifs: Array<{ id: string, notifDate: string, notifTime: string }> = [];
            try {
                const data = JSON.parse(selectedEvent.notifications || '[]');
                if (Array.isArray(data)) {
                    currentNotifs = data;
                } else if (data && data.ids && Array.isArray(data.ids) && data.ids.length > 0) {
                    // Legacy single object format migration
                    currentNotifs = [{
                        id: data.ids[0],
                        notifDate: data.notifDate || notifDate,
                        notifTime: data.notifTime || notifTime
                    }];
                }
            } catch (e) { console.error('Error parsing notifications', e); }

            // Schedule new notification
            const notifId = await notifications.scheduleNotification(
                `Promemoria: ${selectedEvent.title}`,
                `Evento previsto per le ${selectedEvent.startTime}`,
                scheduledDate
            );

            if (notifId) {
                // Append the new notification to the array
                const newNotif = { id: notifId, notifDate, notifTime };
                const updatedNotifs = [...currentNotifs, newNotif];

                const updated = {
                    ...selectedEvent,
                    notifications: JSON.stringify(updatedNotifs),
                    enabled: 1
                };
                await db.updateEvent(updated);
                setSelectedEvent(updated);
                loadEvents();
                Alert.alert('Successo', 'Notifica programmata correttamente! 🔔');
                
                // Reset form fields after success
                setNotifDate('');
                setNotifTime('');
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
                    if (Array.isArray(data)) {
                        existingIds = data.map(n => n.id);
                    } else if (data.ids) {
                        existingIds = data.ids;
                    }
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ButtonSoft title="<" onPress={() => setCurrentMonth(subMonths(currentMonth, 1))} style={styles.navBtn} />
                    <Header>{format(currentMonth, 'MMMM yyyy', { locale: it })}</Header>
                    <ButtonSoft title=">" onPress={() => setCurrentMonth(addMonths(currentMonth, 1))} style={styles.navBtn} />
                </View>
                <TouchableOpacity onPress={() => setRemindersModalVisible(true)} style={styles.remindersBtn}>
                    <Bell size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
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
                <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputCard}>
                        <View style={styles.inputIconContainer}>
                            <Type size={20} color={Theme.colors.text} />
                        </View>
                        <View style={styles.inputContent}>
                            <Caption style={styles.inputLabel}>Titolo</Caption>
                            <TextInput
                                style={styles.textInput}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Cosa devi fare?"
                                placeholderTextColor={Theme.colors.textLight + '60'}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputCard, { flex: 1, marginRight: Theme.spacing.sm }]}>
                            <View style={styles.inputIconContainer}>
                                <Clock size={20} color={Theme.colors.text} />
                            </View>
                            <View style={styles.inputContent}>
                                <Caption style={styles.inputLabel}>Inizio</Caption>
                                <TextInput
                                    style={styles.textInput}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="10:30"
                                    placeholderTextColor={Theme.colors.textLight + '60'}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputCard, { flex: 1 }]}>
                            <View style={styles.inputIconContainer}>
                                <Watch size={20} color={Theme.colors.text} />
                            </View>
                            <View style={styles.inputContent}>
                                <Caption style={styles.inputLabel}>Fine</Caption>
                                <TextInput
                                    style={styles.textInput}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="11:30"
                                    placeholderTextColor={Theme.colors.textLight + '60'}
                                />
                            </View>
                        </View>
                    </View>

                    <ButtonSoft
                        title="Salva Evento"
                        onPress={handleSaveEvent}
                        style={styles.saveBtn}
                    />
                    <View style={{ height: Theme.spacing.md }} />
                </ScrollView>
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

                        <View style={styles.notificationCard}>
                            <View style={styles.switchRow}>
                                <View style={styles.notifTitleRow}>
                                    <View style={[styles.notifIconCircle, { backgroundColor: selectedEvent.enabled === 1 ? Theme.colors.primary + '20' : Theme.colors.secondary }]}>
                                        <Bell size={20} color={selectedEvent.enabled === 1 ? Theme.colors.primary : Theme.colors.textLight} />
                                    </View>
                                    <View>
                                        <Body style={{ fontWeight: '700' }}>Promemoria</Body>
                                        <Caption>{selectedEvent.enabled === 1 ? 'Attivo' : 'Disattivato'}</Caption>
                                    </View>
                                </View>
                                <Switch
                                    value={selectedEvent.enabled === 1}
                                    trackColor={{ false: Theme.colors.secondary, true: Theme.colors.primary + '80' }}
                                    thumbColor={selectedEvent.enabled === 1 ? Theme.colors.primary : '#f4f3f4'}
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
                                    {/* List of existing notifications for this event */}
                                    {(() => {
                                        let currentNotifs: Array<{ id: string, notifDate: string, notifTime: string }> = [];
                                        try {
                                            const data = JSON.parse(selectedEvent.notifications || '[]');
                                            if (Array.isArray(data)) {
                                                currentNotifs = data;
                                            } else if (data && data.ids && Array.isArray(data.ids) && data.ids.length > 0) {
                                                currentNotifs = [{ id: data.ids[0], notifDate: data.notifDate || selectedEvent.date, notifTime: data.notifTime || selectedEvent.startTime }];
                                            }
                                        } catch(e) {}

                                        if (currentNotifs.length > 0) {
                                            return (
                                                <View style={{ marginBottom: Theme.spacing.md }}>
                                                    <Caption style={{ marginBottom: 4 }}>Promemoria impostat:</Caption>
                                                    {currentNotifs.map((n, idx) => (
                                                        <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.colors.secondary, padding: 8, borderRadius: Theme.borderRadius.sm, marginBottom: 4 }}>
                                                            <Caption>{n.notifDate} alle {n.notifTime}</Caption>
                                                            <TouchableOpacity onPress={async () => {
                                                                const notifications = require('../services/notifications');
                                                                await notifications.cancelNotification(n.id);
                                                                const updatedNotifs = currentNotifs.filter(notif => notif.id !== n.id);
                                                                const updated = { ...selectedEvent, notifications: JSON.stringify(updatedNotifs) };
                                                                await db.updateEvent(updated);
                                                                setSelectedEvent(updated);
                                                                loadEvents();
                                                            }}>
                                                                <Trash2 size={16} color={Theme.colors.error} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ))}
                                                </View>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <View style={styles.notifInputsRow}>
                                        <View style={styles.notifInputGroup}>
                                            <View style={styles.smallInputCard}>
                                                <Calendar size={16} color={Theme.colors.primary} style={{ marginRight: 6 }} />
                                                <TextInput
                                                    style={styles.notifTextInput}
                                                    value={notifDate}
                                                    placeholder="AAAA-MM-GG"
                                                    onChangeText={setNotifDate}
                                                    placeholderTextColor={Theme.colors.textLight + '80'}
                                                />
                                            </View>
                                        </View>
                                        <View style={styles.notifInputGroup}>
                                            <View style={styles.smallInputCard}>
                                                <Clock size={16} color={Theme.colors.primary} style={{ marginRight: 6 }} />
                                                <TextInput
                                                    style={styles.notifTextInput}
                                                    value={notifTime}
                                                    placeholder="HH:MM"
                                                    onChangeText={setNotifTime}
                                                    placeholderTextColor={Theme.colors.textLight + '80'}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                    <ButtonSoft
                                        title="Aggiungi Promemoria"
                                        onPress={handleScheduleNotif}
                                        style={styles.scheduleBtn}
                                        textStyle={{ fontSize: 14 }}
                                    />
                                </View>
                            )}
                        </View>

                        <ButtonSoft
                            variant="error"
                            title="Elimina Evento"
                            onPress={handleDeleteEvent}
                            style={{ marginTop: Theme.spacing.md, marginBottom: Theme.spacing.md }}
                        />
                    </View>
                )}
            </ModalForm>

            {/* Reminders List Modal */}
            <ModalForm
                visible={remindersModalVisible}
                onClose={() => setRemindersModalVisible(false)}
                title="Tutti i Promemoria"
            >
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
                    {(() => {
                        // Extract all reminders
                        const allReminders: Array<{ eventId: number, eventTitle: string, id: string, notifDate: string, notifTime: string }> = [];
                        
                        events.forEach(ev => {
                            if (ev.enabled !== 1) return;
                            try {
                                const data = JSON.parse(ev.notifications || '[]');
                                if (Array.isArray(data)) {
                                    data.forEach(n => {
                                        allReminders.push({ eventId: ev.id!, eventTitle: ev.title, id: n.id, notifDate: n.notifDate, notifTime: n.notifTime });
                                    });
                                } else if (data && data.ids && Array.isArray(data.ids) && data.ids.length > 0) {
                                    allReminders.push({ eventId: ev.id!, eventTitle: ev.title, id: data.ids[0], notifDate: data.notifDate || ev.date, notifTime: data.notifTime || ev.startTime });
                                }
                            } catch(e) {}
                        });

                        if (allReminders.length === 0) {
                            return <Body style={{ textAlign: 'center', marginTop: 20, color: Theme.colors.textLight }}>Nessun promemoria attivo.</Body>;
                        }

                        // Group by date
                        const grouped: Record<string, typeof allReminders> = {};
                        allReminders.forEach(r => {
                            if (!grouped[r.notifDate]) grouped[r.notifDate] = [];
                            grouped[r.notifDate].push(r);
                        });

                        // Sort dates
                        const sortedDates = Object.keys(grouped).sort();

                        return sortedDates.map(dateStr => (
                            <View key={dateStr} style={{ marginBottom: Theme.spacing.md }}>
                                <Caption style={styles.remindersDateHeader}>
                                    {format(parseISO(dateStr), 'd MMMM', { locale: it })}
                                </Caption>
                                {grouped[dateStr].sort((a,b) => a.notifTime.localeCompare(b.notifTime)).map((r, idx) => (
                                    <View key={idx} style={styles.reminderListItem}>
                                        <View style={{ flex: 1 }}>
                                            <Body style={{ fontWeight: '600' }}>{r.eventTitle}</Body>
                                            <Caption style={{ color: Theme.colors.primary }}>{r.notifTime}</Caption>
                                        </View>
                                        <TouchableOpacity onPress={async () => {
                                            const notifications = require('../services/notifications');
                                            await notifications.cancelNotification(r.id);
                                            
                                            // Find event and remove this specific notification from its JSON
                                            const ev = events.find(e => e.id === r.eventId);
                                            if (ev) {
                                                try {
                                                    const data = JSON.parse(ev.notifications || '[]');
                                                    let updatedNotifs = [];
                                                    if (Array.isArray(data)) {
                                                        updatedNotifs = data.filter(n => n.id !== r.id);
                                                    } else if (data && data.ids) {
                                                        updatedNotifs = []; // Legacy migrated
                                                    }
                                                    const updated = { ...ev, notifications: JSON.stringify(updatedNotifs) };
                                                    await db.updateEvent(updated);
                                                    loadEvents();
                                                } catch(e){}
                                            }
                                        }}>
                                            <View style={styles.reminderDeleteBtn}>
                                                <Trash2 size={16} color={Theme.colors.error} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        ));
                    })()}
                </ScrollView>
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
    remindersBtn: {
        padding: 8,
        backgroundColor: Theme.colors.primary + '15',
        borderRadius: Theme.borderRadius.md,
    },
    remindersDateHeader: {
        fontWeight: 'bold',
        fontSize: 14,
        color: Theme.colors.textLight,
        marginBottom: 8,
        textTransform: 'capitalize',
    },
    reminderListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.light,
    },
    reminderDeleteBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Theme.colors.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
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
        width: '48%',
        minHeight: 110,
        marginBottom: Theme.spacing.md,
        padding: Theme.spacing.sm,
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
    formContainer: {
        paddingVertical: Theme.spacing.sm,
    },
    inputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.md,
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    inputIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Theme.colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Theme.spacing.md,
        ...Theme.shadows.light,
    },
    inputContent: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: Theme.colors.textLight,
        marginBottom: 2,
    },
    textInput: {
        fontSize: 16,
        color: Theme.colors.text,
        fontWeight: '500',
        padding: 0,
    },
    row: {
        flexDirection: 'row',
        marginBottom: Theme.spacing.sm,
    },
    saveBtn: {
        marginTop: Theme.spacing.xs,
    },
    notificationCard: {
        marginTop: Theme.spacing.md,
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.lg,
        padding: Theme.spacing.md,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        ...Theme.shadows.light,
    },
    notifTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notifIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    notifControls: {
        marginTop: Theme.spacing.md,
        paddingTop: Theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: Theme.colors.border + '50',
    },
    notifInputsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    notifInputGroup: {
        flex: 1,
        marginHorizontal: 5,
    },
    smallInputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
        borderRadius: Theme.borderRadius.sm,
        paddingHorizontal: 8,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    notifTextInput: {
        flex: 1,
        fontSize: 13,
        color: Theme.colors.text,
        padding: 0,
    },
    scheduleBtn: {
        marginTop: Theme.spacing.md,
        minHeight: 44,
        backgroundColor: Theme.colors.primary,
    },
    todayCard: {
        backgroundColor: Theme.colors.primary,
        borderColor: Theme.colors.primary,
        borderWidth: 1,
        ...Theme.shadows.medium,
    },
    todayText: {
        color: Theme.colors.text,
        fontWeight: 'bold',
    },
});
