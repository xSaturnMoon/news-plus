import * as Location from 'expo-location';

const DEFAULT_API_KEY = '606a5e4cabb222a23f2ed9cd0905584c';

export interface WeatherData {
    city: string;
    current: {
        temp: number;
        description: string;
        icon: string;
        humidity: number;
        windSpeed: number;
        feelsLike: number;
        pop: number; // probability of precipitation
        rain?: number; // mm
        pressure: number;
        visibility: number;
        uvIndex?: number;
    };
    allForecasts: Array<{
        dt: number;
        dateKey: string; // YYYY-MM-DD for matching
        time: string;
        temp: number;
        icon: string;
        description: string;
        pop: number;
        rain?: number;
    }>;
    forecast: Array<{
        date: string; // Full weekday name
        dateKey: string; // YYYY-MM-DD for matching
        tempMin: number;
        tempMax: number;
        icon: string;
        description: string;
        popMax: number;
    }>;
}

const processForecastData = (forecastData: any) => {
    // Original 3-hour blocks
    const rawBlocks = forecastData.list.map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        pop: Math.round(item.pop * 100),
        rain: item.rain ? item.rain['3h'] : 0,
    }));

    // Interpolate to every hour for the first 48 hours
    const allForecasts: any[] = [];
    if (rawBlocks.length > 0) {
        for (let i = 0; i < rawBlocks.length - 1; i++) {
            const current = rawBlocks[i];
            const next = rawBlocks[i + 1];

            // Add the 3 hours between blocks
            for (let h = 0; h < 3; h++) {
                const ratio = h / 3;
                const interpolatedTime = current.dt + (h * 3600);
                const date = new Date(interpolatedTime * 1000);

                allForecasts.push({
                    dt: interpolatedTime,
                    dateKey: date.toISOString().split('T')[0],
                    time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                    temp: Math.round(current.temp + (next.temp - current.temp) * ratio),
                    icon: h < 2 ? current.icon : next.icon, // Transition icon halfway
                    description: h < 2 ? current.description : next.description,
                    pop: Math.round(current.pop + (next.pop - current.pop) * ratio),
                    rain: current.rain,
                });
            }
        }
    }

    // Grouping for daily summary (using the raw hourly data for accuracy)
    const dailyGroups: any = {};
    allForecasts.forEach((item: any) => {
        if (!dailyGroups[item.dateKey]) {
            dailyGroups[item.dateKey] = {
                date: new Date(item.dt * 1000).toLocaleDateString('it-IT', { weekday: 'long' }),
                dateKey: item.dateKey,
                tempMin: item.temp,
                tempMax: item.temp,
                icon: item.icon,
                description: item.description,
                popMax: item.pop,
            };
        } else {
            dailyGroups[item.dateKey].tempMin = Math.min(dailyGroups[item.dateKey].tempMin, item.temp);
            dailyGroups[item.dateKey].tempMax = Math.max(dailyGroups[item.dateKey].tempMax, item.temp);
            dailyGroups[item.dateKey].popMax = Math.max(dailyGroups[item.dateKey].popMax, item.pop);
        }
    });

    const forecastList = Object.values(dailyGroups) as WeatherData['forecast'];
    return { allForecasts, forecastList };
};

export const fetchWeatherByCoords = async (latitude: number, longitude: number, apiKey: string): Promise<WeatherData | null> => {
    try {
        const key = apiKey || DEFAULT_API_KEY;
        if (!key) return null;

        // Fetch current weather
        const currentRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${key}&lang=it`
        );

        // Fetch 5-day forecast
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${key}&lang=it`
        );

        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error('Weather API failed');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        const { allForecasts, forecastList } = processForecastData(forecastData);

        return {
            city: currentData.name,
            current: {
                temp: Math.round(currentData.main.temp),
                description: currentData.weather[0].description,
                icon: currentData.weather[0].icon,
                humidity: currentData.main.humidity,
                windSpeed: Math.round(currentData.wind.speed * 3.6),
                feelsLike: Math.round(currentData.main.feels_like),
                pop: Math.round((forecastData.list[0].pop || 0) * 100),
                rain: currentData.rain ? currentData.rain['1h'] : 0,
                pressure: currentData.main.pressure,
                visibility: currentData.visibility,
            },
            allForecasts,
            forecast: forecastList,
        };
    } catch (error) {
        console.error('Weather service error:', error);
        return null;
    }
};

export const fetchWeather = async (apiKey: string): Promise<WeatherData | null> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return null;

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        return fetchWeatherByCoords(latitude, longitude, apiKey);
    } catch (error) {
        console.error('Location service error:', error);
        return null;
    }
};

export const fetchWeatherByCity = async (cityName: string, apiKey: string): Promise<WeatherData | null> => {
    try {
        const key = apiKey || DEFAULT_API_KEY;
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${key}`
        );
        const geoData = await geoRes.json();

        if (geoData && geoData.length > 0) {
            const { lat, lon } = geoData[0];
            return fetchWeatherByCoords(lat, lon, apiKey);
        }
        return null;
    } catch (error) {
        console.error('City search error:', error);
        return null;
    }
};
