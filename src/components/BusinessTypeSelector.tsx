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
      <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
        What type of business do you run?
      </h2>
      <p className="text-white/70 text-sm sm:text-base text-center mb-8">
        Choose your business type to get personalized social media content
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
        {/* Product Business Card */}
        <button
          onClick={() => onSelect('product')}
          disabled={disabled}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 hover:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <span className="text-3xl sm:text-4xl">🛍️</span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Product Business</h3>
            
            <ul className="text-white/70 text-sm sm:text-base space-y-2 text-left">
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                E-commerce stores
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Retail shops
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Online boutiques
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-400">•</span>
                Dropshipping
              </li>
            </ul>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-blue-400 font-medium">
              <span>Select Product</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Service Business Card */}
        <button
          onClick={() => onSelect('service')}
          disabled={disabled}
          className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 hover:border-purple-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <span className="text-3xl sm:text-4xl">✨</span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3">Service Business</h3>
            
            <ul className="text-white/70 text-sm sm:text-base space-y-2 text-left">
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Salons & Spas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Gyms & Fitness
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Restaurants & Cafes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Medical & Wellness
              </li>
              <li className="flex items-center gap-2">
                <span className="text-purple-400">•</span>
                Professional Services
              </li>
            </ul>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-purple-400 font-medium">
              <span>Select Service</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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