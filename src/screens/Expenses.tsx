import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Plus, TrendingUp, DollarSign, Utensils, Train, ShoppingBag, BedDouble, Coffee, Ticket, Wallet, ArrowRightLeft } from 'lucide-react';
import { Expense } from '../types';

interface ExpensesProps {
  currentTripId: string;
}

// 匯率常數 (僅用於計算比例圖的權重，不顯示換算金額)
const JPY_RATE_WEIGHT = 0.215;

const MOCK_INITIAL_DATA: Record<string, Expense[]> = {
  '1': [ // Tokyo
    { id: '1', item: '一蘭拉麵', amount: 2560, currency: 'JPY', payer: 'Me', category: 'food', date: '2024-04-12' },
    { id: '2', item: '西瓜卡儲值', amount: 3000, currency: 'JPY', payer: 'Me', category: 'transport', date: '2024-04-12' },
    { id: '3', item: '伴手禮', amount: 5000, currency: 'JPY', payer: 'Wife', category: 'shopping', date: '2024-04-11' },
    { id: '4', item: '機場接送', amount: 1200, currency: 'TWD', payer: 'Me', category: 'transport', date: '2024-04-10' },
  ],
  '2': [ // Kyoto
    { id: '5', item: '和服租借', amount: 8000, currency: 'JPY', payer: 'Me', category: 'shopping', date: '2024-11-21' },
    { id: '6', item: '嵐山小火車', amount: 1600, currency: 'JPY', payer: 'Me', category: 'transport', date: '2024-11-22' }
  ]
};

// 優化配色配置，確保對比度
const CATEGORIES = [
  { id: 'food', label: '餐飲', icon: Utensils, color: 'bg-orange-100 text-orange-600', activeBorder: 'border-orange-500', barColor: 'bg-orange-500' },
  { id: 'transport', label: '交通', icon: Train, color: 'bg-blue-100 text-blue-600', activeBorder: 'border-blue-500', barColor: 'bg-blue-500' },
  { id: 'shopping', label: '購物', icon: ShoppingBag, color: 'bg-pink-100 text-pink-600', activeBorder: 'border-pink-500', barColor: 'bg-pink-500' },
  { id: 'stay', label: '住宿', icon: BedDouble, color: 'bg-indigo-100 text-indigo-600', activeBorder: 'border-indigo-500', barColor: 'bg-indigo-500' },
  { id: 'ticket', label: '門票', icon: Ticket, color: 'bg-green-100 text-green-600', activeBorder: 'border-green-500', barColor: 'bg-green-500' },
  { id: 'other', label: '其他', icon: Coffee, color: 'bg-stone-200 text-stone-600', activeBorder: 'border-stone-500', barColor: 'bg-stone-500' },
];

const Expenses: React.FC<ExpensesProps> = ({ currentTripId }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCurrency, setInputCurrency] = useState<'TWD' | 'JPY'>('JPY');
  
  // Form State
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    category: 'food',
    payer: 'Me'
  });

  // Reset expenses when trip changes
  useEffect(() => {
    setExpenses(MOCK_INITIAL_DATA[currentTripId] || []);
  }, [currentTripId]);

  // --- 計算各幣別總額 ---
  const totalTWD = expenses
    .filter(e => e.currency === 'TWD')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalJPY = expenses
    .filter(e => e.currency === 'JPY')
    .reduce((sum, item) => sum + item.amount, 0);

  // --- 計算比例用 (內部權重換算) ---
  const totalWeightValue = totalTWD + (totalJPY * JPY_RATE_WEIGHT);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (!amountVal) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      item: formData.item || '未命名項目',
      amount: amountVal,
      currency: inputCurrency,
      payer: formData.payer,
      category: formData.category as any,
      date: new Date().toISOString().split('T')[0]
    };

    setExpenses([newExpense, ...expenses]);
    setFormData({ item: '', amount: '', category: 'food', payer: 'Me' });
    setIsModalOpen(false);
  };

  const getCategoryConfig = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      {/* Header with Top Add Button */}
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-2xl font-black text-stone-800">記帳本 💰</h2>
           <p className="text-xs text-stone-400 font-bold mt-1">支出紀錄與統計</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)} 
          size="sm" 
          className="bg-stone-800 text-white shadow-lg shadow-stone-200 active:scale-95 px-4"
        >
          <Plus size={18} strokeWidth={3} className="mr-1" /> 記一筆
        </Button>
      </header>

      {/* Stats Card - Split Currencies */}
      <Card className="bg-[#2C2C2C] text-white border-none shadow-xl shadow-stone-300 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col gap-5 mb-5 relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-60">
            <TrendingUp size={16} className="text-orange-400" />
            <span className="text-xs font-bold tracking-wider uppercase">Total Expenses</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {/* 台幣區塊 */}
             <div className="bg-[#3D3D3D] rounded-2xl p-4 border border-white/5 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-5 h-5 rounded-full bg-[#4A4A4A] flex items-center justify-center text-[10px] font-bold text-stone-300">$</div>
                   <span className="text-xs text-stone-400 font-bold">台幣 TWD</span>
                </div>
                <div className="text-2xl font-black tracking-tight text-white truncate">
                   {totalTWD.toLocaleString()}
                </div>
             </div>

             {/* 日幣區塊 */}
             <div className="bg-[#3D3D3D] rounded-2xl p-4 border border-white/5 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-400">¥</div>
                   <span className="text-xs text-stone-400 font-bold">日幣 JPY</span>
                </div>
                <div className="text-2xl font-black tracking-tight text-orange-100 truncate">
                   {totalJPY.toLocaleString()}
                </div>
             </div>
          </div>
        </div>
        
        {/* Proportions Bar */}
        {totalWeightValue > 0 && (
          <div className="pt-4 border-t border-white/10 relative z-10">
            <div className="flex h-3 w-full bg-[#1A1A1A] rounded-full overflow-hidden mb-3">
              {CATEGORIES.map(cat => {
                  const catTWD = expenses.filter(e => e.category === cat.id && e.currency === 'TWD').reduce((sum, e) => sum + e.amount, 0);
                  const catJPY = expenses.filter(e => e.category === cat.id && e.currency === 'JPY').reduce((sum, e) => sum + e.amount, 0);
                  const catWeight = catTWD + (catJPY * JPY_RATE_WEIGHT);
                  const percent = (catWeight / totalWeightValue) * 100;
                  
                  if (percent === 0) return null;

                  return (
                      <div 
                        key={cat.id} 
                        className={`h-full ${cat.barColor}`} 
                        style={{ width: `${percent}%` }} 
                      />
                  );
              })}
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {CATEGORIES.map(cat => {
                const catTWD = expenses.filter(e => e.category === cat.id && e.currency === 'TWD').reduce((sum, e) => sum + e.amount, 0);
                const catJPY = expenses.filter(e => e.category === cat.id && e.currency === 'JPY').reduce((sum, e) => sum + e.amount, 0);
                const catWeight = catTWD + (catJPY * JPY_RATE_WEIGHT);
                
                // 計算並四捨五入百分比
                const percent = totalWeightValue > 0 ? (catWeight / totalWeightValue) * 100 : 0;

                if (Math.round(percent) === 0) return null;

                return (
                    <div key={cat.id} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${cat.barColor}`}></div>
                      <span className="text-[10px] text-stone-300 font-bold">
                        {cat.label} <span className="text-stone-500 ml-0.5">{Math.round(percent)}%</span>
                      </span>
                    </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Expense List */}
      <div className="space-y-3">
        <h3 className="font-bold text-stone-600 text-sm flex justify-between items-end px-1">
           <span>最近紀錄</span>
           <span className="text-xs font-bold text-stone-400 bg-white border border-stone-200 px-2 py-0.5 rounded-full">{expenses.length} 筆</span>
        </h3>
        
        {expenses.length === 0 ? (
          <div className="text-center py-10 opacity-60">
             <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSign className="text-stone-300" size={32} />
             </div>
             <p className="text-stone-400 font-bold text-sm">還沒有記帳紀錄</p>
          </div>
        ) : (
          expenses.map((exp) => {
            const config = getCategoryConfig(exp.category);
            return (
              <Card key={exp.id} className="flex justify-between items-center py-3 active:scale-[0.99] transition-transform" noPadding>
                <div className="flex items-center gap-3 p-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.color}`}>
                    <config.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-stone-800 text-sm truncate">{exp.item}</h4>
                    <p className="text-[10px] text-stone-400 font-bold mt-1 flex items-center gap-1">
                      <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{config.label}</span>
                      <span>• {exp.date.slice(5).replace('-','/')}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right p-4 flex flex-col justify-center min-w-[100px]">
                  <p className={`font-black text-lg ${exp.currency === 'JPY' ? 'text-stone-800' : 'text-stone-600'}`}>
                    <span className="text-xs font-bold mr-1 align-top mt-1 inline-block text-stone-400">{exp.currency === 'JPY' ? '¥' : 'NT$'}</span>
                    {exp.amount.toLocaleString()}
                  </p>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="新增支出"
      >
         <form onSubmit={handleAddExpense} className="space-y-6">
            
            {/* Currency Toggle (Segmented Control) */}
            <div className="bg-stone-100 p-1.5 rounded-xl flex relative">
               <button
                 type="button"
                 onClick={() => setInputCurrency('JPY')}
                 className={`flex-1 py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-1.5 transition-all relative z-10 ${
                   inputCurrency === 'JPY' ? 'bg-white text-stone-800 shadow-sm ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-500'
                 }`}
               >
                 ¥ 日幣
               </button>
               <button
                 type="button"
                 onClick={() => setInputCurrency('TWD')}
                 className={`flex-1 py-2.5 rounded-lg text-sm font-black flex items-center justify-center gap-1.5 transition-all relative z-10 ${
                   inputCurrency === 'TWD' ? 'bg-white text-stone-800 shadow-sm ring-1 ring-black/5' : 'text-stone-400 hover:text-stone-500'
                 }`}
               >
                 $ 台幣
               </button>
            </div>

            {/* Amount Input */}
            <div>
               <label className="block text-xs font-bold text-stone-400 mb-1.5 ml-1">金額</label>
               <div className="relative group">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black transition-colors ${formData.amount ? 'text-stone-800' : 'text-stone-300'}`}>
                     {inputCurrency === 'JPY' ? '¥' : '$'}
                  </span>
                  <input 
                    type="number"
                    inputMode="decimal"
                    required
                    autoFocus
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-stone-100 bg-stone-50/50 font-black text-3xl text-stone-800 focus:border-orange-400 focus:bg-white focus:outline-none transition-all placeholder:text-stone-200"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
               </div>
            </div>

            {/* Item Name */}
            <div>
               <label className="block text-xs font-bold text-stone-400 mb-1.5 ml-1">項目名稱</label>
               <input 
                 required
                 placeholder="例如：章魚燒、車票"
                 className="w-full px-4 py-3.5 rounded-xl border-2 border-stone-100 bg-stone-50/50 font-bold text-stone-800 focus:border-orange-400 focus:bg-white focus:outline-none transition-all placeholder:text-stone-300"
                 value={formData.item}
                 onChange={e => setFormData({...formData, item: e.target.value})}
               />
            </div>

            {/* Category Grid */}
            <div>
               <label className="block text-xs font-bold text-stone-400 mb-2 ml-1">選擇分類</label>
               <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => {
                     const isActive = formData.category === cat.id;
                     return (
                       <button
                         key={cat.id}
                         type="button"
                         onClick={() => setFormData({...formData, category: cat.id})}
                         className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                           isActive 
                             ? `${cat.color} ${cat.activeBorder} bg-opacity-100 shadow-sm scale-[1.02]` 
                             : 'bg-stone-50 border-transparent text-stone-400 hover:bg-stone-100'
                         }`}
                       >
                          <cat.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                          <span className={`text-[10px] font-bold mt-1.5 ${isActive ? 'opacity-100' : 'opacity-80'}`}>{cat.label}</span>
                       </button>
                     )
                  })}
               </div>
            </div>

            <Button type="submit" className="w-full py-4 text-lg shadow-xl shadow-orange-100 mt-2">
               確認記帳
            </Button>
         </form>
      </Modal>
    </div>
  );
};

export default Expenses;