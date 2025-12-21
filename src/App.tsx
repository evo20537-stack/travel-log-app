
import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Planning from './screens/Planning';
import { AppTab, Trip, ScheduleEvent, Expense } from './types';
import { supabase } from './supabaseClient'; // 導入我們建立的 Supabase Client
import { PostgrestError } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid'; // 導入 uuid 來產生獨一無二的 ID

// 將 Supabase 回傳的資料（可能包含錯誤）和一個讀取狀態打包在一起
interface SupabaseData<T> {
  data: T;
  loading: boolean;
  error: PostgrestError | null;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  // --- 全新的 State 管理 ---
  const [trips, setTrips] = useState<SupabaseData<Trip[]>>({ data: [], loading: true, error: null });
  const [allEvents, setAllEvents] = useState<SupabaseData<Record<string, ScheduleEvent[]>>>({ data: {}, loading: true, error: null });
  const [allExpenses, setAllExpenses] = useState<SupabaseData<Record<string, Expense[]>>>({ data: {}, loading: true, error: null });

  // currentTripId 和 userProfile 暫時保留在 localStorage
  const [currentTripId, setCurrentTripId] = useState<string>(() => localStorage.getItem('travel_current_trip_id') || '');
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('travel_user_profile');
    return saved ? JSON.parse(saved) : { name: "旅人", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" };
  });

  // --- 智慧型資料植入函式 ---
  const seedDatabase = async () => {
    console.log("資料庫為空，正在植入範例資料...");

    const trip1Id = uuidv4();
    const trip2Id = uuidv4();

    const sampleTrips = [
      {
        id: trip1Id,
        title: '夏日沖繩自由行 🏖️',
        destination: '沖繩, 日本',
        dates: '2024.07.15 - 2024.07.20',
        image: 'https://cdn.gltjp.com/edo/img/summary/okinawa/hero__20251220-151749__.jpg',
        status: '規劃中', day: 'Day 1', color: 'bg-cyan-500', image_offset: 20
      },
      {
        id: trip2Id,
        title: '秋季京都楓葉之旅 🍁',
        destination: '京都, 日本',
        dates: '2024.11.20 - 2024.11.25',
        image: 'https://static.gltjp.com/glt/data/article/21000/20205/20221009_185503_37323ab7_w1920.webp',
        status: '規劃中', day: 'Day 1', color: 'bg-orange-500', image_offset: 50
      }
    ];

    const sampleEvents = [
      { id: uuidv4(), trip_id: trip1Id, date: '2024-07-16', time: '10:00', title: '美麗海水族館', location: '國頭郡本部町', type: 'activity', color: 'bg-blue-100 text-blue-500', notes: '看鯨鯊！' },
      { id: uuidv4(), trip_id: trip1Id, date: '2024-07-17', time: '18:00', title: '國際通逛街', location: '那霸市', type: 'shopping', color: 'bg-pink-100 text-pink-500', notes: '買伴手禮' },
      { id: uuidv4(), trip_id: trip2Id, date: '2024-11-21', time: '09:00', title: '清水寺', location: '東山區', type: 'activity', color: 'bg-red-100 text-red-500', notes: '從清水舞台看楓葉' },
      { id: uuidv4(), trip_id: trip2Id, date: '2024-11-22', time: '14:00', title: '嵐山竹林', location: '右京區', type: 'activity', color: 'bg-green-100 text-green-500' }
    ];

    const sampleExpenses = [
      { id: uuidv4(), trip_id: trip1Id, item: '機票', amount: 8000, currency: 'TWD', payer: 'Me', category: 'transport', date: '2024-06-01' },
      { id: uuidv4(), trip_id: trip1Id, item: '美國村飯店', amount: 25000, currency: 'JPY', payer: 'Me', category: 'stay', date: '2024-07-16' },
      { id: uuidv4(), trip_id: trip2Id, item: '和服體驗', amount: 5000, currency: 'JPY', payer: 'Wife', category: 'activity', date: '2024-11-21' },
      { id: uuidv4(), trip_id: trip2Id, item: '抹茶冰淇淋', amount: 500, currency: 'JPY', payer: 'Me', category: 'food', date: '2024-11-21' }
    ];

    await supabase.from('trips').insert(sampleTrips);
    await supabase.from('events').insert(sampleEvents);
    await supabase.from('expenses').insert(sampleExpenses);
  };

  // --- 全新的資料讀取邏輯 ---
  useEffect(() => {
    const fetchData = async () => {
      // 檢查是否需要植入資料 (只會執行一次)
      const hasSeeded = localStorage.getItem('database_seeded');
      if (!hasSeeded) {
        const { data: existingTrips } = await supabase.from('trips').select('id').limit(1);
        if (existingTrips && existingTrips.length === 0) {
          await seedDatabase();
        }
        localStorage.setItem('database_seeded', 'true');
      }

      // 讀取所有資料
      setTrips(prev => ({ ...prev, loading: true }));
      const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
      if (tripsError) {
        setTrips({ data: [], loading: false, error: tripsError });
      } else {
        setTrips({ data: tripsData || [], loading: false, error: null });
        const currentId = localStorage.getItem('travel_current_trip_id');
        if ((!currentId || !tripsData.some(t => t.id === currentId)) && tripsData && tripsData.length > 0) {
          setCurrentTripId(tripsData[0].id);
        }
      }

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

  // 更新 LocalStorage
  useEffect(() => { if (currentTripId) localStorage.setItem('travel_current_trip_id', currentTripId); }, [currentTripId]);
  useEffect(() => { localStorage.setItem('travel_user_profile', JSON.stringify(userProfile)); }, [userProfile]);

  // --- 全新的資料操作函式 (Create, Update, Delete) ---

  const handleAddTrip = async (data: Omit<Trip, 'id' | 'status' | 'day' | 'color'>) => {
    const newTrip = { id: uuidv4(), ...data, status: '規劃中', day: 'Day 1', color: 'bg-blue-500' };
    const { error } = await supabase.from('trips').insert([newTrip]);
    if (!error) {
      setTrips(prev => ({ ...prev, data: [newTrip, ...prev.data] }));
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
    if (!currentTripId) return;
    const newExpense = { ...newExpenseData, id: uuidv4(), trip_id: currentTripId };
    const { error } = await supabase.from('expenses').insert([newExpense]);
    if (!error) {
      setAllExpenses(prev => ({ ...prev, data: { ...prev.data, [currentTripId]: [...(prev.data[currentTripId] || []), newExpense] } }));
    } else console.error("Error adding expense:", error);
  };

  const renderContent = () => {
    const currentTrip = trips.data.find(t => t.id === currentTripId);
    const currentEvents = currentTrip ? (allEvents.data[currentTrip.id] || []) : [];
    const currentExpenses = currentTrip ? (allExpenses.data[currentTrip.id] || []) : [];

    if (trips.loading) return <div className="text-center p-10">讀取中...</div>;
    if (trips.error) return <div className="text-center p-10 text-red-500">讀取資料時發生錯誤...</div>;

    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard trips={trips.data} currentTripId={currentTripId} onTripChange={setCurrentTripId} onAddTrip={handleAddTrip} onEditTrip={handleEditTrip} onDeleteTrip={handleDeleteTrip} onNavigateTab={setActiveTab} userName={userProfile.name} userAvatar={userProfile.avatar} onUpdateUserProfile={setUserProfile} events={currentEvents} completedEventIds={new Set()} onCompleteEvent={() => {}} onUndoCompleteEvent={() => {}} expenses={currentExpenses} />;
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
