import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  ShieldCheck,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Zap,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { SETTINGS_FAQS, SettingsFAQItem } from '../data/settingsFaqData';

interface SettingsFAQSectionProps {
  onNavigateToTab?: (tab: string) => void;
  onOpenSupportTicket?: () => void;
}

export const SettingsFAQSection: React.FC<SettingsFAQSectionProps> = ({
  onNavigateToTab,
  onOpenSupportTicket,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'escrow' | 'delays' | 'security'>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'escrow-how-it-works': true,
    'delays-troubleshooting-checklist': true,
  });
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, 'yes' | 'no'>>({});
  const [showChecklistGuide, setShowChecklistGuide] = useState(true);

  // Toggle single FAQ accordion
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Expand all or collapse all
  const handleExpandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    SETTINGS_FAQS.forEach((faq) => {
      updated[faq.id] = expand;
    });
    setExpandedIds(updated);
  };

  // Vote helpful
  const handleVote = (id: string, vote: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    setHelpfulFeedback((prev) => ({
      ...prev,
      [id]: vote,
    }));
  };

  // Filtered FAQ items based on category and search query
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return SETTINGS_FAQS.filter((faq) => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const inQuestion = faq.question.toLowerCase().includes(query);
      const inSummary = faq.shortSummary.toLowerCase().includes(query);
      const inAnswer = faq.answer.some((line) => line.toLowerCase().includes(query));
      const inKeyPoints = faq.keyPoints.some((pt) => pt.toLowerCase().includes(query));
      const inTags = faq.tags.some((tag) => tag.toLowerCase().includes(query));

      return inQuestion || inSummary || inAnswer || inKeyPoints || inTags;
    });
  }, [searchQuery, activeCategory]);

  const categoryCounts = useMemo(() => {
    return {
      all: SETTINGS_FAQS.length,
      escrow: SETTINGS_FAQS.filter((f) => f.category === 'escrow').length,
      delays: SETTINGS_FAQS.filter((f) => f.category === 'delays').length,
      security: SETTINGS_FAQS.filter((f) => f.category === 'security').length,
    };
  }, []);

  const getCategoryIcon = (category: 'escrow' | 'delays' | 'security') => {
    switch (category) {
      case 'escrow':
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
      case 'delays':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'security':
        return <Lock className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getCategoryBadgeClass = (category: 'escrow' | 'delays' | 'security') => {
    switch (category) {
      case 'escrow':
        return 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60';
      case 'delays':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'security':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    }
  };

  return (
    <div className="space-y-4" id="settings-faq-container">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-800/50 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Escrow, Delay & Security FAQ</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Self-Service Center
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Find instant answers regarding escrow vault protection, diamond delivery timelines, and anti-phishing security verification to resolve questions quickly without waiting for a support ticket.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => handleExpandAll(true)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={() => handleExpandAll(false)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Quick Troubleshooting Checklist for Support Load Reduction */}
      {showChecklistGuide && (
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/30 via-slate-950/80 to-slate-900 border border-amber-500/40 relative shadow-md">
          <button
            type="button"
            onClick={() => setShowChecklistGuide(false)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-200 p-1"
            title="Dismiss quick checklist"
            aria-label="Dismiss quick checklist"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Fast Resolution: What to Do If Your Diamond Top-Up Is Pending</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-slate-200 block">Relaunch Mobile Legends:</strong>
                Forces game client to fetch fresh server balances. Fixes 80% of delay inquiries.
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-slate-200 block">Check In-Game System Mailbox:</strong>
                Weekly Diamond Passes and bonus event tokens arrive as claimable mail vouchers.
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-slate-200 block">Verify User ID & Zone ID:</strong>
                Confirm in your active order details that numbers match your avatar profile exactly.
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                4
              </span>
              <div>
                <strong className="text-slate-200 block">Raise Dispute to Freeze Escrow:</strong>
                Click "Raise Dispute" before the 15-minute countdown finishes to protect your funds.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="space-y-2.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="faq-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQ (e.g. 'delay', 'password', 'dispute', 'refund', 'maintenance', 'IGN')..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>All Topics</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeCategory === 'all' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('escrow')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'escrow'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Escrow Processing</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeCategory === 'escrow' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {categoryCounts.escrow}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('delays')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'delays'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Top-Up Delays</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeCategory === 'delays' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {categoryCounts.delays}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('security')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeCategory === 'security'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security & Verification</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeCategory === 'security' ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {categoryCounts.security}
            </span>
          </button>
        </div>
      </div>

      {/* FAQ Accordion List */}
      {filteredFaqs.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200">No matching questions found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any FAQ matching "{searchQuery}". Try searching for terms like "dispute", "password", "delay", or "refund".
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="px-4 py-1.5 text-xs font-semibold text-cyan-400 bg-cyan-950/50 border border-cyan-800 rounded-lg hover:bg-cyan-900/50 transition-colors"
          >
            Reset Search Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredFaqs.map((faq) => {
            const isExpanded = !!expandedIds[faq.id];
            const vote = helpfulFeedback[faq.id];

            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                  isExpanded
                    ? 'bg-slate-950/80 border-slate-700/90 shadow-md shadow-slate-950/50'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-950/60'
                }`}
              >
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-start justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">{getCategoryIcon(faq.category)}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryBadgeClass(
                            faq.category
                          )}`}
                        >
                          {faq.categoryLabel}
                        </span>
                        {!isExpanded && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            · {faq.shortSummary}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                        {faq.question}
                      </h4>
                    </div>
                  </div>

                  <div className="shrink-0 p-1 rounded-md text-slate-400 group-hover:text-white group-hover:bg-slate-800 transition-colors mt-0.5">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-800/60 text-xs text-slate-300 space-y-3 animate-in fade-in duration-150">
                    {/* Main Paragraphs */}
                    <div className="space-y-1.5 leading-relaxed text-slate-300">
                      {faq.answer.map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>

                    {/* Key Highlights / Bullet Checklist */}
                    {faq.keyPoints && faq.keyPoints.length > 0 && (
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-1.5">
                        <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Key Policy & Protection Points:</span>
                        </div>
                        <ul className="space-y-1 pl-5 list-disc text-[11px] text-slate-300 marker:text-cyan-400">
                          {faq.keyPoints.map((point, pIdx) => (
                            <li key={pIdx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Action Pro-Tip */}
                    {faq.recommendedAction && (
                      <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] flex items-start gap-2 text-cyan-200">
                        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-cyan-300">Pro Tip: </strong>
                          {faq.recommendedAction}
                        </div>
                      </div>
                    )}

                    {/* Helpful Feedback Widget */}
                    <div className="pt-2 border-t border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">Related Tags:</span>
                        {faq.tags.slice(0, 4).map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[10px] text-slate-400">Was this helpful?</span>
                        {vote ? (
                          <span className="text-emerald-400 font-medium text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Thanks for your feedback!</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleVote(faq.id, 'yes', e)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                              title="Yes, this solved my question"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Yes</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleVote(faq.id, 'no', e)}
                              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-700 border border-slate-700 text-slate-300 transition-colors flex items-center gap-1 cursor-pointer text-[10px]"
                              title="No, I need more help"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>No</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Support Reduction Footer / Escalation */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-semibold text-slate-200">Still have an unresolved order or technical dispute?</div>
            <div className="text-[11px] text-slate-400">
              Our 24/7 Aegis Escrow arbiters can review live Moonton transaction hashes directly.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('orders')}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>View Active Orders</span>
            </button>
          )}
          {onOpenSupportTicket ? (
            <button
              type="button"
              onClick={onOpenSupportTicket}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Raise Ticket
            </button>
          ) : (
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
              Escrow Shield 100% Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
