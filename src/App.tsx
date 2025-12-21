import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Planning from './screens/Planning';
import { AppTab, Trip, ScheduleEvent } from './types';
import { Camera, Utensils, Train, BedDouble, ShoppingBag } from 'lucide-react';

// --- MOCK DATA (Local Mode) ---
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
    { id: 'e4', time: '15:30', title: 'SHIBUYA SKY', location: '澀谷 Scramble Square', type: 'activity', color: 'bg-blue-100 text-blue-500', icon: Camera, notes: '預約場次 15:40' },
    { id: 'e5', time: '18:00', title: 'AFURI 拉麵', location: '原宿', type: 'food', color: 'bg-orange-100 text-orange-500', icon: Utensils },
  ]
};

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  
  // Data State (Local)
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS);
  const [currentTripId, setCurrentTripId] = useState<string>(MOCK_TRIPS[0].id);
  
  // Schedule State (Local)
  const [allEvents, setAllEvents] = useState<Record<string, ScheduleEvent[]>>(MOCK_EVENTS);
  const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

  // Trip Handlers
  const handleAddTrip = (data: { title: string; destination: string; dates: string }) => {
    const randomId = Math.floor(Math.random() * 1000);
    const newTrip: Trip = {
      id: Date.now().toString(),
      title: data.title || `${data.destination}之旅 ✨`,
      status: '規劃中',
      day: 'Day 1',
      dates: data.dates,
      image: `https://picsum.photos/seed/${randomId}/600/300`, // Random placeholder
      color: 'bg-blue-500'
    };
    
    setTrips([newTrip, ...trips]);
    setCurrentTripId(newTrip.id);
  };

  const handleEditTrip = (id: string, updatedData: Partial<Trip>) => {
    setTrips(trips.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  const handleDeleteTrip = (id: string) => {
    if (window.confirm("確定要刪除這個行程嗎？(本機模式)")) {
      const newTrips = trips.filter(t => t.id !== id);
      setTrips(newTrips);
      if (newTrips.length > 0) {
        setCurrentTripId(newTrips[0].id);
      } else {
        setCurrentTripId('');
      }
    }
  };

  // Schedule Handlers
  const handleUpdateEvents = (tripId: string, updatedEvents: ScheduleEvent[]) => {
    setAllEvents(prev => ({
      ...prev,
      [tripId]: updatedEvents
    }));
  };

  const handleCompleteEvent = (eventId: string) => {
    const newSet = new Set(completedEventIds);
    newSet.add(eventId);
    setCompletedEventIds(newSet);
  };

  const handleUndoCompleteEvent = (eventId: string) => {
    const newSet = new Set(completedEventIds);
    newSet.delete(eventId);
    setCompletedEventIds(newSet);
  };

  // Render Helpers
  const renderContent = () => {
    const currentTrip = trips.find(t => t.id === currentTripId) || trips[0];
    const currentEvents = currentTrip ? (allEvents[currentTrip.id] || []) : [];

    // Safety check if no trips exist
    if (!currentTrip && activeTab !== AppTab.DASHBOARD) {
        setActiveTab(AppTab.DASHBOARD);
    }

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return (
          <Dashboard 
            trips={trips} 
            currentTripId={currentTripId} 
            onTripChange={setCurrentTripId}
            onAddTrip={handleAddTrip}
            onEditTrip={handleEditTrip}
            onDeleteTrip={handleDeleteTrip}
            onNavigateTab={setActiveTab}
            userName="旅人" // Hardcoded for guest mode
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
            onUpdateEvents={(events) => handleUpdateEvents(currentTrip.id, events)}
          />
        ) : null;
      case AppTab.BOOKINGS: 
        return <Bookings currentTripId={currentTripId} />;
      case AppTab.EXPENSES: 
        return <Expenses currentTripId={currentTripId} />;
      case AppTab.PLANNING: 
        return <Planning currentTripId={currentTripId} />;
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#F7F4EB] flex flex-col shadow-2xl shadow-stone-200">
      <main className="flex-1 p-5 overflow-y-auto pb-24 scrollbar-hide">
        {renderContent()}
      </main>

      {trips.length > 0 && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
};

export default App;