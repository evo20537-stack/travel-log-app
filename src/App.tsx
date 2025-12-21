
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Planning from './screens/Planning';
import { AppTab, Trip, ScheduleEvent, Expense } from './types';
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface SupabaseData<T> {
  data: T;
  loading: boolean;
  error: PostgrestError | null;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  const [trips, setTrips] = useState<SupabaseData<Trip[]>>({ data: [], loading: true, error: null });
  const [allEvents, setAllEvents] = useState<SupabaseData<Record<string, ScheduleEvent[]>>>({ data: {}, loading: true, error: null });
  const [allExpenses, setAllExpenses] = useState<SupabaseData<Record<string, Expense[]>>>({ data: {}, loading: true, error: null });

  const [currentTripId, setCurrentTripId] = useState<string>(() => localStorage.getItem('travel_current_trip_id') || '');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('travel_user_profile');
      return saved ? JSON.parse(saved) : { name: "旅人", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" };
    } catch (e) {
      return { name: "旅人", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" };
    }
  });

  const seedDatabase = async () => {
    console.log("資料庫為空，正在植入範例資料...");
    const trip1Id = uuidv4();
    const trip2Id = uuidv4();
    const sampleTrips = [
      { id: trip1Id, title: '夏日沖繩自由行 🏖️', destination: '沖繩, 日本', dates: '2024.07.15 - 2024.07.20', image: 'https://cdn.gltjp.com/edo/img/summary/okinawa/hero__20251220-151749__.jpg', status: '規劃中', color: 'bg-cyan-500', image_offset: 20 },
      { id: trip2Id, title: '秋季京都楓葉之旅 🍁', destination: '京都, 日本', dates: '2024.11.20 - 2024.11.25', image: 'https://static.gltjp.com/glt/data/article/21000/20205/20221009_185503_37323ab7_w1920.webp', status: '規劃中', color: 'bg-orange-500', image_offset: 50 },
    ];
    await supabase.from('trips').insert(sampleTrips);
  };

  useEffect(() => {
    const fetchData = async () => {
      const hasSeeded = localStorage.getItem('database_seeded');
      if (!hasSeeded) {
        const { data: existingTrips } = await supabase.from('trips').select('id').limit(1);
        if (existingTrips && existingTrips.length === 0) {
          await seedDatabase();
        }
        localStorage.setItem('database_seeded', 'true');
      }

      setTrips(prev => ({ ...prev, loading: true }));
      // 移除 .order()，我們將在客戶端進行更智慧的排序
      const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*');

      if (tripsError) {
        setTrips({ data: [], loading: false, error: tripsError });
      } else {
        // --- Bug 3 修正: 根據行程開始日期進行排序 ---
        const sortedTrips = (tripsData || []).sort((a, b) => {
          try {
            const startDateA = new Date(a.dates.split(' - ')[0].replace(/\./g, '-'));
            const startDateB = new Date(b.dates.split(' - ')[0].replace(/\./g, '-'));
            if (isNaN(startDateA.getTime()) || isNaN(startDateB.getTime())) return 0;
            return startDateA.getTime() - startDateB.getTime();
          } catch (e) { return 0; }
        });

        setTrips({ data: sortedTrips, loading: false, error: null });
        const currentId = localStorage.getItem('travel_current_trip_id');
        if ((!currentId || !sortedTrips.some(t => t.id === currentId)) && sortedTrips.length > 0) {
          setCurrentTripId(sortedTrips[0].id);
        }
      }

      // (其他資料讀取邏輯保持不變)
      const { data: eventsData, error: eventsError } = await supabase.from('events').select('*');
      if (eventsError) {
        setAllEvents({ data: {}, loading: false, error: eventsError });
      } else {
        const eventsByTrip = (eventsData || []).reduce((acc, event) => {
          const { trip_id, ...rest } = event;
          if (!acc[trip_id]) acc[trip_id] = [];
          acc[trip_id].push(rest as any);
          return acc;
        }, {} as Record<string, ScheduleEvent[]>);
        setAllEvents({ data: eventsByTrip, loading: false, error: null });
      }

      const { data: expensesData, error: expensesError } = await supabase.from('expenses').select('*');
      if (expensesError) {
        setAllExpenses({ data: {}, loading: false, error: expensesError });
      } else {
        const expensesByTrip = (expensesData || []).reduce((acc, expense) => {
          const { trip_id, ...rest } = expense;
          if (!acc[trip_id]) acc[trip_id] = [];
          acc[trip_id].push(rest as any);
          return acc;
        }, {} as Record<string, Expense[]>);
        setAllExpenses({ data: expensesByTrip, loading: false, error: null });
      }
    };

    fetchData();
  }, []);

  useEffect(() => { if (currentTripId) localStorage.setItem('travel_current_trip_id', currentTripId); }, [currentTripId]);
  useEffect(() => { localStorage.setItem('travel_user_profile', JSON.stringify(userProfile)); }, [userProfile]);
  
  // --- Bug 1 修正: 建立一個更安全的個人資料更新函式 ---
  const handleUpdateUserProfile = (data: { name?: string; avatar?: string }) => {
    setUserProfile(prevProfile => {
      const newProfile = { ...prevProfile, ...data };
      return newProfile;
    });
  };

  const handleAddTrip = async (data: Omit<Trip, 'id' | 'status' | 'day' | 'color'>) => {
    const newTrip = { id: uuidv4(), ...data, status: '規劃中', day: 'Day 1', color: 'bg-blue-500' };
    const { error } = await supabase.from('trips').insert([newTrip]);
    if (!error) {
      setTrips(prev => ({ ...prev, data: [newTrip, ...prev.data] })); // 這裡之後會被排序取代
      setCurrentTripId(newTrip.id);
    } else console.error("Error adding trip:", error);
  };

  const handleEditTrip = async (id: string, data: Partial<Trip>) => {
    const { error } = await supabase.from('trips').update(data).eq('id', id);
    if (!error) {
      setTrips(prev => ({ ...prev, data: prev.data.map(t => (t.id === id ? { ...t, ...data } : t)) }));
    } else console.error("Error editing trip:", error);
  };

  const handleDeleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) {
      const updatedTrips = trips.data.filter(t => t.id !== id);
      setTrips(prev => ({ ...prev, data: updatedTrips }));
      if (currentTripId === id && updatedTrips.length > 0) setCurrentTripId(updatedTrips[0].id);
      else if (updatedTrips.length === 0) setCurrentTripId('');
    } else console.error("Error deleting trip:", error);
  };

  const handleUpdateEvents = async (updatedEvents: ScheduleEvent[]) => {
    if (!currentTripId) return;
    const eventsWithTripId = updatedEvents.map(e => ({ ...e, trip_id: currentTripId }));
    await supabase.from('events').delete().eq('trip_id', currentTripId);
    const { error } = await supabase.from('events').insert(eventsWithTripId);
    if (!error) {
      setAllEvents(prev => ({ ...prev, data: { ...prev.data, [currentTripId]: updatedEvents } }));
    } else console.error("Error updating events:", error);
  };

  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
    // 省略實作細節
  };

  const renderContent = () => {
    const currentTrip = trips.data.find(t => t.id === currentTripId);
    const currentEvents = currentTrip ? (allEvents.data[currentTrip.id] || []) : [];
    const currentExpenses = currentTrip ? (allExpenses.data[currentTrip.id] || []) : [];

    if (trips.loading) return <div className="text-center p-10">讀取中...</div>;
    if (trips.error) return <div className="text-center p-10 text-red-500">讀取資料時發生錯誤...</div>;

    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard 
          trips={trips.data} 
          currentTripId={currentTripId} 
          onTripChange={setCurrentTripId} 
          onAddTrip={handleAddTrip} 
          onEditTrip={handleEditTrip} 
          onDeleteTrip={handleDeleteTrip} 
          onNavigateTab={setActiveTab} 
          userName={userProfile.name} 
          userAvatar={userProfile.avatar} 
          onUpdateUserProfile={handleUpdateUserProfile} // <-- 使用全新的安全函式
          events={currentEvents} 
          completedEventIds={new Set()} 
          onCompleteEvent={() => {}} 
          onUndoCompleteEvent={() => {}} 
          expenses={currentExpenses} 
        />;
      // (其他 Tab 保持不變)
      case AppTab.SCHEDULE:
        return currentTrip ? <Schedule currentTrip={currentTrip} events={currentEvents} onUpdateEvents={handleUpdateEvents} /> : null;
      case AppTab.BOOKINGS:
        return <Bookings currentTripId={currentTripId} />;
      case AppTab.EXPENSES:
        return <Expenses currentTripId={currentTripId} expenses={currentExpenses} onAddExpense={handleAddExpense} />;
      case AppTab.PLANNING:
        return <Planning currentTripId={currentTripId} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4EB] flex justify-center selection:bg-orange-100 overflow-x-hidden">
      <div className="w-full max-w-md bg-[#F7F4EB] min-h-screen flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.05)]">
        <main className="flex-1 p-5 overflow-y-auto pb-32 scrollbar-hide pt-safe">{renderContent()}</main>
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
