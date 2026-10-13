import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Currency,
  DiamondPackage,
  EscrowOrder,
  MlbbAccount,
  OrderStatus,
  OrderToastNotification,
  PriceAlert,
  SellerListing,
  SellerProfile,
  OrderFeedback,
  UserAccount,
  AppSettings,
  ThemeArchetype,
} from './types';
import {
  DIAMOND_PACKAGES,
  INITIAL_ORDERS,
  INITIAL_PRICE_ALERTS,
  INITIAL_SELLERS,
  INITIAL_SELLER_PROFILE,
  INITIAL_USER_ACCOUNT,
  DEFAULT_APP_SETTINGS,
  lookupOrGenerateMlbbAccount,
  canSellDiamonds,
  isVipUser,
  isDeveloperUser
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PackageStore } from './components/PackageStore';
import { P2PMarketplace } from './components/P2PMarketplace';
import { OrdersListView } from './components/OrdersListView';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import {
  CheckoutModal,
  CheckoutAutoDraft,
  CHECKOUT_AUTO_DRAFT_KEY,
  loadCheckoutAutoDraft,
  clearCheckoutAutoDraftStorage,
} from './components/CheckoutModal';
import { SellerDashboard } from './components/SellerDashboard';
import { VipUpgradeModal } from './components/VipUpgradeModal';
import { EscrowExplainerModal } from './components/EscrowExplainerModal';
import { DiamondSavingsCalculator } from './components/DiamondSavingsCalculator';
import { NotificationToasts } from './components/NotificationToasts';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PostTransactionFeedbackModal } from './components/PostTransactionFeedbackModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { PriceAlertsManagerModal } from './components/PriceAlertsManagerModal';
import { QuickHelpPopover } from './components/QuickHelpPopover';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { VersionModal } from './components/VersionModal';
import { APP_VERSION } from './utils/version';
import { BackgroundEffects } from './components/BackgroundEffects';
import { DailyMissions } from './components/DailyMissions';
import { ReferralModal } from './components/ReferralModal';
import { ReferralProgram } from './components/ReferralProgram';
import { triggerOrderCompletedConfetti } from './utils/confetti';
import { playOrderNotificationSound, playPriceDropSound, playReferralBonusSound } from './utils/audio';
import { CURRENCY_RATES, formatCurrency } from './utils/formatters';
import { detectLocaleCurrency, LocaleCurrencySuggestion } from './utils/localeCurrency';
import { processOrderReferralCompletion } from './utils/referralUtils';
import { calculateLoyaltyTier } from './utils/loyaltyUtils';
import { LegalTermsModal, LegalTabType } from './components/LegalTermsModal';
import { AffiliateProgramModal } from './components/AffiliateProgramModal';
import { GamePublisherModal } from './components/GamePublisherModal';
import { DistributorProgramModal } from './components/DistributorProgramModal';
import { BugBountyModal } from './components/BugBountyModal';
import { TimedDiamondDropModal } from './components/TimedDiamondDropModal';
import { SecurityVerificationModal } from './components/SecurityVerificationModal';
import { ContactSupportModal } from './components/ContactSupportModal';
import { NexusLogo } from './components/NexusLogo';
import { saveAccountToHistory } from './utils/savedAccounts';
import { InteractiveSparkleCanvas } from './components/InteractiveSparkleCanvas';
import {
  ShieldCheck,
  Gem,
  Zap,
  CheckCircle2,
  Lock,
  Bug,
  Bot,
  Gift,
  X,
  Sparkles,
  Gamepad2,
  Package,
  Scale,
  FileText,
  ExternalLink,
  HelpCircle,
  Crown,
  Store,
  Percent,
  Award,
  PhoneCall,
  MessageCircle,
  Users,
  RotateCcw,
  Trash2,
  Clock,
} from 'lucide-react';
import { IssueCategory } from './types';

export function App() {
  // Application Settings & Preferences
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('nexus_app_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.currency) return { ...DEFAULT_APP_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_APP_SETTINGS;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Navigation & Preferences
  const [activeTab, setActiveTab] = useState<'buy' | 'p2p' | 'seller' | 'orders' | 'missions' | 'referrals' | 'escrow-info'>('buy');
  const [currency, setCurrency] = useState<Currency>(() => settings.currency || 'PHP');
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');

  // Claimable Daily Missions Tracker for Navbar Badge
  const [claimableMissionsCount, setClaimableMissionsCount] = useState<number>(0);

  const updateClaimableMissionsCount = useCallback(() => {
    try {
      const saved = localStorage.getItem('nexus_daily_missions_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.missions)) {
          const ready = parsed.missions.filter((m: any) => m.status === 'claimable').length;
          setClaimableMissionsCount(ready);
          return;
        }
      }
    } catch {}
    setClaimableMissionsCount(0);
  }, []);

  useEffect(() => {
    updateClaimableMissionsCount();
    const interval = setInterval(updateClaimableMissionsCount, 2000);
    return () => clearInterval(interval);
  }, [updateClaimableMissionsCount]);

  // Core Data
  const [verifiedAccount, setVerifiedAccount] = useState<MlbbAccount | null>(
    lookupOrGenerateMlbbAccount('84729103', '3092')
  );
  const [packages, setPackages] = useState<DiamondPackage[]>(DIAMOND_PACKAGES);
  const [sellers, setSellers] = useState<SellerListing[]>(INITIAL_SELLERS);
  const [orders, setOrders] = useState<EscrowOrder[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_escrow_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((o) => o && typeof o === 'object' && typeof o.id === 'string');
        }
      }
    } catch {}
    return INITIAL_ORDERS;
  });

  const ordersRef = useRef<EscrowOrder[]>(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('nexus_escrow_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const [sellerProfile, setSellerProfile] = useState<SellerProfile>(INITIAL_SELLER_PROFILE);

  // Perceived Performance & Anti-CLS Skeleton Loading State during initial hydration, tab transitions & bulk order operations
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const dataLoadingTimerRef = useRef<number | null>(null);

  const triggerGlobalDataSkeleton = useCallback((durationMs: number = 320) => {
    if (dataLoadingTimerRef.current) {
      window.clearTimeout(dataLoadingTimerRef.current);
    }
    setIsDataLoading(true);
    dataLoadingTimerRef.current = window.setTimeout(() => {
      setIsDataLoading(false);
    }, durationMs);
  }, []);

  useEffect(() => {
    dataLoadingTimerRef.current = window.setTimeout(() => {
      setIsDataLoading(false);
    }, 380);
    return () => {
      if (dataLoadingTimerRef.current) {
        window.clearTimeout(dataLoadingTimerRef.current);
      }
    };
  }, []);

  // User Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const explicitSignIn = localStorage.getItem('nexus_user_has_signed_in');
      const saved = localStorage.getItem('nexus_auth_user');
      if (explicitSignIn === 'true' && saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) {
          if (parsed.isVip && !parsed.vipExpiry) {
            parsed.vipPurchasedAt = parsed.vipPurchasedAt || Date.now() - 1000 * 60 * 60 * 24 * 6;
            parsed.vipExpiry = Date.now() + 1000 * 60 * 60 * 24 * 24 + 1000 * 60 * 60 * 14;
          }
          return parsed;
        }
      }
    } catch {}
    // Guest by default: users need to sign in first to order with escrow
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isVipUpgradeModalOpen, setIsVipUpgradeModalOpen] = useState(false);
  const [authReasonNotice, setAuthReasonNotice] = useState<string>('');
  const [pendingOrderAfterAuth, setPendingOrderAfterAuth] = useState<{
    pkg: DiamondPackage;
    seller: SellerListing;
    quantity: number;
  } | null>(null);

  // Persist user account updates
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('nexus_user_has_signed_in', 'true');
        localStorage.setItem('nexus_auth_user', JSON.stringify(currentUser));
        saveAccountToHistory(currentUser);
      } else {
        localStorage.removeItem('nexus_auth_user');
        localStorage.removeItem('nexus_user_has_signed_in');
      }
    } catch {}
  }, [currentUser]);

  // Apply theme styling to document
  useEffect(() => {
    const root = document.documentElement;
    const allThemeClasses = [
      'theme-dark',
      'theme-amoled',
      'theme-midnight',
      'theme-white',
      'theme-mythic-gold',
      'theme-neon-emerald',
      'theme-crimson-void',
    ];
    root.classList.remove(...allThemeClasses);

    if (settings.theme === 'amoled') {
      root.classList.add('theme-amoled');
    } else if (settings.theme === 'midnight') {
      root.classList.add('theme-midnight');
    } else if (settings.theme === 'white') {
      root.classList.add('theme-white');
    } else if (settings.theme === 'dark') {
      root.classList.add('theme-dark');
    } else if (settings.theme === 'mythic_gold') {
      root.classList.add('theme-mythic-gold');
    } else if (settings.theme === 'neon_emerald') {
      root.classList.add('theme-neon-emerald');
    } else if (settings.theme === 'crimson_void') {
      root.classList.add('theme-crimson-void');
    }
  }, [settings.theme]);

  // Modals & Popovers
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<EscrowOrder | null>(null);
  const [openCancelModalOnTracker, setOpenCancelModalOnTracker] = useState(false);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<EscrowOrder | null>(null);
  const [checkoutPackage, setCheckoutPackage] = useState<DiamondPackage | null>(null);
  const [checkoutSeller, setCheckoutSeller] = useState<SellerListing | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [checkoutBulkItems, setCheckoutBulkItems] = useState<{
    package: DiamondPackage;
    seller: SellerListing;
    quantity: number;
  }[] | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [savedCheckoutDraft, setSavedCheckoutDraft] = useState<CheckoutAutoDraft | null>(() => loadCheckoutAutoDraft());
  const [activeRestoredDraft, setActiveRestoredDraft] = useState<CheckoutAutoDraft | null>(null);
  const [isEscrowExplainerOpen, setIsEscrowExplainerOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Resume saved checkout Auto-Draft
  const handleResumeCheckoutDraft = useCallback(
    (draftToResume?: CheckoutAutoDraft | null) => {
      const targetDraft = draftToResume || savedCheckoutDraft || loadCheckoutAutoDraft();
      if (!targetDraft || !targetDraft.diamondPackage || !targetDraft.seller) return;

      if (!currentUser) {
        setPendingOrderAfterAuth({
          pkg: targetDraft.diamondPackage,
          seller: targetDraft.seller,
          quantity: targetDraft.quantity || 1,
        });
        setAuthReasonNotice(
          `Sign in to resume your saved Auto-Draft (${targetDraft.quantity || 1}x ${targetDraft.diamondPackage.name} from ${targetDraft.seller.sellerName}).`
        );
        setAuthModalMode('signin');
        setIsAuthModalOpen(true);
        return;
      }

      setActiveRestoredDraft(targetDraft);
      setCheckoutBulkItems(
        targetDraft.bulkItems && targetDraft.bulkItems.length > 1 ? targetDraft.bulkItems : null
      );
      setCheckoutPackage(targetDraft.diamondPackage);
      setCheckoutSeller(targetDraft.seller);
      setCheckoutQuantity(targetDraft.quantity || 1);
      if (targetDraft.validatedAccount) {
        setVerifiedAccount(targetDraft.validatedAccount);
      }
      setIsCheckoutOpen(true);
    },
    [savedCheckoutDraft, currentUser]
  );

  const handleDiscardCheckoutDraft = useCallback(() => {
    clearCheckoutAutoDraftStorage();
    setSavedCheckoutDraft(null);
    setActiveRestoredDraft(null);
  }, []);

  // Automatically notify user on load if an unfinished checkout Auto-Draft was recovered after refresh/disconnect
  const hasNotifiedDraftRef = useRef(false);
  useEffect(() => {
    if (hasNotifiedDraftRef.current) return;
    const draft = loadCheckoutAutoDraft();
    if (draft && draft.diamondPackage && draft.seller) {
      hasNotifiedDraftRef.current = true;
      setSavedCheckoutDraft(draft);

      // If URL contains ?resumeDraft=1, open the modal automatically for signed-in user
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('resumeDraft') === '1' && currentUser) {
          handleResumeCheckoutDraft(draft);
        }
      } catch {}
    }
  }, [currentUser, handleResumeCheckoutDraft]);

  // Guarded Tab Navigation: Prevents unauthenticated users from roaming into protected account/order/mission/seller areas
  const handleGuardedTabChange = useCallback(
    (targetTab: 'buy' | 'p2p' | 'seller' | 'orders' | 'missions' | 'referrals' | 'escrow-info') => {
      if (targetTab === 'escrow-info') {
        setIsEscrowExplainerOpen(true);
        return;
      }

      const protectedTabs: Array<'seller' | 'orders' | 'missions' | 'referrals'> = [
        'seller',
        'orders',
        'missions',
        'referrals',
      ];

      if (!currentUser && protectedTabs.includes(targetTab as any)) {
        const tabLabels: Record<string, string> = {
          orders: 'view and track your Escrow Orders',
          missions: 'access Daily Missions and claim free diamond rewards',
          referrals: 'access your Refer-a-Friend link and +5% diamond bonuses',
          seller: 'access the Merchant Seller Portal',
        };
        setAuthReasonNotice(
          `Security Gate: Please sign in first to ${tabLabels[targetTab] || 'access this protected section'}.`
        );
        setAuthModalMode('signin');
        setIsAuthModalOpen(true);
        return;
      }

      if (targetTab === 'seller' && currentUser && !canSellDiamonds(currentUser)) {
        setIsVipUpgradeModalOpen(true);
        return;
      }

      if (targetTab !== activeTab) {
        triggerGlobalDataSkeleton(280);
      }
      setActiveTab(targetTab);
    },
    [currentUser, activeTab, triggerGlobalDataSkeleton]
  );

  // Partner, Publisher, Wholesale & Legal Modal States
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [isPublisherModalOpen, setIsPublisherModalOpen] = useState(false);
  const [isDistributorModalOpen, setIsDistributorModalOpen] = useState(false);
  const [isBugBountyModalOpen, setIsBugBountyModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [securityModalInitialTab, setSecurityModalInitialTab] = useState<'reseller' | 'cybersecurity' | 'sandbox'>('reseller');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalInitialTab, setLegalModalInitialTab] = useState<LegalTabType>('terms');

  const [isTimedDropModalOpen, setIsTimedDropModalOpen] = useState(false);

  const handleOpenSecurityModal = (tab: 'reseller' | 'cybersecurity' | 'sandbox' = 'reseller') => {
    setSecurityModalInitialTab(tab);
    setIsSecurityModalOpen(true);
  };

  const handleOpenLegal = (tab: LegalTabType = 'terms') => {
    setLegalModalInitialTab(tab);
    setIsLegalModalOpen(true);
  };

  // Aegis AI Assistant Widget State
  const [quickHelpSignal, setQuickHelpSignal] = useState<{
    open: boolean;
    tab: 'chat' | 'faqs';
    initialTitle?: string;
    initialDescription?: string;
    initialErrorLogs?: string;
    category?: IssueCategory;
    orderId?: string;
  } | null>(null);

  // Price Alerts State & Persistence
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_price_alerts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRICE_ALERTS;
  });

  const [priceAlertTargetPackage, setPriceAlertTargetPackage] = useState<DiamondPackage | null>(null);
  const [isPriceAlertModalOpen, setIsPriceAlertModalOpen] = useState(false);
  const [isPriceAlertsManagerOpen, setIsPriceAlertsManagerOpen] = useState(false);

  // Refer-a-Friend Modal and Invite Link Handling
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [invitedByCode, setInvitedByCode] = useState<string | null>(null);
  const [showReferralBanner, setShowReferralBanner] = useState(false);

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || urlParams.get('invite');
      if (refCode) {
        const clean = refCode.trim().toUpperCase();
        localStorage.setItem('nexus_pending_ref_code', clean);
        setInvitedByCode(clean);
        setShowReferralBanner(true);
      } else {
        const pending = localStorage.getItem('nexus_pending_ref_code');
        if (pending && !currentUser?.referredBy) {
          setInvitedByCode(pending);
          setShowReferralBanner(true);
        }
      }
    } catch {}
  }, [currentUser]);

  // Sync real-time updates to currentUser from referral rewards & profile updates
  useEffect(() => {
    const handleAuthUserUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<UserAccount>;
      if (customEvent.detail) {
        setCurrentUser(customEvent.detail);
      }
    };
    window.addEventListener('nexus_auth_user_updated', handleAuthUserUpdated);
    return () => {
      window.removeEventListener('nexus_auth_user_updated', handleAuthUserUpdated);
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexus_price_alerts', JSON.stringify(priceAlerts));
    } catch {}
  }, [priceAlerts]);

  // Real-time Notification Toasts State & 48-Hour Retention Constants
  const NOTIFICATION_RETENTION_HOURS = 48;
  const NOTIFICATION_RETENTION_MS = NOTIFICATION_RETENTION_HOURS * 60 * 60 * 1000;

  const [activeToasts, setActiveToasts] = useState<OrderToastNotification[]>([]);
  const [notificationsHistory, setNotificationsHistory] = useState<OrderToastNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_notifications_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cutoff = Date.now() - (48 * 60 * 60 * 1000);
          return parsed.filter(
            (item: OrderToastNotification) =>
              item && typeof item.timestamp === 'number' && item.timestamp >= cutoff
          );
        }
      }
    } catch {}
    return [];
  });
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Sync notificationsHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('nexus_notifications_history', JSON.stringify(notificationsHistory));
    } catch {}
  }, [notificationsHistory]);

  // Background check in App.tsx that triggers a toast notification if VIP status is <= 24 hours from expiring
  const lastNotifiedVipExpiryRef = useRef<number | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const isUserVip = isVipUser(currentUser);
    const isUserDev = isDeveloperUser(currentUser);
    if (!isUserVip && !isUserDev) return;

    const checkVipExpiryStatus = () => {
      const effectiveExpiry = currentUser.vipExpiry;
      if (!effectiveExpiry) return;

      const remainingMs = effectiveExpiry - Date.now();
      const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

      // Trigger toast notification if VIP status is within 24 hours of expiring (and not already notified for this expiry timestamp)
      if (remainingMs > 0 && remainingMs <= TWENTY_FOUR_HOURS_MS) {
        if (lastNotifiedVipExpiryRef.current === effectiveExpiry) return;
        lastNotifiedVipExpiryRef.current = effectiveExpiry;

        const hoursLeft = Math.max(1, Math.floor(remainingMs / (1000 * 60 * 60)));
        const minsLeft = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        const expiryToast: OrderToastNotification = {
          id: `vip_expiry_24h_alert_${effectiveExpiry}`,
          statusType: 'price_alert',
          title: '⚠️ VIP Membership Expiring Within 24 Hours!',
          message: `Your VIP Mythic status expires in ${hoursLeft}h ${minsLeft}m. Renew now in your Profile to keep your 50% storewide discount and daily free diamond claims active!`,
          diamonds: 172,
          sellerName: 'VIP Membership Desk',
          amount: 16.24,
          currency: currency,
          timestamp: Date.now(),
          read: false,
          savingsPct: 50,
        };

        if (soundEnabled && settings.playPriceAlertSound) {
          playPriceDropSound();
        }

        setActiveToasts((prev) => [
          expiryToast,
          ...prev.filter((t) => !t.id.startsWith('vip_expiry_24h_alert_')).slice(0, 3),
        ]);
        setNotificationsHistory((prev) => [
          expiryToast,
          ...prev.filter((t) => t.id !== expiryToast.id),
        ]);
      }
    };

    checkVipExpiryStatus();
    const intervalId = setInterval(checkVipExpiryStatus, 30000);
    return () => clearInterval(intervalId);
  }, [currentUser, currency, soundEnabled, settings.playPriceAlertSound]);

  /**
   * Cleanup function that automatically archives or deletes notifications older than 48 hours
   * to keep the notification center clutter-free.
   *
   * Expired notifications (> 48 hours old) are pruned from active history and toasts.
   * By default, expired items are archived to `nexus_archived_notifications` in localStorage
   * so they do not clutter active views while preventing permanent loss, or permanently deleted if forceDelete is specified.
   */
  const cleanupOldNotifications = useCallback(
    (options?: { forceDelete?: boolean; customCutoffMs?: number }) => {
      const retentionMs = options?.customCutoffMs ?? NOTIFICATION_RETENTION_MS;
      const cutoffTime = Date.now() - retentionMs;

      let expiredCount = 0;

      setNotificationsHistory((prev) => {
        const expired: OrderToastNotification[] = [];
        const fresh: OrderToastNotification[] = [];

        prev.forEach((item) => {
          if (!item || typeof item.timestamp !== 'number') return;
          if (item.timestamp < cutoffTime) {
            expired.push({ ...item, archived: true });
          } else {
            fresh.push(item);
          }
        });

        expiredCount = expired.length;

        if (expired.length > 0) {
          // Unless forceDelete is chosen, archive expired records to secondary store
          if (!options?.forceDelete) {
            try {
              const existingArchiveRaw = localStorage.getItem('nexus_archived_notifications');
              const existingArchive: OrderToastNotification[] = existingArchiveRaw
                ? JSON.parse(existingArchiveRaw)
                : [];
              const merged = [...expired, ...existingArchive].slice(0, 100);
              localStorage.setItem('nexus_archived_notifications', JSON.stringify(merged));
            } catch (err) {
              console.warn('Failed to save to archived notifications store:', err);
            }
          }

          // Immediately persist pruned clean list
          try {
            localStorage.setItem('nexus_notifications_history', JSON.stringify(fresh));
          } catch {}

          return fresh;
        }

        return prev;
      });

      // Also clean up any lingering active floating toasts that have passed the cutoff
      setActiveToasts((prev) => {
        const freshToasts = prev.filter(
          (t) => t && typeof t.timestamp === 'number' && t.timestamp >= cutoffTime
        );
        return freshToasts.length !== prev.length ? freshToasts : prev;
      });

      return { expiredCount };
    },
    [NOTIFICATION_RETENTION_MS]
  );

  // Continuous 48-Hour Notification Auto-Cleanup Effect:
  // Automatically prunes notifications older than 48 hours on mount,
  // whenever the tab gains visibility, and periodically every 15 minutes.
  useEffect(() => {
    cleanupOldNotifications();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cleanupOldNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = setInterval(() => {
      cleanupOldNotifications();
    }, 15 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [cleanupOldNotifications]);

  // Reference to track order status transitions & price drops
  const prevOrderStatusMap = useRef<Record<string, OrderStatus>>({});
  const prevPackageMinPrices = useRef<Record<string, number>>({});
  const isInitialMount = useRef(true);
  const isFirstMinPriceCheck = useRef(true);

  // Trigger Price Alert Notification
  const triggerPriceAlertNotification = useCallback(
    (alert: PriceAlert, seller: SellerListing, newPriceUsd: number) => {
      const pkg = packages.find((p) => p.id === alert.packageId) || {
        id: alert.packageId,
        name: alert.packageName,
        diamonds: alert.diamonds,
        bonusDiamonds: alert.bonusDiamonds,
        regularPriceUsd: +(newPriceUsd * 1.35).toFixed(2),
        discountPriceUsd: newPriceUsd,
      };

      const savingsPct =
        pkg.regularPriceUsd > 0
          ? Math.round(((pkg.regularPriceUsd - newPriceUsd) / pkg.regularPriceUsd) * 100)
          : 20;

      const newNotif: OrderToastNotification = {
        id: 'alert_notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        statusType: 'price_alert',
        title: `🔥 Price Alert: ${alert.packageName} dropped!`,
        message: `Seller ${seller.sellerName} is offering ${alert.packageName} for ${formatCurrency(
          newPriceUsd,
          currency
        )} (below your ${formatCurrency(alert.targetPriceUsd, currency)} target).`,
        diamonds: alert.diamonds,
        sellerName: seller.sellerName,
        amount: newPriceUsd,
        currency: currency,
        timestamp: Date.now(),
        read: false,
        packageId: alert.packageId,
        packageName: alert.packageName,
        targetPriceUsd: alert.targetPriceUsd,
        newPriceUsd: newPriceUsd,
        seller: seller,
        diamondPackage: pkg,
        savingsPct: savingsPct > 0 ? savingsPct : 15,
      };

      if (soundEnabled && settings.playPriceAlertSound) {
        playPriceDropSound();
      }

      setActiveToasts((prev) => [
        newNotif,
        ...prev.filter((t) => !(t.statusType === 'price_alert' && t.packageId === alert.packageId)).slice(0, 3),
      ]);
      setNotificationsHistory((prev) => [newNotif, ...prev]);

      setPriceAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? { ...a, triggerCount: (a.triggerCount || 0) + 1, lastTriggeredAt: Date.now() }
            : a
        )
      );
    },
    [currency, packages, soundEnabled, settings.playPriceAlertSound]
  );

  // Trigger Toast Notification for Orders
  const triggerNotification = useCallback((order: EscrowOrder, statusType: 'processing' | 'completed') => {
    const isProc = statusType === 'processing';
    const newNotif: OrderToastNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      orderId: order.id,
      order,
      statusType,
      title: isProc
        ? `⚡ Order ${order.id} is now Processing!`
        : `✅ Order ${order.id} Completed & Escrow Released!`,
      message: isProc
        ? `Seller ${order.sellerName} is dispatching ${order.diamonds.toLocaleString()} diamonds to ${order.mlbbIgn} (ID: ${order.mlbbUserId}) via Moonton direct protocol.`
        : `${order.diamonds.toLocaleString()} diamonds successfully verified in MLBB client. Escrow vault released ${formatCurrency(order.amount, order.currency)} to ${order.sellerName}.`,
      diamonds: order.diamonds,
      sellerName: order.sellerName,
      ign: order.mlbbIgn,
      amount: order.amount,
      currency: order.currency,
      timestamp: Date.now(),
      read: false,
    };

    if (soundEnabled && settings.playOrderSuccessSound) {
      playOrderNotificationSound(statusType);
    }

    setActiveToasts((prev) => [
      newNotif,
      ...prev.filter((t) => !(t.orderId === order.id && t.statusType === statusType)).slice(0, 3)
    ]);
    setNotificationsHistory((prev) => [newNotif, ...prev]);
  }, [soundEnabled, settings.playOrderSuccessSound]);

  // Monitor order status transitions in real time
  useEffect(() => {
    if (isInitialMount.current) {
      orders.forEach((o) => {
        prevOrderStatusMap.current[o.id] = o.status;
      });
      isInitialMount.current = false;
      return;
    }

    orders.forEach((o) => {
      const prevStatus = prevOrderStatusMap.current[o.id];
      if (prevStatus && prevStatus !== o.status) {
        if (o.status === 'seller_processing') {
          triggerNotification(o, 'processing');
        } else if (o.status === 'completed') {
          triggerNotification(o, 'completed');
          triggerOrderCompletedConfetti();
        }
      }
      prevOrderStatusMap.current[o.id] = o.status;
    });
  }, [orders, triggerNotification]);

  // 24-Hour Buyer Auto-Pay / Auto-Release Background Protocol:
  // Automatically charges the buyer's linked payment method & locks escrow (or settles delivered orders)
  // if the buyer doesn't pay within 24 hours (autoPayDeadlineAt <= Date.now()).
  useEffect(() => {
    const checkAutoPay24hDeadlines = () => {
      const now = Date.now();
      const currentOrders = ordersRef.current;
      if (!Array.isArray(currentOrders) || currentOrders.length === 0) return;

      let hasChanges = false;
      const toastsToAdd: OrderToastNotification[] = [];

      const nextOrders = currentOrders.map((ord) => {
        if (!ord || ord.autoPay24hEnabled === false) return ord;
        const deadline =
          ord.autoPayDeadlineAt || (ord.createdAt ? ord.createdAt + 24 * 60 * 60 * 1000 : 0);
        if (!deadline || now < deadline) return ord;

        const safeMethod = ord.paymentMethod || 'gcash';
        const methodUpper = typeof safeMethod === 'string' ? safeMethod.toUpperCase() : 'GCASH';
        const safeDiamonds = typeof ord.diamonds === 'number' ? ord.diamonds : 0;
        const safeAmount = typeof ord.amount === 'number' ? ord.amount : 0;
        const safeCurrency = ord.currency || 'PHP';
        const safeSellerName = ord.sellerName || 'Verified Merchant';

        // Case 1: Buyer hasn't paid within 24 hours while order is in 'escrow_pending'
        if (ord.status === 'escrow_pending' && !ord.autoPayTriggered) {
          hasChanges = true;
          const autoPaidOrder: EscrowOrder = {
            ...ord,
            status: 'escrow_locked',
            escrowLockedAt: now,
            autoPaidAt: now,
            autoPayTriggered: true,
            autoPay24hEnabled: true,
            autoReleaseMinutesRemaining: 15,
            chatMessages: [
              ...(ord.chatMessages || []),
              {
                id: 'msg_autopay_24h_' + now + '_' + ord.id,
                sender: 'system',
                senderName: 'Nexus Shop 24h Auto-Pay Engine',
                text: `⚡ 24-Hour Buyer Payment Window Expired: Auto-Pay Protocol automatically charged ${formatCurrency(
                  safeAmount,
                  safeCurrency,
                  ord.amountPhp
                )} via ${methodUpper} and locked funds in Aegis Escrow Vault. Seller ${safeSellerName} has been notified to dispatch ${safeDiamonds.toLocaleString()} Diamonds.`,
                timestamp: now,
              },
            ],
          };

          const autoPayToast: OrderToastNotification = {
            id: 'toast_autopay_24h_' + now + '_' + ord.id,
            orderId: ord.id,
            order: autoPaidOrder,
            statusType: 'processing',
            title: `⚡ 24h Auto-Pay Triggered (#${ord.id})`,
            message: `Buyer did not pay within 24 hours. ${formatCurrency(
              safeAmount,
              safeCurrency,
              ord.amountPhp
            )} was automatically paid via ${methodUpper} and locked in Escrow Vault!`,
            diamonds: safeDiamonds,
            sellerName: safeSellerName,
            ign: ord.mlbbIgn,
            amount: safeAmount,
            currency: safeCurrency,
            timestamp: now,
            read: false,
          };
          toastsToAdd.push(autoPayToast);

          return autoPaidOrder;
        }

        // Case 2: Seller delivered diamonds and buyer hasn't confirmed/settled within 24 hours
        if (ord.status === 'delivered_pending_confirmation' && !ord.autoPayTriggered) {
          hasChanges = true;
          const autoSettledOrder: EscrowOrder = {
            ...ord,
            status: 'completed',
            completedAt: now,
            autoPaidAt: now,
            autoPayTriggered: true,
            autoPay24hEnabled: true,
            autoReleaseMinutesRemaining: 0,
            chatMessages: [
              ...(ord.chatMessages || []),
              {
                id: 'msg_autorelease_24h_' + now + '_' + ord.id,
                sender: 'system',
                senderName: 'Nexus Shop 24h Auto-Pay Engine',
                text: `⚡ 24-Hour Buyer Confirmation Window Expired: Auto-Pay Settlement automatically released ${formatCurrency(
                  safeAmount,
                  safeCurrency,
                  ord.amountPhp
                )} from Aegis Escrow Vault to seller ${safeSellerName}.`,
                timestamp: now,
              },
            ],
          };
          return autoSettledOrder;
        }

        return ord;
      });

      if (hasChanges) {
        setOrders(nextOrders);

        if (toastsToAdd.length > 0) {
          setActiveToasts((prev) => [...toastsToAdd, ...prev.slice(0, 3)]);
          setNotificationsHistory((prev) => [...toastsToAdd, ...prev]);
        }

        setSelectedOrderForTracking((prevSelected) => {
          if (!prevSelected) return null;
          return nextOrders.find((o) => o.id === prevSelected.id) || prevSelected;
        });
      }
    };

    const intervalId = window.setInterval(checkAutoPay24hDeadlines, 2000);
    return () => window.clearInterval(intervalId);
  }, []);

  // Monitor seller listing prices against active price alerts
  useEffect(() => {
    const currentMinPrices: Record<string, { minPrice: number; bestSeller: SellerListing }> = {};
    sellers.forEach((s) => {
      if (!currentMinPrices[s.packageId] || s.priceUsd < currentMinPrices[s.packageId].minPrice) {
        currentMinPrices[s.packageId] = { minPrice: s.priceUsd, bestSeller: s };
      }
    });

    // On initial mount, initialize tracked prices without triggering spurious alerts
    if (isFirstMinPriceCheck.current) {
      isFirstMinPriceCheck.current = false;
      Object.entries(currentMinPrices).forEach(([pkgId, data]) => {
        prevPackageMinPrices.current[pkgId] = data.minPrice;
      });
      return;
    }

    // Check price alerts against current lowest seller prices
    priceAlerts.forEach((alert) => {
      if (!alert.isActive) return;
      const marketData = currentMinPrices[alert.packageId];
      if (!marketData) return;

      const prevMin = prevPackageMinPrices.current[alert.packageId];
      // If price dropped or newly lowered below target
      if (
        marketData.minPrice <= alert.targetPriceUsd &&
        (prevMin === undefined || marketData.minPrice < prevMin)
      ) {
        triggerPriceAlertNotification(alert, marketData.bestSeller, marketData.minPrice);
      }
    });

    // Update tracked minimum prices per package
    Object.entries(currentMinPrices).forEach(([pkgId, data]) => {
      prevPackageMinPrices.current[pkgId] = data.minPrice;
    });
  }, [sellers, priceAlerts, triggerPriceAlertNotification]);

  // Browser Language / Locale Detection Effect on First Load:
  // Detects the user's browser language/locale to suggest and initialize the default currency,
  // while strictly respecting any existing user override in settings.
  const hasCheckedLocaleCurrency = useRef(false);
  useEffect(() => {
    if (hasCheckedLocaleCurrency.current) return;
    hasCheckedLocaleCurrency.current = true;

    try {
      const explicitSaved = localStorage.getItem('nexus_app_settings');
      // If user has explicitly saved settings with their preferred currency, respect it and do not overwrite
      if (explicitSaved) {
        const parsed = JSON.parse(explicitSaved);
        if (parsed && parsed.currency) {
          return;
        }
      }

      // Check if user previously acknowledged or customized currency preference
      const hasCustomizedCurrency = localStorage.getItem('nexus_currency_customized');
      if (hasCustomizedCurrency) return;

      const suggestion: LocaleCurrencySuggestion | null = detectLocaleCurrency();
      if (suggestion && suggestion.currency) {
        // Update currency state and settings to the browser-detected suggestion
        setCurrency(suggestion.currency);
        setSettings((prev) => ({ ...prev, currency: suggestion.currency }));

        // Notify the user of the auto-detected currency with guidance that they can override it anytime
        const localeToast: OrderToastNotification = {
          id: 'locale_currency_suggestion_' + Date.now(),
          title: `${suggestion.flag} Locale Detected: ${suggestion.country}`,
          message: `Regional pricing defaulted to ${suggestion.symbol} ${suggestion.currency} based on your browser locale (${suggestion.sourceLocale}). You can change or override this anytime in Settings or the Navbar country dropdown.`,
          statusType: 'processing',
          diamonds: 0,
          sellerName: 'Nexus Shop Regional Gateway',
          amount: 0,
          currency: suggestion.currency,
          timestamp: Date.now(),
          read: false,
        };

        setActiveToasts((prev) => [localeToast, ...prev]);
        setNotificationsHistory((prev) => [localeToast, ...prev]);
      }
    } catch (e) {
      console.warn('Locale currency auto-detection failed gracefully:', e);
    }
  }, []);

  // Handlers
  const handleSavePriceAlert = (newOrUpdatedAlert: PriceAlert) => {
    setPriceAlerts((prev) => {
      const exists = prev.some((a) => a.id === newOrUpdatedAlert.id);
      if (exists) {
        return prev.map((a) => (a.id === newOrUpdatedAlert.id ? newOrUpdatedAlert : a));
      }
      return [newOrUpdatedAlert, ...prev];
    });

    // Check if the current market already meets or beats the alert target price
    const packageSellers = sellers.filter((s) => s.packageId === newOrUpdatedAlert.packageId);
    if (packageSellers.length > 0) {
      const best = packageSellers.reduce((min, s) => (s.priceUsd < min.priceUsd ? s : min), packageSellers[0]);
      if (best.priceUsd <= newOrUpdatedAlert.targetPriceUsd) {
        setTimeout(() => {
          triggerPriceAlertNotification(newOrUpdatedAlert, best, best.priceUsd);
        }, 400);
      }
    }
  };

  const handleDeletePriceAlert = (alertId: string) => {
    setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const handleToggleActivePriceAlert = (alertId: string) => {
    setPriceAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const handleOpenPriceAlertModal = (pkg: DiamondPackage) => {
    setPriceAlertTargetPackage(pkg);
    setIsPriceAlertModalOpen(true);
  };

  const handleSimulatePriceDrop = (packageId?: string, customPriceUsd?: number) => {
    const targetPkgId = packageId || priceAlerts[0]?.packageId || 'pkg_wdp';
    const matchedAlert = priceAlerts.find((a) => a.packageId === targetPkgId);
    const targetPkg = packages.find((p) => p.id === targetPkgId) || packages[0];

    const targetAlertPrice = matchedAlert ? matchedAlert.targetPriceUsd : targetPkg.discountPriceUsd * 0.9;
    const dropPrice = customPriceUsd !== undefined
      ? +customPriceUsd.toFixed(2)
      : +(targetAlertPrice * 0.94).toFixed(2);

    // Update or inject seller listing with lower price
    let updatedSeller: SellerListing;
    const existingIndex = sellers.findIndex((s) => s.packageId === targetPkgId);

    if (existingIndex >= 0) {
      updatedSeller = {
        ...sellers[existingIndex],
        priceUsd: dropPrice,
      };
      setSellers((prev) => {
        const next = [...prev];
        next[existingIndex] = updatedSeller;
        return next;
      });
    } else {
      updatedSeller = {
        id: 'listing_flash_' + Date.now(),
        sellerId: 'sel_flash_deals',
        sellerName: 'FlashDeals_Direct',
        sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=FlashDeals&backgroundColor=0284c7',
        sellerRating: 4.99,
        totalOrders: 11200,
        avgDeliveryMinutes: 2,
        packageId: targetPkgId,
        diamonds: targetPkg.diamonds,
        priceUsd: dropPrice,
        stock: 450,
        instantAutoDelivery: true,
        acceptedPaymentMethods: ['gcash', 'maya', 'paypal', 'bank_transfer'],
        isProSeller: true,
        completionRate: 99.8,
      };
      setSellers((prev) => [updatedSeller, ...prev]);
    }

    const alertToFire = matchedAlert || {
      id: 'alert_quick_' + Date.now(),
      packageId: targetPkgId,
      packageName: targetPkg.name,
      diamonds: targetPkg.diamonds,
      bonusDiamonds: targetPkg.bonusDiamonds,
      targetPriceUsd: +(dropPrice * 1.05).toFixed(2),
      targetCurrency: currency,
      createdAt: Date.now(),
      isActive: true,
      triggerCount: 0,
    };

    triggerPriceAlertNotification(alertToFire, updatedSeller, dropPrice);
  };
  const handleSelectPackageToBuy = (pkg: DiamondPackage, seller: SellerListing, quantity: number = 1) => {
    // Save immediate Auto-Draft to localStorage even before auth so refresh mid-signin never loses selection
    const preDraft: CheckoutAutoDraft = {
      id: `draft_${pkg.id}_${seller.sellerId}`,
      diamondPackage: pkg,
      seller,
      quantity,
      bulkItems: null,
      userIdInput: verifiedAccount?.userId || currentUser?.mlbbUserId || '84729103',
      zoneIdInput: verifiedAccount?.zoneId || currentUser?.mlbbZoneId || '3092',
      validatedAccount: verifiedAccount,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(CHECKOUT_AUTO_DRAFT_KEY, JSON.stringify(preDraft));
      setSavedCheckoutDraft(preDraft);
    } catch {}

    // Escrow Enforcement: Users must sign in first before they can order with escrow
    if (!currentUser) {
      setPendingOrderAfterAuth({ pkg, seller, quantity });
      setAuthReasonNotice(
        `First of all, you need to sign in so you can order with Escrow (${quantity > 1 ? `${quantity}x ` : ''}${pkg.name}). Your selection has been saved to Auto-Draft.`
      );
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveRestoredDraft(null);
    setCheckoutBulkItems(null);
    setCheckoutPackage(pkg);
    setCheckoutSeller(seller);
    setCheckoutQuantity(quantity);
    setIsCheckoutOpen(true);
  };

  const handleBuyFromSeller = (seller: SellerListing, pkg: DiamondPackage, quantity: number = 1) => {
    const preDraft: CheckoutAutoDraft = {
      id: `draft_${pkg.id}_${seller.sellerId}`,
      diamondPackage: pkg,
      seller,
      quantity,
      bulkItems: null,
      userIdInput: verifiedAccount?.userId || currentUser?.mlbbUserId || '84729103',
      zoneIdInput: verifiedAccount?.zoneId || currentUser?.mlbbZoneId || '3092',
      validatedAccount: verifiedAccount,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(CHECKOUT_AUTO_DRAFT_KEY, JSON.stringify(preDraft));
      setSavedCheckoutDraft(preDraft);
    } catch {}

    // Escrow Enforcement: Users must sign in first before they can order with escrow
    if (!currentUser) {
      setPendingOrderAfterAuth({ pkg, seller, quantity });
      setAuthReasonNotice(
        `First of all, you need to sign in so you can order with Escrow from ${seller.sellerName}. Your selection has been saved to Auto-Draft.`
      );
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveRestoredDraft(null);
    setCheckoutBulkItems(null);
    setCheckoutPackage(pkg);
    setCheckoutSeller(seller);
    setCheckoutQuantity(quantity);
    setIsCheckoutOpen(true);
  };

  const handleInitiateBulkCheckout = (items: { package: DiamondPackage; seller: SellerListing; quantity: number }[]) => {
    if (!items || items.length === 0) return;
    const preDraft: CheckoutAutoDraft = {
      id: `draft_bulk_${items[0].package.id}`,
      diamondPackage: items[0].package,
      seller: items[0].seller,
      quantity: items[0].quantity,
      bulkItems: items,
      userIdInput: verifiedAccount?.userId || currentUser?.mlbbUserId || '84729103',
      zoneIdInput: verifiedAccount?.zoneId || currentUser?.mlbbZoneId || '3092',
      validatedAccount: verifiedAccount,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(CHECKOUT_AUTO_DRAFT_KEY, JSON.stringify(preDraft));
      setSavedCheckoutDraft(preDraft);
    } catch {}

    if (!currentUser) {
      setAuthReasonNotice('First of all, you need to sign in so you can order bulk packages with Escrow. Your bulk bundle has been saved to Auto-Draft.');
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveRestoredDraft(null);
    setCheckoutBulkItems(items);
    setCheckoutPackage(items[0].package);
    setCheckoutSeller(items[0].seller);
    setCheckoutQuantity(items[0].quantity);
    setIsCheckoutOpen(true);
  };

  const handleOrderCreated = (newOrder: EscrowOrder) => {
    clearCheckoutAutoDraftStorage();
    setSavedCheckoutDraft(null);
    setActiveRestoredDraft(null);
    setOrders((prev) => [newOrder, ...prev]);
    setIsCheckoutOpen(false);
    setCheckoutBulkItems(null);
    setSelectedOrderForTracking(newOrder);
    setActiveTab('orders');

    // Decrement seller inventory in real time
    if (newOrder.packageId) {
      setSellers((prev) =>
        prev.map((s) => {
          if (
            s.id === newOrder.sellerId ||
            (s.packageId === newOrder.packageId && s.sellerName === newOrder.sellerName)
          ) {
            return {
              ...s,
              stock: Math.max(0, s.stock - (checkoutQuantity || 1)),
            };
          }
          return s;
        })
      );
    }

    // Automatically update buyer's lifetime total diamond purchases & calculate new loyalty status
    if (currentUser) {
      const orderDiamonds = (newOrder.diamonds || 0) + (newOrder.bonusDiamonds || 0);
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updatedDiamonds = (prev.totalDiamondsPurchased || 0) + orderDiamonds;
        const newTier = calculateLoyaltyTier(updatedDiamonds);
        return {
          ...prev,
          totalDiamondsPurchased: updatedDiamonds,
          totalOrdersCount: (prev.totalOrdersCount || 0) + 1,
          loyaltyTier: newTier.id,
          loyaltyDiscountPercent: newTier.discountPercent,
        };
      });

      // Update VIP Free Diamond Claims & Cooldown (Only 172 💎, limit 2, 24h wait)
      if (isVipUser(currentUser) && !isDeveloperUser(currentUser)) {
        const isVipFreeClaimOrder =
          newOrder.diamonds === 172 &&
          (newOrder.paymentReference?.startsWith('VIP-FREE-GRANT-') ||
            newOrder.amount === 0 ||
            newOrder.paymentMethod === 'wallet');

        if (isVipFreeClaimOrder) {
          setCurrentUser((prev) => {
            if (!prev) return null;
            const currentCount = prev.vipFreeClaimCount || 0;
            const nextCount = currentCount + 1;
            const updated: UserAccount = {
              ...prev,
              vipFreeClaimCount: nextCount,
              vipLastFreeClaimTimestamp: Date.now(),
            };
            try {
              localStorage.setItem('nexus_mock_user', JSON.stringify(updated));
              localStorage.setItem('nexus_current_user', JSON.stringify(updated));
              localStorage.setItem('nexus_auth_user', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }
    }

    // Real-time seller simulation:
    // Seller detects the locked escrow and begins processing top-up after 3.5 seconds
    setTimeout(() => {
      setOrders((currentOrders) =>
        currentOrders.map((ord) => {
          if (ord.id === newOrder.id && ord.status === 'escrow_locked') {
            return {
              ...ord,
              status: 'seller_processing' as OrderStatus,
              sellerStartedAt: Date.now(),
              chatMessages: [
                ...(Array.isArray(ord.chatMessages) ? ord.chatMessages : []),
                {
                  id: 'msg_proc_' + Date.now(),
                  sender: 'seller' as const,
                  senderName: ord.sellerName,
                  text: `Payment secured in Aegis Vault! I have initiated direct Moonton top-up for ${ord.mlbbIgn}. Diamonds will credit shortly.`,
                  timestamp: Date.now(),
                }
              ]
            };
          }
          return ord;
        })
      );
    }, 3500);
  };

  const handleVipUpgradeSuccess = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
    setUserRole('seller'); // User can now sell diamonds in seller portal
    try {
      localStorage.setItem('nexus_mock_user', JSON.stringify(updatedUser));
      localStorage.setItem('nexus_current_user', JSON.stringify(updatedUser));
      localStorage.setItem('nexus_auth_user', JSON.stringify(updatedUser));
      localStorage.setItem('nexus_user_has_signed_in', 'true');
    } catch {}

    const newToast: OrderToastNotification = {
      id: 'vip_upgraded_' + Date.now(),
      title: '👑 VIP Mythic Activated!',
      message: 'Congratulations! You unlocked free 172 diamonds (limit 2, with 1 day cooldown), 50% discount on all diamond purchases, official VIP badge, and seller portal clearance.',
      statusType: 'completed',
      diamonds: 0,
      sellerName: 'Nexus Shop VIP Vault',
      amount: 950,
      currency: 'PHP',
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
  };

  const handleUpdateOrder = (updated: EscrowOrder) => {
    const prevOrder = orders.find((o) => o.id === updated.id);
    if (updated.status === 'completed' && prevOrder?.status !== 'completed') {
      triggerOrderCompletedConfetti({ force: true });

      // Refer-a-Friend 5% Dual Diamond Bonus Check
      if (!updated.referralProcessed && (updated.referralCodeApplied || currentUser?.referredBy)) {
        try {
          const refResult = processOrderReferralCompletion(updated, currentUser);
          updated.referralProcessed = true;
          updated.referralBonusDiamondsBuyer = refResult.bonusDiamonds;
          updated.referralBonusDiamondsReferrer = refResult.bonusDiamonds;

          // Play celebratory audio fanfare
          playReferralBonusSound();

          // Credit currentUser if buyer
          if (currentUser) {
            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    totalDiamondsPurchased: prev.totalDiamondsPurchased + refResult.bonusDiamonds,
                    referralBonusDiamonds: (prev.referralBonusDiamonds || 0) + refResult.bonusDiamonds,
                  }
                : null
            );
          }

          // Push celebratory toast notification
          const refToast: OrderToastNotification = {
            id: 'toast_ref_bonus_' + Date.now(),
            orderId: updated.id,
            title: '🎁 5% Refer-a-Friend Bonus Awarded!',
            message: `Order #${updated.id} completed! Both you and your inviter were credited +${refResult.bonusDiamonds} Bonus Diamonds (5%)!`,
            statusType: 'completed',
            diamonds: refResult.bonusDiamonds,
            sellerName: 'Refer-a-Friend Protocol',
            amount: 0,
            currency,
            timestamp: Date.now(),
            read: false,
          };
          setActiveToasts((prev) => [refToast, ...prev]);
          setNotificationsHistory((prev) => [refToast, ...prev]);
        } catch (err) {
          console.error('Failed to process referral bonus:', err);
        }
      }
    }

    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    setSelectedOrderForTracking((prev) => (prev?.id === updated.id ? updated : prev));

    // If completed, adjust seller balances
    if (updated.status === 'completed') {
      setSellerProfile((prev) => ({
        ...prev,
        availableBalanceUsd: prev.availableBalanceUsd + updated.amount,
        escrowLockedBalanceUsd: Math.max(0, prev.escrowLockedBalanceUsd - updated.amount),
        totalEarnedUsd: prev.totalEarnedUsd + updated.amount,
        totalSales: prev.totalSales + 1,
      }));
    }
  };

  // Buyer Cancels Order -> Escrow Refunded and order is LITERALLY GONE from ledger for cleanliness
  const handleCancelOrder = (orderId: string, reason?: string, notes?: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const amountToRefund = targetOrder ? targetOrder.amount : 0;
    const paymentName = targetOrder?.paymentMethod ? targetOrder.paymentMethod.toUpperCase() : 'account';

    // Remove the order immediately from state & localStorage so it is completely gone
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setSelectedOrderForTracking(null);
    setOpenCancelModalOnTracker(false);

    const cancelReasonText = reason ? ` (${reason})` : '';
    const cancelToast: OrderToastNotification = {
      id: 'toast_cancel_' + Date.now(),
      orderId,
      title: '🚫 Order Cancelled & Removed',
      message: `Order #${orderId} was cancelled${cancelReasonText}. 100% escrow refund (${formatCurrency(
        amountToRefund,
        currency
      )}) was returned to your ${paymentName}. The order has been completely purged from your history for cleanliness.`,
      statusType: 'cancelled',
      diamonds: targetOrder?.diamonds || 0,
      sellerName: targetOrder?.sellerName || 'Escrow Vault',
      amount: amountToRefund,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };

    setActiveToasts((prev) => [cancelToast, ...prev]);
    setNotificationsHistory((prev) => [cancelToast, ...prev]);

    if (soundEnabled && settings.playOrderSuccessSound) {
      playOrderNotificationSound('cancelled');
    }
  };

  // Delete a single finished order for cleanliness
  const handleDeleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (selectedOrderForTracking?.id === orderId) {
      setSelectedOrderForTracking(null);
    }
    const delToast: OrderToastNotification = {
      id: 'toast_del_' + Date.now(),
      orderId,
      title: 'Order Removed from History',
      message: `Order #${orderId} was purged from your transaction ledger for cleanliness.`,
      statusType: 'cancelled',
      diamonds: 0,
      sellerName: 'Ledger Cleaner',
      amount: 0,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [delToast, ...prev]);
  };

  // Restore a single dismissed order (Undo swipe-to-dismiss)
  const handleRestoreSingleOrder = (restoredOrder: EscrowOrder) => {
    setOrders((prev) => {
      if (prev.some((o) => o.id === restoredOrder.id)) return prev;
      return [restoredOrder, ...prev].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    });
    const undoToast: OrderToastNotification = {
      id: 'toast_undo_del_' + Date.now(),
      orderId: restoredOrder.id,
      title: 'Order Restored to Ledger',
      message: `Order #${restoredOrder.id} (${restoredOrder.packageName}) was restored to your transaction history.`,
      statusType: 'completed',
      diamonds: restoredOrder.diamonds,
      sellerName: restoredOrder.sellerName,
      amount: restoredOrder.amount,
      currency: restoredOrder.currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [undoToast, ...prev]);
  };

  // Bulk clean orders (cancelled, completed, finished, or all)
  const handleClearOrders = (mode: 'cancelled' | 'completed' | 'finished' | 'all') => {
    let clearedCount = 0;
    setOrders((prev) => {
      let remaining: EscrowOrder[] = [];
      if (mode === 'cancelled') {
        clearedCount = prev.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length;
        remaining = prev.filter((o) => o.status !== 'cancelled' && o.status !== 'refunded');
      } else if (mode === 'completed') {
        clearedCount = prev.filter((o) => o.status === 'completed').length;
        remaining = prev.filter((o) => o.status !== 'completed');
      } else if (mode === 'finished') {
        clearedCount = prev.filter(
          (o) => o.status === 'completed' || o.status === 'cancelled' || o.status === 'refunded'
        ).length;
        remaining = prev.filter(
          (o) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'refunded'
        );
      } else if (mode === 'all') {
        clearedCount = prev.length;
        remaining = [];
      }
      return remaining;
    });

    setSelectedOrderForTracking(null);

    const modeLabels: Record<string, string> = {
      cancelled: 'All cancelled orders',
      completed: 'All completed orders',
      finished: 'All finished transactions',
      all: 'Entire transaction history',
    };

    const cleanToast: OrderToastNotification = {
      id: 'toast_clean_' + Date.now(),
      orderId: 'CLEAN',
      title: 'Order History Cleaned! ✨',
      message: `${modeLabels[mode]} (${clearedCount} order${clearedCount === 1 ? '' : 's'}) cleared from your ledger for spotless cleanliness.`,
      statusType: 'completed',
      diamonds: 0,
      sellerName: 'Ledger Cleaner',
      amount: 0,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [cleanToast, ...prev]);
    setNotificationsHistory((prev) => [cleanToast, ...prev]);
  };

  // Restore sample demo orders
  const handleRestoreSampleOrders = () => {
    triggerGlobalDataSkeleton(340);
    setOrders(INITIAL_ORDERS);
    const restoreToast: OrderToastNotification = {
      id: 'toast_restore_' + Date.now(),
      orderId: 'RESTORE',
      title: 'Sample Orders Restored',
      message: 'Demo transaction records and escrow orders have been reloaded.',
      statusType: 'completed',
      diamonds: 0,
      sellerName: 'Demo Store',
      amount: 0,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [restoreToast, ...prev]);
  };

  const handleFeedbackSubmit = (orderId: string, feedback: OrderFeedback) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updated: EscrowOrder = {
            ...o,
            feedback,
            chatMessages: [
              ...(Array.isArray(o.chatMessages) ? o.chatMessages : []),
              {
                id: 'msg_feedback_' + Date.now(),
                sender: 'system',
                senderName: 'Nexus Shop Escrow Bot',
                text: `⭐ Verified Buyer Rating: ${feedback.rating}/5 Stars! ${feedback.review ? `"${feedback.review}" ` : ''}${feedback.tags?.length ? `[${feedback.tags.join(', ')}] ` : ''}Recorded on ${o.sellerName}'s P2P Marketplace scorecard.`,
                timestamp: Date.now(),
              }
            ]
          };
          if (selectedOrderForTracking?.id === orderId) {
            setSelectedOrderForTracking(updated);
          }
          return updated;
        }
        return o;
      })
    );
  };

  const handleDismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSimulateStatusChange = (statusType: 'processing' | 'completed') => {
    const targetStatus: OrderStatus =
      statusType === 'processing' ? 'seller_processing' : 'completed';

    // Find an order to transition
    const targetOrder = orders.find((o) => o.status !== targetStatus) || orders[0];

    if (targetOrder) {
      const updated: EscrowOrder = {
        ...targetOrder,
        status: targetStatus,
        completedAt: targetStatus === 'completed' ? Date.now() : targetOrder.completedAt,
        sellerStartedAt: targetStatus === 'seller_processing' ? Date.now() : targetOrder.sellerStartedAt,
        chatMessages: [
          ...(Array.isArray(targetOrder.chatMessages) ? targetOrder.chatMessages : []),
          {
            id: 'msg_sim_' + Date.now(),
            sender: targetStatus === 'completed' ? 'system' : 'seller',
            senderName: targetStatus === 'completed' ? 'Nexus Shop Escrow Bot' : targetOrder.sellerName,
            text:
              targetStatus === 'completed'
                ? `Diamonds verified in MLBB client. Escrow funds released to seller!`
                : `Seller started direct Moonton top-up for player ${targetOrder.mlbbIgn}.`,
            timestamp: Date.now(),
          }
        ]
      };
      handleUpdateOrder(updated);
    }
  };

  const handleAddSellerListing = (newListing: SellerListing) => {
    setSellers((prev) => [newListing, ...prev]);
    setActiveTab('p2p');
  };

  const handleSelectQuickCalculatorAmount = (amount: number) => {
    const matched = packages.find((p) => p.diamonds === amount);
    if (matched) {
      handleSelectPackageToBuy(matched, sellers[0]);
    } else {
      const customPkg: DiamondPackage = {
        id: 'pkg_custom_' + amount,
        name: `${amount.toLocaleString()} Custom Diamonds`,
        diamonds: amount,
        bonusDiamonds: Math.round(amount * 0.1),
        regularPriceUsd: +(amount * 0.0212).toFixed(2),
        discountPriceUsd: +(amount * 0.0158).toFixed(2),
      };
      handleSelectPackageToBuy(customPkg, sellers[0]);
    }
  };

  const handleAuthSuccess = (account: UserAccount, mode: 'signin' | 'signup' | boolean) => {
    const isSignUp = mode === 'signup' || mode === true;
    setCurrentUser(account);
    try {
      localStorage.setItem('nexus_user_has_signed_in', 'true');
      localStorage.setItem('nexus_auth_user', JSON.stringify(account));
      saveAccountToHistory(account);
    } catch {}
    if (account.preferredCurrency) {
      setCurrency(account.preferredCurrency);
    }
    if (account.mlbbUserId && account.mlbbZoneId) {
      const mlbbAcc = lookupOrGenerateMlbbAccount(account.mlbbUserId, account.mlbbZoneId);
      setVerifiedAccount(mlbbAcc);
    }

    // Auto-continue to order if user was interrupted to sign in
    if (pendingOrderAfterAuth) {
      const pending = pendingOrderAfterAuth;
      setPendingOrderAfterAuth(null);
      setAuthReasonNotice('');
      setCheckoutPackage(pending.pkg);
      setCheckoutSeller(pending.seller);
      setCheckoutQuantity(pending.quantity);
      setIsCheckoutOpen(true);

      const continueToast: OrderToastNotification = {
        id: 'toast_auth_cont_' + Date.now(),
        orderId: 'ESCROW',
        title: 'Signed in! Opening Escrow Checkout',
        message: `Welcome ${account.name}! Now continuing your Escrow order for ${pending.pkg.name}.`,
        statusType: 'completed',
        diamonds: pending.pkg.diamonds,
        sellerName: pending.seller.sellerName,
        amount: pending.pkg.discountPriceUsd * pending.quantity,
        currency: currency,
        timestamp: Date.now(),
        read: false,
      };
      setActiveToasts((prev) => [continueToast, ...prev]);
      setNotificationsHistory((prev) => [continueToast, ...prev]);
    } else {
      const toastTitle = isSignUp ? 'Account created successfully' : 'You signed in successfully';

      const newToast: OrderToastNotification = {
        id: 'toast_auth_' + Date.now(),
        orderId: 'AUTH',
        title: toastTitle,
        message: 'Escrow protection active. You can now order diamonds with 100% money-back guarantee.',
        statusType: 'completed',
        diamonds: 0,
        sellerName: 'System',
        amount: 0,
        currency: currency,
        timestamp: Date.now(),
        read: false,
      };
      setActiveToasts((prev) => [newToast, ...prev]);
      setNotificationsHistory((prev) => [newToast, ...prev]);
    }

    if (soundEnabled && settings.playOrderSuccessSound) {
      playOrderNotificationSound('completed');
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setUserRole('buyer');
    if (activeTab !== 'buy' && activeTab !== 'p2p') {
      setActiveTab('buy');
    }
    try {
      localStorage.removeItem('nexus_auth_user');
      localStorage.removeItem('nexus_user_has_signed_in');
    } catch {}
    const newToast: OrderToastNotification = {
      id: 'toast_auth_' + Date.now(),
      orderId: 'AUTH',
      title: 'You signed out',
      message: 'Sign in whenever you are ready to order diamonds with Escrow protection.',
      statusType: 'completed',
      diamonds: 0,
      sellerName: 'System',
      amount: 0,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
    saveAccountToHistory(updatedUser);
    if (updatedUser.preferredPaymentMethod && updatedUser.preferredPaymentMethod !== settings.defaultPaymentMethod) {
      setSettings((prev) => {
        const next = { ...prev, defaultPaymentMethod: updatedUser.preferredPaymentMethod! };
        try {
          localStorage.setItem('nexus_app_settings', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    setCurrency(newSettings.currency);
    setSoundEnabled(newSettings.soundEnabled);
    try {
      localStorage.setItem('nexus_app_settings', JSON.stringify(newSettings));
    } catch {}

    const newToast: OrderToastNotification = {
      id: 'toast_settings_' + Date.now(),
      orderId: 'SETTINGS',
      title: 'Preferences Updated',
      message: `Settings saved. Theme: ${newSettings.theme.replace('_', ' ')} (${newSettings.bgEffect.replace('_', ' ')} with ${newSettings.bgGlowColor} glow), Currency: ${newSettings.currency}.`,
      statusType: 'completed',
      diamonds: 0,
      sellerName: 'Nexus Shop System Config',
      amount: 0,
      currency: newSettings.currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
    if (newSettings.soundEnabled) {
      playOrderNotificationSound('completed');
    }
  };

  const handleToggleMute = useCallback(() => {
    const nextSound = !soundEnabled;
    setSoundEnabled(nextSound);
    setSettings((prev) => {
      const updated = { ...prev, soundEnabled: nextSound };
      try {
        localStorage.setItem('nexus_app_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const muteToast: OrderToastNotification = {
      id: 'toast_mute_' + Date.now(),
      title: nextSound ? '🔊 Audio Unmuted' : '🔇 Audio Muted',
      message: nextSound
        ? 'Synthesizer sound effects, chimes, and haptic audio cues are now active.'
        : 'All sound effects, escrow milestone chimes, and alert pings have been silenced.',
      statusType: nextSound ? 'completed' : 'processing',
      diamonds: 0,
      sellerName: 'Nexus Shop Audio Engine',
      amount: 0,
      currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [muteToast, ...prev]);
    setNotificationsHistory((prev) => [muteToast, ...prev]);
  }, [soundEnabled, currency]);

  const handleResetSettings = () => {
    setSettings(DEFAULT_APP_SETTINGS);
    setCurrency(DEFAULT_APP_SETTINGS.currency);
    setSoundEnabled(DEFAULT_APP_SETTINGS.soundEnabled);
    try {
      localStorage.setItem('nexus_app_settings', JSON.stringify(DEFAULT_APP_SETTINGS));
    } catch {}

    const newToast: OrderToastNotification = {
      id: 'toast_reset_' + Date.now(),
      orderId: 'SETTINGS',
      title: 'Settings Reset',
      message: 'All application preferences restored to factory defaults.',
      statusType: 'processing',
      diamonds: 0,
      sellerName: 'Nexus Shop System Config',
      amount: 0,
      currency: DEFAULT_APP_SETTINGS.currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
  };

  const handleAddMissionToast = useCallback((toastData: {
    statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
    title: string;
    message: string;
    diamonds: number;
    amount: number;
  }) => {
    const newToast: OrderToastNotification = {
      id: 'mission_toast_' + Date.now(),
      title: toastData.title,
      message: toastData.message,
      statusType: toastData.statusType,
      diamonds: toastData.diamonds,
      sellerName: 'Nexus Shop Bounty Operations',
      amount: toastData.amount,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
  }, [currency]);

  const handleAddReferralToast = useCallback((toastData: {
    title: string;
    message: string;
    type?: 'success' | 'info' | 'bonus';
  }) => {
    const newToast: OrderToastNotification = {
      id: 'ref_toast_' + Date.now(),
      title: toastData.title,
      message: toastData.message,
      statusType: toastData.type === 'bonus' ? 'completed' : 'processing',
      diamonds: toastData.type === 'bonus' ? 50 : 0,
      sellerName: 'DiamondVault Referrals',
      amount: 0,
      currency: currency,
      timestamp: Date.now(),
      read: false,
    };
    setActiveToasts((prev) => [newToast, ...prev]);
    setNotificationsHistory((prev) => [newToast, ...prev]);
  }, [currency]);

  const handleSimulateOldNotification = () => {
    const oldTime = Date.now() - 52 * 60 * 60 * 1000; // 52 hours ago (exceeds 48h limit)
    const oldNotification: OrderToastNotification = {
      id: 'notif_sim_old_' + Date.now(),
      statusType: 'processing',
      title: '⏳ 52h Ago Test Notification',
      message: 'This test notification was created with a 52-hour past timestamp to demonstrate the 48-hour auto-cleanup and archiving.',
      diamonds: 100,
      sellerName: 'Demo Historical Escrow',
      amount: 1.99,
      currency,
      timestamp: oldTime,
      read: true,
    };
    setNotificationsHistory((prev) => [oldNotification, ...prev]);
  };

  // Run cleanupOldNotifications whenever the Notification Center drawer is opened
  useEffect(() => {
    if (isNotificationCenterOpen) {
      cleanupOldNotifications();
    }
  }, [isNotificationCenterOpen, cleanupOldNotifications]);

  const handleClearAllCache = () => {
    try {
      localStorage.removeItem('nexus_app_settings');
      localStorage.removeItem('nexus_price_alerts');
      localStorage.removeItem('nexus_auth_user');
      localStorage.removeItem('nexus_notifications_history');
      localStorage.removeItem('nexus_archived_notifications');
      setSettings(DEFAULT_APP_SETTINGS);
      setCurrency(DEFAULT_APP_SETTINGS.currency);
      setPriceAlerts(INITIAL_PRICE_ALERTS);
      setActiveToasts([]);
      setNotificationsHistory([]);
    } catch {}
    setIsSettingsOpen(false);
  };

  // Active in-escrow orders count
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'refunded'
  ).length;

  const unreadNotificationsCount = notificationsHistory.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative selection:bg-cyan-500/30">
      {/* Immersive Background Effects & Atmospheric Canvas */}
      <BackgroundEffects
        theme={settings.theme}
        bgEffect={settings.bgEffect}
        bgGlowColor={settings.bgGlowColor}
        bgEffectIntensity={settings.bgEffectIntensity}
        bgAnimateEffects={settings.bgAnimateEffects}
      />

      {/* Interactive Crystal Diamond Sparkle FX on Click */}
      <InteractiveSparkleCanvas enabled={settings.bgAnimateEffects} />

      {/* Real-Time Floating Notification Toasts */}
      <NotificationToasts
        notifications={activeToasts}
        onDismiss={handleDismissToast}
        onSelectOrder={(ord) => setSelectedOrderForTracking(ord)}
        onBuyPackage={(pkg, sel) => handleSelectPackageToBuy(pkg, sel)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />

      {/* Escrow Notification Center Modal / History Drawer */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notificationsHistory}
        onClearAll={() => {
          setNotificationsHistory([]);
          setActiveToasts([]);
        }}
        onMarkAllRead={() => {
          setNotificationsHistory((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
        onSelectOrder={(ord) => {
          setSelectedOrderForTracking(ord);
          setIsNotificationCenterOpen(false);
        }}
        onBuyPackage={(pkg, sel) => {
          handleSelectPackageToBuy(pkg, sel);
          setIsNotificationCenterOpen(false);
        }}
        onSimulateStatusChange={handleSimulateStatusChange}
        onSimulatePriceDrop={() => handleSimulatePriceDrop()}
        onOpenPriceAlertsManager={() => setIsPriceAlertsManagerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onCleanupOld={() => {
          const res = cleanupOldNotifications();
          const count = res?.expiredCount || 0;
          if (count > 0) {
            const cleanupToast: OrderToastNotification = {
              id: 'toast_cleanup_' + Date.now(),
              title: '🧹 Clutter Cleared',
              message: `Archived & removed ${count} notification${count > 1 ? 's' : ''} older than 48 hours.`,
              statusType: 'completed',
              diamonds: 0,
              sellerName: 'Nexus Shop Escrow System',
              amount: 0,
              currency,
              timestamp: Date.now(),
              read: false,
            };
            setActiveToasts((prev) => [cleanupToast, ...prev]);
          }
        }}
        onSimulateOldNotification={handleSimulateOldNotification}
      />

      {/* 3-Zone Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleGuardedTabChange}
        currency={currency}
        setCurrency={(c) => {
          setCurrency(c);
          setSettings((prev) => {
            const next = { ...prev, currency: c };
            try {
              localStorage.setItem('nexus_app_settings', JSON.stringify(next));
            } catch {}
            return next;
          });
        }}
        currentTheme={settings.theme || 'dark'}
        onCycleTheme={(targetTheme) => {
          const cycle: ThemeArchetype[] = ['dark', 'midnight', 'amoled', 'white', 'mythic_gold', 'neon_emerald', 'crimson_void'];
          const currentTheme = settings.theme || 'dark';
          const currentIdx = cycle.indexOf(currentTheme);
          const nextTheme = targetTheme || cycle[(currentIdx + 1) % cycle.length];

          setSettings((prev) => {
            const updated = { ...prev, theme: nextTheme };
            try {
              localStorage.setItem('nexus_app_settings', JSON.stringify(updated));
            } catch {}
            return updated;
          });

          const themeNames: Record<ThemeArchetype, string> = {
            dark: 'Slate Dark',
            midnight: 'Midnight Deep',
            amoled: 'AMOLED Black',
            white: 'Frost White',
            mythic_gold: 'Mythic Gold',
            neon_emerald: 'Venom Emerald',
            crimson_void: 'Crimson Void',
          };

          const newToast: OrderToastNotification = {
            id: 'theme_toast_' + Date.now(),
            title: `🎨 Theme: ${themeNames[nextTheme] || nextTheme}`,
            message: `Workspace atmosphere updated to ${themeNames[nextTheme] || nextTheme}.`,
            statusType: 'processing',
            diamonds: 0,
            sellerName: 'Nexus Shop Theme Engine',
            amount: 0,
            currency: currency,
            timestamp: Date.now(),
            read: false,
          };
          setActiveToasts((prev) => [newToast, ...prev]);
          setNotificationsHistory((prev) => [newToast, ...prev]);
        }}
        onCountryChangedToast={(info) => {
          const newToast: OrderToastNotification = {
            id: 'country_toast_' + Date.now(),
            title: `${info.flag} Region Switched: ${info.country}`,
            message: `Regional pricing updated to ${info.symbol} ${info.currency}. Store packages, P2P exchange rates, and escrow quotes are now calculated in ${info.country} currency.`,
            statusType: 'processing',
            diamonds: 0,
            sellerName: 'Nexus Shop Regional Gateway',
            amount: 0,
            currency: info.currency,
            timestamp: Date.now(),
            read: false,
          };
          setActiveToasts((prev) => [newToast, ...prev]);
          setNotificationsHistory((prev) => [newToast, ...prev]);
        }}
        activeOrdersCount={activeOrdersCount}
        claimableMissionsCount={claimableMissionsCount}
        userRole={userRole}
        setUserRole={setUserRole}
        onOpenEscrowInfo={() => setIsEscrowExplainerOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        activePriceAlertsCount={priceAlerts.filter((a) => a.isActive).length}
        onOpenPriceAlerts={() => setIsPriceAlertsManagerOpen(true)}
        onOpenChatBot={() => setQuickHelpSignal({ open: true, tab: 'chat' })}
        user={currentUser}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleMute={handleToggleMute}
        onOpenReferralModal={() => {
          if (!currentUser) {
            setAuthReasonNotice('Security Gate: Please sign in first to access your Referral Code & +5% Bonus.');
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
            return;
          }
          setIsReferralModalOpen(true);
        }}
        onOpenVersionModal={() => setIsVersionModalOpen(true)}
        onOpenAffiliate={() => setIsAffiliateModalOpen(true)}
        onOpenPublisher={() => setIsPublisherModalOpen(true)}
        onOpenDistributor={() => setIsDistributorModalOpen(true)}
        onOpenBugBounty={() => setIsBugBountyModalOpen(true)}
        onOpenTerms={(tab) => handleOpenLegal(tab || 'terms')}
        onOpenTimedDropModal={() => {
          if (!currentUser) {
            setAuthReasonNotice('Security Gate: Please sign in first to claim the 12:00 PM / 12:00 AM Free Diamond Drop.');
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
            return;
          }
          setIsTimedDropModalOpen(true);
        }}
        onOpenVipUpgradeModal={() => setIsVipUpgradeModalOpen(true)}
        onOpenSecurityModal={(tab) => handleOpenSecurityModal(tab || 'reseller')}
        onOpenContactModal={() => setIsContactModalOpen(true)}
      />

      {/* Active Refer-a-Friend Welcome Banner for Invited Visitors */}
      {showReferralBanner && invitedByCode && (
        <div className="bg-gradient-to-r from-cyan-950/95 via-slate-900 to-indigo-950/95 border-b border-cyan-500/40 px-4 py-2.5 text-xs text-white shadow-lg relative z-20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shrink-0">
              <Gift className="w-4 h-4 animate-bounce" />
            </span>
            <div>
              <span className="font-bold text-cyan-300 mr-1.5">
                🎉 Friend Invite Active (Code: <span className="font-mono text-white">{invitedByCode}</span>)
              </span>
              <span className="text-slate-300 text-[11px]">
                Sign up & complete your first escrow order to receive an automatic <strong className="text-cyan-200">+5% Bonus Diamonds</strong>!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode('signup');
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Claim 5% Bonus (Sign Up)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-bold text-xs transition-colors cursor-pointer"
              >
                View Referral Details
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowReferralBanner(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Auto-Draft Recovery Banner: Shown when user has a saved partial order in localStorage and checkout modal is closed */}
      {savedCheckoutDraft && !isCheckoutOpen && (
        <div className="bg-gradient-to-r from-cyan-950/95 via-slate-900 to-emerald-950/90 border-b border-cyan-500/40 px-4 py-2.5 text-xs text-white shadow-lg relative z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shrink-0">
                <RotateCcw className="w-4 h-4 text-cyan-300" />
              </span>
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                  <span className="font-bold text-cyan-300">
                    Unfinished Checkout Auto-Draft Saved
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-emerald-300 border border-emerald-500/40">
                    {savedCheckoutDraft.bulkItems && savedCheckoutDraft.bulkItems.length > 1
                      ? `${savedCheckoutDraft.bulkItems.length} Bulk Packages`
                      : `${savedCheckoutDraft.quantity}x ${savedCheckoutDraft.diamondPackage.name} (${((savedCheckoutDraft.diamondPackage.diamonds + (savedCheckoutDraft.diamondPackage.bonusDiamonds || 0)) * savedCheckoutDraft.quantity).toLocaleString()} 💎)`}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  Seller: <strong className="text-white">{savedCheckoutDraft.seller.sellerName}</strong>
                  {savedCheckoutDraft.userIdInput ? (
                    <>
                      {' '}· MLBB ID:{' '}
                      <span className="font-mono text-cyan-200">
                        {savedCheckoutDraft.userIdInput}
                        {savedCheckoutDraft.zoneIdInput ? ` (${savedCheckoutDraft.zoneIdInput})` : ''}
                      </span>
                    </>
                  ) : null}{' '}
                  · Pick up right where you left off.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleResumeCheckoutDraft(savedCheckoutDraft)}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resume Checkout</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardCheckoutDraft}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-red-950/80 text-slate-300 hover:text-red-200 border border-slate-700 hover:border-red-500/40 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Discard saved checkout draft"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Discard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top-Up Store View */}
        {activeTab === 'buy' && (
          <div>
            <HeroSection
              verifiedAccount={verifiedAccount}
              setVerifiedAccount={setVerifiedAccount}
              currency={currency}
              setCurrency={setCurrency}
              onBrowsePackages={() => {
                const el = document.getElementById('store-packages-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenEscrowModal={() => setIsEscrowExplainerOpen(true)}
              onOpenSecurityModal={(tab) => handleOpenSecurityModal(tab || 'reseller')}
            />

            {/* Escrow Savings Calculator (Starts with 5 Steps & Ends with Highest Diamond) */}
            <DiamondSavingsCalculator
              currency={currency}
              currentUser={currentUser}
              onSelectQuickAmount={handleSelectQuickCalculatorAmount}
            />

            <div id="store-packages-grid">
              <PackageStore
                packages={packages}
                sellers={sellers}
                currency={currency}
                setCurrency={setCurrency}
                verifiedAccount={verifiedAccount}
                currentUser={currentUser}
                priceAlerts={priceAlerts}
                preferredPaymentMethod={currentUser?.preferredPaymentMethod || settings.defaultPaymentMethod}
                onSelectPackageToBuy={handleSelectPackageToBuy}
                onOpenPriceAlertModal={handleOpenPriceAlertModal}
                onOpenPriceAlertsManager={() => setIsPriceAlertsManagerOpen(true)}
                onInitiateBulkCheckout={handleInitiateBulkCheckout}
                onOpenSignIn={() => {
                  setAuthReasonNotice('First of all, you need to sign in so you can order with Escrow.');
                  setAuthModalMode('signin');
                  setIsAuthModalOpen(true);
                }}
                onOpenAccountPrompt={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenVipUpgradeModal={() => setIsVipUpgradeModalOpen(true)}
                isLoading={isDataLoading}
              />
            </div>
          </div>
        )}

        {/* P2P Marketplace View */}
        {activeTab === 'p2p' && (
          <div>
            <P2PMarketplace
              sellers={sellers}
              packages={packages}
              orders={orders}
              currency={currency}
              currentUser={currentUser}
              onBuyFromSeller={handleBuyFromSeller}
              onBecomeSellerClick={() => {
                if (canSellDiamonds(currentUser)) {
                  setUserRole('seller');
                  setActiveTab('seller');
                } else {
                  setIsVipUpgradeModalOpen(true);
                }
              }}
              onSwitchAccount={handleUpdateUser}
              isLoading={isDataLoading}
            />

            <DiamondSavingsCalculator
              currency={currency}
              currentUser={currentUser}
              onSelectQuickAmount={handleSelectQuickCalculatorAmount}
            />
          </div>
        )}

        {/* Seller Dashboard & Portal - Strictly VIP & Developer Only */}
        {activeTab === 'seller' && (
          canSellDiamonds(currentUser) ? (
            <SellerDashboard
              sellerProfile={sellerProfile}
              orders={orders}
              packages={packages}
              sellers={sellers}
              currency={currency}
              currentUser={currentUser}
              onUpdateOrders={(updated) => setOrders(updated)}
              onAddListing={handleAddSellerListing}
              onOpenOrderTracker={(ord) => setSelectedOrderForTracking(ord)}
              onSwitchAccount={handleUpdateUser}
              onBackToStore={() => setActiveTab('buy')}
              isLoading={isDataLoading}
            />
          ) : (
            <div className="max-w-3xl mx-auto my-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#141b2e] via-slate-900 to-[#0b101d] border-2 border-amber-400/80 shadow-2xl shadow-amber-950/80 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-xl shadow-amber-500/30 mb-4">
                <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-amber-400 animate-bounce" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold mb-3">
                <Lock className="w-3.5 h-3.5" />
                <span>VIP CLEARANCE REQUIRED TO SELL DIAMONDS</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                Merchant Seller Portal Clearance
              </h2>
              <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
                Beginners need to upgrade to <strong className="text-amber-300">VIP Membership</strong> to sell diamonds in the Seller Portal. For just <strong className="text-amber-300">₱950 Pesos</strong> (or converted to your country's currency), you unlock full merchant selling clearance!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto mb-6">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Free Diamonds (172 💎)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Limit of 2 free claims total, with a 1 day wait between claims.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/40 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">50% Storewide Discount</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Permanent 50% discount on all diamond purchases in the store!</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/40 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Seller Portal Clearance</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Clearance to list diamond stock, set prices, and fulfill escrow orders.</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-yellow-500/40 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Official VIP Badge</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Gold radiant VIP badge displayed next to your IGN and ranking.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  id="seller-portal-upgrade-vip-btn"
                  onClick={() => setIsVipUpgradeModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
                  <span>Upgrade to VIP (₱950 / International)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('buy')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Back to Diamond Store
                </button>
              </div>
            </div>
          )
        )}

        {/* Automated Transaction Tracking & Escrow Ledger View */}
        {activeTab === 'orders' && (
          <OrdersListView
            orders={orders}
            currency={currency}
            onOpenTracker={(ord) => {
              setOpenCancelModalOnTracker(false);
              setSelectedOrderForTracking(ord);
            }}
            onNavigateToStore={() => setActiveTab('buy')}
            onRateOrder={(ord) => setSelectedOrderForFeedback(ord)}
            onCancelOrder={(ord) => {
              setSelectedOrderForTracking(ord);
              setOpenCancelModalOnTracker(true);
            }}
            onUpdateOrder={handleUpdateOrder}
            onDeleteOrder={handleDeleteOrder}
            onRestoreOrder={handleRestoreSingleOrder}
            onClearHistory={handleClearOrders}
            onRestoreSampleOrders={handleRestoreSampleOrders}
            isLoading={isDataLoading}
          />
        )}

        {/* Daily Missions & Bounty Operations View */}
        {activeTab === 'missions' && (
          <DailyMissions
            verifiedAccount={verifiedAccount}
            currentUser={currentUser}
            currency={currency}
            onNavigateToTab={(tab) => {
              if (tab === 'escrow-info' as any) {
                setIsEscrowExplainerOpen(true);
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenEscrowExplainer={() => setIsEscrowExplainerOpen(true)}
            onOpenAccountPrompt={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
            onOpenVipUpgradeModal={() => setIsVipUpgradeModalOpen(true)}
            onSelectQuickCalculatorAmount={handleSelectQuickCalculatorAmount}
            onAddNotificationToast={handleAddMissionToast}
          />
        )}

        {/* DiamondVault Referral Program & Invite Statistics View */}
        {activeTab === 'referrals' && (
          <ReferralProgram
            currentUser={currentUser}
            currency={currency}
            onOpenSignUp={() => {
              setAuthModalMode('signup');
              setIsAuthModalOpen(true);
            }}
            onNavigateToBuy={() => setActiveTab('buy')}
            onBonusClaimed={(bonusDiamonds) => {
              setCurrentUser((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  referralBonusDiamonds: (prev.referralBonusDiamonds || 0) + bonusDiamonds,
                };
              });
            }}
            onAddToast={handleAddReferralToast}
          />
        )}
      </main>

      {/* Live Order Tracker Modal */}
      {selectedOrderForTracking && (
        <OrderTrackingModal
          isOpen={Boolean(selectedOrderForTracking)}
          onClose={() => {
            setSelectedOrderForTracking(null);
            setOpenCancelModalOnTracker(false);
          }}
          order={selectedOrderForTracking}
          onUpdateOrder={handleUpdateOrder}
          onCancelOrder={handleCancelOrder}
          onDeleteOrder={handleDeleteOrder}
          currentUserRole={userRole}
          initialOpenCancellation={openCancelModalOnTracker}
        />
      )}

      {/* Post-Transaction Feedback Modal (triggered from Orders List or notifications) */}
      {selectedOrderForFeedback && (
        <PostTransactionFeedbackModal
          isOpen={Boolean(selectedOrderForFeedback)}
          onClose={() => setSelectedOrderForFeedback(null)}
          order={selectedOrderForFeedback}
          onSubmitFeedback={handleFeedbackSubmit}
        />
      )}

      {/* Real-Money Payment & Escrow Checkout Modal */}
      {isCheckoutOpen && checkoutPackage && checkoutSeller && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutBulkItems(null);
          }}
          diamondPackage={checkoutPackage}
          seller={checkoutSeller}
          currency={currency}
          verifiedAccount={verifiedAccount}
          setVerifiedAccount={setVerifiedAccount}
          onOrderCreated={handleOrderCreated}
          currentUser={currentUser}
          initialQuantity={checkoutQuantity}
          bulkItems={checkoutBulkItems}
          preferredPaymentMethod={currentUser?.preferredPaymentMethod || settings.defaultPaymentMethod}
          defaultPaymentMethod={settings.defaultPaymentMethod}
          onUpdatePreferredPaymentMethod={(method) => {
            if (currentUser) {
              handleUpdateUser({
                ...currentUser,
                preferredPaymentMethod: method,
              });
            } else {
              handleSaveSettings({
                ...settings,
                defaultPaymentMethod: method,
              });
            }
          }}
          onOpenSignUp={() => {
            setAuthReasonNotice('First of all, you need to sign in so you can order with Escrow.');
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
          }}
          initialDraftRestored={activeRestoredDraft}
          onDraftUpdated={(draft) => setSavedCheckoutDraft(draft)}
        />
      )}

      {/* Sign Up / Sign In Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthReasonNotice('');
        }}
        initialMode={authModalMode}
        onAuthSuccess={handleAuthSuccess}
        defaultCurrency={currency}
        reasonNotice={authReasonNotice}
        onOpenTerms={handleOpenLegal}
      />

      {/* User Account Details & Security Profile Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          orders={orders}
          onUpdateUser={handleUpdateUser}
          onSignOut={handleSignOut}
          currency={currency}
          setCurrency={setCurrency}
          onOpenOrders={() => setActiveTab('orders')}
          onOpenSellerPortal={() => {
            if (canSellDiamonds(currentUser)) {
              setUserRole('seller');
              setActiveTab('seller');
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onOpenMissions={() => setActiveTab('missions')}
          onOpenReferralModal={() => {
            setIsProfileModalOpen(false);
            setIsReferralModalOpen(true);
          }}
          onOpenStore={() => {
            setIsProfileModalOpen(false);
            setActiveTab('buy');
          }}
          onOpenVipUpgradeModal={() => {
            setIsProfileModalOpen(false);
            setIsVipUpgradeModalOpen(true);
          }}
          onAddNotificationToast={(toastData) => {
            const newToast: OrderToastNotification = {
              id: 'vip_claim_toast_' + Date.now(),
              title: toastData.title,
              message: toastData.message,
              statusType: toastData.statusType,
              diamonds: toastData.diamonds,
              sellerName: 'VIP Mythic Privileges',
              amount: toastData.amount,
              currency: currency,
              timestamp: Date.now(),
              read: false,
            };
            setActiveToasts((prev) => [newToast, ...prev]);
            setNotificationsHistory((prev) => [newToast, ...prev]);
          }}
        />
      )}

      {/* Refer-a-Friend 5% Dual Diamond Bonus Modal */}
      <ReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
        currentUser={currentUser}
        currency={currency}
        onOpenSignUp={() => {
          setIsReferralModalOpen(false);
          setAuthModalMode('signup');
          setIsAuthModalOpen(true);
        }}
        onBonusClaimed={(bonusDiamonds) => {
          if (currentUser) {
            setCurrentUser((prev) =>
              prev
                ? {
                    ...prev,
                    totalDiamondsPurchased: prev.totalDiamondsPurchased + bonusDiamonds,
                    referralBonusDiamonds: (prev.referralBonusDiamonds || 0) + bonusDiamonds,
                  }
                : null
            );
          }
          const bonusToast: OrderToastNotification = {
            id: 'toast_sim_ref_' + Date.now(),
            orderId: 'REF-SIM',
            title: '🎉 Squad Referral Bonus Credited!',
            message: `+${bonusDiamonds} Bonus Diamonds deposited into your Nexus Shop Wallet from squad escrow order!`,
            statusType: 'completed',
            diamonds: bonusDiamonds,
            sellerName: 'Refer-a-Friend Protocol',
            amount: 0,
            currency,
            timestamp: Date.now(),
            read: false,
          };
          setActiveToasts((prev) => [bonusToast, ...prev]);
          setNotificationsHistory((prev) => [bonusToast, ...prev]);
        }}
      />

      {/* Application Settings & Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onResetToDefaults={handleResetSettings}
        onClearAllCache={handleClearAllCache}
        onNavigateToTab={(tab) => handleGuardedTabChange(tab as any)}
      />

      {/* Escrow Explainer Modal */}
      <EscrowExplainerModal
        isOpen={isEscrowExplainerOpen}
        onClose={() => setIsEscrowExplainerOpen(false)}
        onStartOrder={() => setActiveTab('buy')}
      />

      {/* Set / Edit Price Alert Modal */}
      {isPriceAlertModalOpen && priceAlertTargetPackage && (
        <PriceAlertModal
          isOpen={isPriceAlertModalOpen}
          onClose={() => {
            setIsPriceAlertModalOpen(false);
            setPriceAlertTargetPackage(null);
          }}
          diamondPackage={priceAlertTargetPackage}
          currentAlert={priceAlerts.find((a) => a.packageId === priceAlertTargetPackage.id) || null}
          existingAlert={priceAlerts.find((a) => a.packageId === priceAlertTargetPackage.id) || null}
          currency={currency}
          sellers={sellers}
          onSaveAlert={handleSavePriceAlert}
          onDeleteAlert={handleDeletePriceAlert}
          onSimulatePriceDrop={(pkgId, customPrice) => handleSimulatePriceDrop(pkgId, customPrice)}
          onSimulateDrop={(pkgId, customPrice) => handleSimulatePriceDrop(pkgId, customPrice)}
        />
      )}

      {/* Price Alerts Manager Modal */}
      {isPriceAlertsManagerOpen && (
        <PriceAlertsManagerModal
          isOpen={isPriceAlertsManagerOpen}
          onClose={() => setIsPriceAlertsManagerOpen(false)}
          priceAlerts={priceAlerts}
          alerts={priceAlerts}
          packages={packages}
          sellers={sellers}
          currency={currency}
          onToggleActive={handleToggleActivePriceAlert}
          onDeleteAlert={handleDeletePriceAlert}
          onSaveAlert={handleSavePriceAlert}
          onOpenCreateModal={(pkg) => {
            setPriceAlertTargetPackage(pkg);
            setIsPriceAlertModalOpen(true);
          }}
          onEditAlert={(alert) => {
            const pkg = packages.find((p) => p.id === alert.packageId);
            if (pkg) {
              setPriceAlertTargetPackage(pkg);
              setIsPriceAlertModalOpen(true);
            }
          }}
          onOpenCreateAlert={() => {
            setPriceAlertTargetPackage(packages[0]);
            setIsPriceAlertModalOpen(true);
          }}
          onBuyPackage={(pkg, seller) => {
            handleSelectPackageToBuy(pkg, seller);
          }}
          onBuyNow={(pkg, seller) => {
            handleSelectPackageToBuy(pkg, seller);
          }}
          onSimulatePriceDrop={(pkgId, customPrice) => handleSimulatePriceDrop(pkgId, customPrice)}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 pt-12 pb-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          {/* Main Footer 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Column 1 & 2: Brand, Logo, Mission */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <NexusLogo size="sm" showText={true} subtitle="Moonton Server Direct Recharge Protocol" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Authorized peer-to-peer escrow protocol and direct server top-up platform for Mobile Legends: Bang Bang. Protected by Aegis Smart Escrow with zero chargeback risk and 100% money-back guarantee.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsVersionModalOpen(true)}
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950/90 hover:bg-blue-900 border border-blue-600/50 hover:border-blue-400 text-blue-300 transition-colors cursor-pointer"
                  title={`Version ${APP_VERSION} - View Release Notes`}
                >
                  v{APP_VERSION} Release Notes
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSecurityModal('reseller')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors cursor-pointer"
                >
                  Authorized Distributor API
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenSecurityModal('sandbox')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 transition-colors cursor-pointer"
                >
                  Zod + HMAC Webhook Active
                </button>
              </div>
            </div>

            {/* Column 2: Partners & Programs */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Programs & Partners</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsAffiliateModalOpen(true)}
                    className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Become an Affiliate</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60 font-bold">8%</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsPublisherModalOpen(true)}
                    className="hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>For Game Publishers</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60">2.5%</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsDistributorModalOpen(true)}
                    className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Become a Distributor</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/60">Wholesale</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsBugBountyModalOpen(true)}
                    className="hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Bug Bounty Program</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">$5k</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Escrow & Protections */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security & Escrow</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsEscrowExplainerOpen(true)}
                    className="hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Aegis Escrow Vault
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenSecurityModal('reseller')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Official Reseller & Security Proof</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('escrow_refund')}
                    className="hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    100% Anti-Scam Refund Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setQuickHelpSignal({ open: true, tab: 'chat' })}
                    className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Bot className="w-3 h-3 text-cyan-400" />
                    <span>Ask AI Assistant</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setQuickHelpSignal({ open: true, tab: 'faqs' })}
                    className="hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3 h-3 text-cyan-400" />
                    <span>Trust & Escrow FAQs</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Policies */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>Legal & Policies</span>
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('terms')}
                    className="hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('privacy')}
                    className="hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('p2p_rules')}
                    className="hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    P2P Merchant Code of Conduct
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleOpenLegal('disclaimer')}
                    className="hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    Moonton Trademark Disclaimer
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(true)}
                    className="hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-400 font-semibold"
                  >
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    <span>Contact Us (24/7 Live Desk)</span>
                  </button>
                </li>
              </ul>
            </div>

          </div>

          {/* Official Contact Us & Social Community Strip (WhatsApp Group, Facebook & Instagram) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-[#0b1526] to-slate-900/95 border border-cyan-500/30 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <PhoneCall className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Contact Us — Official Community & Direct Support</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      VERIFIED ACCOUNTS
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Need help with an order, VIP upgrade, or diamond top-up? Connect directly with our verified channels below:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open Contact Directory</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* WhatsApp Group Link */}
              <a
                href="https://chat.whatsapp.com/K5jSUOKPGXL46sWyMXseCz"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                      WhatsApp Group Message
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      Join Official WhatsApp Community
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      chat.whatsapp.com/K5jSUOKPGXL46sWyMXseCz
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              {/* Facebook Account: Ralph Jaycob Barrameda */}
              <a
                href="https://www.facebook.com/search/top?q=Ralph%20Jaycob%20Barrameda"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 hover:border-blue-400 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 font-black text-base shrink-0">
                    f
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase text-blue-300 font-bold">
                      Official Facebook Account
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      Ralph Jaycob Barrameda
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      Verified Owner & Support Admin
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>

              {/* Instagram Account: hakobiii.com.ph */}
              <a
                href="https://www.instagram.com/hakobiii.com.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-xl bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/40 hover:border-pink-400 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-pink-400/50 flex items-center justify-center text-pink-400 font-mono font-black text-xs shrink-0">
                    IG
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono uppercase text-pink-300 font-bold">
                      Official Instagram Account
                    </div>
                    <div className="text-xs font-bold text-white truncate">
                      @hakobiii.com.ph
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      instagram.com/hakobiii.com.ph
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-pink-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </a>
            </div>
          </div>

          {/* Bottom Copyright & Trademark Banner */}
          <div className="pt-6 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div className="flex flex-wrap items-center gap-2 text-center md:text-left">
              <span className="font-semibold text-slate-400">© 2026 Nexus Shop Global Escrow Ltd.</span>
              <span>All rights reserved.</span>
              <span className="hidden sm:inline">·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('terms')}
                className="hover:text-cyan-300 transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Terms of Service
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('privacy')}
                className="hover:text-blue-300 transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleOpenLegal('disclaimer')}
                className="hover:text-purple-300 transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Moonton Trademark Notice
              </button>
            </div>
            <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px]">
              <span>Moonton Partner Direct Protocol</span>
              <span>·</span>
              <span>Aegis Escrow Protected</span>
              <span>·</span>
              <span>256-bit SSL Encrypted</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Legal, Terms of Service, Privacy Policy & Disclaimers Modal */}
      <LegalTermsModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalInitialTab}
      />

      {/* Become an Affiliate Program Modal */}
      <AffiliateProgramModal
        isOpen={isAffiliateModalOpen}
        onClose={() => setIsAffiliateModalOpen(false)}
        currency={currency}
        user={currentUser}
        onOpenAuth={() => {
          setIsAffiliateModalOpen(false);
          setAuthModalMode('signup');
          setIsAuthModalOpen(true);
        }}
      />

      {/* For Game Publishers B2B In-Game Escrow Modal */}
      <GamePublisherModal
        isOpen={isPublisherModalOpen}
        onClose={() => setIsPublisherModalOpen(false)}
        currency={currency}
      />

      {/* Become a Bulk Distributor Modal */}
      <DistributorProgramModal
        isOpen={isDistributorModalOpen}
        onClose={() => setIsDistributorModalOpen(false)}
        currency={currency}
      />

      {/* Whitehat Bug Bounty Program Modal */}
      <BugBountyModal
        isOpen={isBugBountyModalOpen}
        onClose={() => setIsBugBountyModalOpen(false)}
        currency={currency}
      />

      {/* Official Reseller & Cybersecurity Verification Modal (with Live Zod & HMAC Webhook Sandbox) */}
      <SecurityVerificationModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        initialTab={securityModalInitialTab}
      />

      {/* Official Contact Us & Social Community Modal (WhatsApp Group, Facebook & Instagram) */}
      <ContactSupportModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onOpenChatBot={() => setQuickHelpSignal({ open: true, tab: 'chat' })}
      />

      {/* Release Version Modal */}
      <VersionModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
      />

      {/* 12:00 PM & 12:00 AM Free Diamond Drop Modal (10 to 50 💎 for Buyer & VIP) */}
      <TimedDiamondDropModal
        isOpen={isTimedDropModalOpen}
        onClose={() => setIsTimedDropModalOpen(false)}
        currentUser={currentUser}
        verifiedAccount={verifiedAccount}
        currency={currency}
        onOpenAccountPrompt={() => {
          setIsTimedDropModalOpen(false);
          setActiveTab('buy');
        }}
        onDiamondsClaimed={(amount) => {
          if (currentUser) {
            setCurrentUser((prev) => {
              if (!prev) return null;
              const updated = {
                ...prev,
                freeDropsClaimed: (prev.freeDropsClaimed || 0) + 1,
                freeDropDiamondsClaimed: (prev.freeDropDiamondsClaimed || 0) + amount,
              };
              try {
                localStorage.setItem('nexus_mock_user', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        }}
        onAddNotificationToast={(toastData) => {
          const newToast: OrderToastNotification = {
            id: 'timed_drop_toast_' + Date.now(),
            title: toastData.title,
            message: toastData.message,
            statusType: toastData.statusType,
            diamonds: toastData.diamonds,
            sellerName: 'Nexus Shop 12:00 Drop Protocol',
            amount: toastData.amount,
            currency: currency,
            timestamp: Date.now(),
            read: false,
          };
          setActiveToasts((prev) => [newToast, ...prev]);
          setNotificationsHistory((prev) => [newToast, ...prev]);
        }}
      />

      {/* 👑 VIP Upgrade & Membership Modal (₱950 / International Conversion) */}
      <VipUpgradeModal
        isOpen={isVipUpgradeModalOpen}
        onClose={() => setIsVipUpgradeModalOpen(false)}
        currentUser={currentUser}
        currency={currency}
        setCurrency={setCurrency}
        onUpgradeSuccess={handleVipUpgradeSuccess}
        onOpenSignIn={() => {
          setAuthReasonNotice('Please sign in first to upgrade to VIP membership.');
          setAuthModalMode('signin');
          setIsAuthModalOpen(true);
        }}
      />

      {/* Floating Action Button: Quick Help Popover & AI Support Bot */}
      <QuickHelpPopover
        onOpenOrders={() => handleGuardedTabChange('orders')}
        activeOrders={orders}
        currentTab={activeTab}
        userIgn={verifiedAccount?.ign}
        externalOpenSignal={quickHelpSignal}
        onClearExternalSignal={() => setQuickHelpSignal(null)}
        onOpenTimedDropModal={() => {
          if (!currentUser) {
            setAuthReasonNotice('Security Gate: Please sign in first to claim the 12:00 PM / 12:00 AM Free Diamond Drop.');
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
            return;
          }
          setIsTimedDropModalOpen(true);
        }}
        onOpenSecurityModal={(tab = 'reseller') => {
          setSecurityModalInitialTab(tab);
          setIsSecurityModalOpen(true);
        }}
      />
    </div>
  );
}

export default App;

