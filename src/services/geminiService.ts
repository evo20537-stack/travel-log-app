
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherDay } from "../types";

export interface WeatherForecastResult {
  days: WeatherDay[];
  sources: any[];
}

/**
 * 獲取特定地點的天氣預報，使用 Google Search Grounding 以確保即時性。
 */
export const getWeatherForecast = async (location: string): Promise<WeatherForecastResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `請搜尋「${location}」目前的氣溫以及未來 7 天（包含今日）的天氣預報。
請嚴格遵守以下 JSON 結構回傳（不要回傳其他文字）：
[
  {"date": "MM/DD", "temp": 數字, "condition": "天氣狀態描述", "icon": "sunny" | "cloudy" | "rainy" | "snowy"}
]
注意：
1. icon 欄位必須且只能從 [sunny, cloudy, rainy, snowy] 四個詞中選擇。
2. 請搜尋當地的實際天氣預報資訊。`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // 注意：指南提到使用 googleSearch 時 response.text 可能不是純 JSON，
        // 但在指定 responseMimeType 和 Schema 時，Gemini 會盡力遵守。
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING },
              temp: { type: Type.NUMBER },
              condition: { type: Type.STRING },
              icon: { type: Type.STRING },
            },
            required: ["date", "temp", "condition", "icon"],
          }
        }
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    const data = JSON.parse(jsonStr);
    // 提取 Grounding 資訊中的 URL
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { 
      days: data as WeatherDay[], 
      sources 
    };
  } catch (error) {
    console.error("Fetch weather error:", error);
    return {
      days: [
        { date: '今日', temp: 22, condition: '暫無資料', icon: 'cloudy' },
      ],
      sources: []
    };
  }
};

/**
 * 發送訊息給 AI 助理，獲取旅遊建議。
 */
export const sendChatMessage = async (currentMessage: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: currentMessage,
      config: {
        systemInstruction: "你是一位活潑、專業的旅遊導遊助理，協助使用者規劃日本或其他地區的旅遊行程。請用親切的語氣回答。",
      },
    });
    
    return response.text || "抱歉，我現在無法回答這個問題。";
  } catch (error) {
    console.error("Chat service error:", error);
    return "連線發生錯誤，請稍後再試。";
  }
};
