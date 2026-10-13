import React, { useState, useMemo } from 'react';
import { EscrowOrder, Currency } from '../types';
import {
  X,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  Calendar,
  Filter,
  DollarSign,
  Gem,
  CheckCircle2,
  Table,
  HelpCircle,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  downloadTransactionsCSV,
  generateTransactionCSV,
  filterOrdersForExport,
  CSVExportOptions,
} from '../utils/csvExporter';
import { formatCurrency, safeFormatDate } from '../utils/formatters';

interface ExportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: EscrowOrder[];
  currency: Currency;
  onShowToast?: (title: string, message: string) => void;
}

export const ExportTransactionsModal: React.FC<ExportTransactionsModalProps> = ({
  isOpen,
  onClose,
  orders,
  currency,
  onShowToast,
}) => {
  const [completedOnly, setCompletedOnly] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<'all' | '30days' | 'month' | 'year'>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const exportOptions: CSVExportOptions = useMemo(
    () => ({
      completedOnly,
      dateRange,
      preferredCurrency: currency,
    }),
    [completedOnly, dateRange, currency]
  );

  const { csvContent, summary } = useMemo(
    () => generateTransactionCSV(orders, exportOptions),
    [orders, exportOptions]
  );

  const targetOrders = useMemo(
    () => filterOrdersForExport(orders, exportOptions),
    [orders, exportOptions]
  );

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const result = downloadTransactionsCSV(orders, exportOptions);
      if (onShowToast) {
        onShowToast(
          'CSV Export Successful',
          `Exported ${result.summary.totalRecords} transactions to ${result.filename}`
        );
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 700);
    } catch (e) {
      setIsExporting(false);
      console.error('Failed to export CSV', e);
    }
  };

  const handleCopyClipboard = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(csvContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Export Financial Ledger (CSV)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  Excel · Sheets · Numbers
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Download your verified diamond purchase records for personal budget and tax accounting.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Financial Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Filtered Records</span>
                <span className="text-base font-bold text-white font-mono">
                  {summary.totalRecords} {summary.totalRecords === 1 ? 'Transaction' : 'Transactions'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Total Disbursed</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  {formatCurrency(summary.totalUsdEquivalent, currency)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Gem className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Diamonds Credited</span>
                <span className="text-base font-bold text-amber-300 font-mono">
                  {summary.totalDiamonds.toLocaleString()} 💎
                </span>
              </div>
            </div>
          </div>

          {/* Export Settings & Filters */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Scope & Date Range</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Scope Selection */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Transaction Status
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 hover:bg-slate-900/80 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={completedOnly}
                      onChange={() => setCompletedOnly(true)}
                      className="accent-cyan-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1">
                      <span className="text-slate-200 font-medium block">
                        Completed Only (Recommended)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Only verified, escrow-released diamond purchases
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-800 hover:bg-slate-900/80 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      name="exportScope"
                      checked={!completedOnly}
                      onChange={() => setCompletedOnly(false)}
                      className="accent-cyan-500 w-3.5 h-3.5"
                    />
                    <div className="flex-1">
                      <span className="text-slate-200 font-medium block">
                        All Records (Including Refunds)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Full audit trail of active, completed & refunded orders
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: '30days', label: 'Last 30 Days' },
                    { id: 'month', label: 'This Month' },
                    { id: 'year', label: 'This Year' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDateRange(item.id as any)}
                      className={`p-2 rounded-lg border text-center font-medium transition-all ${
                        dateRange === item.id
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>
                    Range:{' '}
                    {summary.firstDate
                      ? `${summary.firstDate} to ${summary.lastDate || 'Present'}`
                      : 'No records found'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Table className="w-3.5 h-3.5 text-cyan-400" />
                <span>Spreadsheet Preview ({targetOrders.length} records)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                UTF-8 BOM Encoded · Formula-Injection Protected
              </span>
            </div>

            {targetOrders.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-xl">
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 font-medium">No records match the active filter</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Adjust the date filter or select "All Records" to inspect older transactions.
                </p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/80 max-h-48">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 whitespace-nowrap">Order ID</th>
                      <th className="px-3 py-2 whitespace-nowrap">Date</th>
                      <th className="px-3 py-2 whitespace-nowrap">Item</th>
                      <th className="px-3 py-2 whitespace-nowrap">Diamonds</th>
                      <th className="px-3 py-2 whitespace-nowrap">Amount</th>
                      <th className="px-3 py-2 whitespace-nowrap">Payment</th>
                      <th className="px-3 py-2 whitespace-nowrap">MLBB IGN</th>
                      <th className="px-3 py-2 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {targetOrders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/40">
                        <td className="px-3 py-2 font-bold text-cyan-400 whitespace-nowrap">{order.id}</td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                          {safeFormatDate(order.completedAt || order.createdAt)}
                        </td>
                        <td className="px-3 py-2 max-w-[140px] truncate">{order.packageName}</td>
                        <td className="px-3 py-2 text-amber-300 font-semibold whitespace-nowrap">
                          {order.diamonds + (order.bonusDiamonds || 0)} 💎
                        </td>
                        <td className="px-3 py-2 text-white font-bold whitespace-nowrap">
                          {formatCurrency(order.amount, order.currency)}
                        </td>
                        <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{order.paymentMethod}</td>
                        <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{order.mlbbIgn}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            order.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {targetOrders.length > 5 && (
              <p className="text-[10px] text-slate-500 mt-1.5 text-right font-mono">
                Showing first 5 of {targetOrders.length} rows (full file contains all columns & metadata)
              </p>
            )}
          </div>

          {/* Software Compatibility notice */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-900/40 flex items-start gap-2.5 text-[11px] text-cyan-200/90">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">Compatible With All Budgeting Tools</span>
              <span>
                Formatted according to RFC 4180 standard. Ready to import into Microsoft Excel, Google Sheets,
                Apple Numbers, Notion Budget Trackers, Quicken, or YNAB.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyClipboard}
            disabled={targetOrders.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied CSV to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy CSV to Clipboard</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={targetOrders.length === 0 || isExporting}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : 'Download CSV File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
