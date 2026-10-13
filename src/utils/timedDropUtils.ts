// Utility for 12:00 PM (Noon) and 12:00 AM (Midnight) Free Diamond Drops (10 to 50 💎 for Buyer & VIP)

export interface TimedDropStatus {
  isActive: boolean;
  currentWindowName: '12:00 AM Midnight Drop' | '12:00 PM Noon Drop' | null;
  windowId: string;
  timeRemainingInWindowSec: number;
  timeUntilNextDropSec: number;
  nextDropWindowName: '12:00 AM Midnight' | '12:00 PM Noon';
  formattedCountdown: string;
  currentHour: number;
  currentMinute: number;
}

const STORAGE_KEY_CLAIMS = 'nexus_12_diamond_claims_history';
const STORAGE_KEY_DEMO = 'nexus_12_diamond_demo_active';

/**
 * Calculates current drop status based on local system time.
 * Drop window is active during hour 0 (12:00 AM to 12:59 AM) and hour 12 (12:00 PM to 12:59 PM).
 */
export function getTimedDropStatus(forceActiveDemo: boolean = false): TimedDropStatus {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentSecond = now.getSeconds();

  const isMidnight = currentHour === 0;
  const isNoon = currentHour === 12;
  const naturallyActive = isMidnight || isNoon;
  const isActive = forceActiveDemo || naturallyActive;

  let currentWindowName: '12:00 AM Midnight Drop' | '12:00 PM Noon Drop' | null = null;
  if (isActive) {
    if (isMidnight || (forceActiveDemo && currentHour < 12)) {
      currentWindowName = '12:00 AM Midnight Drop';
    } else {
      currentWindowName = '12:00 PM Noon Drop';
    }
  }

  // Window ID to ensure one claim per 12-hour period (e.g. "2026-10-01-midnight" or "2026-10-01-noon")
  const todayStr = now.toISOString().split('T')[0];
  const windowId = `${todayStr}-${isMidnight ? 'midnight' : isNoon ? 'noon' : currentHour < 12 ? 'noon' : 'midnight'}${forceActiveDemo ? '-demo' : ''}`;

  // Time remaining in current active 1-hour window (seconds)
  const timeRemainingInWindowSec = Math.max(0, (59 - currentMinute) * 60 + (59 - currentSecond));

  // Time until next 12:00 drop window (either 12:00 PM or 12:00 AM)
  let nextDropDate = new Date(now);
  let nextDropWindowName: '12:00 AM Midnight' | '12:00 PM Noon';

  if (currentHour < 12) {
    // Next is 12:00 PM today
    nextDropDate.setHours(12, 0, 0, 0);
    nextDropWindowName = '12:00 PM Noon';
  } else {
    // Next is 12:00 AM tomorrow
    nextDropDate.setDate(nextDropDate.getDate() + 1);
    nextDropDate.setHours(0, 0, 0, 0);
    nextDropWindowName = '12:00 AM Midnight';
  }

  const diffMs = Math.max(0, nextDropDate.getTime() - now.getTime());
  const timeUntilNextDropSec = Math.floor(diffMs / 1000);

  const hoursLeft = Math.floor(timeUntilNextDropSec / 3600);
  const minutesLeft = Math.floor((timeUntilNextDropSec % 3600) / 60);
  const secondsLeft = timeUntilNextDropSec % 60;

  const formattedCountdown = `${String(hoursLeft).padStart(2, '0')}h ${String(minutesLeft).padStart(2, '0')}m ${String(secondsLeft).padStart(2, '0')}s`;

  return {
    isActive,
    currentWindowName,
    windowId,
    timeRemainingInWindowSec,
    timeUntilNextDropSec,
    nextDropWindowName,
    formattedCountdown,
    currentHour,
    currentMinute,
  };
}

/**
 * Rolls for free diamonds between 10 and 50.
 * Buyers: 10 to 50 diamonds.
 * VIP users: Guaranteed high-tier lucky roll between 30 and 50 diamonds!
 */
export function rollFreeDiamondAmount(isVip: boolean = false): {
  amount: number;
  tier: 'Common' | 'Rare' | 'Epic' | 'Mythic' | 'VIP Jackpot';
  isVipBonus: boolean;
} {
  if (isVip) {
    // VIP tier: 30, 35, 40, 45, or 50 diamonds
    const vipPicks = [30, 35, 40, 45, 50, 50];
    const picked = vipPicks[Math.floor(Math.random() * vipPicks.length)];
    return {
      amount: picked,
      tier: picked === 50 ? 'VIP Jackpot' : 'Mythic',
      isVipBonus: true,
    };
  }

  // Standard Buyer tier: 10 to 50 diamonds
  const roll = Math.random();
  let amount = 10;
  let tier: 'Common' | 'Rare' | 'Epic' | 'Mythic' | 'VIP Jackpot' = 'Common';

  if (roll < 0.25) {
    amount = 10;
    tier = 'Common';
  } else if (roll < 0.50) {
    amount = 15;
    tier = 'Common';
  } else if (roll < 0.70) {
    amount = 20;
    tier = 'Rare';
  } else if (roll < 0.85) {
    amount = 30;
    tier = 'Rare';
  } else if (roll < 0.95) {
    amount = 40;
    tier = 'Epic';
  } else {
    amount = 50;
    tier = 'Mythic';
  }

  return { amount, tier, isVipBonus: false };
}

/**
 * Checks if user has already claimed the drop for a given windowId.
 */
export function hasClaimedWindow(windowId: string): { claimed: boolean; amount?: number; timestamp?: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    if (!raw) return { claimed: false };
    const parsed = JSON.parse(raw);
    if (parsed && parsed[windowId]) {
      return {
        claimed: true,
        amount: parsed[windowId].amount,
        timestamp: parsed[windowId].timestamp,
      };
    }
  } catch {}
  return { claimed: false };
}

/**
 * Records a successful diamond drop claim.
 */
export function recordClaimForWindow(windowId: string, amount: number): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    const existing = raw ? JSON.parse(raw) : {};
    existing[windowId] = {
      amount,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(existing));
  } catch {}
}

/**
 * Demo Mode helper to allow users/evaluators to preview and test the drop at any time.
 */
export function getDemoModePreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DEMO) === 'true';
  } catch {
    return false;
  }
}

export function setDemoModePreference(active: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO, String(active));
  } catch {}
}
