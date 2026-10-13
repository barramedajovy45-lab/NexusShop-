import { UserAccount } from '../types';

const SAVED_ACCOUNTS_STORAGE_KEY = 'nexus_saved_accounts';

/**
 * Retrieve the list of accounts that have actually signed in on this device.
 * Returns an empty array if no user has signed in yet (no mock or hardcoded accounts).
 */
export function getSavedAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    let accounts: UserAccount[] = [];

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accounts = parsed.filter((item) => item && typeof item === 'object' && item.id && (item.email || item.name));
      }
    }

    // Check if there is an active session in nexus_auth_user that should be recorded
    const activeRaw = localStorage.getItem('nexus_auth_user');
    if (activeRaw) {
      try {
        const activeUser: UserAccount = JSON.parse(activeRaw);
        if (activeUser && activeUser.id && (activeUser.email || activeUser.name)) {
          const exists = accounts.some(
            (acc) => acc.id === activeUser.id || (activeUser.email && acc.email?.toLowerCase() === activeUser.email.toLowerCase())
          );
          if (!exists) {
            accounts.unshift(activeUser);
            localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts.slice(0, 5)));
          }
        }
      } catch {}
    }

    return accounts;
  } catch (err) {
    console.warn('Failed to parse saved accounts from localStorage', err);
    return [];
  }
}

/**
 * Save or update an account in the local device quick access history.
 * Ensures the account info, MLBB binding, wallet balance, and credentials are not lost.
 */
export function saveAccountToHistory(account: UserAccount): UserAccount[] {
  if (typeof window === 'undefined' || !account || !account.id) return [];

  try {
    const currentList = getSavedAccounts();
    const cleanEmail = account.email ? account.email.trim().toLowerCase() : '';

    // Remove older duplicate of this account if present
    const filtered = currentList.filter((item) => {
      if (item.id === account.id) return false;
      if (cleanEmail && item.email && item.email.trim().toLowerCase() === cleanEmail) return false;
      return true;
    });

    // Insert at front
    const updated = [account, ...filtered].slice(0, 5);
    localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));

    // Notify listeners in same window
    window.dispatchEvent(new CustomEvent('nexus_saved_accounts_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to save account to history', err);
    return [];
  }
}

/**
 * Remove a specific account from quick access on this device.
 */
export function removeSavedAccount(accountIdOrEmail: string): UserAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    const currentList = getSavedAccounts();
    const query = accountIdOrEmail.toLowerCase().trim();

    const updated = currentList.filter((item) => {
      if (item.id.toLowerCase() === query) return false;
      if (item.email && item.email.toLowerCase().trim() === query) return false;
      return true;
    });

    if (updated.length > 0) {
      localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    } else {
      localStorage.removeItem(SAVED_ACCOUNTS_STORAGE_KEY);
    }

    window.dispatchEvent(new CustomEvent('nexus_saved_accounts_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Failed to remove saved account', err);
    return [];
  }
}
