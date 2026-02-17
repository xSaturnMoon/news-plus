import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { Theme } from '../theme';
import { Header, Body, SubHeader, Caption } from '../components/Typography';
import * as weatherService from '../services/weather';
import * as locationStorage from '../services/locationStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search } from 'lucide-react-native';
import { WeatherBackground } from '../components/weather/WeatherBackground';
import { HourlyForecast } from '../components/weather/HourlyForecast';
import { DailyForecast } from '../components/weather/DailyForecast';
import { WeatherDetails } from '../components/weather/WeatherDetails';
import { CitySearchModal } from '../components/weather/CitySearchModal';
import { ButtonSoft } from '../components/ButtonSoft';

const { width } = Dimensions.get('window');

const getWeatherEmoji = (icon: string) => {
    const map: Record<string, string> = {
        '01d': '☀️', '01n': '🌙',
        '02d': '⛅', '02n': '☁️',
        '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️',
        '09d': '🌦️', '09n': '🌧️',
        '10d': '🌦️', '10n': '🌧️',
        '11d': '🌩️', '11n': '🌩️',
        '13d': '❄️', '13n': '❄️',
        '50d': '🌫️', '50n': '🌫️',
    };
    return map[icon] || '🌤️';
};

export const WeatherScreen = () => {
    const [locations, setLocations] = useState<locationStorage.LocationInfo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [weatherData, setWeatherData] = useState<Record<string, weatherService.WeatherData>>({});
    const [isCelsius, setIsCelsius] = useState(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        const saved = await locationStorage.getSavedLocations();
        setLocations(saved);
        await loadAllWeather(saved);
        setLoading(false);
    };

    const loadAllWeather = async (locs: locationStorage.LocationInfo[]) => {
        const apiKey = await AsyncStorage.getItem('weather_api_key') || '';
        const newData: Record<string, weatherService.WeatherData> = { ...weatherData };

        for (const loc of locs) {
            if (!newData[loc.id] || refreshing) {
                let data: weatherService.WeatherData | null = null;
                if (loc.isCurrentLocation) {
                    data = await weatherService.fetchWeather(apiKey);
                } else if (loc.cityName) {
                    data = await weatherService.fetchWeatherByCity(loc.cityName, apiKey);
                }
                if (data) {
                    newData[loc.id] = data;
                }
            }
        }
        setWeatherData(newData);
    };

    const handleAddCity = async (cityName: string) => {
        const newLoc: locationStorage.LocationInfo = {
            id: Date.now().toString(),
            cityName,
            isCurrentLocation: false
        };
        await locationStorage.saveLocation(newLoc);
        const updatedLocs = await locationStorage.getSavedLocations();
        setLocations(updatedLocs);
        await loadAllWeather(updatedLocs);

        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: updatedLocs.length - 1, animated: true });
            setCurrentIndex(updatedLocs.length - 1);
        }, 300);
    };

    const handleDeleteCity = async (id: string) => {
        await locationStorage.removeLocation(id);
        const updatedLocs = await locationStorage.getSavedLocations();
        if (updatedLocs.length === 0) return;

        setLocations(updatedLocs);
        let newIndex = currentIndex;
        if (newIndex >= updatedLocs.length) {
            newIndex = Math.max(0, updatedLocs.length - 1);
        }
        setCurrentIndex(newIndex);

        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: newIndex, animated: true });
        }, 300);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAllWeather(locations);
        setRefreshing(false);
    };

    const toggleUnits = () => setIsCelsius(!isCelsius);

    const convertTemp = (temp: number): string => {
        const t = isCelsius ? temp : (temp * 9 / 5) + 32;
        return String(Math.round(t));
    };

    const onMomentumScrollEnd = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        if (index !== currentIndex && index >= 0 && index < locations.length) {
            setCurrentIndex(index);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
            </View>
        );
    }

    const renderWeatherPage = ({ item: loc }: { item: locationStorage.LocationInfo }) => {
        const weather = weatherData[loc.id];
        if (!weather) {
            return (
                <View style={[styles.page, styles.center]}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            );
        }

        return (
            <View style={styles.page}>
                <WeatherBackground condition={weather.current.description}>
                    <ScrollView
                        style={styles.content}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.colors.primary} />}
                    >
                        {/* HEADER INTERNO ALLO SCROLL - Scorre via con il resto */}
                        <View style={styles.topBar}>
                            <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.iconBtn}>
                                <Search size={22} color={Theme.colors.text} />
                            </TouchableOpacity>

                            <View style={styles.dotsContainer}>
                                <View style={styles.pagination}>
                                    {locations.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.dot,
                                                i === currentIndex && styles.activeDot
                                            ]}
                                        />
                                    ))}
                                </View>
                            </View>

                            <TouchableOpacity onPress={toggleUnits} style={styles.iconBtn}>
                                <Header style={styles.unitToggle}>{isCelsius ? '°C' : '°F'}</Header>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.mainInfo}>
                            <Header style={styles.cityName}>{String(weather.city)}</Header>
                            <Header style={styles.mainTemp}>{`${convertTemp(weather.current.temp)}°`}</Header>
                            <SubHeader style={styles.condition}>{String(weather.current.description)}</SubHeader>
                            <View style={styles.minMaxRow}>
                                <Body style={styles.minMax}>{`MAX: ${convertTemp(weather.forecast[0].tempMax)}°`}</Body>
                                <Body style={styles.minMax}>{` MIN: ${convertTemp(weather.forecast[0].tempMin)}°`}</Body>
                            </View>
                        </View>

                        <HourlyForecast
                            data={weather.allForecasts.slice(0, 24).map(h => ({
                                ...h,
                                temp: Math.round(isCelsius ? h.temp : (h.temp * 9 / 5) + 32)
                            }))}
                            getWeatherEmoji={getWeatherEmoji}
                        />

                        <DailyForecast
                            data={weather.forecast.map(d => ({
                                ...d,
                                tempMin: Math.round(isCelsius ? d.tempMin : (d.tempMin * 9 / 5) + 32),
                                tempMax: Math.round(isCelsius ? d.tempMax : (d.tempMax * 9 / 5) + 32)
                            }))}
                            getWeatherEmoji={getWeatherEmoji}
                        />

                        <WeatherDetails current={{
                            ...weather.current,
                            feelsLike: Math.round(isCelsius ? weather.current.feelsLike : (weather.current.feelsLike * 9 / 5) + 32)
                        }} />

                        {!loc.isCurrentLocation && (
                            <View style={styles.deleteSection}>
                                <ButtonSoft
                                    title="Elimina Città"
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteCity(loc.id)}
                                />
                            </View>
                        )}

                        <View style={{ height: 100 }} />
                    </ScrollView>
                </WeatherBackground>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={renderWeatherPage}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                scrollEventThrottle={16}
                extraData={weatherData}
                style={styles.flatList}
            />

            <CitySearchModal
                visible={searchVisible}
                onClose={() => setSearchVisible(false)}
                onSelectCity={handleAddCity}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    flatList: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        paddingBottom: 20,
    },
    dotsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.15)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: Theme.colors.text,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    iconBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unitToggle: {
        color: Theme.colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    page: {
        width: width,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Theme.spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.colors.background,
    },
    mainInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    cityName: {
        fontSize: 34,
        fontWeight: '600',
    },
    mainTemp: {
        fontSize: 90,
        fontWeight: '200',
        marginVertical: -10,
    },
    condition: {
        fontSize: 20,
        textTransform: 'capitalize',
        opacity: 0.7,
    },
    minMaxRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    minMax: {
        fontSize: 16,
        fontWeight: '600',
    },
    deleteSection: {
        marginTop: 20,
        alignItems: 'center',
    },
    deleteBtn: {
        width: '100%',
    }
});
