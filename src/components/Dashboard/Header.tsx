
import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  userName: string;
  userAvatar: string;
  tripsLength: number;
  onProfileClick: () => void;
  onAddTripClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userName, userAvatar, tripsLength, onProfileClick, onAddTripClick }) => (
  <header className="flex justify-between items-center mb-2">
    <div className="flex items-center gap-3">
      <button
        onClick={onProfileClick}
        className="w-12 h-12 rounded-full bg-white overflow-hidden border-2 border-white shadow-xl active:scale-90 transition-transform"
      >
        <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
      </button>
      <div>
        <h2 className="text-stone-500 text-xs font-black tracking-widest uppercase opacity-70">你好, {userName} ✨</h2>
        <h1 className="text-xl font-black text-stone-800">{tripsLength > 0 ? '今天想去哪裡？' : '開始你的第一趟旅程吧！'}</h1>
      </div>
    </div>
    <button
      onClick={onAddTripClick}
      className="bg-stone-800 text-white p-3 rounded-2xl shadow-xl shadow-stone-200 active:scale-95 transition-all"
    >
      <Plus size={20} strokeWidth={3} />
    </button>
  </header>
);

export default Header;
