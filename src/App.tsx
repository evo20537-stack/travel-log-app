import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Checklist from './screens/Checklist';
import { AppTab, Trip, ScheduleEvent, Expense, Booking, ChecklistItem } from './types';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  // --- 核心狀態管理 ---
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [allEvents, setAllEvents] = useState<Record<string, ScheduleEvent[]>>({});
  const [allExpenses, setAllExpenses] = useState<Record<string, Expense[]>>({});
  const [allBookings, setAllBookings] = useState<Record<string, Booking[]>>({});
  const [allChecklists, setAllChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  // --- 使用者與當前旅程狀態 ---
  const [currentTripId, setCurrentTripId] = useState<string>(() => localStorage.getItem('travel_current_trip_id') || '');
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const storedProfile = localStorage.getItem('travel_user_profile');
      if (storedProfile) return JSON.parse(storedProfile);
    } catch (e) { console.error("Failed to parse user profile", e); }
    return { name: "旅人", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}` };
  });

  // ✨ 新增：已完成事件的狀態管理
  const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

  // --- 核心資料讀取邏輯 (僅在啟動時執行一次) ---
  useEffect(() => {
    const fetchData = async () => {
      console.log("正在從 Supabase 讀取所有資料...");
      const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*').order('created_at', { ascending: true });

      if (tripsError) {
        console.error("讀取旅程失敗:", tripsError);
        setLoading(false);
        return;
      }

      const trips = tripsData || [];
      setTrips(trips);
      const tripIds = trips.map(t => t.id);
      
      const localTripId = localStorage.getItem('travel_current_trip_id');
      const initialTripId = (localTripId && trips.some(t => t.id === localTripId)) ? localTripId : (trips[0]?.id || '');
      setCurrentTripId(initialTripId);

      if (tripIds.length === 0) {
        setAllEvents({}); setAllExpenses({}); setAllBookings({}); setAllChecklists({});
        setLoading(false);
        return;
      }

      const [eventsRes, expensesRes, bookingsRes, checklistsRes] = await Promise.all([
        supabase.from('events').select('*').in('trip_id', tripIds),
        supabase.from('expenses').select('*').in('trip_id', tripIds),
        supabase.from('bookings').select('*').in('trip_id', tripIds),
        supabase.from('checklists').select('*').in('trip_id', tripIds),
      ]);

      const groupById = (data: any[] | null) => (data || []).reduce((acc, item) => {
        (acc[item.trip_id] = acc[item.trip_id] || []).push(item);
        return acc;
      }, {});

      setAllEvents(groupById(eventsRes.data));
      setAllExpenses(groupById(expensesRes.data));
      setAllBookings(groupById(bookingsRes.data));
      setAllChecklists(groupById(checklistsRes.data));
      setLoading(false);
      console.log("✅ 資料讀取完畢");
    };
    fetchData();
  }, []);

  // --- 本地快取管理 ---
  useEffect(() => { if(currentTripId) localStorage.setItem('travel_current_trip_id', currentTripId); }, [currentTripId]);
  useEffect(() => { localStorage.setItem('travel_user_profile', JSON.stringify(userProfile)); }, [userProfile]);

  // ✨ 新增：讀取與儲存「已完成事件」的快取
  useEffect(() => {
    if (!currentTripId) return;
    try {
      const storedIds = localStorage.getItem(`completed_events_${currentTripId}`);
      if (storedIds) {
        setCompletedEventIds(new Set(JSON.parse(storedIds)));
      }
      else {
        setCompletedEventIds(new Set()); // 如果沒有快取，則清空
      }
    } catch (e) { console.error("Failed to parse completed events", e); setCompletedEventIds(new Set()); }
  }, [currentTripId]); // 當旅程切換時，重新讀取

  useEffect(() => {
    if (!currentTripId) return;
    localStorage.setItem(`completed_events_${currentTripId}`, JSON.stringify(Array.from(completedEventIds)));
  }, [completedEventIds, currentTripId]);

  // --- 通用更新處理器 (適用於 Schedule, Expenses, Bookings, Checklist) ---
  const createUpdateHandler = <T extends { id: string, trip_id?: string }>(
    stateSetter: React.Dispatch<React.SetStateAction<Record<string, T[]>>>,
    tableName: string
  ) => async (updatedData: T[]) => {
    if (!currentTripId) return;
    const originalData = allEvents[currentTripId] || [];
    stateSetter(prev => ({ ...prev, [currentTripId]: updatedData as any }));

    const dataToUpsert = updatedData.map(item => ({ ...item, trip_id: currentTripId }));

    const { error: deleteError } = await supabase.from(tableName).delete().eq('trip_id', currentTripId);
    if (deleteError) {
      console.error(`刪除舊 ${tableName} 失敗:`, deleteError);
      stateSetter(prev => ({ ...prev, [currentTripId]: originalData as any }));
      alert(`更新失敗: ${deleteError.message}`);
      return;
    }

    if (dataToUpsert.length > 0) {
      const { error: upsertError } = await supabase.from(tableName).upsert(dataToUpsert);
      if (upsertError) {
        console.error(`更新 ${tableName} 失敗:`, upsertError);
        stateSetter(prev => ({ ...prev, [currentTripId]: originalData as any }));
        alert(`更新失敗: ${upsertError.message}`);
      }
    }
  };
  
  const handleUpdateEvents = createUpdateHandler(setAllEvents, 'events');
  const handleUpdateBookings = createUpdateHandler(setAllBookings, 'bookings');
  const handleUpdateExpenses = createUpdateHandler(setAllExpenses, 'expenses');
  const handleUpdateChecklists = createUpdateHandler(setAllChecklists, 'checklists');

  // --- 旅程本身的 CRUD 操作 ---
  const handleAddTrip = async (tripData: Omit<Trip, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase.from('trips').insert([tripData]).select();
    if (data) {
      const newTrip = data[0];
      setTrips(prev => [...prev, newTrip]);
      setCurrentTripId(newTrip.id);
      setActiveTab(AppTab.DASHBOARD);
    } else { console.error("新增旅程失敗:", error); alert(`新增旅程失敗: ${error.message}`); }
  };

  const handleEditTrip = async (id: string, tripData: Partial<Trip>) => {
    const { data, error } = await supabase.from('trips').update(tripData).eq('id', id).select();
    if (data) {
      setTrips(prev => prev.map(t => t.id === id ? data[0] : t));
    } else { console.error("編輯旅程失敗:", error); alert(`編輯失敗: ${error?.message}`); }
  };

  // ✨ 徹底修正：刪除旅程時，一併刪除所有子項目
  const handleDeleteTrip = async (id: string) => {
    if (!window.confirm("確定要永久刪除這個旅程和所有相關資料嗎？此操作無法復原。")) return;

    console.log(`準備刪除旅程 ${id} 及其所有子項目...`);
    const tablesToDeleteFrom = ['events', 'expenses', 'bookings', 'checklists'];
    const deletePromises = tablesToDeleteFrom.map(table => supabase.from(table).delete().eq('trip_id', id));

    const results = await Promise.all(deletePromises);
    const deleteErrors = results.map(res => res.error).filter(Boolean);

    if (deleteErrors.length > 0) {
      console.error("刪除子項目失敗:", deleteErrors);
      alert(`刪除旅程的相關資料時發生錯誤： ${deleteErrors.map(e => e!.message).join('\n')}`);
      return;
    }
    console.log("✅ 所有子項目都已刪除");

    const { error: tripError } = await supabase.from('trips').delete().eq('id', id);

    if (!tripError) {
      console.log("✅ 旅程本身已刪除");
      const newTrips = trips.filter(t => t.id !== id);
      setTrips(newTrips);

      const clearState = (setter: Function) => setter((prev: any) => { const newState = { ...prev }; delete newState[id]; return newState; });
      clearState(setAllEvents); clearState(setAllExpenses); clearState(setAllBookings); clearState(setAllChecklists);

      if (currentTripId === id) {
        const newCurrentId = newTrips[0]?.id || '';
        setCurrentTripId(newCurrentId);
        if (!newCurrentId) localStorage.removeItem('travel_current_trip_id');
      }
    } else {
      console.error("刪除旅程失敗:", tripError);
      alert(`刪除旅程失敗: ${tripError.message}`);
    }
  };

  // ✨ 新增：完成/復原事件的處理函數
  const handleCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => new Set(prev).add(eventId));
  };

  const handleUndoCompleteEvent = (eventId: string) => {
    setCompletedEventIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(eventId);
      return newSet;
    });
  };

  // --- 渲染主要內容 ---
  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center min-h-screen">載入中...</div>;

    const currentTrip = trips.find(t => t.id === currentTripId);
    
    if (trips.length === 0) {
      return <Dashboard trips={[]} currentTripId={''} onAddTrip={handleAddTrip} onNavigateTab={setActiveTab} userName={userProfile.name} userAvatar={userProfile.avatar} onUpdateUserProfile={setUserProfile} events={[]} expenses={[]} onTripChange={()=>{}} onEditTrip={()=>{}} onDeleteTrip={()=>{}} completedEventIds={new Set()} onCompleteEvent={()=>{}} onUndoCompleteEvent={()=>{}} />;
    }

    if (!currentTrip) return <div className="text-center p-10">正在讀取旅程...</div>;

    const commonProps = {
      key: currentTrip.id,
      currentTrip,
      events: allEvents[currentTrip.id] || [],
      expenses: allExpenses[currentTrip.id] || [],
      bookings: allBookings[currentTrip.id] || [],
      checklist: allChecklists[currentTrip.id] || [],
    };

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return <Dashboard {...commonProps} trips={trips} currentTripId={currentTripId} onTripChange={setCurrentTripId} onAddTrip={handleAddTrip} onEditTrip={handleEditTrip} onDeleteTrip={handleDeleteTrip} onNavigateTab={setActiveTab} userName={userProfile.name} userAvatar={userProfile.avatar} onUpdateUserProfile={setUserProfile} completedEventIds={completedEventIds} onCompleteEvent={handleCompleteEvent} onUndoCompleteEvent={handleUndoCompleteEvent} />;
      case AppTab.SCHEDULE: return <Schedule {...commonProps} onUpdateEvents={handleUpdateEvents} />;
      case AppTab.BOOKINGS: return <Bookings {...commonProps} onUpdateBookings={handleUpdateBookings} />;
      case AppTab.EXPENSES: return <Expenses {...commonProps} onUpdateExpenses={handleUpdateExpenses} />;
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
