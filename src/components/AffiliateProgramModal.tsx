import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  DollarSign,
  TrendingUp,
  Share2,
  Copy,
  CheckCircle2,
  Users,
  Video,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Gift,
  Zap,
  Globe,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import { Currency, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AffiliateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  user: UserAccount | null;
  onOpenAuth?: () => void;
}

export const AffiliateProgramModal: React.FC<AffiliateProgramModalProps> = ({
  isOpen,
  onClose,
  currency,
  user,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'apply' | 'marketing_kit'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Application form state
  const defaultName = user?.mlbbIgn || user?.name || '';
  const [creatorName, setCreatorName] = useState(defaultName);
  const [channelUrl, setChannelUrl] = useState('');
  const [primaryPlatform, setPrimaryPlatform] = useState<'tiktok' | 'youtube' | 'facebook' | 'twitch' | 'discord'>('tiktok');
  const [audienceRange, setAudienceRange] = useState('5k-25k');
  const [payoutMethod, setPayoutMethod] = useState<'gcash' | 'maya' | 'paypal' | 'crypto' | 'nexus_wallet'>('gcash');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [customTag, setCustomTag] = useState(
    defaultName ? defaultName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10) : 'NEXUSCREATOR'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // Calculator slider state
  const [monthlyReferredOrders, setMonthlyReferredOrders] = useState(150);
  const [avgOrderDiamonds, setAvgOrderDiamonds] = useState(706); // ~ $10.99 pack

  if (!isOpen) return null;

  // Tier calculation based on volume
  let commissionRate = 3;
  let tierTitle = 'Bronze Streamer';
  let tierBadge = 'bg-amber-950/80 text-amber-300 border-amber-500/40';

  if (monthlyReferredOrders >= 200) {
    commissionRate = 8;
    tierTitle = 'Mythic Ambassador';
    tierBadge = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
  } else if (monthlyReferredOrders >= 50) {
    commissionRate = 5;
    tierTitle = 'Gold Partner';
    tierBadge = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
  }

  // Estimated gross sales and creator earnings
  const estDiamondPackUsd = (avgOrderDiamonds / 706) * 10.99;
  const estGrossMonthlyUsd = monthlyReferredOrders * estDiamondPackUsd;
  const estCreatorCommissionUsd = (estGrossMonthlyUsd * commissionRate) / 100;
  const estCreatorCommissionPhp = Math.round(estCreatorCommissionUsd * 58.5);

  const affiliateLink = `https://nexusshop.gg/ref/${customTag || 'NEXUSCREATOR'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(customTag);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setApplicationSubmitted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-purple-600 border border-cyan-400/40 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Nexus Shop Creator & Affiliate Program
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                  Up to 8% Cash Commission
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monetize your Mobile Legends stream, YouTube channel, TikTok or squad community with instant escrow payouts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/60 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Tiers & Commission</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'calculator'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Earnings Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'apply'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Join Program Form</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('marketing_kit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'marketing_kit'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Promo Media Kit</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-slate-300">
          
          {/* TAB 1: OVERVIEW & TIERS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Highlight Banner */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-purple-950/60 border border-cyan-500/30 overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-xl space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-900/50 border border-cyan-500/40 text-[11px] font-bold text-cyan-300">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Instant Automated Escrow Commissions</span>
                  </div>
                  <h3 className="text-xl font-black text-white tracking-wide">
                    Earn Cash For Every Diamond Recharged By Your Viewers
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Unlike standard affiliate networks with 60-day payout delays, Nexus Shop pays your commission directly to your GCash, Maya, PayPal, or Crypto wallet as soon as the buyer’s escrow order confirms!
                  </p>
                </div>
              </div>

              {/* Creator Tier Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bronze */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                        TIER 1
                      </span>
                      <span className="text-lg font-black text-white">3% Cash</span>
                    </div>
                    <h4 className="text-base font-bold text-white">Bronze Creator</h4>
                    <p className="text-xs text-slate-400">
                      Ideal for emerging streamers, TikTok creators, and gaming guild officers starting out.
                    </p>
                    <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>0 – 49 monthly referred orders</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Personal tracking link & QR</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Weekly automated payouts</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Silver / Gold */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/50 shadow-lg shadow-cyan-950/40 hover:border-cyan-400 transition-all flex flex-col justify-between space-y-4 relative">
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        TIER 2
                      </span>
                      <span className="text-lg font-black text-cyan-300">5% Cash</span>
                    </div>
                    <h4 className="text-base font-bold text-white">Gold Influencer</h4>
                    <p className="text-xs text-slate-400">
                      For verified MLBB content creators, tournament casters, and active community leads.
                    </p>
                    <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>50 – 199 monthly referred orders</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Custom vanity promo code (5% off)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>1,000 💎 monthly stream stipend</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Instant 24/7 payout requests</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Mythic */}
                <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/40 hover:border-purple-400 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                        TIER 3
                      </span>
                      <span className="text-lg font-black text-purple-300">8% Cash</span>
                    </div>
                    <h4 className="text-base font-bold text-white">Mythic Ambassador</h4>
                    <p className="text-xs text-slate-400">
                      For tier-1 esports organizations, top gaming influencers, and major fanbases.
                    </p>
                    <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>200+ monthly referred orders</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Co-branded giveaway diamond chests</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Dedicated VIP account manager</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Sponsored tournament prize pools</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Ready to start action */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white text-sm">Ready to start monetizing your audience?</div>
                  <div className="text-xs text-slate-400">Application takes 60 seconds with instant sandbox preview.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('apply')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CALCULATOR */}
          {activeTab === 'calculator' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sliders */}
                <div className="space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Interactive Earnings Simulator</span>
                  </h4>

                  {/* Slider 1: Monthly Orders */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Estimated Monthly Referred Orders</span>
                      <span className="font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                        {monthlyReferredOrders} orders / mo
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={800}
                      step={10}
                      value={monthlyReferredOrders}
                      onChange={(e) => setMonthlyReferredOrders(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>10 orders</span>
                      <span>200 orders (Mythic)</span>
                      <span>800+ orders</span>
                    </div>
                  </div>

                  {/* Slider 2: Average Diamond Pack */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Average Diamond Pack Size</span>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                        💎 {avgOrderDiamonds.toLocaleString()} Diamonds
                      </span>
                    </div>
                    <input
                      type="range"
                      min={296}
                      max={2195}
                      step={50}
                      value={avgOrderDiamonds}
                      onChange={(e) => setAvgOrderDiamonds(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>296 💎 ($4.99)</span>
                      <span>706 💎 ($10.99)</span>
                      <span>2,195 💎 ($32.99)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                    <span>Active Status Bracket:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${tierBadge}`}>
                      {tierTitle} ({commissionRate}%)
                    </span>
                  </div>
                </div>

                {/* Earnings Projection Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-purple-950/40 border border-cyan-500/40 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
                      Your Projected Monthly Payout
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="text-3xl sm:text-4xl font-black text-white">
                        {formatCurrency(estCreatorCommissionUsd, currency, estCreatorCommissionPhp)}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">/ month</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Based on ~${estGrossMonthlyUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} gross top-up volume at <strong className="text-cyan-300">{commissionRate}%</strong> commission.
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Annual Payout Run-Rate:</span>
                      <span className="font-mono font-bold text-white">
                        {formatCurrency(estCreatorCommissionUsd * 12, currency, estCreatorCommissionPhp * 12)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Escrow Settlement Delay:</span>
                      <span className="font-mono font-bold text-emerald-400">Instant on order delivery</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Transfer Fees:</span>
                      <span className="font-mono font-bold text-emerald-400">100% Free ($0.00)</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('apply')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/25 cursor-pointer"
                  >
                    <span>Claim Your Creator Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: APPLY FORM */}
          {activeTab === 'apply' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {applicationSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Affiliate Registration Approved!</h3>
                  <p className="text-xs text-slate-300">
                    Welcome to the Nexus Shop Creator Network, <strong>{creatorName}</strong>! Your vanity referral code and instant commission link are live.
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
                    <div className="text-[11px] text-slate-400">Your Shareable Creator Link:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={affiliateLink}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLink ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('marketing_kit')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Download Streamer Overlays & Kit
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300">
                    Submit your channel details below to activate your affiliate creator profile. Payouts are credited instantly after buyer escrow release.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Creator / Channel Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Creator / Channel Name</label>
                      <input
                        type="text"
                        required
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        placeholder="e.g. Chowder Gaming, LaylaGod MLBB"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Primary Platform */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Primary Platform</label>
                      <select
                        value={primaryPlatform}
                        onChange={(e) => setPrimaryPlatform(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="tiktok">TikTok Live / Videos</option>
                        <option value="youtube">YouTube Gaming</option>
                        <option value="facebook">Facebook Gaming</option>
                        <option value="twitch">Twitch Streamer</option>
                        <option value="discord">Discord Community / Guild</option>
                      </select>
                    </div>

                    {/* Channel URL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Channel / Profile URL</label>
                      <input
                        type="text"
                        required
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                        placeholder="https://tiktok.com/@yourchannel"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Audience Range */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Followers / Subscriber Base</label>
                      <select
                        value={audienceRange}
                        onChange={(e) => setAudienceRange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="under5k">Under 5,000 followers</option>
                        <option value="5k-25k">5,000 – 25,000 followers</option>
                        <option value="25k-100k">25,000 – 100,000 followers</option>
                        <option value="100k+">100,000+ followers (VIP Tier)</option>
                      </select>
                    </div>

                    {/* Vanity Code */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Requested Vanity Code</label>
                      <input
                        type="text"
                        required
                        value={customTag}
                        onChange={(e) => setCustomTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        maxLength={12}
                        placeholder="e.g. SQUAD5"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {/* Payout Method */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Payout Destination</label>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="gcash">GCash (Philippines)</option>
                        <option value="maya">Maya (Philippines)</option>
                        <option value="nexus_wallet">Nexus Shop Virtual Wallet (Instant)</option>
                        <option value="paypal">PayPal</option>
                        <option value="crypto">USDT / Crypto (TRC20)</option>
                      </select>
                    </div>
                  </div>

                  {/* Payout Details */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {payoutMethod === 'crypto'
                        ? 'USDT TRC20 Wallet Address'
                        : payoutMethod === 'paypal'
                        ? 'PayPal Email'
                        : 'Mobile Phone Number / Account'}
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutAccount}
                      onChange={(e) => setPayoutAccount(e.target.value)}
                      placeholder={payoutMethod === 'crypto' ? 'T...' : '0917-xxx-xxxx'}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Channel & Generating API Token...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application & Activate Creator Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 4: MARKETING KIT */}
          {activeTab === 'marketing_kit' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-slate-300">
                Download ready-to-use stream assets, OBS overlays, chat bot commands, and video description templates.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nightbot / StreamElements Command */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>Nightbot / CloudBot Command</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Copy-paste this into your streaming chat bot:</p>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 break-all select-all">
                    !diamonds - Need MLBB diamonds? Top up fast with 100% escrow protection and discount with my link: {affiliateLink}
                  </div>
                </div>

                {/* Video Description Snippet */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span>YouTube / TikTok Description Template</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Add to your video description or pinned comment:</p>
                  <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 break-all select-all">
                    💎 Cheapest & Safest MLBB Diamonds (GCash, Maya, PayPal): {affiliateLink} (Use code: {customTag})
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Official Creator Program · Direct Moonton Recharge Escrow</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
