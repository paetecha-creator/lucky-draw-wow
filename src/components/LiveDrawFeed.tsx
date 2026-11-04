import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Gift, Clock, MapPin, Volume2, VolumeX } from 'lucide-react';
import { LuckyDrawRecord, PartyConfig, Prize } from '../types/party';
import { soundFX } from '../utils/audio';

interface LiveDrawFeedProps {
  winners: LuckyDrawRecord[];
  prizes: Prize[];
  config: PartyConfig;
  onBackToTicket: () => void;
  hasMyPass: boolean;
}

export const LiveDrawFeed: React.FC<LiveDrawFeedProps> = ({
  winners,
  prizes,
  config,
  onBackToTicket,
  hasMyPass,
}) => {
  const [muted, setMuted] = useState(soundFX.getMuted());
  const latestWinner = winners.length > 0 ? winners[0] : null;

  useEffect(() => {
    if (latestWinner) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#f472b6', '#c084fc', '#fde047', '#34d399', '#60a5fa'],
      });
    }
  }, [latestWinner?.id]);

  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    soundFX.setMuted(nextMuted);
  };

  return (
    <div className="w-full max-w-xl mx-auto pb-12">
      {/* Top Header - Pastel Theme */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200 text-[11px] font-bold mb-1 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span>{config.eventName} • LIVE DRAW</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            การประกาศรางวัล Lucky Draw แบบสด
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center justify-center transition shadow-2xs"
            title={muted ? 'เปิดเสียงเอฟเฟกต์' : 'ปิดเสียง'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>

          {hasMyPass && (
            <button
              type="button"
              onClick={onBackToTicket}
              className="min-h-[44px] py-2 px-3.5 rounded-2xl bg-white hover:bg-purple-50 border border-purple-200 text-xs text-purple-800 font-bold transition shadow-2xs"
            >
              ดูบัตรของฉัน
            </button>
          )}
        </div>
      </div>

      {/* LATEST WINNER SPOTLIGHT CARD - Pastel Multi-color */}
      {latestWinner ? (
        <div className="mb-6 relative rounded-3xl bg-white border-2 border-amber-300 p-5 sm:p-6 shadow-xl shadow-amber-100 overflow-hidden animate-party-glow">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-amber-900 bg-amber-100 px-3.5 py-1 rounded-full border border-amber-300 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ผู้โชคดีคนล่าสุด! (LATEST WINNER)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-2">
              {latestWinner.prizeName}
            </h3>
            <p className="text-xs text-purple-700 font-bold">
              {latestWinner.prizeTier}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 border border-purple-200 rounded-3xl p-4">
            <div className="relative shrink-0">
              <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl overflow-hidden border-3 border-amber-300 shadow-md bg-white">
                {latestWinner.selfieUrl ? (
                  <img
                    src={latestWinner.selfieUrl}
                    alt={latestWinner.winnerName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    ไม่มีรูป
                  </div>
                )}
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-tr from-amber-300 to-yellow-300 text-amber-950 p-1.5 rounded-full shadow-md">
                <Trophy className="w-4 h-4 fill-amber-900" />
              </div>
            </div>

            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="text-xs font-mono text-purple-700 font-bold mb-0.5">
                {latestWinner.employeeId}
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">
                {latestWinner.winnerName}
              </h4>
              {latestWinner.nickname && (
                <p className="text-sm font-bold text-amber-800">
                  (คุณ{latestWinner.nickname})
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1 font-medium">
                แผนก: <span className="font-bold text-slate-800">{latestWinner.department}</span>
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>ประจำที่: {latestWinner.tableNumber}</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-3 text-[11px] text-slate-500 font-medium">
            จับรางวัลเมื่อ:{' '}
            {new Date(latestWinner.wonAt).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-8 rounded-3xl bg-white border-2 border-purple-100 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-700 shadow-2xs">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            การสุ่มจับรางวัล Lucky Draw จะเริ่มขึ้นเร็วๆ นี้
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            เตรียมลุ้นของรางวัลสุดอลังการบนหน้าจอนี้แบบเรียลไทม์ ผู้ที่ลงทะเบียนสำเร็จทุกคนจะมีสิทธิ์ลุ้นรับรางวัล!
          </p>
        </div>
      )}

      {/* Prize List & Remaining Status with Images */}
      <div className="mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-600" />
          <span>รายการของรางวัลในค่ำคืนนี้</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {prizes.map((p) => (
            <div
              key={p.id}
              className="p-3.5 rounded-2xl bg-white border border-purple-100 shadow-xs flex items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-50 border border-purple-200 shrink-0 flex items-center justify-center">
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Gift className="w-6 h-6 text-purple-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-slate-800 truncate">{p.name}</div>
                <div className="text-[11px] text-purple-700 font-semibold">{p.tier}</div>
                {p.sponsor && (
                  <div className="text-[10px] text-amber-700 truncate">มอบโดย: {p.sponsor}</div>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  p.remaining > 0
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {p.remaining > 0 ? `เหลือ ${p.remaining}` : 'ครบแล้ว'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALL WINNERS HISTORY LIST */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>ทำเนียบผู้โชคดีทั้งหมด ({winners.length} ท่าน)</span>
          </span>
        </h3>

        {winners.length > 0 ? (
          <div className="space-y-2.5">
            {winners.map((rec, index) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-white border border-purple-100 hover:border-purple-200 flex items-center gap-3.5 transition shadow-2xs"
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-50 shrink-0 border border-purple-200 shadow-2xs">
                  {rec.selfieUrl ? (
                    <img
                      src={rec.selfieUrl}
                      alt={rec.winnerName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-purple-600 font-mono font-bold">
                      #{index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {rec.winnerName}
                    </span>
                    {rec.nickname && (
                      <span className="text-xs text-amber-700 font-bold">
                        ({rec.nickname})
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-purple-700 font-bold">
                      {rec.employeeId}
                    </span>
                  </div>
                  <div className="text-[11px] text-purple-700 font-medium truncate mt-0.5">
                    {rec.prizeName} · <span className="text-slate-500 font-bold">{rec.tableNumber}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {new Date(rec.wonAt).toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    รับรางวัลแล้ว
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white border border-dashed border-purple-200 text-center text-xs text-slate-400">
            ยังไม่มีประวัติการแจกรางวัลในระบบ
          </div>
        )}
      </div>
    </div>
  );
};
