import React, { useState, useEffect, useMemo } from 'react';
import {
  DailyMission,
  EarnedVoucher,
  DailyMissionsState,
  MlbbAccount,
  Currency,
  UserAccount,
} from '../types';
import { INITIAL_DAILY_MISSIONS } from '../data/missionsData';
import {
  INITIAL_USER_ACCOUNT,
  getVipFreeClaimStatus,
  isVipUser,
  isDeveloperUser,
  VIP_FREE_CLAIM_LIMIT,
  VIP_FREE_CLAIM_COOLDOWN_MS,
} from '../data/mockData';
import { playMissionClaimSound } from '../utils/audio';
import { formatCurrency } from '../utils/formatters';
import {
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  Lock,
  Users,
  Calculator,
  Share2,
  Gift,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  ArrowRight,
  Copy,
  Check,
  Zap,
  Ticket,
  Trophy,
  RotateCw,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Coins,
  Crown,
  Gem,
} from 'lucide-react';

interface DailyMissionsProps {
  verifiedAccount: MlbbAccount | null;
  currentUser?: UserAccount | null;
  currency: Currency;
  onNavigateToTab: (tab: 'buy' | 'p2p' | 'seller' | 'orders' | 'missions') => void;
  onOpenEscrowExplainer: () => void;
  onOpenAccountPrompt?: () => void;
  onOpenProfileModal?: () => void;
  onOpenVipUpgradeModal?: () => void;
  onSelectQuickCalculatorAmount?: (diamonds: number) => void;
  onAddNotificationToast?: (toast: {
    statusType: 'processing' | 'completed' | 'price_alert' | 'cancelled';
    title: string;
    message: string;
    diamonds: number;
    amount: number;
  }) => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({
  verifiedAccount,
  currentUser,
  currency,
  onNavigateToTab,
  onOpenEscrowExplainer,
  onOpenAccountPrompt,
  onOpenProfileModal,
  onOpenVipUpgradeModal,
  onSelectQuickCalculatorAmount,
  onAddNotificationToast,
}) => {
  // Load or initialize mission state from localStorage
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(() => {
    try {
      const saved = localStorage.getItem('nexus_daily_missions_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.missions)) {
          return parsed;
        }
      }
    } catch {}

    const todayStr = new Date().toISOString().split('T')[0];
    return {
      missions: INITIAL_DAILY_MISSIONS,
      streakDays: 3, // Friendly starter streak
      lastCheckInDate: '',
      totalBonusDiamondsClaimed: 45, // Starter bonus pool
      totalCreditsEarnedUsd: 2.50, // Starter mission credits pool
      transferredCreditsUsd: 0,
      vouchers: [
        {
          id: 'starter-voucher-5',
          code: 'WELCOME5',
          discountPct: 5,
          description: '5% Welcome Explorer Discount on all Diamond Packs',
          earnedAt: Date.now() - 86400000,
          expiresAt: Date.now() + 86400000 * 7,
          isUsed: false,
          missionId: 'starter',
        },
      ],
    };
  });

  // Save to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem('nexus_daily_missions_data', JSON.stringify(missionsState));
      window.dispatchEvent(new CustomEvent('nexus_missions_updated', { detail: missionsState }));
    } catch {}
  }, [missionsState]);

  // Selected filter tab
  const [activeCategory, setActiveCategory] = useState<'all' | 'daily' | 'security' | 'explore' | 'social' | 'completed'>('all');

  // Copied voucher state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Lucky wheel spin modal state
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<{ diamonds: number; voucherCode?: string; discount?: number } | null>(null);

  // Live countdown to midnight UTC reset and 1-second ticker for VIP 24h cooldown reset
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [, setVipTicker] = useState<number>(0);

  // Resolve active user account (prop -> localStorage -> INITIAL_USER_ACCOUNT)
  const effectiveUser: UserAccount = useMemo(() => {
    if (currentUser) return currentUser;
    try {
      const savedAuth = localStorage.getItem('nexus_auth_user');
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        if (parsed && parsed.email) return parsed;
      }
      const savedMock = localStorage.getItem('nexus_mock_user');
      if (savedMock) {
        const parsed = JSON.parse(savedMock);
        if (parsed && parsed.email) return parsed;
      }
    } catch {}
    return INITIAL_USER_ACCOUNT;
  }, [currentUser]);

  const isVip = isVipUser(effectiveUser);
  const isDev = isDeveloperUser(effectiveUser);
  const vipClaimStatus = getVipFreeClaimStatus(effectiveUser);
  const vipClaimsUsed = Math.min(VIP_FREE_CLAIM_LIMIT, vipClaimStatus.claimsUsed || 0);
  const vipClaimsProgressPct = Math.round((vipClaimsUsed / VIP_FREE_CLAIM_LIMIT) * 100);
  const vipResetProgressPct =
    vipClaimStatus.cooldownRemainingMs > 0
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(
              ((VIP_FREE_CLAIM_COOLDOWN_MS - vipClaimStatus.cooldownRemainingMs) /
                VIP_FREE_CLAIM_COOLDOWN_MS) *
                100
            )
          )
        )
      : 100;

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0); // Next local midnight
      const diffMs = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeUntilReset(
        `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      );
      setVipTicker((prev) => prev + 1);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize account verification mission with verifiedAccount prop
  useEffect(() => {
    if (verifiedAccount) {
      setMissionsState((prev) => {
        const updated = prev.missions.map((m) => {
          if (m.id === 'verify-mlbb-id' && m.status === 'in_progress') {
            return {
              ...m,
              currentProgress: 1,
              status: 'claimable' as const,
            };
          }
          return m;
        });
        return { ...prev, missions: updated };
      });
    }
  }, [verifiedAccount]);

  // Count claimable missions
  const claimableCount = useMemo(() => {
    return missionsState.missions.filter((m) => m.status === 'claimable').length;
  }, [missionsState.missions]);

  // Total completed missions
  const completedCount = useMemo(() => {
    return missionsState.missions.filter((m) => m.status === 'completed').length;
  }, [missionsState.missions]);

  // Overall percentage completed
  const totalCompletionPct = useMemo(() => {
    if (missionsState.missions.length === 0) return 0;
    return Math.round((completedCount / missionsState.missions.length) * 100);
  }, [completedCount, missionsState.missions.length]);

  // Handle action click for in-progress missions
  const handleMissionAction = (mission: DailyMission) => {
    switch (mission.actionType) {
      case 'checkin': {
        // Mark checkin as claimable immediately
        setMissionsState((prev) => {
          const todayStr = new Date().toISOString().split('T')[0];
          const isNewDay = prev.lastCheckInDate !== todayStr;
          const updatedStreak = isNewDay ? prev.streakDays + 1 : prev.streakDays;

          const updatedMissions = prev.missions.map((m) => {
            if (m.id === 'daily-checkin') {
              return {
                ...m,
                currentProgress: 1,
                status: 'claimable' as const,
              };
            }
            return m;
          });

          return {
            ...prev,
            streakDays: updatedStreak,
            lastCheckInDate: todayStr,
            missions: updatedMissions,
          };
        });
        break;
      }

      case 'verify_mlbb': {
        if (verifiedAccount) {
          // Already verified, mark claimable
          setMissionsState((prev) => ({
            ...prev,
            missions: prev.missions.map((m) =>
              m.id === 'verify-mlbb-id'
                ? { ...m, currentProgress: 1, status: 'claimable' as const }
                : m
            ),
          }));
        } else {
          // Navigate to store / account verification box
          onNavigateToTab('buy');
          if (onOpenAccountPrompt) {
            onOpenAccountPrompt();
          }
        }
        break;
      }

      case 'browse_store': {
        // Mark as claimable and navigate to store
        setMissionsState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === 'explore-store-packages'
              ? { ...m, currentProgress: 1, status: 'claimable' as const }
              : m
          ),
        }));
        onNavigateToTab('buy');
        break;
      }

      case 'view_escrow': {
        // Open escrow explainer and mark claimable
        onOpenEscrowExplainer();
        setMissionsState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === 'study-escrow-protocol'
              ? { ...m, currentProgress: 1, status: 'claimable' as const }
              : m
          ),
        }));
        break;
      }

      case 'visit_p2p': {
        // Mark claimable and navigate to P2P market
        setMissionsState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === 'inspect-p2p-merchants'
              ? { ...m, currentProgress: 1, status: 'claimable' as const }
              : m
          ),
        }));
        onNavigateToTab('p2p');
        break;
      }

      case 'calculate_savings': {
        // Trigger calculator scroll and complete
        setMissionsState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === 'savings-calculator'
              ? { ...m, currentProgress: 1, status: 'claimable' as const }
              : m
          ),
        }));
        onNavigateToTab('buy');
        if (onSelectQuickCalculatorAmount) {
          onSelectQuickCalculatorAmount(1000);
        }
        break;
      }

        case 'share_squad': {
        // Copy invite link
        const inviteUrl = window.location.origin;
        try {
          navigator.clipboard.writeText(
            `🔥 Hey squad! Top-up Mobile Legends diamonds safely with instant Moonton Escrow on Nexus Shop: ${inviteUrl}`
          );
        } catch {}
        setCopiedCode('INVITE_LINK');
        setTimeout(() => setCopiedCode(null), 3000);

        setMissionsState((prev) => ({
          ...prev,
          missions: prev.missions.map((m) =>
            m.id === 'share-squad'
              ? { ...m, currentProgress: 1, status: 'claimable' as const }
              : m
          ),
        }));

        if (onAddNotificationToast) {
          onAddNotificationToast({
            statusType: 'completed',
            title: 'Squad Link Copied!',
            message: 'Invite link copied to clipboard. Mission is now ready to claim!',
            diamonds: 30,
            amount: 0,
          });
        }
        break;
      }

      case 'lucky_spin': {
        setIsWheelOpen(true);
        break;
      }

      default:
        break;
    }
  };

  // Claim single reward
  const handleClaimMission = (missionId: string) => {
    const targetMission = missionsState.missions.find((m) => m.id === missionId);
    if (!targetMission || targetMission.status !== 'claimable') return;

    playMissionClaimSound();

    const bonusDiamonds = targetMission.rewardDiamonds || 0;
    const discountPct = targetMission.rewardDiscountPct || 0;
    const discountCode = targetMission.rewardDiscountCode;
    const bonusCredits = targetMission.rewardCreditsUsd || (bonusDiamonds > 0 ? Number((bonusDiamonds * 0.025).toFixed(2)) : 0.50);

    setMissionsState((prev) => {
      const updatedMissions = prev.missions.map((m) => {
        if (m.id === missionId) {
          return {
            ...m,
            status: 'completed' as const,
            claimedAt: Date.now(),
          };
        }
        return m;
      });

      const updatedVouchers = [...prev.vouchers];
      if (discountPct > 0 && discountCode) {
        // Add earned voucher if not already present
        const exists = updatedVouchers.some((v) => v.code === discountCode);
        if (!exists) {
          updatedVouchers.unshift({
            id: `voucher-${Date.now()}`,
            code: discountCode,
            discountPct: discountPct,
            description: `${discountPct}% Discount Voucher unlocked from "${targetMission.title}"`,
            earnedAt: Date.now(),
            expiresAt: Date.now() + 86400000 * 7,
            isUsed: false,
            missionId: targetMission.id,
          });
        }
      }

      return {
        ...prev,
        totalBonusDiamondsClaimed: prev.totalBonusDiamondsClaimed + bonusDiamonds,
        totalCreditsEarnedUsd: Number(((prev.totalCreditsEarnedUsd || 0) + bonusCredits).toFixed(2)),
        missions: updatedMissions,
        vouchers: updatedVouchers,
      };
    });

      if (onAddNotificationToast) {
        onAddNotificationToast({
          statusType: 'completed',
          title: `Reward Claimed: ${targetMission.title}`,
          message: bonusDiamonds > 0
            ? `+${bonusDiamonds} Bonus Diamonds & +${formatCurrency(bonusCredits, currency)} Mission Credits deposited to your Nexus Shop Wallet! ${discountPct > 0 ? `Plus ${discountPct}% OFF voucher unlocked!` : ''}`
            : `+${formatCurrency(bonusCredits, currency)} Mission Credits & ${discountPct}% OFF voucher "${discountCode}" unlocked!`,
          diamonds: bonusDiamonds,
          amount: bonusCredits,
        });
      }
    };

    // Claim all ready missions at once
    const handleClaimAll = () => {
      const claimableMissions = missionsState.missions.filter((m) => m.status === 'claimable');
      if (claimableMissions.length === 0) return;

      playMissionClaimSound();

      let totalDiamonds = 0;
      let totalCredits = 0;
      const newVouchers: EarnedVoucher[] = [];

      claimableMissions.forEach((m) => {
        if (m.rewardDiamonds) totalDiamonds += m.rewardDiamonds;
        const cred = m.rewardCreditsUsd || (m.rewardDiamonds ? Number((m.rewardDiamonds * 0.025).toFixed(2)) : 0.50);
        totalCredits += cred;
        if (m.rewardDiscountPct && m.rewardDiscountCode) {
          newVouchers.push({
            id: `voucher-${Date.now()}-${m.id}`,
            code: m.rewardDiscountCode,
            discountPct: m.rewardDiscountPct,
            description: `${m.rewardDiscountPct}% Discount Voucher unlocked from "${m.title}"`,
            earnedAt: Date.now(),
            expiresAt: Date.now() + 86400000 * 7,
            isUsed: false,
            missionId: m.id,
          });
        }
      });

      setMissionsState((prev) => {
        const updatedMissions = prev.missions.map((m) => {
          if (m.status === 'claimable') {
            return {
              ...m,
              status: 'completed' as const,
              claimedAt: Date.now(),
            };
          }
          return m;
        });

        return {
          ...prev,
          totalBonusDiamondsClaimed: prev.totalBonusDiamondsClaimed + totalDiamonds,
          totalCreditsEarnedUsd: Number(((prev.totalCreditsEarnedUsd || 0) + totalCredits).toFixed(2)),
          missions: updatedMissions,
          vouchers: [...newVouchers, ...prev.vouchers],
        };
      });

      if (onAddNotificationToast) {
        onAddNotificationToast({
          statusType: 'completed',
          title: `Claimed ${claimableMissions.length} Missions!`,
          message: `+${totalDiamonds} Bonus Diamonds & +${formatCurrency(totalCredits, currency)} Mission Credits collected into your Nexus Shop Wallet!`,
          diamonds: totalDiamonds,
          amount: totalCredits,
        });
      }
  };

  // Copy voucher code
  const handleCopyVoucher = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
    } catch {}
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Trigger mystery lucky spin
  const handleExecuteLuckySpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    setTimeout(() => {
      // Mystery prizes: 25 diamonds, 50 diamonds, 75 diamonds, or 15% discount
      const prizes = [
        { diamonds: 35, discount: 0 },
        { diamonds: 50, discount: 0 },
        { diamonds: 75, discount: 12, voucherCode: 'LUCKY12' },
        { diamonds: 100, discount: 15, voucherCode: 'JACKPOT15' },
      ];
      const selected = prizes[Math.floor(Math.random() * prizes.length)];
      setWheelResult(selected);
      setIsSpinning(false);
      playMissionClaimSound();

      // Mark lucky spin mission as claimable
      setMissionsState((prev) => ({
        ...prev,
        missions: prev.missions.map((m) =>
          m.id === 'lucky-spin'
            ? {
                ...m,
                currentProgress: 1,
                status: 'claimable' as const,
                rewardDiamonds: selected.diamonds,
                rewardDiscountPct: selected.discount || undefined,
                rewardDiscountCode: selected.voucherCode,
              }
            : m
        ),
      }));
    }, 1800);
  };

  // Filter missions
  const filteredMissions = useMemo(() => {
    if (activeCategory === 'all') return missionsState.missions;
    if (activeCategory === 'completed') {
      return missionsState.missions.filter((m) => m.status === 'completed');
    }
    return missionsState.missions.filter((m) => m.category === activeCategory);
  }, [activeCategory, missionsState.missions]);

  // Helper icon renderer
  const renderMissionIcon = (iconName: string) => {
    switch (iconName) {
      case 'CalendarCheck':
        return <CalendarCheck className="w-5 h-5 text-cyan-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Lock':
        return <Lock className="w-5 h-5 text-sky-400" />;
      case 'Users':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5 text-blue-400" />;
      case 'Share2':
        return <Share2 className="w-5 h-5 text-rose-400" />;
      case 'Gift':
        return <Gift className="w-5 h-5 text-pink-400" />;
      default:
        return <Award className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="py-6 space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Overview & Progress Dashboard */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1628] to-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl">
        {/* Glow accent */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Moonton Bounty Operations & Bonus Rewards</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Daily MLBB Missions</span>
              <span className="text-sm font-mono font-medium px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                Live
              </span>
            </h1>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Complete daily operations to unlock free bonus diamonds and exclusive discount vouchers for all MLBB packages.
            </p>
          </div>

          {/* Quick Timer & Claim All Action */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl self-start lg:self-auto shadow-inner">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next Reset:</span>
              </div>
              <div className="font-mono text-sm font-bold text-cyan-300">
                {timeUntilReset || 'Calculating...'}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            {claimableCount > 0 ? (
              <button
                type="button"
                onClick={handleClaimAll}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer animate-pulse"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Claim All Ready ({claimableCount})</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>All claimed up to date</span>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          
          {/* Card 1: Daily Streak */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Active Streak</span>
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {missionsState.streakDays}
              </span>
              <span className="text-xs text-amber-400 font-semibold">Days 🔥</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              {missionsState.streakDays >= 7 ? 'Max +20% Multiplier!' : `${7 - (missionsState.streakDays % 7)} days to 7-day jackpot`}
            </div>
          </div>

          {/* Card 2: Bonus Diamonds Earned */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Bonus Diamonds</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                +{missionsState.totalBonusDiamondsClaimed}
              </span>
              <span className="text-xs text-cyan-400 font-semibold">💎</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Saved in your player rewards balance
            </div>
          </div>

          {/* Card 3: Active Discount Vouchers */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Discount Vouchers</span>
              <Ticket className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-purple-300">
                {missionsState.vouchers.filter((v) => !v.isUsed).length}
              </span>
              <span className="text-xs text-purple-400 font-semibold">Ready</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Up to 15% OFF packages
            </div>
          </div>

          {/* Card 4: Daily Mission Completion */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-medium">Overall Progress</span>
              <Trophy className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {completedCount}/{missionsState.missions.length}
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                ({totalCompletionPct}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${totalCompletionPct}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 1.5 Visual Progress Tracker: 2 Daily VIP Diamond Claims & 24-Hour Reset Timer */}
      <div
        id="daily-missions-vip-claims-tracker"
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#141b2e] via-slate-900 to-[#111827] border-2 border-amber-400/70 p-5 shadow-xl shadow-amber-950/30 space-y-4"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 p-0.5 shadow-lg shadow-amber-500/25 shrink-0">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  VIP Daily Free Diamond Claims Tracker
                </h2>
                <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  {isDev
                    ? '👑 DEV UNLIMITED'
                    : `${vipClaimsUsed} / ${VIP_FREE_CLAIM_LIMIT} CLAIMS COMPLETED (${vipClaimsProgressPct}%)`}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Track your progress across your <strong className="text-amber-300">2 VIP Free Diamond Claims</strong> (172 💎 package) and live <strong className="text-cyan-300">24-hour reset timer</strong>.
              </p>
            </div>
          </div>

          {/* 24-Hour Reset Countdown Box & Action Button */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/90 border border-amber-500/40 p-3 rounded-xl self-start lg:self-auto">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>24-Hour Claim Reset:</span>
              </div>
              <div
                id="daily-missions-vip-24h-reset-timer"
                className="font-mono text-xs sm:text-sm font-black text-amber-300"
              >
                {vipClaimStatus.cooldownRemainingMs > 0
                  ? vipClaimStatus.cooldownRemainingFormatted
                  : vipClaimsUsed >= VIP_FREE_CLAIM_LIMIT && !isDev
                  ? `Quota Complete · Resets in ${timeUntilReset || '24h 00m'}`
                  : `Ready Now · Next Window (${timeUntilReset || '24h 00m'})`}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            {isVip || isDev ? (
              <button
                type="button"
                id="daily-missions-open-vip-claim-btn"
                onClick={() => {
                  if (onOpenProfileModal) {
                    onOpenProfileModal();
                  } else {
                    onNavigateToTab('buy');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Gem className="w-3.5 h-3.5 text-slate-950" />
                <span>
                  {vipClaimStatus.canClaimNow ? 'Quick Claim Diamonds' : 'View VIP Perks'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenVipUpgradeModal) {
                    onOpenVipUpgradeModal();
                  } else {
                    onNavigateToTab('buy');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                <span>Unlock VIP Claims (₱950)</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Dual-Slot Progress Stepper (Claim Slot #1 & Claim Slot #2) + Progress Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
          {/* Slot 1 */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
              vipClaimsUsed >= 1
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                : vipClaimStatus.canClaimNow
                ? 'bg-amber-950/40 border-amber-400/70 text-amber-200'
                : 'bg-slate-950/70 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                  vipClaimsUsed >= 1
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                }`}
              >
                {vipClaimsUsed >= 1 ? <Check className="w-4 h-4 stroke-[3]" /> : '1/2'}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>VIP Free Claim #1 (172 💎)</span>
                </div>
                <span className="text-[11px] text-slate-300 block">
                  {vipClaimsUsed >= 1
                    ? 'Claimed & credited to MLBB account'
                    : 'First 100% Free VIP Diamond Grant'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                vipClaimsUsed >= 1
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-400/50 text-amber-300'
              }`}
            >
              {vipClaimsUsed >= 1 ? 'COMPLETED' : 'READY'}
            </span>
          </div>

          {/* Slot 2 */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
              vipClaimsUsed >= 2
                ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                : vipClaimStatus.cooldownRemainingMs > 0
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : vipClaimsUsed === 1 && vipClaimStatus.canClaimNow
                ? 'bg-emerald-950/40 border-emerald-400/70 text-emerald-200'
                : 'bg-slate-950/70 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                  vipClaimsUsed >= 2
                    ? 'bg-emerald-500 text-slate-950'
                    : vipClaimStatus.cooldownRemainingMs > 0
                    ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                    : 'bg-slate-900 border border-slate-700 text-slate-300'
                }`}
              >
                {vipClaimsUsed >= 2 ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : vipClaimStatus.cooldownRemainingMs > 0 ? (
                  <Clock className="w-4 h-4 text-amber-400" />
                ) : (
                  '2/2'
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>VIP Free Claim #2 (172 💎)</span>
                </div>
                <span className="text-[11px] text-slate-300 block">
                  {vipClaimsUsed >= 2
                    ? 'All 2/2 VIP Free Claims Completed'
                    : vipClaimStatus.cooldownRemainingMs > 0
                    ? `24h Cooldown Active · Unlocks in ${vipClaimStatus.cooldownRemainingFormatted}`
                    : 'Unlocks after 24-hour reset interval'}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                vipClaimsUsed >= 2
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : vipClaimStatus.cooldownRemainingMs > 0
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                  : vipClaimsUsed === 1 && vipClaimStatus.canClaimNow
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {vipClaimsUsed >= 2
                ? 'COMPLETED'
                : vipClaimStatus.cooldownRemainingMs > 0
                ? '24H COOLDOWN'
                : vipClaimsUsed === 1 && vipClaimStatus.canClaimNow
                ? 'READY NOW'
                : 'QUEUED'}
            </span>
          </div>
        </div>

        {/* Visual Progress Bars for 2-Claim Quota & 24-Hour Reset Cycle */}
        <div className="space-y-1.5 pt-1 relative z-10">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-300">
              VIP Free Claim Quota Progress:{' '}
              <strong className="text-amber-300">
                {vipClaimsUsed} of {VIP_FREE_CLAIM_LIMIT} Claims Used ({vipClaimsProgressPct}%)
              </strong>
            </span>
            <span className="text-cyan-300">
              {vipClaimStatus.cooldownRemainingMs > 0
                ? `24h Reset Progress: ${vipResetProgressPct}% (${vipClaimStatus.cooldownRemainingFormatted} left)`
                : `Next 24h Reset Cycle: ${timeUntilReset || '24h 00m'}`}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-500"
              style={{
                width: `${
                  vipClaimsUsed > 0
                    ? Math.max(vipClaimsProgressPct, vipResetProgressPct * 0.5)
                    : vipClaimStatus.canClaimNow
                    ? 50
                    : 15
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Filter Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Missions ({missionsState.missions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('daily')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'daily'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Daily Tasks</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('security')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'security'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & ID</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('explore')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'explore'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore & Trade</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'completed'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed ({completedCount})</span>
          </button>
        </div>

        {/* Lucky Spin Quick Trigger */}
        <button
          type="button"
          onClick={() => setIsWheelOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/50 hover:bg-pink-900/60 border border-pink-700/50 text-pink-300 hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Gift className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
          <span>Lucky Mystery Drop</span>
        </button>
      </div>

      {/* 3. Missions Grid with Detailed Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMissions.map((mission) => {
          const isCompleted = mission.status === 'completed';
          const isClaimable = mission.status === 'claimable';
          const progressPct = Math.min(
            100,
            Math.round((mission.currentProgress / mission.targetProgress) * 100)
          );

          return (
            <div
              key={mission.id}
              className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between relative ${
                isCompleted
                  ? 'bg-slate-950/50 border-slate-800/60 opacity-80'
                  : isClaimable
                  ? 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-600/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top row: Category tag & Reward badge */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isCompleted
                          ? 'bg-slate-900 border-slate-800'
                          : isClaimable
                          ? 'bg-emerald-950/80 border-emerald-700/60 shadow-md shadow-emerald-900/40'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {renderMissionIcon(mission.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                        {mission.category}
                      </span>
                    </div>
                  </div>

                  {/* Reward Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {mission.rewardDiamonds && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-700/60 text-xs font-mono font-bold text-cyan-300">
                        <span>+{mission.rewardDiamonds}</span>
                        <span className="text-[11px]">💎</span>
                      </span>
                    )}
                    {(mission.rewardCreditsUsd || (!mission.rewardDiamonds && !mission.rewardDiscountPct)) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-700/60 text-xs font-mono font-bold text-emerald-300">
                        <Coins className="w-3 h-3 text-emerald-400" />
                        <span>+{formatCurrency(mission.rewardCreditsUsd || 0.50, currency)}</span>
                      </span>
                    )}
                    {mission.rewardDiscountPct && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-700/60 text-xs font-mono font-bold text-purple-300">
                        <Ticket className="w-3 h-3 text-purple-400" />
                        <span>{mission.rewardDiscountPct}% OFF</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {mission.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              {/* Progress Bar & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
                
                {/* Progress Indicators */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Mission Progress</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {mission.currentProgress} / {mission.targetProgress}{' '}
                    <span className="text-cyan-400">({progressPct}%)</span>
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted
                        ? 'bg-slate-600'
                        : isClaimable
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-sm shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Action Button Row */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate">
                    {mission.progressUnit && (
                      <span>Metric: <strong className="text-slate-300">{mission.progressUnit}</strong></span>
                    )}
                  </div>

                  {isCompleted ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Claimed</span>
                    </div>
                  ) : isClaimable ? (
                    <button
                      type="button"
                      onClick={() => handleClaimMission(mission.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/30 transition-all cursor-pointer animate-pulse"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Claim Reward</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMissionAction(mission)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>{mission.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Earned Discount Vouchers Vault Section */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-400" />
              <span>Your Earned Discount Vouchers</span>
            </h2>
            <p className="text-xs text-slate-400">
              Apply these promo codes during checkout on any Mobile Legends diamond package.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('buy')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>Shop With Vouchers</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {missionsState.vouchers.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
            Complete daily missions to unlock exclusive discount vouchers!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missionsState.vouchers.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 to-[#121324] border border-purple-900/40 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-700/50">
                      {v.discountPct}% DISCOUNT
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Expires in 7 days
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 pt-1 leading-snug">
                    {v.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-white tracking-wider bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    {v.code}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyVoucher(v.code)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/50 text-purple-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedCode === v.code ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Interactive Lucky Mystery Drop Modal */}
      {isWheelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl relative">
            <div className="text-center space-y-1 mb-5">
              <div className="w-12 h-12 rounded-xl bg-pink-950/70 border border-pink-700/60 flex items-center justify-center text-pink-400 mx-auto shadow-lg shadow-pink-900/40">
                <Gift className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-bold text-white">Daily Mystery Wheel</h3>
              <p className="text-xs text-slate-300">
                Spin once every 24 hours to win bonus diamonds or top-up vouchers!
              </p>
            </div>

            {/* Wheel visual */}
            <div className="relative w-44 h-44 mx-auto my-4 rounded-full border-4 border-pink-500/50 bg-gradient-to-tr from-pink-950 via-purple-950 to-slate-950 flex items-center justify-center shadow-xl shadow-pink-950/50">
              <div
                className={`w-36 h-36 rounded-full border-2 border-dashed border-pink-400/40 flex flex-col items-center justify-center p-2 text-center transition-transform duration-1000 ${
                  isSpinning ? 'animate-spin' : ''
                }`}
              >
                <Sparkles className="w-6 h-6 text-pink-300 animate-pulse" />
                <span className="text-[11px] font-bold text-white mt-1">
                  {isSpinning ? 'Spinning Vault...' : 'Nexus Shop Lucky Drop'}
                </span>
                <span className="text-[9px] text-pink-300 font-mono">Up to 100 💎</span>
              </div>
            </div>

            {/* Result notice */}
            {wheelResult && !isSpinning && (
              <div className="my-3 p-3 rounded-xl bg-emerald-950/50 border border-emerald-700/60 text-center space-y-1 animate-in zoom-in-95 duration-200">
                <div className="text-xs font-bold text-emerald-300">
                  🎉 Congratulations! You Won:
                </div>
                <div className="font-mono text-base font-black text-white">
                  +{wheelResult.diamonds} Bonus Diamonds!
                </div>
                {wheelResult.discount && wheelResult.discount > 0 && (
                  <div className="text-xs text-purple-300 font-mono font-semibold">
                    Plus {wheelResult.discount}% OFF Coupon ({wheelResult.voucherCode})
                  </div>
                )}
              </div>
            )}

            {/* Modal actions */}
            <div className="space-y-2 mt-4">
              <button
                type="button"
                onClick={handleExecuteLuckySpin}
                disabled={isSpinning}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-pink-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Spinning...' : 'Spin the Lucky Wheel'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWheelOpen(false)}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
