
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { 
  Train, Camera, Utensils, BedDouble, ShoppingBag, 
  MapPin, Edit2, Plus, Trash2, Clock, Map, AlignLeft, Link as LinkIcon, CalendarDays,
  GripVertical
} from 'lucide-react';
import { Trip, ScheduleEvent } from '../types';
import { format, parseISO, formatISO, parse } from 'date-fns';

// --- 全面升級至 dnd-kit ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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

// --- 全新的 Sortable ScheduleItem (由 dnd-kit 驅動) ---
const SortableScheduleItem = ({ event, onDetail, onEdit, onMap, onDelete }: {
  event: ScheduleEvent;
  onDetail: () => void;
  onEdit: (e: any) => void;
  onMap: (e: any) => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeConfig = EVENT_TYPES.find(t => t.type === event.type);
  const EventIcon = typeConfig ? typeConfig.icon : MapPin;

  const displayTime = useMemo(() => {
    try {
      return format(parseISO(event.date), 'HH:mm');
    } catch { return event.time; }
  }, [event.date, event.time]);

  return (
    <div ref={setNodeRef} style={style} className={`relative mb-4 select-none ${isDragging ? 'z-20 shadow-2xl' : 'z-10'}`}>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col items-center pt-1 shrink-0 w-14">
           <span className="text-sm font-bold text-stone-500 bg-[#F7F4EB] px-1 z-10">
              {displayTime}
           </span>
        </div>
        <div className="flex-1 relative">
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
                <MapPin size={10} className="mr-1" /> {event.location}
              </div>
            </div>
            <div className="flex flex-col gap-1 border-l border-stone-100 pl-2">
               <button onClick={(e) => onMap(e)} className={`p-1.5 rounded-lg transition-colors text-stone-400 hover:text-orange-500 hover:bg-orange-50'}`}>
                 <Map size={16} />
               </button>
               <button onClick={(e) => onEdit(e)} className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
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
  // 將 localEvents 設為 state，以便 dnd-kit 可以即時更新 UI
  const [localEvents, setLocalEvents] = useState<ScheduleEvent[]>([]);

  // 當從外部傳入的 events 變動時，同步更新 localEvents
  useEffect(() => {
    setLocalEvents(events.sort((a, b) => a.date.localeCompare(b.date)));
  }, [events]);


  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    title: '',
    location: '',
    mapUrl: '',
    type: 'activity' as EventType,
    notes: '',
    transitTime: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOpenAdd = () => {
    setEditingEvent(null);
    const lastEventTime = localEvents[localEvents.length - 1]?.date;
    const newTime = lastEventTime ? format(new Date(parseISO(lastEventTime).getTime() + 3600 * 1000), 'HH:mm') : '09:00';
    const newDate = lastEventTime ? format(parseISO(lastEventTime), 'yyyy-MM-dd') : new Date().toISOString().split('T')[0];

    setFormData({
      date: newDate,
      time: newTime,
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
      onUpdateEvents(localEvents.filter(e => e.id !== id));
      setIsFormOpen(false);
      setIsDetailOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const typeConfig = EVENT_TYPES.find(t => t.type === formData.type) || EVENT_TYPES[0];
    const combinedDateTime = `${formData.date}T${formData.time}:00`;

    const newEvent: ScheduleEvent = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      date: combinedDateTime,
      time: format(parseISO(combinedDateTime), 'HH:mm'),
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
      updatedList = localEvents.map(ev => ev.id === editingEvent.id ? newEvent : ev);
    } else {
      updatedList = [...localEvents, newEvent];
    }
    updatedList.sort((a, b) => a.date.localeCompare(b.date));
    onUpdateEvents(updatedList);
    setIsFormOpen(false);
  };

  // --- 智慧排序核心：處理拖曳結束事件 ---
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalEvents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        // 1. 執行視覺上的位置交換
        let newItems = arrayMove(items, oldIndex, newIndex);

        // 2. 實現「時間交換」魔法
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
        
        // 3. 將最終的變動結果向上傳遞
        onUpdateEvents(newItems);

        return newItems;
      });
    }
  }

  const groupedEvents = useMemo(() => {
    return localEvents.reduce((acc, event) => {
      const eventDate = format(parseISO(event.date), 'yyyy-MM-dd');
      if (!acc[eventDate]) acc[eventDate] = [];
      acc[eventDate].push(event);
      return acc;
    }, {} as Record<string, ScheduleEvent[]>);
  }, [localEvents]);

  const sortedDates = Object.keys(groupedEvents).sort((a, b) => a.localeCompare(b));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="pb-24 animate-fade-in">
         <header className="sticky top-0 bg-[#F7F4EB] z-40 pt-2 pb-4 border-b border-stone-200/50 mb-6">
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

        {localEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
             <BedDouble size={48} className="text-stone-300 mb-2" />
             <p className="font-bold text-stone-500">還沒有安排行程喔</p>
             <Button onClick={handleOpenAdd} variant="ghost" className="mt-2 text-orange-500">+ 立即新增</Button>
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
                  <div className="absolute left-[27px] top-4 bottom-10 w-0.5 bg-stone-200 border-l-2 border-dashed border-stone-300 -z-10"></div>
                  <SortableContext items={groupedEvents[date]} strategy={verticalListSortingStrategy}>
                    {groupedEvents[date].map((event) => (
                      <SortableScheduleItem 
                        key={event.id} 
                        event={event}
                        onDetail={() => handleOpenDetail(event)}
                        onEdit={(e) => handleOpenEdit(e, event)}
                        onMap={(e) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, '_blank')}
                        onDelete={() => handleDelete(event.id)}
                      />
                    ))}
                  </SortableContext>
                </div>
              </div>
            ))}
            <p className="text-center text-xs text-stone-400 mt-6 font-bold opacity-60">長按行程可拖曳排序</p>
          </div>
        )}

        {/* Modals remain mostly unchanged... */}
         <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="行程詳情"> 
             {viewingEvent && ( <div className="space-y-4">...</div> )} 
         </Modal>
         <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEvent ? "編輯行程" : "新增行程"}> 
             <form onSubmit={handleSave} className="space-y-4">...</form> 
         </Modal>
      </div>
    </DndContext>
  );
};

export default Schedule; 
