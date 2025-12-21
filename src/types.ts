export interface Trip {
  id: string;
  title: string;
  status: string;
  day: string;
  image: string;
  color: string;
  dates: string; // Added for Schedule context
}

export interface ScheduleEvent {
  id: string;
  time: string;
  title: string;
  location: string;
  mapUrl?: string; // specific google map link
  type: 'transport' | 'activity' | 'food' | 'stay' | 'shopping';
  notes?: string;
  transitTime?: string; // e.g. "30 mins"
  color: string; // styling helper
  icon?: any; // styling helper (LucideIcon)
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
  mapUrl?: string; // specific google map link
  fileUrl?: string; // Image for "Show Mode"
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
  image?: string; // Base64 for user upload or generated image
  isImageEdit?: boolean;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  SCHEDULE = 'schedule',
  BOOKINGS = 'bookings',
  EXPENSES = 'expenses',
  PLANNING = 'planning'
}