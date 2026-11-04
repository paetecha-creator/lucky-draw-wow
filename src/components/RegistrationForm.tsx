import React, { useState } from 'react';
import { Camera, CheckCircle2, Lock, Search, Sparkles, User, Users, Phone } from 'lucide-react';
import { AttendeeRegistration, EmployeeRoster, PartyConfig } from '../types/party';
import { CameraCapture } from './CameraCapture';
import { soundFX } from '../utils/audio';

interface RegistrationFormProps {
  roster: EmployeeRoster[];
  config: PartyConfig;
  onRegisterSuccess: (registration: AttendeeRegistration) => void;
  onViewLiveDraw: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  roster,
  config,
  onRegisterSuccess,
  onViewLiveDraw,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [department, setDepartment] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [groupRole, setGroupRole] = useState('พนักงานทั่วไป');
  const [isBlocked, setIsBlocked] = useState(false);

  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [matchedEmployee, setMatchedEmployee] = useState<EmployeeRoster | null>(null);
  const [idSearchQuery, setIdSearchQuery] = useState('');
  const [showIdDropdown, setShowIdDropdown] = useState(false);

  // If registration is closed by admin
  if (!config.isRegistrationOpen) {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white border-2 border-amber-200 text-center shadow-xl shadow-amber-100/60">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-4 text-amber-700 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          ระบบลงทะเบียนปิดชั่วคราว
        </h3>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          ผู้ดูแลระบบได้ปิดรับลงทะเบียนเข้างานเรียบร้อยแล้ว ขณะนี้เข้าสู่ช่วงพิธีการและกิจกรรมสุ่มจับรางวัล Lucky Draw
        </p>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onViewLiveDraw();
          }}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 hover:from-amber-400 hover:to-purple-400 text-slate-800 font-bold text-xs shadow-md shadow-pink-200 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-purple-700" />
          <span>ติดตามผลจับรางวัล Lucky Draw แบบสด</span>
        </button>
      </div>
    );
  }

  // Handle employee ID input & auto matching
  const handleEmployeeIdChange = (idVal: string) => {
    setEmployeeId(idVal);
    const trimmed = idVal.trim().toUpperCase();

    const match = roster.find(
      (emp) => emp.id.toUpperCase() === trimmed || emp.fullName.toLowerCase() === idVal.trim().toLowerCase()
    );

    if (match) {
      setMatchedEmployee(match);
      setFullName(match.fullName);
      setNickname(match.nickname);
      setDepartment(match.department);
      setTableNumber(match.tableNumber);
      if (match.groupRole) setGroupRole(match.groupRole);
      if (match.phone && !phone) setPhone(match.phone);
      setIsBlocked(!!match.isBlockedFromDraw);
    } else {
      setMatchedEmployee(null);
    }
  };

  // Select employee from roster helper
  const handleSelectRosterItem = (emp: EmployeeRoster) => {
    setEmployeeId(emp.id);
    setMatchedEmployee(emp);
    setFullName(emp.fullName);
    setNickname(emp.nickname);
    setDepartment(emp.department);
    setTableNumber(emp.tableNumber);
    if (emp.groupRole) setGroupRole(emp.groupRole);
    if (emp.phone) setPhone(emp.phone);
    setIsBlocked(!!emp.isBlockedFromDraw);
    setShowIdDropdown(false);
    soundFX.playClick();
  };

  // Filter roster for quick search suggestions
  const filteredSuggestions = roster
    .filter((emp) => {
      const q = idSearchQuery.toLowerCase();
      return (
        emp.id.toLowerCase().includes(q) ||
        emp.fullName.toLowerCase().includes(q) ||
        emp.nickname.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mandatory Selfie Validation
    if (!selfiePhoto) {
      setSelfieError('กรุณาถ่ายรูปเซลฟี่หน้าตนเองก่อนกดยืนยันการลงทะเบียน');
      const cameraEl = document.getElementById('camera-section');
      cameraEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!employeeId.trim()) {
      alert('กรุณากรอกรหัสพนักงาน');
      return;
    }

    if (!fullName.trim()) {
      alert('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const assignedTable =
      tableNumber.trim() ||
      matchedEmployee?.tableNumber ||
      'โต๊ะกลาง (ติดต่อฝ่ายต้อนรับ)';

    const newRegistration: AttendeeRegistration = {
      id: `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: employeeId.trim().toUpperCase(),
      fullName: fullName.trim(),
      nickname: nickname.trim(),
      department: department.trim() || 'พนักงานทั่วไป',
      tableNumber: assignedTable,
      phone: phone.trim(),
      selfieUrl: selfiePhoto,
      registeredAt: new Date().toISOString(),
      groupRole,
      isBlockedFromDraw: isBlocked,
    };

    onRegisterSuccess(newRegistration);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header Title - Pastel Style */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-amber-100 text-purple-900 border border-purple-200 text-xs font-bold mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{config.eventSubtitle || 'ลงทะเบียนเข้างานเลี้ยง & รับโต๊ะที่นั่ง'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
          {config.eventName}
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {config.registrationSubtitle || 'กรอกรหัสพนักงาน เซลฟี่ใบหน้า และรับบัตรเข้างานพร้อมหมายเลขโต๊ะ'}
        </p>
      </div>

      {/* Main Registration Card - Bright Pastel Palette */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white border-2 border-purple-100 p-5 sm:p-6 shadow-xl shadow-purple-100/50 relative overflow-hidden"
      >
        {/* Section 1: Employee ID & Lookup */}
        <div className="mb-4 relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>รหัสพนักงาน (Employee ID)</span>
              <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setShowIdDropdown(!showIdDropdown);
                setIdSearchQuery('');
              }}
              className="text-[11px] text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer"
            >
              ค้นหาจากรายชื่อ
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => handleEmployeeIdChange(e.target.value)}
              placeholder="เช่น EMP-1001"
              className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-purple-50/50 border border-purple-200 focus:border-purple-400 focus:bg-white text-slate-800 placeholder-slate-400 text-sm font-mono uppercase font-bold transition"
            />
            {matchedEmployee && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">ตรงกับข้อมูล Excel</span>
              </div>
            )}
          </div>

          {/* Quick Roster Finder Dropdown */}
          {showIdDropdown && (
            <div className="mt-2 p-3 rounded-2xl bg-white border-2 border-purple-200 shadow-xl z-20">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={idSearchQuery}
                  onChange={(e) => setIdSearchQuery(e.target.value)}
                  placeholder="พิมพ์ค้นหาชื่อ หรือ แผนก..."
                  className="w-full py-1.5 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-purple-50">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => handleSelectRosterItem(emp)}
                      className="w-full p-2 text-left hover:bg-purple-50 rounded-xl flex items-center justify-between text-xs transition cursor-pointer"
                    >
                      <div>
                        <span className="font-mono text-purple-700 font-bold mr-1.5">
                          {emp.id}
                        </span>
                        <span className="text-slate-800 font-bold">{emp.fullName}</span>
                        {emp.nickname && (
                          <span className="text-amber-700 font-medium ml-1">({emp.nickname})</span>
                        )}
                        <p className="text-[10px] text-slate-500">{emp.department}</p>
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                        {emp.tableNumber}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-xs text-slate-500">
                    ไม่พบข้อมูลที่ตรงกับการค้นหา
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matched Table alert info */}
          {matchedEmployee && (
            <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-purple-800">
                  พบข้อมูลโต๊ะของคุณในระบบ:
                </div>
                <div className="text-sm font-black text-amber-800">
                  {matchedEmployee.tableNumber}
                </div>
              </div>
              <span className="text-[10px] font-bold bg-white text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 shadow-2xs">
                {matchedEmployee.department}
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Personal Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อ-นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="เช่น นายกิตติศักดิ์ เจริญพร"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-100 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ชื่อเล่น
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="เช่น บอย, แพรว"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-100 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>แผนก / ฝ่ายงาน</span>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="เช่น การตลาด, IT, Sales"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-100 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-purple-600" />
              <span>เบอร์โทรศัพท์</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 081-234-5678"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 border border-purple-100 focus:border-purple-400 focus:bg-white text-slate-800 text-xs font-mono"
            />
          </div>
        </div>

        {/* Section 3: MANDATORY SELFIE CAMERA */}
        <div id="camera-section" className="mb-5 pt-3 border-t border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-pink-600" />
              <span>ถ่ายรูปเซลฟี่หน้าตนเอง (บังคับก่อนลงทะเบียน)</span>
              <span className="text-rose-500">*</span>
            </label>
            {selfiePhoto && (
              <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>บันทึกรูปแล้ว</span>
              </span>
            )}
          </div>

          {selfieError && !selfiePhoto && (
            <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{selfieError}</span>
            </div>
          )}

          <CameraCapture
            currentPhoto={selfiePhoto}
            onCapture={(photoUrl) => {
              setSelfiePhoto(photoUrl);
              setSelfieError(null);
            }}
            onClear={() => setSelfiePhoto(null)}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full min-h-[52px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-400 via-purple-400 to-amber-300 hover:from-pink-500 hover:to-amber-400 text-slate-900 font-black text-sm tracking-wide shadow-lg shadow-pink-200 flex items-center justify-center gap-2 active:scale-98 transition transform cursor-pointer"
        >
          <Sparkles className="w-5 h-5 text-slate-900" />
          <span>ยืนยันการลงทะเบียน & รับบัตรเข้างาน</span>
        </button>

        <p className="text-[11px] text-slate-500 text-center mt-3 font-medium">
          ข้อมูลนี้จะถูกนำไปใช้สุ่มรับของรางวัล Lucky Draw ในช่วงท้ายงาน
        </p>
      </form>
    </div>
  );
};
