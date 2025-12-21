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
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-stone-100 pb-safe pt-2 px-2 z-50 rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center p-2 min-w-[56px] transition-all duration-300 ${isActive ? 'text-orange-500 -translate-y-1' : 'text-stone-400 hover:text-stone-500'}`}
            >
              <item.icon 
                size={isActive ? 24 : 22} 
                strokeWidth={isActive ? 2.5 : 2}
                fill={isActive ? "currentColor" : "none"}
                className={isActive ? "text-orange-400" : ""}
              />
              <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-stone-700' : 'text-stone-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;