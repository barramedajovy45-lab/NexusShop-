import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Currency } from '../types';
import { CURRENCY_RATES, CurrencyInfo } from '../utils/formatters';
import { ChevronDown, Search, X, Check, Globe, Sparkles, Trophy, ShieldCheck } from 'lucide-react';

interface CountrySelectorDropdownProps {
  currency: Currency;
  onSelectCurrency: (c: Currency) => void;
  isCompact?: boolean;
  className?: string;
  onCountryChangedToast?: (info: { country: string; flag: string; symbol: string; currency: Currency }) => void;
}

export const REGION_CATEGORIES = [
  { id: 'All', label: 'All MLBB Regions', icon: '🌏' },
  { id: 'Southeast Asia', label: 'Southeast Asia', sublabel: 'MPL PH, ID, MY, SG, KH', icon: '🌴' },
  { id: 'East Asia', label: 'East Asia', sublabel: 'Mongolia, Japan, Korea, China', icon: '🏯' },
  { id: 'South Asia', label: 'South Asia', sublabel: 'Nepal, Bangladesh, India, Pak', icon: '🏏' },
  { id: 'West Asia', label: 'West Asia', sublabel: 'Saudi, UAE, Qatar, Turkey MTC', icon: '🏜️' },
  { id: 'Central Asia', label: 'Central Asia', sublabel: 'Kazakhstan, Uzbekistan, Kyrgyz', icon: '🏔️' },
  { id: 'Global', label: 'Americas & Global', sublabel: 'Brazil MPL, NA NACT', icon: '🌐' },
] as const;

export const CountrySelectorDropdown: React.FC<CountrySelectorDropdownProps> = ({
  currency,
  onSelectCurrency,
  isCompact = false,
  className = '',
  onCountryChangedToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentInfo = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus search input on open
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filter countries by query and region
  const filteredCurrencies = useMemo(() => {
    const allKeys = Object.keys(CURRENCY_RATES) as Currency[];
    return allKeys.filter((key) => {
      const data = CURRENCY_RATES[key];

      let matchesRegion = false;
      if (selectedRegion === 'All') {
        matchesRegion = true;
      } else if (selectedRegion === 'Global') {
        matchesRegion = ['Americas', 'Europe', 'Oceania', 'Global'].includes(data.region);
      } else {
        matchesRegion = data.region.toLowerCase() === selectedRegion.toLowerCase();
      }

      if (!matchesRegion) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        data.country.toLowerCase().includes(q) ||
        data.name.toLowerCase().includes(q) ||
        key.toLowerCase().includes(q) ||
        data.symbol.toLowerCase().includes(q) ||
        data.region.toLowerCase().includes(q) ||
        (data.mlbbLeague && data.mlbbLeague.toLowerCase().includes(q)) ||
        (data.popularLocalPayment && data.popularLocalPayment.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedRegion]);

  // Group by region if "All" is selected and no active text query
  const groupedCurrencies = useMemo(() => {
    if (selectedRegion !== 'All' || searchQuery.trim()) {
      return null;
    }

    const groups: { regionName: string; icon: string; items: Currency[] }[] = [
      {
        regionName: 'Southeast Asia (MLBB Heartland & Core Leagues)',
        icon: '🌴',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter(
          (k) => CURRENCY_RATES[k].region === 'Southeast Asia'
        ),
      },
      {
        regionName: 'East Asia (M-Series Teams & Direct Servers)',
        icon: '🏯',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter(
          (k) => CURRENCY_RATES[k].region === 'East Asia'
        ),
      },
      {
        regionName: 'South Asia (MLBB South Asia Qualifiers & Cup)',
        icon: '🏏',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter(
          (k) => CURRENCY_RATES[k].region === 'South Asia'
        ),
      },
      {
        regionName: 'West Asia / Middle East (MPL MENA, EWC & MTC)',
        icon: '🏜️',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter(
          (k) => CURRENCY_RATES[k].region === 'West Asia'
        ),
      },
      {
        regionName: 'Central Asia (EECA & CIS Powerhouses)',
        icon: '🏔️',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter(
          (k) => CURRENCY_RATES[k].region === 'Central Asia'
        ),
      },
      {
        regionName: 'Americas & Global (MPL LATAM, NACT)',
        icon: '🌐',
        items: (Object.keys(CURRENCY_RATES) as Currency[]).filter((k) =>
          ['Americas', 'Europe', 'Oceania', 'Global'].includes(CURRENCY_RATES[k].region)
        ),
      },
    ];

    return groups.filter((g) => g.items.length > 0);
  }, [selectedRegion, searchQuery]);

  const handleSelect = (c: Currency) => {
    const info = CURRENCY_RATES[c];
    onSelectCurrency(c);
    setIsOpen(false);
    setSearchQuery('');
    if (onCountryChangedToast && info) {
      onCountryChangedToast({
        country: info.country,
        flag: info.flag,
        symbol: info.symbol,
        currency: c,
      });
    }
  };

  const renderCountryRow = (key: Currency) => {
    const item = CURRENCY_RATES[key];
    const isSelected = currency === key;

    return (
      <button
        key={key}
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={() => handleSelect(key)}
        className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between group transition-colors cursor-pointer ${
          isSelected
            ? 'bg-cyan-950/80 border border-cyan-500/60 text-white shadow-sm'
            : 'hover:bg-slate-800/70 text-slate-300 border border-transparent'
        }`}
      >
        {/* Left: Flag & Details */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="text-2xl leading-none select-none shrink-0 filter drop-shadow-sm"
            role="img"
            aria-label={item.country}
          >
            {item.flag}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white truncate">
                {item.country}
              </span>

              {/* MLBB League Badge */}
              {item.mlbbLeague && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-600/40 font-mono flex items-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5 text-amber-400" />
                  <span>{item.mlbbLeague}</span>
                </span>
              )}

              {/* Local Payment Badges */}
              {item.popularLocalPayment && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 font-mono hidden sm:inline-block">
                  {item.popularLocalPayment}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono mt-0.5">
              <span className="text-cyan-400 font-bold">
                {item.symbol} {key}
              </span>
              <span>•</span>
              <span className="text-slate-400 text-[10px] truncate">{item.name}</span>
            </div>
          </div>
        </div>

        {/* Right: Exchange Rate & Checkmark */}
        <div className="flex items-center gap-2 shrink-0 ml-2 text-right">
          <div className="hidden sm:block text-[10px] font-mono text-slate-400">
            <span className="text-slate-500">1 USD ≈ </span>
            <span className="text-slate-200 font-semibold">
              {item.symbol} {item.rate.toLocaleString()}
            </span>
          </div>
          {isSelected ? (
            <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-slate-700 group-hover:border-cyan-500/60 shrink-0" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`Current Region: ${currentInfo.country} (${currentInfo.symbol} ${currency}) - Click to switch MLBB Country`}
        className={`group flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 hover:bg-slate-800/90 border transition-all duration-200 rounded-lg cursor-pointer select-none shadow-sm ${
          isOpen
            ? 'border-cyan-400 ring-2 ring-cyan-500/20 bg-slate-800'
            : 'border-slate-700/80 hover:border-cyan-500/60'
        } ${isCompact ? 'px-2 py-1.5 text-xs' : 'px-2.5 py-1.5 text-xs sm:text-sm'}`}
      >
        {/* Country Flag */}
        <span
          className="text-base sm:text-lg leading-none select-none filter drop-shadow-sm"
          role="img"
          aria-label={currentInfo.country}
        >
          {currentInfo.flag}
        </span>

        {/* Currency & Country Info */}
        <div className="flex items-center gap-1 font-mono">
          {!isCompact && (
            <span className="hidden xl:inline text-slate-300 font-sans text-xs font-medium max-w-[90px] truncate">
              {currentInfo.country}
            </span>
          )}
          <span className="font-bold text-cyan-300 tracking-tight">
            {currentInfo.symbol} {currency}
          </span>
        </div>

        {/* Animated Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select MLBB Country and Regional Pricing Currency"
          className="absolute right-0 mt-2 w-80 sm:w-[480px] max-w-[94vw] bg-[#0c1220]/98 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/80 backdrop-blur-xl z-50 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                  MLBB Regional Pricing & Countries
                </h4>
                <p className="text-[10px] text-slate-400">
                  Select your country to unlock local payment gateways & native currency rates
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close country dropdown"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search MLBB country, currency, league, or payment (e.g. Philippines, Nepal, GCash, Kaspi)..."
                className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-cyan-400 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Region Filter Chips: Southeast Asia, East Asia, South Asia, West Asia, Central Asia */}
            <div className="flex items-center gap-1 mt-2.5 overflow-x-auto pb-1 scrollbar-none text-[10px]">
              {REGION_CATEGORIES.map((reg) => {
                const isActive = selectedRegion === reg.id;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => setSelectedRegion(reg.id)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all flex items-center gap-1 cursor-pointer border ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm shadow-cyan-500/20'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <span>{reg.icon}</span>
                    <span>{reg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-72 sm:max-h-80 overflow-y-auto p-1.5 custom-scrollbar space-y-1">
            {filteredCurrencies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1.5">
                <Globe className="w-7 h-7 mx-auto opacity-40 text-cyan-400" />
                <p>No MLBB countries found matching &ldquo;{searchQuery}&rdquo;</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('All');
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-cyan-300 hover:bg-slate-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : groupedCurrencies ? (
              // Grouped Section View for "All"
              groupedCurrencies.map((group) => (
                <div key={group.regionName} className="space-y-1 mb-2">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-slate-950/80 rounded-md flex items-center gap-1.5 border border-slate-800/80">
                    <span>{group.icon}</span>
                    <span>{group.regionName}</span>
                    <span className="text-slate-500 font-normal">({group.items.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((k) => renderCountryRow(k))}
                  </div>
                </div>
              ))
            ) : (
              // Flat Filtered View
              filteredCurrencies.map((k) => renderCountryRow(k))
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Moonton Server Verified • Real-Time FX</span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Active: {currentInfo.flag} {currency} ({currentInfo.symbol})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
