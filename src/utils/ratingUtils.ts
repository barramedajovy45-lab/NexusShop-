import { EscrowOrder, OrderFeedback, SellerListing } from '../types';

export interface SellerRatingMetrics {
  averageRating: number;
  ratingsCount: number;
  recentReviews: OrderFeedback[];
  breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Sample verified customer reviews to supplement baseline reputation
export const BASELINE_SELLER_REVIEWS: Record<string, OrderFeedback[]> = {
  sel_apex: [
    {
      rating: 5,
      review: 'Fastest delivery ever! Diamonds reflected in MLBB within 90 seconds. 100% legit seller.',
      tags: ['⚡ Instant Delivery', '💎 100% Accurate Diamonds', '🛡️ Escrow Protected'],
      createdAt: Date.now() - 1000 * 60 * 60 * 14,
      buyerName: 'KaguraMain_PH',
      orderId: 'ORD-81092',
    },
    {
      rating: 5,
      review: 'Got 706 diamonds + bonus during the Starlight event. Escrow kept my money safe.',
      tags: ['💎 100% Accurate Diamonds', '💬 Friendly Seller', '🏆 Recommended Pro Seller'],
      createdAt: Date.now() - 1000 * 60 * 60 * 36,
      buyerName: 'ChouGod_SEA',
      orderId: 'ORD-76219',
    },
    {
      rating: 5,
      review: 'Smooth transaction via GCash. Direct Moonton API credit without sharing account password.',
      tags: ['⚡ Instant Delivery', '🛡️ Escrow Protected'],
      createdAt: Date.now() - 1000 * 60 * 60 * 72,
      buyerName: 'MythicGlory99',
      orderId: 'ORD-70432',
    }
  ],
  sel_wdp_king: [
    {
      rating: 5,
      review: 'Weekly Diamond Pass activated instantly! Saved almost ₱100 compared to official in-game store.',
      tags: ['⚡ Instant Delivery', '💎 100% Accurate Diamonds', '🏆 Recommended Pro Seller'],
      createdAt: Date.now() - 1000 * 60 * 60 * 20,
      buyerName: 'LingFastHands',
      orderId: 'ORD-77102',
    },
    {
      rating: 5,
      review: 'Super reliable seller for Weekly Pass. Fast Moonton ref code.',
      tags: ['💬 Friendly Seller', '🛡️ Escrow Protected'],
      createdAt: Date.now() - 1000 * 60 * 60 * 48,
      buyerName: 'AngelaSupport',
      orderId: 'ORD-75902',
    }
  ],
  sel_mythic: [
    {
      rating: 5,
      review: 'Quick topup for 257 diamonds. Verified right away in game.',
      tags: ['⚡ Instant Delivery', '💎 100% Accurate Diamonds'],
      createdAt: Date.now() - 1000 * 60 * 60 * 18,
      buyerName: 'HayabusaNinja',
      orderId: 'ORD-79912',
    }
  ]
};

/**
 * Computes live rating statistics for a given seller by merging baseline
 * seller performance with dynamic post-transaction feedback from completed orders.
 */
export function calculateSellerRating(
  seller: SellerListing,
  orders: EscrowOrder[]
): SellerRatingMetrics {
  // Collect all real feedback from completed orders matching this seller
  const completedOrderFeedbacks: OrderFeedback[] = [];

  orders.forEach((order) => {
    if (
      order.status === 'completed' &&
      (order.sellerId === seller.sellerId || order.sellerName === seller.sellerName) &&
      order.feedback
    ) {
      completedOrderFeedbacks.push(order.feedback);
    }
  });

  // Combine with baseline verified reviews
  const baselineReviews = BASELINE_SELLER_REVIEWS[seller.sellerId] || [];
  
  // Combine all reviews, avoiding duplicate orderIds
  const existingOrderIds = new Set(completedOrderFeedbacks.map(f => f.orderId).filter(Boolean));
  const mergedReviews = [
    ...completedOrderFeedbacks,
    ...baselineReviews.filter(r => !r.orderId || !existingOrderIds.has(r.orderId))
  ].sort((a, b) => b.createdAt - a.createdAt);

  // Compute weighted average:
  // Base listing has a baseline weight (e.g. 50 orders) to preserve realistic high rating
  // while allowing user feedback to visibly influence the average immediately.
  const baselineWeight = 40;
  const baseScore = seller.sellerRating * baselineWeight;
  
  const feedbackScoreSum = completedOrderFeedbacks.reduce((sum, f) => sum + f.rating, 0);
  const totalWeight = baselineWeight + completedOrderFeedbacks.length;
  
  const rawAverage = (baseScore + feedbackScoreSum) / totalWeight;
  const averageRating = Math.min(5, Math.max(1, Number(rawAverage.toFixed(2))));

  // Total review count
  const baseCount = seller.ratingsCount || Math.round(seller.totalOrders * 0.94);
  const ratingsCount = baseCount + completedOrderFeedbacks.length;

  // Breakdown simulation for visualization
  const breakdown = {
    5: Math.round(ratingsCount * 0.94),
    4: Math.round(ratingsCount * 0.05),
    3: Math.round(ratingsCount * 0.008),
    2: Math.round(ratingsCount * 0.001),
    1: Math.round(ratingsCount * 0.001),
  };

  // Adjust breakdown for new ratings
  completedOrderFeedbacks.forEach(f => {
    const star = Math.min(5, Math.max(1, Math.round(f.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] = (breakdown[star] || 0) + 1;
  });

  return {
    averageRating,
    ratingsCount,
    recentReviews: mergedReviews,
    breakdown,
  };
}
