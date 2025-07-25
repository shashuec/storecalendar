'use client';

import React from 'react';
import { BusinessType } from '@/types';

interface BusinessTypeSelectorProps {
  onSelect: (type: BusinessType) => void;
  disabled?: boolean;
  onShowFeedback?: () => void;
}

export default function BusinessTypeSelector({ onSelect, disabled = false, onShowFeedback }: BusinessTypeSelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-2">
        Select your business type
      </h2>
      <p className="text-white/60 text-sm text-center mb-8">
        Get AI-powered social media content tailored to your industry
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {/* Product Business Card */}
        <button
          onClick={() => onSelect('product')}
          disabled={disabled}
          className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-400/30 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors duration-300">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            
            <h3 className="text-base font-medium text-white mb-2">E-commerce Store</h3>
            
            <p className="text-white/50 text-sm mb-4">
              For Shopify stores and online retailers
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Shopify</span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Products</span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Retail</span>
            </div>
            
            <div className="mt-4 text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Get Started →
            </div>
          </div>
        </button>

        {/* Service Business Card */}
        <button
          onClick={() => onSelect('service')}
          disabled={disabled}
          className="group relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-400/30 hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors duration-300">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <h3 className="text-base font-medium text-white mb-2">Service Business</h3>
            
            <p className="text-white/50 text-sm mb-4">
              For salons, restaurants, gyms & more
            </p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Salon</span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Restaurant</span>
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded">Fitness</span>
            </div>
            
            <div className="mt-4 text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Get Started →
            </div>
          </div>
        </button>
      </div>

      {/* Feedback Button */}
      {onShowFeedback && (
        <div className="mt-8 text-center">
          <button
            onClick={onShowFeedback}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium rounded-lg border border-white/20 hover:border-white/30 transition-all duration-300 flex items-center gap-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.13 8.13 0 01-2.859-.515l-5.433 1.378a1 1 0 01-1.24-1.24l1.378-5.433A8.13 8.13 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
            Need help? Send feedback
          </button>
        </div>
      )}
    </div>
  );
}