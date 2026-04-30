import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, Keyboard, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import * as newsService from '../services/news';
import * as WebBrowser from 'expo-web-browser';
import { Search, X } from 'lucide-react-native';

export const NewsScreen = () => {
    const { theme } = useTheme();
    const [news, setNews] = useState<newsService.NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadInitialNews();
    }, []);

    const loadInitialNews = async () => {
        try {
            setLoading(true);
            const data = await newsService.fetchNews();
            setNews(data);
            setIsSearching(false);
        } catch (error) {
            console.error('Failed to load news', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setLoading(true);
            const data = await newsService.fetchNews(undefined, searchQuery);
            setNews(data);
            setIsSearching(true);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        loadInitialNews();
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await newsService.fetchNews(undefined, isSearching ? searchQuery : undefined)
            .then(setNews)
            .catch(console.error)
            .finally(() => setRefreshing(false));
    }, [isSearching, searchQuery]);

    const renderItem = ({ item }: { item: newsService.NewsItem }) => (
        <CardSoft style={styles.newsCard}>
            <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(item.url)} activeOpacity={0.8}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                ) : null}
                <View style={{ padding: 15 }}>
                    <Caption style={{ marginBottom: 5 }}>{item.source} • {item.date}</Caption>
                    <SubHeader style={styles.title} numberOfLines={2}>{item.title}</SubHeader>
                    {item.excerpt ? (
                        <Body style={styles.excerpt} numberOfLines={3}>{item.excerpt}</Body>
                    ) : null}
                    <ButtonSoft 
                        title="Leggi di più" 
                        onPress={() => WebBrowser.openBrowserAsync(item.url)} 
                        variant="outline" 
                        style={styles.readMore}
                    />
                </View>
            </TouchableOpacity>
        </CardSoft>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
                <Header style={styles.screenTitle}>Notizie</Header>
                
                <View style={[styles.searchContainer, { backgroundColor: theme.colors.background }]}>
                    <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                        <Search color={theme.colors.textLight} size={18} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Cerca notizie..."
                            placeholderTextColor={theme.colors.textLight + '80'}
                            onSubmitEditing={handleSearch}
                            returnKeyType="search"
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={clearSearch}>
                                <X color={theme.colors.textLight} size={20} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={news}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.list}
                        keyboardShouldPersistTaps="handled"
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Body>Nessuna notizia trovata.</Body>
                                {isSearching && (
                                    <ButtonSoft
                                        title="Torna alle principali"
                                        onPress={clearSearch}
                                        style={{ marginTop: 20 }}
                                    />
                                )}
                            </View>
                        }
                    />
                )}
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    screenTitle: { paddingHorizontal: 20, paddingTop: 10 },
    searchContainer: { padding: 20 },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20, paddingTop: 0, paddingBottom: 140 },
    newsCard: { padding: 0, overflow: 'hidden', marginBottom: 20 },
    image: { width: '100%', height: 200 },
    title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    excerpt: { fontSize: 14, lineHeight: 20, marginBottom: 15, opacity: 0.7 },
    readMore: { alignSelf: 'flex-start', minHeight: 40, paddingHorizontal: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
});