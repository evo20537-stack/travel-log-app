import React, { useState, useMemo, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Plus, Wallet, Trash2, Utensils, Train, ShoppingBag, BedDouble, Clapperboard, MoreHorizontal } from 'lucide-react';
import { Trip, Expense } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface ExpensesProps {
  currentTrip: Trip;
  expenses: Expense[];
  onUpdateExpenses: (updatedExpenses: Expense[]) => void;
}

const CATEGORIES: { id: Expense['category'], label: string, icon: React.ElementType, color: string, darkColor: string }[] = [
  { id: '餐飲', label: '餐飲', icon: Utensils, color: 'bg-orange-100', darkColor: 'bg-orange-500' },
  { id: '交通', label: '交通', icon: Train, color: 'bg-blue-100', darkColor: 'bg-blue-500' },
  { id: '住宿', label: '住宿', icon: BedDouble, color: 'bg-indigo-100', darkColor: 'bg-indigo-500' },
  { id: '購物', label: '購物', icon: ShoppingBag, color: 'bg-pink-100', darkColor: 'bg-pink-500' },
  { id: '娛樂', label: '娛樂', icon: Clapperboard, color: 'bg-green-100', darkColor: 'bg-green-500' },
  { id: '其他', label: '其他', icon: MoreHorizontal, color: 'bg-stone-100', darkColor: 'bg-stone-500' },
];

const Expenses: React.FC<ExpensesProps> = ({ currentTrip, expenses, onUpdateExpenses }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0.22); // 預設匯率

  const [formData, setFormData] = useState<Omit<Expense, 'id' | 'trip_id'>>({
    title: '',
    amount: 0,
    category: '餐飲',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    currency: 'JPY',
  });

  useEffect(() => {
    // --- 達人級優化：自動獲取即時匯率 ---
    const fetchRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/JPY');
        const data = await response.json();
        if (data.rates && data.rates.TWD) {
          setExchangeRate(data.rates.TWD);
        }
      } catch (error) {
        console.error("無法獲取匯率，將使用預設值", error);
      }
    };
    fetchRate();
  }, []);

  const { totalTWD, totalJPY, categoryTotalsInTWD } = useMemo(() => {
    let twd = 0;
    let jpy = 0;
    const catTotals: { [key: string]: number } = {};

    for (const exp of expenses) {
      const amountInTWD = exp.currency === 'JPY' ? exp.amount * exchangeRate : exp.amount;
      catTotals[exp.category] = (catTotals[exp.category] || 0) + amountInTWD;
      
      if (exp.currency === 'TWD') twd += exp.amount;
      else jpy += exp.amount;
    }
    return { totalTWD: twd, totalJPY: jpy, categoryTotalsInTWD: catTotals };
  }, [expenses, exchangeRate]);

  const totalCombinedInTWD = totalTWD + totalJPY * exchangeRate;

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({ title: '', amount: 0, category: '餐飲', date: new Date().toISOString().split('T')[0], currency: 'JPY', notes: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({ ...expense, notes: expense.notes || '' });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('確定要刪除這筆開銷嗎？')) {
      onUpdateExpenses(expenses.filter(e => e.id !== id));
      setIsFormOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) return;
    const newOrUpdatedExpense: Expense = {
      id: editingExpense ? editingExpense.id : uuidv4(),
      ...formData,
      amount: Number(formData.amount) || 0,
    };
    let updatedList = editingExpense
      ? expenses.map(ex => ex.id === editingExpense.id ? newOrUpdatedExpense : ex)
      : [...expenses, newOrUpdatedExpense];
    updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdateExpenses(updatedList);
    setIsFormOpen(false);
  };

  const getCategoryConfig = (catId: Expense['category']) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
       <header className="sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md z-40 pt-2 pb-4 border-b border-stone-200/50">
         <div className="flex justify-between items-end mb-4">
          <div>
              <span className="text-xs font-bold text-stone-500 truncate">{currentTrip.title}</span>
              <h2 className="text-2xl font-black text-stone-800">旅費總管 💰</h2>
          </div>
          <Button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-xl shadow-lg shadow-stone-200 shrink-0"><Plus size={20} /></Button>
        </div>
      </header>

      {/* --- 全新的雙幣總覽卡 --- */}
      <Card className="bg-gradient-to-br from-stone-800 to-stone-900 text-white shadow-2xl shadow-stone-200">
        <div className="grid grid-cols-2 gap-4 divide-x divide-white/20">
          <div className="pr-4">
             <p className="text-sm font-bold text-white/60">日幣總支出 (JPY)</p>
             <p className="text-3xl font-black tracking-tight"><span className="font-normal">¥</span>{Math.round(totalJPY).toLocaleString()}</p>
          </div>
          <div className="pl-4">
             <p className="text-sm font-bold text-white/60">台幣總支出 (TWD)</p>
             <p className="text-3xl font-black tracking-tight"><span className="font-normal">$</span>{Math.round(totalTWD).toLocaleString()}</p>
          </div>
        </div>
        
        {totalCombinedInTWD > 0 && (
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-center text-xs text-white/60 font-bold mb-2">消費種類分佈 (已換算為台幣)</p>
              <div className="flex h-3 w-full bg-black/20 rounded-full overflow-hidden mb-3">
              {CATEGORIES.map(cat => {
                  const percent = (categoryTotalsInTWD[cat.id] || 0) / totalCombinedInTWD * 100;
                  if (percent === 0) return null;
                  return <div key={cat.id} className={cat.darkColor} style={{ width: `${percent}%` }} />
              })}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(categoryTotalsInTWD).sort(([,a],[,b]) => b-a).map(([catId, amount]) => (
                      <div key={catId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getCategoryConfig(catId as any).darkColor}`}></div>
                              <span className="font-bold text-stone-300">{catId}</span>
                          </div>
                          <span className="font-mono font-bold text-stone-400">${Math.round(amount).toLocaleString()}</span>
                      </div>
                  ))}
              </div>
            </div>
        )}
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-stone-600 text-sm px-1">帳目明細 ({expenses.length})</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-16 opacity-60">
            <Wallet size={48} className="mx-auto mb-3 text-stone-300" />
            <p className="font-bold text-stone-500">尚無任何開銷</p>
             <p className="text-sm text-stone-400 mt-1">點擊右上角記第一筆帳吧！</p>
          </div>
        ) : (
          expenses.map((exp) => {
            const config = getCategoryConfig(exp.category);
            const isJPY = exp.currency === 'JPY';
            const convertedAmount = isJPY ? exp.amount * exchangeRate : exp.amount / exchangeRate;
            return (
              <Card key={exp.id} className="p-0 group relative overflow-hidden" onClick={() => handleOpenEdit(exp)}>
                <div className="flex items-center">
                    <div className={`w-3 h-full absolute left-0 top-0 ${config.color.replace('bg-', 'border-r-4 border-').replace('-100', '-400')}`}></div>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-lg ${config.color} text-lg ml-6`}><config.icon size={20}/></div>
                    <div className="flex-1 px-4 min-w-0">
                        <h4 className="font-bold text-stone-800 truncate">{exp.title}</h4>
                        <p className="text-xs text-stone-400 font-bold mt-1">{format(new Date(exp.date), 'yyyy-MM-dd')}</p>
                    </div>
                    <div className="text-right pl-4 pr-4">
                        <p className={`font-black text-lg ${isJPY ? 'text-sky-600' : 'text-emerald-600'}`}>{isJPY ? '¥' : '$'}{exp.amount.toLocaleString()}</p>
                        <p className="text-xs text-stone-400 font-mono">≈ {isJPY ? '$' : '¥'}{Math.round(convertedAmount).toLocaleString()}</p>
                    </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* --- 全新的雙幣表單 --- */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingExpense ? '編輯開銷' : '新增開銷'}>
         <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-stone-100 p-1 rounded-full grid grid-cols-2 gap-1">
                <button type="button" onClick={() => setFormData(f => ({...f, currency: 'JPY'}))} className={`py-2 text-sm font-bold rounded-full ${formData.currency === 'JPY' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>日幣 (JPY)</button>
                <button type="button" onClick={() => setFormData(f => ({...f, currency: 'TWD'}))} className={`py-2 text-sm font-bold rounded-full ${formData.currency === 'TWD' ? 'bg-white shadow-sm' : 'text-stone-500'}`}>台幣 (TWD)</button>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">項目</label>
              <input required placeholder='晚餐：函館朝市海鮮丼' className="w-full p-3 rounded-xl border-2 border-stone-200" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
           </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">金額 ({formData.currency})</label>
                    <input required type="number" inputMode="numeric" placeholder='3000' className="w-full p-3 rounded-xl border-2 border-stone-200" value={formData.amount === 0 ? '' : formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">日期</label>
                    <input required type="date" className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
            </div>
           <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">類別</label>
                <select className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Expense['category']})}>
                    {CATEGORIES.map(cat => <option key={cat.id}>{cat.label}</option>)}
                </select>
            </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">備註 (選填)</label>
              <textarea rows={2} className="w-full p-3 rounded-xl border-2 border-stone-200 resize-none" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
           </div>
           <div className="flex gap-3 pt-2">
            {editingExpense && <Button type="button" variant="danger" onClick={() => handleDelete(editingExpense.id)} className="mr-auto"><Trash2 size={16} /></Button>}
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
            <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;