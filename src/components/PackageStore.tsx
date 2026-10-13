import React, { useState, useEffect, useRef } from 'react';
import { Currency, DiamondPackage, MlbbAccount, PaymentMethod, PriceAlert, SellerListing, UserAccount } from '../types';
import { CURRENCY_RATES, formatCurrency } from '../utils/formatters';
import { Gem, Zap, Shield, ChevronRight, Check, Bell, BellRing, TrendingDown, Sparkles, Plus, Minus, Tag, Globe, Lock, Flame, AlertTriangle, Layers, ShoppingBag, CheckSquare, Square, Trash2, X, Crown, Filter, ShieldCheck, Clock, RotateCcw, Star, UserCheck, Award, CheckCircle2, RefreshCw } from 'lucide-react';
import { DiamondImage } from './DiamondImage';
import { CountrySelectorDropdown } from './CountrySelectorDropdown';
import { TimedDiamondDropCard } from './TimedDiamondDropCard';
import { PackageStoreSkeleton } from './SkeletonLoaders';
import { calculatePackagePricing, calculateMultiPackagePricing, BULK_DISCOUNT_THRESHOLD_DIAMONDS, BULK_DISCOUNT_PERCENT, GCASH_DISCOUNT_PERCENT, GCASH_BIG_DIAMOND_THRESHOLD, GCASH_BIG_DIAMOND_DISCOUNT_PERCENT } from '../utils/pricing';
import {
  isEligibleForFreeEverything,
  isDeveloperUser,
  isVipUser,
  isBigDiamondPackage,
  isPackageFreeForUser,
  getVipFreeClaimStatus,
  VIP_UPGRADE_PRICE_PHP,
  VIP_FREE_DIAMOND_PACKAGES,
  VIP_FREE_CLAIM_LIMIT,
  VIP_DIAMOND_DISCOUNT_PERCENT,
} from '../data/mockData';
import { playDiamondChimeSound, playUiClickSound, playModalOpenSound } from '../utils/audio';
import { triggerClickSparkle } from '../utils/confetti';

export const LOW_STOCK_THRESHOLD = 150;

interface PackageStoreProps {
  packages: DiamondPackage[];
  sellers: SellerListing[];
  currency: Currency;
  setCurrency?: (c: Currency) => void;
  verifiedAccount: MlbbAccount | null;
  currentUser?: UserAccount | null;
  priceAlerts?: PriceAlert[];
  preferredPaymentMethod?: PaymentMethod;
  onSelectPackageToBuy: (pkg: DiamondPackage, seller: SellerListing, quantity?: number) => void;
  onInitiateBulkCheckout?: (items: { package: DiamondPackage; seller: SellerListing; quantity: number }[]) => void;
  onOpenAccountPrompt: () => void;
  onOpenPriceAlertModal?: (pkg: DiamondPackage) => void;
  onOpenPriceAlertsManager?: () => void;
  onOpenSignIn?: () => void;
  onOpenVipUpgradeModal?: () => void;
  onDiamondsClaimed?: (amount: number) => void;
  onAddNotificationToast?: (toast: {
    statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
    title: string;
    message: string;
    diamonds: number;
    amount: number;
  }) => void;
  isLoading?: boolean;
}

export const PackageStore: React.FC<PackageStoreProps> = ({
  packages = [],
  sellers = [],
  currency,
  setCurrency,
  verifiedAccount,
  currentUser,
  priceAlerts = [],
  preferredPaymentMethod,
  onSelectPackageToBuy,
  onInitiateBulkCheckout,
  onOpenAccountPrompt,
  onOpenPriceAlertModal,
  onOpenPriceAlertsManager,
  onOpenSignIn,
  onOpenVipUpgradeModal,
  onDiamondsClaimed,
  onAddNotificationToast,
  isLoading = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'popular' | 'passes' | 'large' | 'low_stock'>('all');
  const [quickFilterInstant, setQuickFilterInstant] = useState<boolean>(false);
  const [quickFilterPro, setQuickFilterPro] = useState<boolean>(false);
  const [quickFilterTopRated, setQuickFilterTopRated] = useState<boolean>(false);
  const [quickFilterVerified, setQuickFilterVerified] = useState<boolean>(false);
  const [selectedSellerMap, setSelectedSellerMap] = useState<Record<string, string>>({});
  const [expandedSellerPackageId, setExpandedSellerPackageId] = useState<string | null>(null);
  const [packageQuantities, setPackageQuantities] = useState<Record<string, number>>({});
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);
  const [selectedBulkPackages, setSelectedBulkPackages] = useState<Record<string, boolean>>({});
  const [isProcessingStore, setIsProcessingStore] = useState<boolean>(false);
  const storeTimerRef = useRef<number | null>(null);
  const prevCurrencyRef = useRef<Currency>(currency);

  const triggerStoreSkeletonTransition = (durationMs: number = 280) => {
    if (storeTimerRef.current) {
      window.clearTimeout(storeTimerRef.current);
    }
    setIsProcessingStore(true);
    storeTimerRef.current = window.setTimeout(() => {
      setIsProcessingStore(false);
    }, durationMs);
  };

  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      prevCurrencyRef.current = currency;
      triggerStoreSkeletonTransition(260);
    }
  }, [currency]);

  useEffect(() => {
    return () => {
      if (storeTimerRef.current) {
        window.clearTimeout(storeTimerRef.current);
      }
    };
  }, []);

  const showStoreSkeleton = isLoading || isProcessingStore;

  // Developer & VIP Privilege detection
  const isDev = isDeveloperUser(currentUser);
  const isVip = isVipUser(currentUser);
  const isFreeEligible = isEligibleForFreeEverything(currentUser); // Lead developer free privilege
  const vipClaimStatus = getVipFreeClaimStatus(currentUser);

  const safePackages = packages || [];
  const safeSellers = sellers || [];
  const safeAlerts = priceAlerts || [];

  // Determine if seller qualifies for 'Top-Rated' or 'Verified' badge using sellerRating & completionRate
  const getSellerBadge = (seller?: SellerListing | null): {
    type: 'top_rated' | 'verified';
    label: string;
    tooltip: string;
    badgeClass: string;
    glowClass: string;
  } | null => {
    if (!seller) return null;
    const rating = Number(seller.sellerRating) || 0;
    const completion = Number(seller.completionRate) || 0;

    // Top-Rated Seller: sellerRating >= 4.95 AND completionRate >= 99.5%
    if (rating >= 4.95 && completion >= 99.5) {
      return {
        type: 'top_rated',
        label: 'Top-Rated',
        tooltip: `★ Top-Rated Seller • ${rating.toFixed(2)}/5.00 Rating • ${completion.toFixed(1)}% Completion Rate`,
        badgeClass: 'bg-gradient-to-r from-amber-500/30 via-yellow-500/25 to-amber-600/20 text-amber-300 border-amber-400/90 shadow-md shadow-amber-950/60 ring-1 ring-amber-400/60 font-bold',
        glowClass: 'border-amber-400/60 shadow-amber-500/20',
      };
    }

    // Verified Seller: completionRate >= 99.0% and sellerRating >= 4.80 OR KYC pro seller with >= 98.0%
    if ((rating >= 4.80 && completion >= 99.0) || (seller.isProSeller && completion >= 98.0)) {
      return {
        type: 'verified',
        label: 'Verified',
        tooltip: `✓ Verified Escrow Merchant • ${rating.toFixed(2)}/5.00 Rating • ${completion.toFixed(1)}% Completion Rate`,
        badgeClass: 'bg-gradient-to-r from-cyan-500/25 via-teal-500/25 to-emerald-500/20 text-cyan-300 border-cyan-400/80 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/60 font-bold',
        glowClass: 'border-cyan-400/60 shadow-cyan-500/20',
      };
    }

    return null;
  };

  // Check if a seller satisfies active quick filters
  const passesQuickFilters = (seller?: SellerListing | null): boolean => {
    if (!seller) return false;
    if (quickFilterInstant && !seller.instantAutoDelivery) return false;
    if (quickFilterPro && !seller.isProSeller) return false;
    if (quickFilterTopRated && !(seller.sellerRating >= 4.95 && seller.completionRate >= 99.5)) return false;
    if (quickFilterVerified && !((seller.sellerRating >= 4.80 && seller.completionRate >= 99.0) || (seller.isProSeller && seller.completionRate >= 98.0))) return false;
    return true;
  };

  // Find best or selected seller for each package (prioritizing active quick filters & badges)
  const getSellerForPackage = (pkg: DiamondPackage): SellerListing => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    const selectedId = selectedSellerMap[pkg.id];
    if (selectedId) {
      const found = safeSellers.find((s) => s.id === selectedId);
      if (found && (!quickFilterInstant && !quickFilterPro && !quickFilterTopRated && !quickFilterVerified ? true : passesQuickFilters(found))) {
        return found;
      }
    }

    // Match seller with package, prioritizing active quick filters
    if (matchingSellers.length > 0) {
      if (quickFilterInstant || quickFilterPro || quickFilterTopRated || quickFilterVerified) {
        const filteredMatch = matchingSellers.find((s) => passesQuickFilters(s));
        if (filteredMatch) return filteredMatch;
      }
      // Prioritize Top-Rated first, then Verified
      const topRatedMatch = matchingSellers.find((s) => s.sellerRating >= 4.95 && s.completionRate >= 99.5);
      if (topRatedMatch) return topRatedMatch;
      const verifiedMatch = matchingSellers.find((s) => (s.sellerRating >= 4.80 && s.completionRate >= 99.0) || s.isProSeller);
      if (verifiedMatch) return verifiedMatch;
      return matchingSellers[0];
    }

    const base = safeSellers[0];
    if (base) {
      return {
        ...base,
        id: `listing_matched_${pkg.id}`,
        packageId: pkg.id,
        diamonds: pkg.diamonds,
        priceUsd: pkg.discountPriceUsd,
        pricePhp: pkg.pricePhp,
      };
    }
    return safeSellers[0];
  };

  // Calculate dynamic total inventory count across all sellers for a package
  const getPackageTotalStock = (pkg: DiamondPackage): { totalStock: number; sellerCount: number } => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      const total = matchingSellers.reduce((sum, s) => sum + (Number(s.stock) || 0), 0);
      return { totalStock: total, sellerCount: matchingSellers.length };
    }
    const defaultSeller = getSellerForPackage(pkg);
    return { totalStock: defaultSeller?.stock || 0, sellerCount: defaultSeller ? 1 : 0 };
  };

  const handleUpdateQuantity = (pkgId: string, delta: number) => {
    playUiClickSound();
    setPackageQuantities((prev) => {
      const current = prev[pkgId] || 1;
      const targetPkg = safePackages.find((p) => p.id === pkgId);
      const stockMax = targetPkg ? getPackageTotalStock(targetPkg).totalStock : 50;
      const effectiveMax = stockMax > 0 ? Math.min(50, stockMax) : 50;
      const next = Math.max(1, Math.min(effectiveMax, current + delta));
      return { ...prev, [pkgId]: next };
    });
  };

  const handleSetQuantity = (pkgId: string, qty: number) => {
    playUiClickSound();
    const targetPkg = safePackages.find((p) => p.id === pkgId);
    const stockMax = targetPkg ? getPackageTotalStock(targetPkg).totalStock : 50;
    const effectiveMax = stockMax > 0 ? Math.min(50, stockMax) : 50;
    setPackageQuantities((prev) => ({
      ...prev,
      [pkgId]: Math.max(1, Math.min(effectiveMax, qty)),
    }));
  };

  // Bulk Selection Handlers
  const handleToggleBulkPackage = (pkgId: string) => {
    playDiamondChimeSound();
    setSelectedBulkPackages((prev) => {
      const isCurrentlySelected = Boolean(prev[pkgId]);
      const next = { ...prev, [pkgId]: !isCurrentlySelected };
      if (!isCurrentlySelected) {
        setIsBulkMode(true);
      }
      return next;
    });
  };

  const handleSelectPresetBulk = (preset: 'all_passes' | 'popular_bundle' | 'clear') => {
    if (preset === 'clear') {
      setSelectedBulkPackages({});
      return;
    }
    if (preset === 'all_passes') {
      const passMap: Record<string, boolean> = {};
      safePackages.filter((p) => p.isPass).forEach((p) => {
        passMap[p.id] = true;
      });
      setSelectedBulkPackages(passMap);
      setIsBulkMode(true);
      return;
    }
    if (preset === 'popular_bundle') {
      const bundleMap: Record<string, boolean> = {};
      const targetIds = ['pkg_86', 'pkg_257', 'pkg_706', 'pkg_wdp'];
      safePackages.filter((p) => targetIds.includes(p.id)).forEach((p) => {
        bundleMap[p.id] = true;
      });
      setSelectedBulkPackages(bundleMap);
      setIsBulkMode(true);
      return;
    }
  };

  // Build the list of active bulk items
  const bulkSelectedItems = safePackages
    .filter((pkg) => selectedBulkPackages[pkg.id])
    .map((pkg) => ({
      package: pkg,
      seller: getSellerForPackage(pkg),
      quantity: packageQuantities[pkg.id] || 1,
    }));

  const bulkAggregatePricing = calculateMultiPackagePricing(
    bulkSelectedItems.map((item) => ({
      package: item.package,
      quantity: item.quantity,
      customUnitPriceUsd: item.seller.priceUsd,
      customUnitPricePhp: item.seller.pricePhp,
    })),
    preferredPaymentMethod,
    Boolean(isVip && !isDev)
  );

  const bulkSelectedCount = bulkSelectedItems.length;

  const handleTriggerBulkCheckout = () => {
    if (bulkSelectedItems.length === 0) return;
    if (onInitiateBulkCheckout) {
      onInitiateBulkCheckout(bulkSelectedItems);
    } else {
      // Fallback to first item if not supplied
      onSelectPackageToBuy(bulkSelectedItems[0].package, bulkSelectedItems[0].seller, bulkSelectedItems[0].quantity);
    }
  };

  const activeAlertsCount = safeAlerts.filter((a) => a && a.isActive).length;

  const lowStockCount = safePackages.filter((p) => {
    const { totalStock } = getPackageTotalStock(p);
    return totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;
  }).length;

  // Check if a package has at least one seller matching active quick filters
  const packageMatchesQuickFilters = (pkg: DiamondPackage): boolean => {
    if (!quickFilterInstant && !quickFilterPro && !quickFilterTopRated && !quickFilterVerified) return true;
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      return matchingSellers.some((s) => passesQuickFilters(s));
    }
    const defaultSeller = getSellerForPackage(pkg);
    return passesQuickFilters(defaultSeller);
  };

  // Pre-calculated package counts for Quick Filter buttons
  const instantDeliveryPackageCount = safePackages.filter((pkg) => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      return matchingSellers.some((s) => s.instantAutoDelivery);
    }
    return Boolean(getSellerForPackage(pkg)?.instantAutoDelivery);
  }).length;

  const proSellerPackageCount = safePackages.filter((pkg) => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      return matchingSellers.some((s) => s.isProSeller);
    }
    return Boolean(getSellerForPackage(pkg)?.isProSeller);
  }).length;

  const topRatedPackageCount = safePackages.filter((pkg) => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      return matchingSellers.some((s) => s.sellerRating >= 4.95 && s.completionRate >= 99.5);
    }
    const defaultSeller = getSellerForPackage(pkg);
    return Boolean(defaultSeller && defaultSeller.sellerRating >= 4.95 && defaultSeller.completionRate >= 99.5);
  }).length;

  const verifiedPackageCount = safePackages.filter((pkg) => {
    const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
    if (matchingSellers.length > 0) {
      return matchingSellers.some((s) => (s.sellerRating >= 4.80 && s.completionRate >= 99.0) || s.isProSeller);
    }
    const defaultSeller = getSellerForPackage(pkg);
    return Boolean(defaultSeller && ((defaultSeller.sellerRating >= 4.80 && defaultSeller.completionRate >= 99.0) || defaultSeller.isProSeller));
  }).length;

  const filteredPackages = safePackages.filter((pkg) => {
    if (!pkg) return false;
    if (filterCategory === 'low_stock') {
      const { totalStock } = getPackageTotalStock(pkg);
      return totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;
    }
    if (filterCategory === 'popular') {
      return (
        pkg.popular ||
        pkg.badge === 'Popular' ||
        pkg.badge === 'Best Value' ||
        pkg.id === 'pkg_86' ||
        pkg.id === 'pkg_257' ||
        pkg.id === 'pkg_wdp' ||
        pkg.id === 'pkg_706'
      );
    }
    if (filterCategory === 'passes') return pkg.isPass;
    if (filterCategory === 'large') return pkg.diamonds >= 2000;
    
    // Apply Quick Filters (Instant Delivery / Pro Seller / Top-Rated / Verified)
    if (!packageMatchesQuickFilters(pkg)) return false;

    return true;
  });

  // Must strictly start with low diamond tiers and end with the highest diamond package
  const sortedPackages = [...filteredPackages].sort((a, b) => a.diamonds - b.diamonds);
  const highestDiamondInStore = safePackages.reduce((max, p) => (p.diamonds > max ? p.diamonds : max), 5532);

  return (
    <section className="py-8">
      {/* 5-Step Easy Escrow Buying Guide */}
      <div id="five-step-buying-guide" className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#071120] via-slate-900 to-[#0c182d] border border-cyan-500/40 shadow-xl shadow-cyan-950/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-black text-xs font-mono shadow-sm">
              5
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                <span>5 Easy Steps to Buy Mobile Legends Diamonds</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                  Buyer Protection Active
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Follow these 5 simple steps for instant delivery, zero ban risk, and 100% money-back escrow protection.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aegis Escrow Vault Active</span>
          </div>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Step 1 */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  STEP 1
                </span>
                <UserCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                1. Enter MLBB IDs
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Provide your User ID & Zone ID. Auto-verified via official Moonton API before purchase.
              </p>
            </div>
            {verifiedAccount ? (
              <div className="mt-2 text-[10px] font-mono text-emerald-300 flex items-center gap-1 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50 truncate">
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{verifiedAccount.ign}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAccountPrompt}
                className="mt-2 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer text-left"
              >
                + Check Account ID
              </button>
            )}
          </div>

          {/* Step 2 */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  STEP 2
                </span>
                <Gem className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                2. Select Package
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Priced from 10 💎 starter packs up to the highest 5,532+ 💎 wholesale whale bundles.
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
              Starts 10 💎 → Ends 5,532 💎
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">
                  STEP 3
                </span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                3. Choose Seller
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Look for the <strong className="text-amber-300">Top-Rated</strong> (★ 4.95+) or <strong className="text-cyan-300">Verified</strong> badges on each deal.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[9px] font-mono">
              <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">Top-Rated</span>
              <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold">Verified</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  STEP 4
                </span>
                <Lock className="w-4 h-4 text-emerald-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                4. Safe Escrow Pay
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pay with GCash, Maya, Cards, or USDT into Aegis Vault. Seller is NEVER paid upfront!
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/60">
              0% Fee · 100% Locked
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 relative group hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                  STEP 5
                </span>
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                5. Verify & Release
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Diamonds arrive in 1–3 mins. Inspect in Mobile Legends and confirm receipt, or get 100% refund.
              </p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/60">
              1–3 mins · Zero Risk
            </div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <span>Verified Official Distribution</span>
            <span aria-hidden="true">·</span>
            <span>Escrow Guaranteed</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Mobile Legends Diamond Top-Up Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official server recharge via Moonton User ID. 0% account ban risk. Real money payment held until credited.
          </p>
        </div>

        {/* Filter Segmented Control & Price Alerts Manager */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Bulk Checkout Mode Toggle Button */}
          <button
            type="button"
            id="btn-toggle-bulk-mode"
            onClick={() => setIsBulkMode((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
              isBulkMode || bulkSelectedCount > 0
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-cyan-500/50'
            }`}
            title="Toggle multi-package selection for a single bulk escrow transaction"
          >
            <Layers className={`w-3.5 h-3.5 ${isBulkMode || bulkSelectedCount > 0 ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span>Bulk Checkout</span>
            {bulkSelectedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-slate-950 text-cyan-300">
                {bulkSelectedCount}
              </span>
            )}
          </button>

          {onOpenPriceAlertsManager && (
            <button
              onClick={onOpenPriceAlertsManager}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Manage your automated diamond price alerts"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-400" />
              <span>Price Alerts</span>
              {activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-amber-500 text-slate-950">
                  {activeAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Live Social Proof & Conversion Velocity Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>⚡ 99.8% delivered in &lt;90 sec</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto max-w-full">
            <button
              onClick={() => {
                if (filterCategory !== 'all') triggerStoreSkeletonTransition(240);
                setFilterCategory('all');
              }}
              className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Packs ({packages.length})
            </button>
            <button
              onClick={() => {
                if (filterCategory !== 'popular') triggerStoreSkeletonTransition(240);
                setFilterCategory('popular');
              }}
              className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === 'popular'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Popular & Best Value
            </button>
            <button
              onClick={() => {
                if (filterCategory !== 'passes') triggerStoreSkeletonTransition(240);
                setFilterCategory('passes');
              }}
              className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === 'passes'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Passes (WDP)
            </button>
            <button
              onClick={() => {
                if (filterCategory !== 'large') triggerStoreSkeletonTransition(240);
                setFilterCategory('large');
              }}
              className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterCategory === 'large'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Whale Packs (2k+)
            </button>
            {lowStockCount > 0 && (
              <button
                id="filter-tab-low-stock"
                onClick={() => {
                  if (filterCategory !== 'low_stock') triggerStoreSkeletonTransition(240);
                  setFilterCategory('low_stock');
                }}
                className={`px-3 py-2 min-h-[38px] text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  filterCategory === 'low_stock'
                    ? 'bg-rose-500 text-white font-bold shadow-sm'
                    : 'text-rose-300 hover:text-white'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Low Stock ({lowStockCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Country & Local Currency Buyer Reassurance Banner */}
      <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0c1424] to-slate-900 border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-2xl select-none" role="img" aria-label={CURRENCY_RATES[currency]?.country}>
            {CURRENCY_RATES[currency]?.flag}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">
                Viewing diamond packages in {CURRENCY_RATES[currency]?.country}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                {CURRENCY_RATES[currency]?.symbol} {currency}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                {CURRENCY_RATES[currency]?.region}
              </span>
              {CURRENCY_RATES[currency]?.mlbbLeague && (
                <span className="text-[10px] font-mono text-amber-300 hidden sm:inline">
                  🏆 {CURRENCY_RATES[currency]?.mlbbLeague}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live rate: 1 USD ≈ {CURRENCY_RATES[currency]?.symbol} {CURRENCY_RATES[currency]?.rate.toLocaleString()} · Zero foreign conversion markup · 100% Escrow Guarantee
            </p>
          </div>
        </div>

        {setCurrency && (
          <div className="flex items-center gap-2 flex-wrap self-stretch lg:self-auto justify-start lg:justify-end">
            <CountrySelectorDropdown
              currency={currency}
              onSelectCurrency={setCurrency}
              isCompact={false}
            />
          </div>
        )}
      </div>

      {/* Target MLBB ID Banner */}
      <div className="mb-6 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DiamondImage size="sm" showGlow alt="MLBB Diamonds" className="rounded-lg shadow-sm" />
          <div className="text-xs">
            {verifiedAccount ? (
              <div>
                <span className="text-slate-400">Recharging MLBB Account: </span>
                <span className="font-bold text-white font-mono">{verifiedAccount.ign}</span>
                <span className="text-cyan-400 font-mono ml-2">({verifiedAccount.userId} / {verifiedAccount.zoneId})</span>
              </div>
            ) : (
              <div>
                <span className="text-slate-300 font-medium">No MLBB Account verified yet.</span>
                <span className="text-slate-400 ml-1.5">You can enter your User ID & Zone ID during checkout or test in the hero box.</span>
              </div>
            )}
          </div>
        </div>

        {verifiedAccount ? (
          <button
            onClick={onOpenAccountPrompt}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Change Account</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={onOpenAccountPrompt}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Set MLBB User ID</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 12:00 PM & 12:00 AM Free Diamond Drop (10 to 50 💎 for Buyer & VIP) */}
      <TimedDiamondDropCard
        currentUser={currentUser}
        verifiedAccount={verifiedAccount}
        currency={currency}
        onOpenAccountPrompt={onOpenAccountPrompt}
        onDiamondsClaimed={onDiamondsClaimed}
        onAddNotificationToast={onAddNotificationToast}
      />

      {/* Lead Developer 100% Free Privileges Banner */}
      {isDev && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-amber-950/80 border border-amber-400/70 shadow-xl shadow-purple-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-purple-500/30 border border-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">Lead Developer 100% Free Privileges Active</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ₱0.00 ZERO PAYMENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  ALL PACKAGES 100% FREE
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Recognized Lead Developer <strong className="text-amber-300 font-semibold">RALPH JAYCOB BARRAMEDA</strong> ({currentUser?.email || 'barramedajacob36@gmail.com'}). Full zero-payment exemption on all diamond packages!
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-mono text-amber-300/90 block">Developer Exemption</span>
            <span className="text-xs font-bold text-amber-200 font-mono">100% Free (₱0.00 · No Payment)</span>
          </div>
        </div>
      )}

      {/* VIP Mythic Active Privileges Banner - Exclusively visible to VIP Members */}
      {isVip && !isDev && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-[#141b2e] border border-amber-400/80 shadow-xl shadow-amber-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">👑 VIP Mythic Privileges Active</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-sm">
                  VIP BADGE VERIFIED
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  50% STOREWIDE DISCOUNT ACTIVE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  AUTHORIZED SELLER CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Free Diamonds (172 💎): <strong className="text-amber-300">{vipClaimStatus.claimsUsed} of {VIP_FREE_CLAIM_LIMIT} free claims used</strong>.
                {vipClaimStatus.cooldownRemainingMs > 0 ? (
                  <span className="text-amber-300 ml-1 font-semibold">
                    (1 day wait active: next free claim in {vipClaimStatus.cooldownRemainingFormatted})
                  </span>
                ) : vipClaimStatus.claimsUsed < VIP_FREE_CLAIM_LIMIT ? (
                  <span className="text-emerald-400 ml-1 font-semibold">
                    (1 free claim ready now on 172 💎!)
                  </span>
                ) : (
                  <span className="text-slate-400 ml-1">
                    (Free quota complete — your permanent 50% discount applies to all diamond packages!)
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/30">
            <span className="text-[10px] uppercase font-mono text-amber-300/90 font-bold block">VIP Benefits</span>
            <span className="text-xs font-bold text-amber-200 font-mono">50% OFF All Diamond Packs</span>
          </div>
        </div>
      )}

      {/* Beginner VIP Upgrade Prompt Banner - Visible to non-VIP / non-Developer users */}
      {!isDev && !isVip && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/40 border-2 border-amber-500/60 shadow-xl shadow-amber-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">Experience Free Diamonds & 50% OFF with VIP</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm">
                  👑 VIP BADGE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  172 💎 FREE (LIMIT 2)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  50% STOREWIDE OFF
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold">
                  SELLER PORTAL CLEARANCE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Beginners can experience exclusive free diamonds (172 💎, limit 2 with 1 day wait), 50% discount when buying diamonds, clearance to sell in the Seller Portal, and your official VIP Badge for only <strong className="text-amber-300 font-bold">₱950 Pesos</strong> (convertible to any country's currency)!
              </p>
            </div>
          </div>
          <button
            type="button"
            id="store-btn-upgrade-vip"
            onClick={onOpenVipUpgradeModal}
            className="px-4 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all shrink-0 whitespace-nowrap"
          >
            <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Upgrade to VIP (₱950)</span>
          </button>
        </div>
      )}

      {/* GCash 15% Big Diamond Promotional Banner */}
      <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center shrink-0">
            <span className="text-base select-none">🇵🇭</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">GCash Special: 15% Below for Big Diamonds</span>
              <span className="text-[10px] font-mono font-bold bg-blue-500 text-white px-1.5 py-0.2 rounded">
                15% OFF (700+ 💎)
              </span>
            </div>
            <p className="text-[11px] text-cyan-300/80">
              Pay via GCash when buying 700+ diamonds (or bulk total) to automatically receive our exclusive 15% discount.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded">
            Instant Escrow Validated
          </span>
        </div>
      </div>

      {/* Guest Sign-In Required for Escrow Banner */}
      {!currentUser && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900/90 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Sign In Required to Order with Escrow
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Escrow Vault Security
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                First of all, you need to sign in so you can order with Escrow. The Aegis Escrow Vault secures your payment and guarantees 100% in-game delivery to your MLBB ID.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenSignIn) {
                onOpenSignIn();
              } else {
                onSelectPackageToBuy(packages[0], sellers[0], 1);
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-md shadow-amber-500/25 flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-slate-950" />
            <span>Sign In to Order with Escrow</span>
          </button>
        </div>
      )}

      {/* Quick Filter Bar: Instant Delivery & Pro Seller */}
      <div className="mb-6 p-3 sm:p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="uppercase font-mono tracking-wider text-[11px] text-slate-400">Quick Filter:</span>
          </div>

          {/* Instant Delivery Filter Toggle */}
          <button
            type="button"
            id="filter-instant-delivery"
            onClick={() => {
              playUiClickSound();
              triggerStoreSkeletonTransition(220);
              setQuickFilterInstant((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              quickFilterInstant
                ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-yellow-500/20 text-amber-300 border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/60 font-bold'
                : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title="Filter by listings with Instant Delivery enabled (automated ~1-2m direct API dispatch)"
          >
            <div className={`w-2 h-2 rounded-full ${quickFilterInstant ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
            <Zap className={`w-3.5 h-3.5 ${quickFilterInstant ? 'text-amber-400 fill-amber-400/40' : 'text-amber-400'}`} />
            <span>Instant Delivery</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                quickFilterInstant
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {instantDeliveryPackageCount}
            </span>
          </button>

          {/* Top-Rated Filter Toggle */}
          <button
            type="button"
            id="filter-top-rated-seller"
            onClick={() => {
              playUiClickSound();
              triggerStoreSkeletonTransition(220);
              setQuickFilterTopRated((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              quickFilterTopRated
                ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/15 text-amber-300 border-amber-400 shadow-md shadow-amber-950/40 ring-1 ring-amber-400/60 font-bold'
                : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title="Filter by packages with Top-Rated Sellers (★ 4.95+ rating & 99.5%+ completion rate)"
          >
            <div className={`w-2 h-2 rounded-full ${quickFilterTopRated ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`} />
            <Star className={`w-3.5 h-3.5 ${quickFilterTopRated ? 'text-amber-400 fill-amber-400' : 'text-amber-400'}`} />
            <span>Top-Rated (★ 4.95+)</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                quickFilterTopRated
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {topRatedPackageCount}
            </span>
          </button>

          {/* Verified Seller Filter Toggle */}
          <button
            type="button"
            id="filter-verified-seller"
            onClick={() => {
              playUiClickSound();
              triggerStoreSkeletonTransition(220);
              setQuickFilterVerified((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              quickFilterVerified
                ? 'bg-gradient-to-r from-cyan-500/25 via-teal-500/20 to-emerald-500/15 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400/60 font-bold'
                : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title="Filter by packages fulfilled by Verified Merchants (99.0%+ completion rate or KYC Verified)"
          >
            <div className={`w-2 h-2 rounded-full ${quickFilterVerified ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            <ShieldCheck className={`w-3.5 h-3.5 ${quickFilterVerified ? 'text-cyan-400' : 'text-cyan-400'}`} />
            <span>Verified Only</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                quickFilterVerified
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {verifiedPackageCount}
            </span>
          </button>

          {/* Pro Seller Filter Toggle */}
          <button
            type="button"
            id="filter-pro-seller"
            onClick={() => {
              playUiClickSound();
              triggerStoreSkeletonTransition(220);
              setQuickFilterPro((prev) => !prev);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border ${
              quickFilterPro
                ? 'bg-gradient-to-r from-emerald-500/25 via-emerald-500/15 to-teal-500/20 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/60 font-bold'
                : 'bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title="Filter by packages fulfilled by KYC-verified Pro Sellers with 99.8%+ completion rating"
          >
            <div className={`w-2 h-2 rounded-full ${quickFilterPro ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <ShieldCheck className={`w-3.5 h-3.5 ${quickFilterPro ? 'text-emerald-400' : 'text-emerald-400'}`} />
            <span>Pro Seller</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                quickFilterPro
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {proSellerPackageCount}
            </span>
          </button>

          {/* Reset Quick Filters if active */}
          {(quickFilterInstant || quickFilterPro || quickFilterTopRated || quickFilterVerified) && (
            <button
              type="button"
              id="btn-reset-quick-filters"
              onClick={() => {
                playUiClickSound();
                triggerStoreSkeletonTransition(220);
                setQuickFilterInstant(false);
                setQuickFilterPro(false);
                setQuickFilterTopRated(false);
                setQuickFilterVerified(false);
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-800/60 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset quick filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Live Matching Summary & Sync Inventory Action */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono self-end md:self-auto">
          <span className="text-slate-500">Matching:</span>
          <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {filteredPackages.length} of {safePackages.length} packs
          </span>
          <button
            type="button"
            onClick={() => triggerStoreSkeletonTransition(450)}
            disabled={showStoreSkeleton}
            className="px-2 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 flex items-center gap-1 text-[10px] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh live diamond inventory & seller rates"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${showStoreSkeleton ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{showStoreSkeleton ? 'Syncing...' : 'Refresh Stock'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Mode Banner & Quick Presets */}
      {(isBulkMode || bulkSelectedCount > 0) && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-900 border border-cyan-500/40 shadow-lg shadow-cyan-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Bulk Escrow Ordering Mode
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  {bulkSelectedCount} Package{bulkSelectedCount !== 1 ? 's' : ''} Selected ({bulkAggregatePricing.totalUnitsCount} Units)
                </span>
                {bulkAggregatePricing.hasBulkDiscount && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    5% Wholesale Tier Active (5,000+ 💎)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Check multiple packages below to consolidate into a single multi-item escrow transaction. One checkout locks the entire bundle safely into Escrow Vault.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => handleSelectPresetBulk('all_passes')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/80 hover:border-cyan-600 transition-colors cursor-pointer"
            >
              + All Passes
            </button>
            <button
              type="button"
              onClick={() => handleSelectPresetBulk('popular_bundle')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/80 hover:border-amber-600 transition-colors cursor-pointer"
            >
              + Top 3 Value Packs
            </button>
            {bulkSelectedCount > 0 && (
              <button
                type="button"
                onClick={() => handleSelectPresetBulk('clear')}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBulkMode(false)}
              className="px-2 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Bulk Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Packages Grid, Skeleton Loader, or Empty Filter State */}
      {showStoreSkeleton ? (
        <PackageStoreSkeleton count={Math.max(4, Math.min(8, sortedPackages.length || 8))} />
      ) : filteredPackages.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-3 my-8 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-white">No Packages Match Active Filters</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            No diamond packages match your filter criteria ({quickFilterInstant && quickFilterPro ? 'Instant Delivery & Pro Seller' : quickFilterInstant ? 'Instant Delivery' : quickFilterPro ? 'Pro Seller' : filterCategory}). Try clearing quick filters or choosing another category.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                playUiClickSound();
                triggerStoreSkeletonTransition(220);
                setQuickFilterInstant(false);
                setQuickFilterPro(false);
                setFilterCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-16">
          {sortedPackages.map((pkg) => {
          const seller = getSellerForPackage(pkg);
          const sellerBadge = getSellerBadge(seller);
          const matchingSellers = safeSellers.filter((s) => s.packageId === pkg.id);
          const isSellerDrawerOpen = expandedSellerPackageId === pkg.id;
          const isHighestDiamond = pkg.diamonds === highestDiamondInStore;
          const { totalStock, sellerCount } = getPackageTotalStock(pkg);
          const isLowStock = totalStock > 0 && totalStock <= LOW_STOCK_THRESHOLD;
          const isOutOfStock = totalStock <= 0;
          const isSelectedInBulk = Boolean(selectedBulkPackages[pkg.id]);

          const freeStatus = isPackageFreeForUser(pkg, currentUser);
          const isFreeDiamondTier = pkg.diamonds === 172;
          const isPkg100PercentFree = isDev || (isVip && freeStatus.isVipFree);

          const matchedAlert = priceAlerts.find((a) => a.packageId === pkg.id);
          const quantity = packageQuantities[pkg.id] || 1;
          const pricing = calculatePackagePricing(
            pkg,
            quantity,
            preferredPaymentMethod,
            seller.priceUsd,
            seller.pricePhp,
            Boolean(isVip && !isDev)
          );

          const savingsPct = Math.round(
            ((pricing.regularSubtotalUsd - pricing.subtotalUsd) / pricing.regularSubtotalUsd) * 100
          );

          // Categorize top-selling packages for guidance badges
          const isBestValue =
            pkg.badge?.toLowerCase() === 'best value' ||
            pkg.id === 'pkg_wdp' ||
            pkg.id === 'pkg_706';

          const isPopular =
            !isBestValue &&
            (pkg.badge?.toLowerCase() === 'popular' ||
              pkg.id === 'pkg_86' ||
              pkg.id === 'pkg_257' ||
              (pkg.popular && !pkg.badge?.includes('Piso')));

          return (
            <div
              key={pkg.id}
              id={`package-card-${pkg.id}`}
              className={`group relative rounded-xl transition-all duration-200 ease-out hover:scale-[1.02] hover:-translate-y-0.5 p-5 flex flex-col justify-between ${
                isHighestDiamond
                  ? 'bg-gradient-to-b from-[#161d30] via-slate-900 to-[#0e1626] border-2 border-amber-400/90 ring-2 ring-amber-400/50 shadow-2xl shadow-amber-950/70 hover:border-amber-300'
                  : isSelectedInBulk
                  ? 'bg-gradient-to-b from-cyan-950/50 via-slate-900 to-slate-900 border-cyan-400 ring-2 ring-cyan-400/80 shadow-xl shadow-cyan-950/60'
                  : isLowStock
                  ? 'bg-gradient-to-b from-rose-950/20 via-slate-900/80 to-slate-900 border-rose-500/60 hover:border-rose-400 ring-1 ring-rose-500/30 shadow-lg shadow-rose-950/30 hover:shadow-rose-500/20'
                  : isBestValue
                  ? 'bg-gradient-to-b from-amber-950/25 via-slate-900/80 to-slate-900 border-amber-500/60 hover:border-amber-400 ring-1 ring-amber-500/30 shadow-lg shadow-amber-950/30 hover:shadow-amber-500/20'
                  : isPopular
                  ? 'bg-gradient-to-b from-cyan-950/25 via-slate-900/80 to-slate-900 border-cyan-500/60 hover:border-cyan-400 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-950/30 hover:shadow-cyan-500/20'
                  : pricing.hasBulkDiscount
                  ? 'bg-slate-900/70 hover:bg-slate-900 border-amber-500/50 shadow-lg shadow-amber-950/20 hover:shadow-amber-500/20'
                  : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/40'
              }`}
            >
              {/* Subtle top edge accent for highlighted packages */}
              {isHighestDiamond ? (
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-100 pointer-events-none" />
              ) : isSelectedInBulk ? (
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-100 pointer-events-none" />
              ) : isLowStock ? (
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80 pointer-events-none" />
              ) : isBestValue ? (
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 pointer-events-none" />
              ) : isPopular ? (
                <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 pointer-events-none" />
              ) : null}

              {/* Top Row: Multi-select Checkbox, Diamond count & Savings */}
              <div>
                {/* Multi-Select Bulk Toggle Button (Always visible when in bulk mode, or on hover / when selected) */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <button
                    type="button"
                    id={`chk-bulk-${pkg.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBulkPackage(pkg.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelectedInBulk
                        ? 'bg-cyan-500 text-slate-950 font-bold border border-cyan-400 shadow-sm'
                        : isBulkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                        : 'opacity-70 group-hover:opacity-100 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                    title={isSelectedInBulk ? 'Remove from bulk bundle' : 'Select for multi-item bulk checkout'}
                  >
                    {isSelectedInBulk ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-slate-950" />
                        <span>In Bulk ({quantity}x)</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select Bulk</span>
                      </>
                    )}
                  </button>

                  {savingsPct > 0 && !isSelectedInBulk && (
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                      Save {savingsPct}%
                    </span>
                  )}
                </div>
                {/* Badges container */}
                <div className="absolute -top-2.5 right-4 z-10 flex items-center gap-1.5 flex-wrap justify-end">
                  {/* Highest Diamond Whale Tier Badge */}
                  {isHighestDiamond && (
                    <span
                      id={`badge-highest-diamond-${pkg.id}`}
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/40 border border-amber-200 flex items-center gap-1 animate-pulse"
                      title="Highest Diamond Pack Tier (5,532 + 650 Bonus = 6,182 💎)"
                    >
                      <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                      <span>👑 HIGHEST DIAMOND TIER</span>
                    </span>
                  )}
                  {/* Dynamic Low Stock Label */}
                  {isLowStock && (
                    <span
                      id={`badge-low-stock-${pkg.id}`}
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 text-white shadow-md shadow-rose-950/40 border border-rose-300/40 flex items-center gap-1 animate-pulse"
                      title={`Dynamic Low Stock Alert: Only ${totalStock} units available across all ${sellerCount} verified sellers`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5 text-white fill-white/20" />
                      <span>Low Stock ({totalStock} left)</span>
                    </span>
                  )}
                  {isOutOfStock && (
                    <span
                      id={`badge-out-of-stock-${pkg.id}`}
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"
                    >
                      <span>Out of Stock</span>
                    </span>
                  )}
                  {/* Free & Discount Badges: Developer vs VIP vs Beginner */}
                  {isDev ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-purple-500 to-cyan-400 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      <span>{isBigDiamondPackage(pkg) ? '👑 DEV BIG 💎 100% FREE' : '👑 DEV 100% FREE'}</span>
                    </span>
                  ) : isPkg100PercentFree ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1 animate-pulse">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      <span>👑 VIP 100% FREE ({freeStatus.status.claimsUsed + 1}/{VIP_FREE_CLAIM_LIMIT})</span>
                    </span>
                  ) : isVip && isFreeDiamondTier && freeStatus.status.cooldownRemainingMs > 0 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>VIP Wait {freeStatus.status.cooldownRemainingFormatted} (50% OFF)</span>
                    </span>
                  ) : isVip && isFreeDiamondTier && freeStatus.status.claimsUsed >= VIP_FREE_CLAIM_LIMIT ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      <span>VIP Quota 2/2 Complete (50% OFF)</span>
                    </span>
                  ) : isVip ? (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1">
                      <Crown className="w-2.5 h-2.5 fill-slate-950" />
                      <span>👑 50% VIP OFF</span>
                    </span>
                  ) : isFreeDiamondTier ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenVipUpgradeModal?.();
                      }}
                      className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/30 text-amber-300 border border-amber-400/80 shadow-sm flex items-center gap-1 hover:brightness-110 cursor-pointer"
                      title="Upgrade to VIP (₱950) to claim this for ₱0.00 FREE!"
                    >
                      <Crown className="w-2.5 h-2.5 text-amber-400" />
                      <span>FREE for VIP (₱950)</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-amber-300/80 border border-amber-500/30 flex items-center gap-1">
                      <span>👑 50% OFF with VIP</span>
                    </span>
                  )}
                  {pricing.hasBulkDiscount && !isPkg100PercentFree && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md border border-amber-300 flex items-center gap-1 animate-pulse-subtle">
                      <Sparkles className="w-2.5 h-2.5 fill-slate-950" />
                      <span>Bulk Tier: 5% OFF</span>
                    </span>
                  )}
                  {!isPkg100PercentFree && pkg.diamonds >= GCASH_BIG_DIAMOND_THRESHOLD && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-950/90 text-cyan-300 border border-cyan-500/60 shadow-sm flex items-center gap-1">
                      <span>💙 GCash: 15% OFF</span>
                    </span>
                  )}
                  {isBestValue && !isHighestDiamond ? (
                    <span
                      id={`badge-best-value-${pkg.id}`}
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-md shadow-amber-500/30 border border-amber-200 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>Best Value</span>
                    </span>
                  ) : isPopular && !isHighestDiamond ? (
                    <span
                      id={`badge-popular-${pkg.id}`}
                      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-orange-500/30 border border-orange-200 flex items-center gap-1"
                    >
                      <Flame className="w-3 h-3 fill-slate-950 text-slate-950" />
                      <span>Popular</span>
                    </span>
                  ) : pkg.badge ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm border border-cyan-300/40">
                      {pkg.badge}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <DiamondImage
                      packageData={pkg}
                      size="md"
                      showGlow
                      className="rounded-xl border-cyan-500/40 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-md shadow-cyan-950/50"
                      alt={`${pkg.name} High Quality 3D MLBB Diamond`}
                    />
                    <div>
                      <h3 className="font-bold text-base text-white leading-tight">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-mono">
                        <span>{pkg.diamonds} Base</span>
                        {pkg.bonusDiamonds > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-cyan-300 font-semibold">+{pkg.bonusDiamonds} Bonus</span>
                          </>
                        )}
                      </div>
                      {isLowStock && (
                        <div className="mt-1 text-[10px] font-semibold text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>Low Stock Alert</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-rose-300/90 font-mono">
                            Only {totalStock} units left across {sellerCount} seller{sellerCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {isBestValue && (
                        <div className="mt-1 text-[10px] font-semibold text-amber-300/90 flex items-center gap-1">
                          <span>★ Top Value Pick</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 font-normal">Highest diamond efficiency</span>
                        </div>
                      )}
                      {isPopular && (
                        <div className="mt-1 text-[10px] font-semibold text-orange-300/90 flex items-center gap-1">
                          <span>🔥 Community Favorite</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 font-normal">Fast-credit top seller</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {savingsPct > 0 && (
                    <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded">
                      -{savingsPct}%
                    </span>
                  )}
                </div>

                {/* Quantity Selector Stepper & Quick Volume Pills - Mobile Touch Optimized */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs text-slate-300 font-semibold">Quantity:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        id={`btn-qty-dec-${pkg.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateQuantity(pkg.id, -1);
                        }}
                        disabled={quantity <= 1}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center font-bold text-xs transition-all cursor-pointer border border-slate-700"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-11 h-8 flex items-center justify-center font-mono font-bold text-xs text-white bg-slate-950 rounded-lg border border-slate-800">
                        {quantity}x
                      </span>
                      <button
                        type="button"
                        id={`btn-qty-inc-${pkg.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateQuantity(pkg.id, 1);
                        }}
                        disabled={quantity >= 50}
                        className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-slate-800 text-white flex items-center justify-center font-bold text-xs transition-all cursor-pointer border border-slate-700"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Volume Preset Selector */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 5, 10].map((qtyPreset) => {
                      const isSelected = quantity === qtyPreset;
                      return (
                        <button
                          key={qtyPreset}
                          type="button"
                          id={`btn-qty-preset-${pkg.id}-${qtyPreset}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetQuantity(pkg.id, qtyPreset);
                          }}
                          className={`min-h-[34px] py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center border ${
                            isSelected
                              ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-sm shadow-cyan-950'
                              : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {qtyPreset}x
                        </button>
                      );
                    })}
                  </div>

                  {/* Bulk Discount Indicator Badge */}
                  {pricing.hasBulkDiscount ? (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 border border-amber-400/60 flex items-center justify-between gap-1.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Bulk Discount: 5% OFF</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-950 bg-amber-400 px-1.5 py-0.5 rounded shadow-sm">
                        {pricing.totalDiamonds.toLocaleString()} 💎 Wholesale
                      </span>
                    </div>
                  ) : pricing.diamondsNeededForBulk <= 4000 ? (
                    <div className="mt-2 px-2 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Tag className="w-3 h-3 text-amber-400/80" />
                        <span>Bulk discount at 5k 💎</span>
                      </span>
                      <span className="text-amber-400 font-semibold">
                        +{Math.ceil(pricing.diamondsNeededForBulk / pkg.diamonds)} more pack{Math.ceil(pricing.diamondsNeededForBulk / pkg.diamonds) > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Pricing & Comparison */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs text-slate-400">Escrow Price</span>
                        {isDev && (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded">
                            DEV PASS
                          </span>
                        )}
                        {isVip && !isDev && isPkg100PercentFree && (
                          <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                            VIP FREE ({freeStatus.status.claimsUsed + 1}/{VIP_FREE_CLAIM_LIMIT})
                          </span>
                        )}
                        {isVip && !isDev && !isPkg100PercentFree && (
                          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 rounded">
                            👑 50% VIP OFF
                          </span>
                        )}
                        {quantity > 1 && (
                          <span className="text-[10px] font-mono text-cyan-400 font-medium">
                            ({quantity}x = {pricing.totalDiamonds.toLocaleString()} 💎)
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-2">
                        {isPkg100PercentFree ? (
                          <>
                            <span className="text-xl font-black text-amber-300 font-mono tabular-nums flex items-center gap-1">
                              <Crown className="w-4 h-4 text-amber-400" />
                              ₱0.00 FREE
                            </span>
                            <span className="text-xs text-slate-500 line-through font-mono tabular-nums">
                              {formatCurrency(pricing.regularSubtotalUsd, currency, pricing.regularSubtotalPhp)}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className={`text-xl font-extrabold font-mono tabular-nums ${isVip ? 'text-amber-300' : 'text-white'}`}>
                              {formatCurrency(pricing.finalPriceUsd, currency, pricing.finalPricePhp)}
                            </span>
                            {(pricing.hasBulkDiscount || isVip) && (
                              <span className="text-xs text-slate-500 line-through font-mono tabular-nums">
                                {formatCurrency(pricing.regularSubtotalUsd, currency, pricing.regularSubtotalPhp)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {isPkg100PercentFree ? (
                        <div className="text-[11px] font-mono font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                          <span>{isDev ? '👑 Lead Developer Free Privilege' : `👑 VIP Free Diamond Grant (${freeStatus.status.claimsUsed + 1} of ${VIP_FREE_CLAIM_LIMIT})`}</span>
                        </div>
                      ) : isVip ? (
                        <div className="text-[11px] font-mono font-bold text-amber-300 mt-0.5 flex items-center gap-1">
                          <span>👑 VIP 50% Discount Applied (-50%)</span>
                        </div>
                      ) : pricing.hasBulkDiscount ? (
                        <div className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
                          Saved {formatCurrency(pricing.bulkDiscountUsd, currency, pricing.bulkDiscountPhp)} (5% Bulk)
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block mb-0.5">In-Game Store</span>
                      <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                        {formatCurrency(pricing.regularSubtotalUsd, currency, pricing.regularSubtotalPhp)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* GCash Promo Perk Pill */}
                <div className="mt-2.5 px-2.5 py-1 rounded-md bg-blue-950/40 border border-blue-800/40 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-blue-300">
                    <span>🇵🇭</span>
                    <span className="font-semibold text-blue-200">GCash Payment:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded text-[10px]">
                    Extra 2% OFF
                  </span>
                </div>

                {/* Total Inventory Stock Bar */}
                <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isOutOfStock
                          ? 'bg-slate-600'
                          : isLowStock
                          ? 'bg-rose-500 animate-ping'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium ${
                        isOutOfStock
                          ? 'text-slate-500'
                          : isLowStock
                          ? 'text-rose-300 font-bold'
                          : 'text-slate-300'
                      }`}
                    >
                      {isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
                        ? `Low Stock: Only ${totalStock} left`
                        : `Total Stock: ${totalStock.toLocaleString()} units`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {matchingSellers.length > 1 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playUiClickSound();
                          setExpandedSellerPackageId(isSellerDrawerOpen ? null : pkg.id);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title="Click to view and choose among verified sellers for this package"
                      >
                        <span>{sellerCount} verified sellers</span>
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${
                            isSellerDrawerOpen ? 'rotate-90 text-cyan-300' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-normal">
                        {sellerCount} verified seller{sellerCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Seller Info Drawer with Verified & Top-Rated Badges */}
                <div
                  className={`mt-2 p-2.5 rounded-lg bg-slate-950/70 border text-xs text-slate-300 flex items-center justify-between gap-2 transition-all ${
                    sellerBadge ? sellerBadge.glowClass : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <img
                      src={seller.sellerAvatar}
                      alt={seller.sellerName}
                      className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 shrink-0"
                    />
                    <span className="truncate font-medium text-slate-200 text-[11px] sm:text-xs">
                      {seller.sellerName}
                    </span>

                    {/* Visually highlighted 'Verified' or 'Top-Rated' badge determined by sellerRating and completionRate */}
                    {sellerBadge && (
                      <span
                        id={`seller-badge-${pkg.id}`}
                        data-seller-badge={sellerBadge.type}
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shrink-0 flex items-center gap-1 border shadow-sm transition-transform hover:scale-105 ${sellerBadge.badgeClass}`}
                        title={sellerBadge.tooltip}
                      >
                        {sellerBadge.type === 'top_rated' ? (
                          <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-400 shrink-0 filter drop-shadow" />
                        ) : (
                          <ShieldCheck className="w-2.5 h-2.5 text-cyan-300 shrink-0 filter drop-shadow" />
                        )}
                        <span className="tracking-wide uppercase font-black text-[8.5px]">
                          {sellerBadge.label}
                        </span>
                      </span>
                    )}

                    {/* Rating score and completion percentage metrics */}
                    <span
                      className="text-[10px] font-mono shrink-0 hidden sm:inline-flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800/80"
                      title={`Seller Rating: ${seller.sellerRating.toFixed(2)} / 5.00 | Completion Rate: ${seller.completionRate.toFixed(1)}%`}
                    >
                      <span className="text-amber-400 font-bold">★ {seller.sellerRating.toFixed(2)}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-emerald-400 font-bold">{seller.completionRate.toFixed(1)}%</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] shrink-0 font-mono">
                    {matchingSellers.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          playUiClickSound();
                          setExpandedSellerPackageId(isSellerDrawerOpen ? null : pkg.id);
                        }}
                        className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 cursor-pointer mr-1"
                        title="Switch seller"
                      >
                        {isSellerDrawerOpen ? 'Hide' : 'Switch'}
                      </button>
                    )}

                    {seller.instantAutoDelivery ? (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 flex items-center gap-1"
                        title="Instant Auto-Delivery via direct server API (~1-2m)"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400/40" />
                        <span>Instant</span>
                      </span>
                    ) : (
                      <span
                        className="text-slate-400 flex items-center gap-1 text-[10px]"
                        title={`Manual fulfillment ~${seller.avgDeliveryMinutes} mins`}
                      >
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>~{seller.avgDeliveryMinutes}m</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Seller Selector Drawer */}
                {isSellerDrawerOpen && matchingSellers.length > 1 && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-cyan-500/40 space-y-1.5 shadow-lg shadow-cyan-950/40 animate-in fade-in duration-150">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Available Merchants ({matchingSellers.length})</span>
                      <span className="text-[9px] text-slate-400 lowercase">click to choose</span>
                    </div>
                    {matchingSellers.map((s) => {
                      const sBadge = getSellerBadge(s);
                      const isSelected = s.id === seller.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            playUiClickSound();
                            setSelectedSellerMap((prev) => ({ ...prev, [pkg.id]: s.id }));
                          }}
                          className={`p-1.5 rounded flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-cyan-950/50 border border-cyan-400/60 text-white'
                              : 'bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img
                              src={s.sellerAvatar}
                              alt={s.sellerName}
                              className="w-4 h-4 rounded-full bg-slate-800 shrink-0"
                            />
                            <span className="text-[11px] font-medium truncate">{s.sellerName}</span>
                            {sBadge && (
                              <span
                                className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold shrink-0 flex items-center gap-0.5 border ${sBadge.badgeClass}`}
                                title={sBadge.tooltip}
                              >
                                {sBadge.type === 'top_rated' ? (
                                  <Star className="w-2 h-2 text-amber-300 fill-amber-400 shrink-0" />
                                ) : (
                                  <ShieldCheck className="w-2 h-2 text-cyan-300 shrink-0" />
                                )}
                                <span>{sBadge.label}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                            <span className="text-amber-400 font-bold">★ {s.sellerRating.toFixed(2)}</span>
                            <span className="text-emerald-400 font-semibold">{s.completionRate.toFixed(1)}%</span>
                            <span className="text-slate-200 font-bold">
                              {formatCurrency(s.priceUsd, currency, s.pricePhp)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                isSelected
                                  ? 'bg-cyan-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {isSelected ? 'Active ✓' : 'Select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Trust Kicker / Escrow Status */}
                {!currentUser ? (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                    <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Sign in required to activate Escrow Vault</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Aegis Escrow: 100% Refund if not credited</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Ergonomic 44px+ Mobile Touch Targets & Conversion Hierarchy */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2.5">
                {/* Primary Instant Checkout CTA (44px min-height for mobile thumb zone) */}
                <button
                  type="button"
                  id={`btn-quick-buy-${pkg.id}`}
                  disabled={isOutOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isOutOfStock) {
                      playDiamondChimeSound();
                      triggerClickSparkle(e.clientX, e.clientY);
                      onSelectPackageToBuy(pkg, seller, quantity);
                    }
                  }}
                  title={
                    isOutOfStock
                      ? 'Currently out of stock across all sellers'
                      : isDev
                      ? `Instant Claim ${quantity}x ${pkg.name} for ₱0.00 FREE (Lead Developer Exemption)`
                      : isPkg100PercentFree
                      ? `Instant Claim ${quantity}x ${pkg.name} for ₱0.00 FREE (VIP Claim ${freeStatus.status.claimsUsed + 1}/${VIP_FREE_CLAIM_LIMIT})`
                      : isVip
                      ? `Buy Now ${quantity}x ${pkg.name} for ${formatCurrency(pricing.finalPriceUsd, currency, pricing.finalPricePhp)} (50% VIP OFF)`
                      : `Buy Now ${quantity}x ${pkg.name} for ${formatCurrency(pricing.finalPriceUsd, currency, pricing.finalPricePhp)}`
                  }
                  className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all group/quick ${
                    isOutOfStock
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed opacity-50'
                      : isPkg100PercentFree
                      ? 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/30 cursor-pointer'
                      : isVip
                      ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer'
                      : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer'
                  }`}
                >
                  {isPkg100PercentFree || isVip ? (
                    <Crown className="w-4 h-4 fill-slate-950 text-slate-950 group-hover/quick:scale-110 transition-transform shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 fill-slate-950 text-slate-950 group-hover/quick:scale-110 transition-transform shrink-0" />
                  )}
                  <span className="font-extrabold tracking-tight">
                    {isOutOfStock
                      ? 'Out of Stock'
                      : isDev
                      ? `Claim ${quantity}x Free 👑`
                      : isPkg100PercentFree
                      ? `Claim Free 👑 (${freeStatus.status.claimsUsed + 1}/${VIP_FREE_CLAIM_LIMIT})`
                      : isVip
                      ? `Buy Now (50% VIP OFF)`
                      : `Buy Now · Instant`}
                  </span>
                  {!isOutOfStock && (
                    <span className="font-mono text-xs font-black text-slate-950 bg-slate-950/15 border border-slate-950/20 px-2 py-0.5 rounded-md ml-auto">
                      {isPkg100PercentFree
                        ? '₱0.00 FREE'
                        : `${quantity}x · ${formatCurrency(pricing.finalPriceUsd, currency, pricing.finalPricePhp)}`}
                    </span>
                  )}
                </button>

                {/* Secondary Row: Add to Cart (Bulk Bundle) + Price Alert (Easy 2-Column Mobile Tap Grid) */}
                <div className="grid grid-cols-12 gap-2">
                  <button
                    type="button"
                    id={`btn-bulk-toggle-${pkg.id}`}
                    onClick={() => handleToggleBulkPackage(pkg.id)}
                    className={`col-span-8 min-h-[42px] py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer ${
                      isSelectedInBulk
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/90 hover:bg-slate-700 border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white'
                    }`}
                  >
                    <ShoppingBag className={`w-3.5 h-3.5 shrink-0 ${isSelectedInBulk ? 'text-slate-950' : 'text-cyan-400'}`} />
                    <span className="truncate">
                      {isSelectedInBulk ? `In Cart (${quantity}x) ✓` : `Add to Cart (${quantity}x)`}
                    </span>
                  </button>

                  {onOpenPriceAlertModal && (
                    <button
                      type="button"
                      onClick={() => onOpenPriceAlertModal(pkg)}
                      title={
                        matchedAlert
                          ? `Alert set: ≤ ${formatCurrency(matchedAlert.targetPriceUsd, currency)}. Click to edit.`
                          : 'Set price alert for this package'
                      }
                      className={`col-span-4 min-h-[42px] py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer group/alert ${
                        matchedAlert && matchedAlert.isActive
                          ? 'bg-amber-950/60 hover:bg-amber-950/90 border-amber-400/70 text-amber-300'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white'
                      }`}
                    >
                      {matchedAlert && matchedAlert.isActive ? (
                        <>
                          <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate">Alert On</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5 text-slate-300 group-hover/alert:text-amber-400 shrink-0" />
                          <span className="text-[11px] truncate">Alert</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Guest Sign-In / Escrow Assurance Sub-button when unauthenticated */}
                {!currentUser && !isOutOfStock && (
                  <button
                    type="button"
                    id={`btn-order-${pkg.id}`}
                    onClick={(e) => {
                      playDiamondChimeSound();
                      triggerClickSparkle(e.clientX, e.clientY);
                      onSelectPackageToBuy(pkg, seller, quantity);
                    }}
                    className="w-full min-h-[38px] py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Sign In for Escrow Protection</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Highest Diamond Whale Bundle Culmination Banner */}
      {(() => {
        const highestPkg = safePackages.find((p) => p.diamonds === highestDiamondInStore) || safePackages[safePackages.length - 1];
        if (!highestPkg) return null;
        const highestSeller = getSellerForPackage(highestPkg);
        const highestSellerBadge = getSellerBadge(highestSeller);
        const highestPricing = calculatePackagePricing(
          highestPkg,
          1,
          preferredPaymentMethod,
          highestSeller.priceUsd,
          highestSeller.pricePhp,
          Boolean(isVip && !isDev)
        );

        return (
          <div
            id="highest-diamond-culmination-banner"
            className="mt-6 mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#141b2e] via-amber-950/40 to-[#141b2e] border-2 border-amber-400/80 shadow-2xl shadow-amber-950/80 flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 z-10 w-full lg:w-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/30 shrink-0">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-md">
                    👑 Highest Diamond Package Tier
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-700/60">
                    +{highestPkg.bonusDiamonds} Bonus Included
                  </span>
                  {highestSellerBadge && (
                    <span
                      id="highest-seller-badge"
                      title={highestSellerBadge.tooltip}
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-sm ${highestSellerBadge.badgeClass}`}
                    >
                      {highestSellerBadge.type === 'top_rated' ? (
                        <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-400 filter drop-shadow" />
                      ) : (
                        <ShieldCheck className="w-2.5 h-2.5 text-cyan-300 filter drop-shadow" />
                      )}
                      <span>{highestSellerBadge.label} Merchant</span>
                      <span className="text-slate-400 font-normal">|</span>
                      <span>★ {highestSeller.sellerRating.toFixed(2)}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span>{highestSeller.completionRate.toFixed(1)}%</span>
                    </span>
                  )}
                  {isVip && !isDev && (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-sm">
                      👑 50% VIP OFF APPLIED
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {highestPkg.diamonds.toLocaleString()} Diamonds ({highestPkg.name})
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  The ultimate MLBB whale bundle: <strong className="text-amber-300">{(highestPkg.diamonds + highestPkg.bonusDiamonds).toLocaleString()} Total Diamonds</strong> with maximum discount efficiency, direct server delivery (~1-2m), and 100% Aegis Escrow protection.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 z-10 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
              <div className="text-left lg:text-right">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Apex Whale Escrow Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-black font-mono text-amber-300">
                    {isDev ? '₱0.00 FREE' : formatCurrency(highestPricing.finalPriceUsd, currency, highestPricing.finalPricePhp)}
                  </span>
                  {!isDev && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {formatCurrency(highestPricing.regularSubtotalUsd, currency, highestPricing.regularSubtotalPhp)}
                    </span>
                  )}
                </div>
                {isVip && !isDev ? (
                  <span className="text-[10px] text-amber-300 font-mono font-bold block">
                    👑 50% VIP Storewide Discount Active (-50%)
                  </span>
                ) : !isDev && !isVip ? (
                  <span className="text-[10px] text-amber-400 font-mono block">
                    👑 Save 50% on this pack with VIP Badge (₱950 upgrade)
                  </span>
                ) : null}
                <span className="text-[10px] text-emerald-400 font-mono block">
                  Fulfilled by {highestSeller.sellerName} (★ {highestSeller.sellerRating.toFixed(2)} · {highestSeller.completionRate.toFixed(1)}% completion)
                </span>
              </div>

              <button
                type="button"
                id="btn-buy-highest-diamond-culmination"
                onClick={(e) => {
                  playDiamondChimeSound();
                  triggerClickSparkle(e.clientX, e.clientY);
                  onSelectPackageToBuy(highestPkg, highestSeller, 1);
                }}
                className="px-6 py-3 rounded-xl font-black text-xs bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <span>
                  {isDev
                    ? 'Claim Whale Bundle 👑 (DEV FREE)'
                    : isVip
                    ? 'Buy Highest Diamond Pack (50% VIP OFF)'
                    : 'Buy Highest Diamond Pack'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Sticky Bottom Bulk Escrow Checkout Dock */}
      {bulkSelectedCount > 0 && (
        <div
          id="bulk-checkout-sticky-dock"
          className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-cyan-500/50 backdrop-blur-xl shadow-2xl px-4 py-3 sm:py-3.5 transition-all animate-in slide-in-from-bottom-6"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Summary */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/20 border border-cyan-400/60 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/20">
                <Layers className="w-5 h-5 text-cyan-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white flex items-center gap-1">
                    Bulk Escrow Bundle
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-700">
                    {bulkSelectedCount} Package{bulkSelectedCount !== 1 ? 's' : ''} ({bulkAggregatePricing.totalUnitsCount} Units)
                  </span>
                  {bulkAggregatePricing.hasBulkDiscount && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      5% Bulk OFF
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="font-mono text-cyan-300 font-semibold">
                    💎 {bulkAggregatePricing.totalDiamonds.toLocaleString()} Total Diamonds
                  </span>
                  <span className="text-slate-500 hidden sm:inline">·</span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    Locked together in a single Aegis Escrow contract
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Quick pill list of selected packages */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-2 rounded-lg bg-slate-900/60 border border-slate-800">
              {bulkSelectedItems.map((item) => (
                <div
                  key={item.package.id}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-200 border border-slate-700 whitespace-nowrap shrink-0"
                >
                  <span className="font-bold text-cyan-400">{item.quantity}x</span>
                  <span className="max-w-[100px] truncate">{item.package.name}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleBulkPackage(item.package.id)}
                    className="ml-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                    title={`Remove ${item.package.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Right: Pricing & Checkout Button */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
                  Consolidated Total
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    {formatCurrency(bulkAggregatePricing.finalPriceUsd, currency, bulkAggregatePricing.finalPricePhp)}
                  </span>
                  {(bulkAggregatePricing.hasBulkDiscount || bulkAggregatePricing.hasGcashDiscount) && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      {formatCurrency(bulkAggregatePricing.subtotalUsd, currency, bulkAggregatePricing.subtotalPhp)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBulkPackages({})}
                  className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Clear all selected packages"
                >
                  Clear
                </button>

                <button
                  type="button"
                  id="btn-trigger-bulk-checkout"
                  onClick={handleTriggerBulkCheckout}
                  className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:brightness-110 active:scale-[0.99] text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Shield className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>Initiate Bulk Escrow Checkout</span>
                  <ChevronRight className="w-4 h-4 text-slate-950" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supported Payment Channels & Trusted Third-Party Payment Gateways (Stripe, Xendit, Midtrans) */}
      <div
        id="supported-payment-gateways-showcase"
        className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 border border-emerald-500/40 shadow-xl space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                Official Payment Channels & Buyer Protection Gateways
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% Verified · Zero Personal Transfers
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Processed exclusively via licensed third-party payment gateways (<strong className="text-emerald-300">Stripe, Xendit, and Midtrans</strong>) with full buyer protection.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950/90 border border-indigo-500/50 text-indigo-300 font-mono text-xs font-bold">
              Stripe PCI-DSS L1
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold">
              Xendit SEA Gateway
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-950/90 border border-teal-500/50 text-teal-300 font-mono text-xs font-bold">
              Midtrans Official
            </span>
          </div>
        </div>

        {/* 4 Core Payment Method Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Digital Wallets */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">1. Digital Wallets</span>
              <span className="text-sm">🌐 🇵🇭 🇮🇩</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">Google Pay, Apple Pay, PayPal</strong>, or region-specific wallets like <strong className="text-emerald-300">DANA / OVO / GoPay</strong> (Indonesia) & <strong className="text-blue-300">GCash / Maya</strong> (Philippines).
            </p>
            <span className="inline-block text-[10px] font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/50">
              Stripe · Xendit · Midtrans
            </span>
          </div>

          {/* 2. Bank Transfers */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">2. Bank Transfers</span>
              <span className="text-sm">🏦</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Direct bank transfers or Virtual Accounts (VA)</strong> via BCA, Mandiri, BNI, BRI, BDO, BPI, UnionBank & FPX Online Banking.
            </p>
            <span className="inline-block text-[10px] font-mono text-amber-300 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/50">
              Automated Virtual Accounts
            </span>
          </div>

          {/* 3. E-Wallets */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">3. Local E-Wallets</span>
              <span className="text-sm">🌏</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Specific local e-wallets depending on your country: <strong className="text-emerald-300">QRIS, Touch 'n Go, GrabPay, ShopeePay, TrueMoney, PayNow, PromptPay & PIX</strong>.
            </p>
            <span className="inline-block text-[10px] font-mono text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/50">
              0% Gateway Fee · Instant QR
            </span>
          </div>

          {/* 4. Credit/Debit Cards */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-colors space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">4. Credit / Debit Cards</span>
              <span className="text-sm">💳</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Global <strong className="text-indigo-300">Visa and Mastercard</strong> credit and debit cards protected by 3D-Secure 2.0 encryption and zero-fraud liability.
            </p>
            <span className="inline-block text-[10px] font-mono text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800/50">
              Stripe 3DS2 Encrypted
            </span>
          </div>
        </div>

        {/* Important Tip Callout */}
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-200 leading-relaxed">
            <strong className="text-amber-300">Important Tip:</strong> For a <strong className="text-white">"not scammy"</strong> reputation, we always use trusted third-party payment gateways (<strong className="text-emerald-300">Stripe, Xendit, or Midtrans</strong>) rather than asking customers to send money directly to a personal bank account or crypto wallet. This provides automated buyer protection and institutional security.
          </p>
        </div>
      </div>
    </section>
  );
};
