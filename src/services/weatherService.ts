
// src/services/weatherService.ts
import { WeatherDay } from '../types';

/**
 * WeatherCode 對應到我們自訂天氣圖示的轉換函式
 */
const convertWeatherCodeToIcon = (code: number): 'sunny' | 'cloudy' | 'rainy' | 'snowy' => {
  if (code === 0) return 'sunny'; // Clear sky
  if (code >= 1 && code <= 3) return 'cloudy'; // Mainly clear, partly cloudy, and overcast
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy'; // Drizzle, Rain, Rain showers
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy'; // Snowfall, Snow showers
  if (code >= 45 && code <= 48) return 'cloudy'; // Fog
  if (code >= 95 && code <= 99) return 'rainy'; // Thunderstorm
  return 'sunny';
};

/**
 * WeatherCode 對應到中文天氣描述的轉換函式
 */
const convertWeatherCodeToDescription = (code: number): string => {
  const codeMap: { [key: number]: string } = {
    0: '晴空萬里',
    1: '大致晴朗',
    2: '部分多雲',
    3: '陰天',
    45: '起霧',
    48: '霜霧',
    51: '毛毛雨',
    53: '毛毛雨',
    55: '毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    80: '短暫陣雨',
    81: '陣雨',
    82: '強陣雨',
    95: '雷陣雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    85: '陣雪',
    86: '強陣雪',
  };
  return codeMap[code] || '未知';
};


/**
 * 根據經緯度，向 Open-Meteo API 獲取未來 7 天的天氣預報
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
      const temp_max = Math.round(data.daily.temperature_2m_max[index]);
      const temp_min = Math.round(data.daily.temperature_2m_min[index]);
      const code = data.daily.weathercode[index];
      const icon = convertWeatherCodeToIcon(code);
      const description = convertWeatherCodeToDescription(code);

      return {
        date: dayOfWeek,
        temp_max,
        temp_min,
        description,
        icon,
      };
    });

    console.log(`✅ Open-Meteo 天氣資料獲取成功`);
    return forecast.slice(0, 7); // 確保只回傳 7 天

  } catch (error) {
    console.error("❌ Open-Meteo 天氣查詢失敗:", error);
    return []; // 失敗時回傳空陣列
  }
};

/**
 * 透過瀏覽器的 Geolocation API 獲取使用者當前的 GPS 座標
 * @returns 包含緯度和經度的 Promise
 */
export const getCurrentPosition = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('您的瀏覽器不支援地理位置功能。'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(`🌍 已成功獲取 GPS 位置`);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error(`無法獲取地理位置: ${error.message}`);
        reject(error);
      }
    );
  });
};


/**
 * [新增] 根據經緯度，反向查詢地點名稱
 * 我們將使用一個免費的開放 API (Nominatim)
 */
export const getLocationNameByCoords = async (latitude: number, longitude: number): Promise<string> => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh-TW`;

    try {
        console.log(`🗺️ 正在反向查詢地點名稱...`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Nominatim API request failed with status ${response.status}`);
        }
        const data = await response.json();
        // 優先順序：city > town > county
        const locationName = data.address.city || data.address.town || data.address.county || '未知地點';
        console.log(`✅ 地點名稱查詢成功: ${locationName}`);
        return locationName;
    } catch (error) {
        console.error("❌ 地點名稱查詢失敗:", error);
        return "您的所在位置"; // 失敗時的回退顯示
    }
};
