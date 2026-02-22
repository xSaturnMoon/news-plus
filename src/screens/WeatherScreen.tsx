import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Dimensions, FlatList, PanResponder, Animated } from 'react-native';
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

export const WeatherScreen = () => {
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
    const scrollAnim = useRef(new Animated.Value(0)).current;

    // Track & Scroll measurement for perfect interaction
    const [trackWidth, setTrackWidth] = useState(0);
    const trackX = useRef(0);
    const thumbWidth = 45;
    const isDragging = useRef(false);

    const flatListRef = useRef<FlatList>(null);
    const hourlyScrollRef = useRef<ScrollView>(null);
    const hourlyContentWidth = useRef(0);
    const hourlyLayoutWidth = useRef(0);

    const trackRef = useRef<View>(null);

    const onTrackLayout = () => {
        // Measure the track's position on screen for accurate PanResponder mapping
        trackRef.current?.measure((x, y, w, h, px, py) => {
            if (w > 0) {
                setTrackWidth(w);
                trackX.current = px;
            }
        });
    };

    const updateScrollFromProgress = (progress: number) => {
        const totalScrollable = hourlyContentWidth.current - hourlyLayoutWidth.current;
        if (hourlyScrollRef.current && totalScrollable > 0) {
            const scrollTo = progress * totalScrollable;
            hourlyScrollRef.current.scrollTo({ x: scrollTo, animated: false });
            scrollAnim.setValue(progress);
        }
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e, gestureState) => {
                isDragging.current = true;
                const relativeX = gestureState.x0 - trackX.current;
                const maxTravel = trackWidth - thumbWidth;
                if (maxTravel > 0) {
                    const progress = Math.min(Math.max((relativeX - thumbWidth / 2) / maxTravel, 0), 1);
                    updateScrollFromProgress(progress);
                }
            },
            onPanResponderMove: (e, gestureState) => {
                const relativeX = gestureState.moveX - trackX.current;
                const maxTravel = trackWidth - thumbWidth;
                if (maxTravel > 0) {
                    const progress = Math.min(Math.max((relativeX - thumbWidth / 2) / maxTravel, 0), 1);
                    updateScrollFromProgress(progress);
                }
            },
            onPanResponderRelease: () => { isDragging.current = false; },
            onPanResponderTerminate: () => { isDragging.current = false; },
        })
    ).current;

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

    const handleDayPress = (dateKey: string, dayName: string) => {
        setSelectedDayKey(dateKey);
        setSelectedDayName(dayName);
        setDayModalVisible(true);
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
                            onPressDay={handleDayPress}
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

    const activeWeather = weatherData[locations[currentIndex]?.id];
    let selectedDayHourly = selectedDayKey && activeWeather
        ? activeWeather.allForecasts.filter(h => h.dateKey === selectedDayKey)
        : [];

    // If selecting today, filter out past hours
    const todayKey = new Date().toISOString().split('T')[0];
    if (selectedDayKey === todayKey) {
        const now = Math.floor(Date.now() / 1000);
        const currentHourStart = now - (now % 3600);
        selectedDayHourly = selectedDayHourly.filter(h => h.dt >= currentHourStart);
    }

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

            <ModalForm
                visible={dayModalVisible}
                onClose={() => {
                    setDayModalVisible(false);
                    scrollAnim.setValue(0);
                }}
                title={`Meteo ${selectedDayName}`}
            >
                <View style={styles.hourlyListContainer}>
                    <ScrollView
                        ref={hourlyScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.hourlyScroll}
                        onContentSizeChange={(w) => { hourlyContentWidth.current = w; }}
                        onLayout={(e) => { hourlyLayoutWidth.current = e.nativeEvent.layout.width; }}
                        onScroll={(e) => {
                            if (isDragging.current) return;

                            const contentOffset = e.nativeEvent.contentOffset.x;
                            const contentWidth = e.nativeEvent.contentSize.width;
                            const layoutWidth = e.nativeEvent.layoutMeasurement.width;

                            hourlyContentWidth.current = contentWidth;
                            hourlyLayoutWidth.current = layoutWidth;

                            if (contentWidth > layoutWidth) {
                                scrollAnim.setValue(Math.min(Math.max(contentOffset / (contentWidth - layoutWidth), 0), 1));
                            }
                        }}
                        scrollEventThrottle={16}
                    >
                        {selectedDayHourly.map((hour, idx) => (
                            <View key={idx} style={styles.hourCard}>
                                <Caption style={styles.hourTime}>{hour.time}</Caption>
                                <Body style={styles.hourEmoji}>{getWeatherEmoji(hour.icon)}</Body>
                                <Body style={styles.hourTemp}>{convertTemp(hour.temp)}°</Body>
                                {hour.pop > 0 && <Caption style={styles.hourPop}>{hour.pop}%</Caption>}
                            </View>
                        ))}
                    </ScrollView>

                    <View
                        ref={trackRef}
                        onLayout={onTrackLayout}
                        style={styles.scrollTrack}
                        {...panResponder.panHandlers}
                    >
                        <View style={styles.scrollTrackBg} />
                        <Animated.View
                            style={[
                                styles.scrollThumb,
                                {
                                    transform: [
                                        {
                                            translateX: scrollAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0, trackWidth > 0 ? (trackWidth - thumbWidth) : 0],
                                                extrapolate: 'clamp'
                                            })
                                        }
                                    ]
                                }
                            ]}
                        />
                    </View>

                    <View style={styles.infoRow}>
                        <Caption style={styles.infoText}>Scorri utilizzando due dita</Caption>
                    </View>
                </View>
            </ModalForm>
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
    },
    hourlyListContainer: {
        paddingVertical: Theme.spacing.md,
    },
    hourlyScroll: {
        paddingVertical: 10,
    },
    hourCard: {
        alignItems: 'center',
        backgroundColor: Theme.colors.white,
        padding: Theme.spacing.md,
        borderRadius: Theme.borderRadius.md,
        marginRight: Theme.spacing.sm,
        width: 75,
        ...Theme.shadows.light,
    },
    hourTime: {
        marginBottom: 5,
        fontWeight: 'bold',
    },
    hourEmoji: {
        fontSize: 24,
        marginVertical: 4,
    },
    hourTemp: {
        fontWeight: '600',
        fontSize: 18,
    },
    hourPop: {
        marginTop: 2,
        color: '#000000',
        fontWeight: 'bold',
    },
    infoRow: {
        marginTop: 15,
        alignItems: 'center',
    },
    infoText: {
        fontStyle: 'italic',
        opacity: 0.6,
    },
    scrollTrack: {
        height: 30,
        width: '60%',
        backgroundColor: 'transparent',
        alignSelf: 'center',
        marginTop: 5,
        justifyContent: 'center',
    },
    scrollTrackBg: {
        height: 4,
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.06)',
        borderRadius: 2,
        position: 'absolute',
    },
    scrollThumb: {
        height: 6,
        width: 45,
        backgroundColor: Theme.colors.text,
        borderRadius: 3,
    }
});
