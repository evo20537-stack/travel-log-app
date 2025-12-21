import { GoogleGenerativeAI } from "@google/generative-ai";
import { WeatherDay } from "../types";

// 1. 初始化 Gemini (使用你的環境變數)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export const getWeatherForecast = async (location: string): Promise<{ days: WeatherDay[], sources: string[] }> => {
  // 如果沒有金鑰，回傳假資料避免崩潰 (本地開發防呆用)
  if (!API_KEY) {
    console.warn("⚠️ 未偵測到 API Key，使用模擬資料");
    return mockData();
  }

  try {
    console.log(`正在詢問 Gemini: ${location} 的天氣...`);
    
    // 2. 設定模型
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 3. 建立 Prompt (提示詞)
    const prompt = `
      請給我 ${location} 未來 5 天的天氣預報。
      請直接回傳一個純 JSON 字串，不要有 Markdown 格式 (```json ... ```)。
      JSON 格式必須包含 days 陣列，每個物件要有:
      - date: 字串 (例如 "今天", "明天", "週一")
      - temp: 數字 (攝氏溫度)
      - condition: 字串 (天氣狀況簡述，如 "晴時多雲")
      - icon: 字串 (只能是以下四種之一: "sunny", "cloudy", "rainy", "snowy")
      
      範例格式:
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

    // 5. 清理與解析 JSON (Gemini 有時會多給 ```json，要清掉)
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedText);

    return data;

  } catch (error) {
    console.error("Gemini API 呼叫失敗:", error);
    // 失敗時回退到假資料，保證 APP 不會壞掉
    return mockData();
  }
};

// 備用的假資料函數 (當 API 失敗或沒付錢時使用)
const mockData = () => ({
  days: [
    { date: 'API錯誤', temp: 0, condition: '連線失敗', icon: 'cloudy' as const },
    { date: '明天', temp: 22, condition: '多雲', icon: 'cloudy' as const },
    { date: '後天', temp: 19, condition: '短暫雨', icon: 'rainy' as const },
    { date: '週四', temp: 18, condition: '陰天', icon: 'cloudy' as const },
    { date: '週五', temp: 25, condition: '晴朗', icon: 'sunny' as const },
  ],
  sources: ["System Mock Data"]
});
