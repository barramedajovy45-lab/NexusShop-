import React, { useState, useEffect } from 'react';
import { EscrowOrder, MoontonApiVerification } from '../types';
import {
  X,
  RefreshCw,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Lock,
  ExternalLink,
  Gem,
  Award,
  ArrowRight,
  Database,
  Cpu
} from 'lucide-react';

interface MoontonApiCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: EscrowOrder;
  onApplyVerification: (updatedOrder: EscrowOrder) => void;
}

type CheckStep = 'connecting' | 'verifying_account' | 'checking_provider' | 'reading_ledger' | 'completed';

export const MoontonApiCheckModal: React.FC<MoontonApiCheckModalProps> = ({
  isOpen,
  onClose,
  order,
  onApplyVerification,
}) => {
  const [currentStep, setCurrentStep] = useState<CheckStep>('connecting');
  const [progress, setProgress] = useState(15);
  const [pingMs, setPingMs] = useState(24);
  const [simulatedOutcome, setSimulatedOutcome] = useState<'credited' | 'pending'>(
    order.status === 'delivered_pending_confirmation' ||
    order.status === 'completed' ||
    order.status === 'delivery_proof_uploaded' ||
    order.status === 'seller_processing'
      ? 'credited'
      : 'pending'
  );
  const [verificationData, setVerificationData] = useState<MoontonApiVerification | null>(null);

  // Run real-time simulation sequence when opened
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep('connecting');
    setProgress(20);
    setVerificationData(null);
    setPingMs(Math.floor(20 + Math.random() * 15));

    const timer1 = setTimeout(() => {
      setCurrentStep('verifying_account');
      setProgress(45);
    }, 700);

    const timer2 = setTimeout(() => {
      setCurrentStep('checking_provider');
      setProgress(70);
    }, 1400);

    const timer3 = setTimeout(() => {
      setCurrentStep('reading_ledger');
      setProgress(90);
    }, 2100);

    const timer4 = setTimeout(() => {
      setCurrentStep('completed');
      setProgress(100);

      const isCredited = simulatedOutcome === 'credited';
      const isMock = !!order.isMockProvider || !!order.distributorProvider?.toLowerCase().includes('mock');
      const ref = order.moontonTransactionRef || (isMock
        ? `MOCK-SANDBOX-${Math.floor(10000000 + Math.random() * 90000000)}`
        : `MT-SEA-2026-${Math.floor(10000000 + Math.random() * 90000000)}`);
      const prevBal = 52;
      const totalDiamonds = order.diamonds + (order.bonusDiamonds || 0);

      const verification: MoontonApiVerification = {
        verifiedAt: Date.now(),
        status: isCredited ? 'credited' : 'pending_dispatch',
        providerName: isMock
          ? 'Nexus Shop Mock Provider Sandbox (Dev/Testing Only)'
          : 'Official Moonton Authorized Distribution Gateway (SEA Direct)',
        providerLicense: isMock ? 'MOCK-SANDBOX-TEST-LICENSE' : 'MLBB-DIST-AUTH-2026-PH881',
        moontonRef: ref,
        serverCluster: isMock
          ? 'sandbox-dev-mock-node.nexusshop.dev'
          : `moonton-sea-zone-${order.mlbbZoneId}.mobilelegends.com`,
        pingMs: Math.floor(12 + Math.random() * 8),
        diamondsDelivered: isMock ? 0 : (isCredited ? totalDiamonds : 0),
        previousBalance: prevBal,
        newBalance: isMock ? prevBal : (isCredited ? prevBal + totalDiamonds : prevBal),
        authSignature: isMock
          ? `MOCK-SANDBOX-AUTH-SIGNATURE:${Math.random().toString(36).substring(2, 10).toUpperCase()}`
          : `RSA4096-SHA256:${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        deliveryTimestamp: Date.now() - 1000 * 45,
        isMockSimulation: isMock,
        mockProviderNotice: isMock
          ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
          : undefined,
      };

      setVerificationData(verification);
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, simulatedOutcome, order.status, order.moontonTransactionRef, order.diamonds, order.bonusDiamonds, order.mlbbZoneId, order.isMockProvider, order.distributorProvider]);

  if (!isOpen) return null;

  const isMockOrder = !!order.isMockProvider || !!order.distributorProvider?.toLowerCase().includes('mock') || !!verificationData?.isMockSimulation;

  const handleApplyToOrder = () => {
    if (!verificationData) return;

    const totalDiamonds = order.diamonds + (order.bonusDiamonds || 0);
    const isCredited = verificationData.status === 'credited';

    // If verified credited and order is still in processing or locked, advance status to delivered
    const nextStatus =
      isCredited && (order.status === 'seller_processing' || order.status === 'escrow_locked')
        ? 'delivered_pending_confirmation'
        : order.status;

    const updated: EscrowOrder = {
      ...order,
      status: nextStatus,
      isMockProvider: isMockOrder ? true : order.isMockProvider,
      mockProviderDisclaimer: isMockOrder
        ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
        : order.mockProviderDisclaimer,
      moontonTransactionRef: verificationData.moontonRef,
      moontonApiVerification: verificationData,
      chatMessages: [
        ...(Array.isArray(order.chatMessages) ? order.chatMessages : []),
        {
          id: 'msg_moonton_sync_' + Date.now(),
          sender: 'system',
          senderName: isMockOrder ? 'Nexus Mock Sandbox Gateway' : 'Moonton Direct API Gateway',
          text: isMockOrder
            ? `🧪 [MOCK PROVIDER SANDBOX CHECK]: Test check simulated for MLBB ID ${order.mlbbUserId}. ⚠️ STRICT RULE: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered. (+0 Real Diamonds Delivered; ${totalDiamonds} Mock Diamonds Simulated). Reference: ${verificationData.moontonRef}`
            : isCredited
            ? `✅ Moonton Server API Verified: +${totalDiamonds} Diamonds successfully credited to MLBB ID ${order.mlbbUserId} (${order.mlbbIgn}). Authorized by Moonton Distribution Provider (Ref: ${verificationData.moontonRef}). Verification signature: ${verificationData.authSignature.substring(0, 20)}...`
            : `📡 Moonton Server API Query: Account ${order.mlbbIgn} (${order.mlbbUserId}) connected to Server Cluster ${verificationData.serverCluster}. Top-up is pending seller dispatch.`,
          timestamp: Date.now(),
        },
      ],
    };

    onApplyVerification(updated);
    onClose();
  };

  const handleRerunCheck = (outcome: 'credited' | 'pending') => {
    setSimulatedOutcome(outcome);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl shadow-cyan-950/60 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white">Moonton Server API Status Check</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                  <span>Real-Time Ping</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Authorized MLBB Direct B2B Distribution Provider Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authorized Distribution Provider Credentials Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-950 to-blue-950/50 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">Moonton Direct Distribution Partner</span>
                <span className="text-[9px] font-mono bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/60">
                  OFFICIAL TIER-1
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Provider License: <span className="text-cyan-300">MLBB-DIST-AUTH-2026-PH881</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Ping: <strong className="text-emerald-300">{pingMs}ms</strong></span>
            <span className="text-slate-600">|</span>
            <span>Cluster: <strong className="text-slate-200">SEA-04</strong></span>
          </div>
        </div>

        {/* Target Account Mini Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">In-Game Nickname</span>
            <span className="font-bold text-white font-mono truncate block">{order.mlbbIgn}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Player User ID</span>
            <span className="font-mono text-cyan-300 font-bold block">{order.mlbbUserId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Zone / Server</span>
            <span className="font-mono text-slate-200 font-bold block">{order.mlbbZoneId}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Expected Diamonds</span>
            <span className="font-mono text-amber-400 font-bold block">
              {order.diamonds} 💎 {order.bonusDiamonds > 0 ? `+${order.bonusDiamonds}` : ''}
            </span>
          </div>
        </div>

        {/* Live Query Terminal / Pipeline */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Moonton Gateway Handshake & Ledger Audit</span>
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">{progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Real-time Query Steps */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-2">
            {/* Step 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep === 'connecting' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className={currentStep === 'connecting' ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                  1. Connecting to Moonton Game Server Node ({order.mlbbServer || 'SEA'})
                </span>
              </div>
              <span className="text-[10px] text-slate-500">200 OK ({pingMs}ms)</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep === 'verifying_account' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : currentStep === 'connecting' ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className={currentStep === 'verifying_account' ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                  2. Validating Account UID {order.mlbbUserId} (Zone {order.mlbbZoneId})
                </span>
              </div>
              <span className="text-[10px] text-emerald-400">Verified ({order.mlbbIgn})</span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep === 'checking_provider' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : currentStep === 'connecting' || currentStep === 'verifying_account' ? (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className={currentStep === 'checking_provider' ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                  3. Authenticating MLBB Distribution Provider Token
                </span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">AUTH-VALID</span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentStep === 'reading_ledger' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                ) : currentStep === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                )}
                <span className={currentStep === 'reading_ledger' ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                  4. Inspecting Real-Time Diamond Ingestion Ledger
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {currentStep === 'completed' ? 'Synced' : 'Scanning...'}
              </span>
            </div>
          </div>
        </div>

        {/* Verification Result Card */}
        {currentStep === 'completed' && verificationData && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            {isMockOrder || verificationData.isMockSimulation ? (
              <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/70 to-slate-900 border border-purple-500/70 shadow-lg shadow-purple-950/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-amber-300">Mock Provider Sandbox Simulation (Dev/Test Only)</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-200 border border-purple-600/60 font-bold">
                          Sandbox Test
                        </span>
                      </div>
                      <p className="text-xs text-purple-200 font-semibold mt-1 leading-relaxed">
                        ⚠️ STRICT RULE: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Real MLBB Account UID <span className="font-mono text-cyan-300">{order.mlbbUserId}</span>: <strong>0 Real Diamonds credited</strong> (Simulating +{order.diamonds + (order.bonusDiamonds || 0)} test units for system checkout verification).
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 block">Real In-Game Balance:</span>
                    <span className="text-xs text-slate-300 font-bold">
                      {verificationData.previousBalance} 💎 (Unchanged)
                    </span>
                  </div>
                </div>

                {/* Receipt Details Box */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mock Sandbox Token:</span>
                    <span className="font-bold text-purple-300">{verificationData.moontonRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provider Classification:</span>
                    <span className="text-purple-200 font-semibold">{verificationData.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mandatory Rule:</span>
                    <span className="text-amber-300 text-[10px] font-sans font-medium">Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Simulation Seal:</span>
                    <span className="text-slate-400 truncate max-w-[200px]">{verificationData.authSignature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Audit Timestamp:</span>
                    <span className="text-slate-300">{new Date(verificationData.verifiedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/40 flex items-center gap-2 text-[11px] text-purple-200 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Development environment active: Mock simulation passed. Diamonds are NOT delivered to the live MLBB game client.
                  </span>
                </div>
              </div>
            ) : verificationData.status === 'credited' ? (
              <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/50 to-slate-900 border border-emerald-500/50 shadow-lg shadow-emerald-950/40 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-white">Diamonds Verified on Moonton Server</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold">
                          100% Match
                        </span>
                      </div>
                      <p className="text-xs text-emerald-200/90 mt-0.5">
                        +{verificationData.diamondsDelivered} Diamonds successfully injected into{' '}
                        <span className="font-bold font-mono text-white">{order.mlbbIgn}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono shrink-0">
                    <span className="text-[10px] text-slate-400 block">Balance Delta:</span>
                    <span className="text-xs text-emerald-400 font-bold">
                      {verificationData.previousBalance} 💎 → {verificationData.newBalance} 💎
                    </span>
                  </div>
                </div>

                {/* Receipt Details Box */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Moonton Gateway Ref:</span>
                    <span className="font-bold text-cyan-300">{verificationData.moontonRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authorized Provider:</span>
                    <span className="text-slate-200 font-semibold">{verificationData.providerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cryptographic Seal:</span>
                    <span className="text-slate-400 truncate max-w-[200px]">{verificationData.authSignature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Server Audit Timestamp:</span>
                    <span className="text-slate-300">{new Date(verificationData.verifiedAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center gap-2 text-[11px] text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    Moonton Direct API confirms the top-up order has been finalized and processed on game servers.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/40 to-slate-900 border border-blue-500/40 shadow-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Awaiting Seller Dispatch</h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Moonton Server acknowledges player <span className="font-mono text-cyan-300">{order.mlbbIgn}</span> ({order.mlbbUserId}) is valid and reachable. No incoming diamond batch has been posted by the seller yet.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Status:</span>
                    <span className="text-emerald-400 font-bold">READY_FOR_TOPUP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Server Node:</span>
                    <span className="text-slate-300">{verificationData.serverCluster}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Queue Status:</span>
                    <span className="text-amber-400">IDLE_AWAITING_MERCHANT_DISPATCH</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Tip: If seller recently sent the top-up, it typically reflects within 1-3 minutes. You can also re-check with credited status below.
                </p>
              </div>
            )}

            {/* Simulation Controller Buttons (Allows toggling between Credited and Queueing for preview testing) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">Test Other Server Response:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRerunCheck('credited')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    simulatedOutcome === 'credited'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Simulate Credited
                </button>
                <button
                  type="button"
                  onClick={() => handleRerunCheck('pending')}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                    simulatedOutcome === 'pending'
                      ? 'bg-blue-950 text-blue-300 border border-blue-600/60'
                      : 'text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Simulate Pending Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>

          {currentStep === 'completed' && verificationData && (
            <button
              type="button"
              onClick={handleApplyToOrder}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {verificationData.status === 'credited'
                  ? 'Sync Moonton Status & Update Order'
                  : 'Record Server Audit in Live Chat'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
