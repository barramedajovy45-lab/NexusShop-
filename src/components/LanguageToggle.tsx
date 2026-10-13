import React from 'react';
import { Globe, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useI18n, AVAILABLE_LANGUAGES } from '../i18n';
import { SupportedLanguage } from '../i18n/types';
import { Currency } from '../types';

interface LanguageToggleProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onCurrencySuggested?: (currency: Currency) => void;
  compact?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  currentLanguage,
  onLanguageChange,
  onCurrencySuggested,
  compact = false,
}) => {
  const { t } = useI18n();

  const handleSelectLanguage = (langCode: SupportedLanguage, recommendedCurrency: Currency) => {
    onLanguageChange(langCode);
    if (onCurrencySuggested) {
      onCurrencySuggested(recommendedCurrency);
    }
  };

  return (
    <div id="language-toggle-section" className="space-y-3">
      {/* Header with Title and Current Active Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t('settings.language.title')}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-semibold">
            {t('settings.language.badge')}
          </span>
        </label>

        {/* Live Active Language Pill */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <span>{t('settings.language.activeLanguage')}:</span>
          {(() => {
            const activeMeta = AVAILABLE_LANGUAGES.find((l) => l.code === currentLanguage) || AVAILABLE_LANGUAGES[0];
            return (
              <span className="font-bold text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
                <span>{activeMeta.flag}</span>
                <span>{activeMeta.nativeName}</span>
              </span>
            );
          })()}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        {t('settings.language.subtitle')}
      </p>

      {/* Interactive 4-Language Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.code;

          return (
            <button
              key={lang.code}
              type="button"
              id={`language-option-${lang.code}`}
              onClick={() => handleSelectLanguage(lang.code, lang.recommendedCurrency)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-b from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/80 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-300'
              }`}
            >
              {/* Top Row: Flag & Radio / Checkmark */}
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl shadow-sm drop-shadow">{lang.flag}</span>
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                    }`}
                  >
                    {lang.nativeName}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400'
                      : 'border border-slate-700 bg-slate-900 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>

              {/* Sub-label: English Name & Region */}
              <div className="text-[11px] text-slate-400 font-medium">
                {lang.name}
              </div>

              <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {lang.region}
              </div>

              {/* Currency Suggestion Pill */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Rec. Currency:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    isSelected
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {lang.recommendedCurrency}
                </span>
              </div>

              {/* Selected Glow Corner Dot */}
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Immediate Effect Live Notice */}
      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t('settings.language.instantSwitchNotice')}</span>
        </div>
        {(() => {
          const activeMeta = AVAILABLE_LANGUAGES.find((l) => l.code === currentLanguage) || AVAILABLE_LANGUAGES[0];
          return (
            <span className="italic text-slate-400 hidden sm:inline font-sans">
              "{activeMeta.sampleGreeting}"
            </span>
          );
        })()}
      </div>
    </div>
  );
};
