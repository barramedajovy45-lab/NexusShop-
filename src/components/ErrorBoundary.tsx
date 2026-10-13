import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Trash2, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Nexus Shop Uncaught Exception:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Optional client error telemetry push
    try {
      fetch('/api/telemetry/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack?.slice(0, 1500),
          componentStack: errorInfo.componentStack?.slice(0, 1500),
          userAgent: navigator.userAgent,
          currentUrl: window.location.href,
        }),
      }).catch(() => {});
    } catch {}
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear potentially corrupted cached state
      localStorage.removeItem('nexus_escrow_orders');
      localStorage.removeItem('nexus_notifications_history');
      localStorage.removeItem('nexus_daily_missions_data');
      localStorage.removeItem('nexus_active_theme');
      localStorage.removeItem('nexus_checkout_auto_draft_v1');
      localStorage.removeItem('nexus_app_settings');
    } catch {}
    window.location.reload();
  };

  private handleRetryState = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleCopyDiagnostic = () => {
    const { error, errorInfo } = this.state;
    const diag = [
      `Nexus Shop Crash Diagnostic Report`,
      `Time: ${new Date().toISOString()}`,
      `Error: ${error?.name}: ${error?.message}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Stack Trace:\n${error?.stack || 'No stack trace'}`,
      `Component Stack:\n${errorInfo?.componentStack || 'No component stack'}`,
    ].join('\n\n');

    navigator.clipboard.writeText(diag).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, copied } = this.state;

      return (
        <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gradient-to-b from-slate-900 to-[#0b101c] border border-cyan-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/40 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-white">Nexus Shop Auto-Recovery</h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/50 font-bold">
                    SHIELD ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  An unexpected UI exception was safely intercepted. Your escrow deposits, payment authorizations, and account credentials remain 100% secure in the Aegis Vault.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 font-mono text-xs">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Intercepted Error:</div>
              <div className="text-rose-400 font-bold break-all">
                {error?.message || 'Unexpected application state occurred.'}
              </div>
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={this.handleRetryState}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Resume & Retry</span>
              </button>

              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                title="Clears corrupted browser cache while preserving account security"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Clear Cache & Restart</span>
              </button>

              <button
                onClick={this.handleCopyDiagnostic}
                className="w-full sm:w-auto py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Copy technical diagnostic report for Aegis Support"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? 'Copied!' : 'Copy Logs'}</span>
              </button>
            </div>

            {/* Reassurance Footer */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Mobile Legends: Bang Bang Verified Marketplace</span>
              <span className="font-mono text-cyan-400">Aegis Protection: 100% OK</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
