import { Currency, OrderStatus, PaymentMethod } from '../types';

export interface CurrencyInfo {
  symbol: string;
  rate: number;
  name: string;
  flag: string;
  country: string;
  region: 'Southeast Asia' | 'East Asia' | 'South Asia' | 'West Asia' | 'Central Asia' | 'Americas' | 'Europe' | 'Oceania' | 'Global';
  mlbbLeague?: string;
  popularLocalPayment?: string;
}

export const CURRENCY_RATES: Record<Currency, CurrencyInfo> = {
  // ----------------------------------------------------
  // 1. SOUTHEAST ASIA (MLBB Global Heartland & Core Leagues)
  // ----------------------------------------------------
  PHP: { symbol: '₱', rate: 58.5, name: 'Philippine Peso', flag: '🇵🇭', country: 'Philippines', region: 'Southeast Asia', mlbbLeague: 'MPL PH (World Champs)', popularLocalPayment: 'GCash / Maya' },
  IDR: { symbol: 'Rp', rate: 15850, name: 'Indonesian Rupiah', flag: '🇮🇩', country: 'Indonesia', region: 'Southeast Asia', mlbbLeague: 'MPL ID (Largest Hub)', popularLocalPayment: 'DANA / QRIS / GoPay' },
  MYR: { symbol: 'RM', rate: 4.45, name: 'Malaysian Ringgit', flag: '🇲🇾', country: 'Malaysia', region: 'Southeast Asia', mlbbLeague: 'MPL MY', popularLocalPayment: "Touch 'n Go / FPX" },
  SGD: { symbol: 'S$', rate: 1.35, name: 'Singapore Dollar', flag: '🇸🇬', country: 'Singapore', region: 'Southeast Asia', mlbbLeague: 'MPL SG', popularLocalPayment: 'PayNow / GrabPay' },
  THB: { symbol: '฿', rate: 36.5, name: 'Thai Baht', flag: '🇹🇭', country: 'Thailand', region: 'Southeast Asia', mlbbLeague: 'MLBB Thailand Pro', popularLocalPayment: 'PromptPay / TrueMoney' },
  VND: { symbol: '₫', rate: 25400, name: 'Vietnamese Dong', flag: '🇻🇳', country: 'Vietnam', region: 'Southeast Asia', mlbbLeague: 'MLBB Vietnam Championship', popularLocalPayment: 'MoMo / ZaloPay' },
  KHR: { symbol: '៛', rate: 4080, name: 'Cambodian Riel', flag: '🇰🇭', country: 'Cambodia', region: 'Southeast Asia', mlbbLeague: 'MPL KH', popularLocalPayment: 'ABA Pay / Wing' },
  MMK: { symbol: 'K', rate: 2100, name: 'Myanmar Kyat', flag: '🇲🇲', country: 'Myanmar', region: 'Southeast Asia', mlbbLeague: 'Burmese Ghouls / M-Series', popularLocalPayment: 'KBZPay / WavePay' },
  LAK: { symbol: '₭', rate: 21800, name: 'Lao Kip', flag: '🇱🇦', country: 'Laos', region: 'Southeast Asia', mlbbLeague: 'SEA Games MLBB', popularLocalPayment: 'BCEL One' },
  BND: { symbol: 'B$', rate: 1.35, name: 'Brunei Dollar', flag: '🇧🇳', country: 'Brunei', region: 'Southeast Asia', mlbbLeague: 'Borneo MLBB League', popularLocalPayment: 'BIBD / QuickPay' },

  // ----------------------------------------------------
  // 2. EAST ASIA (Competitive MLBB, Servers & M-Series)
  // ----------------------------------------------------
  MNT: { symbol: '₮', rate: 3450, name: 'Mongolian Tögrög', flag: '🇲🇳', country: 'Mongolia', region: 'East Asia', mlbbLeague: 'IHC Esports / M5 Contenders', popularLocalPayment: 'QPay / SocialPay' },
  JPY: { symbol: '¥', rate: 152.0, name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan', region: 'East Asia', mlbbLeague: '10s Gaming / Japan Server', popularLocalPayment: 'PayPay / Line Pay' },
  KRW: { symbol: '₩', rate: 1380, name: 'South Korean Won', flag: '🇰🇷', country: 'South Korea', region: 'East Asia', mlbbLeague: 'Moonton KR Pro', popularLocalPayment: 'KakaoPay / Toss' },
  HKD: { symbol: 'HK$', rate: 7.80, name: 'Hong Kong Dollar', flag: '🇭🇰', country: 'Hong Kong', region: 'East Asia', mlbbLeague: 'East Asia Qualifiers', popularLocalPayment: 'FPS / Octopus' },
  TWD: { symbol: 'NT$', rate: 32.2, name: 'New Taiwan Dollar', flag: '🇹🇼', country: 'Taiwan', region: 'East Asia', mlbbLeague: 'Taiwan MLBB Circuit', popularLocalPayment: 'JKOPAY / LinePay' },
  CNY: { symbol: '¥', rate: 7.25, name: 'Chinese Yuan', flag: '🇨🇳', country: 'China', region: 'East Asia', mlbbLeague: '决胜巅峰 Official Tour', popularLocalPayment: 'Alipay / WeChat Pay' },

  // ----------------------------------------------------
  // 3. SOUTH ASIA (MLBB South Asia Qualifiers & Regional Cup)
  // ----------------------------------------------------
  NPR: { symbol: '₨', rate: 134.5, name: 'Nepalese Rupee', flag: '🇳🇵', country: 'Nepal', region: 'South Asia', mlbbLeague: 'Nightmare / M-Series South Asia', popularLocalPayment: 'eSewa / Khalti' },
  BDT: { symbol: '৳', rate: 120.0, name: 'Bangladeshi Taka', flag: '🇧🇩', country: 'Bangladesh', region: 'South Asia', mlbbLeague: 'MLBB South Asia Qualifiers', popularLocalPayment: 'bKash / Nagad' },
  INR: { symbol: '₹', rate: 84.0, name: 'Indian Rupee', flag: '🇮🇳', country: 'India', region: 'South Asia', mlbbLeague: 'South Asia Championship', popularLocalPayment: 'UPI / PhonePe' },
  PKR: { symbol: '₨', rate: 278.0, name: 'Pakistani Rupee', flag: '🇵🇰', country: 'Pakistan', region: 'South Asia', mlbbLeague: 'MLSL South Asia', popularLocalPayment: 'Easypaisa / JazzCash' },
  LKR: { symbol: 'Rs', rate: 295.0, name: 'Sri Lankan Rupee', flag: '🇱🇰', country: 'Sri Lanka', region: 'South Asia', mlbbLeague: 'South Asia Qualifier', popularLocalPayment: 'FriMi / Genie' },
  MVR: { symbol: 'Rf', rate: 15.4, name: 'Maldivian Rufiyaa', flag: '🇲🇻', country: 'Maldives', region: 'South Asia', mlbbLeague: 'South Asia Cup', popularLocalPayment: 'BML / m-Faisaa' },

  // ----------------------------------------------------
  // 4. WEST ASIA / MIDDLE EAST (MPL MENA, EWC Riyadh & MTC)
  // ----------------------------------------------------
  SAR: { symbol: '﷼', rate: 3.75, name: 'Saudi Riyal', flag: '🇸🇦', country: 'Saudi Arabia', region: 'West Asia', mlbbLeague: 'MPL MENA & EWC Riyadh', popularLocalPayment: 'STC Pay / Mada' },
  AED: { symbol: 'AED', rate: 3.67, name: 'UAE Dirham', flag: '🇦🇪', country: 'United Arab Emirates', region: 'West Asia', mlbbLeague: 'MPL MENA Hub', popularLocalPayment: 'Careem Pay / Apple Pay' },
  QAR: { symbol: 'QR', rate: 3.64, name: 'Qatari Riyal', flag: '🇶🇦', country: 'Qatar', region: 'West Asia', mlbbLeague: 'Gulf MLBB League', popularLocalPayment: 'QNB / Ooredoo Money' },
  KWD: { symbol: 'KD', rate: 0.31, name: 'Kuwaiti Dinar', flag: '🇰🇼', country: 'Kuwait', region: 'West Asia', mlbbLeague: 'MPL MENA Pro', popularLocalPayment: 'KNET' },
  BHD: { symbol: 'BD', rate: 0.38, name: 'Bahraini Dinar', flag: '🇧🇭', country: 'Bahrain', region: 'West Asia', mlbbLeague: 'Gulf Cup MLBB', popularLocalPayment: 'BenefitPay' },
  OMR: { symbol: 'OMR', rate: 0.385, name: 'Omani Rial', flag: '🇴🇲', country: 'Oman', region: 'West Asia', mlbbLeague: 'MENA Circuit', popularLocalPayment: 'Thawani' },
  JOD: { symbol: 'JD', rate: 0.71, name: 'Jordanian Dinar', flag: '🇯🇴', country: 'Jordan', region: 'West Asia', mlbbLeague: 'Levant MLBB Championship', popularLocalPayment: 'Zain Cash / CliQ' },
  IQD: { symbol: 'IQD', rate: 1310, name: 'Iraqi Dinar', flag: '🇮🇶', country: 'Iraq', region: 'West Asia', mlbbLeague: 'Middle East Tour', popularLocalPayment: 'ZainCash / AsiaCell' },
  TRY: { symbol: '₺', rate: 34.5, name: 'Turkish Lira', flag: '🇹🇷', country: 'Turkey', region: 'West Asia', mlbbLeague: 'MTC (Fire Flux Esports)', popularLocalPayment: 'Papara / Troy' },
  EGP: { symbol: 'E£', rate: 48.5, name: 'Egyptian Pound', flag: '🇪🇬', country: 'Egypt', region: 'West Asia', mlbbLeague: 'MPL MENA Finalist', popularLocalPayment: 'Vodafone Cash / Fawry' },

  // ----------------------------------------------------
  // 5. CENTRAL ASIA (EECA Championship & M-Series Qualifiers)
  // ----------------------------------------------------
  KZT: { symbol: '₸', rate: 485.0, name: 'Kazakhstani Tenge', flag: '🇰🇿', country: 'Kazakhstan', region: 'Central Asia', mlbbLeague: 'Deus Vult / Team Spirit (EECA)', popularLocalPayment: 'Kaspi.kz / Halyk' },
  UZS: { symbol: "so'm", rate: 12800, name: 'Uzbekistani Som', flag: '🇺🇿', country: 'Uzbekistan', region: 'Central Asia', mlbbLeague: 'EECA Central Asia Tour', popularLocalPayment: 'Payme / Click' },
  KGS: { symbol: 'som', rate: 86.5, name: 'Kyrgyzstani Som', flag: '🇰🇬', country: 'Kyrgyzstan', region: 'Central Asia', mlbbLeague: 'EECA League', popularLocalPayment: 'MBank / O!Dengi' },
  TJS: { symbol: 'SM', rate: 10.7, name: 'Tajikistani Somoni', flag: '🇹🇯', country: 'Tajikistan', region: 'Central Asia', mlbbLeague: 'CIS Central Asia Cup', popularLocalPayment: 'DC Wallet / Alif' },

  // ----------------------------------------------------
  // AMERICAS & GLOBAL
  // ----------------------------------------------------
  BRL: { symbol: 'R$', rate: 5.75, name: 'Brazilian Real', flag: '🇧🇷', country: 'Brazil', region: 'Americas', mlbbLeague: 'MPL LATAM / Brazil', popularLocalPayment: 'PIX / Boleto' },
  USD: { symbol: '$', rate: 1.0, name: 'US Dollar (Global)', flag: '🇺🇸', country: 'United States', region: 'Global', mlbbLeague: 'NACT (North America)', popularLocalPayment: 'PayPal / Stripe' },
  EUR: { symbol: '€', rate: 0.92, name: 'Euro (Global)', flag: '🇪🇺', country: 'European Union', region: 'Europe', mlbbLeague: 'Global Direct', popularLocalPayment: 'SEPA / iDEAL' },
  GBP: { symbol: '£', rate: 0.79, name: 'British Pound', flag: '🇬🇧', country: 'United Kingdom', region: 'Europe', mlbbLeague: 'Global Direct', popularLocalPayment: 'Revolut / FPS' },
  AUD: { symbol: 'A$', rate: 1.55, name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia', region: 'Oceania', mlbbLeague: 'Global Direct', popularLocalPayment: 'PayID' },
  CAD: { symbol: 'C$', rate: 1.38, name: 'Canadian Dollar', flag: '🇨🇦', country: 'Canada', region: 'Americas', mlbbLeague: 'NACT Tour', popularLocalPayment: 'Interac' },
};

export function formatCurrency(amountUsd: number, currency: Currency, pricePhp?: number): string {
  const safeAmount = typeof amountUsd === 'number' && !isNaN(amountUsd) ? amountUsd : 0;
  const safeCurrency = currency || 'PHP';
  if (safeCurrency === 'PHP' && typeof pricePhp === 'number' && !isNaN(pricePhp)) {
    return `₱${pricePhp.toFixed(2)}`;
  }
  const info = CURRENCY_RATES[safeCurrency] || CURRENCY_RATES.USD || { rate: 1, symbol: '$' };
  const converted = safeAmount * (info.rate || 1);

  // Currencies typically displayed without decimals
  if (['IDR', 'VND', 'MMK', 'KHR', 'KRW', 'JPY', 'MNT', 'UZS', 'LAK', 'KZT', 'IQD'].includes(safeCurrency)) {
    return `${info.symbol} ${Math.round(converted).toLocaleString()}`;
  } else if (['KWD', 'BHD', 'OMR', 'JOD'].includes(safeCurrency)) {
    return `${info.symbol} ${converted.toFixed(2)}`;
  } else if (['PHP', 'USD', 'MYR', 'SGD', 'THB', 'BRL', 'EUR', 'GBP', 'AUD', 'CAD', 'TRY', 'HKD', 'TWD', 'CNY', 'SAR', 'AED', 'QAR', 'EGP', 'INR', 'PKR', 'NPR', 'BDT', 'LKR', 'KGS', 'TJS', 'BND'].includes(safeCurrency)) {
    return `${info.symbol}${converted.toFixed(2)}`;
  } else {
    return `${info.symbol} ${converted.toFixed(2)}`;
  }
}

export function getPaymentMethodDetails(method: PaymentMethod) {
  switch (method) {
    case 'gcash':
      return {
        name: 'GCash',
        badge: 'Instant QR / Mobile (PH)',
        category: 'Digital Wallet & E-Wallet',
        gateway: 'Xendit Official Gateway',
        color: 'text-blue-400',
        border: 'border-blue-500/40',
        bg: 'bg-blue-500/10',
        flag: '🇵🇭',
        fee: '0% fee',
      };
    case 'maya':
      return {
        name: 'Maya / PayMaya',
        badge: 'QR Ph & E-Wallet (PH)',
        category: 'Digital Wallet & E-Wallet',
        gateway: 'Xendit Official Gateway',
        color: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        flag: '🇵🇭',
        fee: '0% fee',
      };
    case 'dana':
      return {
        name: 'DANA (Indonesia)',
        badge: 'Instant IDR E-Wallet',
        category: 'Digital Wallet & E-Wallet',
        gateway: 'Midtrans / Xendit Verified',
        color: 'text-sky-400',
        border: 'border-sky-500/40',
        bg: 'bg-sky-500/10',
        flag: '🇮🇩',
        fee: '0% fee',
      };
    case 'ovo':
      return {
        name: 'OVO (Indonesia)',
        badge: 'Instant IDR E-Wallet',
        category: 'Digital Wallet & E-Wallet',
        gateway: 'Midtrans / Xendit Verified',
        color: 'text-purple-400',
        border: 'border-purple-500/40',
        bg: 'bg-purple-500/10',
        flag: '🇮🇩',
        fee: '0% fee',
      };
    case 'gopay':
      return {
        name: 'GoPay (Indonesia)',
        badge: 'Gojek Ecosystem Wallet',
        category: 'Digital Wallet & E-Wallet',
        gateway: 'Midtrans Official Gateway',
        color: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        flag: '🇮🇩',
        fee: '0% fee',
      };
    case 'google_pay':
      return {
        name: 'Google Pay',
        badge: '1-Tap Digital Wallet',
        category: 'Digital Wallet',
        gateway: 'Stripe 3DS2 Protected',
        color: 'text-cyan-400',
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-500/10',
        flag: '🌐',
        fee: '0% fee',
      };
    case 'apple_pay':
      return {
        name: 'Apple Pay',
        badge: 'FaceID / TouchID Wallet',
        category: 'Digital Wallet',
        gateway: 'Stripe 3DS2 Protected',
        color: 'text-slate-200',
        border: 'border-slate-400/40',
        bg: 'bg-slate-500/10',
        flag: '🍎',
        fee: '0% fee',
      };
    case 'paypal':
      return {
        name: 'PayPal',
        badge: 'Global Buyer Protection',
        category: 'Digital Wallet',
        gateway: 'PayPal Express Checkout',
        color: 'text-sky-400',
        border: 'border-sky-500/40',
        bg: 'bg-sky-500/10',
        flag: '🌍',
        fee: '1.2% fee',
      };
    case 'card':
    case 'visa_mastercard':
      return {
        name: 'Visa & Mastercard',
        badge: 'Credit / Debit Cards (3DS)',
        category: 'Credit / Debit Cards',
        gateway: 'Stripe PCI-DSS Level 1',
        color: 'text-indigo-400',
        border: 'border-indigo-500/40',
        bg: 'bg-indigo-500/10',
        flag: '💳',
        fee: '0% fee',
      };
    case 'bank_transfer':
      return {
        name: 'Bank Transfer & Virtual Account',
        badge: 'Direct Bank / Virtual Acc',
        category: 'Bank Transfers',
        gateway: 'Xendit & Midtrans Virtual Account',
        color: 'text-amber-400',
        border: 'border-amber-500/40',
        bg: 'bg-amber-500/10',
        flag: '🏦',
        fee: '0% fee',
      };
    case 'crypto_usdt':
      return {
        name: 'Crypto USDT (Escrow Contract)',
        badge: 'Smart Contract Vault',
        category: 'Web3 Escrow',
        gateway: 'Aegis Audited Smart Contract',
        color: 'text-teal-400',
        border: 'border-teal-500/40',
        bg: 'bg-teal-500/10',
        flag: '🪙',
        fee: 'Instant Escrow',
      };
    case 'tng':
      return {
        name: "Touch 'n Go eWallet",
        badge: 'Malaysia Local E-Wallet',
        category: 'Country E-Wallet',
        gateway: 'Xendit SEA Gateway',
        color: 'text-blue-400',
        border: 'border-blue-500/40',
        bg: 'bg-blue-500/10',
        flag: '🇲🇾',
        fee: '0% fee',
      };
    case 'grabpay':
      return {
        name: 'GrabPay',
        badge: 'SEA Regional E-Wallet',
        category: 'Country E-Wallet',
        gateway: 'Stripe / Xendit SEA',
        color: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        flag: '🇲🇾',
        fee: '0% fee',
      };
    case 'boost':
      return {
        name: 'Boost eWallet',
        badge: 'Instant QR Pay (MY)',
        category: 'Country E-Wallet',
        gateway: 'Xendit SEA Gateway',
        color: 'text-rose-400',
        border: 'border-rose-500/40',
        bg: 'bg-rose-500/10',
        flag: '🇲🇾',
        fee: '0% fee',
      };
    case 'shopeepay':
      return {
        name: 'ShopeePay',
        badge: 'SEA Local E-Wallet',
        category: 'Country E-Wallet',
        gateway: 'Midtrans / Xendit SEA',
        color: 'text-orange-400',
        border: 'border-orange-500/40',
        bg: 'bg-orange-500/10',
        flag: '🌏',
        fee: '0% fee',
      };
    case 'fpx':
      return {
        name: 'FPX Online Banking',
        badge: 'Maybank, CIMB, Public VA',
        category: 'Bank Transfers',
        gateway: 'Xendit FPX Gateway',
        color: 'text-cyan-400',
        border: 'border-cyan-500/40',
        bg: 'bg-cyan-500/10',
        flag: '🇲🇾',
        fee: '0% fee',
      };
    case 'convenience_store':
      return {
        name: '7-Eleven / Alfamart / Indomaret',
        badge: 'Over the Counter Cash',
        category: 'Retail OTC',
        gateway: 'Xendit / Midtrans Retail',
        color: 'text-amber-400',
        border: 'border-amber-500/40',
        bg: 'bg-amber-500/10',
        flag: '🏪',
        fee: 'Cash OTC',
      };
    case 'paynow':
      return {
        name: 'PayNow QR (Singapore)',
        badge: 'Instant QR / FAST Bank',
        category: 'Country E-Wallet & Bank',
        gateway: 'Stripe SG Gateway',
        color: 'text-purple-400',
        border: 'border-purple-500/40',
        bg: 'bg-purple-500/10',
        flag: '🇸🇬',
        fee: '0% fee',
      };
    case 'promptpay':
      return {
        name: 'PromptPay QR (Thailand)',
        badge: 'Instant Bank QR Scan',
        category: 'Country E-Wallet & Bank',
        gateway: 'Xendit TH Gateway',
        color: 'text-blue-400',
        border: 'border-blue-500/40',
        bg: 'bg-blue-500/10',
        flag: '🇹🇭',
        fee: '0% fee',
      };
    case 'pix':
      return {
        name: 'PIX (Brazil)',
        badge: 'Instant Banco Central',
        category: 'Country E-Wallet & Bank',
        gateway: 'Stripe LATAM Gateway',
        color: 'text-emerald-400',
        border: 'border-emerald-500/40',
        bg: 'bg-emerald-500/10',
        flag: '🇧🇷',
        fee: '0% fee',
      };
    case 'truemoney':
      return {
        name: 'TrueMoney Wallet',
        badge: 'Thailand Local E-Wallet',
        category: 'Country E-Wallet',
        gateway: 'Xendit TH Gateway',
        color: 'text-orange-400',
        border: 'border-orange-500/40',
        bg: 'bg-orange-500/10',
        flag: '🇹🇭',
        fee: '0% fee',
      };
    case 'qris':
      return {
        name: 'QRIS / DANA / OVO / GoPay',
        badge: 'Indonesia National QR',
        category: 'Country E-Wallet',
        gateway: 'Midtrans / Xendit QRIS',
        color: 'text-teal-400',
        border: 'border-teal-500/40',
        bg: 'bg-teal-500/10',
        flag: '🇮🇩',
        fee: '0% fee',
      };
    default:
      return {
        name: 'Standard Gateway Payment',
        badge: 'Stripe / Xendit / Midtrans',
        category: 'Verified Payment Gateway',
        gateway: 'Stripe / Xendit / Midtrans',
        color: 'text-slate-400',
        border: 'border-slate-500/40',
        bg: 'bg-slate-500/10',
        flag: '💳',
        fee: '0% fee',
      };
  }
}

export interface PaymentCategoryGroup {
  id: 'digital_wallets' | 'e_wallets' | 'bank_transfers' | 'cards';
  title: string;
  subtitle: string;
  gatewayBadge: string;
  methods: PaymentMethod[];
}

export const PAYMENT_GATEWAY_CATEGORIES: PaymentCategoryGroup[] = [
  {
    id: 'digital_wallets',
    title: '1. Digital Wallets (Global & Regional)',
    subtitle: 'Google Pay, Apple Pay, PayPal, GCash/Maya (PH), DANA/OVO/GoPay (ID)',
    gatewayBadge: 'Stripe · Xendit · Midtrans',
    methods: ['gcash', 'maya', 'google_pay', 'apple_pay', 'paypal', 'dana', 'ovo', 'gopay'],
  },
  {
    id: 'bank_transfers',
    title: '2. Bank Transfers & Virtual Accounts',
    subtitle: 'Direct online bank transfers & automated Virtual Accounts (VA) — never personal accounts',
    gatewayBadge: 'Xendit & Midtrans VA',
    methods: ['bank_transfer', 'fpx'],
  },
  {
    id: 'e_wallets',
    title: '3. Country-Specific Local E-Wallets',
    subtitle: 'Local e-wallets tailored to your country (QRIS, Touch \'n Go, GrabPay, ShopeePay, TrueMoney, PayNow, PromptPay, PIX)',
    gatewayBadge: 'Regional Gateways',
    methods: ['qris', 'tng', 'grabpay', 'shopeepay', 'truemoney', 'paynow', 'promptpay', 'pix'],
  },
  {
    id: 'cards',
    title: '4. Credit & Debit Cards (Visa & Mastercard)',
    subtitle: '3D-Secure 2.0 encrypted Visa & Mastercard checkout with full buyer chargeback protection',
    gatewayBadge: 'Stripe PCI-DSS L1',
    methods: ['card'],
  },
];

export function getOrderStatusMeta(status: OrderStatus) {
  switch (status) {
    case 'escrow_pending':
      return {
        label: 'Awaiting Escrow Deposit',
        color: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-500/30',
        description: 'Payment is being verified and locked into the secure escrow vault.',
        stepIndex: 1,
      };
    case 'escrow_locked':
      return {
        label: 'Funds Held in Escrow',
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-500/30',
        description: 'Payment locked in vault. Seller is dispatched to fulfill diamond order.',
        stepIndex: 2,
      };
    case 'seller_processing':
      return {
        label: 'Seller Dispatching Diamonds',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-500/30',
        description: 'Seller is actively topping up your MLBB in-game ID through Moonton servers.',
        stepIndex: 3,
      };
    case 'delivery_proof_uploaded':
    case 'delivered_pending_confirmation':
      return {
        label: 'Diamonds Delivered - Inspecting',
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-500/30',
        description: 'Moonton transaction proof uploaded. Verify in MLBB client before auto-release.',
        stepIndex: 4,
      };
    case 'completed':
      return {
        label: 'Completed & Escrow Released',
        color: 'text-green-400',
        bg: 'bg-green-400/10',
        border: 'border-green-500/30',
        description: 'Diamonds received and verified. Funds released from escrow vault to seller.',
        stepIndex: 5,
      };
    case 'disputed':
      return {
        label: 'Under Escrow Dispute',
        color: 'text-rose-400',
        bg: 'bg-rose-400/10',
        border: 'border-rose-500/30',
        description: 'Escrow vault frozen. Arbiter reviewing diamond delivery server logs.',
        stepIndex: 0,
      };
    case 'refunded':
      return {
        label: 'Refunded to Buyer',
        color: 'text-purple-400',
        bg: 'bg-purple-400/10',
        border: 'border-purple-500/30',
        description: 'Escrow funds returned to buyer payment method.',
        stepIndex: 0,
      };
    case 'cancelled':
      return {
        label: 'Cancelled & Refunded',
        color: 'text-rose-400',
        bg: 'bg-rose-400/10',
        border: 'border-rose-500/30',
        description: 'Order cancelled by buyer. 100% escrow vault payment refunded to original payment method.',
        stepIndex: 0,
      };
    default:
      return {
        label: 'Processing Order',
        color: 'text-slate-400',
        bg: 'bg-slate-400/10',
        border: 'border-slate-500/30',
        description: 'Order state is being processed by the Aegis Escrow Vault.',
        stepIndex: 1,
      };
  }
}

export function safeFormatDate(val?: number | string | null, fallback = 'N/A'): string {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split('T')[0];
  } catch {
    return fallback;
  }
}

export function safeFormatTime(val?: number | string | null, fallback = '--:--'): string {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return fallback;
  }
}

export function safeFormatDateTime(val?: number | string | null, fallback = 'N/A'): string {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleString();
  } catch {
    return fallback;
  }
}
