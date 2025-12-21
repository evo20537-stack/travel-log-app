
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { WeatherDay } from "../types";

interface WeatherResult {
  days: WeatherDay[];
  sources: any[];
  locationName: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
let genAI: GoogleGenerativeAI | undefined;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  console.warn("⚠️ 未偵測到 Gemini API Key，天氣預報將會使用模擬資料。");
}

const getMockData = (location: string): WeatherResult => {
  console.log("-> 使用模擬天氣資料");
  return {
    days: [
      { date: '今天', temp: 28, condition: '晴時多雲', icon: 'sunny' },
      { date: '明天', temp: 22, condition: '多雲', icon: 'cloudy' },
      { date: '後天', temp: 19, condition: '短暫雨', icon: 'rainy' },
    ],
    sources: [{ web: { title: "Mock Data", uri: "#" }}],
    locationName: location,
  };
};

/**
 * 獲取天氣預報的終極整合函式。
 * 它接收一個地點名稱，並完全信任 Gemini 的能力來獲取天氣資訊。
 * @param location 使用者輸入的地點名稱，例如 "京都, 日本" 或 "Okinawa"
 * @returns 一個包含天氣資訊和標準化地點名稱的 Promise。
 */
export const getWeatherForecast = async (location: string): Promise<WeatherResult> => {
  if (!genAI) {
    return getMockData(location);
  }

  try {
    console.log(`🤖 正在透過 Gemini 查詢「${location}」的天氣... (最終簡化模式)`);
    
    // --- 最終修正：移除所有複雜的 tool 設定，完全相信模型的內建能力 ---
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ]
    });

    // --- 提示詞也同步簡化，只給目標，不給方法 ---
    const prompt = `
      請為我查詢「${location}」這個地點未來3天的天氣預報。

      你的任務是只回傳一個符合 TypeScript 介面 WeatherResult 的 JSON 字串，
      不要包含任何其他文字或 markdown 標籤(例如 \`\`\`json)。

      JSON 物件必須包含以下屬性:
      - locationName: string (該地點的標準化中文地名，例如："京都" 或 "東京")
      - days: WeatherDay[] (一個包含3個天氣物件的陣列)
      - sources: any[] (一個空陣列 [])

      每個 WeatherDay 物件都必須有以下屬性與格式：
      - date: string (用中文表示，例如："今天", "明天", "週一")
      - temp: number (攝氏溫度，整數)
      - condition: string (天氣狀況的中文簡述)
      - icon: string ("sunny", "cloudy", "rainy", "snowy" 其中之一)

      請直接輸出 JSON 內容。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("✅ Gemini API (最終模式) 回傳成功");
    const data: WeatherResult = JSON.parse(cleanedText);

    if (!data.days || !Array.isArray(data.days) || !data.locationName) {
      console.error("❌ Gemini 回傳的資料格式不符預期:", data);
      throw new Error("從 API 收到的資料格式無效");
    }

    return data;

  } catch (error) {
    console.error("❌ Gemini API (最終模式) 呼叫或解析失敗:", error);
    return getMockData(location);
  }
};
