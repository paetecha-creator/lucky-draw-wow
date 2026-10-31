/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
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

  // Subscribe to BroadcastChannel for real-time syncing across all tabs / devices
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((event) => {
      if (event.type === 'REGISTRATION_ADDED') {
        setRegistrations(StorageService.getRegistrations());
      } else if (event.type === 'LUCKY_DRAW_WON') {
        setLuckyWinners(StorageService.getLuckyWinners());
        setPrizes(StorageService.getPrizes());
      } else if (event.type === 'CONFIG_UPDATED') {
        setConfig(StorageService.getConfig());
        setPrizes(StorageService.getPrizes());
      } else if (event.type === 'ROSTER_UPDATED') {
        setRoster(StorageService.getRoster());
      }
    });

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key?.startsWith('party_')) {
        setRoster(StorageService.getRoster());
        setRegistrations(StorageService.getRegistrations());
        setPrizes(StorageService.getPrizes());
        setLuckyWinners(StorageService.getLuckyWinners());
        setConfig(StorageService.getConfig());
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageEvent);
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
                onLogout={handleAdminLogout}
                onOpenVipView={() => setCurrentView('vip')}
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
