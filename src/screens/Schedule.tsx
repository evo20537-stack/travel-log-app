import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { 
  Train, Camera, Utensils, BedDouble, ShoppingBag, 
  MapPin, Edit2, Plus, Trash2, Clock, Map, AlignLeft, Link as LinkIcon, CalendarDays
} from 'lucide-react';
import { Reorder, useDragControls, useMotionValue, motion } from 'framer-motion';
import { Trip, ScheduleEvent } from '../types';
import { format, parseISO, formatISO, parse } from 'date-fns';

interface ScheduleProps {
  currentTrip: Trip;
  events: ScheduleEvent[];
  onUpdateEvents: (events: ScheduleEvent[]) => void;
}

type EventType = 'activity' | 'food' | 'transport' | 'stay' | 'shopping';

const EVENT_TYPES: { type: EventType; label: string; icon: any; color: string }[] = [
  { type: 'activity', label: '景點', icon: Camera, color: 'bg-blue-100 text-blue-500' },
  { type: 'food', label: '美食', icon: Utensils, color: 'bg-orange-100 text-orange-500' },
  { type: 'transport', label: '交通', icon: Train, color: 'bg-stone-100 text-stone-500' },
  { type: 'stay', label: '住宿', icon: BedDouble, color: 'bg-indigo-100 text-indigo-500' },
  { type: 'shopping', label: '購物', icon: ShoppingBag, color: 'bg-pink-100 text-pink-500' },
];

interface ScheduleItemProps {
  event: ScheduleEvent;
  onDetail: () => void;
  onEdit: (e: any) => void;
  onMap: (e: any) => void;
  onDelete: () => void;
}

const ScheduleItem: React.FC<ScheduleItemProps> = ({ event, onDetail, onEdit, onMap, onDelete }) => {
  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const typeConfig = EVENT_TYPES.find(t => t.type === event.type);
  const EventIcon = typeConfig ? typeConfig.icon : MapPin;
  const [isPressing, setIsPressing] = useState(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPressing(true);
    const timeout = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      dragControls.start(e);
      setIsPressing(false);
    }, 500);

    const cancel = () => {
      clearTimeout(timeout);
      setIsPressing(false);
    };

    e.target.addEventListener('pointerup', cancel, { once: true });
    e.target.addEventListener('pointermove', cancel, { once: true });
    e.target.addEventListener('pointercancel', cancel, { once: true });
  };
  
  const displayTime = useMemo(() => {
    try {
      return format(parseISO(event.date), 'HH:mm');
    } catch (e) {
      // Fallback for old time-only format
      return event.time;
    }
  }, [event.date, event.time]);


  return (
    <Reorder.Item value={event} dragListener={false} dragControls={dragControls} className="relative mb-4 select-none">
      <div className="flex gap-4 relative items-start">
         <div className="flex flex-col items-center min-w-[56px] pt-1 shrink-0">
            <span className="text-sm font-bold text-stone-500 bg-[#F7F4EB] px-1 z-10 relative">
               {displayTime}
            </span>
         </div>
         <div className="flex-1 relative">
            <div className="absolute inset-y-0 right-0 left-10 bg-red-100 rounded-2xl flex items-center justify-end pr-6">
                <Trash2 className="text-red-500" size={24} />
            </div>
            <motion.div
              style={{ x }}
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) onDelete();
              }}
              onPointerDown={handlePointerDown}
              className={`relative bg-white rounded-2xl transition-transform ${isPressing ? 'scale-[0.98]' : ''}`}
            >
              <Card 
                className="flex items-center gap-3 py-3 relative border-2 border-stone-100 active:border-orange-200"
                onClick={onDetail}
              >
                <div className={`p-3 rounded-xl shrink-0 ${event.color}`}>
                  <EventIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-stone-800 truncate">{event.title}</h4>
                  {event.transitTime ? (
                    <span className="text-xs text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                      ⏱ {event.transitTime}
                    </span>
                  ) : (
                    <div className="flex items-center text-xs text-stone-400 mt-1 truncate">
                      <MapPin size={10} className="mr-1" />
                      {event.location}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 border-l border-stone-100 pl-2" onPointerDown={(e) => e.stopPropagation()}>
                   <button onClick={(e) => onMap(e)} className={`p-1.5 rounded-lg transition-colors ${event.mapUrl ? 'text-orange-500 bg-orange-50' : 'text-stone-400 hover:text-orange-500 hover:bg-orange-50'}`}>
                     <Map size={16} />
                   </button>
                   <button onClick={(e) => onEdit(e)} className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                     <Edit2 size={16} />
                   </button>
                </div>
              </Card>
            </motion.div>
         </div>
      </div>
    </Reorder.Item>
  );
};


const Schedule: React.FC<ScheduleProps> = ({ currentTrip, events, onUpdateEvents }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    date: selectedDate,
    time: '09:00',
    title: '',
    location: '',
    mapUrl: '',
    type: 'activity' as EventType,
    notes: '',
    transitTime: '',
  });

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      date: selectedDate,
      time: '09:00',
      title: '',
      location: '',
      mapUrl: '',
      type: 'activity',
      notes: '',
      transitTime: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, event: ScheduleEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    const eventDate = parseISO(event.date);
    setFormData({
      date: format(eventDate, 'yyyy-MM-dd'),
      time: format(eventDate, 'HH:mm'),
      title: event.title,
      location: event.location,
      mapUrl: event.mapUrl || '',
      type: event.type,
      notes: event.notes || '',
      transitTime: event.transitTime || ''
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (event: ScheduleEvent) => {
    setViewingEvent(event);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個行程嗎？')) {
      onUpdateEvents(events.filter(e => e.id !== id));
      setIsFormOpen(false); // Close form if deleting from it
      setIsDetailOpen(false); // Close detail if deleting from it
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const typeConfig = EVENT_TYPES.find(t => t.type === formData.type) || EVENT_TYPES[0];
    
    // Combine date and time into a single ISO string
    const combinedDateTime = `${formData.date}T${formData.time}:00`;

    const newEvent: ScheduleEvent = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      date: combinedDateTime,
      time: format(parseISO(combinedDateTime), 'HH:mm'), // Keep time for legacy display if needed
      title: formData.title,
      location: formData.location,
      mapUrl: formData.mapUrl,
      type: formData.type,
      notes: formData.notes,
      transitTime: formData.transitTime,
      icon: typeConfig.icon,
      color: typeConfig.color
    };

    let updatedList;
    if (editingEvent) {
      updatedList = events.map(ev => ev.id === editingEvent.id ? newEvent : ev);
    } else {
      updatedList = [...events, newEvent];
    }
    
    // Sort by the new combined date property
    updatedList.sort((a, b) => a.date.localeCompare(b.date));

    onUpdateEvents(updatedList);
    setIsFormOpen(false);
  };

  const handleMapNavigation = (e: React.MouseEvent, location: string, mapUrl?: string) => {
    e.stopPropagation();
    if (mapUrl && mapUrl.trim() !== '') {
       window.open(mapUrl, '_blank');
    } else {
       const query = encodeURIComponent(location);
       window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Group events by date
  const groupedEvents = useMemo(() => {
    return events.reduce((acc, event) => {
      try {
        const eventDate = format(parseISO(event.date), 'yyyy-MM-dd');
        if (!acc[eventDate]) {
          acc[eventDate] = [];
        }
        acc[eventDate].push(event);
      } catch(e) {
        // Fallback for old data
        const fallbackDate = "未分類日期";
        if (!acc[fallbackDate]) acc[fallbackDate] = [];
        acc[fallbackDate].push(event);
      }
      return acc;
    }, {} as Record<string, ScheduleEvent[]>);
  }, [events]);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => a.localeCompare(b));


  return (
    <div className="pb-24 animate-fade-in">
       <header className="sticky top-0 bg-[#F7F4EB] z-30 pt-2 pb-4 border-b border-stone-200/50 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-xs font-bold text-stone-500">{currentTrip.title}</span>
            <h2 className="text-2xl font-black text-stone-800">行程表 📅</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleOpenAdd}
              className="bg-stone-800 text-white p-1.5 rounded-lg active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </header>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
           <BedDouble size={48} className="text-stone-300 mb-2" />
           <p className="font-bold text-stone-500">還沒有安排行程喔</p>
           <Button onClick={handleOpenAdd} variant="ghost" className="mt-2 text-orange-500">
             + 立即新增
           </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="flex items-center gap-2 font-black text-orange-500 bg-orange-50 rounded-full px-3 py-1 w-fit mb-4 -ml-1">
                <CalendarDays size={14}/>
                <span className="text-sm tracking-wider">
                  {date === "未分類日期" ? date : format(parseISO(date), 'M 月 d 日')}
                </span>
              </h3>
              <div className="relative">
                <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-stone-200 border-l-2 border-dashed border-stone-300 -z-10"></div>
                <Reorder.Group axis="y" values={groupedEvents[date]} onReorder={(newOrder) => onUpdateEvents([...events.filter(e => format(parseISO(e.date), 'yyyy-MM-dd') !== date), ...newOrder])}>
                  {groupedEvents[date].map((event) => (
                    <ScheduleItem 
                      key={event.id} 
                      event={event}
                      onDetail={() => handleOpenDetail(event)}
                      onEdit={(e) => handleOpenEdit(e, event)}
                      onMap={(e) => handleMapNavigation(e, event.location, event.mapUrl)}
                      onDelete={() => handleDelete(event.id)}
                    />
                  ))}
                </Reorder.Group>
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-stone-400 mt-6 font-bold opacity-60">
             長按行程可拖曳排序・向左滑動可刪除
          </p>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="行程詳情">
        {viewingEvent && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${viewingEvent.color}`}>
                 {(() => {
                    const typeConfig = EVENT_TYPES.find(t => t.type === viewingEvent.type);
                    const Icon = typeConfig ? typeConfig.icon : MapPin;
                    return <Icon size={32} />;
                 })()}
              </div>
              <div>
                 <span className="text-sm font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                    {format(parseISO(viewingEvent.date), 'M/d HH:mm')}
                 </span>
                <h3 className="text-2xl font-black text-stone-800 mt-1">{viewingEvent.title}</h3>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
               <div className="flex items-start gap-3">
                 <MapPin className="text-stone-400 mt-0.5" size={18} />
                 <div className="flex-1">
                   <p className="text-xs font-bold text-stone-400">地點</p>
                   <p className="font-bold text-stone-700">{viewingEvent.location}</p>
                   {viewingEvent.mapUrl && (
                     <a href={viewingEvent.mapUrl} target="_blank" className="text-xs text-blue-500 underline mt-1 block">
                       {viewingEvent.mapUrl}
                     </a>
                   )}
                 </div>
               </div>
               {viewingEvent.notes && (
                 <div className="flex items-start gap-3">
                   <AlignLeft className="text-stone-400 mt-0.5" size={18} />
                   <div>
                     <p className="text-xs font-bold text-stone-400">備註</p>
                     <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{viewingEvent.notes}</p>
                   </div>
                 </div>
               )}
               {viewingEvent.transitTime && (
                 <div className="flex items-start gap-3">
                   <Clock className="text-stone-400 mt-0.5" size={18} />
                   <div>
                     <p className="text-xs font-bold text-stone-400">交通時間</p>
                     <p className="text-sm font-bold text-stone-600">{viewingEvent.transitTime}</p>
                   </div>
                 </div>
               )}
            </div>

            <div className="flex gap-3 mt-4">
              <Button className="flex-1" onClick={(e) => handleMapNavigation(e, viewingEvent.location, viewingEvent.mapUrl)}>
                <Map size={18} /> 導航
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1" 
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit({ stopPropagation: () => {} } as any, viewingEvent);
                }}
              >
                <Edit2 size={18} /> 編輯
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* --- ADD / EDIT FORM MODAL --- */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEvent ? "編輯行程" : "新增行程"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex gap-3">
             <div className="w-1/2">
                <label className="block text-xs font-bold text-stone-400 mb-1">日期</label>
                <input 
                  type="date"
                  required
                  className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none bg-stone-50"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
             </div>
             <div className="w-1/2">
                <label className="block text-xs font-bold text-stone-400 mb-1">時間</label>
                <input 
                  type="time"
                  required
                  className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none bg-stone-50"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
             </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-stone-400 mb-1">名稱</label>
            <input 
              required
              placeholder="行程名稱..."
              className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-400 mb-2">類型 (Icon)</label>
            <div className="flex justify-between gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setFormData({...formData, type: t.type})}
                  className={`flex flex-col items-center justify-center min-w-[56px] h-16 rounded-xl border-2 transition-all ${
                    formData.type === t.type 
                      ? `${t.color} border-current bg-opacity-10` 
                      : 'border-stone-100 text-stone-300 hover:border-stone-200'
                  }`}
                >
                  <t.icon size={20} />
                  <span className="text-[10px] font-bold mt-1">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-stone-400 mb-1">地點名稱</label>
             <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3.5 text-stone-400" />
                <input 
                  placeholder="顯示的地點名稱..."
                  className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-stone-400 mb-1">地圖連結 (URL)</label>
             <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-3.5 text-stone-400" />
                <input 
                  placeholder="https://goo.gl/maps/..."
                  className="w-full pl-9 pr-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none text-xs"
                  value={formData.mapUrl}
                  onChange={e => setFormData({...formData, mapUrl: e.target.value})}
                />
             </div>
          </div>

          {formData.type === 'transport' && (
             <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">交通時間 / 方式</label>
                <input 
                  placeholder="例：地鐵 20 分鐘"
                  className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  value={formData.transitTime}
                  onChange={e => setFormData({...formData, transitTime: e.target.value})}
                />
             </div>
          )}

          <div>
             <label className="block text-xs font-bold text-stone-400 mb-1">備註</label>
             <textarea 
               placeholder="訂位資訊、注意事項..."
               rows={3}
               className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none resize-none"
               value={formData.notes}
               onChange={e => setFormData({...formData, notes: e.target.value})}
             />
          </div>

          <div className="flex gap-3 pt-2">
            {editingEvent && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-12 text-stone-400 hover:text-red-500 hover:bg-red-50 px-0"
                onClick={() => handleDelete(editingEvent.id)}
              >
                <Trash2 size={20} />
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {editingEvent ? "儲存修改" : "新增行程"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Schedule;
