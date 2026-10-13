import React from 'react';
import { X, Sparkles, ShieldCheck, CheckCircle2, History, Tag, Calendar, Terminal } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, APP_CODENAME, APP_CHANGELOG } from '../utils/version';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionModal: React.FC<VersionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0c1220] shadow-2xl shadow-cyan-950/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 border border-cyan-400/40">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="version-modal-title" className="text-base font-bold text-white tracking-tight">
                  Nexus Shop Platform
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 rounded-full">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Codename: <strong className="text-slate-200 font-medium">{APP_CODENAME}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {APP_BUILD_DATE}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Current Version Banner */}
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                Active Production Build: v{APP_VERSION}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are running the latest production build with official Moonton Distributor Protocol integration, Aegis Escrow Vault protection, and real-time 4-stage order progress tracking.
              </p>
            </div>
          </div>

          {/* Release Changelog */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Changelog & Release Notes</span>
            </div>

            <div className="space-y-4">
              {APP_CHANGELOG.map((rel) => (
                <div
                  key={rel.version}
                  className={`p-4 rounded-xl border transition-all ${
                    rel.isCurrent
                      ? 'bg-slate-900/90 border-cyan-500/40 shadow-sm shadow-cyan-950/40'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold font-mono ${rel.isCurrent ? 'text-white' : 'text-slate-300'}`}>
                        v{rel.version}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                        {rel.codename}
                      </span>
                      {rel.isCurrent && (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Current
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{rel.date}</span>
                  </div>

                  <ul className="space-y-1.5 mt-2.5">
                    {rel.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* System Specs */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1 text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Environment:
              </span>
              <span className="text-slate-200">Production / Multi-Region Gateway</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Client Engine:</span>
              <span className="text-slate-200">React 19 + TypeScript + Vite</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Escrow Security:</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Aegis Smart Vault v1.1.0
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Nexus Shop v{APP_VERSION}</span>
            <span className="text-slate-600">·</span>
            <span className="text-[11px] text-slate-500 font-sans">© 2026 Nexus Shop</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
