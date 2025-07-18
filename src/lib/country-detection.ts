import { CountryCode } from '@/types';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  flag: string;
  timezone: string;
  currency: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    timezone: 'America/New_York',
    currency: 'USD'
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    flag: '🇬🇧',
    timezone: 'Europe/London',
    currency: 'GBP'
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  }
];

// Get country info by code
export function getCountryInfo(code: CountryCode): CountryInfo | null {
  return SUPPORTED_COUNTRIES.find(country => country.code === code) || null;
}

// Detect country from Shopify URL patterns
export function detectCountryFromUrl(shopifyUrl: string): CountryCode {
  const url = shopifyUrl.toLowerCase();
  
  // UK domain patterns
  if (url.includes('.co.uk') || url.includes('.uk')) {
    return 'UK';
  }
  
  // Indian domain patterns or store names
  if (url.includes('.in') || 
      url.includes('india') || 
      url.includes('mumbai') || 
      url.includes('delhi') || 
      url.includes('bangalore')) {
    return 'IN';
  }
  
  // Default to US for .com and most other domains
  return 'US';
}

// Detect country from browser/request headers (for future use)
export function detectCountryFromHeaders(headers: Record<string, string>): CountryCode {
  const acceptLanguage = headers['accept-language']?.toLowerCase() || '';
  const userAgent = headers['user-agent']?.toLowerCase() || '';
  
  // Basic language detection
  if (acceptLanguage.includes('en-gb') || acceptLanguage.includes('en-uk')) {
    return 'UK';
  }
  
  if (acceptLanguage.includes('hi') || 
      acceptLanguage.includes('en-in') || 
      userAgent.includes('india')) {
    return 'IN';
  }
  
  // Default to US
  return 'US';
}

// Get default country (can be overridden by user selection)
export function getDefaultCountry(): CountryCode {
  // Could enhance this with geolocation in the future
  return 'US';
}

// Validate country code
export function isValidCountryCode(code: string): code is CountryCode {
  return SUPPORTED_COUNTRIES.some(country => country.code === code);
}

// Get optimal posting times for each country (for future use)
export function getOptimalPostingTimes(country: CountryCode): string[] {
  const times: Record<CountryCode, string[]> = {
    'US': ['9:00 AM EST', '12:00 PM EST', '3:00 PM EST', '6:00 PM EST'],
    'UK': ['8:00 AM GMT', '12:00 PM GMT', '2:00 PM GMT', '5:00 PM GMT'],
    'IN': ['9:00 AM IST', '1:00 PM IST', '4:00 PM IST', '7:00 PM IST']
  };
  
  return times[country] || times['US'];
}