import React, { useState } from 'react';
import { EscrowOrder } from '../types';
import { formatCurrency, getPaymentMethodDetails } from '../utils/formatters';
import {
  X,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Gem,
  CheckCircle2,
  Lock,
  ArrowRight,
  HelpCircle,
  Trash2,
  Sparkles
} from 'lucide-react';

interface OrderCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onConfirmCancel: (orderId: string, reason: string, notes?: string) => void;
}

const CANCELLATION_REASONS = [
  {
    id: 'wrong_account',
    label: 'Incorrect MLBB User ID or Zone ID entered',
    description: 'Avoid sending diamonds to the wrong Moonton account',
    badge: 'Common'
  },
  {
    id: 'seller_delay',
    label: 'Seller taking longer than expected to deliver',
    description: 'Seller has not dispatched diamonds within SLA',
    badge: 'Delivery SLA'
  },
  {
    id: 'wrong_package',
    label: 'Ordered wrong diamond package or pass',
    description: 'Want to switch to a different diamond bundle or pass',
    badge: 'Bundle Switch'
  },
  {
    id: 'changed_mind',
    label: 'Changed my mind / Accidental purchase',
    description: 'No longer wish to proceed with this purchase',
    badge: 'Buyer Choice'
  },
  {
    id: 'payment_change',
    label: 'Want to switch payment method',
    description: 'Prefer to use another wallet or payment channel',
    badge: 'Payment'
  },
  {
    id: 'other',
    label: 'Other reason',
    description: 'Provide custom notes below',
    badge: 'Custom'
  }
];

export const OrderCancellationModal: React.FC<OrderCancellationModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmCancel,
}) => {
  const [selectedReasonId, setSelectedReasonId] = useState<string>('wrong_account');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const paymentMeta = getPaymentMethodDetails(order.paymentMethod);
  const selectedReason = CANCELLATION_REASONS.find((r) => r.id === selectedReasonId)?.label || selectedReasonId;

  // Check if seller has already uploaded proof
  const hasProofUploaded = Boolean(
    order.proofImageUrl ||
    order.moontonTransactionRef ||
    order.status === 'delivery_proof_uploaded' ||
    order.status === 'delivered_pending_confirmation'
  );

  const handleExecuteCancel = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        onConfirmCancel(order.id, selectedReason, notes.trim() || undefined);
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-rose-950/50 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <span>Cancel Diamond Purchase</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  100% Escrow Refund
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Order <span className="font-mono text-cyan-300">{order.id}</span> • {order.packageName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-bold text-base text-white">
                Purchase Cancelled & Order Removed!
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                <span className="text-emerald-400 font-bold font-mono">
                  {formatCurrency(order.amount, order.currency)}
                </span>{' '}
                has been unlocked from the Aegis Escrow Vault and returned to your{' '}
                <span className="font-semibold text-white">{paymentMeta.name}</span>.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 flex items-center justify-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Order #{order.id} completely purged from your history for cleanliness.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Warning if seller already uploaded delivery proof */}
            {hasProofUploaded && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-300">
                    Seller Already Uploaded Moonton Delivery Proof
                  </span>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Seller {order.sellerName} attached Moonton Gateway Reference:{' '}
                    <span className="font-mono font-bold text-white">
                      {order.moontonTransactionRef || 'Verified'}
                    </span>
                    . If diamonds did not reflect in your Mobile Legends account, we recommend opening an{' '}
                    <span className="font-bold underline text-white">Escrow Dispute</span> instead so an arbiter can review server receipts before cancelling.
                  </p>
                </div>
              </div>
            )}

            {/* Escrow 100% Refund Breakdown Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Escrow Refund Breakdown</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                  Zero Cancellation Fee
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] border-t border-slate-800/80">
                <div className="flex justify-between text-slate-300">
                  <span>Diamond Package Price ({order.diamonds} 💎):</span>
                  <span className="font-mono font-bold text-white">
                    {formatCurrency(order.amount, order.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Escrow Vault Protection Fee:</span>
                  <span className="font-mono text-emerald-400">₱0.00 (Waived)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Refund Destination:</span>
                  <span className="font-mono text-cyan-300 font-semibold">
                    {paymentMeta.name} ({order.paymentReference})
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                  <span className="text-white">Total Refund to You:</span>
                  <span className="text-sm font-mono text-emerald-400">
                    {formatCurrency(order.amount, order.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Account Info */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-400">Target Account:</span>
                <span className="font-bold text-white font-mono">{order.mlbbIgn}</span>
                <span className="text-slate-400 font-mono text-[10px]">
                  ({order.mlbbUserId} / Zone: {order.mlbbZoneId})
                </span>
              </div>
              <span className="text-slate-400">
                Seller: <span className="text-white font-semibold">{order.sellerName}</span>
              </span>
            </div>

            {/* Reason for Cancellation Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Why do you want to cancel this diamond purchase?
              </label>
              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reason) => {
                  const isSelected = selectedReasonId === reason.id;
                  return (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => setSelectedReasonId(reason.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-rose-500 bg-rose-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'border-rose-400 bg-rose-500 text-slate-950'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <div>
                          <span className="font-semibold block text-xs">{reason.label}</span>
                          <span className="text-[10px] text-slate-400">{reason.description}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border shrink-0 ${
                          isSelected
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {reason.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Additional Notes (Optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please cancel immediately so I can re-order with correct Zone ID 3092..."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs font-mono resize-none"
              />
            </div>

            {/* Escrow Guarantee Notice */}
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center gap-2.5 text-[11px] text-slate-300">
              <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Aegis Buyer Shield:</strong> Funds held in escrow are strictly isolated from the seller until confirmed. Unlocking triggers a 100% immediate refund.
              </span>
            </div>

            {/* Cleanliness Guarantee */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-300">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Clean Ledger Guarantee:</strong> Once cancelled, this order is <strong>permanently removed</strong> from your transactions so it won't clutter your order history.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
              >
                Keep My Order
              </button>

              <button
                type="button"
                onClick={handleExecuteCancel}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Refunding & Removing Order...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Confirm Cancel & Remove Order</span>
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
