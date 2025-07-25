'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ServiceSelectorProps {
  services: string[];
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
}

export function ServiceSelector({ services, selectedServices, onServicesChange }: ServiceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const toggleService = (service: string) => {
    if (selectedServices.includes(service)) {
      onServicesChange(selectedServices.filter(s => s !== service));
    } else {
      onServicesChange([...selectedServices, service]);
    }
  };

  const toggleAll = () => {
    if (selectedServices.length === services.length) {
      onServicesChange([]);
    } else {
      onServicesChange([...services]);
    }
  };

  // Filter services based on search
  const filteredServices = services.filter(service =>
    service.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-base sm:text-lg font-medium text-white mb-2">Select Services to Promote</h3>
        <p className="text-xs sm:text-sm text-white/70 px-4">
          Choose which services you want to create content for ({services.length} services found)
        </p>
      </div>

      {/* Search and Select All Controls */}
      {services.length > 5 && (
        <div className="max-w-md mx-auto space-y-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <button
            onClick={toggleAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors text-white"
          >
            {selectedServices.length === services.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      )}
      
      {/* Scrollable Service List */}
      <div className={cn(
        "max-w-lg mx-auto",
        services.length > 8 ? "max-h-96 overflow-y-auto" : ""
      )}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2">
          {filteredServices.map((service) => (
            <button
              key={service}
              onClick={() => toggleService(service)}
              className={cn(
                "relative p-3 rounded-lg border-2 transition-all duration-200 text-left",
                "hover:scale-[1.02] active:scale-[0.98]",
                selectedServices.includes(service)
                  ? "border-primary bg-primary/10 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium break-words">{service}</span>
                {selectedServices.includes(service) && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selection Status */}
      <div className="text-center space-y-2">
        <p className="text-sm text-white/70">
          {selectedServices.length} of {services.length} services selected
        </p>
        {selectedServices.length === 0 && (
          <p className="text-xs text-red-400">Please select at least one service</p>
        )}
      </div>

      {/* Show message if no services match search */}
      {searchQuery && filteredServices.length === 0 && (
        <p className="text-sm text-white/50 text-center">No services match &quot;{searchQuery}&quot;</p>
      )}
    </div>
  );
}