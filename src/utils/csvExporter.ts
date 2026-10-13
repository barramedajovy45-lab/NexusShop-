import { EscrowOrder, Currency } from '../types';
import { CURRENCY_RATES, getPaymentMethodDetails, safeFormatDate } from './formatters';

export interface CSVExportOptions {
  completedOnly?: boolean;
  dateRange?: 'all' | '30days' | 'month' | 'year';
  customFilename?: string;
  preferredCurrency?: Currency;
}

export interface CSVFinancialSummary {
  totalRecords: number;
  totalSpentByCurrency: Record<Currency, number>;
  totalDiamonds: number;
  totalUsdEquivalent: number;
  firstDate: string | null;
  lastDate: string | null;
}

/**
 * Escapes a field for CSV format (RFC 4180).
 * Handles null/undefined, quotes, commas, newlines, and prevents CSV formula injection.
 */
export function escapeCSVField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) {
    return '""';
  }
  let str = String(val);

  // Security: Prevent CSV formula injection in Microsoft Excel / Google Sheets
  // If the cell begins with =, +, -, @, \t, or \r, prepend a single apostrophe
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Double up any internal quotes and wrap in quotes
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Filters orders based on completion status and date range for financial accounting.
 */
export function filterOrdersForExport(orders: EscrowOrder[], options: CSVExportOptions = {}): EscrowOrder[] {
  const { completedOnly = true, dateRange = 'all' } = options;
  const now = Date.now();

  return orders.filter((order) => {
    // 1. Completion filter: Financial books prioritize completed transactions
    if (completedOnly && order.status !== 'completed') {
      return false;
    }

    // 2. Date range filter
    const orderTime = order.completedAt || order.createdAt;
    if (dateRange === '30days') {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (now - orderTime > thirtyDaysMs) return false;
    } else if (dateRange === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      if (orderTime < startOfMonth.getTime()) return false;
    } else if (dateRange === 'year') {
      const startOfYear = new Date();
      startOfYear.setMonth(0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      if (orderTime < startOfYear.getTime()) return false;
    }

    return true;
  });
}

/**
 * Generates the full CSV text string with UTF-8 BOM, standard headers, and formatted financial rows.
 */
export function generateTransactionCSV(orders: EscrowOrder[], options: CSVExportOptions = {}): {
  csvContent: string;
  summary: CSVFinancialSummary;
} {
  const targetOrders = filterOrdersForExport(orders, options);

  // Sort chronologically (most recent first)
  targetOrders.sort((a, b) => {
    const timeA = a.completedAt || a.createdAt;
    const timeB = b.completedAt || b.createdAt;
    return timeB - timeA;
  });

  // Calculate financial summary
  const initialSpentByCurrency = (Object.keys(CURRENCY_RATES) as Currency[]).reduce((acc, cur) => {
    acc[cur] = 0;
    return acc;
  }, {} as Record<Currency, number>);

  const summary: CSVFinancialSummary = {
    totalRecords: targetOrders.length,
    totalSpentByCurrency: initialSpentByCurrency,
    totalDiamonds: 0,
    totalUsdEquivalent: 0,
    firstDate: null,
    lastDate: null,
  };

  if (targetOrders.length > 0) {
    summary.lastDate = safeFormatDate(targetOrders[0].completedAt || targetOrders[0].createdAt);
    summary.firstDate = safeFormatDate(
      targetOrders[targetOrders.length - 1].completedAt || targetOrders[targetOrders.length - 1].createdAt
    );
  }

  // Headers for financial tracking spreadsheet
  const headers = [
    'Transaction ID',
    'Date Initiated (UTC)',
    'Date Completed (UTC)',
    'Package / Item Name',
    'Expense Category',
    'Total Diamonds Received',
    'Base Diamonds',
    'Bonus Diamonds',
    'Amount Paid',
    'Currency',
    'USD Equivalent ($)',
    'Escrow Fee',
    'Payment Method',
    'Payment Reference',
    'MLBB User ID',
    'MLBB Zone ID',
    'MLBB In-Game Name (IGN)',
    'Server Cluster',
    'Moonton Recharge Ref',
    'Fulfilling Seller',
    'Transaction Status',
    'Buyer Rating Given',
    'Accounting Classification',
    'Notes',
  ];

  const rows: string[] = [];
  rows.push(headers.map(escapeCSVField).join(','));

  for (const order of targetOrders) {
    const totalDiamonds = (order.diamonds || 0) + (order.bonusDiamonds || 0);
    const orderCurrency = order.currency || 'USD';
    const rateInfo = CURRENCY_RATES[orderCurrency] || CURRENCY_RATES.USD;
    const usdEquivalent = (order.amount || 0) / (rateInfo.rate || 1);

    // Accumulate summary stats
    summary.totalSpentByCurrency[orderCurrency] = (summary.totalSpentByCurrency[orderCurrency] || 0) + (order.amount || 0);
    summary.totalDiamonds += totalDiamonds;
    summary.totalUsdEquivalent += usdEquivalent;

    const paymentMeta = getPaymentMethodDetails(order.paymentMethod);
    const safeCreated = safeFormatDate(order.createdAt);
    const safeCompleted = order.completedAt
      ? safeFormatDate(order.completedAt)
      : order.status === 'completed'
      ? safeCreated
      : 'Pending';

    const row = [
      order.id,
      safeCreated,
      safeCompleted,
      order.packageName,
      'Gaming & Entertainment Top-Up',
      totalDiamonds,
      order.diamonds,
      order.bonusDiamonds || 0,
      order.amount.toFixed(2),
      orderCurrency,
      usdEquivalent.toFixed(2),
      (order.escrowFee || 0).toFixed(2),
      paymentMeta.name,
      order.paymentReference || 'N/A',
      order.mlbbUserId,
      order.mlbbZoneId,
      order.mlbbIgn,
      order.mlbbServer || 'Global',
      order.moontonTransactionRef || 'Verified Moonton API',
      order.sellerName,
      order.status === 'completed' ? 'Completed (Vault Released)' : order.status,
      order.feedback ? `${order.feedback.rating}/5 Stars` : 'Unrated',
      'Personal Expense: Digital Gaming Asset',
      order.feedback?.review
        ? `Review: ${order.feedback.review}`
        : 'Escrow-verified Moonton diamond credit via DiamondVault',
    ];

    rows.push(row.map(escapeCSVField).join(','));
  }

  // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel and spreadsheet apps preserve special characters
  const csvContent = '\uFEFF' + rows.join('\r\n');

  return { csvContent, summary };
}

/**
 * Downloads the completed transaction history as a CSV file in the user's browser.
 */
export function downloadTransactionsCSV(orders: EscrowOrder[], options: CSVExportOptions = {}): {
  success: boolean;
  filename: string;
  summary: CSVFinancialSummary;
} {
  const { csvContent, summary } = generateTransactionCSV(orders, options);

  const dateStamp = new Date().toISOString().split('T')[0];
  const filename = options.customFilename || `DiamondVault_Transactions_${dateStamp}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filename,
    summary,
  };
}
