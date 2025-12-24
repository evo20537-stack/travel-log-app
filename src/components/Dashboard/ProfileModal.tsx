
import React, { useState, useEffect, useRef } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Camera } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  onUpdateUserProfile: (data: { name?: string; avatar?: string }) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userName, userAvatar, onUpdateUserProfile }) => {
  const [profileFormData, setProfileFormData] = useState({ name: userName, avatar: userAvatar });
  const profileFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileFormData({ name: userName, avatar: userAvatar });
  }, [userName, userAvatar, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(profileFormData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="個人資料設定">
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl group cursor-pointer" onClick={() => profileFileRef.current?.click()}>
            <img src={profileFormData.avatar} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white" size={32} /></div>
          </div>
          <p className="text-[10px] font-black text-stone-400 mt-4 tracking-widest uppercase">點擊頭像更換照片</p>
          <input ref={profileFileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-stone-400 tracking-widest uppercase text-center">旅人名稱</label>
          <input required className="w-full px-6 py-4 rounded-2xl border-2 border-stone-100 font-black text-2xl text-stone-800 focus:border-orange-400 focus:outline-none text-center" value={profileFormData.name} onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })} />
        </div>
        <Button type="submit" className="w-full py-4 font-black tracking-widest">確認更新</Button>
      </form>
    </Modal>
  );
};

export default ProfileModal;
