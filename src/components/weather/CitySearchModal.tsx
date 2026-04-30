import React, { useState } from 'react';
import { Modal, View, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Header, Body, Caption } from '../Typography';
import { useTheme } from '../../theme/ThemeContext';
import { Search, X, MapPin } from 'lucide-react-native';

interface CitySearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectCity: (cityName: string) => void;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({ visible, onClose, onSelectCity }) => {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');

    const suggestions = [
        'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
        'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste',
        'Londra', 'Parigi', 'Berlino', 'Madrid', 'Barcellona', 'Lisbona', 'Amsterdam',
        'New York', 'Tokyo', 'Sydney', 'Dubai', 'Singapore'
    ];

    const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()));

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X color={theme.colors.text} size={24} />
                    </TouchableOpacity>
                    <Header style={{ fontSize: 24 }}>Cerca Città</Header>
                </View>

                <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Search color={theme.colors.textLight} size={20} />
                    <TextInput
                        style={[styles.input, { color: theme.colors.text }]}
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Esempio: Milano..."
                        placeholderTextColor={theme.colors.textLight + '80'}
                        autoFocus
                    />
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.item, { borderBottomColor: theme.colors.border }]} 
                            onPress={() => onSelectCity(item)}
                        >
                            <MapPin size={18} color={theme.colors.primary} style={{ marginRight: 12 }} />
                            <Body style={{ fontWeight: '600' }}>{item}</Body>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Body style={{ color: theme.colors.textLight }}>Nessun risultato trovato</Body>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 },
    closeBtn: { marginRight: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', margin: 20, paddingHorizontal: 15, height: 50, borderRadius: 12, borderWidth: 1 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    list: { paddingHorizontal: 20 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    empty: { alignItems: 'center', marginTop: 50 },
});