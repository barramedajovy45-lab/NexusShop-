import confetti from 'canvas-confetti';

let lastTriggerTime = 0;

const diamondColors = [
  '#06b6d4', // Cyan 500
  '#38bdf8', // Sky 400
  '#00f5d4', // Neon Cyan
  '#10b981', // Emerald 500
  '#fbbf24', // Amber Gold
  '#a855f7', // Purple 500
  '#ffffff', // Diamond Sparkle
];

/**
 * Triggers a multi-stage celebratory diamond confetti animation
 * when an order transitions to 'completed'.
 */
export function triggerOrderCompletedConfetti(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && now - lastTriggerTime < 1500) {
    return;
  }
  lastTriggerTime = now;

  try {
    // Stage 1: Central Diamond Burst
    confetti({
      particleCount: 75,
      spread: 80,
      startVelocity: 45,
      origin: { x: 0.5, y: 0.55 },
      colors: diamondColors,
      ticks: 280,
      gravity: 0.9,
      scalar: 1.1,
      shapes: ['square', 'circle'],
      zIndex: 99999,
    });

    // Stage 2: Left Cannon (120ms later)
    setTimeout(() => {
      try {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          startVelocity: 52,
          origin: { x: 0.05, y: 0.7 },
          colors: diamondColors,
          ticks: 260,
          gravity: 0.85,
          scalar: 1.0,
          zIndex: 99999,
        });
      } catch {}
    }, 120);

    // Stage 3: Right Cannon (240ms later)
    setTimeout(() => {
      try {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          startVelocity: 52,
          origin: { x: 0.95, y: 0.7 },
          colors: diamondColors,
          ticks: 260,
          gravity: 0.85,
          scalar: 1.0,
          zIndex: 99999,
        });
      } catch {}
    }, 240);

    // Stage 4: Gentle High-Altitude Sparkle Cascade (400ms later)
    setTimeout(() => {
      try {
        confetti({
          particleCount: 40,
          spread: 120,
          startVelocity: 25,
          origin: { x: 0.5, y: 0.25 },
          colors: ['#38bdf8', '#fbbf24', '#00f5d4', '#ffffff'],
          ticks: 320,
          gravity: 0.6,
          scalar: 0.85,
          shapes: ['circle'],
          zIndex: 99999,
        });
      } catch {}
    }, 400);
  } catch (err) {
    console.warn('Unable to trigger confetti animation:', err);
  }
}

/**
 * Triggers a shower of diamond rain from the top of the viewport
 */
export function triggerDiamondRainConfetti() {
  try {
    const end = Date.now() + 1200;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      try {
        confetti({
          startVelocity: 20,
          spread: 360,
          ticks: 200,
          origin: { x: Math.random(), y: Math.random() * 0.2 },
          colors: ['#00f5d4', '#06b6d4', '#38bdf8', '#ffffff', '#fbbf24'],
          shapes: ['circle', 'square'],
          gravity: 0.7,
          scalar: 0.75,
          zIndex: 99999,
        });
      } catch {}
    }, 180);
  } catch {}
}

/**
 * Localized micro-burst of crystal particles at a specific viewport coordinate
 */
export function triggerClickSparkle(clientX: number, clientY: number) {
  try {
    if (typeof window === 'undefined') return;
    const x = clientX / window.innerWidth;
    const y = clientY / window.innerHeight;

    confetti({
      particleCount: 18,
      spread: 55,
      startVelocity: 18,
      origin: { x, y },
      colors: ['#00f5d4', '#38bdf8', '#fbbf24', '#ffffff'],
      shapes: ['circle'],
      ticks: 120,
      gravity: 0.8,
      scalar: 0.7,
      zIndex: 99999,
    });
  } catch {}
}
