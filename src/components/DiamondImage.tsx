import React from 'react';
import { getDiamondAssetForPackage, diamondGemImg } from '../assets/diamondAssets';

interface DiamondImageProps {
  packageData?: {
    id?: string;
    diamonds?: number;
    isPass?: boolean;
    name?: string;
    packageName?: string;
  };
  diamonds?: number;
  isPass?: boolean;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  showGlow?: boolean;
  alt?: string;
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4 rounded-sm',
  sm: 'w-7 h-7 rounded-md',
  md: 'w-11 h-11 rounded-lg',
  lg: 'w-16 h-16 rounded-xl',
  xl: 'w-24 h-24 rounded-2xl',
  hero: 'w-32 h-32 rounded-3xl',
};

export const DiamondImage: React.FC<DiamondImageProps> = ({
  packageData,
  diamonds,
  isPass,
  src,
  size = 'md',
  className = '',
  showGlow = false,
  alt = 'Mobile Legends Diamond',
}) => {
  const imgSrc =
    src ||
    (packageData
      ? getDiamondAssetForPackage(packageData)
      : getDiamondAssetForPackage({ diamonds, isPass })) ||
    diamondGemImg;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-slate-950/80 border border-cyan-500/30 shadow-md ${sizeClass} ${
        showGlow ? 'shadow-cyan-500/20' : ''
      } ${className}`}
    >
      <img
        src={imgSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = diamondGemImg;
        }}
        className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      {showGlow && (
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
      )}
    </div>
  );
};
