import React, { useState } from 'react';
import { Currency, EscrowOrder, MoontonApiVerification } from '../types';
import { formatCurrency, getPaymentMethodDetails } from '../utils/formatters';
import {
  Server,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  DollarSign,
  Building2,
  ChevronRight,
  Gem,
  Sparkles,
  ArrowRight,
  UserCheck,
  Cpu,
  Layers,
  FileCheck2,
  Send,
  Globe,
  AlertTriangle,
  FlaskConical
} from 'lucide-react';

export interface DistributorPortalConfig {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  portalUrl: string;
  logoColor: string;
  hasApi: boolean;
  operatorNotes: string;
  wholesaleDiscountPercent: number;
  isMock?: boolean;
  isNexusIncome?: boolean;
  incomeDescription?: string;
}

export const DISTRIBUTOR_PORTALS: DistributorPortalConfig[] = [
  {
    id: 'nexus_direct_income_portal',
    name: 'Nexus Shop Official Treasury Desk (Platform Income)',
    badge: '💎 100% Nexus Shop Revenue',
    tagline: 'Direct official income channel for Nexus Shop. Fulfill real orders directly with 100% platform proceeds.',
    portalUrl: 'https://admin.nexusshop.com/treasury/direct-fulfillment',
    logoColor: 'text-emerald-400 bg-emerald-950 border-emerald-500',
    hasApi: false,
    isMock: false,
    isNexusIncome: true,
    incomeDescription: 'Direct platform revenue channel for Nexus Shop. 100% of order margin funds platform liquidity, operator desks, and buyer protection escrow.',
    operatorNotes: 'OFFICIAL NEXUS PLATFORM INCOME DESK: Real income fulfillment stream (NOT mock). 100% of order value and merchant margin directly funds Nexus Shop platform treasury, liquidity reserves, and buyer protection escrow. Real diamonds delivered via Moonton authorized gateway.',
    wholesaleDiscountPercent: 25,
  },
  {
    id: 'razer_gold_portal',
    name: 'Razer Gold Merchant Portal (Partner Rebate Income)',
    badge: 'Partner Margin Income',
    tagline: 'Authorized Razer Gold distributor console generating direct partner rebate income for Nexus Shop.',
    portalUrl: 'https://gold.razer.com/merchant/console',
    logoColor: 'text-lime-400 bg-lime-950 border-lime-600',
    hasApi: false,
    isMock: false,
    isNexusIncome: true,
    incomeDescription: 'Authorized commercial distributor portal earning wholesale rebate margin directly for Nexus Shop treasury.',
    operatorNotes: 'Authorized commercial distributor portal earning wholesale rebate margin directly for Nexus Shop treasury.',
    wholesaleDiscountPercent: 14,
  },
  {
    id: 'official_mlbb_channel',
    name: 'Official MLBB Top-Up Channel (shop.mobilelegends.com)',
    badge: 'Official Web Shop (Manual Fulfillment)',
    tagline: 'Direct Moonton web channel — suitable for manual fulfillment (no automation API for personal shops)',
    portalUrl: 'https://shop.mobilelegends.com',
    logoColor: 'text-amber-400 bg-amber-950 border-amber-600',
    hasApi: false,
    operatorNotes: 'Official Moonton direct top-up channel (shop.mobilelegends.com). Suitable for manual fulfillment by personal shop operators. Moonton generally does NOT provide an automation API for personal shops, so the operator copies the player User ID & Zone ID, executes top-up on the official site, and logs the Moonton Order ID.',
    wholesaleDiscountPercent: 8,
  },
  {
    id: 'moonton_portal',
    name: 'Moonton Official SEA Partner Portal',
    badge: 'Direct Publisher Portal',
    tagline: 'Official Moonton wholesale recharge console (No public REST API available)',
    portalUrl: 'https://partner.moonton.com/recharge/console',
    logoColor: 'text-cyan-400 bg-cyan-950 border-cyan-700',
    hasApi: false,
    operatorNotes: 'Official Moonton B2B portal. Operators enter MLBB User ID & Zone ID, select diamond SKU, and deduct from wholesale deposit.',
    wholesaleDiscountPercent: 12,
  },
  {
    id: 'codashop_portal',
    name: 'Codashop Enterprise Merchant Center',
    badge: 'Authorized Distributor Console',
    tagline: 'Codashop B2B reseller dashboard for commercial partner fulfillment',
    portalUrl: 'https://enterprise.codapayments.com/merchant/topup',
    logoColor: 'text-amber-400 bg-amber-950 border-amber-700',
    hasApi: false,
    operatorNotes: 'Authorized distributor dashboard. Operator executes direct injection via Codashop merchant credit balance.',
    wholesaleDiscountPercent: 10,
  },
  {
    id: 'smile_portal',
    name: 'Smile.one Licensed Agent Portal',
    badge: 'Licensed Agent Terminal',
    tagline: 'Official global partner portal without public developer API',
    portalUrl: 'https://agent.smile.one/desk/order-fulfillment',
    logoColor: 'text-emerald-400 bg-emerald-950 border-emerald-700',
    hasApi: false,
    operatorNotes: 'Global licensed agent portal. Supports instant player verification and bulk recharge batching.',
    wholesaleDiscountPercent: 11,
  },
  {
    id: 'unipin_portal',
    name: 'UniPin Global Reseller Console',
    badge: 'Authorized Reseller Desk',
    tagline: 'Manual & assisted distributor recharge terminal across SEA',
    portalUrl: 'https://reseller.unipin.com/console/mlbb-direct',
    logoColor: 'text-indigo-400 bg-indigo-950 border-indigo-700',
    hasApi: false,
    operatorNotes: 'Direct reseller interface. Generates official UniPin Moonton transaction tokens.',
    wholesaleDiscountPercent: 9,
  },
  {
    id: 'mock_provider_sandbox',
    name: 'Nexus Shop Mock Provider (Dev & Testing Sandbox)',
    badge: '🧪 Dev/Test Sandbox Only',
    tagline: 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.',
    portalUrl: 'https://sandbox.nexusshop.dev/console/mock-test',
    logoColor: 'text-purple-400 bg-purple-950 border-purple-700',
    hasApi: false,
    isMock: true,
    operatorNotes: 'MOCK PROVIDER NOTICE: Strictly for Nexus Shop development and testing simulation. This mock provider generates simulated transaction IDs for UI and escrow lifecycle tests; it must NEVER be used to claim that real Diamonds were delivered.',
    wholesaleDiscountPercent: 100,
  },
];

interface DistributorDashboardProps {
  orders: EscrowOrder[];
  onUpdateOrders: (orders: EscrowOrder[]) => void;
  currency: Currency;
  onOpenOrderTracker: (order: EscrowOrder) => void;
  onNavigateToStore?: () => void;
}

export const DistributorDashboard: React.FC<DistributorDashboardProps> = ({
  orders,
  onUpdateOrders,
  currency,
  onOpenOrderTracker,
  onNavigateToStore,
}) => {
  // Active Provider Portal
  const [selectedPortalId, setSelectedPortalId] = useState<string>('moonton_portal');
  const activePortal = DISTRIBUTOR_PORTALS.find((p) => p.id === selectedPortalId) || DISTRIBUTOR_PORTALS[0];

  // Operator Profile state
  const [operatorBalanceUsd, setOperatorBalanceUsd] = useState<number>(14850.00);
  const operatorId = 'OP-MOON-409';
  const operatorName = 'Ralph Jaycob Barrameda';
  const licenseRef = 'MOONTON-SEA-DIST-84920';

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'pending' | 'official_manual' | 'all' | 'fulfilled' | 'api'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Copy Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dispatch Terminal State (when operator clicks "Fulfill via Official Dashboard")
  const [dispatchOrder, setDispatchOrder] = useState<EscrowOrder | null>(null);
  const [terminalPortalStep, setTerminalPortalStep] = useState<'input' | 'executing' | 'receipt' | 'complete'>('input');
  const [providerReceiptNo, setProviderReceiptNo] = useState<string>('');
  const [operatorNotesInput, setOperatorNotesInput] = useState<string>('');
  const [simulatedAccountChecked, setSimulatedAccountChecked] = useState<boolean>(true);

  // Open Dispatch Terminal for an order
  const handleOpenDispatchTerminal = (order: EscrowOrder) => {
    setDispatchOrder(order);
    setTerminalPortalStep('input');
    setSimulatedAccountChecked(true);
    const isMock = activePortal.isMock || order.isMockProvider;
    // Generate initial suggested receipt number matching portal
    const prefix = isMock
      ? 'MOCK-SANDBOX'
      : activePortal.id === 'nexus_direct_income_portal'
      ? 'NX-REV'
      : activePortal.id === 'razer_gold_portal'
      ? 'RZ-GOLD'
      : activePortal.id === 'official_mlbb_channel'
      ? 'MT-OFFICIAL'
      : activePortal.id === 'moonton_portal'
      ? 'MT-PORTAL'
      : activePortal.id === 'codashop_portal'
      ? 'CD-MERCHANT'
      : 'SM-AGENT';
    const rand = Math.floor(100000 + Math.random() * 900000);
    setProviderReceiptNo(`${prefix}-${order.mlbbUserId}-${rand}`);
    setOperatorNotesInput(
      isMock
        ? `[MOCK SANDBOX TEST]: Simulated fulfillment test via ${activePortal.name} for testing purposes. Note: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.`
        : activePortal.id === 'nexus_direct_income_portal'
        ? `Direct wholesale recharge fulfilled via Nexus Shop Treasury Desk by Operator ${operatorName}. 100% platform proceeds secured. Official Moonton receipt attached.`
        : activePortal.id === 'official_mlbb_channel'
        ? `Recharged directly on Moonton official website (shop.mobilelegends.com) by Shop Operator ${operatorName}. Official receipt attached.`
        : `Top-up successfully fulfilled through ${activePortal.name} by Operator ${operatorName}. Official reference attached.`
    );
  };

  // Execute Simulated Recharge in Provider Portal
  const handleExecutePortalRecharge = () => {
    setTerminalPortalStep('executing');
    setTimeout(() => {
      setTerminalPortalStep('receipt');
    }, 1400);
  };

  // Confirm Fulfillment & Update Order in Nexus Shop
  const handleConfirmFulfillment = () => {
    if (!dispatchOrder) return;

    const isMock = activePortal.isMock || dispatchOrder.isMockProvider;
    const receipt = providerReceiptNo.trim() || `${isMock ? 'MOCK-SANDBOX' : 'PORTAL-REF'}-${Date.now()}`;
    const costUsd = isMock ? 0 : Number((dispatchOrder.amount * 0.88).toFixed(2));
    const isOfficialChannel = activePortal.id === 'official_mlbb_channel' || dispatchOrder.fulfillmentType === 'official_mlbb_manual';

    const isIncome = activePortal.isNexusIncome || dispatchOrder.isNexusIncome;

    const verification: MoontonApiVerification = {
      verifiedAt: Date.now(),
      status: 'credited',
      providerName: isMock
        ? `${activePortal.name} (Dev Sandbox)`
        : isIncome
        ? 'Nexus Shop Official Treasury Desk (Platform Income Channel)'
        : isOfficialChannel
        ? 'Official MLBB Top-Up Channel (shop.mobilelegends.com)'
        : `${activePortal.name} (Official Dashboard)`,
      providerLicense: isMock
        ? 'MOCK-SANDBOX-TEST-LICENSE'
        : isIncome
        ? 'NEXUS-REVENUE-AUTH-88219'
        : isOfficialChannel
        ? 'MOONTON-DIRECT-RECHARGE-WEB'
        : licenseRef,
      moontonRef: receipt,
      serverCluster: dispatchOrder.mlbbServer || 'SEA-PH-01',
      pingMs: 14,
      diamondsDelivered: dispatchOrder.diamonds + dispatchOrder.bonusDiamonds,
      authSignature: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      deliveryTimestamp: Date.now(),
      isMockSimulation: isMock,
      mockProviderNotice: isMock
        ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
        : undefined,
    };

    const newSystemMsg = {
      id: 'msg_dist_done_' + Date.now(),
      sender: 'system' as const,
      senderName: isIncome ? 'Nexus Shop Treasury Bot' : 'Nexus Shop Escrow Bot',
      text: isMock
        ? `🧪 [SANDBOX SIMULATION COMPLETED]: Fulfillment test completed via Mock Provider. ⚠️ STRICT RULE: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered. Mock Reference: ${receipt}.`
        : isIncome
        ? `💎 [OFFICIAL NEXUS PLATFORM INCOME FULFILLED]: Order fulfilled directly via Nexus Shop Treasury Desk! 100% merchant proceeds fund platform liquidity. Diamonds credited to player MLBB account. Official Reference: ${receipt}. 15-minute escrow inspection countdown active.`
        : isOfficialChannel
        ? `Order fulfilled via Official MLBB Top-Up Channel (shop.mobilelegends.com)! Diamonds credited to player MLBB account. Official Moonton Order ID: ${receipt}. 15-minute escrow inspection countdown has started.`
        : `Order fulfilled via ${activePortal.name}! Diamonds credited to player MLBB account. Official Provider Receipt: ${receipt}. 15-minute escrow inspection countdown has started.`,
      timestamp: Date.now(),
    };

    const newOperatorMsg = {
      id: 'msg_op_' + Date.now(),
      sender: 'seller' as const,
      senderName: isMock
        ? 'Mock Sandbox Operator Desk'
        : isIncome
        ? 'Nexus Shop Treasury Operator'
        : isOfficialChannel
        ? 'Shop Fulfillment Operator'
        : `${operatorName} (Distributor Lead)`,
      text: operatorNotesInput || (isMock
        ? `🧪 [MOCK SIMULATION]: Operator tested simulated fulfillment on Mock Sandbox Provider (${activePortal.name}). Reference #${receipt}. Notice: Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.`
        : isIncome
        ? `Official Nexus platform top-up completed. Bonded reserves dispatched. Reference #${receipt}. Thank you for supporting Nexus Shop!`
        : `Top-up completed through ${activePortal.name}. Receipt #${receipt}. Please open MLBB to check your diamond balance!`),
      timestamp: Date.now() + 100,
      isProof: true,
    };

    const updatedOrder: EscrowOrder = {
      ...dispatchOrder,
      status: 'delivered_pending_confirmation',
      fulfillmentType: isMock ? 'authorized_distributor_dashboard' : isOfficialChannel ? 'official_mlbb_manual' : 'authorized_distributor_dashboard',
      distributorProvider: activePortal.name,
      distributorMode: isMock ? 'official_dashboard' : isOfficialChannel ? 'official_channel_manual' : 'official_dashboard',
      isMockProvider: isMock,
      mockProviderDisclaimer: isMock
        ? 'Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.'
        : undefined,
      isNexusIncome: isIncome,
      incomeDescription: activePortal.incomeDescription || dispatchOrder.incomeDescription,
      moontonTransactionRef: receipt,
      proofUploadedAt: Date.now(),
      autoReleaseMinutesRemaining: 15,
      distributorPortalDetails: {
        portalName: activePortal.name,
        portalUrl: activePortal.portalUrl,
        operatorId: operatorId,
        operatorName: operatorName,
        receiptNo: receipt,
        fulfilledAt: Date.now(),
        wholesaleCostUsd: costUsd,
        notes: operatorNotesInput,
      },
      moontonApiVerification: verification,
      chatMessages: [
        ...(Array.isArray(dispatchOrder.chatMessages) ? dispatchOrder.chatMessages : []),
        newSystemMsg,
        newOperatorMsg,
      ],
    };

    const updatedOrders = orders.map((o) => (o.id === dispatchOrder.id ? updatedOrder : o));
    onUpdateOrders(updatedOrders);

    // Deduct wholesale credit
    setOperatorBalanceUsd((prev) => Math.max(0, prev - costUsd));

    setTerminalPortalStep('complete');
    setTimeout(() => {
      setDispatchOrder(null);
    }, 1200);
  };

  // Operator Action: Inject a Simulated Paid Order for Testing
  const handleCreateTestPaidOrder = () => {
    const randomUser = '8' + Math.floor(1000000 + Math.random() * 9000000);
    const randomZone = String(Math.floor(2000 + Math.random() * 8000));
    const randomOrderId = 'ORD-' + Math.floor(20000 + Math.random() * 80000);
    const isOfficialChannel = activePortal.id === 'official_mlbb_channel';

    const newTestOrder: EscrowOrder = {
      id: randomOrderId,
      buyerId: 'buyer_sample_' + Date.now(),
      buyerName: 'Gusion_Pro_SEA',
      buyerEmail: 'gusion.player@nexusmail.io',
      sellerId: isOfficialChannel ? 'official_mlbb_operator' : 'distributor_dashboard_' + activePortal.id,
      sellerName: isOfficialChannel ? 'Official MLBB Top-Up Channel (Manual Operator)' : `${activePortal.name} (Operator Desk)`,
      sellerAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      sellerRating: 5.0,
      packageId: 'pkg_706',
      packageName: '706 Diamonds (+71 Bonus)',
      diamonds: 706,
      bonusDiamonds: 71,
      mlbbUserId: randomUser,
      mlbbZoneId: randomZone,
      mlbbIgn: '꧁༺GUSIØN_K1NG༻꧂',
      mlbbServer: 'Philippines (PH-SEA)',
      currency: currency,
      amount: 11.20,
      escrowFee: 0,
      paymentMethod: 'gcash',
      paymentReference: 'GC-PAY-' + Math.floor(100000000 + Math.random() * 900000000),
      status: 'escrow_locked',
      autoReleaseMinutesRemaining: 15,
      createdAt: Date.now(),
      escrowLockedAt: Date.now(),
      fulfillmentType: isOfficialChannel ? 'official_mlbb_manual' : 'authorized_distributor_dashboard',
      distributorProvider: activePortal.name,
      distributorMode: isOfficialChannel ? 'official_channel_manual' : 'official_dashboard',
      isMockProvider: activePortal.isMock || false,
      isNexusIncome: activePortal.isNexusIncome || false,
      incomeDescription: activePortal.incomeDescription,
      chatMessages: [
        {
          id: 'msg_init_' + Date.now(),
          sender: 'system',
          senderName: 'Nexus Shop Escrow Bot',
          text: isOfficialChannel
            ? `Payment verified and secured in Aegis Escrow Vault! Official MLBB top-up channel is suitable for manual fulfillment, but Moonton generally does not offer an automation API for personal shops. Order queued for operator manual recharge on shop.mobilelegends.com.`
            : `Payment verified and secured in Aegis Escrow Vault! Provider ${activePortal.name} does not provide a public REST API. Order queued for Authorized Operator Dashboard fulfillment.`,
          timestamp: Date.now(),
        },
      ],
    };

    onUpdateOrders([newTestOrder, ...orders]);
  };

  // Filter orders
  const pendingOrders = orders.filter(
    (o) =>
      (o.fulfillmentType === 'official_mlbb_manual' ||
        o.fulfillmentType === 'authorized_distributor_dashboard' ||
        o.fulfillmentType === 'authorized_distributor_api' ||
        !o.fulfillmentType) &&
      (o.status === 'escrow_locked' || o.status === 'seller_processing' || o.status === 'escrow_pending')
  );

  const officialManualOrders = orders.filter((o) => o.fulfillmentType === 'official_mlbb_manual');

  const fulfilledPortalOrders = orders.filter(
    (o) =>
      (o.fulfillmentType === 'official_mlbb_manual' || o.fulfillmentType === 'authorized_distributor_dashboard') &&
      (o.status === 'delivered_pending_confirmation' || o.status === 'completed')
  );

  const apiOrders = orders.filter((o) => o.fulfillmentType === 'authorized_distributor_api');

  const filteredOrders = orders.filter((o) => {
    // Tab filter
    if (activeTab === 'pending') {
      const isPending = o.status === 'escrow_locked' || o.status === 'seller_processing' || o.status === 'escrow_pending';
      if (!isPending) return false;
    } else if (activeTab === 'official_manual') {
      if (o.fulfillmentType !== 'official_mlbb_manual') return false;
    } else if (activeTab === 'fulfilled') {
      if (o.fulfillmentType !== 'authorized_distributor_dashboard' && o.fulfillmentType !== 'official_mlbb_manual') return false;
      if (o.status !== 'delivered_pending_confirmation' && o.status !== 'completed') return false;
    } else if (activeTab === 'api') {
      if (o.fulfillmentType !== 'authorized_distributor_api') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.mlbbUserId?.includes(q) ||
        o.mlbbZoneId?.includes(q) ||
        o.mlbbIgn?.toLowerCase().includes(q) ||
        o.buyerName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <section className="py-8 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 p-5 rounded-2xl border border-cyan-800/50 shadow-xl shadow-cyan-950/20">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/60 font-bold flex items-center gap-1">
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>AUTHORIZED DISTRIBUTOR CONSOLE</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Moonton Whitelist #84920</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Authorized Distributor Dashboard</span>
            <span className="text-xs font-mono font-normal text-slate-400 hidden sm:inline">
              · Official Portal Operator Terminal
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            If the distributor partner doesn't give a direct public REST API, certified operators fulfill paid escrow orders directly through the provider's official dashboard console with 100% Moonton server verification.
          </p>
        </div>

        {/* Operator Badge & Wholesale Balance */}
        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap sm:flex-nowrap">
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-0.5 min-w-[170px]">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>OPERATOR:</span>
              <span className="text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="font-bold text-white truncate">{operatorName}</div>
            <div className="text-[10px] font-mono text-cyan-400">{operatorId} · SEA Lead</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-800/60 text-xs space-y-0.5 min-w-[170px]">
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>WHOLESALE BALANCE:</span>
              <Gem className="w-3 h-3 text-cyan-400" />
            </div>
            <div className="font-mono font-bold text-base text-cyan-300">
              {formatCurrency(operatorBalanceUsd, currency)}
            </div>
            <div className="text-[10px] text-slate-400">Prepaid Wholesale Quota</div>
          </div>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Pending Operator Dispatch</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">
            {pendingOrders.length}
          </div>
          <p className="text-[10px] text-slate-400">Paid & locked in Escrow Vault</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Fulfilled via Dashboard</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">
            {fulfilledPortalOrders.length}
          </div>
          <p className="text-[10px] text-slate-400">Official receipt attached</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Average Dispatch SLA</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono">
            1m 42s
          </div>
          <p className="text-[10px] text-slate-400">Dashboard manual execution</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Moonton Gateway Ping</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono flex items-center gap-1.5">
            <span>14ms</span>
            <span className="text-[10px] font-mono text-emerald-400 font-normal">Optimal</span>
          </div>
          <p className="text-[10px] text-slate-400">Direct server cluster injection</p>
        </div>
      </div>

      {/* Official MLBB Top-Up Channel Context Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/40 border border-amber-500/50 shadow-lg shadow-amber-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
            <Globe className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base text-white">
                Official MLBB Top-Up Channel — Manual Operator Workflow
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-bold">
                Direct Moonton Portal
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              <strong>Official MLBB top-up channel — suitable for manual fulfillment, but it generally isn't an automation API for my own shop.</strong> Since Moonton does not supply a personal shop automation API, our operator uses this dashboard to copy player coordinates with 1 click, manually recharge on <span className="text-amber-300 font-mono font-semibold">shop.mobilelegends.com</span>, and attach the official Moonton Order ID to unlock escrow.
            </p>
          </div>
        </div>

        <a
          href="https://shop.mobilelegends.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 shrink-0 transition-all cursor-pointer whitespace-nowrap"
        >
          <Globe className="w-4 h-4 text-slate-950" />
          <span>Open shop.mobilelegends.com</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Provider Portal Selector Ribbon (Switch official portals) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Selected Provider Official Dashboard Console:
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Mode: <strong className="text-amber-300">Operator Dashboard Console (No Public API)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {DISTRIBUTOR_PORTALS.map((portal) => (
            <button
              key={portal.id}
              type="button"
              onClick={() => setSelectedPortalId(portal.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                selectedPortalId === portal.id
                  ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold truncate max-w-[140px]">
                  {portal.badge}
                </span>
                {selectedPortalId === portal.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                )}
              </div>
              <div className="font-bold text-xs text-white truncate">{portal.name}</div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {portal.tagline}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-amber-400">Portal Mode</span>
                <span className="text-cyan-400">-{portal.wholesaleDiscountPercent}% Wholesale</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Bar: Tabs & Search & Test Injector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-950 text-amber-300 border border-amber-600/70 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Dashboard Dispatch</span>
            {pendingOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] font-mono">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('official_manual')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'official_manual'
                ? 'bg-amber-950 text-amber-300 border border-amber-600/70 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Official MLBB Manual ({officialManualOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/70'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Orders ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fulfilled')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'fulfilled'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/70'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fulfilled via Dashboard ({fulfilledPortalOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'api'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/70'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Automated API ({apiOrders.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search User ID, Zone, IGN..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          <button
            type="button"
            onClick={handleCreateTestPaidOrder}
            title="Inject a sample paid order waiting for distributor operator fulfillment"
            className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-600/60 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">+ Sim Paid Order</span>
            <span className="sm:hidden">+ Order</span>
          </button>
        </div>
      </div>

      {/* Orders List Queue */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
          <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-base font-bold text-white">No Orders in this Queue</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'All paid escrow orders have been fulfilled! Click "+ Sim Paid Order" above to create an incoming test order to practice the provider dashboard workflow.'
              : 'No orders matched your active filter or search query.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCreateTestPaidOrder}
              className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
            >
              + Create Sample Paid Order
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isWaiting = order.status === 'escrow_locked' || order.status === 'seller_processing' || order.status === 'escrow_pending';
            const isDashboardFulfill = order.fulfillmentType === 'authorized_distributor_dashboard';
            const isApiFulfill = order.fulfillmentType === 'authorized_distributor_api';

            return (
              <div
                key={order.id}
                className={`p-4 rounded-xl border transition-all ${
                  isWaiting
                    ? 'bg-slate-950/90 border-amber-600/50 shadow-md shadow-amber-950/20'
                    : 'bg-slate-900/50 border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Target MLBB Credentials & Package */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-300">
                        {order.id}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      {isWaiting ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/60 font-bold flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Awaiting Provider Dashboard Top-Up</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/60 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{order.status === 'completed' ? 'Completed & Released' : 'Dispatched / In Inspection'}</span>
                        </span>
                      )}

                      {order.fulfillmentType === 'official_mlbb_manual' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-amber-400" />
                          <span>Official MLBB Top-Up Channel (Manual)</span>
                        </span>
                      )}

                      {isDashboardFulfill && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                          Official Dashboard Fulfillment
                        </span>
                      )}
                      {isApiFulfill && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                          Automated API Gateway
                        </span>
                      )}
                    </div>

                    {/* MLBB Player Target Card with 1-Click Clipboard Actions */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">Player:</span>
                        <strong className="text-white font-mono">{order.mlbbIgn || 'MLBB Player'}</strong>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {order.mlbbUserId} ({order.mlbbZoneId})
                        </span>

                        {/* Copy Full Credentials */}
                        <button
                          type="button"
                          onClick={() => handleCopy(`${order.mlbbUserId} (${order.mlbbZoneId})`, `all_${order.id}`)}
                          title="Copy User ID & Zone ID to Clipboard"
                          aria-label="Copy User ID and Zone ID"
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        >
                          {copiedId === `all_${order.id}` ? (
                            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-slate-400">User ID:</span>
                        <span className="text-slate-200">{order.mlbbUserId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.mlbbUserId, `user_${order.id}`)}
                          title="Copy User ID"
                          className="hover:text-cyan-300 text-slate-400"
                        >
                          {copiedId === `user_${order.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-slate-400">Zone:</span>
                        <span className="text-slate-200">{order.mlbbZoneId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.mlbbZoneId, `zone_${order.id}`)}
                          title="Copy Zone ID"
                          className="hover:text-cyan-300 text-slate-400"
                        >
                          {copiedId === `zone_${order.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Order Diamond & Payment Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="font-semibold text-white">
                        {order.packageName} · <strong className="text-cyan-300 font-mono">{order.diamonds} 💎</strong>
                        {order.bonusDiamonds > 0 && ` (+${order.bonusDiamonds} Bonus)`}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        Paid: <strong className="text-emerald-400 font-mono">{formatCurrency(order.amount, currency)}</strong> via {order.paymentMethod.toUpperCase()}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Buyer: {order.buyerName}
                      </span>
                    </div>

                    {/* Receipt if already fulfilled */}
                    {order.moontonTransactionRef && (
                      <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pt-1">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Official Receipt: <strong className="text-white select-all">{order.moontonTransactionRef}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.moontonTransactionRef || '', `ref_${order.id}`)}
                          className="hover:text-cyan-300 text-slate-400 ml-1"
                        >
                          {copiedId === `ref_${order.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0">
                    {isWaiting ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDispatchTerminal(order)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Building2 className="w-4 h-4 text-slate-950" />
                        <span>Fulfill via Provider Dashboard</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenOrderTracker(order)}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Inspect Receipt</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenOrderTracker(order)}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
                    >
                      <span>Order Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Official Provider Dashboard Dispatch Terminal Modal */}
      {dispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-600/70 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Terminal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>{activePortal.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                      Official Console
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Order: {dispatchOrder.id} · Operator Fulfillment Terminal
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Terminal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Step 1: Target Player Credentials to Copy into Official Portal */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Player Coordinates (To paste in Provider Portal):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${dispatchOrder.mlbbUserId} (${dispatchOrder.mlbbZoneId})`, 'term_all')}
                    className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
                  >
                    {copiedId === 'term_all' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">User ID:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-white">
                      <span>{dispatchOrder.mlbbUserId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dispatchOrder.mlbbUserId, 'term_user')}
                        className="text-slate-400 hover:text-cyan-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Zone ID:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-white">
                      <span>{dispatchOrder.mlbbZoneId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(dispatchOrder.mlbbZoneId, 'term_zone')}
                        className="text-slate-400 hover:text-cyan-300"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Player IGN:</span>
                    <span className="font-bold text-white truncate block">{dispatchOrder.mlbbIgn}</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Diamond Pack:</span>
                    <span className="font-bold text-cyan-300 font-mono">{dispatchOrder.diamonds} 💎</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Simulated Provider Merchant Portal Interface */}
              <div className="p-4 rounded-xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>{activePortal.name} — Merchant Console</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Wholesale Balance: {formatCurrency(operatorBalanceUsd, currency)}
                  </span>
                </div>

                {/* Official MLBB Channel Operator Note */}
                {(activePortal.id === 'official_mlbb_channel' || dispatchOrder.fulfillmentType === 'official_mlbb_manual') && (
                  <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>Official MLBB Top-Up Channel (shop.mobilelegends.com)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Official MLBB top-up channel — suitable for manual fulfillment, but it generally isn't an automation API for personal shops. Open Moonton's website, input player User ID (<span className="text-amber-300 font-mono font-bold">{dispatchOrder.mlbbUserId}</span>) and Zone ID (<span className="text-amber-300 font-mono font-bold">{dispatchOrder.mlbbZoneId}</span>), choose the <strong className="text-white">{dispatchOrder.diamonds} Diamonds</strong> package, complete the recharge, and paste the official Moonton reference below.
                    </p>
                    <a
                      href="https://shop.mobilelegends.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline pt-0.5 cursor-pointer"
                    >
                      <span>Open shop.mobilelegends.com in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Official Nexus Platform Income Operator Note */}
                {(activePortal.isNexusIncome || dispatchOrder.isNexusIncome) && !(activePortal.isMock || dispatchOrder.isMockProvider) && (
                  <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/70 space-y-1.5 text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>Official Nexus Shop Treasury Revenue Desk (Real Income — NOT Mock)</span>
                    </div>
                    <p className="text-[11px] text-emerald-100 leading-relaxed font-semibold">
                      This order is routed through an authentic, revenue-generating fulfillment channel. 100% of order value and merchant margin flows directly to the Nexus platform treasury.
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Real diamonds are credited to player account with authentic publisher verification and zero ban risk.
                    </p>
                  </div>
                )}

                {/* Mock Provider Sandbox Operator Note */}
                {(activePortal.isMock || dispatchOrder.isMockProvider) && (
                  <div className="p-3 rounded-lg bg-purple-950/60 border border-purple-500/80 space-y-1.5 text-xs animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-purple-400" />
                      <span>Mock Provider Sandbox Terminal (Dev & Testing Only)</span>
                    </div>
                    <p className="text-[11px] text-purple-200 leading-relaxed font-semibold">
                      Mock provider — only for Nexus Shop development/testing; it must never be used to claim that real Diamonds were delivered.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Receipt numbers generated here are simulated sandbox tokens (<span className="font-mono text-cyan-300">MOCK-SANDBOX-*</span>). Use this mode solely for testing UI state transitions and escrow releases.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Provider Merchant Account User ID:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={dispatchOrder.mlbbUserId}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Zone ID:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={dispatchOrder.mlbbZoneId}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-white text-xs"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">VERIFIED MLBB RECIPIENT:</span>
                    <span className="font-bold text-white font-mono">{dispatchOrder.mlbbIgn}</span>
                    <span className="text-slate-500 ml-2">({dispatchOrder.mlbbServer})</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700">
                    SERVER 200 OK
                  </span>
                </div>

                {/* Portal Execution Action */}
                {terminalPortalStep === 'input' && (
                  <button
                    type="button"
                    onClick={handleExecutePortalRecharge}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Execute Top-Up in Provider Official Portal</span>
                  </button>
                )}

                {terminalPortalStep === 'executing' && (
                  <div className="py-3 text-center space-y-1.5">
                    <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
                    <p className="text-xs text-cyan-300 font-mono">
                      Executing top-up inside {activePortal.name} merchant gateway...
                    </p>
                  </div>
                )}

                {(terminalPortalStep === 'receipt' || terminalPortalStep === 'complete') && (
                  <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-600/60 text-emerald-300 space-y-1 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Provider Portal Executed Successfully!</span>
                    </div>
                    <p className="text-[11px] text-emerald-200/90 font-mono">
                      Diamonds injected to {dispatchOrder.mlbbIgn}. Provider returned Official Reference: <strong>{providerReceiptNo}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3: Provider Reference & Operator Confirmation */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Official Provider Transaction / Receipt Ref ID:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={providerReceiptNo}
                      onChange={(e) => setProviderReceiptNo(e.target.value)}
                      placeholder="e.g. MT-PORTAL-84729103-991823"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(providerReceiptNo, 'term_rec')}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                    >
                      {copiedId === 'term_rec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This official reference is stored in the escrow ledger and given to the buyer for Moonton verification.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Operator Dispatch Note to Buyer:
                  </label>
                  <textarea
                    rows={2}
                    value={operatorNotesInput}
                    onChange={(e) => setOperatorNotesInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

            </div>

            {/* Terminal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmFulfillment}
                disabled={terminalPortalStep === 'executing'}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Confirm Fulfillment & Start Inspection (15m)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Informational Guidance: How Authorized Distributor Dashboards Work */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-white text-xs">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>About Authorized Distributor Dashboards (Non-API Providers)</span>
        </div>
        <p className="leading-relaxed">
          While automated API gateways process orders machine-to-machine, many regional distribution partners (such as direct Moonton partner portals, specialized merchant kiosks, and reseller desks) operate through an official web dashboard console. In this mode, Nexus Shop safely locks buyer payment in the Aegis Escrow Vault, presents the player credentials to an authorized operator, and verifies the resulting official provider receipt upon manual console execution. Both pathways guarantee 0% MLBB account ban risk and full escrow refund protection.
        </p>
      </div>
    </section>
  );
};
