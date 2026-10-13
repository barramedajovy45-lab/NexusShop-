import { DiamondPackage, PaymentMethod } from '../types';

export const BULK_DISCOUNT_THRESHOLD_DIAMONDS = 5000;
export const BULK_DISCOUNT_PERCENT = 5; // 5% discount on 5000+ diamonds

export const GCASH_STANDARD_DISCOUNT_PERCENT = 2; // 2% standard instant discount on GCash
export const GCASH_BIG_DIAMOND_THRESHOLD = 700; // 700+ diamonds qualifies as "big diamond"
export const GCASH_BIG_DIAMOND_DISCOUNT_PERCENT = 15; // 15% discount for big diamond purchases via GCash
export const GCASH_MAX_DISCOUNT_CAP_PERCENT = 15; // Strictly capped at 15% below retail
export const GCASH_DISCOUNT_PERCENT = GCASH_STANDARD_DISCOUNT_PERCENT; // Backwards-compatible alias

export interface PriceCalculationResult {
  quantity: number;
  totalBaseDiamonds: number;
  totalBonusDiamonds: number;
  totalDiamonds: number;

  unitPriceUsd: number;
  unitPricePhp: number;

  subtotalUsd: number;
  subtotalPhp: number;
  regularSubtotalUsd: number;
  regularSubtotalPhp: number;

  hasBulkDiscount: boolean;
  bulkDiscountPercent: number;
  bulkDiscountUsd: number;
  bulkDiscountPhp: number;

  hasVipDiscount: boolean;
  vipDiscountPercent: number;
  vipDiscountUsd: number;
  vipDiscountPhp: number;

  hasGcashDiscount: boolean;
  isGcashBigDiamondDiscount: boolean;
  gcashDiscountPercent: number;
  gcashDiscountUsd: number;
  gcashDiscountPhp: number;

  totalSavingsUsd: number;
  totalSavingsPhp: number;

  finalPriceUsd: number;
  finalPricePhp: number;

  diamondsNeededForBulk: number;
  diamondsNeededForGcashBigDiscount: number;
}

/**
 * Calculates diamond package price with bulk quantity discount, VIP 50% discount, and optional GCash discount.
 * VIP members receive an exclusive 50% discount when purchasing diamonds.
 * Provides exclusive 15% discount for big diamond orders paid via GCash (strictly capped at 15% below).
 */
export function calculatePackagePricing(
  pkg: DiamondPackage,
  quantity: number = 1,
  paymentMethod?: PaymentMethod,
  customUnitPriceUsd?: number,
  customUnitPricePhp?: number,
  isVip: boolean = false
): PriceCalculationResult {
  const safeQty = Math.max(1, Math.floor(quantity || 1));

  const totalBaseDiamonds = pkg.diamonds * safeQty;
  const totalBonusDiamonds = (pkg.bonusDiamonds || 0) * safeQty;
  const totalDiamonds = totalBaseDiamonds + totalBonusDiamonds;

  const unitPriceUsd = typeof customUnitPriceUsd === 'number' ? customUnitPriceUsd : pkg.discountPriceUsd;
  const unitPricePhp = typeof customUnitPricePhp === 'number' 
    ? customUnitPricePhp 
    : (pkg.pricePhp || Math.round(pkg.discountPriceUsd * 58.5));

  const subtotalUsd = +(unitPriceUsd * safeQty).toFixed(2);
  const subtotalPhp = unitPricePhp * safeQty;

  const regularUnitPriceUsd = pkg.regularPriceUsd || +(unitPriceUsd * 1.35).toFixed(2);
  const regularUnitPricePhp = pkg.regularPricePhp || (pkg.pricePhp ? Math.round(pkg.pricePhp * 1.35) : Math.round(regularUnitPriceUsd * 58.5));

  const regularSubtotalUsd = +(regularUnitPriceUsd * safeQty).toFixed(2);
  const regularSubtotalPhp = regularUnitPricePhp * safeQty;

  // Threshold: >= 5,000 diamonds (base or total with bonus)
  const hasBulkDiscount = totalBaseDiamonds >= BULK_DISCOUNT_THRESHOLD_DIAMONDS || totalDiamonds >= BULK_DISCOUNT_THRESHOLD_DIAMONDS;
  const bulkDiscountPercent = hasBulkDiscount ? BULK_DISCOUNT_PERCENT : 0;

  const bulkDiscountUsd = hasBulkDiscount ? +(subtotalUsd * (BULK_DISCOUNT_PERCENT / 100)).toFixed(2) : 0;
  const bulkDiscountPhp = hasBulkDiscount ? Math.round(subtotalPhp * (BULK_DISCOUNT_PERCENT / 100)) : 0;

  const priceAfterBulkUsd = Math.max(0, +(subtotalUsd - bulkDiscountUsd).toFixed(2));
  const priceAfterBulkPhp = Math.max(0, subtotalPhp - bulkDiscountPhp);

  // VIP 50% Storewide Discount: VIP users receive 50% discount on diamond purchases
  const hasVipDiscount = Boolean(isVip);
  const vipDiscountPercent = hasVipDiscount ? 50 : 0;
  const vipDiscountUsd = hasVipDiscount ? +(priceAfterBulkUsd * 0.5).toFixed(2) : 0;
  const vipDiscountPhp = hasVipDiscount ? Math.round(priceAfterBulkPhp * 0.5) : 0;

  const priceAfterVipUsd = Math.max(0, +(priceAfterBulkUsd - vipDiscountUsd).toFixed(2));
  const priceAfterVipPhp = Math.max(0, priceAfterBulkPhp - vipDiscountPhp);

  // Big Diamond Check: 700+ diamonds qualifies as "big diamond"
  const isBigDiamond = totalBaseDiamonds >= GCASH_BIG_DIAMOND_THRESHOLD || totalDiamonds >= GCASH_BIG_DIAMOND_THRESHOLD;
  const hasGcashDiscount = paymentMethod === 'gcash';
  const isGcashBigDiamondDiscount = hasGcashDiscount && isBigDiamond;

  // For big diamond orders with GCash, give 15% below (capped strictly at 15%)
  const rawGcashPercent = isGcashBigDiamondDiscount 
    ? GCASH_BIG_DIAMOND_DISCOUNT_PERCENT 
    : (hasGcashDiscount ? GCASH_STANDARD_DISCOUNT_PERCENT : 0);
  const gcashDiscountPercent = Math.min(GCASH_MAX_DISCOUNT_CAP_PERCENT, rawGcashPercent);

  const gcashDiscountUsd = hasGcashDiscount ? +(priceAfterVipUsd * (gcashDiscountPercent / 100)).toFixed(2) : 0;
  const gcashDiscountPhp = hasGcashDiscount ? Math.round(priceAfterVipPhp * (gcashDiscountPercent / 100)) : 0;

  const finalPriceUsd = Math.max(0, +(priceAfterVipUsd - gcashDiscountUsd).toFixed(2));
  const finalPricePhp = Math.max(0, priceAfterVipPhp - gcashDiscountPhp);

  const totalSavingsUsd = +(bulkDiscountUsd + vipDiscountUsd + gcashDiscountUsd).toFixed(2);
  const totalSavingsPhp = bulkDiscountPhp + vipDiscountPhp + gcashDiscountPhp;

  const diamondsNeededForBulk = hasBulkDiscount
    ? 0
    : Math.max(0, BULK_DISCOUNT_THRESHOLD_DIAMONDS - totalBaseDiamonds);

  const diamondsNeededForGcashBigDiscount = isBigDiamond
    ? 0
    : Math.max(0, GCASH_BIG_DIAMOND_THRESHOLD - totalDiamonds);

  return {
    quantity: safeQty,
    totalBaseDiamonds,
    totalBonusDiamonds,
    totalDiamonds,
    unitPriceUsd,
    unitPricePhp,
    subtotalUsd,
    subtotalPhp,
    regularSubtotalUsd,
    regularSubtotalPhp,
    hasBulkDiscount,
    bulkDiscountPercent,
    bulkDiscountUsd,
    bulkDiscountPhp,
    hasVipDiscount,
    vipDiscountPercent,
    vipDiscountUsd,
    vipDiscountPhp,
    hasGcashDiscount,
    isGcashBigDiamondDiscount,
    gcashDiscountPercent,
    gcashDiscountUsd,
    gcashDiscountPhp,
    totalSavingsUsd,
    totalSavingsPhp,
    finalPriceUsd,
    finalPricePhp,
    diamondsNeededForBulk,
    diamondsNeededForGcashBigDiscount,
  };
}

export interface MultiPackageItemInput {
  package: DiamondPackage;
  quantity: number;
  customUnitPriceUsd?: number;
  customUnitPricePhp?: number;
}

export interface MultiPackageCalculationResult {
  totalItemsCount: number;
  totalUnitsCount: number;
  totalBaseDiamonds: number;
  totalBonusDiamonds: number;
  totalDiamonds: number;

  subtotalUsd: number;
  subtotalPhp: number;
  regularSubtotalUsd: number;
  regularSubtotalPhp: number;

  hasBulkDiscount: boolean;
  bulkDiscountPercent: number;
  bulkDiscountUsd: number;
  bulkDiscountPhp: number;

  hasVipDiscount: boolean;
  vipDiscountPercent: number;
  vipDiscountUsd: number;
  vipDiscountPhp: number;

  hasGcashDiscount: boolean;
  isGcashBigDiamondDiscount: boolean;
  gcashDiscountPercent: number;
  gcashDiscountUsd: number;
  gcashDiscountPhp: number;

  totalSavingsUsd: number;
  totalSavingsPhp: number;

  finalPriceUsd: number;
  finalPricePhp: number;

  diamondsNeededForBulk: number;
  diamondsNeededForGcashBigDiscount: number;
  itemBreakdown: {
    packageId: string;
    packageName: string;
    diamonds: number;
    bonusDiamonds: number;
    quantity: number;
    unitPriceUsd: number;
    unitPricePhp: number;
    subtotalUsd: number;
    subtotalPhp: number;
  }[];
}

/**
 * Calculates aggregate multi-package pricing for bulk checkout
 */
export function calculateMultiPackagePricing(
  items: MultiPackageItemInput[],
  paymentMethod?: PaymentMethod,
  isVip: boolean = false
): MultiPackageCalculationResult {
  if (!items || items.length === 0) {
    return {
      totalItemsCount: 0,
      totalUnitsCount: 0,
      totalBaseDiamonds: 0,
      totalBonusDiamonds: 0,
      totalDiamonds: 0,
      subtotalUsd: 0,
      subtotalPhp: 0,
      regularSubtotalUsd: 0,
      regularSubtotalPhp: 0,
      hasBulkDiscount: false,
      bulkDiscountPercent: 0,
      bulkDiscountUsd: 0,
      bulkDiscountPhp: 0,
      hasVipDiscount: false,
      vipDiscountPercent: 0,
      vipDiscountUsd: 0,
      vipDiscountPhp: 0,
      hasGcashDiscount: false,
      isGcashBigDiamondDiscount: false,
      gcashDiscountPercent: 0,
      gcashDiscountUsd: 0,
      gcashDiscountPhp: 0,
      totalSavingsUsd: 0,
      totalSavingsPhp: 0,
      finalPriceUsd: 0,
      finalPricePhp: 0,
      diamondsNeededForBulk: BULK_DISCOUNT_THRESHOLD_DIAMONDS,
      diamondsNeededForGcashBigDiscount: GCASH_BIG_DIAMOND_THRESHOLD,
      itemBreakdown: [],
    };
  }

  let totalUnitsCount = 0;
  let totalBaseDiamonds = 0;
  let totalBonusDiamonds = 0;
  let subtotalUsd = 0;
  let subtotalPhp = 0;
  let regularSubtotalUsd = 0;
  let regularSubtotalPhp = 0;

  const itemBreakdown = items.map((item) => {
    const qty = Math.max(1, Math.floor(item.quantity || 1));
    const baseDia = item.package.diamonds * qty;
    const bonusDia = (item.package.bonusDiamonds || 0) * qty;

    const unitPriceUsd = typeof item.customUnitPriceUsd === 'number' 
      ? item.customUnitPriceUsd 
      : item.package.discountPriceUsd;
    const unitPricePhp = typeof item.customUnitPricePhp === 'number' 
      ? item.customUnitPricePhp 
      : (item.package.pricePhp || Math.round(item.package.discountPriceUsd * 58.5));

    const itemSubtotalUsd = +(unitPriceUsd * qty).toFixed(2);
    const itemSubtotalPhp = unitPricePhp * qty;

    const regularUnitPriceUsd = item.package.regularPriceUsd || +(unitPriceUsd * 1.35).toFixed(2);
    const regularUnitPricePhp = item.package.regularPricePhp || Math.round(regularUnitPriceUsd * 58.5);

    totalUnitsCount += qty;
    totalBaseDiamonds += baseDia;
    totalBonusDiamonds += bonusDia;
    subtotalUsd = +(subtotalUsd + itemSubtotalUsd).toFixed(2);
    subtotalPhp += itemSubtotalPhp;
    regularSubtotalUsd = +(regularSubtotalUsd + (regularUnitPriceUsd * qty)).toFixed(2);
    regularSubtotalPhp += regularUnitPricePhp * qty;

    return {
      packageId: item.package.id,
      packageName: item.package.name,
      diamonds: baseDia,
      bonusDiamonds: bonusDia,
      quantity: qty,
      unitPriceUsd,
      unitPricePhp,
      subtotalUsd: itemSubtotalUsd,
      subtotalPhp: itemSubtotalPhp,
    };
  });

  const totalDiamonds = totalBaseDiamonds + totalBonusDiamonds;

  // Bulk Discount: either 5,000+ total diamonds OR 3+ packages in bulk
  const hasBulkDiscount = totalBaseDiamonds >= BULK_DISCOUNT_THRESHOLD_DIAMONDS || totalDiamonds >= BULK_DISCOUNT_THRESHOLD_DIAMONDS || items.length >= 3;
  const bulkDiscountPercent = hasBulkDiscount ? BULK_DISCOUNT_PERCENT : 0;

  const bulkDiscountUsd = hasBulkDiscount ? +(subtotalUsd * (BULK_DISCOUNT_PERCENT / 100)).toFixed(2) : 0;
  const bulkDiscountPhp = hasBulkDiscount ? Math.round(subtotalPhp * (BULK_DISCOUNT_PERCENT / 100)) : 0;

  const priceAfterBulkUsd = Math.max(0, +(subtotalUsd - bulkDiscountUsd).toFixed(2));
  const priceAfterBulkPhp = Math.max(0, subtotalPhp - bulkDiscountPhp);

  // VIP 50% Storewide Discount
  const hasVipDiscount = Boolean(isVip);
  const vipDiscountPercent = hasVipDiscount ? 50 : 0;
  const vipDiscountUsd = hasVipDiscount ? +(priceAfterBulkUsd * 0.5).toFixed(2) : 0;
  const vipDiscountPhp = hasVipDiscount ? Math.round(priceAfterBulkPhp * 0.5) : 0;

  const priceAfterVipUsd = Math.max(0, +(priceAfterBulkUsd - vipDiscountUsd).toFixed(2));
  const priceAfterVipPhp = Math.max(0, priceAfterBulkPhp - vipDiscountPhp);

  // Big Diamond Check: 700+ diamonds qualifies as "big diamond"
  const isBigDiamond = totalBaseDiamonds >= GCASH_BIG_DIAMOND_THRESHOLD || totalDiamonds >= GCASH_BIG_DIAMOND_THRESHOLD;
  const hasGcashDiscount = paymentMethod === 'gcash';
  const isGcashBigDiamondDiscount = hasGcashDiscount && isBigDiamond;

  // For big diamond orders with GCash, give 15% below (strictly capped at 15%)
  const rawGcashPercent = isGcashBigDiamondDiscount 
    ? GCASH_BIG_DIAMOND_DISCOUNT_PERCENT 
    : (hasGcashDiscount ? GCASH_STANDARD_DISCOUNT_PERCENT : 0);
  const gcashDiscountPercent = Math.min(GCASH_MAX_DISCOUNT_CAP_PERCENT, rawGcashPercent);

  const gcashDiscountUsd = hasGcashDiscount ? +(priceAfterVipUsd * (gcashDiscountPercent / 100)).toFixed(2) : 0;
  const gcashDiscountPhp = hasGcashDiscount ? Math.round(priceAfterVipPhp * (gcashDiscountPercent / 100)) : 0;

  const finalPriceUsd = Math.max(0, +(priceAfterVipUsd - gcashDiscountUsd).toFixed(2));
  const finalPricePhp = Math.max(0, priceAfterVipPhp - gcashDiscountPhp);

  const totalSavingsUsd = +(bulkDiscountUsd + vipDiscountUsd + gcashDiscountUsd).toFixed(2);
  const totalSavingsPhp = bulkDiscountPhp + vipDiscountPhp + gcashDiscountPhp;

  const diamondsNeededForBulk = hasBulkDiscount
    ? 0
    : Math.max(0, BULK_DISCOUNT_THRESHOLD_DIAMONDS - totalBaseDiamonds);

  const diamondsNeededForGcashBigDiscount = isBigDiamond
    ? 0
    : Math.max(0, GCASH_BIG_DIAMOND_THRESHOLD - totalDiamonds);

  return {
    totalItemsCount: items.length,
    totalUnitsCount,
    totalBaseDiamonds,
    totalBonusDiamonds,
    totalDiamonds,
    subtotalUsd,
    subtotalPhp,
    regularSubtotalUsd,
    regularSubtotalPhp,
    hasBulkDiscount,
    bulkDiscountPercent,
    bulkDiscountUsd,
    bulkDiscountPhp,
    hasVipDiscount,
    vipDiscountPercent,
    vipDiscountUsd,
    vipDiscountPhp,
    hasGcashDiscount,
    isGcashBigDiamondDiscount,
    gcashDiscountPercent,
    gcashDiscountUsd,
    gcashDiscountPhp,
    totalSavingsUsd,
    totalSavingsPhp,
    finalPriceUsd,
    finalPricePhp,
    diamondsNeededForBulk,
    diamondsNeededForGcashBigDiscount,
    itemBreakdown,
  };
}
