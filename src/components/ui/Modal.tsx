
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // 優化：改為 items-start 靠上對齊，並增加 pt-20 的頂部間距
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20">
      {/* --- 背景遮罩 -- */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      {/* 
        --- Modal 主體：
        - 統一動畫效果為 zoom-in
        - 確保在所有螢幕尺寸上都是圓角矩形
      */}
      <div className="relative bg-[#F7F4EB] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[calc(100vh-10rem)] animate-in zoom-in-95 duration-300">
        {/* --- 固定標題列：增加 padding 和 border-b -- */}
        <div className="flex justify-between items-center p-5 border-b border-stone-200 shrink-0">
          <h3 className="text-xl font-black text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* --- 可滾動內容區：使用 overflow-y-auto -- */}
        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
