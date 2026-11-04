import React from 'react';
import { UserCheck, Ticket, Trophy, Shield } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface MobileBottomNavProps {
  currentView: 'register' | 'ticket' | 'livedraw' | 'admin' | 'vip';
  onChangeView: (view: 'register' | 'ticket' | 'livedraw' | 'admin' | 'vip') => void;
  isAdminLoggedIn: boolean;
  hasMyTicket: boolean;
  onOpenAdminLogin: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onChangeView,
  isAdminLoggedIn,
  hasMyTicket,
  onOpenAdminLogin,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-purple-100 pb-safe shadow-lg">
      <div className={`grid ${isAdminLoggedIn ? 'grid-cols-4' : 'grid-cols-3'} items-center h-16 px-1`}>
        {/* Tab 1: Register */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onChangeView('register');
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] transition ${
            currentView === 'register' ? 'text-purple-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">ลงทะเบียน</span>
        </button>

        {/* Tab 2: My Pass */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            if (hasMyTicket) {
              onChangeView('ticket');
            } else {
              onChangeView('register');
            }
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] transition relative ${
            currentView === 'ticket' ? 'text-purple-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">
            {hasMyTicket ? 'บัตรและโต๊ะ' : 'บัตรเข้างาน'}
          </span>
          {hasMyTicket && currentView !== 'ticket' && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-pink-400 ring-2 ring-white" />
          )}
        </button>

        {/* Tab 3: Live Draw */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onChangeView('livedraw');
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] transition relative ${
            currentView === 'livedraw' ? 'text-purple-700 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">ผลรางวัล</span>
          <span className="absolute top-2 right-3 w-2 h-2 rounded-full bg-amber-400" />
        </button>

        {/* Tab 4: Admin (Only visible when Admin is logged in) */}
        {isAdminLoggedIn && (
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onChangeView('admin');
            }}
            className={`flex flex-col items-center justify-center min-h-[44px] transition ${
              currentView === 'admin' ? 'text-purple-700 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">แดชบอร์ด</span>
          </button>
        )}
      </div>
    </nav>
  );
};
