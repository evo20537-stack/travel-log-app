
import React from 'react';
import Card from '../ui/Card';
import { Sun, Cloud, CloudRain, Snowflake, LocateFixed, AlertTriangle } from 'lucide-react';
import { WeatherDay } from '../../types'; // 修正 #1：從正確的來源導入 WeatherDay 類型

interface WeatherCardProps {
  weatherData: WeatherDay[] | null; // 修正 #2：使用正確的 WeatherDay 類型
  locationName: string;
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weatherData, locationName, isLoading, error, onRefetch }) => {
  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'cloudy': return <Cloud className="text-stone-400" />;
      case 'rainy': return <CloudRain className="text-blue-400" />;
      case 'snowy': return <Snowflake className="text-blue-200" />;
      default: return <Sun className="text-orange-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">{locationName} 天氣</h3>
        <button onClick={onRefetch} className="text-[10px] font-black text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 active:scale-95 transition-transform"><LocateFixed size={12} /> 更新我的位置</button>
      </div>
      {isLoading ? (
        <Card className="h-36 flex flex-col items-center justify-center animate-pulse bg-white/50 border-none">
          <Sun className="text-stone-200 animate-spin-slow mb-3" size={32} />
          <div className="h-2 w-24 bg-stone-100 rounded-full"></div>
        </Card>
      ) : error ? (
        <Card className="text-center py-8 border-dashed border-red-200 bg-red-50/50" onClick={onRefetch}>
            <div className="flex flex-col items-center gap-3 text-red-500">
                <AlertTriangle className="opacity-50" size={32} />
                <p className="font-black text-sm">{error}</p>
                <p className="text-xs font-bold text-red-400/80">點擊此處重試</p>
            </div>
        </Card>
      ) : weatherData && (
        <Card className="bg-white/60 backdrop-blur-sm border-stone-100 shadow-sm" noPadding>
          <div className="flex overflow-x-auto p-5 gap-6 scrollbar-hide touch-pan-x">
            {weatherData.slice(0, 7).map((w, i) => (
              <div key={i} className="flex flex-col items-center min-w-[50px]">
                <span className="text-[10px] font-black text-stone-400 mb-3 uppercase tracking-wider">{w.date}</span>
                <div className="mb-3 scale-125 transition-transform hover:scale-150 duration-300">{getWeatherIcon(w.icon)}</div>
                <div className="flex items-start font-black text-stone-800 text-sm"><span>{w.temp_max}°</span><span className="text-stone-400 font-bold text-xs ml-1">{w.temp_min}°</span></div>
                <p className="text-[10px] font-bold text-stone-400 mt-1.5 w-max">{w.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default WeatherCard;
