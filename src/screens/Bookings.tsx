import React, { useState, useMemo } from 'react';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Trip, Booking } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { Plane, BedDouble, Ticket, MoreHorizontal, Plus, Edit2, Trash2, CheckCircle, Clock, Copy, CalendarPlus, Building, Train, Star } from 'lucide-react';

// --- 全新的 Props 和分類定義 ---
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

// --- 全新的達人級功能：產生行事曆檔案 ---
const generateICS = (booking: Booking) => {
  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YourAppName//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@yourapp.com`,
    `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
    `DTSTART;VALUE=DATE:${format(parseISO(booking.date), 'yyyyMMdd')}`,
    `SUMMARY:${booking.title}`,
    `DESCRIPTION:預訂號碼: ${booking.confirmation_number || '無'}. 備註: ${booking.notes || '無'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  const blob = new Blob([cal], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${booking.title}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- 全新的票券元件 ---
const BookingTicket: React.FC<{ booking: Booking; onEdit: () => void; }> = ({ booking, onEdit }) => {
  const config = CATEGORY_MAP[booking.category] || CATEGORY_MAP['其他'];
  const Icon = config.icon;
  const statusConfig = {
      '已完成': { text: '已確認', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={14}/> },
      '待處理': { text: '待確認', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={14}/> }
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
                    {booking.date && <p><span className="font-bold">日期:</span> {format(parseISO(booking.date), 'yyyy / MM / dd')}</p>}
                    {booking.notes && <p className="whitespace-pre-wrap"><span className="font-bold">備註:</span> {booking.notes}</p>}
                </div>
              }
          </div>
          {/* 撕角 + 預訂碼區塊 */}
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
              <button 
                onClick={(e) => { e.stopPropagation(); generateICS(booking); }}
                className="ml-3 shrink-0 flex items-center gap-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                  <CalendarPlus size={14} /> 新增至行事曆
              </button>
          </div>
      </div>
  )
}

// --- 主元件 ---
const Bookings: React.FC<BookingsProps> = ({ currentTrip, bookings, onUpdateBookings }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeCategory, setActiveCategory] = useState<BookingCategory>('機票');

  const [formData, setFormData] = useState<Omit<Booking, 'id' | 'trip_id'>>({
    title: '',
    category: '機票',
    status: '已完成',
    date: new Date().toISOString().split('T')[0],
    confirmation_number: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingBooking(null);
    setFormData({
      title: '',
      category: activeCategory,
      status: '已完成',
      date: new Date().toISOString().split('T')[0],
      confirmation_number: '',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      title: booking.title,
      category: booking.category,
      status: booking.status,
      date: booking.date.split('T')[0],
      confirmation_number: booking.confirmation_number || '',
      notes: booking.notes || '',
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

    const newOrUpdatedBooking: Booking = {
      id: editingBooking ? editingBooking.id : uuidv4(),
      ...formData,
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
  
  // --- 語法修正：將 Icon 元件賦值給大寫字母開頭的變數 ---
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
              <BookingTicket key={booking.id} booking={booking} onEdit={() => handleOpenEdit(booking)} />
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
           <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">日期</label>
                <input type="date" required className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
           </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">預訂編號 (選填)</label>
              <input className="w-full p-3 rounded-xl border-2 border-stone-200 font-mono" value={formData.confirmation_number} onChange={e => setFormData({...formData, confirmation_number: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">備註 (選填)</label>
              <textarea rows={3} className="w-full p-3 rounded-xl border-2 border-stone-200 resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
           </div>
           <div className="flex gap-3 pt-2">
            {editingBooking && <Button type="button" variant="danger" onClick={() => handleDelete(editingBooking.id)} className="mr-auto"><Trash2 size={16} /></Button>}
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
            <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;