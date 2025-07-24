'use client';

import React from 'react';
import { ServiceCategory } from '@/types';

interface ServiceCategorySelectorProps {
  onSelect: (category: ServiceCategory) => void;
  onBack: () => void;
  disabled?: boolean;
}

const categories: {
  id: ServiceCategory;
  icon: string;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    id: 'salon_spa',
    icon: '💇',
    title: 'Salon & Spa',
    description: 'Hair, beauty, wellness',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'gym_fitness',
    icon: '💪',
    title: 'Gym & Fitness',
    description: 'Training, classes, sports',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'food_dining',
    icon: '🍽️',
    title: 'Food & Dining',
    description: 'Restaurants, cafes, bars',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'health_medical',
    icon: '🏥',
    title: 'Health & Medical',
    description: 'Clinics, dental, therapy',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'professional_services',
    icon: '💼',
    title: 'Prof. Services',
    description: 'Legal, finance, consulting',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: 'other',
    icon: '➕',
    title: 'Other Services',
    description: 'Custom service type',
    color: 'from-gray-500 to-slate-500'
  }
];

export default function ServiceCategorySelector({ onSelect, onBack, disabled = false }: ServiceCategorySelectorProps) {
  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-3">
        What type of service business?
      </h2>
      <p className="text-white/70 text-sm sm:text-base text-center mb-8">
        Select your service category for tailored content strategies
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            disabled={disabled}
            className="group relative bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${category.color} rounded-xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
            
            <div className="relative">
              <div className="text-3xl sm:text-4xl mb-3">{category.icon}</div>
              <h3 className="text-sm sm:text-base font-semibold text-white mb-1">{category.title}</h3>
              <p className="text-xs text-white/60">{category.description}</p>
            </div>
          </button>
        ))}
      </div>
      
    </div>
  );
}