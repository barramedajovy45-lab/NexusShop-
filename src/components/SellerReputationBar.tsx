import React, { useState, useMemo } from 'react';
import { EscrowOrder, SellerProfile, SellerReputationLevel, SellerReputationTier } from '../types';
import {
  Award,
  Crown,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  Zap,
  Sparkles,
  Star,
  ChevronRight,
  Info,
  Lock,
  ArrowUpRight,
  Gift,
  HelpCircle,
  SlidersHorizontal,
  X,
  RefreshCw
} from 'lucide-react';

export const REPUTATION_TIERS: SellerReputationTier[] = [
  {
    level: 1,
    name: 'Novice Merchant',
    minSales: 0,
    minCompletionRate: 92.0,
    feePercentage: 2.0,
    inspectionMinutes: 20,
    badgeLabel: 'Level 1',
    description: 'Initial entry tier for new diamond sellers with standard manual escrow protections.',
    perks: [
      'Standard Aegis Escrow Vault protection',
      '20-minute buyer inspection countdown',
      'Standard 2.0% platform settlement fee',
      'Manual recharge screenshot verification'
    ],
  },
  {
    level: 2,
    name: 'Verified Vendor',
    minSales: 500,
    minCompletionRate: 97.0,
    feePercentage: 1.5,
    inspectionMinutes: 15,
    badgeLabel: 'Level 2',
    description: 'Identity-verified merchant with proven fulfillment speed and reliable stock availability.',
    perks: [
      'Verified Merchant Blue Checkmark badge',
      'Reduced 15-minute inspection window',
      '1.5% platform settlement fee (25% discount)',
      'Bulk inventory upload and instant pricing sync'
    ],
  },
  {
    level: 3,
    name: 'Trusted Vendor',
    minSales: 2500,
    minCompletionRate: 98.5,
    feePercentage: 1.0,
    inspectionMinutes: 12,
    badgeLabel: 'Level 3',
    description: 'Highly dependable vendor with thousands of successful MLBB recharges and exceptional buyer trust.',
    perks: [
      'Official "Trusted Vendor" Escrow Seal on store cards',
      '12-minute fast inspection release timer',
      '1.0% platform fee (50% discount)',
      'Priority queue for disputed order resolutions',
      'Featured in "Top Rated Sellers" filter'
    ],
  },
  {
    level: 4,
    name: 'Elite Trader',
    minSales: 10000,
    minCompletionRate: 99.4,
    feePercentage: 0.6,
    inspectionMinutes: 8,
    badgeLabel: 'Level 4',
    description: 'Top-volume merchant with elite 99.4%+ completion integrity and lightning-fast delivery times.',
    perks: [
      'Golden "Elite Trader" Crown badge on all listings',
      'Accelerated 8-minute buyer inspection countdown',
      'Ultra-low 0.6% platform fee (70% discount)',
      'Instant payout authorization on GCash & Maya',
      'Top 3 search algorithm placement in Diamond Catalog'
    ],
  },
  {
    level: 5,
    name: 'Apex Legend Partner',
    minSales: 25000,
    minCompletionRate: 99.8,
    feePercentage: 0.2,
    inspectionMinutes: 0, // Instant
    badgeLabel: 'Level 5 (Max)',
    description: 'The pinnacle of P2P diamond distribution with direct Moonton API integration and zero wait times.',
    perks: [
      'Chromatic Apex Legend Insignia with animated halo',
      'Instant zero-second escrow release (Auto-API confirmed)',
      'Practically zero platform fee (0.2% flat)',
      'Dedicated 24/7 personal Escrow Arbiter',
      'Permanent homepage banner spotlight & VIP badge'
    ],
  },
];

interface SellerReputationBarProps {
  sellerProfile: SellerProfile;
  orders: EscrowOrder[];
}

export const SellerReputationBar: React.FC<SellerReputationBarProps> = ({
  sellerProfile,
  orders,
}) => {
  // Optional sandbox controls for testing progression
  const [showTiersModal, setShowTiersModal] = useState(false);
  const [selectedTierDetail, setSelectedTierDetail] = useState<SellerReputationTier | null>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [sandboxSales, setSandboxSales] = useState<number>(sellerProfile.totalSales);
  const [sandboxCompletion, setSandboxCompletion] = useState<number>(99.9);

  // Calculate actual dynamic sales and completion rate
  const { actualSales, actualCompletionRate, completedCount, cancelledCount } = useMemo(() => {
    const sellerOrders = orders.filter(
      (o) => o.sellerId === sellerProfile.id || !o.sellerId
    );
    const completed = sellerOrders.filter((o) => o.status === 'completed').length;
    const cancelled = sellerOrders.filter(
      (o) => o.status === 'cancelled' || o.status === 'disputed'
    ).length;

    // Realistic baseline: ApexTopUp baseline completed + 14 lifetime cancellations
    const baselineCompleted = sellerProfile.totalSales;
    const baselineCancelled = 14;

    const totalCompleted = baselineCompleted + completed;
    const totalFinished = baselineCompleted + baselineCancelled + completed + cancelled;
    const rate = +((totalCompleted / Math.max(1, totalFinished)) * 100).toFixed(2);

    return {
      actualSales: totalCompleted,
      actualCompletionRate: Math.min(100, Math.max(90, rate)),
      completedCount: completed,
      cancelledCount: cancelled,
    };
  }, [orders, sellerProfile.id, sellerProfile.totalSales]);

  // Use sandbox or actual values
  const effectiveSales = isSandboxMode ? sandboxSales : actualSales;
  const effectiveCompletionRate = isSandboxMode ? sandboxCompletion : actualCompletionRate;

  // Compute Current Reputation Tier based on both sales AND completion rate
  const { currentTier, nextTier, progressPct, salesProgressPct, completionMet } = useMemo(() => {
    let activeTier = REPUTATION_TIERS[0];

    // Find highest tier where BOTH minSales AND minCompletionRate are satisfied
    for (const tier of REPUTATION_TIERS) {
      if (effectiveSales >= tier.minSales && effectiveCompletionRate >= tier.minCompletionRate) {
        activeTier = tier;
      }
    }

    const currentIndex = REPUTATION_TIERS.findIndex((t) => t.level === activeTier.level);
    const hasNext = currentIndex < REPUTATION_TIERS.length - 1;
    const next = hasNext ? REPUTATION_TIERS[currentIndex + 1] : null;

    let progress = 100;
    let salesProgress = 100;
    let compMet = true;

    if (next) {
      const salesSpan = next.minSales - activeTier.minSales;
      const salesGained = Math.max(0, effectiveSales - activeTier.minSales);
      salesProgress = Math.min(100, Math.round((salesGained / salesSpan) * 100));

      compMet = effectiveCompletionRate >= next.minCompletionRate;

      // Blended progress calculation: 75% sales weight, 25% completion rate weight
      const compTarget = next.minCompletionRate;
      const compBase = activeTier.minCompletionRate;
      const compSpan = Math.max(0.1, compTarget - compBase);
      const compProgress = Math.min(100, Math.max(0, Math.round(((effectiveCompletionRate - compBase) / compSpan) * 100)));

      progress = Math.min(100, Math.round(salesProgress * 0.8 + (compMet ? 20 : compProgress * 0.2)));
    }

    return {
      currentTier: activeTier,
      nextTier: next,
      progressPct: progress,
      salesProgressPct: salesProgress,
      completionMet: compMet,
    };
  }, [effectiveSales, effectiveCompletionRate]);

  // Visual helper for tier badge styling
  const getTierTheme = (level: number) => {
    switch (level) {
      case 1:
        return {
          bg: 'bg-slate-800/90',
          border: 'border-slate-700',
          text: 'text-slate-300',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
          glow: 'from-slate-600 to-slate-400',
          icon: ShieldCheck,
          accent: 'text-slate-400',
        };
      case 2:
        return {
          bg: 'bg-cyan-950/80',
          border: 'border-cyan-700/60',
          text: 'text-cyan-300',
          badgeBg: 'bg-cyan-950 text-cyan-300 border-cyan-500',
          glow: 'from-cyan-500 to-blue-500',
          icon: Award,
          accent: 'text-cyan-400',
        };
      case 3:
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-700/60',
          text: 'text-emerald-300',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500',
          glow: 'from-emerald-500 to-teal-400',
          icon: ShieldCheck,
          accent: 'text-emerald-400',
        };
      case 4:
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-600/70',
          text: 'text-amber-300',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500 shadow-amber-900/30',
          glow: 'from-amber-500 via-orange-400 to-yellow-300',
          icon: Crown,
          accent: 'text-amber-400',
        };
      case 5:
        return {
          bg: 'bg-fuchsia-950/80',
          border: 'border-fuchsia-600/80',
          text: 'text-fuchsia-200',
          badgeBg: 'bg-fuchsia-950 text-fuchsia-200 border-fuchsia-400 shadow-fuchsia-900/40',
          glow: 'from-purple-500 via-pink-500 to-amber-400',
          icon: Sparkles,
          accent: 'text-fuchsia-400',
        };
      default:
        return {
          bg: 'bg-slate-900',
          border: 'border-slate-800',
          text: 'text-white',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          glow: 'from-cyan-500 to-blue-500',
          icon: Star,
          accent: 'text-cyan-400',
        };
    }
  };

  const currentTheme = getTierTheme(currentTier.level);
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-2xl p-5 sm:p-6 space-y-6">
      {/* Background Ambience Glow */}
      <div
        className={`absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none bg-gradient-to-br ${currentTheme.glow}`}
      />

      {/* Top Bar: Title & Level Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${currentTheme.badgeBg} shadow-lg shadow-black/40`}
          >
            <CurrentIcon className={`w-6 h-6 ${currentTheme.accent}`} />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                Seller Reputation
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${currentTheme.badgeBg}`}
              >
                <CurrentIcon className="w-3 h-3" />
                {currentTier.name}
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                (Level {currentTier.level} of 5)
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
              <span>{currentTier.name} Status</span>
              {currentTier.level >= 3 && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
            </h3>
          </div>
        </div>

        {/* Action / View Tiers Modal Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsSandboxMode(!isSandboxMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSandboxMode
                ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle reputation sandbox controls"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isSandboxMode ? 'Sandbox Active' : 'Test Tier Sandbox'}</span>
          </button>

          <button
            onClick={() => setShowTiersModal(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>View All Tiers & Perks</span>
          </button>
        </div>
      </div>

      {/* Sandbox Sliders (when opened) */}
      {isSandboxMode && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Interactive Reputation Sandbox Simulator
            </span>
            <button
              onClick={() => {
                setSandboxSales(actualSales);
                setSandboxCompletion(actualCompletionRate);
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 underline"
            >
              <RefreshCw className="w-3 h-3" /> Reset to Real Data
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Simulated Total Sales:</span>
                <span className="font-bold text-white">{sandboxSales.toLocaleString()} orders</span>
              </div>
              <input
                type="range"
                min="0"
                max="30000"
                step="250"
                value={sandboxSales}
                onChange={(e) => setSandboxSales(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>0 (Novice)</span>
                <span>2,500 (Trusted)</span>
                <span>10,000 (Elite)</span>
                <span>25,000+ (Apex)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Simulated Completion Rate:</span>
                <span className="font-bold text-emerald-400">{sandboxCompletion.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="90"
                max="100"
                step="0.1"
                value={sandboxCompletion}
                onChange={(e) => setSandboxCompletion(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>90.0%</span>
                <span>97.0%</span>
                <span>98.5% (Trusted)</span>
                <span>99.4% (Elite)</span>
                <span>99.8% (Apex)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">Reputation Milestone Progress</span>
            {nextTier ? (
              <span className="text-slate-400 text-xs">
                towards{' '}
                <span className="text-amber-400 font-semibold">{nextTier.name} (Level {nextTier.level})</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold font-mono">Maximum Tier Achieved 🏆</span>
            )}
          </div>
          <span className="font-mono font-extrabold text-sm text-cyan-400">
            {nextTier ? `${progressPct}%` : '100%'}
          </span>
        </div>

        {/* Primary Multi-gradient Bar */}
        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${currentTheme.glow} shadow-sm shadow-cyan-500/20`}
            style={{ width: `${nextTier ? progressPct : 100}%` }}
          />
        </div>

        {/* Sub-text explanation */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
          <span>
            Current: <strong className="text-slate-200">{currentTier.name}</strong>
          </span>
          {nextTier ? (
            <span>
              {nextTier.minSales - effectiveSales > 0 ? (
                <span>
                  <strong className="text-amber-400">
                    {(nextTier.minSales - effectiveSales).toLocaleString()}
                  </strong>{' '}
                  more sales needed
                </span>
              ) : (
                <span className="text-emerald-400">Sales target met!</span>
              )}
            </span>
          ) : (
            <span className="text-fuchsia-300 font-bold">Unrivaled Market Leader</span>
          )}
        </div>
      </div>

      {/* Two Core Drivers: Completion Rate & Total Sales Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Metric 1: Order Completion Rate */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Order Completion Rate</h4>
                <p className="text-[10px] text-slate-400">Ratio of fulfilled vs cancelled orders</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-black text-emerald-400">
                {effectiveCompletionRate.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (effectiveCompletionRate / 100) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Current Level Min: {currentTier.minCompletionRate}%</span>
              {nextTier && (
                <span
                  className={
                    effectiveCompletionRate >= nextTier.minCompletionRate
                      ? 'text-emerald-400 font-semibold'
                      : 'text-amber-400'
                  }
                >
                  {effectiveCompletionRate >= nextTier.minCompletionRate
                    ? `✓ Next Target Met (≥${nextTier.minCompletionRate}%)`
                    : `Target: ≥${nextTier.minCompletionRate}%`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 2: Total Sales Volume */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Total Verified Sales</h4>
                <p className="text-[10px] text-slate-400">Lifetime completed Escrow orders</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-mono font-black text-cyan-400">
                {effectiveSales.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    nextTier
                      ? Math.min(100, Math.max(5, (effectiveSales / nextTier.minSales) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Tier Baseline: {currentTier.minSales.toLocaleString()}</span>
              {nextTier ? (
                <span>Next Tier: {nextTier.minSales.toLocaleString()} sales</span>
              ) : (
                <span className="text-fuchsia-400 font-semibold">Max Cap Exceeded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Step Visual Level Roadmap */}
      <div className="pt-2 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Reputation Tier Roadmap
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Click any level for details
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {REPUTATION_TIERS.map((tier) => {
            const isCurrent = tier.level === currentTier.level;
            const isUnlocked = effectiveSales >= tier.minSales && effectiveCompletionRate >= tier.minCompletionRate;
            const theme = getTierTheme(tier.level);
            const TierIcon = theme.icon;

            return (
              <button
                key={tier.level}
                onClick={() => setSelectedTierDetail(tier)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? `${theme.bg} ${theme.border} ring-1 ring-amber-400/50 shadow-md`
                    : isUnlocked
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600 hover:border-slate-800'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-1 right-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  </div>
                )}

                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      isCurrent
                        ? theme.badgeBg
                        : isUnlocked
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-900 text-slate-700'
                    }`}
                  >
                    <TierIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Lvl {tier.level}
                  </span>
                </div>

                <div>
                  <h5
                    className={`text-xs font-bold truncate ${
                      isCurrent
                        ? theme.text
                        : isUnlocked
                        ? 'text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    {tier.name}
                  </h5>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {tier.minSales === 0 ? '0+' : `${(tier.minSales / 1000).toFixed(1)}k+`} sales · {tier.minCompletionRate}%
                  </p>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Fee:</span>
                  <span className={isCurrent ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                    {tier.feePercentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unlocked Perks Pill Row */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-white">
            Active Tier Benefits for {currentTier.name}:
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            {currentTier.feePercentage}% Escrow Fee
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            {currentTier.inspectionMinutes === 0
              ? 'Instant Auto-Release'
              : `${currentTier.inspectionMinutes}-Min Inspection`}
          </span>
          {currentTier.level >= 3 && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-700/50 text-amber-300 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              Priority Placement
            </span>
          )}
        </div>
      </div>

      {/* Tier Details Quick Popup Modal */}
      {selectedTierDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setSelectedTierDetail(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    getTierTheme(selectedTierDetail.level).badgeBg
                  }`}
                >
                  {React.createElement(getTierTheme(selectedTierDetail.level).icon, {
                    className: 'w-5 h-5',
                  })}
                </div>
                <div>
                  <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                    Level {selectedTierDetail.level} Tier
                  </span>
                  <h4 className="text-lg font-bold text-white">
                    {selectedTierDetail.name}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setSelectedTierDetail(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedTierDetail.description}
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Minimum Completed Sales:</span>
                <span className="font-bold text-white">
                  {selectedTierDetail.minSales.toLocaleString()} orders
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min Order Completion Rate:</span>
                <span className="font-bold text-emerald-400">
                  {selectedTierDetail.minCompletionRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Settlement Fee:</span>
                <span className="font-bold text-amber-400">
                  {selectedTierDetail.feePercentage}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buyer Inspection Window:</span>
                <span className="font-bold text-cyan-400">
                  {selectedTierDetail.inspectionMinutes === 0
                    ? 'Instant Auto-Release'
                    : `${selectedTierDetail.inspectionMinutes} minutes`}
                </span>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-white mb-2">Tier Privileges & Benefits:</h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {selectedTierDetail.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedTierDetail(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Tiers Comprehensive Modal */}
      {showTiersModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={() => setShowTiersModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Seller Reputation Level System
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aegis Escrow Merchant Qualification & Benefits Matrix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTiersModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Seller reputation levels on Aegis Escrow are determined mathematically by your lifetime
              <strong className="text-white"> order completion rate</strong> and verified
              <strong className="text-white"> total sales volume</strong>. Advancing through the tiers unlocks lower platform fees, faster fund disbursements, and boosted storefront visibility.
            </p>

            <div className="space-y-3">
              {REPUTATION_TIERS.map((tier) => {
                const isCurrent = tier.level === currentTier.level;
                const theme = getTierTheme(tier.level);
                const TierIcon = theme.icon;

                return (
                  <div
                    key={tier.level}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? `${theme.bg} ${theme.border} ring-1 ring-amber-400/40`
                        : 'bg-slate-950/60 border-slate-800/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${theme.badgeBg}`}
                        >
                          <TierIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{tier.name}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Lvl {tier.level}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                                YOUR CURRENT LEVEL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {tier.minSales.toLocaleString()}+ sales
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                          ≥{tier.minCompletionRate}% completion
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                          {tier.feePercentage}% fee
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-3">{tier.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
                      {tier.perks.map((perk, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowTiersModal(false)}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
