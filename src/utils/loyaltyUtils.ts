export type LoyaltyTierName = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Mythic';

export interface LoyaltyTierConfig {
  id: LoyaltyTierName;
  name: string;
  minDiamonds: number;
  maxDiamonds: number | null; // null for highest tier
  discountPercent: number;
  colorName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glowColor: string;
  gradient: string;
  iconName: 'Shield' | 'Sparkles' | 'Crown' | 'Trophy' | 'Gem';
  tagline: string;
  perks: string[];
}

export const LOYALTY_TIERS: LoyaltyTierConfig[] = [
  {
    id: 'Bronze',
    name: 'Bronze Player',
    minDiamonds: 0,
    maxDiamonds: 999,
    discountPercent: 1,
    colorName: 'amber',
    badgeBg: 'bg-amber-950/80',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-600/60',
    glowColor: 'rgba(217, 119, 6, 0.3)',
    gradient: 'from-amber-900/60 via-slate-900 to-amber-950/40',
    iconName: 'Shield',
    tagline: 'Novice Gamer · Base Escrow Protection & 1% Discount',
    perks: [
      '1% automatic loyalty discount applied to every order',
      '100% Aegis Smart Vault neutral escrow security',
      'Real-time Moonton ID & Zone verification',
      'Standard 24/7 in-app dispute protection',
    ],
  },
  {
    id: 'Silver',
    name: 'Silver Veteran',
    minDiamonds: 1000,
    maxDiamonds: 4999,
    discountPercent: 3,
    colorName: 'slate',
    badgeBg: 'bg-slate-800/90',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-500/70',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    gradient: 'from-slate-800/70 via-slate-900 to-slate-800/40',
    iconName: 'Sparkles',
    tagline: 'Veteran Collector · 3% Discount & Faster Dispatch',
    perks: [
      '3% automatic loyalty discount applied to all future orders',
      'Priority Moonton API dispatch queue (< 10 mins)',
      'Silver Gamer Profile badge & verified transaction flair',
      'Complimentary +24h escrow inspection extension guarantee',
    ],
  },
  {
    id: 'Gold',
    name: 'Gold Elite',
    minDiamonds: 5000,
    maxDiamonds: 19999,
    discountPercent: 6,
    colorName: 'yellow',
    badgeBg: 'bg-yellow-950/90',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/70',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    gradient: 'from-yellow-950/70 via-slate-900 to-amber-950/50',
    iconName: 'Crown',
    tagline: 'Elite High-Roller · 6% Automatic Discount & VIP Queue',
    perks: [
      '6% automatic loyalty discount applied to all future orders',
      'Express Moonton server cluster injection (< 5 mins)',
      'Gold VIP Crown badge & distinctive gold profile glow',
      'Dedicated priority escrow arbitration officer',
      'Exclusive weekly flash drop pricing notifications',
    ],
  },
  {
    id: 'Platinum',
    name: 'Platinum Apex',
    minDiamonds: 20000,
    maxDiamonds: 49999,
    discountPercent: 10,
    colorName: 'cyan',
    badgeBg: 'bg-cyan-950/90',
    badgeText: 'text-cyan-300',
    badgeBorder: 'border-cyan-500/70',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    gradient: 'from-cyan-950/80 via-slate-900 to-blue-950/60',
    iconName: 'Trophy',
    tagline: 'Apex Legend VIP · 10% Discount & 0% Escrow Fees',
    perks: [
      '10% automatic loyalty discount applied to all future orders',
      '100% Free escrow transaction fee waiver ($0.00 platform fee)',
      'Instant automated distributor API priority clearing',
      'Platinum VIP Crown badge & animated profile avatar ring',
      'Dedicated 1-on-1 account concierges & squad bonus gift drops',
    ],
  },
  {
    id: 'Mythic',
    name: 'Mythic Sovereign',
    minDiamonds: 50000,
    maxDiamonds: null,
    discountPercent: 15,
    colorName: 'purple',
    badgeBg: 'bg-purple-950/90',
    badgeText: 'text-purple-300',
    badgeBorder: 'border-purple-500/80',
    glowColor: 'rgba(168, 85, 247, 0.5)',
    gradient: 'from-purple-950/80 via-slate-900 to-pink-950/60',
    iconName: 'Gem',
    tagline: 'Sovereign Whale · 15% Maximum Loyalty Discount',
    perks: [
      '15% maximum automatic loyalty discount on all packages & bulk orders',
      'Mythic Apex gamer status & infinite vault clearance',
      'Instant escrow auto-release option upon Moonton API dispatch',
      'Direct Developer & VIP merchant clearing channel',
      'Custom Moonton server transaction hash ledger verification',
    ],
  },
];

/**
 * Calculates user's Loyalty Tier based on total lifetime diamond purchases.
 */
export function calculateLoyaltyTier(totalDiamonds: number): LoyaltyTierConfig {
  const diamonds = Math.max(0, totalDiamonds || 0);

  // Iterate backwards from highest tier to lowest
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    const tier = LOYALTY_TIERS[i];
    if (diamonds >= tier.minDiamonds) {
      return tier;
    }
  }

  return LOYALTY_TIERS[0];
}

/**
 * Returns the next loyalty tier to aim for, or null if already at max tier.
 */
export function getNextLoyaltyTier(currentTierId: LoyaltyTierName): LoyaltyTierConfig | null {
  const currentIndex = LOYALTY_TIERS.findIndex((t) => t.id === currentTierId);
  if (currentIndex === -1 || currentIndex === LOYALTY_TIERS.length - 1) {
    return null;
  }
  return LOYALTY_TIERS[currentIndex + 1];
}

/**
 * Calculates progress towards the next loyalty tier.
 */
export function getLoyaltyProgress(totalDiamonds: number): {
  currentDiamonds: number;
  currentTier: LoyaltyTierConfig;
  nextTier: LoyaltyTierConfig | null;
  nextThreshold: number;
  remainingDiamonds: number;
  progressPercent: number;
  isMaxTier: boolean;
} {
  const diamonds = Math.max(0, totalDiamonds || 0);
  const currentTier = calculateLoyaltyTier(diamonds);
  const nextTier = getNextLoyaltyTier(currentTier.id);

  if (!nextTier) {
    return {
      currentDiamonds: diamonds,
      currentTier,
      nextTier: null,
      nextThreshold: currentTier.minDiamonds,
      remainingDiamonds: 0,
      progressPercent: 100,
      isMaxTier: true,
    };
  }

  const rangeSpan = nextTier.minDiamonds - currentTier.minDiamonds;
  const progressInCurrentRange = diamonds - currentTier.minDiamonds;
  const rawPercent = (progressInCurrentRange / rangeSpan) * 100;
  const progressPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
  const remainingDiamonds = Math.max(0, nextTier.minDiamonds - diamonds);

  return {
    currentDiamonds: diamonds,
    currentTier,
    nextTier,
    nextThreshold: nextTier.minDiamonds,
    remainingDiamonds,
    progressPercent,
    isMaxTier: false,
  };
}

/**
 * Calculates automatic discount amounts for an order based on loyalty discount rate.
 */
export function calculateLoyaltyDiscount(
  basePriceUsd: number,
  discountPercent: number,
  basePricePhp?: number
): {
  discountAmountUsd: number;
  discountAmountPhp: number;
  finalPriceUsd: number;
  finalPricePhp: number;
} {
  if (!discountPercent || discountPercent <= 0) {
    return {
      discountAmountUsd: 0,
      discountAmountPhp: 0,
      finalPriceUsd: basePriceUsd,
      finalPricePhp: basePricePhp || Math.round(basePriceUsd * 58.5),
    };
  }

  const discountAmountUsd = +((basePriceUsd * discountPercent) / 100).toFixed(2);
  const finalPriceUsd = Math.max(0, +(basePriceUsd - discountAmountUsd).toFixed(2));

  const phpBase = basePricePhp !== undefined ? basePricePhp : Math.round(basePriceUsd * 58.5);
  const discountAmountPhp = Math.round((phpBase * discountPercent) / 100);
  const finalPricePhp = Math.max(0, phpBase - discountAmountPhp);

  return {
    discountAmountUsd,
    discountAmountPhp,
    finalPriceUsd,
    finalPricePhp,
  };
}
