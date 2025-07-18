'use client';

import { BrandTone } from '@/types';
import { BRAND_TONES } from '@/lib/brand-tones';

interface BrandToneSelectorProps {
  selectedTone: BrandTone;
  onToneChange: (tone: BrandTone) => void;
  disabled?: boolean;
  showExamples?: boolean;
}

export function BrandToneSelector({
  selectedTone,
  onToneChange,
  disabled = false,
  showExamples = true
}: BrandToneSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Choose your brand voice
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Select the tone that best represents your brand personality
        </p>
      </div>

      {/* Tone Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BRAND_TONES.map((tone) => (
          <div key={tone.id} className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onToneChange(tone.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${selectedTone === tone.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
              `}
            >
              {/* Tone Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-semibold ${
                  selectedTone === tone.id ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {tone.name}
                </h3>
                
                {/* Selected Indicator */}
                {selectedTone === tone.id && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">
                {tone.description}
              </p>

              {/* Characteristics */}
              <div className="space-y-1 mb-3">
                {tone.characteristics.slice(0, 2).map((characteristic, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-500">
                    <svg className="w-3 h-3 mr-1.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {characteristic}
                  </div>
                ))}
              </div>

              {/* Example Preview */}
              {showExamples && (
                <div className="bg-gray-50 p-3 rounded text-xs">
                  <span className="font-medium text-gray-700">Example:</span>
                  <p className="text-gray-600 mt-1 italic">
                    &quot;{tone.example.substring(0, 100)}...&quot;
                  </p>
                </div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Selected Tone Details */}
      {showExamples && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            {BRAND_TONES.find(t => t.id === selectedTone)?.name} Voice Guidelines
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Tone:</span>
              <p className="text-blue-700 mt-1">
                {BRAND_TONES.find(t => t.id === selectedTone)?.voiceGuidelines.tone}
              </p>
            </div>
            
            <div>
              <span className="font-medium text-blue-800">Style:</span>
              <p className="text-blue-700 mt-1">
                {BRAND_TONES.find(t => t.id === selectedTone)?.voiceGuidelines.style}
              </p>
            </div>
          </div>

          {/* Full Example */}
          <div className="mt-3">
            <span className="font-medium text-blue-800">Full Example:</span>
            <p className="text-blue-700 mt-1 italic">
              {BRAND_TONES.find(t => t.id === selectedTone)?.example}
            </p>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Your selected tone will be applied consistently across all 7 posts</p>
        <p>• This ensures your brand voice remains authentic throughout the calendar</p>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function BrandToneSelectorCompact({
  selectedTone,
  onToneChange,
  disabled = false
}: Omit<BrandToneSelectorProps, 'showExamples'>) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        Brand Voice
      </label>
      <select
        value={selectedTone}
        onChange={(e) => onToneChange(e.target.value as BrandTone)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        {BRAND_TONES.map((tone) => (
          <option key={tone.id} value={tone.id}>
            {tone.name} - {tone.description.substring(0, 40)}...
          </option>
        ))}
      </select>
      
      {/* Selected tone description */}
      <p className="text-xs text-white/70">
        {BRAND_TONES.find(t => t.id === selectedTone)?.description}
      </p>
    </div>
  );
}

export default BrandToneSelector;