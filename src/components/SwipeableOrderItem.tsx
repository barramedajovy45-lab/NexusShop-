import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Lock, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { EscrowOrder } from '../types';

interface SwipeableOrderItemProps {
  order: EscrowOrder;
  canDismiss: boolean;
  onDismiss: (order: EscrowOrder) => void;
  onOpenTracker: (order: EscrowOrder) => void;
  children: React.ReactNode;
}

/**
 * Swipe-to-Dismiss wrapper for Order list items on mobile & touch-enabled viewports.
 * - Swiping left reveals a crimson "Swipe to Dismiss" ledger cleanup action.
 * - Swiping past the threshold (-105px) or flicking rapidly triggers dismissal with a smooth collapse animation.
 * - Swiping partially (-55px to -104px) snaps open an action drawer with a tap-to-confirm "Dismiss" button.
 * - Active In-Escrow orders that cannot be casually dismissed without refund/cancellation show a protected Vault Lock bounce indicator.
 */
export const SwipeableOrderItem: React.FC<SwipeableOrderItemProps> = ({
  order,
  canDismiss,
  onDismiss,
  onOpenTracker,
  children,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [lockedFeedback, setLockedFeedback] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentOffsetRef = useRef(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const didSwipeRef = useRef(false);
  const lockedTimerRef = useRef<number | null>(null);

  const SNAP_OPEN_OFFSET = -92;
  const FULL_DISMISS_THRESHOLD = -135;
  const MAX_LOCKED_DRAG = -56;

  useEffect(() => {
    return () => {
      if (lockedTimerRef.current) {
        window.clearTimeout(lockedTimerRef.current);
      }
    };
  }, []);

  const triggerDismiss = () => {
    if (!canDismiss || isRemoving) return;
    setIsRemoving(true);
    setTranslateX(-420);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(18);
      } catch {}
    }
    window.setTimeout(() => {
      onDismiss(order);
    }, 240);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRemoving || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    currentOffsetRef.current = translateX;
    isHorizontalSwipeRef.current = null;
    didSwipeRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || isRemoving) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Determine gesture direction lock on initial movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }
      isHorizontalSwipeRef.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.15;
    }

    if (!isHorizontalSwipeRef.current) {
      return;
    }

    didSwipeRef.current = true;

    let nextX = currentOffsetRef.current + deltaX;

    // Only allow swiping left (or closing an already-open drawer)
    if (nextX > 0) {
      nextX = nextX * 0.15;
    }

    if (!canDismiss) {
      // Elastic resistance for active escrow orders that shouldn't be accidentally deleted
      if (nextX < MAX_LOCKED_DRAG) {
        const extra = nextX - MAX_LOCKED_DRAG;
        nextX = MAX_LOCKED_DRAG + extra * 0.18;
      }
    } else {
      // Smooth elastic resistance beyond -220px
      if (nextX < -220) {
        const extra = nextX + 220;
        nextX = -220 + extra * 0.3;
      }
    }

    setTranslateX(nextX);
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || isRemoving) {
      setIsDragging(false);
      return;
    }

    const elapsed = Math.max(1, Date.now() - touchStartRef.current.time);
    const totalDeltaX = translateX - currentOffsetRef.current;
    const velocityX = totalDeltaX / elapsed; // px per ms

    setIsDragging(false);
    touchStartRef.current = null;

    if (!canDismiss) {
      if (translateX < -30) {
        setLockedFeedback(true);
        if (lockedTimerRef.current) window.clearTimeout(lockedTimerRef.current);
        lockedTimerRef.current = window.setTimeout(() => {
          setLockedFeedback(false);
        }, 2400);
      }
      setTranslateX(0);
      return;
    }

    // Full swipe or fast flick left -> immediate dismiss
    if (translateX <= FULL_DISMISS_THRESHOLD || (translateX < -60 && velocityX < -0.55)) {
      triggerDismiss();
      return;
    }

    // Half-swipe -> snap open action button so user can tap "Dismiss" or swipe again
    if (translateX <= -52) {
      setTranslateX(SNAP_OPEN_OFFSET);
      return;
    }

    // Otherwise snap closed
    setTranslateX(0);
  };

  const handleCardClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (translateX < -10) {
      setTranslateX(0);
      return;
    }
    onOpenTracker(order);
  };

  const isThresholdArmed = canDismiss && translateX <= FULL_DISMISS_THRESHOLD;
  const isRevealed = translateX < -6;

  return (
    <div
      className={`relative rounded-xl overflow-hidden select-none transition-all duration-200 ${
        isRemoving ? 'opacity-0 max-h-0 -my-1.5 scale-95 pointer-events-none' : 'max-h-[600px] opacity-100'
      }`}
    >
      {/* Background Action Layer (Revealed when swiping left on mobile/touch) */}
      <div
        aria-hidden={!isRevealed}
        className={`absolute inset-0 rounded-xl flex items-center justify-end px-4 transition-colors duration-150 ${
          !canDismiss
            ? 'bg-gradient-to-r from-slate-900 via-amber-950/70 to-amber-900/80 border border-amber-500/40'
            : isThresholdArmed
            ? 'bg-gradient-to-r from-rose-950 via-rose-800 to-rose-600 border border-rose-400/60'
            : 'bg-gradient-to-r from-slate-950 via-rose-950/80 to-rose-900/90 border border-rose-500/40'
        }`}
      >
        {canDismiss ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerDismiss();
            }}
            className="flex items-center gap-2 text-white font-bold text-xs px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
            aria-label={`Dismiss order ${order.id} from ledger`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 ${
                isThresholdArmed
                  ? 'bg-white text-rose-600 scale-110 shadow-lg'
                  : 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-extrabold tracking-wide uppercase">
                {isThresholdArmed ? 'Release to Dismiss' : 'Dismiss'}
              </span>
              <span className="block text-[10px] text-rose-200/90 font-mono">
                {isThresholdArmed ? 'Purge from ledger' : 'Tap or swipe further'}
              </span>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold pr-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-bold text-amber-200">Active Escrow Protected</span>
              <span className="block text-[10px] text-amber-300/80 font-mono">Cancel or complete first</span>
            </div>
          </div>
        )}
      </div>

      {/* Protected Escrow Feedback Banner if user tried to swipe-delete an active order */}
      {lockedFeedback && !canDismiss && (
        <div className="mb-1.5 px-3 py-1.5 rounded-lg bg-amber-950/90 border border-amber-500/50 text-[11px] text-amber-200 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Active Escrow Order:</strong> Cannot swipe-dismiss while funds are locked in vault. Cancel or complete the order first.
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLockedFeedback(false);
            }}
            className="text-[10px] font-mono text-amber-300 hover:text-white shrink-0"
          >
            OK
          </button>
        </div>
      )}

      {/* Foreground Order Card Layer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: translateX !== 0 ? `translate3d(${translateX}px, 0, 0)` : undefined,
          transition: isDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
        }}
        className="relative z-10"
      >
        {children}

        {/* Subtle Mobile Swipe Affordance Pill on Dismissible Cards */}
        {canDismiss && translateX === 0 && (
          <div className="md:hidden mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-slate-400">
              <ArrowLeftRight className="w-3 h-3 text-cyan-400/80" />
              <span>Swipe left to dismiss from ledger</span>
            </span>
            <span className="text-rose-400/80 font-semibold">← Clean Up</span>
          </div>
        )}
      </div>
    </div>
  );
};
