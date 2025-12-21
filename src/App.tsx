
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Planning from './screens/Planning';
import { AppTab, Trip, ScheduleEvent, Expense } from './types';
import { Camera, Utensils, Train } from 'lucide-react';

const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    title: '東京賞櫻爆買團 🌸',
    status: '即將出發',
    day: 'Day 1',
    dates: '2024.04.10 - 2024.04.15',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1000&auto=format&fit=crop',
    imageOffset: 50,
    color: 'bg-pink-500',
    destination: '東京'
  }
];

const MOCK_EVENTS: Record<string, ScheduleEvent[]> = {
  '1': [
    { id: 'e1', date: '2024-04-10', time: '09:00', title: '雷門 & 淺草寺', location: '淺草', type: 'activity', color: 'bg-red-100 text-red-500', icon: Camera, notes: '記得去遊客中心頂樓看晴空塔' },
    { id: 'e2', date: '2024-04-10', time: '12:00', title: '敘敘苑燒肉', location: '晴空塔 30F', type: 'food', color: 'bg-orange-100 text-orange-500', icon: Utensils, notes: '已訂位 12:00，窗邊座位' }
  ]
};

// 從 Expenses.tsx 搬移過來，作為 App.tsx 的初始資料
const MOCK_INITIAL_EXPENSES: Record<string, Expense[]> = {
  '1': [ // Tokyo
    { id: '1', item: '一蘭拉麵', amount: 2560, currency: 'JPY', payer: 'Me', category: 'food', date: '2024-04-12' },
    { id: '2', item: '西瓜卡儲值', amount: 3000, currency: 'JPY', payer: 'Me', category: 'transport', date: '2024-04-12' },
    { id: '3', item: '伴手禮', amount: 5000, currency: 'JPY', payer: 'Wife', category: 'shopping', date: '2024-04-11' },
    { id: '4', item: '機場接送', amount: 1200, currency: 'TWD', payer: 'Me', category: 'transport', date: '2024-04-10' },
  ],
  '2': [ // Kyoto
    { id: '5', item: '和服租借', amount: 8000, currency: 'JPY', payer: 'Me', category: 'shopping', date: '2024-11-21' },
    { id: '6', item: '嵐山小火車', amount: 1600, currency: 'JPY', payer: 'Me', category: 'transport', date: '2024-11-22' }
  ]
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  
  // 初始化資料：嘗試從 LocalStorage 讀取，若無則使用 Mock
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('travel_trips');
    return saved ? JSON.parse(saved) : MOCK_TRIPS;
  });

  const [currentTripId, setCurrentTripId] = useState<string>(() => {
    const saved = localStorage.getItem('travel_current_trip_id');
    return saved || (trips.length > 0 ? trips[0].id : '');
  });

  const [allEvents, setAllEvents] = useState<Record<string, ScheduleEvent[]>>(() => {
    const saved = localStorage.getItem('travel_events');
    return saved ? JSON.parse(saved) : MOCK_EVENTS;
  });

  const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('travel_completed_events');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('travel_user_profile');
    return saved ? JSON.parse(saved) : {
      name: "旅人",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
    };
  });

  // 新增 allExpenses 狀態
  const [allExpenses, setAllExpenses] = useState<Record<string, Expense[]>>(() => {
    const saved = localStorage.getItem('travel_expenses');
    return saved ? JSON.parse(saved) : MOCK_INITIAL_EXPENSES;
  });

  // 當資料變動時，自動同步到 LocalStorage
  useEffect(() => {
    localStorage.setItem('travel_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('travel_current_trip_id', currentTripId);
  }, [currentTripId]);

  useEffect(() => {
    localStorage.setItem('travel_events', JSON.stringify(allEvents));
  }, [allEvents]);

  useEffect(() => {
    localStorage.setItem('travel_completed_events', JSON.stringify(Array.from(completedEventIds)));
  }, [completedEventIds]);

  useEffect(() => {
    localStorage.setItem('travel_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('travel_expenses', JSON.stringify(allExpenses));
  }, [allExpenses]);


  const handleCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => new Set([...prev, eventId]));
  };

  const handleUndoCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  // 新增 handleAddExpense 函數
  const handleAddExpense = (newExpense: Expense) => {
    if (!currentTripId) return;
    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: [...(prev[currentTripId] || []), newExpense]
    }));
  };

  const renderContent = () => {
    const currentTrip = trips.find(t => t.id === currentTripId) || trips[0];
    const currentEvents = currentTrip ? (allEvents[currentTrip.id] || []) : [];
    const currentExpenses = currentTrip ? (allExpenses[currentTrip.id] || []) : []; // 取得當前行程的支出

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return (
          <Dashboard 
            trips={trips} 
            currentTripId={currentTripId} 
            onTripChange={setCurrentTripId}
            onAddTrip={(data) => {
                const newT = { id: Date.now().toString(), ...data, status: '規劃中', day: 'Day 1', color: 'bg-blue-500' };
                setTrips([newT, ...trips]);
                setCurrentTripId(newT.id);
            }}
            onEditTrip={(id, data) => setTrips(trips.map(t => t.id === id ? {...t, ...data} : t))}
            onDeleteTrip={(id) => {
                const updatedTrips = trips.filter(t => t.id !== id);
                setTrips(updatedTrips);
                if (currentTripId === id && updatedTrips.length > 0) {
                    setCurrentTripId(updatedTrips[0].id);
                }
            }}
            onNavigateTab={setActiveTab}
            userName={userProfile.name}
            userAvatar={userProfile.avatar}
            onUpdateUserProfile={setUserProfile}
            events={currentEvents}
            completedEventIds={completedEventIds}
            onCompleteEvent={handleCompleteEvent}
            onUndoCompleteEvent={handleUndoCompleteEvent}
            expenses={currentExpenses} // 傳遞當前行程的支出
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
      case AppTab.EXPENSES: 
        return (
          <Expenses 
            currentTripId={currentTripId} 
            expenses={currentExpenses} // 傳遞當前行程的支出
            onAddExpense={handleAddExpense} // 傳遞新增支出的函數
          />
        );
      case AppTab.PLANNING: return <Planning currentTripId={currentTripId} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4EB] flex justify-center selection:bg-orange-100 overflow-x-hidden">
      <div className="w-full max-w-md bg-[#F7F4EB] min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.05)]">
        <main className="flex-1 p-5 overflow-y-auto pb-32 scrollbar-hide pt-safe">
          {renderContent()}
        </main>

        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
          <div className="pb-safe bg-white/90 backdrop-blur-md border-t border-stone-100 rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
