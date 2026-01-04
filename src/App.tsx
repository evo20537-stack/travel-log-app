import React, { useState, useEffect } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './screens/Dashboard';
import Schedule from './screens/Schedule';
import Expenses from './screens/Expenses';
import Bookings from './screens/Bookings';
import Checklist from './screens/Checklist';
import { AppTab, Trip, ScheduleEvent, Expense, Booking, ChecklistItem, Profile } from './types';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [allEvents, setAllEvents] = useState<Record<string, ScheduleEvent[]>>({});
  const [allExpenses, setAllExpenses] = useState<Record<string, Expense[]>>({});
  const [allBookings, setAllBookings] = useState<Record<string, Booking[]>>({});
  const [allChecklists, setAllChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  const [currentTripId, setCurrentTripId] = useState<string>(() => localStorage.getItem('travel_current_trip_id') || '');
  const [userProfile, setUserProfile] = useState<Profile>({ 
    id: 'default_user',
    name: "旅人", 
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=traveler`,
    exchangeRate: 0.22 
  });

  const [completedEventIds, setCompletedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 讀取個人資料（含匯率）
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', 'default_user')
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setUserProfile({ 
            id: 'default_user',
            name: profileData.name || '旅人', 
            avatar: profileData.avatar || '',
            exchangeRate: profileData.exchange_rate || 0.22
          });
        }

        // 抓取旅程
        const { data: tripsData, error: tripsError } = await supabase.from('trips').select('*').order('created_at', { ascending: true });
        if (tripsError) {
          console.error('Error fetching trips:', tripsError);
          setTrips([]);
        } else {
          const fetchedTrips = tripsData || [];
          setTrips(fetchedTrips);

          const tripIds = fetchedTrips.map(t => t.id);
          if (tripIds.length > 0) {
            // 並行抓取所有相關資料
            const [eventsRes, expensesRes, bookingsRes, checklistsRes] = await Promise.all([
              supabase.from('events').select('*').in('trip_id', tripIds),
              supabase.from('expenses').select('*').in('trip_id', tripIds),
              supabase.from('bookings').select('*').in('trip_id', tripIds),
              supabase.from('checklists').select('*').in('trip_id', tripIds),
            ]);

            // 檢查每一個抓取的錯誤
            if (eventsRes.error) console.error('Error fetching events:', eventsRes.error);
            if (expensesRes.error) console.error('Error fetching expenses:', expensesRes.error);
            if (bookingsRes.error) console.error('Error fetching bookings:', bookingsRes.error);
            if (checklistsRes.error) console.error('Error fetching checklists:', checklistsRes.error);

            const groupById = (data: any[] | null) => (data || []).reduce((acc, item) => {
              (acc[item.trip_id] = acc[item.trip_id] || []).push(item);
              return acc;
            }, {});

            setAllEvents(groupById(eventsRes.data));
            setAllExpenses(groupById(expensesRes.data));
            setAllBookings(groupById(bookingsRes.data));
            setAllChecklists(groupById(checklistsRes.data));
          }
        }
      } catch (error) {
        console.error('An unexpected error occurred during data fetching:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 更新個人資料函式
  const handleUpdateUserProfile = async (profileData: Omit<Profile, 'id'>) => {
    setUserProfile(prev => ({ ...prev, ...profileData }));
    await supabase.from('profiles').upsert({ 
      id: 'default_user', 
      name: profileData.name, 
      avatar: profileData.avatar,
      exchange_rate: profileData.exchangeRate 
    });
  };

  // 通用更新器
  const createUpdateHandler = (setter: any, tableName: string) => async (updatedData: any[]) => {
    if (!currentTripId) return;
    setter((prev: any) => ({ ...prev, [currentTripId]: updatedData }));
    await supabase.from(tableName).delete().eq('trip_id', currentTripId);
    if (updatedData.length > 0) {
      await supabase.from(tableName).upsert(updatedData.map(item => ({ ...item, trip_id: currentTripId })));
    }
  };

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center min-h-screen">載入中...</div>;

    const currentTrip = trips.find(t => t.id === currentTripId);
    if (!currentTrip || trips.length === 0) {
      return (
        <Dashboard 
          trips={trips} 
          currentTripId={currentTripId} 
          onAddTrip={async (data) => { /* 實作 AddTrip */ }}
          onNavigateTab={setActiveTab} 
          userProfile={userProfile}
          onUpdateUserProfile={handleUpdateUserProfile} 
          events={[]} expenses={[]} onTripChange={setCurrentTripId} onEditTrip={()=>{}} onDeleteTrip={()=>{}} completedEventIds={new Set()} onCompleteEvent={()=>{}} onUndoCompleteEvent={()=>{}}
        />
      );
    }

    const commonProps = {
      currentTrip,
      events: allEvents[currentTrip.id] || [],
      expenses: allExpenses[currentTrip.id] || [],
      bookings: allBookings[currentTrip.id] || [],
      checklist: allChecklists[currentTrip.id] || [],
    };

    switch (activeTab) {
      case AppTab.DASHBOARD: 
        return <Dashboard {...commonProps} trips={trips} currentTripId={currentTripId} onTripChange={setCurrentTripId} onNavigateTab={setActiveTab} userProfile={userProfile} onUpdateUserProfile={handleUpdateUserProfile} completedEventIds={completedEventIds} onCompleteEvent={(id)=>setCompletedEventIds(prev=>new Set(prev).add(id))} onUndoCompleteEvent={(id)=>setCompletedEventIds(prev=>{const n=new Set(prev);n.delete(id);return n;})} onAddTrip={()=>{}} onEditTrip={()=>{}} onDeleteTrip={()=>{}} />;
      case AppTab.SCHEDULE: return <Schedule {...commonProps} onUpdateEvents={createUpdateHandler(setAllEvents, 'events')} />;
      case AppTab.BOOKINGS: return <Bookings {...commonProps} onUpdateBookings={createUpdateHandler(setAllBookings, 'bookings')} />;
      case AppTab.EXPENSES: return <Expenses {...commonProps} onUpdateExpenses={createUpdateHandler(setAllExpenses, 'expenses')} exchangeRates={{ TWD: userProfile.exchangeRate }} />;
      case AppTab.PLANNING: return <Checklist {...commonProps} onUpdateChecklist={createUpdateHandler(setAllChecklists, 'checklists')} />;
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
