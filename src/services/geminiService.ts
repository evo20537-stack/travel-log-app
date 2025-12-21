import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherDay } from "../types";

// 1. 初始化 Gemini
// 使用 import.meta.env 讀取環境變數
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

// 定義回傳的資料結構介面
interface WeatherResult {
  days: WeatherDay[];
  sources: string[];
}

// 備用的假資料函數 (放在最上面比較清楚)
const getMockData = (): WeatherResult => {
  return {
    days: [
      { date: 'API錯誤', temp: 0, condition: '連線失敗', icon: 'cloudy' },
      { date: '明天', temp: 22, condition: '多雲', icon: 'cloudy' },
      { date: '後天', temp: 19, condition: '短暫雨', icon: 'rainy' },
      { date: '週四', temp: 18, condition: '陰天', icon: 'cloudy' },
      { date: '週五', temp: 25, condition: '晴朗', icon: 'sunny' },
    ],
    sources: ["System Mock Data"]
  };
};

export const getWeatherForecast = async (location: string): Promise<WeatherResult> => {
  // 如果沒有金鑰，回傳假資料
  if (!API_KEY) {
    console.warn("⚠️ 未偵測到 API Key，使用模擬資料");
    return getMockData();
  }

  try {
    console.log(`正在詢問 Gemini: ${location} 的天氣...`);
    
    // 2. 設定模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 3. 建立 Prompt (提示詞)
    const prompt = `
      請給我 ${location} 未來 5 天的天氣預報。
      請直接回傳一個純 JSON 字串，不要有 Markdown 格式。
      JSON 格式必須包含 days 陣列，每個物件要有:
      - date: 字串 (例如 "今天", "明天", "週一")
      - temp: 數字 (攝氏溫度)
      - condition: 字串 (天氣狀況簡述)
      - icon: 字串 (只能是: "sunny", "cloudy", "rainy", "snowy")
      
      範例:
      {
        "days": [
          { "date": "今天", "temp": 24, "condition": "晴朗", "icon": "sunny" }
        ],
        "sources": ["Gemini AI"]
      }
    `;

    // 4. 發送請求
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. 清理與解析 JSON
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return data;

  } catch (error) {
    console.error("Gemini API 呼叫失敗:", error);
    return getMockData();
  }
};
