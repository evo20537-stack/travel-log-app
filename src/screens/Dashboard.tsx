import React, { useEffect, useRef, useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { MapPin, Sun, Plus, Calendar as CalendarIcon, Edit2, Trash2, CheckCircle2, Navigation, ArrowRight, RotateCcw } from 'lucide-react';
import { Trip, AppTab, ScheduleEvent } from '../types';

interface DashboardProps {
  trips: Trip[];
  currentTripId: string;
  onTripChange: (id: string) => void;
  onAddTrip: (data: { title: string; destination: string; dates: string }) => void;
  onEditTrip: (id: string, data: Partial<Trip>) => void;
  onDeleteTrip: (id: string) => void;
  onNavigateTab: (tab: AppTab) => void;
  userName?: string;
  userAvatar?: string;
  // New props for Schedule Integration
  events: ScheduleEvent[];
  completedEventIds: Set<string>;
  onCompleteEvent: (id: string) => void;
  onUndoCompleteEvent: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  trips, 
  currentTripId, 
  onTripChange, 
  onAddTrip,
  onEditTrip,
  onDeleteTrip,
  onNavigateTab,
  userName = "旅人",
  userAvatar = "https://picsum.photos/200",
  events,
  completedEventIds,
  onCompleteEvent,
  onUndoCompleteEvent
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ title: '', destination: '', dates: '', status: '規劃中' });

  const currentTrip = trips.find(t => t.id === currentTripId) || trips[0];

  // Logic to find the "Next Up" event
  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const nextUpEvent = sortedEvents.find(e => !completedEventIds.has(e.id));
  
  // Logic to find the "Previous" event (for Undo)
  // Finds the last completed event that is closest to the current time logic
  const previouslyCompletedEvent = [...sortedEvents]
    .reverse()
    .find(e => completedEventIds.has(e.id));

  // Mock Weather Data
  const weatherData = [22, 23, 21, 20, 22];

  // Sync Swipe with State
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-trip-id');
            if (id && id !== currentTripId) {
              onTripChange(id);
            }
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    const cards = container.querySelectorAll('.trip-card-snap');
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, [trips, onTripChange]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetCard = scrollContainerRef.current.querySelector(`[data-trip-id="${currentTripId}"]`);
      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentTripId]); 

  const handleOpenAdd = () => {
    setEditingTrip(null);
    setFormData({ title: '', destination: '', dates: '', status: '規劃中' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData({ 
        title: trip.title, 
        destination: '', 
        dates: trip.dates,
        status: trip.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTrip) {
        onEditTrip(editingTrip.id, {
            title: formData.title,
            dates: formData.dates,
            status: formData.status
        });
    } else {
        onAddTrip(formData);
    }
    setIsModalOpen(false);
  };

  const handleNavigation = () => {
    if (nextUpEvent) {
       if (nextUpEvent.mapUrl) {
           window.open(nextUpEvent.mapUrl, '_blank');
       } else {
           const query = encodeURIComponent(nextUpEvent.location);
           window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
       }
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Header with Add Button */}
      <header className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-stone-500 text-sm font-bold">晚安, {userName}</h2>
          <h1 className="text-2xl font-black text-stone-800 tracking-tight">我的行程 ✈️</h1>
        </div>
        <div className="flex gap-3 items-center">
            <button 
              onClick={handleOpenAdd}
              className="bg-stone-800 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
                <Plus size={14} /> 新增
            </button>
            <div className="w-10 h-10 rounded-full bg-orange-200 overflow-hidden border-2 border-white shadow-sm">
                <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
        </div>
      </header>

      {/* Trips Carousel */}
      {trips.length === 0 ? (
          <Card className="text-center py-10 opacity-60">
             <div className="text-stone-300 mb-2 flex justify-center"><Sun size={48} /></div>
             <p className="font-bold text-stone-500">還沒有行程，按右上角新增！</p>
          </Card>
      ) : (
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-5 px-5 scrollbar-hide"
      >
        {trips.map((trip) => (
          <div 
            key={trip.id} 
            data-trip-id={trip.id}
            className="min-w-full snap-center trip-card-snap transition-opacity duration-300"
            style={{ opacity: trip.id === currentTripId ? 1 : 0.6 }}
          >
            <Card className="relative overflow-hidden group h-48" noPadding>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
              <img 
                src={trip.image} 
                alt={trip.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              
              {/* Edit Controls Overlay */}
              <div className="absolute top-3 right-3 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(trip); }}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/40"
                >
                    <Edit2 size={16} />
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTrip(trip.id); }}
                    className="p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-500"
                >
                    <Trash2 size={16} />
                </button>
              </div>

              <div className="absolute bottom-4 left-4 z-20 text-white w-full pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 ${trip.color}/90 rounded-lg text-xs font-bold backdrop-blur-sm shadow-sm`}>
                    {trip.status}
                  </span>
                  <span className="text-sm font-medium opacity-90 flex items-center gap-1">
                    <CalendarIcon size={12} /> {trip.dates}
                  </span>
                </div>
                <h2 className="text-xl font-bold truncate">{trip.title}</h2>
              </div>
            </Card>
          </div>
        ))}
      </div>
      )}

      {/* Next Up Widget */}
      {currentTrip && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-stone-700">下個行程 (Next Up)</h3>
          <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-1 rounded-full">
            {currentTrip.status === '進行中' ? '正在進行' : currentTrip.status}
          </span>
        </div>

        {nextUpEvent ? (
           <Card className="bg-white border-2 border-stone-100 relative overflow-hidden transition-all duration-300">
             {/* Decorative Background Icon */}
             {nextUpEvent.icon && (
               <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                 <nextUpEvent.icon size={120} />
               </div>
             )}

             <div className="flex justify-between items-start relative z-10">
               <div className="flex gap-4">
                 <div className="flex flex-col items-center justify-center bg-stone-50 rounded-xl w-14 h-14 border border-stone-200">
                   <span className="text-[10px] font-bold text-stone-400 uppercase">TIME</span>
                   <span className="text-lg font-black text-stone-800 leading-none">
                     {nextUpEvent.time.split(':')[0]}
                     <span className="text-xs align-top ml-0.5">{nextUpEvent.time.split(':')[1]}</span>
                   </span>
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="text-lg font-bold text-stone-800 truncate pr-4">{nextUpEvent.title}</h4>
                   <div className="flex items-center gap-1.5 text-stone-500 text-sm mt-1">
                     <MapPin size={14} className="shrink-0 text-orange-500" />
                     <span className="truncate">{nextUpEvent.location}</span>
                   </div>
                 </div>
               </div>
             </div>

             <div className="mt-5 flex gap-3 relative z-10">
               {/* Improved Navigation Button - High Contrast */}
               <Button 
                 size="sm" 
                 className="flex-1 bg-blue-100 text-blue-700 border-2 border-blue-200 hover:bg-blue-200 shadow-sm" 
                 onClick={handleNavigation}
               >
                 <Navigation size={18} className="mr-2" /> 
                 導航
               </Button>
               <Button 
                 size="sm" 
                 className="flex-1 bg-stone-800 text-white shadow-lg shadow-stone-200 hover:bg-stone-900 active:scale-95"
                 onClick={() => onCompleteEvent(nextUpEvent.id)}
               >
                 <span className="mr-1">下個行程</span>
                 <ArrowRight size={16} /> 
               </Button>
             </div>
             
             {/* Discrete Undo Button */}
             {previouslyCompletedEvent && (
                <div className="mt-2 text-right">
                    <button 
                      onClick={() => onUndoCompleteEvent(previouslyCompletedEvent.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-orange-500 transition-colors px-2 py-1 rounded-md"
                    >
                      <RotateCcw size={10} />
                      復原上一個 ({previouslyCompletedEvent.time} {previouslyCompletedEvent.title})
                    </button>
                </div>
             )}
           </Card>
        ) : (
           <Card className="bg-stone-50 border-stone-100 border-dashed text-center py-8">
             <CheckCircle2 size={32} className="text-green-500 mx-auto mb-2" />
             <h4 className="text-stone-600 font-bold">今日行程已全部完成！</h4>
             <p className="text-xs text-stone-400 font-bold mt-1">好好休息，準備明天的旅程吧</p>
             
             {/* Undo even when all finished */}
             {previouslyCompletedEvent && (
               <button 
                 onClick={() => onUndoCompleteEvent(previouslyCompletedEvent.id)}
                 className="mt-4 text-xs font-bold text-stone-400 hover:text-stone-600 flex items-center gap-1 mx-auto"
               >
                 <RotateCcw size={12} /> 復原上一個行程
               </button>
             )}

             <Button 
               size="sm" 
               variant="ghost" 
               className="mt-3 text-orange-500" 
               onClick={() => onNavigateTab(AppTab.SCHEDULE)}
             >
               查看完整行程表
             </Button>
           </Card>
        )}
      </div>
      )}

      {/* Weather Mini */}
      {weatherData.length > 0 && (
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {weatherData.map((temp, i) => (
          <Card key={i} className="min-w-[100px] flex flex-col items-center justify-center py-4 active:scale-95 transition-transform" noPadding>
            <span className="text-xs font-bold text-stone-400 mb-1">
              {i === 0 ? '明天' : `+${i}天`}
            </span>
            <Sun size={24} className="text-orange-400 mb-1" />
            <span className="font-bold text-stone-700">{temp}°C</span>
          </Card>
        ))}
      </div>
      )}

      {/* ADD/EDIT TRIP MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingTrip ? "編輯行程 ✏️" : "建立新行程 ✈️"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">行程名稱</label>
            <input 
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
              placeholder="例如：首爾爆買團"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          
          <div className="flex gap-3">
             <div className="flex-1">
                <label className="block text-xs font-bold text-stone-400 mb-1">狀態</label>
                <select 
                   className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none bg-white"
                   value={formData.status}
                   onChange={e => setFormData({...formData, status: e.target.value})}
                >
                    <option value="規劃中">規劃中</option>
                    <option value="即將出發">即將出發</option>
                    <option value="進行中">進行中</option>
                    <option value="已結束">已結束</option>
                </select>
             </div>
             
             {!editingTrip && (
             <div className="flex-1">
                <label className="block text-xs font-bold text-stone-400 mb-1">目的地</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  placeholder="城市"
                  value={formData.destination}
                  onChange={e => setFormData({...formData, destination: e.target.value})}
                />
             </div>
             )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">日期</label>
            <input 
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
              placeholder="YYYY.MM.DD - YYYY.MM.DD"
              value={formData.dates}
              onChange={e => setFormData({...formData, dates: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full mt-2">
            {editingTrip ? "儲存變更" : "確認建立"}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;