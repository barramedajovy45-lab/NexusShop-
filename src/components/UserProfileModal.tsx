import React, { useState, useEffect, useMemo } from 'react';
import {
  AppSettings,
  Currency,
  EscrowOrder,
  MlbbAccount,
  PaymentMethod,
  UserAccount,
  DailyMissionsState,
  DailyMission,
  EarnedVoucher,
} from '../types';
import {
  lookupOrGenerateMlbbAccount,
  sanitizeMlbbId,
  canSellDiamonds,
  isDeveloperUser,
  isVipUser,
  isEligibleForFreeEverything,
  getVipFreeClaimStatus,
  VIP_FREE_CLAIM_LIMIT,
  VIP_FREE_DIAMOND_PACKAGES,
  VIP_DIAMOND_DISCOUNT_PERCENT,
  VIP_UPGRADE_PRICE_PHP,
} from '../data/mockData';
import { INITIAL_DAILY_MISSIONS } from '../data/missionsData';
import { formatCurrency, CURRENCY_RATES, getPaymentMethodDetails } from '../utils/formatters';
import {
  playMissionClaimSound,
  playDiamondChimeSound,
  playDiamondDetectedSound,
  playUiClickSound,
} from '../utils/audio';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import { APP_VERSION } from '../utils/version';
import { GoogleIcon, FacebookIcon } from './AuthModal';
import { LoyaltyTiersSection } from './LoyaltyTiersSection';
import { calculateLoyaltyTier, getLoyaltyProgress } from '../utils/loyaltyUtils';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Gem,
  Gamepad2,
  Lock,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  LogOut,
  Edit3,
  Save,
  KeyRound,
  Coins,
  Store,
  ExternalLink,
  ShieldAlert,
  Award,
  Settings,
  Copy,
  Check,
  Crown,
  CreditCard,
  Zap,
  ArrowRight,
  Code2,
  AlertTriangle,
  Wallet,
  Ticket,
  Flame,
  RefreshCw,
  Trophy,
  Gift,
  Share2,
  Percent,
  TrendingUp,
  BarChart3,
  Headphones,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getUserReferralCode, getReferralData, getInviteUrl } from '../utils/referralUtils';

const PAYMENT_SHORTCUT_OPTIONS: {
  id: PaymentMethod;
  name: string;
  badge: string;
  flag: string;
  highlight?: string;
}[] = [
  { id: 'gcash', name: 'GCash (PH)', badge: 'Xendit Official Gateway', flag: '🇵🇭', highlight: 'Fastest in PH' },
  { id: 'maya', name: 'Maya / PayMaya (PH)', badge: 'Xendit QR Ph & Wallet', flag: '🇵🇭', highlight: 'Zero Fee' },
  { id: 'dana', name: 'DANA (Indonesia)', badge: 'Midtrans / Xendit IDR', flag: '🇮🇩', highlight: 'Indonesia #1' },
  { id: 'ovo', name: 'OVO (Indonesia)', badge: 'Midtrans / Xendit IDR', flag: '🇮🇩', highlight: 'Instant IDR' },
  { id: 'gopay', name: 'GoPay (Indonesia)', badge: 'Midtrans Official Gateway', flag: '🇮🇩', highlight: 'Gojek Wallet' },
  { id: 'google_pay', name: 'Google Pay', badge: 'Stripe Digital Wallet', flag: '🌐', highlight: '1-Tap Pay' },
  { id: 'apple_pay', name: 'Apple Pay', badge: 'Stripe Biometric Pay', flag: '🍎', highlight: 'FaceID / TouchID' },
  { id: 'paypal', name: 'PayPal', badge: 'Global Buyer Protection', flag: '🌍', highlight: 'International' },
  { id: 'bank_transfer', name: 'Bank Transfer / Virtual Account', badge: 'Xendit & Midtrans VA', flag: '🏦', highlight: 'Direct VA' },
  { id: 'qris', name: 'Local Country E-Wallets', badge: 'QRIS / TNG / GrabPay / ShopeePay', flag: '🌏', highlight: 'Regional' },
  { id: 'card', name: 'Visa & Mastercard', badge: 'Stripe 3DS Credit/Debit', flag: '💳', highlight: 'Cards' },
];

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  orders?: EscrowOrder[];
  onUpdateUser: (updated: UserAccount) => void;
  onSignOut: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onOpenOrders: () => void;
  onOpenSellerPortal: () => void;
  onOpenSettings?: () => void;
  settings?: AppSettings;
  onSaveSettings?: (s: AppSettings) => void;
  onOpenMissions?: () => void;
  onOpenReferralModal?: () => void;
  onOpenStore?: () => void;
  onOpenVipUpgradeModal?: () => void;
  onAddNotificationToast?: (toast: {
    statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
    title: string;
    message: string;
    diamonds: number;
    amount: number;
  }) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  orders = [],
  onUpdateUser,
  onSignOut,
  currency,
  setCurrency,
  onOpenOrders,
  onOpenSellerPortal,
  onOpenSettings,
  settings,
  onSaveSettings,
  onOpenMissions,
  onOpenReferralModal,
  onOpenStore,
  onOpenVipUpgradeModal,
  onAddNotificationToast,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vip_perks' | 'loyalty' | 'wallet' | 'game' | 'security'>('overview');
  const [walletFilter, setWalletFilter] = useState<'all' | 'diamonds' | 'credits' | 'vouchers'>('all');
  const [copiedVoucherCode, setCopiedVoucherCode] = useState<string | null>(null);
  const [isTransferringCredits, setIsTransferringCredits] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // VIP Quick Claim & Simulated Crediting Animation States
  const [selectedFreePackage, setSelectedFreePackage] = useState<number>(172);
  const [isQuickClaiming, setIsQuickClaiming] = useState<boolean>(false);
  const [quickClaimStage, setQuickClaimStage] = useState<'idle' | 'authorizing' | 'crediting' | 'completed'>('idle');
  const [animatedClaimAmount, setAnimatedClaimAmount] = useState<number>(0);
  const [quickClaimProgress, setQuickClaimProgress] = useState<number>(0);
  const [claimedTransactionInfo, setClaimedTransactionInfo] = useState<{
    amount: number;
    txRef: string;
    moontonAuthRef: string;
    previousDiamonds: number;
    newDiamonds: number;
    claimedAt: number;
    ign: string;
    userId: string;
  } | null>(null);

  // VIP Priority Support Escalated Chat State (Guaranteed 5-Minute Response SLA + Simulated Bot Delay)
  const [isPrioritySupportOpen, setIsPrioritySupportOpen] = useState<boolean>(false);
  const [priorityTicketId, setPriorityTicketId] = useState<string>('VIP-ESC-90481');
  const [prioritySlaSeconds, setPrioritySlaSeconds] = useState<number>(300); // 5 minutes (300s) guaranteed SLA
  const [isPriorityBotTyping, setIsPriorityBotTyping] = useState<boolean>(false);
  const [priorityChatInput, setPriorityChatInput] = useState<string>('');
  const [priorityChatMessages, setPriorityChatMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'arbiter_bot' | 'system';
      senderName: string;
      text: string;
      timestamp: number;
    }>
  >([]);

  // 1-second interval to refresh 24h cooldown countdown and VIP 5-min Priority Support SLA timer in real-time
  const [, setCooldownTicker] = useState<number>(0);
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCooldownTicker((prev) => prev + 1);
      setPrioritySlaSeconds((prev) => (isPrioritySupportOpen && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isPrioritySupportOpen]);

  // VIP & Developer Privileges Status (dynamically recalculates every second)
  const isDev = isDeveloperUser(user);
  const isVip = isVipUser(user);
  const vipClaimStatus = getVipFreeClaimStatus(user);

  // VIP Membership Renewal Countdown Calculation (based on user.vipExpiry)
  const effectiveVipExpiry =
    user.vipExpiry ||
    (isVip
      ? (user.vipPurchasedAt || Date.now() - 6 * 24 * 60 * 60 * 1000) + 30 * 24 * 60 * 60 * 1000
      : undefined);
  const vipRemainingMs = effectiveVipExpiry ? Math.max(0, effectiveVipExpiry - Date.now()) : 0;
  const vipDaysRemaining = Math.floor(vipRemainingMs / (1000 * 60 * 60 * 24));
  const vipHoursRemaining = Math.floor((vipRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const vipMinutesRemaining = Math.floor((vipRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const vipSecondsRemaining = Math.floor((vipRemainingMs % (1000 * 60)) / 1000);
  const vipCyclePercent = Math.min(
    100,
    Math.max(0, Math.round((vipRemainingMs / (30 * 24 * 60 * 60 * 1000)) * 100))
  );
  // True when vipExpiry is less than 3 days away
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
  const isVipExpiringSoon = Boolean((isVip || isDev) && effectiveVipExpiry && vipRemainingMs < THREE_DAYS_MS);

  // Real-time Loyalty Tier Status calculation based on total diamond purchases
  const loyaltyTier = calculateLoyaltyTier(user.totalDiamondsPurchased || 0);
  const loyaltyProgress = getLoyaltyProgress(user.totalDiamondsPurchased || 0);

  // VIP Perks Summary & 6-Month VIP Usage Stats Calculation (Diamond Claims vs. Savings & ROI)
  const [vipChartView, setVipChartView] = useState<'combined' | 'savings' | 'claims'>('combined');
  const vipSavingsAndStats = useMemo(() => {
    const rate = CURRENCY_RATES[currency]?.rate || 1;
    // Standard regular retail value per diamond in USD (~$0.0172 per diamond)
    const retailUsdPerDiamond = 0.0172;
    const totalDiamonds = Math.max(user.totalDiamondsPurchased || 0, 500);
    const completedOrdersList = orders.filter(
      (o) =>
        (o.buyerEmail === user.email || o.buyerId === user.id || o.buyerId === 'user_current') &&
        o.status !== 'cancelled' &&
        o.status !== 'refunded'
    );

    const orderDiamondsSum = completedOrdersList.reduce((acc, o) => acc + (o.diamonds || 0), 0);
    const effectiveDiamondsVolume = Math.max(totalDiamonds, orderDiamondsSum);
    const baseRetailSpendUsd = effectiveDiamondsVolume * retailUsdPerDiamond;

    const loyaltyPct = loyaltyTier.discountPercent || 10;
    const vipPct = isDev ? 100 : isVip ? VIP_DIAMOND_DISCOUNT_PERCENT : 50;

    // Calculate Loyalty Discount Savings & VIP 50% Discount Savings in USD
    const loyaltySavedUsd = Number((baseRetailSpendUsd * (loyaltyPct / 100)).toFixed(2));
    const vipDiscountSavedUsd = Number((baseRetailSpendUsd * (vipPct / 100)).toFixed(2));

    // Free diamond claims value (each 172 diamond claim = $2.96 USD / ₱170 PHP value)
    const freeClaimsCount = Math.max(user.vipFreeClaimCount || 0, 1);
    const freeDropsCount = user.freeDropsClaimed || 2;
    const totalFreeDiamondsClaimed =
      freeClaimsCount * 172 + (user.freeDropDiamondsClaimed || freeDropsCount * 35);
    const freeClaimsValueUsd = Number((totalFreeDiamondsClaimed * retailUsdPerDiamond).toFixed(2));

    const totalSavedUsd = Number(
      (loyaltySavedUsd + vipDiscountSavedUsd + freeClaimsValueUsd).toFixed(2)
    );

    // VIP Upgrade Cost in USD (₱950 PHP ≈ $16.24 USD)
    const vipCostUsd = 950 / 58.5;
    const roiMultiple = Number(Math.max(1.2, totalSavedUsd / vipCostUsd).toFixed(1));
    const roiPercent = Math.round(((totalSavedUsd - vipCostUsd) / vipCostUsd) * 100);

    // Generate 6-Month Historical Data for Recharts (Last 6 Months ending current month)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyWeights = [0.11, 0.14, 0.16, 0.18, 0.19, 0.22];
    const monthlyClaimsBase = [172, 258, 344, 344, 430, Math.max(344, totalFreeDiamondsClaimed)];

    const sixMonthSeries = monthlyWeights.map((weight, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const label = `${monthNames[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
      const monthVipSavedUsd = Number((vipDiscountSavedUsd * weight).toFixed(2));
      const monthLoyaltySavedUsd = Number((loyaltySavedUsd * weight).toFixed(2));
      const monthFreeValueUsd = Number((freeClaimsValueUsd * weight).toFixed(2));
      const monthTotalSavedUsd = Number(
        (monthVipSavedUsd + monthLoyaltySavedUsd + monthFreeValueUsd).toFixed(2)
      );
      const monthSavedDisplay = Number((monthTotalSavedUsd * rate).toFixed(2));
      const monthVipSavedDisplay = Number((monthVipSavedUsd * rate).toFixed(2));
      const monthLoyaltySavedDisplay = Number((monthLoyaltySavedUsd * rate).toFixed(2));
      const diamondsClaimed = monthlyClaimsBase[idx];

      return {
        month: label,
        diamondsClaimed,
        totalSavedDisplay: monthSavedDisplay,
        vipSavedDisplay: monthVipSavedDisplay,
        loyaltySavedDisplay: monthLoyaltySavedDisplay,
        totalSavedUsd: monthTotalSavedUsd,
        ordersCount: Math.max(1, Math.round((user.totalOrdersCount || 12) * weight)),
      };
    });

    return {
      loyaltySavedUsd,
      vipDiscountSavedUsd,
      freeClaimsValueUsd,
      totalSavedUsd,
      totalFreeDiamondsClaimed,
      roiMultiple,
      roiPercent,
      vipCostUsd,
      sixMonthSeries,
      ordersAnalyzed: Math.max(user.totalOrdersCount || 0, completedOrdersList.length, 6),
    };
  }, [user, orders, currency, loyaltyTier.discountPercent, isVip, isDev]);

  // Load and sync DailyMissionsState for the virtual Nexus Shop Wallet
  const [missionsData, setMissionsData] = useState<DailyMissionsState>(() => {
    try {
      const saved = localStorage.getItem('nexus_daily_missions_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.missions)) {
          return parsed;
        }
      }
    } catch {}
    return {
      missions: INITIAL_DAILY_MISSIONS,
      streakDays: 3,
      lastCheckInDate: '',
      totalBonusDiamondsClaimed: 45,
      totalCreditsEarnedUsd: 2.50,
      transferredCreditsUsd: 0,
      vouchers: [
        {
          id: 'starter-voucher-5',
          code: 'WELCOME5',
          discountPct: 5,
          description: '5% Welcome Explorer Discount on all Diamond Packs',
          earnedAt: Date.now() - 86400000,
          expiresAt: Date.now() + 86400000 * 7,
          isUsed: false,
          missionId: 'starter',
        },
      ],
    };
  });

  // Sync missions data whenever it updates across tabs or windows
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('nexus_daily_missions_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.missions)) {
            setMissionsData(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener('nexus_missions_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('nexus_missions_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const userReferralCode = getUserReferralCode(user);
  const inviteUrl = getInviteUrl(userReferralCode);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(false);
  const [referralData, setReferralData] = useState(() => getReferralData(user));

  const handleCopyInviteUrl = () => {
    try {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedInviteUrl(true);
      setTimeout(() => setCopiedInviteUrl(false), 2000);
    } catch {
      setCopiedInviteUrl(true);
      setTimeout(() => setCopiedInviteUrl(false), 2000);
    }
  };

  useEffect(() => {
    const handleSyncRef = () => {
      setReferralData(getReferralData(user));
    };
    window.addEventListener('nexus_referrals_updated', handleSyncRef);
    window.addEventListener('storage', handleSyncRef);
    return () => {
      window.removeEventListener('nexus_referrals_updated', handleSyncRef);
      window.removeEventListener('storage', handleSyncRef);
    };
  }, [user]);

  // Derived wallet metrics
  const referralBonusDiamonds = referralData.bonusDiamondsEarned || (user.referralBonusDiamonds || 0);
  const totalBonusDiamonds = (missionsData.totalBonusDiamondsClaimed || 0) + referralBonusDiamonds;
  const completedMissions = missionsData.missions?.filter((m) => m.status === 'completed') || [];
  const totalCreditsEarnedUsd = Number(
    (
      missionsData.totalCreditsEarnedUsd ??
      (2.50 +
        completedMissions.reduce(
          (sum, m) => sum + (m.rewardCreditsUsd || (m.rewardDiamonds ? m.rewardDiamonds * 0.025 : 0.50)),
          0
        ))
    ).toFixed(2)
  );
  const transferredCreditsUsd = missionsData.transferredCreditsUsd || 0;
  const availableMissionCreditsUsd = Math.max(0, Number((totalCreditsEarnedUsd - transferredCreditsUsd).toFixed(2)));
  const streakDays = missionsData.streakDays || 3;
  const earnedVouchers = missionsData.vouchers || [];

  // Transfer mission credits to main escrow wallet balance
  const handleTransferCreditsToEscrow = () => {
    if (availableMissionCreditsUsd <= 0 || isTransferringCredits) return;
    setIsTransferringCredits(true);

    setTimeout(() => {
      const newTransferred = totalCreditsEarnedUsd;
      const updatedMissionsData: DailyMissionsState = {
        ...missionsData,
        transferredCreditsUsd: newTransferred,
      };

      try {
        localStorage.setItem('nexus_daily_missions_data', JSON.stringify(updatedMissionsData));
        window.dispatchEvent(new CustomEvent('nexus_missions_updated', { detail: updatedMissionsData }));
      } catch {}

      setMissionsData(updatedMissionsData);

      // Add to user's wallet balance
      const updatedUser: UserAccount = {
        ...user,
        walletBalanceUsd: Number((user.walletBalanceUsd + availableMissionCreditsUsd).toFixed(2)),
      };
      onUpdateUser(updatedUser);

      playMissionClaimSound();
      setFeedbackNotice(
        `🎉 Transferred ${formatCurrency(availableMissionCreditsUsd, currency)} Mission Credits directly to your Escrow Checkout Balance!`
      );
      setIsTransferringCredits(false);
      setTimeout(() => setFeedbackNotice(''), 5000);
    }, 500);
  };

  const handleCopyVoucher = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedVoucherCode(code);
      setTimeout(() => setCopiedVoucherCode(null), 2000);
    } catch {
      setCopiedVoucherCode(code);
      setTimeout(() => setCopiedVoucherCode(null), 2000);
    }
  };

  // Editable fields
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '+63 917 849 2091');
  const [preferredCurr, setPreferredCurr] = useState<Currency>(user.preferredCurrency || currency);
  const [preferredPayment, setPreferredPayment] = useState<PaymentMethod>(
    user.preferredPaymentMethod || settings?.defaultPaymentMethod || 'gcash'
  );

  // Keep state synced with user updates
  useEffect(() => {
    if (user.preferredPaymentMethod) {
      setPreferredPayment(user.preferredPaymentMethod);
    }
  }, [user.preferredPaymentMethod]);

  const handleQuickSetPaymentMethod = (method: PaymentMethod) => {
    setPreferredPayment(method);
    const updated: UserAccount = {
      ...user,
      preferredPaymentMethod: method,
    };
    onUpdateUser(updated);
    if (onSaveSettings && settings) {
      onSaveSettings({
        ...settings,
        defaultPaymentMethod: method,
      });
    }
    const details = getPaymentMethodDetails(method);
    setFeedbackNotice(`⚡ Preferred payment set to ${details.name}! Checkout modal will now automatically pre-fill with ${details.name}.`);
    setTimeout(() => setFeedbackNotice(''), 4000);
  };
  
  // Game ID fields
  const [editUserId, setEditUserId] = useState(user.mlbbUserId || '84729103');
  const [editZoneId, setEditZoneId] = useState(user.mlbbZoneId || '3092');
  const [gameIgn, setGameIgn] = useState(user.mlbbIgn || '꧁༺VΞNØM_99༻꧂');
  const [isVerifyingGame, setIsVerifyingGame] = useState(false);
  const [copiedGameId, setCopiedGameId] = useState<'all' | 'user' | 'zone' | null>(null);

  const handleCopyGameAccount = (type: 'all' | 'user' | 'zone' = 'all') => {
    let str = '';
    if (type === 'user') str = editUserId;
    else if (type === 'zone') str = editZoneId;
    else str = editZoneId ? `${editUserId} (${editZoneId})` : editUserId;

    if (!str) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str).catch(() => {});
    }
    setCopiedGameId(type);
    setTimeout(() => setCopiedGameId(null), 2000);
  };

  // Security toggles
  const [twoFaActive, setTwoFaActive] = useState(user.twoFactorEnabled);
  const [feedbackNotice, setFeedbackNotice] = useState('');

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    const updated: UserAccount = {
      ...user,
      name: name.trim() || user.name,
      phone: phone.trim(),
      preferredCurrency: preferredCurr,
      preferredPaymentMethod: preferredPayment,
      mlbbUserId: sanitizeMlbbId(editUserId),
      mlbbZoneId: sanitizeMlbbId(editZoneId),
      mlbbIgn: gameIgn,
      twoFactorEnabled: twoFaActive,
    };
    onUpdateUser(updated);
    setCurrency(preferredCurr);
    if (onSaveSettings && settings) {
      onSaveSettings({
        ...settings,
        defaultPaymentMethod: preferredPayment,
        currency: preferredCurr,
      });
    }
    setIsEditing(false);
    setFeedbackNotice('Profile and payment preferences updated successfully!');
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  const handleVerifyGameAccount = () => {
    const cleanUser = sanitizeMlbbId(editUserId);
    const cleanZone = sanitizeMlbbId(editZoneId);
    if (!cleanUser || !cleanZone) return;

    setIsVerifyingGame(true);
    setTimeout(() => {
      try {
        const acc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);
        setGameIgn(acc.ign);
        setFeedbackNotice(`Verified Moonton Account: ${acc.ign}`);
      } catch {
        setFeedbackNotice('Could not verify with Moonton servers.');
      } finally {
        setIsVerifyingGame(false);
        setTimeout(() => setFeedbackNotice(''), 4000);
      }
    }, 450);
  };

  // Quick Claim Handler with simulated animation of diamonds being credited
  const handleQuickClaim = (amount: number = selectedFreePackage) => {
    if (isQuickClaiming) return;
    const currentStatus = getVipFreeClaimStatus(user);
    if (!currentStatus.canClaimNow) return;

    playUiClickSound();
    setIsQuickClaiming(true);
    setQuickClaimStage('authorizing');
    setAnimatedClaimAmount(0);
    setQuickClaimProgress(20);

    const prevDiamonds = user.totalDiamondsPurchased || 0;
    const newDiamonds = prevDiamonds + amount;
    const txRef = `VIP-FREE-GRANT-${Date.now().toString(36).toUpperCase()}`;
    const moontonAuthRef = `MOON-DISTRIB-${Math.floor(100000 + Math.random() * 900000)}`;
    const ign = user.mlbbIgn || '꧁༺VΞNØM_99༻꧂';
    const userId = user.mlbbUserId || '184920491';

    // Step 1: Handshake with Moonton MLBB Gateway (0ms - 800ms)
    setTimeout(() => {
      setQuickClaimStage('crediting');
      setQuickClaimProgress(65);
      playMissionClaimSound();

      // Diamond count roll-up animation
      const steps = 14;
      const stepIncrement = Math.ceil(amount / steps);
      let rollingAmount = 0;
      const rollTimer = setInterval(() => {
        rollingAmount += stepIncrement;
        if (rollingAmount >= amount) {
          rollingAmount = amount;
          clearInterval(rollTimer);
          playDiamondChimeSound();
        }
        setAnimatedClaimAmount(rollingAmount);
      }, 50);

      // Step 2: Finalizing Ingestion & Verification (1600ms)
      setTimeout(() => {
        setQuickClaimStage('completed');
        setQuickClaimProgress(100);
        setAnimatedClaimAmount(amount);
        triggerOrderCompletedConfetti({ force: true });
        playDiamondDetectedSound();

        const txData = {
          amount,
          txRef,
          moontonAuthRef,
          previousDiamonds: prevDiamonds,
          newDiamonds,
          claimedAt: Date.now(),
          ign,
          userId,
        };
        setClaimedTransactionInfo(txData);

        // Update user state and storage
        const updatedUser: UserAccount = {
          ...user,
          vipFreeClaimCount: (user.vipFreeClaimCount || 0) + 1,
          vipLastFreeClaimTimestamp: Date.now(),
          totalDiamondsPurchased: newDiamonds,
          totalOrdersCount: (user.totalOrdersCount || 0) + 1,
        };

        try {
          localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
        } catch {}
        onUpdateUser(updatedUser);

        // Record order in nexus_orders
        try {
          const rawOrders = localStorage.getItem('nexus_orders');
          const ordersList = rawOrders ? JSON.parse(rawOrders) : [];
          const freeVipOrder: any = {
            id: 'vip_claim_' + Date.now(),
            buyerId: user.id,
            buyerName: user.name,
            buyerEmail: user.email,
            sellerId: 'nexus_vip_treasury',
            sellerName: 'Nexus Shop Official VIP Treasury Desk',
            sellerAvatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
            sellerRating: 5.0,
            packageId: `vip-free-${amount}`,
            packageName: `VIP Daily Privilege: ${amount} Free Diamonds`,
            diamonds: amount,
            bonusDiamonds: 0,
            mlbbUserId: userId,
            mlbbZoneId: user.mlbbZoneId || '2941',
            mlbbIgn: ign,
            mlbbServer: user.serverRegion || 'Philippines (PH-5)',
            currency: currency,
            amount: 0,
            amountPhp: 0,
            escrowFee: 0,
            paymentMethod: 'wallet',
            paymentReference: txRef,
            status: 'completed',
            createdAt: Date.now(),
            completedAt: Date.now(),
            diamondsReceivedVerified: true,
            autoDetectedAt: Date.now(),
            fulfillmentType: 'official_mlbb_manual',
            chatMessages: [
              {
                id: 'msg-vip-claimed',
                sender: 'system',
                senderName: 'Nexus Shop Escrow Automated System',
                text: `👑 Active VIP Privilege: +${amount} Free Diamonds deposited into character ${ign} (UID: ${userId}). Authorized by Moonton API (Ref: ${moontonAuthRef}). 24-hour cooldown initiated.`,
                timestamp: Date.now(),
              },
            ],
          };
          localStorage.setItem('nexus_orders', JSON.stringify([freeVipOrder, ...ordersList]));
        } catch {}

        if (onAddNotificationToast) {
          onAddNotificationToast({
            statusType: 'completed',
            title: `👑 VIP Perk Claimed: +${amount} Free Diamonds!`,
            message: `Successfully credited +${amount} diamonds to ${ign} (${userId}). 24-hour cooldown is now active.`,
            diamonds: amount,
            amount: 0,
          });
        }

        setFeedbackNotice(`👑 +${amount} VIP Free Diamonds credited to ${ign} (UID: ${userId})! 24h cooldown active.`);
        setTimeout(() => setFeedbackNotice(''), 7000);
      }, 1600);
    }, 800);
  };

  const handleResetVipCooldown = () => {
    playUiClickSound();
    const updatedUser: UserAccount = {
      ...user,
      vipLastFreeClaimTimestamp: 0,
    };
    try {
      localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
    } catch {}
    onUpdateUser(updatedUser);
    setIsQuickClaiming(false);
    setQuickClaimStage('idle');
    setClaimedTransactionInfo(null);
    setFeedbackNotice('⚡ VIP 24h Cooldown reset for testing. You can Quick Claim again!');
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  const handleResetVipClaims = () => {
    playUiClickSound();
    const updatedUser: UserAccount = {
      ...user,
      vipFreeClaimCount: 0,
      vipLastFreeClaimTimestamp: 0,
    };
    try {
      localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
    } catch {}
    onUpdateUser(updatedUser);
    setIsQuickClaiming(false);
    setQuickClaimStage('idle');
    setClaimedTransactionInfo(null);
    setFeedbackNotice('⚡ VIP Free Claims quota reset (0/2 used). Quick Claim is ready!');
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  const handleExtendVipMembership = () => {
    playUiClickSound();
    playDiamondChimeSound();
    const now = Date.now();
    const currentExp = effectiveVipExpiry && effectiveVipExpiry > now ? effectiveVipExpiry : now;
    const nextExp = currentExp + 30 * 24 * 60 * 60 * 1000;
    const updatedUser: UserAccount = {
      ...user,
      isVip: true,
      vipPurchasedAt: now,
      vipExpiry: nextExp,
    };
    try {
      localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
    } catch {}
    onUpdateUser(updatedUser);
    triggerOrderCompletedConfetti({ force: true });
    if (onAddNotificationToast) {
      onAddNotificationToast({
        statusType: 'completed',
        title: '👑 VIP Membership Renewed (+30 Days)',
        message: `Your VIP membership has been extended! Next renewal date: ${new Date(nextExp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}.`,
        diamonds: 0,
        amount: 0,
      });
    }
    setFeedbackNotice(
      `👑 VIP Membership Extended by +30 Days! New renewal date: ${new Date(nextExp).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}.`
    );
    setTimeout(() => setFeedbackNotice(''), 5000);
  };

  const handleSimulateExpiringSoon = () => {
    playUiClickSound();
    // Set vipExpiry to 2 days and 6 hours from now (< 3 days away)
    const simulatedExp = Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000;
    const updatedUser: UserAccount = {
      ...user,
      isVip: true,
      vipExpiry: simulatedExp,
    };
    try {
      localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
    } catch {}
    onUpdateUser(updatedUser);
    setFeedbackNotice('⚠️ Simulated < 3 Days VIP Expiry (2d 06h remaining). "Renew Now" alert triggered!');
    setTimeout(() => setFeedbackNotice(''), 4000);
  };

  // Initiate VIP Priority Support escalated chat with guaranteed 5-minute response SLA & simulated bot delay
  const handleInitiatePrioritySupport = () => {
    playUiClickSound();
    const ticketRef = `VIP-ESC-${Math.floor(10000 + Math.random() * 90000)}`;
    setPriorityTicketId(ticketRef);
    setPrioritySlaSeconds(300); // Guaranteed 5-minute (300s) response window
    setIsPrioritySupportOpen(true);

    const ign = user.mlbbIgn || '꧁༺VΞNØM_99༻꧂';
    const uid = user.mlbbUserId || '84729103';

    setPriorityChatMessages([
      {
        id: `sys-${Date.now()}`,
        sender: 'system',
        senderName: 'Aegis VIP Escalation Protocol',
        text: `⚡ Escalated VIP Ticket #${ticketRef} opened for ${user.name} (${user.tier}). Guaranteed 5-minute response SLA timer initiated.`,
        timestamp: Date.now(),
      },
    ]);

    // Simulated bot delay (1.6s) to connect Senior VIP Escrow Arbiter
    setIsPriorityBotTyping(true);
    setTimeout(() => {
      setIsPriorityBotTyping(false);
      playDiamondChimeSound();
      setPriorityChatMessages((prev) => [
        ...prev,
        {
          id: `bot-welcome-${Date.now()}`,
          sender: 'arbiter_bot',
          senderName: 'Senior VIP Arbiter · Marcus V.',
          text: `Greetings ${user.name}! Your VIP Mythic escalation (#${ticketRef}) bypassed the standard queue. I have your linked MLBB account ${ign} (UID: ${uid}) and escrow ledger pulled up with a guaranteed <5-minute resolution SLA. How can I assist you right now?`,
          timestamp: Date.now(),
        },
      ]);
    }, 1600);
  };

  const handleSendPrioritySupportMessage = (customText?: string) => {
    const textToSend = (customText ?? priorityChatInput).trim();
    if (!textToSend || isPriorityBotTyping) return;

    playUiClickSound();
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user' as const,
      senderName: user.name,
      text: textToSend,
      timestamp: Date.now(),
    };

    setPriorityChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setPriorityChatInput('');
    setIsPriorityBotTyping(true);

    // Simulated bot delay (1.4s) for escalated priority response
    setTimeout(() => {
      setIsPriorityBotTyping(false);
      playDiamondChimeSound();

      const lower = textToSend.toLowerCase();
      let replyText = `Understood! Under your VIP Priority SLA (#${priorityTicketId}), I have flagged your account (${user.email}) for immediate senior escrow execution. Your 50% storewide discount and daily diamond claims are verified active.`;

      if (lower.includes('order') || lower.includes('diamond') || lower.includes('delivery')) {
        replyText = `I have pinged the Moonton SEA cluster for character ${user.mlbbIgn || '꧁༺VΞNØM_99༻꧂'} (UID: ${user.mlbbUserId || '84729103'}). Priority VIP dispatch is verified and any pending diamond payload is expedited to complete within 60 seconds.`;
      } else if (lower.includes('discount') || lower.includes('50%') || lower.includes('vip') || lower.includes('renew')) {
        replyText = `Your VIP Mythic 50% storewide discount and daily 172 💎 free claim privileges are locked in and protected under Escrow Guarantee #${priorityTicketId}.`;
      } else if (lower.includes('refund') || lower.includes('dispute') || lower.includes('escrow')) {
        replyText = `As a VIP member, your escrow vault has instant arbiter override. I have placed a priority protection lock on your recent transactions—zero waiting period required.`;
      }

      setPriorityChatMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'arbiter_bot',
          senderName: 'Senior VIP Arbiter · Marcus V.',
          text: replyText,
          timestamp: Date.now(),
        },
      ]);
    }, 1400);
  };

  const renderActiveVipPerksCard = (isFullTab: boolean) => {
    const cardId = isFullTab ? 'vip-perks-tab-card' : 'user-profile-active-vip-perks-section';
    const quickClaimBtnId = isFullTab ? 'vip-quick-claim-btn-tab' : 'vip-quick-claim-btn';

    return (
      <div id={cardId} className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#141b2e] via-slate-900 to-[#0b101d] border-2 border-amber-400/80 shadow-2xl shadow-amber-950/50 relative overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-white tracking-tight">Active VIP Perks</h4>
                {isDev ? (
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/50">
                    👑 LEAD DEVELOPER UNLIMITED
                  </span>
                ) : isVip ? (
                  <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black shadow-sm">
                    👑 VIP MYTHIC ACTIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    STANDARD BUYER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isDev
                  ? 'Lead Developer Exemption: 100% Free Diamonds on all packages.'
                  : isVip
                  ? 'Active VIP Privileges: 50% discount on all diamond purchases, daily free diamonds, and seller clearance.'
                  : 'Beginners can upgrade to VIP for ₱950 to unlock 50% discount, free diamonds, and seller clearance.'}
              </p>
            </div>
          </div>

          {!isVip && !isDev && onOpenVipUpgradeModal && (
            <button
              type="button"
              id={isFullTab ? 'vip-tab-upgrade-btn' : 'profile-upgrade-vip-btn'}
              onClick={() => {
                onClose();
                onOpenVipUpgradeModal();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Upgrade to VIP (₱950)</span>
            </button>
          )}

          {/* Subtle 'Renew Now' Alert Button in Section Header when vipExpiry < 3 days away */}
          {isVipExpiringSoon && (
            <button
              type="button"
              id={isFullTab ? 'vip-header-renew-now-btn-tab' : 'vip-header-renew-now-btn'}
              onClick={handleExtendVipMembership}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/70 shadow-md shadow-amber-500/15 flex items-center gap-1.5 cursor-pointer transition-all shrink-0 animate-pulse"
              title="Less than 3 days left on your VIP membership — click to extend +30 days immediately"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Renew Now (+30d)</span>
            </button>
          )}
        </div>

        {/* VIP Membership Renewal Countdown Timer (Displayed when user is VIP) */}
        {(isVip || isDev) && effectiveVipExpiry && (
          <div
            id={isFullTab ? 'vip-expiry-countdown-banner-tab' : 'vip-expiry-countdown-banner'}
            className={`p-3.5 rounded-xl border relative z-10 space-y-2.5 transition-all ${
              isVipExpiringSoon
                ? 'bg-gradient-to-r from-amber-950/70 via-rose-950/40 to-amber-950/60 border-amber-400/80 shadow-lg shadow-amber-950/40'
                : 'bg-gradient-to-r from-amber-950/50 via-slate-950/90 to-amber-950/40 border-amber-500/50'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                    isVipExpiringSoon
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                      : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  }`}
                >
                  {isVipExpiringSoon ? (
                    <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white">VIP Membership Renewal Countdown</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isDev
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                          : isVipExpiringSoon
                          ? 'bg-rose-500/25 text-amber-200 border-amber-400/70 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      }`}
                    >
                      {isDev
                        ? 'LIFETIME DEV PASS'
                        : isVipExpiringSoon
                        ? `⚠️ EXPIRING SOON · ${vipDaysRemaining}d ${vipHoursRemaining}h LEFT`
                        : `${vipDaysRemaining} Days Remaining`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {isDev ? (
                      'Developer Root Clearance never expires.'
                    ) : vipRemainingMs > 0 ? (
                      <>
                        <strong className="text-amber-300">{vipDaysRemaining} days</strong> remaining until your VIP membership needs renewal (Renews on{' '}
                        <span className="text-white font-mono">
                          {new Date(effectiveVipExpiry).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        )
                      </>
                    ) : (
                      <span className="text-rose-300 font-semibold">VIP Membership cycle has expired — renew now to restore perks!</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Digital Live Countdown Timer Units */}
              {!isDev && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-center min-w-[44px]">
                    <span className="text-xs sm:text-sm font-black font-mono text-amber-300 block leading-none">
                      {vipDaysRemaining}d
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">Days</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">:</span>
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-center min-w-[40px]">
                    <span className="text-xs sm:text-sm font-black font-mono text-amber-200 block leading-none">
                      {String(vipHoursRemaining).padStart(2, '0')}h
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">Hrs</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">:</span>
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-center min-w-[40px]">
                    <span className="text-xs sm:text-sm font-black font-mono text-amber-200 block leading-none">
                      {String(vipMinutesRemaining).padStart(2, '0')}m
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">Min</span>
                  </div>
                  <span className="text-amber-400 font-bold text-xs">:</span>
                  <div className="px-2 py-1 rounded-lg bg-slate-900/90 border border-amber-500/40 text-center min-w-[40px]">
                    <span className="text-xs sm:text-sm font-black font-mono text-cyan-300 block leading-none">
                      {String(vipSecondsRemaining).padStart(2, '0')}s
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">Sec</span>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle 'Renew Now' Alert Banner when vipExpiry is less than 3 days away */}
            {isVipExpiringSoon && (
              <div
                id={isFullTab ? 'vip-renew-now-alert-box-tab' : 'vip-renew-now-alert-box'}
                className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <span>
                    Your VIP membership expires in less than 3 days (<strong>{vipDaysRemaining}d {vipHoursRemaining}h</strong> left). Extend now to keep your 50% discount & daily free diamond claims uninterrupted!
                  </span>
                </div>
                <button
                  type="button"
                  id={isFullTab ? 'vip-renew-now-btn-tab' : 'vip-renew-now-btn'}
                  onClick={handleExtendVipMembership}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-amber-500/25 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                  <span>Renew Now</span>
                </button>
              </div>
            )}

            {/* Renewal Cycle Progress Bar & Quick Extend Action */}
            {!isDev && (
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isVipExpiringSoon
                        ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-300'
                        : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400'
                    }`}
                    style={{ width: `${vipCyclePercent}%` }}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <span>{vipCyclePercent}% of 30-day VIP cycle remaining</span>
                  <div className="flex items-center gap-3">
                    {!isVipExpiringSoon && (
                      <button
                        type="button"
                        onClick={handleSimulateExpiringSoon}
                        className="text-slate-400 hover:text-amber-300 underline cursor-pointer"
                        title="Simulate < 3 days remaining to test the Renew Now alert button"
                      >
                        Demo: Simulate &lt;3d Expiry
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExtendVipMembership}
                      className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>{isVipExpiringSoon ? 'Renew Now (+30 Days)' : 'Extend +30 Days'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simulated Diamond Crediting Animation Overlay / Panel */}
        {isQuickClaiming && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-950 via-[#0a1120] to-[#040812] border-2 border-emerald-400/80 shadow-2xl shadow-emerald-950/70 relative overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Ambient & floating diamond particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-10 left-1/4 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -bottom-10 right-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-pulse delay-150" />
              <span className="absolute left-[12%] bottom-3 text-2xl animate-bounce duration-1000 opacity-80">💎</span>
              <span className="absolute left-[32%] bottom-7 text-lg animate-bounce duration-700 delay-100 opacity-90">✨</span>
              <span className="absolute right-[28%] bottom-4 text-3xl animate-bounce duration-1200 delay-200 opacity-80">💎</span>
              <span className="absolute right-[12%] bottom-2 text-xl animate-bounce duration-900 delay-300 opacity-70">💎</span>
            </div>

            {/* Crediting Animation Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/30">
                  <Zap className="w-5 h-5 text-slate-950 fill-slate-950" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-white flex items-center gap-2">
                    <span>VIP Quick Claim Dispatch</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 uppercase">
                      {quickClaimStage === 'authorizing'
                        ? 'Connecting...'
                        : quickClaimStage === 'crediting'
                        ? 'Crediting Diamonds...'
                        : '100% Credited'}
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-300">
                    Target MLBB Character: <strong className="text-white">{user.mlbbIgn || 'Mobile Legends Player'}</strong> (UID: {user.mlbbUserId || '184920491'})
                  </p>
                </div>
              </div>

              {quickClaimStage === 'completed' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickClaiming(false);
                    setQuickClaimStage('idle');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>

            {/* Rolling Counter & Crediting Animation */}
            <div className="py-4 text-center relative z-10 space-y-2">
              <div className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                {quickClaimStage === 'authorizing'
                  ? 'Initiating Moonton Direct Ingestion'
                  : quickClaimStage === 'crediting'
                  ? 'Simulating Real-Time Diamond Ingestion...'
                  : 'Moonton Game Server Verified Delivery!'}
              </div>

              <div className="flex items-center justify-center gap-3">
                <Gem className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 drop-shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  +{quickClaimStage === 'authorizing' ? 0 : animatedClaimAmount} 💎
                </span>
                <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
              </div>

              <div className="text-xs text-slate-300 max-w-md mx-auto">
                {quickClaimStage === 'authorizing' && (
                  <span className="text-amber-300">Authenticating MLBB User ID with Moonton official distributor gateway...</span>
                )}
                {quickClaimStage === 'crediting' && (
                  <span className="text-cyan-300 animate-pulse">Streaming diamond payload directly to in-game account. Escrow guarantee active...</span>
                )}
                {quickClaimStage === 'completed' && (
                  <span className="text-emerald-300 font-semibold">
                    +{claimedTransactionInfo?.amount || selectedFreePackage} Diamonds credited to account! 24-hour cooldown initiated.
                  </span>
                )}
              </div>

              {/* Progress Indicator */}
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 max-w-md mx-auto mt-2">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-teal-300 transition-all duration-300"
                  style={{ width: `${quickClaimProgress}%` }}
                />
              </div>
            </div>

            {/* Post-Completion Details & Updated Balance */}
            {quickClaimStage === 'completed' && claimedTransactionInfo && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 relative z-10 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Previous Total Diamonds</span>
                    <span className="text-slate-200 font-bold">{claimedTransactionInfo.previousDiamonds.toLocaleString()} 💎</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50">
                    <span className="text-emerald-400 block text-[10px]">New Verified Diamonds</span>
                    <span className="text-emerald-300 font-black flex items-center gap-1">
                      <span>{claimedTransactionInfo.newDiamonds.toLocaleString()} 💎</span>
                      <span className="text-[10px] text-emerald-400">(+{claimedTransactionInfo.amount})</span>
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Escrow Grant Ref:</span>
                    <span className="text-cyan-300 font-bold">{claimedTransactionInfo.txRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Moonton Auth Ref:</span>
                    <span className="text-emerald-300 font-bold">{claimedTransactionInfo.moontonAuthRef}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Next Free Claim Cooldown:</span>
                    <span className="text-amber-300 font-bold">24h Wait Active</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickClaiming(false);
                      setQuickClaimStage('idle');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Done & Return to VIP Perks</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetVipCooldown}
                    className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    title="Reset the 24h timer to test Quick Claim again"
                  >
                    Demo: Reset 24h Cooldown
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2 Primary Core Perks Highlight Grid: 50% Discount & Daily Free Diamond Claims */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
          {/* Perk 1: 50% Storewide Diamond Discount */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/40 relative flex flex-col justify-between group hover:border-cyan-400 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">50% Storewide Diamond Discount</h5>
                    <span className="text-[10px] text-cyan-300 font-mono">Permanent Active Privilege</span>
                  </div>
                </div>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm animate-pulse">
                  {isVip || isDev ? '50% OFF ACTIVE' : '50% OFF (VIP)'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Whenever you purchase diamond packages in the Top-Up Store or Bulk Cart, your VIP status automatically cuts the base escrow price in half (<strong className="text-cyan-300">50% discount</strong>).
              </p>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-[11px] font-mono text-cyan-200 flex items-center justify-between">
                <span>Whale Tier (5,532 💎):</span>
                <span className="font-bold text-emerald-400">
                  {isVip || isDev ? '50% Discount Applied Automatically' : 'Save 50% with VIP Upgrade'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isVip || isDev ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>Status: {isVip || isDev ? 'Active Storewide' : 'Locked'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenStore) onOpenStore();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1 text-xs"
              >
                <span>Top-Up Store</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Perk 2: Daily Free Diamond Claim Availability */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 relative flex flex-col justify-between group hover:border-amber-400 transition-all">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white">Daily Free Diamonds (172 💎)</h5>
                    <span className="text-[10px] text-amber-300 font-mono">Limit 2 Claims · 24h Cooldown</span>
                  </div>
                </div>
                <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-sm">
                  {isDev ? 'UNLIMITED 💎' : `${vipClaimStatus.claimsUsed} / ${VIP_FREE_CLAIM_LIMIT} USED`}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Free diamonds are strictly restricted to the <strong className="text-amber-300">172 💎</strong> package. VIP members receive a <strong className="text-amber-300">limit of 2 free claims</strong> total, with a required <strong className="text-amber-300">1 day wait (24h cooldown)</strong> between claims.
              </p>

              {/* Quick Claim Package Selection */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-medium">Free Package to Claim:</span>
                  <span className="text-[10px] text-amber-300 font-mono font-bold">100% FREE (₱0.00)</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playUiClickSound();
                      setSelectedFreePackage(172);
                    }}
                    className="p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all cursor-pointer bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm ring-1 ring-amber-400/50"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>172 Diamonds (VIP Membership Grant)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">EXCLUSIVE FREE</span>
                    </span>
                    <span className="text-[10px] uppercase text-emerald-400 font-black">₱0.00</span>
                  </button>
                </div>
              </div>

              {/* Claim Status Indicator Box */}
              <div className={`p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between ${
                vipClaimStatus.canClaimNow
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-sm'
                  : vipClaimStatus.cooldownRemainingMs > 0
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                  : vipClaimStatus.claimsUsed >= VIP_FREE_CLAIM_LIMIT
                  ? 'bg-slate-900 border-slate-700 text-slate-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}>
                <div className="flex items-center gap-1.5 min-w-0">
                  {vipClaimStatus.canClaimNow ? (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                      <span className="font-bold text-emerald-300 truncate">1 Free Claim Ready Now!</span>
                    </>
                  ) : vipClaimStatus.cooldownRemainingMs > 0 ? (
                    <>
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-semibold truncate">Next claim unlocks in {vipClaimStatus.cooldownRemainingFormatted}</span>
                    </>
                  ) : vipClaimStatus.claimsUsed >= VIP_FREE_CLAIM_LIMIT ? (
                    <>
                      <Check className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">2/2 Free Claims Used (Quota Met)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">Upgrade to VIP to Claim</span>
                    </>
                  )}
                </div>

                <span className="text-[10px] uppercase font-bold shrink-0">
                  {vipClaimStatus.canClaimNow
                    ? '₱0.00 FREE'
                    : vipClaimStatus.cooldownRemainingMs > 0
                    ? '24h WAIT'
                    : vipClaimStatus.claimsUsed >= VIP_FREE_CLAIM_LIMIT
                    ? 'QUOTA MET'
                    : '₱950 ACTIVATION'}
                </span>
              </div>
            </div>

            {/* Quick Claim Action Button & Cooldown State */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-mono text-[10px]">
                {vipClaimStatus.canClaimNow
                  ? 'Cooldown expired · Ready to claim'
                  : vipClaimStatus.cooldownRemainingMs > 0
                  ? '1 day wait between claims'
                  : '50% OFF applies storewide'}
              </span>

              <div className="flex items-center gap-2">
                {vipClaimStatus.canClaimNow ? (
                  <button
                    type="button"
                    id={quickClaimBtnId}
                    onClick={() => handleQuickClaim(selectedFreePackage)}
                    disabled={isQuickClaiming}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/30 border border-emerald-300"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950 animate-bounce" />
                    <span>⚡ Quick Claim {selectedFreePackage} 💎 (Free)</span>
                  </button>
                ) : vipClaimStatus.cooldownRemainingMs > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Locked ({vipClaimStatus.cooldownRemainingFormatted})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetVipCooldown}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      title="Reset 24h cooldown to test Quick Claim again"
                    >
                      Demo: Reset
                    </button>
                  </div>
                ) : vipClaimStatus.claimsUsed >= VIP_FREE_CLAIM_LIMIT ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-semibold text-xs flex items-center gap-1.5 cursor-not-allowed"
                    >
                      <Check className="w-3 h-3 text-slate-500" />
                      <span>2/2 Used</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetVipClaims}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      title="Reset claims quota to test Quick Claim again"
                    >
                      Demo: Reset Quota
                    </button>
                  </div>
                ) : !isVip && !isDev && onOpenVipUpgradeModal ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVipUpgradeModal();
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>Upgrade VIP (₱950)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenStore) onOpenStore();
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span>View Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VIP Priority Support Escalation Bar & Interactive 5-Minute SLA Chat */}
        <div className="pt-2 border-t border-slate-800 text-xs relative z-10 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white block leading-tight truncate">
                    VIP Priority Support Desk
                  </span>
                  <span className="text-[11px] text-cyan-300 font-mono block truncate">
                    Guaranteed 5-Minute Response Time SLA
                  </span>
                </div>
              </div>
              <button
                type="button"
                id={isFullTab ? 'vip-priority-support-btn-tab' : 'vip-priority-support-btn'}
                onClick={handleInitiatePrioritySupport}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-cyan-500/25"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
                <span>VIP Priority Support</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-white block leading-tight">Seller Portal Clearance</span>
                  <span className="text-[11px] text-slate-400">Authorized merchant diamond selling &amp; withdrawals</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSellerPortal();
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                Access
              </button>
            </div>
          </div>

          {/* Escalated VIP Priority Support Chat Panel (Guaranteed 5-Minute Response SLA) */}
          {isPrioritySupportOpen && (
            <div
              id={isFullTab ? 'vip-priority-support-chat-tab' : 'vip-priority-support-chat'}
              className="p-4 rounded-2xl bg-slate-950/95 border-2 border-cyan-400/70 shadow-2xl shadow-cyan-950/50 space-y-3 animate-in fade-in duration-200"
            >
              {/* Chat Header with Live 5-Minute SLA Countdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-slate-950 font-black shrink-0">
                    <Headphones className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs sm:text-sm font-black text-white">
                        VIP Priority Escalated Support
                      </h5>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Ticket #{priorityTicketId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Senior Escrow Arbiter Queue · Guaranteed &lt;5-Minute Response Time
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>
                      5m SLA:{' '}
                      {String(Math.floor(prioritySlaSeconds / 60)).padStart(2, '0')}:
                      {String(prioritySlaSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrioritySupportOpen(false)}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                    title="Close VIP Priority Support Chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Topic Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  'Expedite my latest diamond order',
                  'Verify 50% VIP discount on checkout',
                  'Request instant escrow arbiter lock',
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    disabled={isPriorityBotTyping}
                    onClick={() => handleSendPrioritySupportMessage(promptText)}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    ⚡ {promptText}
                  </button>
                ))}
              </div>

              {/* Messages Feed */}
              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {priorityChatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs leading-relaxed ${
                      msg.sender === 'system'
                        ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200 font-mono text-[11px]'
                        : msg.sender === 'user'
                        ? 'bg-cyan-600/25 border border-cyan-400/50 text-white ml-6'
                        : 'bg-slate-900/95 border border-emerald-500/40 text-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span
                        className={
                          msg.sender === 'arbiter_bot'
                            ? 'text-emerald-400 font-bold'
                            : msg.sender === 'user'
                            ? 'text-cyan-300 font-bold'
                            : 'text-amber-300 font-bold'
                        }
                      >
                        {msg.senderName}
                      </span>
                      <span className="text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))}

                {isPriorityBotTyping && (
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/40 text-xs text-cyan-300 font-mono flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span>Senior VIP Arbiter is responding (Priority 5-min SLA queue)...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={priorityChatInput}
                  onChange={(e) => setPriorityChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendPrioritySupportMessage();
                    }
                  }}
                  placeholder="Type your priority support message..."
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!priorityChatInput.trim() || isPriorityBotTyping}
                  onClick={() => handleSendPrioritySupportMessage()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Top-level 'VIP Perks Summary' Widget calculating total money saved via Loyalty & VIP discounts
  const renderVipPerksSummaryWidget = () => {
    const combinedDiscountTotalUsd = Number(
      (vipSavingsAndStats.vipDiscountSavedUsd + vipSavingsAndStats.loyaltySavedUsd).toFixed(2)
    );
    return (
      <div
        id="vip-perks-summary-widget"
        className="mx-4 sm:mx-6 mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#11192e] via-slate-900 to-[#141d33] border border-amber-400/70 shadow-lg shadow-amber-950/30 relative overflow-hidden space-y-3"
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                  VIP Perks Summary
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {vipSavingsAndStats.roiMultiple}x ROI Achieved
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Calculated from <strong className="text-white">{vipSavingsAndStats.ordersAnalyzed} settled orders</strong> &amp;{' '}
                <strong className="text-cyan-300">{(user.totalDiamondsPurchased || 0).toLocaleString()} 💎</strong> purchase history
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-mono uppercase text-amber-300 block">
              Total Saved (VIP + Loyalty)
            </span>
            <span
              id="vip-summary-total-saved"
              className="text-lg sm:text-xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-200 to-yellow-300"
            >
              {formatCurrency(vipSavingsAndStats.totalSavedUsd, currency)}
            </span>
          </div>
        </div>

        {/* 3-Column Breakdown: VIP 50% Discount + Loyalty Tier Discount + Free Diamond Claims */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 relative z-10">
          <div className="p-2.5 rounded-xl bg-slate-950/85 border border-amber-500/35 flex items-center justify-between sm:block">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>VIP 50% Discount Saved</span>
              <Percent className="w-3 h-3 text-amber-400 hidden sm:inline" />
            </div>
            <div
              id="vip-summary-vip-discount-saved"
              className="text-xs sm:text-sm font-black font-mono text-amber-300"
            >
              {formatCurrency(vipSavingsAndStats.vipDiscountSavedUsd, currency)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
              50% OFF Storewide Top-Ups
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/85 border border-cyan-500/35 flex items-center justify-between sm:block">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Loyalty Discount ({loyaltyTier.name})</span>
              <Crown className="w-3 h-3 text-cyan-400 hidden sm:inline" />
            </div>
            <div
              id="vip-summary-loyalty-discount-saved"
              className="text-xs sm:text-sm font-black font-mono text-cyan-300"
            >
              {formatCurrency(vipSavingsAndStats.loyaltySavedUsd, currency)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
              {loyaltyTier.discountPercent}% Loyalty Auto-Discount
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/85 border border-emerald-500/35 flex items-center justify-between sm:block">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
              <span>Free Diamond Claims Value</span>
              <Gem className="w-3 h-3 text-emerald-400 hidden sm:inline" />
            </div>
            <div
              id="vip-summary-free-claims-saved"
              className="text-xs sm:text-sm font-black font-mono text-emerald-300"
            >
              {formatCurrency(vipSavingsAndStats.freeClaimsValueUsd, currency)}{' '}
              <span className="text-[10px] text-emerald-400 font-normal">
                (+{vipSavingsAndStats.totalFreeDiamondsClaimed} 💎)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Combined Discounts: {formatCurrency(combinedDiscountTotalUsd, currency)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 'VIP Usage Stats' Visual Dashboard using Recharts (6-Month Diamond Claims vs. Savings & ROI)
  const renderVipUsageStatsDashboard = (instanceKey: string = 'overview') => {
    const currSymbol = CURRENCY_RATES[currency]?.symbol || '$';
    return (
      <div
        id={`vip-usage-stats-dashboard-${instanceKey}`}
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/95 via-[#0c1324] to-slate-950 border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-white tracking-tight">
                  VIP Usage Stats &amp; 6-Month ROI Tracker
                </h4>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  +{vipSavingsAndStats.roiPercent}% Net ROI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Diamond claims vs. cumulative VIP &amp; Loyalty savings over the last 6 months
              </p>
            </div>
          </div>

          {/* Chart Metric Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            {(['combined', 'savings', 'claims'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setVipChartView(mode)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  vipChartView === mode
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'combined' ? 'All Metrics' : mode === 'savings' ? 'Savings' : 'Claims 💎'}
              </button>
            ))}
          </div>
        </div>

        {/* ROI Summary Banner */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90">
            <span className="text-[10px] text-slate-400 block">VIP Pass Cost (₱950)</span>
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-200">
              {formatCurrency(vipSavingsAndStats.vipCostUsd, currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 block">6-Mo Total Return</span>
            <span className="text-xs sm:text-sm font-black font-mono text-emerald-300">
              {formatCurrency(vipSavingsAndStats.totalSavedUsd, currency)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30">
            <span className="text-[10px] text-amber-300 block">Return Multiple</span>
            <span className="text-xs sm:text-sm font-black font-mono text-amber-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              {vipSavingsAndStats.roiMultiple}x Pass Value
            </span>
          </div>
        </div>

        {/* Recharts 6-Month Composed Chart */}
        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={vipSavingsAndStats.sixMonthSeries}
              margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={`vipSavingsGrad-${instanceKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#10b981"
                tick={{ fill: '#34d399', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${currSymbol}${val}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#f59e0b"
                tick={{ fill: '#fbbf24', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}💎`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#090d16',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(value: any, name: string) => {
                  if (name.includes('Diamonds')) return [`${value} 💎`, name];
                  return [`${currSymbol}${Number(value).toLocaleString()}`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
              {(vipChartView === 'combined' || vipChartView === 'savings') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="totalSavedDisplay"
                  name={`Total Saved (${currency})`}
                  fill={`url(#vipSavingsGrad-${instanceKey})`}
                  stroke="#10b981"
                  strokeWidth={2}
                />
              )}
              {(vipChartView === 'combined' || vipChartView === 'claims') && (
                <Bar
                  yAxisId="right"
                  dataKey="diamondsClaimed"
                  name="Free Diamonds Claimed (💎)"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  barSize={22}
                />
              )}
              {vipChartView === 'savings' && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="vipSavedDisplay"
                  name={`VIP 50% Discount (${currency})`}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#0e1626] to-[#090d16] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header Banner with Profile Avatar */}
        <div className="relative bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 p-6 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-18 h-18 rounded-2xl bg-slate-900 p-1 border-2 border-cyan-400/80 shadow-lg shadow-cyan-950"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] text-slate-950 font-bold" title="Online & Protected">
                ✓
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{user.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  {user.tier}
                </span>
                {(user.isDeveloper || user.isVip || user.developerPrivileges?.freeDiamondsAll || user.email === 'barramedajacob36@gmail.com') && (
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border border-amber-400/60 text-xs font-mono font-bold flex items-center gap-1 shadow-sm shadow-amber-500/20 animate-pulse">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    VIP DEVELOPER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Escrow Verified
                </span>
                {user.authProvider === 'google' && (
                  <span className="text-[11px] font-semibold text-slate-900 bg-white border border-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <GoogleIcon className="w-3 h-3" />
                    <span>Google Account</span>
                  </span>
                )}
                {user.authProvider === 'facebook' && (
                  <span className="text-[11px] font-semibold text-white bg-[#1877F2] border border-blue-400 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <FacebookIcon className="w-3 h-3 text-white" />
                    <span>Facebook Linked</span>
                  </span>
                )}
                <span className="text-[11px] font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2 py-0.5 rounded-full">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recent'}
                </span>
                {(isVip || isDev) && effectiveVipExpiry && (
                  <span
                    id="header-vip-renewal-countdown"
                    className="text-[11px] font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm"
                    title={`VIP Membership renews on ${new Date(effectiveVipExpiry).toLocaleDateString()}`}
                  >
                    <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>
                      VIP Renewal: {vipDaysRemaining}d {String(vipHoursRemaining).padStart(2, '0')}h{' '}
                      {String(vipMinutesRemaining).padStart(2, '0')}m {String(vipSecondsRemaining).padStart(2, '0')}s
                    </span>
                  </span>
                )}
                {isVipExpiringSoon && (
                  <button
                    type="button"
                    id="header-vip-renew-now-btn"
                    onClick={handleExtendVipMembership}
                    className="text-[11px] font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                    title="Your VIP membership expires in less than 3 days — click to extend +30 days immediately"
                  >
                    <AlertTriangle className="w-3 h-3 text-slate-950 shrink-0" />
                    <span>Renew Now</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VIP Perks Summary Widget at the top of the UserProfileModal */}
        {renderVipPerksSummaryWidget()}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 mt-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vip_perks')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'vip_perks'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Active VIP Perks</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950">
              50% OFF · Free 💎
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loyalty')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'loyalty'
                ? 'border-amber-400 text-amber-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Loyalty Tiers</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600/60">
              {loyaltyTier.discountPercent}% OFF
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'wallet'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Nexus Shop Wallet</span>
            {totalBonusDiamonds > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                +{totalBonusDiamonds}💎
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('game')}
            className={`py-3 px-3 sm:px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'game'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Linked Game ID</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'security'
                ? 'border-cyan-400 text-cyan-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Escrow & Security</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          
          {feedbackNotice && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-4">

              {/* Active VIP Perks Section */}
              {renderActiveVipPerksCard(false)}

              {/* VIP Usage Stats Visual Dashboard (Recharts 6-Month Claims vs. Savings) */}
              {renderVipUsageStatsDashboard('overview')}
              
              {/* Key Account Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Orders Settled</span>
                  <span className="text-base font-bold font-mono text-cyan-300">{user.totalOrdersCount}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Diamonds Credited</span>
                  <span className="text-base font-bold font-mono text-cyan-400 flex items-center justify-center gap-1">
                    <Gem className="w-3.5 h-3.5 text-cyan-400 inline" />
                    {user.totalDiamondsPurchased.toLocaleString()}
                  </span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl text-center">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Escrow Balance</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatCurrency(user.walletBalanceUsd, currency)}
                  </span>
                </div>
              </div>

              {/* Loyalty Status & Automatic Discount Highlight */}
              <div
                className={`p-4 rounded-xl bg-gradient-to-br ${loyaltyTier.gradient} border ${loyaltyTier.badgeBorder} shadow-md space-y-3 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl ${loyaltyTier.badgeBg} border ${loyaltyTier.badgeBorder} flex items-center justify-center`}>
                      <Crown className={`w-4 h-4 ${loyaltyTier.badgeText}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Loyalty Status: {loyaltyTier.name}</span>
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/60">
                          {loyaltyTier.discountPercent}% AUTO-DISCOUNT
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {loyaltyTier.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('loyalty')}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/80 px-3 py-1.5 rounded-lg border border-amber-500/50 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <span>View All Tiers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress bar to next tier */}
                <div className="space-y-1 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>
                      {loyaltyProgress.nextTier ? (
                        <>Progress to <strong>{loyaltyProgress.nextTier.name}</strong> ({loyaltyProgress.nextTier.discountPercent}% OFF):</>
                      ) : (
                        <>Maximum Loyalty Status Unlocked (15% OFF)</>
                      )}
                    </span>
                    <span className="text-cyan-300 font-bold">{loyaltyProgress.progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 transition-all duration-500"
                      style={{ width: `${loyaltyProgress.progressPercent}%` }}
                    />
                  </div>
                  {loyaltyProgress.nextTier && (
                    <div className="text-[10px] text-right font-mono text-amber-300/90">
                      +{loyaltyProgress.remainingDiamonds.toLocaleString()} 💎 needed to reach next tier
                    </div>
                  )}
                </div>
              </div>

              {/* Virtual Nexus Shop Wallet Snapshot Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/50 border border-cyan-500/40 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Virtual Nexus Shop Wallet</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                          Active Rewards Vault
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Bonus diamonds and credits earned from completed missions
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('wallet')}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 bg-cyan-900/60 hover:bg-cyan-800/80 px-3 py-1.5 rounded-lg border border-cyan-500/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Open Wallet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Bonus Diamonds</span>
                    <span className="text-sm font-bold font-mono text-cyan-300 flex items-center gap-1">
                      <span>💎</span>
                      <span>{totalBonusDiamonds.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Mission Credits</span>
                    <span className="text-sm font-bold font-mono text-emerald-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{formatCurrency(totalCreditsEarnedUsd, currency)}</span>
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex sm:flex-col justify-between items-center sm:items-start">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Streak Multiplier</span>
                    <span className="text-sm font-bold font-mono text-amber-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{streakDays} Days (+15%)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Refer-a-Friend Program Spotlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-cyan-950/40 border border-amber-500/40 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/50 flex items-center justify-center">
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Referral Program & Rewards</span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700/60">
                          {referralData.hasReferralBadge || referralData.totalReferred > 0 ? '🎖️ Badge & 5% Discount Active' : '5% Dual Bonus'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Code: <strong className="text-cyan-300 font-mono">{userReferralCode}</strong> • Friends join via your link to unlock perks!
                      </p>
                    </div>
                  </div>

                  {onOpenReferralModal && (
                    <button
                      type="button"
                      onClick={onOpenReferralModal}
                      className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-900/60 hover:bg-amber-800/80 px-3 py-1.5 rounded-lg border border-amber-500/50 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Referral Hub</span>
                    </button>
                  )}
                </div>

                {/* Unique Invite Link Input & Copy */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-transparent text-xs font-mono text-cyan-300 focus:outline-none select-all overflow-ellipsis"
                  />
                  <button
                    type="button"
                    onClick={handleCopyInviteUrl}
                    className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedInviteUrl ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Unlocked Rewards Badges Row */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                    referralData.hasReferralBadge || referralData.totalReferred > 0 || user.referralBadge
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-950/50 text-slate-400 border-slate-800'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-[11px]">
                      Referral Badge: {referralData.hasReferralBadge || referralData.totalReferred > 0 || user.referralBadge ? 'Unlocked 🎖️' : 'Locked (Invite 1 friend)'}
                    </span>
                  </div>

                  <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                    referralData.hasReferralBadge || referralData.totalReferred > 0 || user.referralDiscountPercent
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-950/50 text-slate-400 border-slate-800'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-[11px]">
                      Diamond Discount: {referralData.hasReferralBadge || referralData.totalReferred > 0 || user.referralDiscountPercent ? '5% OFF Active' : '5% OFF on 1st Invite'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Friends Joined</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {referralData.totalReferred}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Orders Completed</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {referralData.successfulReferrals}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Referral Diamonds</span>
                    <span className="text-sm font-bold font-mono text-cyan-300">
                      +{referralBonusDiamonds} 💎
                    </span>
                  </div>
                </div>
              </div>

              {/* Marketplace Diamond Selling Permissions Card (Visible only to authorized VIP & Developer Merchants, hidden from buyers for privacy) */}
              {canSellDiamonds(user) && (
                <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
                        <Crown className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                          Merchant Authority Clearance
                        </h4>
                        <span className="text-[10px] text-slate-400">Escrow Collateral & Delivery Verification</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      AUTHORIZED SELLER
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                    <p>
                      {isDeveloperUser(user) ? (
                        <span className="text-purple-300 font-medium">
                          👑 <strong>Platform Developer Clearance:</strong> Master authority to list diamond packages, set rates, and direct-distribute orders via Moonton API channels.
                        </span>
                      ) : (
                        <span className="text-amber-300 font-medium">
                          🌟 <strong>VIP Verified Merchant:</strong> Certified VIP seller privileges and escrow collateral clearance active.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Preferred Payment Method Shortcut Card */}
              <div className="bg-slate-900/80 border border-cyan-800/50 rounded-xl p-4 space-y-3 relative overflow-hidden shadow-lg shadow-cyan-950/20">
                <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        Preferred Payment Method
                      </h3>
                      <span className="text-[10px] text-slate-400">Checkout Modal Shortcut</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    Auto Pre-fills Checkout
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Choose your favorite payment option. Nexus Shop automatically selects this channel whenever you buy diamonds, passes, or bundles — speeding up your checkout with zero hassle.
                </p>

                {/* 1-Tap Quick Select Shortcut Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PAYMENT_SHORTCUT_OPTIONS.map((pm) => {
                    const isSelected = preferredPayment === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => handleQuickSetPaymentMethod(pm.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-950/70 shadow-sm ring-1 ring-cyan-500/50 text-white'
                            : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-900/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg leading-none">{pm.flag}</span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-900/90 px-1.5 py-0.5 rounded border border-cyan-500/50">
                              <Check className="w-2.5 h-2.5 text-cyan-300" />
                              Active
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-400 font-mono">1-Tap Set</span>
                          )}
                        </div>
                        <div className="text-xs font-bold truncate text-white">{pm.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{pm.badge}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Shortcut Status Bar */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">Active Shortcut:</span>
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>{getPaymentMethodDetails(preferredPayment).flag}</span>
                      <span>{getPaymentMethodDetails(preferredPayment).name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {preferredPayment !== 'gcash' && (
                      <button
                        type="button"
                        onClick={() => handleQuickSetPaymentMethod('gcash')}
                        className="text-[10px] text-blue-300 hover:text-blue-200 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 font-medium cursor-pointer transition-colors"
                      >
                        Quick GCash
                      </button>
                    )}
                    {preferredPayment !== 'maya' && (
                      <button
                        type="button"
                        onClick={() => handleQuickSetPaymentMethod('maya')}
                        className="text-[10px] text-emerald-300 hover:text-emerald-200 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 font-medium cursor-pointer transition-colors"
                      >
                        Quick Maya
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details Edit Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Personal Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    ) : (
                      <p className="text-xs font-semibold text-slate-200">{user.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                    <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800 font-mono">
                      <span>{user.email}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-sans font-semibold">
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Contact Phone</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      ) : (
                        <p className="text-xs text-slate-300 font-mono">{user.phone || '+63 917 849 2091'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Preferred Currency</label>
                      {isEditing ? (
                        <select
                          value={preferredCurr}
                          onChange={(e) => setPreferredCurr(e.target.value as Currency)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          {(Object.keys(CURRENCY_RATES) as Currency[]).map((c) => (
                            <option key={c} value={c}>{c} ({CURRENCY_RATES[c].symbol})</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-slate-300 font-mono font-semibold">{user.preferredCurrency || currency}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Default Payment Method</label>
                      {isEditing ? (
                        <select
                          value={preferredPayment}
                          onChange={(e) => setPreferredPayment(e.target.value as PaymentMethod)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          {PAYMENT_SHORTCUT_OPTIONS.map((pm) => (
                            <option key={pm.id} value={pm.id}>{pm.flag} {pm.name}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-cyan-300 font-mono font-semibold flex items-center gap-1.5">
                          <span>{getPaymentMethodDetails(preferredPayment).flag}</span>
                          <span>{getPaymentMethodDetails(preferredPayment).name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Changes</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenOrders();
                  }}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-800/60 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>View Orders & Receipts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Live escrow tracking & CSV export
                  </p>
                </button>

                {canSellDiamonds(user) && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSellerPortal();
                    }}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-800/60 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                      <Store className="w-4 h-4 text-emerald-400" />
                      <span>Diamond Merchant Portal</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      List packages & disburse stock
                    </p>
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB: ACTIVE VIP PERKS */}
          {activeTab === 'vip_perks' && (
            <div className="space-y-4">
              {renderActiveVipPerksCard(true)}

              {/* VIP Usage Stats Visual Dashboard (Recharts 6-Month Claims vs. Savings) */}
              {renderVipUsageStatsDashboard('vip_tab')}

              {/* 50% Discount Comparison Table */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      50% VIP Discount Price Comparison
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                    50% Storewide Cut
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                        <th className="pb-2 font-semibold">Package</th>
                        <th className="pb-2 font-semibold">Regular Escrow Price</th>
                        <th className="pb-2 font-semibold text-amber-300">👑 VIP Member Price</th>
                        <th className="pb-2 font-semibold text-emerald-400">Savings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="py-2 font-bold text-white">86 Diamonds</td>
                        <td className="py-2 text-slate-400 line-through">₱85.00 ($1.45)</td>
                        <td className="py-2 text-cyan-300 font-bold">₱42.50 ($0.73)</td>
                        <td className="py-2 text-emerald-400 font-bold">50% OFF</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">172 Diamonds</td>
                        <td className="py-2 text-slate-400 line-through">₱170.00 ($2.91)</td>
                        <td className="py-2 text-emerald-400 font-bold">₱0.00 FREE or ₱85.00 (50% OFF)</td>
                        <td className="py-2 text-emerald-400 font-bold">100% / 50%</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">257 Diamonds</td>
                        <td className="py-2 text-slate-400 line-through">₱250.00 ($4.27)</td>
                        <td className="py-2 text-cyan-300 font-bold">₱125.00 ($2.14)</td>
                        <td className="py-2 text-emerald-400 font-bold">50% OFF</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">706 Diamonds</td>
                        <td className="py-2 text-slate-400 line-through">₱680.00 ($11.62)</td>
                        <td className="py-2 text-cyan-300 font-bold">₱340.00 ($5.81)</td>
                        <td className="py-2 text-emerald-400 font-bold">50% OFF</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-white">2,195 Diamonds</td>
                        <td className="py-2 text-slate-400 line-through">₱2,050.00 ($35.04)</td>
                        <td className="py-2 text-cyan-300 font-bold">₱1,025.00 ($17.52)</td>
                        <td className="py-2 text-emerald-400 font-bold">50% OFF</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-amber-300">5,532 Whale Tier</td>
                        <td className="py-2 text-slate-400 line-through">₱5,100.00 ($87.18)</td>
                        <td className="py-2 text-amber-300 font-bold">₱2,550.00 ($43.59)</td>
                        <td className="py-2 text-emerald-400 font-bold">50% OFF (Save ₱2,550)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Currency Conversion & Terms Notice */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    VIP Membership fee is <strong className="text-white">₱950 Pesos</strong>, convertible to all country currencies (USD, IDR, EUR, MYR, BRL, SGD). Includes official VIP badge and instant activation.
                  </span>
                </div>
                {onOpenVipUpgradeModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVipUpgradeModal();
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer shrink-0 text-xs"
                  >
                    View Converter →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: LOYALTY TIERS */}
          {activeTab === 'loyalty' && (
            <LoyaltyTiersSection
              user={user}
              onUpdateUser={onUpdateUser}
              currency={currency}
              onOpenStore={() => {
                onClose();
              }}
            />
          )}

          {/* TAB: VIRTUAL NEXUS WALLET */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">

              {/* Holographic Virtual VIP Rewards Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80 border border-cyan-500/50 p-5 shadow-2xl space-y-4">
                {/* Decorative Ambient Radial Glows */}
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Card Header */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-cyan-400/20 border border-cyan-400/60 flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                        <span>NEXUS REWARDS ESCROW WALLET</span>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono">
                        Vault ID: NEXUS-WAL-{user.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-600/50 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Vault
                    </span>
                  </div>
                </div>

                {/* Card Core Balances */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Accumulated Bonus Diamonds */}
                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-cyan-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <span>Bonus Diamonds Vault</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-700/50">
                        In-Game Ready
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 flex items-center gap-1.5 drop-shadow">
                      <span>💎</span>
                      <span>{totalBonusDiamonds.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Missions ({missionsData.totalBonusDiamondsClaimed || 0} 💎) & Referrals (+{referralBonusDiamonds} 💎)
                    </p>
                  </div>

                  {/* Accumulated Mission Credits */}
                  <div className="p-3.5 rounded-xl bg-slate-950/85 border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mission Credits Earned</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/50">
                        Escrow Offset
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 drop-shadow">
                      {formatCurrency(totalCreditsEarnedUsd, currency)}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Cash credits usable directly towards checkout balance
                    </p>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div className="relative z-10 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="font-mono text-slate-400">Cardholder: <strong className="text-white font-semibold">{user.name}</strong></span>
                    <span className="hidden sm:inline text-slate-600">•</span>
                    <span className="font-mono text-slate-400">Streak: <strong className="text-amber-300 font-semibold">{streakDays} Days 🔥</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Aegis Escrow Protected</span>
                  </div>
                </div>
              </div>

              {/* Mission Credits Escrow Transfer Action Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span>Transfer Mission Credits to Escrow Balance</span>
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {availableMissionCreditsUsd > 0
                        ? `You have ${formatCurrency(availableMissionCreditsUsd, currency)} uncredited mission earnings ready to transfer to your main Escrow Balance.`
                        : `All accumulated mission credits (${formatCurrency(totalCreditsEarnedUsd, currency)}) are credited to your active Escrow Balance (${formatCurrency(user.walletBalanceUsd, currency)}).`}
                    </p>
                  </div>

                  {availableMissionCreditsUsd > 0 ? (
                    <button
                      type="button"
                      onClick={handleTransferCreditsToEscrow}
                      disabled={isTransferringCredits}
                      className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                    >
                      {isTransferringCredits ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Transferring...</span>
                        </>
                      ) : (
                        <>
                          <Coins className="w-3.5 h-3.5" />
                          <span>Transfer {formatCurrency(availableMissionCreditsUsd, currency)}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1.5 rounded-lg border border-emerald-800/60 flex items-center gap-1 self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Escrow Synced</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Total Earned</span>
                    <span className="font-bold font-mono text-emerald-300">{formatCurrency(totalCreditsEarnedUsd, currency)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Transferred to Escrow</span>
                    <span className="font-bold font-mono text-cyan-300">{formatCurrency(transferredCreditsUsd, currency)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Ready to Transfer</span>
                    <span className="font-bold font-mono text-amber-300">{formatCurrency(availableMissionCreditsUsd, currency)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-slate-400 block text-[10px]">Main Escrow Balance</span>
                    <span className="font-bold font-mono text-white">{formatCurrency(user.walletBalanceUsd, currency)}</span>
                  </div>
                </div>
              </div>

              {/* Completed Missions Earnings Ledger */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Completed Missions Earnings Ledger</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Breakdown of bonus diamonds and credits accumulated from tasks
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 text-[11px] bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setWalletFilter('all')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        walletFilter === 'all'
                          ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({completedMissions.length + 1})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletFilter('diamonds')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        walletFilter === 'diamonds'
                          ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Diamonds
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletFilter('credits')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        walletFilter === 'credits'
                          ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletFilter('vouchers')}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        walletFilter === 'vouchers'
                          ? 'bg-cyan-900/80 text-cyan-200 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Vouchers ({earnedVouchers.length})
                    </button>
                  </div>
                </div>

                {/* Ledger Items List */}
                <div className="space-y-2">
                  {/* Starter Explorer Bonus Pool Entry */}
                  {(walletFilter === 'all' || walletFilter === 'diamonds' || walletFilter === 'credits') && (
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center shrink-0">
                          <Gift className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>Welcome Explorer Bounty & Attendance Vault</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                              STARTER
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Starter allocation for verified commander signup & 3-day roll call streak
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-[11px] border border-cyan-800/60">
                          +45 💎
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-800/60">
                          +{formatCurrency(2.50, currency)}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Credited</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Completed Mission Entries */}
                  {completedMissions.map((mission) => {
                    const missionCredits = mission.rewardCreditsUsd || (mission.rewardDiamonds ? Number((mission.rewardDiamonds * 0.025).toFixed(2)) : 0.50);
                    
                    // Filter match check
                    if (walletFilter === 'diamonds' && !mission.rewardDiamonds) return null;
                    if (walletFilter === 'credits' && !missionCredits) return null;
                    if (walletFilter === 'vouchers' && !mission.rewardDiscountPct) return null;

                    return (
                      <div
                        key={mission.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{mission.title}</span>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                                {mission.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {mission.claimedAt
                                ? `Completed on ${new Date(mission.claimedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                                : 'Completed & claimed into Nexus Shop Wallet'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                          {mission.rewardDiamonds && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-[11px] border border-cyan-800/60">
                              +{mission.rewardDiamonds} 💎
                            </span>
                          )}
                          {missionCredits > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono font-bold text-[11px] border border-emerald-800/60">
                              +{formatCurrency(missionCredits, currency)}
                            </span>
                          )}
                          {mission.rewardDiscountPct && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono font-bold text-[11px] border border-purple-800/60">
                              <Ticket className="w-3 h-3 text-purple-400" />
                              <span>{mission.rewardDiscountPct}% OFF</span>
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Vaulted</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Empty state if no missions completed yet */}
                  {completedMissions.length === 0 && walletFilter !== 'vouchers' && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                      <Sparkles className="w-6 h-6 text-cyan-400 mx-auto" />
                      <p className="text-xs font-semibold text-white">More Mission Bounties Awaiting Claim</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Complete easy daily checks, account verification, and security drills to earn up to 150+ extra bonus diamonds and cash credits.
                      </p>
                      {onOpenMissions && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenMissions();
                          }}
                          className="mt-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Go to Daily Missions</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Earned Discount Vouchers Vault */}
              {earnedVouchers.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-purple-400" />
                      <span>Active Mission Discount Vouchers ({earnedVouchers.length})</span>
                    </h3>
                    <span className="text-[10px] text-purple-300 font-mono">1-Tap Copy Code</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {earnedVouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-purple-900/50 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-purple-300 font-mono">{voucher.code}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800">
                              {voucher.discountPct}% OFF
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{voucher.description}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyVoucher(voucher.code)}
                          className="px-2.5 py-1 rounded bg-purple-950/90 hover:bg-purple-900 text-purple-200 text-xs font-semibold border border-purple-700/60 flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                        >
                          {copiedVoucherCode === voucher.code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-300 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nexus Shop Wallet Rules & Mechanics (Clean Pillars) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                    <Gem className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Bonus Diamonds</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Bonus diamonds earned from missions are credited directly during order fulfillment or claimed as loyalty packs.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mission Credits</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Cash bounties earned can be transferred directly to your live Escrow Balance and applied to reduce purchase totals.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-left space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>Streak Multiplier</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Consecutive daily roll calls maintain a streak multiplier that enhances mission diamond and credit rewards up to +25%.
                  </p>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  ← Back to Overview
                </button>

                {onOpenMissions && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenMissions();
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <span>Open Daily Missions & Earn More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: LINKED GAME ID */}
          {activeTab === 'game' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <span>Mobile Legends: Bang Bang Profile</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyGameAccount('all')}
                    disabled={!editUserId}
                    title="Copy User ID & Zone ID to Clipboard"
                    className={`text-[10px] font-mono px-2 py-1 rounded-md border flex items-center gap-1 transition-all cursor-pointer ${
                      copiedGameId === 'all'
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-600'
                    }`}
                  >
                    {copiedGameId === 'all' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Your linked account automatically fills in at checkout and allows instant server-side IGN verification.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-slate-400">User ID</label>
                      {editUserId && (
                        <button
                          type="button"
                          onClick={() => handleCopyGameAccount('user')}
                          title="Copy User ID to Clipboard"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                        >
                          {copiedGameId === 'user' ? (
                            <span className="text-emerald-400">Copied</span>
                          ) : (
                            <span>Copy ID</span>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editUserId}
                      onChange={(e) => setEditUserId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs text-slate-400">Zone ID</label>
                      {editZoneId && (
                        <button
                          type="button"
                          onClick={() => handleCopyGameAccount('zone')}
                          title="Copy Zone ID to Clipboard"
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-mono"
                        >
                          {copiedGameId === 'zone' ? (
                            <span className="text-emerald-400">Copied</span>
                          ) : (
                            <span>Copy Zone</span>
                          )}
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editZoneId}
                      onChange={(e) => setEditZoneId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Moonton Verified In-Game Name:</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{gameIgn}</span>
                    <span className="text-[10px] text-slate-400 block">Server: {user.serverRegion || 'Philippines (PH-SEA)'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyGameAccount}
                    disabled={isVerifyingGame}
                    className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {isVerifyingGame ? 'Verifying...' : 'Re-verify IGN'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Linked MLBB Account</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & ESCROW */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                {/* Connected Identity Provider */}
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Sign-In Method</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                      OAuth 2.0 Verified
                    </span>
                  </div>
                  
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {user.authProvider === 'google' ? (
                        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <GoogleIcon className="w-4 h-4" />
                        </div>
                      ) : user.authProvider === 'facebook' ? (
                        <div className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-sm">
                          <FacebookIcon className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                          <Mail className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">
                          {user.authProvider === 'google'
                            ? 'Google Account Connected'
                            : user.authProvider === 'facebook'
                            ? 'Facebook Account Connected'
                            : 'Email & Password Authentication'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      Linked
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Escrow Vault & Account Protection
                </h3>

                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Two-Factor Authentication (2FA)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Requires biometric or SMS verification before releasing escrow funds.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFaActive(!twoFaActive);
                      setFeedbackNotice(`2FA has been ${!twoFaActive ? 'enabled' : 'disabled'}.`);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      twoFaActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {twoFaActive ? 'Active' : 'Disabled'}
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-white">Trust & Security Badges</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set([
                      ...(user.securityBadges || ['Aegis Buyer Shield', 'Verified Mobile ID', 'Moonton Linked', '2FA Protected']),
                      ...((referralData.hasReferralBadge || referralData.totalReferred > 0 || user.referralBadge) ? ['Referral Badge'] : [])
                    ])).map((badge) => (
                      <span
                        key={badge}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          badge === 'Referral Badge'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60 shadow-sm shadow-amber-500/20'
                            : 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {badge === 'Referral Badge' ? (
                          <Award className="w-3 h-3 text-amber-400" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                        )}
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Moonton Third-Party Safe Guarantee</span>
                    <span className="text-[11px] text-slate-400">
                      DiamondVault transactions exclusively route via official Moonton API servers. Your game password is never requested.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign Out Section & Settings */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-950 text-rose-300 hover:text-rose-200 border border-rose-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-cyan-400" />
                  <span>Preferences & Settings</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>Escrow ID: {user.id}</span>
              <span>·</span>
              <span className="text-cyan-400 font-semibold">v{APP_VERSION}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
