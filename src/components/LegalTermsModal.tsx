import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Search,
  Printer,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  Gem,
  Award,
  Clock,
  UserX,
  CreditCard,
} from 'lucide-react';
import { useI18n } from '../i18n';

export type LegalTabType = 'terms' | 'escrow_refund' | 'privacy' | 'p2p_rules' | 'disclaimer';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTabType;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_terms_accepted') === 'true';
    } catch {
      return true;
    }
  });

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  const handleAcceptTerms = () => {
    try {
      localStorage.setItem('nexus_terms_accepted', 'true');
    } catch {}
    setHasAcceptedTerms(true);
    onClose();
  };

  const [copiedPolicyNotice, setCopiedPolicyNotice] = useState(false);

  const handlePrint = () => {
    try {
      navigator.clipboard?.writeText(
        'Nexus Shop Authorized Peer-to-Peer Escrow Platform Policies & Consumer Protection Protocol (v2026.1 Official) - 100% Aegis Escrow Vault Protected.'
      );
      setCopiedPolicyNotice(true);
      setTimeout(() => setCopiedPolicyNotice(false), 2500);
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Legal Compliance & Consumer Protection
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-bold">
                  v2026.1 Official
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Nexus Shop Authorized Peer-to-Peer Escrow Platform Policies & Protocols
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
              title="Copy Policy Summary"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>{copiedPolicyNotice ? 'Copied Summary!' : 'Copy Summary'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'terms'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('escrow_refund')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'escrow_refund'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Escrow & Refund Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'privacy'
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('p2p_rules')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'p2p_rules'
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>P2P Merchant Rules</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disclaimer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === 'disclaimer'
                  ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-950'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Moonton Disclaimer</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clauses (e.g. refund, SLA)..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm leading-relaxed text-slate-300 select-text">
          
          {/* TAB 1: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Summary of Terms</div>
                  <p className="text-slate-300">
                    Nexus Shop provides a secure, peer-to-peer and direct-recharge escrow service for Mobile Legends: Bang Bang (MLBB). By accessing this service, you enter into a legally binding agreement under the terms set forth below. Last updated: September 2026.
                  </p>
                </div>
              </div>

              {/* Section 1 */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-mono">1</span>
                  <span>Acceptance of Terms & Eligibility</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  By registering an account, placing an order, depositing funds into the Nexus Shop Wallet, or listing inventory as an authorized seller, you represent and warrant that you are at least 13 years of age (or the minimum legal age required in your jurisdiction) and have legal capacity to enter into binding agreements. If you are under the legal age of majority, you confirm that your legal parent or guardian has reviewed and accepted these terms on your behalf.
                </p>
              </section>

              {/* Section 2 */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-mono">2</span>
                  <span>Scope of Services & Automated Escrow Vault</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Nexus Shop acts as a neutral technology platform facilitating:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1.5 text-slate-300 pl-2">
                  <li><strong className="text-white">Aegis Smart Escrow:</strong> Holding buyer payments in an isolated, secure custody vault until in-game delivery confirmation.</li>
                  <li><strong className="text-white">Moonton Server API Validation:</strong> Automated player ID, Zone ID, and In-Game Name (IGN) verification to prevent wrong-account top-ups.</li>
                  <li><strong className="text-white">Authorized Distributor Settlement:</strong> Direct distribution of clean, authorized Mobile Legends diamond packages with zero risk of negative balances.</li>
                  <li><strong className="text-white">Dispute Arbitration:</strong> Impartial order dispute resolution powered by verifiable server delivery audit logs.</li>
                </ul>
              </section>

              {/* Section 3 */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-mono">3</span>
                  <span>Buyer Obligations & Game Account Security</span>
                </h3>
                <div className="text-xs sm:text-sm space-y-2">
                  <p>
                    Buyers are strictly responsible for providing the correct Mobile Legends User ID and Server Zone ID. Nexus Shop provides real-time verification lookups; proceeding with checkout after confirmation binds the transaction to the verified account.
                  </p>
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300">
                    🔒 ZERO PASSWORD POLICY: Nexus Shop and its merchants will NEVER ask for your game password, Moonton password, email access, or 2FA OTP codes. Top-ups require ONLY your public Player ID and Zone ID.
                  </div>
                </div>
              </section>

              {/* Section 4 */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-mono">4</span>
                  <span>Prohibited Activities & Zero-Tolerance Policies</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Any user engaged in the following will face immediate account termination, bond forfeiture, and reporting to financial fraud monitoring networks:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 flex items-start gap-2">
                    <UserX className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Fraudulent chargebacks or payment disputes after receiving verified in-game diamond delivery.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Supplying illegitimate, carded, or refunded diamonds resulting in negative balance strikes.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 flex items-start gap-2">
                    <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Attempting to circumvent the Aegis Escrow system via private outside-platform payments.</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>Exploitation of price glitches, automated bot scalping, or multi-account referral abuse.</span>
                  </div>
                </div>
              </section>

              {/* Section 5 */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs flex items-center justify-center font-mono">5</span>
                  <span>Payment Methods, Settlement & Taxes</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  We support localized digital wallets (GCash, Maya, GrabPay), international methods (PayPal, Credit/Debit cards), and cryptocurrencies (USDT, USDC). All prices are displayed inclusive of applicable platform processing fees unless otherwise indicated at checkout. Users are responsible for any applicable local taxes.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: ESCROW & REFUND POLICY */}
          {activeTab === 'escrow_refund' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">100% Anti-Scam Aegis Escrow Guarantee</div>
                  <p className="text-slate-300">
                    Your money is held in an isolated cryptographic escrow vault. Funds are NEVER released to the seller until you verify diamond receipt in your game, or the 15-minute verification window concludes without an active dispute.
                  </p>
                </div>
              </div>

              {/* Refund Rules */}
              <section className="space-y-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center font-mono">A</span>
                  <span>Automatic Instant 100% Refund Scenarios</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>SLA Timeout (Delivery Delay)</span>
                    </div>
                    <p className="text-slate-400">
                      If the merchant fails to dispatch the diamonds within their designated SLA time limit (or 15 minutes for instant packages), you can click <strong>"Cancel & Refund"</strong> for an immediate 100% refund.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Invalid Moonton Server Account</span>
                    </div>
                    <p className="text-slate-400">
                      If Moonton's servers reject the Player ID or Zone ID as invalid, the escrow order is automatically canceled and all funds are instantly returned to your original payment method or Nexus Shop Wallet.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Underdelivery or Package Mismatch</span>
                    </div>
                    <p className="text-slate-400">
                      If the diamonds credited to your account are fewer than the ordered quantity, funds remain frozen in escrow while the seller fulfills the deficit or an escrow partial refund is issued.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>Out-of-Stock Merchant Inability</span>
                    </div>
                    <p className="text-slate-400">
                      If a seller runs out of distributor API allocation and cannot fulfill the order, the system auto-cancels the transaction within 3 minutes and refunds 100% of the funds.
                    </p>
                  </div>
                </div>
              </section>

              {/* 15-Minute Verification Window */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center font-mono">B</span>
                  <span>The 15-Minute Buyer Verification Window</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  When a seller marks an order as <strong>"Delivered"</strong> and uploads the server confirmation batch code, a 15-minute inspection countdown begins:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 text-slate-300 pl-2">
                  <li>Open your Mobile Legends app to verify your new diamond total and in-game recharge inbox.</li>
                  <li>Click <strong>"Confirm & Release Escrow"</strong> to finalize the transaction and award merchant reputation points.</li>
                  <li>If the diamonds did not arrive, click <strong>"Raise Dispute"</strong> before the timer expires. This indefinitely freezes escrow release and summons an Arbitration Officer.</li>
                </ul>
              </section>

              {/* Refund Timeframes */}
              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center font-mono">C</span>
                  <span>Refund Processing Timeframes</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Payment Method</th>
                        <th className="px-4 py-2.5">Refund Speed</th>
                        <th className="px-4 py-2.5">Processing Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      <tr>
                        <td className="px-4 py-2 text-cyan-350 font-bold">Nexus Shop Virtual Wallet</td>
                        <td className="px-4 py-2 text-emerald-400">Instant (0 seconds)</td>
                        <td className="px-4 py-2 text-emerald-400">Free ($0.00)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-white">GCash / Maya (e-Wallet)</td>
                        <td className="px-4 py-2 text-slate-300">5 – 15 minutes</td>
                        <td className="px-4 py-2 text-emerald-400">Free ($0.00)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-white">PayPal</td>
                        <td className="px-4 py-2 text-slate-300">1 – 30 minutes</td>
                        <td className="px-4 py-2 text-emerald-400">Free ($0.00)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-white">USDT / Crypto (TRC20/BSC)</td>
                        <td className="px-4 py-2 text-slate-300">Block confirmation (~3 mins)</td>
                        <td className="px-4 py-2 text-slate-400">Network gas only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
                <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Privacy by Architecture</div>
                  <p className="text-slate-300">
                    We collect the minimum amount of data required to reliably deliver your Mobile Legends top-up. We never store payment credentials, financial passwords, or in-game credentials.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-mono">1</span>
                  <span>Data We Collect</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  When you use Nexus Shop, the following data points are processed:
                </p>
                <ul className="list-disc list-inside text-xs sm:text-sm space-y-1 text-slate-300 pl-2">
                  <li><strong className="text-white">Public Game Identifiers:</strong> Mobile Legends Player ID, Zone ID, and In-Game Name (IGN) retrieved via official server API.</li>
                  <li><strong className="text-white">Order Metadata:</strong> Package purchased, quantity, date/timestamp, transaction reference number, and delivery status.</li>
                  <li><strong className="text-white">Account Details:</strong> Email address (for order receipts & dispute alerts) and Nexus Shop Wallet balance.</li>
                  <li><strong className="text-white">Customer Support & Live Chat:</strong> Chat messages exchanged between buyers, sellers, and arbitration agents for order fulfillment.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-mono">2</span>
                  <span>Data We NEVER Collect or Store</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero Sensitive Data Storage</span>
                  </div>
                  <p className="text-slate-400">
                    Nexus Shop strictly operates as a direct server recharge protocol. We do not have access to, nor will we ever ask for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
                    <li>Your Moonton account password or login credentials</li>
                    <li>Google Play, Apple ID, or Facebook credentials</li>
                    <li>Full credit/debit card CVV numbers (handled by PCI-DSS Level 1 payment processors)</li>
                    <li>Device SMS codes or two-factor authorization tokens</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs flex items-center justify-center font-mono">3</span>
                  <span>Data Security & Encryption</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  All communications between your browser, the Nexus Shop platform, and Moonton server nodes are encrypted with industry-standard 256-bit TLS/SSL encryption. In accordance with GDPR and international data standards, you retain the right to export your transaction history or request account anonymization at any time.
                </p>
              </section>
            </div>
          )}

          {/* TAB 4: P2P MERCHANT RULES */}
          {activeTab === 'p2p_rules' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex items-start gap-3">
                <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Merchant Code of Conduct & SLA Standards</div>
                  <p className="text-slate-300">
                    To maintain 99.8%+ order fulfillment satisfaction, all verified sellers and distributors are held to strict service level agreements (SLA) and anti-fraud protocols.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-center font-mono">1</span>
                  <span>Fulfillment Speed & Average SLA</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Merchants must fulfill orders within their stated delivery SLA:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1 font-mono">⚡ Instant Dispatch</div>
                    <p className="text-slate-400">Within 3 minutes via automated Moonton API webhook.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-emerald-400 flex items-center gap-1 font-mono">⏱️ Standard P2P</div>
                    <p className="text-slate-400">Within 5 – 15 minutes average delivery time.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400 flex items-center gap-1 font-mono">⚠️ SLA Violation</div>
                    <p className="text-slate-400">Exceeding 25 minutes triggers automatic order cancellation.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-center font-mono">2</span>
                  <span>Proof of Delivery Verification</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Before marking an order as delivered, the seller must record a verifiable Moonton transaction reference, server dispatch sequence ID, or timestamped in-game recharge confirmation. In the event of a dispute, this receipt is cross-checked against Moonton server API logs.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-center font-mono">3</span>
                  <span>Merchant Escrow Security Deposit & Bond</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  Verified sellers maintain an escrow security bond ($250 to $2,500 based on tier). If a seller provides illegitimate diamonds that cause a buyer's game account to incur negative diamonds, the seller's security bond is immediately seized to fully indemnify the buyer and purchase legitimate diamonds on their behalf.
                </p>
              </section>
            </div>
          )}

          {/* TAB 5: DISCLAIMER & FAIR PLAY */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-white">Trademark Notice & Independent Status</div>
                  <p className="text-slate-300">
                    Legal disclosure regarding intellectual property, trademarks, and authorized distribution channels.
                  </p>
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs flex items-center justify-center font-mono">1</span>
                  <span>Moonton Trademark Attribution</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  "Mobile Legends: Bang Bang", "MLBB", Moonton logos, and character designs are registered trademarks and copyrighted material of Moonton Technology Pte. Ltd. (a subsidiary of ByteDance Ltd.). Nexus Shop is an independent recharge aggregator and peer-to-peer escrow facilitator. Nexus Shop is not owned by, directly operated by, or exclusively partnered with Moonton Technology Pte. Ltd.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs flex items-center justify-center font-mono">2</span>
                  <span>100% Clean Diamonds & Anti-Negative Guarantee</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Official Server Top-Up Protocol</span>
                  </div>
                  <p className="text-slate-300">
                    All diamond packages listed on Nexus Shop originate strictly through authorized direct-recharge gateway channels (Codashop, UniPin, Smile.One, or direct Moonton distributor server API). We do NOT use hacked codes, carded credits, or illegal APK modifications.
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    ✓ 0% Risk of Account Ban &nbsp;·&nbsp; ✓ 0% Risk of Negative Diamonds &nbsp;·&nbsp; ✓ Qualifies for all in-game recharge events (KOF, Aspirants, 515, Grand Collection).
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs flex items-center justify-center font-mono">3</span>
                  <span>Contact Our Legal & Compliance Team</span>
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm">
                  For formal legal correspondence, intellectual property notices, or compliance inquiries:
                </p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
                  <div>Nexus Shop Global Escrow & Compliance Ltd.</div>
                  <div>Email: <span className="text-cyan-400">compliance@nexusshop.gg</span></div>
                  <div>Arbitration Desk: <span className="text-emerald-400">arbitration@nexusshop.gg</span></div>
                  <div>Response SLA: Within 24-48 business hours</div>
                </div>
              </section>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {hasAcceptedTerms ? (
                <span className="text-slate-300">
                  You accepted the <strong className="text-emerald-400">Aegis Terms & Escrow Protocols</strong>.
                </span>
              ) : (
                <span>Please review and accept our policies to continue using escrow.</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleAcceptTerms}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>I Understand & Accept</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
