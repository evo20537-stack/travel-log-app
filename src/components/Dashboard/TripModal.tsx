
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trash2, Upload, ImageIcon, Move } from 'lucide-react';
import { Trip } from '../../types';

interface TripModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrip: Trip | null;
  onAddTrip: (data: Omit<Trip, 'id' | 'user_id' | 'created_at'>) => void;
  onEditTrip: (id: string, data: Partial<Trip>) => void;
  onDeleteTrip: (id: string) => void;
}

const TripModal: React.FC<TripModalProps> = ({ isOpen, onClose, editingTrip, onAddTrip, onEditTrip, onDeleteTrip }) => {
  const [tripFormData, setTripFormData] = useState({
    title: '', destination: '', dates: '', status: '規劃中' as Trip['status'], image: '', image_offset: 50
  });
  const tripFileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startOffset, setStartOffset] = useState(50);

  useEffect(() => {
    if (editingTrip) {
      setTripFormData({
        title: editingTrip.title,
        destination: editingTrip.destination || '',
        dates: editingTrip.dates,
        status: editingTrip.status,
        image: editingTrip.image || '',
        image_offset: editingTrip.image_offset ?? 50
      });
    } else {
      setTripFormData({ title: '', destination: '', dates: '', status: '規劃中', image: '', image_offset: 50 });
    }
  }, [editingTrip, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTripFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { image, ...restOfData } = tripFormData;
    const dataToSubmit: any = { ...restOfData, image_offset: Math.round(tripFormData.image_offset) };

    if (image.startsWith('data:image')) {
      dataToSubmit.image = image;
    }

    if (editingTrip) {
      onEditTrip(editingTrip.id, dataToSubmit);
    } else {
      onAddTrip(dataToSubmit);
    }
    onClose();
  };

  const onImagePointerDown = (e: React.PointerEvent) => {
    if (!tripFormData.image) return;
    setIsDragging(true);
    setStartY(e.clientY);
    setStartOffset(tripFormData.image_offset);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onImagePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newOffset = Math.max(0, Math.min(100, startOffset - (deltaY / 2)));
    setTripFormData(prev => ({ ...prev, image_offset: Math.round(newOffset) }));
  };

  const onImagePointerUp = () => setIsDragging(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTrip ? "編輯行程" : "開啟新旅程"}>
      <form onSubmit={handleTripSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">行程封面 (可拖動調整位置)</label>
          <div
            className="relative h-44 w-full rounded-2xl overflow-hidden bg-stone-100 border-2 border-stone-200 cursor-move group select-none shadow-inner"
            onPointerDown={onImagePointerDown}
            onPointerMove={onImagePointerMove}
            onPointerUp={onImagePointerUp}
            onPointerLeave={onImagePointerUp}
            style={{ touchAction: 'none' }}
          >
            {tripFormData.image ? (
              <>
                <img src={tripFormData.image} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `50% ${tripFormData.image_offset}%` }} />
                <div className="absolute inset-0 border-2 border-orange-400/50 pointer-events-none group-active:border-orange-500"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity"><Move size={24} /></div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-300">
                <ImageIcon size={40} strokeWidth={1.5} />
                <span className="text-[10px] font-black mt-3 tracking-widest uppercase">點擊下方按鈕上傳照片</span>
              </div>
            )}
          </div>
          <input ref={tripFileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1 py-3 text-xs font-black" onClick={() => tripFileRef.current?.click()}><Upload size={14} /> 上傳封面</Button>
            {tripFormData.image && (
              <Button type="button" variant="ghost" className="text-stone-400 hover:text-red-500 px-4" onClick={() => setTripFormData(prev => ({ ...prev, image: '' }))}><Trash2 size={16} /></Button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">行程標題</label>
            <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" value={tripFormData.title} onChange={e => setTripFormData({ ...tripFormData, title: e.target.value })} placeholder="例：東京爆食之旅 🍣" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">目的地</label>
              <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" value={tripFormData.destination} onChange={e => setTripFormData({ ...tripFormData, destination: e.target.value })} placeholder="例：東京" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase mb-1">日期範圍</label>
              <input required className="w-full px-5 py-3.5 rounded-xl border-2 border-stone-100 focus:border-orange-400 focus:outline-none font-black text-stone-700" placeholder="04.10 - 04.15" value={tripFormData.dates} onChange={e => setTripFormData({ ...tripFormData, dates: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 pt-3">
          {editingTrip && (
            <button type="button" onClick={() => { if (editingTrip) onDeleteTrip(editingTrip.id); onClose(); }} className="w-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100 active:scale-90 transition-transform">
              <Trash2 size={20} />
            </button>
          )}
          <Button type="submit" className="flex-1 py-4 shadow-xl shadow-orange-100 font-black tracking-widest">
            {editingTrip ? '儲存變更' : '開啟這趟旅程'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TripModal;
