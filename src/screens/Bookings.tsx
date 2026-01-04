import React, { useState, useMemo } from 'react';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Trip, Booking } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { Plane, Building, Ticket, Star, Plus, Trash2, CheckCircle, Clock, Copy, MapPin, X, UploadCloud } from 'lucide-react';

// --- Props 和分類定義 ---
interface BookingsProps {
  currentTrip: Trip;
  bookings: Booking[];
  onUpdateBookings: (updatedBookings: Booking[]) => void;
}

type BookingCategory = '機票' | '住宿' | '票券' | '其他';
const BOOKING_CATEGORIES: BookingCategory[] = ['機票', '住宿', '票券'];

const CATEGORY_MAP: Record<BookingCategory, { icon: React.ElementType, color: string, verb: string }> = {
  '機票': { icon: Plane, color: 'bg-sky-100 text-sky-600', verb: '航班' },
  '住宿': { icon: Building, color: 'bg-indigo-100 text-indigo-600', verb: '住宿' },
  '票券': { icon: Ticket, color: 'bg-amber-100 text-amber-600', verb: '票券' },
  '其他': { icon: Star, color: 'bg-stone-100 text-stone-500', verb: '預訂' },
};

// --- 票券元件 ---
const BookingTicket: React.FC<{ booking: Booking; onEdit: () => void; onViewImage: (url: string) => void; }> = ({ booking, onEdit, onViewImage }) => {
  const config = CATEGORY_MAP[booking.category] || CATEGORY_MAP['其他'];
  const Icon = config.icon;
  const statusConfig = {
      '已完成': { text: '已確認', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14}/> },
      '待處理': { text: '待確認', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14}/> }
  }

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (booking.map_url) {
      window.open(booking.map_url, '_blank', 'noopener,noreferrer');
    }
  }

  const handleViewImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (booking.image_url) {
      onViewImage(booking.image_url);
    }
  }

  return (
      <div onClick={onEdit} className="cursor-pointer group bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-2xl flex flex-col active:scale-[0.98]">
          <div className="p-4 flex-1">
              <div className="flex justify-between items-start gap-3">
                  <div className={`shrink-0 w-12 h-12 rounded-lg ${config.color} flex items-center justify-center`}><Icon size={24} /></div>
                  <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${config.color.replace('bg-', 'text-').replace('-100', '-600')} tracking-wider`}>{config.verb}</p>
                      <h3 className="font-black text-stone-800 text-lg truncate">{booking.title}</h3>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full ${statusConfig[booking.status].color}`}>
                    {statusConfig[booking.status].icon} {statusConfig[booking.status].text}
                  </div>
              </div>
              {(booking.notes || booking.date) && 
                <div className="mt-3 text-sm space-y-2 text-stone-600">
                    {booking.date && (
                      <p>
                        <span className="font-bold">
                          {booking.category === '住宿' ? '期間:' : '日期:'}
                        </span>{' '}
                        {format(parseISO(booking.date), 'yyyy / MM / dd')}
                        {booking.category === '住宿' && booking.end_date && ` - ${format(parseISO(booking.end_date), 'MM / dd')}`}
                      </p>
                    )}
                    {booking.notes && <p className="whitespace-pre-wrap"><span className="font-bold">備註:</span> {booking.notes}</p>}
                </div>
              }
          </div>
          <div className="border-t-2 border-dashed border-stone-200 mt-2"></div>
          <div className="flex justify-between items-center p-3 bg-stone-50 rounded-b-2xl">
              <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Confirmation No.</p>
                  <div className="flex items-center gap-2">
                      <p className="font-mono font-bold text-stone-700 text-sm truncate">{booking.confirmation_number || '-'}</p>
                      {booking.confirmation_number && 
                          <button 
                              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(booking.confirmation_number!); alert('預訂編號已複製！') }}
                              className="p-1 text-stone-400 hover:text-orange-500 transition-colors"
                          ><Copy size={14} /></button>}
                  </div>
              </div>
              <div className="flex items-center gap-2">
                {booking.map_url &&
                  <button 
                    onClick={handleMapClick}
                    className="shrink-0 flex items-center gap-2 text-xs font-bold text-cyan-500 bg-cyan-50 px-3 py-2 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                      <MapPin size={14} /> 地圖
                  </button>
                }
                {booking.image_url &&
                  <button 
                    onClick={handleViewImageClick}
                    className="shrink-0 flex items-center gap-2 text-xs font-bold text-purple-500 bg-purple-50 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Ticket size={14}/> 票根
                  </button>
                }
              </div>
          </div>
      </div>
  )
}

// --- 主元件 ---
const Bookings: React.FC<BookingsProps> = ({ currentTrip, bookings, onUpdateBookings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeCategory, setActiveCategory] = useState<BookingCategory>('機票');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'trip_id'>>({
    title: '',
    category: '機票',
    status: '已完成',
    date: new Date().toISOString().split('T')[0],
    end_date: '',
    confirmation_number: '',
    notes: '',
    map_url: '',
    image_url: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAdd = () => {
    setEditingBooking(null);
    setFormData({
      title: '',
      category: activeCategory,
      status: '已完成',
      date: new Date().toISOString().split('T')[0],
      end_date: '',
      confirmation_number: '',
      notes: '',
      map_url: '',
      image_url: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      ...booking,
      date: booking.date.split('T')[0],
    });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這項預訂嗎？')) {
      onUpdateBookings(bookings.filter(b => b.id !== id));
      setIsFormOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const dataToSave: any = { ...formData };
    if (dataToSave.category !== '住宿') {
      dataToSave.end_date = undefined;
    }

    const newOrUpdatedBooking: Booking = {
      id: editingBooking ? editingBooking.id : uuidv4(),
      ...dataToSave,
    };

    let updatedList = editingBooking 
      ? bookings.map(b => b.id === editingBooking.id ? newOrUpdatedBooking : b)
      : [...bookings, newOrUpdatedBooking];
    
    updatedList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    onUpdateBookings(updatedList);
    setIsFormOpen(false);
  };

  const filteredBookings = useMemo(() => 
      bookings.filter(b => b.category === activeCategory).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
      [bookings, activeCategory]
  );
  
  const EmptyStateIcon = CATEGORY_MAP[activeCategory].icon;

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <header className="sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md z-40 pt-2 pb-4 border-b border-stone-200/50">
        <div className="flex justify-between items-end mb-4">
          <div>
              <span className="text-xs font-bold text-stone-500 truncate">{currentTrip.title}</span>
              <h2 className="text-2xl font-black text-stone-800">預訂憑證 🎫</h2>
          </div>
          <Button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-xl shadow-lg shadow-stone-200 shrink-0"><Plus size={20} /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-stone-200/70 p-1 rounded-xl">
          {BOOKING_CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`py-2 px-3 text-sm font-black rounded-lg transition-all duration-300 ${activeCategory === cat ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 opacity-60">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${CATEGORY_MAP[activeCategory].color}`}>
              <EmptyStateIcon size={32} />
            </div>
            <p className="font-bold text-stone-600 text-lg">尚無{activeCategory}預訂</p>
            <p className="text-sm text-stone-400 mt-1">點擊右上角新增一筆吧！</p>
          </div>
        ) : (
          filteredBookings.map(booking => (
              <BookingTicket key={booking.id} booking={booking} onEdit={() => handleOpenEdit(booking)} onViewImage={setViewingImage} />
          ))
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingBooking ? `編輯${formData.category}` : `新增${formData.category}`}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">標題</label>
              <input required placeholder={`例如: ${formData.category === '機票' ? '中華航空 CI130' : formData.category === '住宿' ? 'Cross Hotel Sapporo' : '札幌電視塔門票'}`} className="w-full p-3 rounded-xl border-2 border-stone-200 font-bold text-stone-800" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">類別</label>
                <select className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as BookingCategory})}>
                    {BOOKING_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                    <option>其他</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">狀態</label>
                 <select className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as '已完成' | '待處理'})}>
                    <option>已完成</option>
                    <option>待處理</option>
                </select>
            </div>
           </div>
           
           {formData.category === '住宿' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">入住日期</label>
                  <input type="date" required className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">退房日期</label>
                  <input type="date" className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})}/>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">日期</label>
                <input type="date" required className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
              </div>
            )}

           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">預訂編號 (選填)</label>
              <input className="w-full p-3 rounded-xl border-2 border-stone-200 font-mono" value={formData.confirmation_number} onChange={e => setFormData({...formData, confirmation_number: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">地圖連結 (選填)</label>
              <input type="url" placeholder="https://maps.app.goo.gl/..." className="w-full p-3 rounded-xl border-2 border-stone-200 font-mono" value={formData.map_url} onChange={e => setFormData({...formData, map_url: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">上傳票券圖片 (選填)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-stone-300 border-dashed rounded-xl bg-stone-50/50">
                    <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-stone-400" />
                        <div className="flex text-sm text-stone-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500 px-2 py-1">
                                <span>選擇檔案</span>
                                <input id="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                            </label>
                        </div>
                        <p className="text-xs text-stone-500">將 QR Code 或票券截圖上傳</p>
                    </div>
                </div>
            {formData.image_url && (
                <div className="mt-3 relative w-fit mx-auto">
                    <img src={formData.image_url} alt="Preview" className="h-32 rounded-lg shadow-md" />
                    <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><X size={14} /></button>
                </div>
            )}
           </div>
           <div className="flex gap-3 pt-2">
            {editingBooking && <Button type="button" variant="danger" onClick={() => handleDelete(editingBooking.id)} className="mr-auto"><Trash2 size={16} /></Button>}
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
            <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
          </div>
        </form>
      </Modal>

      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-fade-in p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative">
            <img 
              src={viewingImage} 
              alt="Booking QR Code or Ticket" 
              className="max-w-[95vw] max-h-[90vh] rounded-2xl bg-white shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
     )}
    </div>
  );
};

export default Bookings;
