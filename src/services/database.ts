import * as SQLite from 'expo-sqlite';

const dbName = 'newsplus.db';

export interface CalendarEvent {
    id?: number;
    title: string;
    startTime: string; // ISO string or simple time string
    endTime?: string;
    date: string; // YYYY-MM-DD
    notifications: string; // JSON stringify of notification times
    enabled: number; // 0 or 1
}

export const initDatabase = async () => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT,
      date TEXT NOT NULL,
      notifications TEXT,
      enabled INTEGER DEFAULT 1
    );
  `);
    return db;
};

export const addEvent = async (event: Omit<CalendarEvent, 'id'>) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    const result = await db.runAsync(
        'INSERT INTO events (title, startTime, endTime, date, notifications, enabled) VALUES (?, ?, ?, ?, ?, ?)',
        [event.title, event.startTime, event.endTime || '', event.date, event.notifications, event.enabled]
    );
    return result.lastInsertRowId;
};

export const getEventsForDate = async (date: string): Promise<CalendarEvent[]> => {
    const db = await SQLite.openDatabaseAsync(dbName);
    const allRows = await db.getAllAsync<CalendarEvent>('SELECT * FROM events WHERE date = ?', [date]);
    return allRows;
};

export const getAllEvents = async (): Promise<CalendarEvent[]> => {
    const db = await SQLite.openDatabaseAsync(dbName);
    const allRows = await db.getAllAsync<CalendarEvent>('SELECT * FROM events');
    return allRows;
};

export const updateEvent = async (event: CalendarEvent) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.runAsync(
        'UPDATE events SET title = ?, startTime = ?, endTime = ?, notifications = ?, enabled = ? WHERE id = ?',
        [event.title, event.startTime, event.endTime || '', event.notifications, event.enabled, event.id!]
    );
};

export const deleteEvent = async (id: number) => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.runAsync('DELETE FROM events WHERE id = ?', [id]);
};

export const clearAllEvents = async () => {
    const db = await SQLite.openDatabaseAsync(dbName);
    await db.runAsync('DELETE FROM events');
};
