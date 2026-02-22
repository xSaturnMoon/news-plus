import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import { Plus, Trash2, Pin, ShoppingCart, CheckCircle, Circle } from 'lucide-react-native';
import * as db from '../services/database';
import * as notifications from '../services/notifications';
import * as liveActivities from '../services/liveActivities';

export const ShoppingListScreen = () => {
    const [items, setItems] = useState<db.ShoppingItem[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQty, setNewItemQty] = useState('');
    const [activeActivityId, setActiveActivityId] = useState<string | null>(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const data = await db.getShoppingItems();
        setItems(data);

        if (activeActivityId) {
            await liveActivities.updateShoppingLiveActivity(activeActivityId, data);
        }
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
        loadItems();
    };

    const handleToggleItem = async (item: db.ShoppingItem) => {
        await db.toggleShoppingItem(item.id!, item.checked === 1 ? 0 : 1);
        loadItems();
    };

    const handleDeleteItem = async (id: number) => {
        await db.deleteShoppingItem(id);
        loadItems();
    };

    const handleClearChecked = async () => {
        await db.clearCheckedItems();
        loadItems();
    };

    const handlePinToLockScreen = async () => {
        if (items.length === 0) {
            Alert.alert('Lista Vuota', 'Non ci sono articoli da pinnare!');
            return;
        }

        if (activeActivityId) {
            await liveActivities.endShoppingLiveActivity(activeActivityId);
        }

        const id = await liveActivities.startShoppingLiveActivity('Spesa', items);
        if (id) {
            setActiveActivityId(id);
            Alert.alert('Pinnata!', 'La lista è ora attiva nella schermata di blocco. Puoi spuntare i prodotti direttamente da lì!');
        } else {
            Alert.alert('Errore', 'Impossibile attivare la Live Activity. Assicurati di usare un dispositivo iOS supportato.');
        }
    };

    const isAddEnabled = newItemName.trim().length > 0 && newItemQty.trim().length > 0;
    const isPinEnabled = items.length > 0;

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Header>Spesa</Header>
                <TouchableOpacity
                    onPress={handlePinToLockScreen}
                    style={[
                        styles.pinButton,
                        isPinEnabled ? styles.activePinButton : styles.disabledPinButton
                    ]}
                    activeOpacity={0.6}
                    disabled={!isPinEnabled}
                >
                    <Pin size={24} color={isPinEnabled ? Theme.colors.white : "#DDD"} />
                </TouchableOpacity>
            </View>

            <CardSoft style={styles.addCard}>
                <View style={styles.addInputRow}>
                    <TextInput
                        style={[styles.input, { flex: 2 }]}
                        value={newItemName}
                        onChangeText={setNewItemName}
                        placeholder="Prodotto"
                        placeholderTextColor="#999"
                    />
                    <TextInput
                        style={[styles.input, { flex: 1.2, marginLeft: 10 }]}
                        value={newItemQty}
                        onChangeText={setNewItemQty}
                        placeholder="Quantità"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                    />
                    <TouchableOpacity
                        onPress={handleAddItem}
                        style={[styles.addButton, !isAddEnabled && styles.disabledAddButton]}
                        activeOpacity={0.7}
                        disabled={!isAddEnabled}
                    >
                        <Plus color={isAddEnabled ? Theme.colors.white : "#AAA"} size={24} />
                    </TouchableOpacity>
                </View>
            </CardSoft>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {items.length === 0 ? (
                    <View style={styles.emptyState}>
                        <ShoppingCart size={64} color={Theme.colors.textLight} style={{ opacity: 0.3 }} />
                        <Body style={styles.emptyText}>La tua lista è vuota</Body>
                    </View>
                ) : (
                    items.map((item) => (
                        <CardSoft key={item.id} style={[styles.itemCard, item.checked === 1 && styles.checkedCard]}>
                            <TouchableOpacity
                                style={styles.itemMain}
                                onPress={() => handleToggleItem(item)}
                            >
                                {item.checked === 1 ? (
                                    <CheckCircle size={24} color={Theme.colors.primary} />
                                ) : (
                                    <Circle size={24} color={Theme.colors.textLight} />
                                )}
                                <View style={styles.itemTextContent}>
                                    <SubHeader style={[styles.itemName, item.checked === 1 && styles.checkedText]}>
                                        {item.name}
                                    </SubHeader>
                                    {item.quantity ? (
                                        <Caption style={item.checked === 1 ? styles.checkedText : null}>
                                            {item.quantity}
                                        </Caption>
                                    ) : null}
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteItem(item.id!)}>
                                <Trash2 size={20} color="#FF5252" />
                            </TouchableOpacity>
                        </CardSoft>
                    ))
                )}
            </ScrollView>

            {items.some(i => i.checked === 1) && (
                <View style={styles.footer}>
                    <ButtonSoft
                        title="Pulisci completati"
                        onPress={handleClearChecked}
                        variant="error"
                        style={{ minHeight: 45 }}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.white,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: Theme.spacing.md,
    },
    addCard: {
        marginHorizontal: Theme.spacing.lg,
        marginBottom: Theme.spacing.md,
        padding: Theme.spacing.md,
        backgroundColor: '#F8F9FA',
    },
    addInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: Theme.colors.white,
        borderRadius: Theme.borderRadius.sm,
        padding: 10,
        fontSize: 16,
        color: Theme.colors.text,
        borderWidth: 1,
        borderColor: Theme.colors.border,
    },
    pinButton: {
        padding: Theme.spacing.sm,
        borderRadius: Theme.borderRadius.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activePinButton: {
        backgroundColor: '#4CAF50', // Vibrant Green
        borderColor: '#4CAF50',
    },
    disabledPinButton: {
        backgroundColor: 'transparent',
        borderColor: '#DDD', // Thin subtle circle
    },
    addButton: {
        backgroundColor: '#1E88E5', // Vibrant Blue
        borderRadius: Theme.borderRadius.sm,
        padding: 10,
        marginLeft: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledAddButton: {
        backgroundColor: '#EEE',
    },
    disabledButton: {
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.lg,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        color: Theme.colors.textLight,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        marginBottom: Theme.spacing.sm,
        justifyContent: 'space-between',
    },
    checkedCard: {
        opacity: 0.6,
        backgroundColor: '#F1F1F1',
    },
    itemMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemTextContent: {
        marginLeft: 15,
    },
    itemName: {
        fontSize: 17,
        fontWeight: '600',
    },
    checkedText: {
        textDecorationLine: 'line-through',
        color: '#888',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Theme.spacing.lg,
        paddingBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
    }
});
