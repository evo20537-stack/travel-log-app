import React from 'react';
import { MessageCircleHeart, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';

const AIAssistant: React.FC = () => {
  return (
    <div className="h-full flex flex-col p-5 animate-fade-in">
      <header className="mb-6">
        <h2 className="text-2xl font-black text-stone-800">AI 導遊 🤖</h2>
        <p className="text-xs font-bold text-stone-400">你的專屬旅遊助理</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center text-stone-300 shadow-inner">
          <MessageCircleHeart size={48} />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-stone-700 mb-2">Demo Mode</h3>
          <p className="text-stone-500 font-bold text-sm max-w-[250px] mx-auto leading-relaxed">
            AI 功能已暫時關閉以進行介面測試。<br/>
            目前不載入任何外部模型。
          </p>
        </div>

        <Card className="bg-yellow-50 border-yellow-100 w-full max-w-xs">
          <div className="flex items-center gap-3 text-yellow-700">
            <AlertTriangle size={20} />
            <span className="text-xs font-bold text-left">
              已移除 @google/genai 依賴<br/>
              確保 App 穩定執行
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIAssistant;