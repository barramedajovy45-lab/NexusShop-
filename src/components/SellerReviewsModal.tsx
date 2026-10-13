import React from 'react';
import { EscrowOrder, SellerListing } from '../types';
import { calculateSellerRating } from '../utils/ratingUtils';
import {
  Star,
  X,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';

interface SellerReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerListing;
  orders: EscrowOrder[];
}

export const SellerReviewsModal: React.FC<SellerReviewsModalProps> = ({
  isOpen,
  onClose,
  seller,
  orders,
}) => {
  if (!isOpen) return null;

  const stats = calculateSellerRating(seller, orders);

  return (
    <div
      id="seller-reviews-modal-backdrop"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="seller-reviews-modal-content"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900">
          <div className="flex items-center gap-3">
            <img
              src={seller.sellerAvatar}
              alt={seller.sellerName}
              className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{seller.sellerName}</h3>
                {seller.isProSeller && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-semibold">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Verified Seller Reputation & Buyer Feedback
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Average Rating & Breakdown Scorecard */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-left sm:pr-6 sm:border-r sm:border-slate-800 shrink-0">
              <span className="text-4xl font-black font-mono text-white tracking-tight">
                {stats.averageRating.toFixed(2)}
              </span>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 my-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(stats.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {stats.ratingsCount.toLocaleString()} verified ratings
              </span>
            </div>

            {/* Breakdown distribution */}
            <div className="flex-1 w-full space-y-1.5 text-xs font-mono">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.breakdown[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const pct = Math.max(
                  2,
                  Math.round((count / (stats.ratingsCount || 1)) * 100)
                );
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-12 text-slate-400 flex items-center gap-1">
                      {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400 text-[11px]">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Reviews Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Verified Buyer Reviews ({stats.recentReviews.length})</span>
              </h4>
              <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Escrow Verified
              </span>
            </div>

            {stats.recentReviews.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                <ThumbsUp className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                <p className="text-xs">No individual written reviews yet.</p>
                <p className="text-[11px] text-slate-500">
                  Seller maintains {seller.sellerRating} / 5.0 rating across {seller.totalOrders.toLocaleString()} completed orders.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentReviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs">
                          {rev.buyerName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Verified Purchase
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {rev.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 border border-slate-700/60 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-cyan-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {rev.review && (
                      <p className="text-xs text-slate-300 italic">
                        "{rev.review}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>Ref: {rev.orderId || 'Direct Moonton Topup'}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rev.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
