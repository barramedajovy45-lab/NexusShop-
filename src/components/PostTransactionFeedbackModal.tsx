import React, { useState, useEffect } from 'react';
import { EscrowOrder, OrderFeedback } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  Star,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Gem,
  MessageSquare,
  ThumbsUp,
  Tag
} from 'lucide-react';

interface PostTransactionFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onSubmitFeedback: (orderId: string, feedback: OrderFeedback) => void;
}

const COMPLIMENT_TAGS = [
  '⚡ Lightning Fast Delivery',
  '💎 100% Accurate Diamonds',
  '🛡️ Escrow Protected',
  '💬 Great Communication',
  '🏆 Recommended Pro Seller',
  '🎮 Moonton Direct API Top-Up'
];

const RATING_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: 'Poor', desc: 'Significant delays or issues with order fulfillment', color: 'text-rose-400' },
  2: { title: 'Fair', desc: 'Delivered but slower than expected', color: 'text-amber-400' },
  3: { title: 'Good', desc: 'Standard delivery without complications', color: 'text-yellow-400' },
  4: { title: 'Very Good', desc: 'Fast, smooth, and accurate recharge', color: 'text-cyan-400' },
  5: { title: 'Outstanding (5 Stars)', desc: 'Flawless top-up, instant delivery, highly recommended!', color: 'text-emerald-400' },
};

export const PostTransactionFeedbackModal: React.FC<PostTransactionFeedbackModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmitFeedback,
}) => {
  const [rating, setRating] = useState<number>(order.feedback?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [review, setReview] = useState<string>(order.feedback?.review || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    order.feedback?.tags || ['⚡ Lightning Fast Delivery', '💎 100% Accurate Diamonds']
  );
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (order.feedback) {
      setRating(order.feedback.rating);
      setReview(order.feedback.review || '');
      setSelectedTags(order.feedback.tags || []);
    } else {
      setRating(5);
      setReview('');
      setSelectedTags(['⚡ Lightning Fast Delivery', '💎 100% Accurate Diamonds']);
    }
    setIsSubmittedSuccess(false);
  }, [order, isOpen]);

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;
  const ratingInfo = RATING_LABELS[currentDisplayRating] || RATING_LABELS[5];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return;

    const feedbackPayload: OrderFeedback = {
      rating,
      review: review.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      createdAt: Date.now(),
      buyerName: order.buyerName || 'Verified Buyer',
      orderId: order.id,
    };

    onSubmitFeedback(order.id, feedbackPayload);
    setIsSubmittedSuccess(true);

    setTimeout(() => {
      setIsSubmittedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="feedback-modal-backdrop"
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="feedback-modal-content"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800/80 to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Rate Your Transaction</h3>
              <p className="text-xs text-slate-400 font-mono">Order {order.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Thank You for Your Feedback!</h4>
              <p className="text-xs text-slate-300 mt-1">
                Your rating has been verified and updated on {order.sellerName}'s P2P Marketplace card.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Seller Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={order.sellerAvatar}
                  alt={order.sellerName}
                  className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-sm">{order.sellerName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                      Seller
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {order.packageName} ({order.diamonds} 💎)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-emerald-400 block font-semibold">
                  Escrow Released
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {formatCurrency(order.amount, order.currency)}
                </span>
              </div>
            </div>

            {/* Interactive 5-Star Rating Selector */}
            <div className="text-center space-y-2.5 py-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                How would you rate your experience?
              </label>

              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= currentDisplayRating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                      title={`${starValue} Stars`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="min-h-[36px] flex flex-col items-center justify-center">
                <span className={`text-sm font-bold ${ratingInfo.color} flex items-center gap-1.5`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {ratingInfo.title}
                </span>
                <span className="text-xs text-slate-400">{ratingInfo.desc}</span>
              </div>
            </div>

            {/* Quick Compliment Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>What went well? (Select compliments)</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {COMPLIMENT_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer font-medium ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 shadow-sm shadow-cyan-950'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Review Comment Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Written Review (Optional)</span>
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={3}
                placeholder="Share your experience (e.g. delivery speed, diamond accuracy, communication)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            {/* Trust Assurance Note */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Verified post-transaction feedback: your rating directly updates {order.sellerName}'s public average score on the P2P Marketplace.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
              >
                Skip for Now
              </button>

              <button
                type="submit"
                disabled={rating < 1}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{order.feedback ? 'Update Feedback' : 'Submit Rating & Review'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
