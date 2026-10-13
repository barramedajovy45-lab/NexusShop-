export const APP_VERSION = '1.1.0';
export const APP_BUILD_DATE = '2026-09-24';
export const APP_CODENAME = 'Aegis Sentinel';
export const APP_CREDIT = 'RALPH JAYCOB BARRAMEDA';
export const APP_COPYRIGHT = 'Nexus Shop';

export interface VersionRelease {
  version: string;
  date: string;
  codename: string;
  isCurrent?: boolean;
  highlights: string[];
}

export const APP_CHANGELOG: VersionRelease[] = [
  {
    version: '1.1.0',
    date: 'September 24, 2026',
    codename: 'Aegis Sentinel',
    isCurrent: true,
    highlights: [
      'Visual Order Progress Stepper with 4-stage pipeline (Paid ➔ Escrow Locked ➔ Processing ➔ Delivered)',
      'Real-time SLA countdown telemetry and escrow vault inspection drawers',
      'Step-by-step interactive flow simulation with active pulse halos',
      'Unified versioning system and audit trail verification',
    ],
  },
  {
    version: '1.0.9',
    date: 'September 2026',
    codename: 'Vault Warden',
    highlights: [
      'Aegis Escrow Vault integration with multi-sig release safeguards',
      'Moonton distributor live endpoint checks and fast-fill latency monitoring',
      'Automated dispute resolution panel with evidence attachment support',
    ],
  },
  {
    version: '1.0.0',
    date: 'September 2026',
    codename: 'Genesis Launch',
    highlights: [
      'Direct buy & P2P marketplace for Mobile Legends: Bang Bang diamonds',
      'Multi-currency exchange engine supporting USD, PHP, IDR, MYR, SGD, EUR, BRL',
      'Instant MLBB Account verification (IGN & Zone ID) protocol',
      'Daily mission streak rewards and loyalty diamond cashbacks',
    ],
  },
];
