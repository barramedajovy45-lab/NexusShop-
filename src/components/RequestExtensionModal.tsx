import React, { useState } from 'react';
import { EscrowOrder } from '../types';
import {
  Clock,
  ShieldCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

interface RequestExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onConfirmExtension: (reason: string, customNote?: string) => void;
}

const PRESET_REASONS = [
  'Seller reported Moonton API queue delays',
  'Diamonds not yet reflected in MLBB game wallet',
  'Seller requested extra time to complete fulfillment',
  'Moonton game server maintenance in seller region',
  'Awaiting manual verification from Moonton distributor',
];

export const RequestExtensionModal: React.FC<RequestExtensionModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmExtension,
}) => {
  const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentExtensions = order.extensionCount || 0;
  const newDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      onConfirmExtension(selectedReason, customNote.trim() || undefined);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-cyan-500" />

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Request Escrow Extension
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  +24 Hours
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extend protection time for Order <span className="font-mono text-cyan-400">{order.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Informational Callout */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 space-y-1">
              <p className="font-semibold text-white">
                Is seller <span className="text-amber-300">{order.sellerName}</span> experiencing delays?
              </p>
              <p className="text-slate-400 leading-relaxed">
                Extending escrow protection grants the seller an additional 24 hours to deliver your {order.diamonds.toLocaleString()} diamonds. Your payment remains 100% frozen in the Aegis Escrow Vault until you verify receipt.
              </p>
            </div>
          </div>

          {/* Extension Impact Metric Box */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">Protection Added</span>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>+24 Hours</span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {currentExtensions > 0 ? `Total: +${(currentExtensions + 1) * 24}h extended` : 'First extension'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase block">New Protection Deadline</span>
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span className="truncate">
                  {newDeadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {newDeadline.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Preset Reasons */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Reason for Delay Extension
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'bg-amber-950/40 border-amber-500/60 text-white'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="extensionReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-amber-500 h-3.5 w-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Additional Notes for Seller & Arbiters <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g., Seller mentioned MLBB server maintenance in their region. Giving until tomorrow."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Buyer Protection Guarantee: You retain full authority to confirm receipt or file a dispute at any point during the 24-hour extension.
            </span>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Confirm +24h Extension</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
