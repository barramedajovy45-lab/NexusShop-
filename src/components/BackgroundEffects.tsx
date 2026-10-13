import React from 'react';
import { BackgroundEffect, EffectIntensity, GlowColor, ThemeArchetype } from '../types';

interface BackgroundEffectsProps {
  theme: ThemeArchetype;
  bgEffect: BackgroundEffect;
  bgGlowColor: GlowColor;
  bgEffectIntensity: EffectIntensity;
  bgAnimateEffects: boolean;
}

export const BackgroundEffects: React.FC<BackgroundEffectsProps> = ({
  theme,
  bgEffect,
  bgGlowColor,
  bgEffectIntensity,
  bgAnimateEffects,
}) => {
  // Intensity alpha multiplier
  const intensityMap: Record<EffectIntensity, { baseAlpha: number; blurSize: string; opacityClass: string }> = {
    subtle: { baseAlpha: 0.12, blurSize: 'blur-3xl', opacityClass: 'opacity-40' },
    balanced: { baseAlpha: 0.25, blurSize: 'blur-3xl', opacityClass: 'opacity-70' },
    vibrant: { baseAlpha: 0.45, blurSize: 'blur-2xl', opacityClass: 'opacity-100' },
  };

  const { baseAlpha, opacityClass } = intensityMap[bgEffectIntensity] || intensityMap.balanced;

  // Glow color RGB mapping
  const colorMap: Record<GlowColor, { primary: string; secondary: string; hex: string; name: string }> = {
    cyan: { primary: '6, 182, 212', secondary: '14, 165, 233', hex: '#06b6d4', name: 'Cyber Cyan' },
    purple: { primary: '168, 85, 247', secondary: '139, 92, 246', hex: '#a855f7', name: 'Aether Purple' },
    emerald: { primary: '16, 185, 129', secondary: '20, 184, 166', hex: '#10b981', name: 'Venom Emerald' },
    amber: { primary: '245, 158, 11', secondary: '234, 179, 8', hex: '#f59e0b', name: 'Mythic Gold' },
    rose: { primary: '244, 63, 94', secondary: '236, 72, 153', hex: '#f43f5e', name: 'Crimson Ruby' },
    blue: { primary: '59, 130, 246', secondary: '37, 99, 235', hex: '#3b82f6', name: 'Sapphire Cobalt' },
  };

  const currentColor = colorMap[bgGlowColor] || colorMap.cyan;

  // Base background theme styling
  const themeBgMap: Record<ThemeArchetype, string> = {
    dark: 'bg-[#090d16]',
    midnight: 'bg-[#050814]',
    amoled: 'bg-[#000000]',
    white: 'bg-[#f8fafc]',
    mythic_gold: 'bg-[#0d0a04]',
    neon_emerald: 'bg-[#040e08]',
    crimson_void: 'bg-[#0e0508]',
  };

  const baseThemeClass = themeBgMap[theme] || 'bg-[#090d16]';

  if (bgEffect === 'none') {
    return (
      <div 
        aria-hidden="true" 
        className={`fixed inset-0 pointer-events-none transition-colors duration-700 -z-10 ${baseThemeClass}`} 
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden transition-colors duration-700 -z-10 ${baseThemeClass}`}
    >
      {/* EFFECT 1: AURORA MESH */}
      {bgEffect === 'aurora_mesh' && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${opacityClass}`}>
          {/* Top-Center Glow Lightcone */}
          <div
            className={`absolute -top-48 left-1/2 -translate-x-1/2 w-[700px] h-[550px] rounded-full blur-3xl pointer-events-none ${
              bgAnimateEffects ? 'animate-pulse' : ''
            }`}
            style={{
              background: `radial-gradient(ellipse at center, rgba(${currentColor.primary}, ${baseAlpha * 1.5}) 0%, rgba(${currentColor.secondary}, ${baseAlpha * 0.5}) 50%, transparent 80%)`,
              animationDuration: '6s',
            }}
          />

          {/* Floating Left Aurora Sphere */}
          <div
            className={`absolute top-1/4 -left-36 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none ${
              bgAnimateEffects ? 'animate-float-slow' : ''
            }`}
            style={{
              background: `radial-gradient(circle, rgba(${currentColor.secondary}, ${baseAlpha * 0.9}) 0%, transparent 70%)`,
            }}
          />

          {/* Floating Right Aurora Sphere */}
          <div
            className={`absolute top-1/3 -right-36 w-[520px] h-[520px] rounded-full blur-3xl pointer-events-none ${
              bgAnimateEffects ? 'animate-float-reverse' : ''
            }`}
            style={{
              background: `radial-gradient(circle, rgba(${currentColor.primary}, ${baseAlpha * 0.8}) 0%, transparent 70%)`,
            }}
          />

          {/* Lower Ambient Subtle Wash */}
          <div
            className="absolute -bottom-40 left-1/3 w-[600px] h-[400px] rounded-full blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(${currentColor.secondary}, ${baseAlpha * 0.5}) 0%, transparent 75%)`,
            }}
          />
        </div>
      )}

      {/* EFFECT 2: CYBER GRID */}
      {bgEffect === 'cyber_grid' && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${opacityClass}`}>
          {/* Horizon Glow Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, rgba(${currentColor.primary}, ${baseAlpha * 1.2}), transparent)`,
            }}
          />

          {/* Perspective Cybernetic Grid floor overlay */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(${currentColor.primary}, 0.25) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(${currentColor.primary}, 0.25) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at 50% 20%, black 20%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 20%, black 20%, transparent 75%)',
            }}
          />

          {/* Center Light Pillar */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, rgba(${currentColor.secondary}, ${baseAlpha}) 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* EFFECT 3: STELLAR PARTICLES & DIAMOND EMBERS */}
      {bgEffect === 'stellar_particles' && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${opacityClass}`}>
          {/* Subtle Galaxy Gradient */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] rounded-full blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(${currentColor.primary}, ${baseAlpha}) 0%, transparent 75%)`,
            }}
          />

          {/* Fixed Seeded Glowing Diamond Embers */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { top: '8%', left: '15%', size: 4, delay: '0s', dur: '4s' },
              { top: '12%', left: '78%', size: 5, delay: '1s', dur: '5s' },
              { top: '22%', left: '42%', size: 3, delay: '2s', dur: '3.5s' },
              { top: '35%', left: '88%', size: 6, delay: '0.5s', dur: '4.5s' },
              { top: '48%', left: '10%', size: 4, delay: '1.5s', dur: '4s' },
              { top: '60%', left: '82%', size: 5, delay: '2.5s', dur: '5s' },
              { top: '70%', left: '25%', size: 3, delay: '0.8s', dur: '3.8s' },
              { top: '85%', left: '65%', size: 4, delay: '1.8s', dur: '4.2s' },
              { top: '18%', left: '92%', size: 3, delay: '1.2s', dur: '3s' },
              { top: '40%', left: '30%', size: 5, delay: '2.2s', dur: '4.8s' },
              { top: '78%', left: '8%', size: 4, delay: '0.3s', dur: '3.6s' },
              { top: '92%', left: '45%', size: 3, delay: '1.7s', dur: '4.1s' },
            ].map((star, idx) => (
              <div
                key={idx}
                className="absolute rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  backgroundColor: currentColor.hex,
                  boxShadow: `0 0 ${star.size * 3}px ${currentColor.hex}, 0 0 ${star.size * 6}px rgba(${currentColor.primary}, 0.8)`,
                  opacity: 0.85,
                  animation: bgAnimateEffects ? `pulse ${star.dur} infinite ease-in-out` : undefined,
                  animationDelay: star.delay,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* EFFECT 4: PULSE VORTEX */}
      {bgEffect === 'pulse_vortex' && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${opacityClass}`}>
          {/* Concentric Energy Rings */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <div
              className={`w-[750px] h-[750px] rounded-full border border-dashed transition-all duration-1000 ${
                bgAnimateEffects ? 'animate-spin-slow' : ''
              }`}
              style={{
                borderColor: `rgba(${currentColor.primary}, ${baseAlpha * 0.7})`,
              }}
            />
            <div
              className={`absolute w-[540px] h-[540px] rounded-full border transition-all duration-1000 ${
                bgAnimateEffects ? 'animate-pulse' : ''
              }`}
              style={{
                borderColor: `rgba(${currentColor.secondary}, ${baseAlpha * 0.9})`,
                animationDuration: '4s',
              }}
            />
            <div
              className="absolute w-[360px] h-[360px] rounded-full border border-dashed"
              style={{
                borderColor: `rgba(${currentColor.primary}, ${baseAlpha * 1.2})`,
              }}
            />
            <div
              className="absolute w-[200px] h-[200px] rounded-full blur-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(${currentColor.primary}, ${baseAlpha * 1.6}) 0%, transparent 70%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* EFFECT 5: MINIMAL CLEAN SPOTLIGHT */}
      {bgEffect === 'minimal_clean' && (
        <div className={`absolute inset-0 transition-opacity duration-500 ${opacityClass}`}>
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[480px] rounded-full blur-3xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, rgba(${currentColor.primary}, ${baseAlpha * 0.9}) 0%, transparent 70%)`,
            }}
          />
        </div>
      )}

      {/* Subtle Noise / Texture Overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.018] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};
