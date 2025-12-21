import React, { useState } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Planning from './screens/Planning';
import { AppTab, Trip, ScheduleEvent } from './types';
import { Camera, Utensils, Train } from 'lucide-react';

// --- MOCK DATA ---
const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: '東京賞櫻爆買團 🌸',
    status: '即將出發',
    day: 'Day 1',
    dates: '2024.04.10 - 2024.04.15',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
    color: 'bg-pink-500'
  },
  {
    id: '2',
    title: '京都放空之旅 🍁',
    status: '規劃中',
    day: 'Day 1',
    dates: '2024.11.20 - 2024.11.25',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop',
    color: 'bg-orange-500'
  }
];

const MOCK_EVENTS: Record<string, ScheduleEvent[]> = {
  '1': [
    { id: 'e1', time: '09:00', title: '雷門 & 淺草寺', location: '淺草', type: 'activity', color: 'bg-red-100 text-red-500', icon: Camera, notes: '記得去遊客中心頂樓看晴空塔' },
    { id: 'e2', time: '12:00', title: '敘敘苑燒肉', location: '晴空塔 30F', type: 'food', color: 'bg-orange-100 text-orange-500', icon: Utensils, notes: '已訂位 12:00，窗邊座位' },
    { id: 'e3', time: '14:30', title: '前往澀谷', location: '地鐵銀座線', type: 'transport', transitTime: '40 mins', color: 'bg-stone-100 text-stone-500', icon: Train },
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [currentTripId, setCurrentTripId] = useState<string>(MOCK_TRIPS[0].id);
  const [allEvents, setAllEvents] = useState<Record<string, ScheduleEvent[]>>(MOCK_EVENTS);
  const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

  const handleCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => {
      const newSet = new Set(prev);
      newSet.add(eventId);
      return newSet;
    });
  };

  const handleUndoCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  const renderContent = () => {
    const currentTrip = trips.find(t => t.id === currentTripId) || trips[0];
    const currentEvents = currentTrip ? (allEvents[currentTrip.id] || []) : [];

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return (
          <Dashboard 
            trips={trips} 
            currentTripId={currentTripId} 
            onTripChange={setCurrentTripId}
            onAddTrip={(data) => {
                const newT = { id: Date.now().toString(), ...data, status: '規劃中', day: 'Day 1', image: 'https://picsum.photos/600/300', color: 'bg-blue-500' };
                setTrips([newT, ...trips]);
                setCurrentTripId(newT.id);
            }}
            onEditTrip={(id, data) => setTrips(trips.map(t => t.id === id ? {...t, ...data} : t))}
            onDeleteTrip={(id) => setTrips(trips.filter(t => t.id !== id))}
            onNavigateTab={setActiveTab}
            userName="旅人"
            userAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            events={currentEvents}
            completedEventIds={completedEventIds}
            onCompleteEvent={handleCompleteEvent}
            onUndoCompleteEvent={handleUndoCompleteEvent}
          />
        );
      case AppTab.SCHEDULE: 
        return currentTrip ? (
          <Schedule 
            currentTrip={currentTrip} 
            events={currentEvents}
            onUpdateEvents={(evs) => setAllEvents({...allEvents, [currentTrip.id]: evs})}
          />
        ) : null;
      case AppTab.BOOKINGS: return <Bookings currentTripId={currentTripId} />;
      case AppTab.EXPENSES: return <Expenses currentTripId={currentTripId} />;
      case AppTab.PLANNING: return <Planning currentTripId={currentTripId} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4EB] flex justify-center selection:bg-orange-100">
      {/* 行動端容器：在桌機上會限寬並居中，在手機上則全螢幕 */}
      <div className="w-full max-w-md bg-[#F7F4EB] min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.05)] border-x border-stone-100/50">
        
        {/* 主要內容區 */}
        <main className="flex-1 p-5 overflow-y-auto pb-32 scrollbar-hide pt-safe">
          {renderContent()}
        </main>

        {/* 底部導覽列 - 加上安全區域補丁 */}
        {trips.length > 0 && (
          <div className="pb-safe bg-white/90 backdrop-blur-md fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50">
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
