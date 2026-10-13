import React, { useState } from 'react';
import { EscrowOrder } from '../types';
import { X, AlertTriangle, ShieldAlert, FileText, CheckCircle2, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { isDisputeBlockedByAutoDetection } from '../utils/diamondDetection';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onConfirmDispute: (reason: string, notes: string) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmDispute,
}) => {
  const isVerified = Boolean(order?.diamondsReceivedVerified || order?.moontonApiVerification?.status === 'credited');
  const [reason, setReason] = useState(
    isVerified ? 'Incorrect diamond quantity credited' : 'Diamonds not received in-game'
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const blockCheck = isDisputeBlockedByAutoDetection(order, reason);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockCheck.isBlocked) {
      return;
    }
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onConfirmDispute(reason, notes);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-900/60 rounded-2xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950 border border-rose-700 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Raise Escrow Dispute Ticket</h3>
              <p className="text-[11px] text-slate-400">Funds in Escrow Vault will be frozen immediately</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Details Banner */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 text-xs flex justify-between items-center">
          <div>
            <span className="text-slate-400">Order ID: </span>
            <span className="font-mono font-bold text-white">{order.id}</span>
            <span className="text-slate-400 ml-2">({order.packageName})</span>
          </div>
          <div className="font-mono text-cyan-400">
            Target ID: {order.mlbbUserId} ({order.mlbbZoneId})
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Anti-Abuse Security Warning Banner */}
          {isVerified ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/50 text-xs space-y-2">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <span>Moonton Auto-Detection Anti-Abuse Protection</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      CRYPTOGRAPHICALLY SEALED
                    </span>
                  </h4>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                    Moonton Direct Server Gateway has cryptographically verified that{' '}
                    <strong className="text-emerald-300 font-mono">+{order.diamonds + (order.bonusDiamonds || 0)} Diamonds</strong>{' '}
                    were successfully credited into character <strong className="text-white font-mono">{order.mlbbIgn}</strong> (UID: {order.mlbbUserId}).
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Ref:</span>
                  <span className="text-cyan-300">{order.moontonTransactionRef || 'MT-VERIFIED'}</span>
                </div>
                {order.autoDetectionAudit && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">In-Game Balance Delta:</span>
                    <span className="text-emerald-400">
                      {order.autoDetectionAudit.previousBalance} 💎 ➔ {order.autoDetectionAudit.newBalance} 💎 (+{order.autoDetectionAudit.diamondsDelivered} 💎)
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Anti-Abuse Rule:</span>
                  <span className="text-amber-300 font-sans font-medium text-[10px]">
                    False claims of non-receipt are blocked to protect platform escrow & sellers.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/40 text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Once a dispute is raised, the 15-minute auto-release timer is stopped. The Aegis Escrow Arbiter team cross-references the seller's Moonton API transaction logs with the official game server before issuing a refund or release.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Reason for Dispute
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              <option value="Diamonds not received in-game" disabled={isVerified}>
                Diamonds not received in-game {isVerified ? '(Locked - Auto-Detected on Moonton Server)' : ''}
              </option>
              <option value="Incorrect diamond quantity credited">Incorrect diamond quantity credited</option>
              <option value="Seller uncommunicative or inactive">Seller uncommunicative or inactive</option>
              <option value="Invalid Moonton proof reference">Invalid Moonton proof reference</option>
              <option value="Other delivery discrepancy">Other delivery discrepancy</option>
            </select>
          </div>

          {blockCheck.isBlocked && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-600/70 text-xs text-rose-200 flex items-start gap-2 animate-in fade-in duration-200">
              <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-100 font-bold mb-0.5">Dispute Reason Blocked by Anti-Abuse System</strong>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  {blockCheck.reasonMessage}
                </p>
                {blockCheck.serverProof && (
                  <p className="text-[10px] font-mono text-cyan-300 mt-1">
                    {blockCheck.serverProof}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Detailed Explanation / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe your in-game diamond balance before and after, or provide specifics..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || blockCheck.isBlocked}
              className="flex-1 py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Freezing Escrow Vault...</span>
                </>
              ) : blockCheck.isBlocked ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Blocked by Anti-Abuse Lock</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Freeze Vault & Open Dispute</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
