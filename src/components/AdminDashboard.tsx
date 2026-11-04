import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  Trophy,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Plus,
  Play,
  Volume2,
  VolumeX,
  LogOut,
  Layers,
  Filter,
  Flame,
  Award,
  AlertTriangle,
  Crown,
  Share2,
  Copy,
  ExternalLink,
  Edit,
  Gift,
  Lock,
  Unlock,
  Settings,
  Sliders,
  Calendar,
  MapPin,
  Save,
  RefreshCw,
  Check,
  Eye,
} from 'lucide-react';
import {
  AttendeeRegistration,
  EmployeeRoster,
  LuckyDrawRecord,
  PartyConfig,
  Prize,
} from '../types/party';
import {
  downloadSampleExcelTemplate,
  exportAttendeesToExcel,
  exportLuckyDrawReportToExcel,
  parseEmployeeExcel,
} from '../utils/excel';
import { soundFX } from '../utils/audio';
import { PrizeManagerModal } from './PrizeManagerModal';

interface AdminDashboardProps {
  roster: EmployeeRoster[];
  registrations: AttendeeRegistration[];
  prizes: Prize[];
  luckyWinners: LuckyDrawRecord[];
  config: PartyConfig;
  onUpdateConfig: (config: PartyConfig) => void;
  onUpdateRoster: (roster: EmployeeRoster[]) => void;
  onUpdatePrizes: (prizes: Prize[]) => void;
  onAddLuckyWinner: (winner: LuckyDrawRecord) => void;
  onDeleteLuckyWinner: (recordId: string) => void;
  onResetAllLuckyDraws: () => void;
  onClearRegistrations?: () => void;
  onStartNewParty?: (newConfig?: Partial<PartyConfig>, options?: { clearRoster?: boolean; clearPrizes?: boolean }) => void;
  onLogout: () => void;
  onOpenVipView?: () => void;
  onSwitchToUserView?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  roster,
  registrations,
  prizes,
  luckyWinners,
  config,
  onUpdateConfig,
  onUpdateRoster,
  onUpdatePrizes,
  onAddLuckyWinner,
  onDeleteLuckyWinner,
  onResetAllLuckyDraws,
  onClearRegistrations,
  onStartNewParty,
  onLogout,
  onOpenVipView,
  onSwitchToUserView,
}) => {
  // Navigation tabs inside admin
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'prizes' | 'luckydraw' | 'history' | 'settings'>('luckydraw');

  // Search & Filter state for attendees
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Lucky Draw State
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(
    config.vipActivePrizeId || prizes[0]?.id || ''
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawShufflingCandidate, setDrawShufflingCandidate] = useState<AttendeeRegistration | null>(null);
  const [latestWinnerModal, setLatestWinnerModal] = useState<LuckyDrawRecord | null>(null);
  const [soundMuted, setSoundMuted] = useState(soundFX.getMuted());
  const [excelImportLoading, setExcelImportLoading] = useState(false);
  const [excelImportMessage, setExcelImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copyLinkNotice, setCopyLinkNotice] = useState(false);

  // Prize Modal Management state
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);

  // Editable Event Name state
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [tempEventName, setTempEventName] = useState(config.eventName);

  // Event Settings Form State (for any party customization)
  const [settingsName, setSettingsName] = useState(config.eventName);
  const [settingsSubtitle, setSettingsSubtitle] = useState(config.eventSubtitle || '');
  const [settingsDate, setSettingsDate] = useState(config.eventDate);
  const [settingsVenue, setSettingsVenue] = useState(config.eventVenue);
  const [settingsContact, setSettingsContact] = useState(config.eventContact || '');
  const [settingsTicketTitle, setSettingsTicketTitle] = useState(config.ticketTitle || 'OFFICIAL PARTY PASS & TABLE PASS');
  const [settingsRegSubtitle, setSettingsRegSubtitle] = useState(config.registrationSubtitle || 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ');
  const [settingsSavedNotice, setSettingsSavedNotice] = useState<string | null>(null);

  // Start New Party Modal State
  const [isNewPartyModalOpen, setIsNewPartyModalOpen] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyClearRoster, setNewPartyClearRoster] = useState(false);
  const [newPartyClearPrizes, setNewPartyClearPrizes] = useState(false);

  // Keep settings form synced when config changes
  React.useEffect(() => {
    setSettingsName(config.eventName);
    setSettingsSubtitle(config.eventSubtitle || '');
    setSettingsDate(config.eventDate);
    setSettingsVenue(config.eventVenue);
    setSettingsContact(config.eventContact || '');
    setSettingsTicketTitle(config.ticketTitle || 'OFFICIAL PARTY PASS & TABLE PASS');
    setSettingsRegSubtitle(config.registrationSubtitle || 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ');
  }, [config]);

  // Handle saving event customization settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    soundFX.playCelebrationChime();
    onUpdateConfig({
      ...config,
      eventName: settingsName.trim() || 'งานเลี้ยงสังสรรค์ (Party Celebration)',
      eventSubtitle: settingsSubtitle.trim(),
      eventDate: settingsDate.trim(),
      eventVenue: settingsVenue.trim(),
      eventContact: settingsContact.trim(),
      ticketTitle: settingsTicketTitle.trim() || 'OFFICIAL PARTY PASS & TABLE PASS',
      registrationSubtitle: settingsRegSubtitle.trim() || 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ',
    });
    setSettingsSavedNotice('บันทึกรายละเอียดงานเลี้ยงสำเร็จแล้ว! ข้อมูลจะอัปเดตทุกหน้าจอทันที');
    setTimeout(() => setSettingsSavedNotice(null), 4000);
  };

  // Quick preset template applicator
  const handleApplyPreset = (preset: {
    name: string;
    subtitle: string;
    venue: string;
    ticketTitle: string;
    regSubtitle: string;
  }) => {
    soundFX.playClick();
    setSettingsName(preset.name);
    setSettingsSubtitle(preset.subtitle);
    setSettingsVenue(preset.venue);
    setSettingsTicketTitle(preset.ticketTitle);
    setSettingsRegSubtitle(preset.regSubtitle);
  };

  // Clear attendee registrations only
  const handleConfirmClearRegistrations = () => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลผู้ลงทะเบียนและประวัติการสุ่มรางวัลทั้งหมดสำหรับงานนี้? (รายชื่อพนักงานใน Excel และของรางวัลจะยังคงอยู่)')) {
      soundFX.playClick();
      if (onClearRegistrations) {
        onClearRegistrations();
      }
      setSettingsSavedNotice('ล้างข้อมูลผู้ลงทะเบียนและประวัติ Lucky Draw เรียบร้อยแล้ว พร้อมเริ่มรับลงทะเบียนรอบใหม่');
      setTimeout(() => setSettingsSavedNotice(null), 4000);
    }
  };

  // Start a fresh new party
  const handleConfirmNewParty = () => {
    soundFX.playCelebrationChime();
    if (onStartNewParty) {
      onStartNewParty(
        {
          eventName: newPartyName.trim() || settingsName.trim() || 'งานเลี้ยงสังสรรค์ (Party Celebration)',
          eventSubtitle: settingsSubtitle.trim(),
          eventDate: settingsDate.trim(),
          eventVenue: settingsVenue.trim(),
          eventContact: settingsContact.trim(),
          ticketTitle: settingsTicketTitle.trim() || 'OFFICIAL PARTY PASS & TABLE PASS',
          registrationSubtitle: settingsRegSubtitle.trim() || 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ',
          isRegistrationOpen: true,
          isVipTriggerActive: false,
        },
        {
          clearRoster: newPartyClearRoster,
          clearPrizes: newPartyClearPrizes,
        }
      );
    }
    setIsNewPartyModalOpen(false);
    setSettingsSavedNotice('เริ่มต้นงานเลี้ยงใหม่เรียบร้อยแล้ว! ระบบเปิดรับลงทะเบียนใหม่พร้อมใช้งาน');
    setTimeout(() => setSettingsSavedNotice(null), 4000);
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    soundFX.setMuted(next);
  };

  // Toggle Registration Open / Closed
  const handleToggleRegistration = () => {
    soundFX.playClick();
    onUpdateConfig({
      ...config,
      isRegistrationOpen: !config.isRegistrationOpen,
    });
  };

  // Unique departments for filter
  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    roster.forEach((r) => set.add(r.department));
    registrations.forEach((r) => set.add(r.department));
    return Array.from(set).filter(Boolean);
  }, [roster, registrations]);

  // Unique groups in roster
  const allGroups = useMemo(() => {
    const set = new Set<string>();
    roster.forEach((r) => {
      if (r.groupRole) set.add(r.groupRole);
    });
    set.add('ผู้บริหาร/กรรมการ');
    set.add('ทีมงานจัดเลี้ยง');
    set.add('พนักงานทั่วไป');
    return Array.from(set).filter(Boolean);
  }, [roster]);

  // Toggle blocked group in config
  const handleToggleBlockedGroup = (groupName: string) => {
    soundFX.playClick();
    const current = config.blockedGroups || [];
    const updated = current.includes(groupName)
      ? current.filter((g) => g !== groupName)
      : [...current, groupName];

    onUpdateConfig({
      ...config,
      blockedGroups: updated,
    });
  };

  // Excel File Upload Handler
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelImportLoading(true);
    setExcelImportMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const newRoster = parseEmployeeExcel(buffer);

      if (newRoster.length === 0) {
        throw new Error('ไม่พบข้อมูลพนักงานที่ถูกต้องในไฟล์');
      }

      onUpdateRoster(newRoster);
      soundFX.playCelebrationChime();
      setExcelImportMessage({
        type: 'success',
        text: `นำเข้าข้อมูลพนักงานสำเร็จจำนวน ${newRoster.length} รายการเรียบร้อยแล้ว!`,
      });
    } catch (err: unknown) {
      console.error(err);
      setExcelImportMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel',
      });
    } finally {
      setExcelImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered Attendees for Overview
  const filteredAttendees = useMemo(() => {
    return registrations.filter((att) => {
      const matchesSearch =
        att.fullName.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        att.employeeId.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
        (att.nickname && att.nickname.toLowerCase().includes(attendeeSearch.toLowerCase())) ||
        att.tableNumber.toLowerCase().includes(attendeeSearch.toLowerCase());

      const matchesDept = selectedDeptFilter === 'ALL' || att.department === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [registrations, attendeeSearch, selectedDeptFilter]);

  // Set of employee IDs that have already won prizes
  const wonEmployeeIds = useMemo(() => {
    return new Set(luckyWinners.map((w) => w.employeeId.toUpperCase()));
  }, [luckyWinners]);

  // Set of blocked groups
  const blockedGroupSet = useMemo(() => {
    return new Set(config.blockedGroups || []);
  }, [config.blockedGroups]);

  // ELIGIBLE CANDIDATES FOR LUCKY DRAW
  const eligibleCandidates = useMemo(() => {
    return registrations.filter((att) => {
      const empId = att.employeeId.toUpperCase();

      // Rule 1: No duplicates
      if (config.autoBlockPreviousWinners && wonEmployeeIds.has(empId)) {
        return false;
      }

      // Rule 2: Blocked group check
      if (att.groupRole && blockedGroupSet.has(att.groupRole)) {
        return false;
      }

      // Rule 3: Individual block check
      if (att.isBlockedFromDraw) {
        return false;
      }

      const rosterItem = roster.find((r) => r.id.toUpperCase() === empId);
      if (rosterItem?.isBlockedFromDraw) {
        return false;
      }
      if (rosterItem?.groupRole && blockedGroupSet.has(rosterItem.groupRole)) {
        return false;
      }

      return true;
    });
  }, [registrations, wonEmployeeIds, blockedGroupSet, config.autoBlockPreviousWinners, roster]);

  // Currently selected prize object
  const currentPrize = useMemo(() => {
    return prizes.find((p) => p.id === selectedPrizeId) || prizes[0];
  }, [prizes, selectedPrizeId]);

  // PRIZE CRUD HANDLERS
  const handleSavePrize = (savedPrize: Prize) => {
    const existingIndex = prizes.findIndex((p) => p.id === savedPrize.id);
    let updated: Prize[];
    if (existingIndex >= 0) {
      updated = [...prizes];
      updated[existingIndex] = savedPrize;
    } else {
      updated = [...prizes, savedPrize];
    }
    onUpdatePrizes(updated);
  };

  const handleDeletePrize = (prizeId: string) => {
    const updated = prizes.filter((p) => p.id !== prizeId);
    onUpdatePrizes(updated);
    if (selectedPrizeId === prizeId && updated.length > 0) {
      setSelectedPrizeId(updated[0].id);
    }
  };

  // VIP EXECUTIVE REMOTE LINK COPY
  const getVipShareUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}?vip=1`;
  };

  const handleCopyVipLink = () => {
    const url = getVipShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    soundFX.playClick();
    setCopyLinkNotice(true);
    setTimeout(() => setCopyLinkNotice(false), 3000);
  };

  // TOGGLE VIP TRIGGER (Admin unlocks/locks the button for the Executive)
  const handleToggleVipTrigger = () => {
    soundFX.playClick();
    const nextState = !config.isVipTriggerActive;
    onUpdateConfig({
      ...config,
      isVipTriggerActive: nextState,
      vipActivePrizeId: selectedPrizeId,
    });
  };

  // RUN LUCKY DRAW ACTION
  const executeDraw = (targetPrize: Prize) => {
    if (!targetPrize) {
      alert('กรุณาเลือกรางวัลที่จะทำการสุ่มจับ');
      return;
    }

    if (targetPrize.remaining <= 0) {
      alert(`รางวัล "${targetPrize.name}" ถูกแจกครบตามจำนวนแล้ว`);
      return;
    }

    if (eligibleCandidates.length === 0) {
      alert('ไม่มีผู้มีสิทธิ์ลุ้นรางวัลที่ตรงตามเงื่อนไข (อาจแจกครบทุกคนแล้ว หรือติดเงื่อนไขการบล็อค)');
      return;
    }

    setIsDrawing(true);
    setLatestWinnerModal(null);

    // Play drumroll sound
    const stopDrumroll = soundFX.startDrumroll();

    // Fast shuffling animation
    let shuffleCount = 0;
    const maxShuffles = 35; // ~2.5 seconds
    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleCandidates.length);
      setDrawShufflingCandidate(eligibleCandidates[randomIndex]);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        stopDrumroll();

        // Final random pick
        const finalWinnerIndex = Math.floor(Math.random() * eligibleCandidates.length);
        const winnerAttendee = eligibleCandidates[finalWinnerIndex];

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

        // Record winner and AUTOMATICALLY RELOCK VIP button for next draw
        onAddLuckyWinner(winnerRecord);
        setIsDrawing(false);
        setLatestWinnerModal(winnerRecord);

        // Relock VIP button every time so admin must re-unlock for next round!
        onUpdateConfig({
          ...config,
          isVipTriggerActive: false,
        });

        // Sound fanfare & confetti
        soundFX.playWinnerFanfare();
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#f472b6', '#c084fc', '#fde047', '#34d399', '#60a5fa'],
        });
      }
    }, 70);
  };

  const handleStartLuckyDraw = () => {
    executeDraw(currentPrize);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-16">
      {/* Top Admin Control Bar - Pastel Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white/95 border-2 border-purple-100 rounded-3xl p-5 sm:p-6 shadow-xl shadow-purple-100/50 backdrop-blur-md">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
              ADMIN CONTROL PANEL
            </span>
            {isEditingEventName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempEventName}
                  onChange={(e) => setTempEventName(e.target.value)}
                  placeholder="ระบุชื่องานเลี้ยง..."
                  className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-purple-300 rounded-lg text-slate-800"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (tempEventName.trim()) {
                      onUpdateConfig({
                        ...config,
                        eventName: tempEventName.trim(),
                      });
                    }
                    setIsEditingEventName(false);
                  }}
                  className="px-2 py-1 text-[11px] font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTempEventName(config.eventName);
                    setIsEditingEventName(false);
                  }}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                <span>{config.eventName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTempEventName(config.eventName);
                    setIsEditingEventName(true);
                  }}
                  className="text-purple-600 hover:text-purple-800 p-0.5 rounded cursor-pointer"
                  title="เปลี่ยนชื่องานเลี้ยง"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
            แดชบอร์ดบริหารจัดการงานเลี้ยง & Lucky Draw
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center justify-center transition"
            title={soundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {/* Registration Open/Close Switch */}
          <button
            type="button"
            onClick={handleToggleRegistration}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer ${
              config.isRegistrationOpen
                ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100'
                : 'bg-rose-50 text-rose-800 border-2 border-rose-300 hover:bg-rose-100'
            }`}
          >
            {config.isRegistrationOpen ? (
              <>
                <ToggleRight className="w-5 h-5 text-emerald-600" />
                <span>สถานะ: เปิดรับลงทะเบียน</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-rose-600" />
                <span>สถานะ: ปิดระบบแล้ว</span>
              </>
            )}
          </button>

          {/* Preview Attendee Screen */}
          {onSwitchToUserView && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                onSwitchToUserView();
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 flex items-center gap-1.5 transition cursor-pointer"
              title="สลับไปดูหน้าจอลงทะเบียน / บัตรเข้างาน / ผลรางวัลของผู้ร่วมงาน"
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span>ดูหน้าจอผู้ร่วมงาน</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onLogout();
            }}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS - Vibrant Pastel Colors */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 shadow-sm">
          <div className="flex items-center justify-between text-pink-700 text-xs font-bold mb-1">
            <span>รายชื่อในไฟล์ Excel</span>
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {roster.length} <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </div>
          <div className="text-[11px] text-pink-600 mt-1 font-medium">
            เตรียมจัดโต๊ะไว้ครบตามจำนวน
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
            <span>ลงทะเบียนเข้างานแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {registrations.length} <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            คิดเป็น {roster.length > 0 ? Math.round((registrations.length / roster.length) * 100) : 0}% ของทั้งหมด
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold mb-1">
            <span>ผู้มีสิทธิ์ลุ้น Lucky Draw</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {eligibleCandidates.length} <span className="text-xs font-normal text-slate-500 font-sans">คน</span>
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            คัดกรองเฉพาะผู้ลงทะเบียน & ปลอดบล็อค
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 shadow-sm">
          <div className="flex items-center justify-between text-purple-700 text-xs font-bold mb-1">
            <span>แจกรางวัลสำเร็จแล้ว</span>
            <Trophy className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700 font-mono">
            {luckyWinners.length} <span className="text-xs font-normal text-slate-500 font-sans">รางวัล</span>
          </div>
          <div className="text-[11px] text-purple-600 mt-1 font-medium">
            เหลืออีก {prizes.reduce((acc, p) => acc + p.remaining, 0)} รางวัล
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs - Pastel Style */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-purple-100 rounded-2xl mb-6 overflow-x-auto shadow-sm">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('luckydraw');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'luckydraw'
              ? 'bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 text-purple-900 shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>เวทีสุ่ม Lucky Draw & รีโมทผู้บริหาร</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('prizes');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'prizes'
              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Gift className="w-4 h-4 text-purple-600" />
          <span>จัดการของรางวัล & แนบรูป ({prizes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('overview');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          <span>รายชื่อผู้ลงทะเบียน ({registrations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('roster');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          <span>นำเข้าข้อมูล Excel ({roster.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('history');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Award className="w-4 h-4 text-purple-600" />
          <span>รายงานผลสุ่มรางวัล ({luckyWinners.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            setActiveTab('settings');
          }}
          className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
          }`}
        >
          <Settings className="w-4 h-4 text-purple-600" />
          <span>ตั้งค่างานเลี้ยง & สลับงานใหม่</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: LUCKY DRAW ARENA & VIP EXECUTIVE REMOTE CONTROLLER
      ========================================================================= */}
      {activeTab === 'luckydraw' && (
        <div className="space-y-6">
          {/* SPECIAL SECTION: VIP EXECUTIVE REMOTE LINK & TRIGGER - User Requirement */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 border-2 border-purple-200 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-200 border-2 border-amber-300 flex items-center justify-center text-amber-900 shadow-xs shrink-0">
                  <Crown className="w-7 h-7 text-amber-700" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-black text-purple-700 uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-full border border-purple-200 mb-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>ระบบรีโมทสำหรับผู้บริหาร (VIP Executive Remote)</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    แชร์ลิงก์ให้ผู้บริหารกดปุ่ม "LUCKY DRAW" ได้โดยตรงจากมือถือ
                  </h3>
                  <p className="text-xs text-slate-600">
                    ผู้บริหารไม่ต้องล็อกอิน โดยแอดมินจะต้องกดเปิดปุ่มทุกครั้งที่จะให้กดในแต่ละรอบ
                  </p>
                </div>
              </div>

              {/* Share & Copy Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyVipLink}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-600" />
                  <span>{copyLinkNotice ? 'คัดลอกลิงก์สำเร็จ!' : 'คัดลอกลิงก์ส่งให้ผู้บริหาร'}</span>
                </button>

                {onOpenVipView && (
                  <button
                    type="button"
                    onClick={onOpenVipView}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-purple-700" />
                    <span>ทดลองเปิดหน้ารีโมท</span>
                  </button>
                )}
              </div>
            </div>

            {/* VIP Status & Unlock Controller Banner */}
            <div className="p-4 rounded-2xl bg-white border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  config.isVipTriggerActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'
                }`} />
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    สถานะปุ่มบนมือถือผู้บริหาร:{' '}
                    <span className={config.isVipTriggerActive ? 'text-emerald-600 font-extrabold' : 'text-slate-500'}>
                      {config.isVipTriggerActive ? 'เปิดใช้งานอยู่ (รอผู้บริหารกด)' : 'ล็อกอยู่ (ผู้บริหารยังกดไม่ได้)'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    รางวัลที่ผูกกับรอบนี้: <span className="font-bold text-purple-700">{currentPrize?.name}</span>
                  </div>
                </div>
              </div>

              {/* The Key Action: Admin Unlocks Trigger for Executive */}
              <button
                type="button"
                onClick={handleToggleVipTrigger}
                className={`min-h-[46px] px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm ${
                  config.isVipTriggerActive
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-500 hover:to-cyan-500 text-slate-900 shadow-emerald-200'
                }`}
              >
                {config.isVipTriggerActive ? (
                  <>
                    <Lock className="w-4 h-4 text-rose-700" />
                    <span>ล็อกปุ่มผู้บริหารชั่วคราว</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-slate-900" />
                    <span>เปิดสิทธิ์ให้ผู้บริหารกดรอบนี้</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* MAIN DRAW STAGE */}
          <div className="rounded-3xl bg-white border-2 border-purple-100 p-5 sm:p-7 shadow-xl shadow-purple-100/50 relative overflow-hidden">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>LUCKY DRAW ARENA · เวทีสุ่มจับรางวัล</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-800">
                พร้อมสุ่มผู้โชคดีค่ำคืนนี้
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                สุ่มเฉพาะผู้ลงทะเบียนสำเร็จ ไม่แจกซ้ำรหัสเดิม และคัดกรองตามกฎความยุติธรรม
              </p>

              {/* Prize Selection Chips */}
              <div className="mt-5 mb-5 flex flex-wrap justify-center gap-2">
                {prizes.map((p) => {
                  const isSelected = p.id === selectedPrizeId;
                  const isExhausted = p.remaining <= 0;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isDrawing || isExhausted}
                      onClick={() => {
                        soundFX.playClick();
                        setSelectedPrizeId(p.id);
                        onUpdateConfig({
                          ...config,
                          vipActivePrizeId: p.id,
                        });
                      }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 text-slate-900 shadow-md scale-105'
                          : isExhausted
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-white hover:bg-purple-50 text-slate-700 border border-purple-200'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      <span>{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/80 text-purple-900 font-black' : 'bg-purple-100 text-purple-700'
                      }`}>
                        เหลือ {p.remaining}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Prize Info Card with Sample Image Preview */}
              {currentPrize && (
                <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 flex flex-col sm:flex-row items-center gap-4 text-left">
                  {currentPrize.imageUrl ? (
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-purple-200 shrink-0 shadow-sm">
                      <img
                        src={currentPrize.imageUrl}
                        alt={currentPrize.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-white border-2 border-purple-200 flex items-center justify-center shrink-0 text-purple-400 shadow-sm">
                      <Gift className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                      {currentPrize.tier}
                    </div>
                    <div className="text-base sm:text-lg font-black text-slate-800 truncate">
                      {currentPrize.name}
                    </div>
                    {currentPrize.sponsor && (
                      <div className="text-xs text-amber-700 font-medium">
                        ผู้สนับสนุน: {currentPrize.sponsor}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-500">จำนวนที่เหลือ</div>
                    <div className="text-xl font-black text-purple-700 font-mono">
                      {currentPrize.remaining} / {currentPrize.quantity}
                    </div>
                  </div>
                </div>
              )}

              {/* SHUFFLE / DRAWING ANIMATION DISPLAY */}
              <div className="w-full max-w-md mx-auto aspect-[16/10] rounded-3xl bg-slate-50 border-2 border-purple-200 p-4 flex flex-col items-center justify-center relative shadow-inner mb-6">
                {isDrawing && drawShufflingCandidate ? (
                  <div className="flex flex-col items-center animate-bounce">
                    <div className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-purple-400 mb-2 shadow-lg bg-white">
                      {drawShufflingCandidate.selfieUrl ? (
                        <img
                          src={drawShufflingCandidate.selfieUrl}
                          alt="shuffling"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="text-xl font-black text-purple-700 font-mono">
                      {drawShufflingCandidate.employeeId}
                    </div>
                    <div className="text-base font-bold text-slate-800">
                      {drawShufflingCandidate.fullName}
                    </div>
                    <div className="text-xs text-pink-600 font-semibold">
                      {drawShufflingCandidate.tableNumber}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-200 via-pink-200 to-purple-200 flex items-center justify-center mx-auto mb-3 shadow-md">
                      <Trophy className="w-8 h-8 text-purple-700" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      ผู้มีสิทธิ์ลุ้นรางวัลทั้งหมด: <span className="text-purple-700 font-mono text-base">{eligibleCandidates.length}</span> ท่าน
                    </div>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      แอดมินสามารถกดสุ่มจากที่นี่ หรือเปิดสิทธิ์ให้ผู้บริหารกดผ่านมือถือได้ทันที
                    </p>
                  </div>
                )}
              </div>

              {/* Big Draw Trigger Button for Admin */}
              <button
                type="button"
                disabled={isDrawing || eligibleCandidates.length === 0 || !currentPrize || currentPrize.remaining <= 0}
                onClick={handleStartLuckyDraw}
                className={`min-h-[56px] px-8 py-3 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-3 mx-auto transition-transform active:scale-95 cursor-pointer ${
                  isDrawing
                    ? 'bg-slate-200 text-slate-400 cursor-wait'
                    : eligibleCandidates.length === 0 || !currentPrize || currentPrize.remaining <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:from-purple-600 hover:to-amber-500 text-white shadow-pink-200 hover:scale-105'
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span>{isDrawing ? 'กำลังสุ่มรายชื่อ...' : 'เริ่มสุ่มจับรางวัล (Admin Trigger)'}</span>
              </button>
            </div>
          </div>

          {/* FAIR CHANCE & BLOCKING CONTROLS */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-purple-100 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span>การคัดกรอง & บล็อคกลุ่มผู้ใช้งานเพื่อความยุติธรรม</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  ตั้งค่าบล็อคกลุ่ม เช่น คณะผู้บริหาร หรือผู้ที่เคยได้รับรางวัล เพื่อกระจายโอกาส
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-slate-700">ไม่แจกซ้ำรหัสเดิม:</span>
                <span className="text-emerald-700 font-bold">เปิดใช้งานตลอด</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                เลือกกลุ่มหรือบทบาทที่ต้องการบล็อคจากการจับรางวัล:
              </label>
              <div className="flex flex-wrap gap-2">
                {allGroups.map((groupName) => {
                  const isBlocked = blockedGroupSet.has(groupName);
                  return (
                    <button
                      key={groupName}
                      type="button"
                      onClick={() => handleToggleBlockedGroup(groupName)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                        isBlocked
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isBlocked ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{groupName}</span>
                      <span className="text-[10px] font-mono">
                        {isBlocked ? '(บล็อคอยู่)' : '(มีสิทธิ์)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PRIZE MANAGEMENT & ATTACH SAMPLE IMAGES (User Requirement)
      ========================================================================= */}
      {activeTab === 'prizes' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-purple-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-600" />
                <span>จัดการของรางวัล & แนบรูปตัวอย่าง (Prize Management)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ปรับแต่งเพิ่มลดประเภทของรางวัล แก้ไขจำนวน และอัปโหลดรูปตัวอย่างของรางวัลได้ตามต้องการ
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPrize(null);
                setIsPrizeModalOpen(true);
                soundFX.playClick();
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มของรางวัลใหม่</span>
            </button>
          </div>

          {/* Prize Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map((prize) => (
              <div
                key={prize.id}
                className="rounded-3xl bg-white border-2 border-purple-100 hover:border-purple-300 shadow-md overflow-hidden flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Prize Image */}
                  <div className="relative w-full h-44 bg-purple-50 border-b border-purple-100 overflow-hidden flex items-center justify-center">
                    {prize.imageUrl ? (
                      <img
                        src={prize.imageUrl}
                        alt={prize.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-purple-300">
                        <Gift className="w-12 h-12" />
                        <span className="text-[11px] font-medium text-slate-400 mt-1">
                          ไม่มีรูปภาพแนบ
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[10px] font-black text-purple-700 shadow-xs">
                      {prize.tier}
                    </span>
                    <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                      prize.remaining > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                    }`}>
                      เหลือ {prize.remaining} / {prize.quantity}
                    </span>
                  </div>

                  <div className="p-4">
                    <h4 className="text-base font-black text-slate-800 tracking-tight">
                      {prize.name}
                    </h4>
                    {prize.sponsor && (
                      <p className="text-xs text-amber-700 font-semibold mt-0.5">
                        ผู้สนับสนุน: {prize.sponsor}
                      </p>
                    )}
                    {prize.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prize.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Action Bar */}
                <div className="p-3 bg-purple-50/50 border-t border-purple-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPrize(prize);
                      setIsPrizeModalOpen(true);
                      soundFX.playClick();
                    }}
                    className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-purple-600" />
                    <span>แก้ไขข้อมูล / รูปภาพ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`คุณต้องการลบรางวัล "${prize.name}" หรือไม่?`)) {
                        handleDeletePrize(prize.id);
                      }
                    }}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 flex items-center justify-center transition cursor-pointer"
                    title="ลบรางวัล"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ATTENDEE OVERVIEW & REAL-TIME DASHBOARD
      ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="ค้นหารหัส, ชื่อ, โต๊ะ..."
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="w-full sm:w-auto flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-purple-400 font-medium"
                >
                  <option value="ALL">ทุกแผนก ({registrations.length})</option>
                  {allDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                exportAttendeesToExcel(registrations, luckyWinners);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-95 transition cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>ส่งออกรายชื่อลงทะเบียนเป็น Excel (.xlsx)</span>
            </button>
          </div>

          <div className="rounded-3xl bg-white border border-purple-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 text-slate-600 uppercase text-[10px] tracking-wider border-b border-purple-100">
                  <tr>
                    <th className="py-3 px-4">ภาพเซลฟี่</th>
                    <th className="py-3 px-4">รหัสพนักงาน</th>
                    <th className="py-3 px-4">ชื่อ - นามสกุล (ชื่อเล่น)</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4">หมายเลขโต๊ะ</th>
                    <th className="py-3 px-4">เวลาลงทะเบียน</th>
                    <th className="py-3 px-4">สิทธิ์ Lucky Draw</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-slate-700">
                  {filteredAttendees.length > 0 ? (
                    filteredAttendees.map((att) => {
                      const hasWon = wonEmployeeIds.has(att.employeeId.toUpperCase());
                      const isBlocked =
                        att.isBlockedFromDraw ||
                        (att.groupRole && blockedGroupSet.has(att.groupRole));

                      return (
                        <tr key={att.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-2.5 px-4">
                            <div className="w-12 h-14 rounded-xl overflow-hidden bg-purple-50 border border-purple-200 shadow-2xs">
                              {att.selfieUrl ? (
                                <img
                                  src={att.selfieUrl}
                                  alt={att.fullName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                  ไม่มีรูป
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-purple-700">
                            {att.employeeId}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-bold text-slate-800">{att.fullName}</div>
                            {att.nickname && (
                              <div className="text-[11px] text-amber-700 font-semibold">
                                ({att.nickname})
                              </div>
                            )}
                            {att.groupRole && (
                              <span className="text-[10px] text-slate-400">
                                {att.groupRole}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {att.department}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-2.5 py-1 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 font-bold font-mono text-[11px]">
                              {att.tableNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(att.registeredAt).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-2.5 px-4">
                            {hasWon ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                                <Trophy className="w-3 h-3 text-purple-600" />
                                <span>ได้รางวัลแล้ว</span>
                              </span>
                            ) : isBlocked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                <span>ถูกบล็อค</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>พร้อมลุ้นรางวัล</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {registrations.length === 0
                          ? 'ยังไม่มีพนักงานลงทะเบียนเข้างานในขณะนี้'
                          : 'ไม่พบรายชื่อที่ตรงกับคำค้นหา'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: EXCEL ROSTER MANAGEMENT & IMPORT
      ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-purple-100 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>นำเข้าข้อมูลพนักงานและหมายเลขโต๊ะผ่านไฟล์ Excel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  รองรับไฟล์ .xlsx และ .csv ระบบจะผูกรหัสพนักงานกับหมายเลขโต๊ะเพื่อแสดงให้พนักงานทราบทันทีหลังลงทะเบียน
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick();
                  downloadSampleExcelTemplate();
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-purple-600" />
                <span>ดาวน์โหลด Template Excel ตัวอย่าง</span>
              </button>
            </div>

            {excelImportMessage && (
              <div className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                excelImportMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {excelImportMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{excelImportMessage.text}</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 rounded-3xl p-6 text-center cursor-pointer bg-purple-50/40 hover:bg-purple-50 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 flex items-center justify-center mx-auto mb-2 text-purple-600 shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800">
                {excelImportLoading ? 'กำลังอ่านและประมวลผลไฟล์ Excel...' : 'คลิกเพื่อเลือกไฟล์ Excel (.xlsx / .csv) หรือลากไฟล์มาวางที่นี่'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                คอลัมน์ที่รองรับ: รหัสพนักงาน, ชื่อ-นามสกุล, ชื่อเล่น, แผนก, หมายเลขโต๊ะ, กลุ่ม/บทบาท, เบอร์โทร
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-purple-100 overflow-hidden shadow-sm">
            <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
              <div className="text-xs font-bold text-slate-700">
                รายชื่อพนักงานในระบบทั้งหมด ({roster.length} คน)
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 text-slate-600 uppercase text-[10px] tracking-wider border-b border-purple-100 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">รหัสพนักงาน</th>
                    <th className="py-2.5 px-4">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-4">ชื่อเล่น</th>
                    <th className="py-2.5 px-4">แผนก</th>
                    <th className="py-2.5 px-4">หมายเลขโต๊ะที่จัดสรร</th>
                    <th className="py-2.5 px-4">กลุ่ม / บทบาท</th>
                    <th className="py-2.5 px-4 text-center">สถานะบล็อค</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-slate-700">
                  {roster.map((emp) => (
                    <tr key={emp.id} className="hover:bg-purple-50/30 transition">
                      <td className="py-2 px-4 font-mono font-bold text-purple-700">
                        {emp.id}
                      </td>
                      <td className="py-2 px-4 font-bold text-slate-800">
                        {emp.fullName}
                      </td>
                      <td className="py-2 px-4 text-amber-700 font-semibold">
                        {emp.nickname || '-'}
                      </td>
                      <td className="py-2 px-4 text-slate-600">
                        {emp.department}
                      </td>
                      <td className="py-2 px-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold font-mono text-[11px]">
                          {emp.tableNumber}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-slate-500">
                        {emp.groupRole || 'พนักงานทั่วไป'}
                      </td>
                      <td className="py-2 px-4 text-center">
                        {emp.isBlockedFromDraw ? (
                          <span className="text-[10px] text-rose-700 bg-rose-100 font-bold px-2 py-0.5 rounded-md">
                            บล็อค
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            ปกติ
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: LUCKY DRAW WINNERS REPORT & EXCEL EXPORT
      ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span>รายงานประวัติการแจกรางวัล Lucky Draw ({luckyWinners.length} รางวัล)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                บันทึกประวัติการสุ่มรางวัลย้อนหลังโดยละเอียด สามารถตรวจสอบและดาวน์โหลดเป็น Excel ได้ทันที
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={luckyWinners.length === 0}
                onClick={() => {
                  soundFX.playClick();
                  exportLuckyDrawReportToExcel(luckyWinners);
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-200 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>ส่งออกรายงานผู้ได้รางวัลเป็น Excel</span>
              </button>

              {luckyWinners.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการสุ่มรางวัลทั้งหมดและคืนสิทธิ์ให้ผู้เข้าร่วมงาน?')) {
                      onResetAllLuckyDraws();
                    }
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>รีเซ็ตรางวัล</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-purple-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-purple-50/70 text-slate-600 uppercase text-[10px] tracking-wider border-b border-purple-100">
                  <tr>
                    <th className="py-3 px-4">รอบ</th>
                    <th className="py-3 px-4">รางวัล</th>
                    <th className="py-3 px-4">ภาพเซลฟี่</th>
                    <th className="py-3 px-4">รหัสพนักงาน</th>
                    <th className="py-3 px-4">ชื่อผู้โชคดี</th>
                    <th className="py-3 px-4">แผนก</th>
                    <th className="py-3 px-4">หมายเลขโต๊ะ</th>
                    <th className="py-3 px-4">เวลาที่จับได้</th>
                    <th className="py-3 px-4 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-50 text-slate-700">
                  {luckyWinners.length > 0 ? (
                    luckyWinners.map((w, index) => (
                      <tr key={w.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-700">
                          #{luckyWinners.length - index}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-800">{w.prizeName}</div>
                          <div className="text-[10px] text-purple-700 font-semibold">{w.prizeTier}</div>
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="w-10 h-12 rounded-xl overflow-hidden bg-purple-50 border border-amber-300">
                            {w.selfieUrl ? (
                              <img
                                src={w.selfieUrl}
                                alt={w.winnerName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">
                                -
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-purple-700">
                          {w.employeeId}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-800">{w.winnerName}</div>
                          {w.nickname && (
                            <div className="text-[11px] text-amber-700 font-semibold">
                              (คุณ{w.nickname})
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{w.department}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold font-mono text-[11px]">
                            {w.tableNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {new Date(w.wonAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`ต้องการยกเลิกผลรางวัลของ "${w.winnerName}" หรือไม่? (จะนำรางวัลกลับเข้าสู่ระบบ)`)) {
                                onDeleteLuckyWinner(w.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="สละสิทธิ์ / จับใหม่"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        ยังไม่มีประวัติการแจกรางวัลในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: EVENT SETTINGS & START NEW PARTY (CUSTOMIZE FOR ANY EVENT)
      ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Success Toast Banner */}
          {settingsSavedNotice && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-800 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{settingsSavedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsSavedNotice(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          )}

          {/* Quick Preset Templates */}
          <div className="p-5 rounded-3xl bg-white border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  เทมเพลตตัวอย่างด่วน (Quick Presets)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">กดเพื่อเปลี่ยนข้อความตัวอย่างอัตโนมัติ</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              คลิกเทมเพลตด้านล่างเพื่อเติมข้อความตามประเภทงานเลี้ยง แล้วกดแก้ไขหรือกดบันทึกได้ทันที:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'งานเลี้ยงสังสรรค์พนักงานประจำปี 2026',
                    subtitle: 'Together We Shine & Celebrate 2026',
                    venue: 'ห้อง Grand Ballroom โรงแรมพลาซ่า',
                    ticketTitle: 'OFFICIAL ANNUAL PARTY PASS',
                    regSubtitle: 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ',
                  })
                }
                className="p-3 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 hover:border-pink-400 text-left transition text-xs font-bold text-purple-900 cursor-pointer shadow-xs"
              >
                <div className="text-sm mb-1">🎉 งานเลี้ยงประจำปี</div>
                <div className="text-[10px] text-slate-500 font-normal truncate">Annual Staff Party</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'งานเลี้ยงสังสรรค์ส่งท้ายปีเก่า ต้อนรับปีใหม่',
                    subtitle: 'Happy New Year Celebration & Lucky Night',
                    venue: 'ห้องจัดเลี้ยง ชั้น 3 สโมสรริมน้ำ',
                    ticketTitle: 'NEW YEAR CELEBRATION PASS',
                    regSubtitle: 'ลงทะเบียนเข้างาน เซลฟี่ และลุ้นของรางวัล Lucky Draw ตลอดค่ำคืน',
                  })
                }
                className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 hover:border-amber-400 text-left transition text-xs font-bold text-amber-950 cursor-pointer shadow-xs"
              >
                <div className="text-sm mb-1">🌟 งานฉลองปีใหม่</div>
                <div className="text-[10px] text-slate-500 font-normal truncate">New Year Party</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'งานเลี้ยงกระชับมิตร Company Outing & Dinner',
                    subtitle: 'Connecting People, Inspiring Future',
                    venue: 'ริมสระน้ำ / Beachfront Garden Resort',
                    ticketTitle: 'OUTING GALA DINNER PASS',
                    regSubtitle: 'เช็คอินร่วมกิจกรรม เซลฟี่ และดูหมายเลขโต๊ะรับประทานอาหาร',
                  })
                }
                className="p-3 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 hover:border-teal-400 text-left transition text-xs font-bold text-teal-950 cursor-pointer shadow-xs"
              >
                <div className="text-sm mb-1">🌴 งาน Outing & กาล่า</div>
                <div className="text-[10px] text-slate-500 font-normal truncate">Outing Dinner</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyPreset({
                    name: 'งานฉลองความสำเร็จและขอบคุณพนักงาน',
                    subtitle: 'Celebrating Excellence & Rewarding Success',
                    venue: 'ห้องประชุมอเนกประสงค์ อาคารสำนักงานใหญ่',
                    ticketTitle: 'AWARDS & APPRECIATION PASS',
                    regSubtitle: 'ยินดีต้อนรับทุกท่านสู่ค่ำคืนแห่งเกียรติยศและของรางวัลพิเศษ',
                  })
                }
                className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-400 text-left transition text-xs font-bold text-indigo-950 cursor-pointer shadow-xs"
              >
                <div className="text-sm mb-1">🏆 งานฉลองความสำเร็จ</div>
                <div className="text-[10px] text-slate-500 font-normal truncate">Awards & Night</div>
              </button>
            </div>
          </div>

          {/* Settings Form */}
          <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white border border-purple-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  ปรับแต่งรายละเอียดงานเลี้ยง (Event Customization)
                </h3>
              </div>
              <span className="text-[11px] text-purple-700 bg-purple-50 px-3 py-1 rounded-full font-bold">
                แอดมินกำหนดเองได้อิสระ ไม่จำกัดชื่องาน
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่องานเลี้ยง (Event Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="เช่น งานเลี้ยงพนักงานบริษัทประจำปี 2026, Summer Party..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm font-bold text-slate-800 bg-purple-50/20"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  จะแสดงเด่นที่แถบบนสุด (Navbar), หน้าลงทะเบียน, และบัตร Digital Pass
                </p>
              </div>

              {/* Subtitle / Slogan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำโปรย หรือสโลแกนงาน (Slogan / Subtitle)
                </label>
                <input
                  type="text"
                  value={settingsSubtitle}
                  onChange={(e) => setSettingsSubtitle(e.target.value)}
                  placeholder="เช่น Together We Shine 2026, ธีมสีสันสดใส..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs text-slate-800 bg-white"
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  วันที่ & เวลาจัดงาน (Event Date & Time)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-purple-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={settingsDate}
                    onChange={(e) => setSettingsDate(e.target.value)}
                    placeholder="เช่น วันศุกร์ที่ 19 ธันวาคม 2569 เวลา 18:00 น."
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  สถานที่จัดงาน / ห้องจัดเลี้ยง (Venue & Room)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-pink-500 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={settingsVenue}
                    onChange={(e) => setSettingsVenue(e.target.value)}
                    placeholder="เช่น ห้อง Grand Ballroom ชั้น 2 โรงแรมพลาซ่า"
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>

              {/* Contact / Helpdesk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ช่องทางติดต่อทีมงาน / จุดช่วยเหลือ (Helpdesk / Contact)
                </label>
                <input
                  type="text"
                  value={settingsContact}
                  onChange={(e) => setSettingsContact(e.target.value)}
                  placeholder="เช่น ฝ่ายบุคคล (HR) หรือ จุดลงทะเบียนหน้าประตู"
                  className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs text-slate-800 bg-white"
                />
              </div>

              {/* Ticket Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ข้อความหัวบัตรเข้างาน (Digital Pass Header)
                </label>
                <input
                  type="text"
                  value={settingsTicketTitle}
                  onChange={(e) => setSettingsTicketTitle(e.target.value)}
                  placeholder="OFFICIAL PARTY PASS & TABLE PASS"
                  className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs font-mono text-slate-800 bg-white"
                />
              </div>

              {/* Registration Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  คำแนะนำหน้าลงทะเบียน (Registration Subtitle)
                </label>
                <input
                  type="text"
                  value={settingsRegSubtitle}
                  onChange={(e) => setSettingsRegSubtitle(e.target.value)}
                  placeholder="กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ"
                  className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-xs text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200">
              <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-2">
                ตัวอย่างการแสดงผลบนหน้าจอพนักงาน (Live Preview):
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-800">{settingsName || 'ชื่องานเลี้ยง'}</div>
                  <div className="text-[11px] text-purple-700 font-medium">{settingsSubtitle || 'คำโปรยงาน'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    📍 {settingsVenue} • 📅 {settingsDate}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-amber-100 text-amber-800 font-bold">
                    {settingsTicketTitle || 'PARTY PASS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 hover:from-purple-700 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-purple-200 flex items-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการเปลี่ยนแปลงทั้งหมด</span>
              </button>
            </div>
          </form>

          {/* DANGER & REUSABILITY ZONE - Start New Event or Reset */}
          <div className="p-6 rounded-3xl bg-white border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  เครื่องมือสลับงานเลี้ยง & รีเซ็ตระบบ (Switch Event & Reset Tools)
                </h3>
                <p className="text-[11px] text-slate-500">
                  สำหรับนำระบบนี้ไปใช้กับงานเลี้ยงถัดไป หรือเคลียร์ข้อมูลเพื่อเริ่มงานจริง
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Clear Check-ins only */}
              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-1">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>1. ล้างเฉพาะผู้ลงทะเบียน & ประวัติ Lucky Draw</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
                    ลบข้อมูลผู้ที่เช็คอินเข้างานและผลการแจกรางวัลทั้งหมด แต่ยังคงรายชื่อพนักงานจากไฟล์ Excel และรายการของรางวัลไว้ตามเดิม (เหมาะสำหรับใช้หลังการทดสอบระบบก่อนเริ่มงานจริง)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmClearRegistrations}
                  className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ล้างเฉพาะผู้ลงทะเบียน ({registrations.length} คน)</span>
                </button>
              </div>

              {/* Option 2: Start Brand New Event */}
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>2. เริ่มต้นจัดงานเลี้ยงใหม่ทั้งหมด (Start New Event)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
                    สร้างงานเลี้ยงใหม่ สามารถตั้งชื่องานใหม่ พร้อมเลือกว่าจะล้างหรือเก็บรายชื่อพนักงานและของรางวัลไว้ เพื่อให้พร้อมสำหรับงานเลี้ยงครั้งถัดไปได้ทันที
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewPartyName(settingsName);
                    setIsNewPartyModalOpen(true);
                  }}
                  className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-200 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>เริ่มต้นจัดงานเลี้ยงใหม่</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* START NEW PARTY MODAL */}
      {isNewPartyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-purple-200 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center gap-2 text-purple-900">
              <Sparkles className="w-6 h-6 text-amber-500" />
              <h3 className="text-lg font-black text-slate-800">
                เริ่มต้นจัดงานเลี้ยงใหม่ (Start New Event)
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              ระบบจะทำการล้างข้อมูลการลงทะเบียนและผล Lucky Draw เดิมทั้งหมด และเปิดระบบรับลงทะเบียนใหม่สำหรับงานเลี้ยงนี้
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่องานเลี้ยงใหม่
              </label>
              <input
                type="text"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                placeholder="ระบุชื่องานเลี้ยงใหม่ เช่น งานเลี้ยงพนักงานส่งท้ายปี 2026"
                className="w-full px-4 py-2.5 rounded-2xl border border-purple-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-3">
              <div className="text-xs font-bold text-slate-700">ตัวเลือกเพิ่มเติม:</div>
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newPartyClearRoster}
                  onChange={(e) => setNewPartyClearRoster(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold">ล้างรายชื่อพนักงานเดิมออกทั้งหมด</span>
                  <p className="text-[11px] text-slate-500">
                    เลือกข้อนี้หากต้องการนำเข้าไฟล์ Excel รายชื่อพนักงานชุดใหม่สำหรับงานนี้
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newPartyClearPrizes}
                  onChange={(e) => setNewPartyClearPrizes(e.target.checked)}
                  className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold">ล้างรายการของรางวัลเดิมทั้งหมด</span>
                  <p className="text-[11px] text-slate-500">
                    เลือกข้อนี้หากต้องการกำหนดรายการของรางวัลใหม่ทั้งหมดตั้งแต่ต้น
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsNewPartyModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmNewParty}
                className="min-h-[44px] px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 hover:from-purple-700 hover:to-amber-500 text-white text-xs font-black shadow-md shadow-purple-200 cursor-pointer active:scale-95 transition"
              >
                ยืนยันเริ่มงานเลี้ยงใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WINNER REVEAL MODAL */}
      {latestWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white border-2 border-purple-200 p-6 shadow-2xl text-center relative animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-purple-900 bg-gradient-to-r from-amber-200 via-pink-200 to-purple-200 px-4 py-1 rounded-full mb-3 shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ยินดีด้วย! ขอแสดงความยินดีกับผู้โชคดี</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mb-0.5">
              {latestWinnerModal.prizeName}
            </h3>
            <p className="text-xs text-purple-700 font-bold mb-4">
              {latestWinnerModal.prizeTier}
            </p>

            <div className="w-28 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-purple-300 shadow-xl bg-purple-50 mb-3">
              {latestWinnerModal.selfieUrl ? (
                <img
                  src={latestWinnerModal.selfieUrl}
                  alt={latestWinnerModal.winnerName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  ไม่มีรูปถ่าย
                </div>
              )}
            </div>

            <div className="text-xs font-mono font-bold text-purple-700">
              {latestWinnerModal.employeeId}
            </div>
            <h4 className="text-2xl font-black text-slate-800 mt-0.5">
              {latestWinnerModal.winnerName}
            </h4>
            {latestWinnerModal.nickname && (
              <p className="text-sm font-bold text-amber-700">
                (คุณ{latestWinnerModal.nickname})
              </p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">
              แผนก: {latestWinnerModal.department}
            </p>

            <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-lg shadow-xs">
              โต๊ะประจำ: {latestWinnerModal.tableNumber}
            </div>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick();
                setLatestWinnerModal(null);
              }}
              className="mt-6 w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 hover:from-purple-600 hover:to-amber-500 text-white font-black text-sm shadow-md shadow-pink-200 active:scale-95 transition cursor-pointer"
            >
              ตกลงและบันทึกผล
            </button>
          </div>
        </div>
      )}

      {/* PRIZE CRUD MODAL */}
      <PrizeManagerModal
        isOpen={isPrizeModalOpen}
        onClose={() => setIsPrizeModalOpen(false)}
        prizeToEdit={editingPrize}
        onSave={handleSavePrize}
        onDelete={handleDeletePrize}
      />
    </div>
  );
};
