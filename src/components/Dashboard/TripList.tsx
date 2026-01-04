
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Card from '../ui/Card';
import { Edit2, Calendar as CalendarIcon } from 'lucide-react';
import { Trip } from '../../types';

interface TripListProps {
  trips: Trip[];
  currentTripId: string;
  onTripChange: (id: string) => void;
  onEditTrip: (trip: Trip) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, currentTripId, onTripChange, onEditTrip }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 當 currentTripId 改變時，自動捲動到選定的項目
  useEffect(() => {
    const selectedTripIndex = trips.findIndex(t => t.id === currentTripId);
    if (selectedTripIndex === -1) return;

    const selectedTripElement = tripRefs.current[selectedTripIndex];
    if (selectedTripElement && scrollContainerRef.current) {
      setIsAutoSwitching(true);
      const container = scrollContainerRef.current;
      const targetScrollLeft = selectedTripElement.offsetLeft - (container.offsetWidth - selectedTripElement.offsetWidth) / 2;
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
      
      const timer = setTimeout(() => {
        setIsAutoSwitching(false);
      }, 1000); // 動畫時間約 500ms，給予更長的時間確保動畫結束

      return () => clearTimeout(timer);
    }
  }, [currentTripId]); // 💥 修正：只在 currentTripId 改變時觸發

  // 處理手動捲動停止後的自動選取
  const handleScroll = useCallback(() => {
    if (isAutoSwitching) return; // 如果是程式觸發的捲動，則不進行處理

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const scrollCenter = container.scrollLeft + container.offsetWidth / 2;

      let closestIndex = -1;
      let minDistance = Infinity;

      tripRefs.current.forEach((tripEl, index) => {
        if (!tripEl) return;
        const tripCenter = tripEl.offsetLeft + tripEl.offsetWidth / 2;
        const distance = Math.abs(scrollCenter - tripCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== -1 && trips[closestIndex]?.id !== currentTripId) {
        onTripChange(trips[closestIndex].id);
      }
    }, 150); // 150ms 的延遲，判斷使用者是否停止捲動
  }, [isAutoSwitching, onTripChange, currentTripId, trips]);
  
  // 綁定與解綁捲動事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);


  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">我的冒險旅程</h3>
        <span className="text-[10px] font-bold text-stone-300">左右滑動切換行程</span>
      </div>
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-5 px-5 touch-pan-x [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-orange-300/80 [&::-webkit-scrollbar-track]:bg-orange-100/50"
      >
        {trips.map((trip, index) => {
          const isSelected = trip.id === currentTripId;
          return (
            <div
              key={trip.id}
              ref={el => tripRefs.current[index] = el}
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
                        onEditTrip(trip);
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
  );
}

export default TripList;
