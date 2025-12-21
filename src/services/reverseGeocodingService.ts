
// src/services/reverseGeocodingService.ts

/**
 * 使用 Open-Meteo 的免費地理編碼 API，將經緯度座標反向轉換為地點名稱。
 * @param latitude 緯度
 * @param longitude 經度
 * @returns 回傳地點名稱的字串，例如 "台北市, 中正區"。如果找不到則回傳 null。
 */
export const getLocationNameByCoords = async (latitude: number, longitude: number): Promise<string | null> => {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=zh_TW`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Reverse Geocoding API request failed with status ${response.status}`);
    }
    const data = await response.json();

    // API 可能回傳 name, admin1, admin2, etc.
    // 我們組合出一個合理的地名，例如 "城市, 區域"
    if (data && data.name) {
      const locationParts = [data.admin1, data.name].filter(Boolean); // 過濾掉 null 或 undefined 的部分
      if (locationParts.length > 0) {
        console.log(`📍 反向地理編碼成功: (${latitude.toFixed(2)}, ${longitude.toFixed(2)}) -> ${locationParts.join(', ')}`);
        return locationParts.join(', ');
      }
    }
    return null; // 如果沒有回傳有效的地名部分

  } catch (error) {
    console.error("❌ 反向地理編碼失敗:", error);
    return null;
  }
};
