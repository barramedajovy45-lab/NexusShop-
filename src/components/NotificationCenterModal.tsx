import React, { useState } from 'react';
import { Currency, DiamondPackage, EscrowOrder, OrderToastNotification, SellerListing } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gem,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
  Play,
  ShieldCheck,
  CheckCheck,
  TrendingDown,
  ArrowRight,
  BellRing,
  Filter
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: OrderToastNotification[];
  onClearAll: () => void;
  onMarkAllRead: () => void;
  onSelectOrder: (order: EscrowOrder) => void;
  onSimulateStatusChange: (statusType: 'processing' | 'completed') => void;
  onSimulatePriceDrop?: () => void;
  onBuyPackage?: (pkg: DiamondPackage, seller: SellerListing) => void;
  onOpenPriceAlertsManager?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onCleanupOld?: () => void;
  onSimulateOldNotification?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onClearAll,
  onMarkAllRead,
  onSelectOrder,
  onSimulateStatusChange,
  onSimulatePriceDrop,
  onBuyPackage,
  onOpenPriceAlertsManager,
  soundEnabled,
  onToggleSound,
  onCleanupOld,
  onSimulateOldNotification,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'price_alert' | 'orders'>('all');

  if (!isOpen) return null;

  const safeNotifications = notifications || [];
  const unreadCount = safeNotifications.filter((n) => n && !n.read).length;
  const priceAlertsCount = safeNotifications.filter((n) => n && n.statusType === 'price_alert').length;
  const ordersCount = safeNotifications.filter((n) => n && n.statusType !== 'price_alert').length;

  const filteredNotifications = safeNotifications.filter((n) => {
    if (!n) return false;
    if (filterType === 'price_alert') return n.statusType === 'price_alert';
    if (filterType === 'orders') return n.statusType !== 'price_alert';
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in-0"
    >
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden mt-14 sm:mt-16 animate-in slide-in-from-right-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-slate-950 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="notification-center-title" className="font-bold text-sm text-white">
                  Notifications & Price Alerts
                </h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Live escrow status updates & market price drops · Auto-purged &gt;48h
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation */}
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.8 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('price_alert')}
              className={`px-2 py-0.8 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'price_alert'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Price Alerts ({priceAlertsCount})</span>
            </button>
            <button
              onClick={() => setFilterType('orders')}
              className={`px-2 py-0.8 rounded-md font-medium text-[11px] transition-colors cursor-pointer ${
                filterType === 'orders'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Orders ({ordersCount})
            </button>
          </div>

          {onOpenPriceAlertsManager && (
            <button
              onClick={() => {
                onClose();
                onOpenPriceAlertsManager();
              }}
              className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <BellRing className="w-3 h-3" />
              <span>Manage Alerts</span>
            </button>
          )}
        </div>

        {/* Action Bar / Simulation triggers */}
        <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between gap-1.5 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-mono">Simulate:</span>
            {onSimulatePriceDrop && (
              <button
                onClick={onSimulatePriceDrop}
                className="px-2 py-0.5 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Test a real-time 'Price Drop Alert' notification"
              >
                <TrendingDown className="w-3 h-3 text-amber-400" />
                <span>+ Price Drop</span>
              </button>
            )}
            <button
              onClick={() => onSimulateStatusChange('processing')}
              className="px-2 py-0.5 rounded bg-blue-950/80 hover:bg-blue-900 border border-blue-700/50 text-blue-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Test a real-time 'Processing' order toast"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>+ Processing</span>
            </button>
            <button
              onClick={() => onSimulateStatusChange('completed')}
              className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Test a real-time 'Completed' order toast"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>+ Completed</span>
            </button>
            {onSimulateOldNotification && (
              <button
                onClick={onSimulateOldNotification}
                className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700/50 text-purple-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Simulate a notification from 52 hours ago to test 48h auto-cleanup"
              >
                <Clock className="w-3 h-3 text-purple-400" />
                <span>+ Old (&gt;48h)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onCleanupOld && (
              <button
                onClick={onCleanupOld}
                title="Clean up notifications older than 48 hours (Archives & purges expired)"
                className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                title="Mark all as read"
                className="p-1 text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                title="Clear all alerts"
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {filterType === 'price_alert' ? 'No Price Drop Alerts Yet' : 'No Notifications Yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {filterType === 'price_alert'
                  ? 'Set target alerts on diamond packages to be alerted when seller listings drop.'
                  : 'Order status transitions and price alert triggers will appear here in real-time.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isAuth = n.orderId === 'AUTH' || n.id.startsWith('toast_auth_');
              const isPriceDrop = n.statusType === 'price_alert';
              const isProc = n.statusType === 'processing';
              const timeAgo = Math.max(0, Math.floor((Date.now() - n.timestamp) / 1000));
              const timeString =
                timeAgo < 60
                  ? `${timeAgo}s ago`
                  : timeAgo < 3600
                  ? `${Math.floor(timeAgo / 60)}m ago`
                  : timeAgo < 86400
                  ? `${Math.floor(timeAgo / 3600)}h ago`
                  : `${Math.floor(timeAgo / 86400)}d ago`;

              if (isAuth) {
                const isSignOut =
                  (n.title ? n.title.toLowerCase().includes('out') : false) ||
                  (n.message ? n.message.toLowerCase().includes('out') : false);
                const displayText = isSignOut ? 'You signed out' : 'You signed in successfully';

                return (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-900/50 transition-all ${
                      !n.read ? 'ring-1 ring-cyan-500/30' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-semibold text-white tracking-tight truncate">
                          {displayText}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {timeString}
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isPriceDrop
                      ? 'bg-amber-950/20 hover:bg-amber-950/35 border-amber-500/40 hover:border-amber-500/70'
                      : isProc
                      ? 'bg-slate-950/40 hover:bg-blue-950/30 border-slate-800/80 hover:border-blue-700/50'
                      : 'bg-slate-950/40 hover:bg-emerald-950/30 border-slate-800/80 hover:border-emerald-700/50'
                  } ${!n.read ? 'ring-1 ring-cyan-500/30' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isPriceDrop
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                          : isProc
                          ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400'
                          : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
                      }`}
                    >
                      {isPriceDrop ? (
                        <TrendingDown className="w-4 h-4 text-amber-400" />
                      ) : isProc ? (
                        <Zap className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                              isPriceDrop
                                ? 'bg-amber-950 border-amber-500/60 text-amber-300'
                                : isProc
                                ? 'bg-blue-950 border-blue-700/50 text-blue-300'
                                : 'bg-emerald-950 border-emerald-700/50 text-emerald-300'
                            }`}
                          >
                            {isPriceDrop ? '🔥 Price Alert' : isProc ? 'Processing' : 'Completed'}
                          </span>
                          {isPriceDrop && n.savingsPct && (
                            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-700/50">
                              -{n.savingsPct}%
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeString}
                        </span>
                      </div>

                      <h5 className="text-xs font-semibold text-white truncate">
                        {n.title}
                      </h5>

                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Gem className="w-3.5 h-3.5 text-cyan-400" />
                          {(typeof n.diamonds === 'number' ? n.diamonds : 0).toLocaleString()} 💎 · {formatCurrency(n.amount ?? 0, n.currency || 'PHP')}
                        </span>

                        {isPriceDrop && n.diamondPackage && n.seller ? (
                          <button
                            onClick={() => {
                              onBuyPackage?.(n.diamondPackage!, n.seller!);
                              onClose();
                            }}
                            className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 text-[11px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                          >
                            <span>Buy Now</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : n.order ? (
                          <button
                            onClick={() => {
                              onSelectOrder(n.order!);
                              onClose();
                            }}
                            className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px] cursor-pointer"
                          >
                            <span>Track in Escrow</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            24/7 Aegis Price & Order Guard
          </span>
          <span>{notifications.length} total events</span>
        </div>
      </div>
    </div>
  );
};
