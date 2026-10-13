import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  Zap,
  CheckCircle2,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Server,
  Lock,
  ShieldAlert,
  ArrowRight,
  Info,
  RefreshCw,
  Cpu,
  Gem,
  Activity,
  Radio,
  Play,
  CheckCheck
} from 'lucide-react';
import { EscrowOrder, OrderStatus } from '../types';

interface OrderStatusMapProps {
  order: EscrowOrder;
  secondsRemaining?: number;
  onStartProcessing?: () => void;
  onDispatchProof?: () => void;
  onConfirmReceived?: () => void;
  onRequestDispute?: () => void;
  onRequestExtension?: () => void;
  onOpenMoontonCheck?: () => void;
  currentUserRole?: 'buyer' | 'seller';
}

interface StepMeta {
  id: 'step-escrow-secured' | 'step-processing' | 'step-topup-initiated' | 'step-completed';
  stepNumber: number;
  title: string;
  shortLabel: string;
  description: string;
  activeDescription: string;
  completedDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp?: number;
}

/**
 * High-fidelity Animated Step Icon providing dynamic visual feedback
 * for each stage of the escrow transaction lifecycle.
 */
export const AnimatedStepNodeIcon: React.FC<{
  stepId: StepMeta['id'];
  stepNumber: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  isDisputed: boolean;
  isCancelled: boolean;
  isAdvancing?: boolean;
  className?: string;
}> = ({
  stepId,
  stepNumber,
  isCompleted,
  isCurrent,
  isPending,
  isDisputed,
  isCancelled,
  isAdvancing = false,
  className = '',
}) => {
  // 1. Disputed state - Flashing hazard beacon with alert ring
  if (isDisputed && isCurrent) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
        <span className="absolute -inset-1 rounded-full border-2 border-rose-500/80 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 relative z-10">
          <ShieldAlert className="w-5 h-5 stroke-[2.5] animate-bounce" />
        </div>
      </div>
    );
  }

  // 2. Cancelled or Refunded
  if (isCancelled) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    );
  }

  // 3. Completed State - Animated emerald check with stage-specific celebratory flourishes
  if (isCompleted) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Soft emerald outer aura */}
        <span className="absolute inset-0 rounded-full bg-emerald-500/20 blur-sm scale-110" />
        
        {/* Advancing ripple if just completed */}
        {isAdvancing && (
          <span className="absolute -inset-2 rounded-full border-2 border-emerald-400/80 animate-ping" />
        )}

        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 relative z-10 transition-transform hover:scale-105">
          {stepId === 'step-completed' ? (
            <div className="relative flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <Sparkles className="w-3 h-3 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
            </div>
          ) : stepId === 'step-topup-initiated' ? (
            <div className="relative flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
              <Gem className="w-2.5 h-2.5 text-cyan-200 absolute -top-1 -right-1" />
            </div>
          ) : stepId === 'step-processing' ? (
            <div className="relative flex items-center justify-center">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Small floating badge */}
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-950 border border-emerald-400 flex items-center justify-center z-20">
          <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
        </span>
      </div>
    );
  }

  // 4. Current Active State - High visual feedback with step-specific motion & energy pulses
  if (isCurrent) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Expanding pulsating radar beacon */}
        <span className="absolute -inset-1.5 rounded-full bg-cyan-400/30 animate-ping" />
        
        {/* Rotating energy halo */}
        <span className="absolute -inset-1 rounded-full border border-cyan-400/60 border-t-cyan-200 animate-spin" style={{ animationDuration: '3s' }} />

        {/* Main interactive node with distinctive animated inner icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 text-slate-950 flex items-center justify-center shadow-xl shadow-cyan-500/40 relative z-10 ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950">
          {stepId === 'step-escrow-secured' && (
            <div className="relative flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2.5] animate-pulse" />
              <Lock className="w-2.5 h-2.5 text-slate-950 absolute -top-1 -right-1 animate-bounce" />
            </div>
          )}

          {stepId === 'step-processing' && (
            <div className="relative flex items-center justify-center">
              {/* Rotating gear / server synchronization */}
              <RefreshCw className="w-5 h-5 stroke-[2.5] animate-spin text-slate-950" style={{ animationDuration: '2s' }} />
              <Activity className="w-2.5 h-2.5 text-emerald-950 absolute -bottom-1 -right-1 animate-pulse" />
            </div>
          )}

          {stepId === 'step-topup-initiated' && (
            <div className="relative flex items-center justify-center">
              {/* Electric charge lightning with pulsing diamond */}
              <Zap className="w-5 h-5 stroke-[2.5] animate-bounce fill-amber-300 text-amber-950" />
              <Radio className="w-3 h-3 text-cyan-950 absolute -top-1 -right-1 animate-pulse" />
            </div>
          )}

          {stepId === 'step-completed' && (
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
          )}
        </div>

        {/* Live active milestone beacon dot */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-300 border-2 border-slate-950 shadow-md shadow-cyan-300 animate-pulse z-20" />
      </div>
    );
  }

  // 5. Pending State - Elegant dimmed node awaiting transaction milestone
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="w-10 h-10 rounded-full bg-slate-900/80 text-slate-500 border border-slate-800 flex items-center justify-center group-hover:border-slate-700 group-hover:text-slate-400 transition-all">
        {stepId === 'step-escrow-secured' && <ShieldCheck className="w-4 h-4 opacity-50" />}
        {stepId === 'step-processing' && <Server className="w-4 h-4 opacity-50" />}
        {stepId === 'step-topup-initiated' && <Zap className="w-4 h-4 opacity-50" />}
        {stepId === 'step-completed' && <CheckCircle2 className="w-4 h-4 opacity-50" />}
      </div>
      <span className="text-[10px] font-mono text-slate-600 absolute -bottom-4">Step {stepNumber}</span>
    </div>
  );
};

export const OrderStatusMap: React.FC<OrderStatusMapProps> = ({
  order,
  secondsRemaining,
  onStartProcessing,
  onDispatchProof,
  onConfirmReceived,
  onRequestDispute,
  onRequestExtension,
  onOpenMoontonCheck,
  currentUserRole = 'buyer',
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Simulation state to let users/developers preview advancing transactions in real-time
  const [isSimulatingAdvance, setIsSimulatingAdvance] = useState(false);
  const [simulatedStepIndex, setSimulatedStepIndex] = useState<number | null>(null);

  // Visual advancement notification banner state
  const [advancementNotice, setAdvancementNotice] = useState<{
    stepTitle: string;
    stepNumber: number;
    message: string;
  } | null>(null);

  // Determine current active step index (0 to 3)
  const computeStepStatus = (): {
    currentIndex: number;
    isDisputed: boolean;
    isCancelled: boolean;
    isRefunded: boolean;
  } => {
    const isDisputed = order.status === 'disputed';
    const isCancelled = order.status === 'cancelled';
    const isRefunded = order.status === 'refunded';

    if (order.status === 'completed') {
      return { currentIndex: 3, isDisputed, isCancelled, isRefunded };
    }
    if (order.status === 'delivered_pending_confirmation' || order.status === 'delivery_proof_uploaded') {
      return { currentIndex: 2, isDisputed, isCancelled, isRefunded };
    }
    if (order.status === 'seller_processing') {
      return { currentIndex: 1, isDisputed, isCancelled, isRefunded };
    }
    if (order.status === 'escrow_locked' || order.status === 'escrow_pending') {
      return { currentIndex: 0, isDisputed, isCancelled, isRefunded };
    }
    if (isDisputed) {
      const idx = order.proofUploadedAt || order.moontonTransactionRef ? 2 : 1;
      return { currentIndex: idx, isDisputed: true, isCancelled, isRefunded };
    }
    if (isCancelled || isRefunded) {
      return { currentIndex: 0, isDisputed, isCancelled: true, isRefunded: true };
    }
    return { currentIndex: 0, isDisputed, isCancelled, isRefunded };
  };

  const { currentIndex: liveCurrentIndex, isDisputed, isCancelled, isRefunded } = computeStepStatus();

  // Use simulated index when preview simulation is running
  const currentIndex = simulatedStepIndex !== null ? simulatedStepIndex : liveCurrentIndex;

  // Track transaction advancements to trigger visual feedback
  const prevIndexRef = useRef(currentIndex);
  const [justAdvanced, setJustAdvanced] = useState(false);

  useEffect(() => {
    if (currentIndex > prevIndexRef.current) {
      setJustAdvanced(true);
      const stepNames = ['Escrow Secured', 'Processing Queue', 'Top-up Initiated', 'Completed & Settled'];
      setAdvancementNotice({
        stepTitle: stepNames[currentIndex] || `Step ${currentIndex + 1}`,
        stepNumber: currentIndex + 1,
        message: `Milestone reached! Order advanced to Step ${currentIndex + 1}: ${stepNames[currentIndex]}`,
      });

      const timer = setTimeout(() => {
        setJustAdvanced(false);
      }, 3500);

      const noticeTimer = setTimeout(() => {
        setAdvancementNotice(null);
      }, 5000);

      prevIndexRef.current = currentIndex;
      return () => {
        clearTimeout(timer);
        clearTimeout(noticeTimer);
      };
    }
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  const steps: StepMeta[] = [
    {
      id: 'step-escrow-secured',
      stepNumber: 1,
      title: 'Escrow Secured',
      shortLabel: 'Escrow Secured',
      description: 'Buyer payment captured and held securely in the Aegis Smart Vault.',
      activeDescription: 'Funds locked in neutral escrow vault. Seller notified to initiate dispatch.',
      completedDescription: 'Payment safely isolated in Aegis Vault. Recipient MLBB ID verified.',
      icon: ShieldCheck,
      timestamp: order.escrowLockedAt || order.createdAt,
    },
    {
      id: 'step-processing',
      stepNumber: 2,
      title: 'Processing',
      shortLabel: 'Processing',
      description: 'Seller prepares diamond recharge and queues Moonton API dispatch.',
      activeDescription: 'Seller is actively processing and pushing diamonds through authorized server API.',
      completedDescription: 'Recharge batch processed through authorized distributor API.',
      icon: Server,
      timestamp: order.sellerStartedAt,
    },
    {
      id: 'step-topup-initiated',
      stepNumber: 3,
      title: 'Top-up Initiated',
      shortLabel: 'Top-up Initiated',
      description: 'Diamonds injected into MLBB player account; 15-minute inspection active.',
      activeDescription: 'Diamonds dispatched! 15-minute inspection window started to verify in-game balance.',
      completedDescription: 'Moonton server recharge confirmed with transaction hash.',
      icon: Zap,
      timestamp: order.proofUploadedAt,
    },
    {
      id: 'step-completed',
      stepNumber: 4,
      title: 'Completed',
      shortLabel: 'Completed',
      description: 'In-game diamond balance verified; escrow vault settled and released.',
      activeDescription: 'Buyer confirms receipt or inspection window safely concludes without disputes.',
      completedDescription: 'Order settled! Diamonds confirmed in MLBB. Vault funds deposited to seller.',
      icon: CheckCircle2,
      timestamp: order.completedAt,
    },
  ];

  // Helper to format timestamps
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return null;
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return null;
    }
  };

  const formatTimer = (totalSeconds?: number) => {
    if (totalSeconds === undefined) return '15:00';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const activeStep = steps[selectedStepIndex !== null ? selectedStepIndex : currentIndex];

  // Handler to simulate advancement across all 4 steps to preview animations
  const handleSimulateAdvanceFlow = () => {
    if (isSimulatingAdvance) return;
    setIsSimulatingAdvance(true);
    setSimulatedStepIndex(0);

    const stepsSeq = [0, 1, 2, 3];
    stepsSeq.forEach((stepIdx, i) => {
      setTimeout(() => {
        setSimulatedStepIndex(stepIdx);
        if (i === stepsSeq.length - 1) {
          setTimeout(() => {
            setIsSimulatingAdvance(false);
            setSimulatedStepIndex(null);
          }, 1800);
        }
      }, i * 1100);
    });
  };

  return (
    <div
      id="order-status-visual-map"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden"
    >
      {/* Visual Advancement Notification Pill */}
      {advancementNotice && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/90 via-slate-900 to-emerald-950/90 border border-cyan-400/60 shadow-lg shadow-cyan-950/50 flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-bounce" />
              <span>{advancementNotice.message}</span>
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0 font-semibold">
            Stage {advancementNotice.stepNumber} Active
          </span>
        </div>
      )}

      {/* Header Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wider uppercase">
                Escrow Delivery SLA & Status Map
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                Live Animated Stepper
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Real-time milestone feedback with interactive inspection & settlement
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {/* Real-time simulation preview button */}
          <button
            type="button"
            onClick={handleSimulateAdvanceFlow}
            disabled={isSimulatingAdvance}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isSimulatingAdvance
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Preview how animated icons advance through all transaction milestones"
          >
            {isSimulatingAdvance ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Advancing Steps...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/30" />
                <span>Preview Advance ⚡</span>
              </>
            )}
          </button>

          {/* Status Badge */}
          {isCancelled || isRefunded ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/80 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" />
              <span>100% Escrow Refunded</span>
            </span>
          ) : isDisputed ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/80 flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              <span>Escrow Frozen under Dispute</span>
            </span>
          ) : order.status === 'completed' || currentIndex === 3 ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Completed & Settled</span>
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-700/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Step {currentIndex + 1} of 4: {steps[currentIndex].title}</span>
            </span>
          )}
        </div>
      </div>

      {/* Visual Stepper Bar with Animated Connecting Track */}
      <div className="relative pt-3 pb-3">
        {/* Background track line */}
        <div className="absolute top-[34px] left-[12.5%] right-[12.5%] h-1.5 bg-slate-800 rounded-full z-0 hidden sm:block" />

        {/* Filled active gradient track line with animated travelling energy pulse */}
        {!isCancelled && !isRefunded && (
          <div
            className="absolute top-[34px] left-[12.5%] h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-cyan-500 rounded-full z-0 transition-all duration-700 hidden sm:block relative overflow-hidden"
            style={{
              width: `${(currentIndex / 3) * 75}%`,
            }}
          >
            {/* Travelling energy shimmer beam */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        )}

        {/* Step Nodes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = !isCancelled && (order.status === 'completed' || idx < currentIndex);
            const isCurrent = !isCancelled && idx === currentIndex && order.status !== 'completed';
            const isPending = !isCancelled && idx > currentIndex && order.status !== 'completed';
            const isSelected = selectedStepIndex === idx;
            const isAdvancingNode = justAdvanced && idx === currentIndex;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setSelectedStepIndex(idx === selectedStepIndex ? null : idx)}
                className={`p-3 sm:p-2.5 rounded-2xl transition-all relative flex flex-col items-center group cursor-pointer text-center ${
                  isSelected
                    ? 'bg-slate-800/90 ring-2 ring-cyan-400/80 shadow-lg'
                    : isCurrent
                    ? 'bg-cyan-950/40 border border-cyan-500/60 shadow-lg shadow-cyan-950/50'
                    : isCompleted
                    ? 'bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/60'
                    : 'bg-slate-950/40 border border-slate-800/40 hover:bg-slate-900/40'
                }`}
              >
                {/* Node Animated Icon */}
                <div className="mb-2">
                  <AnimatedStepNodeIcon
                    stepId={step.id}
                    stepNumber={step.stepNumber}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isPending={isPending}
                    isDisputed={isDisputed}
                    isCancelled={isCancelled}
                    isAdvancing={isAdvancingNode}
                  />
                </div>

                {/* Step Titles */}
                <div className="w-full text-center">
                  <div className="flex items-center gap-1 justify-center">
                    <span
                      className={`text-xs font-bold leading-tight transition-colors ${
                        isCompleted
                          ? 'text-emerald-300'
                          : isCurrent
                          ? 'text-cyan-300 font-extrabold'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 font-mono">
                    {step.timestamp ? formatTime(step.timestamp) : isPending ? 'Upcoming' : 'Pending'}
                  </div>
                </div>

                {/* Mobile status indicator */}
                <div className="mt-1 sm:hidden">
                  {isCompleted && (
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-cyan-300 font-bold animate-pulse flex items-center gap-1">
                      <Zap className="w-3 h-3" /> In Progress
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[10px] font-mono text-slate-500">Queued</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected/Active Step Detail Card */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          {/* Animated Detail Stage Avatar */}
          <div className="shrink-0 mt-0.5">
            <AnimatedStepNodeIcon
              stepId={activeStep.id}
              stepNumber={activeStep.stepNumber}
              isCompleted={order.status === 'completed' || (selectedStepIndex !== null && selectedStepIndex < currentIndex)}
              isCurrent={selectedStepIndex === null ? true : selectedStepIndex === currentIndex}
              isPending={selectedStepIndex !== null && selectedStepIndex > currentIndex}
              isDisputed={isDisputed}
              isCancelled={isCancelled}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">
                Step {activeStep.stepNumber}: {activeStep.title}
              </span>
              {selectedStepIndex !== null && selectedStepIndex !== currentIndex && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Inspecting Milestone {selectedStepIndex + 1}
                </span>
              )}
              {currentIndex === activeStep.stepNumber - 1 && !isDisputed && order.status !== 'completed' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>Active Milestone</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentIndex === activeStep.stepNumber - 1
                ? activeStep.activeDescription
                : currentIndex > activeStep.stepNumber - 1 || order.status === 'completed'
                ? activeStep.completedDescription
                : activeStep.description}
            </p>

            {/* In-Game details and timestamps */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 font-mono flex-wrap">
              {activeStep.timestamp && formatTime(activeStep.timestamp) && (
                <span>
                  Recorded: <strong className="text-slate-200">{formatTime(activeStep.timestamp)}</strong>
                </span>
              )}
              {activeStep.stepNumber === 1 && (
                <span>Payment Ref: <strong className="text-cyan-300">{order.paymentReference}</strong></span>
              )}
              {activeStep.stepNumber === 2 && (
                <span>Target: <strong className="text-cyan-300">{order.mlbbIgn} ({order.mlbbUserId})</strong></span>
              )}
              {activeStep.stepNumber === 3 && order.moontonTransactionRef && (
                <span>Moonton Hash: <strong className="text-cyan-300">{order.moontonTransactionRef}</strong></span>
              )}
              {activeStep.stepNumber === 3 && (order.status === 'delivered_pending_confirmation' || order.status === 'delivery_proof_uploaded') && (
                <span className="text-amber-300 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>15-Min Auto-Release Inspection: {formatTimer(secondsRemaining)}</span>
                </span>
              )}
              {activeStep.stepNumber === 4 && order.status === 'completed' && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Escrow Vault Settled to {order.sellerName}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Milestone Contextual Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
          {/* Step 1 Seller Action */}
          {currentIndex === 0 && order.status === 'escrow_locked' && onStartProcessing && (
            <button
              type="button"
              onClick={onStartProcessing}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Start Processing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Step 2 Dispatch Proof Action */}
          {currentIndex === 1 && order.status === 'seller_processing' && onDispatchProof && (
            <button
              type="button"
              onClick={onDispatchProof}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dispatch & Attach Proof</span>
            </button>
          )}

          {/* Step 3 Buyer Confirm & Dispute Actions */}
          {currentIndex === 2 && (order.status === 'delivered_pending_confirmation' || order.status === 'delivery_proof_uploaded') && (
            <>
              {onConfirmReceived && (
                <button
                  type="button"
                  onClick={onConfirmReceived}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm Received</span>
                </button>
              )}
              {onRequestExtension && (
                <button
                  type="button"
                  onClick={onRequestExtension}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 border border-amber-600/50 text-amber-300 font-semibold text-xs transition-colors cursor-pointer"
                  title="Extend protection countdown (+24h)"
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
              )}
              {onRequestDispute && (
                <button
                  type="button"
                  onClick={onRequestDispute}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 font-semibold text-xs transition-colors cursor-pointer"
                  title="Raise Escrow Dispute"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {/* Moonton Server Verification Button */}
          {onOpenMoontonCheck && (
            <button
              type="button"
              onClick={onOpenMoontonCheck}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Query Moonton Server API for this order"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Moonton API</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
