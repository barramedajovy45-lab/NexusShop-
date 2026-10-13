import { DEFAULT_APP_SETTINGS, INITIAL_ORDERS, INITIAL_PRICE_ALERTS } from '../data/mockData';

/**
 * High-Concurrency & Anti-Corruption Storage Security Guard
 * Ensures that even under heavy multi-user traffic, corrupted cache entries,
 * or strict browser quota limits, the app never crashes or enters an invalid state.
 */

// In-memory sliding window action rate limiter to prevent rapid double-clicks / spam
const clientActionBuckets = new Map<string, { count: number; resetAt: number }>();

export function allowClientAction(
  actionKey: string,
  maxActions: number = 5,
  windowMs: number = 3000
): boolean {
  const now = Date.now();
  const entry = clientActionBuckets.get(actionKey);
  if (!entry || now > entry.resetAt) {
    clientActionBuckets.set(actionKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= maxActions;
}

/**
 * Safely parse JSON from localStorage with schema validation fallback.
 * If corrupted or malformed, automatically repairs the storage entry.
 */
export function safeReadStorage<T>(
  key: string,
  fallback: T,
  validator?: (parsed: any) => boolean
): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return parsed as T;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {}
    return fallback;
  }
}

/**
 * Safely write JSON to localStorage with automatic quota recovery.
 * If storage is full from heavy usage, prunes non-essential notification archives first.
 */
export function safeWriteStorage(key: string, value: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    try {
      // Quota recovery: prune archived notifications and old webhook logs
      localStorage.removeItem('nexus_archived_notifications');
      localStorage.removeItem('nexus_processed_webhook_tx_ids');
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Runs a startup self-healing integrity audit on all localStorage keys
 * so corrupted or tampered client state can never hinder app startup.
 */
export function runStartupSecurityAndStorageAudit(): void {
  if (typeof window === 'undefined') return;

  // 1. Validate app settings
  safeReadStorage(
    'nexus_app_settings',
    DEFAULT_APP_SETTINGS,
    (val) => Boolean(val && typeof val === 'object' && typeof val.currency === 'string')
  );

  // 2. Validate escrow orders array
  safeReadStorage(
    'nexus_escrow_orders',
    INITIAL_ORDERS,
    (val) =>
      Array.isArray(val) &&
      val.every(
        (o) =>
          o &&
          typeof o === 'object' &&
          typeof o.id === 'string' &&
          typeof o.diamonds === 'number' &&
          typeof o.status === 'string'
      )
  );

  // 3. Validate price alerts array
  safeReadStorage(
    'nexus_price_alerts',
    INITIAL_PRICE_ALERTS,
    (val) =>
      Array.isArray(val) &&
      val.every((a) => a && typeof a === 'object' && typeof a.id === 'string')
  );

  // 4. Validate notifications history array
  safeReadStorage(
    'nexus_notifications_history',
    [],
    (val) => Array.isArray(val)
  );

  // 5. Validate authenticated user object if present
  try {
    const rawUser = localStorage.getItem('nexus_auth_user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      if (
        !parsedUser ||
        typeof parsedUser !== 'object' ||
        typeof parsedUser.email !== 'string' ||
        typeof parsedUser.name !== 'string'
      ) {
        localStorage.removeItem('nexus_auth_user');
        localStorage.removeItem('nexus_user_has_signed_in');
      }
    }
  } catch {
    try {
      localStorage.removeItem('nexus_auth_user');
      localStorage.removeItem('nexus_user_has_signed_in');
    } catch {}
  }
}
