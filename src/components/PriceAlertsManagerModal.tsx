import React, { useState } from 'react';
import { Currency, DiamondPackage, PriceAlert, SellerListing } from '../types';
import { CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Gem,
  Plus,
  Trash2,
  TrendingDown,
  X,
  Zap,
  Play,
  Pause,
  Edit3,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface PriceAlertsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceAlerts?: PriceAlert[];
  alerts?: PriceAlert[];
  packages?: DiamondPackage[];
  sellers?: SellerListing[];
  currency: Currency;
  onSaveAlert?: (alert: PriceAlert) => void;
  onDeleteAlert: (alertId: string) => void;
  onToggleActive: (alertId: string) => void;
  onOpenCreateModal?: (pkg: DiamondPackage) => void;
  onOpenCreateAlert?: () => void;
  onEditAlert?: (alert: PriceAlert) => void;
  onSimulatePriceDrop: (packageId: string, customPriceUsd?: number) => void;
  onBuyPackage?: (pkg: DiamondPackage, seller: SellerListing) => void;
  onBuyNow?: (pkg: DiamondPackage, seller: SellerListing) => void;
}

export const PriceAlertsManagerModal: React.FC<PriceAlertsManagerModalProps> = ({
  isOpen,
  onClose,
  priceAlerts,
  alerts,
  packages = [],
  sellers = [],
  currency,
  onSaveAlert,
  onDeleteAlert,
  onToggleActive,
  onOpenCreateModal,
  onOpenCreateAlert,
  onEditAlert,
  onSimulatePriceDrop,
  onBuyPackage,
  onBuyNow,
}) => {
  const effectiveAlerts = priceAlerts || alerts || [];
  const effectivePackages = packages || [];
  const effectiveSellers = sellers || [];

  const handleBuy = onBuyPackage || onBuyNow || (() => {});
  const handleOpenCreate = (pkg: DiamondPackage) => {
    if (onOpenCreateModal) onOpenCreateModal(pkg);
    else if (onEditAlert) onEditAlert({} as PriceAlert);
    else if (onOpenCreateAlert) onOpenCreateAlert();
  };

  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'triggered'>('all');
  const [selectedPkgForNew, setSelectedPkgForNew] = useState<string>(effectivePackages[0]?.id || 'pkg_86');

  if (!isOpen) return null;

  const activeCount = effectiveAlerts.filter((a) => a && a.isActive).length;

  const filteredAlerts = effectiveAlerts.filter((a) => {
    if (!a) return false;
    if (filterMode === 'active') return a.isActive;
    if (filterMode === 'triggered') return (a.triggerCount || 0) > 0;
    return true;
  });

  const getLowestSellerForPackage = (packageId: string): SellerListing => {
    const matched = effectiveSellers.filter((s) => s.packageId === packageId);
    if (matched.length > 0) {
      return matched.reduce((min, s) => (s.priceUsd < min.priceUsd ? s : min), matched[0]);
    }
    return effectiveSellers[0];
  };

  const handleStartCreateForPackage = () => {
    const pkg = effectivePackages.find((p) => p.id === selectedPkgForNew) || effectivePackages[0];
    if (pkg) {
      handleOpenCreate(pkg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-alerts-manager-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-cyan-400 to-indigo-500" />

        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="price-alerts-manager-title" className="font-bold text-base text-white">
                  Diamond Price Alert Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/90 border border-cyan-600/50 text-cyan-300">
                  {activeCount} Active Watchers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time automated escrow notifications when seller listings meet your target budget.
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

        {/* Action Bar: Filters & Quick Creator */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Filter:</span>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({effectiveAlerts.length})
            </button>
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'active'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode('triggered')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filterMode === 'triggered'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Triggered History
            </button>
          </div>

          {/* Quick Add Alert Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPkgForNew}
              onChange={(e) => setSelectedPkgForNew(e.target.value)}
              aria-label="Select Diamond Package to track"
              className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-amber-500 max-w-[200px] truncate cursor-pointer"
            >
              {effectivePackages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} ({pkg.diamonds} 💎)
                </option>
              ))}
            </select>
            <button
              onClick={handleStartCreateForPackage}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Track Pack</span>
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">No Price Alerts Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select a diamond package above or click &apos;Set Alert&apos; on any package in the store to get notified when sellers drop their price.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const pkg = effectivePackages.find((p) => p.id === alert.packageId);
              const bestSeller = getLowestSellerForPackage(alert.packageId);
              const currentLowestUsd = bestSeller ? bestSeller.priceUsd : (pkg?.discountPriceUsd || 1);
              const targetUsd = alert.targetPriceUsd;
              const isTargetMet = currentLowestUsd <= targetUsd;
              const diffUsd = currentLowestUsd - targetUsd;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isTargetMet
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm shadow-emerald-950/40'
                      : alert.isActive
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/30 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Package Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isTargetMet
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                        }`}
                      >
                        {isTargetMet ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Gem className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">{alert.packageName}</h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {alert.diamonds.toLocaleString()} 💎
                          </span>
                          {alert.isActive ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-700/50 text-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Watching
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                              Paused
                            </span>
                          )}
                          {(alert.triggerCount || 0) > 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-950 border border-amber-700/50 text-amber-300">
                              Triggered {alert.triggerCount}x
                            </span>
                          )}
                        </div>

                        {/* Pricing Line */}
                        <div className="mt-1.5 flex items-center gap-4 text-xs font-mono flex-wrap">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Target Alert:</span>
                            <span className="font-bold text-amber-400">
                              ≤ {formatCurrency(targetUsd, currency)}
                            </span>
                          </div>

                          <div className="h-4 w-px bg-slate-800" />

                          <div>
                            <span className="text-slate-400 text-[11px] block">Current Lowest:</span>
                            <span
                              className={`font-bold ${
                                isTargetMet ? 'text-emerald-400 font-extrabold' : 'text-slate-200'
                              }`}
                            >
                              {formatCurrency(currentLowestUsd, currency)}
                            </span>
                          </div>

                          <div className="h-4 w-px bg-slate-800" />

                          <div>
                            <span className="text-slate-400 text-[11px] block">Status:</span>
                            {isTargetMet ? (
                              <span className="text-emerald-400 font-bold">
                                🎯 Target Met! ({formatCurrency(Math.abs(diffUsd), currency)} lower)
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                {formatCurrency(diffUsd, currency)} away
                              </span>
                            )}
                          </div>
                        </div>

                        {alert.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-1">
                            &ldquo;{alert.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions on Right */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                      {/* Test trigger simulation button */}
                      <button
                        onClick={() => {
                          const dropTarget = Math.max(0.4, targetUsd * 0.96);
                          onSimulatePriceDrop(alert.packageId, dropTarget);
                        }}
                        title="Simulate seller price drop to trigger this alert immediately"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 text-blue-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Simulate Drop</span>
                      </button>

                      {/* Buy now if target met */}
                      {isTargetMet && pkg && (
                        <button
                          onClick={() => {
                            handleBuy(pkg, bestSeller);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-sm shadow-emerald-500/20"
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Edit Alert */}
                      {pkg && (
                        <button
                          onClick={() => {
                            handleOpenCreate(pkg);
                          }}
                          title="Edit target price"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Toggle Active / Pause */}
                      <button
                        onClick={() => onToggleActive(alert.id)}
                        title={alert.isActive ? 'Pause price alert' : 'Resume price alert'}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {alert.isActive ? (
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>

                      {/* Delete Alert */}
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        title="Delete price alert"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Direct Moonton API monitoring. Alerts sound an audible chime & display an escrow checkout link.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Drop price on first active alert or default package
                const target = priceAlerts[0] || { packageId: 'pkg_wdp', targetPriceUsd: 1.85 };
                onSimulatePriceDrop(target.packageId, target.targetPriceUsd * 0.95);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulate Flash Sale</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
