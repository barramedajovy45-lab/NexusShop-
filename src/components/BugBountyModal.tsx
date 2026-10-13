import React, { useState } from 'react';
import {
  X,
  Bug,
  ShieldCheck,
  ShieldAlert,
  Award,
  Terminal,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Lock,
  Flame,
  FileCode,
  UserCheck,
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BugBountyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: Currency;
}

interface HallOfFameEntry {
  rank: number;
  handle: string;
  bountiesCount: number;
  totalAwardedUsd: number;
  badge: string;
  specialty: string;
}

const HALL_OF_FAME: HallOfFameEntry[] = [
  {
    rank: 1,
    handle: '0xCyph3r_Whitehat',
    bountiesCount: 6,
    totalAwardedUsd: 7800,
    badge: 'Legendary Researcher',
    specialty: 'Escrow State Concurrency',
  },
  {
    rank: 2,
    handle: 'AegisBreaker_SG',
    bountiesCount: 4,
    totalAwardedUsd: 4200,
    badge: 'Master Auditor',
    specialty: 'Moonton API Webhook Nonce',
  },
  {
    rank: 3,
    handle: 'PinoySecGuild',
    bountiesCount: 5,
    totalAwardedUsd: 3100,
    badge: 'Bug Hunter Elite',
    specialty: 'Rate Limit & Checkout Race',
  },
  {
    rank: 4,
    handle: 'KuroNeko_Sec',
    bountiesCount: 3,
    totalAwardedUsd: 1950,
    badge: 'Verified Auditor',
    specialty: 'GraphQL / REST Injection',
  },
];

export const BugBountyModal: React.FC<BugBountyModalProps> = ({
  isOpen,
  onClose,
  currency = 'USD',
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'scope_safeharbor' | 'hall_of_fame' | 'submit'>('rewards');

  // Submit form state
  const [reportTitle, setReportTitle] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [vulnerableArea, setVulnerableArea] = useState('escrow_engine');
  const [pocSteps, setPocSteps] = useState('');
  const [researcherHandle, setResearcherHandle] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Nexus Shop Security Bug Bounty Program
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 font-bold">
                  Bounties up to $5,000 USD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Help safeguard our Aegis Escrow Vault and Moonton API routing rails. We reward ethical whitehat disclosure
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800/80 bg-slate-900/60 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('rewards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'rewards'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Reward Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scope_safeharbor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'scope_safeharbor'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Scope & Safe Harbor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hall_of_fame')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'hall_of_fame'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Hall of Fame</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'submit'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Submit Vulnerability</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-slate-300">
          
          {/* TAB 1: REWARD MATRIX */}
          {activeTab === 'rewards' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 space-y-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-400/40 text-emerald-300 font-bold">
                  Responsible Vulnerability Disclosure
                </span>
                <h3 className="text-xl font-black text-white">
                  Fast Payouts in Crypto USDT, USDC, or Direct Bank Rails
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  We believe cybersecurity researchers deserve prompt recognition and fair compensation. Bounties are triaged within 24 hours and paid within 48 hours of verification.
                </p>
              </div>

              {/* 4 Severity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-red-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60">
                      CRITICAL SEVERITY
                    </span>
                    <span className="text-base font-black text-red-400">$1,000 – $5,000 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Escrow Breach & Vault Manipulation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Arbitrary code execution, escrow vault balance bypass, unauthorized wallet withdrawals, smart release bypass, or private server key leakage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                      HIGH SEVERITY
                    </span>
                    <span className="text-base font-black text-amber-400">$500 – $1,000 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Moonton API Injection & Auth Bypass</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Authentication token forgery, unauthenticated order status overrides, Moonton API injection, or mass player ID enumeration without rate-limits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      MEDIUM SEVERITY
                    </span>
                    <span className="text-base font-black text-cyan-400">$150 – $400 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Concurrency Flaws & Stored XSS</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stored XSS in user profile/chat, CSRF in order settlement locks, race condition double-spending in voucher codes, or rate limit circumvention.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      LOW SEVERITY
                    </span>
                    <span className="text-base font-black text-slate-300">$50 – $100 USD</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">Information Leaks & Misconfigurations</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sensitive debug stack traces in production error outputs, CORS misconfiguration exposing non-sensitive data, or SSL cipher suite weaknesses.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCOPE & SAFE HARBOR */}
          {activeTab === 'scope_safeharbor' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-2">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Legal Safe Harbor Pledge</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Nexus Shop pledges that we will NOT pursue civil lawsuits or initiate criminal complaints against security researchers who conduct research and report vulnerabilities in good faith in accordance with this policy. We consider activities conducted under this policy to be authorized conduct.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                  <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>In-Scope Target Systems</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Aegis Escrow state machine & fund lock API</li>
                    <li>Checkout flow & currency conversion endpoints</li>
                    <li>Moonton API server validation webhooks</li>
                    <li>User authentication & 2FA recovery flows</li>
                    <li>Live P2P order chat & file attachment uploads</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-red-500/30 space-y-2">
                  <h4 className="font-bold text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Out-of-Scope (Disallowed)</span>
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Denial of Service (DoS / DDoS) targeting production</li>
                    <li>Social engineering or phishing against employees</li>
                    <li>Spamming actual SMS or GCash OTP gateways</li>
                    <li>Physical attacks against server facilities</li>
                    <li>Automated scanner spam without manual validation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HALL OF FAME */}
          {activeTab === 'hall_of_fame' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>Whitehat Hall of Fame & Top Security Auditors</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-400">Total Bounties Paid: $24,850 USD</span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Rank</th>
                      <th className="px-4 py-2.5">Researcher</th>
                      <th className="px-4 py-2.5">Bounties</th>
                      <th className="px-4 py-2.5">Focus Area</th>
                      <th className="px-4 py-2.5 text-right">Total Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {HALL_OF_FAME.map((entry) => (
                      <tr key={entry.rank} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-cyan-400">
                          {entry.rank === 1 ? '🥇 #1' : entry.rank === 2 ? '🥈 #2' : entry.rank === 3 ? '🥉 #3' : `#${entry.rank}`}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white font-sans">{entry.handle}</div>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                            {entry.badge}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{entry.bountiesCount} validated</td>
                        <td className="px-4 py-3 text-slate-400 font-sans text-[11px]">{entry.specialty}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">
                          ${entry.totalAwardedUsd.toLocaleString()} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SUBMIT REPORT */}
          {activeTab === 'submit' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Vulnerability Report Submitted!</h3>
                  <p className="text-xs text-slate-300">
                    Ticket Reference: <code className="text-cyan-300 bg-slate-900 px-2 py-0.5 rounded font-mono">SEC-2026-9812</code>
                  </p>
                  <p className="text-xs text-slate-400">
                    Our security triage desk will evaluate your proof-of-concept within 24 hours. Safe harbor protections are now actively logged.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300">Vulnerability Summary / Title</label>
                      <input
                        type="text"
                        required
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        placeholder="e.g. Race condition in voucher redemption allows duplicate discount balance"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Severity Assessment</label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      >
                        <option value="critical">Critical ($1,000 – $5,000)</option>
                        <option value="high">High ($500 – $1,000)</option>
                        <option value="medium">Medium ($150 – $400)</option>
                        <option value="low">Low ($50 – $100)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Affected Component</label>
                      <select
                        value={vulnerableArea}
                        onChange={(e) => setVulnerableArea(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      >
                        <option value="escrow_engine">Aegis Escrow Vault & Lock</option>
                        <option value="moonton_api">Moonton API Gateway Webhook</option>
                        <option value="checkout_pricing">Checkout & Discount Engine</option>
                        <option value="auth_session">Authentication & Session Management</option>
                        <option value="p2p_chat">P2P Order Chat & File Upload</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300">Steps to Reproduce & Proof-of-Concept</label>
                      <textarea
                        rows={4}
                        required
                        value={pocSteps}
                        onChange={(e) => setPocSteps(e.target.value)}
                        placeholder="Detail the exact HTTP requests, parameters, and replication script..."
                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Researcher Handle / Twitter</label>
                      <input
                        type="text"
                        required
                        value={researcherHandle}
                        onChange={(e) => setResearcherHandle(e.target.value)}
                        placeholder="@handle or alias"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Bounty Payout Wallet (USDT / PayPal / Bank)</label>
                      <input
                        type="text"
                        required
                        value={payoutAddress}
                        onChange={(e) => setPayoutAddress(e.target.value)}
                        placeholder="USDT TRC20 address or PayPal email"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Encrypting Submission with PGP Key...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Security Report under Safe Harbor</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted PGP Ingestion · Safe Harbor Protected Disclosure</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
