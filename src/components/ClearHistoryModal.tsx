import React, { useState } from 'react';
import { EscrowOrder } from '../types';
import {
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldCheck,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: EscrowOrder[];
  onClear: (mode: 'cancelled' | 'completed' | 'finished' | 'all') => void;
  onRestoreSampleOrders?: () => void;
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  onClear,
  onRestoreSampleOrders,
}) => {
  const [selectedMode, setSelectedMode] = useState<'finished' | 'cancelled' | 'completed' | 'all'>('finished');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const activeOrders = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled' && o.status !== 'refunded'
  );
  const finishedOrdersCount = cancelledOrders.length + completedOrders.length;

  const handleExecuteClear = (mode: 'cancelled' | 'completed' | 'finished' | 'all') => {
    setIsProcessing(true);
    setTimeout(() => {
      onClear(mode);
      setIsProcessing(false);
      let msg = '';
      if (mode === 'cancelled') msg = `Removed ${cancelledOrders.length} cancelled order(s).`;
      else if (mode === 'completed') msg = `Removed ${completedOrders.length} completed order(s).`;
      else if (mode === 'finished') msg = `Cleaned ${finishedOrdersCount} past order(s) for a spotless history.`;
      else msg = `Cleared all ${orders.length} order(s). Ledger is now completely pristine.`;

      setSuccessMessage(msg);
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1300);
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/40 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Clean Up Order History</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Cleanliness Tool
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Purge cancelled, finished, or old orders to keep your escrow ledger clean.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">Order History Cleaned!</h4>
              <p className="text-xs text-emerald-300 font-mono mt-1">{successMessage}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Your transaction ledger is now clean and uncluttered.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Ledger Overview Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">
                  Cancelled
                </span>
                <span className="text-sm font-bold font-mono text-rose-400">
                  {cancelledOrders.length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">
                  Completed
                </span>
                <span className="text-sm font-bold font-mono text-cyan-300">
                  {completedOrders.length}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 uppercase tracking-wider font-semibold">
                  Active Escrow
                </span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {activeOrders.length}
                </span>
              </div>
            </div>

            {/* Cleanup Options */}
            <div className="space-y-2">
              {/* Option 1: Clean All Finished (Recommended) */}
              <button
                type="button"
                onClick={() => setSelectedMode('finished')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedMode === 'finished'
                    ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedMode === 'finished'
                        ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {selectedMode === 'finished' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">Clean All Finished History</span>
                      <span className="text-[9px] font-bold text-cyan-300 bg-cyan-900/80 px-1.5 py-0.2 rounded">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Removes all {finishedOrdersCount} completed and cancelled orders. Active in-escrow orders remain protected.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-300 font-bold shrink-0">
                  {finishedOrdersCount} orders
                </span>
              </button>

              {/* Option 2: Clean Cancelled Only */}
              <button
                type="button"
                onClick={() => setSelectedMode('cancelled')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedMode === 'cancelled'
                    ? 'border-rose-500 bg-rose-950/40 text-white ring-1 ring-rose-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedMode === 'cancelled'
                        ? 'border-rose-400 bg-rose-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {selectedMode === 'cancelled' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">Purge Cancelled Orders Only</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Removes aborted or refunded orders so they no longer appear in your ledger.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-rose-300 font-bold shrink-0">
                  {cancelledOrders.length} orders
                </span>
              </button>

              {/* Option 3: Clean Completed Only */}
              <button
                type="button"
                onClick={() => setSelectedMode('completed')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedMode === 'completed'
                    ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedMode === 'completed'
                        ? 'border-cyan-400 bg-cyan-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {selectedMode === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">Archive Completed Orders Only</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Clears fulfilled diamond orders. (Diamonds already credited to your MLBB account).
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-300 font-bold shrink-0">
                  {completedOrders.length} orders
                </span>
              </button>

              {/* Option 4: Full Ledger Wipe (Empty All) */}
              <button
                type="button"
                onClick={() => setSelectedMode('all')}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  selectedMode === 'all'
                    ? 'border-amber-500 bg-amber-950/40 text-white ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selectedMode === 'all'
                        ? 'border-amber-400 bg-amber-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  >
                    {selectedMode === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-200">Complete Ledger Reset (Clear All)</span>
                      <span className="text-[9px] font-bold text-amber-300 bg-amber-900/60 px-1.5 py-0.2 rounded">
                        Full Clean
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Wipes all transactions for a 100% blank slate. You can re-populate sample data anytime.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-300 font-bold shrink-0">
                  {orders.length} orders
                </span>
              </button>
            </div>

            {/* Cleanliness Notice */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-300">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Cleanliness Guarantee:</strong> Selected orders are completely purged from memory and storage so they literally disappear from your view.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {onRestoreSampleOrders && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreSampleOrders();
                      onClose();
                    }}
                    title="Reload sample demo orders if you want to explore again"
                    className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Restore Demo</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleExecuteClear(selectedMode)}
                disabled={isProcessing || (selectedMode === 'cancelled' && cancelledOrders.length === 0) || (selectedMode === 'completed' && completedOrders.length === 0) || (selectedMode === 'finished' && finishedOrdersCount === 0) || (selectedMode === 'all' && orders.length === 0)}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cleaning Ledger...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {selectedMode === 'finished' && `Clean ${finishedOrdersCount} Past Orders`}
                      {selectedMode === 'cancelled' && `Purge ${cancelledOrders.length} Cancelled`}
                      {selectedMode === 'completed' && `Archive ${completedOrders.length} Completed`}
                      {selectedMode === 'all' && `Wipe All ${orders.length} Orders`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
