import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Plane, Copy, Eye, EyeOff, QrCode, Ticket, BedDouble, MoreVertical, Plus, Edit2, Trash2, MapPin, AlignLeft } from 'lucide-react';
import { Booking } from '../types';

interface BookingsProps {
  currentTripId: string;
}

const MOCK_BOOKINGS: Record<string, Booking[]> = {
  '1': [ // Tokyo
    { id: 'b1', type: 'flight', title: 'JL 098', refNumber: 'XJ9P2M', datetime: '2024.04.10 14:20', location: 'TSA -> HND' },
    { id: 'b2', type: 'hotel', title: '淺草里士滿酒店', refNumber: 'HT-2921', datetime: 'Apr 10 - Apr 15', location: '東京都台東區淺草2-7-10', mapUrl: 'https://goo.gl/maps/example' }
  ],
  '2': [ // Kyoto
    { id: 'b3', type: 'flight', title: 'CI 172', refNumber: 'KP8891', datetime: '2024.11.20 10:00', location: 'TPE -> KIX' },
    { id: 'b4', type: 'ticket', title: '京都嵐山小火車', refNumber: 'TK-1122', datetime: 'Nov 21 13:00', location: '嵯峨野' }
  ]
};

type BookingType = 'hotel' | 'flight' | 'ticket';

const Bookings: React.FC<BookingsProps> = ({ currentTripId }) => {
  const [activeTab, setActiveTab] = useState<BookingType>('hotel');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showSensitive, setShowSensitive] = useState(false);

  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    refNumber: '',
    datetime: '',
    location: '',
    notes: '',
    mapUrl: '',
    type: 'hotel' as BookingType
  });

  // Load Data
  useEffect(() => {
    setBookings(MOCK_BOOKINGS[currentTripId] || []);
  }, [currentTripId]);

  // Filter Bookings based on active tab
  // Note: We group 'ticket' as 'Other' visually if needed, but here we map 1:1
  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ticket') return b.type === 'ticket'; // covers 'other'
    return b.type === activeTab;
  });

  const handleOpenAdd = () => {
    setEditingBooking(null);
    setFormData({
      title: '',
      refNumber: '',
      datetime: '',
      location: '',
      notes: '',
      mapUrl: '',
      type: activeTab // Default to current tab
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      title: booking.title,
      refNumber: booking.refNumber,
      datetime: booking.datetime,
      location: booking.location,
      notes: booking.notes || '',
      mapUrl: booking.mapUrl || '',
      type: booking.type
    });
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (editingBooking && confirm('確定要刪除這張憑證嗎？')) {
      setBookings(bookings.filter(b => b.id !== editingBooking.id));
      setIsFormOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: Booking = {
      id: editingBooking ? editingBooking.id : Date.now().toString(),
      type: formData.type,
      title: formData.title,
      refNumber: formData.refNumber,
      datetime: formData.datetime,
      location: formData.location,
      notes: formData.notes,
      mapUrl: formData.mapUrl
    };

    if (editingBooking) {
      setBookings(bookings.map(b => b.id === editingBooking.id ? newBooking : b));
    } else {
      setBookings([...bookings, newBooking]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-stone-800">預訂憑證 🎫</h2>
        <button 
          onClick={handleOpenAdd}
          className="bg-stone-800 text-white p-2 rounded-xl active:scale-95 transition-transform"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-stone-200 rounded-xl">
        {[
          { id: 'hotel', label: '住宿', icon: BedDouble },
          { id: 'flight', label: '機票', icon: Plane },
          { id: 'ticket', label: '其他', icon: Ticket },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as BookingType)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-stone-800 shadow-sm' 
                : 'text-stone-500 hover:text-stone-600'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toggle Privacy */}
      <div className="flex justify-end">
        <button 
          onClick={() => setShowSensitive(!showSensitive)}
          className="text-xs font-bold text-stone-500 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-stone-200"
        >
          {showSensitive ? <EyeOff size={14}/> : <Eye size={14}/>}
          {showSensitive ? '隱藏資訊' : '顯示資訊'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <Ticket size={48} className="mx-auto mb-2 text-stone-300" />
            <p className="font-bold text-stone-500">此分類暫無憑證</p>
            <Button variant="ghost" className="mt-2 text-orange-500" onClick={handleOpenAdd}>
              + 立即新增
            </Button>
          </div>
        ) : (
          filteredBookings.map(booking => (
            booking.type === 'flight' ? (
               /* FLIGHT CARD */
               <Card key={booking.id} className="relative overflow-hidden border-none group" noPadding>
                  <div className="bg-orange-500 p-4 text-white relative">
                    <div className="flex justify-between items-start z-10 relative">
                      <div>
                        <p className="text-xs font-bold opacity-80">FLIGHT TICKET</p>
                        <h3 className="text-2xl font-black mt-1">{booking.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(booking)} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 backdrop-blur-sm">
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                    <Plane className="absolute right-4 top-4 opacity-20 rotate-45" size={80} />
                  </div>
                  <div className="bg-white p-5 border-x border-b border-stone-200 rounded-b-2xl relative">
                    <div className="absolute top-0 left-0 right-0 h-4 -mt-2 bg-white rounded-b-xl border-b-2 border-dashed border-stone-300"></div>
                    
                    <div className="flex justify-between items-center mt-2 mb-6">
                      <div className="text-center min-w-[60px]">
                        <div className="text-xl font-black text-stone-800">{booking.location.split('->')[0]?.trim() || 'DEP'}</div>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-2">
                         <Plane size={14} className="text-stone-300 rotate-90 mb-1" />
                         <div className="w-full border-b-2 border-dashed border-stone-200"></div>
                      </div>
                      <div className="text-center min-w-[60px]">
                        <div className="text-xl font-black text-stone-800">{booking.location.split('->')[1]?.trim() || 'ARR'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-xs text-stone-400 font-bold mb-1">DATE</p>
                        <p className="font-bold text-stone-700">{booking.datetime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 font-bold mb-1">REF</p>
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${showSensitive ? 'text-stone-700' : 'text-stone-300 blur-sm'}`}>
                            {booking.refNumber}
                          </p>
                          <button className="text-stone-400 active:text-orange-500">
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
               </Card>
            ) : (
              /* HOTEL & OTHER CARD */
              <Card key={booking.id} className="group relative">
                <div className="flex gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    booking.type === 'hotel' ? 'bg-indigo-100 text-indigo-500' : 'bg-green-100 text-green-500'
                  }`}>
                     {booking.type === 'hotel' ? <BedDouble size={24} /> : <Ticket size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-stone-800 text-lg truncate">{booking.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-stone-400 font-bold mt-1">
                       <MapPin size={12} />
                       <span className="truncate">{booking.location}</span>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4 bg-stone-50 p-2 rounded-lg">
                       <div className="flex-1">
                          <p className="text-[10px] text-stone-400 font-bold">預訂編號</p>
                          <p className={`font-bold text-sm ${showSensitive ? 'text-stone-700' : 'text-stone-300 blur-sm'}`}>
                            {booking.refNumber}
                          </p>
                       </div>
                       <div className="flex-1 border-l border-stone-200 pl-4">
                          <p className="text-[10px] text-stone-400 font-bold">日期</p>
                          <p className="font-bold text-sm text-stone-700">{booking.datetime}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Edit Button overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                   <button 
                     onClick={() => handleOpenEdit(booking)} 
                     className="text-stone-300 hover:text-blue-500 p-1 rounded-md hover:bg-stone-100"
                   >
                     <Edit2 size={16} />
                   </button>
                </div>

                {/* Links */}
                {(booking.mapUrl || booking.notes) && (
                   <div className="mt-3 pt-3 border-t border-dashed border-stone-200 flex gap-3">
                      {booking.mapUrl && (
                        <a 
                          href={booking.mapUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs font-bold text-orange-500 flex items-center gap-1 hover:underline"
                        >
                          <MapPin size={14} /> 開啟地圖
                        </a>
                      )}
                      {booking.notes && (
                         <span className="text-xs text-stone-400 flex items-center gap-1">
                           <AlignLeft size={14} /> 有備註
                         </span>
                      )}
                   </div>
                )}
              </Card>
            )
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={editingBooking ? "編輯憑證" : "新增憑證"}
      >
        <form onSubmit={handleSave} className="space-y-4">
           {/* Type Selector in Form */}
           <div className="flex gap-2 mb-2">
             {['hotel', 'flight', 'ticket'].map(type => (
               <button
                 key={type}
                 type="button"
                 onClick={() => setFormData({...formData, type: type as BookingType})}
                 className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 ${
                   formData.type === type 
                     ? 'border-orange-400 bg-orange-50 text-orange-600' 
                     : 'border-stone-100 text-stone-400'
                 }`}
               >
                 {type === 'hotel' ? '住宿' : type === 'flight' ? '機票' : '其他'}
               </button>
             ))}
           </div>

           <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">名稱 / 航班號</label>
              <input 
                required
                placeholder={formData.type === 'flight' ? '例如: JL 801' : '例如: APA Hotel'}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
           </div>

           <div className="flex gap-3">
             <div className="flex-1">
                <label className="block text-xs font-bold text-stone-400 mb-1">預訂編號</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  value={formData.refNumber}
                  onChange={e => setFormData({...formData, refNumber: e.target.value})}
                />
             </div>
             <div className="flex-1">
                <label className="block text-xs font-bold text-stone-400 mb-1">日期 / 時間</label>
                <input 
                  required
                  placeholder="2024.12.31"
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  value={formData.datetime}
                  onChange={e => setFormData({...formData, datetime: e.target.value})}
                />
             </div>
           </div>

           <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">地點 / 航線</label>
              <div className="relative">
                 <MapPin size={16} className="absolute left-3 top-3.5 text-stone-400" />
                 <input 
                   placeholder={formData.type === 'flight' ? 'TPE -> NRT' : '地址...'}
                   className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                   value={formData.location}
                   onChange={e => setFormData({...formData, location: e.target.value})}
                 />
              </div>
           </div>

           {formData.type !== 'flight' && (
              <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">地圖連結 (選填)</label>
                <input 
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none text-xs"
                  value={formData.mapUrl}
                  onChange={e => setFormData({...formData, mapUrl: e.target.value})}
                />
              </div>
           )}

           <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">備註</label>
              <textarea 
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
           </div>

           <div className="flex gap-3 pt-2">
            {editingBooking && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-12 text-stone-400 hover:text-red-500 hover:bg-red-50 px-0"
                onClick={handleDelete}
              >
                <Trash2 size={20} />
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {editingBooking ? "儲存修改" : "新增憑證"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;