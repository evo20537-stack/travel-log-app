import React, { useState, useMemo } from 'react';
import { Trip, ChecklistItem } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ShoppingCart, Utensils, Store, Plus, Trash2, Check, Edit2 } from 'lucide-react';
import Card from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface ChecklistProps {
  currentTrip: Trip;
  checklist: ChecklistItem[];
  onUpdateChecklist: (updatedChecklist: ChecklistItem[]) => void;
}

type ChecklistCategory = '購物' | '餐廳' | '景點';
const CHECKLIST_CATEGORIES: ChecklistCategory[] = ['購物', '餐廳', '景點'];

const CATEGORY_MAP: Record<ChecklistCategory, { icon: React.ElementType, color: string }> = {
  '購物': { icon: ShoppingCart, color: 'text-pink-500' },
  '餐廳': { icon: Utensils, color: 'text-orange-500' },
  '景點': { icon: Store, color: 'text-cyan-500' },
};

const Checklist: React.FC<ChecklistProps> = ({ currentTrip, checklist, onUpdateChecklist }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<ChecklistCategory>('購物');
  
  const [formData, setFormData] = useState<Omit<ChecklistItem, 'id' | 'trip_id' | 'is_completed'>>({
    title: '',
    category: activeCategory,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', category: activeCategory });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({ title: item.title, category: item.category });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    onUpdateChecklist(checklist.filter(item => item.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    onUpdateChecklist(checklist.map(item => item.id === id ? { ...item, is_completed: !item.is_completed } : item));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const newOrUpdatedItem: ChecklistItem = {
      id: editingItem ? editingItem.id : uuidv4(),
      trip_id: currentTrip.id,
      title: formData.title,
      category: formData.category,
      is_completed: editingItem ? editingItem.is_completed : false,
    };

    const updatedList = editingItem
      ? checklist.map(item => item.id === editingItem.id ? newOrUpdatedItem : item)
      : [...checklist, newOrUpdatedItem];

    onUpdateChecklist(updatedList);
    setIsFormOpen(false);
  };

  const filteredItems = useMemo(() => {
    const sorted = [...checklist].sort((a, b) => (a.is_completed ? 1 : -1) - (b.is_completed ? 1 : -1));
    return sorted.filter(item => item.category === activeCategory);
  }, [checklist, activeCategory]);

  // --- 語法修正：將 Icon 元件賦值給大寫字母開頭的變數 ---
  const EmptyStateIcon = CATEGORY_MAP[activeCategory].icon;

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <header className="sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md z-40 pt-2 pb-4 border-b border-stone-200/50">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-xs font-bold text-stone-500 truncate">{currentTrip.title}</span>
            <h2 className="text-2xl font-black text-stone-800">願望清單 📝</h2>
          </div>
          <Button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-xl shadow-lg shadow-stone-200 shrink-0"><Plus size={20} /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-stone-200/70 p-1 rounded-xl">
          {CHECKLIST_CATEGORIES.map(cat => {
            const Icon = CATEGORY_MAP[cat].icon;
            return (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-2 px-3 text-sm font-black rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${activeCategory === cat ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500'}`}>
                <Icon size={16}/> {cat}
              </button>
            )
          })}
        </div>
      </header>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 opacity-60">
            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-stone-100 ${CATEGORY_MAP[activeCategory].color}`}>
                <EmptyStateIcon size={32} />
            </div>
            <p className="font-bold text-stone-600 text-lg">你的「{activeCategory}」清單是空的</p>
            <p className="text-sm text-stone-400 mt-1">點擊右上角把它們加進來吧！</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <Card key={item.id} className={`p-0 flex items-center gap-4 transition-all duration-300 ${item.is_completed ? 'bg-stone-100 opacity-60' : 'bg-white'}`}>
              <button onClick={() => handleToggleComplete(item.id)} className="flex-shrink-0 pl-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.is_completed ? 'bg-green-500 border-green-500 text-white' : 'border-stone-300'}`}>
                  {item.is_completed && <Check size={16} />}
                </div>
              </button>
              <div className="flex-1 py-4 min-w-0" onClick={() => handleOpenEdit(item)}>
                <p className={`font-bold text-stone-800 break-words ${item.is_completed ? 'line-through' : ''}`}>{item.title}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-stone-300 hover:text-red-500 px-4">
                <Trash2 size={18} />
              </button>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? '編輯項目' : '新增項目'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">項目名稱</label>
            <input required placeholder='白色戀人巧克力餅乾' className="w-full p-3 rounded-xl border-2 border-stone-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">分類</label>
            <select className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as ChecklistCategory})}>
              {CHECKLIST_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
            <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Checklist;
