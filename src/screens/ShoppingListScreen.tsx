import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Keyboard, Pressable, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import { ModalForm } from '../components/ModalForm';
import { Plus, Trash2, Pin, ShoppingCart, CheckCircle, Circle, Users, FolderHeart } from 'lucide-react-native';
import * as db from '../services/database';
import * as liveActivities from '../services/liveActivities';

interface Friend {
    code: string;
    name: string;
}

export const ShoppingListScreen = () => {
    const { theme, mode } = useTheme();
    const [items, setItems] = useState<db.ShoppingItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

    const [myCode, setMyCode] = useState<string>('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [sharedModalVisible, setSharedModalVisible] = useState(false);
    const [observingFriend, setObservingFriend] = useState<Friend | null>(null);
    const [observingItems, setObservingItems] = useState<db.ShoppingItem[]>([]);
    
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [recoverModalVisible, setRecoverModalVisible] = useState(false);
    const [recoverCodeInput, setRecoverCodeInput] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const observerWsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        loadInitial();
    }, []);

    const loadInitial = async () => {
        let savedMyCode = await AsyncStorage.getItem('my_shopping_code');
        if (!savedMyCode) {
            // Fix: use Math.random() — crypto.getRandomValues non è disponibile in React Native senza polyfill
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            savedMyCode = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            await AsyncStorage.setItem('my_shopping_code', savedMyCode);
        }
        setMyCode(savedMyCode);

        const savedFriends = await AsyncStorage.getItem('shopping_friends');
        if (savedFriends) setFriends(JSON.parse(savedFriends));
        
        loadItems();
    };

    const loadItems = async () => {
        const data = await db.getShoppingItems();
        setItems(data);
        if (activeActivityId) {
            await liveActivities.updateShoppingLiveActivity(activeActivityId, data);
        }
        return data;
    };

    useEffect(() => {
        if (!myCode) return;
        const connectWs = () => {
            const ws = new WebSocket(`wss://ntfy.sh/newsplus_shopping_${myCode}/ws`);
            ws.onmessage = async (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.event === 'message') {
                        const payload = JSON.parse(data.message);
                        // Optional: we can sync our own list across devices if we want.
                        // For now we just push.
                    }
                } catch (err) {}
            };
            wsRef.current = ws;
        };
        connectWs();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [myCode]);

    const syncToNetwork = async (dataToSync: db.ShoppingItem[]) => {
        if (!myCode) return;
        try {
            await fetch(`https://ntfy.sh/newsplus_shopping_${myCode}`, {
                method: 'POST',
                body: JSON.stringify({ items: dataToSync })
            });
        } catch (e) {}
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        await db.addShoppingItem({
            name: newItemName.trim(),
            quantity: newItemQty.trim(),
            checked: 0
        });
        setNewItemName('');
        setNewItemQty('');
        const data = await loadItems();
        await syncToNetwork(data);
    };

    const handleToggleItem = async (item: db.ShoppingItem) => {
        await db.toggleShoppingItem(item.id!, item.checked === 1 ? 0 : 1);
        const data = await loadItems();
        syncToNetwork(data);
    };

    const handleDeleteItem = async (id: number) => {
        await db.deleteShoppingItem(id);
        const data = await loadItems();
        syncToNetwork(data);
    };

    const handleClearChecked = async () => {
        await db.clearCheckedItems();
        const data = await loadItems();
        syncToNetwork(data);
    };

    const handleRecoverData = async () => {
        const code = recoverCodeInput.trim().toUpperCase();
        if (!code || code.length < 4) return;
        setIsRecovering(true);
        try {
            const res = await fetch(`https://ntfy.sh/newsplus_shopping_${code}/json?poll=1`);
            const text = await res.text();
            const lines = text.trim().split('\n').filter(Boolean);
            if (lines.length === 0) {
                Alert.alert('Nessun Dato', 'Nessuna lista trovata per questo codice. Verifica che sia corretto.');
                setIsRecovering(false);
                return;
            }
            const lastLine = JSON.parse(lines[lines.length - 1]);
            const payload = JSON.parse(lastLine.message);
            if (payload && Array.isArray(payload.items) && payload.items.length > 0) {
                await db.replaceShoppingItems(payload.items);
                // Salva il vecchio codice come codice personale così la sincronizzazione continua
                await AsyncStorage.setItem('my_shopping_code', code);
                setMyCode(code);
                await loadItems();
                setRecoverCodeInput('');
                setRecoverModalVisible(false);
                Alert.alert('✅ Lista Recuperata!', `Trovati ${payload.items.length} prodotti. Il tuo codice è stato ripristinato a: ${code}`);
            } else {
                Alert.alert('Lista Vuota', 'Il codice esiste ma la lista era vuota. Se vuoi puoi comunque usare questo codice per riportare la sincronizzazione.');
                await AsyncStorage.setItem('my_shopping_code', code);
                setMyCode(code);
                setRecoverCodeInput('');
                setRecoverModalVisible(false);
            }
        } catch (e) {
            Alert.alert('Errore', 'Impossibile contattare il server. Controlla la connessione.');
        }
        setIsRecovering(false);
    };

    const addFriend = async () => {
        const code = joinCodeInput.trim().toUpperCase();
        if (!code || code === myCode || friends.some(f => f.code === code)) return;
        const newFriends = [...friends, { code, name: code }];
        await AsyncStorage.setItem('shopping_friends', JSON.stringify(newFriends));
        setFriends(newFriends);
        setJoinCodeInput('');
        setShareModalVisible(false);
    };

    const handleLongPressFriend = (friend: Friend) => {
        Alert.prompt(
            'Rinomina o Elimina Amico',
            'Scegli un nome per questo codice, oppure lascia vuoto per eliminarlo.',
            [
                { text: 'Annulla', style: 'cancel' },
                { text: 'Elimina', style: 'destructive', onPress: () => {
                    const nf = friends.filter(f => f.code !== friend.code);
                    AsyncStorage.setItem('shopping_friends', JSON.stringify(nf));
                    setFriends(nf);
                }},
                { text: 'Salva', onPress: (newName: string | undefined) => {
                    if (newName?.trim()) {
                        const nf = friends.map(f => f.code === friend.code ? { ...f, name: newName.trim() } : f);
                        AsyncStorage.setItem('shopping_friends', JSON.stringify(nf));
                        setFriends(nf);
                    }
                }}
            ],
            'plain-text',
            friend.name
        );
    };

    const openSharedList = async (friend: Friend) => {
        // Bug #2: always close the previous observer WebSocket before opening a new one
        if (observerWsRef.current) {
            observerWsRef.current.close();
            observerWsRef.current = null;
        }

        setObservingFriend(friend);
        setObservingItems([]);
        setSharedModalVisible(false);
        
        const ws = new WebSocket(`wss://ntfy.sh/newsplus_shopping_${friend.code}/ws`);
        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                if (data.event === 'message') {
                    const payload = JSON.parse(data.message);
                    if (payload && Array.isArray(payload.items)) {
                        setObservingItems(payload.items);
                    }
                }
            } catch(e) {}
        };
        observerWsRef.current = ws;

        try {
            const res = await fetch(`https://ntfy.sh/newsplus_shopping_${friend.code}/json?poll=1`);
            const text = await res.text();
            const lines = text.trim().split('\n');
            if (lines.length > 0) {
                const lastLine = JSON.parse(lines[lines.length - 1]);
                const payload = JSON.parse(lastLine.message);
                if (payload && Array.isArray(payload.items)) {
                    setObservingItems(payload.items);
                }
            }
        } catch(e) {}
    };

    const closeSharedList = () => {
        if (observerWsRef.current) {
            observerWsRef.current.close();
            observerWsRef.current = null;
        }
        setObservingFriend(null);
    };

    const handlePinToLockScreen = async () => {
        if (items.length === 0) return;
        if (activeActivityId) await liveActivities.endShoppingLiveActivity(activeActivityId);
        const id = await liveActivities.startShoppingLiveActivity('Spesa', items);
        if (id) setActiveActivityId(id);
    };

    const isAddEnabled = newItemName.trim().length > 0;
    const isPinEnabled = items.length > 0;

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
                <View style={styles.headerRow}>
                    <Header>Spesa</Header>
                    <View style={{ flexDirection: 'row' }}>
                        {friends.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setSharedModalVisible(true)}
                                style={[styles.pinButton, { marginRight: 10, borderColor: theme.colors.border }]}
                            >
                                <FolderHeart size={24} color={theme.colors.textLight} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => setShareModalVisible(true)}
                            style={[styles.pinButton, { marginRight: 10, borderColor: theme.colors.border }]}
                        >
                            <Users size={24} color={theme.colors.textLight} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handlePinToLockScreen}
                            style={[
                                styles.pinButton,
                                { borderColor: isPinEnabled ? theme.colors.primary : theme.colors.border },
                                isPinEnabled && { backgroundColor: theme.colors.primary + '15' }
                            ]}
                            disabled={!isPinEnabled}
                        >
                            <Pin size={24} color={isPinEnabled ? theme.colors.primary : theme.colors.textLight} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.addSection}>
                    <CardSoft style={styles.addCard}>
                        <View style={styles.addInputRow}>
                            <TextInput
                                style={[styles.input, { flex: 2, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={newItemName}
                                onChangeText={setNewItemName}
                                placeholder="Prodotto..."
                                placeholderTextColor={theme.colors.textLight + '80'}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, marginLeft: 10, color: theme.colors.text, borderColor: theme.colors.border }]}
                                value={newItemQty}
                                onChangeText={setNewItemQty}
                                placeholder="Q.tà"
                                placeholderTextColor={theme.colors.textLight + '80'}
                            />
                            <TouchableOpacity
                                onPress={handleAddItem}
                                style={[styles.addButton, { backgroundColor: isAddEnabled ? theme.colors.primary : theme.colors.primary + '30' }]}
                                disabled={!isAddEnabled}
                            >
                                <Plus color="#FFFFFF" size={24} />
                            </TouchableOpacity>
                        </View>
                    </CardSoft>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {items.length === 0 ? (
                        <View style={styles.emptyState}>
                            <ShoppingCart size={64} color={theme.colors.textLight} style={{ opacity: 0.2 }} />
                            <Body style={{ marginTop: 20, color: theme.colors.textLight }}>La tua lista è vuota</Body>
                        </View>
                    ) : (
                        items.map((item) => (
                            <CardSoft key={item.id} style={[styles.itemCard, item.checked === 1 && { opacity: 0.5 }]}>
                                <TouchableOpacity style={styles.itemMain} onPress={() => handleToggleItem(item)}>
                                    {item.checked === 1 ? (
                                        <CheckCircle size={24} color={theme.colors.primary} />
                                    ) : (
                                        <Circle size={24} color={theme.colors.textLight} />
                                    )}
                                    <View style={{ marginLeft: 15 }}>
                                        <SubHeader style={[item.checked === 1 && { textDecorationLine: 'line-through', opacity: 0.6 }]}>
                                            {item.name}
                                        </SubHeader>
                                        {item.quantity ? <Caption>{item.quantity}</Caption> : null}
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteItem(item.id!)}>
                                    <Trash2 size={20} color={theme.colors.error} />
                                </TouchableOpacity>
                            </CardSoft>
                        ))
                    )}
                </ScrollView>

                {items.some(i => i.checked === 1) && (
                    <View style={[styles.footer, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
                        <ButtonSoft title="Pulisci completati" onPress={handleClearChecked} variant="error" />
                    </View>
                )}
            </Pressable>

            {/* Modale Aggiungi Amici */}
            <ModalForm visible={shareModalVisible} onClose={() => setShareModalVisible(false)} title="Amici e Condivisione">
                <View style={{ marginTop: 10 }}>
                    <Body style={{ marginBottom: 15, opacity: 0.7 }}>Il tuo codice personale. Dallo a un amico per permettergli di osservare la tua spesa in tempo reale.</Body>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ backgroundColor: theme.colors.primary + '20', padding: 15, borderRadius: 15, width: '100%', alignItems: 'center' }}>
                            <Body style={{ color: theme.colors.primary, fontWeight: '800', fontSize: 24, letterSpacing: 3 }}>{myCode || '...'}</Body>
                        </View>
                    </View>
                    <ButtonSoft title="Condividi su WhatsApp" onPress={() => Share.share({ message: `Entra nella mia lista della spesa su news+ con il codice: ${myCode}` })} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                        <Caption style={{ paddingHorizontal: 15 }}>RECUPERA LISTA</Caption>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                    </View>

                    <Body style={{ marginBottom: 12, opacity: 0.7 }}>Hai perso la lista dopo un aggiornamento? Inserisci il tuo vecchio codice per ripristinarla.</Body>
                    <ButtonSoft
                        title="🔄 Recupera dai Backup"
                        onPress={() => { setShareModalVisible(false); setRecoverModalVisible(true); }}
                        variant="error"
                    />
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                        <Caption style={{ paddingHorizontal: 15 }}>AGGIUNGI AMICO</Caption>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
                    </View>

                    <Body style={{ marginBottom: 15, opacity: 0.7 }}>Inserisci il codice di un amico per poter guardare la sua lista della spesa.</Body>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TextInput
                            style={[styles.input, { flex: 1, color: theme.colors.text, borderColor: theme.colors.border, textTransform: 'uppercase' }]}
                            value={joinCodeInput}
                            onChangeText={setJoinCodeInput}
                            placeholder="Codice Amico..."
                            placeholderTextColor={theme.colors.textLight + '80'}
                            autoCapitalize="characters"
                        />
                        <View style={{ width: 10 }} />
                        <ButtonSoft title="Aggiungi" onPress={addFriend} disabled={joinCodeInput.trim().length === 0} />
                    </View>
                </View>
            </ModalForm>

            {/* Modale Recupero Dati */}
            <ModalForm visible={recoverModalVisible} onClose={() => setRecoverModalVisible(false)} title="🔄 Recupera Lista">
                <View style={{ marginTop: 10 }}>
                    <Body style={{ marginBottom: 8, opacity: 0.7 }}>Inserisci il tuo vecchio codice personale. L'app scaricherà l'ultima versione della tua lista dal server e la ripristinerà.</Body>
                    <Body style={{ marginBottom: 20, opacity: 0.5, fontSize: 13 }}>Puoi trovare il codice su un altro dispositivo dove hai l'app, oppure se qualcuno ce l'aveva salvato tra gli amici.</Body>
                    <TextInput
                        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.primary, textTransform: 'uppercase', fontSize: 22, letterSpacing: 4, textAlign: 'center', marginBottom: 20 }]}
                        value={recoverCodeInput}
                        onChangeText={setRecoverCodeInput}
                        placeholder="ES. ABC123"
                        placeholderTextColor={theme.colors.textLight + '40'}
                        autoCapitalize="characters"
                        maxLength={8}
                    />
                    <ButtonSoft
                        title={isRecovering ? 'Recupero in corso...' : 'Recupera Lista'}
                        onPress={handleRecoverData}
                        disabled={recoverCodeInput.trim().length < 4 || isRecovering}
                    />
                </View>
            </ModalForm>

            {/* Modale Spese Condivise (Cartelle) */}
            <ModalForm visible={sharedModalVisible} onClose={() => setSharedModalVisible(false)} title="Spese Condivise">
                <View style={{ marginTop: 10 }}>
                    <Body style={{ marginBottom: 20, opacity: 0.7 }}>Clicca su un amico per vedere la sua spesa. Tieni premuto per rinominarlo o eliminarlo.</Body>
                    {friends.map(f => (
                        <TouchableOpacity
                            key={f.code}
                            onPress={() => openSharedList(f)}
                            onLongPress={() => handleLongPressFriend(f)}
                            style={{ padding: 15, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Users size={20} color={theme.colors.primary} />
                            <Body style={{ marginLeft: 15, fontWeight: '700', fontSize: 18 }}>{f.name}</Body>
                        </TouchableOpacity>
                    ))}
                </View>
            </ModalForm>

            {/* Modale Lettura Spesa Amico (Read-Only) */}
            <ModalForm visible={!!observingFriend} onClose={closeSharedList} title={`Spesa di ${observingFriend?.name}`}>
                <ScrollView contentContainerStyle={{ paddingBottom: 50, paddingTop: 10 }}>
                    {observingItems.length === 0 ? (
                        <Body style={{ textAlign: 'center', opacity: 0.5, marginTop: 40 }}>La lista è vuota o in caricamento...</Body>
                    ) : (
                        observingItems.map(item => (
                            <View key={item.id} style={[styles.itemCard, { opacity: item.checked === 1 ? 0.5 : 1, backgroundColor: 'rgba(0,0,0,0.03)' }]}>
                                <View style={styles.itemMain}>
                                    {item.checked === 1 ? (
                                        <CheckCircle size={24} color={theme.colors.primary} />
                                    ) : (
                                        <Circle size={24} color={theme.colors.textLight} />
                                    )}
                                    <View style={{ marginLeft: 15 }}>
                                        <SubHeader style={[item.checked === 1 && { textDecorationLine: 'line-through' }]}>{item.name}</SubHeader>
                                        {item.quantity ? <Caption>{item.quantity}</Caption> : null}
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </ModalForm>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    pinButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    addSection: { paddingHorizontal: 20, marginBottom: 15 },
    addCard: { padding: 12 },
    addInputRow: { flexDirection: 'row', alignItems: 'center' },
    input: { 
        borderRadius: 10, 
        padding: 12, 
        fontSize: 16, 
        borderWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    addButton: { borderRadius: 10, padding: 12, marginLeft: 10 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 160 },
    emptyState: { alignItems: 'center', marginTop: 80 },
    itemCard: { flexDirection: 'row', alignItems: 'center', padding: 15, marginBottom: 10, justifyContent: 'space-between' },
    itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    footer: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: 20, 
        paddingBottom: 110, 
        borderTopWidth: 1,
    },
});
