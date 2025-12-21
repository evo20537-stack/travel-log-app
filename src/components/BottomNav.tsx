import React from 'react';
import { Home, Calendar, Ticket, Wallet, CheckSquare } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: AppTab.DASHBOARD, icon: Home, label: '首頁' },
    { id: AppTab.SCHEDULE, icon: Calendar, label: '行程' },
    { id: AppTab.BOOKINGS, icon: Ticket, label: '預訂' },
    { id: AppTab.EXPENSES, icon: Wallet, label: '記帳' },
    { id: AppTab.PLANNING, icon: CheckSquare, label: '清單' },
  ];

  return (
    <div className="flex justify-around items-center px-4 py-3">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center p-2 min-w-[64px] transition-all duration-300 ${isActive ? 'text-orange-500 -translate-y-1' : 'text-stone-400 hover:text-stone-500'}`}
          >
            <item.icon 
              size={isActive ? 24 : 22} 
              strokeWidth={isActive ? 2.5 : 2}
              fill={isActive ? "currentColor" : "none"}
              className={isActive ? "text-orange-400" : ""}
            />
            <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-stone-800' : 'text-stone-400'}`}>
              {item.label}
            </span>
            {isActive && <div className="w-1 h-1 bg-orange-500 rounded-full mt-1 animate-pulse" />}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
