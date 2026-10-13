import React, { useState, useEffect } from 'react';
import { Currency, DiamondPackage, PriceAlert, SellerListing } from '../types';
import { CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import {
  Bell,
  BellRing,
  Gem,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  Check,
  ArrowRight,
  Percent,
  Trash2
} from 'lucide-react';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  diamondPackage: DiamondPackage;
  currentAlert?: PriceAlert | null;
  existingAlert?: PriceAlert | null;
  sellers?: SellerListing[];
  currency: Currency;
  onSaveAlert: (alert: PriceAlert) => void;
  onDeleteAlert?: (alertId: string) => void;
  onSimulatePriceDrop?: (packageId: string, customPriceUsd?: number) => void;
  onSimulateDrop?: (packageId: string, customPriceUsd?: number) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  diamondPackage,
  currentAlert,
  existingAlert,
  sellers = [],
  currency,
  onSaveAlert,
  onDeleteAlert,
  onSimulatePriceDrop,
  onSimulateDrop,
}) => {
  const effectiveAlert = currentAlert ?? existingAlert ?? null;
  const effectiveSimulate = onSimulatePriceDrop || onSimulateDrop;
  const safeSellers = sellers || [];

  // Find current lowest seller price for this package
  const packageSellers = safeSellers.filter((s) => s.packageId === diamondPackage.id);
  const bestSeller = packageSellers.length > 0
    ? packageSellers.reduce((min, s) => (s.priceUsd < min.priceUsd ? s : min), packageSellers[0])
    : safeSellers[0];

  const currentLowestUsd = bestSeller ? bestSeller.priceUsd : diamondPackage.discountPriceUsd;
  const rate = (CURRENCY_RATES[currency] || CURRENCY_RATES.PHP).rate;

  // Initial target price state in local currency
  const initialLocalPrice = effectiveAlert
    ? +(effectiveAlert.targetPriceUsd * rate).toFixed(currency === 'IDR' ? 0 : 2)
    : +(currentLowestUsd * 0.9 * rate).toFixed(currency === 'IDR' ? 0 : 2); // Default to 10% below best price

  const [targetInput, setTargetInput] = useState<string>(initialLocalPrice.toString());
  const [notes, setNotes] = useState<string>(effectiveAlert?.notes || '');
  const [successSaved, setSuccessSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Synchronize when opened or package changes
  useEffect(() => {
    if (isOpen) {
      const price = effectiveAlert
        ? +(effectiveAlert.targetPriceUsd * rate).toFixed(currency === 'IDR' ? 0 : 2)
        : +(currentLowestUsd * 0.92 * rate).toFixed(currency === 'IDR' ? 0 : 2);
      setTargetInput(price.toString());
      setNotes(effectiveAlert?.notes || '');
      setSuccessSaved(false);
      setErrorMessage('');
    }
  }, [isOpen, diamondPackage, effectiveAlert, currentLowestUsd, rate, currency]);

  if (!isOpen) return null;

  const parsedLocalTarget = parseFloat(targetInput) || 0;
  const targetUsd = parsedLocalTarget / rate;

  // Savings calculations
  const retailLocal = diamondPackage.regularPriceUsd * rate;
  const currentLowestLocal = currentLowestUsd * rate;
  const savingsVsRetail = retailLocal > 0 ? Math.round(((retailLocal - parsedLocalTarget) / retailLocal) * 100) : 0;
  const savingsVsCurrent = currentLowestLocal > 0 ? Math.round(((currentLowestLocal - parsedLocalTarget) / currentLowestLocal) * 100) : 0;

  // Preset discount application
  const applyPresetDiscount = (discountFraction: number) => {
    const discountedUsd = currentLowestUsd * (1 - discountFraction);
    const discountedLocal = +(discountedUsd * rate).toFixed(currency === 'IDR' ? 0 : 2);
    setTargetInput(discountedLocal.toString());
    setErrorMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (parsedLocalTarget <= 0) {
      setErrorMessage('Please enter a valid target price greater than 0.');
      return;
    }

    if (targetUsd >= diamondPackage.regularPriceUsd * 1.05) {
      setErrorMessage(`Target price cannot exceed in-game retail price (${formatCurrency(diamondPackage.regularPriceUsd, currency)}).`);
      return;
    }

    const alert: PriceAlert = {
      id: effectiveAlert?.id || 'alert_' + Date.now(),
      packageId: diamondPackage.id,
      packageName: diamondPackage.name,
      diamonds: diamondPackage.diamonds,
      bonusDiamonds: diamondPackage.bonusDiamonds,
      targetPriceUsd: +targetUsd.toFixed(3),
      targetCurrency: currency,
      createdAt: effectiveAlert?.createdAt || Date.now(),
      isActive: true,
      triggerCount: effectiveAlert?.triggerCount || 0,
      notes: notes.trim() || `Target: ${formatCurrency(targetUsd, currency)} for ${diamondPackage.diamonds} 💎`,
    };

    onSaveAlert(alert);
    setSuccessSaved(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleSimulateNow = () => {
    // Drop seller price to 3% below target so notification triggers immediately
    const droppedUsd = Math.max(0.4, targetUsd * 0.95);
    effectiveSimulate?.(diamondPackage.id, droppedUsd);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-alert-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-cyan-400 to-blue-500" />

        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="price-alert-modal-title" className="font-bold text-base text-white">
                  {currentAlert ? 'Edit Price Alert' : 'Set Diamond Price Alert'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950/90 border border-amber-600/50 text-amber-300">
                  24/7 Watch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                We will notify you immediately when a seller listing drops below your target.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Selected Package Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400 shrink-0">
                <Gem className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{diamondPackage.name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <span>{diamondPackage.diamonds.toLocaleString()} Diamonds</span>
                  {diamondPackage.bonusDiamonds > 0 && (
                    <span className="text-cyan-400 font-semibold">+{diamondPackage.bonusDiamonds} Bonus</span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Retail Value</span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {formatCurrency(diamondPackage.regularPriceUsd, currency)}
              </span>
            </div>
          </div>

          {/* Current Market Price vs Target */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Current Lowest P2P Price</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(currentLowestUsd, currency)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate">
                by {bestSeller?.sellerName || 'Verified Merchant'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <span className="text-[11px] text-amber-300 font-medium block mb-1">Your Target Alert</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-white">
                  {formatCurrency(targetUsd, currency)}
                </span>
              </div>
              <span className="text-[10px] text-amber-400/90 font-mono mt-0.5 block">
                {savingsVsCurrent > 0 ? `${savingsVsCurrent}% below current best` : 'Equal or above market'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Target Price Input */}
            <div>
              <label htmlFor="targetPriceInput" className="block text-xs font-semibold text-slate-200 mb-1.5">
                Trigger notification when seller price drops to or below:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono font-bold text-sm">
                  {CURRENCY_RATES[currency].symbol}
                </div>
                <input
                  id="targetPriceInput"
                  type="number"
                  step={currency === 'IDR' ? '100' : '0.01'}
                  min="0.1"
                  value={targetInput}
                  onChange={(e) => {
                    setTargetInput(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-16 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  placeholder="Enter target price..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                  {currency}
                </div>
              </div>
              {currency !== 'USD' && (
                <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                  ≈ ${targetUsd.toFixed(2)} USD base rate
                </span>
              )}
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Target Presets (based on current ₱/$/IDR):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '-5%', fraction: 0.05, desc: 'Quick Dip' },
                  { label: '-10%', fraction: 0.10, desc: 'Hot Deal' },
                  { label: '-15%', fraction: 0.15, desc: 'Super Saver' },
                  { label: '-20%', fraction: 0.20, desc: 'Flash Sale' },
                ].map((preset) => {
                  const presetLocal = +(currentLowestUsd * (1 - preset.fraction) * rate).toFixed(currency === 'IDR' ? 0 : 2);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => applyPresetDiscount(preset.fraction)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                        <span>{preset.label}</span>
                        <TrendingDown className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {formatCurrency(presetLocal / rate, currency)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Potential Savings Banner */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-emerald-300 block">
                  Moonton Escrow Alert Guaranteed
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  At this target price, you save <span className="font-bold text-emerald-400">{savingsVsRetail}%</span> compared to official in-game store retail. Real-money payment remains safely locked in Aegis Vault until recharge arrives.
                </p>
              </div>
            </div>

            {/* Optional Custom Note */}
            <div>
              <label htmlFor="notesInput" className="block text-[11px] font-medium text-slate-400 mb-1">
                Alert Reminder Note (Optional):
              </label>
              <input
                id="notesInput"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. For Collector Skin or Starlight renewal"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2.5">
              {currentAlert && onDeleteAlert && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAlert(currentAlert.id);
                    onClose();
                  }}
                  className="px-3 py-2.5 rounded-xl border border-rose-800/60 hover:bg-rose-950/60 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Alert</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {successSaved ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Price Alert Saved!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 text-slate-950" />
                    <span>{currentAlert ? 'Update Price Alert' : 'Activate Price Alert'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test Trigger Section */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs bg-slate-950/50 p-3 rounded-xl">
            <div>
              <span className="font-semibold text-slate-200 block">Want to test the notification right now?</span>
              <span className="text-[11px] text-slate-400">Simulate a seller dropping price below your target</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateNow}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Alert Trigger</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
