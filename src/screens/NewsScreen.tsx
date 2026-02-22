import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import * as newsService from '../services/news';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Search, X } from 'lucide-react-native';

export const NewsScreen = () => {
    const [news, setNews] = useState<newsService.NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async (query?: string) => {
        if (!refreshing) setLoading(true);
        const apiKey = await AsyncStorage.getItem('news_api_key') || '';
        const data = await newsService.fetchNews(apiKey, query);
        setNews(data);
        setLoading(false);
        setRefreshing(false);
    };

    const handleSearch = () => {
        loadNews(searchQuery);
        setIsSearching(true);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        loadNews();
    };

    const handleOpenNews = async (url: string) => {
        await WebBrowser.openBrowserAsync(url);
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadNews(isSearching ? searchQuery : undefined);
    }, [isSearching, searchQuery]);

    const renderItem = ({ item }: { item: newsService.NewsItem }) => (
        <CardSoft style={styles.newsCard}>
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
            )}
            <View style={styles.content}>
                <View style={styles.metaContainer}>
                    <Caption style={styles.source}>{item.source.toUpperCase()}</Caption>
                    <Caption style={styles.date}>{item.date}</Caption>
                </View>
                <SubHeader style={styles.title}>{item.title}</SubHeader>
                <Body numberOfLines={3} style={styles.excerpt}>{item.excerpt}</Body>

                <ButtonSoft
                    title="Leggi di più"
                    onPress={() => handleOpenNews(item.url)}
                    variant="secondary"
                    style={styles.readMore}
                />
            </View>
        </CardSoft>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Search color={Theme.colors.textLight} size={20} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Cerca notizie..."
                        placeholderTextColor={Theme.colors.textLight + '80'}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <X color={Theme.colors.textLight} size={20} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Theme.colors.textLight} />
                </View>
            ) : (
                <FlatList
                    data={news}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Body>Nessuna notizia trovata.</Body>
                            {isSearching && (
                                <ButtonSoft
                                    title="Torna alle principali"
                                    onPress={clearSearch}
                                    style={{ marginTop: Theme.spacing.md }}
                                />
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    searchContainer: {
        padding: Theme.spacing.md,
        backgroundColor: Theme.colors.background,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.colors.card,
        borderRadius: Theme.borderRadius.sm,
        paddingHorizontal: Theme.spacing.sm,
        height: 48,
        ...Theme.shadows.light,
    },
    searchIcon: {
        marginRight: Theme.spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.colors.text,
        height: '100%',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: Theme.spacing.md,
        paddingTop: 0,
    },
    newsCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: Theme.spacing.lg,
    },
    image: {
        width: '100%',
        height: 200,
        backgroundColor: Theme.colors.border,
    },
    content: {
        padding: Theme.spacing.md,
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    source: {
        color: Theme.colors.textLight,
        fontWeight: 'bold',
        fontSize: 13,
    },
    date: {
        color: Theme.colors.textLight,
        fontSize: 13,
    },
    title: {
        fontSize: 19,
        lineHeight: 24,
        marginBottom: Theme.spacing.sm,
    },
    excerpt: {
        fontSize: 15,
        lineHeight: 21,
        marginBottom: Theme.spacing.md,
        color: Theme.colors.text,
        opacity: 0.8,
    },
    readMore: {
        alignSelf: 'flex-start',
        minHeight: 40,
        paddingVertical: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
});