import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface NexusLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textClassName?: string;
  subtitle?: string;
  animate?: boolean;
  variant?: 'emblem' | 'full';
}

export const NexusLogo: React.FC<NexusLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
  subtitle,
  animate = true,
  variant = 'emblem',
}) => {
  const [imageError, setImageError] = useState(false);

  // Size dimensions
  const sizeMap = {
    xs: { box: 'w-6 h-6', img: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-sm', rounded: 'rounded-md' },
    sm: { box: 'w-8 h-8', img: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-base', rounded: 'rounded-lg' },
    md: { box: 'w-10 h-10', img: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-lg', rounded: 'rounded-xl' },
    lg: { box: 'w-14 h-14', img: 'w-14 h-14', icon: 'w-7 h-7', text: 'text-2xl', rounded: 'rounded-2xl' },
    xl: { box: 'w-20 h-20', img: 'w-20 h-20', icon: 'w-10 h-10', text: 'text-3xl', rounded: 'rounded-3xl' },
  };

  const dim = sizeMap[size];

  // Image path: emblem has the golden hand holding the diamond, full has NEXUS branding
  const imageSrc =
    variant === 'full'
      ? '/src/assets/images/nexus_gold_diamond_logo_1790775268655.jpg'
      : '/src/assets/images/nexus_hand_gem_emblem_1790775287638.jpg';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${dim.box} flex items-center justify-center shrink-0 group`}>
        {/* Ambient golden neon backglow */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r from-amber-500/40 via-yellow-500/30 to-cyan-500/40 ${dim.rounded} blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
        />

        {/* Logo Container */}
        <div
          className={`relative ${dim.box} ${dim.rounded} overflow-hidden border border-amber-500/50 group-hover:border-amber-400 bg-slate-950 flex items-center justify-center shadow-lg shadow-amber-950/40 transition-all duration-200`}
        >
          {!imageError ? (
            <img
              src={imageSrc}
              alt="NEXUS Golden Hand Diamond Emblem"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className={`${dim.img} object-cover transform scale-105 group-hover:scale-110 transition-transform duration-300`}
            />
          ) : (
            // Pristine Golden Hand & Diamond Vector Fallback
            <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-0.5">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`w-full h-full ${animate ? 'transition-transform duration-300 group-hover:scale-105' : ''}`}
              >
                <defs>
                  <linearGradient id="goldHandGrad" x1="10%" y1="100%" x2="90%" y2="0%">
                    <stop offset="0%" stopColor="#B45309" />
                    <stop offset="35%" stopColor="#F59E0B" />
                    <stop offset="70%" stopColor="#FDE68A" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F0FDFA" />
                    <stop offset="35%" stopColor="#38BDF8" />
                    <stop offset="75%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#C084FC" />
                  </linearGradient>
                  <linearGradient id="facetHighlight" x1="0%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#BAE6FD" stopOpacity="0.3" />
                  </linearGradient>
                </defs>
                {/* Radiant Diamond Facets */}
                <g transform="translate(10, 6) scale(0.8)">
                  <polygon points="50,14 74,32 50,56 26,32" fill="url(#diamondGrad)" opacity="0.9" />
                  <polygon points="50,14 62,32 50,56 38,32" fill="url(#facetHighlight)" />
                  <polygon points="26,32 38,32 50,56" fill="#0284C7" opacity="0.75" />
                  <polygon points="74,32 62,32 50,56" fill="#6366F1" opacity="0.75" />
                  <polygon points="34,18 50,14 66,18 62,32 38,32" fill="#FFFFFF" opacity="0.9" />
                  {/* Facet Sparkle */}
                  <path d="M68,14 L70,20 L76,22 L70,24 L68,30 L66,24 L60,22 L66,20 Z" fill="#FFFFFF" opacity="0.95" />
                </g>
                {/* Stylized Golden Hand Silhouette cradling the diamond */}
                <path
                  d="M18,78 C24,68 34,58 48,54 C60,50 76,46 86,44 C88,43 90,45 88,48 C82,53 72,57 62,60 C58,61 68,54 78,50 C80,49 82,51 80,53 C74,59 66,64 56,67 C62,63 70,60 76,57 C78,56 79,58 77,60 C71,67 58,74 46,78 C36,81 24,84 18,78 Z"
                  fill="url(#goldHandGrad)"
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))"
                />
              </svg>
            </div>
          )}

          {/* Holographic light sweep sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-wider uppercase ${dim.text} ${textClassName} bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text text-transparent drop-shadow-sm`}
            >
              NEXUS SHOP
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-600/50">
              Escrow
            </span>
          </div>
          {subtitle ? (
            <span className="text-[10px] font-mono tracking-wide text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 inline shrink-0" />
              <span className="truncate">{subtitle}</span>
            </span>
          ) : (
            <span className="text-[10px] font-mono tracking-wide text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 inline shrink-0" />
              <span>Direct Escrow Diamond Exchange</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
