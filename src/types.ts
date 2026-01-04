export interface Trip {
  id: string;
  title: string;
  destination: string;
  dates: string;
  status: string;
  image: string;
  image_offset?: number;
  color: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  exchangeRate: number;
}

export interface ScheduleEvent {
  id: string;
  trip_id?: string;
  date: string;
  endDate?: string;
  time: string;
  title: string;
  location: string;
  mapUrl?: string;
  type: 'transport' | 'activity' | 'food' | 'stay' | 'shopping';
  notes?: string;
  transitTime?: string;
  color: string;
  icon?: any;
}

export interface Expense {
  id: string;
  trip_id?: string;
  title: string;
  amount: number;
  category: '交通' | '住宿' | '餐飲' | '購物' | '娛樂' | '其他';
  date: string; 
  notes?: string;
  currency: 'TWD' | 'JPY';
}

export interface Booking {
  id: string;
  trip_id?: string;
  title: string;
  category: '機票' | '住宿' | '票券' | '其他';
  status: '已完成' | '待處理';
  date: string;
  confirmation_number?: string;
  notes?: string;
  map_url?: string;
  end_date?: string; // 為住宿功能保留
}

export interface ChecklistItem {
  id: string;
  trip_id?: string;
  title: string;
  is_completed: boolean;
  category: '購物' | '餐廳' | '景點';
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  BOOKINGS = 'bookings',
  EXPENSES = 'expenses',
  PLANNING = 'planning'
}

export interface WeatherDay {
    date: string;
    temp_max: number;
    temp_min: number;
    icon: string;
    description: string;
}
