import React from 'react';
import { ShieldCheck, Award, ChevronRight, CheckCircle2 } from 'lucide-react';
import { playModalOpenSound } from '../utils/audio';

interface AuthorizedPartnerBadgeProps {
  onClick: () => void;
  variant?: 'navbar' | 'hero';
  className?: string;
}

export const AuthorizedPartnerBadge: React.FC<AuthorizedPartnerBadgeProps> = ({
  onClick,
  variant = 'navbar',
  className = '',
}) => {
  const handleClick = () => {
    playModalOpenSound();
    onClick();
  };

  if (variant === 'hero') {
    return (
      <button
        type="button"
        id="hero-authorized-partner-badge"
        onClick={handleClick}
        title="Click to inspect Official Reseller Registration Certificate & Moonton Partnership Verification"
        className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-950/95 via-teal-950/90 to-cyan-950/95 hover:from-emerald-900 hover:to-cyan-900 border border-emerald-400/60 hover:border-emerald-300 text-emerald-200 font-mono font-bold text-[10px] sm:text-[11px] transition-all cursor-pointer shadow-md shadow-emerald-950/50 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 ${className}`}
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
        </span>
        <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="tracking-wide text-emerald-200 group-hover:text-white">
          Authorized Partner
        </span>
        <span className="hidden sm:inline text-emerald-400/80 font-normal">
          • Certificate #MNTN-SEA-88412
        </span>
        <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      id="navbar-authorized-partner-badge"
      onClick={handleClick}
      title="View Official Reseller Registration Certificate & Moonton Partnership Verification"
      className={`group inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-950/95 via-slate-900 to-teal-950/95 hover:from-emerald-900/90 hover:to-teal-900/90 border border-emerald-500/60 hover:border-emerald-300 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/25 ${className}`}
    >
      <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
      <span>Authorized Partner</span>
      <CheckCircle2 className="w-2.5 h-2.5 text-amber-400 shrink-0 hidden lg:inline" />
    </button>
  );
};
