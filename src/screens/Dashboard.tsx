
import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Sun, Calendar as CalendarIcon, RotateCcw, X, Map, Wallet, CheckCircle, AlertTriangle, Navigation
} from 'lucide-react';
import { Trip, AppTab, ScheduleEvent, Expense } from '../types';
import { useLocationWeather } from '../hooks/useLocationWeather';

import Header from '../components/Dashboard/Header';
import TripList from '../components/Dashboard/TripList';
import WeatherCard from '../components/Dashboard/WeatherCard';
import TripModal from '../components/Dashboard/TripModal';
import ProfileModal from '../components/Dashboard/ProfileModal';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

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
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const { weatherData, locationName, isLoading: isWeatherLoading, error: weatherError, refetch: refetchWeather } = useLocationWeather();

  const currentTrip = trips.find(t => t.id === currentTripId) || (trips.length > 0 ? trips[0] : null);

  useEffect(() => {
    if (trips.length === 0 && !isTripModalOpen) {
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

  const handleAddTripClick = () => {
    setEditingTrip(null);
    setIsTripModalOpen(true);
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setIsTripModalOpen(true);
  }

  if (trips.length === 0) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in relative">
        <Header 
          userName={userName} 
          userAvatar={userAvatar} 
          tripsLength={trips.length} 
          onProfileClick={() => setIsProfileModalOpen(true)} 
          onAddTripClick={handleAddTripClick} 
        />
        <div className="text-center py-20 px-5">
          <h2 className="text-lg font-black text-stone-700">尚未建立任何旅程</h2>
          <p className="text-sm text-stone-500 mt-2">點擊右上角的 '+' 按鈕，開始規劃你的下一場冒險吧！</p>
        </div>
        <TripModal
          isOpen={isTripModalOpen}
          onClose={() => setIsTripModalOpen(false)}
          editingTrip={editingTrip}
          onAddTrip={onAddTrip}
          onEditTrip={onEditTrip}
          onDeleteTrip={onDeleteTrip}
        />
        <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          userName={userName} 
          userAvatar={userAvatar} 
          onUpdateUserProfile={onUpdateUserProfile} 
        />
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

      <Header 
        userName={userName} 
        userAvatar={userAvatar} 
        tripsLength={trips.length} 
        onProfileClick={() => setIsProfileModalOpen(true)} 
        onAddTripClick={handleAddTripClick}
      />

      <TripList 
        trips={trips} 
        currentTripId={currentTripId} 
        onTripChange={onTripChange} 
        onEditTrip={handleEditTrip} 
      />

      <WeatherCard 
        weatherData={weatherData} 
        locationName={locationName} 
        isLoading={isWeatherLoading} 
        error={weatherError} 
        onRefetch={refetchWeather} 
      />

      <div className="pt-2">
        <h3 className="text-[10px] font-black text-stone-400 tracking-[0.2em] uppercase mb-3 px-1">重點摘要</h3>
        <div className="flex gap-3">
            <button onClick={() => onNavigateTab(AppTab.SCHEDULE)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"><Map size={16} className="text-orange-500" /> 行程地圖</button>
            <button onClick={() => onNavigateTab(AppTab.EXPENSES)} className="flex-1 flex items-center justify-center gap-2 py-4 bg-white rounded-2xl border-2 border-stone-100 font-black text-stone-700 text-xs shadow-sm active:scale-95 transition-all"><Wallet size={16} className="text-blue-500" /> 快速記帳</button>
        </div>
      </div>

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

      <TripModal
        isOpen={isTripModalOpen}
        onClose={() => setIsTripModalOpen(false)}
        editingTrip={editingTrip}
        onAddTrip={onAddTrip}
        onEditTrip={onEditTrip}
        onDeleteTrip={onDeleteTrip}
      />
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        userName={userName} 
        userAvatar={userAvatar} 
        onUpdateUserProfile={onUpdateUserProfile} 
      />
    </div>
  );
};

export default Dashboard;
