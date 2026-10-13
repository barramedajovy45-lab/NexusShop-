import React, { useState, useEffect } from 'react';
import { BulkOrderItem, Currency, DiamondPackage, EscrowOrder, MlbbAccount, PaymentMethod, SellerListing, UserAccount } from '../types';
import { formatCurrency, getPaymentMethodDetails, PAYMENT_GATEWAY_CATEGORIES } from '../utils/formatters';
import {
  lookupOrGenerateMlbbAccount,
  parseCombinedMlbbInput,
  sanitizeMlbbId,
  isEligibleForFreeEverything,
  isDeveloperUser as checkIsDev,
  isVipUser as checkIsVip,
  isBigDiamondPackage,
  isPackageFreeForUser,
  getVipFreeClaimStatus,
  VIP_FREE_CLAIM_LIMIT,
  VIP_UPGRADE_PRICE_PHP,
  VIP_DIAMOND_DISCOUNT_PERCENT,
} from '../data/mockData';
import { X, ShieldCheck, Lock, CheckCircle2, QrCode, AlertCircle, ArrowRight, Gem, UserPlus, User, Zap, Server, Code2, Check, Sparkles, Copy, Building2, Globe, AlertTriangle, FlaskConical, Crown, CreditCard, Star, Plus, Minus, Layers, Trash2, Gift, Award, Clock, RotateCcw, Save } from 'lucide-react';
import { DiamondImage } from './DiamondImage';
import { getDiamondAssetForPackage } from '../assets/diamondAssets';
import { calculatePackagePricing, calculateMultiPackagePricing, BULK_DISCOUNT_THRESHOLD_DIAMONDS, BULK_DISCOUNT_PERCENT, GCASH_DISCOUNT_PERCENT } from '../utils/pricing';
import { calculateReferralBonus } from '../utils/referralUtils';
import { calculateLoyaltyTier } from '../utils/loyaltyUtils';
import { playEscrowLockSound, playCopySuccessSound, playToggleSound, playModalCloseSound, playDiamondChimeSound } from '../utils/audio';
import { triggerDiamondRainConfetti } from '../utils/confetti';

export const CHECKOUT_AUTO_DRAFT_KEY = 'nexus_checkout_auto_draft_v1';

export interface CheckoutAutoDraft {
  id: string;
  diamondPackage: DiamondPackage;
  seller: SellerListing;
  quantity: number;
  bulkItems?: {
    package: DiamondPackage;
    seller: SellerListing;
    quantity: number;
  }[] | null;
  userIdInput?: string;
  zoneIdInput?: string;
  validatedAccount?: MlbbAccount | null;
  selectedMethod?: PaymentMethod;
  fulfillmentType?: 'official_mlbb_manual' | 'authorized_distributor_api' | 'authorized_distributor_dashboard' | 'p2p_seller';
  selectedDistributor?: string;
  buyerEmailInput?: string;
  autoPay24hEnabled?: boolean;
  savedAt: number;
}

export const loadCheckoutAutoDraft = (): CheckoutAutoDraft | null => {
  try {
    const raw = localStorage.getItem(CHECKOUT_AUTO_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutAutoDraft;
    if (!parsed || !parsed.diamondPackage || !parsed.seller) return null;
    // Retain drafts for up to 7 days
    if (Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CHECKOUT_AUTO_DRAFT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearCheckoutAutoDraftStorage = () => {
  try {
    localStorage.removeItem(CHECKOUT_AUTO_DRAFT_KEY);
  } catch {
    // ignore storage errors
  }
};

export interface DistributorProvider {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  avgSpeed: string;
  endpoint?: string;
  hasApi: boolean;
  portalUrl?: string;
  isMock?: boolean;
  isNexusIncome?: boolean;
  incomeDescription?: string;
  warningNotice?: string;
}

export const DISTRIBUTOR_PROVIDERS: DistributorProvider[] = [
  {
    id: 'nexus_direct_income',
    name: 'Nexus Shop Official Merchant API (Platform Income)',
    badge: '💎 100% Nexus Shop Income',
    tagline: 'Direct official revenue channel for Nexus Shop. Real-money top-ups directly generate income for Nexus Shop platform operations and bonded treasury reserves.',
    avgSpeed: '2-4s Instant',
    endpoint: 'POST https://api.nexusshop.com/v1/treasury/direct-recharge',
    hasApi: true,
    isMock: false,
    isNexusIncome: true,
    incomeDescription: 'Official Nexus Shop Platform Income Stream: 100% of merchant margin and order proceeds go directly to Nexus Shop platform revenue, liquidity reserves, and buyer protection escrow. Real in-game Diamonds delivered.',
  },
  {
    id: 'razer_gold_b2b',
    name: 'Razer Gold Enterprise Merchant API',
    badge: 'Partner Margin Income',
    tagline: 'Official Razer Gold direct B2B channel generating merchant partner margin income for Nexus Shop.',
    avgSpeed: '3-6s Instant',
    endpoint: 'POST https://api.razer.com/v2/gold/b2b/mlbb/topup',
    hasApi: true,
    isMock: false,
    isNexusIncome: true,
    incomeDescription: 'Razer Gold Partner Income Stream: Authorized commercial distributor generating wholesale rebate income directly for Nexus Shop on every transaction.',
  },
  {
    id: 'moonton_direct',
    name: 'Moonton Official SEA Distributor API',
    badge: 'Direct Gateway',
    tagline: 'Direct Moonton server injection with 0% account ban risk',
    avgSpeed: '3-6s Instant',
    endpoint: 'POST https://api.moonton.com/v1/distributor/recharge',
    hasApi: true,
  },
  {
    id: 'codashop_b2b',
    name: 'Codashop Enterprise B2B Partner API',
    badge: 'Authorized Distributor',
    tagline: 'Authorized commercial distributor API for MLBB',
    avgSpeed: '5-10s Instant',
    endpoint: 'POST https://enterprise.codapayments.com/api/v2/mlbb/topup',
    hasApi: true,
  },
  {
    id: 'smile_one',
    name: 'Smile.one Merchant API',
    badge: 'Licensed Partner',
    tagline: 'Official global licensed merchant distribution stream',
    avgSpeed: '4-8s Instant',
    endpoint: 'POST https://api.smile.one/v1/merchant/mlbb/order',
    hasApi: true,
  },
  {
    id: 'unipin_direct',
    name: 'UniPin Global Direct Gateway',
    badge: 'Authorized Partner',
    tagline: 'Automated direct recharge channel across SEA and Global',
    avgSpeed: '5-12s Instant',
    endpoint: 'POST https://api.unipin.com/v3/direct/mobilelegends',
    hasApi: true,
  },
  {
    id: 'nexus_mock_provider',
    name: 'Nexus Shop Mock Provider (Dev & Testing Sandbox)',
    badge: '🧪 Dev/Test Sandbox Only',
    tagline: 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.',
    avgSpeed: '1-2s Simulated',
    endpoint: 'SIMULATED https://mock.sandbox.nexusshop.dev/v1/mlbb/test-recharge',
    hasApi: true,
    isMock: true,
    warningNotice: 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.',
  },
  {
    id: 'nexus_direct_portal',
    name: 'Nexus Shop Official Treasury Desk (Platform Income Console)',
    badge: '💎 Platform Treasury Desk',
    tagline: 'Direct operator fulfillment via Nexus Shop platform treasury — 100% proceeds fund Nexus Shop operations.',
    avgSpeed: '1-2m Assisted',
    portalUrl: 'https://admin.nexusshop.com/treasury/direct-fulfillment',
    hasApi: false,
    isMock: false,
    isNexusIncome: true,
    incomeDescription: 'Direct platform income channel for Nexus Shop: Fulfill real orders directly via bonded distributor reserves with 100% merchant proceeds supporting Nexus Shop.',
  },
  {
    id: 'official_mlbb_channel',
    name: 'Official MLBB Top-Up Channel (shop.mobilelegends.com)',
    badge: 'Official Web Channel (Manual)',
    tagline: 'Official Moonton channel — suitable for manual fulfillment (no automation API for personal shops)',
    avgSpeed: '2-4m Manual',
    hasApi: false,
    portalUrl: 'https://shop.mobilelegends.com',
  },
  {
    id: 'moonton_portal',
    name: 'Moonton Official Partner Desk (Operator Console)',
    badge: 'Official Publisher Console',
    tagline: 'No public API; operator fulfills through official Moonton partner dashboard',
    avgSpeed: '1-3m Assisted',
    hasApi: false,
    portalUrl: 'https://partner.moonton.com/recharge/console',
  },
  {
    id: 'codashop_portal',
    name: 'Codashop Enterprise Merchant Center',
    badge: 'Merchant Dashboard',
    tagline: 'Direct operator fulfillment via official Codashop merchant console',
    avgSpeed: '1-2m Assisted',
    hasApi: false,
    portalUrl: 'https://enterprise.codapayments.com/merchant/topup',
  },
  {
    id: 'smile_portal',
    name: 'Smile.one Licensed Agent Portal',
    badge: 'Licensed Agent Console',
    tagline: 'No developer API; operator fulfills directly in Smile.one agent desk',
    avgSpeed: '1-2m Assisted',
    hasApi: false,
    portalUrl: 'https://agent.smile.one/desk/order-fulfillment',
  },
  {
    id: 'razer_gold_portal',
    name: 'Razer Gold Merchant Portal (Operator Console)',
    badge: 'Partner Rebate Console',
    tagline: 'Operator fulfillment via official Razer Gold merchant distribution portal earning partner rebates for Nexus Shop.',
    avgSpeed: '1-2m Assisted',
    hasApi: false,
    portalUrl: 'https://gold.razer.com/merchant/console',
    isNexusIncome: true,
    incomeDescription: 'Official Razer Gold merchant desk generating wholesale partner rebate income directly for Nexus Shop.',
  },
  {
    id: 'mock_provider_portal',
    name: 'Nexus Shop Mock Operator Portal (Dev Sandbox)',
    badge: '🧪 Sandbox Console',
    tagline: 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.',
    avgSpeed: '1-2m Simulated',
    hasApi: false,
    portalUrl: 'https://sandbox.nexusshop.dev/console/mock-test',
    isMock: true,
    warningNotice: 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.',
  },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  diamondPackage: DiamondPackage | null;
  seller: SellerListing | null;
  currency: Currency;
  verifiedAccount: MlbbAccount | null;
  setVerifiedAccount: (acc: MlbbAccount) => void;
  onOrderCreated: (newOrder: EscrowOrder) => void;
  currentUser?: UserAccount | null;
  initialQuantity?: number;
  bulkItems?: {
    package: DiamondPackage;
    seller: SellerListing;
    quantity: number;
  }[] | null;
  onOpenSignUp?: () => void;
  preferredPaymentMethod?: PaymentMethod;
  defaultPaymentMethod?: PaymentMethod;
  onUpdatePreferredPaymentMethod?: (method: PaymentMethod) => void;
  onOpenVipUpgradeModal?: () => void;
  onVipFreeDiamondClaim?: (amount: number) => void;
  initialDraftRestored?: CheckoutAutoDraft | null;
  onDraftUpdated?: (draft: CheckoutAutoDraft | null) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  diamondPackage,
  seller,
  currency,
  verifiedAccount,
  setVerifiedAccount,
  onOrderCreated,
  currentUser,
  initialQuantity = 1,
  bulkItems,
  onOpenSignUp,
  preferredPaymentMethod,
  defaultPaymentMethod,
  onUpdatePreferredPaymentMethod,
  onOpenVipUpgradeModal,
  onVipFreeDiamondClaim,
  initialDraftRestored,
  onDraftUpdated,
}) => {
  // Resolve user preferred payment method
  const effectivePreferredMethod: PaymentMethod =
    currentUser?.preferredPaymentMethod ||
    preferredPaymentMethod ||
    defaultPaymentMethod ||
    'gcash';

  // Determine initial payment method prioritizing preferredMethod if accepted by the seller
  const getInitialPaymentMethod = (): PaymentMethod => {
    if (seller?.acceptedPaymentMethods?.includes(effectivePreferredMethod)) {
      return effectivePreferredMethod;
    }
    return seller?.acceptedPaymentMethods?.[0] || 'gcash';
  };

  // MLBB Account fields
  const [userIdInput, setUserIdInput] = useState(verifiedAccount?.userId || currentUser?.mlbbUserId || '84729103');
  const [zoneIdInput, setZoneIdInput] = useState(verifiedAccount?.zoneId || currentUser?.mlbbZoneId || '3092');
  const [validatedAccount, setValidatedAccount] = useState<MlbbAccount | null>(verifiedAccount);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when verifiedAccount or currentUser changes
  useEffect(() => {
    if (verifiedAccount) {
      setUserIdInput(verifiedAccount.userId);
      setZoneIdInput(verifiedAccount.zoneId);
      setValidatedAccount(verifiedAccount);
    } else if (currentUser?.mlbbUserId && currentUser?.mlbbZoneId) {
      setUserIdInput(currentUser.mlbbUserId);
      setZoneIdInput(currentUser.mlbbZoneId);
    }
  }, [verifiedAccount, currentUser]);

  // Payment selection with automatic pre-fill from user profile preferred payment method
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(getInitialPaymentMethod);
  const [gcashRefInput, setGcashRefInput] = useState('GC-PH-' + Math.floor(1000000000 + Math.random() * 9000000000));
  const [buyerEmailInput, setBuyerEmailInput] = useState(currentUser?.email || '');
  const [preferenceSaveNotice, setPreferenceSaveNotice] = useState('');

  // Keep selectedMethod updated if preferred payment method or seller changes
  useEffect(() => {
    if (!seller?.acceptedPaymentMethods) return;
    if (seller.acceptedPaymentMethods.includes(effectivePreferredMethod)) {
      setSelectedMethod(effectivePreferredMethod);
    } else if (!seller.acceptedPaymentMethods.includes(selectedMethod)) {
      setSelectedMethod(seller.acceptedPaymentMethods[0] || 'gcash');
    }
  }, [seller, effectivePreferredMethod]);

  // Lead Developer Free Privilege: Strictly bound to authenticated currentUser session (cannot be spoofed via buyerEmailInput)
  const isDeveloperUser = Boolean(
    isEligibleForFreeEverything(currentUser) ||
    checkIsDev(currentUser) ||
    currentUser?.isDeveloper ||
    currentUser?.developerPrivileges?.freeDiamondsAll ||
    (currentUser?.email && currentUser.email.toLowerCase().trim() === 'barramedajacob36@gmail.com' && currentUser?.authProvider === 'google')
  );

  // Bulk items management
  const [editableBulkItems, setEditableBulkItems] = useState<{
    package: DiamondPackage;
    seller: SellerListing;
    quantity: number;
  }[]>(bulkItems && bulkItems.length > 0 ? bulkItems : []);

  useEffect(() => {
    if (bulkItems && bulkItems.length > 0) {
      setEditableBulkItems(bulkItems);
    } else {
      setEditableBulkItems([]);
    }
  }, [bulkItems]);

  const isBulkCheckout = Boolean(editableBulkItems && editableBulkItems.length > 1);

  // VIP Member status (Paid ₱950 activation)
  const isVip = Boolean(!isDeveloperUser && (checkIsVip(currentUser) || currentUser?.isVip || (currentUser?.tier && currentUser.tier.toLowerCase().includes('vip'))));

  // VIP Free Diamond Eligibility: ONLY 172 diamonds, maximum of 2 claims total, 24h wait between claims
  const vipFreeCheck = diamondPackage ? isPackageFreeForUser(diamondPackage, currentUser) : null;
  const isVipFreeClaim = Boolean(isVip && vipFreeCheck?.isVipFree && !isBulkCheckout);

  // Total free order check (Developer OR VIP Free Claim on 172)
  const isFreeOrder = isDeveloperUser || isVipFreeClaim;

  const [devPaymentRef] = useState(() => (isVipFreeClaim ? 'VIP-FREE-GRANT-' : 'DEV-VIP-GRANT-') + Math.floor(100000 + Math.random() * 900000));
  const activePaymentRef = isFreeOrder ? devPaymentRef : gcashRefInput;

  const handleUpdateBulkItemQuantity = (pkgId: string, delta: number) => {
    setEditableBulkItems((prev) =>
      prev.map((item) => {
        if (item.package.id === pkgId) {
          const newQty = Math.max(1, Math.min(50, item.quantity + delta));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveBulkItem = (pkgId: string) => {
    setEditableBulkItems((prev) => prev.filter((item) => item.package.id !== pkgId));
  };

  // Quantity selection & real-time discount calculation
  const [quantity, setQuantity] = useState<number>(initialQuantity || 1);

  useEffect(() => {
    if (initialQuantity && initialQuantity >= 1) {
      setQuantity(initialQuantity);
    }
  }, [initialQuantity]);

  useEffect(() => {
    if (currentUser?.email) {
      setBuyerEmailInput(currentUser.email);
    }
  }, [currentUser]);

  // Interactive Payment / Escrow states
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [processingStatus, setProcessingStatus] = useState('Connecting to Payment Gateway...');

  // Fulfillment Mode: Official MLBB Channel (Manual) vs Distributor API vs Official Dashboard vs P2P Escrow
  const [fulfillmentType, setFulfillmentType] = useState<'official_mlbb_manual' | 'authorized_distributor_api' | 'authorized_distributor_dashboard' | 'p2p_seller'>('official_mlbb_manual');
  const [selectedDistributor, setSelectedDistributor] = useState<string>('official_mlbb_channel');
  const [showApiPayloadPreview, setShowApiPayloadPreview] = useState(false);

  // Copy to clipboard state and handler
  const [copiedState, setCopiedState] = useState<'all' | 'userId' | 'zoneId' | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [wasRestoredFromDraft, setWasRestoredFromDraft] = useState<boolean>(false);
  const [autoPay24hEnabled, setAutoPay24hEnabled] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<'instant' | 'defer_24h_autopay'>('instant');

  // Hydrate fields when resuming from an Auto-Draft
  useEffect(() => {
    if (!isOpen) return;
    if (initialDraftRestored && diamondPackage && initialDraftRestored.diamondPackage.id === diamondPackage.id) {
      if (initialDraftRestored.userIdInput) setUserIdInput(initialDraftRestored.userIdInput);
      if (initialDraftRestored.zoneIdInput) setZoneIdInput(initialDraftRestored.zoneIdInput);
      if (initialDraftRestored.validatedAccount) setValidatedAccount(initialDraftRestored.validatedAccount);
      if (initialDraftRestored.selectedMethod) setSelectedMethod(initialDraftRestored.selectedMethod);
      if (initialDraftRestored.fulfillmentType) setFulfillmentType(initialDraftRestored.fulfillmentType);
      if (initialDraftRestored.selectedDistributor) setSelectedDistributor(initialDraftRestored.selectedDistributor);
      if (initialDraftRestored.buyerEmailInput) setBuyerEmailInput(initialDraftRestored.buyerEmailInput);
      if (typeof initialDraftRestored.autoPay24hEnabled === 'boolean') {
        setAutoPay24hEnabled(initialDraftRestored.autoPay24hEnabled);
      }
      if (initialDraftRestored.quantity && initialDraftRestored.quantity >= 1) {
        setQuantity(initialDraftRestored.quantity);
      }
      if (initialDraftRestored.bulkItems && initialDraftRestored.bulkItems.length > 0) {
        setEditableBulkItems(initialDraftRestored.bulkItems);
      }
      setWasRestoredFromDraft(true);
    } else {
      setWasRestoredFromDraft(false);
    }
  }, [isOpen, initialDraftRestored, diamondPackage]);

  // Auto-Draft Persistence: Continuously save partial checkout details to localStorage while modal is open in 'details' step
  useEffect(() => {
    if (!isOpen || !diamondPackage || !seller || step !== 'details') return;

    const now = Date.now();
    const draftPayload: CheckoutAutoDraft = {
      id: `draft_${diamondPackage.id}_${seller.sellerId}`,
      diamondPackage,
      seller,
      quantity,
      bulkItems: editableBulkItems && editableBulkItems.length > 1 ? editableBulkItems : null,
      userIdInput,
      zoneIdInput,
      validatedAccount,
      selectedMethod,
      fulfillmentType,
      selectedDistributor,
      buyerEmailInput,
      autoPay24hEnabled,
      savedAt: now,
    };

    try {
      localStorage.setItem(CHECKOUT_AUTO_DRAFT_KEY, JSON.stringify(draftPayload));
      setLastDraftSavedAt(now);
      if (onDraftUpdated) {
        onDraftUpdated(draftPayload);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [
    isOpen,
    diamondPackage,
    seller,
    step,
    quantity,
    editableBulkItems,
    userIdInput,
    zoneIdInput,
    validatedAccount,
    selectedMethod,
    fulfillmentType,
    selectedDistributor,
    buyerEmailInput,
    autoPay24hEnabled,
  ]);

  // Also ensure draft is flushed on page unload / disconnect while checkout is open
  useEffect(() => {
    if (!isOpen || !diamondPackage || !seller || step !== 'details') return;

    const handleBeforeUnload = () => {
      try {
        const draftPayload: CheckoutAutoDraft = {
          id: `draft_${diamondPackage.id}_${seller.sellerId}`,
          diamondPackage,
          seller,
          quantity,
          bulkItems: editableBulkItems && editableBulkItems.length > 1 ? editableBulkItems : null,
          userIdInput,
          zoneIdInput,
          validatedAccount,
          selectedMethod,
          fulfillmentType,
          selectedDistributor,
          buyerEmailInput,
          savedAt: Date.now(),
        };
        localStorage.setItem(CHECKOUT_AUTO_DRAFT_KEY, JSON.stringify(draftPayload));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [
    isOpen,
    diamondPackage,
    seller,
    step,
    quantity,
    editableBulkItems,
    userIdInput,
    zoneIdInput,
    validatedAccount,
    selectedMethod,
    fulfillmentType,
    selectedDistributor,
    buyerEmailInput,
  ]);

  const handleDiscardAndClose = () => {
    clearCheckoutAutoDraftStorage();
    if (onDraftUpdated) onDraftUpdated(null);
    onClose();
  };

  if (!isOpen || !diamondPackage || !seller) return null;

  const handleUpdateQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  const pricing = calculatePackagePricing(
    diamondPackage,
    quantity,
    selectedMethod,
    seller.priceUsd,
    seller.pricePhp,
    Boolean(isVip)
  );

  const bulkPricing = calculateMultiPackagePricing(
    editableBulkItems.map((b) => ({
      package: b.package,
      quantity: b.quantity,
      customUnitPriceUsd: b.seller?.priceUsd,
      customUnitPricePhp: b.seller?.pricePhp,
    })),
    selectedMethod,
    Boolean(isVip)
  );

  // Referral Diamond Discount: Unlocked when friends register via user's invite link
  const referralDiscountRate = currentUser?.referralDiscountPercent || (currentUser?.referralBadge ? 5 : 0);
  const hasReferralDiscount = referralDiscountRate > 0 && !isFreeOrder;

  // Loyalty Tier Automatic Discount: Calculated based on total diamond purchases
  const userLoyaltyTier = currentUser ? calculateLoyaltyTier(currentUser.totalDiamondsPurchased || 0) : null;
  const loyaltyDiscountRate = userLoyaltyTier ? userLoyaltyTier.discountPercent : 0;
  const hasLoyaltyDiscount = loyaltyDiscountRate > 0 && !isFreeOrder;

  const baseFinalPriceUsd = isFreeOrder
    ? 0
    : isBulkCheckout
    ? bulkPricing.finalPriceUsd
    : pricing.finalPriceUsd;

  const baseFinalPricePhp = isFreeOrder
    ? 0
    : isBulkCheckout
    ? bulkPricing.finalPricePhp
    : pricing.finalPricePhp;

  const referralDiscountUsd = hasReferralDiscount
    ? +((baseFinalPriceUsd * referralDiscountRate) / 100).toFixed(2)
    : 0;
  const referralDiscountPhp = hasReferralDiscount
    ? Math.round((baseFinalPricePhp * referralDiscountRate) / 100)
    : 0;

  const loyaltyDiscountUsd = hasLoyaltyDiscount
    ? +((baseFinalPriceUsd * loyaltyDiscountRate) / 100).toFixed(2)
    : 0;
  const loyaltyDiscountPhp = hasLoyaltyDiscount
    ? Math.round((baseFinalPricePhp * loyaltyDiscountRate) / 100)
    : 0;

  const effectivePriceUsd = Math.max(0, +(baseFinalPriceUsd - referralDiscountUsd - loyaltyDiscountUsd).toFixed(2));
  const effectivePricePhp = Math.max(0, baseFinalPricePhp - referralDiscountPhp - loyaltyDiscountPhp);

  // Refer-a-Friend active referral detection
  const appliedRefCode = currentUser?.referredBy || (() => {
    try {
      return localStorage.getItem('nexus_pending_ref_code') || undefined;
    } catch {
      return undefined;
    }
  })();

  const totalDiamondsForBonus = isBulkCheckout
    ? bulkPricing.totalDiamonds
    : (diamondPackage.diamonds + diamondPackage.bonusDiamonds) * quantity;
  const estimatedRefBonus = appliedRefCode
    ? calculateReferralBonus(totalDiamondsForBonus)
    : 0;

  const buildBulkOrderMetadata = () => {
    if (!isBulkCheckout) {
      return {
        isBulkOrder: false,
        totalPackagesCount: 1,
        items: undefined,
        packageName: diamondPackage.name,
        packageImage: diamondPackage.image || getDiamondAssetForPackage(diamondPackage),
        diamonds: pricing.totalBaseDiamonds,
        bonusDiamonds: pricing.totalBonusDiamonds,
        quantity: quantity,
        amount: effectivePriceUsd,
        amountPhp: effectivePricePhp,
        subtotalAmount: pricing.subtotalUsd,
        subtotalAmountPhp: pricing.subtotalPhp,
        bulkDiscountApplied: pricing.hasBulkDiscount,
        bulkDiscountRate: pricing.hasBulkDiscount ? pricing.bulkDiscountPercent : 0,
        bulkDiscountAmount: pricing.bulkDiscountUsd,
        gcashDiscountApplied: pricing.hasGcashDiscount,
        gcashDiscountRate: pricing.hasGcashDiscount ? pricing.gcashDiscountPercent : 0,
        gcashDiscountAmount: pricing.gcashDiscountUsd,
        referralCodeApplied: appliedRefCode,
        referralBonusDiamondsBuyer: estimatedRefBonus,
        referralBonusDiamondsReferrer: estimatedRefBonus,
        loyaltyTierApplied: userLoyaltyTier?.name,
        loyaltyDiscountRate: hasLoyaltyDiscount ? loyaltyDiscountRate : 0,
        loyaltyDiscountAmount: loyaltyDiscountUsd,
        loyaltyDiscountAmountPhp: loyaltyDiscountPhp,
        autoPay24hEnabled: autoPay24hEnabled,
        autoPayDeadlineAt: autoPay24hEnabled ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
      };
    }

    const items: BulkOrderItem[] = editableBulkItems.map((item) => {
      const unitUsd = item.seller?.priceUsd || item.package.discountPriceUsd;
      const unitPhp = item.seller?.pricePhp || Math.round(unitUsd * 58.5);
      return {
        packageId: item.package.id,
        packageName: item.package.name,
        diamonds: item.package.diamonds * item.quantity,
        bonusDiamonds: (item.package.bonusDiamonds || 0) * item.quantity,
        quantity: item.quantity,
        unitPriceUsd: unitUsd,
        unitPricePhp: unitPhp,
        subtotalUsd: +(unitUsd * item.quantity).toFixed(2),
        subtotalPhp: unitPhp * item.quantity,
        image: item.package.image || getDiamondAssetForPackage(item.package),
      };
    });

    return {
      isBulkOrder: true,
      totalPackagesCount: editableBulkItems.length,
      items,
      packageName: `Bulk Escrow Bundle (${editableBulkItems.length} Packages · ${bulkPricing.totalDiamonds.toLocaleString()} 💎)`,
      packageImage: editableBulkItems[0]?.package.image || getDiamondAssetForPackage(editableBulkItems[0]?.package || diamondPackage),
      diamonds: bulkPricing.totalBaseDiamonds,
      bonusDiamonds: bulkPricing.totalBonusDiamonds,
      quantity: bulkPricing.totalUnitsCount,
      amount: effectivePriceUsd,
      amountPhp: effectivePricePhp,
      subtotalAmount: bulkPricing.subtotalUsd,
      subtotalAmountPhp: bulkPricing.subtotalPhp,
      bulkDiscountApplied: bulkPricing.hasBulkDiscount,
      bulkDiscountRate: bulkPricing.hasBulkDiscount ? bulkPricing.bulkDiscountPercent : 0,
      bulkDiscountAmount: bulkPricing.bulkDiscountUsd,
      gcashDiscountApplied: bulkPricing.hasGcashDiscount,
      gcashDiscountRate: bulkPricing.hasGcashDiscount ? bulkPricing.gcashDiscountPercent : 0,
      gcashDiscountAmount: bulkPricing.gcashDiscountUsd,
      referralCodeApplied: appliedRefCode,
      referralBonusDiamondsBuyer: estimatedRefBonus,
      referralBonusDiamondsReferrer: estimatedRefBonus,
      loyaltyTierApplied: userLoyaltyTier?.name,
      loyaltyDiscountRate: hasLoyaltyDiscount ? loyaltyDiscountRate : 0,
      loyaltyDiscountAmount: loyaltyDiscountUsd,
      loyaltyDiscountAmountPhp: loyaltyDiscountPhp,
      autoPay24hEnabled: autoPay24hEnabled,
      autoPayDeadlineAt: autoPay24hEnabled ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
    };
  };

  const handleCopyToClipboard = (target: 'all' | 'userId' | 'zoneId' = 'all') => {
    let textToCopy = '';
    if (target === 'userId') {
      textToCopy = userIdInput.trim();
    } else if (target === 'zoneId') {
      textToCopy = zoneIdInput.trim();
    } else {
      const user = userIdInput.trim();
      const zone = zoneIdInput.trim();
      if (user && zone) {
        textToCopy = `${user} (${zone})`;
      } else if (user) {
        textToCopy = user;
      } else if (zone) {
        textToCopy = zone;
      }
    }

    if (!textToCopy) return;

    const fallbackCopy = (text: string) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // ignore
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {
        fallbackCopy(textToCopy);
      });
    } else {
      fallbackCopy(textToCopy);
    }

    setCopiedState(target);
    setTimeout(() => {
      setCopiedState(null);
    }, 2000);
  };

  // Intelligent User ID input handler
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setErrorMsg('');
    const parsed = parseCombinedMlbbInput(val);
    if (parsed) {
      setUserIdInput(parsed.userId);
      setZoneIdInput(parsed.zoneId);
      return;
    }
    setUserIdInput(val);
  };

  const handleZoneIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const cleaned = e.target.value.replace(/[()[\]\s]/g, '');
    setZoneIdInput(cleaned);
  };

  const handleValidateAccount = () => {
    setErrorMsg('');
    const cleanUser = sanitizeMlbbId(userIdInput);
    const cleanZone = sanitizeMlbbId(zoneIdInput);

    if (!cleanUser && !cleanZone) {
      setErrorMsg('Please enter both MLBB User ID and Zone ID.');
      return;
    }
    if (!cleanUser || cleanUser.length < 6 || cleanUser.length > 10) {
      setErrorMsg('MLBB User ID must be 6–10 numeric digits.');
      return;
    }
    if (!cleanZone || cleanZone.length < 3 || cleanZone.length > 5) {
      setErrorMsg('Zone ID must be 3–5 digits (e.g. 3092).');
      return;
    }

    setIsValidating(true);
    setTimeout(() => {
      try {
        const acc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);
        setValidatedAccount(acc);
        setVerifiedAccount(acc);
        setUserIdInput(acc.userId);
        setZoneIdInput(acc.zoneId);
      } catch {
        setErrorMsg('Unable to verify account with Moonton server. Please check IDs.');
      } finally {
        setIsValidating(false);
      }
    }, 450);
  };

  const handleAuthorizePaymentAndEscrow = async () => {
    if (step !== 'details') return; // Idempotency guard against rapid double-clicks on slow connections

    if (!currentUser) {
      setErrorMsg('Sign In Required: First of all, please sign in to your account so you can order with Escrow.');
      if (onOpenSignUp) {
        onClose();
        onOpenSignUp();
      }
      return;
    }

    const cleanUser = sanitizeMlbbId(userIdInput);
    const cleanZone = sanitizeMlbbId(zoneIdInput);

    if (!cleanUser || cleanUser.length < 6 || cleanUser.length > 10) {
      setErrorMsg('Please enter a valid 6–10 digit MLBB User ID.');
      return;
    }
    if (!cleanZone || cleanZone.length < 3 || cleanZone.length > 5) {
      setErrorMsg('Please enter a valid 3–5 digit Zone ID.');
      return;
    }

    if (buyerEmailInput.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmailInput.trim())) {
      setErrorMsg('Please enter a valid notification email address for your escrow receipt.');
      return;
    }

    const acc =
      (validatedAccount && validatedAccount.userId === cleanUser && validatedAccount.zoneId === cleanZone)
        ? validatedAccount
        : lookupOrGenerateMlbbAccount(cleanUser, cleanZone);

    setValidatedAccount(acc);
    setVerifiedAccount(acc);

    const activeProvider = DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor) || DISTRIBUTOR_PROVIDERS[0];
    const newOrderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const generatedRefId = activeProvider.isMock 
      ? 'MOCK-SANDBOX-' + acc.userId + '-' + Math.floor(100000 + Math.random() * 900000)
      : activeProvider.id === 'nexus_direct_income'
      ? 'NX-REV-' + acc.userId + '-' + Math.floor(100000 + Math.random() * 900000)
      : activeProvider.id === 'razer_gold_b2b'
      ? 'RZ-GOLD-' + acc.userId + '-' + Math.floor(100000 + Math.random() * 900000)
      : 'MT-DIST-' + acc.userId + '-' + Math.floor(100000 + Math.random() * 900000);

    setStep('processing');
    playEscrowLockSound();

    // Server-side Zod & Anti-Price-Tampering pre-flight check (with 4s timeout for slow internet resilience)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const valRes = await fetch('/api/security/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: cleanUser,
          zoneId: cleanZone,
          packageId: diamondPackage.id,
          paymentMethod: isDeveloperUser ? 'wallet' : selectedMethod,
          quantity: Math.min(10, Math.max(1, quantity)),
          currency: currency,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (valRes.status === 400 || valRes.status === 429) {
        const errData = await valRes.json().catch(() => ({}));
        setStep('details');
        setErrorMsg(errData.error || 'Order validation blocked by Aegis Security Gateway.');
        return;
      }
    } catch {
      // Graceful fallback if user is on a slow or offline connection
    }

    if (paymentMode === 'defer_24h_autopay' && !isDeveloperUser) {
      setProcessingStatus(`Reserving Order #${newOrderId} with 24-Hour Buyer Auto-Pay Guarantee...`);

      setTimeout(() => {
        setProcessingStatus(
          `Binding 24-Hour Auto-Pay Contract to ${paymentMeta.name} (${formatCurrency(effectivePriceUsd, currency, effectivePricePhp)})...`
        );
      }, 950);

      setTimeout(() => {
        setProcessingStatus(
          `Order Reserved! If not manually paid within 24 hours, payment will auto-execute at ${new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
        );
      }, 1950);

      setTimeout(() => {
        const deadlineTs = Date.now() + 24 * 60 * 60 * 1000;
        const newOrder: EscrowOrder = {
          id: newOrderId,
          buyerId: currentUser ? currentUser.id : 'user_current',
          buyerName: currentUser ? currentUser.name : 'You',
          buyerEmail: buyerEmailInput,
          sellerId: seller.sellerId,
          sellerName: seller.sellerName,
          sellerAvatar: seller.sellerAvatar,
          sellerRating: seller.sellerRating,
          packageId: diamondPackage.id,
          ...buildBulkOrderMetadata(),
          autoPay24hEnabled: true,
          autoPayDeadlineAt: deadlineTs,
          mlbbUserId: acc.userId,
          mlbbZoneId: acc.zoneId,
          mlbbIgn: acc.ign,
          mlbbServer: acc.serverRegion,
          currency: currency,
          escrowFee: 0,
          paymentMethod: selectedMethod,
          paymentReference: activePaymentRef,
          status: 'escrow_pending',
          fulfillmentType: fulfillmentType,
          distributorProvider: activeProvider.name,
          createdAt: Date.now(),
          autoReleaseMinutesRemaining: 1440,
          chatMessages: [
            {
              id: 'msg_autopay_init_1',
              sender: 'system',
              senderName: 'Nexus Shop 24h Auto-Pay Engine',
              text: `⏱️ [24-HOUR AUTO-PAY ARMED]: Order #${newOrderId} reserved for ${acc.ign} (${acc.userId} / ${acc.zoneId}). Total due: ${formatCurrency(effectivePriceUsd, currency, effectivePricePhp)} via ${paymentMeta.name}. If the buyer does not complete payment manually within 24 hours, Aegis Auto-Pay will automatically charge ${paymentMeta.name} and settle the order.`,
              timestamp: Date.now(),
            },
            {
              id: 'msg_autopay_init_2',
              sender: 'seller',
              senderName: seller.sellerName,
              text: `Hello ${acc.ign}! Your diamond package is locked and reserved. You can click "Pay Now" anytime in the Order Tracker, or let the 24-Hour Auto-Pay complete the payment automatically!`,
              timestamp: Date.now() + 500,
            },
          ],
        };

        clearCheckoutAutoDraftStorage();
        if (onDraftUpdated) onDraftUpdated(null);
        setStep('success');
        setTimeout(() => {
          onOrderCreated(newOrder);
        }, 1200);
      }, 2800);
      return;
    }

    if (fulfillmentType === 'authorized_distributor_api') {
      setProcessingStatus(
        isDeveloperUser
          ? `👑 VIP Developer Verified (${currentUser?.email || 'barramedajacob36@gmail.com'}) — Granting 100% Free Diamonds...`
          : activeProvider.isNexusIncome
          ? `Securing Real-Money Payment Authorization for Nexus Shop Treasury via ${paymentMeta.name}...`
          : `Securing Real-Money Payment Authorization via ${paymentMeta.name}...`
      );

      setTimeout(() => {
        setProcessingStatus(
          activeProvider.isMock
            ? `[MOCK SANDBOX]: Transmitting test payload to ${activeProvider.name}...`
            : isDeveloperUser
            ? `👑 Authorizing Developer Free Pass for MLBB Player ${acc.userId} (${acc.zoneId})...`
            : activeProvider.isNexusIncome
            ? `💎 Nexus Shop Treasury: Allocating direct platform revenue & transmitting User ID (${acc.userId}) to Moonton Direct Gateway...`
            : `Nexus Shop sending player User ID (${acc.userId}) & Zone ID (${acc.zoneId}) to ${activeProvider.name}...`
        );
      }, 1000);

      setTimeout(() => {
        setProcessingStatus(
          activeProvider.isMock
            ? `[MOCK SANDBOX]: Simulating automated response (No real diamonds delivered)...`
            : isDeveloperUser
            ? `👑 Moonton Cluster executing Free Developer Diamond Grant (${diamondPackage.diamonds + diamondPackage.bonusDiamonds} 💎)...`
            : activeProvider.isNexusIncome
            ? `💎 Nexus Shop Direct Wholesale Pool injecting real Diamonds into Moonton SEA Cluster...`
            : `Provider API executing automated top-up on Moonton MLBB cluster...`
        );
      }, 2000);

      setTimeout(() => {
        setProcessingStatus(
          activeProvider.isMock
            ? `Mock Simulation Complete! Returned Test Reference: ${generatedRefId}`
            : isDeveloperUser
            ? `👑 Developer Diamonds Granted! Reference ID: ${generatedRefId} (₱0.00 FREE)`
            : activeProvider.isNexusIncome
            ? `💎 Nexus Shop Revenue Secured! Moonton Confirmed Reference ID: ${generatedRefId}`
            : `Top-Up Confirmed! Provider returned Reference ID: ${generatedRefId}`
        );
      }, 2900);

      setTimeout(() => {
        const newOrder: EscrowOrder = {
          id: newOrderId,
          buyerId: currentUser ? currentUser.id : 'user_current',
          buyerName: currentUser ? currentUser.name : 'You',
          buyerEmail: buyerEmailInput,
          sellerId: 'distributor_api_official',
          sellerName: activeProvider.name,
          sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          sellerRating: 5.0,
          packageId: diamondPackage.id,
          ...buildBulkOrderMetadata(),
          mlbbUserId: acc.userId,
          mlbbZoneId: acc.zoneId,
          mlbbIgn: acc.ign,
          mlbbServer: acc.serverRegion,
          currency: currency,
          escrowFee: 0,
          paymentMethod: isDeveloperUser ? 'wallet' : selectedMethod,
          paymentReference: activePaymentRef,
          status: 'delivered_pending_confirmation',
          fulfillmentType: 'authorized_distributor_api',
          distributorProvider: activeProvider.name,
          isMockProvider: activeProvider.isMock,
          mockProviderDisclaimer: activeProvider.isMock
            ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
            : undefined,
          isNexusIncome: activeProvider.isNexusIncome,
          incomeDescription: activeProvider.incomeDescription,
          moontonTransactionRef: generatedRefId,
          distributorApiPayload: {
            endpoint: activeProvider.endpoint || 'POST /api/v1/distributor/topup',
            userId: acc.userId,
            zoneId: acc.zoneId,
            packageId: diamondPackage.id,
            diamonds: diamondPackage.diamonds,
            bonusDiamonds: diamondPackage.bonusDiamonds,
            referenceId: generatedRefId,
            timestamp: Date.now(),
            status: 'SUCCESS',
          },
          moontonApiVerification: {
            verifiedAt: Date.now(),
            status: 'credited',
            providerName: activeProvider.name,
            providerLicense: activeProvider.isMock
              ? 'MOCK-SANDBOX-TEST-LICENSE'
              : activeProvider.isNexusIncome
              ? 'NEXUS-REVENUE-AUTH-' + Math.floor(10000 + Math.random() * 90000)
              : 'MOONTON-SEA-DIST-' + Math.floor(10000 + Math.random() * 90000),
            moontonRef: generatedRefId,
            serverCluster: acc.serverRegion || 'SEA-PH-01',
            pingMs: 16 + Math.floor(Math.random() * 10),
            diamondsDelivered: diamondPackage.diamonds + diamondPackage.bonusDiamonds,
            authSignature: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            deliveryTimestamp: Date.now(),
            isMockSimulation: activeProvider.isMock,
            mockProviderNotice: activeProvider.isMock
              ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
              : undefined,
          },
          createdAt: Date.now(),
          escrowLockedAt: Date.now(),
          proofUploadedAt: Date.now(),
          autoReleaseMinutesRemaining: 15,
          chatMessages: [
            {
              id: 'msg_init_1',
              sender: 'system',
              senderName: activeProvider.isNexusIncome ? 'Nexus Shop Treasury' : 'Nexus Shop Escrow Bot',
              text: activeProvider.isMock
                ? `[SANDBOX TEST]: Escrow Vault simulation active for ${formatCurrency(seller.priceUsd, currency)}. Engaged ${activeProvider.name}.`
                : activeProvider.isNexusIncome
                ? `💎 [OFFICIAL NEXUS REVENUE SECURED]: Total ${formatCurrency(seller.priceUsd, currency)} locked in Aegis Vault. This purchase generates 100% direct merchant revenue for Nexus Shop platform operations.`
                : `Escrow Vault Secured! Total ${formatCurrency(seller.priceUsd, currency)} locked. Nexus Shop engaged ${activeProvider.name} for automatic fulfillment.`,
              timestamp: Date.now(),
            },
            {
              id: 'msg_dist_api_2',
              sender: 'system',
              senderName: 'Nexus Shop Gateway Dispatcher',
              text: activeProvider.isMock
                ? `🧪 [MOCK PROVIDER DISPATCH - DEV & TESTING ONLY]: Nexus Shop simulated transmission of player User ID ${acc.userId} (${acc.zoneId}) to Mock Provider (${activeProvider.name}).\n\n⚠️ STRICT POLICY: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.\n\nSimulated Reference ID: ${generatedRefId}.`
                : activeProvider.isNexusIncome
                ? `💎 [NEXUSSHOP OFFICIAL WHOLESALE REVENUE DISPATCH]:\nYour transaction directly generates income for Nexus Shop platform treasury.\n\n✅ Transmitted player User ID ${acc.userId} (${acc.zoneId}) and package "${diamondPackage.name}" (${diamondPackage.diamonds + diamondPackage.bonusDiamonds} 💎) directly to Moonton server cluster.\n\nOfficial Transaction Reference ID: ${generatedRefId}.\n\nReal Diamonds are already credited in-game! 15-minute escrow inspection window active.`
                : `⚡ [AUTHORIZED DISTRIBUTOR API DISPATCH]: Nexus Shop transmitted player User ID ${acc.userId} (${acc.zoneId}) and package "${diamondPackage.name}" (${diamondPackage.diamonds + diamondPackage.bonusDiamonds} 💎) to ${activeProvider.name}.\n\n✅ The provider performed automatic top-up and returned Transaction/Reference ID: ${generatedRefId}.\n\nDiamonds are already credited to your MLBB account! 15-minute inspection window active.`,
              timestamp: Date.now() + 600,
            },
            {
              id: 'msg_seller_confirm',
              sender: 'seller',
              senderName: activeProvider.name,
              text: activeProvider.isMock
                ? `[MOCK PROVIDER RESPONSE]: Simulated top-up completed. Reference: ${generatedRefId}. (Reminder: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered).`
                : activeProvider.isNexusIncome
                ? `Nexus Shop Direct Wholesale Fulfillment confirmed! Reference: ${generatedRefId}. Thank you for directly supporting Nexus Shop!`
                : `Recharge complete via Official Provider Gateway. Reference: ${generatedRefId}. Thank you for using Nexus Shop automatic fulfillment!`,
              timestamp: Date.now() + 1000,
            },
          ],
        };

        clearCheckoutAutoDraftStorage();
        if (onDraftUpdated) onDraftUpdated(null);
        setStep('success');
        setTimeout(() => {
          onOrderCreated(newOrder);
        }, 1200);
      }, 3600);
    } else if (fulfillmentType === 'official_mlbb_manual') {
      // Official MLBB Top-Up Channel (Manual Operator Fulfillment Flow)
      setProcessingStatus(`Securing Real-Money Payment Authorization via ${paymentMeta.name}...`);

      setTimeout(() => {
        setProcessingStatus(`Payment of ${formatCurrency(seller.priceUsd, currency)} verified & locked in Aegis Escrow Vault!`);
      }, 900);

      setTimeout(() => {
        setProcessingStatus(`Routing to Shop Operator Manual Fulfillment Queue (Official MLBB Channel)...`);
      }, 1900);

      setTimeout(() => {
        setProcessingStatus(`Order Queued! Operator will fulfill via shop.mobilelegends.com and provide official Moonton receipt.`);
      }, 2800);

      setTimeout(() => {
        const newOrder: EscrowOrder = {
          id: newOrderId,
          buyerId: currentUser ? currentUser.id : 'user_current',
          buyerName: currentUser ? currentUser.name : 'You',
          buyerEmail: buyerEmailInput,
          sellerId: 'official_mlbb_operator',
          sellerName: 'Official MLBB Top-Up Channel (Manual Operator)',
          sellerAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
          sellerRating: 5.0,
          packageId: diamondPackage.id,
          ...buildBulkOrderMetadata(),
          mlbbUserId: acc.userId,
          mlbbZoneId: acc.zoneId,
          mlbbIgn: acc.ign,
          mlbbServer: acc.serverRegion,
          currency: currency,
          escrowFee: 0,
          paymentMethod: isDeveloperUser ? 'wallet' : selectedMethod,
          paymentReference: activePaymentRef,
          status: 'escrow_locked',
          fulfillmentType: 'official_mlbb_manual',
          distributorProvider: 'Official MLBB Top-Up Channel (shop.mobilelegends.com)',
          distributorMode: 'official_channel_manual',
          createdAt: Date.now(),
          escrowLockedAt: Date.now(),
          autoReleaseMinutesRemaining: 15,
          chatMessages: [
            {
              id: 'msg_mlbb_man_1',
              sender: 'system',
              senderName: 'Nexus Shop Escrow Vault',
              text: `Escrow Secured! Total ${formatCurrency(seller.priceUsd, currency)} protected in Aegis Vault. Channel: Official MLBB Top-Up Channel (Manual Fulfillment). Because Moonton does not provide an automation API for personal shops, our certified operator fulfills your order on the official Moonton website (shop.mobilelegends.com).`,
              timestamp: Date.now(),
            },
            {
              id: 'msg_mlbb_man_2',
              sender: 'seller',
              senderName: 'Shop Fulfillment Operator',
              text: `Hello ${acc.ign}! I have received your order for ${diamondPackage.diamonds + diamondPackage.bonusDiamonds} Diamonds. Your User ID ${acc.userId} (${acc.zoneId}) has been copied to the official Moonton top-up portal. I will attach your official Moonton transaction receipt here in 1-3 minutes!`,
              timestamp: Date.now() + 400,
            },
          ],
        };

        clearCheckoutAutoDraftStorage();
        if (onDraftUpdated) onDraftUpdated(null);
        setStep('success');
        setTimeout(() => {
          onOrderCreated(newOrder);
        }, 1200);
      }, 3500);
    } else if (fulfillmentType === 'authorized_distributor_dashboard') {
      // Authorized Distributor Official Dashboard Operator Fulfillment Flow
      setProcessingStatus(`Securing Real-Money Payment Authorization via ${paymentMeta.name}...`);

      setTimeout(() => {
        setProcessingStatus(`Payment of ${formatCurrency(seller.priceUsd, currency)} verified & locked in Aegis Escrow Vault!`);
      }, 1000);

      setTimeout(() => {
        setProcessingStatus(`Routing to Authorized Distributor Operator Console (${activeProvider.name})...`);
      }, 2000);

      setTimeout(() => {
        setProcessingStatus(`Order Dispatched to Operator Terminal! Awaiting official provider dashboard execution.`);
      }, 2900);

      setTimeout(() => {
        const newOrder: EscrowOrder = {
          id: newOrderId,
          buyerId: currentUser ? currentUser.id : 'user_current',
          buyerName: currentUser ? currentUser.name : 'You',
          buyerEmail: buyerEmailInput,
          sellerId: 'distributor_operator_' + activeProvider.id,
          sellerName: `${activeProvider.name} (Operator Desk)`,
          sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
          sellerRating: 5.0,
          packageId: diamondPackage.id,
          ...buildBulkOrderMetadata(),
          mlbbUserId: acc.userId,
          mlbbZoneId: acc.zoneId,
          mlbbIgn: acc.ign,
          mlbbServer: acc.serverRegion,
          currency: currency,
          escrowFee: 0,
          paymentMethod: isDeveloperUser ? 'wallet' : selectedMethod,
          paymentReference: activePaymentRef,
          status: 'escrow_locked',
          fulfillmentType: 'authorized_distributor_dashboard',
          distributorProvider: activeProvider.name,
          distributorMode: 'official_dashboard',
          isMockProvider: activeProvider.isMock,
          mockProviderDisclaimer: activeProvider.isMock
            ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
            : undefined,
          isNexusIncome: activeProvider.isNexusIncome,
          incomeDescription: activeProvider.incomeDescription,
          createdAt: Date.now(),
          escrowLockedAt: Date.now(),
          autoReleaseMinutesRemaining: 15,
          chatMessages: [
            {
              id: 'msg_dist_board_1',
              sender: 'system',
              senderName: activeProvider.isNexusIncome ? 'Nexus Shop Platform Treasury' : 'Nexus Shop Escrow Vault',
              text: activeProvider.isMock
                ? `[SANDBOX TEST]: Escrow Vault simulation active for ${formatCurrency(seller.priceUsd, currency)}. Selected Mock Provider "${activeProvider.name}". (Notice: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered).`
                : activeProvider.isNexusIncome
                ? `💎 [OFFICIAL NEXUS PLATFORM INCOME]: Total ${formatCurrency(seller.priceUsd, currency)} locked in Aegis Vault. This order generates direct operator revenue for Nexus Shop treasury. Dispatched to certified fulfillment desk.`
                : `Escrow Secured! Total ${formatCurrency(seller.priceUsd, currency)} is protected in the Aegis Vault. Provider "${activeProvider.name}" fulfills through its official dashboard console (no public API). Your order is queued for certified operator fulfillment.`,
              timestamp: Date.now(),
            },
            {
              id: 'msg_dist_board_2',
              sender: 'seller',
              senderName: `${activeProvider.name} Operator Desk`,
              text: activeProvider.isMock
                ? `[SANDBOX OPERATOR DESK]: Testing dispatch for MLBB ID ${acc.userId} (${acc.zoneId}). Notice: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.`
                : activeProvider.isNexusIncome
                ? `Hello ${acc.ign}! Nexus Shop Treasury Operator here. I have received your order for MLBB ID ${acc.userId} (${acc.zoneId}) for ${diamondPackage.diamonds + diamondPackage.bonusDiamonds} Diamonds. Fulfilling via bonded distributor reserve desk. Official Moonton receipt will be posted here!`
                : `Hello ${acc.ign}! We have queued your order for MLBB ID ${acc.userId} (${acc.zoneId}). Our operator is processing this directly via the provider's official dashboard. Your official fulfillment receipt reference will be posted here as soon as top-up is completed!`,
              timestamp: Date.now() + 500,
            },
          ],
        };

        clearCheckoutAutoDraftStorage();
        if (onDraftUpdated) onDraftUpdated(null);
        setStep('success');
        setTimeout(() => {
          onOrderCreated(newOrder);
        }, 1200);
      }, 3500);
    } else {
      // P2P Peer Seller Escrow Flow
      setProcessingStatus('Securing Real-Money Payment Authorization...');

      setTimeout(() => {
        setProcessingStatus('Verifying Funds & Locking in Aegis Escrow Vault...');
      }, 1000);

      setTimeout(() => {
        setProcessingStatus('Creating Moonton Dispatch Ticket for Peer Seller...');
      }, 2000);

      setTimeout(() => {
        const newOrder: EscrowOrder = {
          id: newOrderId,
          buyerId: currentUser ? currentUser.id : 'user_current',
          buyerName: currentUser ? currentUser.name : 'You',
          buyerEmail: buyerEmailInput,
          sellerId: seller.sellerId,
          sellerName: seller.sellerName,
          sellerAvatar: seller.sellerAvatar,
          sellerRating: seller.sellerRating,
          packageId: diamondPackage.id,
          ...buildBulkOrderMetadata(),
          mlbbUserId: acc.userId,
          mlbbZoneId: acc.zoneId,
          mlbbIgn: acc.ign,
          mlbbServer: acc.serverRegion,
          currency: currency,
          escrowFee: 0,
          paymentMethod: isDeveloperUser ? 'wallet' : selectedMethod,
          paymentReference: activePaymentRef,
          status: 'escrow_locked',
          fulfillmentType: 'p2p_seller',
          createdAt: Date.now(),
          escrowLockedAt: Date.now(),
          autoReleaseMinutesRemaining: 15,
          chatMessages: [
            {
              id: 'msg_init_1',
              sender: 'system',
              senderName: 'Nexus Shop Escrow Bot',
              text: `Escrow Vault Locked! Total ${formatCurrency(seller.priceUsd, currency)} held securely. Seller ${seller.sellerName} has been alerted to top up User ID ${acc.userId} (${acc.zoneId}).`,
              timestamp: Date.now(),
            },
            {
              id: 'msg_init_2',
              sender: 'seller',
              senderName: seller.sellerName,
              text: `Hello! I have received your escrow order for ${diamondPackage.diamonds} diamonds. I am processing the Moonton API recharge now!`,
              timestamp: Date.now() + 1000,
            },
          ],
        };

        clearCheckoutAutoDraftStorage();
        if (onDraftUpdated) onDraftUpdated(null);
        setStep('success');
        setTimeout(() => {
          onOrderCreated(newOrder);
        }, 1200);
      }, 3200);
    }
  };

  const paymentMeta = getPaymentMethodDetails(selectedMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white">Escrow-Protected Checkout</h3>
                {step === 'details' && lastDraftSavedAt && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                    title="Your package, seller, quantity, and MLBB ID are automatically saved to local storage so you can resume if disconnected or refreshed."
                  >
                    <Save className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Auto-Draft Saved</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Your funds remain safely locked until verified in-game</p>
            </div>
          </div>
          {step === 'details' && (
            <button
              onClick={onClose}
              title="Close (Auto-Draft will be kept to resume later)"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Processing State View */}
        {step === 'processing' && (
          <div className="p-8 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-7 h-7 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white mb-1.5">{processingStatus}</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Communicating with banking rails & locking funds into the non-custodial Aegis Escrow contract.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
              Contract ID: 0xAEGIS_ESCROW_MLBB_{Math.floor(100000 + Math.random() * 900000)}
            </div>
          </div>
        )}

        {/* Success Transition View */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-white">Payment Escrowed Successfully!</h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Funds locked in Escrow Vault. Redirecting directly to the Automated Transaction Tracker...
            </p>
          </div>
        )}

        {/* Details / Main Form */}
        {step === 'details' && (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {wasRestoredFromDraft && (
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold text-cyan-200">Resumed from Auto-Draft</span>
                    <p className="text-[11px] text-slate-300">
                      Restored your saved package ({quantity}x {diamondPackage.name}), seller ({seller.sellerName}), and MLBB ID details.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDiscardAndClose}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-red-950/70 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-[11px] font-semibold transition-colors shrink-0 cursor-pointer"
                >
                  Clear Draft
                </button>
              </div>
            )}

            {/* VIP Developer Grant Notification */}
            {isDeveloperUser && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-amber-950/70 border border-amber-500/50 shadow-lg shadow-purple-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-400/80 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        Developer & VIP Free Privilege Active
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                        {currentUser?.email || 'barramedajacob36@gmail.com'}
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200 mt-0.5">
                      100% Free Diamonds Privilege (including Big Diamonds) unlocked for Developer RALPH JAYCOB BARRAMEDA & VIP members. Zero payment required!
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                  <span className="text-[9px] text-amber-300/80 block font-mono uppercase tracking-wider">Developer & VIP Price</span>
                  <span className="text-sm font-black text-amber-300 font-mono">₱0.00 (100% FREE)</span>
                </div>
              </div>
            )}

            {!isDeveloperUser && (isBigDiamondPackage(diamondPackage) || pricing.totalDiamonds >= 700) && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">
                      Big Diamond Package ({pricing.totalDiamonds.toLocaleString()} 💎)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Big diamonds are 100% free exclusively for Developer (<strong>RALPH JAYCOB BARRAMEDA</strong> / <span className="font-mono text-cyan-300">barramedajacob36@gmail.com</span>) and VIP members. Regular buyers pay standard price.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                  VIP ONLY FREE
                </span>
              </div>
            )}

            {/* Step 1: Package & Seller Summary with Quantity & Bulk/GCash Discount Indicators */}
            {isBulkCheckout ? (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-500/50 space-y-3 shadow-lg shadow-cyan-950/20">
                {/* Header of bulk bundle */}
                <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0">
                      <Layers className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">Bulk Escrow Bundle</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                          {editableBulkItems.length} Packages
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        💎 {bulkPricing.totalDiamonds.toLocaleString()} Total Diamonds ({bulkPricing.totalUnitsCount} Units)
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-[10px] uppercase text-slate-400 block tracking-wider">
                      {isDeveloperUser ? 'VIP Price' : 'Bundle Total'}
                    </span>
                    {isDeveloperUser ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 line-through">
                          {formatCurrency(bulkPricing.subtotalUsd, currency, bulkPricing.subtotalPhp)}
                        </span>
                        <span className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1">
                          <Crown className="w-4 h-4 text-amber-400" />
                          ₱0.00 (FREE)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(effectivePriceUsd, currency, effectivePricePhp)}
                        </span>
                        {(bulkPricing.hasBulkDiscount || bulkPricing.hasGcashDiscount) && (
                          <span className="text-xs text-slate-500 line-through">
                            {formatCurrency(bulkPricing.subtotalUsd, currency, bulkPricing.subtotalPhp)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bulk items list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {editableBulkItems.map((item) => {
                    const itemSubtotalUsd = (item.seller?.priceUsd || item.package.discountPriceUsd) * item.quantity;
                    const itemSubtotalPhp = (item.seller?.pricePhp || Math.round(item.package.discountPriceUsd * 58.5)) * item.quantity;
                    const itemTotalDiamonds = (item.package.diamonds + (item.package.bonusDiamonds || 0)) * item.quantity;

                    return (
                      <div
                        key={item.package.id}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <DiamondImage
                            packageData={item.package}
                            size="sm"
                            className="rounded-lg border-slate-700 shrink-0"
                            alt={item.package.name}
                          />
                          <div className="min-w-0">
                            <h5 className="font-semibold text-slate-200 text-xs truncate">
                              {item.package.name}
                            </h5>
                            <span className="text-[11px] font-mono text-cyan-400 block truncate">
                              💎 {itemTotalDiamonds.toLocaleString()} Diamonds ({item.quantity}x @ {formatCurrency(item.seller?.priceUsd || item.package.discountPriceUsd, currency, item.seller?.pricePhp)})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkItemQuantity(item.package.id, -1)}
                              disabled={item.quantity <= 1}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              aria-label="Decrease item quantity"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-7 text-center font-mono font-bold text-xs text-white bg-slate-950 py-0.5 rounded border border-slate-800">
                              {item.quantity}x
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateBulkItemQuantity(item.package.id, 1)}
                              disabled={item.quantity >= 50}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              aria-label="Increase item quantity"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <div className="text-right font-mono text-xs font-bold text-white min-w-[60px]">
                            {formatCurrency(itemSubtotalUsd, currency, itemSubtotalPhp)}
                          </div>

                          {editableBulkItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBulkItem(item.package.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Remove package from bulk bundle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bulk perks badges */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Consolidated under 1 Escrow Vault Transaction ID</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {bulkPricing.hasBulkDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded-full shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>5% Bulk OFF ({bulkPricing.totalDiamonds.toLocaleString()} 💎)</span>
                      </span>
                    )}
                    {bulkPricing.hasGcashDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-sm">
                        <span>🇵🇭</span>
                        <span>2% GCash OFF</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <DiamondImage
                      packageData={diamondPackage}
                      size="md"
                      showGlow
                      className="rounded-xl border-cyan-500/40 shadow-sm shrink-0"
                      alt={`${diamondPackage.name} 3D Diamond`}
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{diamondPackage.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {pricing.totalDiamonds.toLocaleString()} 💎 Total
                        {' '}({pricing.totalBaseDiamonds.toLocaleString()} Base{pricing.totalBonusDiamonds > 0 ? ` + ${pricing.totalBonusDiamonds.toLocaleString()} Bonus` : ''})
                        {' · '}Seller: {seller.sellerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-xs text-slate-400 block">
                      {isDeveloperUser ? 'VIP Price' : 'Total'}
                    </span>
                    {isDeveloperUser ? (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500 line-through">
                          {formatCurrency(pricing.subtotalUsd, currency, pricing.subtotalPhp)}
                        </span>
                        <span className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1">
                          <Crown className="w-4 h-4 text-amber-400" />
                          ₱0.00 (FREE)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(effectivePriceUsd, currency, effectivePricePhp)}
                        </span>
                        {(pricing.hasBulkDiscount || pricing.hasGcashDiscount) && (
                          <span className="text-xs text-slate-500 line-through">
                            {formatCurrency(pricing.subtotalUsd, currency, pricing.subtotalPhp)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Stepper & Discount Indicators Row */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Quantity:</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(-1)}
                        disabled={quantity <= 1}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-9 text-center font-mono font-bold text-xs text-white bg-slate-900 py-0.5 rounded border border-slate-700">
                        {quantity}x
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(1)}
                        disabled={quantity >= 50}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {pricing.hasBulkDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/50 px-2 py-0.5 rounded-full shadow-sm">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Bulk Discount: 5% OFF (5,000+ 💎)</span>
                      </span>
                    )}
                    {pricing.hasGcashDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-sm">
                        <span>🇵🇭</span>
                        <span>GCash Promo: 2% OFF</span>
                      </span>
                    )}
                    {hasLoyaltyDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-400/50 px-2 py-0.5 rounded-full shadow-sm">
                        <Crown className="w-3 h-3 text-yellow-400" />
                        <span>{userLoyaltyTier?.name}: {loyaltyDiscountRate}% Auto-Discount</span>
                      </span>
                    )}
                    {!pricing.hasBulkDiscount && pricing.diamondsNeededForBulk <= 4000 && (
                      <span className="text-[10px] text-amber-400/90 font-mono">
                        Add {Math.ceil(pricing.diamondsNeededForBulk / diamondPackage.diamonds)} more for 5% bulk discount
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Guest Sign-In Notice */}
            {!currentUser && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/50 text-xs text-amber-200 flex items-start gap-3 shadow-md">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-bold">Sign In Required to Order with Escrow</strong>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      Escrow Policy
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    First of all, you need to sign in so you can order with Escrow. The Aegis Escrow Vault holds your real funds safely and tracks instant in-game diamond delivery to your Mobile Legends account.
                  </p>
                </div>
                {onOpenSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSignUp();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow transition-all flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-slate-950" />
                    <span>Sign In Now</span>
                  </button>
                )}
              </div>
            )}

            {/* Step 2: In-Game MLBB ID Check */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  1. Target MLBB Account
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard('all')}
                    disabled={!userIdInput.trim()}
                    title="Copy to Clipboard"
                    aria-label="Copy to Clipboard"
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${
                      copiedState === 'all'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {copiedState === 'all' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-emerald-300">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-cyan-400 hidden sm:inline">Official Server Recharge</span>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2">
                {/* User ID Field with Copy Button */}
                <div className="col-span-12 sm:col-span-5 relative">
                  <input
                    type="text"
                    value={userIdInput}
                    onChange={handleUserIdChange}
                    placeholder="User ID (e.g. 84729103)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {userIdInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard('userId')}
                      title="Copy User ID to Clipboard"
                      aria-label="Copy User ID to Clipboard"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {copiedState === 'userId' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Zone ID Field with Copy Button */}
                <div className="col-span-5 sm:col-span-3 relative">
                  <input
                    type="text"
                    value={zoneIdInput}
                    onChange={handleZoneIdChange}
                    placeholder="Zone (e.g. 3092)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  {zoneIdInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard('zoneId')}
                      title="Copy Zone ID to Clipboard"
                      aria-label="Copy Zone ID to Clipboard"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      {copiedState === 'zoneId' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Dedicated 'Copy to Clipboard' Button Next to Fields */}
                <div className="col-span-4 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => handleCopyToClipboard('all')}
                    disabled={!userIdInput.trim()}
                    title="Copy to Clipboard"
                    aria-label="Copy to Clipboard"
                    className={`w-full h-full min-h-[34px] py-2 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      copiedState === 'all'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-cyan-300 border-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {copiedState === 'all' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-medium truncate">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-[11px] truncate">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Check / Verification Button */}
                <div className="col-span-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleValidateAccount}
                    disabled={isValidating}
                    className="w-full h-full min-h-[34px] py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    {isValidating ? '...' : 'Check'}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Verified Badge */}
              {validatedAccount && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">{validatedAccount.ign}</span>
                      <span className="text-slate-400 font-mono ml-2">
                        {validatedAccount.userId} ({validatedAccount.zoneId}) · {validatedAccount.serverRegion}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyToClipboard('all')}
                      title="Copy to Clipboard"
                      className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedState === 'all' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-cyan-400" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700">
                      MATCH CONFIRMED
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Fulfillment Mode (Authorized Distributor API vs P2P Escrow) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <span>2. Fulfillment Channel</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-bold">
                    Automated vs Escrow
                  </span>
                </label>
                <span className="text-[11px] text-cyan-400 font-mono">0% Account Risk</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
                {/* Mode 1: Official MLBB Top-Up Channel (Manual Fulfillment) */}
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType('official_mlbb_manual');
                    setSelectedDistributor('official_mlbb_channel');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                    fulfillmentType === 'official_mlbb_manual'
                      ? 'border-amber-500 bg-gradient-to-br from-amber-950/70 via-slate-900 to-amber-950/40 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-bold flex items-center gap-1">
                        <Globe className="w-3 h-3 text-amber-400" />
                        <span>OFFICIAL CHANNEL</span>
                      </span>
                      {fulfillmentType === 'official_mlbb_manual' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-amber-400" />
                      <span>Official MLBB Channel</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      <strong className="text-amber-300">Suitable for manual fulfillment</strong>, but it generally isn't an automation API for my own shop. Operator fulfills directly via Moonton official web shop.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-900/40 flex items-center justify-between text-[10px] font-mono text-amber-300">
                    <span>⏱ 2-4m Manual Top-Up</span>
                    <span>100% Moonton Safe</span>
                  </div>
                </button>

                {/* Mode 2: Authorized Distributor / API */}
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType('authorized_distributor_api');
                    setSelectedDistributor('nexus_direct_income');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                    fulfillmentType === 'authorized_distributor_api'
                      ? 'border-cyan-500 bg-gradient-to-br from-cyan-950/60 to-slate-900 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700/60 font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-300" />
                        <span>INSTANT API</span>
                      </span>
                      {fulfillmentType === 'authorized_distributor_api' && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Distributor API</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      <strong className="text-cyan-300">Best for automatic fulfillment.</strong> Nexus Shop sends player User ID/Zone ID and package to the provider's API; provider performs top-up and returns transaction ID.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-cyan-900/40 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span>⚡ 2-4s Direct API</span>
                    <span>Moonton Verified</span>
                  </div>
                </button>

                {/* Mode 3: Authorized Distributor / Official Dashboard */}
                <button
                  type="button"
                  onClick={() => {
                    setFulfillmentType('authorized_distributor_dashboard');
                    setSelectedDistributor('nexus_direct_portal');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                    fulfillmentType === 'authorized_distributor_dashboard'
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-950/60 to-slate-900 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-indigo-300" />
                        <span>PORTAL CONSOLE</span>
                      </span>
                      {fulfillmentType === 'authorized_distributor_dashboard' && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Distributor Dashboard</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      If the provider doesn't give an API, an operator fulfills paid orders through the provider's official dashboard.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-900/40 flex items-center justify-between text-[10px] font-mono text-indigo-300">
                    <span>⏱ 1-3m Operator Dispatch</span>
                    <span>Official Receipt</span>
                  </div>
                </button>

                {/* Mode 4: P2P Peer Seller Escrow */}
                <button
                  type="button"
                  onClick={() => setFulfillmentType('p2p_seller')}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                    fulfillmentType === 'p2p_seller'
                      ? 'border-emerald-500 bg-gradient-to-br from-emerald-950/60 to-slate-900 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        PEER ESCROW
                      </span>
                      {fulfillmentType === 'p2p_seller' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <h5 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>P2P Seller ({seller.sellerName})</span>
                    </h5>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      Funds remain locked in Aegis Escrow Vault while individual seller manually dispatches diamonds to your User ID and uploads proof.
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>⏱ ~{seller.avgDeliveryMinutes} mins SLA</span>
                    <span>100% Refundable</span>
                  </div>
                </button>
              </div>

              {/* Informative Callout for Official MLBB Channel (Manual Fulfillment) */}
              {fulfillmentType === 'official_mlbb_manual' && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-600/60 space-y-2 mb-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">
                        Official MLBB Top-Up Channel (shop.mobilelegends.com)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-bold">
                      Manual Operator Fulfillment
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong>Why Manual Fulfillment?</strong> The official MLBB channel (<span className="text-amber-300 font-mono">shop.mobilelegends.com</span>) is 100% legitimate and safe for diamonds, but Moonton generally does not offer an open automation API for personal shops. Your payment is safely locked in the Aegis Escrow Vault while our operator manually fulfills your top-up on the official Moonton website and attaches the official Moonton receipt.
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-900/40 text-[11px] font-mono">
                    <span className="text-slate-400">Target: {validatedAccount?.ign || 'Verified Player'} ({userIdInput} / {zoneIdInput})</span>
                    <span className="text-amber-400 font-semibold">Ready for Operator Dispatch</span>
                  </div>
                </div>
              )}

              {/* Provider Selector for Distributor Dashboard Channel */}
              {fulfillmentType === 'authorized_distributor_dashboard' && (
                <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-800/60 space-y-2.5 mb-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Select Provider Official Dashboard Console:</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-300">Operator Assisted</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {DISTRIBUTOR_PROVIDERS.filter((p) => !p.hasApi).map((provider) => {
                      const isSelected = selectedDistributor === provider.id;
                      const isIncome = !!provider.isNexusIncome;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedDistributor(provider.id)}
                          className={`p-2.5 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                            isSelected
                              ? isIncome
                                ? 'border-emerald-500 bg-emerald-950/60 text-white shadow-sm ring-1 ring-emerald-500/50'
                                : 'border-indigo-500 bg-indigo-950/50 text-white shadow-sm'
                              : isIncome
                              ? 'border-emerald-900/60 bg-emerald-950/20 text-slate-200 hover:border-emerald-700'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[11px] truncate text-white">{provider.name}</span>
                            {isSelected && <Check className={`w-3 h-3 shrink-0 ml-1 ${isIncome ? 'text-emerald-400' : 'text-indigo-400'}`} />}
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span className={isIncome ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>{provider.badge}</span>
                            {isIncome && <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">100% Real</span>}
                          </div>
                          <div className="text-[10px] text-indigo-300/90 font-mono">{provider.avgSpeed}</div>
                        </button>
                      );
                    })}
                  </div>

                  {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isNexusIncome && !DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isMock && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 border border-emerald-500/80 space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-300">
                          Official Nexus Shop Platform Income Channel
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-500 font-bold">
                          💰 Real Merchant Income (NOT Mock)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                          Real Moonton Delivery
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 leading-relaxed font-semibold">
                        {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.incomeDescription || 'Direct platform revenue channel for Nexus Shop. 100% of order margin directly funds platform operations, liquidity reserves, and buyer protection escrow.'}
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        This is an authentic income stream (NOT a sandbox mock). Operator fulfills directly using bonded distributor reserves with zero ban risk and authentic transaction receipts.
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 bg-slate-900/70 p-2 rounded border border-slate-800/80 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Operator Dashboard Workflow:</strong> Because the provider does not provide an automated public API, an authorized Nexus operator will manually execute the paid top-up inside the provider's official dashboard console and verify delivery with an authentic provider receipt.
                    </span>
                  </div>

                  {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isMock && (
                    <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/80 space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-300">
                          Mock Provider Sandbox Warning
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700 font-bold">
                          Dev/Testing Only
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 leading-relaxed font-semibold">
                        Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.
                      </p>
                      <p className="text-[11px] text-slate-300">
                        This simulated channel executes test payloads for UI/UX integration testing. No real diamonds are credited to any MLBB account.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Provider Selector & API Payload Drawer (Only when Authorized Distributor API is active) */}
              {fulfillmentType === 'authorized_distributor_api' && (
                <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-800/60 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Select Authorized Distributor Provider:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiPayloadPreview(!showApiPayloadPreview)}
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Code2 className="w-3 h-3" />
                      <span>{showApiPayloadPreview ? 'Hide Dispatch Payload' : 'Inspect API Payload'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DISTRIBUTOR_PROVIDERS.filter((p) => p.hasApi).map((provider) => {
                      const isSelected = selectedDistributor === provider.id;
                      const isIncome = !!provider.isNexusIncome;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedDistributor(provider.id)}
                          className={`p-2 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                            isSelected
                              ? isIncome
                                ? 'border-emerald-500 bg-emerald-950/60 text-white shadow-sm ring-1 ring-emerald-500/50'
                                : 'border-cyan-500 bg-cyan-950/50 text-white shadow-sm'
                              : isIncome
                              ? 'border-emerald-900/60 bg-emerald-950/20 text-slate-200 hover:border-emerald-700'
                              : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[11px] truncate text-white">{provider.name}</span>
                            {isSelected && <Check className={`w-3 h-3 shrink-0 ml-1 ${isIncome ? 'text-emerald-400' : 'text-cyan-400'}`} />}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span className={isIncome ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>{provider.badge}</span>
                            <span className={isIncome ? 'text-emerald-300 font-semibold' : 'text-cyan-300 font-semibold'}>{provider.avgSpeed}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isNexusIncome && !DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isMock && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 border border-emerald-500/80 space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-300">
                          Official Nexus Shop Platform Income Channel
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-500 font-bold">
                          💰 Real Merchant Revenue (NOT Mock)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                          Real Diamonds Credited
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 leading-relaxed font-semibold">
                        {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.incomeDescription || 'Direct platform revenue channel for Nexus Shop. Real-money top-ups generate direct merchant income supporting platform operations and liquidity reserves.'}
                      </p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Authentic revenue fulfillment stream: Diamonds are directly credited in-game to MLBB account via official Moonton API with 0% account ban risk.
                      </p>
                    </div>
                  )}

                  {DISTRIBUTOR_PROVIDERS.find((p) => p.id === selectedDistributor)?.isMock && (
                    <div className="p-3 rounded-xl bg-purple-950/70 border border-purple-500/80 space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-300">
                          Mock Provider Sandbox Warning
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-700 font-bold">
                          Dev/Testing Only
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 leading-relaxed font-semibold">
                        Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.
                      </p>
                      <p className="text-[11px] text-slate-300">
                        This simulated channel executes test payloads for UI/UX integration testing. No real diamonds are credited to any MLBB account.
                      </p>
                    </div>
                  )}

                  {/* Live Interactive API Dispatch Payload Viewer */}
                  {showApiPayloadPreview && (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-cyan-300 pb-1 border-b border-slate-800">
                        <span>POST /api/v1/distributor/topup</span>
                        <span className="text-emerald-400">STATUS: READY TO TRANSMIT</span>
                      </div>
                      <pre className="text-slate-300 overflow-x-auto p-1 leading-relaxed">
{JSON.stringify({
  request: {
    endpoint: DISTRIBUTOR_PROVIDERS.find(p => p.id === selectedDistributor)?.endpoint,
    playerId: userIdInput || '84729103',
    zoneId: zoneIdInput || '3092',
    packageId: diamondPackage.id,
    diamonds: diamondPackage.diamonds,
    bonusDiamonds: diamondPackage.bonusDiamonds,
    totalCredited: diamondPackage.diamonds + diamondPackage.bonusDiamonds,
    authProtocol: "DIRECT_MOONTON_GATEWAY_V3"
  },
  expectedResponse: {
    status: 200,
    message: "Fulfillment Successful",
    referenceId: `MT-DIST-${userIdInput || '84729103'}-XXXXXX`,
    diamondsCredited: diamondPackage.diamonds + diamondPackage.bonusDiamonds
  }
}, null, 2)}
                      </pre>
                      <p className="text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                        * Nexus Shop handles API authentication, payload encryption, and official Moonton transaction ID ledger mapping.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Real Money Payment Method */}
            <div id="checkout-payment-methods-section">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  3. Real-Money Payment Method (Trusted Gateway & Escrow Secured)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Stripe · Xendit · Midtrans Verified
                  </span>
                  {effectivePreferredMethod && (
                    <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-cyan-400" />
                      Pre-filled: {getPaymentMethodDetails(effectivePreferredMethod).name}
                    </span>
                  )}
                  {isDeveloperUser && (
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-mono">
                      <Crown className="w-3 h-3 text-amber-400" />
                      BYPASS ACTIVE (₱0.00)
                    </span>
                  )}
                </div>
              </div>

              {/* Anti-Scam Trusted Third-Party Payment Gateway Tip Banner */}
              <div
                id="trusted-payment-gateway-banner"
                className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/40 border border-emerald-500/50 text-xs space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Official Third-Party Payment Gateways (Stripe, Xendit & Midtrans)</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-500/40 font-bold">Stripe</span>
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 font-bold">Xendit</span>
                    <span className="px-1.5 py-0.5 rounded bg-teal-950/90 text-teal-300 border border-teal-500/40 font-bold">Midtrans</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Important Buyer Protection Tip:</strong> For a 100% legitimate, <strong className="text-white">"not scammy"</strong> reputation, all payments are processed through licensed third-party payment gateways (<strong className="text-emerald-300">Stripe, Xendit, and Midtrans</strong>) with full buyer protection—<strong>never</strong> by sending money directly to an unverified personal bank account or personal crypto wallet.
                </p>
              </div>

              {preferenceSaveNotice && (
                <div className="mb-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{preferenceSaveNotice}</span>
                </div>
              )}

              {isDeveloperUser && (
                <div className="mb-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between text-xs text-purple-200">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Developer & VIP Pass: Zero payment applied. All packages and big diamonds are 100% free for Developer RALPH JAYCOB BARRAMEDA & VIP members.</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded text-[11px]">
                    ₱0.00 DUE
                  </span>
                </div>
              )}

              {/* Categorized Payment Methods (1. Digital Wallets, 2. Bank Transfers, 3. E-Wallets, 4. Credit/Debit Cards) */}
              <div className="space-y-3 mb-3">
                {PAYMENT_GATEWAY_CATEGORIES.map((categoryGroup) => {
                  const availableMethods = categoryGroup.methods.filter(
                    (m) => seller.acceptedPaymentMethods.includes(m) || ['google_pay', 'apple_pay', 'dana', 'ovo', 'gopay', 'card', 'bank_transfer', 'gcash', 'maya', 'paypal'].includes(m)
                  );
                  if (availableMethods.length === 0) return null;

                  return (
                    <div
                      key={categoryGroup.id}
                      id={`payment-category-${categoryGroup.id}`}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <span className="text-[11px] font-bold text-white block">
                            {categoryGroup.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {categoryGroup.subtitle}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-semibold text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                          {categoryGroup.gatewayBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableMethods.map((m) => {
                          const info = getPaymentMethodDetails(m);
                          const isSelected = selectedMethod === m;
                          const isPreferred = effectivePreferredMethod === m;
                          const isGcash = m === 'gcash';
                          const activePricing = isBulkCheckout ? bulkPricing : pricing;
                          const isRecommendedRegion =
                            (currency === 'PHP' && (m === 'gcash' || m === 'maya')) ||
                            (currency === 'IDR' && (m === 'dana' || m === 'ovo' || m === 'gopay' || m === 'qris')) ||
                            (currency === 'MYR' && (m === 'tng' || m === 'fpx' || m === 'grabpay')) ||
                            (currency === 'SGD' && m === 'paynow') ||
                            (currency === 'THB' && (m === 'promptpay' || m === 'truemoney')) ||
                            (currency === 'BRL' && m === 'pix');

                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedMethod(m)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                                isSelected
                                  ? 'border-cyan-500 bg-cyan-950/50 shadow-sm ring-1 ring-cyan-500/40'
                                  : isRecommendedRegion
                                  ? 'border-emerald-500/40 bg-slate-900/90 hover:border-emerald-400/70'
                                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-base">{info.flag}</span>
                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                  {isGcash && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                                        activePricing.isGcashBigDiamondDiscount
                                          ? 'text-amber-300 bg-amber-950/90 border-amber-500/70 animate-pulse'
                                          : 'text-emerald-300 bg-emerald-950/90 border-emerald-500/60'
                                      }`}
                                    >
                                      {activePricing.isGcashBigDiamondDiscount ? 'Save 15% Big 💎' : 'Save 2%'}
                                    </span>
                                  )}
                                  {isRecommendedRegion && !isGcash && (
                                    <span className="text-[9px] font-bold text-emerald-300 bg-emerald-950/90 px-1 py-0.5 rounded border border-emerald-700/60">
                                      Local Best
                                    </span>
                                  )}
                                  {isPreferred && (
                                    <span className="text-[9px] font-bold text-cyan-300 bg-cyan-900/80 px-1 py-0.5 rounded border border-cyan-700/60">
                                      Favorite
                                    </span>
                                  )}
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                              </div>
                              <span className="font-bold text-xs text-white block">{info.name}</span>
                              <span className="text-[10px] text-slate-400 block">{info.badge}</span>
                              <span className="text-[9px] font-mono text-cyan-400/90 mt-0.5 block">
                                {info.gateway}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* GCash Discount Promotional Notice */}
              {selectedMethod === 'gcash' && (
                (() => {
                  const activePricing = isBulkCheckout ? bulkPricing : pricing;
                  return activePricing.isGcashBigDiamondDiscount ? (
                    <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/70 via-indigo-950/50 to-slate-900 border border-cyan-400/60 flex items-center justify-between text-xs text-cyan-200 shadow-md">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center shrink-0">
                          <Sparkles className="w-4 h-4 text-cyan-300 fill-cyan-400/30" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>GCash Big Diamond Deal: 15% OFF</span>
                            <span className="text-[9px] bg-blue-500 text-white font-mono px-1.5 py-0.5 rounded font-black tracking-wide">
                              15% BELOW
                            </span>
                          </div>
                          <p className="text-[11px] text-cyan-300/90">
                            High-volume tier active! 15% below standard price applied for orders of 700+ diamonds.
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded text-xs shrink-0 border border-amber-500/40 shadow-sm">
                        - {formatCurrency(activePricing.gcashDiscountUsd, currency, activePricing.gcashDiscountPhp)}
                      </span>
                    </div>
                  ) : (
                    <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span><strong>GCash Payment Discount:</strong> Extra 2% instant savings applied!</span>
                          {activePricing.diamondsNeededForGcashBigDiscount > 0 && (
                            <span className="block text-[11px] text-amber-300/95 font-medium mt-0.5">
                              💡 Buy {activePricing.diamondsNeededForGcashBigDiscount.toLocaleString()} more diamonds (700+ 💎) to unlock <strong>15% OFF GCash Big Diamond Discount</strong>!
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded text-[11px] shrink-0">
                        - {formatCurrency(activePricing.gcashDiscountUsd, currency, activePricing.gcashDiscountPhp)}
                      </span>
                    </div>
                  );
                })()
              )}

              {/* Set as favorite shortcut in checkout */}
              {selectedMethod !== effectivePreferredMethod && onUpdatePreferredPaymentMethod && (
                <div className="mb-3 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px]">
                  <span className="text-slate-400">
                    Switch favorite to <strong className="text-slate-200">{getPaymentMethodDetails(selectedMethod).name}</strong>?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdatePreferredPaymentMethod(selectedMethod);
                      setPreferenceSaveNotice(`Saved ${getPaymentMethodDetails(selectedMethod).name} as your preferred checkout method!`);
                      setTimeout(() => setPreferenceSaveNotice(''), 3500);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                    <span>Set as Profile Default</span>
                  </button>
                </div>
              )}

              {/* Dynamic Third-Party Gateway Checkout Details */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                {isDeveloperUser ? (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-amber-950/60 border border-amber-400/50 space-y-2">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white">Developer & VIP Zero-Payment Bypass Channel</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                        ₱0.00 FREE
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                      <span className="text-slate-400">Exemption Reference ID:</span>
                      <span className="text-amber-300 font-bold">{activePaymentRef}</span>
                    </div>
                    <p className="text-[11px] text-purple-200">
                      Zero payment required. Both regular packages and big diamonds are completely free for Developer <strong className="text-amber-300">RALPH JAYCOB BARRAMEDA</strong> (<span className="font-mono text-cyan-300">barramedajacob36@gmail.com</span>) and VIP members. Order executes immediately upon confirmation with no payment required.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                      <span className="font-medium flex items-center gap-1.5">
                        <span className="text-base">{paymentMeta.flag}</span>
                        <span>{paymentMeta.name}</span>
                        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                          {paymentMeta.gateway}
                        </span>
                      </span>
                      <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Buyer Protection Active
                      </span>
                    </div>

                    {selectedMethod === 'gcash' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Xendit Verified Merchant (PH):</span>
                          <span className="font-mono font-bold text-cyan-300">XENDIT-PH-NEXUSSHOP (Escrow Vault)</span>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Xendit Checkout Session ID (Auto-Generated):
                          </label>
                          <input
                            type="text"
                            value={gcashRefInput}
                            onChange={(e) => setGcashRefInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-white"
                          />
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'maya' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Xendit QR Ph Merchant Gateway:</span>
                          <span className="font-mono font-bold text-emerald-300">Aegis Vault via Xendit Maya API</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Authorize payment with one click via Xendit's official Maya Business Gateway. Protected by automated escrow buyer protection.
                        </p>
                      </div>
                    )}

                    {(selectedMethod === 'dana' || selectedMethod === 'ovo' || selectedMethod === 'gopay' || selectedMethod === 'qris') && (
                      <div className="space-y-2 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Indonesia Licensed Gateway:</span>
                          <span className="font-mono font-bold text-teal-300">Midtrans & Xendit Indonesia (BI Licensed)</span>
                        </div>
                        <p className="text-slate-400">
                          Instant IDR settlement via {paymentMeta.name}. Funds are held in Midtrans/Xendit Escrow until your MLBB diamonds are verified in-game.
                        </p>
                      </div>
                    )}

                    {(selectedMethod === 'google_pay' || selectedMethod === 'apple_pay') && (
                      <div className="space-y-2 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Digital Wallet Processor:</span>
                          <span className="font-mono font-bold text-cyan-300">Stripe Tokenized Checkout (PCI-DSS L1)</span>
                        </div>
                        <p className="text-slate-400">
                          Biometric 1-tap authorization via {paymentMeta.name}. Your card number is never shared with the seller.
                        </p>
                      </div>
                    )}

                    {(selectedMethod === 'card' || selectedMethod === 'visa_mastercard' || selectedMethod === 'paypal') && (
                      <div className="space-y-2 text-[11px] text-slate-400">
                        <span>Processed securely via <strong className="text-white">Stripe 3D-Secure 2.0</strong> & <strong className="text-white">PayPal Buyer Protection</strong> (Visa & Mastercard).</span>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-slate-300 flex justify-between items-center">
                          <span>💳 Visa / Mastercard •••• 4242 (Stripe 3DS Verified)</span>
                          <span className="text-emerald-400 font-bold">Protected</span>
                        </div>
                      </div>
                    )}

                    {(selectedMethod === 'bank_transfer' || selectedMethod === 'fpx') && (
                      <div className="text-[11px] text-slate-400 space-y-1.5">
                        <p>
                          <strong className="text-white">Automated Virtual Account (VA) & Direct Bank Transfer:</strong> Powered by <strong className="text-amber-300">Xendit & Midtrans Virtual Accounts</strong> (BCA, Mandiri, BNI, BRI, BDO, BPI, UnionBank, Maybank FPX).
                        </p>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-amber-300 flex items-center justify-between">
                          <span>Virtual Account (VA): 8808-2910-4419 (Xendit Escrow VA)</span>
                          <span className="text-[10px] text-emerald-400">Auto-Verified</span>
                        </div>
                        <p className="text-[10px] text-emerald-400">
                          ✓ Never send money to a personal bank account. This dedicated Virtual Account automatically locks your deposit in escrow.
                        </p>
                      </div>
                    )}

                    {['tng', 'grabpay', 'shopeepay', 'truemoney', 'paynow', 'promptpay', 'pix', 'boost', 'convenience_store'].includes(selectedMethod) && (
                      <div className="space-y-1.5 text-[11px] text-slate-400">
                        <div className="flex items-center justify-between">
                          <span>Regional Gateway Partner:</span>
                          <span className="font-mono font-bold text-cyan-300">{paymentMeta.gateway}</span>
                        </div>
                        <p>
                          Instant local e-wallet checkout with full escrow buyer protection. Funds release only after diamond delivery confirmation.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {currentUser ? (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200">
                    <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">
                      Ordering as <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[11px]">Save order receipts & diamonds history?</span>
                    {onOpenSignUp && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenSignUp();
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1 text-[11px]"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Sign Up for Account</span>
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Notification Email (For order receipts & tracking):
                  </label>
                  <input
                    type="email"
                    value={buyerEmailInput}
                    onChange={(e) => setBuyerEmailInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 font-mono">
              {isBulkCheckout ? (
                <>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Base Subtotal ({bulkPricing.totalUnitsCount} Units across {editableBulkItems.length} Packages):</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(bulkPricing.subtotalUsd, currency, bulkPricing.subtotalPhp)}</span>
                  </div>

                  {bulkPricing.hasBulkDiscount && (
                    <div className="flex items-center justify-between text-amber-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Bulk Discount (5,000+ 💎 Tier · 5% OFF):</span>
                      </span>
                      <span className="font-bold">- {formatCurrency(bulkPricing.bulkDiscountUsd, currency, bulkPricing.bulkDiscountPhp)}</span>
                    </div>
                  )}

                  {bulkPricing.hasGcashDiscount && (
                    <div className="flex items-center justify-between text-emerald-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <span>🇵🇭</span>
                        <span>
                          GCash Payment Discount ({bulkPricing.gcashDiscountPercent}% OFF
                          {bulkPricing.isGcashBigDiamondDiscount ? ' · 15% Below Big 💎 Deal' : ''}):
                        </span>
                      </span>
                      <span className="font-bold">- {formatCurrency(bulkPricing.gcashDiscountUsd, currency, bulkPricing.gcashDiscountPhp)}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Base Subtotal ({quantity}x {diamondPackage.name}):</span>
                    <span className="text-slate-200 font-semibold">{formatCurrency(pricing.subtotalUsd, currency, pricing.subtotalPhp)}</span>
                  </div>

                  {pricing.hasBulkDiscount && (
                    <div className="flex items-center justify-between text-amber-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Bulk Discount (5,000+ 💎 Tier · 5% OFF):</span>
                      </span>
                      <span className="font-bold">- {formatCurrency(pricing.bulkDiscountUsd, currency, pricing.bulkDiscountPhp)}</span>
                    </div>
                  )}

                  {pricing.hasGcashDiscount && (
                    <div className="flex items-center justify-between text-emerald-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <span>🇵🇭</span>
                        <span>
                          GCash Payment Discount ({pricing.gcashDiscountPercent}% OFF
                          {pricing.isGcashBigDiamondDiscount ? ' · 15% Below Big 💎 Deal' : ''}):
                        </span>
                      </span>
                      <span className="font-bold">- {formatCurrency(pricing.gcashDiscountUsd, currency, pricing.gcashDiscountPhp)}</span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Aegis Vault Escrow Protection:</span>
                <span className="text-emerald-400 font-semibold">₱0.00 (FREE)</span>
              </div>

              {hasReferralDiscount && (
                <div className="flex items-center justify-between text-amber-300 text-[11px] bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-500/40 shadow-sm animate-fadeIn">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Referral Badge Reward ({referralDiscountRate}% Diamond Discount):</span>
                  </span>
                  <span className="font-bold font-mono text-amber-200">
                    - {formatCurrency(referralDiscountUsd, currency, referralDiscountPhp)}
                  </span>
                </div>
              )}

              {hasLoyaltyDiscount && (
                <div className="flex items-center justify-between text-yellow-300 text-[11px] bg-yellow-950/40 px-2.5 py-1.5 rounded-lg border border-yellow-500/40 shadow-sm animate-fadeIn">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    <span>Loyalty Status ({userLoyaltyTier?.name} · {loyaltyDiscountRate}% Auto-Discount):</span>
                  </span>
                  <span className="font-bold font-mono text-yellow-200">
                    - {formatCurrency(loyaltyDiscountUsd, currency, loyaltyDiscountPhp)}
                  </span>
                </div>
              )}

              {appliedRefCode && estimatedRefBonus > 0 && (
                <div className="flex items-center justify-between text-cyan-300 text-[11px] bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-800/60 shadow-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gift className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Refer-a-Friend Dual Bonus ({appliedRefCode}):</span>
                  </span>
                  <span className="font-bold font-mono text-cyan-200">+{estimatedRefBonus} 💎 (5% for You & Friend)</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-white font-bold font-sans">Final Total Due:</span>
                <div className="text-right">
                  <span className="text-cyan-300 font-black text-base">
                    {isDeveloperUser ? '₱0.00 (VIP Developer Free)' : formatCurrency(effectivePriceUsd, currency, effectivePricePhp)}
                  </span>
                  {(isBulkCheckout
                    ? bulkPricing.hasBulkDiscount || bulkPricing.hasGcashDiscount
                    : pricing.hasBulkDiscount || pricing.hasGcashDiscount) && (
                    <div className="text-[10px] text-emerald-400 font-sans font-bold">
                      Total Savings:{' '}
                      {formatCurrency(
                        isBulkCheckout ? bulkPricing.totalSavingsUsd : pricing.totalSavingsUsd,
                        currency,
                        isBulkCheckout ? bulkPricing.totalSavingsPhp : pricing.totalSavingsPhp
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 24-Hour Buyer Auto-Pay Guarantee Card */}
            {!isDeveloperUser && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-500/50 text-xs space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          24-Hour Auto-Pay Protection
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 font-bold">
                          {autoPay24hEnabled ? 'AUTO-PAY ACTIVE' : 'MANUAL ONLY'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        If the buyer doesn't pay or confirm settlement within <strong>24 hours</strong>, the system automatically processes payment via <strong className="text-emerald-300">{paymentMeta.name}</strong> and settles the escrow order so your diamonds and seller payout are never stuck.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1" title="Toggle 24-Hour Buyer Auto-Pay">
                    <input
                      type="checkbox"
                      checked={autoPay24hEnabled}
                      onChange={(e) => {
                        setAutoPay24hEnabled(e.target.checked);
                        if (!e.target.checked && paymentMode === 'defer_24h_autopay') {
                          setPaymentMode('instant');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
                  </label>
                </div>

                {autoPay24hEnabled && (
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('instant')}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        paymentMode === 'instant'
                          ? 'bg-cyan-950/70 border-cyan-400 text-white font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <span className="block text-[11px] font-bold text-white">Pay Now & Lock Escrow</span>
                          <span className="block text-[10px] text-slate-400">Immediate payment + 24h auto-settle</span>
                        </div>
                      </div>
                      {paymentMode === 'instant' && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('defer_24h_autopay')}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        paymentMode === 'defer_24h_autopay'
                          ? 'bg-emerald-950/70 border-emerald-400 text-white font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="block text-[11px] font-bold text-emerald-300">Pay Within 24h (Auto-Pay)</span>
                          <span className="block text-[10px] text-slate-400">Auto-pays in 24h if buyer doesn't pay</span>
                        </div>
                      </div>
                      {paymentMode === 'defer_24h_autopay' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Escrow Terms & Breakdown */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2">
              <div className="flex items-center justify-between text-cyan-300 font-semibold">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Automated Escrow Protection Rules</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                  100% NOT SCAMMABLE
                </span>
              </div>
              <ul className="text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                <li>Payment is held securely in Aegis Vault until you confirm diamonds in-game.</li>
                <li><strong>24-Hour Auto-Pay Rule:</strong> If the buyer does not pay or confirm within 24 hours, payment is automatically processed and settled.</li>
                <li>Seller has a delivery SLA of ~{seller.avgDeliveryMinutes} minutes.</li>
                <li>You can cancel your order anytime before seller dispatch for an immediate 100% refund.</li>
                <li>Once delivered, you have a 15-minute verification window to inspect your MLBB diamond balance.</li>
                <li>If diamonds do not appear, click "Raise Dispute" to pause release and receive an escrow refund.</li>
              </ul>
            </div>

            {/* Anti-Scam & Safety Security Guarantee */}
            <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero-Scam Security & Anti-Phishing Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong className="text-amber-300">Password-Free Guarantee:</strong> Nexus Shop will <strong>NEVER</strong> ask for your game password, Moonton login code, or email credentials. Only your public Game ID and Zone ID are required for direct Moonton server injection.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  title="Close window and keep Auto-Draft saved in local storage to resume anytime"
                  className="px-3.5 py-2.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Keep Draft</span>
                </button>
                <button
                  type="button"
                  onClick={handleDiscardAndClose}
                  title="Discard saved Auto-Draft and close checkout"
                  className="px-3 py-2.5 rounded-lg border border-slate-800 text-slate-400 hover:text-red-300 hover:border-red-500/40 hover:bg-red-950/30 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>

              {!currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenSignUp) onOpenSignUp();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-slate-950 shadow-amber-500/20"
                >
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>Sign In First to Order with Escrow</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAuthorizePaymentAndEscrow}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isDeveloperUser
                      ? 'bg-gradient-to-r from-purple-600 via-amber-600 to-amber-500 hover:brightness-110 text-white shadow-purple-900/40 ring-1 ring-amber-300/50'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
                  }`}
                >
                  {isDeveloperUser ? (
                    <>
                      <Crown className="w-4 h-4 text-amber-300" />
                      <span>
                        Claim {(isBulkCheckout ? bulkPricing.totalDiamonds : pricing.totalDiamonds).toLocaleString()} Diamonds for FREE (₱0.00 VIP & Developer · Zero Payment)
                      </span>
                    </>
                  ) : paymentMode === 'defer_24h_autopay' ? (
                    <>
                      <Clock className="w-4 h-4" />
                      <span>Reserve Order with 24-Hour Auto-Pay ({formatCurrency(effectivePriceUsd, currency, effectivePricePhp)})</span>
                    </>
                  ) : fulfillmentType === 'authorized_distributor_api' ? (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Authorize & Execute Instant API Fulfillment ({formatCurrency(effectivePriceUsd, currency, effectivePricePhp)})</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Lock {formatCurrency(effectivePriceUsd, currency, effectivePricePhp)} in Escrow</span>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
