// import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

// Initialize Gemini Client
// The API key is obtained exclusively from process.env.API_KEY
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * MOCK Implementation of sendChatMessage
 */
export const sendChatMessage = async (
  currentMessage: string, 
  historyMessages: ChatMessage[]
): Promise<string> => {
  console.log("Mock Chat Request:", currentMessage);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  return "【系統訊息】AI 服務目前處於 Mock Mode (模擬模式)。這是一條自動回覆，因為我們暫時移除了外部依賴以確保 App 穩定執行。";
};

/**
 * MOCK Implementation of translateImageText
 */
export const translateImageText = async (
  base64Image: string
): Promise<string> => {
  console.log("Mock Translate Request (Image data length):", base64Image.length);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return "【模擬翻譯結果】\n\n1. Oishii Ramen (特製拉麵) - ¥980\n2. Gyoza (日式煎餃) - ¥450\n3. Beer (生啤酒) - ¥600\n\n(此為 UI 展示用的假資料)";
};