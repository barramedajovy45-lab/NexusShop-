import { AppSettings, DiamondPackage, EscrowOrder, MlbbAccount, PaymentMethod, PriceAlert, SellerListing, SellerProfile, UserAccount } from '../types';
import { getDiamondAssetForPackage } from '../assets/diamondAssets';

export const KNOWN_MLBB_ACCOUNTS: Record<string, MlbbAccount> = {
  '84729103-3092': {
    userId: '84729103',
    zoneId: '3092',
    ign: '꧁༺VΞNØM_99༻꧂',
    serverRegion: 'Philippines (PH-SEA)',
    rank: 'Mythic Immortal 112★',
    level: 78,
    isVerified: true,
  },
  '12345678-2045': {
    userId: '12345678',
    zoneId: '2045',
    ign: 'ChouGod_Tzy',
    serverRegion: 'Indonesia (ID-SEA)',
    rank: 'Mythic Glory 76★',
    level: 65,
    isVerified: true,
  },
  '55443322-4012': {
    userId: '55443322',
    zoneId: '4012',
    ign: 'LunoxMain_PH',
    serverRegion: 'Philippines (PH-SEA)',
    rank: 'Mythic Honor 42★',
    level: 54,
    isVerified: true,
  },
  '99887766-6021': {
    userId: '99887766',
    zoneId: '6021',
    ign: 'ShadowBlade_MY',
    serverRegion: 'Malaysia (MY-SEA)',
    rank: 'Legend I (4★)',
    level: 49,
    isVerified: true,
  },
  '45678912-3150': {
    userId: '45678912',
    zoneId: '3150',
    ign: 'Fanny_Aeroplane',
    serverRegion: 'Singapore (SG)',
    rank: 'Mythic Immortal 145★',
    level: 85,
    isVerified: true,
  },
  '78912345-2198': {
    userId: '78912345',
    zoneId: '2198',
    ign: 'Hayabusa_Shadow',
    serverRegion: 'Philippines (PH-SEA)',
    rank: 'Mythic Glory 89★',
    level: 72,
    isVerified: true,
  },
};

export function sanitizeMlbbId(val?: string | number | null): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/\D/g, '');
}

export function parseCombinedMlbbInput(input?: string | null): { userId: string; zoneId: string } | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  // Match flexible patterns like "84729103 (3092)", "84729103(3092)", "84729103-3092", "ID: 84729103 Zone: 3092"
  const flexibleMatch = trimmed.match(/(?:id[:\s]*)?(\d{6,10})[^\d]+(?:zone[:\s]*)?(\d{3,5})/i);
  if (flexibleMatch) {
    return { userId: flexibleMatch[1], zoneId: flexibleMatch[2] };
  }
  const match = trimmed.match(/^(\d{6,10})\s*[\(\[\-,\s/]+\s*(\d{3,5})[\)\]]?$/);
  if (match) {
    return { userId: match[1], zoneId: match[2] };
  }
  return null;
}

export function lookupOrGenerateMlbbAccount(userId?: string | number | null, zoneId?: string | number | null): MlbbAccount {
  const safeU = userId !== null && userId !== undefined ? String(userId).trim() : '';
  const safeZ = zoneId !== null && zoneId !== undefined ? String(zoneId).trim() : '';
  const cleanU = sanitizeMlbbId(safeU) || safeU;
  const cleanZ = sanitizeMlbbId(safeZ) || safeZ;
  const key = `${cleanU}-${cleanZ}`;

  if (KNOWN_MLBB_ACCOUNTS[key]) {
    return {
      ...KNOWN_MLBB_ACCOUNTS[key],
      userId: cleanU || '84729103',
      zoneId: cleanZ || '3092',
    };
  }

  // Check original raw key as well
  const rawKey = `${safeU}-${safeZ}`;
  if (KNOWN_MLBB_ACCOUNTS[rawKey]) {
    return {
      ...KNOWN_MLBB_ACCOUNTS[rawKey],
      userId: cleanU || '84729103',
      zoneId: cleanZ || '3092',
    };
  }

  // Dynamic realistic generation for any valid user input
  const ranks = [
    'Mythic Immortal 95★',
    'Mythic Glory 68★',
    'Mythic Honor 34★',
    'Mythic (15★)',
    'Legend II (3★)',
    'Legend I (4★)',
    'Epic I',
    'Grandmaster I'
  ];
  const prefixes = ['Neo', 'Aura', 'Echo', 'Blacklist', 'Onic', 'RSG', 'Nexus', 'Silent', 'Viper', 'Kairi', 'Wise', 'Karl'];
  const suffixes = ['Slayer', 'Carry', 'Reaper', 'Sniper', 'Mage', 'Tzy', 'God', 'Pro', 'King', 'Main', 'Lord', 'Assassin'];
  const regions = [
    'Philippines (PH-SEA)',
    'Indonesia (ID-SEA)',
    'Malaysia (MY-SEA)',
    'Singapore (SG)',
    'Global Server (US/EU)',
    'Cambodia (KH-SEA)'
  ];

  const parsedU = parseInt((cleanU || '84729103').slice(-4), 10);
  const parsedZ = parseInt(cleanZ || '3092', 10);
  const numSeed = Math.abs((isNaN(parsedU) ? 1234 : parsedU) + (isNaN(parsedZ) ? 2000 : parsedZ));

  const p = prefixes[numSeed % prefixes.length] || 'Nexus';
  const s = suffixes[(numSeed * 3) % suffixes.length] || 'Player';
  const rank = ranks[numSeed % ranks.length] || 'Mythic Honor 34★';
  const region = regions[(numSeed * 7) % regions.length] || 'Philippines (PH-SEA)';
  const level = 30 + (numSeed % 55);

  return {
    userId: cleanU || '84729103',
    zoneId: cleanZ || '3092',
    ign: `${p}_${s}`,
    serverRegion: region,
    rank,
    level,
    isVerified: true,
  };
}

const RAW_DIAMOND_PACKAGES: DiamondPackage[] = [
  {
    id: 'pkg_10',
    name: '10 Diamonds',
    diamonds: 10,
    bonusDiamonds: 1,
    pricePhp: 6,
    regularPricePhp: 9,
    regularPriceUsd: 0.15,
    discountPriceUsd: 0.10,
    badge: '6 Piso Deal',
  },
  {
    id: 'pkg_15',
    name: '15 Diamonds',
    diamonds: 15,
    bonusDiamonds: 1,
    pricePhp: 12,
    regularPricePhp: 16,
    regularPriceUsd: 0.27,
    discountPriceUsd: 0.21,
    badge: '12 Piso Deal',
  },
  {
    id: 'pkg_20',
    name: '20 Diamonds',
    diamonds: 20,
    bonusDiamonds: 2,
    pricePhp: 16,
    regularPricePhp: 22,
    regularPriceUsd: 0.38,
    discountPriceUsd: 0.27,
    badge: '16 Piso Deal',
  },
  {
    id: 'pkg_25',
    name: '25 Diamonds',
    diamonds: 25,
    bonusDiamonds: 2,
    pricePhp: 22,
    regularPricePhp: 28,
    regularPriceUsd: 0.48,
    discountPriceUsd: 0.38,
    badge: '22 Piso Deal',
  },
  {
    id: 'pkg_30',
    name: '30 Diamonds',
    diamonds: 30,
    bonusDiamonds: 3,
    pricePhp: 26,
    regularPricePhp: 35,
    regularPriceUsd: 0.60,
    discountPriceUsd: 0.44,
    badge: '26 Piso Deal',
    popular: true,
  },
  {
    id: 'pkg_35',
    name: '35 Diamonds',
    diamonds: 35,
    bonusDiamonds: 3,
    pricePhp: 31,
    regularPricePhp: 42,
    regularPriceUsd: 0.72,
    discountPriceUsd: 0.53,
    badge: '31 Piso Deal',
  },
  {
    id: 'pkg_40',
    name: '40 Diamonds',
    diamonds: 40,
    bonusDiamonds: 4,
    pricePhp: 37,
    regularPricePhp: 48,
    regularPriceUsd: 0.82,
    discountPriceUsd: 0.63,
    badge: '37 Piso Deal',
  },
  {
    id: 'pkg_45',
    name: '45 Diamonds',
    diamonds: 45,
    bonusDiamonds: 4,
    pricePhp: 40,
    regularPricePhp: 52,
    regularPriceUsd: 0.89,
    discountPriceUsd: 0.68,
    badge: '40 Piso Deal',
  },
  {
    id: 'pkg_50',
    name: '50 Diamonds',
    diamonds: 50,
    bonusDiamonds: 5,
    pricePhp: 45,
    regularPricePhp: 58,
    regularPriceUsd: 1.00,
    discountPriceUsd: 0.77,
    badge: '45 Piso Deal',
    popular: true,
  },
  {
    id: 'pkg_86',
    name: '86 Diamonds',
    diamonds: 86,
    bonusDiamonds: 8,
    pricePhp: 87,
    regularPricePhp: 115,
    regularPriceUsd: 1.99,
    discountPriceUsd: 1.49,
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'pkg_172',
    name: '172 Diamonds',
    diamonds: 172,
    bonusDiamonds: 16,
    pricePhp: 172,
    regularPricePhp: 230,
    regularPriceUsd: 3.99,
    discountPriceUsd: 2.95,
  },
  {
    id: 'pkg_257',
    name: '257 Diamonds',
    diamonds: 257,
    bonusDiamonds: 25,
    pricePhp: 255,
    regularPricePhp: 350,
    regularPriceUsd: 5.99,
    discountPriceUsd: 4.35,
    badge: 'Popular',
    popular: true,
  },
  {
    id: 'pkg_wdp',
    name: 'Weekly Diamond Pass',
    diamonds: 220,
    bonusDiamonds: 70,
    pricePhp: 115,
    regularPricePhp: 175,
    regularPriceUsd: 2.99,
    discountPriceUsd: 1.99,
    isPass: true,
    passType: 'weekly_pass',
    badge: 'Best Value',
    popular: true,
  },
  {
    id: 'pkg_344',
    name: '344 Diamonds',
    diamonds: 344,
    bonusDiamonds: 34,
    pricePhp: 336,
    regularPricePhp: 465,
    regularPriceUsd: 7.99,
    discountPriceUsd: 5.75,
  },
  {
    id: 'pkg_twilight',
    name: 'Twilight Pass',
    diamonds: 500,
    bonusDiamonds: 120,
    pricePhp: 520,
    regularPricePhp: 700,
    regularPriceUsd: 11.99,
    discountPriceUsd: 8.90,
    isPass: true,
    passType: 'twilight_pass',
    badge: 'Exclusive Skins',
  },
  {
    id: 'pkg_706',
    name: '706 Diamonds',
    diamonds: 706,
    bonusDiamonds: 71,
    pricePhp: 655,
    regularPricePhp: 875,
    regularPriceUsd: 14.99,
    discountPriceUsd: 11.20,
    badge: 'Best Value',
    popular: true,
  },
  {
    id: 'pkg_2195',
    name: '2,195 Diamonds',
    diamonds: 2195,
    bonusDiamonds: 235,
    pricePhp: 1960,
    regularPricePhp: 2630,
    regularPriceUsd: 44.99,
    discountPriceUsd: 33.50,
    badge: 'Collector Pack',
  },
  {
    id: 'pkg_3688',
    name: '3,688 Diamonds',
    diamonds: 3688,
    bonusDiamonds: 420,
    pricePhp: 3210,
    regularPricePhp: 4380,
    regularPriceUsd: 74.99,
    discountPriceUsd: 54.90,
  },
  {
    id: 'pkg_5532',
    name: '5,532 Diamonds',
    diamonds: 5532,
    bonusDiamonds: 650,
    pricePhp: 4680,
    regularPricePhp: 6430,
    regularPriceUsd: 109.99,
    discountPriceUsd: 79.99,
    badge: 'Wholesale Whale',
  },
];

export const DIAMOND_PACKAGES: DiamondPackage[] = RAW_DIAMOND_PACKAGES.map((pkg) => ({
  ...pkg,
  image: getDiamondAssetForPackage(pkg),
}));

export const DEFAULT_GATEWAY_PAYMENT_METHODS: PaymentMethod[] = [
  'gcash',
  'maya',
  'google_pay',
  'apple_pay',
  'paypal',
  'dana',
  'ovo',
  'gopay',
  'bank_transfer',
  'fpx',
  'card',
  'qris',
  'tng',
  'grabpay',
  'shopeepay',
  'truemoney',
  'paynow',
  'promptpay',
  'pix',
];

export const INITIAL_SELLERS: SellerListing[] = [
  {
    id: 'listing_p10',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 1,
    packageId: 'pkg_10',
    diamonds: 10,
    priceUsd: 0.10,
    pricePhp: 6,
    stock: 9999,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_p15',
    sellerId: 'sel_mythic',
    sellerName: 'MythicVault_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicVault&backgroundColor=0d9488',
    sellerRating: 4.97,
    totalOrders: 8940,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_15',
    diamonds: 15,
    priceUsd: 0.21,
    pricePhp: 12,
    stock: 5800,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  },
  {
    id: 'listing_p20',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 1,
    packageId: 'pkg_20',
    diamonds: 20,
    priceUsd: 0.27,
    pricePhp: 16,
    stock: 8400,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_p25',
    sellerId: 'sel_mythic',
    sellerName: 'MythicVault_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicVault&backgroundColor=0d9488',
    sellerRating: 4.97,
    totalOrders: 8940,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_25',
    diamonds: 25,
    priceUsd: 0.38,
    pricePhp: 22,
    stock: 6700,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  },
  {
    id: 'listing_p30',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 1,
    packageId: 'pkg_30',
    diamonds: 30,
    priceUsd: 0.44,
    pricePhp: 26,
    stock: 9200,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_p35',
    sellerId: 'sel_mythic',
    sellerName: 'MythicVault_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicVault&backgroundColor=0d9488',
    sellerRating: 4.97,
    totalOrders: 8940,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_35',
    diamonds: 35,
    priceUsd: 0.53,
    pricePhp: 31,
    stock: 7500,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  },
  {
    id: 'listing_p40',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 1,
    packageId: 'pkg_40',
    diamonds: 40,
    priceUsd: 0.63,
    pricePhp: 37,
    stock: 6300,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_p45',
    sellerId: 'sel_mythic',
    sellerName: 'MythicVault_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicVault&backgroundColor=0d9488',
    sellerRating: 4.97,
    totalOrders: 8940,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_45',
    diamonds: 45,
    priceUsd: 0.68,
    pricePhp: 40,
    stock: 5400,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  },
  {
    id: 'listing_p50',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 1,
    packageId: 'pkg_50',
    diamonds: 50,
    priceUsd: 0.77,
    pricePhp: 45,
    stock: 9900,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_1',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_86',
    diamonds: 86,
    priceUsd: 1.45,
    pricePhp: 85,
    stock: 940,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_2',
    sellerId: 'sel_mythic',
    sellerName: 'MythicVault_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicVault&backgroundColor=0d9488',
    sellerRating: 4.97,
    totalOrders: 8940,
    avgDeliveryMinutes: 3,
    packageId: 'pkg_257',
    diamonds: 257,
    priceUsd: 4.25,
    stock: 580,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  },
  {
    id: 'listing_3',
    sellerId: 'sel_indo',
    sellerName: 'GarudaDiamond_Store',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GarudaStore&backgroundColor=f59e0b',
    sellerRating: 4.95,
    totalOrders: 6410,
    avgDeliveryMinutes: 4,
    packageId: 'pkg_706',
    diamonds: 706,
    priceUsd: 10.99,
    stock: 310,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.6,
  },
  {
    id: 'listing_4',
    sellerId: 'sel_wdp_king',
    sellerName: 'PassMaster_SEA',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PassMaster&backgroundColor=6366f1',
    sellerRating: 4.98,
    totalOrders: 11200,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_wdp',
    diamonds: 220,
    priceUsd: 1.95,
    stock: 1200,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_5',
    sellerId: 'sel_whale',
    sellerName: 'WhaleDepot_Global',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDepot&backgroundColor=10b981',
    sellerRating: 4.96,
    totalOrders: 4210,
    avgDeliveryMinutes: 5,
    packageId: 'pkg_5532',
    diamonds: 5532,
    priceUsd: 78.50,
    stock: 85,
    instantAutoDelivery: false,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.7,
  },
  {
    id: 'listing_6',
    sellerId: 'sel_clutch',
    sellerName: 'ClutchGamer_Direct',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClutchGamer&backgroundColor=ec4899',
    sellerRating: 4.91,
    totalOrders: 3180,
    avgDeliveryMinutes: 6,
    packageId: 'pkg_172',
    diamonds: 172,
    priceUsd: 2.89,
    stock: 420,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: false,
    completionRate: 99.4,
  },
  {
    id: 'listing_7',
    sellerId: 'sel_clutch',
    sellerName: 'ClutchGamer_Direct',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClutchGamer&backgroundColor=ec4899',
    sellerRating: 4.91,
    totalOrders: 3180,
    avgDeliveryMinutes: 4,
    packageId: 'pkg_344',
    diamonds: 344,
    priceUsd: 5.75,
    pricePhp: 335,
    stock: 450,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: false,
    completionRate: 99.5,
  },
  {
    id: 'listing_8',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    totalOrders: 14820,
    avgDeliveryMinutes: 2,
    packageId: 'pkg_2195',
    diamonds: 2195,
    priceUsd: 33.20,
    pricePhp: 1940,
    stock: 92,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.9,
  },
  {
    id: 'listing_9',
    sellerId: 'sel_whale',
    sellerName: 'WhaleDepot_Global',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhaleDepot&backgroundColor=10b981',
    sellerRating: 4.96,
    totalOrders: 4210,
    avgDeliveryMinutes: 5,
    packageId: 'pkg_3688',
    diamonds: 3688,
    priceUsd: 54.90,
    pricePhp: 3210,
    stock: 45,
    instantAutoDelivery: false,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.7,
  },
  {
    id: 'listing_10',
    sellerId: 'sel_wdp_king',
    sellerName: 'PassMaster_SEA',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PassMaster&backgroundColor=6366f1',
    sellerRating: 4.98,
    totalOrders: 11200,
    avgDeliveryMinutes: 3,
    packageId: 'pkg_twilight',
    diamonds: 0,
    priceUsd: 7.99,
    pricePhp: 465,
    stock: 38,
    instantAutoDelivery: true,
    acceptedPaymentMethods: DEFAULT_GATEWAY_PAYMENT_METHODS,
    isProSeller: true,
    completionRate: 99.8,
  }
];

export const INITIAL_SELLER_PROFILE: SellerProfile = {
  id: 'sel_apex',
  name: 'ApexTopUp_Official',
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
  email: 'escrow-dispatch@apextopup.io',
  rating: 4.99,
  totalSales: 14820,
  availableBalanceUsd: 482.50,
  escrowLockedBalanceUsd: 124.80,
  totalEarnedUsd: 18450.00,
  payoutMethods: {
    gcash: '0917-***-8842',
    maya: '0928-***-3319',
    bank: 'BDO Unibank (Acc #****-9012)',
    usdt: 'TQe8...9pLm (TRC20)',
  },
};

const RAW_INITIAL_ORDERS: EscrowOrder[] = [
  {
    id: 'ORD-71932',
    buyerId: 'user_sample_ph',
    buyerName: 'Alucard_Main_SEA',
    buyerEmail: 'alucard.ph@nexusmail.io',
    sellerId: 'official_mlbb_manual_operator',
    sellerName: 'Official MLBB Top-Up Channel (Manual Operator)',
    sellerAvatar: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=120&auto=format&fit=crop&q=80',
    sellerRating: 5.0,
    packageId: 'pkg_570',
    packageName: '570 Diamonds (+57 Bonus)',
    diamonds: 570,
    bonusDiamonds: 57,
    mlbbUserId: '92817462',
    mlbbZoneId: '5012',
    mlbbIgn: '★ ChouGod_PH ★',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 9.80,
    escrowFee: 0,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-9928172635',
    status: 'escrow_pending',
    autoReleaseMinutesRemaining: 1440,
    autoPay24hEnabled: true,
    autoPayDeadlineAt: Date.now() + 1000 * 60 * 60 * 23 + 1000 * 60 * 48, // ~23h 48m remaining on 24h auto-pay
    createdAt: Date.now() - 1000 * 60 * 12,
    escrowLockedAt: Date.now() - 1000 * 60 * 12,
    fulfillmentType: 'official_mlbb_manual',
    distributorProvider: 'Official MLBB Top-Up Channel (shop.mobilelegends.com)',
    distributorMode: 'official_channel_manual',
    chatMessages: [
      {
        id: 'msg_mlbb_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Vault',
        text: 'Order #ORD-71932 created via GCash (₱573.30). ⏱️ 24-Hour Auto-Pay Protocol Active: If the buyer does not manually complete payment within 24 hours, payment will automatically be processed and settled via the linked GCash / Wallet method.',
        timestamp: Date.now() - 1000 * 60 * 12,
      },
      {
        id: 'msg_mlbb_2',
        sender: 'seller',
        senderName: 'Shop Operator',
        text: 'Order reserved for User ID 92817462 (5012)! Complete payment now or let 24-Hour Auto-Pay handle it automatically.',
        timestamp: Date.now() - 1000 * 60 * 10,
      },
    ],
  },
  {
    id: 'ORD-64019',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'distributor_dashboard_codashop',
    sellerName: 'Codashop Enterprise (Official Partner Dashboard)',
    sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    sellerRating: 5.0,
    packageId: 'pkg_344',
    packageName: '344 Diamonds (+34 Bonus)',
    diamonds: 344,
    bonusDiamonds: 34,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 5.75,
    escrowFee: 0,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-7718293041',
    status: 'escrow_locked',
    autoReleaseMinutesRemaining: 15,
    autoPay24hEnabled: true,
    autoPayDeadlineAt: Date.now() + 1000 * 60 * 60 * 23 + 1000 * 60 * 56,
    createdAt: Date.now() - 1000 * 60 * 4,
    escrowLockedAt: Date.now() - 1000 * 60 * 3,
    fulfillmentType: 'authorized_distributor_dashboard',
    distributorProvider: 'Codashop Enterprise Merchant Center',
    distributorMode: 'official_dashboard',
    chatMessages: [
      {
        id: 'msg_dist_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Payment of ₱336.38 verified and secured in Aegis Escrow Vault. Order queued for Authorized Distributor Operator Fulfillment via official Codashop Merchant Portal (No direct API required).',
        timestamp: Date.now() - 1000 * 60 * 3,
      },
      {
        id: 'msg_dist_2',
        sender: 'seller',
        senderName: 'Distributor Operator (OP-409)',
        text: 'Provider does not supply a public API for this regional tier. An operator is fulfilling this order directly through the official provider dashboard.',
        timestamp: Date.now() - 1000 * 60 * 2,
      },
    ],
  },
  {
    id: 'ORD-89241',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    packageId: 'pkg_706',
    packageName: '706 Diamonds (+71 Bonus)',
    diamonds: 706,
    bonusDiamonds: 71,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 11.20,
    escrowFee: 0.17,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-9923847120',
    status: 'delivered_pending_confirmation',
    createdAt: Date.now() - 1000 * 60 * 12,
    escrowLockedAt: Date.now() - 1000 * 60 * 11,
    sellerStartedAt: Date.now() - 1000 * 60 * 8,
    proofUploadedAt: Date.now() - 1000 * 60 * 4,
    proofImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    moontonTransactionRef: 'MOON-SEA-89241-TX8812',
    autoReleaseMinutesRemaining: 11,
    autoPay24hEnabled: true,
    autoPayDeadlineAt: Date.now() + 1000 * 60 * 60 * 23 + 1000 * 60 * 48,
    chatMessages: [
      {
        id: 'msg_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Buyer funds verified via GCash! ₱655.20 has been safely locked in the Aegis Escrow Vault. Seller has been notified to top up MLBB User ID 84729103 (Zone: 3092).',
        timestamp: Date.now() - 1000 * 60 * 11,
      },
      {
        id: 'msg_2',
        sender: 'seller',
        senderName: 'ApexTopUp_Official',
        text: 'Hello! I received your order for 706+71 diamonds. I am processing your top-up via official Moonton merchant API now.',
        timestamp: Date.now() - 1000 * 60 * 8,
      },
      {
        id: 'msg_3',
        sender: 'seller',
        senderName: 'ApexTopUp_Official',
        text: 'Top-up successfully credited to in-game account: ꧁༺VΞNØM_99༻꧂. Attached Moonton Order Ref: MOON-SEA-89241-TX8812. Please open MLBB to confirm diamonds!',
        timestamp: Date.now() - 1000 * 60 * 4,
        isProof: true,
      },
      {
        id: 'msg_4',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Automated 15-minute inspection timer is active. If you do not raise a dispute, funds will be automatically released to the seller.',
        timestamp: Date.now() - 1000 * 60 * 4,
      }
    ],
  },
  {
    id: 'ORD-77312',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_wdp_king',
    sellerName: 'PassMaster_SEA',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PassMaster&backgroundColor=6366f1',
    sellerRating: 4.98,
    packageId: 'pkg_wdp',
    packageName: 'Weekly Diamond Pass',
    diamonds: 220,
    bonusDiamonds: 70,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 1.95,
    escrowFee: 0.05,
    paymentMethod: 'maya',
    paymentReference: 'MY-PH-8102381203',
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    escrowLockedAt: Date.now() - 1000 * 60 * 60 * 26,
    sellerStartedAt: Date.now() - 1000 * 60 * 60 * 25.8,
    proofUploadedAt: Date.now() - 1000 * 60 * 60 * 25.5,
    moontonTransactionRef: 'MOON-SEA-77312-WDP91',
    diamondsReceivedVerified: true,
    autoDetectedAt: Date.now() - 1000 * 60 * 60 * 25.4,
    antiAbuseStatus: 'protected',
    autoDetectionAudit: {
      verified: true,
      detectedAt: Date.now() - 1000 * 60 * 60 * 25.4,
      method: 'moonton_cluster_poll',
      serverCluster: 'moonton-sea-zone-3092.mobilelegends.com',
      moontonTransactionRef: 'MOON-SEA-77312-WDP91',
      accountIgn: '꧁༺VΞNØM_99༻꧂',
      userId: '84729103',
      zoneId: '3092',
      diamondsDelivered: 290,
      previousBalance: 52,
      newBalance: 342,
      latencyMs: 22,
      cryptographicProof: 'RSA4096-SHA256:MT-INGOT-77312-WDP-9921',
      antiAbuseLockActive: true,
      statusSummary: 'Moonton Server Node confirmed delivery of +290 Diamonds to character "꧁༺VΞNØM_99༻꧂". Balance verified.',
    },
    autoReleaseMinutesRemaining: 0,
    completedAt: Date.now() - 1000 * 60 * 60 * 25.3,
    feedback: {
      rating: 5,
      review: 'Ultra fast Weekly Pass activation! Received immediate Moonton confirmation.',
      createdAt: Date.now() - 1000 * 60 * 60 * 25,
      buyerName: 'You (barramedajovy75)',
    },
    chatMessages: [
      {
        id: 'msg_c1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Escrow confirmed and Weekly Pass successfully activated. Funds of ₱114.08 released to PassMaster_SEA.',
        timestamp: Date.now() - 1000 * 60 * 60 * 25.3,
      }
    ],
  },
  {
    id: 'ORD-55209',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_apex',
    sellerName: 'ApexTopUp_Official',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
    sellerRating: 4.99,
    packageId: 'pkg_1412',
    packageName: '1412 Diamonds (+142 Bonus)',
    diamonds: 1412,
    bonusDiamonds: 142,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 22.40,
    escrowFee: 0.35,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-8849102941',
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 72,
    escrowLockedAt: Date.now() - 1000 * 60 * 60 * 71.9,
    sellerStartedAt: Date.now() - 1000 * 60 * 60 * 71.8,
    proofUploadedAt: Date.now() - 1000 * 60 * 60 * 71.5,
    moontonTransactionRef: 'MOON-SEA-55209-TX1412',
    autoReleaseMinutesRemaining: 0,
    completedAt: Date.now() - 1000 * 60 * 60 * 71.2,
    feedback: {
      rating: 5,
      review: 'Legit top up, received all 1554 diamonds safely in my mailbox.',
      createdAt: Date.now() - 1000 * 60 * 60 * 71,
      buyerName: 'You (barramedajovy75)',
    },
    chatMessages: [
      {
        id: 'msg_55209_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Escrow vault released ₱1,310.40 to ApexTopUp_Official upon delivery confirmation.',
        timestamp: Date.now() - 1000 * 60 * 60 * 71.2,
      }
    ],
  },
  {
    id: 'ORD-44182',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_speedy',
    sellerName: 'SpeedyRecharge_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SpeedyRecharge&backgroundColor=10b981',
    sellerRating: 4.97,
    packageId: 'pkg_514',
    packageName: '514 Diamonds (+52 Bonus)',
    diamonds: 514,
    bonusDiamonds: 52,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 8.50,
    escrowFee: 0.15,
    paymentMethod: 'maya',
    paymentReference: 'MY-PH-9910248102',
    status: 'completed',
    createdAt: Date.now() - 1000 * 60 * 60 * 120,
    escrowLockedAt: Date.now() - 1000 * 60 * 60 * 119.8,
    sellerStartedAt: Date.now() - 1000 * 60 * 60 * 119.6,
    proofUploadedAt: Date.now() - 1000 * 60 * 60 * 119.4,
    moontonTransactionRef: 'MOON-SEA-44182-TX514',
    autoReleaseMinutesRemaining: 0,
    completedAt: Date.now() - 1000 * 60 * 60 * 119.1,
    feedback: {
      rating: 5,
      review: 'Super fast delivery in 3 mins. Verified on Moonton client.',
      createdAt: Date.now() - 1000 * 60 * 60 * 119,
      buyerName: 'You (barramedajovy75)',
    },
    chatMessages: [
      {
        id: 'msg_44182_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Escrow vault released ₱497.25 to SpeedyRecharge_PH.',
        timestamp: Date.now() - 1000 * 60 * 60 * 119.1,
      }
    ],
  },
  {
    id: 'ORD-93041',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_speedy',
    sellerName: 'SpeedyRecharge_PH',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SpeedyRecharge&backgroundColor=10b981',
    sellerRating: 4.97,
    packageId: 'pkg_344',
    packageName: '344 Diamonds (+34 Bonus)',
    diamonds: 344,
    bonusDiamonds: 34,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 5.75,
    escrowFee: 0.10,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-4910294102',
    status: 'escrow_locked',
    createdAt: Date.now() - 1000 * 60 * 3,
    escrowLockedAt: Date.now() - 1000 * 60 * 2.8,
    autoReleaseMinutesRemaining: 15,
    chatMessages: [
      {
        id: 'msg_lk1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Buyer funds verified via GCash! ₱336.38 locked safely in Aegis Escrow Vault. Seller SpeedyRecharge_PH notified to initiate top-up.',
        timestamp: Date.now() - 1000 * 60 * 2.8,
      }
    ],
  },
  {
    id: 'ORD-61902',
    buyerId: 'user_current',
    buyerName: 'You (barramedajovy75)',
    buyerEmail: 'barramedajovy75@gmail.com',
    sellerId: 'sel_clutch',
    sellerName: 'ClutchGamer_Direct',
    sellerAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ClutchGamer&backgroundColor=ec4899',
    sellerRating: 4.91,
    packageId: 'pkg_172',
    packageName: '172 Diamonds (+16 Bonus)',
    diamonds: 172,
    bonusDiamonds: 16,
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺VΞNØM_99༻꧂',
    mlbbServer: 'Philippines (PH-SEA)',
    currency: 'PHP',
    amount: 2.89,
    escrowFee: 0.05,
    paymentMethod: 'gcash',
    paymentReference: 'GC-PH-1902482012',
    status: 'cancelled',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    escrowLockedAt: Date.now() - 1000 * 60 * 60 * 7.9,
    cancelledAt: Date.now() - 1000 * 60 * 60 * 7.5,
    cancellationReason: 'Incorrect MLBB User ID or Zone ID entered',
    cancellationNotes: 'Mistyped zone ID as 3029 instead of 3092. Cancelled before seller dispatch.',
    refundTransactionRef: 'RF-89241-TX99',
    refundedAmount: 2.89,
    autoReleaseMinutesRemaining: 0,
    chatMessages: [
      {
        id: 'msg_can_1',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: 'Buyer funds verified via GCash! ₱169.07 locked safely in Aegis Escrow Vault.',
        timestamp: Date.now() - 1000 * 60 * 60 * 7.9,
      },
      {
        id: 'msg_can_2',
        sender: 'system',
        senderName: 'Nexus Shop Escrow Bot',
        text: '🚫 Diamond order cancelled by Buyer. Reason: "Incorrect MLBB User ID or Zone ID entered". 100% of escrow vault payment (₱169.07) refunded to buyer GCash. Zero cancellation penalty.',
        timestamp: Date.now() - 1000 * 60 * 60 * 7.5,
      }
    ],
  }
];

export const INITIAL_ORDERS: EscrowOrder[] = RAW_INITIAL_ORDERS.map((o) => ({
  ...o,
  packageImage: getDiamondAssetForPackage({
    id: o.packageId,
    diamonds: o.diamonds,
    packageName: o.packageName,
  }),
}));

export const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alert_wdp',
    packageId: 'pkg_wdp',
    packageName: 'Weekly Diamond Pass',
    diamonds: 220,
    bonusDiamonds: 70,
    targetPriceUsd: 1.85,
    targetCurrency: 'PHP',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    isActive: true,
    triggerCount: 0,
    notes: 'Notify when Weekly Pass drops below $1.85 / ~₱108',
  },
  {
    id: 'alert_706',
    packageId: 'pkg_706',
    packageName: '706 Diamonds',
    diamonds: 706,
    bonusDiamonds: 71,
    targetPriceUsd: 10.50,
    targetCurrency: 'PHP',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    isActive: true,
    triggerCount: 0,
    notes: 'Notify when 706 pack drops below $10.50 / ~₱614',
  },
  {
    id: 'alert_257',
    packageId: 'pkg_257',
    packageName: '257 Diamonds',
    diamonds: 257,
    bonusDiamonds: 25,
    targetPriceUsd: 4.10,
    targetCurrency: 'PHP',
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    isActive: true,
    triggerCount: 1,
    lastTriggeredAt: Date.now() - 1000 * 60 * 45,
    notes: 'Targeting flash discount for Starlight subscription',
  }
];

export const DEVELOPER_EMAIL = 'barramedajacob36@gmail.com';
export const DEVELOPER_NAME = 'RALPH JAYCOB BARRAMEDA';
export const APP_VERSION = '1.1.0';

/**
 * Big Diamond Packages:
 * Packages with 700+ diamonds (e.g. 706, 2195, 3688, 5532 diamonds, Twilight Pass).
 * Strictly FREE (₱0.00 / $0.00, No Payment) for Developer and VIP ONLY.
 * Standard buyers and regular users must pay the regular price.
 */
export function isBigDiamondPackage(
  pkg?: DiamondPackage | { id?: string; diamonds: number; bonusDiamonds?: number } | null
): boolean {
  if (!pkg) return false;
  if (pkg.id === 'pkg_706' || pkg.id === 'pkg_2195' || pkg.id === 'pkg_3688' || pkg.id === 'pkg_5532' || pkg.id === 'pkg_twilight') {
    return true;
  }
  const total = (pkg.diamonds || 0) + (pkg.bonusDiamonds || 0);
  return total >= 700 || (pkg.diamonds || 0) >= 700;
}

export function isDeveloperUser(user?: UserAccount | null): boolean {
  if (!user) return false;
  if (user.isDeveloper === true) return true;
  if (user.developerPrivileges?.freeDiamondsAll) return true;
  const email = (user.email || '').toLowerCase().trim();
  if (email === DEVELOPER_EMAIL.toLowerCase() || email.includes('barramedajacob36')) return true;
  const name = (user.name || '').toUpperCase().trim();
  if (
    name.includes('RALPH JAYCOB BARRAMEDA') ||
    (name.includes('RALPH') && name.includes('BARRAMEDA')) ||
    (name.includes('JAYCOB') && name.includes('BARRAMEDA'))
  ) {
    return true;
  }
  const username = (user.username || '').toUpperCase().trim();
  if (
    username.includes('RALPH') && username.includes('BARRAMEDA') ||
    username.includes('JACOB_DEV') ||
    username.includes('BARRAMEDAJACOB')
  ) {
    return true;
  }
  return false;
}

export function isVipUser(user?: UserAccount | null): boolean {
  if (!user) return false;
  if (isDeveloperUser(user)) return true;
  if (user.isVip === true) return true;
  if (user.tier && (user.tier.toLowerCase().includes('vip') || user.tier === 'VIP Mythic' || user.tier === 'VIP Developer')) {
    return true;
  }
  const email = (user.email || '').toLowerCase().trim();
  if (email === DEVELOPER_EMAIL.toLowerCase() || email.includes('barramedajacob36')) return true;
  const name = (user.name || '').toUpperCase().trim();
  if (
    name.includes('RALPH JAYCOB BARRAMEDA') ||
    (name.includes('RALPH') && name.includes('BARRAMEDA')) ||
    (name.includes('JAYCOB') && name.includes('BARRAMEDA'))
  ) {
    return true;
  }
  return false;
}

export const VIP_UPGRADE_PRICE_PHP = 950;
export const VIP_FREE_DIAMOND_PACKAGES = [172];
export const VIP_FREE_CLAIM_LIMIT = 2;
export const VIP_FREE_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day)
export const VIP_DIAMOND_DISCOUNT_PERCENT = 50; // 50% discount on diamond purchases

export interface VipFreeClaimStatus {
  isVip: boolean;
  isDeveloper: boolean;
  claimsUsed: number;
  maxClaims: number;
  canClaimNow: boolean;
  cooldownRemainingMs: number;
  cooldownRemainingFormatted: string;
  reason?: string;
}

export function getVipFreeClaimStatus(user?: UserAccount | null): VipFreeClaimStatus {
  if (!user) {
    return {
      isVip: false,
      isDeveloper: false,
      claimsUsed: 0,
      maxClaims: VIP_FREE_CLAIM_LIMIT,
      canClaimNow: false,
      cooldownRemainingMs: 0,
      cooldownRemainingFormatted: '',
      reason: 'Sign in and upgrade to VIP (₱950) to unlock free diamonds.',
    };
  }

  // Developer has unlimited free diamonds on all packages
  if (isDeveloperUser(user)) {
    return {
      isVip: true,
      isDeveloper: true,
      claimsUsed: 0,
      maxClaims: 9999,
      canClaimNow: true,
      cooldownRemainingMs: 0,
      cooldownRemainingFormatted: '',
    };
  }

  const isVip = isVipUser(user);
  if (!isVip) {
    return {
      isVip: false,
      isDeveloper: false,
      claimsUsed: 0,
      maxClaims: VIP_FREE_CLAIM_LIMIT,
      canClaimNow: false,
      cooldownRemainingMs: 0,
      cooldownRemainingFormatted: '',
      reason: 'VIP membership required (₱950). Upgrade to claim free diamonds!',
    };
  }

  const claimsUsed = user.vipFreeClaimCount || 0;
  if (claimsUsed >= VIP_FREE_CLAIM_LIMIT) {
    return {
      isVip: true,
      isDeveloper: false,
      claimsUsed,
      maxClaims: VIP_FREE_CLAIM_LIMIT,
      canClaimNow: false,
      cooldownRemainingMs: 0,
      cooldownRemainingFormatted: '',
      reason: 'VIP free diamond quota complete (2 of 2 used). Enjoy 50% OFF all diamond packages!',
    };
  }

  const lastClaim = user.vipLastFreeClaimTimestamp || 0;
  const elapsed = Date.now() - lastClaim;
  if (lastClaim > 0 && elapsed < VIP_FREE_CLAIM_COOLDOWN_MS) {
    const remainingMs = VIP_FREE_CLAIM_COOLDOWN_MS - elapsed;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const formatted = `${hours}h ${mins}m`;
    return {
      isVip: true,
      isDeveloper: false,
      claimsUsed,
      maxClaims: VIP_FREE_CLAIM_LIMIT,
      canClaimNow: false,
      cooldownRemainingMs: remainingMs,
      cooldownRemainingFormatted: formatted,
      reason: `Please wait 1 day between free claims. Next claim available in ${formatted}.`,
    };
  }

  return {
    isVip: true,
    isDeveloper: false,
    claimsUsed,
    maxClaims: VIP_FREE_CLAIM_LIMIT,
    canClaimNow: true,
    cooldownRemainingMs: 0,
    cooldownRemainingFormatted: '',
  };
}

/**
 * Checks if a specific package is 100% FREE for this user.
 * - Developer: ALL packages are free.
 * - VIP: ONLY 172 diamonds is free, limited to 2 claims total, with a 24h wait between claims.
 * - Non-VIP / Non-Developer: Not free.
 */
export function isPackageFreeForUser(
  pkg: DiamondPackage,
  user?: UserAccount | null
): {
  isFree: boolean;
  isVipFree: boolean;
  isDevFree: boolean;
  status: VipFreeClaimStatus;
} {
  const status = getVipFreeClaimStatus(user);

  if (isDeveloperUser(user)) {
    return { isFree: true, isVipFree: false, isDevFree: true, status };
  }

  if (isVipUser(user)) {
    const isFreeDiamondTier = pkg.diamonds === 172;
    if (isFreeDiamondTier && status.canClaimNow) {
      return { isFree: true, isVipFree: true, isDevFree: false, status };
    }
  }

  return { isFree: false, isVipFree: false, isDevFree: false, status };
}

/**
 * 100% Free Everything Privilege (No Payment for Developer).
 * Developers receive ALL diamond packages and BIG DIAMONDS completely FREE.
 * VIP users receive 172 diamonds free (limit 2, 24h cooldown) and 50% discount on all purchases.
 */
export function isEligibleForFreeEverything(
  user?: UserAccount | null,
  emailOrNameInput?: string
): boolean {
  if (isDeveloperUser(user)) return true;
  if (emailOrNameInput) {
    const clean = emailOrNameInput.toLowerCase().trim();
    if (clean === DEVELOPER_EMAIL.toLowerCase() || clean.includes('barramedajacob36') || clean.includes('jacob_dev')) {
      return true;
    }
    const cleanUpper = emailOrNameInput.toUpperCase().trim();
    if (
      cleanUpper.includes('RALPH JAYCOB BARRAMEDA') ||
      (cleanUpper.includes('RALPH') && cleanUpper.includes('BARRAMEDA')) ||
      (cleanUpper.includes('JAYCOB') && cleanUpper.includes('BARRAMEDA'))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Strict Security Protocol:
 * ONLY Platform Developers and Verified VIP Members have authorization to sell diamonds.
 * Regular buyers CANNOT sell diamonds or create listings.
 */
export function canSellDiamonds(user?: UserAccount | null): boolean {
  if (!user) return false;
  return isDeveloperUser(user) || isVipUser(user);
}

export function getSellerPermissionDetails(user?: UserAccount | null): {
  canSell: boolean;
  roleTitle: string;
  badgeLabel: string;
  description: string;
} {
  if (!user) {
    return {
      canSell: false,
      roleTitle: 'Guest / Unauthenticated Buyer',
      badgeLabel: 'Cannot Sell',
      description: 'Sign in with a verified VIP Member or Developer account to sell diamonds.',
    };
  }
  if (isDeveloperUser(user)) {
    return {
      canSell: true,
      roleTitle: 'Platform Developer (Creator)',
      badgeLabel: 'Developer Authorized Seller',
      description: 'Full authorization to sell diamonds, manage liquidity, and fulfill escrow transactions.',
    };
  }
  if (isVipUser(user)) {
    return {
      canSell: true,
      roleTitle: 'VIP Verified Merchant',
      badgeLabel: 'VIP Authorized Seller',
      description: 'Verified VIP member with escrow clearance to sell diamonds and list packages.',
    };
  }
  return {
    canSell: false,
    roleTitle: 'Standard Buyer',
    badgeLabel: 'Selling Restricted (Buyer Only)',
    description: 'Diamond selling is strictly restricted to Developers and VIP accounts. Buyers are only permitted to purchase.',
  };
}

export function createStandardBuyerAccount(): UserAccount {
  return {
    id: 'usr_buyer_alex',
    email: 'alex_buyer@gmail.com',
    name: 'Alex Rivera',
    username: 'alex_gamer',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=alexrivera&backgroundColor=10b981',
    role: 'buyer',
    mlbbUserId: '91823746',
    mlbbZoneId: '2109',
    mlbbIgn: '⚔️ALEX_LEGEND⚔️',
    serverRegion: 'Philippines (PH-SEA)',
    tier: 'Diamond Gold',
    isVip: false,
    isDeveloper: false,
    isEmailVerified: true,
    twoFactorEnabled: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    preferredCurrency: 'PHP',
    preferredPaymentMethod: 'gcash',
    totalOrdersCount: 2,
    totalDiamondsPurchased: 514,
    walletBalanceUsd: 2.50,
    securityBadges: ['Aegis Buyer Shield', 'Email Verified'],
  };
}

export function createDeveloperAccount(): UserAccount {
  return {
    id: 'usr_dev_jacob',
    email: DEVELOPER_EMAIL,
    name: 'RALPH JAYCOB BARRAMEDA',
    username: 'jacob_dev',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=barramedajacob36&backgroundColor=7c3aed',
    role: 'buyer',
    mlbbUserId: '84729103',
    mlbbZoneId: '3092',
    mlbbIgn: '꧁༺JACØB_DEV༻꧂',
    serverRegion: 'Philippines (PH-SEA)',
    tier: 'VIP Developer',
    isVip: true,
    isDeveloper: true,
    developerPrivileges: {
      freeDiamondsAll: true,
      unlimitedQuota: true,
      bypassPayment: true,
      adminBadges: [
        '👑 Lead App Developer & Creator',
        'VIP Master Access',
        '100% Free Diamonds Grant (All Packs ₱0.00)',
        'Moonton Root Verified Partner'
      ],
    },
    isEmailVerified: true,
    twoFactorEnabled: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
    preferredCurrency: 'PHP',
    preferredPaymentMethod: 'gcash',
    totalOrdersCount: 99,
    totalDiamondsPurchased: 999999,
    walletBalanceUsd: 9999.00,
    phone: '+63 917 849 2091',
    securityBadges: [
      '👑 Lead App Developer',
      'VIP Master Tier',
      'Free Diamond Authority',
      'Moonton Root Auth',
      'Aegis Master Shield'
    ],
    authProvider: 'google',
  };
}

export const INITIAL_USER_ACCOUNT: UserAccount = {
  id: 'user_current',
  email: 'barramedajovy75@gmail.com',
  name: 'Jovy Barrameda',
  username: 'barramedajovy75',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=barramedajovy75&backgroundColor=0284c7',
  role: 'buyer',
  mlbbUserId: '84729103',
  mlbbZoneId: '3092',
  mlbbIgn: '꧁༺VΞNØM_99༻꧂',
  serverRegion: 'Philippines (PH-SEA)',
  tier: 'VIP Mythic',
  isVip: true,
  isDeveloper: false,
  isEmailVerified: true,
  twoFactorEnabled: true,
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45, // 45 days ago
  vipPurchasedAt: Date.now() - 1000 * 60 * 60 * 24 * 6, // Purchased 6 days ago
  vipExpiry: Date.now() + 1000 * 60 * 60 * 24 * 24 + 1000 * 60 * 60 * 14, // 24 days & 14 hours remaining until renewal
  preferredCurrency: 'PHP',
  preferredPaymentMethod: 'gcash',
  totalOrdersCount: 6,
  totalDiamondsPurchased: 4560,
  walletBalanceUsd: 15.50,
  phone: '+63 917 849 2091',
  securityBadges: ['Aegis Buyer Shield', 'Verified Mobile ID', 'Moonton Linked', '2FA Protected'],
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  currency: 'PHP',
  theme: 'dark',
  bgEffect: 'aurora_mesh',
  bgGlowColor: 'cyan',
  bgEffectIntensity: 'balanced',
  bgAnimateEffects: true,
  language: 'en',
  compactMode: false,
  soundEnabled: false,
  soundVolume: 0,
  playPriceAlertSound: false,
  playOrderSuccessSound: false,
  enableToasts: true,
  autoDismissToastsSeconds: 6,
  notifyOnPriceDrops: true,
  notifyOnEscrowStatusChange: true,
  notifyOnChatMessages: true,
  defaultPaymentMethod: 'gcash',
  autoFillLinkedMlbbId: true,
  require2FAForDisputes: true,
  privacyMaskIgn: false,
  fastCheckoutOneClick: true,
  autoOpenTrackerOnOrder: true,
  autoPay24hEnabled: true,
};
