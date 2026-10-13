import React, { useState } from 'react';
import { Currency, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  calculateLoyaltyTier,
  getLoyaltyProgress,
  getNextLoyaltyTier,
  calculateLoyaltyDiscount,
  LOYALTY_TIERS,
  LoyaltyTierConfig,
} from '../utils/loyaltyUtils';
import {
  Crown,
  Sparkles,
  Shield,
  Trophy,
  Gem,
  CheckCircle2,
  Lock,
  ArrowRight,
  Zap,
  Percent,
  TrendingUp,
  RotateCcw,
  Plus,
  Coins,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';

interface LoyaltyTiersSectionProps {
  user: UserAccount;
  onUpdateUser: (updated: UserAccount) => void;
  currency: Currency;
  onOpenStore?: () => void;
}

export const LoyaltyTiersSection: React.FC<LoyaltyTiersSectionProps> = ({
  user,
  onUpdateUser,
  currency,
  onOpenStore,
}) => {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [simulatedDiamondsDelta, setSimulatedDiamondsDelta] = useState<number>(0);
  const [showSimulateSuccess, setShowSimulateSuccess] = useState<string | null>(null);

  // Current progress & status
  const currentTotalDiamonds = (user.totalDiamondsPurchased || 0) + simulatedDiamondsDelta;
  const progress = getLoyaltyProgress(currentTotalDiamonds);
  const currentTier = progress.currentTier;
  const nextTier = progress.nextTier;

  // Selected sample package for the real-time savings calculator
  const [sampleDiamonds, setSampleDiamonds] = useState<number>(706);
  const samplePriceUsd = sampleDiamonds === 86 ? 1.49 : sampleDiamonds === 296 ? 4.89 : sampleDiamonds === 706 ? 10.99 : sampleDiamonds === 2195 ? 32.99 : 79.99;
  const savings = calculateLoyaltyDiscount(samplePriceUsd, currentTier.discountPercent);

  // Handle simulating diamond purchase to advance tier
  const handleAddSimulatedDiamonds = (amount: number) => {
    const newTotal = Math.max(0, (user.totalDiamondsPurchased || 0) + amount);
    const newTier = calculateLoyaltyTier(newTotal);

    onUpdateUser({
      ...user,
      totalDiamondsPurchased: newTotal,
      loyaltyTier: newTier.id,
      loyaltyDiscountPercent: newTier.discountPercent,
    });

    setShowSimulateSuccess(`+${amount.toLocaleString()} 💎 added! Loyalty status updated to ${newTier.name} (${newTier.discountPercent}% OFF).`);
    setTimeout(() => {
      setShowSimulateSuccess(null);
    }, 3500);
  };

  const handleResetDiamonds = () => {
    // Reset to base 514 / starter
    const resetVal = 514;
    const baseTier = calculateLoyaltyTier(resetVal);
    onUpdateUser({
      ...user,
      totalDiamondsPurchased: resetVal,
      loyaltyTier: baseTier.id,
      loyaltyDiscountPercent: baseTier.discountPercent,
    });
    setSimulatedDiamondsDelta(0);
    setShowSimulateSuccess('Diamonds reset to default testing baseline (514 💎 · Bronze).');
    setTimeout(() => setShowSimulateSuccess(null), 3000);
  };

  const renderTierIcon = (iconName: LoyaltyTierConfig['iconName'], className: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Gem':
        return <Gem className={className} />;
      case 'Shield':
      default:
        return <Shield className={className} />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Simulation Feedback Alert */}
      {showSimulateSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{showSimulateSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSimulateSuccess(null)}
            className="text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero: Current Loyalty Status Spotlight */}
      <div
        className={`p-5 rounded-2xl bg-gradient-to-br ${currentTier.gradient} border ${currentTier.badgeBorder} shadow-2xl relative overflow-hidden space-y-4`}
        style={{
          boxShadow: `0 10px 30px -5px ${currentTier.glowColor}`,
        }}
      >
        {/* Background decorative watermark */}
        <div className="absolute top-2 right-3 opacity-10 pointer-events-none">
          {renderTierIcon(currentTier.iconName, 'w-36 h-36')}
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl ${currentTier.badgeBg} border-2 ${currentTier.badgeBorder} flex items-center justify-center shadow-lg shrink-0`}
            >
              {renderTierIcon(currentTier.iconName, `w-7 h-7 ${currentTier.badgeText} animate-pulse`)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-mono font-bold tracking-widest text-slate-400">
                  Current Status
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${currentTier.badgeBg} ${currentTier.badgeText} border ${currentTier.badgeBorder}`}
                >
                  {currentTier.name}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  <span>{currentTier.discountPercent}% Automatic Order Discount</span>
                </span>
              </div>

              <h3 className="text-xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
                <span>{currentTier.tagline}</span>
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 shrink-0">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Lifetime Purchases
            </span>
            <span className="text-lg font-black font-mono text-cyan-300 flex items-center sm:justify-end gap-1">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span>{currentTotalDiamonds.toLocaleString()} 💎</span>
            </span>
          </div>
        </div>

        {/* Progress Bar towards Next Tier */}
        <div className="relative z-10 space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              {nextTier ? (
                <span>
                  Next Milestone: <strong className="text-white">{nextTier.name}</strong> ({nextTier.discountPercent}% OFF)
                </span>
              ) : (
                <span className="text-purple-300 font-bold">★ Highest Loyalty Status Achieved (Max 15% OFF)</span>
              )}
            </span>

            <span className="text-cyan-300 font-bold">
              {nextTier ? `${progress.progressPercent}% Complete` : '100% (Apex Whale)'}
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full h-3 rounded-full bg-slate-950/90 border border-slate-800 overflow-hidden relative p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 transition-all duration-700 relative overflow-hidden"
              style={{ width: `${progress.progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>{currentTotalDiamonds.toLocaleString()} 💎 credited</span>
            {nextTier ? (
              <span className="text-amber-300 font-bold">
                +{progress.remainingDiamonds.toLocaleString()} 💎 more to unlock {nextTier.name}
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">Maximum VIP Privileges Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Automatic Checkout Discount Explainer Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white flex items-center gap-2">
              <span>Automatic Order Discount Applied at Checkout</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold">
                NO PROMO CODE NEEDED
              </span>
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Your <strong>{currentTier.discountPercent}% {currentTier.name} Discount</strong> is seamlessly deducted from all future diamond pack orders and bulk bundles inside the Aegis Escrow checkout.
            </p>
          </div>
        </div>

        {onOpenStore && (
          <button
            type="button"
            onClick={onOpenStore}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span>Buy Diamonds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Live Sample Savings Calculator */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Real-Time Order Savings Calculator
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Based on active {currentTier.discountPercent}% discount
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[86, 296, 706, 2195, 5532].map((diamonds) => (
            <button
              key={diamonds}
              type="button"
              onClick={() => setSampleDiamonds(diamonds)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                sampleDiamonds === diamonds
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              💎 {diamonds.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block">Package</span>
            <span className="font-bold text-white">{sampleDiamonds.toLocaleString()} Diamonds</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Original Price</span>
            <span className="font-semibold text-slate-400 line-through">
              {formatCurrency(samplePriceUsd, currency)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-400 block font-bold">
              {currentTier.name} Savings (-{currentTier.discountPercent}%)
            </span>
            <span className="font-extrabold text-emerald-400">
              - {formatCurrency(savings.discountAmountUsd, currency, savings.discountAmountPhp)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-cyan-400 block font-bold">Your Checkout Price</span>
            <span className="text-sm font-black text-cyan-300">
              {formatCurrency(savings.finalPriceUsd, currency, savings.finalPricePhp)}
            </span>
          </div>
        </div>
      </div>

      {/* All Loyalty Tiers Catalog */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              All Loyalty Tiers & Tier Perks
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            5 Distinct Tier Brackets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LOYALTY_TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier.id;
            const isUnlocked = currentTotalDiamonds >= tier.minDiamonds;
            const isSelected = selectedTierId === tier.id;

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTierId(isSelected ? null : tier.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isCurrent
                    ? `${tier.badgeBg} border-2 ${tier.badgeBorder} shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40`
                    : isUnlocked
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                    : 'bg-slate-950/50 border-slate-800/60 opacity-75 hover:opacity-90'
                }`}
              >
                {/* Header of Tier Card */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${tier.badgeBg} border ${tier.badgeBorder} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {renderTierIcon(tier.iconName, `w-5 h-5 ${tier.badgeText}`)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{tier.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                            YOUR TIER
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {tier.maxDiamonds
                          ? `${tier.minDiamonds.toLocaleString()} - ${tier.maxDiamonds.toLocaleString()} 💎`
                          : `${tier.minDiamonds.toLocaleString()}+ 💎`}
                      </span>
                    </div>
                  </div>

                  {/* Discount Badge */}
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-mono font-black ${
                        isCurrent
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : `${tier.badgeBg} ${tier.badgeText} border ${tier.badgeBorder}`
                      }`}
                    >
                      {tier.discountPercent}% OFF
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      {isUnlocked ? '✓ Unlocked' : 'Locked'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mb-3">{tier.tagline}</p>

                {/* Perks Checklist */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80">
                  {tier.perks.map((perk, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isUnlocked ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className={isUnlocked ? 'text-slate-200' : 'text-slate-400'}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Advancement Simulator & Diamond Booster */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Instant Tier Status Tester & Diamond Booster
              </h4>
              <p className="text-[11px] text-slate-400">
                Simulate purchases to test status upgrades from Bronze to Silver, Gold, Platinum & Mythic.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDiamonds}
            className="text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            title="Reset diamond purchases to starter baseline"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleAddSimulatedDiamonds(500)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+500 💎 (Progress)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSimulatedDiamonds(1000)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-300" />
            <span>+1,000 💎 (Silver · 3% OFF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSimulatedDiamonds(5000)}
            className="px-3 py-1.5 rounded-lg bg-yellow-950/60 hover:bg-yellow-900/60 text-yellow-300 text-xs font-mono font-semibold border border-yellow-600/50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span>+5,000 💎 (Gold · 6% OFF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSimulatedDiamonds(20000)}
            className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono font-semibold border border-cyan-600/50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-cyan-400" />
            <span>+20,000 💎 (Platinum · 10% OFF)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddSimulatedDiamonds(50000)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-xs font-mono font-semibold border border-purple-600/50 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Gem className="w-3.5 h-3.5 text-purple-400" />
            <span>+50,000 💎 (Mythic · 15% OFF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
