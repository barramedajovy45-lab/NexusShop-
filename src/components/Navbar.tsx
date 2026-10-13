import React, { useState } from 'react';
import { Currency, UserAccount, ThemeArchetype } from '../types';
import { CURRENCY_RATES } from '../utils/formatters';
import { canSellDiamonds, isDeveloperUser, isVipUser } from '../data/mockData';
import { CountrySelectorDropdown } from './CountrySelectorDropdown';
import { useI18n } from '../i18n';
import { APP_VERSION } from '../utils/version';
import {
  ShieldCheck,
  Gem,
  User,
  Store,
  Clock,
  Bell,
  TrendingDown,
  Bot,
  UserPlus,
  LogIn,
  Award,
  Settings,
  Volume2,
  VolumeX,
  Crown,
  Lock,
  ChevronDown,
  CalendarCheck,
  Gift,
  Sun,
  Moon,
  Palette,
  Sparkles,
  Gamepad2,
  Package,
  Bug,
  Scale,
  FileText,
  ChevronRight,
  PhoneCall,
  MessageCircle,
} from 'lucide-react';
import { NexusLogo } from './NexusLogo';
import { AuthorizedPartnerBadge } from './AuthorizedPartnerBadge';
import { playUiClickSound, playToggleSound, playModalOpenSound } from '../utils/audio';

export const THEME_CYCLE: {
  id: ThemeArchetype;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  accent: string;
}[] = [
  { id: 'dark', name: 'Slate Dark', shortName: 'Dark', badge: 'Default', color: '#090d16', accent: '#06b6d4' },
  { id: 'midnight', name: 'Midnight Deep', shortName: 'Midnight', badge: 'Indigo', color: '#050814', accent: '#6366f1' },
  { id: 'amoled', name: 'AMOLED Black', shortName: 'AMOLED', badge: 'Pitch Black', color: '#000000', accent: '#38bdf8' },
  { id: 'white', name: 'Frost White', shortName: 'White', badge: 'Light Mode', color: '#f8fafc', accent: '#0284c7' },
  { id: 'mythic_gold', name: 'Mythic Gold', shortName: 'Gold', badge: 'Imperial', color: '#0d0a04', accent: '#f59e0b' },
  { id: 'neon_emerald', name: 'Venom Emerald', shortName: 'Emerald', badge: 'Toxic', color: '#040e08', accent: '#10b981' },
  { id: 'crimson_void', name: 'Crimson Void', shortName: 'Crimson', badge: 'Ruby', color: '#0e0508', accent: '#f43f5e' },
];

interface NavbarProps {
  activeTab: 'buy' | 'p2p' | 'seller' | 'orders' | 'missions' | 'referrals' | 'escrow-info';
  setActiveTab: (tab: 'buy' | 'p2p' | 'seller' | 'orders' | 'missions' | 'referrals' | 'escrow-info') => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currentTheme?: ThemeArchetype;
  onCycleTheme?: (targetTheme?: ThemeArchetype) => void;
  activeOrdersCount: number;
  claimableMissionsCount?: number;
  userRole: 'buyer' | 'seller';
  setUserRole: (role: 'buyer' | 'seller') => void;
  onOpenEscrowInfo: () => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  activePriceAlertsCount?: number;
  onOpenPriceAlerts?: () => void;
  onOpenChatBot?: () => void;
  user: UserAccount | null;
  onOpenAuthModal: (mode: 'signup' | 'signin') => void;
  onOpenProfileModal: () => void;
  onOpenSettings?: () => void;
  soundEnabled?: boolean;
  onToggleMute?: () => void;
  onOpenReferralModal?: () => void;
  onOpenVersionModal?: () => void;
  onCountryChangedToast?: (info: { country: string; flag: string; symbol: string; currency: Currency }) => void;
  onOpenAffiliate?: () => void;
  onOpenPublisher?: () => void;
  onOpenDistributor?: () => void;
  onOpenBugBounty?: () => void;
  onOpenTerms?: (tab?: 'terms' | 'escrow_refund' | 'privacy' | 'p2p_rules' | 'disclaimer') => void;
  onOpenTimedDropModal?: () => void;
  onOpenVipUpgradeModal?: () => void;
  onOpenSecurityModal?: (tab?: 'reseller' | 'cybersecurity' | 'sandbox') => void;
  onOpenContactModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  currentTheme = 'dark',
  onCycleTheme,
  activeOrdersCount,
  claimableMissionsCount = 0,
  userRole,
  setUserRole,
  onOpenEscrowInfo,
  unreadNotificationsCount = 0,
  onOpenNotifications,
  activePriceAlertsCount = 0,
  onOpenPriceAlerts,
  onOpenChatBot,
  user,
  onOpenAuthModal,
  onOpenProfileModal,
  onOpenSettings,
  soundEnabled = true,
  onToggleMute,
  onOpenReferralModal,
  onOpenVersionModal,
  onCountryChangedToast,
  onOpenAffiliate,
  onOpenPublisher,
  onOpenDistributor,
  onOpenBugBounty,
  onOpenTerms,
  onOpenTimedDropModal,
  onOpenVipUpgradeModal,
  onOpenSecurityModal,
  onOpenContactModal,
}) => {
  const { t } = useI18n();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showProgramsDropdown, setShowProgramsDropdown] = useState(false);

  const currentThemeObj = THEME_CYCLE.find((t) => t.id === currentTheme) || THEME_CYCLE[0];

  const renderThemeIcon = (theme: ThemeArchetype = 'dark', className = 'w-4 h-4') => {
    switch (theme) {
      case 'white':
        return <Sun className={`${className} text-amber-400`} />;
      case 'amoled':
        return <Moon className={`${className} text-sky-400`} />;
      case 'midnight':
        return <Moon className={`${className} text-indigo-400`} />;
      case 'mythic_gold':
        return <Sparkles className={`${className} text-amber-400`} />;
      case 'neon_emerald':
        return <Sparkles className={`${className} text-emerald-400`} />;
      case 'crimson_void':
        return <Sparkles className={`${className} text-rose-400`} />;
      case 'dark':
      default:
        return <Palette className={`${className} text-cyan-400`} />;
    }
  };

  return (
    <>
      {/* 12:00 PM & 12:00 AM Free Diamond Drop Announcement Bar */}
      <div className="bg-gradient-to-r from-cyan-950 via-slate-950 to-indigo-950 border-b border-cyan-800/50 py-1.5 px-4 text-xs select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-300 border border-cyan-500/60 shadow-sm animate-pulse">
              <Gift className="w-3 h-3 text-cyan-400" />
              12 PM & 12 AM DROP
            </span>
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              Free <strong className="text-cyan-300">10 to 50 diamonds</strong> for Buyers and VIPs every 12:00 PM (Noon) & 12:00 AM (Midnight)!
            </span>
          </div>
          {onOpenTimedDropModal && (
            <button
              type="button"
              onClick={() => {
                playUiClickSound();
                onOpenTimedDropModal();
              }}
              className="text-[11px] font-bold text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all bg-cyan-500/20 hover:bg-cyan-500/30 hover:scale-105 active:scale-95 px-2.5 py-0.5 rounded-full border border-cyan-500/50 shadow-sm"
            >
              <span>Claim / View Drop</span>
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </button>
          )}
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <button
              onClick={() => setActiveTab('buy')}
              className="flex items-center gap-2.5 text-left group focus:outline-none cursor-pointer"
            >
              <NexusLogo size="sm" showText={false} />
              <span className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent">
                  NEXUS SHOP
                </span>
              </span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 text-cyan-300">
                MLBB Escrow
              </span>
              {onOpenSecurityModal && (
                <AuthorizedPartnerBadge
                  variant="navbar"
                  onClick={() => onOpenSecurityModal('reseller')}
                  className="hidden sm:inline-flex"
                />
              )}
              <button
                type="button"
                onClick={onOpenVersionModal}
                title={`Nexus Shop v${APP_VERSION} (View Release Notes)`}
                className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-950/90 hover:bg-blue-900 border border-blue-600/40 hover:border-blue-400 text-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-blue-500/20"
              >
                v{APP_VERSION}
              </button>
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => {
              playUiClickSound();
              setActiveTab('buy');
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'buy'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {t('nav.buy')}
          </button>

          <button
            onClick={() => {
              playUiClickSound();
              setActiveTab('p2p');
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'p2p'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {t('nav.p2p')}
          </button>

          <button
            onClick={() => {
              playUiClickSound();
              if (user && canSellDiamonds(user)) {
                setActiveTab('seller');
              } else if (onOpenVipUpgradeModal) {
                onOpenVipUpgradeModal();
              } else {
                setActiveTab('seller');
              }
            }}
            title={user && canSellDiamonds(user) ? 'Access VIP Seller Portal' : 'Upgrade to VIP (₱950) to sell diamonds in Seller Portal'}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'seller'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{t('nav.seller')}</span>
            {user && canSellDiamonds(user) ? (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" />
                VIP
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300/80 border border-amber-500/30 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                VIP
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playUiClickSound();
              setActiveTab('orders');
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t('nav.orders')}
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 text-[11px] font-mono font-semibold rounded-full bg-cyan-500 text-slate-950">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playUiClickSound();
              setActiveTab('missions');
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'missions'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('nav.missions')}</span>
            {claimableMissionsCount > 0 ? (
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-emerald-500 text-slate-950 animate-pulse">
                {claimableMissionsCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Bonus
              </span>
            )}
          </button>

          <button
            onClick={() => {
              playUiClickSound();
              setActiveTab('referrals');
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'referrals'
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-800/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav.referrals')}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              +5% 💎
            </span>
          </button>

          <button
            onClick={() => {
              playModalOpenSound();
              onOpenEscrowInfo();
            }}
            className="px-3 py-1.5 text-sm font-medium rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('nav.escrowInfo')}
          </button>

          {/* Programs & Partners Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProgramsDropdown((prev) => !prev)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Programs</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showProgramsDropdown ? 'rotate-180 text-cyan-300' : ''}`} />
            </button>

            {showProgramsDropdown && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowProgramsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-cyan-950/60 p-2 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400 font-bold border-b border-slate-800">
                    Partners & Programs
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramsDropdown(false);
                      onOpenAffiliate?.();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white">Become an Affiliate</div>
                      <div className="text-[10px] text-slate-400">Up to 8% streamer commission</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramsDropdown(false);
                      onOpenPublisher?.();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white">For Game Publishers</div>
                      <div className="text-[10px] text-slate-400">Direct In-Game Escrow API (2.5%)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramsDropdown(false);
                      onOpenDistributor?.();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white">Become a Distributor</div>
                      <div className="text-[10px] text-slate-400">Wholesale B2B bulk supply</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProgramsDropdown(false);
                      onOpenBugBounty?.();
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Bug className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-white">Bug Bounty Program</div>
                      <div className="text-[10px] text-slate-400">Rewards up to $5,000 USD</div>
                    </div>
                  </button>

                  {onOpenSecurityModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProgramsDropdown(false);
                        onOpenSecurityModal('sandbox');
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-emerald-950/60 hover:text-emerald-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-white">Security & Reseller Proof</div>
                        <div className="text-[10px] text-emerald-400">Zod & Webhook HMAC Sandbox</div>
                      </div>
                    </button>
                  )}

                  {onOpenContactModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowProgramsDropdown(false);
                        onOpenContactModal();
                      }}
                      className="w-full px-2.5 py-2 rounded-lg text-left text-xs font-semibold text-slate-200 hover:bg-cyan-950/60 hover:text-cyan-300 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-white">Contact Us (WhatsApp / FB / IG)</div>
                        <div className="text-[10px] text-cyan-400">Ralph Jaycob Barrameda • @hakobiii.com.ph</div>
                      </div>
                    </button>
                  )}

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProgramsDropdown(false);
                        onOpenTerms?.('terms');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Terms & Conditions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProgramsDropdown(false);
                        onOpenTerms?.('privacy');
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Privacy Policy</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Zone 3: Actions (Currency & Role Switcher) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Country Selector Dropdown with Flags & Dynamic Regional Pricing */}
          <CountrySelectorDropdown
            currency={currency}
            onSelectCurrency={setCurrency}
            onCountryChangedToast={onCountryChangedToast}
          />

          {/* Diamond Price Alerts Center */}
          {onOpenPriceAlerts && (
            <button
              onClick={onOpenPriceAlerts}
              title="Diamond Price Alert Watcher"
              aria-label="Diamond Price Alert Watcher"
              className="relative p-2 rounded-lg bg-amber-950/30 hover:bg-amber-950/60 border border-amber-600/40 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <TrendingDown className="w-4 h-4" />
              {activePriceAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-amber-500/50">
                  {activePriceAlertsCount}
                </span>
              )}
            </button>
          )}

          {/* Contact Us Button (WhatsApp / Facebook / Instagram) */}
          {onOpenContactModal && (
            <button
              type="button"
              onClick={() => {
                playUiClickSound();
                onOpenContactModal();
              }}
              title="Contact Us: WhatsApp Group, Facebook (Ralph Jaycob Barrameda) & Instagram (hakobiii.com.ph)"
              aria-label="Contact Us"
              className="relative p-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-400 text-emerald-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline text-xs font-semibold">Contact Us</span>
            </button>
          )}

          {/* AI Support Bot & Bug Report Button */}
          {onOpenChatBot && (
            <button
              id="navbar-ai-bot-btn"
              onClick={onOpenChatBot}
              title="Aegis AI Assistant & Bug Reporter"
              aria-label="Aegis AI Assistant & Bug Reporter"
              className="relative p-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-600/40 hover:border-cyan-400 text-cyan-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span className="hidden xl:inline text-xs font-semibold">AI Support & Bug Report</span>
            </button>
          )}

          {/* Escrow Notification Alerts Center */}
          <button
            onClick={onOpenNotifications}
            title="Real-Time Escrow Order Notifications"
            aria-label="Real-Time Escrow Order Notifications"
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4 text-cyan-400" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-md shadow-cyan-500/50">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* Quick-Access Theme Toggle Button */}
          {onCycleTheme && (
            <div className="relative">
              <button
                type="button"
                onClick={() => onCycleTheme()}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowThemePicker(!showThemePicker);
                }}
                title={`Theme: ${currentThemeObj.name} (Click to cycle themes • Right-click for palette)`}
                aria-label={`Current Theme: ${currentThemeObj.name}. Click to cycle themes.`}
                className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer group flex items-center justify-center shadow-sm"
              >
                {renderThemeIcon(currentTheme)}
                {/* Active Theme Color Dot Indicator */}
                <span
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-slate-950 shadow-sm transition-transform group-hover:scale-125"
                  style={{ backgroundColor: currentThemeObj.accent }}
                />
              </button>

              {/* Theme Dropdown / Quick Palette Menu */}
              {showThemePicker && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700/80 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                    <span>Quick Theme Selection</span>
                    <button
                      type="button"
                      onClick={() => setShowThemePicker(false)}
                      className="text-slate-500 hover:text-white text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1">
                    {THEME_CYCLE.map((th) => {
                      const isSelected = currentTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => {
                            onCycleTheme(th.id);
                            setShowThemePicker(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                              style={{ backgroundColor: th.accent }}
                            />
                            <span>{th.name}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {th.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Application Settings & Preferences"
              aria-label="Application Settings"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Switch Role Button - ONLY for VIP and Developer */}
          {user && canSellDiamonds(user) && (
            <button
              onClick={() => {
                const newRole = userRole === 'buyer' ? 'seller' : 'buyer';
                setUserRole(newRole);
                if (newRole === 'seller') setActiveTab('seller');
              }}
              title="Toggle between Buyer and Seller Mode"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              {userRole === 'buyer' ? (
                <>
                  <Store className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Seller Mode</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Buyer Mode</span>
                </>
              )}
            </button>
          )}

          {/* VIP Upgrade Button for non-VIPs / Beginners */}
          {(!user || !isVipUser(user)) && onOpenVipUpgradeModal && (
            <button
              type="button"
              id="nav-btn-upgrade-vip"
              onClick={() => {
                playUiClickSound();
                onOpenVipUpgradeModal();
              }}
              title="Upgrade to VIP for ₱950: Unlock free 172 diamonds, 50% discount, and seller portal clearance!"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-400/60 hover:border-amber-300 text-amber-300 hover:text-white transition-all text-xs font-bold cursor-pointer shadow-sm shadow-amber-500/10 hover:shadow-amber-500/20 hover:scale-105 active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>Upgrade VIP</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                ₱950
              </span>
            </button>
          )}

          {/* User Account / Sign In / Sign Up Section */}
          {user ? (
            <button
              onClick={onOpenProfileModal}
              title={`Account: ${user.name} (${user.email})`}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-cyan-800/40 hover:border-cyan-500/60 transition-all text-left cursor-pointer group shadow-sm"
            >
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg bg-slate-900 border border-cyan-500/50 p-0.5 object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
              </div>
              <div className="hidden sm:block leading-tight">
                <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors max-w-[110px] truncate">
                  {user.name.split(' ')[0]}
                </div>
                <div className="text-[10px] font-mono flex items-center gap-1">
                  {isDeveloperUser(user) ? (
                    <span className="text-purple-300 font-bold flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-amber-400 inline" />
                      DEV (FREE 💎)
                    </span>
                  ) : isVipUser(user) ? (
                    <span className="text-amber-300 font-bold flex items-center gap-0.5">
                      <Crown className="w-2.5 h-2.5 text-amber-400 inline" />
                      VIP (FREE 💎)
                    </span>
                  ) : (
                    <span className="text-cyan-400 flex items-center gap-0.5">
                      <User className="w-2.5 h-2.5 text-cyan-400 inline" />
                      BUYER
                    </span>
                  )}

                  {(user.referralBadge || user.securityBadges?.includes('Referral Badge')) && (
                    <span
                      title="Referral Badge: Unlocked by inviting friends to Nexus Shop"
                      className="px-1 py-0.2 rounded bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[9px] font-bold flex items-center gap-0.5"
                    >
                      <Award className="w-2.5 h-2.5 text-amber-400" />
                      <span>BADGE</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onOpenAuthModal('signin')}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal('signup')}
                className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 rounded-lg shadow-md shadow-cyan-500/20 transition-all cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-950" />
                <span>Sign Up</span>
              </button>
            </div>
          )}

          {/* Quick tracker link on mobile */}
          <button
            onClick={() => setActiveTab('orders')}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200 relative"
            title="Active Orders"
          >
            <Clock className="w-4 h-4" />
            {activeOrdersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 text-slate-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeOrdersCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Mobile nav sub-bar */}
      <div className="md:hidden border-t border-slate-800/60 px-4 py-2 flex items-center justify-around text-xs bg-slate-950/80 overflow-x-auto gap-2">
        {onOpenSecurityModal && (
          <AuthorizedPartnerBadge
            variant="navbar"
            onClick={() => onOpenSecurityModal('reseller')}
            className="shrink-0"
          />
        )}
        <button
          onClick={() => setActiveTab('buy')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'buy' ? 'text-cyan-300 font-semibold bg-cyan-950/60' : 'text-slate-400'
          }`}
        >
          Top-Up Store
        </button>
        <button
          onClick={() => setActiveTab('p2p')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'p2p' ? 'text-cyan-300 font-semibold bg-cyan-950/60' : 'text-slate-400'
          }`}
        >
          P2P Sellers
        </button>
        <button
          onClick={() => {
            if (user && canSellDiamonds(user)) {
              setActiveTab('seller');
            } else if (onOpenVipUpgradeModal) {
              onOpenVipUpgradeModal();
            } else {
              setActiveTab('seller');
            }
          }}
          className={`px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'seller' ? 'text-cyan-300 font-semibold bg-cyan-950/60' : 'text-slate-400'
          }`}
        >
          <span>Seller Portal</span>
          <Crown className="w-3 h-3 text-amber-400" />
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'orders' ? 'text-cyan-300 font-semibold bg-cyan-950/60' : 'text-slate-400'
          }`}
        >
          Tracker ({activeOrdersCount})
        </button>
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-2 py-1 rounded whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'missions' ? 'text-cyan-300 font-semibold bg-cyan-950/60' : 'text-slate-400'
          }`}
        >
          <CalendarCheck className="w-3 h-3 text-cyan-400" />
          <span>Missions</span>
          {claimableMissionsCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-2 py-1 rounded whitespace-nowrap text-amber-300 font-bold flex items-center gap-1 border transition-all ${
            activeTab === 'referrals'
              ? 'bg-amber-950/80 border-amber-400 text-amber-200'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}
        >
          <Gift className="w-3 h-3 text-amber-400" />
          <span>Referrals (+5%)</span>
        </button>
        {onOpenContactModal && (
          <button
            type="button"
            onClick={() => onOpenContactModal()}
            className="px-2 py-1 rounded whitespace-nowrap text-emerald-300 font-medium flex items-center gap-1 border border-emerald-800/40 bg-emerald-950/40"
          >
            <MessageCircle className="w-3 h-3 text-emerald-400" />
            <span>Contact Us</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenAffiliate?.()}
          className="px-2 py-1 rounded whitespace-nowrap text-purple-300 font-medium flex items-center gap-1 border border-purple-800/40 bg-purple-950/40"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Affiliate & B2B</span>
        </button>
        <button
          onClick={() => {
            if (user) {
              onOpenProfileModal();
            } else {
              onOpenAuthModal('signup');
            }
          }}
          className="px-2 py-1 rounded whitespace-nowrap text-cyan-400 font-medium flex items-center gap-1"
        >
          <User className="w-3 h-3" />
          <span>{user ? 'Profile' : 'Sign Up'}</span>
        </button>
        {onCycleTheme && (
          <button
            onClick={() => onCycleTheme()}
            className="px-2 py-1 rounded whitespace-nowrap text-slate-300 hover:text-white flex items-center gap-1 bg-slate-900/80 border border-slate-700"
            title={`Cycle Theme (Current: ${currentThemeObj.name})`}
          >
            {renderThemeIcon(currentTheme, 'w-3 h-3')}
            <span>{currentThemeObj.shortName}</span>
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-2 py-1 rounded whitespace-nowrap text-slate-400 hover:text-cyan-300 flex items-center gap-1"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </button>
        )}
      </div>
    </header>
    </>
  );
};
