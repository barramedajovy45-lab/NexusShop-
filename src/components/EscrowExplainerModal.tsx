import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Clock,
  Scale,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  HelpCircle,
  Search,
  Sparkles,
  ShieldAlert,
  CreditCard,
  RefreshCw,
  Check,
  Info
} from 'lucide-react';

interface EscrowExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOrder: () => void;
}

export interface EscrowFAQItem {
  id: string;
  category: 'vault' | 'release' | 'disputes' | 'security' | 'cancellation';
  categoryLabel: string;
  question: string;
  shortSummary: string;
  answer: string[];
  keyPoints: string[];
  proTip?: string;
  tags: string[];
}

const ESCROW_FAQS: EscrowFAQItem[] = [
  {
    id: 'vault-protection',
    category: 'vault',
    categoryLabel: 'Vault Security',
    question: 'How does the Aegis Escrow Vault hold and protect my payment?',
    shortSummary: 'Funds stay locked in an impartial programmatic vault until diamonds land in your MLBB account.',
    answer: [
      'When you place an order on Nexus Shop, your real-money deposit (GCash, Maya, Bank Transfer, Card, or Crypto) is immediately sealed inside the Aegis Escrow Vault.',
      'The diamond seller cannot withdraw, transfer, or claim these funds upfront. The payment is held neutrally by the smart escrow engine and is only unlocked when you confirm receipt or after the 15-minute verification window concludes with verified Moonton API logs.',
      'This completely eliminates traditional peer-to-peer scams where buyers send payment first and sellers disappear.'
    ],
    keyPoints: [
      '100% Fund Isolation: Seller never receives payment before fulfillment is confirmed',
      'Neutral Programmatic Vault: Funds cannot be prematurely claimed by either party',
      'Backed by Guarantee Fund: Insured up to $50,000 against seller delinquency'
    ],
    proTip: 'You can track the live escrow vault locking status in real-time from your Order Tracker.',
    tags: ['vault', 'escrow', 'protection', 'hold', 'payment', 'safety', 'seller']
  },
  {
    id: 'release-conditions',
    category: 'release',
    categoryLabel: 'Release & Payout',
    question: 'When exactly is the seller paid for my diamond order?',
    shortSummary: 'Payment releases only after you click "Confirm Received" or when the 15-minute inspection window ends.',
    answer: [
      'There are two conditions that trigger fund release from escrow to the seller:',
      '1. Manual Confirmation: You open Mobile Legends, check that your diamond counter increased, and click "Confirm Received" in your Order Tracker. Payout is released to the seller within seconds.',
      '2. Automatic Inspection Settlement: Once the seller attaches verified Moonton distributor transaction proof, a 15-minute countdown begins. If no dispute is raised before the timer hits 00:00, the system automatically finalizes the order.',
      'If you notice any delay or issue before the timer expires, clicking "Dispute" or "Extend Protection" halts this countdown instantly.'
    ],
    keyPoints: [
      'Instant release as soon as you confirm delivery in-game',
      '15-minute dedicated buyer inspection window to verify diamonds',
      'Timer freezes immediately if a dispute or extension is requested'
    ],
    proTip: 'Always launch Mobile Legends and check your diamond balance before clicking "Confirm Received".',
    tags: ['release', 'payout', 'timer', 'confirm', 'inspection', 'countdown']
  },
  {
    id: 'unfulfilled-or-missing',
    category: 'disputes',
    categoryLabel: 'Disputes & Refunds',
    question: 'What happens if a seller sends fewer diamonds or fails to deliver?',
    shortSummary: 'Click "Raise Dispute" to freeze escrow funds; our arbiters audit server logs and issue a 100% refund.',
    answer: [
      'If your diamonds do not arrive within the seller countdown SLA, or if you received fewer diamonds than purchased, click "Raise Dispute" immediately.',
      'Raising a dispute freezes the escrow vault indefinitely, blocking the seller from receiving funds.',
      'Our 24/7 human arbiters and automated balance auditor will cross-reference the official Moonton server recharge transaction hash with your player ID logs.',
      'If the seller cannot provide genuine Moonton server recharge receipts, 100% of your payment is refunded back to your original payment method with zero penalty fees.'
    ],
    keyPoints: [
      '1-Click Dispute Freeze: Stops auto-release countdown instantly',
      'Cryptographic Server Audit: We cross-reference Moonton recharge logs',
      '100% Full Refund Guarantee: Direct refund to your GCash, Maya, or bank account'
    ],
    proTip: 'Click "Raise Dispute" before the 15-minute inspection timer expires if diamonds haven’t appeared.',
    tags: ['dispute', 'refund', 'freeze', 'missing', 'scam', 'penalty', 'arbitration']
  },
  {
    id: 'cancellation-policy',
    category: 'cancellation',
    categoryLabel: 'Cancellation',
    question: 'Can I cancel my escrow order if the seller takes too long?',
    shortSummary: 'Yes, if the seller has not initiated the recharge or the SLA expires, you can cancel for an instant full refund.',
    answer: [
      'If the seller has not yet claimed and initiated the recharge process within their allocated window, you can cancel your order directly from the order screen.',
      'Additionally, if the seller\'s fulfillment countdown SLA (~2–5 minutes) expires without proof of dispatch, the order qualifies for 1-click cancellation.',
      'Upon cancellation, escrow funds are instantly released back to your original payment rail without waiting for support review.'
    ],
    keyPoints: [
      'Cancelable before seller claims the order',
      'Auto-cancellation eligible if seller exceeds fulfillment SLA',
      'Zero fee deductions on escrow refund returns'
    ],
    proTip: 'If you made an accidental order with the wrong MLBB User ID, cancel immediately before the seller claims it.',
    tags: ['cancel', 'cancellation', 'refund', 'sla', 'too long', 'wrong id']
  },
  {
    id: 'extend-inspection',
    category: 'release',
    categoryLabel: 'Release & Payout',
    question: 'Can I extend my 15-minute inspection window if I cannot log into MLBB right away?',
    shortSummary: 'Yes! You can request up to two +24 hour protection extensions right from your Order Tracker.',
    answer: [
      'We understand that you might be away from your gaming device, in an ongoing match, experiencing poor cellular connectivity, or encountering Moonton server maintenance.',
      'Inside the active Order Tracker, you can click "Extend Protection (+24h)" up to two times (+48 hours total).',
      'This prevents automatic order completion and keeps the escrow vault safely locked until you have comfortably verified your diamond balance.'
    ],
    keyPoints: [
      'Up to +48 hours total extension time available',
      'One-click activation directly on the order card',
      'Prevents premature auto-release while you are offline'
    ],
    proTip: 'Use the extension button if Mobile Legends is updating or servers are under maintenance.',
    tags: ['extend', 'extension', 'timer', 'offline', 'inspection', 'extra time']
  },
  {
    id: 'password-credential-safety',
    category: 'security',
    categoryLabel: 'Account Safety',
    question: 'Will anyone from Nexus Shop or a seller ever ask for my MLBB password?',
    shortSummary: 'NEVER. We will NEVER ask for passwords, emails, or 2FA codes. All recharges operate solely via public Player ID.',
    answer: [
      'ABSOLUTELY NEVER! Neither Nexus Shop staff, escrow arbiters, nor verified diamond sellers will ever ask for your Mobile Legends password, Moonton password, Google/Facebook login, or 2-factor authentication codes.',
      'All diamond packages are pushed directly to your account through Moonton’s official direct server-to-server recharge API using ONLY your public User ID (e.g., 12345678) and Zone ID (e.g., 2024).',
      'Anyone claiming to be a seller or admin asking for your password is an unauthorized impersonator. Report them immediately via the in-app reporting tool.'
    ],
    keyPoints: [
      'Zero Login Credentials Needed: Passwords are NEVER requested',
      'Public Identifiers Only: Only public User ID and Zone ID are used',
      '100% Phishing Protected: Your account credentials remain strictly confidential'
    ],
    proTip: 'Keep your login credentials private at all times. Official top-ups never require account access.',
    tags: ['password', 'login', 'credentials', 'scam', 'phishing', 'security', 'safe']
  },
  {
    id: 'account-ban-safety',
    category: 'security',
    categoryLabel: 'Account Safety',
    question: 'Is my Mobile Legends account safe from bans or negative diamond penalties?',
    shortSummary: '100% safe. All diamonds are sourced through authorized Moonton distributor channels with legitimate receipts.',
    answer: [
      'Yes, your account is 100% safe. Negative diamond penalties in Mobile Legends only happen when unauthorized rogue sellers use stolen credit cards (carding) or fraudulent refund chargeback schemes.',
      'Nexus Shop strictly audits and verifies all sellers. Every diamond package is sourced through authorized distributor APIs and official Moonton gateway partners with legitimate billing invoices.',
      'Furthermore, Nexus Shop maintains a $50,000 Aegis Merchant Guarantee Fund that fully indemnifies buyers against any seller malfeasance.'
    ],
    keyPoints: [
      'Zero Carding / Stolen Card Policy: Zero tolerance with instant merchant blacklisting',
      'Official Distributor Gateway: Legitimate Moonton transaction records',
      'Backed by $50,000 Guarantee Fund: Complete financial indemnity for buyers'
    ],
    proTip: 'Always buy from verified escrow platforms rather than unverified social media group chats.',
    tags: ['ban', 'negative diamonds', 'safe', 'moonton', 'carding', 'penalty', 'audited']
  }
];

export const EscrowExplainerModal: React.FC<EscrowExplainerModalProps> = ({
  isOpen,
  onClose,
  onStartOrder,
}) => {
  // Accordion state: by default, have the first FAQ item open for immediate clarity
  const [expandedIds, setExpandedIds] = useState<string[]>(['vault-protection']);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'vault' | 'release' | 'disputes' | 'security' | 'cancellation'>('all');

  const filteredFaqs = useMemo(() => {
    return ESCROW_FAQS.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.shortSummary.toLowerCase().includes(q) ||
        faq.answer.some((line) => line.toLowerCase().includes(q)) ||
        faq.keyPoints.some((kp) => kp.toLowerCase().includes(q)) ||
        faq.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  const toggleFaq = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExpandAll = () => {
    if (expandedIds.length === filteredFaqs.length) {
      setExpandedIds([]);
    } else {
      setExpandedIds(filteredFaqs.map((f) => f.id));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">The Aegis Escrow Security Protocol</h3>
              <p className="text-[11px] text-slate-400">Zero-Risk Buyer & Seller Real-Money Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close escrow explainer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 text-xs overflow-y-auto grow">
          
          {/* Why P2P Diamond Top-Ups Require Escrow */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-slate-300 space-y-2">
            <h4 className="font-bold text-cyan-300 text-sm flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              Why P2P Diamond Top-Ups Require Escrow
            </h4>
            <p className="text-slate-300 leading-relaxed text-xs">
              Traditional Facebook/Discord diamond sellers frequently suffer from "pay first, never receive" scams or buyer fraudulent chargebacks. Nexus Shop acts as the impartial, programmatic vault holding real-money funds until diamonds verifiably land in your MLBB account.
            </p>
          </div>

          {/* Authorized Distributor API Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-950 to-blue-950/30 border border-cyan-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-700">⚡</span>
                <span>Authorized Distributor / API — Best for Automatic Fulfillment</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold shrink-0">
                Instant 3-8s
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              For instant top-ups, choose our <strong>Authorized Distributor / API</strong> channel. Nexus Shop sends the player's User ID/Zone ID and package to the provider's API; the provider performs the top-up and returns an official transaction/reference ID immediately.
            </p>
          </div>

          {/* Trusted Third-Party Payment Gateways (Stripe, Xendit, Midtrans) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-950 to-teal-950/30 border border-emerald-500/40 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-bold text-emerald-300 text-xs sm:text-sm flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Trusted Third-Party Payment Gateways (Stripe, Xendit & Midtrans)</span>
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
                100% Buyer Protection
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong className="text-amber-300">Important Tip:</strong> For a verified, <strong>"not scammy"</strong> reputation, Nexus Shop routes all payments through licensed third-party payment gateways (<strong>Stripe, Xendit, and Midtrans</strong>) rather than asking customers to send money directly to a personal bank account or personal crypto wallet:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-cyan-300 block">1. Digital Wallets</strong>
                <span className="text-slate-400">Google Pay, Apple Pay, PayPal, DANA/OVO/GoPay (Indonesia), GCash/Maya (Philippines).</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-amber-300 block">2. Bank Transfers & Virtual Accounts</strong>
                <span className="text-slate-400">Direct bank transfers & automated Virtual Accounts (VA) via Xendit & Midtrans.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-emerald-300 block">3. Country Local E-Wallets</strong>
                <span className="text-slate-400">QRIS, Touch 'n Go, GrabPay, ShopeePay, TrueMoney, PayNow, PromptPay & PIX.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                <strong className="text-indigo-300 block">4. Credit / Debit Cards</strong>
                <span className="text-slate-400">Visa and Mastercard with Stripe 3D-Secure 2.0 buyer protection.</span>
              </div>
            </div>
          </div>

          {/* 5-Step Process */}
          <div className="space-y-3">
            <h4 className="font-semibold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>How Each Transaction Unfolds (5-Step Lifecycle):</span>
            </h4>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">Buyer Pays into Escrow Vault</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Your GCash, Maya, PayPal, or Bank Transfer payment is deposited into the escrow vault. The seller cannot touch these funds yet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">Seller Recharges via Moonton ID</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Seller fulfills the order using your MLBB User ID & Zone ID. They have a strict countdown SLA (~2-5 minutes) to complete recharge.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">Proof of Moonton Transaction Uploaded</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Seller must provide the official Moonton distributor order reference number and receipt proof.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">15-Minute Buyer Inspection Window</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    Open your Mobile Legends client and inspect your diamond balance. If all is good, click "Confirm Received" to immediately release the seller's funds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  5
                </span>
                <div>
                  <h5 className="font-bold text-white text-xs">Dispute & Arbiter Resolution Safety Net</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    If diamonds fail to appear, clicking "Dispute" immediately freezes the vault. Our 24/7 arbiters cross-reference Moonton server API logs and issue 100% refunds for unfulfilled top-ups.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Zero Account Risk Banner */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs">
              <strong>Zero Account Risk:</strong> No login credentials or passwords ever requested. Recharge operates 100% via public Moonton Player ID and Zone ID.
            </span>
          </div>

          {/* ======================================================== */}
          {/* ACCORDION FAQ SECTION */}
          {/* ======================================================== */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            {/* FAQ Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Frequently Asked Questions (FAQ)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Quick answers to common questions about fund safety, release timers, and refunds
                  </p>
                </div>
              </div>

              {/* Expand / Collapse All Button */}
              <button
                type="button"
                onClick={handleExpandAll}
                className="self-start sm:self-center px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors border border-slate-700 cursor-pointer shrink-0"
              >
                {expandedIds.length === filteredFaqs.length && filteredFaqs.length > 0
                  ? 'Collapse All'
                  : 'Expand All'}
              </button>
            </div>

            {/* Quick Search & Filter Controls */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search escrow FAQ (e.g. 'refund', 'password', 'dispute', 'timer', 'cancel')..."
                  className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
                {[
                  { id: 'all', label: 'All Topics', count: ESCROW_FAQS.length },
                  { id: 'vault', label: 'Vault Safety', count: ESCROW_FAQS.filter((f) => f.category === 'vault').length },
                  { id: 'release', label: 'Release & Timing', count: ESCROW_FAQS.filter((f) => f.category === 'release').length },
                  { id: 'disputes', label: 'Disputes & Refunds', count: ESCROW_FAQS.filter((f) => f.category === 'disputes').length },
                  { id: 'cancellation', label: 'Cancellation', count: ESCROW_FAQS.filter((f) => f.category === 'cancellation').length },
                  { id: 'security', label: 'Account Safety', count: ESCROW_FAQS.filter((f) => f.category === 'security').length },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 border ${
                      activeCategory === cat.id
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60 font-bold'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[9px] opacity-70">({cat.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion List */}
            <div className="space-y-2.5">
              {filteredFaqs.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 space-y-2">
                  <p className="text-xs">
                    No escrow FAQ found matching "<span className="text-cyan-400 font-mono">{searchQuery}</span>".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                filteredFaqs.map((faq) => {
                  const isExpanded = expandedIds.includes(faq.id);

                  // Color accents by category
                  const badgeColor =
                    faq.category === 'vault'
                      ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                      : faq.category === 'release'
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                      : faq.category === 'disputes'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                      : faq.category === 'cancellation'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                      : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';

                  return (
                    <div
                      key={faq.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Accordion Trigger Button */}
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isExpanded}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wider ${badgeColor}`}
                            >
                              {faq.categoryLabel}
                            </span>
                            <span className="font-semibold text-white text-xs group-hover:text-cyan-300 transition-colors">
                              {faq.question}
                            </span>
                          </div>
                          {!isExpanded && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 leading-snug">
                              {faq.shortSummary}
                            </p>
                          )}
                        </div>

                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all duration-200 ${
                              isExpanded
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 rotate-180'
                                : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:text-white group-hover:border-slate-700'
                            }`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </button>

                      {/* Accordion Expandable Content */}
                      {isExpanded && (
                        <div className="px-3.5 pb-4 pt-1 border-t border-slate-800/80 space-y-3 text-[11px] leading-relaxed animate-in fade-in-50 duration-150">
                          {/* Answer Paragraphs */}
                          <div className="space-y-1.5 text-slate-300">
                            {faq.answer.map((para, i) => (
                              <p key={i}>{para}</p>
                            ))}
                          </div>

                          {/* Key Takeaways */}
                          {faq.keyPoints && faq.keyPoints.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                <span>Key Protection Rules</span>
                              </span>
                              <div className="space-y-1">
                                {faq.keyPoints.map((kp, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{kp}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pro Tip Callout */}
                          {faq.proTip && (
                            <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-300 flex items-start gap-2 text-[11px]">
                              <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>
                                <strong>Pro Tip:</strong> {faq.proTip}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Footer Action */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors"
          >
            Got It
          </button>
          <button
            onClick={() => {
              onClose();
              onStartOrder();
            }}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20 transition-colors"
          >
            <span>Browse Diamond Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
