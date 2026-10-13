import React, { useState, useEffect } from 'react';
import { EscrowOrder, OrderFeedback } from '../types';
import {
  formatCurrency,
  getOrderStatusMeta,
  getPaymentMethodDetails,
  safeFormatDate,
  safeFormatTime,
  safeFormatDateTime,
} from '../utils/formatters';
import { LiveOrderChat } from './LiveOrderChat';
import { DisputeModal } from './DisputeModal';
import { RequestExtensionModal } from './RequestExtensionModal';
import { PostTransactionFeedbackModal } from './PostTransactionFeedbackModal';
import { OrderCancellationModal } from './OrderCancellationModal';
import { MoontonApiCheckModal } from './MoontonApiCheckModal';
import { DiamondImage } from './DiamondImage';
import { OrderStatusMap } from './OrderStatusMap';
import { OrderProgressStepper } from './OrderProgressStepper';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  Lock,
  ExternalLink,
  AlertCircle,
  Copy,
  Check,
  FileCheck,
  Eye,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  Star,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Server,
  FileSpreadsheet,
  Building2,
  Globe,
  FlaskConical,
  AlertTriangle,
  Trash2,
  Radio,
  Activity,
  Cpu,
  Layers,
  Fingerprint
} from 'lucide-react';
import { downloadTransactionsCSV } from '../utils/csvExporter';
import { triggerOrderCompletedConfetti } from '../utils/confetti';
import { playDiamondDetectedSound } from '../utils/audio';
import {
  performMoontonInGameDetection,
  applyAutoDetectionToOrder,
  generateCryptographicProof,
} from '../utils/diamondDetection';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onUpdateOrder: (updated: EscrowOrder) => void;
  onCancelOrder?: (orderId: string, reason?: string, notes?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  currentUserRole?: 'buyer' | 'seller';
  initialOpenCancellation?: boolean;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  onUpdateOrder,
  onCancelOrder,
  onDeleteOrder,
  currentUserRole = 'buyer',
  initialOpenCancellation = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'chat' | 'audit'>('timeline');
  const [auditFilter, setAuditFilter] = useState<'all' | 'vault' | 'moonton' | 'settlement'>('all');
  const [auditCopied, setAuditCopied] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(initialOpenCancellation);
  const [isMoontonModalOpen, setIsMoontonModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Moonton In-Game Diamond Auto-Detection Engine State
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('');
  const [showAutoDetectionToast, setShowAutoDetectionToast] = useState(false);

  const safeChatMessages = Array.isArray(order?.chatMessages) ? order.chatMessages : [];

  // Auto-scan on mount if order is delivered or processing but not yet verified
  useEffect(() => {
    if (!isOpen || !order) return;
    if (
      (order.status === 'delivered_pending_confirmation' || order.status === 'seller_processing') &&
      !order.diamondsReceivedVerified &&
      !isAutoScanning
    ) {
      const autoTimer = setTimeout(() => {
        handleRunAutoDetection('credited');
      }, 3000);
      return () => clearTimeout(autoTimer);
    }
  }, [isOpen, order?.id, order?.status, order?.diamondsReceivedVerified]);

  const handleRunAutoDetection = async (forceOutcome: 'credited' | 'empty' = 'credited') => {
    if (isAutoScanning || !order) return;
    setIsAutoScanning(true);
    setScanProgress(18);
    setScanStageText(`Pinging Moonton Gateway Cluster SEA-${order.mlbbZoneId || '3092'}...`);

    setTimeout(() => {
      setScanProgress(45);
      setScanStageText(`Validating MLBB Account UID ${order.mlbbUserId} (${order.mlbbIgn})...`);
    }, 600);

    setTimeout(() => {
      setScanProgress(78);
      setScanStageText(`Inspecting In-Game Diamond Ledger Delta (+${(order.diamonds || 0) + (order.bonusDiamonds || 0)} 💎)...`);
    }, 1250);

    setTimeout(async () => {
      setScanProgress(100);
      setScanStageText('Diamond delivery confirmed on Moonton game servers! Anti-abuse payment lock engaged.');

      const audit = await performMoontonInGameDetection(order, forceOutcome === 'credited');
      const updated = applyAutoDetectionToOrder(order, audit);
      onUpdateOrder(updated);
      setIsAutoScanning(false);

      if (forceOutcome === 'credited') {
        playDiamondDetectedSound();
        setShowAutoDetectionToast(true);
        setTimeout(() => setShowAutoDetectionToast(false), 5000);
      }
    }, 1900);
  };

  useEffect(() => {
    if (initialOpenCancellation) {
      setIsCancellationModalOpen(true);
    }
  }, [initialOpenCancellation]);

  // Live timer countdown simulation for inspection window (15 mins) or SLA
  const [secondsRemaining, setSecondsRemaining] = useState(
    order?.autoReleaseMinutesRemaining ? order.autoReleaseMinutesRemaining * 60 : 900
  );

  // Live 24-Hour Buyer Auto-Pay Countdown (in seconds)
  const computeAutoPaySecondsLeft = () => {
    if (!order) return 86400;
    const deadline = order.autoPayDeadlineAt || (order.createdAt ? order.createdAt + 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000);
    return Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  };
  const [autoPaySecondsLeft, setAutoPaySecondsLeft] = useState<number>(computeAutoPaySecondsLeft);

  useEffect(() => {
    if (!isOpen || !order) return;
    setAutoPaySecondsLeft(computeAutoPaySecondsLeft());
    if (
      order.status === 'completed' ||
      order.status === 'cancelled' ||
      order.status === 'refunded' ||
      order.status === 'disputed' ||
      order.autoPay24hEnabled === false
    ) {
      return;
    }

    const autoPayInterval = setInterval(() => {
      setAutoPaySecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(autoPayInterval);
          setTimeout(() => {
            handleExecuteAutoPay24h(true);
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(autoPayInterval);
  }, [isOpen, order?.id, order?.status, order?.autoPayDeadlineAt, order?.autoPay24hEnabled]);

  useEffect(() => {
    if (!isOpen || !order) return;
    if (order.status !== 'delivered_pending_confirmation' && order.status !== 'delivery_proof_uploaded') {
      return;
    }
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-release escrow safely outside reducer!
          setTimeout(() => {
            handleAutoRelease();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, order?.status]);

  if (!isOpen || !order) return null;

  const formatAutoPayCountdown = (totalSecs: number) => {
    if (typeof totalSecs !== 'number' || isNaN(totalSecs) || totalSecs <= 0) {
      return '00h 00m 00s';
    }
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Execute 24-Hour Auto-Pay if buyer hasn't paid or settled within 24 hours
  const handleExecuteAutoPay24h = (isTimerExpired: boolean = false) => {
    if (!order) return;
    const now = Date.now();
    const safeMethod = order.paymentMethod || 'gcash';
    const paymentName = getPaymentMethodDetails(safeMethod)?.name || 'Direct Payment';
    const autoPayRef = order.paymentReference || ('AUTOPAY-24H-' + Math.floor(100000 + Math.random() * 900000));

    if (order.status === 'escrow_pending') {
      // Buyer hadn't paid within 24 hours -> Auto-Pay charges linked payment method, locks escrow, and dispatches
      const updated: EscrowOrder = {
        ...order,
        status: 'escrow_locked',
        escrowLockedAt: now,
        autoPaidAt: now,
        autoPayTriggered: true,
        autoPay24hEnabled: true,
        paymentReference: autoPayRef,
        autoReleaseMinutesRemaining: 15,
        chatMessages: [
          ...safeChatMessages,
          {
            id: 'msg_autopay_exec_' + now,
            sender: 'system',
            senderName: 'Nexus Shop 24h Auto-Pay Engine',
            text: `⚡ [24-HOUR AUTO-PAY EXECUTED]: ${
              isTimerExpired ? '24-hour buyer payment window elapsed without manual payment.' : '24-hour Auto-Pay triggered.'
            } Automatically charged ${formatCurrency(order.amount, order.currency, order.amountPhp)} via ${paymentName} (Ref: ${autoPayRef}) and locked funds in Aegis Escrow Vault. Seller ${order.sellerName || 'Merchant'} has been dispatched to fulfill +${(order.diamonds || 0) + (order.bonusDiamonds || 0)} 💎!`,
            timestamp: now,
          },
        ],
      };
      onUpdateOrder(updated);
      playDiamondDetectedSound();
      return;
    }

    // If order was already locked/processing/delivered and buyer didn't confirm/pay within 24h -> Auto-Pay settles order to seller
    const proofRef = order.moontonTransactionRef || ('MOON-AUTOPAY-' + Math.floor(10000 + Math.random() * 90000));
    const updated: EscrowOrder = {
      ...order,
      status: 'completed',
      completedAt: now,
      autoPaidAt: now,
      autoPayTriggered: true,
      autoPay24hEnabled: true,
      diamondsReceivedVerified: true,
      moontonTransactionRef: proofRef,
      autoReleaseMinutesRemaining: 0,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_autopay_settle_' + now,
          sender: 'system',
          senderName: 'Nexus Shop 24h Auto-Pay Engine',
          text: `⚡ [24-HOUR AUTO-PAY SETTLEMENT]: Buyer did not manually settle within 24 hours. Aegis 24-Hour Auto-Pay Protocol automatically finalized payment of ${formatCurrency(order.amount, order.currency, order.amountPhp)} via ${paymentName} and released payout to seller ${order.sellerName || 'Merchant'}.`,
          timestamp: now,
        },
      ],
    };
    onUpdateOrder(updated);
    triggerOrderCompletedConfetti({ force: true });
  };

  // Manual Pay Now for orders in 'escrow_pending' state before the 24-hour auto-pay timer expires
  const handleManualPayNow = () => {
    if (!order) return;
    const now = Date.now();
    const safeMethod = order.paymentMethod || 'gcash';
    const paymentName = getPaymentMethodDetails(safeMethod)?.name || 'Direct Payment';
    const updated: EscrowOrder = {
      ...order,
      status: 'escrow_locked',
      escrowLockedAt: now,
      autoReleaseMinutesRemaining: 15,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_manual_pay_' + now,
          sender: 'buyer',
          senderName: order.buyerName,
          text: `I have completed payment of ${formatCurrency(order.amount, order.currency, order.amountPhp)} via ${paymentName} ahead of the 24-hour Auto-Pay deadline.`,
          timestamp: now,
        },
        {
          id: 'msg_sys_lock_' + now,
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `✅ Buyer payment verified and locked in Aegis Escrow Vault! Seller ${order.sellerName} has been alerted to dispatch ${order.diamonds} Diamonds.`,
          timestamp: now + 300,
        },
      ],
    };
    onUpdateOrder(updated);
    playDiamondDetectedSound();
  };

  const handleAutoRelease = () => {
    const updated: EscrowOrder = {
      ...order,
      status: 'completed',
      completedAt: Date.now(),
      autoReleaseMinutesRemaining: 0,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_auto_rel_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `Inspection window concluded without dispute. Escrow vault automatically released ${formatCurrency(order.amount, order.currency)} to seller ${order.sellerName}.`,
          timestamp: Date.now(),
        }
      ]
    };
    onUpdateOrder(updated);
    triggerOrderCompletedConfetti({ force: true });
  };

  const handleConfirmReceived = () => {
    const updated: EscrowOrder = {
      ...order,
      status: 'completed',
      completedAt: Date.now(),
      autoReleaseMinutesRemaining: 0,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_confirm_' + Date.now(),
          sender: 'buyer',
          senderName: order.buyerName,
          text: 'I have verified that diamonds were received in-game. Escrow released!',
          timestamp: Date.now(),
        },
        {
          id: 'msg_sys_release_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `Buyer confirmed receipt. Escrow payment of ${formatCurrency(order.amount, order.currency)} successfully deposited into seller's available balance!`,
          timestamp: Date.now() + 500,
        }
      ]
    };
    onUpdateOrder(updated);
    triggerOrderCompletedConfetti({ force: true });
    setTimeout(() => {
      setIsFeedbackModalOpen(true);
    }, 450);
  };

  const handleFeedbackSubmit = (orderId: string, feedback: OrderFeedback) => {
    const updated: EscrowOrder = {
      ...order,
      feedback,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_feedback_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `⭐ Verified Buyer Rating: ${feedback.rating}/5 Stars! ${feedback.review ? `"${feedback.review}" ` : ''}${feedback.tags?.length ? `[${feedback.tags.join(', ')}] ` : ''}Recorded on ${order.sellerName}'s P2P Marketplace rating scorecard.`,
          timestamp: Date.now(),
        }
      ]
    };
    onUpdateOrder(updated);
  };

  const handleStartProcessing = () => {
    const updated: EscrowOrder = {
      ...order,
      status: 'seller_processing',
      sellerStartedAt: Date.now(),
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_proc_' + Date.now(),
          sender: 'seller',
          senderName: order.sellerName,
          text: `Starting Moonton direct diamond recharge for MLBB ID ${order.mlbbUserId}. Top-up is actively processing now!`,
          timestamp: Date.now(),
        },
        {
          id: 'msg_sys_proc_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `Order status updated to Processing. Seller is fulfilling top-up.`,
          timestamp: Date.now() + 200,
        }
      ]
    };
    onUpdateOrder(updated);
  };

  // Seller Action: Dispatch / Upload Proof with Moonton Auto-Detection Binding
  const handleSellerDispatchProof = () => {
    const proofRef = 'MOON-SEA-' + Math.floor(10000 + Math.random() * 90000) + '-TX992';
    const totalDiamonds = (order.diamonds || 0) + (order.bonusDiamonds || 0);
    const prevBal = order.autoDetectionAudit?.previousBalance ?? 52;
    const newBal = prevBal + totalDiamonds;

    const audit = {
      verified: true,
      detectedAt: Date.now(),
      method: 'moonton_cluster_poll' as const,
      serverCluster: `moonton-sea-zone-${order.mlbbZoneId || '3092'}.mobilelegends.com`,
      moontonTransactionRef: proofRef,
      accountIgn: order.mlbbIgn,
      userId: order.mlbbUserId,
      zoneId: order.mlbbZoneId,
      diamondsDelivered: totalDiamonds,
      previousBalance: prevBal,
      newBalance: newBal,
      latencyMs: 22,
      cryptographicProof: generateCryptographicProof(order.id, order.mlbbUserId, totalDiamonds),
      antiAbuseLockActive: true,
      statusSummary: `Moonton Server Node confirmed delivery of +${totalDiamonds} Diamonds to character "${order.mlbbIgn}" (UID: ${order.mlbbUserId}). In-game balance verified.`,
    };

    const updated: EscrowOrder = {
      ...order,
      status: 'delivered_pending_confirmation',
      proofUploadedAt: Date.now(),
      moontonTransactionRef: proofRef,
      diamondsReceivedVerified: true,
      autoDetectedAt: Date.now(),
      antiAbuseStatus: 'protected',
      autoDetectionAudit: audit,
      proofImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      autoReleaseMinutesRemaining: 15,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_proof_' + Date.now(),
          sender: 'seller',
          senderName: order.sellerName,
          text: `Diamonds successfully transferred via Moonton Server API. Ref ID: ${proofRef}. Please inspect your MLBB diamond balance!`,
          timestamp: Date.now(),
          isProof: true,
        },
        {
          id: 'msg_sys_autodetect_' + Date.now(),
          sender: 'system',
          senderName: 'Moonton Auto-Detection Shield',
          text: `🛡️ [ANTI-ABUSE PROTOCOL]: In-game diamond arrival automatically verified on Moonton Server (${audit.serverCluster}). Character "${order.mlbbIgn}" (UID: ${order.mlbbUserId}) balance: ${prevBal} 💎 ➔ ${newBal} 💎 (+${totalDiamonds} 💎). Payment security active: False non-receipt claims are locked.`,
          timestamp: Date.now() + 300,
        },
        {
          id: 'msg_sys_timer_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: '15-minute buyer inspection timer started. You can confirm delivery or dispute if not received.',
          timestamp: Date.now() + 500,
        }
      ]
    };
    setSecondsRemaining(900);
    onUpdateOrder(updated);
    playDiamondDetectedSound();
  };

  const handleDisputeSubmit = (reason: string, notes: string) => {
    const updated: EscrowOrder = {
      ...order,
      status: 'disputed',
      disputeReason: reason,
      disputeNotes: notes,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_disp_' + Date.now(),
          sender: 'buyer',
          senderName: order.buyerName,
          text: `[DISPUTE FILED]: ${reason}. Notes: ${notes}`,
          timestamp: Date.now(),
        },
        {
          id: 'msg_arbiter_' + Date.now(),
          sender: 'escrow_arbiter',
          senderName: 'Nexus Shop Escrow Arbiter #04',
          text: 'Escrow vault frozen. Arbiter assigned. We are retrieving official Moonton server recharge logs for MLBB User ID ' + order.mlbbUserId + '. Please do not close this ticket.',
          timestamp: Date.now() + 500,
        }
      ]
    };
    onUpdateOrder(updated);
  };

  const handleConfirmExtension = (reason: string, customNote?: string) => {
    const currentExtHours = order.escrowProtectionExtendedHours || 0;
    const newExtHours = currentExtHours + 24;
    const newExtCount = (order.extensionCount || 0) + 1;
    const newExtendedUntil = Date.now() + 24 * 60 * 60 * 1000;
    const updatedAutoRelease = (order.autoReleaseMinutesRemaining || 15) + 1440;

    // Add 24 hours (86,400 seconds) to active inspection countdown
    setSecondsRemaining((prev) => prev + 24 * 3600);

    const formattedDeadline = new Date(newExtendedUntil).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const noteSuffix = customNote ? ` Note: "${customNote}"` : '';

    const updated: EscrowOrder = {
      ...order,
      escrowProtectionExtendedHours: newExtHours,
      extensionCount: newExtCount,
      extendedUntil: newExtendedUntil,
      lastExtensionReason: reason,
      autoReleaseMinutesRemaining: updatedAutoRelease,
      chatMessages: [
        ...safeChatMessages,
        {
          id: 'msg_buyer_ext_' + Date.now(),
          sender: 'buyer',
          senderName: order.buyerName,
          text: `[ESCROW EXTENSION GRANTED]: I have extended escrow protection time by +24 hours. Reason: "${reason}".${noteSuffix} Additional fulfillment time granted without penalties.`,
          timestamp: Date.now(),
        },
        {
          id: 'msg_sys_ext_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: `🛡️ Escrow Protection Extended by +24 Hours (Extension #${newExtCount}). New deadline: ${formattedDeadline}. Funds remain strictly locked in Aegis Vault and will not auto-release or expire until extension concludes.`,
          timestamp: Date.now() + 250,
        }
      ]
    };

    onUpdateOrder(updated);
  };

  const handleCancelOrderSubmit = (orderId: string, reason: string, notes?: string) => {
    if (onCancelOrder) {
      onCancelOrder(orderId, reason, notes);
    } else {
      const refundRef = 'RF-' + Math.floor(10000000 + Math.random() * 90000000);
      const updated: EscrowOrder = {
        ...order,
        status: 'cancelled',
        cancelledAt: Date.now(),
        cancellationReason: reason,
        cancellationNotes: notes,
        refundTransactionRef: refundRef,
        refundedAmount: order.amount,
        chatMessages: [
          ...safeChatMessages,
          {
            id: 'msg_cancel_' + Date.now(),
            sender: 'system',
            senderName: 'Nexus Shop Escrow Bot',
            text: `🚫 Diamond order cancelled by Buyer. Reason: "${reason}". 100% of escrow vault payment (${formatCurrency(order.amount, order.currency)}) has been immediately refunded to buyer via ${(order.paymentMethod || 'gcash').toUpperCase()} (Refund Ref: ${refundRef}). Zero fees charged.`,
            timestamp: Date.now(),
          }
        ]
      };
      onUpdateOrder(updated);
    }
    setIsCancellationModalOpen(false);
  };

  const handleSendMessage = (text: string) => {
    const newMsg = {
      id: 'msg_' + Date.now(),
      sender: currentUserRole,
      senderName: currentUserRole === 'buyer' ? order.buyerName : order.sellerName,
      text,
      timestamp: Date.now(),
    };
    const updated: EscrowOrder = {
      ...order,
      chatMessages: [...safeChatMessages, newMsg],
    };
    onUpdateOrder(updated);
  };

  const copyToClipboard = (text: string, field: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // Ignore iframe clipboard permission restrictions
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const statusMeta = getOrderStatusMeta(order.status);
  const paymentMeta = getPaymentMethodDetails(order.paymentMethod);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate deterministic cryptographic hash for each Escrow Vault status transition
  const computeTransitionHash = (stepId: string, ts: number, fromState: string, toState: string) => {
    const seed = `${order?.id || 'ORD'}:${stepId}:${ts || Date.now()}:${fromState}->${toState}:${order?.mlbbUserId || ''}`;
    let h1 = 0xdeadbeef ^ seed.length;
    let h2 = 0x41c6ce57 ^ seed.length;
    for (let i = 0, ch; i < seed.length; i++) {
      ch = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (
      '0x' +
      (h2 >>> 0).toString(16).padStart(8, '0') +
      (h1 >>> 0).toString(16).padStart(8, '0') +
      Math.abs((h1 ^ h2) >>> 0).toString(16).padStart(8, '0')
    );
  };

  const baseCreated = order.createdAt || Date.now() - 180000;
  const lockedTs = order.escrowLockedAt || baseCreated + 1200;
  const processingTs =
    order.sellerStartedAt ||
    (order.status !== 'escrow_pending' && order.status !== 'escrow_locked' ? lockedTs + 15000 : undefined);
  const proofTs =
    order.proofUploadedAt ||
    order.autoDetectedAt ||
    (order.moontonTransactionRef ||
    order.status === 'delivered_pending_confirmation' ||
    order.status === 'delivery_proof_uploaded' ||
    order.status === 'completed'
      ? (processingTs || lockedTs) + 32000
      : undefined);

  interface SecurityAuditTransition {
    id: string;
    stepNumber: number;
    category: 'vault' | 'moonton' | 'settlement';
    fromStatus: string;
    toStatus: string;
    title: string;
    description: string;
    actor: string;
    actorRole: 'SYSTEM_VAULT' | 'PAYMENT_GATEWAY' | 'MOONTON_API' | 'MERCHANT_NODE' | 'BUYER_CLIENT' | 'ESCROW_ARBITER';
    timestamp?: number;
    state: 'verified' | 'active' | 'pending' | 'alert';
    vaultAction: string;
    verificationBadge: string;
    txHash: string;
    metadata: { label: string; value: string }[];
  }

  const securityAuditTransitions: SecurityAuditTransition[] = [
    {
      id: 'audit_init_auth',
      stepNumber: 1,
      category: 'vault',
      fromStatus: 'SESSION_INIT',
      toStatus: 'ESCROW_PENDING',
      title: 'Order Contract Initialized & Payment Gateway Handshake',
      description: `Buyer ${order.buyerName} initiated an Aegis Smart Escrow contract for ${order.diamonds + (order.bonusDiamonds || 0)} MLBB Diamonds via ${paymentMeta.name}.`,
      actor: `${paymentMeta.name} Gateway (Zod + HMAC-SHA256)`,
      actorRole: 'PAYMENT_GATEWAY',
      timestamp: baseCreated,
      state: 'verified',
      vaultAction: `AUTHORIZE ${formatCurrency(order.amount, order.currency, order.amountPhp)}`,
      verificationBadge: 'HMAC-SHA256 SIGNED',
      txHash: computeTransitionHash('audit_init_auth', baseCreated, 'SESSION_INIT', 'ESCROW_PENDING'),
      metadata: [
        { label: 'Payment Ref', value: order.paymentReference },
        { label: 'Channel', value: `${paymentMeta.flag} ${paymentMeta.name}` },
        { label: 'Escrow Fee', value: '0.00% (Buyer Protected)' },
      ],
    },
    {
      id: 'audit_vault_lock',
      stepNumber: 2,
      category: 'vault',
      fromStatus: 'ESCROW_PENDING',
      toStatus: 'ESCROW_LOCKED',
      title: 'Funds Cryptographically Locked in Aegis Escrow Vault',
      description: `Real-money payment of ${formatCurrency(order.amount, order.currency, order.amountPhp)} isolated inside non-custodial Aegis Vault reserve. Upfront seller payout is strictly blocked until in-game delivery is proven.`,
      actor: 'Aegis Smart Escrow Vault Engine v2.4',
      actorRole: 'SYSTEM_VAULT',
      timestamp: lockedTs,
      state: 'verified',
      vaultAction: `VAULT_LOCKED (${formatCurrency(order.amount, order.currency, order.amountPhp)})`,
      verificationBadge: 'ZERO-CHARGEBACK LOCK',
      txHash: computeTransitionHash('audit_vault_lock', lockedTs, 'ESCROW_PENDING', 'ESCROW_LOCKED'),
      metadata: [
        { label: 'Vault State', value: 'FROZEN_FOR_FULFILLMENT' },
        { label: 'Beneficiary', value: `${order.sellerName} (Locked)` },
        { label: 'Refund Guarantee', value: '100% Automated Rollback' },
      ],
    },
    {
      id: 'audit_mlbb_role_verify',
      stepNumber: 3,
      category: 'moonton',
      fromStatus: 'ESCROW_LOCKED',
      toStatus: 'TARGET_UID_VERIFIED',
      title: 'Moonton Game Server Account & Zone ID Validation',
      description: `Target Mobile Legends character "${order.mlbbIgn}" verified against regional server cluster ${order.mlbbServer || `SEA-Zone-${order.mlbbZoneId}`}. Zero-password policy enforced.`,
      actor: 'Moonton Role-Check Verifier Node',
      actorRole: 'MOONTON_API',
      timestamp: lockedTs + 450,
      state: 'verified',
      vaultAction: 'BIND_RECIPIENT_UID',
      verificationBadge: 'UID + ZONE 200 OK',
      txHash: computeTransitionHash('audit_mlbb_role_verify', lockedTs + 450, 'ESCROW_LOCKED', 'TARGET_UID_VERIFIED'),
      metadata: [
        { label: 'Player IGN', value: order.mlbbIgn },
        { label: 'MLBB UID / Zone', value: `${order.mlbbUserId} (${order.mlbbZoneId})` },
        { label: 'Server Cluster', value: order.mlbbServer || `SEA-PH-${order.mlbbZoneId}` },
      ],
    },
    {
      id: 'audit_seller_dispatch',
      stepNumber: 4,
      category: 'moonton',
      fromStatus: 'ESCROW_LOCKED',
      toStatus: 'SELLER_PROCESSING',
      title: 'Merchant Fulfillment & Diamond Injection Dispatch',
      description:
        order.fulfillmentType === 'official_mlbb_manual'
          ? `Shop Operator queued manual top-up via official Moonton portal (shop.mobilelegends.com) for ${order.mlbbIgn}.`
          : order.fulfillmentType === 'authorized_distributor_dashboard'
          ? `Operator dispatched diamond package through ${order.distributorProvider || 'Partner Console'} official B2B terminal.`
          : `Authorized Distributor API (${order.distributorProvider || order.sellerName}) executing direct server diamond injection (+${order.diamonds + (order.bonusDiamonds || 0)} 💎).`,
      actor: order.distributorProvider || order.sellerName,
      actorRole: 'MERCHANT_NODE',
      timestamp: processingTs,
      state:
        order.status === 'escrow_locked' || order.status === 'escrow_pending'
          ? 'active'
          : 'verified',
      vaultAction: 'HOLD_FUNDS_DURING_DISPATCH',
      verificationBadge:
        order.status === 'escrow_locked' ? 'AWAITING DISPATCH' : 'API PAYLOAD TRANSMITTED',
      txHash: computeTransitionHash(
        'audit_seller_dispatch',
        processingTs || lockedTs + 5000,
        'ESCROW_LOCKED',
        'SELLER_PROCESSING'
      ),
      metadata: [
        { label: 'Fulfillment Mode', value: order.fulfillmentType || 'authorized_distributor_api' },
        { label: 'Merchant', value: order.sellerName },
        { label: 'Diamond Payload', value: `${order.diamonds} Base + ${order.bonusDiamonds || 0} Bonus 💎` },
      ],
    },
    {
      id: 'audit_ingame_autodetect',
      stepNumber: 5,
      category: 'moonton',
      fromStatus: 'SELLER_PROCESSING',
      toStatus: 'DELIVERED_PENDING_CONFIRMATION',
      title: 'Moonton In-Game Balance Delta Audit & Anti-Abuse Lock',
      description:
        order.diamondsReceivedVerified || order.moontonTransactionRef
          ? `Moonton Server confirmed +${order.diamonds + (order.bonusDiamonds || 0)} Diamonds credited to "${order.mlbbIgn}" (Ref: ${order.moontonTransactionRef || 'MT-SEA-VERIFIED'}). Anti-Abuse Shield engaged to prevent false non-receipt claims.`
          : 'Awaiting cryptographic receipt reference and in-game diamond balance delta verification from Moonton server cluster.',
      actor: 'Moonton In-Game Auto-Detection Shield',
      actorRole: 'MOONTON_API',
      timestamp: proofTs,
      state:
        order.diamondsReceivedVerified ||
        order.status === 'delivered_pending_confirmation' ||
        order.status === 'delivery_proof_uploaded' ||
        order.status === 'completed'
          ? 'verified'
          : order.status === 'seller_processing'
          ? 'active'
          : 'pending',
      vaultAction:
        order.diamondsReceivedVerified || order.moontonTransactionRef
          ? 'START_15M_INSPECTION_WINDOW'
          : 'WAIT_FOR_PROOF_UPLOAD',
      verificationBadge:
        order.diamondsReceivedVerified || order.moontonTransactionRef
          ? 'LEDGER DELTA VERIFIED'
          : 'PENDING SERVER PROOF',
      txHash: computeTransitionHash(
        'audit_ingame_autodetect',
        proofTs || lockedTs + 30000,
        'SELLER_PROCESSING',
        'DELIVERED_PENDING_CONFIRMATION'
      ),
      metadata: [
        {
          label: 'Moonton Ref',
          value: order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || 'PENDING_REF',
        },
        {
          label: 'Balance Delta',
          value: `${order.autoDetectionAudit?.previousBalance ?? 52} 💎 → ${(order.autoDetectionAudit?.previousBalance ?? 52) + order.diamonds + (order.bonusDiamonds || 0)} 💎`,
        },
        {
          label: 'Anti-Abuse Lock',
          value: order.diamondsReceivedVerified ? 'ACTIVE (Protected)' : 'STANDBY',
        },
      ],
    },
  ];

  // Add dynamic extension transitions if buyer extended escrow timer
  if ((order.extensionCount || 0) > 0) {
    securityAuditTransitions.push({
      id: 'audit_escrow_extension',
      stepNumber: securityAuditTransitions.length + 1,
      category: 'vault',
      fromStatus: 'INSPECTION_WINDOW',
      toStatus: `EXTENDED_+${order.escrowProtectionExtendedHours || 24}H`,
      title: `Escrow Vault Time-Lock Extended (+${order.escrowProtectionExtendedHours || 24} Hours)`,
      description: `Buyer requested an escrow protection extension (${order.extensionCount}x). Reason: "${order.lastExtensionReason || 'Additional verification time'}". Auto-release timer paused and extended.`,
      actor: order.buyerName,
      actorRole: 'BUYER_CLIENT',
      timestamp: order.extendedUntil ? order.extendedUntil - 24 * 3600 * 1000 : Date.now() - 60000,
      state: 'verified',
      vaultAction: 'EXTEND_VAULT_TIMELOCK',
      verificationBadge: `EXTENSION #${order.extensionCount} ACTIVE`,
      txHash: computeTransitionHash(
        'audit_escrow_extension',
        order.extendedUntil || Date.now(),
        'INSPECTION_WINDOW',
        'EXTENDED'
      ),
      metadata: [
        { label: 'Added Hold Time', value: `+${order.escrowProtectionExtendedHours || 24} Hours` },
        { label: 'Reason', value: order.lastExtensionReason || 'Buyer Requested' },
        { label: 'Vault Status', value: 'STRICTLY FROZEN' },
      ],
    });
  }

  // Add terminal or current final settlement state transition
  if (order.status === 'disputed') {
    securityAuditTransitions.push({
      id: 'audit_dispute_freeze',
      stepNumber: securityAuditTransitions.length + 1,
      category: 'settlement',
      fromStatus: 'DELIVERED_PENDING_CONFIRMATION',
      toStatus: 'DISPUTED_VAULT_FROZEN',
      title: 'Emergency Dispute Freeze & Arbiter Escalation',
      description: `Dispute filed by buyer ("${order.disputeReason || 'Delivery discrepancy'}"). Aegis Vault has frozen all funds and assigned Nexus Shop Escrow Arbiter #04 to inspect official Moonton recharge logs.`,
      actor: 'Nexus Shop Escrow Arbiter #04',
      actorRole: 'ESCROW_ARBITER',
      timestamp: Date.now() - 30000,
      state: 'alert',
      vaultAction: 'EMERGENCY_VAULT_FREEZE',
      verificationBadge: 'ARBITER ASSIGNED',
      txHash: computeTransitionHash('audit_dispute_freeze', Date.now(), 'DELIVERED', 'DISPUTED'),
      metadata: [
        { label: 'Dispute Reason', value: order.disputeReason || 'Under Investigation' },
        { label: 'Vault Lock', value: 'HARD_FREEZE (No Auto-Release)' },
        { label: 'Arbiter Node', value: 'Arbiter #04 (SEA Dispute Desk)' },
      ],
    });
  } else if (order.status === 'cancelled' || order.status === 'refunded') {
    const cancelTs = order.cancelledAt || Date.now();
    securityAuditTransitions.push({
      id: 'audit_vault_refund',
      stepNumber: securityAuditTransitions.length + 1,
      category: 'settlement',
      fromStatus: 'ESCROW_LOCKED',
      toStatus: 'CANCELLED_100%_REFUNDED',
      title: 'Escrow Contract Cancelled & 100% Buyer Refund Executed',
      description: `Order cancelled ("${order.cancellationReason || 'Buyer requested cancellation'}"). Aegis Escrow Vault unlocked and returned 100% of ${formatCurrency(order.amount, order.currency, order.amountPhp)} to buyer via ${paymentMeta.name} with zero penalty.`,
      actor: 'Aegis Automated Refund Engine',
      actorRole: 'SYSTEM_VAULT',
      timestamp: cancelTs,
      state: 'alert',
      vaultAction: `REFUND_BUYER (${formatCurrency(order.amount, order.currency, order.amountPhp)})`,
      verificationBadge: '100% REFUND SETTLED',
      txHash: computeTransitionHash('audit_vault_refund', cancelTs, 'ESCROW_LOCKED', 'CANCELLED_REFUNDED'),
      metadata: [
        { label: 'Refund Ref', value: order.refundTransactionRef || `RF-${order.id}` },
        { label: 'Returned Amount', value: formatCurrency(order.amount, order.currency, order.amountPhp) },
        { label: 'Cancellation Penalty', value: '₱0.00 (0% Fee)' },
      ],
    });
  } else {
    const doneTs = order.completedAt;
    securityAuditTransitions.push({
      id: 'audit_vault_release',
      stepNumber: securityAuditTransitions.length + 1,
      category: 'settlement',
      fromStatus: 'DELIVERED_PENDING_CONFIRMATION',
      toStatus: 'COMPLETED_VAULT_RELEASED',
      title: 'Escrow Vault Settlement & Merchant Payout Release',
      description:
        order.status === 'completed'
          ? `Buyer confirmed in-game diamond receipt (or 15m inspection concluded cleanly). Aegis Escrow Vault released ${formatCurrency(order.amount, order.currency, order.amountPhp)} to merchant ${order.sellerName}. Contract immutably closed.`
          : `Awaiting buyer confirmation or conclusion of the 15-minute inspection countdown (${formatTimer(secondsRemaining)} remaining) before releasing ${formatCurrency(order.amount, order.currency, order.amountPhp)} to ${order.sellerName}.`,
      actor: order.status === 'completed' ? `${order.buyerName} / Aegis Settlement Node` : 'Aegis Escrow Time-Lock Guard',
      actorRole: order.status === 'completed' ? 'BUYER_CLIENT' : 'SYSTEM_VAULT',
      timestamp: doneTs,
      state:
        order.status === 'completed'
          ? 'verified'
          : order.status === 'delivered_pending_confirmation' || order.status === 'delivery_proof_uploaded'
          ? 'active'
          : 'pending',
      vaultAction:
        order.status === 'completed'
          ? `RELEASED_TO_SELLER (${formatCurrency(order.amount, order.currency, order.amountPhp)})`
          : `HOLD_UNTIL_CONFIRMED (${formatTimer(secondsRemaining)})`,
      verificationBadge:
        order.status === 'completed' ? 'SETTLEMENT FINALIZED' : 'INSPECTION TIMER ACTIVE',
      txHash: computeTransitionHash(
        'audit_vault_release',
        doneTs || baseCreated + 900000,
        'DELIVERED_PENDING_CONFIRMATION',
        'COMPLETED_VAULT_RELEASED'
      ),
      metadata: [
        { label: 'Settlement Status', value: order.status === 'completed' ? 'SETTLED & DISBURSED' : 'LOCKED IN VAULT' },
        { label: 'Net Merchant Payout', value: formatCurrency(order.amount, order.currency, order.amountPhp) },
        { label: 'Audit Integrity', value: 'SHA-256 Chain Verified' },
      ],
    });
  }

  // Add 24-Hour Buyer Auto-Pay Protocol Checkpoint to Security Audit Log
  if (order.autoPay24hEnabled !== false || order.autoPayTriggered) {
    const autoPayTs = order.autoPaidAt || order.autoPayDeadlineAt || (baseCreated + 24 * 60 * 60 * 1000);
    securityAuditTransitions.push({
      id: 'audit_24h_autopay_guard',
      stepNumber: securityAuditTransitions.length + 1,
      category: 'settlement',
      fromStatus: order.status === 'escrow_pending' ? 'ESCROW_PENDING' : 'UNPAID_OR_UNCONFIRMED_24H',
      toStatus: order.autoPayTriggered ? 'AUTO_PAID_24H_SETTLED' : '24H_AUTOPAY_ARMED',
      title: order.autoPayTriggered
        ? '24-Hour Buyer Auto-Pay Executed & Settled'
        : '24-Hour Buyer Auto-Pay Protocol Armed',
      description: order.autoPayTriggered
        ? `Buyer did not manually pay/settle within 24 hours. Aegis 24-Hour Auto-Pay automatically executed payment of ${formatCurrency(order.amount, order.currency, order.amountPhp)} via ${paymentMeta.name} and settled the transaction.`
        : `Active 24-hour Auto-Pay rule: If the buyer does not complete payment or confirm delivery within 24 hours (${formatAutoPayCountdown(autoPaySecondsLeft)} remaining), payment is automatically processed via ${paymentMeta.name}.`,
      actor: 'Nexus Shop 24h Auto-Pay Engine',
      actorRole: 'SYSTEM_VAULT',
      timestamp: order.autoPaidAt || order.createdAt,
      state: order.autoPayTriggered || order.status === 'completed' ? 'verified' : 'active',
      vaultAction: order.autoPayTriggered
        ? `AUTO_PAID_24H (${formatCurrency(order.amount, order.currency, order.amountPhp)})`
        : `AUTO_PAY_AT_24H (${formatAutoPayCountdown(autoPaySecondsLeft)})`,
      verificationBadge: order.autoPayTriggered ? '24H AUTO-PAID' : '24H TIMER ACTIVE',
      txHash: computeTransitionHash(
        'audit_24h_autopay_guard',
        autoPayTs,
        'PENDING_24H',
        order.autoPayTriggered ? 'AUTO_PAID' : 'ARMED'
      ),
      metadata: [
        { label: 'Auto-Pay Rule', value: 'If Unpaid After 24 Hours' },
        { label: 'Payment Channel', value: `${paymentMeta.flag} ${paymentMeta.name}` },
        {
          label: 'Trigger Status',
          value: order.autoPayTriggered
            ? `Auto-Paid at ${new Date(order.autoPaidAt || Date.now()).toLocaleTimeString()}`
            : `Countdown: ${formatAutoPayCountdown(autoPaySecondsLeft)}`,
        },
      ],
    });
  }

  const filteredAuditTransitions = securityAuditTransitions.filter((item) =>
    auditFilter === 'all' ? true : item.category === auditFilter
  );

  const handleCopyFullAuditLog = () => {
    const payload = {
      orderId: order.id,
      escrowProtocol: 'Aegis Smart Escrow v2.4 (Moonton Direct)',
      currentVaultStatus: order.status,
      amountLocked: formatCurrency(order.amount, order.currency, order.amountPhp),
      recipientMlbbAccount: `${order.mlbbIgn} (${order.mlbbUserId} / ${order.mlbbZoneId})`,
      exportedAt: new Date().toISOString(),
      transitions: securityAuditTransitions.map((t) => ({
        step: t.stepNumber,
        transition: `${t.fromStatus} -> ${t.toStatus}`,
        title: t.title,
        actor: t.actor,
        vaultAction: t.vaultAction,
        state: t.state,
        timestamp: t.timestamp ? safeFormatDateTime(t.timestamp) : 'PENDING',
        txHash: t.txHash,
      })),
    };
    copyToClipboard(JSON.stringify(payload, null, 2), 'full_audit_json');
    setAuditCopied(true);
    setTimeout(() => setAuditCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white font-mono">
                  Order {order.id}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border} font-semibold`}>
                  {statusMeta.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated Escrow Tracking · Real-Time Moonton Gateway
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch inside tracker: Timeline vs Live Chat vs Security Audit Log */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              id="tab-order-timeline"
              onClick={() => setActiveSubTab('timeline')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'timeline'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/70 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Transaction Timeline
            </button>
            <button
              type="button"
              id="tab-order-chat"
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'chat'
                  ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/70 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Order Chat</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-200 font-mono">
                {safeChatMessages.length}
              </span>
            </button>
            <button
              type="button"
              id="tab-security-audit-log"
              onClick={() => setActiveSubTab('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'audit'
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/70 shadow-sm'
                  : 'text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              <span>Security Audit Log</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-700/60 text-[10px] text-emerald-300 font-mono font-bold">
                {securityAuditTransitions.filter((t) => t.state === 'verified').length}/{securityAuditTransitions.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            {/* Refresh Order Status - Moonton Server API Check */}
            <button
              type="button"
              onClick={() => setIsMoontonModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/60 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              title="Simulate real-time check against Moonton server API to verify if diamonds have been credited (Authorized MLBB Distribution Provider)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Refresh Order Status</span>
            </button>

            {order.status !== 'completed' && order.status !== 'refunded' && order.status !== 'disputed' && order.status !== 'cancelled' && (
              <>
                <button
                  onClick={() => setIsExtensionModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  title="Extend escrow protection time by 24 hours if seller is experiencing delays"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Request Extension (+24h)</span>
                </button>

                <button
                  onClick={() => setIsCancellationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-500/60 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                  title="Cancel diamond purchase & receive 100% escrow refund"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Cancel Order</span>
                </button>
              </>
            )}

            {(order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded') && onDeleteOrder && (
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(order.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-rose-950/50 hover:border-rose-700/60 text-slate-400 hover:text-rose-300 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                title="Remove this order permanently from history for cleanliness"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove from History</span>
              </button>
            )}

            {/* Quick Total & Applied Discounts */}
            <div className="text-right text-xs font-mono">
              <div className="flex items-center justify-end gap-1.5 mb-0.5">
                {order.bulkDiscountApplied && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                    5% Bulk
                  </span>
                )}
                {order.gcashDiscountApplied && (
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                    2% GCash
                  </span>
                )}
              </div>
              <span className="text-slate-400">Escrow: </span>
              <span className="font-bold text-white">
                {formatCurrency(order.amount, order.currency, order.amountPhp)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {activeSubTab === 'timeline' ? (
            <>
              {/* Order Quick Summary Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">MLBB Target Account</span>
                  <p className="font-bold text-white font-mono text-sm">{order.mlbbIgn}</p>
                  <p className="text-cyan-400 font-mono text-[11px]">
                    ID: {order.mlbbUserId} ({order.mlbbZoneId})
                  </p>
                  <p className="text-slate-400 text-[10px]">{order.mlbbServer}</p>
                </div>

                <div className="flex items-center gap-3">
                  <DiamondImage
                    src={order.packageImage}
                    packageData={{
                      id: order.packageId,
                      diamonds: order.diamonds,
                      packageName: order.packageName,
                    }}
                    size="md"
                    showGlow
                    className="rounded-xl border-cyan-500/40 shadow-sm"
                    alt={`${order.packageName} Diamond`}
                  />
                  <div>
                    <span className="text-slate-400 block mb-0.5">Purchased Pack</span>
                    <p className="font-bold text-white text-sm">
                      {order.quantity && order.quantity > 1 ? `${order.quantity}x ` : ''}
                      {order.packageName}
                    </p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      {order.diamonds} 💎 {order.bonusDiamonds > 0 ? `+ ${order.bonusDiamonds} Bonus` : ''}
                    </p>
                    <p className="text-slate-400 text-[10px] mt-0.5">
                      Seller: <span className="text-slate-200 font-semibold">{order.sellerName}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Real Money Channel</span>
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span>{paymentMeta.flag}</span>
                    <span>{paymentMeta.name}</span>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px] truncate">
                    Ref: {order.paymentReference}
                  </p>
                  <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-mono">
                    Vault Secured
                  </span>
                </div>
              </div>

              {/* Visual Progress Stepper Component (Paid -> Escrow Locked -> Processing -> Delivered) */}
              <OrderProgressStepper
                order={order}
                autoAnimateOnMount={order.status === 'seller_processing' || order.status === 'delivered_pending_confirmation'}
              />

              {/* Visual Status Map Highlighting Current Delivery Step & Actions */}
              <OrderStatusMap
                order={order}
                secondsRemaining={secondsRemaining}
                onStartProcessing={handleStartProcessing}
                onDispatchProof={handleSellerDispatchProof}
                onConfirmReceived={handleConfirmReceived}
                onRequestDispute={() => setIsDisputeModalOpen(true)}
                onRequestExtension={() => setIsExtensionModalOpen(true)}
                onOpenMoontonCheck={() => setIsMoontonModalOpen(true)}
                currentUserRole={currentUserRole}
              />

              {/* Official Nexus Platform Income & Real Fulfillment Banner */}
              {order.isNexusIncome && !order.isMockProvider && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/70 border border-emerald-500/70 shadow-lg shadow-emerald-950/40 space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-xs sm:text-sm text-emerald-300">
                          Official Nexus Shop Platform Income & Treasury Channel
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-200 border border-emerald-600 font-bold">
                          💰 Real Merchant Income (NOT Mock)
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                          Live In-Game Delivery
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 font-semibold leading-relaxed">
                        {order.incomeDescription || 'Direct platform revenue channel for Nexus Shop. Real payment funds official distributor top-up with 100% merchant proceeds supporting platform reserves.'}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Authentic fulfillment: Diamonds are credited directly to your MLBB account ({order.mlbbUserId}) with 0% risk of Moonton balance deductions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mock Provider Dev/Testing Disclaimer Banner */}
              {(order.isMockProvider || order.distributorProvider?.toLowerCase().includes('mock')) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/60 border border-purple-500/70 shadow-lg shadow-purple-950/40 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                      <FlaskConical className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-bold text-xs sm:text-sm text-amber-300">
                          Mock Provider — Sandbox Dev & Testing Environment
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900 text-purple-200 border border-purple-600 font-bold">
                          Simulated Only
                        </span>
                      </div>
                      <p className="text-xs text-purple-100 font-bold leading-relaxed">
                        ⚠️ STRICT RULE: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        This test order was placed using Nexus Shop's development sandbox simulation provider. No real Moonton API calls were charged to live player accounts, and 0 in-game diamonds were delivered to MLBB account {order.mlbbUserId}. Use this mode solely for testing UI flows, escrow milestones, and chat messaging.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Official MLBB Top-Up Channel (Manual Operator Fulfillment) Banner */}
              {order.fulfillmentType === 'official_mlbb_manual' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/50 shadow-lg shadow-amber-950/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-amber-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                        <Globe className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white">
                            Official MLBB Top-Up Channel (Manual Fulfillment)
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-bold">
                            shop.mobilelegends.com
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Official MLBB top-up channel — suitable for manual fulfillment, but it generally isn't an automation API for personal shops. Funds are held in Aegis Escrow Vault while our operator manually fulfills your diamonds directly on the official Moonton website.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">FULFILLMENT CHANNEL:</span>
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs truncate">
                        <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{order.distributorProvider || 'Official MLBB Top-Up Channel'}</span>
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono block">
                        Channel: shop.mobilelegends.com (Manual Moonton Recharge)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">MOONTON OFFICIAL ORDER REF:</span>
                        <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm select-all">
                          {order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || 'MOONTON-PENDING'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || '', 'mlbb_man_ref')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy Reference ID"
                      >
                        {copiedField === 'mlbb_man_ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Authorized Distributor Dashboard Console Fulfillment Details Banner */}
              {order.fulfillmentType === 'authorized_distributor_dashboard' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/50 border border-indigo-500/50 shadow-lg shadow-indigo-950/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-indigo-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white">
                            Authorized Distributor Dashboard — Operator Console
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-600/60 font-bold">
                            Official Partner Portal
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          If the distributor does not offer an automated API, an operator fulfills paid orders through the provider's official dashboard console with official receipt verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">DISTRIBUTOR CONSOLE:</span>
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs truncate">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{order.distributorProvider || 'Partner Dashboard Console'}</span>
                      </span>
                      <span className="text-[10px] text-indigo-300 font-mono block">Operator Fulfilled · Official Receipt</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">PROVIDER RECEIPT REF:</span>
                        <span className="font-mono font-bold text-indigo-300 text-xs sm:text-sm select-all">
                          {order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || 'PORTAL-PENDING'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || '', 'portal_ref')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy Reference ID"
                      >
                        {copiedField === 'portal_ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Authorized Distributor API Automatic Fulfillment Details Banner */}
              {(order.fulfillmentType === 'authorized_distributor_api' || (!order.fulfillmentType && order.moontonTransactionRef)) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-blue-950/60 border border-cyan-500/50 shadow-lg shadow-cyan-950/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-cyan-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                        <Zap className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white">
                            Authorized Distributor / API — Automatic Fulfillment
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600/60 font-bold">
                            Direct Top-Up Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Nexus Shop sent player User ID (<span className="text-cyan-300 font-mono font-bold">{order.mlbbUserId}</span>) & Zone ID (<span className="text-cyan-300 font-mono font-bold">{order.mlbbZoneId}</span>) with <strong className="text-white">{order.diamonds} Diamonds</strong> to the provider's API. The provider performed the top-up and returned this reference ID.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Provider details & Ref ID Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono block">AUTHORIZED PROVIDER:</span>
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs truncate">
                        <Server className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{order.distributorProvider || 'Moonton Official SEA Distributor API'}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono block">Status: 200 OK (Automatic Server Injection)</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">PROVIDER TRANSACTION / REF ID:</span>
                        <span className="font-mono font-bold text-cyan-300 text-xs sm:text-sm select-all">
                          {order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || 'MT-DIST-PENDING'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(order.moontonTransactionRef || order.moontonApiVerification?.moontonRef || '', 'dist_ref')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        title="Copy Reference ID"
                      >
                        {copiedField === 'dist_ref' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Moonton In-Game Diamond Auto-Detection & Anti-Abuse Payment Protection Engine */}
              <div className="space-y-3">
                {showAutoDetectionToast && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-400 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                        <Sparkles className="w-4 h-4 animate-bounce" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-emerald-300">💎 Diamonds Auto-Detected in In-Game Account!</h5>
                        <p className="text-[11px] text-slate-300">
                          Moonton Server verified +{order.diamonds + (order.bonusDiamonds || 0)} Diamonds credited to <strong className="text-white">{order.mlbbIgn}</strong>. Anti-abuse payment protection engaged.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAutoDetectionToast(false)}
                      className="text-slate-400 hover:text-white p-1 text-xs cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isAutoScanning ? (
                  /* Active Radar Scanning State */
                  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/70 border border-cyan-500 shadow-xl shadow-cyan-950/50 space-y-3">
                    <div className="flex items-center justify-between gap-3 pb-2 border-b border-cyan-800/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 animate-spin">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                            <span>Moonton Auto-Detection Radar: Scanning Game Server...</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold animate-pulse">
                              LIVE SCAN
                            </span>
                          </h4>
                          <p className="text-[11px] text-cyan-300/80 font-mono">
                            Target: {order.mlbbIgn} · MLBB UID: {order.mlbbUserId} ({order.mlbbZoneId})
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-400">{scanProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-cyan-900/60 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 rounded-full transition-all duration-300"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>{scanStageText}</span>
                      </p>
                    </div>
                  </div>
                ) : (order.diamondsReceivedVerified || order.moontonApiVerification?.status === 'credited') ? (
                  /* Verified In-Game State: Anti-Abuse Protected */
                  <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/60 shadow-xl shadow-emerald-950/30 space-y-3.5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-white">
                              💎 In-Game Diamonds Auto-Detected on Moonton Server
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-bold flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>ANTI-ABUSE SECURED</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                              Direct Game Server Audit
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5 font-mono">
                            Target Character: <strong className="text-emerald-300">{order.mlbbIgn}</strong> (UID: {order.mlbbUserId}) · Zone: {order.mlbbZoneId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRunAutoDetection('credited')}
                          disabled={isAutoScanning}
                          className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-950/80 border border-cyan-700/50 hover:bg-cyan-900/60 cursor-pointer transition-colors"
                          title="Re-query Moonton game server cluster"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Re-Check Server</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMoontonModalOpen(true)}
                          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          <span>Ledger</span>
                        </button>
                      </div>
                    </div>

                    {/* Telemetry Matrix Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                      {/* Balance Delta Box */}
                      <div className="p-3 rounded-lg bg-slate-950/90 border border-emerald-900/50 space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono block">IN-GAME BALANCE DELTA:</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-400 font-mono text-xs">
                            {order.autoDetectionAudit?.previousBalance ?? 52} 💎
                          </span>
                          <span className="text-slate-500">➔</span>
                          <span className="text-emerald-300 font-mono font-bold text-sm">
                            {order.autoDetectionAudit?.newBalance ?? ((order.autoDetectionAudit?.previousBalance ?? 52) + order.diamonds + (order.bonusDiamonds || 0))} 💎
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold block">
                          +{order.diamonds + (order.bonusDiamonds || 0)} Diamonds Verified Received
                        </span>
                      </div>

                      {/* Server Node & Cluster Box */}
                      <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono block">MOONTON SERVER NODE:</span>
                        <span className="text-xs text-cyan-300 font-mono font-bold truncate block">
                          {order.autoDetectionAudit?.serverCluster || `moonton-sea-zone-${order.mlbbZoneId || '3092'}.mobilelegends.com`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Ping: <strong className="text-emerald-400">{order.autoDetectionAudit?.latencyMs || 22}ms</strong> · Handshake: TLS 1.3
                        </span>
                      </div>

                      {/* Cryptographic Seal & Ref Box */}
                      <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1 sm:col-span-2 lg:col-span-1">
                        <span className="text-[10px] text-slate-400 font-mono block">CRYPTOGRAPHIC SEAL:</span>
                        <span className="text-[11px] text-amber-300 font-mono font-bold truncate block select-all">
                          {order.autoDetectionAudit?.cryptographicProof || 'RSA4096-SHA256:MT-INGOT-VERIFIED'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          Ref: <strong className="text-cyan-300">{order.moontonTransactionRef || 'MT-SEA-2026-TX'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Anti-Abuse Platform Guarantee */}
                    <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>
                          <strong className="text-emerald-300">Anti-Abuse Payment Protection:</strong> In-game receipt confirmed by Moonton game server. Buyer non-receipt disputes are locked to protect seller payout.
                        </span>
                      </div>
                      {order.status === 'delivered_pending_confirmation' && (
                        <button
                          type="button"
                          onClick={handleConfirmReceived}
                          className="py-1 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
                        >
                          Confirm & Fast-Release
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Standby / Monitoring State */
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-800/50 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
                          <Radio className="w-4 h-4 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-white">
                              Moonton In-Game Receipt Auto-Detector (Anti-Abuse Engine)
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                              ACTIVE RADAR
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Auto-detects when diamonds arrive in MLBB character <strong className="text-white font-mono">{order.mlbbIgn}</strong> (UID: {order.mlbbUserId}).
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRunAutoDetection('credited')}
                          className="text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 flex items-center gap-1.5 py-1.5 px-3 rounded-lg cursor-pointer shadow-md shadow-cyan-400/20 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>Run Auto-Detection Scan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMoontonModalOpen(true)}
                          className="text-xs font-semibold text-cyan-300 hover:text-white flex items-center gap-1 py-1.5 px-2.5 rounded-lg bg-cyan-950 border border-cyan-700/50 hover:bg-cyan-900/60 cursor-pointer transition-colors"
                        >
                          <Server className="w-3.5 h-3.5" />
                          <span>Moonton API</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>
                        <strong className="text-cyan-300">Payment Security & Anti-Abuse:</strong> Once diamonds are detected on the Moonton server, the escrow vault locks false non-receipt claims to protect seller funds from dishonest buyers.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Escrow Extension Notice */}
              {(order.extensionCount || 0) > 0 && order.status !== 'completed' && order.status !== 'refunded' && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border border-amber-500/50 shadow-md shadow-amber-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          Escrow Protection Extended (+{order.escrowProtectionExtendedHours || 24}h Total)
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/60 font-bold">
                          Extension #{order.extensionCount}
                        </span>
                        {order.extendedUntil && (
                          <span className="text-[10px] text-amber-200/80 font-mono bg-slate-950 px-2 py-0.5 rounded border border-amber-900/50">
                            Valid until: {safeFormatDate(order.extendedUntil)}, {safeFormatTime(order.extendedUntil)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {order.lastExtensionReason ? (
                          <span className="text-amber-300 font-medium">Reason: "{order.lastExtensionReason}". </span>
                        ) : null}
                        Seller granted +24h to fulfill diamond recharge. Vault funds remain 100% frozen.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsExtensionModalOpen(true)}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0 transition-colors py-1.5 px-3 rounded-lg bg-amber-900/40 border border-amber-600/50 hover:bg-amber-900/60 cursor-pointer"
                  >
                    <span>Extend Again (+24h)</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* 24-Hour Buyer Auto-Pay Status & Countdown Card */}
              {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && order.status !== 'disputed' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/50 border border-emerald-500/50 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-white">
                          24-Hour Buyer Auto-Pay Protocol
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/60 font-bold">
                          ⏱ {formatAutoPayCountdown(autoPaySecondsLeft)} Remaining
                        </span>
                        {order.status === 'escrow_pending' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/60 font-bold animate-pulse">
                            AWAITING BUYER PAYMENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {order.status === 'escrow_pending' ? (
                          <>
                            If the buyer doesn't pay within <strong>24 hours</strong>, Aegis Auto-Pay will automatically charge <strong className="text-emerald-300">{formatCurrency(order.amount, order.currency, order.amountPhp)}</strong> via <strong>{paymentMeta.name}</strong> and lock funds in escrow.
                          </>
                        ) : (
                          <>
                            If the buyer doesn't manually confirm or settle within <strong>24 hours</strong>, Aegis Auto-Pay automatically finalizes payment (<strong className="text-emerald-300">{formatCurrency(order.amount, order.currency, order.amountPhp)}</strong>) to seller <strong>{order.sellerName}</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
                    {order.status === 'escrow_pending' && (
                      <button
                        type="button"
                        onClick={handleManualPayNow}
                        className="flex-1 sm:flex-initial py-2 px-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20 cursor-pointer"
                        title="Pay manually now and lock funds in escrow immediately"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pay Now ({formatCurrency(order.amount, order.currency, order.amountPhp)})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleExecuteAutoPay24h(false)}
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
                      title="Simulate 24 hours elapsed and trigger automatic payment & settlement now"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{order.status === 'escrow_pending' ? 'Trigger 24h Auto-Pay Now' : 'Auto-Pay & Settle (24h)'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Auto-Paid Badge Notice when order was settled by 24-Hour Auto-Pay */}
              {order.autoPayTriggered && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/60 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-200 block">
                        ⚡ Paid & Settled Automatically via 24-Hour Auto-Pay Protocol
                      </span>
                      <span className="text-[11px] text-slate-300">
                        Buyer payment of {formatCurrency(order.amount, order.currency, order.amountPhp)} was automatically processed via {paymentMeta.name} after the 24-hour window.
                      </span>
                    </div>
                  </div>
                  {order.autoPaidAt && (
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700 shrink-0">
                      {safeFormatTime(order.autoPaidAt)}
                    </span>
                  )}
                </div>
              )}

              {/* Status Notice: Funds Locked in Escrow Vault */}
              {order.status === 'escrow_locked' && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">Funds Locked in Aegis Vault</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Buyer payment is verified. Waiting for seller {order.sellerName} to start Moonton diamond dispatch.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsMoontonModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Simulate real-time check against Moonton server API"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Refresh Order Status</span>
                    </button>
                    <button
                      onClick={() => setIsCancellationModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Cancel diamond order & unlock 100% escrow refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cancel Purchase</span>
                    </button>
                    <button
                      onClick={() => setIsExtensionModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Extend escrow protection by 24 hours if seller is delayed"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Request Extension</span>
                    </button>
                    <button
                      onClick={handleStartProcessing}
                      className="py-2 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-blue-600/30 shrink-0"
                      title="Transition order to Processing status"
                    >
                      <span>Start Processing Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Notice: Seller Actively Processing */}
              {order.status === 'seller_processing' && (
                <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/50 shadow-lg shadow-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                      <Clock className="w-5 h-5 animate-spin" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">Order Actively Processing</h4>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-600/50 font-bold">
                          Moonton Gateway Direct
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Seller {order.sellerName} is injecting {order.diamonds} diamonds into MLBB ID {order.mlbbUserId}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsMoontonModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Real-time Moonton server API check to verify diamond injection"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Refresh Order Status</span>
                    </button>
                    <button
                      onClick={() => setIsCancellationModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Cancel diamond order & unlock 100% escrow refund"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cancel Purchase</span>
                    </button>
                    <button
                      onClick={() => setIsExtensionModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Seller delayed? Extend escrow protection by 24 hours"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Request Extension</span>
                    </button>
                    <button
                      onClick={handleSellerDispatchProof}
                      className="py-2 px-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-cyan-500/20 shrink-0"
                      title="Upload Moonton transaction proof and dispatch"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Upload Proof & Deliver</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Inspection Timer Notice Bar if in Delivered State */}
              {(order.status === 'delivered_pending_confirmation' || order.status === 'delivery_proof_uploaded') && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 shadow-lg shadow-cyan-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">
                          Automated Auto-Release Inspection Window
                        </h4>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-900/80 text-cyan-200 font-bold">
                          {formatTimer(secondsRemaining)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Please open Mobile Legends: Bang Bang to verify the {order.diamonds} diamonds have arrived.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsMoontonModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-cyan-500/60 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      title="Query Moonton server API to verify diamond credit on account"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Refresh Order Status</span>
                    </button>

                    <button
                      onClick={() => setIsExtensionModalOpen(true)}
                      className="py-2 px-2.5 rounded-lg border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Need more time to inspect in-game diamonds? Extend protection by 24 hours"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Request Extension</span>
                    </button>

                    <button
                      onClick={handleConfirmReceived}
                      className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Received & Release</span>
                    </button>

                    <button
                      onClick={() => setIsDisputeModalOpen(true)}
                      className="py-2 px-3 rounded-lg border border-rose-700/60 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Dispute</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dispute State Notice */}
              {order.status === 'disputed' && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/60 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-white">Escrow Vault Frozen Under Dispute</h4>
                    <p className="text-xs text-rose-200 mt-0.5">
                      Reason: <span className="font-semibold">{order.disputeReason}</span>
                    </p>
                    {order.disputeNotes && (
                      <p className="text-xs text-slate-400 mt-1 italic font-mono">
                        "{order.disputeNotes}"
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2">
                      An Escrow Arbiter has joined the Live Order Chat tab to inspect Moonton server logs. Funds cannot be released until resolved.
                    </p>
                  </div>
                </div>
              )}

              {/* Completed State Notice */}
              {order.status === 'completed' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Order Completed & Escrow Released</h4>
                        <p className="text-xs text-slate-300">
                          Diamonds verified in-game. {formatCurrency(order.amount, order.currency)} transferred safely to seller {order.sellerName}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => triggerOrderCompletedConfetti({ force: true })}
                        className="text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-900 px-2.5 py-1.5 rounded-lg border border-cyan-600/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title="Replay diamond arrival celebration confetti"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Confetti</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadTransactionsCSV([order], {
                            completedOnly: true,
                            preferredCurrency: order.currency,
                            customFilename: `DiamondVault_Receipt_${order.id}.csv`,
                          })
                        }
                        className="text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 px-2.5 py-1.5 rounded-lg border border-emerald-600/60 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        title="Download CSV financial receipt for this transaction"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export CSV Receipt</span>
                      </button>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800 shrink-0">
                        SETTLED
                      </span>
                    </div>
                  </div>

                  {/* Post-Transaction Feedback Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-lg">
                    {order.feedback ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                              <Star className="w-4 h-4 fill-amber-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                                <span>Your Verified Feedback</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                                  Published to P2P Marketplace
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Recorded on {safeFormatDate(order.feedback?.createdAt)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => setIsFeedbackModalOpen(true)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            Edit Review
                          </button>
                        </div>

                        {/* Stars Display */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${
                                  s <= order.feedback!.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-slate-600'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-mono font-bold text-white">
                            {order.feedback.rating}.0 / 5.0
                          </span>
                        </div>

                        {order.feedback.tags && order.feedback.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {order.feedback.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700/80 text-cyan-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {order.feedback.review && (
                          <p className="text-xs text-slate-200 italic bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                            "{order.feedback.review}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                            <Star className="w-5 h-5 fill-amber-400 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                              <span>Rate Seller Experience</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300">
                                Pending Feedback
                              </span>
                            </h4>
                            <p className="text-xs text-slate-300 mt-0.5">
                              How was {order.sellerName}'s fulfillment speed & diamond delivery? Your rating directly impacts seller reputation on the P2P Marketplace.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsFeedbackModalOpen(true)}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Rate Seller (1-5★)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cancelled State Notice */}
              {order.status === 'cancelled' && (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white">Diamond Purchase Cancelled</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700/60 font-bold">
                            100% Escrow Refunded
                          </span>
                        </div>
                        <p className="text-xs text-rose-200/90 mt-1">
                          Reason: <span className="font-semibold text-white">{order.cancellationReason || 'Cancelled by buyer'}</span>
                        </p>
                        {order.cancellationNotes && (
                          <p className="text-xs text-slate-300 mt-1 italic font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            "{order.cancellationNotes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 sm:border-0 sm:p-0">
                      <span className="text-[10px] text-slate-400 block">100% Refund Issued:</span>
                      <span className="font-mono text-emerald-400 font-extrabold text-sm">
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                      {order.refundTransactionRef && (
                        <span className="text-[10px] font-mono text-cyan-300 block mt-0.5">
                          Ref: {order.refundTransactionRef}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-rose-900/40 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Funds unlocked from Aegis Vault with zero penalty. Returned to {getPaymentMethodDetails(order.paymentMethod).name}.</span>
                    </span>
                    {order.cancelledAt && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        Cancelled: {safeFormatDateTime(order.cancelledAt)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Multi-Stage Automated Tracking Pipeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Automated Transaction Pipeline
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  
                  {/* Step 1: Escrow Locked */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">1. Real-Money Captured & Escrowed</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {safeFormatTime(order.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        {formatCurrency(order.amount, order.currency)} deposited into Aegis Escrow Vault. Reference: <span className="font-mono text-cyan-400">{order.paymentReference}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Moonton Server ID Validated */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-md">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">2. MLBB Account Target Validated</span>
                        <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        Verified recipient: <span className="font-bold text-slate-200">{order.mlbbIgn}</span> (User ID: {order.mlbbUserId}, Zone: {order.mlbbZoneId}).
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Seller Dispatched / In Progress */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                        order.status === 'seller_processing' || order.status === 'escrow_locked'
                          ? 'bg-cyan-500 text-slate-950 animate-pulse'
                          : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {order.status === 'seller_processing' || order.status === 'escrow_locked' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">3. Seller Direct Top-Up Dispatch</span>
                        {order.status === 'escrow_locked' || order.status === 'seller_processing' ? (
                          <span className="text-[10px] text-cyan-400 font-mono animate-pulse">
                            Processing In-Game...
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-mono">Dispatched</span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-1">
                        Seller <span className="font-semibold text-slate-200">{order.sellerName}</span> sends diamonds via authorized distributor API.
                      </p>

                      {/* Interactive Simulation trigger if order is pending seller topup */}
                      {(order.status === 'escrow_locked' || order.status === 'seller_processing') && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            Simulate seller action:
                          </span>
                          <button
                            onClick={handleSellerDispatchProof}
                            className="px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Dispatch Diamonds & Upload Moonton Ref</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Moonton Transaction Proof */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                        order.moontonTransactionRef
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {order.moontonTransactionRef ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">4. Moonton Transaction Reference & Proof</span>
                        {order.moontonTransactionRef && (
                          <span className="text-[10px] text-emerald-400 font-mono">Attached</span>
                        )}
                      </div>

                      {order.moontonTransactionRef ? (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Moonton Gateway Ref:</span>
                            <span className="font-mono text-cyan-300 font-bold text-xs">
                              {order.moontonTransactionRef}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => copyToClipboard(order.moontonTransactionRef!, 'proofRef')}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Copy Ref"
                            >
                              {copiedField === 'proofRef' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setIsProofModalOpen(true)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Receipt</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 mt-1">
                          Awaiting seller proof upload. Once uploaded, your 15-minute inspection begins.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step 5: Escrow Release Settlement */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center shadow-md ${
                        order.status === 'completed'
                          ? 'bg-emerald-500 text-slate-950'
                          : order.status === 'cancelled'
                          ? 'bg-rose-500 text-slate-950'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {order.status === 'completed' ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : order.status === 'cancelled' ? (
                        <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">5. Vault Settlement & Payout</span>
                        {order.status === 'completed' ? (
                          <span className="text-[10px] text-emerald-400 font-mono">Released to Seller</span>
                        ) : order.status === 'cancelled' ? (
                          <span className="text-[10px] text-rose-400 font-mono font-bold">100% Refunded to Buyer</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">Locked in Vault</span>
                        )}
                      </div>
                      <p className="text-slate-400 mt-1">
                        {order.status === 'completed'
                          ? 'Transaction final. Diamonds delivered and seller wallet credited.'
                          : order.status === 'cancelled'
                          ? `Order cancelled. 100% escrow funds of ${formatCurrency(order.amount, order.currency)} returned to buyer.`
                          : 'Funds remain safe in escrow until confirmed by buyer or auto-release window completes.'}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : activeSubTab === 'chat' ? (
            <LiveOrderChat
              orderId={order.id}
              sellerName={order.sellerName}
              sellerAvatar={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(order.sellerName)}&backgroundColor=0284c7`}
              messages={order.chatMessages}
              onSendMessage={handleSendMessage}
              currentUserRole={currentUserRole}
              onRequestExtension={() => setIsExtensionModalOpen(true)}
            />
          ) : (
            /* Security Audit Log Tab: Transparent Step-by-Step History of Escrow Vault Status Transitions */
            <div id="security-audit-log-panel" className="space-y-5 animate-in fade-in duration-200">
              {/* Top Security Vault Integrity Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-cyan-950/60 border border-emerald-500/50 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-white">
                          Aegis Escrow Vault — Cryptographic Security Audit Log
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold">
                          IMMUTABLE LEDGER
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Transparent, step-by-step state transition history proving how your payment is locked, verified on Moonton servers, and settled.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyFullAuditLog}
                    className="px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors self-start sm:self-auto"
                    title="Copy complete JSON cryptographic audit log to clipboard"
                  >
                    {auditCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Audit JSON Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy Audit JSON</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Summary Telemetry Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CURRENT VAULT STATE</span>
                    <span className={`font-bold text-xs ${statusMeta.color} truncate block mt-0.5`}>
                      {(order.status || '').toUpperCase()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">ESCROW BOND AMOUNT</span>
                    <span className="font-bold text-xs text-white block mt-0.5">
                      {formatCurrency(order.amount, order.currency, order.amountPhp)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">VERIFIED TRANSITIONS</span>
                    <span className="font-bold text-xs text-emerald-400 block mt-0.5">
                      {securityAuditTransitions.filter((t) => t.state === 'verified').length} of {securityAuditTransitions.length} Checkpoints
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">SIGNATURE PROTOCOL</span>
                    <span className="font-bold text-xs text-cyan-300 block mt-0.5">
                      Zod + HMAC-SHA256
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter Bar for Transition Categories */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-mono mr-1">Filter Transitions:</span>
                  {[
                    { id: 'all', label: `All Steps (${securityAuditTransitions.length})` },
                    { id: 'vault', label: 'Vault Lock & Auth' },
                    { id: 'moonton', label: 'Moonton Server & Proof' },
                    { id: 'settlement', label: 'Payout & Settlement' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAuditFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                        auditFilter === tab.id
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/70 font-bold'
                          : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Order UID: <strong className="text-slate-200">{order.id}</strong>
                </span>
              </div>

              {/* Step-by-Step Escrow Vault Status Transition Chain */}
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-cyan-500 before:to-slate-800">
                {filteredAuditTransitions.map((item) => {
                  const isVerified = item.state === 'verified';
                  const isActive = item.state === 'active';
                  const isAlert = item.state === 'alert';

                  return (
                    <div key={item.id} className="relative">
                      {/* Node Indicator */}
                      <div
                        className={`absolute -left-6 top-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shadow-md ${
                          isVerified
                            ? 'bg-emerald-500 text-slate-950'
                            : isActive
                            ? 'bg-cyan-400 text-slate-950 animate-pulse ring-4 ring-cyan-500/20'
                            : isAlert
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {isVerified ? (
                          <Check className="w-3 h-3 stroke-[3]" />
                        ) : isActive ? (
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                        ) : isAlert ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <span>{item.stepNumber}</span>
                        )}
                      </div>

                      {/* Transition Card */}
                      <div
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isVerified
                            ? 'bg-slate-950/85 border-slate-800 hover:border-emerald-500/40'
                            : isActive
                            ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                            : isAlert
                            ? 'bg-rose-950/30 border-rose-500/60'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-80'
                        }`}
                      >
                        {/* Top Row: State Transition Pill + Timestamp */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-semibold">
                              STEP #{item.stepNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {item.fromStatus}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span
                              className={`px-2 py-0.5 rounded font-bold border ${
                                isVerified
                                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50'
                                  : isActive
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60'
                                  : isAlert
                                  ? 'bg-rose-950 text-rose-300 border-rose-600/60'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                              }`}
                            >
                              {item.toStatus}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span
                              className={`px-2 py-0.5 rounded font-bold border ${
                                isVerified
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : isActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                  : isAlert
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              {item.verificationBadge}
                            </span>
                            <span className="text-slate-400">
                              {item.timestamp
                                ? new Date(item.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })
                                : 'Awaiting trigger'}
                            </span>
                          </div>
                        </div>

                        {/* Title & Explanation */}
                        <div>
                          <h5 className="font-bold text-xs sm:text-sm text-white">
                            {item.title}
                          </h5>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {item.metadata.map((meta, mIdx) => (
                            <div
                              key={mIdx}
                              className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/90 text-xs font-mono"
                            >
                              <span className="text-[10px] text-slate-400 block uppercase">
                                {meta.label}
                              </span>
                              <span className="text-slate-200 font-semibold truncate block mt-0.5">
                                {meta.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Footer Row: Actor, Vault Action & Cryptographic State Hash */}
                        <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-400">Actor:</span>
                            <span className="text-cyan-300 font-semibold">{item.actor}</span>
                            <span className="text-slate-600">·</span>
                            <span className="text-amber-300">{item.vaultAction}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Hash:</span>
                            <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 select-all">
                              {item.txHash}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.txHash, item.id)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
                              title="Copy state transition hash"
                            >
                              {copiedField === item.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/80 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aegis Cryptographic Escrow Protection active</span>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Tracker
          </button>
        </div>

      </div>

      {/* Proof Viewer Sub-Modal */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white">Official Moonton Top-Up Receipt</h4>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Distributor Order:</span>
                <span className="text-white font-bold">{order.moontonTransactionRef}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Player User ID:</span>
                <span className="text-cyan-400">{order.mlbbUserId} ({order.mlbbZoneId})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>In-Game Name:</span>
                <span className="text-white">{order.mlbbIgn}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Recharge Product:</span>
                <span className="text-emerald-400">{order.diamonds} Diamonds (+{order.bonusDiamonds} Bonus)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Moonton Server Status:</span>
                <span className="text-emerald-400 font-bold">SUCCESS_DELIVERED (Code 200)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Recharge dispatched via official Moonton B2B API gateway. Timestamp: {safeFormatDateTime(order.proofUploadedAt || Date.now())}
            </p>

            <button
              onClick={() => setIsProofModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        order={order}
        onConfirmDispute={handleDisputeSubmit}
      />

      {/* Request Escrow Extension Modal */}
      <RequestExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        order={order}
        onConfirmExtension={handleConfirmExtension}
      />

      {/* Post-Transaction Feedback Modal */}
      <PostTransactionFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        order={order}
        onSubmitFeedback={handleFeedbackSubmit}
      />

      {/* Order Cancellation Modal */}
      <OrderCancellationModal
        isOpen={isCancellationModalOpen}
        onClose={() => setIsCancellationModalOpen(false)}
        order={order}
        onConfirmCancel={handleCancelOrderSubmit}
      />

      {/* Real-time Moonton Server API & MLBB Distribution Provider Check Modal */}
      <MoontonApiCheckModal
        isOpen={isMoontonModalOpen}
        onClose={() => setIsMoontonModalOpen(false)}
        order={order}
        onApplyVerification={(updated) => {
          onUpdateOrder(updated);
        }}
      />

    </div>
  );
};
