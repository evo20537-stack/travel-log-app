
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
    // --- 全局容器：增加 p-4 padding 給予邊界，使用 flex items-end sm:items-center 讓小螢幕時 Modal 從底部滑入，大螢幕置中 ---
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* --- 背景遮罩 -- */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />
      {/* 
        --- Modal 主體：
        - 增加 flex flex-col 讓 header 和 content 分開佈局
        - 增加 max-h-[90vh] 限制最大高度
        - 更改背景色為 #F7F4EB
        - 移除原有的 p-5，改為在 header 和 content 內部控制
        - 優化動畫效果，從小螢幕的 slide-in-from-bottom 到大螢幕的 zoom-in
      */}
      <div className="relative bg-[#F7F4EB] rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
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
