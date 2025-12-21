import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Checklist from './screens/Checklist'; // 導入新的願望清單頁面
import { AppTab, Trip, ScheduleEvent, Expense, Booking, ChecklistItem } from './types';
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

interface SupabaseData<T> {
  data: T;
  loading: boolean;
  error: PostgrestError | null;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  // --- 狀態管理：將所有資料源分開管理 ---
  const [trips, setTrips] = useState<SupabaseData<Trip[]>>({ data: [], loading: true, error: null });
  const [allEvents, setAllEvents] = useState<SupabaseData<Record<string, ScheduleEvent[]>>>({ data: {}, loading: true, error: null });
  const [allExpenses, setAllExpenses] = useState<SupabaseData<Record<string, Expense[]>>>({ data: {}, loading: true, error: null });
  const [allBookings, setAllBookings] = useState<SupabaseData<Record<string, Booking[]>>>({ data: {}, loading: true, error: null });
  const [allChecklists, setAllChecklists] = useState<SupabaseData<Record<string, ChecklistItem[]>>>({ data: {}, loading: true, error: null });

  // --- 使用者狀態：旅程ID和個人資料 ---
  const [currentTripId, setCurrentTripId] = useState<string>(() => localStorage.getItem('travel_current_trip_id') || '');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('travel_user_profile') || 'null') || { name: "旅人", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` };
    } catch { 
      return { name: "旅人", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` };
    }
  });

  // --- 核心資料讀取邏輯 ---
  useEffect(() => {
    const fetchData = async () => {
      console.log("正在從 Supabase 讀取所有資料...");
      const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*');
      
      if (tripsData) {
        setTrips({ data: tripsData, loading: false, error: null });
        const currentId = localStorage.getItem('travel_current_trip_id');
        if (tripsData.length > 0 && (!currentId || !tripsData.some(t => t.id === currentId))) {
          setCurrentTripId(tripsData[0].id);
        }
      } else {
        setTrips({ data: [], loading: false, error: tripsError });
        console.error("讀取旅程失敗:", tripsError);
      }

      const [eventsRes, expensesRes, bookingsRes, checklistsRes] = await Promise.all([
        supabase.from('events').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('bookings').select('*'),
        supabase.from('checklists').select('*'),
      ]);

      const processData = (res: any, setter: any) => {
        if (res.data) {
          const dataByTrip = res.data.reduce((acc: any, item: any) => {
            (acc[item.trip_id] = acc[item.trip_id] || []).push(item);
            return acc;
          }, {});
          setter({ data: dataByTrip, loading: false, error: null });
        }
      };

      processData(eventsRes, setAllEvents);
      processData(expensesRes, setAllExpenses);
      processData(bookingsRes, setAllBookings);
      processData(checklistsRes, setAllChecklists);
      console.log("✅ 資料讀取完畢");
    };
    fetchData();
  }, []);

  useEffect(() => { if (currentTripId) localStorage.setItem('travel_current_trip_id', currentTripId); }, [currentTripId]);
  useEffect(() => { localStorage.setItem('travel_user_profile', JSON.stringify(userProfile)); }, [userProfile]);

  // --- 通用的資料更新處理器 (樂觀更新) ---
  const createUpdateHandler = <T extends { id: string, trip_id?: string }>(
    stateSetter: React.Dispatch<React.SetStateAction<SupabaseData<Record<string, T[]>>>>,
    tableName: string
  ) => async (updatedData: T[]) => {
    if (!currentTripId) return;
    const originalData = (stateSetter as any).data[currentTripId] || [];
    stateSetter(prev => ({ ...prev, data: { ...prev.data, [currentTripId]: updatedData } }));

    const { error } = await supabase.from(tableName).delete().eq('trip_id', currentTripId);
    if (error) {
      console.error(`刪除舊 ${tableName} 失敗:`, error);
      stateSetter(prev => ({ ...prev, data: { ...prev.data, [currentTripId]: originalData } })); // 錯誤時還原
      return;
    }

    const { error: upsertError } = await supabase.from(tableName).upsert(updatedData.map(item => ({ ...item, trip_id: currentTripId })));
    if (upsertError) {
      console.error(`更新 ${tableName} 失敗:`, upsertError);
      stateSetter(prev => ({ ...prev, data: { ...prev.data, [currentTripId]: originalData } })); // 錯誤時還原
    }
  };

  // --- 各個功能的更新函數 ---
  const handleUpdateEvents = createUpdateHandler(setAllEvents, 'events');
  const handleUpdateBookings = createUpdateHandler(setAllBookings, 'bookings');
  const handleUpdateExpenses = createUpdateHandler(setAllExpenses, 'expenses');
  const handleUpdateChecklists = createUpdateHandler(setAllChecklists, 'checklists');

  // --- 旅程本身的 CRUD 操作 ---
  const handleAddTrip = async (tripData: any) => {
    const { data, error } = await supabase.from('trips').insert([tripData]).select();
    if (data) {
      setTrips(prev => ({ ...prev, data: [...prev.data, data[0]] }));
      setCurrentTripId(data[0].id);
      setActiveTab(AppTab.DASHBOARD);
    } else {
      console.error("新增旅程失敗:", error);
    }
  };

  const handleEditTrip = async (id: string, tripData: Partial<Trip>) => {
    const { data, error } = await supabase.from('trips').update(tripData).eq('id', id).select();
    if (data) {
      setTrips(prev => ({ ...prev, data: prev.data.map(t => t.id === id ? data[0] : t) }));
    } else {
      console.error("編輯旅程失敗:", error);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm("確定要永久刪除這個旅程和所有相關資料嗎？此操作無法復原。")) return;
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (!error) {
      const newTrips = trips.data.filter(t => t.id !== id);
      setTrips(prev => ({ ...prev, data: newTrips }));
      if (currentTripId === id) {
        setCurrentTripId(newTrips[0]?.id || '');
      }
    } else {
      console.error("刪除旅程失敗:", error);
    }
  };

  // --- 渲染主要內容 ---
  const renderContent = () => {
    const currentTrip = trips.data.find(t => t.id === currentTripId);
    if (trips.loading) return <div className="text-center p-10">讀取中...</div>;
    if (trips.error) return <div className="text-center p-10 text-red-500">錯誤: {trips.error.message}</div>;
    if (trips.data.length === 0) return <Dashboard trips={[]} onAddTrip={handleAddTrip} onNavigateTab={setActiveTab} {...({} as any)} />; // 顯示初始的 Dashboard

    if (!currentTrip) return <div className="text-center p-10">請選擇一個旅程</div>;

    const commonProps = { currentTrip, events: allEvents.data[currentTrip.id] || [], expenses: allExpenses.data[currentTrip.id] || [], bookings: allBookings.data[currentTrip.id] || [], checklist: allChecklists.data[currentTrip.id] || [] };

    switch (activeTab) {
      case AppTab.DASHBOARD: return <Dashboard {...commonProps} trips={trips.data} currentTripId={currentTripId} onTripChange={setCurrentTripId} onAddTrip={handleAddTrip} onEditTrip={handleEditTrip} onDeleteTrip={handleDeleteTrip} onNavigateTab={setActiveTab} userName={userProfile.name} userAvatar={userProfile.avatar} onUpdateUserProfile={setUserProfile} completedEventIds={new Set()} onCompleteEvent={()=>{}} onUndoCompleteEvent={()=>{}}  />;
      case AppTab.SCHEDULE: return <Schedule {...commonProps} onUpdateEvents={handleUpdateEvents} />;
      case AppTab.BOOKINGS: return <Bookings {...commonProps} onUpdateBookings={handleUpdateBookings} />;
      case AppTab.EXPENSES: return <Expenses {...commonProps} onUpdateExpenses={handleUpdateExpenses} />;
      // --- 啟用 Checklist/Planning Tab ---
      case AppTab.PLANNING: return <Checklist {...commonProps} onUpdateChecklist={handleUpdateChecklists} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F4EB] flex justify-center selection:bg-orange-100 overflow-x-hidden">
      <div className="w-full max-w-md bg-[#F7F4EB] min-h-screen flex flex-col relative shadow-lg">
        <main className="flex-1 p-5 overflow-y-auto pb-24 scrollbar-hide pt-safe">{renderContent()}</main>
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50">
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
};

export default App;
