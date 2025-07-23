'use client';

import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationResponse, CountryCode, BrandTone } from '@/types';
import { CountrySelectorCompact } from '@/components/CountrySelector';
import { ProductSelector } from '@/components/ProductSelector';
import { BrandToneSelectorCompact } from '@/components/BrandToneSelector';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { FeedbackModal } from '@/components/FeedbackModal';
import { smartSelectProducts } from '@/lib/product-ranking';
import { useAuth } from '@/contexts/AuthContext';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { usePersistedState } from '@/hooks/usePersistedState';
import { PageLoader, InlineLoader } from '@/components/Loader';
import DemoVideo from '@/components/DemoVideo';

export default function HomePage() {
  // Auth state
  const { user, loading: authLoading, logout, getAuthHeaders } = useAuth();
  
  // State persistence
  const { isLoaded, getPersistedState, saveState, clearState } = usePersistedState();
  
  // Basic state
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState('');
  
  // V1 form state - initialize based on auth state
  const [currentStep, setCurrentStep] = useState<'url' | 'auth' | 'products' | 'preferences' | 'results'>('url');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('US');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<BrandTone>('casual');
  const [weekNumber, setWeekNumber] = useState<1 | 2>(1);
  
  // Copy state for calendar posts
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  
  // Freemium usage tracking
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Calendar generation progress
  const [generatingDay, setGeneratingDay] = useState(1);
  
  // Logo reset loading state
  const [isResetting, setIsResetting] = useState(false);

  // Reset all state and go to homepage
  const resetToHomepage = useCallback(() => {
    setIsResetting(true);
    
    // Show loading then reset everything
    setTimeout(() => {
      setUrl('');
      setLoading(false);
      setResult(null);
      setError('');
      setCurrentStep('url');
      setSelectedCountry('US');
      setSelectedProducts([]);
      setSelectedTone('casual');
      setWeekNumber(1);
      setCopiedCaption(null);
      setShowUpgradePrompt(false);
      setShowFeedbackModal(false);
      setGeneratingDay(1);
      setIsResetting(false);
      
      // Clear any localStorage data if needed
      // localStorage.removeItem('someKey'); // Add if you have persisted data
    }, 800); // Brief loading for good UX
  }, []);
  
  // Check usage on component mount
  useEffect(() => {
    const today = new Date().toDateString();
    const savedUsage = localStorage.getItem(`usage_${today}`);
    setDailyUsage(savedUsage ? parseInt(savedUsage) : 0);
  }, []);

  // Initialize proper step based on auth state and persisted data
  useEffect(() => {
    if (isLoaded && !authLoading) {
      if (user) {
        // User is authenticated, restore their state
        const persistedState = getPersistedState();
        if (persistedState) {
          // Batch all state updates to prevent multiple re-renders
          startTransition(() => {
            setCurrentStep(persistedState.currentStep);
            setUrl(persistedState.url);
            setSelectedProducts(persistedState.selectedProducts);
            setSelectedCountry(persistedState.selectedCountry);
            setSelectedTone(persistedState.selectedTone);
            setWeekNumber(persistedState.weekNumber);
            setResult(persistedState.result);
          });
        } else {
          // Authenticated user but no saved state, start at URL step
          setCurrentStep('url');
        }
      } else {
        // User not authenticated, check if they have entered a URL before
        const persistedState = getPersistedState();
        if (persistedState && persistedState.url) {
          // User has a URL saved but not authenticated, go to auth step
          startTransition(() => {
            setUrl(persistedState.url);
            setCurrentStep('auth');
          });
        } else {
          // Fresh user, start at URL step
          setCurrentStep('url');
        }
      }
    }
  }, [isLoaded, authLoading, user]); // Removed getPersistedState to prevent dependency issues

  // Debounced state persistence to prevent excessive localStorage writes
  const debouncedSaveState = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout | null = null;
      return (state: Parameters<typeof saveState>[0]) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => saveState(state), 300);
      };
    },
    [saveState]
  );

  // Save state on changes with debouncing
  useEffect(() => {
    if (isLoaded) {
      debouncedSaveState({
        currentStep,
        url,
        selectedProducts,
        selectedCountry,
        selectedTone,
        weekNumber,
        result,
      });
    }
  }, [isLoaded, currentStep, url, selectedProducts, selectedCountry, selectedTone, weekNumber, result, debouncedSaveState]);

  // Memoize enhanced products to prevent unnecessary recalculations
  const enhancedProducts = useMemo(() => result?.enhanced_products || [], [result?.enhanced_products]);
  
  // Auto-select products when enhanced products are loaded (only once)
  useEffect(() => {
    if (enhancedProducts.length > 0 && selectedProducts.length === 0) {
      const autoSelected = smartSelectProducts(enhancedProducts, 5);
      const selectedIds = autoSelected.filter(p => p.selected).map(p => p.id);
      setSelectedProducts(selectedIds);
    }
  }, [enhancedProducts, selectedProducts.length]);

  // Define handleGenerate before using it in effects
  const handleGenerate = useCallback(async (withEmail = false, forceRefresh = false) => {
    if (!url.trim()) {
      setError('Please enter a Shopify store URL');
      return;
    }

    setLoading(true);
    setError('');
    
    // Start day progression for calendar generation only
    if (currentStep === 'preferences') {
      setGeneratingDay(1);
      const dayInterval = setInterval(() => {
        setGeneratingDay(prev => {
          if (prev >= 7) {
            clearInterval(dayInterval);
            return 7;
          }
          return prev + 1;
        });
      }, 1000); // Change day every 1 second
      
      // Clear interval when loading finishes
      setTimeout(() => clearInterval(dayInterval), 7000);
    }

    try {
      const requestBody: Record<string, unknown> = {
        shopify_url: url,
        ...(forceRefresh && { force_refresh: true }),
        // V1 parameters
        country: selectedCountry,
        brand_tone: selectedTone,
        week_number: weekNumber
      };

      // Add selected products if user has made selections
      if (selectedProducts.length > 0) {
        requestBody.selected_products = selectedProducts;
      }


      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(requestBody),
      });

      const data: GenerationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      if (data.success) {
        setResult(data);
        
        // Track usage for freemium model
        if (currentStep === 'preferences') {
          const today = new Date().toDateString();
          const newUsage = dailyUsage + 1;
          setDailyUsage(newUsage);
          localStorage.setItem(`usage_${today}`, newUsage.toString());
          
          if (newUsage >= 3) {
            setShowUpgradePrompt(true);
          }
        }
        
        // V1 flow: proceed to next step or show results
        if (currentStep === 'url' && data.enhanced_products) {
          setCurrentStep('products');
        } else if (currentStep === 'auth' && data.enhanced_products) {
          // User logged in and products loaded, skip URL step and go to products
          setCurrentStep('products');
        } else if (currentStep === 'products') {
          setCurrentStep('preferences');
        } else if (currentStep === 'preferences') {
          setCurrentStep('results');
          // Show feedback modal after calendar is generated
          setTimeout(() => {
            setShowFeedbackModal(true);
          }, 2000); // Wait 2 seconds for user to see the results
        }

      } else {
        setError(data.error || 'Failed to generate content');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      
      // Provide more helpful error messages for common issues
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        setError('Service temporarily unavailable due to high demand. Please try again in a few minutes.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setGeneratingDay(1); // Reset day counter
    }
  }, [url, selectedCountry, selectedTone, weekNumber, selectedProducts, getAuthHeaders, currentStep, dailyUsage]);

  // Auto-proceed from auth step once user logs in
  useEffect(() => {
    if (currentStep === 'auth' && user && url.trim() && !loading) {
      // User just logged in and we have a URL, and we're not already loading
      if (result?.enhanced_products) {
        // Products already loaded, skip directly to product selection
        setCurrentStep('products');
      } else {
        // Need to load products first, then will auto-navigate to products step
        handleGenerate();
      }
    }
  }, [currentStep, user, url, result?.enhanced_products, loading, handleGenerate]);

  // Memoized step navigation functions to prevent unnecessary re-renders
  const handleNextStep = useCallback(() => {
    if (currentStep === 'url') {
      if (!url.trim()) {
        setError('Please enter a Shopify store URL');
        return;
      }
      // Check if user is authenticated before proceeding
      if (!user) {
        setCurrentStep('auth');
        return;
      }
      handleGenerate();
    } else if (currentStep === 'products') {
      if (selectedProducts.length < 1) {
        setError('Please select at least 1 product');
        return;
      }
      setCurrentStep('preferences');
    } else if (currentStep === 'preferences') {
      // Generate the final calendar
      handleGenerate();
    }
    setError('');
  }, [currentStep, url, user, selectedProducts.length, handleGenerate]);

  const handlePrevStep = useCallback(() => {
    if (currentStep === 'auth') setCurrentStep('url');
    else if (currentStep === 'products') {
      // Clear selected products and results when going back from product selection
      setSelectedProducts([]);
      setResult(null); // Clear previous results to prevent ID conflicts with new URL
      // If user is logged in, skip auth and go back to URL
      setCurrentStep(user ? 'url' : 'auth');
    }
    else if (currentStep === 'preferences') {
      // Clear selected products when going back to product selection
      setSelectedProducts([]);
      setCurrentStep('products');
    }
    else if (currentStep === 'results') setCurrentStep('preferences');
    setError('');
  }, [currentStep, user]);

  const handleGenerateWeek2 = useCallback(() => {
    setWeekNumber(2);
    setCurrentStep('results');
    handleGenerate();
  }, [handleGenerate]);




  const resetForm = () => {
    setResult(null);
    setUrl('');
    setError('');
    setCurrentStep('url');
    setSelectedProducts([]);
    setCopiedCaption(null);
    clearState(); // Clear persisted state
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <PageLoader text="Authenticating..." />
      </div>
    );
  }

  // Show loading screen while resetting
  if (isResetting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
        <PageLoader text="Resetting..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="relative px-4 lg:px-6 h-16 sm:h-20 flex items-center border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={resetToHomepage}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm sm:text-lg">SC</span>
            </div>
            <span className="font-bold text-lg sm:text-xl text-white">StoreCalendar</span>
          </div>
          <nav className="flex gap-3 sm:gap-6 items-center">
            {!user ? (
              <>
                <a href="#features" className="hidden sm:block text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
                  Features
                </a>
                <a href="#testimonials" className="hidden md:block text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
                  Reviews
                </a>
                <a href="#pricing" className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
                  Pricing
                </a>
                <a href="#faq" className="hidden sm:block text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
                  FAQ
                </a>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  {user.picture && (
                    <Image 
                      src={user.picture} 
                      alt={user.name}
                      width={28}
                      height={28}
                      className="rounded-full sm:w-8 sm:h-8"
                    />
                  )}
                  <span className="hidden sm:block text-white/90 text-sm">{user.name}</span>
                </div>
                <Button
                  onClick={logout}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg border border-white/20 transition-all duration-300"
                >
                  Logout
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white mb-6 sm:mb-8 leading-tight">
            E-commerce Content 
            <span className="block sm:inline bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Automation Platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/70 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4">
            Create a week&apos;s worth of strategic posts in 60 seconds. Starting with Shopify, expanding to all e-commerce platforms. Holiday-aware content that connects with your audience.
          </p>
         
              
              {/* V1 Multi-Step Generator Form */}
              <div id="generator-form" className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-16 max-w-6xl mx-auto border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-2xl sm:rounded-3xl" />
                <div className="relative space-y-4 sm:space-y-6">
                  
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-6 sm:mb-8 overflow-hidden">
                    {[
                      { key: 'url', label: 'Store URL' },
                      { key: 'products', label: 'Products' },
                      { key: 'preferences', label: 'Preferences' },
                      { key: 'results', label: 'Calendar' }
                    ].map((stepInfo, index) => (
                      <div key={stepInfo.key} className="flex items-center flex-shrink-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                            currentStep === stepInfo.key 
                              ? 'bg-blue-500 text-white' 
                              : index < ['url', 'products', 'preferences', 'results'].indexOf(currentStep)
                                ? 'bg-green-500 text-white'
                                : 'bg-white/20 text-white/60'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="text-[8px] sm:text-xs text-white/70 mt-1 text-center whitespace-nowrap">{stepInfo.label}</div>
                        </div>
                        {index < 3 && (
                          <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 ${
                            index < ['url', 'products', 'preferences', 'results'].indexOf(currentStep)
                              ? 'bg-green-500'
                              : 'bg-white/20'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: URL Input */}
                  {currentStep === 'url' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label htmlFor="url" className="block text-sm font-medium text-white/90 mb-3">
                          Enter Your E-commerce Store URL
                        </label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="e.g., mystore.myshopify.com or myshop.com"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl h-12 sm:h-14 px-3 sm:px-4 focus:bg-white/20 focus:border-blue-400 transition-all duration-300 text-sm sm:text-base"
                          disabled={loading}
                        />
                       
                      </div>
                    </div>
                  )}

                  {/* Step 2: Authentication */}
                  {currentStep === 'auth' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center">
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                          Sign in to continue
                        </h3>
                        <p className="text-white/70 mb-2 text-sm sm:text-base">
                          Create your weekly content calendar with AI
                        </p>
                        
                        <div className="flex justify-center">
                          <GoogleLoginButton loading={loading} />
                        </div>
                        
                        <p className="text-xs sm:text-sm text-white/50 mt-6 sm:mt-8 px-4">
                          By signing in, you agree to our Terms of Service and Privacy Policy
                        </p>
                        
                        {/* <div className="mt-4 sm:mt-6">
                          <Button
                            onClick={handlePrevStep}
                            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-xl border border-white/20 transition-all duration-300 text-sm sm:text-base"
                          >
                            ← Back to URL
                          </Button>
                        </div> */}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Product Selection */}
                  {currentStep === 'products' && result?.enhanced_products && (
                    <div className="space-y-6">
                      <ProductSelector
                        products={result.enhanced_products}
                        selectedProducts={selectedProducts}
                        onSelectionChange={setSelectedProducts}
                        disabled={loading}
                        minSelection={3}
                        maxSelection={10}
                      />
                    </div>
                  )}

                  {/* Step 4: Preferences (Country + Brand Tone) */}
                  {currentStep === 'preferences' && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="text-center mb-4">
                        <h3 className="text-base sm:text-lg font-medium text-white mb-2">Set Your Preferences</h3>
                        <p className="text-xs sm:text-sm text-white/70 px-4">Choose your country for holiday-aware content and select your brand voice</p>                        
                      </div>
                      
                      <div className="space-y-3 sm:space-y-4">
                        <CountrySelectorCompact
                          selectedCountry={selectedCountry}
                          onCountryChange={setSelectedCountry}
                          disabled={loading}
                        />
                        <BrandToneSelectorCompact
                          selectedTone={selectedTone}
                          onToneChange={setSelectedTone}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 5: Results */}
                  {currentStep === 'results' && result?.weekly_calendar && (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Results Header */}
                      <div className="text-center space-y-2 sm:space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-500 rounded-full mb-3 sm:mb-4">
                          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white">Your Calendar is Ready! 🎉</h3>
                        <p className="text-sm sm:text-base text-white/70 px-4">
                          {result.store_name} - Week {weekNumber} • {result.weekly_calendar.posts.length} strategic posts
                        </p>
                      </div>

                      {/* Calendar Component */}
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-white/10">
                        <WeeklyCalendar
                          calendar={result.weekly_calendar}
                          calendarId={result.calendar_id}
                          storeName={result.store_name}
                          onCopyPost={(post) => {
                            navigator.clipboard.writeText(post.caption_text);
                            setCopiedCaption(post.id);
                            setTimeout(() => setCopiedCaption(null), 2000);
                          }}
                        />
                      </div>
                      
                      {/* Generate Next Week Button
                        {weekNumber === 1 && (
                          <div className="flex-1">
                            <Button
                              onClick={handleGenerateWeek2}
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                            >
                              {loading ? 'Generating...' : 'Generate Next Week →'}
                            </Button>
                          </div>
                        )}
                      */}

                      {/* Success Tips */}
                      <div className="bg-blue-500/10 backdrop-blur-sm rounded-xl border border-blue-500/20 p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-blue-300 font-semibold text-sm sm:text-base mb-2">💡 Pro Tips</h4>
                            <ul className="space-y-1 text-white/80 text-xs sm:text-sm">
                              <li>• Click any post to copy the caption instantly</li>
                              <li>• Use the CSV export for batch uploading to social media tools</li>
                              <li>• Share your calendar link with team members for collaboration</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Start Over Button */}
                      <div className="text-center pt-4 border-t border-white/10">
                        <Button
                          onClick={() => {
                            setLoading(true);
                            setError('');
                            
                            // Show brief loading then reset
                            setTimeout(() => {
                              setCurrentStep('url');
                              setResult(null);
                              setUrl('');
                              setSelectedProducts([]);
                              setWeekNumber(1);
                              setError('');
                              setGeneratingDay(1);
                              setLoading(false);
                            }, 500); // Brief 500ms loading
                          }}
                          disabled={loading}
                          className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-xl border border-white/20 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <InlineLoader text="Resetting..." />
                          ) : (
                            <>← Create New Calendar</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div className="text-red-300 text-xs sm:text-sm bg-red-500/20 backdrop-blur-sm p-3 sm:p-4 rounded-xl border border-red-500/30 mx-2 sm:mx-0">
                      {error}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {currentStep !== 'results' && currentStep !== 'auth' && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 sm:pt-6">
                      {currentStep !== 'url' ? (
                        <Button
                          onClick={handlePrevStep}
                          disabled={loading}
                          className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl border border-white/20 transition-all duration-300 text-sm sm:text-base order-2 sm:order-1"
                        >
                          ← Back
                        </Button>
                      ) : <div className="hidden sm:block" />}
                      
                      <Button
                        onClick={handleNextStep}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-sm sm:text-base order-1 sm:order-2"
                      >
                        {loading ? (
                          <InlineLoader 
                            text={currentStep === 'url' ? 'Loading products...' : 
                                  currentStep === 'preferences' ? `Generating Day ${generatingDay}...` : 
                                  'Processing...'}
                          />
                        ) : (
                          <>
                            {currentStep === 'url' ? 'Load Products' :
                             currentStep === 'products' ? 'Set Preferences' :
                             currentStep === 'preferences' ? 'Generate Calendar' : 'Next'}
                            {currentStep !== 'preferences' && ' →'}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                </div>
              </div>

              {/* Demo Video Section */}
              <DemoVideo className="max-w-6xl mx-auto mb-8 sm:mb-16" />

              {/* Demo Preview - Real Calendar Style */}
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl" />
                <div className="relative">
                  <div className="text-xs sm:text-sm text-white/60 mb-4 sm:mb-6 text-center px-2">📅 Example week for: E-commerce Store (Organic Cotton T-Shirts)</div>
                  
                  {/* Calendar Grid - Matches WeeklyCalendar component */}
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-6">
                    
                    {/* Monday - Product Showcase */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 flex flex-col min-h-[400px] sm:min-h-[500px]">
                      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">MON</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base">Monday</h3>
                            <p className="text-xs sm:text-sm text-white/60">Jan 15, 2024</p>
                          </div>
                        </div>
                        <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-md sm:rounded-lg truncate max-w-[100px] sm:max-w-[120px]">
                          Product Showcase
                        </span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden relative h-32 sm:h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-4xl">👕</span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 flex-1">
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed break-words overflow-hidden">
                          New week, new comfort! 🌟 Our organic cotton tees are perfect for Monday motivation. Soft, sustainable, stylish - everything you need to start strong!
                        </p>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-medium text-white text-xs sm:text-sm mb-1 truncate">Organic Cotton T-Shirt</h4>
                        <p className="text-white/60 text-xs mb-1 sm:mb-2">$29.99</p>
                        <p className="text-white/50 text-xs line-clamp-2 break-words">Premium organic cotton tee in forest green</p>
                      </div>
                      
                      <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 mt-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Caption
                      </button>
                    </div>

                    {/* Tuesday - Benefits Focus */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 flex flex-col min-h-[400px] sm:min-h-[500px]">
                      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">TUE</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base">Tuesday</h3>
                            <p className="text-xs sm:text-sm text-white/60">Jan 16, 2024</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-md sm:rounded-lg truncate max-w-[100px] sm:max-w-[120px]">
                          Benefits Focus
                        </span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden relative h-32 sm:h-48 bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center">
                        <span className="text-white text-4xl">🌱</span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 flex-1">
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed break-words overflow-hidden">
                          Tuesday Truth: Organic cotton is breathable, hypoallergenic, and eco-friendly. Your skin will thank you! 🌱 Perfect for sensitive skin and conscious living.
                        </p>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-medium text-white text-xs sm:text-sm mb-1 truncate">Organic Cotton T-Shirt</h4>
                        <p className="text-white/60 text-xs mb-1 sm:mb-2">$29.99</p>
                        <p className="text-white/50 text-xs line-clamp-2 break-words">Breathable and hypoallergenic fabric</p>
                      </div>
                      
                      <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 mt-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Caption
                      </button>
                    </div>

                    {/* Wednesday - Social Proof */}
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/15 transition-all duration-300 flex flex-col min-h-[400px] sm:min-h-[500px]">
                      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xs sm:text-sm">WED</span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-white text-sm sm:text-base">Wednesday</h3>
                            <p className="text-xs sm:text-sm text-white/60">Jan 17, 2024</p>
                          </div>
                        </div>
                        <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-md sm:rounded-lg truncate max-w-[100px] sm:max-w-[120px]">
                          Social Proof
                        </span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl overflow-hidden relative h-32 sm:h-48 bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center">
                        <span className="text-white text-4xl">⭐</span>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 flex-1">
                        <p className="text-white/90 text-xs sm:text-sm leading-relaxed break-words overflow-hidden">
                          ⭐⭐⭐⭐⭐ &lsquo;Best investment for my wardrobe!&rsquo; - Sarah M. Join hundreds of happy customers who love the quality and comfort! 💛
                        </p>
                      </div>
                      
                      <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/5 rounded-lg border border-white/10">
                        <h4 className="font-medium text-white text-xs sm:text-sm mb-1 truncate">Organic Cotton T-Shirt</h4>
                        <p className="text-white/60 text-xs mb-1 sm:mb-2">$29.99</p>
                        <p className="text-white/50 text-xs line-clamp-2 break-words">4.8/5 stars from 200+ reviews</p>
                      </div>
                      
                      <button className="w-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium py-2 px-3 sm:px-4 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2 mt-auto">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Caption
                      </button>
                    </div>

                    {/* Remaining days preview */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                      <div className="text-white/60 mb-2">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-white/70 text-sm font-medium mb-1">+ 4 More Days</p>
                      <p className="text-white/50 text-xs">Thursday: Style Tips</p>
                      <p className="text-white/50 text-xs">Friday: Holiday Aware</p>
                      <p className="text-white/50 text-xs">Weekend: Behind-the-scenes & CTA</p>
                    </div>

                  </div>

                  {/* Calendar Info */}
                  <div className="text-center p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl border border-white/10">
                    <div className="text-center">
                      <p className="text-white/80 text-xs sm:text-sm">Calendar for Week 1</p>
                      <p className="text-white/50 text-xs mt-1">7 posts • US • Casual tone</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="relative px-4 lg:px-6 py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors duration-300">AI</div>
                  <div className="text-white/70 text-xs sm:text-sm">Powered</div>
                </div>
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors duration-300">10K+</div>
                  <div className="text-white/70 text-xs sm:text-sm">Calendars Generated</div>
                </div>
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors duration-300">30 sec</div>
                  <div className="text-white/70 text-xs sm:text-sm">Average Time</div>
                </div>
                <div className="group">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 group-hover:text-blue-400 transition-colors duration-300">4.9/5</div>
                  <div className="text-white/70 text-xs sm:text-sm">User Rating</div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-white">What Our Users Say</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="text-yellow-400 mb-4">⭐⭐⭐⭐⭐</div>
                    <p className="text-white/90 mb-6 italic">&ldquo;StoreCalendar saved me hours every week. The captions are so engaging and perfectly match my brand voice!&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">SJ</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Sarah Johnson</div>
                        <div className="text-white/60 text-sm">Boutique Fashion Store</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="text-yellow-400 mb-4">⭐⭐⭐⭐⭐</div>
                    <p className="text-white/90 mb-6 italic">&ldquo;The variety of caption styles is incredible. I use different ones for different products and they all perform amazingly!&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">MR</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Mike Rodriguez</div>
                        <div className="text-white/60 text-sm">Tech Accessories Store</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="text-yellow-400 mb-4">⭐⭐⭐⭐⭐</div>
                    <p className="text-white/90 mb-6 italic">&ldquo;My engagement rate increased by 40% since I started using StoreCalendar. The captions are pure gold!&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">LC</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Lisa Chen</div>
                        <div className="text-white/60 text-sm">Wellness Products</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-white">Why StoreCalendar?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <div className="text-center group">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-xl sm:text-2xl">⚡</span>
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-white">Instant Results</h3>
                  <p className="text-white/70 leading-relaxed text-sm sm:text-base">Get 7 different captions in 30 seconds. No waiting, no delays. AI-powered speed meets human creativity.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">E-commerce Optimized</h3>
                  <p className="text-white/70 leading-relaxed">Built for e-commerce stores. Starting with Shopify, expanding to all platforms. Uses your actual products and brand voice to create authentic, converting content.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-2xl">📈</span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">7-Day Strategic Planning</h3>
                  <p className="text-white/70 leading-relaxed">Holiday-aware weekly calendars with strategic content rotation. Never run out of post ideas again.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="relative max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-white">How It Works</h2>
              <div className="space-y-8 sm:space-y-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg lg:text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">1</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-2 text-white">Enter Store & Select Country</h3>
                    <p className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">Enter your Shopify URL and choose your country (US/UK/India) for holiday-aware content generation</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg lg:text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">2</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-2 text-white">Choose Products & Brand Tone</h3>
                    <p className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">Select 1-10 products to feature and pick your brand tone (Professional, Casual, Playful, or Luxury)</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 lg:gap-8 group">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-base sm:text-lg lg:text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 flex-shrink-0">3</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl mb-1 sm:mb-2 text-white">Get Your 7-Day Calendar</h3>
                    <p className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">Receive a complete week of holiday-aware posts with strategic content rotation and export as CSV</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Caption Styles Showcase */}
          <section className="relative px-4 lg:px-6 py-32 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6 text-white">7-Day Content Strategy</h2>
              <p className="text-center text-white/70 mb-16 text-lg max-w-3xl mx-auto">
                Each day features strategic post types designed to achieve different marketing goals. Holiday-aware content keeps you relevant year-round.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">✨</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Product Showcase</h3>
                        <p className="text-white/60 text-sm">Highlight key features</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;New arrival alert! 🌟 Our organic cotton tee in forest green is here. Soft, sustainable, perfect for any season.&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Product launches, feature highlights</div>
                  </div>
                </div>
                
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">🎯</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Benefits-Focused</h3>
                        <p className="text-white/60 text-sm">Emphasize customer value</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;Why choose organic cotton? Breathable, hypoallergenic, and eco-friendly. Your skin will thank you.&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Educational content, value props</div>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">⭐</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Social Proof</h3>
                        <p className="text-white/60 text-sm">Build trust & credibility</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;⭐⭐⭐⭐⭐ &lsquo;Best t-shirt I&apos;ve ever owned!&rsquo; - Sarah M. Absolutely love it!&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Trust building, testimonials</div>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">👕</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">How-to-Style</h3>
                        <p className="text-white/60 text-sm">Styling tips & inspiration</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;Style tip: Pair with high-waisted jeans and sneakers for the perfect casual look.&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Fashion tips, lifestyle content</div>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">🔥</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Call-to-Action</h3>
                        <p className="text-white/60 text-sm">Create urgency & drive sales</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;Limited stock alert! Only 15 left in your size. Don&apos;t miss out on ultimate comfort.&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Sales, urgency, conversions</div>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <span className="text-white text-lg">🎭</span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Behind-the-Scenes</h3>
                        <p className="text-white/60 text-sm">Brand story & values</p>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;Made with love in our sustainable factory. Every stitch represents our commitment to quality.&rdquo;</p>
                    <div className="text-xs text-white/50">Best for: Brand building, authenticity</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing/Value Section */}
          <section id="pricing" className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
            <div className="relative max-w-4xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white">Simple Pricing</h2>
              <p className="text-white/70 mb-8 sm:mb-12 text-base sm:text-lg px-4">
                Start free today. Upgrade to unlimited calendars when ready.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
                {/* Free Tier */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border-2 border-green-400 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl sm:rounded-3xl" />
                  <div className="relative">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">FREE</div>
                    <div className="text-green-300 mb-6 font-semibold">Perfect for getting started</div>
                    <ul className="space-y-3 text-left text-white/80">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        3 calendar generations per day
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        Full 7-day strategic calendar
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        CSV export functionality
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        No credit card required
                      </li>
                    </ul>
                    <div className="mt-8">
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold h-12 rounded-xl"
                        onClick={() => document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Start Free Now ✨
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Premium Coming Soon */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 opacity-75 relative">
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold">
                    COMING SOON
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl sm:rounded-3xl" />
                  <div className="relative">
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">$29<span className="text-lg sm:text-xl lg:text-2xl">/month</span></div>
                    <div className="text-purple-300 mb-2 font-semibold">Premium (Early Access Rate)</div>
                    <div className="text-white/70 mb-6 text-sm">Regular price will be $39/month</div>
                    <ul className="space-y-3 text-left text-white/80">
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        Unlimited calendar generations
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        Multiple store support
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        AI image generation
                      </li>
                      <li className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                        Priority customer support
                      </li>
                    </ul>
                    <div className="mt-8">
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12 rounded-xl"
                        disabled
                      >
                        Join Waitlist 🔔
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 mb-6 max-w-2xl mx-auto border border-blue-400/30">
                  <p className="text-blue-300 font-semibold">📅 Premium features launching soon! Join 200+ users already creating amazing content</p>
                </div>
                <p className="text-white/60 text-sm">
                  Questions? <a href="mailto:connect@conversailabs.com" className="text-blue-400 hover:text-blue-300">Contact us</a> • Enterprise plans coming soon
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="relative px-4 lg:px-6 py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
            <div className="relative max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-white">Frequently Asked Questions</h2>
              <div className="space-y-6">
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">How does StoreCalendar work?</h3>
                    <p className="text-white/80 leading-relaxed">
                      Enter your Shopify store URL, select your country, choose products and brand tone, then get a complete 7-day holiday-aware social media calendar. 
                      You get a calendar preview instantly, and can unlock the full calendar by providing your email address.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">What e-commerce platforms does StoreCalendar support?</h3>
                    <p className="text-white/80 leading-relaxed">
                      Currently, StoreCalendar works with all Shopify stores - both myshopify.com domains and custom domains. 
                      We&apos;re expanding to WooCommerce in Month 2, followed by BigCommerce and other major platforms. 
                      Whether you sell fashion, electronics, home goods, or any other products, our AI adapts to your store&apos;s style.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">What&apos;s included in the free plan?</h3>
                    <p className="text-white/80 leading-relaxed">
                      The free plan includes 3 calendar generations per day, full 7-day strategic calendars, CSV export functionality, and access to all current features. 
                      No credit card required. Premium plan (coming soon) will offer unlimited generations, multiple stores, AI image generation, and early access to new platforms. 
                      Early premium subscribers will get $29/month lifetime rate (regular price $39/month).
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">Can I customize the caption styles?</h3>
                    <p className="text-white/80 leading-relaxed">
                      Yes! You can select which of the 7 caption styles you want to generate. Choose all 7 for maximum variety, 
                      or pick specific styles that match your marketing goals - like social proof for trust-building or call-to-action for sales.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">How do I use the generated captions?</h3>
                    <p className="text-white/80 leading-relaxed">
                      You can copy captions individually or export all of them as a CSV file for easy scheduling in your social media management tools. 
                      The CSV includes product names, caption styles, and the generated text - perfect for batch uploading to platforms like Later, Hootsuite, or Buffer.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">Are the captions optimized for specific platforms?</h3>
                    <p className="text-white/80 leading-relaxed">
                      Our captions are designed to work well across all major social media platforms - Instagram, Facebook, Twitter, TikTok, and more. 
                      They&apos;re optimized for engagement and include relevant emojis and hashtag-friendly language.
                    </p>
                  </div>
                </div>
                
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">When will other e-commerce platforms be supported?</h3>
                    <p className="text-white/80 leading-relaxed">
                      WooCommerce support is coming in Month 2, followed by BigCommerce and Magento. 
                      Early access subscribers get priority access to new platforms as they launch. 
                      Join our waitlist to be notified when your platform is ready and get 20% off the first month.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Waitlist Section */}
          <section id="waitlist" className="relative px-4 lg:px-6 py-32 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="relative max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-white">Coming to More Platforms</h2>
              <p className="text-white/70 mb-12 text-lg">
                We&apos;re expanding beyond Shopify. Join the waitlist for your platform and get early access.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">W</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">WooCommerce</h3>
                  <p className="text-white/70 text-sm mb-4">Coming Month 2</p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Join Waitlist
                  </Button>
                </div>
                
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">B</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">BigCommerce</h3>
                  <p className="text-white/70 text-sm mb-4">Coming Month 3</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    Join Waitlist
                  </Button>
                </div>
                
                <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">+</span>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Other Platforms</h3>
                  <p className="text-white/70 text-sm mb-4">Magento, Squarespace, etc.</p>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Request Platform
                  </Button>
                </div>
              </div>
              
              <div className="mt-12 bg-blue-500/20 backdrop-blur-sm rounded-2xl px-6 py-4 max-w-2xl mx-auto border border-blue-400/30">
                <p className="text-blue-300 font-semibold">🎆 Waitlist members get 20% off when their platform launches</p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative px-4 lg:px-6 py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
            <div className="relative max-w-5xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight px-4">Ready to Automate Your E-commerce Content?</h2>
              <p className="text-white/90 mb-8 sm:mb-12 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto px-4">
                Join e-commerce stores already creating better content with AI. Start with Shopify today, expand to all platforms tomorrow.
              </p>
              <div className="space-y-3 sm:space-y-4">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-white/90 px-8 sm:px-12 py-3 sm:py-6 text-lg sm:text-xl font-semibold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Free Today ✨
                </Button>
                <p className="text-white/80 text-sm sm:text-base lg:text-lg px-4">
                  3 free calendars daily • No credit card • Premium coming soon
                </p>
              </div>
            </div>
          </section>

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-8 sm:py-12 bg-slate-900 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs sm:text-sm">SC</span>
            </div>
            <span className="font-bold text-base sm:text-lg text-white">StoreCalendar</span>
          </div>
          <p className="text-white/60 text-xs sm:text-sm px-4">&copy; 2024 StoreCalendar. E-commerce content automation platform starting with Shopify.</p>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        storeName={result?.store_name}
      />
    </div>
  );
}