import React, { useState, useEffect, useMemo } from 'react';
import { Currency, UserAccount, UserReferralData, ReferralRecord } from '../types';
import {
  getUserReferralCode,
  getInviteUrl,
  getReferralData,
  simulateFriendOrderCompletion,
} from '../utils/referralUtils';
import { CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import { playReferralBonusSound } from '../utils/audio';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import {
  Gift,
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  Flame,
  Award,
  Zap,
  HelpCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  ChevronRight,
  UserCheck,
  Percent,
} from 'lucide-react';

interface ReferralProgramProps {
  currentUser: UserAccount | null;
  currency: Currency;
  onOpenSignUp?: () => void;
  onNavigateToBuy?: () => void;
  onBonusClaimed?: (bonusDiamonds: number) => void;
  onAddToast?: (toast: { title: string; message: string; type?: 'success' | 'info' | 'bonus' }) => void;
}

export const ReferralProgram: React.FC<ReferralProgramProps> = ({
  currentUser,
  currency,
  onOpenSignUp,
  onNavigateToBuy,
  onBonusClaimed,
  onAddToast,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [calculatorDiamonds, setCalculatorDiamonds] = useState(2500);
  const [calculatorFriends, setCalculatorFriends] = useState(4);

  const referralCode = getUserReferralCode(currentUser);
  const inviteUrl = getInviteUrl(referralCode);

  const [referralData, setReferralData] = useState<UserReferralData>(() =>
    getReferralData(currentUser)
  );

  // Sync state whenever referrals change across the platform
  useEffect(() => {
    const handleSync = () => {
      setReferralData(getReferralData(currentUser));
    };
    window.addEventListener('nexus_referrals_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('nexus_referrals_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [currentUser]);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
    if (onAddToast) {
      onAddToast({
        title: 'Invite Link Copied!',
        message: 'Unique DiamondVault referral link copied to clipboard.',
        type: 'success',
      });
    }
  };

  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
    if (onAddToast) {
      onAddToast({
        title: 'Referral Code Copied!',
        message: `Code "${referralCode}" ready to paste.`,
        type: 'info',
      });
    }
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DiamondVault - Mobile Legends Diamond Escrow',
          text: `🔥 Top-up Mobile Legends diamonds with Moonton escrow protection! Use my invite code "${referralCode}" on DiamondVault to get an automatic +5% extra Diamond Bonus:`,
          url: inviteUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // Social share links
  const shareMessage = `🔥 Top-up Mobile Legends diamonds safely on DiamondVault with Moonton escrow protection! Use my invite code "${referralCode}" to get an instant +5% Diamond Bonus on your order: ${inviteUrl}`;
  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`🔥 Safe MLBB Diamond Escrow on DiamondVault! Use my code "${referralCode}" for +5% extra diamonds:`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get +5% Bonus MLBB Diamonds on DiamondVault with Moonton Escrow protection! Use code ${referralCode}:`)}&url=${encodeURIComponent(inviteUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
  };

  // Test simulation handler
  const handleSimulateInviteOrder = () => {
    setIsSimulating(true);
    try {
      const result = simulateFriendOrderCompletion(currentUser, 1000);
      playReferralBonusSound();
      triggerOrderCompletedConfetti();

      if (onBonusClaimed) {
        onBonusClaimed(result.bonusDiamonds);
      }

      if (onAddToast) {
        onAddToast({
          title: '🎉 Referral Bonus Earned!',
          message: `${result.friendName} (${result.ign}) ordered ${result.orderDiamonds} 💎! You earned +${result.bonusDiamonds} bonus diamonds!`,
          type: 'bonus',
        });
      }

      setReferralData(getReferralData(currentUser));
    } finally {
      setTimeout(() => setIsSimulating(false), 600);
    }
  };

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    return referralData.referrals.filter((r) => {
      const matchesFilter =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
          ? r.status === 'order_completed'
          : r.status === 'registered';

      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        r.referredUserName.toLowerCase().includes(q) ||
        (r.referredUserIgn && r.referredUserIgn.toLowerCase().includes(q)) ||
        (r.referredUserEmail && r.referredUserEmail.toLowerCase().includes(q)) ||
        (r.orderId && r.orderId.toLowerCase().includes(q))
      );
    });
  }, [referralData.referrals, statusFilter, searchQuery]);

  const conversionRate =
    referralData.totalReferred > 0
      ? Math.round((referralData.successfulReferrals / referralData.totalReferred) * 100)
      : 0;

  // Milestone ambassador tiers
  const tierInfo = useMemo(() => {
    const count = referralData.successfulReferrals;
    if (count >= 10) {
      return {
        name: 'Diamond Ambassador',
        color: 'text-cyan-400 bg-cyan-950/80 border-cyan-500',
        nextTier: 'Max Tier Reached',
        needed: 0,
        progress: 100,
        perk: '6% Max Bonus + VIP Escrow Lane + Priority Support',
      };
    }
    if (count >= 5) {
      return {
        name: 'Gold Champion',
        color: 'text-amber-400 bg-amber-950/80 border-amber-500',
        nextTier: 'Diamond Ambassador (10 orders)',
        needed: 10 - count,
        progress: (count / 10) * 100,
        perk: '5.5% Bonus + Exclusive Gold Discord Role',
      };
    }
    if (count >= 2) {
      return {
        name: 'Silver Vanguard',
        color: 'text-slate-300 bg-slate-900 border-slate-500',
        nextTier: 'Gold Champion (5 orders)',
        needed: 5 - count,
        progress: (count / 5) * 100,
        perk: '5% Bonus Diamonds on Every Friend Top-Up',
      };
    }
    return {
      name: 'Bronze Squad Scout',
      color: 'text-amber-600 bg-amber-950/40 border-amber-700/50',
      nextTier: 'Silver Vanguard (2 orders)',
      needed: 2 - count,
      progress: (count / 2) * 100,
      perk: '5% Bonus Diamonds on Every Friend Top-Up',
    };
  }, [referralData.successfulReferrals]);

  // Projected earnings from calculator
  const projectedEarningsDiamonds = Math.round(
    calculatorDiamonds * calculatorFriends * 0.05
  );
  // Estimate USD/local currency value of projected diamonds (~$0.018 per diamond average)
  const estimatedUsdValue = (projectedEarningsDiamonds * 0.018);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0d1627] to-[#090d16] border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/40">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold tracking-wide uppercase">
              <Gift className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>DiamondVault Official Referral Program</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-mono">Live Rewards</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-2.5">
              <span>Invite Friends to</span>
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
                DiamondVault
              </span>
              <span>& Earn 5% Diamonds</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Share your personal invite link with Mobile Legends squadmates. When they top up or trade using
              DiamondVault’s escrow, <strong className="text-amber-300 font-semibold">both you and your friend receive an automatic +5% Diamond bonus</strong> directly in-game!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Aegis Escrow Protected
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 text-cyan-300 font-medium">
                <Zap className="w-4 h-4 text-cyan-400" />
                Instant 5% Moonton Injection
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                <Users className="w-4 h-4 text-amber-400" />
                Unlimited Squad Invites
              </span>
            </div>
          </div>

          {/* Quick Simulation / Testing Action for Demonstrator */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 items-stretch lg:items-end justify-center shrink-0">
            <button
              onClick={handleSimulateInviteOrder}
              disabled={isSimulating}
              className="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Simulates a friend using your link to buy 1000 diamonds, instantly rewarding +50 diamonds to you and your friend"
            >
              <Sparkles className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Simulating Credit...' : 'Simulate Friend Top-Up (+50 💎)'}</span>
            </button>
            <p className="text-[11px] text-slate-400 font-mono text-center lg:text-right">
              Live interactive sandbox preview
            </p>
          </div>
        </div>
      </div>

      {/* Zone 1: Unique Invite Link & Quick Share Toolkit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Link Box */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Your Unique DiamondVault Invite Link</h2>
                <p className="text-xs text-slate-400">Share this link directly on social media or group chats</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs font-mono text-cyan-300">
              <span>Code:</span>
              <span className="font-bold text-white">{referralCode}</span>
            </div>
          </div>

          {/* Link Input Bar */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-cyan-400 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono text-cyan-300 select-all cursor-text outline-none"
              />
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
            <button
              onClick={handleCopyCode}
              className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap ${
                copiedCode
                  ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
              }`}
              title="Copy referral code only"
            >
              {copiedCode ? 'Code Copied!' : `Copy Code (${referralCode})`}
            </button>
          </div>

          {/* 1-Click Social Shares */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-400">Instant Squad Share:</span>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>WhatsApp</span>
              </a>
              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-600/40 text-sky-300 hover:text-sky-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Telegram</span>
              </a>
              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-600/40 text-blue-300 hover:text-blue-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>X / Twitter</span>
              </a>
              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-600/40 text-indigo-300 hover:text-indigo-200 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <span>Facebook</span>
              </a>
              <button
                type="button"
                onClick={handleShareNative}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>More</span>
              </button>
            </div>
          </div>
        </div>

        {/* QR Code & Mobile Invite Card */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <QrCode className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">In-Person & Discord Scan</h3>
            </div>
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              {showQrCode ? 'Hide QR' : 'Show QR'}
            </button>
          </div>

          {showQrCode ? (
            <div className="p-4 bg-white rounded-lg flex flex-col items-center justify-center mx-auto shadow-inner transition-all">
              {/* Clean SVG QR mockup representation */}
              <div className="w-32 h-32 relative flex items-center justify-center bg-white">
                <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                  <path fill="currentColor" d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                  <path fill="currentColor" d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                  <path fill="currentColor" d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                  <rect x="45" y="10" width="8" height="8" fill="currentColor" />
                  <rect x="45" y="25" width="8" height="15" fill="currentColor" />
                  <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                  <rect x="60" y="45" width="15" height="8" fill="currentColor" />
                  <rect x="80" y="45" width="10" height="10" fill="currentColor" />
                  <rect x="60" y="60" width="10" height="20" fill="currentColor" />
                  <rect x="75" y="60" width="15" height="15" fill="currentColor" />
                  <rect x="45" y="65" width="10" height="25" fill="currentColor" />
                  <rect x="60" y="85" width="30" height="5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-[10px] text-slate-700 font-mono mt-1 font-semibold">
                Scan to join DiamondVault
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
              <QrCode className="w-10 h-10 text-cyan-400/60 mx-auto" />
              <p className="text-xs text-slate-300">
                Playing Mobile Legends side-by-side? Let your friend scan your custom QR code on their phone!
              </p>
              <button
                onClick={() => setShowQrCode(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
              >
                Display Scan QR Code
              </button>
            </div>
          )}

          <div className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/60 flex items-center justify-between">
            <span>Current Ambassador Rank:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierInfo.color}`}>
              {tierInfo.name}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Invite Statistics Dashboard (4 High-Impact Metric Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Invite Statistics & Performance</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Updated in real-time
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Total Friends Invited */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Friends Invited</span>
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {referralData.totalReferred}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-cyan-400 font-medium">Unique registrations</span>
            </div>
          </div>

          {/* Stat 2: Completed Orders */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Orders Completed</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {referralData.successfulReferrals}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{conversionRate}%</span>
              <span>conversion rate</span>
            </div>
          </div>

          {/* Stat 3: Total Bonus Diamonds Earned */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 hover:border-amber-400 transition-all shadow-lg space-y-2">
            <div className="flex items-center justify-between text-amber-300 text-xs font-semibold">
              <span>Total Bonus Diamonds</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono flex items-center gap-1">
              <span>+{referralData.bonusDiamondsEarned.toLocaleString()}</span>
              <span className="text-lg">💎</span>
            </div>
            <div className="text-[11px] text-amber-400/80 font-mono flex items-center justify-between">
              <span>Approx. Value:</span>
              <span className="font-bold text-amber-300">
                {formatCurrency(referralData.bonusDiamondsEarned * 0.018, currency)}
              </span>
            </div>
          </div>

          {/* Stat 4: Ambassador Tier Status */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 transition-all shadow-lg space-y-2">
            <div className="flex items-center justify-between text-cyan-300 text-xs font-semibold">
              <span>Ambassador Rank</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
                <Flame className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-black text-cyan-200 tracking-tight truncate">
              {tierInfo.name}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-400 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, tierInfo.progress))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>{tierInfo.nextTier}</span>
              {tierInfo.needed > 0 && (
                <span className="text-amber-400 font-semibold">+{tierInfo.needed} left</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone 3: 3-Step Visual Guide "How It Works" */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>How the DiamondVault Referral Program Works</span>
            </h3>
            <p className="text-xs text-slate-400">Zero hidden fees, 100% automated Moonton escrow diamond crediting</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
            Dual +5% Bonus
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-400 font-mono font-bold text-sm flex items-center justify-center shadow-md shadow-cyan-500/20">
                1
              </span>
              <Share2 className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-white">Share Your Unique Link</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Send your personal DiamondVault referral URL or code to your squad in WhatsApp, Discord, or during MLBB matches.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-blue-950 border border-blue-500 text-blue-400 font-mono font-bold text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                2
              </span>
              <ShieldCheck className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-white">Friend Signs Up & Recharges</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your friend signs up with your link. When they place their first top-up, funds are held in secure Aegis escrow until diamonds arrive.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 relative group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-amber-950 border border-amber-500 text-amber-300 font-mono font-bold text-sm flex items-center justify-center shadow-md shadow-amber-500/20">
                3
              </span>
              <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <h4 className="text-sm font-bold text-amber-300">Both Earn +5% Diamonds!</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon successful delivery, your friend gets <strong className="text-white">+5% extra diamonds</strong>, and your DiamondVault wallet gets credited <strong className="text-amber-300">+5% bonus diamonds</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Zone 4: Interactive Earnings Calculator */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 to-[#0e1828] border border-cyan-500/20 p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Squad Diamond Earnings Calculator</span>
            </h3>
            <p className="text-xs text-slate-400">See how many free bonus diamonds you can generate every month</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-right">
            <span className="text-[11px] text-slate-400 block">Projected Monthly Earnings</span>
            <div className="text-xl font-black text-amber-300 font-mono flex items-center justify-end gap-1">
              <span>+{projectedEarningsDiamonds.toLocaleString()}</span>
              <span>💎</span>
            </div>
            <span className="text-[10px] text-slate-400">
              ≈ {formatCurrency(estimatedUsdValue, currency)} in free diamonds
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Slider 1: Average Friend Spend */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Average Diamonds per Friend Top-Up:</span>
              <span className="font-mono font-bold text-cyan-300">{calculatorDiamonds.toLocaleString()} 💎</span>
            </div>
            <input
              type="range"
              min={250}
              max={15000}
              step={250}
              value={calculatorDiamonds}
              onChange={(e) => setCalculatorDiamonds(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>250 💎</span>
              <span>5,000 💎</span>
              <span>15,000 💎</span>
            </div>
          </div>

          {/* Slider 2: Number of Friends Invited */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Referred Squadmates:</span>
              <span className="font-mono font-bold text-amber-300">{calculatorFriends} Friends</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={calculatorFriends}
              onChange={(e) => setCalculatorFriends(Number(e.target.value))}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 friend</span>
              <span>10 friends</span>
              <span>25 friends</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zone 5: Detailed Invites Ledger Table */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Track Your Referred Friends</span>
            </h3>
            <p className="text-xs text-slate-400">Ledger of all friends registered through your DiamondVault invite link</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({referralData.referrals.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({referralData.successfulReferrals})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending ({referralData.referrals.filter((r) => r.status === 'registered').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search friend, IGN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Table or Empty State */}
        {filteredReferrals.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">
                {searchQuery ? 'No matching invites found' : 'No Friends Invited Yet'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {searchQuery
                  ? 'Try searching with a different name or IGN.'
                  : 'Share your personal invite link with friends to start earning 5% bonus diamonds on every recharge!'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                Copy Your Invite Link
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Friend / MLBB Player</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">First Order</th>
                  <th className="px-4 py-3 text-right">Your 5% Bonus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredReferrals.map((rec) => {
                  const isDone = rec.status === 'order_completed';
                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name / IGN */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-900 to-blue-900 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                            {rec.referredUserName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{rec.referredUserName}</span>
                              {isDone && (
                                <span className="text-[10px] text-emerald-400 font-mono" title="First order verified">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-cyan-400 font-mono">
                              {rec.referredUserIgn || rec.referredUserEmail || 'MLBB Player'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(rec.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-500/50 text-amber-300">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Pending Order
                          </span>
                        )}
                      </td>

                      {/* Order info */}
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {rec.orderDiamonds ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{rec.orderDiamonds.toLocaleString()} 💎</span>
                            {rec.orderId && (
                              <span className="text-[10px] text-slate-500 font-mono">({rec.orderId})</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No order yet</span>
                        )}
                      </td>

                      {/* Bonus diamonds earned */}
                      <td className="px-4 py-3 text-right">
                        {isDone && rec.bonusDiamondsEarned ? (
                          <span className="inline-flex items-center gap-1 font-mono font-black text-amber-300 text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
                            <span>+{rec.bonusDiamondsEarned}</span>
                            <span>💎</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone 6: FAQ & Terms of Program */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <span>Referral Program Rules & Conditions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400 leading-relaxed">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200">How is the 5% bonus calculated?</h4>
            <p>
              When your referred friend completes their first MLBB diamond order through DiamondVault, 5% of their total order diamonds is credited as a bonus to both the inviter’s account and the invited friend.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200">When are bonus diamonds released?</h4>
            <p>
              Diamonds are held under Aegis Escrow protection until delivery is verified by the Moonton game servers. Once confirmed, referral bonus diamonds are released instantly.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200">Is there an invite limit?</h4>
            <p>
              No limit! You can invite as many squadmates, guild members, and gaming friends as you wish. Higher invite counts unlock higher Ambassador tiers.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-200">Anti-Fraud & Self-Referral Policy</h4>
            <p>
              Referrals are strictly monitored. Self-referrals (creating alternate accounts for yourself) will be flagged by automated Moonton account matching and voided.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
