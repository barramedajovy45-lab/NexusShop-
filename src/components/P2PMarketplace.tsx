import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Currency, DiamondPackage, EscrowOrder, PaymentMethod, SellerListing, UserAccount } from '../types';
import { formatCurrency, getPaymentMethodDetails } from '../utils/formatters';
import { calculateSellerRating } from '../utils/ratingUtils';
import { SellerReviewsModal } from './SellerReviewsModal';
import { SellerMarketplaceSkeleton } from './SkeletonLoaders';
import { canSellDiamonds, isDeveloperUser, isVipUser, isEligibleForFreeEverything, isBigDiamondPackage } from '../data/mockData';
import {
  ShieldCheck,
  Zap,
  Star,
  CheckCircle2,
  ChevronRight,
  Gem,
  MessageSquare,
  Sparkles,
  Lock,
  Crown,
  AlertTriangle,
  X,
  Store,
  ShieldAlert,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

interface P2PMarketplaceProps {
  sellers: SellerListing[];
  packages: DiamondPackage[];
  orders: EscrowOrder[];
  currency: Currency;
  currentUser?: UserAccount | null;
  onBuyFromSeller: (seller: SellerListing, pkg: DiamondPackage) => void;
  onBecomeSellerClick: () => void;
  onSwitchAccount?: (account: UserAccount) => void;
  isLoading?: boolean;
}

export const P2PMarketplace: React.FC<P2PMarketplaceProps> = ({
  sellers,
  packages,
  orders,
  currency,
  currentUser,
  onBuyFromSeller,
  onBecomeSellerClick,
  onSwitchAccount,
  isLoading = false,
}) => {
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');
  const [speedFilter, setSpeedFilter] = useState<'all' | 'instant'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'default' | 'price-asc' | 'price-desc' | 'delivery-asc' | 'delivery-desc' | 'rating-desc' | 'orders-desc'
  >('default');
  const [selectedSellerForReviews, setSelectedSellerForReviews] = useState<SellerListing | null>(null);
  const [isSellerGateModalOpen, setIsSellerGateModalOpen] = useState(false);
  const [isProcessingMarketplace, setIsProcessingMarketplace] = useState(false);
  const marketplaceTimerRef = useRef<number | null>(null);
  const prevCurrencyRef = useRef<Currency>(currency);

  const triggerMarketplaceSkeleton = (durationMs: number = 250) => {
    if (marketplaceTimerRef.current) {
      window.clearTimeout(marketplaceTimerRef.current);
    }
    setIsProcessingMarketplace(true);
    marketplaceTimerRef.current = window.setTimeout(() => {
      setIsProcessingMarketplace(false);
    }, durationMs);
  };

  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      prevCurrencyRef.current = currency;
      triggerMarketplaceSkeleton(250);
    }
  }, [currency]);

  useEffect(() => {
    return () => {
      if (marketplaceTimerRef.current) {
        window.clearTimeout(marketplaceTimerRef.current);
      }
    };
  }, []);

  const showMarketplaceSkeleton = isLoading || isProcessingMarketplace;

  const userCanSell = canSellDiamonds(currentUser);

  const handleSellerButtonClick = () => {
    if (userCanSell) {
      onBecomeSellerClick();
    } else {
      setIsSellerGateModalOpen(true);
    }
  };

  const getPackageDetails = (packageId: string): DiamondPackage => {
    return (
      packages.find((p) => p.id === packageId) || {
        id: packageId,
        name: 'Diamond Pack',
        diamonds: 86,
        bonusDiamonds: 8,
        regularPriceUsd: 1.99,
        discountPriceUsd: 1.49,
      }
    );
  };

  // Real-time instant search filter and sorting
  const filteredAndSortedSellers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = sellers.filter((seller) => {
      // Payment method filter
      if (methodFilter !== 'all' && !seller.acceptedPaymentMethods.includes(methodFilter)) {
        return false;
      }
      // Instant delivery filter
      if (speedFilter === 'instant' && !seller.instantAutoDelivery) {
        return false;
      }
      // Real-time search query matching
      if (q) {
        const pkg = getPackageDetails(seller.packageId);
        const matchesSellerName = seller.sellerName.toLowerCase().includes(q);
        const matchesPkgName = pkg.name.toLowerCase().includes(q);
        const matchesDiamonds =
          `${pkg.diamonds}`.includes(q) ||
          `${pkg.diamonds + (pkg.bonusDiamonds || 0)}`.includes(q);
        const matchesPayment = seller.acceptedPaymentMethods.some((m) => {
          const det = getPaymentMethodDetails(m);
          return m.toLowerCase().includes(q) || det.name.toLowerCase().includes(q);
        });
        const matchesPro = q.includes('pro') && seller.isProSeller;
        const matchesInstant =
          (q.includes('instant') || q.includes('auto') || q.includes('fast')) &&
          seller.instantAutoDelivery;

        if (
          !matchesSellerName &&
          !matchesPkgName &&
          !matchesDiamonds &&
          !matchesPayment &&
          !matchesPro &&
          !matchesInstant
        ) {
          return false;
        }
      }
      return true;
    });

    // Sorting logic for Price, Delivery Time, Ratings, and Orders
    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') {
        return a.priceUsd - b.priceUsd;
      }
      if (sortBy === 'price-desc') {
        return b.priceUsd - a.priceUsd;
      }
      if (sortBy === 'delivery-asc') {
        return a.avgDeliveryMinutes - b.avgDeliveryMinutes;
      }
      if (sortBy === 'delivery-desc') {
        return b.avgDeliveryMinutes - a.avgDeliveryMinutes;
      }
      if (sortBy === 'rating-desc') {
        const ratingA = calculateSellerRating(a, orders).averageRating;
        const ratingB = calculateSellerRating(b, orders).averageRating;
        return ratingB - ratingA;
      }
      if (sortBy === 'orders-desc') {
        return b.totalOrders - a.totalOrders;
      }
      // Default recommended sorting: Pro sellers first, then instant delivery, then completed orders
      if (a.isProSeller !== b.isProSeller) {
        return a.isProSeller ? -1 : 1;
      }
      if (a.instantAutoDelivery !== b.instantAutoDelivery) {
        return a.instantAutoDelivery ? -1 : 1;
      }
      return b.totalOrders - a.totalOrders;
    });
  }, [sellers, packages, orders, searchQuery, methodFilter, speedFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    methodFilter !== 'all' ||
    speedFilter !== 'all' ||
    sortBy !== 'default';

  const handleClearFilters = () => {
    triggerMarketplaceSkeleton(220);
    setSearchQuery('');
    setMethodFilter('all');
    setSpeedFilter('all');
    setSortBy('default');
  };

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <span>P2P Diamond Exchange</span>
            <span aria-hidden="true">·</span>
            <span>Verified Merchants</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Live Seller Marketplace
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Purchase directly from verified top-up merchants. Escrow locks your real money until in-game diamonds are delivered.
          </p>
        </div>

        {userCanSell && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSellerButtonClick}
              className="self-start sm:self-auto px-4 py-2 rounded-lg font-semibold text-xs border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm bg-gradient-to-r from-amber-950/70 to-slate-900 hover:from-amber-900/80 text-amber-300 border-amber-500/50 shadow-amber-950/40"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>List Diamonds as Seller</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                VIP/DEV
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>
        )}
      </div>

      {/* Sign In Required Notice for P2P Escrow */}
      {!currentUser && (
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Sign In Required for Escrow:</strong> You must sign in to your account first so your funds can be locked in the Aegis Escrow Vault and released only upon confirmed diamond delivery.
            </span>
          </div>
        </div>
      )}

      {/* Anti-Scam & Safe Escrow Trust Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/40 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white flex items-center gap-2">
              <span>100% Anti-Scam Escrow Guarantee</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                NOT SCAMMABLE
              </span>
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Never transact off-platform. All P2P diamond trades are bonded inside the Aegis Escrow Vault. Sellers are only paid after verified in-game receipt.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Vetted & Bonded Merchants</span>
        </div>
      </div>

      {/* Search & Sort Controls Deck */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-6 space-y-3 shadow-lg">
        {/* Top Controls: Real-time Search Input & Sort By Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by seller name, diamonds, package, or payment..."
              className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-xs text-white placeholder-slate-500 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sorting Dropdown for Price, Delivery Speed, and Seller Rating */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 shrink-0 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sort listings:</span>
            </div>
            <select
              id="p2p-sort-dropdown"
              name="p2p-sort"
              aria-label="Sort seller listings by price, delivery speed, or seller rating"
              value={sortBy}
              onChange={(e) => {
                triggerMarketplaceSkeleton(220);
                setSortBy(e.target.value as any);
              }}
              className="px-3 py-2 bg-slate-950/95 border border-cyan-500/40 hover:border-cyan-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 rounded-lg text-xs text-white font-semibold cursor-pointer transition-all outline-none shadow-sm"
            >
              <option value="default" className="bg-slate-900 text-slate-200">Recommended (Pro & Instant First)</option>
              <option value="price-asc" className="bg-slate-900 text-slate-200">Price: Low to High</option>
              <option value="price-desc" className="bg-slate-900 text-slate-200">Price: High to Low</option>
              <option value="delivery-asc" className="bg-slate-900 text-slate-200">Delivery Speed (Fastest First)</option>
              <option value="delivery-desc" className="bg-slate-900 text-slate-200">Delivery Speed (Longest First)</option>
              <option value="rating-desc" className="bg-slate-900 text-slate-200">Seller Rating (Highest First ★)</option>
              <option value="orders-desc" className="bg-slate-900 text-slate-200">Most Orders Completed</option>
            </select>
          </div>
        </div>

        {/* Quick Sort Shortcut Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-medium mr-1">Quick sort:</span>
          <button
            type="button"
            onClick={() => {
              triggerMarketplaceSkeleton(220);
              setSortBy(sortBy === 'price-asc' ? 'default' : 'price-asc');
            }}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium cursor-pointer border ${
              sortBy === 'price-asc'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <span>💎 Price (Low to High)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerMarketplaceSkeleton(220);
              setSortBy(sortBy === 'delivery-asc' ? 'default' : 'delivery-asc');
            }}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium cursor-pointer border ${
              sortBy === 'delivery-asc'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Fastest Delivery Speed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerMarketplaceSkeleton(220);
              setSortBy(sortBy === 'rating-desc' ? 'default' : 'rating-desc');
            }}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 font-medium cursor-pointer border ${
              sortBy === 'rating-desc'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>Top Seller Rating</span>
          </button>
          {sortBy !== 'default' && (
            <button
              type="button"
              onClick={() => {
                triggerMarketplaceSkeleton(220);
                setSortBy('default');
              }}
              className="px-2 py-1 rounded-md text-[10px] text-slate-400 hover:text-rose-300 transition-colors ml-auto cursor-pointer"
            >
              Reset to Recommended
            </button>
          )}
        </div>

        {/* Secondary Row: Payment Filters & Instant Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Payment:</span>
            <button
              onClick={() => {
                if (methodFilter !== 'all') triggerMarketplaceSkeleton(220);
                setMethodFilter('all');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors text-[11px] ${
                methodFilter === 'all'
                  ? 'bg-slate-700 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                if (methodFilter !== 'gcash') triggerMarketplaceSkeleton(220);
                setMethodFilter('gcash');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                methodFilter === 'gcash'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇵🇭 GCash</span>
            </button>
            <button
              onClick={() => {
                if (methodFilter !== 'maya') triggerMarketplaceSkeleton(220);
                setMethodFilter('maya');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                methodFilter === 'maya'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇵🇭 Maya</span>
            </button>
            <button
              onClick={() => {
                if (methodFilter !== 'paypal') triggerMarketplaceSkeleton(220);
                setMethodFilter('paypal');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                methodFilter === 'paypal'
                  ? 'bg-sky-600/30 text-sky-300 border border-sky-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🌍 PayPal</span>
            </button>
            <button
              onClick={() => {
                if (methodFilter !== 'crypto_usdt') triggerMarketplaceSkeleton(220);
                setMethodFilter('crypto_usdt');
              }}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 text-[11px] ${
                methodFilter === 'crypto_usdt'
                  ? 'bg-teal-600/30 text-teal-300 border border-teal-500/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🪙 USDT</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerMarketplaceSkeleton(220);
                setSpeedFilter(speedFilter === 'all' ? 'instant' : 'all');
              }}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                speedFilter === 'instant'
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Instant Auto-Delivery Only</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1 rounded-md text-[11px] text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-700 hover:border-rose-800 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all search queries, filters, and sorting"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter, Active Filter Tags & Live Refresh */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-cyan-300">{filteredAndSortedSellers.length}</strong> of{' '}
              <strong className="text-slate-300">{sellers.length}</strong> verified merchants
            </span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-[10px] flex items-center gap-1">
                <span>Keyword: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
            {sortBy !== 'default' && (
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px] flex items-center gap-1">
                <span>
                  Sorted by:{' '}
                  {sortBy === 'price-asc'
                    ? 'Price (Low to High)'
                    : sortBy === 'price-desc'
                    ? 'Price (High to Low)'
                    : sortBy === 'delivery-asc'
                    ? 'Fastest Delivery'
                    : sortBy === 'delivery-desc'
                    ? 'Longest Delivery'
                    : sortBy === 'rating-desc'
                    ? 'Top Rating'
                    : 'Most Orders'}
                </span>
                <button
                  type="button"
                  onClick={() => setSortBy('default')}
                  className="hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => triggerMarketplaceSkeleton(420)}
            disabled={showMarketplaceSkeleton}
            className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 text-[10px] transition-colors cursor-pointer disabled:opacity-50"
            title="Sync live P2P merchant listings and escrow rates"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${showMarketplaceSkeleton ? 'animate-spin' : ''}`} />
            <span>{showMarketplaceSkeleton ? 'Syncing Rates...' : 'Refresh Offers'}</span>
          </button>
        </div>
      </div>

      {/* Sellers List Table / Cards or Skeleton Loader */}
      {showMarketplaceSkeleton ? (
        <SellerMarketplaceSkeleton count={Math.max(3, Math.min(6, filteredAndSortedSellers.length || 5))} />
      ) : (
      <div className="space-y-3">
        {filteredAndSortedSellers.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">No Merchants Match Your Criteria</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                No verified P2P sellers match your current search query "{searchQuery}" or filter combination.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-cyan-950/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Search & Reset Filters</span>
            </button>
          </div>
        ) : (
          filteredAndSortedSellers.map((seller) => {
          const pkg = getPackageDetails(seller.packageId);
          const stats = calculateSellerRating(seller, orders);
          const isFreeEligible = isEligibleForFreeEverything(currentUser);
          const isBig = isBigDiamondPackage(pkg);
          const buyerOrderFeedback = orders.find(
            (o) =>
              o.status === 'completed' &&
              (o.sellerId === seller.sellerId || o.sellerName === seller.sellerName) &&
              o.feedback
          )?.feedback;

          return (
            <div
              key={seller.id}
              className="p-4 sm:p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Seller Profile & Credibility */}
              <div className="flex items-center gap-3.5 min-w-[240px]">
                <img
                  src={seller.sellerAvatar}
                  alt={seller.sellerName}
                  className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 object-cover shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base">
                      {seller.sellerName}
                    </span>
                    {seller.isProSeller && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-semibold">
                        PRO
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                    {/* Dynamic Average Rating Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedSellerForReviews(seller)}
                      className="flex items-center gap-1.5 text-xs hover:text-white transition-colors cursor-pointer group"
                      title="Click to view verified buyer reviews & rating breakdown"
                    >
                      <span className="flex items-center text-amber-400 font-bold bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded group-hover:border-amber-400 transition-colors">
                        <Star className="w-3 h-3 fill-amber-400 mr-1" />
                        {stats.averageRating.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 underline underline-offset-2 decoration-slate-600 group-hover:text-cyan-300 group-hover:decoration-cyan-400">
                        ({stats.ratingsCount.toLocaleString()} ratings)
                      </span>
                    </button>

                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{seller.totalOrders.toLocaleString()} orders</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-emerald-400">{seller.completionRate}% rate</span>

                    {buyerOrderFeedback && (
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 flex items-center gap-1 font-semibold"
                        title={`You left a ${buyerOrderFeedback.rating}-star review for this seller`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>You rated: {buyerOrderFeedback.rating}★</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Diamond Offer & Delivery SLA */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Offered Pack</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <Gem className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{pkg.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Stock: {seller.stock} packs
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Est. Speed</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-200">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>~{seller.avgDeliveryMinutes} mins</span>
                  </div>
                  <span className="text-[11px] text-emerald-400">
                    {seller.instantAutoDelivery ? 'Automated API' : 'Manual Moonton ID'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block mb-0.5">Accepted Payments</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {seller.acceptedPaymentMethods.map((m) => {
                      const det = getPaymentMethodDetails(m);
                      return (
                        <span
                          key={m}
                          title={det.name}
                          className="px-1.5 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 font-mono"
                        >
                          {det.flag} {det.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Price & Escrow Buy Action */}
              <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                <div className="text-left md:text-right">
                  <span className="text-[11px] text-slate-400 block">
                    {isFreeEligible ? (isBig ? 'VIP Big 💎 Price' : 'VIP Price') : 'Locked in Escrow'}
                  </span>
                  {isFreeEligible ? (
                    <div className="flex flex-col md:items-end">
                      <span className="text-xs text-slate-500 line-through font-mono">
                        {formatCurrency(seller.priceUsd, currency)}
                      </span>
                      <span className="text-lg sm:text-xl font-black font-mono text-amber-300 flex items-center gap-1">
                        <Crown className="w-4 h-4 text-amber-400" />
                        ₱0.00 FREE
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xl font-bold font-mono text-white tabular-nums">
                        {formatCurrency(seller.priceUsd, currency)}
                      </span>
                      {isBig && (
                        <span className="block text-[10px] text-amber-400/90 font-mono">
                          (VIP/Dev Free Perk)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onBuyFromSeller(seller, pkg)}
                  className={`px-4 py-2.5 rounded-lg font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                    !currentUser
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 hover:border-amber-300 shadow-amber-950/20'
                      : isFreeEligible
                      ? 'bg-gradient-to-r from-purple-600 via-amber-500 to-amber-400 hover:brightness-110 text-slate-950 shadow-purple-950/40 ring-1 ring-amber-300/50'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
                >
                  {!currentUser ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Sign In to Escrow Buy</span>
                    </>
                  ) : isFreeEligible ? (
                    <>
                      <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                      <span>👑 Claim Free (VIP/Dev)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Escrow Buy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })
      )}
      </div>
      )}

      {/* Seller Reviews & Reputation Modal */}
      {selectedSellerForReviews && (
        <SellerReviewsModal
          isOpen={!!selectedSellerForReviews}
          onClose={() => setSelectedSellerForReviews(null)}
          seller={selectedSellerForReviews}
          orders={orders}
        />
      )}

      {/* Diamond Seller Permission Restriction Modal */}
      {isSellerGateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/50 rounded-2xl p-6 shadow-2xl shadow-amber-950/40 relative overflow-hidden space-y-5">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/60 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Seller Gate Protocol
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Rule #ES-901</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                    Diamond Selling Is Restricted
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsSellerGateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Only Developer and VIP accounts can sell diamonds</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standard <strong>Buyer</strong> accounts cannot list or sell diamonds on the P2P Exchange. To protect gamers against fake top-up scams and guarantee 100% escrow settlement, all sellers must hold <strong>Platform Developer clearance</strong> or <strong>Verified VIP accreditation</strong>.
              </p>
            </div>

            {/* Current Account Status Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Active Session
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">
                    {currentUser?.name ? currentUser.name[0] : 'B'}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {currentUser?.name || 'Guest Visitor'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {currentUser?.email || 'Not authenticated'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold block">
                    Buyer (Cannot Sell)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Tier: {currentUser?.tier || 'Unverified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSellerGateModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                Understood, Continue as Buyer
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
