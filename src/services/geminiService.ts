
import { GoogleGenAI, Type } from "@google/genai";
import { WeatherDay } from "../types";

export interface WeatherForecastResult {
  days: WeatherDay[];
  sources: any[];
}

export const getWeatherForecast = async (location: string): Promise<WeatherForecastResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 更新 Prompt 讓搜尋更專注於「即時」與「7天」
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
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { 
      days: data as WeatherDay[], 
      sources 
    };
  } catch (error) {
    console.error("Fetch weather error:", error);
    return {
      days: [
        { date: '今日', temp: 22, condition: '連線錯誤', icon: 'cloudy' },
      ],
      sources: []
    };
  }
};

export const sendChatMessage = async (currentMessage: string): Promise<string> => {
  return "【系統訊息】AI 助理正在調整中。";
};
