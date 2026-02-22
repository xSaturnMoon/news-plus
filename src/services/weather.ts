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

const processForecastData = (forecastData: any, currentData?: any) => {
    const now = Math.floor(Date.now() / 1000);
    const startOfCurrentHour = now - (now % 3600);

    // Original 3-hour blocks
    let rawBlocks = forecastData.list.map((item: any) => ({
        dt: item.dt,
        temp: item.main.temp,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
        pop: Math.round(item.pop * 100),
        rain: item.rain ? item.rain['3h'] : 0,
    }));

    // Prepend current weather as the first node, but normalized to start of hour
    if (currentData) {
        const currentHourBlock = {
            dt: startOfCurrentHour,
            temp: currentData.main.temp,
            icon: currentData.weather[0].icon,
            description: currentData.weather[0].description,
            pop: rawBlocks.length > 0 ? rawBlocks[0].pop : 0,
            rain: currentData.rain ? currentData.rain['1h'] : 0,
        };

        // Remove any forecast blocks that are in the past or would overlap with "now"
        rawBlocks = rawBlocks.filter((b: any) => b.dt > startOfCurrentHour);
        rawBlocks = [currentHourBlock, ...rawBlocks];
    }

    // Interpolate to EVERY hour for the first 96 hours (to cover most of the 5-day forecast)
    let allForecasts: any[] = [];
    if (rawBlocks.length > 0) {
        for (let i = 0; i < rawBlocks.length - 1; i++) {
            const current = rawBlocks[i];
            const next = rawBlocks[i + 1];

            const secondsBetween = next.dt - current.dt;
            const hoursInGap = Math.round(secondsBetween / 3600);

            for (let h = 0; h < hoursInGap; h++) {
                const ratio = h / hoursInGap;
                const interpolatedTime = current.dt + (h * 3600);
                const date = new Date(interpolatedTime * 1000);

                allForecasts.push({
                    dt: interpolatedTime,
                    dateKey: date.toISOString().split('T')[0],
                    time: date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
                    temp: Math.round(current.temp + (next.temp - current.temp) * ratio),
                    icon: ratio < 0.5 ? current.icon : next.icon,
                    description: ratio < 0.5 ? current.description : next.description,
                    pop: Math.round(current.pop + (next.pop - current.pop) * ratio),
                    rain: current.rain,
                });
            }
        }
        // Add the very last raw block
        const last = rawBlocks[rawBlocks.length - 1];
        const lastDate = new Date(last.dt * 1000);
        allForecasts.push({
            dt: last.dt,
            dateKey: lastDate.toISOString().split('T')[0],
            time: lastDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            temp: Math.round(last.temp),
            icon: last.icon,
            description: last.description,
            pop: last.pop,
            rain: last.rain,
        });
    }

    // Ensure we start from current hour and sort (just in case)
    allForecasts = allForecasts.filter(f => f.dt >= startOfCurrentHour).sort((a, b) => a.dt - b.dt);

    // Grouping for daily summary
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

        const { allForecasts, forecastList } = processForecastData(forecastData, currentData);

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
