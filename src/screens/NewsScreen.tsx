import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import { CardSoft } from '../components/CardSoft';
import { ButtonSoft } from '../components/ButtonSoft';
import * as newsService from '../services/news';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';

export const NewsScreen = () => {
    const [news, setNews] = useState<newsService.NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        setLoading(true);
        const apiKey = await AsyncStorage.getItem('news_api_key') || '';
        const data = await newsService.fetchNews(apiKey);
        setNews(data);
        setLoading(false);
    };

    const handleOpenNews = async (url: string) => {
        await WebBrowser.openBrowserAsync(url);
    };

    const renderItem = ({ item }: { item: newsService.NewsItem }) => (
        <CardSoft style={styles.newsCard}>
            {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
            )}
            <View style={styles.content}>
                <Caption style={styles.source}>{item.source.toUpperCase()} • {item.date}</Caption>
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

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={news}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Body>Nessuna notizia trovata.</Body>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: Theme.spacing.md,
    },
    newsCard: {
        padding: 0,
        overflow: 'hidden',
        marginBottom: Theme.spacing.lg,
    },
    image: {
        width: '100%',
        height: 200,
    },
    content: {
        padding: Theme.spacing.md,
    },
    source: {
        marginBottom: 4,
        color: Theme.colors.primary,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 20,
        marginBottom: Theme.spacing.sm,
    },
    excerpt: {
        marginBottom: Theme.spacing.md,
    },
    readMore: {
        alignSelf: 'flex-start',
        minHeight: 40,
        paddingVertical: 8,
    },
});
