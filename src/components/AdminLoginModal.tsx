import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, ArrowRight, AlertCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Admin122333') {
      soundFX.playClick();
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      soundFX.playClick();
      setError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleFillDemo = () => {
    setPassword('Admin122333');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white border-2 border-purple-200 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] absolute top-3 right-3 text-slate-400 hover:text-slate-700 flex items-center justify-center rounded-full hover:bg-purple-50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-200 via-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-3 text-purple-800 shadow-xs">
            <ShieldCheck className="w-7 h-7 text-purple-700" />
          </div>
          <h3 className="text-xl font-black text-slate-800">
            เข้าสู่ระบบแอดมิน (Admin)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            จัดการระบบลงทะเบียน นำเข้า Excel และควบคุม Lucky Draw
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>รหัสผ่านผู้ดูแลระบบ (Password)</span>
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] text-purple-600 hover:underline cursor-pointer font-bold"
              >
                กรอกอัตโนมัติ
              </button>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="ระบุรหัสผ่านผู้ดูแล..."
                className="w-full min-h-[48px] px-4 py-2.5 pr-11 rounded-2xl bg-slate-50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              รหัสผ่านที่กำหนด: <code className="text-purple-700 font-mono font-bold bg-purple-50 px-1.5 py-0.5 rounded">Admin122333</code>
            </p>
          </div>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 hover:from-amber-400 hover:to-purple-500 text-slate-900 font-black text-sm shadow-md shadow-pink-200 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
          >
            <span>เข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
