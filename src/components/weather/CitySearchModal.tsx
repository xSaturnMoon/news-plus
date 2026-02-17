import React, { useState } from 'react';
import { Modal, View, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Header, Body, Caption } from '../Typography';
import { Theme } from '../../theme';
import { Search, X, MapPin } from 'lucide-react-native';

interface CitySearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectCity: (cityName: string) => void;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({ visible, onClose, onSelectCity }) => {
    const [query, setQuery] = useState('');

    const suggestions = [
        // Italia - Principali e Capoluoghi
        'Roma', 'Milano', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
        'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Taranto',
        'Brescia', 'Parma', 'Prato', 'Modena', 'Reggio Calabria', 'Reggio Emilia', 'Perugia',
        'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara',
        'Sassari', 'Latina', 'Monza', 'Siracusa', 'Pescara', 'Bergamo', 'Forlì', 'Trento',
        'Vicenza', 'Terni', 'Bolzano', 'Novara', 'Piacenza', 'Ancona', 'Andria', 'Udine',
        'Arezzo', 'Cesena', 'Lecce', 'Pesaro', 'Barletta', 'Alessandria', 'La Spezia',
        'Pistoia', 'Pisa', 'Catanzaro', 'Lucca', 'Brindisi', 'Treviso', 'Varese', 'Como',
        'Grosseto', 'Viterbo', 'Pavia', 'Massa', 'L\'Aquila', 'Potenza', 'Campobasso', 'Aosta',
        'Benevento', 'Avellino', 'Caserta', 'Matera', 'Trapani', 'Siena', 'Rovigo', 'Crotone',
        'Cuneo', 'Asti', 'Biella', 'Verbano', 'Lodi', 'Cremona', 'Mantova', 'Belluno',
        // Mondo - Grandi città
        'Londra', 'Parigi', 'Berlino', 'Madrid', 'Barcellona', 'Lisbona', 'Amsterdam',
        'Bruxelles', 'Vienna', 'Praga', 'Budapest', 'Varsavia', 'Atene', 'Stoccolma',
        'Oslo', 'Copenaghen', 'Helsinki', 'Dublino', 'New York', 'Los Angeles', 'Chicago',
        'Miami', 'San Francisco', 'Toronto', 'Città del Messico', 'San Paolo', 'Buenos Aires',
        'Tokyo', 'Kyoto', 'Osaka', 'Pechino', 'Shanghai', 'Hong Kong', 'Seul', 'Bangkok',
        'Singapore', 'Sydney', 'Melbourne', 'Dubai', 'Abu Dhabi', 'Istanbul', 'Gerusalemme',
        'Mosca', 'San Pietroburgo', 'Mumbai', 'Nuova Delhi', 'Città del Capo', 'Il Cairo'
    ].filter((city, index, self) => self.indexOf(city) === index)
        .filter(city => city.toLowerCase().includes(query.toLowerCase()))
        .sort();

    const handleSelect = (city: string) => {
        onSelectCity(city);
        setQuery('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TextInput
                        style={styles.input}
                        placeholder="Cerca una città..."
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Caption style={styles.closeTxt}>Annulla</Caption>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                            <MapPin size={18} color={Theme.colors.primary} style={{ marginRight: 12 }} />
                            <Body>{item}</Body>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.list}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        marginTop: 100,
        borderTopLeftRadius: Theme.borderRadius.lg,
        borderTopRightRadius: Theme.borderRadius.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    closeBtn: {
        marginLeft: 15,
    },
    closeTxt: {
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    list: {
        padding: Theme.spacing.md,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f9f9f9',
    }
});
