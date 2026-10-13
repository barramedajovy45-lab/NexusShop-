import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage } from '../types';
import {
  Send,
  Bot,
  Shield,
  ShieldCheck,
  User,
  Image,
  CheckCheck,
  Clock,
  Crown,
  Zap,
  AlertTriangle,
  Lock,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  Copy,
  Check
} from 'lucide-react';

interface LiveOrderChatProps {
  orderId: string;
  sellerName: string;
  sellerAvatar?: string;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUserRole?: 'buyer' | 'seller';
  onRequestExtension?: () => void;
}

type ChatFilter = 'all' | 'seller' | 'system';

// Helper to format 12-hour time: e.g. "10:42 AM"
function formatMessageTime(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '--:--';
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '--:--';
  }
}

// Helper to format full readable timestamp: e.g. "Sep 14, 2026 at 10:42:15 AM"
function formatFullDateTime(timestamp: number): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return 'N/A';
  }
}

// Helper to group by date
function getDateDividerLabel(timestamp: number): string {
  try {
    const msgDate = new Date(timestamp);
    if (isNaN(msgDate.getTime())) return 'Recent';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    return 'Recent';
  }
}

// System Message Event Type Analyzer
type SystemEventType = 'lock' | 'proof' | 'timer' | 'dispute' | 'extension' | 'generic';

function getSystemEventType(text: string): {
  type: SystemEventType;
  badgeLabel: string;
  colorTheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
    badgeText: string;
    iconColor: string;
    glow: string;
  };
  icon: React.ComponentType<{ className?: string }>;
} {
  const lower = text.toLowerCase();

  if (lower.includes('lock') || lower.includes('vault') || lower.includes('verified via')) {
    return {
      type: 'lock',
      badgeLabel: 'ESCROW VAULT SECURED',
      colorTheme: {
        bg: 'bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-slate-950/90',
        border: 'border-cyan-500/50',
        text: 'text-cyan-200',
        badgeBg: 'bg-cyan-950/90 border-cyan-500/60',
        badgeText: 'text-cyan-300',
        iconColor: 'text-cyan-400',
        glow: 'shadow-cyan-950/30',
      },
      icon: Lock,
    };
  }

  if (lower.includes('dispatched') || lower.includes('credited') || lower.includes('proof') || lower.includes('moonton') || lower.includes('delivered')) {
    return {
      type: 'proof',
      badgeLabel: 'MOONTON DISPATCH AUDIT',
      colorTheme: {
        bg: 'bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-950/90',
        border: 'border-emerald-500/50',
        text: 'text-emerald-200',
        badgeBg: 'bg-emerald-950/90 border-emerald-500/60',
        badgeText: 'text-emerald-300',
        iconColor: 'text-emerald-400',
        glow: 'shadow-emerald-950/30',
      },
      icon: Zap,
    };
  }

  if (lower.includes('timer') || lower.includes('inspection') || lower.includes('countdown') || lower.includes('15-minute')) {
    return {
      type: 'timer',
      badgeLabel: 'INSPECTION WINDOW COUNTDOWN',
      colorTheme: {
        bg: 'bg-gradient-to-r from-amber-950/40 via-slate-900/80 to-slate-950/90',
        border: 'border-amber-500/50',
        text: 'text-amber-200',
        badgeBg: 'bg-amber-950/90 border-amber-500/60',
        badgeText: 'text-amber-300',
        iconColor: 'text-amber-400',
        glow: 'shadow-amber-950/30',
      },
      icon: Clock,
    };
  }

  if (lower.includes('cancelled') || lower.includes('dispute') || lower.includes('refund')) {
    return {
      type: 'dispute',
      badgeLabel: 'ESCROW RESOLUTION ALERT',
      colorTheme: {
        bg: 'bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-950/90',
        border: 'border-rose-500/50',
        text: 'text-rose-200',
        badgeBg: 'bg-rose-950/90 border-rose-500/60',
        badgeText: 'text-rose-300',
        iconColor: 'text-rose-400',
        glow: 'shadow-rose-950/30',
      },
      icon: AlertTriangle,
    };
  }

  if (lower.includes('extension') || lower.includes('+24h')) {
    return {
      type: 'extension',
      badgeLabel: 'PROTECTION EXTENSION ACTIVE',
      colorTheme: {
        bg: 'bg-gradient-to-r from-blue-950/40 via-slate-900/80 to-slate-950/90',
        border: 'border-blue-500/50',
        text: 'text-blue-200',
        badgeBg: 'bg-blue-950/90 border-blue-500/60',
        badgeText: 'text-blue-300',
        iconColor: 'text-blue-400',
        glow: 'shadow-blue-950/30',
      },
      icon: Clock,
    };
  }

  return {
    type: 'generic',
    badgeLabel: 'ESCROW SYSTEM EVENT',
    colorTheme: {
      bg: 'bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90',
      border: 'border-slate-700',
      text: 'text-slate-300',
      badgeBg: 'bg-slate-800 border-slate-700',
      badgeText: 'text-slate-300',
      iconColor: 'text-cyan-400',
      glow: 'shadow-slate-950/30',
    },
    icon: Bot,
  };
}

export const LiveOrderChat: React.FC<LiveOrderChatProps> = ({
  orderId,
  sellerName,
  sellerAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=ApexTopUp&backgroundColor=0284c7',
  messages,
  onSendMessage,
  currentUserRole = 'buyer',
  onRequestExtension,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (text: string, id: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch {
      // Fallback or ignore clipboard permission restrictions
    }
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 1600);
  };

  const quickReplies =
    currentUserRole === 'buyer'
      ? [
          'Checking my in-game diamond balance now!',
          'Diamonds received! Releasing escrow funds now.',
          'Still waiting for in-game diamonds to reflect.',
          'Can you confirm when recharge was sent?',
        ]
      : [
          'I have dispatched diamonds to your MLBB User ID.',
          'Please restart MLBB client to refresh diamond count.',
          'Moonton proof receipt is attached above.',
          'Recharge order has been queued in the server API.',
        ];

  // Filter messages
  const filteredMessages = useMemo(() => {
    if (activeFilter === 'seller') {
      return messages.filter((m) => m.sender === 'seller' || m.sender === 'buyer');
    }
    if (activeFilter === 'system') {
      return messages.filter((m) => m.sender === 'system' || m.sender === 'escrow_arbiter');
    }
    return messages;
  }, [messages, activeFilter]);

  const systemMessagesCount = useMemo(
    () => messages.filter((m) => m.sender === 'system' || m.sender === 'escrow_arbiter').length,
    [messages]
  );
  const humanMessagesCount = useMemo(
    () => messages.filter((m) => m.sender === 'seller' || m.sender === 'buyer').length,
    [messages]
  );

  return (
    <div className="flex flex-col h-full bg-slate-950/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={sellerAvatar}
              alt={sellerName}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-amber-500/50 object-cover shadow-sm"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900"
              title="Escrow Agent Online"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white tracking-tight">
                {sellerName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 font-bold flex items-center gap-1">
                <Crown className="w-2.5 h-2.5" />
                PRO SELLER
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>Aegis Encrypted Escrow Order Channel</span>
              <span className="font-mono text-slate-500 text-[10px]">· #{orderId}</span>
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-mono">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setActiveFilter('seller')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              activeFilter === 'seller'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3 h-3" />
            Chat ({humanMessagesCount})
          </button>
          <button
            onClick={() => setActiveFilter('system')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              activeFilter === 'system'
                ? 'bg-indigo-500 text-white font-bold'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3 h-3" />
            Bot Logs ({systemMessagesCount})
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="px-4 py-2 bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border-b border-amber-900/40 text-[11px] text-amber-300 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>
            <strong>Escrow Safety Guarantee:</strong> Never share passwords, OTPs, or pay outside Aegis Vault.
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
          Moonton Ref Audited
        </span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[250px] max-h-[350px]">
        {filteredMessages.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-1">
            <Bot className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs">No messages in this filter view.</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const isSystem = msg.sender === 'system' || msg.sender === 'escrow_arbiter';
            const isMe =
              (currentUserRole === 'buyer' && msg.sender === 'buyer') ||
              (currentUserRole === 'seller' && msg.sender === 'seller');

            const timeStr = formatMessageTime(msg.timestamp);
            const fullDateStr = formatFullDateTime(msg.timestamp);

            // Date divider logic
            const prevMsg = filteredMessages[index - 1];
            const showDateDivider =
              index === 0 ||
              getDateDividerLabel(msg.timestamp) !== (prevMsg ? getDateDividerLabel(prevMsg.timestamp) : '');

            const dateDividerText = getDateDividerLabel(msg.timestamp);

            return (
              <React.Fragment key={msg.id}>
                {/* Optional Date Divider Badge */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1 shadow-sm">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {dateDividerText}
                    </span>
                  </div>
                )}

                {/* 1. DISTINCT SYSTEM / BOT MESSAGE STYLING */}
                {isSystem ? (
                  (() => {
                    const eventInfo = getSystemEventType(msg.text);
                    const EventIcon = eventInfo.icon;
                    const { colorTheme } = eventInfo;

                    return (
                      <div className="my-2.5 px-1 sm:px-3">
                        <div
                          className={`relative overflow-hidden rounded-xl border ${colorTheme.border} ${colorTheme.bg} p-3.5 shadow-lg ${colorTheme.glow} transition-all`}
                        >
                          {/* Accent Top Line */}
                          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />

                          {/* System Header with Badges & Timestamps */}
                          <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-800/80">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div
                                className={`w-5 h-5 rounded-md flex items-center justify-center bg-slate-950/80 border ${colorTheme.border} ${colorTheme.iconColor}`}
                              >
                                <EventIcon className="w-3 h-3" />
                              </div>

                              <span
                                className={`text-[10px] font-mono font-black tracking-wider uppercase px-2 py-0.5 rounded border ${colorTheme.badgeBg} ${colorTheme.badgeText}`}
                              >
                                {eventInfo.badgeLabel}
                              </span>

                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-950/90 text-slate-400 border border-slate-800">
                                {msg.senderName}
                              </span>
                            </div>

                            {/* Prominent System Message Timestamp */}
                            <div
                              className="flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 shrink-0"
                              title={`Verified Event Timestamp: ${fullDateStr}`}
                            >
                              <Clock className="w-3 h-3 text-cyan-400" />
                              <span className="font-bold text-slate-300">{timeStr}</span>
                            </div>
                          </div>

                          {/* System Body Text */}
                          <p className={`text-xs ${colorTheme.text} leading-relaxed font-sans`}>
                            {msg.text}
                          </p>

                          {/* System Audit Footer */}
                          <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              Cryptographic Escrow Log
                            </span>
                            <span className="text-slate-600">ID: {msg.id}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : isMe ? (
                  /* 2. BUYER (YOU) MESSAGE STYLING */
                  <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%] ml-auto space-y-1">
                    {/* Header with Timestamp */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mr-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-semibold">
                        YOU
                      </span>
                      <span className="font-semibold text-slate-300">{msg.senderName}</span>
                      <span>·</span>
                      <span className="font-mono text-slate-400" title={fullDateStr}>
                        {timeStr}
                      </span>
                    </div>

                    {/* Bubble */}
                    <div className="rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 text-slate-950 px-4 py-2.5 shadow-md shadow-cyan-950/30 text-xs font-medium leading-relaxed">
                      <p className="whitespace-pre-wrap select-text">{msg.text}</p>

                      {/* Internal Timestamp & Delivery Double Ticks */}
                      <div
                        className="mt-1 flex items-center justify-end gap-1 text-[10px] font-mono text-cyan-950/90 font-bold"
                        title={`Sent on ${fullDateStr}`}
                      >
                        <span>{timeStr}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-950 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 3. SELLER INTERACTION MESSAGE STYLING */
                  <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[78%] mr-auto">
                    {/* Seller Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={sellerAvatar}
                        alt={msg.senderName}
                        className="w-8 h-8 rounded-xl border border-amber-500/50 bg-slate-800 object-cover shadow-sm"
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-slate-900" />
                    </div>

                    <div className="flex flex-col space-y-1 flex-1 min-w-0">
                      {/* Seller Header Info */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 ml-1">
                        <span className="font-bold text-slate-200 truncate">{msg.senderName}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 font-bold flex items-center gap-0.5 shrink-0">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          SELLER
                        </span>
                        <span>·</span>
                        <span className="font-mono text-slate-400" title={fullDateStr}>
                          {timeStr}
                        </span>
                      </div>

                      {/* Seller Message Card */}
                      <div className="rounded-2xl rounded-tl-sm bg-slate-800/95 border border-slate-700/90 p-3.5 shadow-md shadow-black/40 text-slate-100 text-xs">
                        <p className="leading-relaxed whitespace-pre-wrap select-text">{msg.text}</p>

                        {/* Special Proof Attachment Card if isProof is true */}
                        {msg.isProof && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                                <Image className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Moonton Merchant Top-Up Verified</span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                                API Confirmed
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400">
                              Direct server transaction ref was attached as evidence of recharge dispatch.
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                              <span className="text-slate-400">Ref: MOON-SEA-89241-TX8812</span>
                              <button
                                type="button"
                                onClick={() => handleCopy('MOON-SEA-89241-TX8812', msg.id)}
                                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedText === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Ref</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Individual Message Timestamp Footer */}
                        <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Verified Seller Dispatch
                          </span>
                          <span title={fullDateStr} className="text-slate-300 font-semibold">
                            {timeStr}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies & Extension Trigger */}
      <div className="px-3 py-2 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto bg-slate-900/60 no-scrollbar">
        {onRequestExtension && currentUserRole === 'buyer' && (
          <button
            type="button"
            onClick={onRequestExtension}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/60 transition-colors flex items-center gap-1 font-bold shrink-0 cursor-pointer shadow-sm"
            title="Extend escrow protection by 24 hours if seller is experiencing delays"
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Request Extension (+24h)</span>
          </button>
        )}
        {quickReplies.map((reply, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSendMessage(reply)}
            className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer shrink-0"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-800 flex items-center gap-2 bg-slate-900/95"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              currentUserRole === 'buyer'
                ? `Message seller ${sellerName} regarding your diamonds...`
                : 'Send update or recharge confirmation to buyer...'
            }
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center ${
            inputText.trim()
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
