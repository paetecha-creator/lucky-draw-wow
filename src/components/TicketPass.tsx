import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, MapPin, Calendar, CheckCircle2, QrCode, ArrowRight, Share2 } from 'lucide-react';
import { AttendeeRegistration, PartyConfig } from '../types/party';
import { soundFX } from '../utils/audio';

interface TicketPassProps {
  registration: AttendeeRegistration;
  config: PartyConfig;
  onViewLiveDraw: () => void;
  onRegisterAnother: () => void;
}

export const TicketPass: React.FC<TicketPassProps> = ({
  registration,
  config,
  onViewLiveDraw,
  onRegisterAnother,
}) => {
  useEffect(() => {
    soundFX.playCelebrationChime();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#c084fc', '#fde047', '#34d399', '#60a5fa'],
    });
  }, []);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {/* Top celebratory banner */}
      <div className="w-full text-center mb-4">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold mb-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>ลงทะเบียนเข้างานสำเร็จเรียบร้อย!</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-800">
          ยินดีต้อนรับสู่ค่ำคืนพิเศษ
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          กรุณาแสดงบัตรดิจิทัลนี้ ณ จุดต้อนรับและประจำโต๊ะเลี้ยง
        </p>
      </div>

      {/* Main Holographic Ticket Badge - Bright Pastel Style */}
      <div className="w-full relative rounded-3xl bg-white border-2 border-purple-200 shadow-2xl shadow-purple-100 overflow-hidden">
        {/* Pastel Header Banner */}
        <div className="bg-gradient-to-r from-pink-300 via-purple-300 to-amber-200 p-4 text-center text-slate-900 relative">
          <div className="text-[10px] uppercase font-black tracking-widest text-purple-900/80">
            {config.ticketTitle || 'OFFICIAL PARTY PASS & TABLE PASS'}
          </div>
          <h3 className="text-lg font-black tracking-wider uppercase drop-shadow-xs">
            {config.eventName}
          </h3>
          <div className="flex items-center justify-center gap-3 text-[11px] text-purple-900 font-semibold mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-700" />
              {config.eventDate}
            </span>
          </div>
        </div>

        {/* Lanyard punch hole aesthetic */}
        <div className="w-8 h-2 bg-purple-100 rounded-full mx-auto my-2 border border-purple-200" />

        <div className="p-5 pt-1 flex flex-col items-center">
          {/* Selfie Avatar with VIP border */}
          <div className="relative mb-3">
            <div className="w-28 h-36 rounded-2xl overflow-hidden border-3 border-amber-300 shadow-lg bg-purple-50">
              {registration.selfieUrl ? (
                <img
                  src={registration.selfieUrl}
                  alt={registration.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  ไม่มีรูปถ่าย
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span className="bg-gradient-to-r from-amber-300 to-amber-400 text-amber-950 font-black text-[10px] px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider border border-amber-200">
                {registration.groupRole || 'ATTENDEE'}
              </span>
            </div>
          </div>

          {/* Attendee Names */}
          <div className="text-center mt-2 mb-4">
            <div className="text-xs font-bold text-purple-700">
              รหัสพนักงาน: <span className="font-mono text-slate-900 font-black">{registration.employeeId}</span>
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">
              {registration.fullName}
            </h4>
            {registration.nickname && (
              <p className="text-sm font-bold text-amber-700">
                (ชื่อเล่น: {registration.nickname})
              </p>
            )}
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              แผนก: {registration.department}
            </p>
          </div>

          {/* HIGHLIGHTED TABLE NUMBER - Pastel Aesthetic */}
          <div className="w-full rounded-2xl bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50 border-2 border-amber-300 p-4 text-center shadow-md shadow-amber-100 mb-4 animate-party-glow">
            <div className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ที่นั่งและหมายเลขโต๊ะของคุณ</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {registration.tableNumber}
            </div>
            <p className="text-[11px] text-amber-800/80 mt-1 font-medium">
              ระบุตามฐานข้อมูลจัดโต๊ะของฝ่ายจัดงาน
            </p>
          </div>

          {/* Venue & Time stamp */}
          <div className="w-full border-t border-dashed border-purple-100 pt-3 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1 truncate max-w-[220px]">
              <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate font-medium">{config.eventVenue}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-slate-500 shrink-0 font-bold">
              <QrCode className="w-3.5 h-3.5 text-purple-500" />
              <span>REG-VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Actions */}
      <div className="w-full mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick();
            onViewLiveDraw();
          }}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 hover:from-amber-400 hover:to-purple-500 text-slate-900 font-black text-sm shadow-lg shadow-pink-200 flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
        >
          <Trophy className="w-5 h-5 text-amber-900" />
          <span>ดูการประกาศผล Lucky Draw สด</span>
          <ArrowRight className="w-4 h-4 ml-auto" />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              if (navigator.share) {
                navigator.share({
                  title: `${config.eventName} - บัตรเข้างาน`,
                  text: `ฉันลงทะเบียนเข้างานแล้ว! ได้นั่ง ${registration.tableNumber}`,
                }).catch(() => {});
              } else {
                alert(`บัตรลงทะเบียนสำเร็จ!\nชื่อ: ${registration.fullName}\nโต๊ะ: ${registration.tableNumber}`);
              }
            }}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white hover:bg-purple-50 text-slate-700 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>แชร์บัตร</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick();
              onRegisterAnother();
            }}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-xl bg-white hover:bg-purple-50 text-slate-700 text-xs font-bold border border-purple-200 flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            <span>ลงทะเบียนคนถัดไป</span>
          </button>
        </div>
      </div>
    </div>
  );
};
