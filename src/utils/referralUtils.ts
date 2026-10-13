import { EscrowOrder, ReferralRecord, UserAccount, UserReferralData } from '../types';

const REFERRAL_STORAGE_PREFIX = 'nexus_referrals_';
const GLOBAL_REFERRALS_REGISTRY = 'nexus_referrals_registry';

/**
 * Deterministic short code generator based on user details
 */
export function getUserReferralCode(user: UserAccount | null | undefined): string {
  if (!user) return 'NX-EXPLORER-101';
  if (user.referralCode) return user.referralCode;

  // Personalized memorable code based on name/email
  const cleanName = (user.username || user.name.split(' ')[0] || 'HERO')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  
  if (user.email.includes('jovy') || user.id === 'user_current') {
    return 'NX-JOVY-75';
  }
  if (user.email.includes('jacob') || user.id === 'usr_dev_jacob') {
    return 'NX-JACOB-VIP';
  }

  // Generate clean 4-character deterministic suffix from id
  let hash = 0;
  const idStr = user.id || user.email;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const suffix = Math.abs(hash % 9000 + 1000);
  return `NX-${cleanName.slice(0, 6)}-${suffix}`;
}

/**
 * Builds the canonical shareable invite link
 */
export function getInviteUrl(code: string): string {
  if (typeof window === 'undefined') return `https://nexusshop.store/?ref=${code}`;
  const origin = window.location.origin;
  const pathname = window.location.pathname === '/' ? '' : window.location.pathname;
  return `${origin}${pathname}?ref=${encodeURIComponent(code)}`;
}

/**
 * Starter mock data for demo users so the referral dashboard is immediately engaging
 */
function getStarterReferralData(code: string, userId: string): UserReferralData {
  const isJovy = userId === 'user_current' || code.includes('JOVY');
  
  const starterReferrals: ReferralRecord[] = isJovy
    ? [
        {
          id: 'ref_rec_101',
          referrerUserId: userId,
          referrerCode: code,
          referredUserId: 'usr_squad_mark',
          referredUserName: 'Mark Vincent (ChouGod)',
          referredUserEmail: 'mark.chou@gmail.com',
          referredUserIgn: '⚔️ ChouGod_PH',
          status: 'order_completed',
          createdAt: Date.now() - 86400000 * 3,
          completedAt: Date.now() - 86400000 * 2,
          orderId: 'ORD-84920',
          orderDiamonds: 1000,
          bonusDiamondsEarned: 50, // 5% of 1000 💎
        },
        {
          id: 'ref_rec_102',
          referrerUserId: userId,
          referrerCode: code,
          referredUserId: 'usr_squad_bea',
          referredUserName: 'Bea Angela Cruz',
          referredUserEmail: 'bea.angela@yahoo.com',
          referredUserIgn: '🌸 AngelaMain_PH',
          status: 'registered',
          createdAt: Date.now() - 86400000 * 1,
        },
      ]
    : [];

  const successfulReferrals = starterReferrals.filter((r) => r.status === 'order_completed').length;
  const bonusDiamondsEarned = starterReferrals.reduce(
    (sum, r) => sum + (r.bonusDiamondsEarned || 0),
    0
  );

  const hasReferralBadge = starterReferrals.length > 0;
  const referralDiscountPercent = starterReferrals.length > 0 ? 5 : 0;

  return {
    referralCode: code,
    totalReferred: starterReferrals.length,
    successfulReferrals,
    bonusDiamondsEarned,
    referrals: starterReferrals,
    hasReferralBadge,
    referralDiscountPercent,
  };
}

/**
 * Loads referral stats and ledger for a user
 * NOTE: Never dispatches window events during read to prevent React "setState while rendering" errors!
 */
export function getReferralData(user: UserAccount | null | undefined): UserReferralData {
  const code = getUserReferralCode(user);
  const userId = user?.id || 'user_current';

  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_PREFIX + userId);
    if (raw) {
      const parsed: UserReferralData = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.referrals)) {
        // Ensure badge and discount properties exist
        if (parsed.hasReferralBadge === undefined && parsed.referrals.length > 0) {
          parsed.hasReferralBadge = true;
          parsed.referralDiscountPercent = 5;
        }
        return parsed;
      }
    }
  } catch {}

  const initial = getStarterReferralData(code, userId);
  try {
    localStorage.setItem(REFERRAL_STORAGE_PREFIX + userId, JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Persists referral data to localStorage and safely notifies listeners asynchronously
 */
export function saveReferralData(userId: string, data: UserReferralData): void {
  try {
    localStorage.setItem(REFERRAL_STORAGE_PREFIX + userId, JSON.stringify(data));
    // Asynchronous dispatch guarantees that event listeners are NEVER invoked
    // synchronously during another component's React render phase!
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('nexus_referrals_updated', { detail: data }));
    }, 0);
  } catch {}
}

/**
 * Ensures user account has the Referral Badge and Diamond Discount applied if eligible
 */
export function applyReferralRewardsToUser(user: UserAccount | null | undefined): UserAccount | null {
  if (!user) return null;
  const referralData = getReferralData(user);
  const hasReferrals = referralData.referrals.length > 0 || referralData.hasReferralBadge;

  if (hasReferrals) {
    const badges = new Set(user.securityBadges || []);
    badges.add('Referral Badge');
    return {
      ...user,
      referralBadge: true,
      referralDiscountPercent: user.referralDiscountPercent || 5,
      referralSignupsCount: referralData.totalReferred,
      securityBadges: Array.from(badges),
    };
  }

  return user;
}

/**
 * Saves a registered referral record when a new user signs up using an invite link.
 * Rewards the referrer with the exclusive 'Referral Badge' and small diamond discount!
 */
export function registerFriendReferral(params: {
  referrerCode: string;
  newUserId: string;
  newUserName: string;
  newUserEmail?: string;
  newUserIgn?: string;
}): ReferralRecord {
  const { referrerCode, newUserId, newUserName, newUserEmail, newUserIgn } = params;

  const newRecord: ReferralRecord = {
    id: 'ref_rec_' + Math.floor(10000 + Math.random() * 90000),
    referrerUserId: 'user_current', // will match the inviter
    referrerCode,
    referredUserId: newUserId,
    referredUserName: newUserName,
    referredUserEmail: newUserEmail,
    referredUserIgn: newUserIgn || 'MLBB Player',
    status: 'registered',
    createdAt: Date.now(),
  };

  // Append to active user's referral data and unlock 'Referral Badge' & 5% diamond discount
  try {
    const activeData = getReferralData({ id: 'user_current' } as UserAccount);
    const existing = activeData.referrals.find((r) => r.referredUserId === newUserId);
    if (!existing) {
      const updated: UserReferralData = {
        ...activeData,
        totalReferred: activeData.totalReferred + 1,
        hasReferralBadge: true, // UNLOCKED 'Referral Badge'
        referralDiscountPercent: 5, // Small diamond discount (5% off all diamond packs)
        referrals: [newRecord, ...activeData.referrals],
      };
      saveReferralData('user_current', updated);

      // Also persist to current user account if available in localStorage
      const savedUserRaw = localStorage.getItem('nexus_auth_user');
      if (savedUserRaw) {
        const parsedUser = JSON.parse(savedUserRaw);
        if (parsedUser) {
          const badges = new Set(parsedUser.securityBadges || []);
          badges.add('Referral Badge');
          parsedUser.referralBadge = true;
          parsedUser.referralDiscountPercent = 5;
          parsedUser.referralSignupsCount = updated.totalReferred;
          parsedUser.securityBadges = Array.from(badges);
          localStorage.setItem('nexus_auth_user', JSON.stringify(parsedUser));
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('nexus_auth_user_updated', { detail: parsedUser }));
          }, 0);
        }
      }
    }
  } catch {}

  return newRecord;
}

/**
 * Calculates 5% referral diamond bonus based on order diamond count
 */
export function calculateReferralBonus(diamonds: number, bonusDiamonds = 0): number {
  const total = diamonds + bonusDiamonds;
  return Math.max(5, Math.round(total * 0.05));
}

/**
 * Credits the 5% diamond bonus when an order is completed
 */
export function processOrderReferralCompletion(
  order: EscrowOrder,
  buyer: UserAccount | null | undefined
): {
  awarded: boolean;
  bonusDiamonds: number;
  message: string;
} {
  // Check if referral applies
  const referralCode = order.referralCodeApplied || buyer?.referredBy;
  if (!referralCode) {
    return { awarded: false, bonusDiamonds: 0, message: '' };
  }

  const bonusDiamonds = calculateReferralBonus(order.diamonds, order.bonusDiamonds || 0);

  // Update referrer ledger in storage
  try {
    const referrerData = getReferralData({ id: 'user_current' } as UserAccount);
    const updatedReferrals = referrerData.referrals.map((r) => {
      if (r.referredUserId === order.buyerId || r.referredUserName === order.buyerName) {
        return {
          ...r,
          status: 'order_completed' as const,
          completedAt: Date.now(),
          orderId: order.id,
          orderDiamonds: order.diamonds,
          bonusDiamondsEarned: bonusDiamonds,
        };
      }
      return r;
    });

    const isExistingRecord = updatedReferrals.some((r) => r.orderId === order.id);
    let finalReferrals = updatedReferrals;

    if (!isExistingRecord) {
      finalReferrals = [
        {
          id: 'ref_rec_' + Math.floor(10000 + Math.random() * 90000),
          referrerUserId: 'user_current',
          referrerCode: referralCode,
          referredUserId: order.buyerId,
          referredUserName: order.buyerName,
          referredUserEmail: order.buyerEmail,
          referredUserIgn: order.mlbbIgn,
          status: 'order_completed' as const,
          createdAt: order.createdAt || Date.now() - 3600000,
          completedAt: Date.now(),
          orderId: order.id,
          orderDiamonds: order.diamonds,
          bonusDiamondsEarned: bonusDiamonds,
        },
        ...updatedReferrals,
      ];
    }

    const successfulCount = finalReferrals.filter((r) => r.status === 'order_completed').length;
    const totalBonus = finalReferrals.reduce((sum, r) => sum + (r.bonusDiamondsEarned || 0), 0);

    const updatedState: UserReferralData = {
      ...referrerData,
      totalReferred: finalReferrals.length,
      successfulReferrals: successfulCount,
      bonusDiamondsEarned: totalBonus,
      referrals: finalReferrals,
    };

    saveReferralData('user_current', updatedState);
  } catch {}

  return {
    awarded: true,
    bonusDiamonds,
    message: `🎉 Refer-a-Friend 5% Bonus: Both you and your friend received +${bonusDiamonds} Bonus Diamonds on this order!`,
  };
}

/**
 * Interactive test simulator: Simulates a friend signing up with the user's invite link
 * and completing an order, demonstrating the dual 5% diamond bonus in real-time.
 */
export function simulateFriendOrderCompletion(
  currentUser: UserAccount | null | undefined,
  packDiamonds = 1000
): {
  friendName: string;
  ign: string;
  orderId: string;
  orderDiamonds: number;
  bonusDiamonds: number;
} {
  const code = getUserReferralCode(currentUser);
  const userId = currentUser?.id || 'user_current';
  const data = getReferralData(currentUser);

  const squadNames = [
    { name: 'Aldous Puncher', ign: '💥 OnePunch_Aldous' },
    { name: 'Kagura Umbrellas', ign: '🌸 KaguraSeimei' },
    { name: 'Fanny Cable Pro', ign: '⚡ BladeDancer_PH' },
    { name: 'Lancelot Royal', ign: '🗡️ OdetteLover_99' },
    { name: 'Gusion Daggers', ign: '🔥 GusDaggerGod' },
  ];

  const picked = squadNames[Math.floor(Math.random() * squadNames.length)];
  const bonusDiamonds = Math.round(packDiamonds * 0.05);
  const orderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);

  const newRecord: ReferralRecord = {
    id: 'ref_rec_' + Math.floor(10000 + Math.random() * 90000),
    referrerUserId: userId,
    referrerCode: code,
    referredUserId: 'usr_sim_' + Math.floor(1000 + Math.random() * 9000),
    referredUserName: picked.name,
    referredUserEmail: `${picked.name.toLowerCase().replace(/\s+/g, '')}@squad.ph`,
    referredUserIgn: picked.ign,
    status: 'order_completed',
    createdAt: Date.now() - 3600000,
    completedAt: Date.now(),
    orderId,
    orderDiamonds: packDiamonds,
    bonusDiamondsEarned: bonusDiamonds,
  };

  const updatedReferrals = [newRecord, ...data.referrals];
  const successfulReferrals = updatedReferrals.filter((r) => r.status === 'order_completed').length;
  const totalBonusDiamondsEarned = updatedReferrals.reduce(
    (sum, r) => sum + (r.bonusDiamondsEarned || 0),
    0
  );

  const updatedState: UserReferralData = {
    ...data,
    totalReferred: updatedReferrals.length,
    successfulReferrals,
    bonusDiamondsEarned: totalBonusDiamondsEarned,
    hasReferralBadge: true,
    referralDiscountPercent: 5,
    referrals: updatedReferrals,
  };

  saveReferralData(userId, updatedState);

  // Sync to auth user in storage
  try {
    const savedUserRaw = localStorage.getItem('nexus_auth_user');
    if (savedUserRaw) {
      const parsedUser = JSON.parse(savedUserRaw);
      if (parsedUser) {
        const badges = new Set(parsedUser.securityBadges || []);
        badges.add('Referral Badge');
        parsedUser.referralBadge = true;
        parsedUser.referralDiscountPercent = 5;
        parsedUser.securityBadges = Array.from(badges);
        localStorage.setItem('nexus_auth_user', JSON.stringify(parsedUser));
      }
    }
  } catch {}

  return {
    friendName: picked.name,
    ign: picked.ign,
    orderId,
    orderDiamonds: packDiamonds,
    bonusDiamonds,
  };
}

/**
 * Simulates a new player signing up directly using the user's invite link.
 * Rewards the referrer with the 'Referral Badge' and a 5% Diamond Discount!
 */
export function simulateFriendSignup(
  currentUser: UserAccount | null | undefined
): {
  friendName: string;
  ign: string;
  unlockedBadge: boolean;
  discountPercent: number;
} {
  const code = getUserReferralCode(currentUser);
  const userId = currentUser?.id || 'user_current';
  const data = getReferralData(currentUser);

  const squadFriends = [
    { name: 'Kagura Storm', ign: '🌸 SeimeiMaster_PH' },
    { name: 'Paquito Boxer', ign: '🥊 Manny_Paq_01' },
    { name: 'Benedetta Blade', ign: '⚡ Shadow_Step' },
    { name: 'Beatrix Sniper', ign: '🎯 Wesker_Apex' },
    { name: 'Fredrinn Tank', ign: '🛡️ Crystal_Shield' },
  ];

  const picked = squadFriends[Math.floor(Math.random() * squadFriends.length)];

  const newRecord: ReferralRecord = {
    id: 'ref_rec_' + Math.floor(10000 + Math.random() * 90000),
    referrerUserId: userId,
    referrerCode: code,
    referredUserId: 'usr_sim_' + Math.floor(1000 + Math.random() * 9000),
    referredUserName: picked.name,
    referredUserEmail: `${picked.name.toLowerCase().replace(/\s+/g, '')}@mlbb.ph`,
    referredUserIgn: picked.ign,
    status: 'registered',
    createdAt: Date.now(),
  };

  const updatedReferrals = [newRecord, ...data.referrals];
  const updatedState: UserReferralData = {
    ...data,
    totalReferred: updatedReferrals.length,
    hasReferralBadge: true,
    referralDiscountPercent: 5,
    referrals: updatedReferrals,
  };

  saveReferralData(userId, updatedState);

  try {
    const savedUserRaw = localStorage.getItem('nexus_auth_user');
    if (savedUserRaw) {
      const parsedUser = JSON.parse(savedUserRaw);
      if (parsedUser) {
        const badges = new Set(parsedUser.securityBadges || []);
        badges.add('Referral Badge');
        parsedUser.referralBadge = true;
        parsedUser.referralDiscountPercent = 5;
        parsedUser.referralSignupsCount = updatedReferrals.length;
        parsedUser.securityBadges = Array.from(badges);
        localStorage.setItem('nexus_auth_user', JSON.stringify(parsedUser));
      }
    }
  } catch {}

  return {
    friendName: picked.name,
    ign: picked.ign,
    unlockedBadge: true,
    discountPercent: 5,
  };
}
