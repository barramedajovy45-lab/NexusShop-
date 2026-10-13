import React, { useState, useEffect, useRef } from 'react';
import { Currency, EscrowOrder, OrderStatus } from '../types';
import { formatCurrency, getOrderStatusMeta, getPaymentMethodDetails } from '../utils/formatters';
import {
  Clock,
  ShieldCheck,
  Gem,
  ChevronRight,
  Search,
  AlertCircle,
  CheckCircle2,
  Lock,
  Star,
  RotateCcw,
  FileSpreadsheet,
  Download,
  Sparkles,
  Trash2,
  RefreshCw,
  Undo2,
  ArrowLeftRight,
  Zap,
} from 'lucide-react';
import { ExportTransactionsModal } from './ExportTransactionsModal';
import { ClearHistoryModal } from './ClearHistoryModal';
import { downloadTransactionsCSV } from '../utils/csvExporter';
import { DiamondImage } from './DiamondImage';
import { OrderListSkeleton } from './SkeletonLoaders';
import { SwipeableOrderItem } from './SwipeableOrderItem';

interface OrdersListViewProps {
  orders: EscrowOrder[];
  currency: Currency;
  onOpenTracker: (order: EscrowOrder) => void;
  onNavigateToStore: () => void;
  onRateOrder?: (order: EscrowOrder) => void;
  onCancelOrder?: (order: EscrowOrder) => void;
  onUpdateOrder?: (order: EscrowOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
  onRestoreOrder?: (order: EscrowOrder) => void;
  onClearHistory?: (mode: 'cancelled' | 'completed' | 'finished' | 'all') => void;
  onRestoreSampleOrders?: () => void;
  isLoading?: boolean;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders,
  currency,
  onOpenTracker,
  onNavigateToStore,
  onRateOrder,
  onCancelOrder,
  onUpdateOrder,
  onDeleteOrder,
  onRestoreOrder,
  onClearHistory,
  onRestoreSampleOrders,
  isLoading = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled' | 'disputed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [exportNotification, setExportNotification] = useState<{ title: string; message: string } | null>(null);
  const [recentlyDismissedOrder, setRecentlyDismissedOrder] = useState<EscrowOrder | null>(null);
  const [isProcessingOrders, setIsProcessingOrders] = useState(false);
  const ordersTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);
  const prevCurrencyRef = useRef<Currency>(currency);

  const triggerOrdersSkeleton = (durationMs: number = 250) => {
    if (ordersTimerRef.current) {
      window.clearTimeout(ordersTimerRef.current);
    }
    setIsProcessingOrders(true);
    ordersTimerRef.current = window.setTimeout(() => {
      setIsProcessingOrders(false);
    }, durationMs);
  };

  useEffect(() => {
    if (prevCurrencyRef.current !== currency) {
      prevCurrencyRef.current = currency;
      triggerOrdersSkeleton(240);
    }
  }, [currency]);

  useEffect(() => {
    return () => {
      if (ordersTimerRef.current) {
        window.clearTimeout(ordersTimerRef.current);
      }
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const handleDismissOrderItem = (order: EscrowOrder) => {
    if (!onDeleteOrder) return;
    setRecentlyDismissedOrder(order);
    onDeleteOrder(order.id);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      setRecentlyDismissedOrder(null);
    }, 6000);
  };

  const handleUndoDismiss = () => {
    if (!recentlyDismissedOrder) return;
    if (onRestoreOrder) {
      onRestoreOrder(recentlyDismissedOrder);
    }
    setRecentlyDismissedOrder(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
  };

  const [nowTs, setNowTs] = useState<number>(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatAutoPayRemaining = (order: EscrowOrder) => {
    if (!order) return '0h 00m 00s';
    const deadline = order.autoPayDeadlineAt || (order.createdAt ? order.createdAt + 24 * 60 * 60 * 1000 : nowTs + 24 * 60 * 60 * 1000);
    const totalSecs = Math.max(0, Math.floor((deadline - nowTs) / 1000));
    if (isNaN(totalSecs) || totalSecs <= 0) return '0h 00m 00s';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleQuickPayOrder = (e: React.MouseEvent, order: EscrowOrder) => {
    e.stopPropagation();
    if (!order) return;
    if (!onUpdateOrder) {
      onOpenTracker(order);
      return;
    }
    const now = Date.now();
    const safeMethod = order.paymentMethod || 'gcash';
    const paymentName = getPaymentMethodDetails(safeMethod)?.name || 'Direct Payment';
    const safeAmount = typeof order.amount === 'number' ? order.amount : 0;
    const safeCurrency = order.currency || 'PHP';
    const safeSellerName = order.sellerName || 'Verified Merchant';
    const updated: EscrowOrder = {
      ...order,
      status: 'escrow_locked',
      escrowLockedAt: now,
      autoPaidAt: now,
      autoPayTriggered: true,
      autoPay24hEnabled: true,
      autoReleaseMinutesRemaining: 15,
      chatMessages: [
        ...(order.chatMessages || []),
        {
          id: 'msg_quick_autopay_' + now,
          sender: 'system',
          senderName: 'Nexus Shop 24h Auto-Pay Engine',
          text: `⚡ Payment of ${formatCurrency(safeAmount, safeCurrency, order.amountPhp)} processed via ${paymentName} and locked in Aegis Escrow Vault! Seller ${safeSellerName} dispatched.`,
          timestamp: now,
        },
      ],
    };
    onUpdateOrder(updated);
  };

  const showOrdersSkeleton = isLoading || isProcessingOrders;

  const completedOrders = (orders || []).filter((o) => o && o.status === 'completed');
  const completedCount = completedOrders.length;
  const cancelledOrders = (orders || []).filter((o) => o && (o.status === 'cancelled' || o.status === 'refunded'));
  const cancelledCount = cancelledOrders.length;
  const finishedCount = completedCount + cancelledCount;
  const completedSpend = completedOrders.reduce((sum, o) => sum + (o?.amount || 0), 0);
  const totalCompletedDiamonds = completedOrders.reduce(
    (sum, o) => sum + (o?.diamonds || 0) + (o?.bonusDiamonds || 0),
    0
  );

  const handleQuickDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (completedCount === 0) {
      setIsExportModalOpen(true);
      return;
    }
    const result = downloadTransactionsCSV(orders, { completedOnly: true, preferredCurrency: currency });
    setExportNotification({
      title: 'CSV File Downloaded',
      message: `Exported ${result.summary.totalRecords} completed orders to ${result.filename}`,
    });
    setTimeout(() => {
      setExportNotification(null);
    }, 4500);
  };

  const filteredOrders = (orders || []).filter((ord) => {
    if (!ord) return false;
    if (statusFilter === 'active') {
      if (ord.status === 'completed' || ord.status === 'refunded' || ord.status === 'cancelled') return false;
    } else if (statusFilter === 'completed') {
      if (ord.status !== 'completed') return false;
    } else if (statusFilter === 'cancelled') {
      if (ord.status !== 'cancelled' && ord.status !== 'refunded') return false;
    } else if (statusFilter === 'disputed') {
      if (ord.status !== 'disputed') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ord.id?.toLowerCase().includes(q) ||
        Boolean(ord.mlbbUserId?.includes(q)) ||
        ord.mlbbIgn?.toLowerCase().includes(q) ||
        ord.sellerName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
            <span>Automated Escrow Monitoring</span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Status</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Transaction Tracking & Escrow Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track real-money MLBB diamond orders, inspect Moonton recharge receipts, or confirm escrow releases.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Refresh Ledger Button */}
          <button
            type="button"
            onClick={() => triggerOrdersSkeleton(420)}
            disabled={showOrdersSkeleton}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync real-time Moonton escrow status and transaction receipts"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${showOrdersSkeleton ? 'animate-spin' : ''}`} />
            <span>{showOrdersSkeleton ? 'Syncing Ledger...' : 'Sync Ledger'}</span>
          </button>

          {/* Clear History Button for Cleanliness */}
          <button
            type="button"
            onClick={() => setIsClearHistoryModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer group"
            title="Clean up cancelled, finished, or old orders for a spotless history"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
            <span>Clear History</span>
            {finishedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 text-[10px] font-mono border border-slate-700">
                {finishedCount}
              </span>
            )}
          </button>

          {/* CSV Financial Export Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-600/50 hover:border-emerald-500 font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer group"
            title="Export completed transactions to CSV for personal budgeting and financial tracking"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Export CSV</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              {completedCount} Completed
            </span>
          </button>

          <button
            onClick={onNavigateToStore}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-colors cursor-pointer"
          >
            + New Diamond Top-Up
          </button>
        </div>
      </div>

      {/* Export Confirmation Floating Banner */}
      {exportNotification && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/60 shadow-lg shadow-emerald-950/50 flex items-center justify-between text-xs text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">{exportNotification.title}</span>
              <span className="text-[11px] text-emerald-300">{exportNotification.message}</span>
            </div>
          </div>
          <button
            onClick={() => setExportNotification(null)}
            className="text-emerald-400 hover:text-emerald-100 p-1 font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Personal Financial Tracking Spotlight Card when Completed Filter or Orders exist */}
      {completedCount > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 hover:border-emerald-800/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm">Personal Financial Accounting</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                  {completedCount} Completed
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Total spent: <span className="font-bold text-white font-mono">{formatCurrency(completedSpend, currency)}</span> ·{' '}
                <span className="text-amber-300 font-bold font-mono">{totalCompletedDiamonds.toLocaleString()} 💎</span> credited.
                Export clean CSV spreadsheets compatible with Excel, Sheets, Numbers, and YNAB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={handleQuickDownload}
              className="flex-1 md:flex-initial px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Quick Download CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex-1 md:flex-initial px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              Customize & Preview
            </button>
          </div>
        </div>
      )}

      {/* Anti-Scam & Escrow Vault Safety Assurance Bar */}
      <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-2">
              <span>Aegis 100% Anti-Scam Escrow Guarantee</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50 font-bold">
                UNSCAMMABLE
              </span>
            </span>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Payment is held safely in escrow until you verify in-game diamonds. Disputed orders freeze the countdown timer immediately for full refund evaluation.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400 font-mono">
          <span className="text-emerald-400">●</span>
          <span>Zero Account Theft Risk</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              if (statusFilter !== 'all') triggerOrdersSkeleton(220);
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => {
              if (statusFilter !== 'active') triggerOrdersSkeleton(220);
              setStatusFilter('active');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active In-Escrow ({orders.filter((o) => o.status !== 'completed' && o.status !== 'refunded' && o.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => {
              if (statusFilter !== 'completed') triggerOrdersSkeleton(220);
              setStatusFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({orders.filter((o) => o.status === 'completed').length})
          </button>
          <button
            onClick={() => {
              if (statusFilter !== 'cancelled') triggerOrdersSkeleton(220);
              setStatusFilter('cancelled');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              statusFilter === 'cancelled'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cancelled ({orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length})
          </button>
          <button
            onClick={() => {
              if (statusFilter !== 'disputed') triggerOrdersSkeleton(220);
              setStatusFilter('disputed');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
              statusFilter === 'disputed'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/80 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Disputes ({orders.filter((o) => o.status === 'disputed').length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {statusFilter === 'cancelled' && cancelledCount > 0 && onClearHistory && (
            <button
              type="button"
              onClick={() => onClearHistory('cancelled')}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Clear all cancelled orders for cleanliness"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cancelled ({cancelledCount})</span>
            </button>
          )}

          {statusFilter === 'completed' && completedCount > 0 && onClearHistory && (
            <button
              type="button"
              onClick={() => onClearHistory('completed')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title="Clear completed orders from view"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Completed ({completedCount})</span>
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, IGN, or User ID..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      {/* Mobile Swipe-to-Dismiss Ledger Cleanliness Hint & Undo Banner */}
      {recentlyDismissedOrder ? (
        <div className="mb-4 p-3 rounded-xl bg-slate-900/95 border border-rose-500/50 shadow-lg flex items-center justify-between gap-3 text-xs text-slate-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white block">
                Order #{recentlyDismissedOrder.id} dismissed from ledger
              </span>
              <span className="text-[11px] text-slate-400">
                {recentlyDismissedOrder.packageName} ({recentlyDismissedOrder.diamonds} 💎) removed for cleanliness.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onRestoreOrder && (
              <button
                type="button"
                onClick={handleUndoDismiss}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setRecentlyDismissedOrder(null)}
              className="px-2 py-1 text-slate-400 hover:text-white font-mono text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        finishedCount > 0 && (
          <div className="md:hidden mb-4 px-3.5 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                <strong className="text-white">Mobile Gesture Tip:</strong> Swipe left on any completed or cancelled order card to quickly dismiss it from your ledger.
              </span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800 shrink-0">
              {finishedCount} Cleanable
            </span>
          </div>
        )
      )}

      {/* Orders List or Skeleton Loader */}
      {showOrdersSkeleton ? (
        <OrderListSkeleton count={Math.max(3, Math.min(5, filteredOrders.length || 4))} />
      ) : filteredOrders.length === 0 ? (
        orders.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-xl bg-slate-900/30 border border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-950/40">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Order History is Spotless!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
              You have no active or past orders cluttering your ledger. Every transaction was cleaned for maximum cleanliness.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={onNavigateToStore}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                + New Diamond Top-Up
              </button>
              {onRestoreSampleOrders && (
                <button
                  type="button"
                  onClick={onRestoreSampleOrders}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Sample Orders</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-xl bg-slate-900/40 border border-slate-800">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Orders Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              There are no transactions matching your active filter ({statusFilter}).
            </p>
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold text-xs cursor-pointer"
            >
              View All Orders ({orders.length})
            </button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {filteredOrders.filter((o): o is EscrowOrder => Boolean(o && o.id)).map((order) => {
            const statusMeta = getOrderStatusMeta(order.status);
            const paymentMeta = getPaymentMethodDetails(order.paymentMethod || 'gcash');
            const canDismissOrder =
              Boolean(onDeleteOrder) &&
              (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded');

            return (
              <SwipeableOrderItem
                key={order.id}
                order={order}
                canDismiss={canDismissOrder}
                onDismiss={handleDismissOrderItem}
                onOpenTracker={onOpenTracker}
              >
                <div className="p-4 sm:p-5 rounded-xl bg-slate-900/95 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                {/* Left: Order Info & Diamond details */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <DiamondImage
                    src={order.packageImage}
                    packageData={{
                      id: order.packageId,
                      diamonds: order.diamonds,
                      packageName: order.packageName,
                    }}
                    size="md"
                    showGlow
                    className="rounded-xl border-cyan-500/40 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-md shadow-cyan-950/40"
                    alt={`${order.packageName} Diamond`}
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-white text-sm">
                        {order.id}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border} font-semibold`}>
                        {statusMeta.label}
                      </span>
                      {order.status === 'completed' && order.feedback && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{order.feedback.rating}.0 Rated</span>
                        </span>
                      )}
                      {order.status === 'completed' && !order.feedback && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1">
                          <span>Pending Feedback</span>
                        </span>
                      )}
                      {(order.extensionCount || 0) > 0 && order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'cancelled' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-300 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>+24h Ext #{order.extensionCount}</span>
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/60 text-rose-300 font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3 text-rose-400" />
                          <span>100% Refunded</span>
                        </span>
                      )}
                      {(order.diamondsReceivedVerified || order.moontonApiVerification?.status === 'credited') && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-bold flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Auto-Detected In-Game</span>
                        </span>
                      )}
                      {order.autoPayTriggered && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-400/70 text-emerald-300 font-bold flex items-center gap-1 shadow-sm">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          <span>24h Auto-Paid</span>
                        </span>
                      )}
                      {!order.autoPayTriggered &&
                        order.autoPay24hEnabled !== false &&
                        order.status !== 'completed' &&
                        order.status !== 'cancelled' &&
                        order.status !== 'refunded' &&
                        order.status !== 'disputed' && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-bold flex items-center gap-1 shadow-sm"
                            title="If the buyer doesn't pay or confirm within 24 hours, payment is automatically processed"
                          >
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>Auto-Pay in {formatAutoPayRemaining(order)}</span>
                          </span>
                        )}
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      {order.quantity && order.quantity > 1 ? `${order.quantity}x ` : ''}
                      {order.packageName} · {order.diamonds} 💎
                      {order.bonusDiamonds > 0 && ` (+${order.bonusDiamonds} Bonus)`}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>Target: {order.mlbbIgn}</span>
                      <span aria-hidden="true">·</span>
                      <span>ID: {order.mlbbUserId} ({order.mlbbZoneId})</span>
                    </div>

                    {order.status === 'cancelled' && order.cancellationReason && (
                      <p className="text-[11px] text-rose-300/90 mt-1 font-mono flex items-center gap-1.5">
                        <span className="text-rose-400 font-semibold">Cancelled:</span>
                        <span>{order.cancellationReason}</span>
                        {order.refundTransactionRef && (
                          <span className="text-slate-500 text-[10px]">({order.refundTransactionRef})</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Middle: Seller & Payment */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Fulfilling Seller</span>
                    <span className="font-semibold text-slate-200 block truncate">
                      {order.sellerName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ⭐ {order.sellerRating}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Payment Escrow</span>
                    <div className="flex items-center gap-1 text-slate-200 font-medium">
                      <span>{paymentMeta.flag}</span>
                      <span>{paymentMeta.name}</span>
                    </div>
                    {order.status === 'cancelled' ? (
                      <span className="text-[11px] text-rose-400 font-mono font-semibold">
                        Refunded 100%
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-mono">
                        Vault Secured
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-left md:text-right">
                    {(order.bulkDiscountApplied || order.gcashDiscountApplied) && (
                      <div className="flex items-center md:justify-end gap-1 mb-0.5">
                        {order.bulkDiscountApplied && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                            5% Bulk
                          </span>
                        )}
                        {order.gcashDiscountApplied && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                            2% GCash
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-[11px] text-slate-400 block">
                      {order.status === 'cancelled' ? 'Escrow Refund' : 'Total Escrow'}
                    </span>
                    <span className={`text-lg font-bold font-mono tabular-nums ${order.status === 'cancelled' ? 'text-rose-300' : 'text-white'}`}>
                      {formatCurrency(order.amount, order.currency, order.amountPhp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {order.status === 'escrow_pending' && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickPayOrder(e, order)}
                        className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Pay now or trigger 24-hour Auto-Pay immediately"
                      >
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Pay / Auto-Pay</span>
                      </button>
                    )}

                    {onCancelOrder && (order.status === 'escrow_pending' || order.status === 'escrow_locked' || order.status === 'seller_processing') && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelOrder(order);
                        }}
                        className="px-3 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-semibold text-xs border border-rose-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Cancel diamond order and refund escrow"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>Cancel</span>
                      </button>
                    )}

                    {order.status === 'completed' && !order.feedback && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onRateOrder) {
                            onRateOrder(order);
                          } else {
                            onOpenTracker(order);
                          }
                        }}
                        className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm shadow-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Rate this completed transaction"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Rate Seller</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <span>View Tracker</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onDeleteOrder && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissOrderItem(order);
                        }}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/40 transition-colors cursor-pointer"
                        title="Delete order from history for cleanliness"
                        aria-label={`Delete order ${order.id} from history`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                </div>
              </SwipeableOrderItem>
            );
          })}
        </div>
      )}

      {/* Export Financial Transactions CSV Modal */}
      <ExportTransactionsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        orders={orders}
        currency={currency}
        onShowToast={(title, message) => {
          setExportNotification({ title, message });
          setTimeout(() => setExportNotification(null), 5000);
        }}
      />

      {/* Clear Order History Modal for Cleanliness */}
      <ClearHistoryModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        orders={orders}
        onClear={(mode) => {
          if (onClearHistory) {
            onClearHistory(mode);
          }
        }}
        onRestoreSampleOrders={onRestoreSampleOrders}
      />
    </section>
  );
};
