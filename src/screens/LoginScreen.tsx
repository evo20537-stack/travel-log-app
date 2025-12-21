import React from 'react';
import { Plane, MapPin } from 'lucide-react';
import Button from '../components/ui/Button';
import { loginWithGoogle } from '../services/firebase';

const LoginScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-orange-200 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-sm w-full">
        
        {/* Logo / Icon */}
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center rotate-3 mb-4">
           <Plane size={48} className="text-stone-800" />
        </div>

        <div>
          <h1 className="text-4xl font-black text-stone-800 mb-2 tracking-tight">TravelLog</h1>
          <p className="text-stone-500 font-bold">旅路・你的專屬旅遊手札</p>
        </div>

        <div className="space-y-4 w-full">
           <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-stone-100 text-sm text-stone-500 leading-relaxed font-bold">
              <p className="mb-2">✨ 隨手記錄行程靈感</p>
              <p className="mb-2">👫 與旅伴共同規劃 (Coming Soon)</p>
              <p>☁️ 資料雲端同步，手機電腦皆可通</p>
           </div>

           <Button 
             onClick={loginWithGoogle}
             className="w-full bg-stone-800 text-white shadow-xl shadow-stone-300 py-4 text-lg"
           >
             使用 Google 帳號登入
           </Button>
           
           <p className="text-[10px] text-stone-400 font-bold mt-4">
             登入即代表同意我們的服務條款與隱私權政策
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
