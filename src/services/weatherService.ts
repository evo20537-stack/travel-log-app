
// src/services/weatherService.ts
import { WeatherDay } from '../types';

/**
 * WeatherCode 對應到我們自訂天氣圖示的轉換函式
 * @param code 來自 Open-Meteo API 的 Weather Code (WMO code)
 * @returns 我們 App 使用的圖示字串 ('sunny', 'cloudy', 'rainy', 'snowy')
 */
const convertWeatherCodeToIcon = (code: number): 'sunny' | 'cloudy' | 'rainy' | 'snowy' => {
  // 參考 WMO Weather interpretation codes (WW)
  if (code === 0) return 'sunny'; // Clear sky
  if (code >= 1 && code <= 3) return 'cloudy'; // Mainly clear, partly cloudy, and overcast
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'; // Drizzle, Rain, Rain showers
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy'; // Snowfall, Snow showers
  // 其他較複雜天氣（霧、雷暴等）暫時簡化分類
  if (code >= 45 && code <= 48) return 'cloudy'; // Fog
  if (code >= 95 && code <= 99) return 'rainy'; // Thunderstorm
  
  return 'sunny'; // 預設為晴天
};

/**
 * 根據經緯度，向 Open-Meteo API 獲取未來 7 天的天氣預報
 * @param latitude 緯度
 * @param longitude 經度
 * @returns 包含 7 天天氣預報的陣列
 */
export const getWeatherForecastByCoords = async (latitude: number, longitude: number): Promise<WeatherDay[]> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;

  try {
    console.log(`🌦️ 正在向 Open-Meteo 查詢座標 (${latitude.toFixed(2)}, ${longitude.toFixed(2)}) 的天氣...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.daily || !data.daily.time || !data.daily.weathercode || !data.daily.temperature_2m_max) {
      throw new Error('從 Open-Meteo API 收到的資料格式無效');
    }

    const forecast: WeatherDay[] = data.daily.time.map((dateString: string, index: number) => {
      const date = new Date(dateString);
      const dayOfWeek = index === 0 ? '今天' : new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date).replace('週','');
      const temp = Math.round((data.daily.temperature_2m_max[index] + data.daily.temperature_2m_min[index]) / 2);
      const code = data.daily.weathercode[index];
      const icon = convertWeatherCodeToIcon(code);
      
      return {
        date: dayOfWeek,
        temp: temp,
        condition: '-', // Open-Meteo 不直接提供文字描述，暫時留空
        icon: icon,
      };
    });

    console.log(`✅ Open-Meteo 天氣資料獲取成功`);
    return forecast.slice(0, 7); // 確保只回傳 7 天

  } catch (error) {
    console.error("❌ Open-Meteo 天氣查詢失敗:", error);
    return []; // 失敗時回傳空陣列
  }
};
