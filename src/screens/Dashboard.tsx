import React, { useEffect, useMemo, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import {
  MapPin, Sun, Plus, Calendar as CalendarIcon,
  Edit2, Trash2, Navigation, RotateCcw, X,
  Cloud, CloudRain, Snowflake, Upload, Image as ImageIcon,
  Camera, Move, Wallet, Map, LocateFixed, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Trip, AppTab, ScheduleEvent, Expense } from '../types';
import { useLocationWeather } from '../hooks/useLocationWeather';

// 簡化後的 Props，移除了 onSignOut
interface DashboardProps {
  trips: Trip[];
  currentTripId: string;
  onTripChange: (id: string) => void;
  onAddTrip: (data: Omit<Trip, 'id' | 'user_id' | 'created_at'>) => void;
  onEditTrip: (id: string, data: Partial<Trip>) => void;
  onDeleteTrip: (id: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  userName: string;
  userAvatar: string;
  onUpdateUserProfile: (data: { name?: string; avatar?: string }) => void;
  events: ScheduleEvent[];
  completedEventIds: Set<string>;
  onCompleteEvent: (id: string) => void;
  onUndoCompleteEvent: (id: string) => void;
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({
  trips, currentTripId, onTripChange, onAddTrip, onEditTrip, onDeleteTrip, onNavigateTab,
  userName, userAvatar, onUpdateUserProfile,
  events, completedEventIds, onCompleteEvent, onUndoCompleteEvent, expenses
}) => {
  const tripFileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);

  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const { weatherData, locationName, isLoading: isWeatherLoading, error: weatherError, refetch: refetchWeather } = useLocationWeather();

  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startOffset, setStartOffset] = useState(50);

  const [tripFormData, setTripFormData] = useState({
    title: '', destination: '', dates: '', status: '規劃中' as Trip['status'], image: '', image_offset: 50
  });
  const [profileFormData, setProfileFormData] = useState({ name: userName, avatar: userAvatar });

  const currentTrip = trips.find(t => t.id === currentTripId) || (trips.length > 0 ? trips[0] : null);

  useEffect(() => {
      setProfileFormData({ name: userName, avatar: userAvatar });
  }, [userName, userAvatar]);

  // 如果沒有旅程，且 Modal 關閉時，在使用者點擊新增按鈕時自動開啟
  useEffect(() => {
    if (trips.length === 0 && !isTripModalOpen) {
        // 延遲一小段時間讓使用者注意到畫面變化
        const timer = setTimeout(() => setIsTripModalOpen(true), 500);
        return () => clearTimeout(timer);
    }
  }, [trips.length, isTripModalOpen]);

  const sortedEvents = useMemo(() =>
    [...(events || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [events]
  );

  const nextUpEvent = sortedEvents.find(e => !completedEventIds.has(e.id));
  const lastCompletedEvent = useMemo(() => {
      const nextEventIndex = sortedEvents.findIndex(e => e.id === nextUpEvent?.id);
      if (nextEventIndex > 0) return sortedEvents[nextEventIndex - 1];
      if (!nextUpEvent && sortedEvents.length > 0) return sortedEvents[sortedEvents.length - 1];
      return null;
  }, [sortedEvents, nextUpEvent]);

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
    const { image, ...restOfData } = tripFormData;
    const dataToSubmit: any = { ...restOfData, image_offset: Math.round(tripFormData.image_offset) };
    // 只有當上傳了新圖片時（base64），才包含 image 欄位
    if (image.startsWith('data:image')) {
        dataToSubmit.image = image;
    }

    if (editingTrip) {
      onEditTrip(editingTrip.id, dataToSubmit);
    } else {
      onAddTrip(dataToSubmit);
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
    setStartOffset(tripFormData.image_offset);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onImagePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newOffset = Math.max(0, Math.min(100, startOffset - (deltaY / 2)));
    setTripFormData(prev => ({ ...prev, image_offset: Math.round(newOffset) }));
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
  
  const Header = () => (
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
            <h1 className="text-xl font-black text-stone-800">{trips.length > 0 ? '今天想去哪裡？' : '開始你的第一趟旅程吧！'}</h1>
          </div>
        </div>
        <button
          onClick={() => {
              setEditingTrip(null);
              setTripFormData({ title: '', destination: '', dates: '', status: '規劃中', image: '', image_offset: 50 });
              setIsTripModalOpen(true);
          }}
          className="bg-stone-800 text-white p-3 rounded-2xl shadow-xl shadow-stone-200 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </header>
  );

  // --- 旅程與個人資料的 Modal 元件 --- 
  const TripModal = () => (
    <Modal isOpen={isTripModalOpen} onClose={() => setIsTripModalOpen(false)} title={editingTrip ? "編輯行程" : "開啟新旅程"}>
        <form onSubmit={handleTripSubmit} className="space-y-5">
          {/* 表單內容與之前相同... */}
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
                        <img src={tripFormData.image} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `50% ${tripFormData.image_offset}%` }} />
                        <div className="absolute inset-0 border-2 border-orange-400/50 pointer-events-none group-active:border-orange-500"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"><Move size={24} /></div>
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
                <Button type="button" variant="secondary" className="flex-1 py-3 text-xs font-black" onClick={() => tripFileRef.current?.click()}><Upload size={14} /> 上傳封面</Button>
                {tripFormData.image && (
                    <Button type="button" variant="ghost" className="text-stone-400 hover:text-red-500 px-4" onClick={() => setTripFormData(prev => ({ ...prev, image: '' }))}><Trash2 size={16} /></Button>
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
                <button type="button" onClick={() => {if(editingTrip) onDeleteTrip(editingTrip.id); setIsTripModalOpen(false);}} className="w-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 active:scale-90 transition-transform">
                    <Trash2 size={20} />
                </button>
            )}
            <Button type="submit" className="flex-1 py-4 shadow-xl shadow-orange-100 font-black tracking-widest">
                {editingTrip ? '儲存變更' : '開啟這趟旅程'}
            </Button>
          </div>
        </form>
    </Modal>
  );

  const ProfileModal = () => (
    <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="個人資料設定">
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl group cursor-pointer" onClick={() => profileFileRef.current?.click()}>
              <img src={profileFormData.avatar} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={32} /></div>
            </div>
            <p className="text-[10px] font-black text-stone-400 mt-4 tracking-widest uppercase">點擊頭像更換照片</p>
            <input ref={profileFileRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} className="hidden" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase text-center">旅人名稱</label>
            <input required className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 font-black text-2xl text-stone-800 focus:border-orange-400 focus:outline-none text-center" value={profileFormData.name} onChange={e => setProfileFormData({...profileFormData, name: e.target.value})} />
          </div>
          <Button type="submit" className="w-full py-4 font-black tracking-widest">確認更新</Button>
          {/* 移除了登出按鈕 */}
        </form>
      </Modal>
  );

  // 如果沒有旅程，顯示一個特殊的歡迎畫面
  if (trips.length === 0) {
    return (
        <div className="space-y-6 pb-24 animate-fade-in relative">
            <Header />
            <div className="text-center py-20 px-5">
                <h2 className="text-lg font-black text-stone-700">尚未建立任何旅程</h2>
                <p className="text-sm text-stone-500 mt-2">點擊右上角的 '+' 按鈕，開始規劃你的下一場冒險吧！</p>
            </div>
            <TripModal /> 
            <ProfileModal />
        </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in relative">
      <div className={`fixed top-0 left-0 right-0 h-64 overflow-hidden -z-10 pointer-events-none opacity-20 ${trips.length > 0 ? '' : 'opacity-0'}`}>
        {currentTrip && <img
            src={currentTrip.image || ''}
            className="w-full h-full object-cover blur-3xl scale-150 transition-all duration-1000"
            alt=""
        />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F7F4EB]" />
      </div>

      <Header />

      {/* --- 旅程卡片列表 --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">我的冒險旅程</h3>
          <span className="text-[10px] font-bold text-stone-300">左右滑動切換行程</span>
        </div>
        <div
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-5 px-5 scrollbar-hide touch-pan-x"
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
                  <img src={trip.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000&auto=format&fit=crop'} alt={trip.title} className="w-full h-full object-cover" style={{ objectPosition: `50% ${trip.image_offset ?? 50}%` }} />
                  {isSelected && (
                    <div className="absolute top-4 right-4 z-30 flex gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingTrip(trip);
                                setTripFormData({ title: trip.title, destination: trip.destination || '', dates: trip.dates, status: trip.status, image: trip.image || '', image_offset: trip.image_offset ?? 50 });
                                setIsTripModalOpen(true);
                            }}
                            className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 border border-white/20 shadow-lg"
                        ><Edit2 size={16} /></button>
                    </div>
                  )}
                  <div className="absolute bottom-5 left-5 z-20 text-white w-full pr-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 bg-orange-400/90 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md border border-white/10`}>{trip.status === '規劃中' ? '籌備中' : trip.status}</span>
                      <span className="text-[10px] font-bold opacity-80 flex items-center gap-1"><CalendarIcon size={10} /> {trip.dates}</span>
                    </div>
                    <h2 className="text-2xl font-black truncate drop-shadow-md tracking-tight">{trip.title}</h2>
                    {isSelected && <div className="mt-2 w-8 h-1 bg-orange-400 rounded-full animate-pulse" />}</div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 天氣卡片 --- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">{locationName} 天氣</h3>
          <button onClick={refetchWeather} className="text-[10px] font-black text-orange-500 flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 active:scale-95 transition-transform"><LocateFixed size={12} /> 更新我的位置</button>
        </div>
        {isWeatherLoading ? (
          <Card className="h-36 flex flex-col items-center justify-center animate-pulse bg-white/50 border-none">
            <Sun className="text-stone-200 animate-spin-slow mb-3" size={32} />
            <div className="h-2 w-24 bg-stone-100 rounded-full"></div>
          </Card>
        ) : weatherError ? (
          <Card className="text-center py-8 border-dashed border-red-200 bg-red-50/50" onClick={refetchWeather}>
            <div className="flex flex-col items-center gap-3 text-red-500">
                <AlertTriangle className="opacity-50" size={32} />
                <p className="font-black text-sm">{weatherError}</p>
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

      {/* --- 功能捷徑 --- */}
      <div className="pt-2">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase mb-3 px-1">重點摘要</h3>
        <div className="flex gap-3">
            <button onClick={() => onNavigateTab(AppTab.SCHEDULE)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"><Map size={16} className="text-orange-500" /> 行程地圖</button>
            <button onClick={() => onNavigateTab(AppTab.EXPENSES)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"><Wallet size={16} className="text-blue-500" /> 快速記帳</button>
        </div>
      </div>

      {/* --- 下一個行程 --- */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">下一個行程</h3>
          {nextUpEvent && <span className="text-[10px] font-black text-orange-500 bg-orange-100/50 px-2 py-0.5 rounded-md border border-orange-200/50">進行中</span>}
        </div>
        {nextUpEvent ? (
          <Card className="relative overflow-hidden p-0 border-none bg-white text-stone-900 shadow-2xl">
            <div className="p-6">
              <div className="flex gap-5 relative z-10">
                <div className="flex flex-col items-center justify-center bg-stone-50 rounded-2xl w-16 h-16 border border-stone-100 shrink-0 shadow-inner"><span className="text-sm font-black text-stone-900">{nextUpEvent.time}</span></div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-black text-stone-900 truncate leading-tight tracking-tight">{nextUpEvent.title}</h4>
                  <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-1.5 font-bold"><MapPin size={14} className="text-orange-400" /><span className="truncate">{nextUpEvent.location}</span></div>
                </div>
              </div>
              <div className="mt-7 flex gap-3 relative z-10">
                  <Button size="md" className="flex-1 bg-orange-500 text-white border-none shadow-xl shadow-orange-200 active:bg-orange-600" onClick={() => { if (nextUpEvent.mapUrl) { window.open(nextUpEvent.mapUrl, '_blank'); } else if (nextUpEvent.location) { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextUpEvent.location)}`, '_blank'); } }}><Navigation size={18} fill="white" /> <span className="font-black">開始導航</span></Button>
                  <button onClick={() => onCompleteEvent(nextUpEvent.id)} className="px-6 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 font-bold text-xs transition-all uppercase tracking-widest text-stone-700">完成</button>
              </div>
            </div>
            {lastCompletedEvent && (
              <div className="bg-stone-50/70 border-t border-stone-200/80 px-4 py-2 flex items-center justify-center gap-2">
                <button onClick={() => onUndoCompleteEvent(lastCompletedEvent.id)} className="flex items-center gap-2 text-[10px] font-bold text-stone-500 hover:text-orange-500 transition-colors"><RotateCcw size={10} /><span>返回上一步：<span className="font-black">{lastCompletedEvent.title}</span></span></button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="bg-stone-50 border-dashed border-stone-200 text-center py-10 opacity-80">
            <div className="flex flex-col items-center justify-center">
                <CheckCircle size={32} className="text-green-500 mb-3" />
                <p className="text-stone-500 font-black text-sm tracking-wider">✨ 所有行程都完成囉！</p>
                <p className="text-xs text-stone-400 mt-1">祝你有個美好的夜晚！</p>
                {lastCompletedEvent && (<Button variant="ghost" className="mt-4" onClick={() => onUndoCompleteEvent(lastCompletedEvent.id)}><RotateCcw size={12} className="mr-2" /> 返回上一步</Button>)}
            </div>
          </Card>
        )}
      </div>

      <TripModal />
      <ProfileModal />
    </div>
  );
};

export default Dashboard;
