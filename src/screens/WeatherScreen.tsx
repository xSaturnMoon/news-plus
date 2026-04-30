import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, useAnimatedScrollHandler, interpolate, interpolateColor, Extrapolation } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
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
import { ModalForm } from '../components/ModalForm';

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

const PaginationDot = ({ index, scrollX, color, inactiveColor }: { index: number, scrollX: Animated.SharedValue<number>, color: string, inactiveColor: string }) => {
    const animatedStyle = useAnimatedStyle(() => {
        const widthVal = interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [8, 24, 8],
            Extrapolation.CLAMP
        );
        const bgColor = interpolateColor(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [inactiveColor, color, inactiveColor]
        );
        return {
            width: widthVal,
            backgroundColor: bgColor,
        };
    }, [index, scrollX, color, inactiveColor]);

    return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const WeatherScreen = () => {
    const { theme, mode } = useTheme();
    const [locations, setLocations] = useState<locationStorage.LocationInfo[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [weatherData, setWeatherData] = useState<Record<string, weatherService.WeatherData>>({});
    const [isCelsius, setIsCelsius] = useState(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const [dayModalVisible, setDayModalVisible] = useState(false);
    const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
    const [selectedDayName, setSelectedDayName] = useState('');
    const flatListRef = useRef<Animated.FlatList<any>>(null);

    const scrollX = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        const saved = await locationStorage.getSavedLocations();
        setLocations(saved);
        // Bug #8: clamp index so it never points out of bounds after a deletion
        setCurrentIndex(prev => Math.min(prev, Math.max(0, saved.length - 1)));
        await loadAllWeather(saved, false);
        setLoading(false);
    };

    // Bug #4: accept forceRefresh param to avoid stale closure on `refreshing` state
    const loadAllWeather = async (locs: locationStorage.LocationInfo[], forceRefresh = false) => {
        const apiKey = await AsyncStorage.getItem('weather_api_key') || '';
        const newData: Record<string, weatherService.WeatherData> = { ...weatherData };
        for (const loc of locs) {
            if (!newData[loc.id] || forceRefresh) {
                let data: weatherService.WeatherData | null = null;
                if (loc.isCurrentLocation) data = await weatherService.fetchWeather(apiKey);
                else if (loc.cityName) data = await weatherService.fetchWeatherByCity(loc.cityName, apiKey);
                if (data) newData[loc.id] = data;
            }
        }
        setWeatherData(newData);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Bug #4: pass forceRefresh=true so all cities are always re-fetched on pull-to-refresh
        await loadAllWeather(locations, true);
        setRefreshing(false);
    };

    const convertTemp = (temp: number): string => {
        const t = isCelsius ? temp : (temp * 9 / 5) + 32;
        return String(Math.round(t));
    };

    const onMomentumScrollEnd = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const index = Math.round(x / width);
        if (index !== currentIndex && index >= 0 && index < locations.length) setCurrentIndex(index);
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    const renderWeatherPage = ({ item: loc }: { item: locationStorage.LocationInfo }) => {
        const weather = weatherData[loc.id];
        if (!weather) return <View style={styles.page}><ActivityIndicator color={theme.colors.primary} /></View>;

        const isLight = mode === 'light';
        const dynamicTextColor = isLight ? '#1A1A1E' : '#FFFFFF';
        const dynamicOverlayColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';

        return (
            <View style={styles.page}>
                <ScrollView
                    style={styles.content}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={dynamicTextColor} />}
                    >
                        <View style={styles.mainInfo}>
                            <Header style={[styles.cityName, { color: dynamicTextColor }]}>{weather.city}</Header>
                            <Header style={[styles.mainTemp, { color: dynamicTextColor }]}>{`${convertTemp(weather.current.temp)}°`}</Header>
                            <SubHeader style={[styles.condition, { color: isLight ? theme.colors.textLight : 'rgba(255,255,255,0.7)' }]}>{weather.current.description.toUpperCase()}</SubHeader>
                        {/* Bug #1: guard against empty forecast array */}
                        {weather.forecast.length > 0 && (
                            <View style={[styles.minMaxRow, { backgroundColor: dynamicOverlayColor, borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }]}>
                                <Body style={[styles.minMax, { color: dynamicTextColor }]}>{`MAX: ${convertTemp(weather.forecast[0].tempMax)}°  MIN: ${convertTemp(weather.forecast[0].tempMin)}°`}</Body>
                            </View>
                        )}
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
                            onPressDay={(k, n) => { setSelectedDayKey(k); setSelectedDayName(n); setDayModalVisible(true); }}
                        />

                        <WeatherDetails current={weather.current} />

                        {!loc.isCurrentLocation && (
                            <View style={styles.deleteSection}>
                                <ButtonSoft title="Elimina Città" variant="outline" onPress={() => { locationStorage.removeLocation(loc.id).then(init); }} />
                            </View>
                        )}
                        <View style={{ height: 120 }} />
                    </ScrollView>
            </View>
        );
    };

    const currentLoc = locations[currentIndex];
    const currentCondition = currentLoc && weatherData[currentLoc.id] ? weatherData[currentLoc.id].current.description : '';
    const isLight = mode === 'light';
    const dynamicTextColor = isLight ? '#1A1A1E' : '#FFFFFF';
    const dynamicOverlayColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)';

    return (
        <WeatherBackground condition={currentCondition}>
            <View style={styles.container}>
                <View style={{ paddingHorizontal: 20 }}>
                    <Header style={[styles.screenTitle, { color: dynamicTextColor }]}>Meteo</Header>
                    
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => setSearchVisible(true)} style={[styles.iconBtn, { backgroundColor: dynamicOverlayColor }]}>
                            <Search size={22} color={dynamicTextColor} />
                        </TouchableOpacity>

                        <View style={styles.pagination}>
                            {locations.map((_, i) => (
                                <PaginationDot 
                                    key={i} 
                                    index={i}
                                    scrollX={scrollX}
                                    color={theme.colors.primary} 
                                    inactiveColor={dynamicTextColor + '40'} 
                                />
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setIsCelsius(!isCelsius)} style={[styles.iconBtn, { backgroundColor: dynamicOverlayColor }]}>
                            <Body style={[styles.unitToggle, { color: dynamicTextColor }]}>{isCelsius ? '°C' : '°F'}</Body>
                        </TouchableOpacity>
                    </View>
                </View>

                <Animated.FlatList
                ref={flatListRef}
                data={locations}
                keyExtractor={(item) => item.id}
                renderItem={renderWeatherPage}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
            />
            <CitySearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} onSelectCity={cityName => { locationStorage.saveLocation({ id: Date.now().toString(), cityName, isCurrentLocation: false }).then(init); setSearchVisible(false); }} />

            {/* Day Details Modal */}
            <ModalForm
                visible={dayModalVisible}
                onClose={() => setDayModalVisible(false)}
                title={selectedDayName}
            >
                {(() => {
                    if (!selectedDayKey || locations.length === 0) return null;
                    const loc = locations[currentIndex];
                    if (!loc) return null;
                    const weather = weatherData[loc.id];
                    if (!weather) return null;

                    const dayForecasts = weather.allForecasts.filter(f => f.dateKey === selectedDayKey);
                    
                    if (dayForecasts.length === 0) {
                        return <Body style={{textAlign: 'center', opacity: 0.5, marginTop: 20}}>Dati orari non disponibili per questa giornata.</Body>;
                    }

                    return (
                        <View style={{ marginTop: 10 }}>
                            <HourlyForecast 
                                data={dayForecasts.map(h => ({
                                    ...h,
                                    temp: Math.round(isCelsius ? h.temp : (h.temp * 9 / 5) + 32)
                                }))}
                                getWeatherEmoji={getWeatherEmoji}
                            />
                        </View>
                    );
                })()}
            </ModalForm>
            </View>
        </WeatherBackground>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    page: { width: width, flex: 1 },
    content: { flex: 1 },
    screenTitle: { marginTop: 10 },
    scrollContent: { paddingHorizontal: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 20 },
    pagination: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
    activeDot: { width: 24 },
    iconBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
    unitToggle: { fontSize: 16, fontWeight: '900' },
    mainInfo: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    cityName: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
    mainTemp: { fontSize: 100, fontWeight: '200', marginVertical: -10 },
    condition: { fontSize: 20, fontWeight: '700', letterSpacing: 1 },
    minMaxRow: { flexDirection: 'row', marginTop: 15, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 25, borderWidth: 1 },
    minMax: { fontSize: 15, fontWeight: '800' },
    deleteSection: { marginTop: 30, paddingHorizontal: 20 },
});
