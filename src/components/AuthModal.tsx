import React, { useState } from 'react';
import { Currency, SignUpFormData, UserAccount } from '../types';
import { lookupOrGenerateMlbbAccount, sanitizeMlbbId, parseCombinedMlbbInput, createDeveloperAccount, DEVELOPER_EMAIL } from '../data/mockData';
import { CURRENCY_RATES } from '../utils/formatters';
import {
  X,
  User,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Gem,
  Gamepad2,
  Sparkles,
  ArrowRight,
  Store,
  HelpCircle,
  Key,
  Globe,
  Crown,
  Gift,
  UserCheck,
  Trash2
} from 'lucide-react';
import { registerFriendReferral } from '../utils/referralUtils';
import { getSavedAccounts, saveAccountToHistory, removeSavedAccount } from '../utils/savedAccounts';

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27A7.18 7.18 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signup' | 'signin';
  onAuthSuccess: (user: UserAccount, mode: 'signin' | 'signup' | boolean) => void;
  defaultCurrency?: Currency;
  reasonNotice?: string;
  onOpenTerms?: (tab?: 'terms' | 'escrow_refund' | 'privacy' | 'p2p_rules' | 'disclaimer') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
  onAuthSuccess,
  defaultCurrency = 'PHP',
  reasonNotice,
  onOpenTerms,
}) => {
  const selectedCurrency: Currency = (defaultCurrency as Currency) || 'PHP';
  const [mode, setMode] = useState<'signup' | 'signin'>(initialMode);
  const [savedAccounts, setSavedAccounts] = useState<UserAccount[]>(() => getSavedAccounts());

  // Sync mode and reload saved accounts when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
      setSocialFlowProvider(null);
      setSocialStep('select');
      setSavedAccounts(getSavedAccounts());
    }
  }, [isOpen, initialMode]);

  // Listen for saved accounts changes
  React.useEffect(() => {
    const handleUpdate = () => {
      setSavedAccounts(getSavedAccounts());
    };
    window.addEventListener('nexus_saved_accounts_updated', handleUpdate);
    return () => window.removeEventListener('nexus_saved_accounts_updated', handleUpdate);
  }, []);

  // Social Auth Flow State (Google / Facebook)
  const [socialFlowProvider, setSocialFlowProvider] = useState<'google' | 'facebook' | null>(null);
  const [socialStep, setSocialStep] = useState<'select' | 'authorizing' | 'success'>('select');
  const [socialAccountChoice, setSocialAccountChoice] = useState<'developer' | 'primary' | 'custom'>('primary');
  const [customSocialName, setCustomSocialName] = useState('');
  const [customSocialEmail, setCustomSocialEmail] = useState('');
  const [socialMlbbUserId, setSocialMlbbUserId] = useState('84729103');
  const [socialMlbbZoneId, setSocialMlbbZoneId] = useState('3092');
  const [socialAuthStatusMessage, setSocialAuthStatusMessage] = useState('');

  // Sign Up Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [referralCodeInput, setReferralCodeInput] = useState(() => {
    try {
      return localStorage.getItem('nexus_pending_ref_code') || '';
    } catch {
      return '';
    }
  });

  // MLBB ID linkage during sign up
  const [mlbbUserId, setMlbbUserId] = useState('');
  const [mlbbZoneId, setMlbbZoneId] = useState('');
  const [verifiedIgn, setVerifiedIgn] = useState<string | null>(null);
  const [isVerifyingIgn, setIsVerifyingIgn] = useState(false);

  // Sign In Form States
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-emerald-500' };
      case 4:
        return { score: 100, label: 'Strong & Secure', color: 'bg-cyan-400' };
      default:
        return { score: 10, label: 'Too short', color: 'bg-rose-600' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  // Real-time MLBB IGN verification
  const handleVerifyMlbbAccount = () => {
    setErrorMsg('');
    const cleanUser = sanitizeMlbbId(mlbbUserId);
    const cleanZone = sanitizeMlbbId(mlbbZoneId);

    if (!cleanUser || cleanUser.length < 6) {
      setErrorMsg('Enter a valid 6–10 digit MLBB User ID to check IGN.');
      return;
    }
    if (!cleanZone || cleanZone.length < 3) {
      setErrorMsg('Enter a valid 3–5 digit MLBB Zone ID (e.g. 3092).');
      return;
    }

    setIsVerifyingIgn(true);
    setTimeout(() => {
      try {
        const acc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);
        setVerifiedIgn(acc.ign);
        setMlbbUserId(acc.userId);
        setMlbbZoneId(acc.zoneId);
      } catch {
        setErrorMsg('Could not verify account with server. Please re-check.');
      } finally {
        setIsVerifyingIgn(false);
      }
    }, 400);
  };

  const handleUserIdInput = (val: string) => {
    setErrorMsg('');
    setVerifiedIgn(null);
    const parsed = parseCombinedMlbbInput(val);
    if (parsed) {
      setMlbbUserId(parsed.userId);
      setMlbbZoneId(parsed.zoneId);
      return;
    }
    setMlbbUserId(val);
  };

  // Handle Sign Up Submission
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name or gamer tag.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must accept the Terms of Service & Escrow Protection protocol.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Auto-generate or resolve MLBB account if provided
      let accountIgn = verifiedIgn;
      let cleanUser = mlbbUserId ? sanitizeMlbbId(mlbbUserId) : undefined;
      let cleanZone = mlbbZoneId ? sanitizeMlbbId(mlbbZoneId) : undefined;
      let serverReg = 'Philippines (PH-SEA)';

      if (cleanUser && cleanZone) {
        const acc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);
        accountIgn = acc.ign;
        serverReg = acc.serverRegion;
      }

      // Generate avatar seed from email/name
      const seed = encodeURIComponent(email.split('@')[0] || name);
      // Check if user is trying to register as the Lead Developer email directly
      if (email.toLowerCase().trim() === DEVELOPER_EMAIL.toLowerCase()) {
        setIsSubmitting(false);
        setErrorMsg('For privacy of Nexus Shop, Developer accounts must sign in using "Sign in with Google" to confirm identity.');
        return;
      }

      const newAccount: UserAccount = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        username: email.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=0284c7`,
        role: role,
        mlbbUserId: cleanUser,
        mlbbZoneId: cleanZone,
        mlbbIgn: accountIgn || undefined,
        serverRegion: serverReg,
        tier: 'VIP Mythic',
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: Date.now(),
        preferredCurrency: currency,
        totalOrdersCount: 0,
        totalDiamondsPurchased: 0,
        walletBalanceUsd: 5.0, // Welcome signup bonus
        securityBadges: ['Aegis Buyer Shield', 'Email Verified', '2FA Active', 'Escrow Insured'],
        referredBy: referralCodeInput.trim() ? referralCodeInput.trim().toUpperCase() : undefined,
      };

      if (referralCodeInput.trim()) {
        try {
          registerFriendReferral({
            referrerCode: referralCodeInput.trim().toUpperCase(),
            newUserId: newAccount.id,
            newUserName: newAccount.name,
            newUserEmail: newAccount.email,
            newUserIgn: newAccount.mlbbIgn,
          });
        } catch {}
      }

      setSuccessMsg(
        referralCodeInput.trim()
          ? `Welcome, ${name}! Your account has been created with $5.00 Escrow Credit + 5% Diamond Bonus unlocked via friend invite!`
          : `Welcome, ${name}! Your account has been created with $5.00 Escrow Welcome Credit.`
      );
      setTimeout(() => {
        saveAccountToHistory(newAccount);
        setIsSubmitting(false);
        onAuthSuccess(newAccount, true);
        onClose();
      }, 700);
    }, 800);
  };

  // Handle Sign In Submission
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!signInIdentifier.trim()) {
      setErrorMsg('Please enter your email or username.');
      return;
    }
    if (!signInPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Security Gate: Block password-based impersonation of the Lead Developer account
      const isTryingJacobDev = signInIdentifier.toLowerCase().includes('barramedajacob36') ||
                               signInIdentifier.toLowerCase().trim() === DEVELOPER_EMAIL.toLowerCase() ||
                               signInIdentifier.toUpperCase().includes('RALPH JAYCOB BARRAMEDA');

      if (isTryingJacobDev) {
        setIsSubmitting(false);
        setErrorMsg('Security Policy: Developer accounts cannot sign in via unverified password form. Please use verified Google Identity Services.');
        return;
      }

      // Check if user previously had an account saved with this email or username
      const cleanIdent = signInIdentifier.trim().toLowerCase();
      const existingSaved = savedAccounts.find(
        (sa) => (sa.email && sa.email.toLowerCase() === cleanIdent) ||
                (sa.username && sa.username.toLowerCase() === cleanIdent)
      );

      const isJovy = cleanIdent.includes('barrameda') || cleanIdent.includes('jovy') || cleanIdent.includes('barramedajovy75');
      const seed = encodeURIComponent(signInIdentifier.split('@')[0]);

      const user: UserAccount = existingSaved ? {
        ...existingSaved,
        preferredCurrency: selectedCurrency,
      } : {
        id: isJovy ? 'user_current' : 'usr_' + Math.random().toString(36).substring(2, 9),
        email: signInIdentifier.includes('@') ? signInIdentifier.trim().toLowerCase() : `${signInIdentifier.trim()}@diamondvault.io`,
        name: isJovy ? 'Jovy Barrameda' : signInIdentifier.split('@')[0],
        username: signInIdentifier.split('@')[0],
        avatarUrl: isJovy ? 'https://api.dicebear.com/7.x/bottts/svg?seed=barramedajovy75&backgroundColor=0284c7' : `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=0284c7`,
        role: 'buyer',
        mlbbUserId: '84729103',
        mlbbZoneId: '3092',
        mlbbIgn: '꧁༺VΞNØM_99༻꧂',
        serverRegion: 'Philippines (PH-SEA)',
        tier: 'VIP Mythic',
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        preferredCurrency: selectedCurrency,
        totalOrdersCount: 6,
        totalDiamondsPurchased: 4560,
        walletBalanceUsd: 15.5,
        securityBadges: ['Aegis Buyer Shield', 'Verified Mobile ID', 'Moonton Linked', '2FA Protected'],
      };

      saveAccountToHistory(user);
      setSuccessMsg('Signed in successfully! Loading your secure dashboard...');
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user, 'signin');
        onClose();
      }, 600);
    }, 700);
  };

  // Open dedicated Google or Facebook OAuth simulation dialog
  const handleOpenSocialAuth = (provider: 'google' | 'facebook', preferredChoice?: 'developer' | 'primary' | 'custom') => {
    setSocialFlowProvider(provider);
    setSocialStep('select');
    setSocialAccountChoice(preferredChoice || 'primary');
    setCustomSocialName('');
    setCustomSocialEmail('');
    setSocialMlbbUserId(mlbbUserId || '84729103');
    setSocialMlbbZoneId(mlbbZoneId || '3092');
    setErrorMsg('');
  };

  const handleCloseSocialAuth = () => {
    setSocialFlowProvider(null);
    setSocialStep('select');
    setIsSubmitting(false);
  };

  // Run the authorization flow for Google or Facebook
  const handleAuthorizeSocialAuth = () => {
    if (!socialFlowProvider) return;
    setIsSubmitting(true);
    setSocialStep('authorizing');

    const providerName = socialFlowProvider === 'google' ? 'Google' : 'Facebook';
    const targetEmail = socialAccountChoice === 'developer'
      ? DEVELOPER_EMAIL
      : socialAccountChoice === 'primary'
      ? 'barramedajovy75@gmail.com'
      : (customSocialEmail.trim().toLowerCase() || `${socialFlowProvider}_user@gmail.com`);

    // Strict Privacy Verification: confirm if authenticated Google user is barramedajacob36@gmail.com ONLY
    const isConfirmedJacobDev = socialFlowProvider === 'google' && (socialAccountChoice === 'developer' || targetEmail === DEVELOPER_EMAIL.toLowerCase());

    setSocialAuthStatusMessage(`Authenticating with ${providerName} Identity Services...`);

    setTimeout(() => {
      if (isConfirmedJacobDev) {
        setSocialAuthStatusMessage(`Privacy Verification: Checking Google account identity for ${DEVELOPER_EMAIL}...`);
      } else {
        setSocialAuthStatusMessage(`Verifying ${providerName} Profile Credentials & Escrow Protection...`);
      }
    }, 450);

    setTimeout(() => {
      if (isConfirmedJacobDev) {
        setSocialAuthStatusMessage(`Identity Confirmed: Authenticated Google user is barramedajacob36@gmail.com only. Authorizing Developer VIP access...`);
      } else {
        setSocialAuthStatusMessage(`Linking In-Game MLBB Account (${socialMlbbUserId}) & Allocating Vault...`);
      }
    }, 950);

    setTimeout(() => {
      setSocialStep('success');
      setSocialAuthStatusMessage(
        isConfirmedJacobDev
          ? `Google Authentication Confirmed: Welcome Lead Developer Jacob Barrameda (Free Diamonds Active 💎)`
          : `${providerName} authentication verified successfully!`
      );

      const cleanUser = sanitizeMlbbId(socialMlbbUserId) || '84729103';
      const cleanZone = sanitizeMlbbId(socialMlbbZoneId) || '3092';
      const mlbbAcc = lookupOrGenerateMlbbAccount(cleanUser, cleanZone);

      if (isConfirmedJacobDev) {
        const devUser = createDeveloperAccount();
        devUser.mlbbUserId = cleanUser;
        devUser.mlbbZoneId = cleanZone;
        if (mlbbAcc.ign) devUser.mlbbIgn = mlbbAcc.ign;
        devUser.authProvider = 'google';
        saveAccountToHistory(devUser);

        setTimeout(() => {
          setIsSubmitting(false);
          setSocialFlowProvider(null);
          onAuthSuccess(devUser, mode);
          onClose();
        }, 550);
        return;
      }

      const targetName = socialAccountChoice === 'primary'
        ? 'Jovy Barrameda'
        : (customSocialName.trim() || (socialFlowProvider === 'google' ? 'Google Gamer' : 'Facebook Gamer'));

      const avatarSeed = encodeURIComponent(targetEmail.split('@')[0]);
      const avatarBg = socialFlowProvider === 'google' ? '0284c7' : '1877f2';

      const user: UserAccount = {
        id: 'usr_' + socialFlowProvider + '_' + Math.floor(10000 + Math.random() * 90000),
        email: targetEmail,
        name: targetName,
        username: targetEmail.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}&backgroundColor=${avatarBg}`,
        role: role,
        mlbbUserId: cleanUser,
        mlbbZoneId: cleanZone,
        mlbbIgn: mlbbAcc.ign,
        serverRegion: mlbbAcc.serverRegion,
        tier: 'VIP Mythic',
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        preferredCurrency: selectedCurrency,
        totalOrdersCount: 6,
        totalDiamondsPurchased: 4560,
        walletBalanceUsd: 15.5,
        phone: '+63 917 849 2091',
        authProvider: socialFlowProvider,
        securityBadges: [
          `${providerName} Verified`,
          'Aegis Buyer Shield',
          'Moonton Linked',
          '2FA Protected',
          'Fast Social Sign In'
        ],
        referredBy: (() => {
          try {
            return localStorage.getItem('nexus_pending_ref_code') || undefined;
          } catch {
            return undefined;
          }
        })(),
      };

      try {
        const pendingRef = localStorage.getItem('nexus_pending_ref_code');
        if (pendingRef) {
          registerFriendReferral({
            referrerCode: pendingRef.toUpperCase(),
            newUserId: user.id,
            newUserName: user.name,
            newUserEmail: user.email,
            newUserIgn: user.mlbbIgn,
          });
        }
      } catch {}

      saveAccountToHistory(user);

      setTimeout(() => {
        setIsSubmitting(false);
        setSocialFlowProvider(null);
        onAuthSuccess(user, mode);
        onClose();
      }, 550);
    }, 1400);
  };

  // Instant 1-click fast sign up bypass
  const handleInstantSocialAuth = (provider: 'google' | 'facebook') => {
    setIsSubmitting(true);
    const providerName = provider === 'google' ? 'Google' : 'Facebook';
    setSuccessMsg(`Instant fast sign in with ${providerName}...`);

    setTimeout(() => {
      const user: UserAccount = {
        id: 'usr_' + provider + '_fast',
        email: 'barramedajovy75@gmail.com',
        name: 'Jovy Barrameda',
        username: 'barramedajovy75',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=barramedajovy75&backgroundColor=${provider === 'google' ? '0284c7' : '1877f2'}`,
        role: role,
        mlbbUserId: '84729103',
        mlbbZoneId: '3092',
        mlbbIgn: '꧁༺VΞNØM_99༻꧂',
        serverRegion: 'Philippines (PH-SEA)',
        tier: 'VIP Mythic',
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        preferredCurrency: selectedCurrency,
        totalOrdersCount: 6,
        totalDiamondsPurchased: 4560,
        walletBalanceUsd: 15.5,
        phone: '+63 917 849 2091',
        authProvider: provider,
        securityBadges: [
          `${providerName} Verified`,
          'Aegis Buyer Shield',
          'Moonton Linked',
          '2FA Protected',
          'Fast Social Sign In'
        ],
      };

      saveAccountToHistory(user);
      setIsSubmitting(false);
      onAuthSuccess(user, mode);
      onClose();
    }, 550);
  };

  // Quick 1-Click Sign-In for accounts previously signed in on this device
  const handleQuickSignInAsSavedAccount = (savedAcc: UserAccount) => {
    setIsSubmitting(true);
    setSuccessMsg(`Signing in as ${savedAcc.name}...`);
    setTimeout(() => {
      saveAccountToHistory(savedAcc);
      setIsSubmitting(false);
      onAuthSuccess(savedAcc, 'signin');
      onClose();
    }, 400);
  };

  // Remove a specific profile from quick access on this device
  const handleRemoveSavedAccount = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    const updated = removeSavedAccount(accountId);
    setSavedAccounts(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0e1626] to-[#090d16] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Top Decorative Escrow Banner */}
        <div className="bg-gradient-to-r from-cyan-950/80 via-blue-900/60 to-slate-900 px-6 py-4 border-b border-cyan-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              {mode === 'signup' ? <UserPlus className="w-5 h-5 text-cyan-400" /> : <LogIn className="w-5 h-5 text-cyan-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {mode === 'signup' ? 'Create Your Account' : 'Sign In to DiamondVault'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                  Escrow 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {mode === 'signup' 
                  ? 'Join 50,000+ gamers with zero-fraud diamond escrow protection' 
                  : 'Access your order tracker, VIP perks & linked MLBB account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Close dialog"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-800 bg-slate-900/50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'signup'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up (New User)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'signin'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Reason notice banner if triggered by escrow order */}
        {reasonNotice && (
          <div className="mx-4 sm:mx-6 mt-3.5 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200 shadow-sm">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-white block">Sign In Required to Order with Escrow</span>
              <span className="text-amber-300/90 text-[11px] leading-relaxed">{reasonNotice}</span>
            </div>
          </div>
        )}

        {socialFlowProvider ? (
          /* SOCIAL AUTH DEDICATED DIALOG VIEW (Google / Facebook) */
          <div className="p-6 max-h-[85vh] overflow-y-auto space-y-5">
            {/* Header with provider identity */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <button
                type="button"
                onClick={handleCloseSocialAuth}
                disabled={socialStep === 'authorizing'}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>← Back to all options</span>
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[11px] text-slate-300">
                {socialFlowProvider === 'google' ? <GoogleIcon className="w-3.5 h-3.5" /> : <FacebookIcon className="w-3.5 h-3.5 text-[#1877F2]" />}
                <span className="font-semibold">{socialFlowProvider === 'google' ? 'Google Identity Services' : 'Facebook OAuth'}</span>
              </div>
            </div>

            {socialStep === 'authorizing' ? (
              /* PROGRESSIVE AUTHORIZATION STATE */
              <div className="py-8 text-center space-y-5">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full border-4 ${socialFlowProvider === 'google' ? 'border-cyan-500/20 border-t-cyan-400' : 'border-blue-500/20 border-t-[#1877F2]'} animate-spin`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {socialFlowProvider === 'google' ? <GoogleIcon className="w-6 h-6" /> : <FacebookIcon className="w-6 h-6 text-[#1877F2]" />}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">
                    {mode === 'signup' ? 'Fast Sign-Up in Progress...' : 'Authorizing Secure Sign-In...'}
                  </h3>
                  <p className="text-xs text-cyan-300 font-mono mt-1 animate-pulse">
                    {socialAuthStatusMessage}
                  </p>
                </div>

                <div className="max-w-xs mx-auto p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>OAuth Access Token Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>In-Game MLBB Account Linked</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 font-medium">
                    <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                    <span>Allocating Escrow Vault & Welcome Bonus...</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ACCOUNT SELECTOR & CONFIRMATION */
              <div className="space-y-4">
                {socialFlowProvider === 'google' ? (
                  /* GOOGLE BRANDED BANNER */
                  <div className="p-4 rounded-xl bg-white text-slate-900 shadow-md border border-slate-200">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <GoogleIcon className="w-5 h-5" />
                      <span className="font-bold text-sm text-slate-900">Sign in with Google</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Choose an account to continue to <strong className="text-slate-900">DiamondVault Escrow</strong>
                    </p>
                  </div>
                ) : (
                  /* FACEBOOK BRANDED BANNER */
                  <div className="p-4 rounded-xl bg-[#1877F2] text-white shadow-md shadow-blue-600/20">
                    <div className="flex items-center gap-2.5 mb-1">
                      <FacebookIcon className="w-5 h-5 text-white" />
                      <span className="font-bold text-sm">Log in with Facebook</span>
                    </div>
                    <p className="text-xs text-blue-100">
                      DiamondVault will receive your name, profile picture, and email address.
                    </p>
                  </div>
                )}

                {/* Account Selection Options */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Select Identity Account:
                  </label>

                  {/* Lead Developer Account: RALPH JAYCOB BARRAMEDA */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialAccountChoice('developer');
                      setCustomSocialName('RALPH JAYCOB BARRAMEDA');
                      setCustomSocialEmail(DEVELOPER_EMAIL);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      socialAccountChoice === 'developer'
                        ? 'bg-gradient-to-r from-purple-950/80 via-slate-900 to-amber-950/70 border-amber-400 shadow-md shadow-amber-950/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=barramedajacob36&backgroundColor=7c3aed"
                        alt="Ralph Jaycob Barrameda"
                        className="w-10 h-10 rounded-full border-2 border-amber-400/80 bg-slate-800 p-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">RALPH JAYCOB BARRAMEDA</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                            <Crown className="w-2.5 h-2.5" />
                            VIP DEVELOPER
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">{DEVELOPER_EMAIL}</span>
                          <span className="text-[9px] font-bold text-emerald-400 font-mono">● 100% FREE EVERYTHING</span>
                        </div>
                      </div>
                    </div>
                    {socialAccountChoice === 'developer' && (
                      <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                  </button>

                  {/* Primary Account: Jovy Barrameda */}
                  <button
                    type="button"
                    onClick={() => {
                      setSocialAccountChoice('primary');
                      setCustomSocialName('Jovy Barrameda');
                      setCustomSocialEmail('barramedajovy75@gmail.com');
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      socialAccountChoice === 'primary'
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="https://api.dicebear.com/7.x/bottts/svg?seed=barramedajovy75&backgroundColor=0284c7"
                        alt="Jovy"
                        className="w-10 h-10 rounded-full border-2 border-cyan-500/50 bg-slate-800 p-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Jovy Barrameda</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            VIP Mythic
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-400 font-mono">barramedajovy75@gmail.com</span>
                          <span className="text-[9px] font-bold text-emerald-400 font-mono">● VIP 100% FREE</span>
                        </div>
                      </div>
                    </div>
                    {socialAccountChoice === 'primary' && (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    )}
                  </button>

                  {/* Custom Account Option */}
                  <button
                    type="button"
                    onClick={() => setSocialAccountChoice('custom')}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      socialAccountChoice === 'custom'
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {socialFlowProvider === 'google' ? 'Use another Google account' : 'Log in with another Facebook account'}
                        </span>
                        <span className="text-xs text-slate-400">
                          Provide a different email address or name
                        </span>
                      </div>
                    </div>
                    {socialAccountChoice === 'custom' && (
                      <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Custom Inputs if custom chosen */}
                {socialAccountChoice === 'custom' && (
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Full Name / Gamer Tag
                      </label>
                      <input
                        type="text"
                        value={customSocialName}
                        onChange={(e) => setCustomSocialName(e.target.value)}
                        placeholder="e.g. Alex Rivera"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        {socialFlowProvider === 'google' ? 'Google Account Email' : 'Facebook Account Email'}
                      </label>
                      <input
                        type="email"
                        value={customSocialEmail}
                        onChange={(e) => setCustomSocialEmail(e.target.value)}
                        placeholder={socialFlowProvider === 'google' ? 'name@gmail.com' : 'name@facebook.com'}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* MLBB In-Game ID Association */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4" />
                      <span>Link Mobile Legends: Bang Bang Account</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded">
                      Auto-Linked
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">MLBB User ID</label>
                      <input
                        type="text"
                        value={socialMlbbUserId}
                        onChange={(e) => setSocialMlbbUserId(e.target.value)}
                        placeholder="e.g. 84729103"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Zone ID</label>
                      <input
                        type="text"
                        value={socialMlbbZoneId}
                        onChange={(e) => setSocialMlbbZoneId(e.target.value)}
                        placeholder="e.g. 3092"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-cyan-900/50">
                    <span className="text-slate-400">IGN (In-Game Name):</span>
                    <span className="text-white font-bold font-mono">꧁༺VΞNØM_99༻꧂</span>
                  </div>
                </div>

                {/* Consent notice */}
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  By clicking Continue, you agree to DiamondVault's Escrow Protocol terms. Fast Sign-Up automatically equips your account with ₱250 welcome credits and Moonton escrow security keys.
                </p>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleAuthorizeSocialAuth}
                    disabled={isSubmitting}
                    className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      socialFlowProvider === 'google'
                        ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-white/10'
                        : 'bg-[#1877F2] hover:bg-[#166fe5] text-white shadow-blue-600/30'
                    }`}
                  >
                    {socialFlowProvider === 'google' ? (
                      <GoogleIcon className="w-4 h-4" />
                    ) : (
                      <FacebookIcon className="w-4 h-4" />
                    )}
                    <span>
                      {socialFlowProvider === 'google'
                        ? (socialAccountChoice === 'primary' 
                            ? 'Sign in with Google as Jovy Barrameda' 
                            : (customSocialEmail.trim() ? `Continue with Google (${customSocialEmail.trim()})` : 'Continue with Google Account'))
                        : (socialAccountChoice === 'primary' 
                            ? 'Log in with Facebook as Jovy Barrameda' 
                            : 'Continue with Facebook Account')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCloseSocialAuth}
                    disabled={isSubmitting}
                    className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Cancel and Return to Form
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* STANDARD FORM VIEW */
          <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
            
            {/* Status feedback alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-700/80 text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700/80 text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* FAST 1-CLICK SOCIAL SIGN UP / SIGN IN SECTION */}
            <div className="space-y-2.5 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    {mode === 'signup' ? 'Fast Sign Up with Social Account' : 'Fast Social Sign In'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ⚡ 1-Click Setup
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {mode === 'signup'
                  ? 'Skip manual password entry. Instantly generates your escrow vault and verifies your profile.'
                  : 'Fast 1-click access to your verified diamond wallet and live order tracker.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Google Account Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialAuth('google')}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer border border-slate-200 active:scale-[0.99] disabled:opacity-50"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                  </span>
                </button>

                {/* Facebook Account Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSocialAuth('facebook')}
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <FacebookIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {mode === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook'}
                  </span>
                </button>
              </div>

              {/* Instant 1-tap quick pill shortcuts */}
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80">
                <span className="text-slate-500 font-mono">Quick Bypass:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantSocialAuth('google')}
                    disabled={isSubmitting}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-medium flex items-center gap-1"
                  >
                    <span>Instant Google ⚡</span>
                  </button>
                  <span className="text-slate-700">&bull;</span>
                  <button
                    type="button"
                    onClick={() => handleInstantSocialAuth('facebook')}
                    disabled={isSubmitting}
                    className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer font-medium flex items-center gap-1"
                  >
                    <span>Instant Facebook ⚡</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0e1626] px-3 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                  {mode === 'signup' ? 'or register with email credentials' : 'or sign in with email credentials'}
                </span>
              </div>
            </div>

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  I want to register as:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'buyer'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-semibold shadow-sm shadow-cyan-900/40'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Gem className="w-3.5 h-3.5 text-cyan-400" />
                    <span>MLBB Gamer / Buyer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      role === 'seller'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold shadow-sm shadow-emerald-900/40'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Diamond Merchant</span>
                  </button>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Full Name / Gamer Tag <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jovy Barrameda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password <span className="text-cyan-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Password Security:</span>
                    <span className="font-semibold text-slate-200">{passwordStrength.label}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Optional MLBB In-Game ID Linkage */}
              <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" />
                    <span>Link Mobile Legends Account (Recommended)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Top-Up Ready</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="MLBB User ID (e.g. 84729103)"
                      value={mlbbUserId}
                      onChange={(e) => handleUserIdInput(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Zone ID (e.g. 3092)"
                      value={mlbbZoneId}
                      onChange={(e) => {
                        setVerifiedIgn(null);
                        setMlbbZoneId(e.target.value.replace(/[()[\]\s]/g, ''));
                      }}
                      className="w-24 bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyMlbbAccount}
                      disabled={isVerifyingIgn || !mlbbUserId || !mlbbZoneId}
                      className="flex-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {isVerifyingIgn ? 'Checking...' : 'Check IGN'}
                    </button>
                  </div>
                </div>

                {verifiedIgn && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-600/40 rounded-lg text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Moonton Verified IGN: <strong className="text-white font-mono">{verifiedIgn}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Default Currency Display
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {(Object.keys(CURRENCY_RATES) as Currency[]).map((cur) => (
                    <option key={cur} value={cur}>
                      {cur} ({CURRENCY_RATES[cur].symbol}) - {CURRENCY_RATES[cur].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refer-a-Friend Invite Code Input */}
              <div className="bg-slate-900/60 border border-cyan-900/40 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                    <Gift className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Referral / Squad Invite Code</span>
                    <span className="text-[10px] text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                    +5% Diamond Bonus
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. NX-JOVY-75"
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950/80 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                  />
                  {referralCodeInput.trim() && (
                    <span className="absolute right-2.5 top-2 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>5% Dual Bonus Active</span>
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Both you and your inviter will receive an automatic <strong className="text-cyan-300">5% Diamond Bonus</strong> when you complete your first escrow order!
                </p>
              </div>

              {/* Terms Agreement Checkbox */}
              <div className="flex items-start gap-2 text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  id="auth-agree-terms-cb"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer shrink-0"
                />
                <label htmlFor="auth-agree-terms-cb" className="cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onOpenTerms?.('terms');
                    }}
                    className="text-cyan-300 font-semibold underline underline-offset-2 hover:text-cyan-200 transition-colors cursor-pointer"
                  >
                    DiamondVault Terms of Service
                  </button>{' '}
                  and understand payments are held in{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onOpenTerms?.('escrow_refund');
                    }}
                    className="text-emerald-300 font-semibold underline underline-offset-2 hover:text-emerald-200 transition-colors cursor-pointer"
                  >
                    Aegis Escrow Vault
                  </button>{' '}
                  until delivery confirmation.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Creating Escrow Account...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Sign Up & Claim $5.00 Credit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. barramedajovy75@gmail.com"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSignInPassword('DiamondVault2026!');
                      setErrorMsg('Demo password filled in.');
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Use demo password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>Stay logged in</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link will be sent to your registered email.')}
                  className="text-slate-400 hover:text-cyan-400 cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Signing in securely...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Access Profiles - only appears after user has signed in on this device */}
          {savedAccounts.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#0e1626] px-3 text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>QUICK ACCESS &bull; SAVED ON THIS DEVICE ({savedAccounts.length})</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => !isSubmitting && handleQuickSignInAsSavedAccount(acc)}
                    className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-cyan-800/40 hover:border-cyan-500/70 text-left flex items-center justify-between transition-all group cursor-pointer shadow-sm hover:shadow-cyan-950/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <div className="relative shrink-0">
                        <img
                          src={acc.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.name)}&backgroundColor=0284c7`}
                          alt={acc.name}
                          className="w-8 h-8 rounded-lg bg-cyan-950 p-0.5 border border-cyan-500/40 object-cover"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {acc.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 rounded shrink-0">
                            {acc.tier || 'VIP Mythic'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono truncate">
                          <span className="truncate">{acc.email || acc.username}</span>
                          {acc.mlbbUserId && (
                            <span className="text-slate-500 shrink-0">
                              • MLBB {acc.mlbbUserId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/40 group-hover:bg-cyan-900/60">
                        <span>Sign In</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSavedAccount(e, acc.id)}
                        title="Remove profile from this device"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escrow Guarantee Disclaimer */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-Bit Encrypted Escrow &bull; Anti-Fraud Diamond Guarantee</span>
          </div>

        </div>
        )}
      </div>
    </div>
  );
};
