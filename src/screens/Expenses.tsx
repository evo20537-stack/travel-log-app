import React, { useState, useMemo } from 'react';
import { Trip, Expense } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { Plus, Trash2, Utensils, Train, Building, ShoppingBag, Film, Star } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

// --- Props & 型別定義 ---
interface ExpensesProps {
  currentTrip: Trip;
  expenses: Expense[];
  onUpdateExpenses: (updatedExpenses: Expense[]) => void;
  exchangeRates?: { TWD: number }; // 讓 exchangeRates 成為可選的
}

type ExpenseCategory = '餐飲' | '交通' | '住宿' | '購物' | '娛樂' | '其他';
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['餐飲', '交通', '住宿', '購物', '娛樂', '其他'];

const CATEGORY_MAP: Record<ExpenseCategory, { icon: React.ElementType, bgColor: string, borderColor: string, dotColor: string }> = {
  '餐飲': { icon: Utensils, bgColor: 'bg-amber-100', borderColor: 'border-amber-400', dotColor: 'bg-amber-400' },
  '交通': { icon: Train, bgColor: 'bg-sky-100', borderColor: 'border-sky-400', dotColor: 'bg-sky-400' },
  '住宿': { icon: Building, bgColor: 'bg-indigo-100', borderColor: 'border-indigo-400', dotColor: 'bg-indigo-400' },
  '購物': { icon: ShoppingBag, bgColor: 'bg-purple-100', borderColor: 'border-purple-400', dotColor: 'bg-purple-400' },
  '娛樂': { icon: Film, bgColor: 'bg-rose-100', borderColor: 'border-rose-400', dotColor: 'bg-rose-400' },
  '其他': { icon: Star, bgColor: 'bg-stone-200', borderColor: 'border-stone-400', dotColor: 'bg-stone-400' },
};

// --- 主元件 ---
const Expenses: React.FC<ExpensesProps> = ({ 
  currentTrip, 
  expenses, 
  onUpdateExpenses, 
  exchangeRates = { TWD: 0.22 } 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState<Omit<Expense, 'id' | 'trip_id'>>({
    title: '',
    amount: 0,
    category: '餐飲',
    date: new Date().toISOString().split('T')[0],
    currency: 'JPY',
    notes: '',
  });

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: 0,
      category: '餐飲',
      date: new Date().toISOString().split('T')[0],
      currency: 'JPY',
      notes: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date.split('T')[0],
      currency: expense.currency || 'JPY',
      notes: expense.notes || '',
    });
    setIsFormOpen(true);
  };
  
  const handleDelete = () => {
    if (!editingExpense) return;
    if (confirm('確定要刪除這筆帳目嗎？')) {
      onUpdateExpenses(expenses.filter(e => e.id !== editingExpense.id));
      setIsFormOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      alert('請輸入有效的金額！');
      return;
    }
    const finalTitle = formData.title.trim() === '' ? formData.category : formData.title.trim();
    const newOrUpdatedExpense: Expense = {
      id: editingExpense ? editingExpense.id : uuidv4(),
      trip_id: currentTrip.id,
      ...formData,
      title: finalTitle,
    };
    const updatedList = editingExpense
      ? expenses.map(e => e.id === editingExpense.id ? newOrUpdatedExpense : e)
      : [...expenses, newOrUpdatedExpense];
    updatedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdateExpenses(updatedList);
    setIsFormOpen(false);
  };

  const { totalJPY, totalTWD, totalConvertedToTWD, categoryTotals } = useMemo(() => {
    const rate = exchangeRates.TWD;
    let totalJPY = 0;
    let totalTWD = 0;
    const categoryTotals: { [key in ExpenseCategory]?: number } = {};

    expenses.forEach(exp => {
      const amountInTWD = exp.currency === 'JPY' ? exp.amount * rate : exp.amount;
      if (exp.currency === 'JPY') {
        totalJPY += exp.amount;
      } else if (exp.currency === 'TWD') {
        totalTWD += exp.amount;
      }
      
      const category = exp.category as ExpenseCategory;
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category]! += amountInTWD;
    });

    const totalConvertedToTWD = totalJPY * rate + totalTWD;
    return { totalJPY, totalTWD, totalConvertedToTWD, categoryTotals };
  }, [expenses, exchangeRates]);

  const dailyExpenses = useMemo(() => {
    const grouped: { [key: string]: Expense[] } = {};
    expenses.forEach(expense => {
      const date = expense.date.split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(expense);
    });
    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  }, [expenses]);
  
  const getConvertedAmount = (amount: number, currency: string) => {
    if (currency === 'JPY') {
      return { amount: amount * exchangeRates.TWD, currency: 'TWD' };
    }
    return { amount: amount / exchangeRates.TWD, currency: 'JPY' };
  };

  return (
    <div className="pb-20 animate-fade-in">
      <header className="p-4 pt-2 sticky top-0 bg-[#F7F4EB]/80 backdrop-blur-md z-40">
        <div className='flex justify-between items-center mb-4'>
            <h2 className="text-2xl font-black text-stone-800">旅費總覽</h2>
            <Button onClick={handleOpenAdd} className="bg-stone-800 text-white rounded-xl shadow-lg shadow-stone-200 shrink-0"><Plus size={20} /></Button>
        </div>

        <div className="bg-stone-800 text-white rounded-2xl p-5 shadow-lg">
          <div className="grid grid-cols-2 divide-x divide-stone-600 mb-4">
            <div className="pr-4">
              <p className="text-sm text-stone-300">日幣總支出 (JPY)</p>
              <p className="text-3xl font-black">¥{Math.round(totalJPY).toLocaleString()}</p>
            </div>
            <div className="pl-4">
              <p className="text-sm text-stone-300">台幣總支出 (TWD)</p>
              <p className="text-3xl font-black">${Math.round(totalConvertedToTWD).toLocaleString()}</p>
            </div>
          </div>
          <hr className="border-stone-600 mb-3" />
          <p className="text-xs text-stone-400 mb-2">消費種類分佈 (已換算為台幣)</p>
          <div className="w-full flex h-3 rounded-full overflow-hidden mb-3">
            {Object.entries(categoryTotals).map(([cat, amount]) => (
              <div key={cat}
                   className={CATEGORY_MAP[cat as ExpenseCategory]?.dotColor || 'bg-stone-400'}
                   style={{ width: `${(amount / totalConvertedToTWD) * 100}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(categoryTotals).sort(([,a], [,b]) => b - a).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_MAP[cat as ExpenseCategory]?.dotColor || 'bg-stone-400'}`} />
                  <span className="text-stone-300">{cat}</span>
                </div>
                <span className="font-semibold text-stone-200">${Math.round(amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="px-4 mt-4 space-y-4">
        <h3 className="font-bold text-stone-500 text-sm">帳目明細 ({expenses.length})</h3>
        {dailyExpenses.map(([date, dayExpenses]) => (
          <div key={date}>
            <h4 className="font-black text-stone-700 text-lg mb-2">{format(parseISO(date), 'MM / dd (E)')}</h4>
            <div className="space-y-3">
              {dayExpenses.map(expense => {
                const config = CATEGORY_MAP[expense.category as ExpenseCategory] || CATEGORY_MAP['其他'];
                const Icon = config.icon;
                const converted = getConvertedAmount(expense.amount, expense.currency);

                return (
                  <div key={expense.id} onClick={() => handleOpenEdit(expense)} 
                       className={`bg-white shadow-md rounded-2xl flex items-stretch gap-4 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden border-l-4 ${config.borderColor}`}>
                    <div className={`w-16 flex-shrink-0 flex items-center justify-center ${config.bgColor}`}>
                      <Icon size={24} className={config.borderColor.replace('border-', 'text-')} />
                    </div>
                    <div className="flex-1 py-3 pr-4 flex justify-between items-center min-w-0">
                        <div className='min-w-0'>
                           <p className="font-bold text-stone-800 truncate">{expense.title}</p>
                           <p className="text-xs font-semibold text-stone-400">{format(parseISO(expense.date), 'yyyy-MM-dd')}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                           <p className="font-black text-lg text-sky-600">
                             {expense.currency === 'JPY' ? '¥' : '$'}{expense.amount.toLocaleString()}
                           </p>
                           <p className="text-xs font-bold text-stone-400">
                             ≈ {converted.currency === 'JPY' ? '¥' : '$'}{Math.round(converted.amount).toLocaleString()}
                           </p>
                        </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {expenses.length === 0 && (
            <div className="text-center py-10 text-stone-400">
                <p>點擊上方 + 新增第一筆帳目</p>
            </div>
        )}
      </main>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingExpense ? "編輯帳目" : "新增帳目"}>
        <form onSubmit={handleSave} className="space-y-5">
           <div>
            <label className="block text-xs font-bold text-stone-600 mb-2">類別</label>
            <div className="grid grid-cols-3 gap-3">
              {EXPENSE_CATEGORIES.map(cat => {
                const config = CATEGORY_MAP[cat];
                const Icon = config.icon;
                const isSelected = formData.category === cat;
                return (
                  <button type="button" key={cat} onClick={() => setFormData({...formData, category: cat})}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-bold transition-all ${isSelected ? 'bg-white border-stone-800 shadow-md scale-105' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}><Icon size={20} /></div>
                    <span>{cat}</span>
                  </button>
                )
              })}
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">幣別</label>
                <select required className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value as 'TWD' | 'JPY'})}>
                    <option value="JPY">JPY (¥)</option>
                    <option value="TWD">TWD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 mb-1">金額</label>
                <input type="number" required placeholder="0" className="w-full p-3 rounded-xl border-2 border-stone-200 font-bold text-stone-800" value={formData.amount} onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})} />
              </div>
           </div>
           <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">品項 (選填)</label>
            <input placeholder="買了什麼？（可留白）" className="w-full p-3 rounded-xl border-2 border-stone-200 font-bold text-stone-800" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">備註 (選填)</label>
              <textarea rows={2} placeholder="地點、用途或其他說明..." className="w-full p-3 rounded-xl border-2 border-stone-200 resize-none" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
           </div>
           <div>
              <label className="block text-xs font-bold text-stone-600 mb-1">日期</label>
              <input type="date" required className="w-full p-3 rounded-xl border-2 border-stone-200 bg-white font-bold" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
            </div>
           <div className="flex gap-3 pt-2">
            {editingExpense && <Button type="button" variant="danger" onClick={handleDelete} className="mr-auto"><Trash2 size={16} /></Button>}
            <Button variant="secondary" type="button" onClick={() => setIsFormOpen(false)}>取消</Button>
            <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
