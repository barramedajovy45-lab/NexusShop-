import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Users,
  Sparkles,
  PhoneCall,
  Mail,
  Globe,
  CheckCircle2,
  Award,
  Clock,
} from 'lucide-react';
import { playUiClickSound } from '../utils/audio';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatBot?: () => void;
}

export const OFFICIAL_CONTACTS = {
  whatsappGroupUrl: 'https://chat.whatsapp.com/K5jSUOKPGXL46sWyMXseCz',
  facebookName: 'Ralph Jaycob Barrameda',
  facebookUrl: 'https://www.facebook.com/search/top?q=Ralph%20Jaycob%20Barrameda',
  instagramHandle: 'hakobiii.com.ph',
  instagramUrl: 'https://www.instagram.com/hakobiii.com.ph/',
  supportEmail: 'support@nexusshop.gg',
};

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
  onOpenChatBot,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedKey(key);
    playUiClickSound();
    setTimeout(() => {
      setCopiedKey(null);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl shadow-cyan-950/60 overflow-hidden">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-pink-500" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-start justify-between gap-4 bg-slate-900/80">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 shadow-inner">
              <PhoneCall className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Official Contact Us & Community Channels
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  VERIFIED OWNER & DESK
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect directly with our official WhatsApp community group, Facebook founder account, or Instagram support desk.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          {/* Anti-Impersonation Safety Notice */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-cyan-950/60 border border-emerald-500/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span>100% Real & Transparent Owner Verification</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                For your safety and to prevent impersonation scams, below are our <strong className="text-emerald-300">only official social and community support channels</strong>. You can message us anytime for order verification, VIP upgrades, bulk diamond supply, or escrow assistance.
              </p>
            </div>
          </div>

          {/* 3 Primary Contact Cards */}
          <div className="space-y-3">
            {/* 1. WhatsApp Community Group */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900/95 to-slate-950 border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0 text-emerald-400">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-black text-white">WhatsApp Official Group Chat</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[9px] font-bold">
                        24/7 LIVE COMMUNITY
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Join our official WhatsApp buyer & VIP community group for live diamond drops, instant order support, and proof of transactions.
                    </p>
                    <div className="text-[11px] font-mono text-emerald-300 break-all bg-slate-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 inline-block">
                      {OFFICIAL_CONTACTS.whatsappGroupUrl}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <a
                    href={OFFICIAL_CONTACTS.whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playUiClickSound()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Join WhatsApp Group</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('whatsapp', OFFICIAL_CONTACTS.whatsappGroupUrl)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'whatsapp' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Group Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Facebook Account: Ralph Jaycob Barrameda */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/50 via-slate-900/95 to-slate-950 border border-blue-500/50 hover:border-blue-400 transition-all shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center shrink-0 text-blue-400 font-black text-lg">
                    f
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-black text-white">Facebook Official Account</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono text-[9px] font-bold">
                        VERIFIED OWNER / ADMIN
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Direct Facebook profile for inquiries, P2P escrow verification, and direct messenger support:
                    </p>
                    <div className="text-xs font-mono font-bold text-blue-200 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-blue-500/30 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>{OFFICIAL_CONTACTS.facebookName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <a
                    href={OFFICIAL_CONTACTS.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playUiClickSound()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Open Facebook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('facebook', OFFICIAL_CONTACTS.facebookName)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'facebook' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Name Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy FB Name</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Instagram Account: hakobiii.com.ph */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-950/50 via-slate-900/95 to-purple-950/40 border border-pink-500/50 hover:border-pink-400 transition-all shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-pink-400/50 flex items-center justify-center shrink-0 text-pink-400 font-black text-xs font-mono">
                    IG
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-black text-white">Instagram Official Handle</span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-mono text-[9px] font-bold">
                        DM FOR TOP-UP & PROMOS
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Follow and DM us on Instagram for real-time customer vouches, event promos, and fast support:
                    </p>
                    <div className="text-xs font-mono font-bold text-pink-200 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-pink-500/30 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span>@{OFFICIAL_CONTACTS.instagramHandle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                  <a
                    href={OFFICIAL_CONTACTS.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playUiClickSound()}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-600/20 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>Open Instagram</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('instagram', OFFICIAL_CONTACTS.instagramHandle)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'instagram' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Handle Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy @hakobiii.com.ph</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Support Hours & Guarantee Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Response SLA</div>
                <div className="text-xs font-bold text-white">~2 to 5 Minutes (24/7)</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Escrow Arbitration</div>
                <div className="text-xs font-bold text-emerald-300">100% Buyer Protected</div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400">Reseller License</div>
                <div className="text-xs font-bold text-amber-300">#MNTN-SEA-2026-88412</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Need instant automated help? Our 24/7 AI Concierge is also available anytime.</span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenChatBot && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenChatBot();
                }}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold cursor-pointer"
              >
                Open AI Support Bot
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
