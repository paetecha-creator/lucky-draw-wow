import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Crown, Sparkles, Lock, Gift, Volume2, VolumeX } from 'lucide-react';
import { LuckyDrawRecord, PartyConfig, Prize } from '../types/party';
import { soundFX } from '../utils/audio';

interface VipDrawScreenProps {
  config: PartyConfig;
  prizes: Prize[];
  luckyWinners: LuckyDrawRecord[];
  onTriggerLuckyDraw: () => void;
  onExitVipView?: () => void;
}

export const VipDrawScreen: React.FC<VipDrawScreenProps> = ({
  config,
  prizes,
  luckyWinners,
  onTriggerLuckyDraw,
  onExitVipView,
}) => {
  const [muted, setMuted] = useState(soundFX.getMuted());
  const [isPressing, setIsPressing] = useState(false);

  // Active prize selected by admin for VIP to draw
  const activePrize = prizes.find((p) => p.id === config.vipActivePrizeId) || prizes[0];
  const latestWinner = luckyWinners.length > 0 ? luckyWinners[0] : null;

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    soundFX.setMuted(next);
  };

  const handleVipButtonPress = () => {
    if (!config.isVipTriggerActive) {
      alert('The button is not active yet. Please wait for the Admin to unlock this round.');
      return;
    }

    setIsPressing(true);
    soundFX.playClick();
    onTriggerLuckyDraw();
    setTimeout(() => {
      setIsPressing(false);
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-[85vh] flex flex-col justify-between py-4 px-2">
      {/* Top VIP Bar - 100% English */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-300 via-pink-300 to-purple-300 flex items-center justify-center text-purple-900 shadow-sm">
              <Crown className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-700 uppercase tracking-widest flex items-center gap-1">
                <span>VIP REMOTE CONTROLLER</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
              <h2 className="text-base font-extrabold text-slate-800">
                Executive Lucky Draw Portal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleSound}
              className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white/90 border border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center justify-center shadow-xs cursor-pointer"
              title={muted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-purple-600" />}
            </button>
            {onExitVipView && (
              <button
                type="button"
                onClick={onExitVipView}
                className="min-h-[44px] px-3 py-1.5 rounded-xl bg-white/90 border border-purple-200 text-slate-600 hover:text-slate-800 text-xs font-semibold shadow-xs cursor-pointer"
              >
                Exit
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE PRIZE SPOTLIGHT CARD */}
        {activePrize && (
          <div className="rounded-3xl bg-white border-2 border-purple-200 shadow-xl p-4 sm:p-5 mb-5 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold text-purple-700 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 border border-purple-200">
                {activePrize.tier}
              </span>
              <span className="font-mono text-slate-500">
                Remaining: {activePrize.remaining} / {activePrize.quantity}
              </span>
            </div>

            {/* Prize Image if attached */}
            {activePrize.imageUrl ? (
              <div className="w-full h-40 rounded-2xl overflow-hidden border border-purple-100 bg-purple-50 mb-3 relative shadow-inner">
                <img
                  src={activePrize.imageUrl}
                  alt={activePrize.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold text-purple-800 shadow-xs">
                  Active Prize
                </div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100 border border-purple-200 flex items-center justify-center mb-3">
                <Gift className="w-10 h-10 text-purple-400" />
              </div>
            )}

            <h3 className="text-xl font-black text-slate-800 tracking-tight">
              {activePrize.name}
            </h3>
            {activePrize.sponsor && (
              <p className="text-xs text-amber-700 font-semibold mt-0.5">
                Sponsored by: {activePrize.sponsor}
              </p>
            )}
            {activePrize.description && (
              <p className="text-[11px] text-slate-500 mt-1">
                {activePrize.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* CENTERPIECE: GIANT VIP LUCKY DRAW BUTTON */}
      <div className="my-auto py-4 flex flex-col items-center">
        {config.isVipTriggerActive ? (
          /* UNLOCKED STATE - EXECUTIVE CAN PRESS */
          <div className="w-full flex flex-col items-center animate-pulse">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold mb-4 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Admin has unlocked! Please press the button</span>
            </div>

            <button
              type="button"
              disabled={isPressing}
              onClick={handleVipButtonPress}
              className="w-56 h-56 sm:w-64 sm:h-64 rounded-full p-3 bg-gradient-to-tr from-amber-300 via-pink-400 to-purple-500 shadow-2xl shadow-purple-400/50 hover:scale-105 active:scale-95 transition-all transform flex items-center justify-center cursor-pointer group"
              aria-label="Press to draw Lucky Draw winner"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-white via-pink-50 to-purple-100 border-4 border-white flex flex-col items-center justify-center shadow-inner group-hover:bg-white transition">
                <Trophy className="w-16 h-16 text-amber-500 mb-2 drop-shadow-sm group-hover:scale-110 transition-transform" />
                <span className="text-xl sm:text-2xl font-black tracking-wider text-slate-800">
                  LUCKY DRAW
                </span>
                <span className="text-xs font-bold text-purple-700 mt-1 uppercase tracking-wide">
                  Tap to pick winner!
                </span>
              </div>
            </button>
            <p className="text-xs text-slate-500 text-center mt-4 font-medium">
              Once pressed, the system will draw a winner and automatically relock the button for the next round.
            </p>
          </div>
        ) : (
          /* LOCKED STATE - WAITING FOR ADMIN */
          <div className="w-full flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold mb-4">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Waiting for Admin to unlock...</span>
            </div>

            <div className="w-52 h-52 sm:w-60 sm:h-60 rounded-full p-3 bg-slate-200/80 shadow-md flex items-center justify-center opacity-85">
              <div className="w-full h-full rounded-full bg-slate-100 border-4 border-white flex flex-col items-center justify-center text-center p-4">
                <Lock className="w-12 h-12 text-slate-400 mb-2" />
                <span className="text-lg font-bold text-slate-500">
                  Ready to Draw
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Admin will unlock when it is your turn
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>This screen will unlock automatically in real-time</span>
            </div>
          </div>
        )}
      </div>

      {/* LATEST WINNER PREVIEW BANNER */}
      {latestWinner && (
        <div className="mt-4 p-3.5 rounded-2xl bg-white border border-purple-100 shadow-md flex items-center gap-3">
          <div className="w-12 h-14 rounded-xl overflow-hidden bg-purple-50 border border-purple-200 shrink-0">
            {latestWinner.selfieUrl ? (
              <img
                src={latestWinner.selfieUrl}
                alt={latestWinner.winnerName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-purple-400 font-bold">
                WIN
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold text-purple-700 uppercase">
              Latest Winner:
            </div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {latestWinner.winnerName} {latestWinner.nickname && `(${latestWinner.nickname})`}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {latestWinner.department} · {latestWinner.tableNumber}
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-xl shrink-0">
            {latestWinner.prizeName}
          </span>
        </div>
      )}
    </div>
  );
};
