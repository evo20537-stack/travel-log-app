
import React from 'react';
import Card from '../ui/Card';
import { Edit2, Calendar as CalendarIcon } from 'lucide-react';
import { Trip } from '../../types';

interface TripListProps {
  trips: Trip[];
  currentTripId: string;
  onTripChange: (id: string) => void;
  onEditTrip: (trip: Trip) => void;
}

const TripList: React.FC<TripListProps> = ({ trips, currentTripId, onTripChange, onEditTrip }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between px-1">
      <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase">我的冒險旅程</h3>
      <span className="text-[10px] font-bold text-stone-300">左右滑動切換行程</span>
    </div>
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 -mx-5 px-5 scrollbar-hide touch-pan-x">
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

export default TripList;
