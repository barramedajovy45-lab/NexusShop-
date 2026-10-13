import React, { useState } from 'react';
import { Currency, DiamondPackage, EscrowOrder, PaymentMethod, SellerListing, SellerProfile, UserAccount } from '../types';
import { formatCurrency, getPaymentMethodDetails } from '../utils/formatters';
import { SellerPerformanceDashboard } from './SellerPerformanceDashboard';
import { SellerReputationBar } from './SellerReputationBar';
import { SellerD3TrendsChart } from './SellerD3TrendsChart';
import { OrderListSkeleton } from './SkeletonLoaders';
import { canSellDiamonds, isDeveloperUser, isVipUser } from '../data/mockData';
import {
  Store,
  DollarSign,
  ShieldCheck,
  Zap,
  PlusCircle,
  Clock,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Gem,
  Send,
  Crown,
  Lock,
  ShieldAlert,
  AlertTriangle,
  X,
  TrendingUp,
  Layers,
  RefreshCw,
} from 'lucide-react';

interface SellerDashboardProps {
  sellerProfile: SellerProfile;
  orders: EscrowOrder[];
  packages: DiamondPackage[];
  sellers: SellerListing[];
  currency: Currency;
  currentUser?: UserAccount | null;
  onUpdateOrders: (orders: EscrowOrder[]) => void;
  onAddListing: (listing: SellerListing) => void;
  onOpenOrderTracker: (order: EscrowOrder) => void;
  onSwitchAccount?: (account: UserAccount) => void;
  onBackToStore?: () => void;
  isLoading?: boolean;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  sellerProfile,
  orders,
  packages,
  sellers,
  currency,
  currentUser,
  onUpdateOrders,
  onAddListing,
  onOpenOrderTracker,
  onSwitchAccount,
  onBackToStore,
  isLoading = false,
}) => {
  const userCanSell = canSellDiamonds(currentUser);
  const isDev = isDeveloperUser(currentUser);
  const isVip = isVipUser(currentUser);
  const [permissionErrorNotice, setPermissionErrorNotice] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<'d3_daily' | 'monthly_breakdown' | 'both'>('d3_daily');
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);

  const handleSyncQueue = () => {
    setIsSyncingQueue(true);
    window.setTimeout(() => {
      setIsSyncingQueue(false);
    }, 350);
  };

  const showQueueSkeleton = isLoading || isSyncingQueue;

  // Payout states
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'gcash' | 'maya' | 'bank' | 'usdt'>('gcash');
  const [withdrawAmount, setWithdrawAmount] = useState(100);
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [availableBalance, setAvailableBalance] = useState(sellerProfile.availableBalanceUsd);

  // Create listing states
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [selectedPkgId, setSelectedPkgId] = useState(packages[1]?.id || 'pkg_86');
  const [listingPriceUsd, setListingPriceUsd] = useState(1.45);
  const [listingStock, setListingStock] = useState(500);
  const [listingSpeed, setListingSpeed] = useState(2);
  const [listingInstantAuto, setListingInstantAuto] = useState(true);
  const [listingMethods, setListingMethods] = useState<PaymentMethod[]>(['gcash', 'maya', 'paypal', 'bank_transfer', 'crypto_usdt']);

  // Orders that need seller attention
  const pendingOrders = orders.filter(
    (o) => o.status === 'escrow_locked' || o.status === 'seller_processing'
  );

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanSell) {
      setPermissionErrorNotice('Only Platform Developers and VIP Members can withdraw merchant escrow funds.');
      return;
    }
    if (withdrawAmount > availableBalance) return;

    setWithdrawStatus('processing');
    setTimeout(() => {
      setAvailableBalance((prev) => prev - withdrawAmount);
      setWithdrawStatus('done');
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawStatus('idle');
      }, 1500);
    }, 1500);
  };

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCanSell) {
      setPermissionErrorNotice('Diamond selling is restricted. Only Developers and VIP members can list diamonds for sale, not regular buyers.');
      return;
    }
    const pkg = packages.find((p) => p.id === selectedPkgId) || packages[0];
    const newListing: SellerListing = {
      id: 'listing_' + Date.now(),
      sellerId: sellerProfile.id,
      sellerName: sellerProfile.name,
      sellerAvatar: sellerProfile.avatar,
      sellerRating: sellerProfile.rating,
      totalOrders: sellerProfile.totalSales,
      avgDeliveryMinutes: listingSpeed,
      packageId: pkg.id,
      diamonds: pkg.diamonds,
      priceUsd: listingPriceUsd,
      stock: listingStock,
      instantAutoDelivery: listingInstantAuto,
      acceptedPaymentMethods: listingMethods,
      isProSeller: true,
      completionRate: 99.9,
    };
    onAddListing(newListing);
    setIsListingModalOpen(false);
  };

  const handleStartProcessing = (order: EscrowOrder) => {
    if (!userCanSell) {
      setPermissionErrorNotice('Order fulfillment requires Developer or VIP seller credentials.');
      return;
    }
    const updated = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: 'seller_processing' as const,
          sellerStartedAt: Date.now(),
          chatMessages: [
            ...(o.chatMessages || []),
            {
              id: 'msg_' + Date.now(),
              sender: 'seller' as const,
              senderName: sellerProfile.name,
              text: 'Authorized merchant has accepted your order and opened Moonton distributor gateway.',
              timestamp: Date.now(),
            },
          ],
        };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  const handleMarkDelivered = (order: EscrowOrder) => {
    if (!userCanSell) {
      setPermissionErrorNotice('Order fulfillment requires Developer or VIP seller credentials.');
      return;
    }
    const updated = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: 'delivered_pending_confirmation' as const,
          deliveredAt: Date.now(),
          inspectionWindowMinutes: 10,
          chatMessages: [
            ...(o.chatMessages || []),
            {
              id: 'msg_' + Date.now(),
              sender: 'seller' as const,
              senderName: sellerProfile.name,
              text: `Top-up dispatched to MLBB ID ${order.mlbbUserId} (${order.mlbbZoneId}). Escrow inspection countdown active.`,
              timestamp: Date.now(),
              isProof: true,
            },
          ],
        };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  const handleFulfillOrder = (order: EscrowOrder) => {
    if (!userCanSell) {
      setPermissionErrorNotice('Order fulfillment requires Developer or VIP seller credentials. Regular buyers cannot fulfill or sell diamond orders.');
      return;
    }
    const proofRef = 'MOON-SEA-' + Math.floor(10000 + Math.random() * 90000) + '-TX884';
    const updated = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: 'delivered_pending_confirmation' as const,
          proofUploadedAt: Date.now(),
          moontonTransactionRef: proofRef,
          proofImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
          autoReleaseMinutesRemaining: 15,
          chatMessages: [
            ...(Array.isArray(o.chatMessages) ? o.chatMessages : []),
            {
              id: 'msg_seller_f_' + Date.now(),
              sender: 'seller' as const,
              senderName: sellerProfile.name,
              text: `Diamonds successfully sent to MLBB ID ${o.mlbbUserId} (${o.mlbbZoneId}). Moonton Ref: ${proofRef}. 15-minute inspection window is now active!`,
              timestamp: Date.now(),
              isProof: true,
            }
          ]
        };
      }
      return o;
    });
    onUpdateOrders(updated);
  };

  return (
    <section className="py-8 space-y-6">
      {/* Permission Error Banner if action blocked */}
      {permissionErrorNotice && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/80 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-lg shadow-rose-950/30 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{permissionErrorNotice}</span>
          </div>
          <button
            onClick={() => setPermissionErrorNotice(null)}
            className="p-1 text-rose-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Seller Authorization & Verification Banner */}
      {userCanSell ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/50 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/80 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {isDev ? 'Master Developer Merchant Authority' : 'VIP Verified Diamond Merchant'}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isDev ? 'FULL DEV CLEARANCE' : 'VIP CERTIFIED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {isDev
                  ? 'Authenticated as Lead Developer (Ralph Jacob Barrameda). Unrestricted diamond listing and minting rights active.'
                  : `Authenticated as VIP Member (${currentUser?.name || 'VIP'}). Authorized to list and sell diamonds under Aegis Escrow.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-600/40 px-3 py-1.5 rounded-lg shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Escrow Collateral Active</span>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-amber-950/60 border border-rose-500/60 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/60 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wide">
                    Diamond Selling Prohibited · Standard Buyer Detected
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40">
                    BUYER ACCOUNT
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Only the Developer and VIP Members can sell diamonds, not buyers.
                </h3>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            To prevent fraud and maintain strict 100% escrow settlement delivery, standard <strong>Buyer</strong> accounts are not authorized to sell diamonds or create marketplace listings. Only accredited <strong>VIP Tier Members</strong> and the <strong>Platform Developer</strong> are granted seller privileges.
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {onBackToStore && (
              <button
                type="button"
                onClick={onBackToStore}
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <Store className="w-3.5 h-3.5 text-slate-950" />
                <span>Return to Top-Up Store</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Seller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <img
            src={sellerProfile.avatar}
            alt={sellerProfile.name}
            className="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {sellerProfile.name}
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                PRO SELLER
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" />
                ELITE TRADER (LVL 4)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Merchant Rating: ⭐ {sellerProfile.rating} · {sellerProfile.totalSales.toLocaleString()} Total Transactions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (userCanSell) {
                setIsListingModalOpen(true);
              } else {
                setPermissionErrorNotice('Selling Prohibited: Only Developers and VIP members can create diamond listings. Regular buyers cannot sell.');
              }
            }}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              userCanSell
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {userCanSell ? (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Create Diamond Listing</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Listing Locked (VIP/Dev Only)</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (userCanSell) {
                setIsWithdrawModalOpen(true);
              } else {
                setPermissionErrorNotice('Escrow payout withdrawals are reserved for authorized Developer and VIP sellers.');
              }
            }}
            className="px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <span>Withdraw Balance</span>
          </button>
        </div>
      </div>

      {/* Visual Seller Reputation Progress Bar & Levels */}
      <SellerReputationBar
        sellerProfile={sellerProfile}
        orders={orders}
      />

      {/* Real-Money Balance & Escrow Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Available Payout Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {formatCurrency(availableBalance, currency)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ready for instant GCash / Maya / Wire</span>
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="text-cyan-400 hover:underline font-semibold"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Escrow Locked Balance */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>In-Escrow Vault Holding</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 tabular-nums">
            {formatCurrency(sellerProfile.escrowLockedBalanceUsd, currency)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Releases after buyer inspection window</span>
            <span className="font-mono text-cyan-400">Locked</span>
          </div>
        </div>

        {/* Total Earned */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Lifetime Gross Earnings</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums">
            {formatCurrency(sellerProfile.totalEarnedUsd, currency)}
          </p>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>100% Guaranteed Escrow Settlements</span>
            <span className="text-emerald-400 font-mono">0% Chargebacks</span>
          </div>
        </div>
      </div>

      {/* Merchant Analytics: D3.js 30-Day Daily Trends & Recharts Monthly Breakdown */}
      <div className="space-y-4">
        {/* Analytics Switcher Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Merchant Performance Analytics
              </h3>
              <p className="text-[11px] text-slate-400">
                {analyticsView === 'd3_daily'
                  ? 'Visualizing 30-day continuous D3.js line trends for daily income & diamond volume'
                  : analyticsView === 'monthly_breakdown'
                  ? 'Visualizing monthly financial summaries, volume aggregates & escrow status breakdown'
                  : 'Displaying both D3.js 30-day daily charts and monthly breakdown side-by-side'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setAnalyticsView('d3_daily')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                analyticsView === 'd3_daily'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>D3.js 30-Day Trends</span>
            </button>

            <button
              type="button"
              onClick={() => setAnalyticsView('monthly_breakdown')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                analyticsView === 'monthly_breakdown'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Monthly & SLA Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setAnalyticsView('both')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                analyticsView === 'both'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Show Both
            </button>
          </div>
        </div>

        {/* 1. D3.js 30-Day Daily Trends Line Chart */}
        {(analyticsView === 'd3_daily' || analyticsView === 'both') && (
          <SellerD3TrendsChart
            sellerProfile={sellerProfile}
            orders={orders}
            currency={currency}
          />
        )}

        {/* 2. Recharts Monthly Performance & SLA Status Distribution */}
        {(analyticsView === 'monthly_breakdown' || analyticsView === 'both') && (
          <SellerPerformanceDashboard
            sellerProfile={sellerProfile}
            orders={orders}
            currency={currency}
          />
        )}
      </div>

      {/* Action Required: Pending Top-Up Queue */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <h3 className="font-bold text-base text-white">
              Escrow Orders Awaiting Top-Up Dispatch ({pendingOrders.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncQueue}
              disabled={showQueueSkeleton}
              className="px-2.5 py-1 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh incoming escrow order dispatch queue"
            >
              <RefreshCw className={`w-3 h-3 text-cyan-400 ${showQueueSkeleton ? 'animate-spin' : ''}`} />
              <span>{showQueueSkeleton ? 'Syncing Queue...' : 'Sync Queue'}</span>
            </button>
            <span className="text-xs text-slate-400 font-mono">
              SLA: 3 minutes max
            </span>
          </div>
        </div>

        {showQueueSkeleton ? (
          <OrderListSkeleton count={Math.max(2, pendingOrders.length || 2)} compact />
        ) : pendingOrders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-slate-950/50 rounded-xl border border-slate-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Queue is all clear!</p>
            <p className="mt-0.5">All incoming MLBB diamond orders have been fulfilled and are in inspection or settled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-xs">{ord.id}</span>
                    <span className="text-xs text-cyan-300 font-semibold">
                      {ord.packageName} ({ord.diamonds} 💎)
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-300">
                    Target MLBB ID: <span className="text-white font-bold">{ord.mlbbUserId}</span> (Zone: <span className="text-white font-bold">{ord.mlbbZoneId}</span>)
                    <span className="text-cyan-400 ml-2">IGN: {ord.mlbbIgn}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Escrow Locked: {formatCurrency(ord.amount, ord.currency)} via {ord.paymentMethod.toUpperCase()}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                  {ord.status === 'escrow_locked' && (
                    <button
                      onClick={() => handleStartProcessing(ord)}
                      className="flex-1 sm:flex-none py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Alert buyer that you are actively processing their recharge"
                    >
                      <span>Start Processing</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleFulfillOrder(ord)}
                    className="flex-1 sm:flex-none py-2 px-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Fulfill & Send Proof</span>
                  </button>
                  <button
                    onClick={() => onOpenOrderTracker(ord)}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                  >
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdraw Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Withdraw Real-Money Payout</h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {withdrawStatus === 'processing' ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">Dispatched to Banking Gateway...</p>
                <p className="text-xs text-slate-400">Processing real-money payout from Escrow Vault</p>
              </div>
            ) : withdrawStatus === 'done' ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-base font-bold text-white">Payout Dispatched Successfully!</p>
                <p className="text-xs text-slate-400">
                  {formatCurrency(withdrawAmount, currency)} sent to your {withdrawMethod.toUpperCase()} destination.
                </p>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Available to Withdraw:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatCurrency(availableBalance, currency)}
                    </span>
                  </div>
                  <input
                    type="number"
                    max={availableBalance}
                    min={5}
                    step={1}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Payout Destination:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('gcash')}
                      className={`p-2.5 rounded-lg border text-left font-medium ${
                        withdrawMethod === 'gcash'
                          ? 'border-cyan-500 bg-cyan-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>🇵🇭 GCash</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {sellerProfile.payoutMethods.gcash}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('maya')}
                      className={`p-2.5 rounded-lg border text-left font-medium ${
                        withdrawMethod === 'maya'
                          ? 'border-cyan-500 bg-cyan-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>🇵🇭 Maya</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {sellerProfile.payoutMethods.maya}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank')}
                      className={`p-2.5 rounded-lg border text-left font-medium ${
                        withdrawMethod === 'bank'
                          ? 'border-cyan-500 bg-cyan-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>🏦 Bank BDO</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {sellerProfile.payoutMethods.bank}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('usdt')}
                      className={`p-2.5 rounded-lg border text-left font-medium ${
                        withdrawMethod === 'usdt'
                          ? 'border-cyan-500 bg-cyan-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <span>🪙 USDT TRC20</span>
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        {sellerProfile.payoutMethods.usdt}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Withdrawal Fee:</span>
                    <span className="text-emerald-400 font-mono">₱0.00 (Zero Fee)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span className="text-white font-mono">Instant to 15 mins</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                  >
                    Confirm Payout
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {isListingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Create New Diamond Listing</h3>
              <button
                onClick={() => setIsListingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Select Diamond Package:
                </label>
                <select
                  value={selectedPkgId}
                  onChange={(e) => {
                    setSelectedPkgId(e.target.value);
                    const selected = packages.find((p) => p.id === e.target.value);
                    if (selected) setListingPriceUsd(selected.discountPriceUsd);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.diamonds} 💎 Base) - Moonton retail ${p.regularPriceUsd}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Your Selling Price (USD base):
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    value={listingPriceUsd}
                    onChange={(e) => setListingPriceUsd(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Equivalent: {formatCurrency(listingPriceUsd, currency)}
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Inventory Stock (Packs):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={listingStock}
                    onChange={(e) => setListingStock(parseInt(e.target.value, 10) || 10)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Delivery SLA (Minutes):
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={listingSpeed}
                  onChange={(e) => setListingSpeed(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white block">Auto-Dispatch via Moonton API</span>
                  <span className="text-[11px] text-slate-400">Recharges user ID automatically upon escrow lock</span>
                </div>
                <input
                  type="checkbox"
                  checked={listingInstantAuto}
                  onChange={(e) => setListingInstantAuto(e.target.checked)}
                  className="w-4 h-4 text-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsListingModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Publish Listing to P2P Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
