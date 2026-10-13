import { Currency } from '../types';
import { CURRENCY_RATES } from './formatters';

/**
 * Mapping from ISO 3166-1 alpha-2 country codes (uppercase)
 * to supported application Currency.
 */
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  // Southeast Asia (MLBB primary hubs)
  PH: 'PHP',
  ID: 'IDR',
  MY: 'MYR',
  SG: 'SGD',
  TH: 'THB',
  VN: 'VND',
  KH: 'KHR',
  MM: 'MMK',
  LA: 'LAK',
  BN: 'BND',

  // East Asia
  MN: 'MNT',
  JP: 'JPY',
  KR: 'KRW',
  HK: 'HKD',
  TW: 'TWD',
  CN: 'CNY',

  // South Asia
  NP: 'NPR',
  BD: 'BDT',
  IN: 'INR',
  PK: 'PKR',
  LK: 'LKR',
  MV: 'MVR',

  // West Asia / Middle East
  SA: 'SAR',
  AE: 'AED',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  JO: 'JOD',
  IQ: 'IQD',
  TR: 'TRY',
  EG: 'EGP',

  // Central Asia
  KZ: 'KZT',
  UZ: 'UZS',
  KG: 'KGS',
  TJ: 'TJS',

  // Americas & Global
  BR: 'BRL',
  US: 'USD',
  CA: 'CAD',
  GB: 'GBP',
  AU: 'AUD',
  NZ: 'AUD',

  // Eurozone countries
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  GR: 'EUR',
};

/**
 * Mapping from primary language codes (lowercase) when country subtag is absent
 */
const LANGUAGE_TO_CURRENCY: Record<string, Currency> = {
  fil: 'PHP',
  tl: 'PHP',
  id: 'IDR',
  ms: 'MYR',
  th: 'THB',
  vi: 'VND',
  km: 'KHR',
  my: 'MMK',
  ja: 'JPY',
  ko: 'KRW',
  pt: 'BRL', // Most Portuguese speakers in gaming are Brazil
  hi: 'INR',
  ar: 'SAR',
  tr: 'TRY',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
};

export interface LocaleCurrencySuggestion {
  currency: Currency;
  country: string;
  flag: string;
  symbol: string;
  sourceLocale: string;
  detectedCountryCode?: string;
}

/**
 * Inspects navigator.languages, navigator.language, and Intl.DateTimeFormat
 * to detect the user's country or preferred locale and match it with a supported Currency.
 */
export function detectLocaleCurrency(): LocaleCurrencySuggestion | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return null;
  }

  // Gather candidate locales
  const candidateLocales: string[] = [];
  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    candidateLocales.push(...navigator.languages);
  }
  if (navigator.language) {
    candidateLocales.push(navigator.language);
  }

  // Also try Intl resolvedOptions timeZone for geographic hints if needed
  let timeZone = '';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {}

  // 1. Try parsing locale strings: e.g., "en-PH", "id-ID", "en-US", "ja-JP"
  for (const rawLocale of candidateLocales) {
    if (!rawLocale) continue;
    const parts = rawLocale.replace('_', '-').split('-');
    
    // Check if region/country subtag exists (usually 2 letters, uppercase)
    if (parts.length >= 2) {
      const regionCode = parts[parts.length - 1].toUpperCase();
      if (COUNTRY_TO_CURRENCY[regionCode]) {
        const matchedCurrency = COUNTRY_TO_CURRENCY[regionCode];
        const info = CURRENCY_RATES[matchedCurrency];
        return {
          currency: matchedCurrency,
          country: info.country,
          flag: info.flag,
          symbol: info.symbol,
          sourceLocale: rawLocale,
          detectedCountryCode: regionCode,
        };
      }
    }

    // Check language code alone
    const langCode = parts[0].toLowerCase();
    if (LANGUAGE_TO_CURRENCY[langCode]) {
      const matchedCurrency = LANGUAGE_TO_CURRENCY[langCode];
      const info = CURRENCY_RATES[matchedCurrency];
      return {
        currency: matchedCurrency,
        country: info.country,
        flag: info.flag,
        symbol: info.symbol,
        sourceLocale: rawLocale,
      };
    }
  }

  // 2. Try inferring from timeZone if available
  if (timeZone) {
    if (timeZone.includes('Manila')) return buildSuggestion('PHP', 'Asia/Manila', 'PH');
    if (timeZone.includes('Jakarta') || timeZone.includes('Makassar') || timeZone.includes('Jayapura')) return buildSuggestion('IDR', timeZone, 'ID');
    if (timeZone.includes('Kuala_Lumpur')) return buildSuggestion('MYR', timeZone, 'MY');
    if (timeZone.includes('Singapore')) return buildSuggestion('SGD', timeZone, 'SG');
    if (timeZone.includes('Bangkok')) return buildSuggestion('THB', timeZone, 'TH');
    if (timeZone.includes('Ho_Chi_Minh') || timeZone.includes('Saigon')) return buildSuggestion('VND', timeZone, 'VN');
    if (timeZone.includes('Tokyo')) return buildSuggestion('JPY', timeZone, 'JP');
    if (timeZone.includes('Seoul')) return buildSuggestion('KRW', timeZone, 'KR');
    if (timeZone.includes('Sao_Paulo')) return buildSuggestion('BRL', timeZone, 'BR');
    if (timeZone.includes('Kolkata') || timeZone.includes('Calcutta')) return buildSuggestion('INR', timeZone, 'IN');
    if (timeZone.includes('Riyadh')) return buildSuggestion('SAR', timeZone, 'SA');
    if (timeZone.includes('Dubai')) return buildSuggestion('AED', timeZone, 'AE');
    if (timeZone.includes('Istanbul')) return buildSuggestion('TRY', timeZone, 'TR');
    if (timeZone.includes('London')) return buildSuggestion('GBP', timeZone, 'GB');
    if (timeZone.includes('Sydney') || timeZone.includes('Melbourne') || timeZone.includes('Brisbane')) return buildSuggestion('AUD', timeZone, 'AU');
    if (timeZone.includes('Toronto') || timeZone.includes('Vancouver')) return buildSuggestion('CAD', timeZone, 'CA');
    if (timeZone.startsWith('Europe/')) return buildSuggestion('EUR', timeZone, 'EU');
  }

  return null;
}

function buildSuggestion(currency: Currency, source: string, countryCode: string): LocaleCurrencySuggestion {
  const info = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  return {
    currency,
    country: info.country,
    flag: info.flag,
    symbol: info.symbol,
    sourceLocale: source,
    detectedCountryCode: countryCode,
  };
}
