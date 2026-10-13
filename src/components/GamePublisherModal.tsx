import React, { useState } from 'react';
import {
  X,
  Gamepad2,
  Code2,
  ShieldCheck,
  TrendingUp,
  Server,
  Key,
  CheckCircle2,
  Copy,
  Terminal,
  Zap,
  DollarSign,
  ArrowRight,
  Globe,
  Layers,
  Lock,
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface GamePublisherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: Currency;
}

export const GamePublisherModal: React.FC<GamePublisherModalProps> = ({
  isOpen,
  onClose,
  currency = 'USD',
}) => {
  const [activeTab, setActiveTab] = useState<'solutions' | 'api_docs' | 'revenue_savings' | 'contact'>('solutions');
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'node' | 'python'>('node');
  const [copiedCode, setCopiedCode] = useState(false);

  // Revenue calculator
  const [annualGameGmv, setAnnualGameGmv] = useState(500000); // $500,000 USD / yr

  // Contact form
  const [studioName, setStudioName] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [publisherEmail, setPublisherEmail] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('mobile');
  const [monthlyVolumeRange, setMonthlyVolumeRange] = useState('$50k-$250k');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Comparison math
  const appStoreFeeRate = 0.30; // 30%
  const nexusFeeRate = 0.025; // 2.5%
  const appStoreCut = annualGameGmv * appStoreFeeRate;
  const nexusCut = annualGameGmv * nexusFeeRate;
  const publisherSavings = appStoreCut - nexusCut;

  const samplePayloadNode = `import axios from 'axios';

// Initialize Nexus Server Direct Recharge client
const NEXUS_API_SECRET = process.env.NEXUS_PUBLISHER_SECRET;

async function dispatchPlayerRecharge(playerId: string, zoneId: string, packageId: string) {
  try {
    const response = await axios.post(
      'https://api.nexusshop.gg/v1/publisher/recharge/dispatch',
      {
        publisher_id: 'pub_moonton_live_8921',
        game_code: 'mlbb',
        player_id: playerId,
        zone_id: zoneId,
        package_id: packageId,
        escrow_lock_id: 'esc_order_98127391',
        idempotency_key: crypto.randomUUID()
      },
      {
        headers: {
          'Authorization': \`Bearer \${NEXUS_API_SECRET}\`,
          'Content-Type': 'application/json',
          'X-Nexus-Version': '2026-09-01'
        }
      }
    );

    console.log('Diamonds delivered & Escrow confirmed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Recharge dispatch failed:', error.response?.data);
    throw error;
  }
}`;

  const samplePayloadCurl = `curl -X POST https://api.nexusshop.gg/v1/publisher/recharge/dispatch \\
  -H "Authorization: Bearer sec_live_9a7b8c1d2e3f" \\
  -H "Content-Type: application/json" \\
  -H "X-Nexus-Version: 2026-09-01" \\
  -d '{
    "publisher_id": "pub_moonton_live_8921",
    "game_code": "mlbb",
    "player_id": "498172901",
    "zone_id": "3049",
    "package_id": "pkg_706_diamonds",
    "escrow_lock_id": "esc_order_98127391"
  }'`;

  const samplePayloadPython = `import requests
import uuid

def dispatch_recharge(player_id, zone_id, package_id):
    url = "https://api.nexusshop.gg/v1/publisher/recharge/dispatch"
    headers = {
        "Authorization": f"Bearer {API_SECRET}",
        "Content-Type": "application/json",
        "X-Nexus-Version": "2026-09-01"
    }
    payload = {
        "publisher_id": "pub_moonton_live_8921",
        "game_code": "mlbb",
        "player_id": player_id,
        "zone_id": zone_id,
        "package_id": package_id,
        "escrow_lock_id": "esc_order_98127391",
        "idempotency_key": str(uuid.uuid4())
    }
    res = requests.post(url, json=payload, headers=headers)
    return res.json()`;

  const activeSnippet =
    codeLanguage === 'node'
      ? samplePayloadNode
      : codeLanguage === 'curl'
      ? samplePayloadCurl
      : samplePayloadPython;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Nexus for Game Publishers & Studios
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/80 font-bold">
                  B2B Direct Escrow API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct in-game currency settlement, zero payment chargebacks, and 2.5% take rate (bypass the 30% app store fee)
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
            onClick={() => setActiveTab('solutions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'solutions'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Publisher Solutions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revenue_savings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'revenue_savings'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Margin & Fee Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api_docs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'api_docs'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Sandbox API</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'contact'
                ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-300 shadow-sm shadow-indigo-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Request Studio Sandbox</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-slate-300">
          
          {/* TAB 1: SOLUTIONS */}
          {activeTab === 'solutions' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-500/30 space-y-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-900/50 border border-blue-400/40 text-blue-300 font-bold">
                  B2B Gaming Infrastructure
                </span>
                <h3 className="text-xl font-black text-white">
                  Maximize Game Margins with Web-to-Game Escrow Rails
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Nexus Shop empowers game studios and mobile publishers to launch direct web shops, accept 100+ local payment methods (GCash, Maya, Dana, Pix, Cards, Crypto), and keep 97.5% of in-game purchases without credit card fraud liability.
                </p>
              </div>

              {/* 4 Feature Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">0% Chargeback & Friendly Fraud Guarantee</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    All transactions are backed by Aegis Escrow Vault. We absorb 100% of chargeback disputes and payment reversals, eliminating unpredictable bank clawbacks for publishers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Direct Moonton Server Node Injection</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Automated sub-500ms API routing verifies user IGN, validates server zone eligibility, and deposits diamonds without player login passwords.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Hyper-Local SEA Payment Rails</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Accept GCash, Maya, ShopeePay, GrabPay, PromptPay, OVO, and local banks across the Philippines, Indonesia, Malaysia, Thailand, and Singapore in a single API.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Server className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">99.99% Uptime High-Throughput Webhooks</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for flash esports tournament rushes and peak game update events, handling over 25,000 top-ups per minute with HMAC-signed delivery verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARGIN & FEE CALCULATOR */}
          {activeTab === 'revenue_savings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sliders */}
                <div className="space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Publisher Margin Optimization Simulator</span>
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Annual In-Game Top-Up GMV</span>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                        ${annualGameGmv.toLocaleString()} USD / yr
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50000}
                      max={5000000}
                      step={50000}
                      value={annualGameGmv}
                      onChange={(e) => setAnnualGameGmv(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>$50k / yr</span>
                      <span>$1.0M / yr</span>
                      <span>$5.0M / yr</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Traditional App Store Fee (30%):</span>
                      <span className="font-mono font-bold text-red-400">-${appStoreCut.toLocaleString()} USD</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Nexus Platform Settlement (2.5%):</span>
                      <span className="font-mono font-bold text-cyan-300">-${nexusCut.toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>

                {/* Savings Spotlight Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-blue-950/40 border border-emerald-500/40 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-wider">
                      Additional Retained Studio Profit
                    </span>
                    <div className="mt-2 text-3xl sm:text-4xl font-black text-emerald-300">
                      +${publisherSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      By routing top-ups through Nexus Direct Escrow instead of native mobile in-app billing, your studio retains an additional <strong className="text-emerald-400">27.5% net profit margin</strong> on every transaction.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('contact')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    <span>Request Studio Integration Sandbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: DEVELOPER API */}
          {activeTab === 'api_docs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Direct Server Recharge Endpoint</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => setCodeLanguage('node')}
                      className={`px-2 py-0.5 rounded ${codeLanguage === 'node' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'text-slate-400'}`}
                    >
                      Node.js
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeLanguage('curl')}
                      className={`px-2 py-0.5 rounded ${codeLanguage === 'curl' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'text-slate-400'}`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeLanguage('python')}
                      className={`px-2 py-0.5 rounded ${codeLanguage === 'python' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80' : 'text-slate-400'}`}
                    >
                      Python
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title="Copy Code Snippet"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Code viewer */}
              <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto max-h-72">
                <pre>{activeSnippet}</pre>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Webhook Security & Nonce Verification</span>
                </div>
                <p className="text-slate-400">
                  Every order delivery and escrow confirmation sends an HTTP POST event to your webhook with header <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">nexus-signature: sha256=...</code> signed with your API secret to prevent replay attacks.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & ONBOARDING */}
          {activeTab === 'contact' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {formSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Publisher Sandbox Key Provisioned!</h3>
                  <p className="text-xs text-slate-300">
                    Thank you, <strong>{studioName || 'Partner Studio'}</strong>. Our gaming solutions engineering lead has provisioned your test sandbox key.
                  </p>

                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
                    <div className="text-[11px] text-slate-400">Your Developer Sandbox API Key:</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="sec_sandbox_7a9f4c2e1b0d88219"
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('api_docs')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Integration Docs & Test API
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitInquiry} className="space-y-4 max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-slate-300">
                    Connect directly with our gaming payments integration engineering team. We typically provision sandbox credentials within 2 business hours.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Studio / Publisher Name</label>
                      <input
                        type="text"
                        required
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        placeholder="e.g. Moonton Games, Valkyrie Studio"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Game Title(s)</label>
                      <input
                        type="text"
                        required
                        value={gameTitle}
                        onChange={(e) => setGameTitle(e.target.value)}
                        placeholder="e.g. Mobile Legends: Bang Bang"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Business / Technical Email</label>
                      <input
                        type="email"
                        required
                        value={publisherEmail}
                        onChange={(e) => setPublisherEmail(e.target.value)}
                        placeholder="developer@gamestudio.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Monthly Top-Up GMV Volume</label>
                      <select
                        value={monthlyVolumeRange}
                        onChange={(e) => setMonthlyVolumeRange(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="under50k">&lt; $50,000 / month</option>
                        <option value="$50k-$250k">$50,000 – $250,000 / month</option>
                        <option value="$250k-$1M">$250,000 – $1,000,000 / month</option>
                        <option value="$1M+">$1,000,000+ / month (Enterprise Tier)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Provisioning Developer Sandbox...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Publisher Inquiry & Request Sandbox Key</span>
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
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>PCI-DSS Level 1 Compliant · 256-bit Web-to-Game Escrow</span>
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
