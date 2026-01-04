import React, { useState, useEffect } from 'react';
import { Profile } from '../../types';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: Profile;
  onUpdateUserProfile: (updatedProfile: Omit<Profile, 'id'>) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, userProfile, onUpdateUserProfile }) => {
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    exchangeRate: 0.22, // [✨ 修正點] 新增 state
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: userProfile.username,
        avatar_url: userProfile.avatar_url,
        exchangeRate: userProfile.exchangeRate, // 當 modal 開啟時，載入當前匯率
      });
    }
  }, [isOpen, userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="個人資料設定">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-stone-600 mb-1">暱稱</label>
          <input
            name="username"
            type="text"
            className="w-full p-3 rounded-xl border-2 border-stone-200"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-stone-600 mb-1">頭像 URL</label>
          <input
            name="avatar_url"
            type="url"
            className="w-full p-3 rounded-xl border-2 border-stone-200"
            value={formData.avatar_url}
            onChange={handleChange}
          />
        </div>

        {/* [✨ 修正點] 新增匯率輸入框 */}
        <div>
          <label className="block text-sm font-bold text-stone-600 mb-1">預設匯率 (1 JPY = ? TWD)</label>
          <input
            name="exchangeRate"
            type="number"
            step="0.001"
            className="w-full p-3 rounded-xl border-2 border-stone-200"
            value={formData.exchangeRate}
            onChange={handleChange}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>取消</Button>
          <Button type="submit" className="bg-stone-800 text-white">儲存</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;
