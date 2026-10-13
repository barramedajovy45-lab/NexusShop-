// Sound effects have been removed per user preference.
// All exported functions are silent no-ops for compatibility across the codebase.

export function setAudioMasterVolume(_volume: number): void {}

export function setAudioMasterEnabled(_enabled: boolean): void {}

export function getMasterVolume(): { enabled: boolean; volume: number; percentage: number } {
  return { enabled: false, volume: 0, percentage: 0 };
}

export function playVolumePreviewChime(_overrideVolume?: number): void {}

export function playPriceDropSound(): void {}

export function playOrderNotificationSound(
  _type: 'processing' | 'completed' | 'price_alert' | 'cancelled'
): void {}

export function playMissionClaimSound(): void {}

export function playReferralBonusSound(): void {}

export function playDiamondDetectedSound(): void {}

export function playUiClickSound(): void {}

export function playDiamondChimeSound(): void {}

export function playEscrowLockSound(): void {}

export function playCopySuccessSound(): void {}

export function playModalOpenSound(): void {}

export function playModalCloseSound(): void {}

export function playToggleSound(): void {}
