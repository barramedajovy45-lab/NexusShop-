import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Currency, EscrowOrder, SellerProfile } from '../types';
import { formatCurrency } from '../utils/formatters';
import {
  TrendingUp,
  CheckCircle2,
  Calendar,
  Gem,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  AlertCircle,
  HelpCircle,
  Percent,
  ChevronRight,
} from 'lucide-react';

interface SellerPerformanceDashboardProps {
  sellerProfile: SellerProfile;
  orders: EscrowOrder[];
  currency: Currency;
}

type TrendPeriod = 'monthly' | 'daily';
type MonthlyRange = '6m' | '12m';
type DailyRange = '7d' | '14d' | '30d';
type MetricView = 'volume' | 'revenue' | 'both';
type DistributionScope = 'active_session' | 'lifetime';

interface DailyDataPoint {
  date: string;
  displayDate: string;
  dayName: string;
  timestamp: number;
  completedOrders: number;
  revenueUsd: number;
  revenuePhp: number;
  diamondsDelivered: number;
  avgDeliveryMins: number;
  peakLabel?: string;
}

interface MonthlyDataPoint {
  monthKey: string; // e.g. "2026-09"
  displayMonth: string; // e.g. "Sep 2026"
  shortMonth: string; // e.g. "Sep"
  completedOrders: number;
  revenueUsd: number;
  revenuePhp: number;
  diamondsDelivered: number;
  momGrowthPct: number;
  avgOrderValueUsd: number;
  slaRate: number;
  isCurrentMonth?: boolean;
}

interface OrderStatusSegment {
  key: string;
  name: string;
  count: number;
  percentage: number;
  valueUsd: number;
  valuePhp: number;
  color: string;
  description: string;
  slaNote: string;
}

export const SellerPerformanceDashboard: React.FC<SellerPerformanceDashboardProps> = ({
  sellerProfile,
  orders,
  currency,
}) => {
  // Navigation & view toggles
  const [activeDashboardTab, setActiveDashboardTab] = useState<'trends' | 'distribution' | 'dual'>('dual');
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly');
  const [monthlyRange, setMonthlyRange] = useState<MonthlyRange>('6m');
  const [dailyRange, setDailyRange] = useState<DailyRange>('14d');
  const [metricView, setMetricView] = useState<MetricView>('both');
  const [distributionScope, setDistributionScope] = useState<DistributionScope>('active_session');
  const [hoveredStatusKey, setHoveredStatusKey] = useState<string | null>(null);

  // Exchange rate approximation for dual currency calculation
  const phpRate = 58.5;

  // 1. Compute Monthly Sales Trends
  const monthlyData = useMemo(() => {
    const monthCount = monthlyRange === '6m' ? 6 : 12;
    // Current simulated date: September 2026
    const referenceDate = new Date(2026, 8, 19); // Sep 19, 2026
    const points: MonthlyDataPoint[] = [];

    // Filter completed orders for this seller
    const completedOrders = orders.filter(
      (o) => o.status === 'completed' && (o.sellerId === sellerProfile.id || !o.sellerId)
    );

    // Monthly baseline parameters calibrated to ApexTopUp's 14,820 total sales & $18,450 earnings
    const baseMonthlyOrders = [
      890, 940, 1020, 1080, 1150, 1210, 1260, 1340, 1390, 1450, 1510, 1280
    ];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const displayMonth = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
      const isCurrentMonth = i === 0;

      // Base orders calculation with realistic growth curve
      const baselineIndex = (12 - monthCount + (monthCount - 1 - i)) % 12;
      let monthBaseOrders = baseMonthlyOrders[baselineIndex] || 1100;
      
      // If current month (in progress), scale proportionally to current day
      if (isCurrentMonth) {
        monthBaseOrders = Math.floor(monthBaseOrders * 0.72);
      }

      // Aggregate live completed orders in this session matching this month
      const sessionCompletedThisMonth = completedOrders.filter((ord) => {
        const t = ord.completedAt || ord.createdAt;
        const ordDate = new Date(t);
        return ordDate.getFullYear() === year && ordDate.getMonth() === month;
      });

      const liveOrdersCount = sessionCompletedThisMonth.length;
      const liveRevenueUsd = sessionCompletedThisMonth.reduce((acc, o) => acc + (o.amount || 0), 0);
      const liveDiamonds = sessionCompletedThisMonth.reduce((acc, o) => acc + (o.diamonds || 0), 0);

      const totalCompletedOrders = monthBaseOrders + liveOrdersCount;
      const baseRevenueUsd = monthBaseOrders * 4.82;
      const totalRevenueUsd = +(baseRevenueUsd + liveRevenueUsd).toFixed(2);
      const totalRevenuePhp = +(totalRevenueUsd * phpRate).toFixed(2);
      const totalDiamonds = monthBaseOrders * 320 + liveDiamonds;
      const avgOrderValueUsd = +(totalRevenueUsd / Math.max(1, totalCompletedOrders)).toFixed(2);

      // MoM growth percentage calculation
      const prevMonthOrders = points.length > 0 ? points[points.length - 1].completedOrders : monthBaseOrders * 0.94;
      const momGrowthPct = +(((totalCompletedOrders - prevMonthOrders) / prevMonthOrders) * 100).toFixed(1);

      points.push({
        monthKey,
        displayMonth,
        shortMonth,
        completedOrders: totalCompletedOrders,
        revenueUsd: totalRevenueUsd,
        revenuePhp: totalRevenuePhp,
        diamondsDelivered: totalDiamonds,
        momGrowthPct,
        avgOrderValueUsd,
        slaRate: 99.8 + ((month % 3) * 0.1),
        isCurrentMonth,
      });
    }

    return points;
  }, [monthlyRange, orders, sellerProfile.id]);

  // 2. Compute Daily Sales Trends
  const dailyData = useMemo(() => {
    const daysCount = dailyRange === '7d' ? 7 : dailyRange === '14d' ? 14 : 30;
    const now = new Date(2026, 8, 19); // Sep 19, 2026
    const data: DailyDataPoint[] = [];

    const completedSellerOrders = orders.filter(
      (o) => o.status === 'completed' && (o.sellerId === sellerProfile.id || !o.sellerId)
    );

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dayStart = d.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const seed = (d.getFullYear() * 1000 + (d.getMonth() + 1) * 50 + d.getDate()) % 17;
      
      let baseOrders = 22 + (seed % 12);
      if (isWeekend) {
        baseOrders += 10 + (seed % 6);
      }
      if (i === 0) {
        baseOrders = Math.floor(baseOrders * 0.75);
      }

      const baseRevenue = baseOrders * 4.65 + (seed * 1.8);
      const baseDiamonds = baseOrders * 280;

      const sessionDayCompleted = completedSellerOrders.filter((ord) => {
        const orderTime = ord.completedAt || ord.createdAt;
        return orderTime >= dayStart && orderTime < dayEnd;
      });

      const liveOrdersCount = sessionDayCompleted.length;
      const liveRevenue = sessionDayCompleted.reduce((sum, o) => sum + (o.amount || 0), 0);
      const liveDiamonds = sessionDayCompleted.reduce((sum, o) => sum + (o.diamonds || 0), 0);

      const totalCompleted = baseOrders + liveOrdersCount;
      const totalRevenue = +(baseRevenue + liveRevenue).toFixed(2);
      const totalRevenuePhp = +(totalRevenue * phpRate).toFixed(2);
      const totalDiamonds = baseDiamonds + liveDiamonds;

      let peakLabel: string | undefined = undefined;
      if (isWeekend && totalCompleted > 34) {
        peakLabel = 'Weekend Starlight Peak';
      }

      data.push({
        date: dateStr,
        displayDate,
        dayName,
        timestamp: dayStart,
        completedOrders: totalCompleted,
        revenueUsd: totalRevenue,
        revenuePhp: totalRevenuePhp,
        diamondsDelivered: totalDiamonds,
        avgDeliveryMins: +(1.8 + (seed % 8) * 0.1).toFixed(1),
        peakLabel,
      });
    }

    return data;
  }, [dailyRange, orders, sellerProfile.id]);

  // 3. Compute Order Status Distribution (Recharts Pie / Donut Data)
  const statusDistribution = useMemo(() => {
    // Categorize session orders
    const pendingLockedOrders = orders.filter(
      (o) => o.status === 'escrow_locked' || o.status === 'escrow_pending'
    );
    const processingOrders = orders.filter((o) => o.status === 'seller_processing');
    const deliveredOrders = orders.filter(
      (o) => o.status === 'delivered_pending_confirmation' || o.status === 'delivery_proof_uploaded'
    );
    const completedOrders = orders.filter((o) => o.status === 'completed');
    const disputedCancelledOrders = orders.filter(
      (o) => o.status === 'disputed' || o.status === 'cancelled' || o.status === 'refunded'
    );

    if (distributionScope === 'active_session') {
      const totalSessionOrders = Math.max(1, orders.length);

      const calcValueUsd = (arr: EscrowOrder[]) => arr.reduce((acc, o) => acc + (o.amount || 0), 0);
      const calcValuePhp = (arr: EscrowOrder[]) => arr.reduce((acc, o) => acc + (o.amountPhp || (o.amount || 0) * phpRate), 0);

      const segments: OrderStatusSegment[] = [
        {
          key: 'completed',
          name: 'Completed & Settled',
          count: completedOrders.length,
          percentage: +((completedOrders.length / totalSessionOrders) * 100).toFixed(1),
          valueUsd: calcValueUsd(completedOrders),
          valuePhp: calcValuePhp(completedOrders),
          color: '#10b981', // Emerald-500
          description: 'Recharge delivered, inspection passed, escrow released to seller',
          slaNote: '0% chargebacks · Payout unlocked',
        },
        {
          key: 'pending_locked',
          name: 'Escrow Locked',
          count: pendingLockedOrders.length,
          percentage: +((pendingLockedOrders.length / totalSessionOrders) * 100).toFixed(1),
          valueUsd: calcValueUsd(pendingLockedOrders),
          valuePhp: calcValuePhp(pendingLockedOrders),
          color: '#06b6d4', // Cyan-500
          description: 'Buyer payment securely locked in Aegis Vault awaiting top-up',
          slaNote: '3 min SLA dispatch guarantee',
        },
        {
          key: 'processing',
          name: 'Seller Processing',
          count: processingOrders.length,
          percentage: +((processingOrders.length / totalSessionOrders) * 100).toFixed(1),
          valueUsd: calcValueUsd(processingOrders),
          valuePhp: calcValuePhp(processingOrders),
          color: '#3b82f6', // Blue-500
          description: 'Top-up in progress via Moonton Authorized API gateway',
          slaNote: 'Avg dispatch 1.8 mins',
        },
        {
          key: 'delivered',
          name: 'Delivered (Inspection)',
          count: deliveredOrders.length,
          percentage: +((deliveredOrders.length / totalSessionOrders) * 100).toFixed(1),
          valueUsd: calcValueUsd(deliveredOrders),
          valuePhp: calcValuePhp(deliveredOrders),
          color: '#a855f7', // Purple-500
          description: 'Diamonds sent & proof submitted; 15-min auto-release timer active',
          slaNote: 'Auto-settles in 15 mins',
        },
        {
          key: 'disputed_cancelled',
          name: 'Disputed / Cancelled',
          count: disputedCancelledOrders.length,
          percentage: +((disputedCancelledOrders.length / totalSessionOrders) * 100).toFixed(1),
          valueUsd: calcValueUsd(disputedCancelledOrders),
          valuePhp: calcValuePhp(disputedCancelledOrders),
          color: '#f43f5e', // Rose-500
          description: 'Cancelled by user or undergoing Aegis Arbiter mediation',
          slaNote: '100% money-back escrow resolution',
        },
      ];

      return {
        segments,
        totalOrdersCount: orders.length,
        totalLockedUsd: calcValueUsd(pendingLockedOrders) + calcValueUsd(processingOrders),
        totalLockedPhp: calcValuePhp(pendingLockedOrders) + calcValuePhp(processingOrders),
        totalCompletedUsd: calcValueUsd(completedOrders),
        totalCompletedPhp: calcValuePhp(completedOrders),
      };
    } else {
      // Lifetime Distribution Model for ApexTopUp (14,820 orders track record)
      const lifetimeTotal = sellerProfile.totalSales + orders.length;
      const completedCount = Math.floor(lifetimeTotal * 0.978) + completedOrders.length;
      const lockedCount = Math.floor(lifetimeTotal * 0.009) + pendingLockedOrders.length;
      const processingCount = Math.floor(lifetimeTotal * 0.005) + processingOrders.length;
      const deliveredCount = Math.floor(lifetimeTotal * 0.006) + deliveredOrders.length;
      const disputedCount = lifetimeTotal - (completedCount + lockedCount + processingCount + deliveredCount);

      const segments: OrderStatusSegment[] = [
        {
          key: 'completed',
          name: 'Completed & Settled',
          count: completedCount,
          percentage: +((completedCount / lifetimeTotal) * 100).toFixed(1),
          valueUsd: sellerProfile.totalEarnedUsd,
          valuePhp: sellerProfile.totalEarnedUsd * phpRate,
          color: '#10b981',
          description: 'Lifetime fulfilled recharges with verified proof of Moonton credit',
          slaNote: '99.9% fulfillment rate',
        },
        {
          key: 'pending_locked',
          name: 'Escrow Locked',
          count: lockedCount,
          percentage: +((lockedCount / lifetimeTotal) * 100).toFixed(1),
          valueUsd: sellerProfile.escrowLockedBalanceUsd * 0.6,
          valuePhp: sellerProfile.escrowLockedBalanceUsd * 0.6 * phpRate,
          color: '#06b6d4',
          description: 'Funds held in Aegis multi-sig smart escrow awaiting recharge dispatch',
          slaNote: 'Guaranteed seller release upon delivery',
        },
        {
          key: 'processing',
          name: 'Seller Processing',
          count: processingCount,
          percentage: +((processingCount / lifetimeTotal) * 100).toFixed(1),
          valueUsd: sellerProfile.escrowLockedBalanceUsd * 0.4,
          valuePhp: sellerProfile.escrowLockedBalanceUsd * 0.4 * phpRate,
          color: '#3b82f6',
          description: 'Orders currently being processed by automated distributor API',
          slaNote: 'Real-time server sync',
        },
        {
          key: 'delivered',
          name: 'Delivered (Inspection)',
          count: deliveredCount,
          percentage: +((deliveredCount / lifetimeTotal) * 100).toFixed(1),
          valueUsd: 142.5,
          valuePhp: 142.5 * phpRate,
          color: '#a855f7',
          description: 'Proof of recharge delivered; awaiting buyer confirmation',
          slaNote: 'Zero unresolved disputes',
        },
        {
          key: 'disputed_cancelled',
          name: 'Disputed / Cancelled',
          count: Math.max(1, disputedCount),
          percentage: +((Math.max(1, disputedCount) / lifetimeTotal) * 100).toFixed(1),
          valueUsd: 48.0,
          valuePhp: 48.0 * phpRate,
          color: '#f43f5e',
          description: 'Historical mutual cancellations or invalid MLBB Zone ID returns',
          slaNote: '0.1% dispute rate',
        },
      ];

      return {
        segments,
        totalOrdersCount: lifetimeTotal,
        totalLockedUsd: sellerProfile.escrowLockedBalanceUsd,
        totalLockedPhp: sellerProfile.escrowLockedBalanceUsd * phpRate,
        totalCompletedUsd: sellerProfile.totalEarnedUsd,
        totalCompletedPhp: sellerProfile.totalEarnedUsd * phpRate,
      };
    }
  }, [orders, distributionScope, sellerProfile, phpRate]);

  // Dynamic KPI Summary depending on selected period
  const kpiSummary = useMemo(() => {
    if (trendPeriod === 'monthly') {
      const totalOrders = monthlyData.reduce((acc, curr) => acc + curr.completedOrders, 0);
      const totalRevenueUsd = monthlyData.reduce((acc, curr) => acc + curr.revenueUsd, 0);
      const totalRevenuePhp = monthlyData.reduce((acc, curr) => acc + curr.revenuePhp, 0);
      const totalDiamonds = monthlyData.reduce((acc, curr) => acc + curr.diamondsDelivered, 0);
      const avgMonthlyOrders = Math.round(totalOrders / monthlyData.length);
      const latestMonth = monthlyData[monthlyData.length - 1];

      return {
        totalOrders,
        totalRevenueUsd,
        totalRevenuePhp,
        totalDiamonds,
        avgRateLabel: `${avgMonthlyOrders.toLocaleString()} orders/mo`,
        growthRate: latestMonth ? latestMonth.momGrowthPct : 12.4,
        peakDisplay: latestMonth ? latestMonth.displayMonth : 'Current',
      };
    } else {
      const totalOrders = dailyData.reduce((acc, curr) => acc + curr.completedOrders, 0);
      const totalRevenueUsd = dailyData.reduce((acc, curr) => acc + curr.revenueUsd, 0);
      const totalRevenuePhp = dailyData.reduce((acc, curr) => acc + curr.revenuePhp, 0);
      const totalDiamonds = dailyData.reduce((acc, curr) => acc + curr.diamondsDelivered, 0);
      const avgDailyOrders = (totalOrders / dailyData.length).toFixed(1);

      return {
        totalOrders,
        totalRevenueUsd,
        totalRevenuePhp,
        totalDiamonds,
        avgRateLabel: `${avgDailyOrders} orders/day`,
        growthRate: 14.8,
        peakDisplay: 'Weekend Starlight',
      };
    }
  }, [trendPeriod, monthlyData, dailyData]);

  // Custom Tooltip for Monthly & Daily Sales Trends
  const CustomTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isMonthly = trendPeriod === 'monthly';

      return (
        <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 rounded-xl p-3.5 shadow-2xl text-xs space-y-2.5 z-50 min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {isMonthly ? data.displayMonth : `${data.dayName}, ${data.displayDate}`}
            </span>
            {isMonthly ? (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  data.momGrowthPct >= 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                }`}
              >
                {data.momGrowthPct >= 0 ? `+${data.momGrowthPct}% MoM` : `${data.momGrowthPct}% MoM`}
              </span>
            ) : (
              data.peakLabel && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                  {data.peakLabel}
                </span>
              )
            )}
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-cyan-300">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                Completed Orders:
              </span>
              <span className="font-bold text-sm text-white">{data.completedOrders.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                Settled Revenue:
              </span>
              <span className="font-bold">{formatCurrency(data.revenueUsd, currency, data.revenuePhp)}</span>
            </div>

            <div className="flex items-center justify-between text-blue-300 text-[11px]">
              <span className="flex items-center gap-1">
                <Gem className="w-3 h-3 text-blue-400" />
                Diamonds Sent:
              </span>
              <span className="text-slate-200">{data.diamondsDelivered.toLocaleString()} 💎</span>
            </div>

            {isMonthly && (
              <div className="flex items-center justify-between text-amber-300 text-[10px] pt-1 border-t border-slate-800/80">
                <span>Avg Order Value:</span>
                <span>{formatCurrency(data.avgOrderValueUsd, currency, data.avgOrderValueUsd * phpRate)}</span>
              </div>
            )}

            {!isMonthly && (
              <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-800/80">
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  Avg SLA Speed:
                </span>
                <span className="text-slate-300">{data.avgDeliveryMins} mins</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Order Status Distribution Donut
  const CustomStatusTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: OrderStatusSegment = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-2 z-50 min-w-[210px]">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-white">{data.name}</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Order Count:</span>
              <span className="font-bold text-white text-sm">{data.count.toLocaleString()} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Share of Total:</span>
              <span className="font-bold text-cyan-300">{data.percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-slate-400">Escrow Value:</span>
              <span className="font-bold">{formatCurrency(data.valueUsd, currency, data.valuePhp)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            {data.description}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="seller-performance-dashboard" className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Header & View Mode Switchers */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
              Seller Analytics & Performance Dashboard
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Escrow Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recharts-powered telemetry tracking monthly sales volume, revenue velocity, and real-time order status distribution.
          </p>
        </div>

        {/* View Layout Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveDashboardTab('dual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'dual'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Analytics (Bento)</span>
            </button>

            <button
              onClick={() => setActiveDashboardTab('trends')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'trends'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Sales Trends</span>
            </button>

            <button
              onClick={() => setActiveDashboardTab('distribution')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDashboardTab === 'distribution'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Status Distribution</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {/* Total Completed Orders */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Orders</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
              {kpiSummary.totalOrders.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              +{kpiSummary.growthRate}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {trendPeriod === 'monthly' ? `${monthlyRange.toUpperCase()} historical window` : `${dailyRange.toUpperCase()} live tracking`}
          </p>
        </div>

        {/* Velocity / Average Volume */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recharge Velocity</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-cyan-300 tabular-nums">
              {kpiSummary.avgRateLabel}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Consistent escrow execution</p>
        </div>

        {/* Settled Payout Value */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Settled Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
              {formatCurrency(kpiSummary.totalRevenueUsd, currency, kpiSummary.totalRevenuePhp)}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">100% unlocked with 0 chargebacks</p>
        </div>

        {/* Diamonds Dispatched */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Diamonds Dispatched</span>
            <Gem className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tabular-nums">
              {kpiSummary.totalDiamonds.toLocaleString()} 💎
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Credited directly to player MLBB IDs</p>
        </div>
      </div>

      {/* Analytics Main View: Bento Grid */}
      <div className="space-y-6 relative z-10">
        {/* SECTION 1: Sales Trends Chart (Monthly & Daily) */}
        {(activeDashboardTab === 'dual' || activeDashboardTab === 'trends') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-4 shadow-lg">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    {trendPeriod === 'monthly' ? 'Monthly Sales Trends & Revenue Velocity' : 'Daily Sales Volume & Settlement Flow'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {trendPeriod === 'monthly'
                      ? 'Aggregated historical sales volume and gross escrow settlements by calendar month'
                      : 'High-frequency daily delivery volume and Moonton API recharge spikes'}
                  </p>
                </div>
              </div>

              {/* Chart Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Period Selector: Monthly vs Daily */}
                <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                  <button
                    onClick={() => setTrendPeriod('monthly')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      trendPeriod === 'monthly'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly Trends
                  </button>
                  <button
                    onClick={() => setTrendPeriod('daily')}
                    className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                      trendPeriod === 'daily'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Daily Volume
                  </button>
                </div>

                {/* Sub-range Selector */}
                {trendPeriod === 'monthly' ? (
                  <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                    <button
                      onClick={() => setMonthlyRange('6m')}
                      className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        monthlyRange === '6m'
                          ? 'bg-slate-800 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Last 6M
                    </button>
                    <button
                      onClick={() => setMonthlyRange('12m')}
                      className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        monthlyRange === '12m'
                          ? 'bg-slate-800 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Last 12M
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                    <button
                      onClick={() => setDailyRange('7d')}
                      className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        dailyRange === '7d'
                          ? 'bg-slate-800 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      7D
                    </button>
                    <button
                      onClick={() => setDailyRange('14d')}
                      className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        dailyRange === '14d'
                          ? 'bg-slate-800 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      14D
                    </button>
                    <button
                      onClick={() => setDailyRange('30d')}
                      className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                        dailyRange === '30d'
                          ? 'bg-slate-800 text-white font-bold border border-slate-700'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      30D
                    </button>
                  </div>
                )}

                {/* Metric View Mode */}
                <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                  <button
                    onClick={() => setMetricView('volume')}
                    className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                      metricView === 'volume'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Orders
                  </button>
                  <button
                    onClick={() => setMetricView('revenue')}
                    className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                      metricView === 'revenue'
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Revenue
                  </button>
                  <button
                    onClick={() => setMetricView('both')}
                    className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                      metricView === 'both'
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Dual View
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Monthly / Daily Composed Chart */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={(trendPeriod === 'monthly' ? monthlyData : dailyData) as any}
                  margin={{ top: 12, right: 16, left: -14, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendCyanBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="trendEmeraldArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />

                  <XAxis
                    dataKey={trendPeriod === 'monthly' ? 'shortMonth' : 'displayDate'}
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />

                  {/* Primary Y-Axis: Orders Count */}
                  <YAxis
                    yAxisId="ordersAxis"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />

                  {/* Secondary Y-Axis: Revenue in USD/PHP */}
                  {(metricView === 'revenue' || metricView === 'both') && (
                    <YAxis
                      yAxisId="revenueAxis"
                      orientation="right"
                      stroke="#10b981"
                      tick={{ fill: '#10b981', fontSize: 11, fontFamily: 'monospace' }}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                  )}

                  <Tooltip content={<CustomTrendTooltip />} />

                  {/* Volume Bars */}
                  {(metricView === 'volume' || metricView === 'both') && (
                    <Bar
                      yAxisId="ordersAxis"
                      dataKey="completedOrders"
                      name="Completed Orders"
                      fill="url(#trendCyanBar)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  )}

                  {/* Revenue Area */}
                  {metricView === 'revenue' && (
                    <Area
                      yAxisId="revenueAxis"
                      type="monotone"
                      dataKey="revenueUsd"
                      fill="url(#trendEmeraldArea)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                    />
                  )}

                  {/* Revenue Line in Dual View */}
                  {metricView === 'both' && (
                    <Line
                      yAxisId="revenueAxis"
                      type="monotone"
                      dataKey="revenueUsd"
                      name="Settled Revenue ($)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#10b981', stroke: '#064e3b', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend & Summary Footnote */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-3 h-3 rounded bg-cyan-500/80 inline-block" />
                  <span className="text-slate-300">Completed Orders Volume</span>
                </div>
                {(metricView === 'revenue' || metricView === 'both') && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-3 h-1 bg-emerald-400 rounded-full inline-block" />
                    <span className="text-emerald-400">Settled Revenue (USD/PHP)</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {trendPeriod === 'monthly'
                  ? `Peak month: ${kpiSummary.peakDisplay} · Average ticket: $4.85 / ₱283.72`
                  : 'Automatic real-time sync with Aegis Vault settlements'}
              </span>
            </div>
          </div>
        )}

        {/* SECTION 2: Order Status Distribution (Recharts Donut / Pie Chart & Breakdown) */}
        {(activeDashboardTab === 'dual' || activeDashboardTab === 'distribution') && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-4 shadow-lg">
            {/* Header & Scope Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <PieChartIcon className="w-4 h-4 text-purple-400" />
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Escrow Order Status Distribution & Vault Allocation
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Real-time status breakdown across active recharge pipeline, inspection windows, and released escrow
                  </p>
                </div>
              </div>

              {/* Distribution Scope Toggle */}
              <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
                <button
                  onClick={() => setDistributionScope('active_session')}
                  className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                    distributionScope === 'active_session'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active Session ({orders.length})
                </button>
                <button
                  onClick={() => setDistributionScope('lifetime')}
                  className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                    distributionScope === 'lifetime'
                      ? 'bg-purple-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Lifetime ({statusDistribution.totalOrdersCount.toLocaleString()})
                </button>
              </div>
            </div>

            {/* Grid Layout: Recharts Donut Chart on left + Detailed Status Cards on right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Recharts PieChart / Donut (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                <div className="w-full h-64 sm:h-72 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution.segments}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={3}
                        stroke="#090d16"
                        strokeWidth={2}
                      >
                        {statusDistribution.segments.map((entry) => (
                          <Cell
                            key={`cell-${entry.key}`}
                            fill={entry.color}
                            opacity={
                              hoveredStatusKey && hoveredStatusKey !== entry.key ? 0.45 : 1
                            }
                            className="transition-opacity duration-200 cursor-pointer"
                            onMouseEnter={() => setHoveredStatusKey(entry.key)}
                            onMouseLeave={() => setHoveredStatusKey(null)}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomStatusTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      Total Orders
                    </span>
                    <span className="text-xl sm:text-2xl font-black font-mono text-white">
                      {statusDistribution.totalOrdersCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      99.8% Settled
                    </span>
                  </div>
                </div>

                {/* Sub-label under chart */}
                <span className="text-[11px] text-slate-400 text-center font-mono">
                  {distributionScope === 'active_session'
                    ? 'Showing real-time states in the current active escrow store'
                    : 'Showing comprehensive all-time verified merchant order history'}
                </span>
              </div>

              {/* Right Column: Interactive Status Cards Breakdown (7 cols) */}
              <div className="lg:col-span-7 space-y-2.5">
                {statusDistribution.segments.map((seg) => {
                  const isHovered = hoveredStatusKey === seg.key;
                  return (
                    <div
                      key={seg.key}
                      onMouseEnter={() => setHoveredStatusKey(seg.key)}
                      onMouseLeave={() => setHoveredStatusKey(null)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isHovered
                          ? 'bg-slate-900 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: seg.color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{seg.name}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                {seg.percentage}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                              {seg.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <span className="text-xs font-bold text-white block">
                            {seg.count.toLocaleString()} {seg.count === 1 ? 'order' : 'orders'}
                          </span>
                          <span className="text-[11px] text-emerald-400 block font-semibold">
                            {formatCurrency(seg.valueUsd, currency, seg.valuePhp)}
                          </span>
                        </div>
                      </div>

                      {/* SLA badge strip */}
                      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-cyan-400" />
                          <span>Operational SLA: {seg.slaNote}</span>
                        </span>
                        <span className="text-slate-400">
                          Status Key: <code className="text-slate-300">{seg.key}</code>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operational Highlights & SLA Guarantee Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs relative z-10">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-semibold block">99.9% Fulfillment SLA</span>
            <span className="text-[11px] text-slate-400">Zero arbitration interventions or escrow defaults</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-semibold block">Moonton API Auto-Credit</span>
            <span className="text-[11px] text-slate-400">Average recharge delivery speed under 2 minutes</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Gem className="w-4 h-4" />
          </div>
          <div>
            <span className="text-white font-semibold block">
              {kpiSummary.totalDiamonds.toLocaleString()} 💎 Credited
            </span>
            <span className="text-[11px] text-slate-400">Fully settled and verified across Southeast Asia servers</span>
          </div>
        </div>
      </div>
    </div>
  );
};
