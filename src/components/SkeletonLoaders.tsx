import React from 'react';

interface PackageStoreSkeletonProps {
  count?: number;
}

/**
 * High-precision Skeleton Loader for PackageStore cards.
 * Matches the exact geometry, padding, height, and responsive grid (1 / 2 / 3 / 4 columns)
 * of PackageStore cards to prevent Cumulative Layout Shift (CLS) while fetching or filtering.
 */
export const PackageStoreSkeleton: React.FC<PackageStoreSkeletonProps> = ({ count = 8 }) => {
  return (
    <div
      id="package-store-skeleton-grid"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading diamond packages"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-16"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`pkg-skeleton-${idx}`}
          className="relative rounded-xl bg-slate-900/75 border border-slate-800/90 p-5 flex flex-col justify-between min-h-[430px] overflow-hidden shadow-lg"
        >
          {/* Shimmer sweep overlay */}
          <div className="skeleton-shimmer-bar pointer-events-none" />

          {/* Top Section: Bulk Toggle + Badge + Diamond Header */}
          <div>
            {/* Row 1: Bulk select checkbox & savings pill */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="h-6 w-24 rounded-md bg-slate-800/90 animate-pulse" />
              <div className="h-5 w-16 rounded bg-emerald-950/60 border border-emerald-800/30 animate-pulse" />
            </div>

            {/* Row 2: 3D Diamond Icon + Package Title & Base/Bonus Subtitle */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-xl bg-slate-800/95 border border-cyan-500/20 shrink-0 animate-pulse" />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="h-4 w-3/4 rounded bg-slate-800 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-800/80 animate-pulse" />
                  <div className="h-2.5 w-2/3 rounded bg-slate-800/60 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Row 3: Quantity Stepper & 4-Column Quick Preset Buttons */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <div className="h-3.5 w-16 rounded bg-slate-800/80 animate-pulse" />
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
                  <div className="w-11 h-8 rounded-lg bg-slate-950 border border-slate-800 animate-pulse" />
                  <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((preset) => (
                  <div
                    key={preset}
                    className="min-h-[34px] rounded-lg bg-slate-950/80 border border-slate-800/90 animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Row 4: Escrow Price & In-Game Store Comparison */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-baseline justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-24 rounded bg-slate-800/80 animate-pulse" />
                  <div className="h-6 w-28 rounded bg-slate-800 animate-pulse" />
                </div>
                <div className="space-y-1.5 text-right flex flex-col items-end">
                  <div className="h-2.5 w-16 rounded bg-slate-800/70 animate-pulse" />
                  <div className="h-3.5 w-14 rounded bg-slate-800/60 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Row 5: GCash Promo & Total Inventory Bar */}
            <div className="mt-2.5 h-7 rounded-md bg-blue-950/25 border border-blue-900/30 animate-pulse" />
            <div className="mt-2 h-7 rounded-lg bg-slate-950/70 border border-slate-800/80 animate-pulse" />

            {/* Row 6: Seller Info Drawer */}
            <div className="mt-2 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-5 h-5 rounded-full bg-slate-800 shrink-0 animate-pulse" />
                <div className="h-3.5 w-24 rounded bg-slate-800 animate-pulse" />
                <div className="h-4 w-14 rounded-full bg-slate-800/90 animate-pulse" />
              </div>
              <div className="h-4 w-12 rounded bg-slate-800/80 animate-pulse shrink-0" />
            </div>
          </div>

          {/* Bottom Section: Action Buttons (44px+ Buy Now + 42px Add to Cart / Alert) */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2.5">
            <div className="w-full min-h-[44px] rounded-xl bg-amber-500/20 border border-amber-500/30 animate-pulse" />
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8 min-h-[42px] rounded-xl bg-slate-800/80 border border-slate-700/60 animate-pulse" />
              <div className="col-span-4 min-h-[42px] rounded-xl bg-slate-900 border border-slate-800 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

interface SellerMarketplaceSkeletonProps {
  count?: number;
}

/**
 * High-precision Skeleton Loader for P2PMarketplace merchant rows.
 * Matches the horizontal desktop / stacked mobile layout of P2PMarketplace cards
 * so filtering, sorting, or syncing merchant data produces zero layout shift.
 */
export const SellerMarketplaceSkeleton: React.FC<SellerMarketplaceSkeletonProps> = ({ count = 5 }) => {
  return (
    <div
      id="seller-marketplace-skeleton-list"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading verified P2P merchants"
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`seller-skeleton-${idx}`}
          className="relative p-4 sm:p-5 rounded-xl bg-slate-900/75 border border-slate-800 min-h-[104px] flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden shadow-md"
        >
          <div className="skeleton-shimmer-bar pointer-events-none" />

          {/* Left: Seller Avatar, Name, Pro Badge & Ratings */}
          <div className="flex items-center gap-3.5 min-w-[240px]">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 shrink-0 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
                <div className="h-4 w-10 rounded bg-cyan-950/70 border border-cyan-800/40 animate-pulse" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-4 w-14 rounded bg-amber-950/50 border border-amber-700/30 animate-pulse" />
                <div className="h-3.5 w-20 rounded bg-slate-800/80 animate-pulse" />
                <div className="h-3.5 w-16 rounded bg-slate-800/80 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Middle: Offered Pack, Est. Speed & Accepted Payments */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 max-w-xl">
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-slate-800/70 animate-pulse" />
              <div className="h-4 w-28 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-slate-800/60 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-16 rounded bg-slate-800/70 animate-pulse" />
              <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
              <div className="h-3 w-24 rounded bg-emerald-950/60 animate-pulse" />
            </div>
            <div className="col-span-2 sm:col-span-1 space-y-1.5">
              <div className="h-3 w-28 rounded bg-slate-800/70 animate-pulse" />
              <div className="flex flex-wrap gap-1">
                <div className="h-5 w-16 rounded bg-slate-800 animate-pulse" />
                <div className="h-5 w-14 rounded bg-slate-800 animate-pulse" />
                <div className="h-5 w-16 rounded bg-slate-800 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right: Price & Escrow Buy Button */}
          <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
            <div className="space-y-1.5 md:text-right">
              <div className="h-3 w-20 rounded bg-slate-800/70 animate-pulse md:ml-auto" />
              <div className="h-6 w-24 rounded bg-slate-800 animate-pulse md:ml-auto" />
            </div>
            <div className="h-10 w-32 rounded-lg bg-cyan-500/25 border border-cyan-500/30 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface OrderListSkeletonProps {
  count?: number;
  compact?: boolean;
}

/**
 * High-precision Skeleton Loader for OrdersListView & SellerDashboard order queues.
 * Prevents layout shift while escrow ledger records are being fetched, filtered, or synced.
 */
export const OrderListSkeleton: React.FC<OrderListSkeletonProps> = ({ count = 4, compact = false }) => {
  return (
    <div
      id="order-list-skeleton-container"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading escrow orders"
      className="space-y-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`order-skeleton-${idx}`}
          className={`relative rounded-xl bg-slate-900/75 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden shadow-md ${
            compact ? 'p-4 min-h-[88px]' : 'p-4 sm:p-5 min-h-[108px]'
          }`}
        >
          <div className="skeleton-shimmer-bar pointer-events-none" />

          {/* Left: Diamond Icon + Order ID, Status Pill, Package & Target MLBB ID */}
          <div className="flex items-start sm:items-center gap-3.5">
            {!compact && (
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-cyan-500/20 shrink-0 animate-pulse" />
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-4 w-28 rounded bg-slate-800 animate-pulse" />
                <div className="h-4 w-24 rounded bg-cyan-950/60 border border-cyan-800/40 animate-pulse" />
                <div className="h-4 w-20 rounded bg-emerald-950/50 border border-emerald-800/30 animate-pulse" />
              </div>
              <div className="h-3.5 w-52 rounded bg-slate-800/90 animate-pulse" />
              <div className="h-3 w-44 rounded bg-slate-800/70 animate-pulse" />
            </div>
          </div>

          {/* Middle: Fulfilling Seller & Payment Escrow */}
          {!compact && (
            <div className="grid grid-cols-2 gap-4 min-w-[210px]">
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-800/70 animate-pulse" />
                <div className="h-3.5 w-24 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-12 rounded bg-slate-800/60 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-800/70 animate-pulse" />
                <div className="h-3.5 w-20 rounded bg-slate-800 animate-pulse" />
                <div className="h-3 w-16 rounded bg-emerald-950/60 animate-pulse" />
              </div>
            </div>
          )}

          {/* Right: Total Escrow Amount & Action Buttons */}
          <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80 shrink-0">
            {!compact && (
              <div className="space-y-1.5 md:text-right">
                <div className="h-3 w-16 rounded bg-slate-800/70 animate-pulse md:ml-auto" />
                <div className="h-5 w-24 rounded bg-slate-800 animate-pulse md:ml-auto" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 rounded-lg bg-slate-800 border border-slate-700 animate-pulse" />
              <div className="h-9 w-9 rounded-lg bg-slate-800/70 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
