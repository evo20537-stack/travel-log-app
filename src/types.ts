export interface Trip {
  id: string;
  title: string;
  status: string;
  day: string;
  image: string;
  imageOffset?: number; // 0-100% for object-position
  color: string;
  dates: string;
  destination: string;
}

export interface WeatherDay {
  date: string;
  temp: number;
  condition: string;
  icon: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
}

export interface ScheduleEvent {
  id: string;
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
  item: string;
  amount: number;
  currency: 'TWD' | 'JPY' | 'USD';
  payer: string;
  category: 'food' | 'transport' | 'shopping' | 'stay';
  date: string;
}

export interface Booking {
  id: string;
  type: 'flight' | 'hotel' | 'ticket';
  title: string;
  refNumber: string;
  datetime: string;
  location: string;
  mapUrl?: string;
  fileUrl?: string;
  notes?: string;
}

export type PlanningCategory = 'packing' | 'shops' | 'food' | 'shopping';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  image?: string;
  checked: boolean;
  category: PlanningCategory;
  notes?: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  isImageEdit?: boolean;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  BOOKINGS = 'bookings',
  EXPENSES = 'expenses',
  PLANNING = 'planning'
}
