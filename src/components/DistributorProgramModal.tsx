import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  TrendingUp,
  ShieldCheck,
  Server,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Zap,
  Building2,
  Store,
  Upload,
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface DistributorProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency?: Currency;
}

export const DistributorProgramModal: React.FC<DistributorProgramModalProps> = ({
  isOpen,
  onClose,
  currency = 'PHP',
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'batch_tool' | 'margin_calc' | 'apply'>('tiers');
  
  // Margin simulator state
  const [monthlyVolumeDiamonds, setMonthlyVolumeDiamonds] = useState(150000); // 150k diamonds
  const [targetMarginPct, setTargetMarginPct] = useState(18); // 18%

  // Batch simulation state
  const [batchText, setBatchText] = useState(
    `498172901,3049,706\n819271620,2108,2195\n109283719,5012,296\n771928391,3011,5532`
  );
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProcessedCount, setBatchProcessedCount] = useState<number | null>(null);

  // Application Form
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('cybercafe');
  const [monthlyCapital, setMonthlyCapital] = useState('$5k-$20k');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Margin math
  const retailGrossUsd = (monthlyVolumeDiamonds / 706) * 10.99;
  const wholesaleDiscountUsd = (retailGrossUsd * targetMarginPct) / 100;
  const wholesaleDiscountPhp = Math.round(wholesaleDiscountUsd * 58.5);

  const handleSimulateBatch = () => {
    setIsProcessingBatch(true);
    const rows = batchText.trim().split('\n').filter(Boolean);
    setTimeout(() => {
      setIsProcessingBatch(false);
      setBatchProcessedCount(rows.length);
    }, 1500);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/40 text-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 border border-amber-400/40 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Become an Authorized Distributor
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 font-bold">
                  B2B Wholesale Diamond Supply
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bulk pricing, automated CSV dispatch, and dedicated high-speed server queue for cyber cafes and retailers
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
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'tiers'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Wholesale Tiers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('margin_calc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'margin_calc'
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit Margin Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch_tool')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'batch_tool'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Batch CSV Dispatch Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'apply'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-950'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Distributor Onboarding</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-sm text-slate-300">
          
          {/* TAB 1: WHOLESALE TIERS */}
          {activeTab === 'tiers' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 border border-amber-500/30 space-y-2">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-900/50 border border-amber-400/40 text-amber-300 font-bold">
                  B2B Bulk Direct Sourcing
                </span>
                <h3 className="text-xl font-black text-white">
                  Supply Your Store Or Gaming Cafe With Maximum Diamond Margins
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Authorized distributors tap directly into our Moonton API distribution pipeline with preferential wholesale rates up to 25% below retail, priority batch processing, and dedicated 24/7 technical escrow support.
                </p>
              </div>

              {/* 3 Distributor Tiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Tier 1
                    </span>
                    <span className="text-lg font-black text-white">12% OFF</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Retail Wholesaler</h4>
                  <p className="text-xs text-slate-400">
                    For individual gaming cafes, local campus dealers, and community organizers.
                  </p>
                  <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Min 25,000 💎 / month</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>$500 Escrow Security Bond</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Manual web dashboard top-ups</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/50 shadow-lg shadow-amber-950/40 space-y-3 relative">
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                    Recommended
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60">
                      Tier 2
                    </span>
                    <span className="text-lg font-black text-amber-300">18% OFF</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Master Distributor</h4>
                  <p className="text-xs text-slate-400">
                    For high-traffic esports hubs, cyber cafe chains, and regional top-up shops.
                  </p>
                  <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Min 100,000 💎 / month</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>$1,500 Escrow Security Bond</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Batch CSV upload (100 orders/batch)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Priority sub-3 min API queue</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-orange-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-950 text-orange-300 border border-orange-800/60">
                      Tier 3
                    </span>
                    <span className="text-lg font-black text-orange-300">25% OFF</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Sovereign Cluster</h4>
                  <p className="text-xs text-slate-400">
                    For enterprise bulk aggregators and automated bot platforms.
                  </p>
                  <ul className="text-xs space-y-1.5 pt-2 text-slate-300">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>Min 500,000 💎 / month</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>$5,000 Escrow Security Bond</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>Unlimited Automated API webhooks</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>Dedicated server proxy node</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARGIN CALCULATOR */}
          {activeTab === 'margin_calc' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Distributor Monthly Profit Simulator</span>
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Monthly Diamond Sales Volume</span>
                      <span className="font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
                        💎 {monthlyVolumeDiamonds.toLocaleString()} Diamonds
                      </span>
                    </div>
                    <input
                      type="range"
                      min={25000}
                      max={1000000}
                      step={25000}
                      value={monthlyVolumeDiamonds}
                      onChange={(e) => setMonthlyVolumeDiamonds(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>25k 💎</span>
                      <span>250k 💎</span>
                      <span>1M+ 💎</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Target Wholesale Margin</span>
                      <span className="font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                        {targetMarginPct}% Discount Below Retail
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[12, 18, 25].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setTargetMarginPct(rate)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                            targetMarginPct === rate
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {rate}% Tier
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profit Result Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-orange-950/40 border border-amber-500/40 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                      Estimated Monthly Wholesaler Profit
                    </span>
                    <div className="mt-2 text-3xl sm:text-4xl font-black text-amber-300">
                      {formatCurrency(wholesaleDiscountUsd, currency, wholesaleDiscountPhp)}
                    </div>
                    <p className="text-xs text-slate-300 mt-2">
                      Your store purchases diamonds at wholesale discount and resells to your customers at standard retail price.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('apply')}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <span>Apply for Wholesale Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH CSV TOOL */}
          {activeTab === 'batch_tool' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs text-slate-300">
                Process multiple player orders in bulk. Enter rows in format: <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded font-mono">User_ID,Zone_ID,Diamond_Package</code>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Batch Order Input (CSV)</label>
                <textarea
                  rows={5}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSimulateBatch}
                  disabled={isProcessingBatch}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessingBatch ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Validating Moonton User IDs & Escrowing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Execute Batch Order Dispatch</span>
                    </>
                  )}
                </button>

                {batchProcessedCount !== null && (
                  <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Batch of {batchProcessedCount} orders dispatched successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: APPLY */}
          {activeTab === 'apply' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {submitted ? (
                <div className="p-8 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-center space-y-4 max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Distributor Application Received!</h3>
                  <p className="text-xs text-slate-300">
                    Thank you, <strong>{businessName}</strong>. Our wholesale supply desk will review your credentials and issue your initial escrow bond wallet within 2-4 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Business / Store Name</label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. CyberZone Esports Lounge"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Business Type</label>
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="cybercafe">Internet / Cyber Cafe</option>
                        <option value="gaming_shop">Physical Game Store / Kiosk</option>
                        <option value="online_reseller">Online Reseller / Shopee Store</option>
                        <option value="guild">Esports Clan / Guild Wholesaler</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Contact Email</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="wholesale@yourbusiness.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Initial Escrow Capital</label>
                      <select
                        value={monthlyCapital}
                        onChange={(e) => setMonthlyCapital(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="$500-$2k">$500 – $2,000 USD (Tier 1)</option>
                        <option value="$2k-$10k">$2,000 – $10,000 USD (Tier 2)</option>
                        <option value="$10k+">$10,000+ USD (Sovereign Tier)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Business Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Wholesale Application</span>
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
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Dedicated B2B Escrow Liquidity Pools · Authorized Moonton Wholesale</span>
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
