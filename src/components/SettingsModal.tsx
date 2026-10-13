import React, { useState } from 'react';
import {
  X,
  Settings,
  Sliders,
  SlidersHorizontal,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  ShieldCheck,
  Lock,
  Globe,
  Coins,
  Palette,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Zap,
  Smartphone,
  CreditCard,
  Laptop,
  Check,
  AlertTriangle,
  Play,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { AppSettings, Currency, PaymentMethod, BackgroundEffect, EffectIntensity, GlowColor, ThemeArchetype } from '../types';
import { CURRENCY_RATES } from '../utils/formatters';
import { detectLocaleCurrency } from '../utils/localeCurrency';
import {
  playOrderNotificationSound,
  playPriceDropSound,
  playEscrowLockSound,
  playDiamondChimeSound,
  playCopySuccessSound,
  playUiClickSound,
  playMissionClaimSound,
  playReferralBonusSound,
  playDiamondDetectedSound,
  setAudioMasterVolume,
  setAudioMasterEnabled,
  playVolumePreviewChime,
} from '../utils/audio';
import { SettingsFAQSection } from './SettingsFAQSection';
import { LanguageToggle } from './LanguageToggle';
import { useI18n } from '../i18n';
import { SupportedLanguage } from '../i18n/types';
import { APP_VERSION } from '../utils/version';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onResetToDefaults: () => void;
  onClearAllCache?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onOpenSupportTicket?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetToDefaults,
  onClearAllCache,
  onNavigateToTab,
  onOpenSupportTicket,
}) => {
  const { t, setLanguage: setGlobalLanguage, language: currentGlobalLanguage } = useI18n();

  // Local working copy of settings
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });
  const [activeTab, setActiveTab] = useState<'general' | 'theme_effects' | 'audio_notify' | 'escrow_checkout' | 'privacy_security' | 'faq'>('general');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...settings });
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key === 'soundVolume') {
      setAudioMasterVolume(value as number);
    }
    if (key === 'soundEnabled') {
      setAudioMasterEnabled(value as boolean);
    }
  };

  const handleUpdateVolume = (newVol: number, playPreview: boolean = true) => {
    const clamped = Math.max(0, Math.min(100, Math.round(newVol)));
    const shouldEnable = clamped > 0;
    setLocalSettings((prev) => ({
      ...prev,
      soundVolume: clamped,
      soundEnabled: shouldEnable ? (prev.soundEnabled || true) : false,
    }));
    setAudioMasterVolume(clamped);
    setAudioMasterEnabled(shouldEnable ? (localSettings.soundEnabled || true) : false);

    if (shouldEnable && playPreview) {
      playVolumePreviewChime(clamped);
    }
  };

  const handleSave = () => {
    if (localSettings.language && localSettings.language !== currentGlobalLanguage) {
      setGlobalLanguage(localSettings.language);
    }
    onSaveSettings(localSettings);
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 600);
  };

  const handleTestAudio = (type: string) => {
    switch (type) {
      case 'completed':
        playOrderNotificationSound('completed');
        break;
      case 'price_drop':
        playPriceDropSound();
        break;
      case 'escrow_lock':
        playEscrowLockSound();
        break;
      case 'diamond_chime':
        playDiamondChimeSound();
        break;
      case 'copy_success':
        playCopySuccessSound();
        break;
      case 'mission_claim':
        playMissionClaimSound();
        break;
      case 'referral_fanfare':
        playReferralBonusSound();
        break;
      case 'radar_detect':
        playDiamondDetectedSound();
        break;
      case 'click':
        playUiClickSound();
        break;
      default:
        playOrderNotificationSound('completed');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 id="settings-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('settings.title')}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  v{APP_VERSION}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-3 sm:px-5 gap-1 sm:gap-2 overflow-x-auto text-xs font-medium scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{t('settings.tabs.general')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme_effects')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'theme_effects'
                ? 'border-purple-400 text-purple-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Themes & Background FX</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio_notify')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'audio_notify'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('escrow_checkout')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'escrow_checkout'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('settings.tabs.escrow')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy_security')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'privacy_security'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t('settings.tabs.privacy')}</span>
          </button>

          <button
            type="button"
            id="settings-tab-faq"
            onClick={() => setActiveTab('faq')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'faq'
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('settings.tabs.faq')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Escrow & Delays
            </span>
          </button>
        </div>

        {/* Modal Body with scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: General & Display */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Preferred Currency */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-cyan-400" />
                    <span>Default Market Currency</span>
                  </label>
                  <span className="text-[11px] font-mono text-cyan-400">
                    Live Rates Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Select your country and primary currency for diamond package pricing, checkout, and P2P exchange listings. You can override your browser's auto-detected locale currency at any time.
                </p>

                {(() => {
                  const detected = detectLocaleCurrency();
                  if (!detected) return null;
                  const isAlreadyActive = localSettings.currency === detected.currency;
                  return (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/40 border border-cyan-700/40 text-xs text-slate-300">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate text-[11px]">
                          Browser detected: <strong className="text-white">{detected.flag} {detected.country} ({detected.symbol} {detected.currency})</strong>
                        </span>
                      </div>
                      {!isAlreadyActive && (
                        <button
                          type="button"
                          onClick={() => updateSetting('currency', detected.currency)}
                          className="text-[10px] font-semibold text-cyan-300 hover:text-white bg-cyan-900/60 hover:bg-cyan-800 px-2 py-0.5 rounded border border-cyan-600/40 shrink-0 transition-colors cursor-pointer"
                        >
                          Use Detected
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {(Object.keys(CURRENCY_RATES) as Currency[]).map((cur) => {
                    const isSelected = localSettings.currency === cur;
                    const info = CURRENCY_RATES[cur];
                    return (
                      <button
                        key={cur}
                        type="button"
                        onClick={() => updateSetting('currency', cur)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/70 border-cyan-500 text-white shadow-sm shadow-cyan-900/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base select-none">{info.flag}</span>
                            <span className="font-bold text-xs text-white">{cur}</span>
                          </div>
                          <span className="text-xs font-mono text-cyan-400 font-semibold">{info.symbol}</span>
                        </div>
                        <span className="text-[11px] text-slate-200 block truncate font-medium">{info.country}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Archetype */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>Color Theme Atmosphere</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('theme_effects')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Advanced FX Studio</span>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Choose your base dark workspace atmosphere for nocturnal MLBB top-up sessions.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'dark', name: 'Slate Abyss', color: '#090d16', accent: '#06b6d4', desc: 'Default charcoal & cyan' },
                    { id: 'midnight', name: 'Midnight Deep', color: '#050814', accent: '#6366f1', desc: 'Indigo esports navy' },
                    { id: 'amoled', name: 'AMOLED Black', color: '#000000', accent: '#e2e8f0', desc: 'Pure 100% pitch black' },
                    { id: 'white', name: 'Frost White', color: '#f8fafc', accent: '#0ea5e9', desc: 'Crisp light & daylight mode' },
                    { id: 'mythic_gold', name: 'Mythic Gold', color: '#0d0a04', accent: '#f59e0b', desc: 'Imperial obsidian & gold' },
                    { id: 'neon_emerald', name: 'Venom Serpent', color: '#040e08', accent: '#10b981', desc: 'Deep toxic forest & green' },
                    { id: 'crimson_void', name: 'Crimson Void', color: '#0e0508', accent: '#f43f5e', desc: 'Obsidian ruby & crimson' },
                  ].map((th) => {
                    const isSelected = localSettings.theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => updateSetting('theme', th.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/20"
                              style={{ backgroundColor: th.accent }}
                            />
                            <span className="font-bold text-xs">{th.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight">{th.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regional Language Multi-Language Switcher */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <LanguageToggle
                  currentLanguage={(localSettings.language as SupportedLanguage) || (currentGlobalLanguage as SupportedLanguage) || 'en'}
                  onLanguageChange={(newLang) => {
                    updateSetting('language', newLang);
                    setGlobalLanguage(newLang);
                  }}
                  onCurrencySuggested={(recCurrency) => {
                    if (localSettings.currency !== recCurrency) {
                      updateSetting('currency', recCurrency);
                    }
                  }}
                />
              </div>

              {/* Compact Density View */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Compact Table & Cards Layout</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reduces vertical padding across package cards and order tables for dense data view.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.compactMode}
                    onChange={(e) => updateSetting('compactMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
                </label>
              </div>

              {/* Master Volume Slider Quick Access */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Master Audio Volume & Alert Intensity</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audio_notify')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <span>Sound & Chimes Studio</span>
                    <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Adjust the loudness and intensity of tactile button clicks, diamond chimes, and real-time escrow alerts.
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateVolume(0)}
                    className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Mute Volume"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={localSettings.soundEnabled ? localSettings.soundVolume : 0}
                      onChange={(e) => handleUpdateVolume(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <span className="font-mono text-xs font-bold text-cyan-400 w-12 text-right shrink-0">
                    {localSettings.soundEnabled ? `${localSettings.soundVolume}%` : 'Muted'}
                  </span>

                  <button
                    type="button"
                    onClick={() => playVolumePreviewChime(localSettings.soundVolume)}
                    disabled={!localSettings.soundEnabled || localSettings.soundVolume === 0}
                    className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/50 text-[10px] font-mono flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    title="Test chime"
                  >
                    <Play className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Test</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Themes & Background FX */}
          {activeTab === 'theme_effects' && (
            <div className="space-y-5">
              {/* Live Interactive Preview Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Atmospheric Terminal Preview
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Real-Time Lighting</span>
                </div>

                {/* Simulated Mini-Stage with actual selected theme, effect & color */}
                <div
                  className={`relative h-44 rounded-xl border border-slate-700/80 overflow-hidden flex items-center justify-center p-4 transition-colors duration-500 ${
                    localSettings.theme === 'amoled'
                      ? 'bg-black'
                      : localSettings.theme === 'midnight'
                      ? 'bg-[#050814]'
                      : localSettings.theme === 'mythic_gold'
                      ? 'bg-[#0d0a04]'
                      : localSettings.theme === 'neon_emerald'
                      ? 'bg-[#040e08]'
                      : localSettings.theme === 'crimson_void'
                      ? 'bg-[#0e0508]'
                      : 'bg-[#090d16]'
                  }`}
                >
                  {/* Simulated Ambient Effect in Preview */}
                  {localSettings.bgEffect === 'aurora_mesh' && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div
                        className={`absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full blur-2xl ${
                          localSettings.bgAnimateEffects ? 'animate-pulse' : ''
                        }`}
                        style={{
                          backgroundColor:
                            localSettings.bgGlowColor === 'cyan'
                              ? '#06b6d4'
                              : localSettings.bgGlowColor === 'purple'
                              ? '#a855f7'
                              : localSettings.bgGlowColor === 'emerald'
                              ? '#10b981'
                              : localSettings.bgGlowColor === 'amber'
                              ? '#f59e0b'
                              : localSettings.bgGlowColor === 'rose'
                              ? '#f43f5e'
                              : '#3b82f6',
                          opacity: localSettings.bgEffectIntensity === 'subtle' ? 0.2 : localSettings.bgEffectIntensity === 'vibrant' ? 0.6 : 0.35,
                        }}
                      />
                      <div
                        className="absolute bottom-0 right-4 w-32 h-24 rounded-full blur-2xl"
                        style={{
                          backgroundColor:
                            localSettings.bgGlowColor === 'cyan'
                              ? '#0ea5e9'
                              : localSettings.bgGlowColor === 'purple'
                              ? '#8b5cf6'
                              : localSettings.bgGlowColor === 'emerald'
                              ? '#14b8a6'
                              : localSettings.bgGlowColor === 'amber'
                              ? '#eab308'
                              : localSettings.bgGlowColor === 'rose'
                              ? '#ec4899'
                              : '#2563eb',
                          opacity: localSettings.bgEffectIntensity === 'subtle' ? 0.15 : localSettings.bgEffectIntensity === 'vibrant' ? 0.5 : 0.3,
                        }}
                      />
                    </div>
                  )}

                  {localSettings.bgEffect === 'cyber_grid' && (
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, ${
                              localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6'
                            } 1px, transparent 1px),
                            linear-gradient(to bottom, ${
                              localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6'
                            } 1px, transparent 1px)
                          `,
                          backgroundSize: '24px 24px',
                          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                        }}
                      />
                    </div>
                  )}

                  {localSettings.bgEffect === 'stellar_particles' && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[
                        { t: '15%', l: '20%', s: 3 },
                        { t: '25%', l: '75%', s: 4 },
                        { t: '65%', l: '15%', s: 3 },
                        { t: '75%', l: '80%', s: 4 },
                        { t: '30%', l: '45%', s: 2 },
                        { t: '80%', l: '50%', s: 3 },
                      ].map((star, i) => (
                        <div
                          key={i}
                          className={`absolute rounded-full ${localSettings.bgAnimateEffects ? 'animate-pulse' : ''}`}
                          style={{
                            top: star.t,
                            left: star.l,
                            width: `${star.s}px`,
                            height: `${star.s}px`,
                            backgroundColor:
                              localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6',
                            boxShadow: `0 0 6px ${
                              localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6'
                            }`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {localSettings.bgEffect === 'pulse_vortex' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        className={`w-32 h-32 rounded-full border border-dashed ${
                          localSettings.bgAnimateEffects ? 'animate-spin-slow' : ''
                        }`}
                        style={{
                          borderColor:
                            localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6',
                          opacity: 0.4,
                        }}
                      />
                      <div
                        className="absolute w-20 h-20 rounded-full border"
                        style={{
                          borderColor:
                            localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6',
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  )}

                  {localSettings.bgEffect === 'minimal_clean' && (
                    <div
                      className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-28 rounded-full blur-2xl pointer-events-none"
                      style={{
                        backgroundColor:
                          localSettings.bgGlowColor === 'cyan' ? '#06b6d4' : localSettings.bgGlowColor === 'purple' ? '#a855f7' : localSettings.bgGlowColor === 'emerald' ? '#10b981' : localSettings.bgGlowColor === 'amber' ? '#f59e0b' : localSettings.bgGlowColor === 'rose' ? '#f43f5e' : '#3b82f6',
                        opacity: 0.25,
                      }}
                    />
                  )}

                  {/* Simulated Mini Top-Up Card */}
                  <div className="relative z-10 w-full max-w-xs bg-slate-900/90 border border-slate-700/90 rounded-xl p-3 shadow-lg flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shadow-inner"
                        style={{
                          backgroundColor:
                            localSettings.bgGlowColor === 'cyan'
                              ? 'rgba(6, 182, 212, 0.15)'
                              : localSettings.bgGlowColor === 'purple'
                              ? 'rgba(168, 85, 247, 0.15)'
                              : localSettings.bgGlowColor === 'emerald'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : localSettings.bgGlowColor === 'amber'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : localSettings.bgGlowColor === 'rose'
                              ? 'rgba(244, 63, 94, 0.15)'
                              : 'rgba(59, 130, 246, 0.15)',
                          color:
                            localSettings.bgGlowColor === 'cyan'
                              ? '#06b6d4'
                              : localSettings.bgGlowColor === 'purple'
                              ? '#a855f7'
                              : localSettings.bgGlowColor === 'emerald'
                              ? '#10b981'
                              : localSettings.bgGlowColor === 'amber'
                              ? '#f59e0b'
                              : localSettings.bgGlowColor === 'rose'
                              ? '#f43f5e'
                              : '#3b82f6',
                        }}
                      >
                        💎
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1">
                          <span>296 Diamonds</span>
                        </div>
                        <div className="text-[10px] text-slate-400">Mobile Legends SEA</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white shadow-sm cursor-default"
                      style={{
                        backgroundColor:
                          localSettings.bgGlowColor === 'cyan'
                            ? '#0891b2'
                            : localSettings.bgGlowColor === 'purple'
                            ? '#9333ea'
                            : localSettings.bgGlowColor === 'emerald'
                            ? '#059669'
                            : localSettings.bgGlowColor === 'amber'
                            ? '#d97706'
                            : localSettings.bgGlowColor === 'rose'
                            ? '#e11d48'
                            : '#2563eb',
                      }}
                    >
                      Instant Buy
                    </button>
                  </div>
                </div>

                {/* Configuration Specs Bar */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Theme: <strong className="text-white capitalize">{localSettings.theme.replace('_', ' ')}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Effect: <strong className="text-white capitalize">{localSettings.bgEffect.replace('_', ' ')}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Glow: <strong className="text-white capitalize">{localSettings.bgGlowColor}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Intensity: <strong className="text-white capitalize">{localSettings.bgEffectIntensity}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                    Motion: <strong className="text-white">{localSettings.bgAnimateEffects ? 'Active' : 'Static'}</strong>
                  </span>
                </div>
              </div>

              {/* 1-Tap Aesthetic Preset Bundles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>One-Tap Atmosphere Kits</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Curated Design Combinations</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {
                      name: 'Mythic Gold Glory',
                      badge: 'VIP Top-Up',
                      theme: 'mythic_gold',
                      bgEffect: 'aurora_mesh',
                      bgGlowColor: 'amber',
                      intensity: 'balanced',
                      colorHex: '#f59e0b',
                    },
                    {
                      name: 'Cyber Grid Runner',
                      badge: 'High-Tech',
                      theme: 'midnight',
                      bgEffect: 'cyber_grid',
                      bgGlowColor: 'cyan',
                      intensity: 'vibrant',
                      colorHex: '#06b6d4',
                    },
                    {
                      name: 'Venom Viper',
                      badge: 'Toxic Jade',
                      theme: 'neon_emerald',
                      bgEffect: 'pulse_vortex',
                      bgGlowColor: 'emerald',
                      intensity: 'balanced',
                      colorHex: '#10b981',
                    },
                    {
                      name: 'Bloodlust Crimson',
                      badge: 'Ranked War',
                      theme: 'crimson_void',
                      bgEffect: 'stellar_particles',
                      bgGlowColor: 'rose',
                      intensity: 'balanced',
                      colorHex: '#f43f5e',
                    },
                    {
                      name: 'Aether Nebula',
                      badge: 'Mystic',
                      theme: 'midnight',
                      bgEffect: 'aurora_mesh',
                      bgGlowColor: 'purple',
                      intensity: 'balanced',
                      colorHex: '#a855f7',
                    },
                    {
                      name: 'AMOLED Stealth',
                      badge: 'Zero Glow',
                      theme: 'amoled',
                      bgEffect: 'minimal_clean',
                      bgGlowColor: 'blue',
                      intensity: 'subtle',
                      colorHex: '#64748b',
                    },
                  ].map((kit, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setLocalSettings((prev) => ({
                          ...prev,
                          theme: kit.theme as ThemeArchetype,
                          bgEffect: kit.bgEffect as BackgroundEffect,
                          bgGlowColor: kit.bgGlowColor as GlowColor,
                          bgEffectIntensity: kit.intensity as EffectIntensity,
                        }));
                      }}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900 transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                            style={{ backgroundColor: kit.colorHex }}
                          />
                          <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                            {kit.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{kit.badge}</span>
                        <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform">Apply →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Visual Effect Selector */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Background Effect Pattern</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Rendering Engine</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'aurora_mesh',
                      title: 'Aurora Mesh',
                      desc: 'Multi-point ethereal floating glow orbs',
                      icon: '✨',
                    },
                    {
                      id: 'cyber_grid',
                      title: 'Cyber Grid',
                      desc: 'Perspective sci-fi grid floor with horizon beam',
                      icon: '📐',
                    },
                    {
                      id: 'stellar_particles',
                      title: 'Stellar Embers',
                      desc: 'Twinkling diamond starfield & galaxy nebula',
                      icon: '🌌',
                    },
                    {
                      id: 'pulse_vortex',
                      title: 'Pulse Vortex',
                      desc: 'Concentric sonar energy rings from vault',
                      icon: '🎯',
                    },
                    {
                      id: 'minimal_clean',
                      title: 'Clean Spotlight',
                      desc: 'Soft static top vignette lightcone',
                      icon: '💡',
                    },
                    {
                      id: 'none',
                      title: 'Flat Solid',
                      desc: 'Pure background color without glow FX',
                      icon: '⬛',
                    },
                  ].map((eff) => {
                    const isSelected = localSettings.bgEffect === eff.id;
                    return (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => updateSetting('bgEffect', eff.id as BackgroundEffect)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/40'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{eff.icon}</span>
                            <span className="font-bold text-xs">{eff.title}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-tight">{eff.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Glow Color Palette */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span>Accent Glow Illumination Color</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Radiance Tone</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'cyan', name: 'Cyber Cyan', hex: '#06b6d4', ring: 'ring-cyan-400' },
                    { id: 'purple', name: 'Aether Purple', hex: '#a855f7', ring: 'ring-purple-400' },
                    { id: 'emerald', name: 'Venom Emerald', hex: '#10b981', ring: 'ring-emerald-400' },
                    { id: 'amber', name: 'Mythic Gold', hex: '#f59e0b', ring: 'ring-amber-400' },
                    { id: 'rose', name: 'Crimson Ruby', hex: '#f43f5e', ring: 'ring-rose-400' },
                    { id: 'blue', name: 'Sapphire Blue', hex: '#3b82f6', ring: 'ring-blue-400' },
                  ].map((col) => {
                    const isSelected = localSettings.bgGlowColor === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => updateSetting('bgGlowColor', col.id as GlowColor)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-600 ring-2 ring-offset-2 ring-offset-slate-950 ' + col.ring
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full shadow-md"
                            style={{
                              backgroundColor: col.hex,
                              boxShadow: `0 0 10px ${col.hex}`,
                            }}
                          />
                          <span className="text-xs font-bold text-white">{col.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Glow Intensity & Motion Animation Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Intensity */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Effect Glow Intensity</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">Control illumination brightness and contrast</p>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { id: 'subtle', name: 'Subtle', desc: '12% Low' },
                      { id: 'balanced', name: 'Balanced', desc: '25% Standard' },
                      { id: 'vibrant', name: 'Vibrant', desc: '45% High' },
                    ].map((lvl) => {
                      const isSelected = localSettings.bgEffectIntensity === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => updateSetting('bgEffectIntensity', lvl.id as EffectIntensity)}
                          className={`py-2 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/50 border-cyan-400 text-white font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <div className="text-xs">{lvl.name}</div>
                          <div className="text-[9px] text-slate-400">{lvl.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Ambient Drift */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                      <span>Dynamic Ambient Animation</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Enables continuous floating orbs, radar pulse rings, and twinkling star animations.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs text-slate-300 font-medium">
                      {localSettings.bgAnimateEffects ? 'Smooth Motion Active' : 'Static (Power Saver)'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.bgAnimateEffects}
                        onChange={(e) => updateSetting('bgAnimateEffects', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Notifications */}
          {activeTab === 'audio_notify' && (
            <div className="space-y-4">
              {/* Floating Notifications (Toasts) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        In-App Real-Time Toast Notifications
                      </div>
                      <p className="text-xs text-slate-400">
                        Shows non-blocking alert cards at the bottom right corner of the screen.
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.enableToasts}
                      onChange={(e) => updateSetting('enableToasts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500" />
                  </label>
                </div>

                {localSettings.enableToasts && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <label className="block text-xs text-slate-400">
                      Auto-Dismiss Toasts Delay:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { sec: 4, label: '4 Seconds' },
                        { sec: 6, label: '6 Seconds (Normal)' },
                        { sec: 10, label: '10 Seconds' },
                        { sec: 0, label: 'Manual Only' },
                      ].map((dur) => (
                        <button
                          key={dur.sec}
                          type="button"
                          onClick={() => updateSetting('autoDismissToastsSeconds', dur.sec)}
                          className={`p-2 rounded-lg border text-xs text-center transition-colors cursor-pointer ${
                            localSettings.autoDismissToastsSeconds === dur.sec
                              ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {dur.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Filter Toggles */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">
                  Notification Channel Subscriptions
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Notify on P2P Diamond Price Drops</span>
                    <input
                      type="checkbox"
                      checked={localSettings.notifyOnPriceDrops}
                      onChange={(e) => updateSetting('notifyOnPriceDrops', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Notify on Escrow Milestones (Locked, Verified, Released)</span>
                    <input
                      type="checkbox"
                      checked={localSettings.notifyOnEscrowStatusChange}
                      onChange={(e) => updateSetting('notifyOnEscrowStatusChange', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Notify on Live Seller Chat Messages</span>
                    <input
                      type="checkbox"
                      checked={localSettings.notifyOnChatMessages}
                      onChange={(e) => updateSetting('notifyOnChatMessages', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Escrow & Checkout Defaults */}
          {activeTab === 'escrow_checkout' && (
            <div className="space-y-4">
              {/* Default Payment Method */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-400" />
                    <span>Default Payment Channel (Trusted Third-Party Gateways)</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    Stripe · Xendit · Midtrans
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pre-selects your preferred payment method in checkout. All channels use licensed third-party payment gateways (<strong className="text-slate-200">Stripe, Xendit, Midtrans</strong>) with buyer protection—never personal bank accounts or personal crypto wallets.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { id: 'gcash', name: 'GCash (Philippines)', badge: '1. Digital Wallet · Xendit' },
                    { id: 'maya', name: 'Maya / PayMaya (PH)', badge: '1. Digital Wallet · Xendit' },
                    { id: 'dana', name: 'DANA / OVO / GoPay (ID)', badge: '1. Digital Wallet · Midtrans' },
                    { id: 'google_pay', name: 'Google Pay / Apple Pay', badge: '1. Digital Wallet · Stripe' },
                    { id: 'paypal', name: 'PayPal', badge: '1. Global Buyer Protection' },
                    { id: 'bank_transfer', name: 'Bank Transfer & Virtual Acc', badge: '2. Direct Bank / VA · Xendit' },
                    { id: 'qris', name: 'Country Local E-Wallets', badge: '3. QRIS / TNG / GrabPay' },
                    { id: 'card', name: 'Visa & Mastercard', badge: '4. Credit/Debit Card · Stripe' },
                  ].map((pm) => {
                    const isSelected = localSettings.defaultPaymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => updateSetting('defaultPaymentMethod', pm.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/50 border-cyan-500 text-white'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs block">{pm.name}</span>
                        <span className="text-[10px] text-slate-400 block">{pm.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-200">
                  Transaction Automation & Convenience
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-200 font-medium">
                        Auto-fill Linked MLBB Game Account
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Automatically populates your saved User ID & Zone ID in checkout.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.autoFillLinkedMlbbId}
                      onChange={(e) => updateSetting('autoFillLinkedMlbbId', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-200 font-medium">
                        Auto-Open Live Tracker on Order Placement
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Immediately launches the real-time escrow tracker modal after authorizing payment.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.autoOpenTrackerOnOrder}
                      onChange={(e) => updateSetting('autoOpenTrackerOnOrder', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-200 font-medium">
                        1-Click Quick Purchase Shortcut
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Enables quick top-up buttons without multiple re-confirmation dialogs.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.fastCheckoutOneClick}
                      onChange={(e) => updateSetting('fastCheckoutOneClick', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>24-Hour Buyer Auto-Pay Protocol</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                          24H AUTO-SETTLE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Automatically executes payment and settles escrow if the buyer does not manually pay or confirm within 24 hours.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={localSettings.autoPay24hEnabled ?? true}
                      onChange={(e) => updateSetting('autoPay24hEnabled', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Quick Link Banner */}
              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-slate-300">
                    Questions about escrow vault release, 15-minute inspection timers, or delivery delays?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className="px-2.5 py-1 text-xs font-semibold text-cyan-300 bg-cyan-900/40 hover:bg-cyan-800/50 border border-cyan-700/60 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  View FAQ →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: Privacy & Safety */}
          {activeTab === 'privacy_security' && (
            <div className="space-y-4">
              {/* Anonymize In-Game Name */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {localSettings.privacyMaskIgn ? (
                      <EyeOff className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Privacy Shield: Mask In-Game Name on Public Tickers
                      </div>
                      <p className="text-xs text-slate-400">
                        Replaces middle characters in your IGN with asterisks on public order feeds (e.g.{' '}
                        <span className="font-mono text-cyan-300">VΞN***99</span>).
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={localSettings.privacyMaskIgn}
                    onChange={(e) => updateSetting('privacyMaskIgn', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 2FA on Disputes */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        Mandate 2FA for Escrow Dispute Filing
                      </div>
                      <p className="text-xs text-slate-400">
                        Requires SMS or authenticator passkey before freezing seller payout balances.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={localSettings.require2FAForDisputes}
                    onChange={(e) => updateSetting('require2FAForDisputes', e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Session & Encryption Info */}
              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Aegis Cryptographic Escrow Vault v3.4</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400">Protocol:</span> TLS 1.3 · AES-256
                  </div>
                  <div>
                    <span className="text-slate-400">Smart Escrow:</span> Moonton API v2.9
                  </div>
                  <div>
                    <span className="text-slate-400">Session ID:</span> nxs_84f9_2026_09
                  </div>
                  <div>
                    <span className="text-slate-400">Fraud Protection:</span> Active
                  </div>
                </div>
              </div>

              {/* Danger Zone: Clear Local Data */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Data Cache & Local Storage</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Clear cached price alerts, session history, and reset to initial app demonstration defaults.
                    </p>
                  </div>

                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-300 border border-rose-800 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Cache
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onClearAllCache) onClearAllCache();
                          setShowClearConfirm(false);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Confirm Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Security & Verification FAQ Quick Link */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300">
                    Learn how our strict zero-password policy and Moonton IGN verification keep your MLBB account 100% safe.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-700/60 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Security FAQ →
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Support FAQ & Guides */}
          {activeTab === 'faq' && (
            <SettingsFAQSection
              onNavigateToTab={(tab) => {
                if (onNavigateToTab) {
                  onNavigateToTab(tab);
                  onClose();
                }
              }}
              onOpenSupportTicket={onOpenSupportTicket}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800/90 bg-slate-950/80">
          <button
            type="button"
            onClick={() => {
              onResetToDefaults();
              setLocalSettings({ ...settings });
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('common.resetDefaults')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {saveSuccessMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>{t('common.saved')}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>{t('common.save')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
