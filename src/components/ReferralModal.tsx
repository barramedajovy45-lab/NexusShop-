import React, { useState, useEffect } from 'react';
import { Currency, UserAccount, UserReferralData } from '../types';
import {
  getUserReferralCode,
  getInviteUrl,
  getReferralData,
  simulateFriendOrderCompletion,
  simulateFriendSignup,
} from '../utils/referralUtils';
import { playReferralBonusSound } from '../utils/audio';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import {
  X,
  Share2,
  Copy,
  Check,
  Gift,
  Users,
  Trophy,
  Sparkles,
  QrCode,
  ExternalLink,
  MessageCircle,
  Send,
  Flame,
  ShieldCheck,
  Gamepad2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Percent,
} from 'lucide-react';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  currency: Currency;
  onOpenSignUp?: () => void;
  onBonusClaimed?: (bonusDiamonds: number) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currency,
  onOpenSignUp,
  onBonusClaimed,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);

  const referralCode = getUserReferralCode(currentUser);
  const inviteUrl = getInviteUrl(referralCode);

  const [referralData, setReferralData] = useState<UserReferralData>(() =>
    getReferralData(currentUser)
  );

  // Sync state whenever referrals change
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

  if (!isOpen) return null;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
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
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nexus Shop MLBB Top-Up - 5% Diamond Bonus',
          text: `🔥 Top-up Mobile Legends diamonds with instant Moonton escrow! Use my invite link to get an extra +5% Diamond Bonus on your first order:`,
          url: inviteUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const shareText = encodeURIComponent(
    `🔥 Top-up Mobile Legends diamonds with instant Moonton escrow protection! Use my invite link or code "${referralCode}" to get an automatic +5% Diamond Bonus on your order: ${inviteUrl}`
  );

  const socialLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${shareText}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(`🔥 Top-up Mobile Legends diamonds with instant escrow! Use my code "${referralCode}" for +5% extra diamonds:`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
  };

  // Interactive Live Simulator for Testing the 5% + 5% payout
  const handleSimulateFriendOrder = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    const packOptions = [500, 1000, 2000];
    const chosenDiamonds = packOptions[Math.floor(Math.random() * packOptions.length)];

    setTimeout(() => {
      const result = simulateFriendOrderCompletion(currentUser, chosenDiamonds);
      setReferralData(getReferralData(currentUser));
      playReferralBonusSound();
      triggerOrderCompletedConfetti({ force: true });

      setSimulationToast(
        `🎉 ${result.friendName} (${result.ign}) completed their first ${result.orderDiamonds.toLocaleString()} 💎 escrow order! BOTH received an extra +${result.bonusDiamonds} Bonus Diamonds (5%)!`
      );

      if (onBonusClaimed) {
        onBonusClaimed(result.bonusDiamonds);
      }

      setIsSimulating(false);
      setTimeout(() => setSimulationToast(null), 6000);
    }, 700);
  };

  const handleSimulateFriendSignup = () => {
    if (isSimulating) return;
    setIsSimulating(true);

    setTimeout(() => {
      const result = simulateFriendSignup(currentUser);
      setReferralData(getReferralData(currentUser));
      playReferralBonusSound();
      triggerOrderCompletedConfetti({ force: true });

      setSimulationToast(
        `🎖️ ${result.friendName} (${result.ign}) registered via your invite link! You unlocked the exclusive 'Referral Badge' and an active ${result.discountPercent}% Diamond Discount on all packs!`
      );

      setIsSimulating(false);
      setTimeout(() => setSimulationToast(null), 6000);
    }, 600);
  };

  const filteredReferrals = referralData.referrals.filter((r) => {
    if (filter === 'completed') return r.status === 'order_completed';
    if (filter === 'pending') return r.status === 'registered';
    return true;
  });

  const conversionRate =
    referralData.totalReferred > 0
      ? Math.round((referralData.successfulReferrals / referralData.totalReferred) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-slate-950 border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Glow accoutrements */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 px-5 sm:px-6 pt-5 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-300/40">
              <Gift className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Refer-a-Friend Program
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase">
                  5% + 5% Dual Bonus
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Share your invite link — you and your friend both receive +5% Bonus Diamonds!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulation Feedback Alert */}
        {simulationToast && (
          <div className="relative z-10 mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-gradient-to-r from-cyan-950/90 to-emerald-950/90 border border-cyan-400/60 text-white text-xs flex items-center gap-2.5 shadow-lg animate-bounce-subtle">
            <Sparkles className="w-4 h-4 text-cyan-300 shrink-0 animate-spin" />
            <span className="font-medium text-slate-100">{simulationToast}</span>
          </div>
        )}

        <div className="relative z-10 p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Dual 5% Bonus Highlight Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-indigo-950/50 border border-cyan-500/40 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-cyan-800/50 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-500/40 font-bold text-xs">
                  1
                </div>
                <div>
                  <span className="text-[11px] font-bold text-cyan-300 block">
                    Your Friend Gets +5% Bonus
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                    When your friend signs up with your invite link and completes their first escrow order, they receive an extra <strong className="text-white">5% in-game diamonds</strong>!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-emerald-800/50 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/40 font-bold text-xs">
                  2
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 block">
                    You Receive Matching +5% Bonus
                  </span>
                  <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                    Nexus Shop automatically credits an equal <strong className="text-white">5% diamond bonus</strong> into your Nexus Shop Wallet vault with zero caps!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Spotlight: Referral Badge & Diamond Discount */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Your Referral Rewards & Accreditations</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Reward Program
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Reward 1: Referral Badge */}
              <div className={`p-3 rounded-xl border transition-all ${
                referralData.hasReferralBadge || referralData.totalReferred > 0
                  ? 'bg-gradient-to-br from-amber-950/50 to-slate-900/90 border-amber-400/60 shadow-md shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Referral Badge</span>
                      <span className="text-[10px] text-amber-300/90 font-mono">Diamond Ambassador</span>
                    </div>
                  </div>
                  {referralData.hasReferralBadge || referralData.totalReferred > 0 ? (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      1 Signup Needed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  Earn the prestigious <strong className="text-amber-300">'Referral Badge'</strong> on your gamer profile and order receipts when friends sign up!
                </p>
              </div>

              {/* Reward 2: Small Diamond Discount */}
              <div className={`p-3 rounded-xl border transition-all ${
                referralData.hasReferralBadge || referralData.totalReferred > 0
                  ? 'bg-gradient-to-br from-emerald-950/50 to-slate-900/90 border-emerald-400/60 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 flex items-center justify-center shrink-0">
                      <Percent className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">5% Diamond Discount</span>
                      <span className="text-[10px] text-emerald-300/90 font-mono">Automatic at Checkout</span>
                    </div>
                  </div>
                  {referralData.hasReferralBadge || referralData.totalReferred > 0 ? (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      5% OFF ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      Unlocks on Signup
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  Automatic <strong className="text-emerald-300">5% Diamond Discount</strong> applied to all diamond packs at checkout when purchasing diamonds!
                </p>
              </div>
            </div>
          </div>

          {/* Unique Invite Link Section */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Your Unique Invite Link</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">
                  Invite Code: <strong className="text-cyan-300 font-bold">{referralCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedCode ? 'Copied Code!' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* URL Input & Copy Button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 select-all"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQrCode(!showQrCode)}
                title="Show QR Code"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code Container (Collapsible) */}
            {showQrCode && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-2 text-center animate-fadeIn">
                <div className="p-3 bg-white rounded-xl shadow-inner inline-block">
                  {/* Clean SVG QR Code Representation */}
                  <svg
                    className="w-36 h-36"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Corner Position Detection Blocks */}
                    <rect x="5" y="5" width="28" height="28" fill="#020617" />
                    <rect x="9" y="9" width="20" height="20" fill="white" />
                    <rect x="13" y="13" width="12" height="12" fill="#020617" />

                    <rect x="67" y="5" width="28" height="28" fill="#020617" />
                    <rect x="71" y="9" width="20" height="20" fill="white" />
                    <rect x="75" y="13" width="12" height="12" fill="#020617" />

                    <rect x="5" y="67" width="28" height="28" fill="#020617" />
                    <rect x="9" y="71" width="20" height="20" fill="white" />
                    <rect x="13" y="75" width="12" height="12" fill="#020617" />

                    {/* Data Matrix Dots Pattern */}
                    <rect x="38" y="10" width="6" height="6" fill="#020617" />
                    <rect x="48" y="10" width="6" height="6" fill="#020617" />
                    <rect x="58" y="15" width="6" height="6" fill="#020617" />
                    <rect x="38" y="24" width="6" height="6" fill="#020617" />
                    <rect x="50" y="24" width="6" height="6" fill="#020617" />
                    
                    <rect x="10" y="38" width="6" height="6" fill="#020617" />
                    <rect x="22" y="44" width="6" height="6" fill="#020617" />
                    <rect x="38" y="38" width="8" height="8" fill="#0284c7" />
                    <rect x="52" y="38" width="8" height="8" fill="#0284c7" />
                    <rect x="46" y="50" width="8" height="8" fill="#0284c7" />
                    <rect x="66" y="40" width="6" height="6" fill="#020617" />
                    <rect x="80" y="45" width="6" height="6" fill="#020617" />

                    <rect x="38" y="66" width="6" height="6" fill="#020617" />
                    <rect x="50" y="66" width="6" height="6" fill="#020617" />
                    <rect x="62" y="66" width="6" height="6" fill="#020617" />
                    <rect x="76" y="72" width="6" height="6" fill="#020617" />
                    <rect x="42" y="80" width="6" height="6" fill="#020617" />
                    <rect x="56" y="82" width="6" height="6" fill="#020617" />
                    <rect x="70" y="85" width="6" height="6" fill="#020617" />
                    <rect x="85" y="85" width="6" height="6" fill="#020617" />
                  </svg>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Scan to open invite link on Mobile
                </p>
                <span className="text-[10px] text-cyan-400 font-mono">
                  Code: {referralCode}
                </span>
              </div>
            )}

            {/* Quick Social Share Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-400 mr-1">Quick Share:</span>

              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <a
                href={socialLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/40 text-[#229ED9] text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </a>

              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#1877F2] text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>

              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-400 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>X / Twitter</span>
              </a>

              <button
                type="button"
                onClick={handleShareNative}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Squad Share</span>
              </button>
            </div>
          </div>

          {/* Performance Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Friends Joined</span>
              </span>
              <div className="text-lg font-bold font-mono text-white">
                {referralData.totalReferred}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Orders Completed</span>
              </span>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {referralData.successfulReferrals}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-800/60 bg-cyan-950/20 space-y-1">
              <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                <span>💎</span>
                <span>Bonus Diamonds</span>
              </span>
              <div className="text-lg font-bold font-mono text-cyan-300 flex items-center gap-1">
                <span>+{referralData.bonusDiamondsEarned.toLocaleString()}</span>
                <span className="text-xs">💎</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                <span>Conversion Rate</span>
              </span>
              <div className="text-lg font-bold font-mono text-amber-300">
                {conversionRate}%
              </div>
            </div>
          </div>

          {/* How It Works Infographic */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>How the 5% + 5% Referral Program Works</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <span className="w-4 h-4 rounded-full bg-cyan-900 text-cyan-200 text-[10px] flex items-center justify-center font-mono">1</span>
                  <span>Share Your Link</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  Copy your unique link and send to friends, squad group chats, or Discord.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <span className="w-4 h-4 rounded-full bg-cyan-900 text-cyan-200 text-[10px] flex items-center justify-center font-mono">2</span>
                  <span>Friend Signs Up</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  They create their account — your referral code is automatically linked.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <span className="w-4 h-4 rounded-full bg-emerald-900 text-emerald-200 text-[10px] flex items-center justify-center font-mono">3</span>
                  <span>Both Get 5% Diamonds!</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[10px]">
                  Upon first escrow order completion, both get +5% diamonds instantly!
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Action (Instant Demo Tool) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border border-purple-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Test Live Referral Flow (Simulation Sandbox)</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Simulate a friend registering with your unique invite link or completing an escrow diamond order.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSimulateFriendSignup}
                disabled={isSimulating}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Simulate Signup (Unlock Badge)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateFriendOrder}
                disabled={isSimulating}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {isSimulating ? (
                  <span>Simulating...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Simulate Order (+5% 💎)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referred Friends Ledger */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Referred Squadmates Ledger</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Track friends who signed up and the diamond bonuses credited to both of you
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'all'
                      ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({referralData.referrals.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('completed')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'completed'
                      ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Completed ({referralData.successfulReferrals})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'pending'
                      ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({referralData.referrals.filter((r) => r.status === 'registered').length})
                </button>
              </div>
            </div>

            {/* List of Referrals */}
            <div className="space-y-2">
              {filteredReferrals.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{rec.referredUserName}</span>
                        {rec.referredUserIgn && (
                          <span className="text-[10px] font-mono text-cyan-300 font-normal">
                            ({rec.referredUserIgn})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Joined {new Date(rec.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        {rec.orderId && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-400">Order #{rec.orderId}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {rec.status === 'order_completed' ? (
                      <>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-[11px] border border-cyan-700/60">
                          +{rec.bonusDiamondsEarned} 💎 (Both 5%)
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Credited</span>
                        </span>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-mono font-medium text-[10px] border border-amber-800/60">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Pending First Order</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filteredReferrals.length === 0 && (
                <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 text-xs space-y-2">
                  <Users className="w-6 h-6 text-slate-600 mx-auto" />
                  <p>No squadmates found under this filter.</p>
                  <p className="text-[11px] text-slate-500">
                    Share your invite link above to start earning bonus diamonds!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aegis Escrow verified reward protocol</span>
            </span>

            <button
              type="button"
              onClick={onClose}
              className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
            >
              Done & Return to Store
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
