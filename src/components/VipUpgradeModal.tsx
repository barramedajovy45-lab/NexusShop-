import React, { useState } from 'react';
import { Currency, PaymentMethod, UserAccount } from '../types';
import { CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import { VIP_UPGRADE_PRICE_PHP, VIP_FREE_DIAMOND_PACKAGES, VIP_FREE_CLAIM_LIMIT, VIP_DIAMOND_DISCOUNT_PERCENT } from '../data/mockData';
import { playReferralBonusSound, playUiClickSound } from '../utils/audio';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import {
  Crown,
  X,
  ShieldCheck,
  Zap,
  Gift,
  Percent,
  Briefcase,
  Award,
  Check,
  ArrowRight,
  Globe,
  Sparkles,
  Lock,
  ChevronDown
} from 'lucide-react';

interface VipUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  currency: Currency;
  setCurrency?: (c: Currency) => void;
  onUpgradeSuccess: (updatedUser: UserAccount) => void;
  onOpenSignIn?: () => void;
}

export const VipUpgradeModal: React.FC<VipUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currency,
  setCurrency,
  onUpgradeSuccess,
  onOpenSignIn,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('gcash');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency);

  if (!isOpen) return null;

  // 950 PHP converted to selected currency
  const basePricePhp = VIP_UPGRADE_PRICE_PHP; // 950
  const basePriceUsd = +(basePricePhp / 58.5).toFixed(2); // ~$16.24

  const activeRate = CURRENCY_RATES[selectedCurrency]?.rate || 58.5;
  const activeSymbol = CURRENCY_RATES[selectedCurrency]?.symbol || '₱';
  const displayFormattedPrice = formatCurrency(basePriceUsd, selectedCurrency, selectedCurrency === 'PHP' ? basePricePhp : Math.round(basePriceUsd * activeRate));

  const handleCurrencyChange = (newCurr: Currency) => {
    setSelectedCurrency(newCurr);
    if (setCurrency) setCurrency(newCurr);
  };

  const handleConfirmUpgrade = () => {
    if (!currentUser) {
      if (onOpenSignIn) {
        onClose();
        onOpenSignIn();
      }
      return;
    }

    setIsProcessing(true);
    playUiClickSound();

    setTimeout(() => {
      const now = Date.now();
      const baseExpiry = currentUser.vipExpiry && currentUser.vipExpiry > now ? currentUser.vipExpiry : now;
      const updatedUser: UserAccount = {
        ...currentUser,
        isVip: true,
        tier: 'VIP Mythic',
        role: 'seller', // Can sell diamonds in seller portal
        vipPurchasedAt: now,
        vipExpiry: baseExpiry + 30 * 24 * 60 * 60 * 1000, // 30 days membership cycle
        vipFreeClaimCount: 0, // 2 free claims available
        vipLastFreeClaimTimestamp: 0,
        vipDiscountPercent: VIP_DIAMOND_DISCOUNT_PERCENT, // 50%
      };

      setIsProcessing(false);
      playReferralBonusSound();
      triggerOrderCompletedConfetti({ force: true });
      onUpgradeSuccess(updatedUser);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="vip-upgrade-modal-container"
        className="relative w-full max-w-lg bg-gradient-to-b from-[#141b2e] via-slate-900 to-[#0b101d] border-2 border-amber-400/80 rounded-2xl shadow-2xl shadow-amber-950/90 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Upgrade to VIP Membership
                </h3>
                <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-sm">
                  👑 VIP BADGE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Experience free diamonds, 50% storewide discounts, and authorized seller portal access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-200">
          {/* Price & Currency Conversion Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-amber-950/40 border border-amber-500/50 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300/90 font-bold block">
                  VIP Membership Fee (One-Time Activation)
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                    {displayFormattedPrice}
                  </span>
                  {selectedCurrency !== 'PHP' && (
                    <span className="text-xs font-mono text-slate-400">
                      (₱950 PHP Base)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-emerald-400 font-mono mt-0.5 block">
                  ✓ Instant activation · Lifetime VIP Privileges & Badge
                </span>
              </div>

              {/* Currency Converter Dropdown for Other Countries */}
              <div className="shrink-0">
                <label className="text-[10px] font-mono text-slate-400 block mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-cyan-400" />
                  <span>Convert Country Currency:</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
                    className="w-full sm:w-44 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pr-7"
                  >
                    {(Object.keys(CURRENCY_RATES) as Currency[]).map((cur) => (
                      <option key={cur} value={cur}>
                        {CURRENCY_RATES[cur].flag} {cur} ({CURRENCY_RATES[cur].symbol})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core VIP Privileges Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              What You Unlock as a VIP:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Privilege 1: Free 172 Diamonds */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-amber-500/40 relative group hover:border-amber-400 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Free Diamonds (172 💎)</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Exclusive free package! <strong className="text-amber-300">Limit 2 free claims</strong> total, with a <strong className="text-amber-300">1 day wait</strong> between claims.
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60 inline-block">
                  Only 172 💎 free • 24h cooldown
                </div>
              </div>

              {/* Privilege 2: 50% Storewide Discount */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-cyan-500/40 relative group hover:border-cyan-400 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>50% OFF All Diamonds</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Enjoy a permanent <strong className="text-cyan-300">50% discount</strong> whenever you buy any diamond package in the store!
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60 inline-block">
                  50% discount on all purchases
                </div>
              </div>

              {/* Privilege 3: Seller Portal Access */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/40 relative group hover:border-emerald-400 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Sell in Seller Portal</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Clearance to list diamonds for sale, manage orders, and earn via the <strong className="text-emerald-300">VIP Merchant Portal</strong>.
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 inline-block">
                  Authorized Seller Clearance
                </div>
              </div>

              {/* Privilege 4: Verified VIP Badge */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-yellow-500/40 relative group hover:border-yellow-400 transition-all">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Official VIP Badge</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                      Gold radiant VIP badge displayed next to your IGN, order tracking, and profile ranking.
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-yellow-300 bg-yellow-950/40 px-2 py-0.5 rounded border border-yellow-800/60 inline-block">
                  👑 VIP Mythic Recognition
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector (1. Digital Wallets, 2. Bank Transfers, 3. E-Wallets, 4. Credit/Debit Cards) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold block">
                Select Trusted Payment Gateway Channel:
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                Stripe · Xendit · Midtrans Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'gcash', name: 'GCash (PH)', desc: '1. Digital Wallet · Xendit', flag: '🇵🇭' },
                { id: 'maya', name: 'Maya (PH)', desc: '1. Digital Wallet · Xendit', flag: '🇵🇭' },
                { id: 'dana', name: 'DANA / OVO / GoPay', desc: '1. Indonesia Wallets · Midtrans', flag: '🇮🇩' },
                { id: 'google_pay', name: 'Google Pay / Apple Pay', desc: '1. Digital Wallets · Stripe', flag: '🌐' },
                { id: 'paypal', name: 'PayPal', desc: '1. Global Digital Wallet', flag: '🌍' },
                { id: 'bank_transfer', name: 'Bank / Virtual Account', desc: '2. Direct Bank / VA · Xendit', flag: '🏦' },
                { id: 'qris', name: 'Local E-Wallets', desc: '3. Country E-Wallets (QRIS/TNG)', flag: '🌏' },
                { id: 'card', name: 'Visa & Mastercard', desc: '4. Credit/Debit Cards · Stripe', flag: '💳' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMethod(m.id as PaymentMethod)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedMethod === m.id
                      ? 'bg-amber-950/60 border-amber-400 text-white shadow-sm ring-1 ring-amber-400/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-xs flex items-center gap-1">
                      <span>{m.flag}</span>
                      <span>{m.name}</span>
                    </span>
                    {selectedMethod === m.id && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block leading-tight">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trusted Third-Party Gateway & Buyer Protection Guarantee */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Trusted Third-Party Gateway Protection (Stripe, Xendit & Midtrans)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              <strong className="text-amber-300">Important Tip:</strong> For a verified, <strong>"not scammy"</strong> reputation, all VIP activations are processed exclusively through licensed third-party payment gateways (<strong>Stripe, Xendit, and Midtrans</strong>) with full buyer protection—never to a personal bank account or personal crypto wallet.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800/90 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left w-full sm:w-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Total Amount Due</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black font-mono text-amber-300">
                {displayFormattedPrice}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                (950 Pesos)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              id="btn-confirm-vip-upgrade"
              onClick={handleConfirmUpgrade}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>
                {isProcessing
                  ? 'Activating VIP...'
                  : currentUser
                  ? `Pay ${displayFormattedPrice} & Activate VIP`
                  : 'Sign In to Upgrade to VIP'}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
