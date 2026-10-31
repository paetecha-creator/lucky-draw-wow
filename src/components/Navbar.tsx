import React from 'react';
import { Sparkles, Shield, Trophy, PartyPopper, Crown } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface NavbarProps {
  currentView: 'register' | 'ticket' | 'livedraw' | 'admin' | 'vip';
  onChangeView: (view: 'register' | 'ticket' | 'livedraw' | 'admin' | 'vip') => void;
  isAdminLoggedIn: boolean;
  hasMyTicket: boolean;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onChangeView,
  isAdminLoggedIn,
  hasMyTicket,
  onOpenAdminLogin,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title Wordmark */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onChangeView(hasMyTicket ? 'ticket' : 'register');
          }}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-300 via-pink-400 to-purple-400 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <PartyPopper className="w-5 h-5 text-slate-900" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-800">
            PartyPass <span className="text-purple-600 font-extrabold">Live</span>
          </span>
        </button>

        {/* Zone 2: Concise Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onChangeView('register');
            }}
            className={`transition whitespace-nowrap shrink-0 cursor-pointer ${
              currentView === 'register' ? 'text-purple-700 font-black' : 'hover:text-purple-600'
            }`}
          >
            ลงทะเบียนเข้างาน
          </button>

          {hasMyTicket && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onChangeView('ticket');
              }}
              className={`transition whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'ticket' ? 'text-purple-700 font-black' : 'hover:text-purple-600'
              }`}
            >
              บัตรเข้างาน & โต๊ะ
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onChangeView('livedraw');
            }}
            className={`transition whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
              currentView === 'livedraw' ? 'text-purple-700 font-black' : 'hover:text-purple-600'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>ผล Lucky Draw สด</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Admin Button) */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdminLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onChangeView(currentView === 'admin' ? (hasMyTicket ? 'ticket' : 'register') : 'admin');
              }}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                currentView === 'admin'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300'
                  : 'bg-gradient-to-r from-amber-300 to-amber-400 text-amber-950 hover:from-amber-400 hover:to-amber-500'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="whitespace-nowrap">
                {currentView === 'admin' ? 'ดูหน้าผู้ร่วมงาน' : 'แดชบอร์ดแอดมิน'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onOpenAdminLogin();
              }}
              className="min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-800 border border-purple-200 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>เข้าสู่ระบบแอดมิน</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
