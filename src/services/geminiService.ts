import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { WeatherDay } from "../types";

// 1. 定義回傳的資料結構介面
interface WeatherResult {
  days: WeatherDay[];
  sources: any[]; // 來源可以是任何類型
}

// 2. 初始化 Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | undefined;

if (API_KEY) {
  genAI = new GoogleGenerativeAI(API_KEY);
} else {
  // 這個警告可以幫助開發者發現問題
  console.warn("⚠️ 未偵測到 Gemini API Key，天氣預報將會使用模擬資料。請在 .env 檔案中設定 VITE_GEMINI_API_KEY。");
}

// 3. 備用的假資料函數
const getMockData = (): WeatherResult => {
  console.log("-> 使用模擬天氣資料");
  return {
    days: [
      { date: '今天', temp: 28, condition: '晴時多雲', icon: 'sunny' },
      { date: '明天', temp: 22, condition: '多雲', icon: 'cloudy' },
      { date: '後天', temp: 19, condition: '短暫雨', icon: 'rainy' },
      { date: '週四', temp: 18, condition: '陰天', icon: 'cloudy' },
      { date: '週五', temp: 25, condition: '晴朗', icon: 'sunny' },
    ],
    sources: [{ web: { title: "Mock Data", uri: "#" }}] // 提供一個模擬的來源
  };
};

// 4. 獲取天氣預報的核心函數
export const getWeatherForecast = async (location: string): Promise<WeatherResult> => {
  // 如果沒有設定 API key，立即返回模擬資料
  if (!genAI) {
    return getMockData();
  }

  try {
    console.log(`🤖 正在透過 Gemini 查詢 ${location} 的天氣...`);
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest",
      // 針對這種特定格式的需求，我們可以放寬一些安全設定
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ]
    });

    const prompt = `
      請為我查詢「${location}」這個地點未來5天的天氣預報。

      你的任務是只回傳一個符合 TypeScript 介面 WeatherResult 的 JSON 字串，不要包含任何其他文字或 markdown 標籤(例如 \`\`\`json)。

      JSON 物件必須包含一個 'days' 屬性，它是一個包含5個天氣物件的陣列。
      每個天氣物件都必須有以下屬性與格式：
      - date: string (用中文表示日期，例如："今天", "明天", "週一")
      - temp: number (攝氏溫度，整數)
      - condition: string (天氣狀況的中文簡述，例如："晴時多雲")
      - icon: string (天氣圖示，必須是 "sunny", "cloudy", "rainy", "snowy" 其中之一)

      另外，JSON 物件還需包含一個 'sources' 屬性，它是一個空陣列 []。

      請直接輸出 JSON 內容。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 確保即使模型意外回傳 markdown 也能正確清理
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    console.log("✅ Gemini API 回傳成功");
    const data: WeatherResult = JSON.parse(cleanedText);

    // 基本的資料驗證
    if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
      console.error("❌ Gemini 回傳的資料格式不符預期:", data);
      throw new Error("從 API 收到的資料格式無效");
    }

    // 成功時回傳從 API 解析的資料
    return data;

  } catch (error) {
    console.error("❌ Gemini API 呼叫或解析失敗:", error);
    // 發生任何錯誤時，都退回使用模擬資料，確保 App 不會崩潰
    return getMockData();
  }
};
