import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { 
  CheckSquare, Maximize2, ShoppingBag, Briefcase, Store, 
  Plus, Edit2, Trash2, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, Utensils
} from 'lucide-react';
import { ShoppingItem, PlanningCategory } from '../types';

interface PlanningProps {
  currentTripId: string;
}

// Initial Data with new categories including Food
const MOCK_ITEMS: Record<string, ShoppingItem[]> = {
  '1': [ // Tokyo
    // Packing
    { id: '101', name: '護照 & 影本', quantity: 1, checked: true, category: 'packing', notes: '影本放不同包包' },
    { id: '102', name: 'eSIM 卡設定 QR Code', quantity: 1, checked: false, category: 'packing', notes: '抵達機場再開通' },
    { id: '103', name: '萬用轉接頭', quantity: 1, checked: false, category: 'packing' },
    // Shops
    { id: '201', name: 'Nintendo Tokyo (澀谷)', quantity: 1, checked: false, category: 'shops', notes: '整理券可能要早上去拿，營業時間 10:00-21:00', link: 'https://maps.app.goo.gl/example' },
    { id: '202', name: 'Blue Bottle Coffee', quantity: 1, checked: true, category: 'shops', notes: '清澄白河店' },
    // Food (New)
    { id: 'f1', name: 'AFURI 阿夫利拉麵', quantity: 1, checked: false, category: 'food', notes: '必點柚子鹽拉麵', link: 'https://goo.gl/maps/afuri' },
    { id: 'f2', name: 'Harbs 水果千層', quantity: 1, checked: true, category: 'food', notes: '外帶比較不用排隊' },
    // Shopping
    { id: '301', name: '大正百保能感冒藥 (粉末)', quantity: 2, checked: false, category: 'shopping', image: 'https://m.media-amazon.com/images/I/71u-y+CgCFL.jpg', notes: '要金色的' },
    { id: '302', name: 'EVE 止痛藥 (藍色)', quantity: 5, checked: false, category: 'shopping', notes: '幫同事代買' },
    { id: '303', name: 'New York Perfect Cheese', quantity: 3, checked: true, category: 'shopping', notes: '東京車站南口' },
  ],
  '2': [ // Kyoto
    { id: '401', name: '京都北山抹茶餅乾', quantity: 10, checked: false, category: 'shopping' },
    { id: '402', name: '清水寺御守', quantity: 4, checked: false, category: 'shopping', notes: '戀愛御守 x2, 健康 x2' },
    { id: '501', name: '雨傘 (折疊)', quantity: 1, checked: false, category: 'packing', notes: '氣象預報會下雨' }
  ]
};

// Configuration for Categories including Colors and Progress Bar styles
const CATEGORY_CONFIG: Record<PlanningCategory, { label: string; icon: any; color: string; barColor: string; checkboxColor: string; emptyText: string }> = {
  'packing': { 
    label: '行前準備', 
    icon: Briefcase, 
    color: 'text-blue-500 bg-blue-100',
    barColor: 'bg-blue-400',
    checkboxColor: 'border-blue-400 text-blue-400',
    emptyText: '護照、網卡、充電器都帶了嗎？'
  },
  'shops': { 
    label: '必逛店鋪', 
    icon: Store, 
    color: 'text-green-600 bg-green-100',
    barColor: 'bg-green-400',
    checkboxColor: 'border-green-400 text-green-400',
    emptyText: '有什麼想去的店或百貨嗎？'
  },
  'food': { 
    label: '必吃美食', 
    icon: Utensils, 
    color: 'text-rose-500 bg-rose-100',
    barColor: 'bg-rose-400',
    checkboxColor: 'border-rose-400 text-rose-400',
    emptyText: '有什麼必吃的餐廳或咖啡廳嗎？'
  },
  'shopping': { 
    label: '必買好物', 
    icon: ShoppingBag, 
    color: 'text-orange-500 bg-orange-100',
    barColor: 'bg-orange-400',
    checkboxColor: 'border-orange-400 text-orange-400',
    emptyText: '藥妝、伴手禮清單'
  }
};

const Planning: React.FC<PlanningProps> = ({ currentTripId }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [activeTab, setActiveTab] = useState<PlanningCategory>('shopping');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    notes: '',
    image: '',
    link: '',
    category: 'shopping' as PlanningCategory
  });

  useEffect(() => {
    setItems(MOCK_ITEMS[currentTripId] || []);
  }, [currentTripId]);

  // Filter items based on active tab
  const filteredItems = items.filter(item => item.category === activeTab);
  const checkedCount = filteredItems.filter(i => i.checked).length;
  const totalCount = filteredItems.length;

  // Handlers
  const toggleItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      quantity: 1,
      notes: '',
      image: '',
      link: '',
      category: activeTab
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShoppingItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity,
      notes: item.notes || '',
      image: item.image || '',
      link: item.link || '',
      category: item.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (editingItem && confirm('確定要刪除這個項目嗎？')) {
      setItems(items.filter(i => i.id !== editingItem.id));
      setIsModalOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ShoppingItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      checked: editingItem ? editingItem.checked : false,
      name: formData.name,
      quantity: formData.quantity,
      category: formData.category,
      notes: formData.notes,
      image: formData.image,
      link: formData.link
    };

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
  };

  const activeConfig = CATEGORY_CONFIG[activeTab];

  return (
    <div className="pb-24 space-y-5 animate-fade-in">
      {/* Header Area */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-stone-800">準備清單 📝</h2>
          <p className="text-xs font-bold text-stone-400 mt-1">
             {checkedCount} / {totalCount} 完成
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-stone-800 text-white p-2 rounded-xl active:scale-95 transition-transform shadow-lg shadow-stone-200"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Category Tabs - Scrollable if needed on small screens */}
      <div className="flex p-1 bg-stone-200 rounded-xl overflow-x-auto scrollbar-hide">
        {(Object.keys(CATEGORY_CONFIG) as PlanningCategory[]).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const isActive = activeTab === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-stone-800 shadow-sm' 
                  : 'text-stone-500 hover:text-stone-600'
              }`}
            >
              <config.icon size={20} className={`mb-1 ${isActive ? config.color.split(' ')[0] : 'text-stone-400'}`} />
              <span className="truncate w-full text-center px-1">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${activeConfig.barColor}`}
          style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
           <div className="text-center py-12 opacity-50">
             <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-300">
                <activeConfig.icon size={32} />
             </div>
             <p className="font-bold text-stone-500">{activeConfig.emptyText}</p>
             <Button variant="ghost" className="mt-2 text-stone-400" onClick={handleOpenAdd}>
               + 新增項目
             </Button>
           </div>
        ) : (
          filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`transition-all active:scale-[0.99] group border border-transparent ${item.checked ? 'opacity-60 bg-stone-50' : 'hover:border-stone-200'}`} 
              noPadding
              onClick={() => handleOpenEdit(item)}
            >
              <div className="flex p-3 gap-3">
                {/* Checkbox Area */}
                <div className="flex items-start pt-1">
                   <button 
                    onClick={(e) => toggleItem(e, item.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      item.checked 
                        ? 'bg-stone-400 border-stone-400 text-white' 
                        : `${activeConfig.checkboxColor} bg-white`
                    }`}
                  >
                     <CheckSquare size={14} fill={item.checked ? "currentColor" : "none"} strokeWidth={3} />
                   </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-stone-800 text-base leading-tight ${item.checked ? 'line-through text-stone-400' : ''}`}>
                      {item.name}
                    </h4>
                    {item.quantity > 1 && (
                      <span className="text-xs font-black bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded ml-2 shrink-0">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                  
                  {item.notes && (
                    <p className="text-xs text-stone-500 font-bold mt-1.5 flex items-center gap-1 truncate">
                       <AlignLeft size={10} /> {item.notes}
                    </p>
                  )}
                </div>

                {/* Actions / Image Preview */}
                <div className="flex flex-col gap-2 items-end justify-start">
                   {item.image ? (
                     <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden border border-stone-100">
                       <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     </div>
                   ) : (
                     <div className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={16} />
                     </div>
                   )}
                </div>
              </div>
              
              {/* Special Context Actions */}
              {!item.checked && activeTab === 'shopping' && (
                <div className="bg-orange-50 border-t border-orange-100 p-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <button className="text-xs font-bold text-orange-600 flex items-center justify-center gap-1 w-full hover:bg-orange-100 rounded py-1 transition-colors">
                    <Maximize2 size={12} /> 給店員看 (Show Clerk)
                  </button>
                </div>
              )}
              {/* Map/Link Action for Shops and Food */}
              {!item.checked && (activeTab === 'shops' || activeTab === 'food') && item.link && (
                 <div className={`p-2 text-center border-t ${activeTab === 'shops' ? 'bg-green-50 border-green-100' : 'bg-rose-50 border-rose-100'}`} onClick={(e) => e.stopPropagation()}>
                    <a 
                      href={item.link} 
                      target="_blank" 
                      className={`text-xs font-bold flex items-center justify-center gap-1 w-full rounded py-1 transition-colors ${activeTab === 'shops' ? 'text-green-600 hover:bg-green-100' : 'text-rose-600 hover:bg-rose-100'}`}
                    >
                      <LinkIcon size={12} /> 開啟連結/地圖
                    </a>
                 </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingItem ? "編輯項目" : `新增至${activeConfig.label}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
           {/* Category Switcher in Form */}
           <div className="flex gap-2 mb-2 p-1 bg-stone-100 rounded-lg overflow-x-auto scrollbar-hide">
             {(Object.keys(CATEGORY_CONFIG) as PlanningCategory[]).map(cat => (
               <button
                 key={cat}
                 type="button"
                 onClick={() => setFormData({...formData, category: cat})}
                 className={`flex-1 min-w-[60px] py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap px-1 ${
                   formData.category === cat 
                     ? 'bg-white text-stone-800 shadow-sm' 
                     : 'text-stone-400'
                 }`}
               >
                 {CATEGORY_CONFIG[cat].label}
               </button>
             ))}
           </div>

           <div className="flex gap-3">
             <div className="flex-1">
                <label className="block text-xs font-bold text-stone-400 mb-1">名稱</label>
                <input 
                  required
                  autoFocus
                  placeholder={
                     formData.category === 'packing' ? '例如: 變壓器' : 
                     formData.category === 'shops' ? '例如: 寶可夢中心' : 
                     formData.category === 'food' ? '例如: 敘敘苑燒肉' : '例如: 止痛藥'
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
             </div>
             {(formData.category === 'shopping' || formData.category === 'packing') && (
             <div className="w-20">
                <label className="block text-xs font-bold text-stone-400 mb-1">數量</label>
                <input 
                  type="number"
                  min="1"
                  className="w-full px-3 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none text-center"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                />
             </div>
             )}
           </div>

           <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">
                {formData.category === 'shops' || formData.category === 'food' ? '營業時間 / 預約資訊 / 備註' : 
                 formData.category === 'shopping' ? '規格 / 尺寸 / 備註' : '備註'}
              </label>
              <textarea 
                rows={2}
                placeholder={formData.category === 'shops' || formData.category === 'food' ? '例如: 10:00 - 20:00 (需預約)' : '備註細節...'}
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none resize-none"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
           </div>

           <div>
              <label className="block text-xs font-bold text-stone-400 mb-1">參考圖片網址 (選填)</label>
              <div className="relative">
                 <ImageIcon size={16} className="absolute left-3 top-3.5 text-stone-400" />
                 <input 
                   placeholder="https://..."
                   className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none text-xs"
                   value={formData.image}
                   onChange={e => setFormData({...formData, image: e.target.value})}
                 />
              </div>
           </div>
           
           {(formData.category === 'shops' || formData.category === 'food' || formData.category === 'shopping') && (
             <div>
                <label className="block text-xs font-bold text-stone-400 mb-1">相關連結 / Google Map (選填)</label>
                <div className="relative">
                   <LinkIcon size={16} className="absolute left-3 top-3.5 text-stone-400" />
                   <input 
                     placeholder="https://..."
                     className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-stone-100 font-bold text-stone-700 focus:border-orange-400 focus:outline-none text-xs"
                     value={formData.link}
                     onChange={e => setFormData({...formData, link: e.target.value})}
                   />
                </div>
             </div>
           )}

           <div className="flex gap-3 pt-2">
            {editingItem && (
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
              {editingItem ? "儲存修改" : "新增"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Planning;