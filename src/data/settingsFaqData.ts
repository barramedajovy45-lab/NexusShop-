export interface SettingsFAQItem {
  id: string;
  category: 'escrow' | 'delays' | 'security';
  categoryLabel: string;
  question: string;
  shortSummary: string;
  answer: string[];
  keyPoints: string[];
  recommendedAction?: string;
  tags: string[];
}

export const SETTINGS_FAQS: SettingsFAQItem[] = [
  // ==========================================
  // 1. ESCROW PROCESSING
  // ==========================================
  {
    id: 'escrow-how-it-works',
    category: 'escrow',
    categoryLabel: 'Escrow Processing',
    question: 'How does the Aegis Escrow Vault hold and protect my payment?',
    shortSummary: 'Funds stay locked in a neutral escrow vault until you confirm diamonds in-game.',
    answer: [
      'When you place an order on Nexus Shop, your payment is held securely in the Aegis Escrow Vault. The diamond seller does NOT receive your money upfront.',
      'Funds are only released to the seller after you verify the diamonds inside Mobile Legends: Bang Bang and click "Confirm Receipt", or after the 15-minute buyer inspection countdown ends with zero issues reported.',
      'If any delivery issue arises, funds remain safely frozen until the dispute is resolved or refunded.'
    ],
    keyPoints: [
      '100% Fund Isolation: Seller never gets paid before delivery is proven',
      'Neutral Smart Escrow: Protected against seller fraud, fake proofs, or sudden cancellations',
      'Zero Risk: Your money is backed by the $50,000 Aegis Merchant Guarantee Fund'
    ],
    recommendedAction: 'Keep Mobile Legends handy to check your diamond balance right after the seller dispatches.',
    tags: ['escrow', 'hold', 'vault', 'protection', 'payment', 'seller', 'release']
  },
  {
    id: 'escrow-release-timing',
    category: 'escrow',
    categoryLabel: 'Escrow Processing',
    question: 'When exactly are funds released to the diamond seller?',
    shortSummary: 'Payment releases upon your manual confirmation or when the 15-minute inspection window ends.',
    answer: [
      'There are two conditions that trigger fund release to the seller:',
      '1. Manual Confirmation: You launch MLBB, confirm your diamond balance increased, and click "Confirm Receipt" in your Order Tracker.',
      '2. Automatic Settlement: Once the seller marks the package dispatched and attaches valid server recharge proof, a 15-minute buyer inspection timer begins. If no dispute is filed before the timer reaches 00:00, the system automatically releases funds.',
      'Filing a dispute or clicking "Extend Protection" pauses this countdown immediately.'
    ],
    keyPoints: [
      'Immediate release when you click "Confirm Receipt"',
      '15-minute dedicated window to verify in-game balance',
      'Countdown freezes instantly if a dispute or extension is requested'
    ],
    recommendedAction: 'Always launch MLBB and verify before clicking "Confirm Receipt".',
    tags: ['release', 'timer', 'countdown', 'inspection', 'confirm', 'auto-release']
  },
  {
    id: 'escrow-dispute-and-refund',
    category: 'escrow',
    categoryLabel: 'Escrow Processing',
    question: 'What happens if a seller sends fewer diamonds or fails to deliver?',
    shortSummary: 'Click "Raise Dispute" to freeze escrow funds; our arbiters audit the Moonton hash and issue a 100% refund.',
    answer: [
      'If your diamonds do not arrive or the delivered amount is less than what you ordered, click the "Raise Dispute" button on your active order immediately.',
      'This freezes the escrow funds indefinitely—the seller cannot withdraw or claim the money.',
      'An Aegis Escrow Arbiter will cross-reference the seller\'s Moonton server recharge transaction hash with the official Moonton API logs.',
      'If the order is unfulfilled or the seller cannot provide cryptographic delivery proof, 100% of your payment is refunded directly to your original payment method (GCash, Maya, Card, or Crypto).'
    ],
    keyPoints: [
      '1-Click Dispute Freeze: Stops auto-release immediately',
      'Cryptographic Server Audit: We check official Moonton recharge logs',
      '100% Money-Back Guarantee: Full refund with zero processing fees'
    ],
    recommendedAction: 'Click "Raise Dispute" before the 15-minute timer expires if diamonds have not arrived.',
    tags: ['dispute', 'refund', 'freeze', 'arbiter', 'scam', 'missing diamonds', 'guarantee']
  },
  {
    id: 'escrow-extend-protection',
    category: 'escrow',
    categoryLabel: 'Escrow Processing',
    question: 'Can I extend my buyer inspection window if I cannot log into MLBB right away?',
    shortSummary: 'Yes, you can request up to two 24-hour extensions directly from your order screen.',
    answer: [
      'Yes! We understand you might be in an ongoing match, away from your phone, experiencing bad mobile internet, or encountering Moonton server maintenance.',
      'Inside the active Order Tracker, simply click "Extend Protection (+24h)". You can request up to two 24-hour extensions (+48 hours total).',
      'This ensures your funds remain safely locked inside the escrow vault until you have comfortably verified your diamond balance.'
    ],
    keyPoints: [
      'Up to +48 hours total extension time',
      'Prevents accidental auto-release while you are away',
      'Available with 1 click directly on the order card'
    ],
    recommendedAction: 'Use the extension button if you are unable to open Mobile Legends within 15 minutes.',
    tags: ['extend', 'extension', 'inspection', 'timer', 'window', 'protection']
  },

  // ==========================================
  // 2. DIAMOND TOP-UP DELAYS
  // ==========================================
  {
    id: 'delays-why-taking-longer',
    category: 'delays',
    categoryLabel: 'Diamond Top-Up Delays',
    question: 'Why is my top-up taking longer than the estimated delivery time?',
    shortSummary: 'Peak event queues (515, Aspirants, Collector skins), seller batching, or Moonton API rate limits.',
    answer: [
      'Over 94% of orders are completed within 1 to 3 minutes. However, occasional delivery queues can occur due to three main factors:',
      '1. High-Traffic In-Game Events: Major Mobile Legends events (such as 515, Star Wars, Aspirants, or new Collector skins) generate massive global recharge volume, causing Moonton recharge API gateways to throttle incoming transactions.',
      '2. Peak Seller Volume: Sellers processing hundreds of concurrent batch top-ups may queue requests chronologically.',
      '3. Payment Gateway Latency: Some bank or e-wallet networks experience brief webhook delays before confirming payment clearance to the escrow engine.'
    ],
    keyPoints: [
      'Normal Delivery Time: 1–3 minutes',
      'Event Queue Surge Time: 5–10 minutes',
      'Escrow Safe: Your money is 100% protected regardless of delivery time'
    ],
    recommendedAction: 'Allow up to 5–10 minutes during major MLBB skin drop events before worrying.',
    tags: ['delay', 'slow', 'pending', 'delivery time', 'queue', '515', 'events', 'taking long']
  },
  {
    id: 'delays-troubleshooting-checklist',
    category: 'delays',
    categoryLabel: 'Diamond Top-Up Delays',
    question: 'What should I do if diamonds haven’t arrived after 10–15 minutes?',
    shortSummary: 'Restart MLBB, check the in-game mailbox, verify your User ID/Zone ID, and click Raise Dispute.',
    answer: [
      'Please follow this self-service troubleshooting checklist before contacting live support:',
      'Step 1: Force-restart the Mobile Legends app. The game client often caches old diamond figures; closing and reopening fetches fresh balances from Moonton servers.',
      'Step 2: Check your in-game System Mailbox. Certain packages (such as Weekly Diamond Passes or event bonus diamonds) arrive as in-game claimable mail attachments.',
      'Step 3: Check your Order Invoice details. Confirm that the User ID and Zone ID entered match your MLBB profile exactly.',
      'Step 4: If still uncredited and the 15-minute countdown is running low, click "Raise Dispute" to freeze escrow funds while our support arbiters check server logs.'
    ],
    keyPoints: [
      'Step 1: Restart game client to force balance refresh',
      'Step 2: Check in-game System Mail tab for claim vouchers',
      'Step 3: Confirm MLBB User ID & Zone ID accuracy',
      'Step 4: Click "Raise Dispute" before 15m timer finishes'
    ],
    recommendedAction: 'Perform the 4 steps above. Relaunching the game resolves over 80% of delay reports!',
    tags: ['troubleshoot', 'not received', 'missing', 'delay', 'restart', 'mail', 'mailbox', 'checklist']
  },
  {
    id: 'delays-server-maintenance',
    category: 'delays',
    categoryLabel: 'Diamond Top-Up Delays',
    question: 'Does Moonton server maintenance or weekly Tuesday patches affect delivery?',
    shortSummary: 'Yes, scheduled Moonton maintenance temporarily holds recharge queues until servers reopen.',
    answer: [
      'Yes. Every Tuesday or during seasonal patch updates, Moonton conducts scheduled server maintenance.',
      'During these maintenance windows, Moonton closes or restricts its external recharge endpoints. Sellers cannot push diamonds into accounts until Moonton completes server maintenance.',
      'Nexus Shop monitors Moonton server uptime in real time. During maintenance, your order remains in "Queued" status, and the 15-minute escrow timer is automatically extended so your funds remain 100% safe.'
    ],
    keyPoints: [
      'Moonton maintenance temporarily pauses recharge APIs',
      'Orders are securely queued and credited automatically once maintenance ends',
      'Escrow inspection countdown is protected and extendable'
    ],
    recommendedAction: 'Check the MLBB server status announcement if an update is rolling out in your region.',
    tags: ['maintenance', 'tuesday', 'patch', 'update', 'server down', 'offline', 'downtime']
  },
  {
    id: 'delays-track-realtime-status',
    category: 'delays',
    categoryLabel: 'Diamond Top-Up Delays',
    question: 'How do I check the live dispatch status and contact my seller?',
    shortSummary: 'Open your Order Tracker to view live step-by-step progress, recharge hashes, and direct seller chat.',
    answer: [
      'Every order includes a real-time tracking dashboard showing exactly where your diamonds are in the fulfillment pipeline:',
      '• Step 1: Payment Secured (Escrow vault active)',
      '• Step 2: Dispatched to Moonton API (Seller queueing recharge)',
      '• Step 3: Verified in Moonton Ledger (Server recharge hash generated)',
      '• Step 4: Buyer Inspection (15-minute balance verification window)',
      'You can also click "Chat with Seller" to message your seller directly or send screenshot proofs.'
    ],
    keyPoints: [
      'Real-time 4-stage pipeline visualization',
      'Moonton transaction hash verification display',
      'Direct in-app messaging with your assigned seller'
    ],
    recommendedAction: 'View your Order Tracker tab from the main navigation bar anytime.',
    tags: ['track', 'status', 'progress', 'hash', 'chat', 'seller', 'live tracker']
  },

  // ==========================================
  // 3. SECURITY VERIFICATION
  // ==========================================
  {
    id: 'security-no-password-policy',
    category: 'security',
    categoryLabel: 'Security Verification',
    question: 'Will anyone from Nexus Shop or a seller ever ask for my MLBB password?',
    shortSummary: 'NEVER. We will NEVER ask for your password, email, or 2FA codes. All top-ups use only public ID.',
    answer: [
      'ABSOLUTELY NEVER! Neither Nexus Shop staff, escrow arbiters, nor verified diamond sellers will EVER request your Mobile Legends password, Moonton account password, Google/Facebook login, or 2-factor authentication codes.',
      'All diamond packages are pushed directly into your account via Moonton\'s official server-to-server recharge API using ONLY your public User ID and Zone ID.',
      'Anyone claiming to be a seller or administrator asking for your password is an impersonator attempting phishing. Please report them immediately.'
    ],
    keyPoints: [
      'Zero Login Credentials Required: Passwords are NEVER needed',
      'Only Public Identifiers: Public User ID (e.g. 12345678) and Zone ID (e.g. 2024)',
      'Safe from Phishing: Your account credentials remain 100% private in your hands'
    ],
    recommendedAction: 'Never disclose your game login credentials to anyone under any circumstances.',
    tags: ['password', 'login', 'credentials', 'scam', 'phishing', 'security', 'never ask']
  },
  {
    id: 'security-userid-zoneid-verification',
    category: 'security',
    categoryLabel: 'Security Verification',
    question: 'Why are User ID and Zone ID required and how are they verified?',
    shortSummary: 'They identify your in-game profile; our system auto-checks your IGN to prevent typos.',
    answer: [
      'Your User ID (e.g. 12345678) and Zone ID (e.g. 2024) are the public numbers assigned by Moonton to your player profile. You can find them by tapping your avatar in the top-left corner of the MLBB main menu.',
      'When you enter your User ID and Zone ID, Nexus Shop queries the Moonton server to display your verified In-Game Name (IGN) before payment.',
      'This pre-flight verification prevents buyers from accidentally mistyping numbers and sending diamonds to a different account.'
    ],
    keyPoints: [
      'Public Identifiers: Located in MLBB Main Menu > Avatar profile',
      'Pre-Flight IGN Match: Verifies player name before checkout',
      'Prevents Wrong-Account Delivery: Eliminates typo errors'
    ],
    recommendedAction: 'Double-check the displayed In-Game Name (IGN) before completing your payment.',
    tags: ['userid', 'zoneid', 'ign', 'verification', 'profile', 'avatar', 'lookup']
  },
  {
    id: 'security-ban-and-negative-diamonds',
    category: 'security',
    categoryLabel: 'Security Verification',
    question: 'Is my MLBB account safe from bans or negative diamond penalties?',
    shortSummary: '100% safe. Sellers are authorized distributors; zero carding or chargeback exploits are tolerated.',
    answer: [
      'Yes, your account is 100% safe. Negative diamond penalties in Mobile Legends only happen when unauthorized third parties use stolen credit cards or fraudulent refund exploits.',
      'Every seller on Nexus Shop is strictly audited and verified. All diamond packages are sourced via authorized Moonton distributor channels with legitimate billing receipts.',
      'Furthermore, Nexus Shop maintains a $50,000 Aegis Merchant Guarantee Fund that fully indemnifies buyers against any seller malfeasance.'
    ],
    keyPoints: [
      '100% Authorized Moonton Recharge Protocol',
      'Zero Carding / Stolen Card Exploit Policy with instant merchant banning',
      'Backed by our $50,000 Aegis Merchant Guarantee Fund'
    ],
    recommendedAction: 'Shop with confidence—Nexus Shop enforces strict KYC vetting on all platform sellers.',
    tags: ['ban', 'negative diamonds', 'safe', 'guarantee', 'carding', 'penalty', 'moonton policy']
  },
  {
    id: 'security-payment-data-privacy',
    category: 'security',
    categoryLabel: 'Security Verification',
    question: 'How are my payment details and personal contact information protected?',
    shortSummary: 'Bank-grade TLS 1.3 encryption with PCI-DSS compliance; sellers never see your financial details.',
    answer: [
      'All financial transactions are encrypted with bank-grade TLS 1.3 and AES-256 protocols through PCI-DSS Level 1 compliant payment gateways (GCash, Maya, Stripe, and Crypto networks).',
      'Sellers NEVER see your credit card details, e-wallet phone numbers, bank accounts, or personal contact info.',
      'Sellers are only provided with the public MLBB User ID, Zone ID, and In-Game Name needed to dispatch the diamond top-up.'
    ],
    keyPoints: [
      'TLS 1.3 & AES-256 Bank-Grade Encryption',
      'Sellers have ZERO access to your payment methods or phone number',
      'Compliant with international digital consumer data privacy laws'
    ],
    recommendedAction: 'Use saved payment methods or GCash with instant 2% discount with complete peace of mind.',
    tags: ['privacy', 'encryption', 'pci-dss', 'credit card', 'gcash', 'data protection', 'secure payment']
  }
];
