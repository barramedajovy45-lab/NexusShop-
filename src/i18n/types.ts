import { Currency } from '../types';

export type SupportedLanguage = 'en' | 'fil' | 'id' | 'ms';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  recommendedCurrency: Currency;
  sampleGreeting: string;
}

export interface Translations {
  // Navigation
  nav: {
    buy: string;
    p2p: string;
    seller: string;
    orders: string;
    missions: string;
    escrowInfo: string;
    settings: string;
    balance: string;
    myOrdersBadge: string;
    referrals: string;
  };

  // Common UI
  common: {
    save: string;
    saved: string;
    saving: string;
    cancel: string;
    close: string;
    reset: string;
    resetDefaults: string;
    search: string;
    filter: string;
    active: string;
    upcoming: string;
    done: string;
    viewFaq: string;
    learnMore: string;
    confirm: string;
    instant: string;
    verified: string;
    diamonds: string;
    bonus: string;
  };

  // Settings Modal
  settings: {
    title: string;
    subtitle: string;
    savedNotice: string;
    resetConfirmTitle: string;
    resetConfirmDesc: string;
    tabs: {
      general: string;
      audio: string;
      notifications: string;
      escrow: string;
      privacy: string;
      faq: string;
    };
    language: {
      title: string;
      subtitle: string;
      toggleLabel: string;
      activeLanguage: string;
      instantSwitchNotice: string;
      recommendedCurrencyNotice: string;
      badge: string;
    };
    display: {
      currencyTitle: string;
      currencyDesc: string;
      themeTitle: string;
      bgEffectTitle: string;
      glowColorTitle: string;
      effectIntensityTitle: string;
      animateBgTitle: string;
      compactModeTitle: string;
      compactModeDesc: string;
    };
    audio: {
      masterTitle: string;
      masterDesc: string;
      volumeTitle: string;
      priceAlertSoundTitle: string;
      orderSuccessSoundTitle: string;
    };
    notifications: {
      toastTitle: string;
      toastDesc: string;
      autoDismissTitle: string;
      priceDropTitle: string;
      escrowStatusTitle: string;
      chatMessagesTitle: string;
    };
    escrow: {
      defaultPaymentTitle: string;
      defaultPaymentDesc: string;
      autoFillMlbbTitle: string;
      autoFillMlbbDesc: string;
      twoFactorDisputesTitle: string;
      twoFactorDisputesDesc: string;
      autoOpenTrackerTitle: string;
      autoOpenTrackerDesc: string;
      fastCheckoutTitle: string;
      fastCheckoutDesc: string;
      faqBannerTitle: string;
    };
    privacy: {
      maskIgnTitle: string;
      maskIgnDesc: string;
      twoFactorWalletTitle: string;
      twoFactorWalletDesc: string;
      clearDataTitle: string;
      clearDataDesc: string;
      clearDataButton: string;
      securityFaqBannerTitle: string;
    };
  };

  // Escrow & Delivery Pipeline
  escrow: {
    title: string;
    vaultProtection: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    step4Title: string;
    step4Desc: string;
    autoReleaseTimer: string;
    guaranteeText: string;
  };

  // Store & Packages
  store: {
    heroTitle: string;
    heroSubtitle: string;
    instantDeliveryBadge: string;
    aegisGuaranteedBadge: string;
    quantityLabel: string;
    lowStockLabel: string;
    inStock: string;
    outOfStock: string;
    buyNow: string;
    bestValue: string;
    popular: string;
    bulkSavings: string;
  };

  // Anti-Scam & Safety Trust Protection
  security?: {
    antiScamTitle: string;
    antiScamNotice: string;
    passwordWarning: string;
    escrowGuarantee: string;
    verifiedSellerBadge: string;
  };
}
