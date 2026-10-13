export type Currency = 
  // Southeast Asia (MLBB Core Hubs)
  | 'PHP' 
  | 'IDR' 
  | 'MYR'
  | 'SGD'
  | 'THB'
  | 'VND'
  | 'KHR'
  | 'MMK'
  | 'LAK'
  | 'BND'
  // East Asia (Competitive MLBB & Tournaments)
  | 'MNT'
  | 'JPY'
  | 'KRW'
  | 'HKD'
  | 'TWD'
  | 'CNY'
  // South Asia (MLBB South Asia Qualifiers & Cup)
  | 'NPR'
  | 'BDT'
  | 'INR'
  | 'PKR'
  | 'LKR'
  | 'MVR'
  // West Asia / Middle East (MPL MENA, EWC Riyadh, MTC)
  | 'SAR'
  | 'AED'
  | 'QAR'
  | 'KWD'
  | 'BHD'
  | 'OMR'
  | 'JOD'
  | 'IQD'
  | 'TRY'
  | 'EGP'
  // Central Asia (EECA & CIS Champions)
  | 'KZT'
  | 'UZS'
  | 'KGS'
  | 'TJS'
  // Americas & Global
  | 'BRL'
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'AUD'
  | 'CAD';

export type PaymentMethod = 
  | 'wallet'
  | 'tng' 
  | 'grabpay' 
  | 'boost' 
  | 'shopeepay' 
  | 'fpx' 
  | 'card' 
  | 'visa_mastercard'
  | 'google_pay'
  | 'apple_pay'
  | 'dana'
  | 'ovo'
  | 'gopay'
  | 'convenience_store' 
  | 'gcash' 
  | 'maya' 
  | 'paypal' 
  | 'bank_transfer' 
  | 'crypto_usdt'
  | 'paynow'
  | 'promptpay'
  | 'pix'
  | 'truemoney'
  | 'qris';

export interface CodashopGameItem {
  id: string;
  name: string;
  publisher: string;
  category: 'popular' | 'mobile' | 'pc' | 'voucher';
  badge?: string;
  icon: string;
  bannerUrl: string;
  tagline: string;
  popular?: boolean;
  currencyUnit: string; // e.g. "Diamonds", "UC", "VP", "Voucher"
  active?: boolean;
}

export interface CodashopBanner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  gameId: string;
  ctaText: string;
  accentColor: string;
}

export interface CurrencyRate {
  symbol: string;
  code: Currency;
  rateToUsd: number; // USD = 1, PHP = 58.5, IDR = 15800, MYR = 4.45
  name: string;
  flag: string;
  country: string;
  region?: string;
}

export interface DiamondPackage {
  id: string;
  name: string;
  diamonds: number;
  bonusDiamonds: number;
  regularPriceUsd: number;
  discountPriceUsd: number;
  pricePhp?: number;
  regularPricePhp?: number;
  isPass?: boolean;
  passType?: 'weekly_pass' | 'twilight_pass';
  badge?: string;
  popular?: boolean;
  image?: string;
}

export interface SellerListing {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRating: number;
  totalOrders: number;
  avgDeliveryMinutes: number;
  packageId: string;
  diamonds: number;
  priceUsd: number;
  pricePhp?: number;
  stock: number;
  instantAutoDelivery: boolean;
  acceptedPaymentMethods: PaymentMethod[];
  isProSeller: boolean;
  completionRate: number; // e.g. 99.8%
  ratingsCount?: number; // Total number of reviews/ratings received
}

export type OrderStatus = 
  | 'escrow_pending'
  | 'escrow_locked'
  | 'seller_processing'
  | 'delivery_proof_uploaded'
  | 'delivered_pending_confirmation'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface ChatMessage {
  id: string;
  sender: 'buyer' | 'seller' | 'system' | 'escrow_arbiter';
  senderName: string;
  text: string;
  timestamp: number;
  isProof?: boolean;
  proofUrl?: string;
}

export interface OrderFeedback {
  rating: number; // 1 to 5 stars
  review?: string; // Optional written feedback comment
  tags?: string[]; // Compliment tags like "⚡ Instant Delivery", "💎 Accurate Diamonds", "🛡️ Secure Escrow", "💬 Friendly Seller"
  createdAt: number;
  buyerName: string;
  orderId?: string;
}

export interface BulkOrderItem {
  packageId: string;
  packageName: string;
  diamonds: number;
  bonusDiamonds: number;
  quantity: number;
  unitPriceUsd: number;
  unitPricePhp?: number;
  subtotalUsd: number;
  subtotalPhp?: number;
  image?: string;
}

export interface EscrowOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRating: number;
  packageId: string;
  packageName: string;
  packageImage?: string;
  quantity?: number;
  isBulkOrder?: boolean;
  totalPackagesCount?: number;
  items?: BulkOrderItem[];
  bulkDiscountApplied?: boolean;
  bulkDiscountRate?: number;
  bulkDiscountAmount?: number;
  gcashDiscountApplied?: boolean;
  gcashDiscountRate?: number;
  gcashDiscountAmount?: number;
  subtotalAmount?: number;
  subtotalAmountPhp?: number;
  diamonds: number;
  bonusDiamonds: number;
  mlbbUserId: string;
  mlbbZoneId: string;
  mlbbIgn: string;
  mlbbServer: string;
  currency: Currency;
  amount: number;
  amountPhp?: number;
  escrowFee: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  status: OrderStatus;
  createdAt: number;
  escrowLockedAt?: number;
  sellerStartedAt?: number;
  proofUploadedAt?: number;
  proofImageUrl?: string;
  moontonTransactionRef?: string;
  autoReleaseMinutesRemaining: number; // e.g. 15 mins inspection countdown
  // 24-Hour Buyer Auto-Pay / Auto-Release Protocol
  autoPay24hEnabled?: boolean; // Automatically pay / settle order if buyer doesn't pay or confirm within 24 hours
  autoPayDeadlineAt?: number; // Exact timestamp (createdAt or deliveredAt + 24 hours) when 24h auto-pay triggers
  autoPaidAt?: number; // Timestamp when 24h auto-pay was executed
  autoPayTriggered?: boolean; // True if order was automatically paid/settled by the 24-hour auto-pay protocol
  escrowProtectionExtendedHours?: number; // Total hours extended (e.g. 24, 48)
  extensionCount?: number; // Number of times 24h extension was requested
  extendedUntil?: number; // Timestamp when extended protection concludes
  lastExtensionReason?: string; // Reason selected by buyer
  completedAt?: number;
  feedback?: OrderFeedback; // Post-transaction buyer rating & review
  disputeReason?: string;
  disputeNotes?: string;
  cancelledAt?: number;
  cancellationReason?: string;
  cancellationNotes?: string;
  refundTransactionRef?: string;
  refundedAmount?: number;
  fulfillmentType?: 'official_mlbb_manual' | 'authorized_distributor_api' | 'authorized_distributor_dashboard' | 'p2p_seller';
  distributorProvider?: string;
  distributorMode?: 'api' | 'official_dashboard' | 'official_channel_manual';
  distributorPortalDetails?: {
    portalName: string;
    portalUrl?: string;
    operatorId: string;
    operatorName: string;
    receiptNo: string;
    fulfilledAt: number;
    wholesaleCostUsd?: number;
    notes?: string;
    screenshotUrl?: string;
  };
  distributorApiPayload?: {
    endpoint: string;
    userId: string;
    zoneId: string;
    packageId: string;
    diamonds: number;
    bonusDiamonds: number;
    referenceId: string;
    timestamp: number;
    status: 'SUCCESS' | 'DISPATCHED' | 'CONFIRMED';
  };
  isMockProvider?: boolean;
  mockProviderDisclaimer?: string;
  isNexusIncome?: boolean;
  incomeDescription?: string;
  moontonApiVerification?: MoontonApiVerification;
  chatMessages: ChatMessage[];
  // Refer-a-Friend 5% Diamond Bonus Tracking
  referralCodeApplied?: string;
  referralBonusDiamondsBuyer?: number; // 5% bonus diamonds awarded to buyer on first order
  referralBonusDiamondsReferrer?: number; // 5% bonus diamonds awarded to inviter on first order
  referralProcessed?: boolean;
  // Moonton In-Game Diamond Auto-Detection & Anti-Abuse Payment Protection
  diamondsReceivedVerified?: boolean; // Set to true when Moonton game servers confirm diamond ingestion
  autoDetectedAt?: number; // Timestamp when diamond receipt was verified on Moonton server
  autoReleasedOnDetection?: boolean; // Indicates if escrow payment was auto-released following verification
  antiAbuseStatus?: 'protected' | 'pending_verification' | 'discrepancy_flagged'; // Protection status
  autoDetectionAudit?: DiamondAutoDetectionAudit; // Cryptographic Moonton server audit trail
  // Loyalty Tiers Automatic Discount Tracking
  loyaltyTierApplied?: string;
  loyaltyDiscountRate?: number; // e.g. 1%, 3%, 6%, 10%, 15%
  loyaltyDiscountAmount?: number;
  loyaltyDiscountAmountPhp?: number;
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referrerCode: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail?: string;
  referredUserIgn?: string;
  status: 'registered' | 'order_completed';
  createdAt: number;
  completedAt?: number;
  orderId?: string;
  orderDiamonds?: number;
  bonusDiamondsEarned?: number; // 5% of order diamonds
}

export interface UserReferralData {
  referralCode: string;
  totalReferred: number;
  successfulReferrals: number;
  bonusDiamondsEarned: number;
  referrals: ReferralRecord[];
  hasReferralBadge?: boolean;
  referralDiscountPercent?: number; // e.g. 5% or 10% diamond discount reward
}

export interface MoontonApiVerification {
  verifiedAt: number;
  status: 'credited' | 'pending_dispatch' | 'verified_delivered';
  providerName: string;
  providerLicense: string;
  moontonRef: string;
  serverCluster: string;
  pingMs: number;
  diamondsDelivered: number;
  previousBalance?: number;
  newBalance?: number;
  authSignature: string;
  deliveryTimestamp: number;
  isMockSimulation?: boolean;
  mockProviderNotice?: string;
}

export interface DiamondAutoDetectionAudit {
  verified: boolean;
  detectedAt: number;
  method: 'moonton_cluster_poll' | 'b2b_webhook' | 'ledger_delta_audit';
  serverCluster: string;
  moontonTransactionRef: string;
  accountIgn: string;
  userId: string;
  zoneId: string;
  diamondsDelivered: number;
  previousBalance: number;
  newBalance: number;
  latencyMs: number;
  cryptographicProof: string;
  antiAbuseLockActive: boolean;
  statusSummary: string;
  isMockSimulation?: boolean;
}

export interface MlbbAccount {
  userId: string;
  zoneId: string;
  ign: string;
  serverRegion: string;
  rank: string;
  avatarUrl?: string;
  level: number;
  isVerified: boolean;
}

export interface SellerProfile {
  id: string;
  name: string;
  avatar: string;
  email: string;
  rating: number;
  totalSales: number;
  availableBalanceUsd: number;
  escrowLockedBalanceUsd: number;
  totalEarnedUsd: number;
  payoutMethods: {
    gcash?: string;
    maya?: string;
    bank?: string;
    usdt?: string;
  };
}

export interface PriceAlert {
  id: string;
  packageId: string;
  packageName: string;
  diamonds: number;
  bonusDiamonds: number;
  targetPriceUsd: number;
  targetCurrency: Currency;
  createdAt: number;
  lastTriggeredAt?: number;
  isActive: boolean;
  triggerCount: number;
  notes?: string;
}

export interface OrderToastNotification {
  id: string;
  orderId?: string;
  order?: EscrowOrder;
  statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
  title: string;
  message: string;
  diamonds: number;
  sellerName: string;
  ign?: string;
  amount: number;
  currency: Currency;
  timestamp: number;
  read?: boolean;
  archived?: boolean;
  // Price Alert specific properties
  packageId?: string;
  packageName?: string;
  targetPriceUsd?: number;
  newPriceUsd?: number;
  seller?: SellerListing;
  diamondPackage?: DiamondPackage;
  savingsPct?: number;
}

export type SellerReputationLevel =
  | 'Novice Merchant'
  | 'Verified Vendor'
  | 'Trusted Vendor'
  | 'Elite Trader'
  | 'Apex Legend Partner';

export interface SellerReputationTier {
  level: number;
  name: SellerReputationLevel;
  minSales: number;
  minCompletionRate: number;
  feePercentage: number;
  inspectionMinutes: number;
  badgeLabel: string;
  description: string;
  perks: string[];
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IssueCategory =
  | 'delivery_delay'
  | 'payment_failure'
  | 'escrow_timer_glitch'
  | 'moonton_id_error'
  | 'ui_glitch'
  | 'unexpected_crash'
  | 'other';

export interface BugReportTicket {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  orderId?: string;
  errorLogs?: string;
  userEmail?: string;
  status: 'Open' | 'Investigating' | 'Resolved';
  createdAt: number;
  aiDiagnostic?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  isDiagnostic?: boolean;
  quickActions?: Array<{ label: string; action: string; payload?: any }>;
  ticketId?: string;
  source?: 'gemini' | 'knowledge_base';
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatarUrl: string;
  role: 'buyer' | 'seller' | 'trader';
  mlbbUserId?: string;
  mlbbZoneId?: string;
  mlbbIgn?: string;
  serverRegion?: string;
  tier: 'VIP Developer' | 'VIP Mythic' | 'Diamond Platinum' | 'Diamond Gold' | 'Diamond Silver';
  isVip?: boolean;
  isDeveloper?: boolean;
  developerPrivileges?: {
    freeDiamondsAll: boolean;
    unlimitedQuota: boolean;
    bypassPayment: boolean;
    adminBadges: string[];
  };
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: number;
  preferredCurrency: Currency;
  preferredPaymentMethod?: PaymentMethod;
  totalOrdersCount: number;
  totalDiamondsPurchased: number;
  walletBalanceUsd: number;
  phone?: string;
  securityBadges: string[];
  authProvider?: 'email' | 'google' | 'facebook';
  // Refer-a-Friend fields
  referralCode?: string;
  referredBy?: string; // Invite code of the user who referred this account
  referralBonusDiamonds?: number; // Total 5% diamond bonus earned
  referralBadge?: boolean; // Has unlocked the official 'Referral Badge'
  referralDiscountPercent?: number; // Small diamond discount percentage (e.g. 5% off diamond top-ups)
  referralSignupsCount?: number;
  // Loyalty Tiers
  loyaltyTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Mythic';
  loyaltyDiscountPercent?: number; // Automatic order discount (e.g. 1%, 3%, 6%, 10%, 15%)
  // 12 PM & 12 AM Free Diamond Drops
  freeDropDiamondsClaimed?: number;
  freeDropsClaimed?: number;
  // VIP Membership Privileges (₱950 upgrade)
  vipPurchasedAt?: number;
  vipExpiry?: number; // Timestamp when VIP membership expires and needs renewal
  vipFreeClaimCount?: number; // Total free claims used (maximum of 2)
  vipLastFreeClaimTimestamp?: number; // Timestamp of last free claim (24-hour wait required between claims)
  vipDiscountPercent?: number; // 50% discount on all diamond purchases
}

export interface SignUpFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  mlbbUserId?: string;
  mlbbZoneId?: string;
  mlbbIgn?: string;
  currency: Currency;
  agreeTerms: boolean;
  role?: 'buyer' | 'seller';
  referralCode?: string; // Optional invite/referral code entered on signup
}

export type ThemeArchetype = 'dark' | 'midnight' | 'amoled' | 'white' | 'mythic_gold' | 'neon_emerald' | 'crimson_void';
export type BackgroundEffect = 'aurora_mesh' | 'cyber_grid' | 'stellar_particles' | 'pulse_vortex' | 'minimal_clean' | 'none';
export type GlowColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue';
export type EffectIntensity = 'subtle' | 'balanced' | 'vibrant';

export interface AppSettings {
  // General & Display
  currency: Currency;
  theme: ThemeArchetype;
  bgEffect: BackgroundEffect;
  bgGlowColor: GlowColor;
  bgEffectIntensity: EffectIntensity;
  bgAnimateEffects: boolean;
  language: 'en' | 'fil' | 'id' | 'ms';
  compactMode: boolean;

  // Audio & Sounds
  soundEnabled: boolean;
  soundVolume: number; // 0 to 100
  playPriceAlertSound: boolean;
  playOrderSuccessSound: boolean;

  // Notifications
  enableToasts: boolean;
  autoDismissToastsSeconds: number; // e.g. 5, 8, 10
  notifyOnPriceDrops: boolean;
  notifyOnEscrowStatusChange: boolean;
  notifyOnChatMessages: boolean;

  // Escrow & Transaction Defaults
  defaultPaymentMethod: PaymentMethod;
  autoFillLinkedMlbbId: boolean;
  require2FAForDisputes: boolean;
  privacyMaskIgn: boolean;
  fastCheckoutOneClick: boolean;
  autoOpenTrackerOnOrder: boolean;
  autoPay24hEnabled?: boolean;
}

export type MissionCategory = 'daily' | 'security' | 'explore' | 'social';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  currentProgress: number;
  targetProgress: number;
  progressUnit?: string;
  rewardType: 'diamonds' | 'discount' | 'combo';
  rewardDiamonds?: number;
  rewardDiscountPct?: number;
  rewardDiscountCode?: string;
  rewardCreditsUsd?: number;
  status: 'in_progress' | 'claimable' | 'completed';
  icon: string;
  actionLabel: string;
  actionType: 'checkin' | 'verify_mlbb' | 'browse_store' | 'view_escrow' | 'visit_p2p' | 'share_squad' | 'calculate_savings' | 'lucky_spin';
  claimedAt?: number;
}

export interface EarnedVoucher {
  id: string;
  code: string;
  discountPct: number;
  description: string;
  earnedAt: number;
  expiresAt: number;
  isUsed: boolean;
  missionId: string;
}

export interface DailyMissionsState {
  missions: DailyMission[];
  streakDays: number;
  lastCheckInDate: string; // YYYY-MM-DD
  totalBonusDiamondsClaimed: number;
  totalCreditsEarnedUsd?: number;
  transferredCreditsUsd?: number;
  vouchers: EarnedVoucher[];
  lastLuckySpinDate?: string;
}
