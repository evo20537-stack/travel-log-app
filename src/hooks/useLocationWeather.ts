
// src/hooks/useLocationWeather.ts
import { useState, useEffect, useCallback } from 'react';
import { WeatherDay } from '../types';
import {
  getCurrentPosition,
  getWeatherForecastByCoords,
  getLocationNameByCoords,
} from '../services/weatherService';

interface LocationWeatherResult {
  weatherData: WeatherDay[];
  locationName: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLocationWeather = (): LocationWeatherResult => {
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [locationName, setLocationName] = useState('---,---');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLocationName('正在定位...');

    try {
      const { latitude, longitude } = await getCurrentPosition();

      // 平行處理，同時獲取天氣預報和地點名稱
      const [forecast, name] = await Promise.all([
        getWeatherForecastByCoords(latitude, longitude),
        getLocationNameByCoords(latitude, longitude),
      ]);

      setWeatherData(forecast);
      setLocationName(name || '目前位置');

    } catch (err: any) {
      console.error("Weather fetch process failed:", err);
      let errorMessage = '載入天氣失敗';
      if (err.message.includes('denied')) {
        errorMessage = '您已拒絕位置授權';
      } else if (err.message.includes('not support')) {
          errorMessage = '瀏覽器不支援定位';
      }
      setError(errorMessage);
      setLocationName('無法取得位置');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { weatherData, locationName, isLoading, error, refetch: fetchWeather };
};
