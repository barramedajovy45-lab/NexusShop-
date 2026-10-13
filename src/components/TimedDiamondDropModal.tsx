import React, { useState, useEffect } from 'react';
import { UserAccount, MlbbAccount, Currency } from '../types';
import { isVipUser, isDeveloperUser } from '../data/mockData';
import {
  getTimedDropStatus,
  rollFreeDiamondAmount,
  hasClaimedWindow,
  recordClaimForWindow,
  getDemoModePreference,
  setDemoModePreference,
  TimedDropStatus,
} from '../utils/timedDropUtils';
import { playDiamondChimeSound, playMissionClaimSound, playUiClickSound } from '../utils/audio';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import {
  X,
  Clock,
  Sparkles,
  Crown,
  Gift,
  CheckCircle2,
  Zap,
  RotateCcw,
  Check,
  ShieldCheck,
  Award,
  Gem,
} from 'lucide-react';

interface TimedDiamondDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  verifiedAccount?: MlbbAccount | null;
  currency: Currency;
  onOpenAccountPrompt?: () => void;
  onDiamondsClaimed?: (amount: number) => void;
  onAddNotificationToast?: (toast: {
    statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
    title: string;
    message: string;
    diamonds: number;
    amount: number;
  }) => void;
}

export const TimedDiamondDropModal: React.FC<TimedDiamondDropModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  verifiedAccount,
  onOpenAccountPrompt,
  onDiamondsClaimed,
  onAddNotificationToast,
}) => {
  const [demoMode, setDemoMode] = useState<boolean>(getDemoModePreference());
  const [status, setStatus] = useState<TimedDropStatus>(() => getTimedDropStatus(demoMode));
  const [isRolling, setIsRolling] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number>(10);
  const [lastWonAmount, setLastWonAmount] = useState<number | null>(null);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  const isVip = isVipUser(currentUser) || isDeveloperUser(currentUser);
  const targetIgn = verifiedAccount?.ign || currentUser?.mlbbIgn || 'Mobile Legends Player';
  const targetId = verifiedAccount ? `${verifiedAccount.userId} (${verifiedAccount.zoneId})` : currentUser?.mlbbUserId ? `${currentUser.mlbbUserId} (${currentUser.mlbbZoneId || 'Zone'})` : 'Guest Buyer';

  useEffect(() => {
    if (!isOpen) return;
    setStatus(getTimedDropStatus(demoMode));
    const timer = setInterval(() => {
      setStatus(getTimedDropStatus(demoMode));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, demoMode]);

  if (!isOpen) return null;

  const claimStatus = hasClaimedWindow(status.windowId);
  const isAlreadyClaimed = claimStatus.claimed;

  const handleToggleDemoMode = () => {
    playUiClickSound();
    const next = !demoMode;
    setDemoMode(next);
    setDemoModePreference(next);
    setStatus(getTimedDropStatus(next));
  };

  const handleClaimDrop = () => {
    if (isRolling || isAlreadyClaimed) return;

    playUiClickSound();
    setIsRolling(true);
    setShowClaimSuccess(false);

    const numbers = isVip ? [30, 35, 40, 45, 50, 40, 50] : [10, 15, 20, 25, 30, 35, 40, 50];
    let counter = 0;
    const interval = setInterval(() => {
      setDisplayNumber(numbers[counter % numbers.length]);
      counter++;
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const outcome = rollFreeDiamondAmount(isVip);
      setDisplayNumber(outcome.amount);
      setLastWonAmount(outcome.amount);
      setIsRolling(false);
      setShowClaimSuccess(true);

      recordClaimForWindow(status.windowId, outcome.amount);

      playMissionClaimSound();
      setTimeout(() => playDiamondChimeSound(), 300);
      triggerOrderCompletedConfetti({ force: true });

      onDiamondsClaimed?.(outcome.amount);

      if (onAddNotificationToast) {
        onAddNotificationToast({
          statusType: 'completed',
          title: `💎 Free Diamond Drop Claimed: +${outcome.amount} Diamonds!`,
          message: `${isVip ? 'VIP Member' : 'Buyer'} claimed ${outcome.amount} free diamonds during the ${status.currentWindowName || '12:00 Drop'}! Deposited to MLBB ID ${targetId}.`,
          diamonds: outcome.amount,
          amount: 0,
        });
      }
    }, 1200);
  };

  const handleResetForTesting = () => {
    try {
      playUiClickSound();
      localStorage.removeItem('nexus_12_diamond_claims_history');
      setShowClaimSuccess(false);
      setLastWonAmount(null);
      setStatus(getTimedDropStatus(demoMode));
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-cyan-500/50 p-6 shadow-2xl text-white shadow-cyan-950/60 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="12:00 PM & 12:00 AM Free Diamond Drop"
      >
        {/* Glow ambient background effects */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-cyan-500/30">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                  Daily Free Giveaway
                </span>
                {status.isActive && (
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 animate-pulse">
                    Live Now
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mt-1">
                12 PM & 12 AM Free Diamond Drop
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              playUiClickSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eligibility & Info */}
        <div className="space-y-4 relative z-10">
          <p className="text-xs text-slate-300 leading-relaxed">
            When the local time is <strong className="text-cyan-300">12:00 PM (Noon)</strong> or{' '}
            <strong className="text-cyan-300">12:00 AM (Midnight)</strong>, buyers and VIPs get{' '}
            <strong className="text-amber-300 font-bold">10 to 50 FREE diamonds</strong>!
          </p>

          {/* User Tier Eligibility Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Your Claim Role:</span>
              {isVip ? (
                <span className="flex items-center gap-1 font-bold text-amber-300 font-mono text-xs">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  VIP Member (Guaranteed 30–50 💎)
                </span>
              ) : (
                <span className="flex items-center gap-1 font-bold text-cyan-300 font-mono text-xs">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  Buyer Account (10–50 💎 Roll)
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Crediting to MLBB Account:</span>
              <div className="flex items-center gap-1 text-right">
                <span className="font-bold text-white font-mono">{targetIgn}</span>
                <span className="text-[11px] font-mono text-cyan-400">({targetId})</span>
              </div>
            </div>
          </div>

          {/* Status & Clock Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/40 text-center space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              {status.isActive ? 'Drop Window Closing In' : `Next Drop Window (${status.nextDropWindowName})`}
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-white flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-cyan-400 animate-pulse" />
              <span className={status.isActive ? 'text-emerald-400' : 'text-cyan-300'}>
                {status.isActive
                  ? `${Math.floor(status.timeRemainingInWindowSec / 60)}m ${status.timeRemainingInWindowSec % 60}s`
                  : status.formattedCountdown}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {status.isActive
                ? '🟢 Active right now! Click roll below to claim your free diamonds.'
                : 'Free diamonds activate automatically every 12:00 PM and 12:00 AM.'}
            </p>
          </div>

          {/* Celebration Outcome */}
          {showClaimSuccess && lastWonAmount && (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-400/80 text-center space-y-1.5 animate-in zoom-in-95 duration-150 shadow-lg">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Gem className="w-5 h-5 text-emerald-300 animate-bounce" />
              </div>
              <h4 className="text-lg font-black text-white">
                +{lastWonAmount} Free Diamonds Won!
              </h4>
              <p className="text-xs text-emerald-200">
                Directly credited to <strong className="text-white">{targetIgn}</strong> ({targetId}).
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {isAlreadyClaimed && !showClaimSuccess ? (
              <div className="space-y-2">
                <div className="w-full py-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Claimed for this 12:00 Window (+{claimStatus.amount || 25} 💎)</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Next claim opens at {status.nextDropWindowName}</span>
                  <button
                    type="button"
                    onClick={handleResetForTesting}
                    className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset claim (Test)</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClaimDrop}
                disabled={!status.isActive || isRolling}
                className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
                  status.isActive
                    ? 'bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 text-slate-950 hover:opacity-95 hover:scale-[1.02] active:scale-98 shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                }`}
              >
                {isRolling ? (
                  <>
                    <Zap className="w-5 h-5 text-amber-500 animate-spin" />
                    <span>Rolling Free Diamonds: {displayNumber} 💎...</span>
                  </>
                ) : status.isActive ? (
                  <>
                    <Gift className="w-5 h-5 text-slate-950" />
                    <span>Roll & Claim Free 10–50 Diamonds 💎</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-slate-500" />
                    <span>Drop Window Opens at 12:00</span>
                  </>
                )}
              </button>
            )}

            {/* Test Simulation Controls */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Zero payment required</span>
              </span>
              <button
                type="button"
                onClick={handleToggleDemoMode}
                className="text-cyan-400 hover:underline font-mono text-[10px] cursor-pointer"
              >
                {demoMode ? '⚡ Demo Mode: ON (Turn Off)' : '⚡ Simulate 12:00 Window'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
