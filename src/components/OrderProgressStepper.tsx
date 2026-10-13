import React, { useState, useEffect } from 'react';
import { EscrowOrder } from '../types';
import { formatCurrency, getPaymentMethodDetails } from '../utils/formatters';
import {
  CreditCard,
  ShieldCheck,
  Cpu,
  Gem,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  Zap,
  Info,
  Layers,
  Lock,
  RefreshCw
} from 'lucide-react';

export type ProgressStageId = 'paid' | 'escrow_locked' | 'processing' | 'delivered';

export interface ProgressStage {
  id: ProgressStageId;
  stepNumber: number;
  label: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp?: number;
  details: {
    title: string;
    value: string;
  }[];
}

interface OrderProgressStepperProps {
  order: EscrowOrder;
  className?: string;
  autoAnimateOnMount?: boolean;
}

export const OrderProgressStepper: React.FC<OrderProgressStepperProps> = ({
  order,
  className = '',
  autoAnimateOnMount = false,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<ProgressStageId | null>(null);
  const [isSimulatingAnimation, setIsSimulatingAnimation] = useState(false);
  const [animatedStepIndex, setAnimatedStepIndex] = useState<number | null>(null);

  // Compute live active step index (0: Paid, 1: Escrow Locked, 2: Processing, 3: Delivered)
  const computeLiveStageIndex = (): number => {
    if (order.status === 'completed') {
      return 3; // Delivered & Settled
    }
    if (
      order.status === 'delivered_pending_confirmation' ||
      order.status === 'delivery_proof_uploaded' ||
      order.diamondsReceivedVerified
    ) {
      return 3; // Delivered (in inspection / pending confirmation)
    }
    if (order.status === 'seller_processing') {
      return 2; // Processing
    }
    if (order.status === 'escrow_locked') {
      return 1; // Escrow Locked (waiting for seller to start processing)
    }
    // Default: Paid (escrow pending/initializing)
    return 0;
  };

  const liveStageIndex = computeLiveStageIndex();
  const currentStageIndex = isSimulatingAnimation && animatedStepIndex !== null
    ? animatedStepIndex
    : liveStageIndex;

  const paymentMeta = getPaymentMethodDetails(order.paymentMethod);

  const formatTimestamp = (ts?: number) => {
    if (!ts) return undefined;
    return new Date(ts).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  // Define the 4 specified stages: Paid -> Escrow Locked -> Processing -> Delivered
  const stages: ProgressStage[] = [
    {
      id: 'paid',
      stepNumber: 1,
      label: 'Paid',
      subtitle: 'Payment Verified',
      description: `Buyer payment verified via ${paymentMeta.name}. Official transaction reference generated.`,
      icon: CreditCard,
      timestamp: order.createdAt,
      details: [
        { title: 'Payment Method', value: `${paymentMeta.flag} ${paymentMeta.name}` },
        { title: 'Payment Ref', value: order.paymentReference || 'TX-VAULT-AUTO' },
        { title: 'Amount Paid', value: formatCurrency(order.amount, order.currency, order.amountPhp) },
        { title: 'Paid At', value: formatTimestamp(order.createdAt) || 'Verified' },
      ],
    },
    {
      id: 'escrow_locked',
      stepNumber: 2,
      label: 'Escrow Locked',
      subtitle: 'Vault Secured',
      description: 'Funds safely locked in the Aegis Smart Escrow Vault. Neither party can withdraw without verified delivery.',
      icon: ShieldCheck,
      timestamp: order.escrowLockedAt || order.createdAt,
      details: [
        { title: 'Escrow Vault', value: 'AEGIS-SMART-VAULT-V3' },
        { title: 'Protection Level', value: '100% Anti-Fraud Guarantee' },
        { title: 'Seller Stock Check', value: 'Reserved & Allocated' },
        { title: 'Vault Lock Time', value: formatTimestamp(order.escrowLockedAt || order.createdAt) || 'Secured' },
      ],
    },
    {
      id: 'processing',
      stepNumber: 3,
      label: 'Processing',
      subtitle: 'Moonton Gateway',
      description: `${order.sellerName} is pushing diamond top-up through the official Moonton distributor gateway.`,
      icon: Cpu,
      timestamp: order.sellerStartedAt,
      details: [
        { title: 'Distributor Node', value: order.distributorProvider || 'Direct Moonton Gateway' },
        { title: 'Target IGN', value: order.mlbbIgn },
        { title: 'Player ID / Zone', value: `${order.mlbbUserId} (${order.mlbbZoneId})` },
        { title: 'Started Processing', value: formatTimestamp(order.sellerStartedAt) || (liveStageIndex >= 2 ? 'In Progress' : 'Pending') },
      ],
    },
    {
      id: 'delivered',
      stepNumber: 4,
      label: 'Delivered',
      subtitle: 'Diamonds In-Game',
      description: `+${order.diamonds} Diamonds (+${order.bonusDiamonds || 0} bonus) delivered to MLBB account. In-game balance confirmed.`,
      icon: Gem,
      timestamp: order.completedAt || order.proofUploadedAt,
      details: [
        { title: 'Delivered Amount', value: `${order.diamonds} 💎 ${order.bonusDiamonds ? `+ ${order.bonusDiamonds} Bonus` : ''}` },
        { title: 'Balance Verification', value: order.diamondsReceivedVerified ? 'Verified by Player' : 'Inspection Window Active' },
        { title: 'Transaction Hash', value: order.moontonTransactionRef || 'MOONTON-BATCH-HASH-VERIFIED' },
        { title: 'Completion Time', value: formatTimestamp(order.completedAt || order.proofUploadedAt) || (liveStageIndex >= 3 ? 'Delivered' : 'Awaiting Final Step') },
      ],
    },
  ];

  // Optional auto-animation on initial mount
  useEffect(() => {
    if (autoAnimateOnMount) {
      handlePlayAnimation();
    }
  }, []);

  // Animation simulator that steps through: Paid -> Escrow Locked -> Processing -> Delivered
  const handlePlayAnimation = () => {
    if (isSimulatingAnimation) return;
    setIsSimulatingAnimation(true);
    setAnimatedStepIndex(0);

    const stepIntervals = [0, 1, 2, 3];
    stepIntervals.forEach((stepIdx, i) => {
      setTimeout(() => {
        setAnimatedStepIndex(stepIdx);
        // After reaching final step, hold for 1.2s then return to live order state
        if (i === stepIntervals.length - 1) {
          setTimeout(() => {
            setIsSimulatingAnimation(false);
            setAnimatedStepIndex(null);
          }, 1400);
        }
      }, i * 900);
    });
  };

  const activeStage = stages.find((s) => s.id === selectedStageId) || stages[currentStageIndex];

  // Calculate progress percentage: 0 -> 12.5%, 1 -> 40%, 2 -> 70%, 3 -> 100%
  const progressPercent =
    currentStageIndex === 0
      ? 16
      : currentStageIndex === 1
      ? 45
      : currentStageIndex === 2
      ? 75
      : 100;

  const isDisputed = order.status === 'disputed';
  const isCancelled = order.status === 'cancelled';

  return (
    <div
      id="order-progress-stepper"
      className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4 ${className}`}
    >
      {/* Header with Title and Flow Playback Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Live Order Progress Stepper
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                Stage {currentStageIndex + 1} of 4: {stages[currentStageIndex].label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              End-to-end verified escrow lifecycle: <span className="text-slate-300">Paid ➔ Escrow Locked ➔ Processing ➔ Delivered</span>
            </p>
          </div>
        </div>

        {/* Right side controls: Animate flow button + Overall % Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePlayAnimation}
            disabled={isSimulatingAnimation}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isSimulatingAnimation
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Watch the visual progress stepper transition through all stages"
          >
            {isSimulatingAnimation ? (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                <span>Animate Flow</span>
              </>
            )}
          </button>

          <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Main Visual Stepper Bar with Animated Connecting Track */}
      <div className="relative pt-3 pb-2 px-2 sm:px-4">
        {/* Background Grey Track Line */}
        <div className="absolute top-[32px] left-[8%] right-[8%] h-1.5 bg-slate-800 rounded-full z-0" />

        {/* Animated Active Glowing Progress Line */}
        <div
          className="absolute top-[32px] left-[8%] h-1.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 rounded-full z-0 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(34,211,238,0.5)]"
          style={{
            width: `${Math.max(0, Math.min(84, (currentStageIndex / 3) * 84))}%`,
          }}
        />

        {/* 4 Stage Nodes */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2 relative z-10">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex || (idx === 3 && currentStageIndex === 3 && order.status === 'completed');
            const isCurrent = idx === currentStageIndex && !(idx === 3 && order.status === 'completed');
            const isPending = idx > currentStageIndex;
            const isSelected = selectedStageId === stage.id;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id === selectedStageId ? null : stage.id)}
                className={`group flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer relative text-center focus:outline-none ${
                  isSelected
                    ? 'bg-slate-800/80 ring-2 ring-cyan-400 shadow-lg'
                    : 'hover:bg-slate-900/60'
                }`}
              >
                {/* Node Circle */}
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/30 scale-100'
                      : isCurrent
                      ? isDisputed
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-4 ring-rose-400/30 animate-pulse'
                        : 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg shadow-cyan-400/50 ring-4 ring-cyan-400/30 scale-110'
                      : 'bg-slate-900 text-slate-500 border border-slate-700/80 group-hover:border-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <div className="relative flex items-center justify-center">
                      <Check className="w-5 h-5 stroke-[3] text-slate-950" />
                      <Sparkles className="w-2.5 h-2.5 text-emerald-950 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      {stage.id === 'paid' && (
                        <CreditCard className="w-5 h-5 text-slate-950 animate-pulse" />
                      )}
                      {stage.id === 'escrow_locked' && (
                        <ShieldCheck className="w-5 h-5 text-slate-950 animate-bounce" />
                      )}
                      {stage.id === 'processing' && (
                        <RefreshCw className="w-5 h-5 text-slate-950 animate-spin" style={{ animationDuration: '2.5s' }} />
                      )}
                      {stage.id === 'delivered' && (
                        <Gem className="w-5 h-5 text-slate-950 animate-bounce" />
                      )}
                      {/* Sub-pulse wave ring */}
                      <span className="absolute -inset-2 rounded-full border-2 border-cyan-300 animate-ping opacity-75" />
                    </div>
                  ) : (
                    <Icon className="w-4 h-4 opacity-60" />
                  )}

                  {/* Stage Number Badge */}
                  <span
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shadow ${
                      isCompleted
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        : isCurrent
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-400'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {stage.stepNumber}
                  </span>
                </div>

                {/* Stage Title and Subtitle */}
                <div className="mt-2.5 w-full">
                  <span
                    className={`block text-xs font-bold truncate transition-colors ${
                      isCompleted
                        ? 'text-emerald-300'
                        : isCurrent
                        ? 'text-cyan-300'
                        : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span
                    className={`hidden sm:block text-[10px] font-mono truncate transition-colors ${
                      isCompleted
                        ? 'text-emerald-400/80'
                        : isCurrent
                        ? 'text-cyan-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {isCompleted ? 'Complete' : isCurrent ? 'Active Now' : 'Up Next'}
                  </span>
                </div>

                {/* Active Underline Pill */}
                {isCurrent && (
                  <span className="mt-1 w-5 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Active Stage Inspector Box */}
      {activeStage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-3 flex-1">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                activeStage.stepNumber - 1 < currentStageIndex ||
                (activeStage.stepNumber === 4 && currentStageIndex === 3 && order.status === 'completed')
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
                  : activeStage.stepNumber - 1 === currentStageIndex
                  ? 'bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <activeStage.icon className="w-4 h-4" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">
                  Stage {activeStage.stepNumber}: {activeStage.label}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    activeStage.stepNumber - 1 < currentStageIndex ||
                    (activeStage.stepNumber === 4 && currentStageIndex === 3 && order.status === 'completed')
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : activeStage.stepNumber - 1 === currentStageIndex
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 animate-pulse'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {activeStage.stepNumber - 1 < currentStageIndex ||
                  (activeStage.stepNumber === 4 && currentStageIndex === 3 && order.status === 'completed')
                    ? '✓ Stage Complete'
                    : activeStage.stepNumber - 1 === currentStageIndex
                    ? '● Live Stage'
                    : '⏳ Queued'}
                </span>
                {activeStage.timestamp && (
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {formatTimestamp(activeStage.timestamp)}
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                {activeStage.description}
              </p>

              {/* Stage metadata chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                {activeStage.details.map((item, idx) => (
                  <div key={idx} className="bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block truncate">{item.title}</span>
                    <span className="text-[11px] font-mono font-semibold text-slate-200 block truncate" title={item.value}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
