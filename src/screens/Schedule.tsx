
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { 
  Train, Camera, Utensils, BedDouble, ShoppingBag, 
  MapPin, Edit2, Plus, Trash2, Clock, Map, AlignLeft, Link as LinkIcon, CalendarDays,
  GripVertical, Copy, ExternalLink
} from 'lucide-react';
import { Trip, ScheduleEvent } from '../types';
import { format, parseISO } from 'date-fns';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

const SortableScheduleItem = ({ event, onDetail, onEdit, onMap }: {
  event: ScheduleEvent;
  onDetail: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onMap: (e: React.MouseEvent) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeConfig = EVENT_TYPES.find(t => t.type === event.type);
  const EventIcon = typeConfig ? typeConfig.icon : MapPin;
  const displayTime = useMemo(() => event.time || format(parseISO(event.date), 'HH:mm'), [event.date, event.time]);

  return (
    <div ref={setNodeRef} style={style} className={`relative mb-4 select-none ${isDragging ? 'z-20 shadow-2xl' : 'z-10'}`}>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center pt-1 shrink-0 w-14">
           <span className="text-sm font-bold text-stone-500 bg-[#F7F4EB] px-1 z-10">{displayTime}</span>
        </div>
        <div className="flex-1 min-w-0 relative">
          <Card 
            className="flex items-center gap-3 p-3 relative border-2 border-stone-100 active:border-orange-200 transition-shadow duration-300" 
            onClick={onDetail}
          >
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-2 -ml-2 text-stone-400 active:text-orange-500">
               <GripVertical size={20} />
            </div>
            <div className={`p-3 rounded-xl shrink-0 ${event.color}`}>
              <EventIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-stone-800 truncate">{event.title}</h4>
              <div className="flex items-center text-xs text-stone-400 mt-1 truncate">
                {event.location && <><MapPin size={10} className="mr-1 shrink-0" /> {event.location}</>}
              </div>
            </div>
            <div className="flex flex-col gap-1 border-l border-stone-100 pl-2">
               <button onClick={onMap} className={`p-1.5 rounded-lg transition-colors text-stone-400 hover:text-orange-500 hover:bg-orange-50`}>
                 <Map size={16} />
               </button>
               <button onClick={onEdit} className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                 <Edit2 size={16} />
               </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Schedule: React.FC<ScheduleProps> = ({ currentTrip, events, onUpdateEvents }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<ScheduleEvent | null>(null);
  const [localEvents, setLocalEvents] = useState<ScheduleEvent[]>([]);

  useEffect(() => {
    setLocalEvents(events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }, [events]);

  // --- 1. State: Add mapUrl to formData ---
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    title: '',
    location: '',
    mapUrl: '',
    type: 'activity' as EventType,
    notes: '',
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- 2. Logic: Update handleOpenAdd ---
  const handleOpenAdd = () => {
    setEditingEvent(null);
    const lastEvent = localEvents[localEvents.length - 1];
    const newDate = lastEvent ? parseISO(lastEvent.date) : new Date();
    newDate.setHours(newDate.getHours() + 1);
    
    setFormData({
      date: format(newDate, 'yyyy-MM-dd'),
      time: format(newDate, 'HH:mm'),
      title: '',
      location: '',
      mapUrl: '',
      type: 'activity',
      notes: '',
    });
    setIsFormOpen(true);
  };

  // --- 3. Logic: Update handleOpenEdit ---
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
    });
    setIsFormOpen(true);
  };
  
  const handleOpenDetail = (event: ScheduleEvent) => {
    setViewingEvent(event);
    setIsDetailOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這個行程嗎？')) {
      onUpdateEvents(localEvents.filter(e => e.id !== id));
      setIsFormOpen(false);
      setIsDetailOpen(false);
    }
  };

  // --- 4. Logic: Update handleSave ---
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const typeConfig = EVENT_TYPES.find(t => t.type === formData.type) || EVENT_TYPES[0];
    const combinedDateTime = `${formData.date}T${formData.time}:00`;

    const newEvent: Omit<ScheduleEvent, 'id'> & { id?: string } = {
      date: combinedDateTime,
      time: formData.time,
      title: formData.title,
      location: formData.location,
      mapUrl: formData.mapUrl,
      type: formData.type,
      notes: formData.notes,
      icon: typeConfig.icon,
      color: typeConfig.color
    };

    let updatedList;
    if (editingEvent) {
      updatedList = localEvents.map(ev => ev.id === editingEvent.id ? { ...ev, ...newEvent, id: ev.id } : ev);
    } else {
      updatedList = [...localEvents, { ...newEvent, id: 'new-' + Date.now() }];
    }
    updatedList.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    onUpdateEvents(updatedList);
    setIsFormOpen(false);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalEvents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return items;

        let newItems = arrayMove(items, oldIndex, newIndex);
        const draggedItemOriginalTime = items[oldIndex].date;
        const droppedOnItemOriginalTime = items[newIndex].date;
        
        newItems = newItems.map((item) => {
            if(item.id === active.id) {
                return { ...item, date: droppedOnItemOriginalTime, time: format(parseISO(droppedOnItemOriginalTime), 'HH:mm') };
            }
            if(item.id === over.id) {
                return { ...item, date: draggedItemOriginalTime, time: format(parseISO(draggedItemOriginalTime), 'HH:mm') };
            }
            return item;
        });
        
        onUpdateEvents(newItems);
        return newItems;
      });
    }
  }

  const groupedEvents = useMemo(() => {
    return localEvents.reduce((acc, event) => {
      const eventDateStr = format(parseISO(event.date), 'yyyy-MM-dd');
      if (!acc[eventDateStr]) acc[eventDateStr] = [];
      acc[eventDateStr].push(event);
      return acc;
    }, {} as Record<string, ScheduleEvent[]>);
  }, [localEvents]);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => a.localeCompare(b));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="pb-24 animate-fade-in">
        <header className="sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md z-40 pt-2 pb-4 border-b border-stone-200/50 mb-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-stone-500 truncate">{currentTrip.title}</span>
              <h2 className="text-2xl font-black text-stone-800">行程總覽 📅</h2>
            </div>
            <Button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-xl shadow-lg shadow-stone-200 shrink-0">
              <Plus size={20} />
            </Button>
          </div>
        </header>

        {localEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
             <CalendarDays size={48} className="text-stone-300 mb-4" />
             <p className="font-bold text-stone-500 text-lg">尚未安排任何行程</p>
             <p className="text-sm text-stone-400 mt-1">點擊右上角開始新增吧！</p>
             <Button onClick={handleOpenAdd} variant="secondary" className="mt-6">+ 新增第一個行程</Button>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="flex items-center gap-2 font-black text-orange-500 bg-orange-50 rounded-full px-3 py-1 w-fit mb-4 -ml-1">
                  <CalendarDays size={14}/>
                  <span className="text-sm tracking-wider">{format(parseISO(date), 'M 月 d 日')}</span>
                </h3>
                <div className="relative">
                  <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-stone-200/70 border-l-2 border-dashed border-stone-300 -z-10"></div>
                  <SortableContext items={groupedEvents[date].map(e => e.id)} strategy={verticalListSortingStrategy}>
                    {groupedEvents[date].map((event) => (
                      <SortableScheduleItem 
                        key={event.id} 
                        event={event}
                        onDetail={() => handleOpenDetail(event)}
                        onEdit={(e) => {e.stopPropagation(); handleOpenEdit(e, event);}}
                        // --- 5. Logic: Implement smart onMap handler ---
                        onMap={(e) => {
                          e.stopPropagation();
                          if (event.mapUrl) {
                            window.open(event.mapUrl, '_blank');
                          } else if (event.location) {
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank');
                          }
                        }}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-stone-400 mt-6 font-bold opacity-60">長按並拖曳行程卡片，可以交換時間喔！</p>
          </div>
        )}

        {/* --- 6. UI: Update Detail Modal to use mapUrl -- */}
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="行程詳情">
          {viewingEvent && (
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">標題</span>
                <p className="text-lg font-bold text-stone-800">{viewingEvent.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">日期</span>
                  <p className="font-bold text-stone-800">{format(parseISO(viewingEvent.date), 'M 月 d 日')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">時間</span>
                  <p className="font-bold text-stone-800">{viewingEvent.time}</p>
                </div>
              </div>
              {viewingEvent.location && <div className="space-y-1">
                <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">地點</span>
                 <div className="flex items-center gap-2">
                  <p className="font-bold text-stone-800 flex-1 min-w-0">{viewingEvent.location}</p>
                  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(viewingEvent.location)}><Copy size={16}/></Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                      if (viewingEvent.mapUrl) {
                        window.open(viewingEvent.mapUrl, '_blank');
                      } else if (viewingEvent.location) {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingEvent.location)}`, '_blank');
                      }
                    }}>
                      <ExternalLink size={16}/>
                  </Button>
                </div>
              </div>}
              {viewingEvent.notes && <div className="space-y-1">
                <span className="text-[10px] font-black text-stone-400 tracking-widest uppercase">備註</span>
                <p className="text-stone-700 bg-stone-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{viewingEvent.notes}</p>
              </div>}
              <div className="flex gap-3 pt-4">
                <Button variant="secondary" className="flex-1" onClick={(e) => { setIsDetailOpen(false); handleOpenEdit(e, viewingEvent); }}>
                  <Edit2 size={16} /> 編輯
                </Button>
                <Button variant="danger" onClick={() => handleDelete(viewingEvent.id)}>
                  <Trash2 size={16} /> 刪除
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEvent ? "編輯行程" : "新增行程"}>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">行程類型</label>
              <div className="grid grid-cols-3 gap-2">
                {EVENT_TYPES.map(typeInfo => (
                  <button key={typeInfo.type} type="button" onClick={() => setFormData({...formData, type: typeInfo.type})} className={`p-2 rounded-lg text-xs font-bold flex flex-col items-center gap-1 border-2 ${formData.type === typeInfo.type ? 'border-orange-400 bg-orange-50' : 'border-stone-200 bg-stone-100'}`}>
                    <typeInfo.icon size={16} />
                    {typeInfo.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="event-date" className="block text-xs font-bold text-stone-600 mb-1">日期</label>
                <input id="event-date" type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 rounded-lg border-2 border-stone-200" />
              </div>
              <div>
                <label htmlFor="event-time" className="block text-xs font-bold text-stone-600 mb-1">時間</label>
                <input id="event-time" type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-2 rounded-lg border-2 border-stone-200" />
              </div>
            </div>
            <div>
              <label htmlFor="event-title" className="block text-xs font-bold text-stone-600 mb-1">標題</label>
              <input id="event-title" type="text" placeholder="例：參觀札幌電視塔" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 rounded-lg border-2 border-stone-200" />
            </div>
            <div>
              <label htmlFor="event-location" className="block text-xs font-bold text-stone-600 mb-1">地點 (選填)</label>
              <input id="event-location" type="text" placeholder="例：札幌市中央區大通西1丁目" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 rounded-lg border-2 border-stone-200" />
            </div>
            {/* --- 7. UI: Add mapUrl input field -- */}
            <div>
              <label htmlFor="event-map-url" className="flex items-center gap-2 text-xs font-bold text-stone-600 mb-1">
                <LinkIcon size={12} />
                地圖連結 (選填)
              </label>
              <input 
                id="event-map-url" 
                type="url" 
                placeholder="例：https://maps.app.goo.gl/..." 
                value={formData.mapUrl} 
                onChange={e => setFormData({...formData, mapUrl: e.target.value})} 
                className="w-full p-2 rounded-lg border-2 border-stone-200" 
              />
            </div>
             <div>
              <label htmlFor="event-notes" className="block text-xs font-bold text-stone-600 mb-1">備註 (選填)</label>
              <textarea id="event-notes" placeholder="例：記得買白色戀人冰淇淋" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 rounded-lg border-2 border-stone-200 min-h-[80px]"></textarea>
            </div>
            <div className="flex gap-3 pt-4">
              {editingEvent && (
                <Button type="button" variant="danger" onClick={() => handleDelete(editingEvent.id)} className="mr-auto">
                  <Trash2 size={16} />
                </Button>
              )}
              <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
              <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DndContext>
  );
};

export default Schedule;
