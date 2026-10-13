import React, { useState } from 'react';
import { Currency, UserAccount } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Calculator, Gem, ArrowRight, ShieldCheck, Zap, Crown, UserCheck, Lock, Star, Sparkles, Check } from 'lucide-react';
import { isEligibleForFreeEverything, isDeveloperUser, isVipUser } from '../data/mockData';

interface DiamondSavingsCalculatorProps {
  currency: Currency;
  currentUser?: UserAccount | null;
  onSelectQuickAmount: (diamonds: number) => void;
}

export const DiamondSavingsCalculator: React.FC<DiamondSavingsCalculatorProps> = ({
  currency,
  currentUser,
  onSelectQuickAmount,
}) => {
  const [customDiamonds, setCustomDiamonds] = useState(706);
  const isFreeEligible = isEligibleForFreeEverything(currentUser);
  const isVipOrDev = isDeveloperUser(currentUser) || isVipUser(currentUser) || isFreeEligible;

  // Moonton in-game baseline: roughly $0.0212 per diamond
  const officialRatePerDiamondUsd = 0.0212;
  // Nexus escrow rate: roughly $0.0158 per diamond
  const escrowRatePerDiamondUsd = 0.0158;

  const officialCost = customDiamonds * officialRatePerDiamondUsd;
  const escrowCost = isFreeEligible ? 0 : customDiamonds * escrowRatePerDiamondUsd;
  const savings = Math.max(0, officialCost - escrowCost);
  const savingsPct = isFreeEligible ? 100 : Math.round((savings / officialCost) * 100);

  // Must strictly start from starter steps and end with the highest diamond package (5,532 💎)
  const presetAmounts = [10, 25, 50, 86, 257, 706, 2195, 5532];
  const isHighest = customDiamonds === 5532;

  return (
    <div
      id="escrow-savings-calculator"
      className="my-8 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#0c1322] border border-slate-800 shadow-xl"
    >
      {/* 5 Easy Steps to Buy Mobile Legends Diamonds Header */}
      <div id="calculator-five-steps" className="mb-6 pb-5 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-black text-xs font-mono">
              5
            </span>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>5 Easy Steps to Buy Mobile Legends Diamonds</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  Aegis Escrow Protected
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Simple 5-step checkout guarantee: from 10 💎 starter packs to the highest 5,532 💎 whale tier.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium shrink-0 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% Money-Back Escrow</span>
          </div>
        </div>

        {/* 5 Steps Interactive Flow Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center gap-1.5 text-slate-300">
            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[9px] shrink-0">
              1
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">1. Enter MLBB ID</span>
              <span className="text-[9px] text-slate-400 block truncate">User & Zone ID</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center gap-1.5 text-slate-300">
            <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/60 flex items-center justify-center font-bold text-[9px] shrink-0">
              2
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">2. Pick Diamonds</span>
              <span className="text-[9px] text-slate-400 block truncate">10 💎 → 5,532 💎</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center gap-1.5 text-slate-300">
            <span className="w-4 h-4 rounded-full bg-amber-950 text-amber-400 border border-amber-700/60 flex items-center justify-center font-bold text-[9px] shrink-0">
              3
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">3. Pick Seller</span>
              <span className="text-[9px] text-slate-400 block truncate">Verified / Top-Rated</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center gap-1.5 text-slate-300">
            <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center justify-center font-bold text-[9px] shrink-0">
              4
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">4. Escrow Vault Pay</span>
              <span className="text-[9px] text-slate-400 block truncate">GCash, Maya, USDT</span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/90 flex items-center gap-1.5 text-slate-300 col-span-2 sm:col-span-1">
            <span className="w-4 h-4 rounded-full bg-yellow-950 text-yellow-400 border border-yellow-700/60 flex items-center justify-center font-bold text-[9px] shrink-0">
              5
            </span>
            <div className="min-w-0">
              <span className="font-bold text-white block truncate">5. Instant Credit</span>
              <span className="text-[9px] text-slate-400 block truncate">Fast ~1m In-Game</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Headline & Slider */}
        <div className="space-y-4 flex-1 w-full">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Calculator className="w-3.5 h-3.5" />
            <span>Escrow Savings Calculator</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Compare In-Game Store vs. Nexus Shop Escrow
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg leading-relaxed">
            Authorized regional distributors receive bulk Moonton merchant allocations. Calculate your exact real-money savings per recharge, starting with 10 💎 up to the highest 5,532 💎 whale tier.
          </p>

          {/* Quick preset chips - Starts with 5 steps / lowest diamonds and ends with the highest diamond (5,532 💎) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">Preset Packages (Starter to Highest Diamond):</span>
              <span className="text-[10px] font-mono text-cyan-300">Click to compare & buy</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {presetAmounts.map((amt) => {
                const isSelected = customDiamonds === amt;
                const isHighestTier = amt === 5532;
                return (
                  <button
                    key={amt}
                    type="button"
                    id={`calc-preset-${amt}`}
                    onClick={() => setCustomDiamonds(amt)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? isHighestTier
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300 font-bold scale-105'
                          : 'bg-cyan-500 text-slate-950 shadow-sm font-bold scale-105'
                        : isHighestTier
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 hover:bg-amber-900/60 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isHighestTier && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    <span>{amt.toLocaleString()} 💎</span>
                    {isHighestTier && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 rounded bg-amber-400/20 text-amber-300">
                        Highest
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider - Starts from 10 💎 and ends with the highest diamond (5,532 💎) */}
          <div className="pt-2">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span>10 💎 (Min)</span>
              <span className="text-cyan-300 font-bold text-sm flex items-center gap-1">
                {isHighest && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                <span>{customDiamonds.toLocaleString()} Diamonds</span>
                {isHighest && <span className="text-[10px] text-amber-400 font-mono font-bold">(Highest Tier)</span>}
              </span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>5,532 💎 (Highest)</span>
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="5532"
              step="1"
              value={customDiamonds}
              onChange={(e) => setCustomDiamonds(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            {isHighest && (
              <div className="mt-2 p-2 rounded-lg bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs text-amber-300 font-mono">
                <span className="flex items-center gap-1 font-bold">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>👑 Highest Whale Tier: 5,532 + 650 Bonus = 6,182 💎 Total</span>
                </span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  Max Savings
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Comparative Breakdown Box & Easy Buy Button */}
        <div className="w-full lg:w-84 p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3.5 font-mono text-xs shrink-0">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span>Official Play Store:</span>
            <span className="line-through text-slate-400 tabular-nums">
              {formatCurrency(officialCost, currency)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
            <span className="font-semibold text-white">
              {isFreeEligible ? 'VIP Developer Price:' : 'Aegis Escrow Price:'}
            </span>
            <span className={`font-bold text-sm tabular-nums ${isFreeEligible ? 'text-amber-300' : 'text-cyan-300'}`}>
              {isFreeEligible ? '₱0.00 (100% FREE)' : formatCurrency(escrowCost, currency)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                {isFreeEligible ? 'VIP Free Exemption' : 'Total Real-Money Saved'}
              </span>
              <span className="text-base font-extrabold text-white tabular-nums">
                {formatCurrency(savings, currency)}
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-400">
              Save {savingsPct}%
            </span>
          </div>

          {/* Only show Big 💎 Status for Developer and VIP accounts */}
          {isVipOrDev && customDiamonds >= 700 && (
            <div className="text-[11px] text-cyan-200 bg-blue-950/60 p-2 rounded-lg border border-cyan-500/40 flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-1 font-semibold text-white">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Big 💎 Status:</span>
              </span>
              <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/40">
                100% FREE (VIP DEV)
              </span>
            </div>
          )}

          {/* Quick Buy Highest Diamond Shortcut (Always accessible so they can easily buy here) */}
          {!isHighest && (
            <button
              type="button"
              id="calc-quick-buy-highest-diamond-btn"
              onClick={() => onSelectQuickAmount(5532)}
              className="w-full py-2 px-3 rounded-lg font-bold text-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-amber-300"
              title="Instantly buy the highest diamond package (5,532 + 650 bonus diamonds)"
            >
              <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
              <span>👑 Buy Highest Diamond (5,532 💎)</span>
            </button>
          )}

          {/* Primary Top-Up / Buy Button */}
          <button
            type="button"
            id="calc-top-up-diamonds-btn"
            onClick={() => onSelectQuickAmount(customDiamonds)}
            className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
              isHighest
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 shadow-amber-500/30'
                : isFreeEligible
                ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
          >
            {isHighest ? (
              <>
                <Crown className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
                <span>Buy Highest Diamond Tier (5,532 💎)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : isFreeEligible ? (
              <>
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span>Claim {customDiamonds.toLocaleString()} Free Diamonds (VIP)</span>
              </>
            ) : (
              <>
                <span>Top-Up {customDiamonds.toLocaleString()} Diamonds</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
