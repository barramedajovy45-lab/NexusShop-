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
  Clock,
  Sparkles,
  Crown,
  Gift,
  CheckCircle2,
  Zap,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface TimedDiamondDropCardProps {
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

export const TimedDiamondDropCard: React.FC<TimedDiamondDropCardProps> = ({
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

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getTimedDropStatus(demoMode));
    }, 1000);
    return () => clearInterval(timer);
  }, [demoMode]);

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

    // Mystery rolling animation cycling between 10 and 50
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

      // Record claim in localStorage
      recordClaimForWindow(status.windowId, outcome.amount);

      // Audio & Confetti
      playMissionClaimSound();
      setTimeout(() => playDiamondChimeSound(), 300);
      triggerOrderCompletedConfetti({ force: true });

      // Notify parent & toast
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
    <div
      id="timed-diamond-drop-banner"
      className="mb-6 relative overflow-hidden rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-slate-950 via-[#0a1324] to-cyan-950/40 p-4 sm:p-5 shadow-xl shadow-cyan-950/40"
    >
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Column: Title, Schedule, and Eligibility Badges */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {status.isActive ? (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-sm animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>12:00 DROP WINDOW ACTIVE NOW</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/50">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>SCHEDULED: 12:00 PM & 12:00 AM</span>
              </span>
            )}

            {isVip ? (
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-amber-300 border border-amber-400/60 shadow-sm">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP & Dev Roll (30–50 💎 Guaranteed)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/50">
                <Award className="w-3 h-3 text-cyan-400" />
                <span>Buyer Roll (10–50 💎 Free)</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleToggleDemoMode}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-all cursor-pointer border ${
                demoMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
              title="Toggle Test/Preview mode to simulate the 12 PM / 12 AM drop window immediately"
            >
              {demoMode ? '⚡ Demo Window: ON' : '⚡ Simulate 12:00 Window'}
            </button>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>12:00 PM & 12:00 AM Happy Hour Free Diamond Drop</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Every day at <strong className="text-cyan-300">12:00 PM (Noon)</strong> and{' '}
              <strong className="text-cyan-300">12:00 AM (Midnight)</strong>, buyers and VIPs get{' '}
              <strong className="text-amber-300">10 to 50 FREE diamonds</strong> deposited directly to their MLBB account. No payment required!
            </p>
          </div>

          {/* Account Target Reassurance */}
          <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Crediting to:</span>
              <span className="font-mono font-bold text-white">{targetIgn}</span>
              <span className="font-mono text-cyan-400">({targetId})</span>
            </div>

            {onOpenAccountPrompt && (
              <button
                type="button"
                onClick={onOpenAccountPrompt}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
              >
                Change Target ID
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Drop Roll Card & Timer */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shrink-0 shadow-lg min-w-[280px] sm:min-w-[320px] justify-between">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
              {status.isActive ? 'Drop Window Closing In' : `Next Drop (${status.nextDropWindowName})`}
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className={status.isActive ? 'text-emerald-400' : 'text-cyan-300'}>
                {status.isActive
                  ? `${Math.floor(status.timeRemainingInWindowSec / 60)}m ${status.timeRemainingInWindowSec % 60}s`
                  : status.formattedCountdown}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {status.isActive ? 'Window open 60 mins' : 'Free 10–50 💎 for Buyer & VIP'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1.5 w-full sm:w-auto">
            {isAlreadyClaimed && !showClaimSuccess ? (
              <div className="text-center space-y-1">
                <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 flex items-center gap-1.5 text-xs font-bold shadow-sm">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Claimed for this Window!</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <span className="text-[10px] text-slate-400 font-mono">
                    +{claimStatus.amount || 25} 💎 Credited
                  </span>
                  <button
                    type="button"
                    onClick={handleResetForTesting}
                    className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Reset claim to test re-rolling"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Re-test</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                id="claim-12-diamond-drop-btn"
                onClick={handleClaimDrop}
                disabled={!status.isActive || isRolling}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                  status.isActive
                    ? 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 text-slate-950 hover:opacity-95 hover:scale-105 active:scale-95 shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-70'
                }`}
              >
                {isRolling ? (
                  <>
                    <Zap className="w-4 h-4 text-amber-400 animate-spin" />
                    <span>Rolling: {displayNumber} 💎...</span>
                  </>
                ) : status.isActive ? (
                  <>
                    <Gift className="w-4 h-4 text-slate-950 animate-bounce" />
                    <span>Claim Free 10–50 💎</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Opens at 12:00</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Claim Success Celebration Banner */}
      {showClaimSuccess && lastWonAmount && (
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/80 border border-emerald-400/80 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  🎉 Congratulations! You received {lastWonAmount} Free Diamonds!
                </span>
                {isVip && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                    VIP Mythic Roll
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Successfully credited to <strong className="text-white">{targetIgn}</strong> ({targetId}). Thank you for choosing Nexus Shop!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClaimSuccess(false)}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/60 text-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
