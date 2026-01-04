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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center" onClick={onClose}>
      <div 
        className="bg-[#F7F4EB] w-full max-w-2xl rounded-3xl shadow-lg flex flex-col max-h-[90vh] mx-4"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-stone-200 sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md">
          <h3 className="text-lg font-black text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full text-stone-500 hover:bg-stone-200">
            <X size={20} />
          </button>
        </header>
        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
