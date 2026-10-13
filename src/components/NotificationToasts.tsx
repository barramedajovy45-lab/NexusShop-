import React, { useEffect, useState, useRef } from 'react';
import { Currency, DiamondPackage, EscrowOrder, OrderToastNotification, SellerListing } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Gem,
  Volume2,
  VolumeX,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  BellRing
} from 'lucide-react';

interface NotificationToastsProps {
  notifications?: OrderToastNotification[];
  onDismiss: (id: string) => void;
  onSelectOrder: (order: EscrowOrder) => void;
  onBuyPackage?: (pkg: DiamondPackage, seller: SellerListing) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

interface ToastItemProps {
  notification: OrderToastNotification;
  onDismiss: (id: string) => void;
  onSelectOrder: (order: EscrowOrder) => void;
  onBuyPackage?: (pkg: DiamondPackage, seller: SellerListing) => void;
}

const TOAST_DURATION_MS = 7500;

const ToastItem: React.FC<ToastItemProps> = ({
  notification,
  onDismiss,
  onSelectOrder,
  onBuyPackage,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const hasDismissedRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50;
    const step = (intervalTime / TOAST_DURATION_MS) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - step;
        if (next <= 0) {
          clearInterval(interval);
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    if (progress <= 0 && !hasDismissedRef.current) {
      hasDismissedRef.current = true;
      onDismiss(notification.id);
    }
  }, [progress, notification.id, onDismiss]);

  const isPriceAlert = notification.statusType === 'price_alert';
  const isProcessing = notification.statusType === 'processing';
  const isAuth = notification.orderId === 'AUTH' || notification.id.startsWith('toast_auth_');

  if (isAuth) {
    const isSignOut =
      (notification.title ? notification.title.toLowerCase().includes('out') : false) ||
      (notification.message ? notification.message.toLowerCase().includes('out') : false);
    const displayText = isSignOut ? 'You signed out' : 'You signed in successfully';

    return (
      <div
        role="alert"
        aria-live="polite"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 shadow-2xl shadow-slate-950/60 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 sm:slide-in-from-right-4 text-slate-100"
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 to-emerald-400" />

        <div className="px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-white tracking-tight truncate">
              {displayText}
            </span>
          </div>

          <button
            onClick={() => onDismiss(notification.id)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-slate-800">
          <div
            className="h-full bg-cyan-400/80 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 sm:slide-in-from-right-4 ${
        isPriceAlert
          ? 'bg-slate-900/95 border-amber-500/60 shadow-amber-950/40 text-slate-100'
          : isProcessing
          ? 'bg-slate-900/95 border-blue-500/50 shadow-blue-950/40 text-slate-100'
          : 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-950/40 text-slate-100'
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`h-1 w-full ${
          isPriceAlert
            ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-cyan-400'
            : isProcessing
            ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500'
            : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500'
        }`}
      />

      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Status Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPriceAlert
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                : isProcessing
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-400'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isPriceAlert ? (
              <TrendingDown className="w-5 h-5 animate-bounce text-amber-400" />
            ) : isProcessing ? (
              <Zap className="w-5 h-5 animate-pulse text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    isPriceAlert
                      ? 'bg-amber-950/90 border-amber-500/60 text-amber-300'
                      : isProcessing
                      ? 'bg-blue-950/80 border-blue-600/50 text-blue-300'
                      : 'bg-emerald-950/80 border-emerald-600/50 text-emerald-300'
                  }`}
                >
                  {isPriceAlert
                    ? '🔥 Price Drop Alert'
                    : isProcessing
                    ? '⚡ Status: Processing'
                    : '✅ Status: Completed'}
                </span>
                {notification.orderId && (
                  <span className="text-[11px] font-mono text-slate-400">
                    {notification.orderId}
                  </span>
                )}
                {isPriceAlert && notification.savingsPct && (
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-700/50">
                    Save {notification.savingsPct}%
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss notification"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-semibold text-white tracking-tight">
              {notification.title}
            </h4>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {notification.message}
            </p>

            {/* Quick Order / Deal Pill Information */}
            <div className="mt-2.5 flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300 truncate">
                <Gem className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-semibold text-white truncate">
                  {(typeof notification.diamonds === 'number' ? notification.diamonds : 0).toLocaleString()} 💎
                </span>
                {notification.packageName && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 truncate">{notification.packageName}</span>
                  </>
                )}
                {notification.ign && (
                  <>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 truncate font-mono">{notification.ign}</span>
                  </>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-amber-400">
                  {formatCurrency(notification.amount ?? 0, notification.currency || 'PHP')}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Aegis Escrow Vault
              </span>

              {isPriceAlert && notification.diamondPackage && notification.seller ? (
                <button
                  onClick={() => {
                    onBuyPackage?.(notification.diamondPackage!, notification.seller!);
                    onDismiss(notification.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
                >
                  <span>Order at This Price</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : notification.order ? (
                <button
                  onClick={() => {
                    onSelectOrder(notification.order!);
                    onDismiss(notification.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isProcessing
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                  }`}
                >
                  <span>Track in Escrow</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-dismiss progress countdown */}
      <div className="h-1 w-full bg-slate-800/80">
        <div
          className={`h-full transition-all duration-75 ${
            isPriceAlert ? 'bg-amber-500' : isProcessing ? 'bg-cyan-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const NotificationToasts: React.FC<NotificationToastsProps> = ({
  notifications = [],
  onDismiss,
  onSelectOrder,
  onBuyPackage,
  soundEnabled,
  onToggleSound,
}) => {
  const safeNotifications = notifications || [];
  if (safeNotifications.length === 0) return null;

  return (
    <aside aria-label="Order and price alert notifications" className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-2 sm:px-0">
      {/* Render active toasts */}
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        {safeNotifications.map((n) => (
          <ToastItem
            key={n.id}
            notification={n}
            onDismiss={onDismiss}
            onSelectOrder={onSelectOrder}
            onBuyPackage={onBuyPackage}
          />
        ))}
      </div>
    </aside>
  );
};
