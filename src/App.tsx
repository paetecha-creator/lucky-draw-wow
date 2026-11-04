/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Lock } from 'lucide-react';
import {
  AttendeeRegistration,
  EmployeeRoster,
  LuckyDrawRecord,
  PartyConfig,
  Prize,
} from './types/party';
import { StorageService, subscribeToBroadcast, broadcastEvent } from './utils/storage';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { RegistrationForm } from './components/RegistrationForm';
import { TicketPass } from './components/TicketPass';
import { LiveDrawFeed } from './components/LiveDrawFeed';
import { AdminDashboard } from './components/AdminDashboard';
import { VipDrawScreen } from './components/VipDrawScreen';
import { AdminLoginModal } from './components/AdminLoginModal';
import { soundFX } from './utils/audio';

export default function App() {
  // Application Data States
  const [roster, setRoster] = useState<EmployeeRoster[]>(() => StorageService.getRoster());
  const [registrations, setRegistrations] = useState<AttendeeRegistration[]>(() =>
    StorageService.getRegistrations()
  );
  const [prizes, setPrizes] = useState<Prize[]>(() => StorageService.getPrizes());
  const [luckyWinners, setLuckyWinners] = useState<LuckyDrawRecord[]>(() =>
    StorageService.getLuckyWinners()
  );
  const [config, setConfig] = useState<PartyConfig>(() => StorageService.getConfig());

  // Navigation View State
  const [currentView, setCurrentView] = useState<'register' | 'ticket' | 'livedraw' | 'admin' | 'vip'>(() => {
    // Check if URL has ?vip=1 or hash #vip
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('vip') === '1' || searchParams.get('vip') === 'true' || window.location.hash === '#vip') {
        return 'vip';
      }
    }
    return 'register';
  });

  const [myRegistration, setMyRegistration] = useState<AttendeeRegistration | null>(null);

  // Admin Auth State (Password: Admin122333)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('admin_session_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  // Sync state on load and initialize my ticket if exists
  useEffect(() => {
    const myId = StorageService.getMyRegistrationId();
    if (myId) {
      const match = registrations.find((r) => r.id === myId);
      if (match) {
        setMyRegistration(match);
      }
    }
  }, [registrations]);

  // Subscribe to BroadcastChannel & 1s heartbeat for 100% instantaneous real-time sync across all devices & tabs
  useEffect(() => {
    const reloadAllFromStorage = () => {
      setRoster(StorageService.getRoster());
      setRegistrations(StorageService.getRegistrations());
      setPrizes(StorageService.getPrizes());
      setLuckyWinners(StorageService.getLuckyWinners());
      setConfig(StorageService.getConfig());
    };

    // BroadcastChannel sync (instantaneous across tabs in modern browsers)
    const unsubscribe = subscribeToBroadcast(() => {
      reloadAllFromStorage();
    });

    // Storage event sync (when localStorage changes in another window/tab)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.startsWith('party_')) {
        reloadAllFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 1-second active heartbeat sync (guarantees cross-window / iframe / mobile views update within 1s)
    const heartbeatTimer = setInterval(() => {
      const freshConfig = StorageService.getConfig();
      const freshRegs = StorageService.getRegistrations();
      const freshWinners = StorageService.getLuckyWinners();
      const freshPrizes = StorageService.getPrizes();

      setConfig((prev) => (JSON.stringify(prev) !== JSON.stringify(freshConfig) ? freshConfig : prev));
      setRegistrations((prev) => (prev.length !== freshRegs.length || JSON.stringify(prev) !== JSON.stringify(freshRegs) ? freshRegs : prev));
      setLuckyWinners((prev) => (prev.length !== freshWinners.length || JSON.stringify(prev) !== JSON.stringify(freshWinners) ? freshWinners : prev));
      setPrizes((prev) => (JSON.stringify(prev) !== JSON.stringify(freshPrizes) ? freshPrizes : prev));
    }, 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(heartbeatTimer);
    };
  }, []);

  // Compute eligible candidates for VIP draw trigger
  const eligibleCandidates = useMemo(() => {
    const wonEmployeeIds = new Set(luckyWinners.map((w) => w.employeeId.toUpperCase()));
    const blockedGroupSet = new Set(config.blockedGroups || []);

    return registrations.filter((att) => {
      const empId = att.employeeId.toUpperCase();
      if (config.autoBlockPreviousWinners && wonEmployeeIds.has(empId)) return false;
      if (att.groupRole && blockedGroupSet.has(att.groupRole)) return false;
      if (att.isBlockedFromDraw) return false;

      const rosterItem = roster.find((r) => r.id.toUpperCase() === empId);
      if (rosterItem?.isBlockedFromDraw) return false;
      if (rosterItem?.groupRole && blockedGroupSet.has(rosterItem.groupRole)) return false;

      return true;
    });
  }, [registrations, luckyWinners, config.blockedGroups, config.autoBlockPreviousWinners, roster]);

  // Handlers
  const handleRegisterSuccess = (newReg: AttendeeRegistration) => {
    StorageService.addRegistration(newReg);
    setRegistrations(StorageService.getRegistrations());
    setMyRegistration(newReg);
    setCurrentView('ticket');
  };

  const handleUpdateConfig = (newConfig: PartyConfig) => {
    StorageService.setConfig(newConfig);
    setConfig(newConfig);
  };

  const handleUpdateRoster = (newRoster: EmployeeRoster[]) => {
    StorageService.setRoster(newRoster);
    setRoster(newRoster);
  };

  const handleUpdatePrizes = (newPrizes: Prize[]) => {
    StorageService.setPrizes(newPrizes);
    setPrizes(newPrizes);
  };

  const handleAddLuckyWinner = (newWinner: LuckyDrawRecord) => {
    StorageService.addLuckyWinner(newWinner);
    setLuckyWinners(StorageService.getLuckyWinners());
    setPrizes(StorageService.getPrizes());
  };

  const handleDeleteLuckyWinner = (recordId: string) => {
    StorageService.deleteLuckyWinner(recordId);
    setLuckyWinners(StorageService.getLuckyWinners());
    setPrizes(StorageService.getPrizes());
  };

  const handleResetAllLuckyDraws = () => {
    StorageService.resetAllLuckyDraws();
    setLuckyWinners([]);
    setPrizes(StorageService.getPrizes());
  };

  const handleClearRegistrations = () => {
    StorageService.clearRegistrations();
    setRegistrations([]);
    setLuckyWinners([]);
    setMyRegistration(null);
    setPrizes(StorageService.getPrizes());
  };

  const handleStartNewParty = (
    newConfig?: Partial<PartyConfig>,
    options?: { clearRoster?: boolean; clearPrizes?: boolean }
  ) => {
    StorageService.startNewParty(newConfig, options);
    setRegistrations([]);
    setLuckyWinners([]);
    setMyRegistration(null);
    setConfig(StorageService.getConfig());
    setPrizes(StorageService.getPrizes());
    setRoster(StorageService.getRoster());
  };

  // VIP EXECUTIVE TRIGGER FUNCTION
  // When executive taps the button on their phone:
  const handleTriggerFromVipPhone = () => {
    if (!config.isVipTriggerActive) {
      alert('ปุ่มยังไม่เปิดสิทธิ์ กรุณารอแอดมินเปิดสัญญาณสำหรับรอบนี้');
      return;
    }

    const targetPrize =
      prizes.find((p) => p.id === config.vipActivePrizeId && p.remaining > 0) ||
      prizes.find((p) => p.remaining > 0);

    if (!targetPrize) {
      alert('ของรางวัลถูกแจกหมดครบแล้ว');
      return;
    }

    if (eligibleCandidates.length === 0) {
      alert('ไม่มีผู้มีสิทธิ์ลุ้นรางวัลที่ตรงตามเงื่อนไข');
      return;
    }

    // Play fanfare & confetti
    soundFX.playWinnerFanfare();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f472b6', '#c084fc', '#fde047', '#34d399', '#60a5fa'],
    });

    const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
    const winnerAttendee = eligibleCandidates[randomIndex];

    const winnerRecord: LuckyDrawRecord = {
      id: `WIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      prizeId: targetPrize.id,
      prizeName: targetPrize.name,
      prizeTier: targetPrize.tier,
      employeeId: winnerAttendee.employeeId,
      winnerName: winnerAttendee.fullName,
      nickname: winnerAttendee.nickname,
      department: winnerAttendee.department,
      tableNumber: winnerAttendee.tableNumber,
      selfieUrl: winnerAttendee.selfieUrl,
      prizeImageUrl: targetPrize.imageUrl,
      wonAt: new Date().toISOString(),
      round: luckyWinners.length + 1,
    };

    // Save winner
    StorageService.addLuckyWinner(winnerRecord);
    setLuckyWinners(StorageService.getLuckyWinners());
    setPrizes(StorageService.getPrizes());

    // CRUCIAL REQUIREMENT: Automatically relock the button so admin must unlock for each next draw!
    const updatedConfig: PartyConfig = {
      ...config,
      isVipTriggerActive: false,
    };
    StorageService.setConfig(updatedConfig);
    setConfig(updatedConfig);
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    sessionStorage.setItem('admin_session_auth', 'true');
    setIsAdminLoginModalOpen(false);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('admin_session_auth');
    setCurrentView(myRegistration ? 'ticket' : 'register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/70 via-purple-50/50 to-amber-50/60 text-slate-800 flex flex-col relative selection:bg-pink-300 selection:text-slate-900 pb-16 md:pb-0">
      {/* Ambient Pastel Background Lighting Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-pink-200/40 via-purple-200/30 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-amber-200/40 blur-3xl rounded-full" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-purple-200/35 blur-3xl rounded-full" />
      </div>

      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onChangeView={setCurrentView}
        isAdminLoggedIn={isAdminLoggedIn}
        hasMyTicket={!!myRegistration}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Floating banner when admin is previewing attendee view */}
      {isAdminLoggedIn && currentView !== 'admin' && (
        <div className="w-full bg-gradient-to-r from-purple-800 via-pink-700 to-amber-600 text-white py-2 px-4 shadow-md sticky top-16 z-30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>โหมดทดสอบ: กำลังแสดงมุมมองของผู้ร่วมงานทั่วไป</span>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setCurrentView('admin');
            }}
            className="px-3 py-1 rounded-xl bg-white text-purple-950 font-black text-xs hover:bg-amber-100 transition shadow-xs cursor-pointer"
          >
            กลับสู่แดชบอร์ดแอดมิน →
          </button>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* VIEW 1: REGISTRATION FORM */}
        {currentView === 'register' && (
          <RegistrationForm
            roster={roster}
            config={config}
            onRegisterSuccess={handleRegisterSuccess}
            onViewLiveDraw={() => setCurrentView('livedraw')}
          />
        )}

        {/* VIEW 2: CELEBRATORY TICKET PASS & TABLE NUMBER */}
        {currentView === 'ticket' && (
          <>
            {myRegistration ? (
              <TicketPass
                registration={myRegistration}
                config={config}
                onViewLiveDraw={() => setCurrentView('livedraw')}
                onRegisterAnother={() => setCurrentView('register')}
              />
            ) : (
              <div className="max-w-md mx-auto text-center p-8 rounded-3xl bg-white border border-purple-200 shadow-md">
                <p className="text-sm text-slate-600 mb-4 font-medium">
                  คุณยังไม่ได้ลงทะเบียนเข้างาน กรุณาลงทะเบียนเพื่อรับบัตรและหมายเลขโต๊ะ
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentView('register')}
                  className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-pink-400 to-amber-300 text-slate-900 font-bold text-xs shadow-md"
                >
                  ไปที่หน้าลงทะเบียน
                </button>
              </div>
            )}
          </>
        )}

        {/* VIEW 3: LIVE DRAW ARENA FEED */}
        {currentView === 'livedraw' && (
          <LiveDrawFeed
            winners={luckyWinners}
            prizes={prizes}
            config={config}
            onBackToTicket={() => setCurrentView('ticket')}
            hasMyPass={!!myRegistration}
          />
        )}

        {/* VIEW 4: VIP EXECUTIVE REMOTE TRIGGER SCREEN */}
        {currentView === 'vip' && (
          <VipDrawScreen
            config={config}
            prizes={prizes}
            luckyWinners={luckyWinners}
            onTriggerLuckyDraw={handleTriggerFromVipPhone}
            onExitVipView={() => setCurrentView(myRegistration ? 'ticket' : 'register')}
          />
        )}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <>
            {isAdminLoggedIn ? (
              <AdminDashboard
                roster={roster}
                registrations={registrations}
                prizes={prizes}
                luckyWinners={luckyWinners}
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onUpdateRoster={handleUpdateRoster}
                onUpdatePrizes={handleUpdatePrizes}
                onAddLuckyWinner={handleAddLuckyWinner}
                onDeleteLuckyWinner={handleDeleteLuckyWinner}
                onResetAllLuckyDraws={handleResetAllLuckyDraws}
                onClearRegistrations={handleClearRegistrations}
                onStartNewParty={handleStartNewParty}
                onLogout={handleAdminLogout}
                onOpenVipView={() => setCurrentView('vip')}
                onSwitchToUserView={() => setCurrentView(myRegistration ? 'ticket' : 'register')}
              />
            ) : (
              <div className="max-w-sm mx-auto text-center p-8 rounded-3xl bg-white border border-purple-200 shadow-lg">
                <h3 className="text-base font-bold text-slate-800 mb-2">ต้องเข้าสู่ระบบแอดมินก่อน</h3>
                <p className="text-xs text-slate-500 mb-4">
                  กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานแดชบอร์ดแอดมิน
                </p>
                <button
                  type="button"
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="min-h-[48px] px-6 py-2 rounded-2xl bg-gradient-to-r from-amber-300 to-amber-400 text-amber-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  เข้าสู่ระบบแอดมิน
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Discreet bottom admin link - Not prominent, small text at screen bottom */}
      {!isAdminLoggedIn && (
        <footer className="w-full py-4 mt-auto text-center z-10 pb-20 md:pb-6">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              setIsAdminLoginModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400/80 hover:text-slate-600 font-medium transition cursor-pointer select-none py-1 px-3 rounded-full hover:bg-white/60"
            title="เข้าสู่ระบบสำหรับทีมงานผู้จัดงาน"
          >
            <Lock className="w-2.5 h-2.5 text-slate-400" />
            <span>ระบบแอดมิน</span>
          </button>
        </footer>
      )}

      {/* Mobile Fixed Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onChangeView={setCurrentView}
        isAdminLoggedIn={isAdminLoggedIn}
        hasMyTicket={!!myRegistration}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* Admin Login Modal (Password: Admin122333) */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}
