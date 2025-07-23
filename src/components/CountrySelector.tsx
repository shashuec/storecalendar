'use client';

import { CountryCode } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/lib/country-detection';

interface CountrySelectorProps {
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  disabled?: boolean;
}

export function CountrySelector({ 
  selectedCountry, 
  onCountryChange, 
  disabled = false 
}: CountrySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select your country for holiday-aware content
      </label>
      <div className="grid grid-cols-3 gap-3">
        {SUPPORTED_COUNTRIES.map((country) => (
          <button
            key={country.code}
            type="button"
            disabled={disabled}
            onClick={() => onCountryChange(country.code)}
            className={`
              relative flex flex-col items-center p-4 rounded-lg border-2 transition-all
              ${selectedCountry === country.code
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            `}
          >
            {/* Flag */}
            <span className="text-2xl mb-2" role="img" aria-label={country.name}>
              {country.flag}
            </span>
            
            {/* Country Name */}
            <span className="text-sm font-medium text-center">
              {country.name}
            </span>
            
            {/* Currency Indicator */}
            <span className="text-xs text-gray-500 mt-1">
              {country.currency}
            </span>
            
            {/* Selected Indicator */}
            {selectedCountry === country.code && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg 
                  className="w-2.5 h-2.5 text-white" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      
      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-2">
        We&apos;ll include relevant holidays from your selected country in the social media calendar.
      </p>
    </div>
  );
}

// Compact version for smaller spaces
export function CountrySelectorCompact({ 
  selectedCountry, 
  onCountryChange, 
  disabled = false 
}: CountrySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        Country
      </label>
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value as CountryCode)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        {SUPPORTED_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default CountrySelector;