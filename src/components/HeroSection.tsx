import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Lock, Search, CheckCircle2, AlertCircle, Sparkles, RefreshCw, UserCheck, XCircle, Globe, Check, CreditCard, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { lookupOrGenerateMlbbAccount, parseCombinedMlbbInput, sanitizeMlbbId, KNOWN_MLBB_ACCOUNTS } from '../data/mockData';
import { Currency, MlbbAccount } from '../types';
import { CURRENCY_RATES } from '../utils/formatters';
import { NexusLogo } from './NexusLogo';
import { AuthorizedPartnerBadge } from './AuthorizedPartnerBadge';

interface HeroSectionProps {
  verifiedAccount: MlbbAccount | null;
  setVerifiedAccount: (acc: MlbbAccount | null) => void;
  onBrowsePackages: () => void;
  onOpenEscrowModal: () => void;
  onOpenSecurityModal?: (tab?: 'reseller' | 'cybersecurity' | 'sandbox') => void;
  currency?: Currency;
  setCurrency?: (c: Currency) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  verifiedAccount,
  setVerifiedAccount,
  onBrowsePackages,
  onOpenEscrowModal,
  onOpenSecurityModal,
  currency = 'PHP',
  setCurrency,
}) => {
  const [userIdInput, setUserIdInput] = useState(verifiedAccount?.userId || '84729103');
  const [zoneIdInput, setZoneIdInput] = useState(verifiedAccount?.zoneId || '3092');
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [selectedHeroRegion, setSelectedHeroRegion] = useState<string>('Southeast Asia');

  // Sync state if verifiedAccount prop changes externally
  useEffect(() => {
    if (verifiedAccount) {
      setUserIdInput(verifiedAccount.userId);
      setZoneIdInput(verifiedAccount.zoneId);
    }
  }, [verifiedAccount]);

  // Handle User ID change with intelligent detection of combined format like "84729103 (3092)"
  const handleUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCheckError('');
    setSuccessMessage('');

    // Check if user pasted both User ID and Zone ID in the User ID box
    const parsed = parseCombinedMlbbInput(rawVal);
    if (parsed) {
      setUserIdInput(parsed.userId);
      setZoneIdInput(parsed.zoneId);
      return;
    }

    setUserIdInput(rawVal);
  };

  // Handle Zone ID change, cleaning brackets/parentheses automatically
  const handleZoneIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCheckError('');
    setSuccessMessage('');
    // Strip parentheses or brackets if entered
    const cleaned = rawVal.replace(/[()[\]\s]/g, '');
    setZoneIdInput(cleaned);
  };

  const handleVerifyAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckError('');
    setSuccessMessage('');

    const cleanUser = sanitizeMlbbId(userIdInput);
    const cleanZone = sanitizeMlbbId(zoneIdInput);

    if (!cleanUser && !cleanZone) {
      setCheckError('Please enter your MLBB User ID and Zone ID.');
      return;
    }

    if (!cleanUser) {
      setCheckError('Please enter your MLBB User ID (e.g. 84729103).');
      return;
    }

    if (cleanUser.length < 6 || cleanUser.length > 10) {
      setCheckError(`MLBB User ID must be 6–10 numeric digits. You entered ${cleanUser.length} digit${cleanUser.length === 1 ? '' : 's'}.`);
      return;
    }

    if (!cleanZone) {
      setCheckError('Please enter your MLBB Zone ID (the 4-digit code in brackets).');
      return;
    }

    if (cleanZone.length < 3 || cleanZone.length > 5) {
      setCheckError(`Zone ID must be 3–5 digits (e.g. 3092). You entered "${cleanZone}".`);
      return;
    }

    setIsChecking(true);

    (async () => {
      try {
        // Call server-side Zod-validated MLBB role-check endpoint first
        let auditSuffix = '';
        try {
          const apiRes = await fetch('/api/security/verify-mlbb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: cleanUser, zoneId: cleanZone }),
          });
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData?.auditHash) {
              auditSuffix = ` [Zod Verified • ${apiData.auditHash}]`;
            }
          }
        } catch {
          // Graceful local fallback if server is unreachable
        }

        const acc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);
        if (!acc || !acc.ign) {
          setCheckError('Verification node could not resolve this ID combination. Please check your MLBB User ID & Zone ID in your game profile.');
          return;
        }
        setVerifiedAccount(acc);
        setUserIdInput(acc.userId);
        setZoneIdInput(acc.zoneId);
        setSuccessMessage(`Account verified! IGN: "${acc.ign}" on ${acc.serverRegion}.${auditSuffix}`);
      } catch {
        setCheckError('Verification node could not resolve this ID combination. Please double-check your MLBB User ID & Zone ID in your game profile.');
      } finally {
        setIsChecking(false);
      }
    })();
  };

  const handleSelectQuickAccount = (uid: string, zid: string) => {
    setUserIdInput(uid);
    setZoneIdInput(zid);
    setCheckError('');
    setSuccessMessage('');
    setIsChecking(true);

    setTimeout(() => {
      const acc = lookupOrGenerateMlbbAccount(uid, zid);
      setVerifiedAccount(acc);
      setSuccessMessage(`Loaded verified account: ${acc.ign}`);
      setIsChecking(false);
    }, 300);
  };

  const handleResetAccount = () => {
    setVerifiedAccount(null);
    setUserIdInput('');
    setZoneIdInput('');
    setCheckError('');
    setSuccessMessage('');
  };

  const isCurrentInputVerified =
    verifiedAccount &&
    sanitizeMlbbId(userIdInput) === verifiedAccount.userId &&
    sanitizeMlbbId(zoneIdInput) === verifiedAccount.zoneId;

  return (
    <section className="relative pt-4 pb-6 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#090d16]">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 space-y-3">
        {/* Interactive MLBB Live Account Verification Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-4 shadow-xl backdrop-blur-sm relative">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <NexusLogo size="xs" showText={false} />
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Moonton Server Gateway
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SEA Node Online (24ms)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onOpenSecurityModal && (
                <AuthorizedPartnerBadge
                  variant="navbar"
                  onClick={() => onOpenSecurityModal('reseller')}
                />
              )}
              <button
                type="button"
                onClick={onBrowsePackages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <span>Packages</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="my-2 flex items-center justify-between text-xs text-slate-300">
            <span className="truncate">Verify MLBB profile to dispatch diamonds directly:</span>
            <span className="text-[11px] font-mono text-cyan-400/90 shrink-0 ml-2 hidden sm:inline">
              e.g. 84729103 (3092)
            </span>
          </div>

          <form onSubmit={handleVerifyAccount} className="space-y-3">
            <div className="grid grid-cols-12 gap-2.5">
              <div className="col-span-7 sm:col-span-8">
                <label htmlFor="hero-mlbb-user-id" className="block text-xs font-semibold text-slate-300 mb-1">
                  User ID (Numbers)
                </label>
                <input
                  id="hero-mlbb-user-id"
                  type="text"
                  inputMode="numeric"
                  value={userIdInput}
                  onChange={handleUserIdChange}
                  placeholder="e.g. 84729103"
                  className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div className="col-span-5 sm:col-span-4">
                <label htmlFor="hero-mlbb-zone-id" className="block text-xs font-semibold text-slate-300 mb-1">
                  Zone ID (Brackets)
                </label>
                <input
                  id="hero-mlbb-zone-id"
                  type="text"
                  inputMode="numeric"
                  value={zoneIdInput}
                  onChange={handleZoneIdChange}
                  placeholder="e.g. 3092"
                  className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {checkError && (
              <div role="alert" className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-700 flex items-start gap-2 text-xs text-rose-200 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{checkError}</span>
              </div>
            )}

            {successMessage && !checkError && (
              <div role="status" className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-700 flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isChecking}
              className={`w-full min-h-[44px] py-2.5 px-4 font-bold text-xs sm:text-sm rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isCurrentInputVerified
                  ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-600/60'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400 font-extrabold shadow-lg shadow-cyan-500/20'
              } disabled:opacity-50`}
            >
              {isChecking ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Checking Moonton Server...</span>
                </>
              ) : isCurrentInputVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Account Verified · Ready for Instant Top-Up</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Validate In-Game Account</span>
                </>
              )}
            </button>
          </form>

          {/* Verified Account Card Result - Sleek & Compact 2-Row Format */}
          {verifiedAccount && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-700/60 transition-all shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-white truncate">{verifiedAccount.ign}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold shrink-0">
                    MATCH VERIFIED
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleResetAccount}
                  title="Clear verified account"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] font-mono text-slate-300">
                <span>
                  ID: <span className="text-cyan-300 font-bold">{verifiedAccount.userId}</span> ({verifiedAccount.zoneId})
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-300/90 font-medium">
                  {verifiedAccount.rank} <span className="text-slate-400 text-[10px]">Lv.{verifiedAccount.level}</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-400 text-[10px] truncate">{verifiedAccount.serverRegion}</span>
              </div>
            </div>
          )}

          {/* Quick Sample Profiles for Instant Testing - Compact Single-Line Chips */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/70">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span className="font-medium text-slate-300">Quick Test Profiles:</span>
              <span className="text-cyan-400">1-click fill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('84729103', '3092')}
                className="px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-left transition-colors text-slate-300 truncate flex items-center justify-between gap-1 cursor-pointer"
              >
                <span className="text-white font-medium truncate">VΞNØM_99</span>
                <span className="text-slate-500 text-[9px] shrink-0">PH</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('12345678', '2045')}
                className="px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-left transition-colors text-slate-300 truncate flex items-center justify-between gap-1 cursor-pointer"
              >
                <span className="text-white font-medium truncate">ChouGod</span>
                <span className="text-slate-500 text-[9px] shrink-0">ID</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('55443322', '4012')}
                className="px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-left transition-colors text-slate-300 truncate flex items-center justify-between gap-1 cursor-pointer"
              >
                <span className="text-white font-medium truncate">Lunox</span>
                <span className="text-slate-500 text-[9px] shrink-0">PH</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectQuickAccount('45678912', '3150')}
                className="px-2 py-1 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-700/60 text-left transition-colors text-slate-300 truncate flex items-center justify-between gap-1 cursor-pointer"
              >
                <span className="text-white font-medium truncate">Fanny</span>
                <span className="text-slate-500 text-[9px] shrink-0">SG</span>
              </button>
            </div>
          </div>

          {/* Security Hint & Official Authorized Partner Certificate Badge */}
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Zero-Password Policy • 100% Ban-Proof Official Supply</span>
            </span>
            {onOpenSecurityModal ? (
              <AuthorizedPartnerBadge
                variant="hero"
                onClick={() => onOpenSecurityModal('reseller')}
              />
            ) : (
              <span className="text-slate-500 font-mono text-[9px]">
                SSL Encrypted
              </span>
            )}
          </div>
        </div>

        {/* Compact Supported Countries Bar with Expandable Drawer */}
        <div className="pt-2">
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-3 backdrop-blur-sm shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-bold text-white">20+ Countries Supported</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Zero FX Markup
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">Prices:</span>
                  <span className="text-sm select-none">{CURRENCY_RATES[currency]?.flag}</span>
                  <strong className="text-white font-semibold">{CURRENCY_RATES[currency]?.country}</strong>
                  <span className="text-cyan-400 font-bold">({currency})</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllCountries(!showAllCountries)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                >
                  <span>{showAllCountries ? 'Collapse' : 'Switch'}</span>
                  {showAllCountries ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Collapsible Flag Selection */}
            {showAllCountries && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-150">
                {/* Region Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                  {[
                    { id: 'Southeast Asia', label: '🌴 Southeast Asia' },
                    { id: 'East Asia', label: '🏯 East Asia' },
                    { id: 'South Asia', label: '🏏 South Asia' },
                    { id: 'West Asia', label: '🏜️ West Asia' },
                    { id: 'Central Asia', label: '🏔️ Central Asia' },
                    { id: 'All', label: '🌏 All MLBB' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedHeroRegion(r.id)}
                      className={`px-2.5 py-1 rounded-md font-mono transition-all cursor-pointer border whitespace-nowrap ${
                        selectedHeroRegion === r.id
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-sm'
                          : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>

                {/* Filtered Country Buttons */}
                <div className="flex flex-wrap items-center gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {(Object.keys(CURRENCY_RATES) as Currency[])
                    .filter((cur) => {
                      if (selectedHeroRegion === 'All') return true;
                      return CURRENCY_RATES[cur].region === selectedHeroRegion;
                    })
                    .map((cur) => {
                      const info = CURRENCY_RATES[cur];
                      const isSelected = currency === cur;
                      return (
                        <button
                          key={cur}
                          type="button"
                          onClick={() => {
                            if (setCurrency) {
                              setCurrency(cur);
                            }
                          }}
                          title={`${info.country} (${cur} · ${info.symbol}) - ${info.mlbbLeague || info.region}`}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-white font-bold shadow-sm shadow-cyan-900/40 ring-1 ring-cyan-500/40'
                              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-sm select-none" role="img" aria-label={info.country}>
                            {info.flag}
                          </span>
                          <span>{info.country}</span>
                          <span className="text-[10px] font-mono text-cyan-400/90 font-medium">
                            {info.symbol} {cur}
                          </span>
                          {info.mlbbLeague && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono hidden md:inline">
                              {info.mlbbLeague.split(' ')[0]}
                            </span>
                          )}
                          {isSelected && <Check className="w-3 h-3 text-cyan-400 ml-0.5" />}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
