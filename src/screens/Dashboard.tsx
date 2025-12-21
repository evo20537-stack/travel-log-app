
import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { 
  MapPin, Sun, Plus, Calendar as CalendarIcon, 
  Edit2, Trash2, Navigation, RotateCcw, 
  Cloud, CloudRain, Snowflake, Search, Upload, Image as ImageIcon,
  Camera, Move, Wallet, Sparkles, Map, ChevronRight, ExternalLink
} from 'lucide-react';
import { Trip, AppTab, ScheduleEvent, WeatherDay } from '../types';
import { getWeatherForecast } from '../services/geminiService';

interface DashboardProps {
  trips: Trip[];
  currentTripId: string;
  onTripChange: (id: string) => void;
  onAddTrip: (data: { title: string; destination: string; dates: string; image: string; imageOffset: number }) => void;
  onEditTrip: (id: string, data: Partial<Trip>) => void;
  onDeleteTrip: (id: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  userName: string;
  userAvatar: string;
  onUpdateUserProfile: (data: { name: string; avatar: string }) => void;
  events: ScheduleEvent[];
  completedEventIds: Set<string>;
  onCompleteEvent: (id: string) => void;
  onUndoCompleteEvent: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  trips, currentTripId, onTripChange, onAddTrip, onEditTrip, onDeleteTrip, 
  onNavigateTab, userName, userAvatar, onUpdateUserProfile, 
  events, completedEventIds, onCompleteEvent, onUndoCompleteEvent
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tripFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  // Weather State
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [weatherSources, setWeatherSources] = useState<any[]>([]);
  const [weatherLocation, setWeatherLocation] = useState('');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Drag State for Image Position
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startOffset, setStartOffset] = useState(50);

  // Form States
  const [tripFormData, setTripFormData] = useState({ 
    title: '', destination: '', dates: '', status: '規劃中', image: '', imageOffset: 50 
  });
  const [profileFormData, setProfileFormData] = useState({ name: userName, avatar: userAvatar });

  const currentTrip = trips.find(t => t.id === currentTripId) || trips[0];

  // 當選擇的行程改變時，自動抓取天氣
  useEffect(() => {
    if (currentTrip) {
      handleFetchWeather(currentTrip.destination);
    }
  }, [currentTripId]); 

  const handleFetchWeather = async (loc: string) => {
    if (!loc || loc.trim() === "") return;
    setIsWeatherLoading(true);
    setWeatherLocation(loc.trim());
    try {
      const result = await getWeatherForecast(loc.trim());
      setWeatherData(result.days || []);
      setWeatherSources(result.sources || []);
    } catch (error) {
      console.error("Weather fetch failed:", error);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'trip' | 'profile') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'trip') setTripFormData(prev => ({ ...prev, image: base64 }));
        else setProfileFormData(prev => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrip) {
      onEditTrip(editingTrip.id, tripFormData);
    } else {
      onAddTrip(tripFormData);
    }
    setIsTripModalOpen(false);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(profileFormData);
    setIsProfileModalOpen(false);
  };

  const onImagePointerDown = (e: React.PointerEvent) => {
    if (!tripFormData.image) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setStartOffset(tripFormData.imageOffset);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onImagePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newOffset = Math.max(0, Math.min(100, startOffset - (deltaY / 2)));
    setTripFormData(prev => ({ ...prev, imageOffset: Math.round(newOffset) }));
  };

  const onImagePointerUp = () => setIsDragging(false);

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'cloudy': return <Cloud className="text-stone-400" />;
      case 'rainy': return <CloudRain className="text-blue-400" />;
      case 'snowy': return <Snowflake className="text-blue-200" />;
      default: return <Sun className="text-orange-400" />;
    }
  };

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const nextUpEvent = sortedEvents.find(e => !completedEventIds.has(e.id));

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      {/* 沉浸式氛圍背景 */}
      <div className="fixed top-0 left-0 right-0 h-64 overflow-hidden -z-10 pointer-events-none opacity-20">
        <img 
            src={currentTrip?.image || ''} 
            className="w-full h-full object-cover blur-3xl scale-150 transition-all duration-1000"
            alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F7F4EB]" />
      </div>

      {/* 1. Header 問候區域 */}
      <header className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setProfileFormData({ name: userName, avatar: userAvatar }); setIsProfileModalOpen(true); }}
            className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-xl active:scale-90 transition-transform"
          >
            <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
          </button>
          <div>
            <h2 className="text-stone-500 text-xs font-black tracking-widest uppercase opacity-70">你好, {userName} ✨</h2>
            <h1 className="text-xl font-black text-stone-800">今天想去哪裡？</h1>
          </div>
        </div>
        <button 
          onClick={() => { 
              setEditingTrip(null); 
              setTripFormData({ title: '', destination: '', dates: '', status: '規劃中', image: '', imageOffset: 50 }); 
              setIsTripModalOpen(true); 
          }}
          className="bg-stone-800 text-white p-3 rounded-2xl shadow-xl shadow-stone-200 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </header>

      {/* 2. 我的冒險旅程 (行程切換) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">我的冒險旅程</h3>
          <span className="text-[10px] font-bold text-stone-300">左右滑動切換行程</span>
        </div>
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-5 px-5 scrollbar-hide"
        >
          {trips.map((trip) => {
            const isSelected = trip.id === currentTripId;
            return (
              <div 
                key={trip.id} 
                onClick={() => onTripChange(trip.id)}
                className={`min-w-[88%] snap-center transition-all duration-500 cursor-pointer ${isSelected ? 'scale-100 opacity-100' : 'scale-[0.93] opacity-40 grayscale'}`}
              >
                <Card 
                  className={`relative overflow-hidden group h-48 border-none shadow-2xl ${isSelected ? 'ring-4 ring-orange-400/30' : ''}`} 
                  noPadding
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <img 
                    src={trip.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop'} 
                    alt={trip.title} 
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `50% ${trip.imageOffset ?? 50}%` }}
                  />
                  
                  {isSelected && (
                    <div className="absolute top-4 right-4 z-30 flex gap-2">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setEditingTrip(trip); 
                                // Fix type mismatch by picking required properties and providing defaults
                                setTripFormData({ 
                                    title: trip.title,
                                    destination: trip.destination || '',
                                    dates: trip.dates,
                                    status: trip.status,
                                    image: trip.image,
                                    imageOffset: trip.imageOffset ?? 50
                                }); 
                                setIsTripModalOpen(true); 
                            }}
                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 border border-white/20 shadow-lg"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                  )}

                  <div className="absolute bottom-5 left-5 z-20 text-white w-full pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 ${trip.color}/90 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10`}>
                        {trip.status === '規劃中' ? '籌備中' : trip.status}
                      </span>
                      <span className="text-[10px] font-bold opacity-80 flex items-center gap-1">
                        <CalendarIcon size={10} /> {trip.dates}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black truncate drop-shadow-md tracking-tight">{trip.title}</h2>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-orange-400 rounded-full animate-pulse" />}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 當地天氣預報 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">當地天氣預報</h3>
          <button 
            onClick={() => {
              const loc = prompt("請輸入想搜尋的國家或城市（例：日本 東京）", weatherLocation || currentTrip?.destination);
              if (loc && loc.trim() !== "") handleFetchWeather(loc.trim());
            }}
            className="text-[10px] font-black text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 active:scale-95 transition-transform"
          >
            <Search size={12} /> 搜尋地區
          </button>
        </div>
        
        {isWeatherLoading ? (
          // Fix: Added children to the loading Card to resolve component requirement
          <Card className="h-32 flex flex-col items-center justify-center animate-pulse bg-white/50 border-none">
            <Sun className="text-stone-200 animate-spin-slow mb-2" size={24} />
            <div className="h-2 w-20 bg-stone-100 rounded-full"></div>
          </Card>
        ) : weatherData.length > 0 ? (
          <div className="space-y-2">
            <Card className="bg-white/60 backdrop-blur-sm border-stone-100 shadow-sm" noPadding>
              <div className="flex overflow-x-auto p-5 gap-7 scrollbar-hide">
                {weatherData.slice(0, 5).map((w, i) => (
                  <div key={i} className="flex flex-col items-center min-w-[50px]">
                    <span className="text-[10px] font-black text-stone-400 mb-2 uppercase">{i === 0 ? '今天' : w.date}</span>
                    <div className="mb-2 scale-125 transition-transform hover:scale-150 duration-300">{getWeatherIcon(w.icon)}</div>
                    <span className="font-black text-stone-800 text-sm">{w.temp}°</span>
                  </div>
                ))}
              </div>
            </Card>
            {/* Display weather source citations as required by Gemini Search grounding rules */}
            {weatherSources.length > 0 && (
              <div className="px-1 pt-1 flex flex-wrap gap-2 items-center">
                <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">資料來源:</span>
                {weatherSources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.web?.uri || source.maps?.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"
                  >
                    {source.web?.title || source.maps?.title || '參考資料'} <ExternalLink size={8} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="text-center py-10 border-dashed border-stone-200 bg-transparent" onClick={() => handleFetchWeather(currentTrip?.destination)}>
            <div className="flex flex-col items-center gap-2">
                <Sun className="text-stone-300" size={32} />
                <p className="text-xs font-bold text-stone-400">點擊載入 {currentTrip?.destination || '當地'} 天氣資訊</p>
            </div>
          </Card>
        )}
      </div>

      {/* 4. 快速工具 (位於天氣與行程之間) */}
      <div className="pt-2">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase mb-3 px-1">快速工具</h3>
        <div className="flex gap-3">
            <button 
                onClick={() => onNavigateTab(AppTab.SCHEDULE)}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"
            >
                <Map size={16} className="text-orange-500" /> 行程地圖
            </button>
            <button 
                onClick={() => onNavigateTab(AppTab.EXPENSES)}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"
            >
                <Wallet size={16} className="text-blue-500" /> 快速記帳
            </button>
        </div>
      </div>

      {/* 5. 下一個行程 */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">下一個行程</h3>
          <span className="text-[10px] font-black text-orange-500 bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">進行中</span>
        </div>
        
        {nextUpEvent ? (
          <Card className="relative overflow-hidden p-6 border-none bg-stone-900 text-white shadow-2xl">
            <Sparkles className="absolute right-[-20px] top-[-20px] text-white/5" size={120} />
            <div className="flex gap-5 relative z-10">
              <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-xl rounded-2xl w-16 h-16 border border-white/20 shrink-0 shadow-inner">
                <span className="text-sm font-black text-white">{nextUpEvent.time}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xl font-black text-white truncate leading-tight tracking-tight">{nextUpEvent.title}</h4>
                <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1.5 font-bold">
                  <MapPin size={14} className="text-orange-400" />
                  <span className="truncate">{nextUpEvent.location}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-7 flex gap-3 relative z-10">
                <Button 
                    size="md" 
                    className="flex-1 bg-blue-600 text-white border-none shadow-xl shadow-blue-900/20 active:bg-blue-700" 
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextUpEvent.location)}`, '_blank')}
                >
                    <Navigation size={18} fill="white" /> <span className="font-black">開始導航</span>
                </Button>
                <button 
                    onClick={() => onCompleteEvent(nextUpEvent.id)}
                    className="px-6 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold text-xs transition-all uppercase tracking-widest"
                >
                    完成
                </button>
            </div>
          </Card>
        ) : (
          <Card className="bg-stone-50 border-dashed border-stone-200 text-center py-12 opacity-80">
            <p className="text-stone-400 font-black text-xs tracking-widest">✨ 今天的挑戰都完成囉，祝你有個美好的夜晚！</p>
          </Card>
        )}
      </div>

      {/* 6. 預算支出概況 (移至最底部) */}
      <div className="pt-2">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase mb-3 px-1">財務摘要</h3>
        <Card 
            className="flex flex-col gap-2 border-stone-100 hover:border-blue-100 active:scale-[0.98] transition-all bg-white/70 backdrop-blur-md shadow-sm"
            onClick={() => onNavigateTab(AppTab.EXPENSES)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Wallet size={16} className="text-blue-500" />
                    <span className="text-[11px] font-black text-stone-400 tracking-widest uppercase">預算支出概況</span>
                </div>
                <ChevronRight size={14} className="text-stone-300" />
            </div>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-stone-800">¥ 12,500</p>
                <span className="text-[10px] font-bold text-stone-400 mb-1">/ 累計花費</span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }} />
            </div>
        </Card>
      </div>

      {/* TRIP EDIT MODAL */}
      <Modal isOpen={isTripModalOpen} onClose={() => setIsTripModalOpen(false)} title={editingTrip ? "編輯行程" : "開啟新旅程"}>
        <form onSubmit={handleTripSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">行程封面 (可拖動調整位置)</label>
            <div 
                className="relative h-44 w-full rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-200 cursor-move group select-none shadow-inner"
                onPointerDown={onImagePointerDown}
                onPointerMove={onImagePointerMove}
                onPointerUp={onImagePointerUp}
                onPointerLeave={onImagePointerUp}
                style={{ touchAction: 'none' }}
            >
                {tripFormData.image ? (
                    <>
                        <img 
                            src={tripFormData.image} 
                            className="w-full h-full object-cover pointer-events-none" 
                            style={{ objectPosition: `50% ${tripFormData.imageOffset}%` }} 
                        />
                        <div className="absolute inset-0 border-2 border-orange-400/50 pointer-events-none group-active:border-orange-500"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                            <Move size={24} />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-300">
                        <ImageIcon size={40} strokeWidth={1.5} />
                        <span className="text-[10px] font-black mt-3 tracking-widest uppercase">點擊下方按鈕上傳照片</span>
                    </div>
                )}
            </div>
            
            <input ref={tripFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'trip')} className="hidden" />
            
            <div className="flex gap-2">
                <Button type="button" variant="secondary" className="flex-1 py-3 text-xs font-black" onClick={() => tripFileRef.current?.click()}>
                    <Upload size={14} /> 上傳封面
                </Button>
                {tripFormData.image && (
                    <Button type="button" variant="ghost" className="text-stone-400 hover:text-red-500 px-4" onClick={() => setTripFormData(prev => ({ ...prev, image: '' }))}>
                        <Trash2 size={16} />
                    </Button>
                )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">行程標題</label>
              <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" value={tripFormData.title} onChange={e => setTripFormData({...tripFormData, title: e.target.value})} placeholder="例：東京爆食之旅 🍣" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">目的地</label>
                <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" value={tripFormData.destination} onChange={e => setTripFormData({...tripFormData, destination: e.target.value})} placeholder="例：東京" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">日期範圍</label>
                <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" placeholder="04.10 - 04.15" value={tripFormData.dates} onChange={e => setTripFormData({...tripFormData, dates: e.target.value})} />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-3">
            {editingTrip && (
                <button type="button" onClick={() => onDeleteTrip(editingTrip.id)} className="w-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 active:scale-90 transition-transform">
                    <Trash2 size={20} />
                </button>
            )}
            <Button type="submit" className="flex-1 py-4 shadow-xl shadow-orange-100 font-black tracking-widest">
                {editingTrip ? '儲存變更' : '開啟這趟旅程'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* USER PROFILE MODAL */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="個人資料設定">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl group cursor-pointer" onClick={() => profileFileRef.current?.click()}>
              <img src={profileFormData.avatar} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <p className="text-[10px] font-black text-stone-400 mt-4 tracking-widest uppercase">點擊頭像更換照片</p>
            <input ref={profileFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} className="hidden" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase text-center">旅人名稱</label>
            <input required className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 font-black text-2xl text-stone-800 focus:border-orange-400 focus:outline-none text-center" value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} />
          </div>
          <Button type="submit" className="w-full py-4 font-black tracking-widest">確認更新</Button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
