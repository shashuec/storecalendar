'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { GenerationResponse, CaptionStyle, ShopifyProduct, Caption } from '@/types';
import { CAPTION_STYLES, getDefaultSelectedStyles } from '@/lib/caption-styles';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<CaptionStyle[]>(getDefaultSelectedStyles());
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [showAllCaptionsForm, setShowAllCaptionsForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  const [showFullCaptions, setShowFullCaptions] = useState(false); // Show all 7 vs just 3 preview
  const [allCaptions, setAllCaptions] = useState<Caption[]>([]); // Store all generated captions

  // Auto-select first product when results come back
  useEffect(() => {
    if (result?.products && result.products.length > 0 && !selectedProduct) {
      setSelectedProduct(result.products[0]);
    }
  }, [result?.products, selectedProduct]);

  // Show email form when user changes product or clicks view all
  const handleProductChange = (productId: string) => {
    const product = result?.products?.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      // Show email form if user selects a different product than the first one
      if (result?.products && product.id !== result.products[0]?.id) {
        setShowEmailForm(true);
      }
    }
  };

  const handleViewAllStyles = () => {
    setShowAllCaptionsForm(true);
    setShowEmailForm(true);
  };

  const handleGenerate = async (withEmail = false, forceRefresh = false) => {
    if (!url.trim()) {
      setError('Please enter a Shopify store URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopify_url: url,
          ...(forceRefresh && { force_refresh: true }),
          ...(withEmail && { 
            email: email.trim(),
            selected_styles: selectedStyles
          })
        }),
      });

      const data: GenerationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate captions');
      }

      if (data.all_captions && data.all_captions.length > 0) {
        // Store all captions and show first 3 as preview
        setAllCaptions(data.all_captions);
        const previewCaptions = data.all_captions.slice(0, 3);
        console.log('Setting preview captions:', previewCaptions);
        setResult({
          ...data,
          preview_captions: previewCaptions
        });
      } else if (data.email_stored) {
        // Email was stored successfully - show all captions
        setShowFullCaptions(true);
        setShowEmailForm(false);
      } else if (data.success && (!data.all_captions || data.all_captions.length === 0)) {
        // API succeeded but no captions generated - show helpful error
        setError('Unable to generate captions at the moment. This could be due to high demand or temporary service issues. Please try again in a few minutes.');
        setResult(null);
      } else {
        setResult(data);
      }
      
      // Auto-select first product if no product is selected
      if (!selectedProduct && data.products && data.products.length > 0) {
        setSelectedProduct(data.products[0]);
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
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopify_url: url,
          email: email.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.email_stored) {
        // Email stored successfully - show all captions
        setShowFullCaptions(true);
        setShowEmailForm(false);
        setError('');
      } else {
        setError(data.error || 'Failed to store email');
      }
    } catch {
      setError('Failed to submit email');
    } finally {
      setLoading(false);
    }
  };

  const handleStyleToggle = (styleId: CaptionStyle) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(text);
      // Clear the copied state after 2 seconds
      setTimeout(() => setCopiedCaption(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const exportToCSV = () => {
    if (!result?.captions && !result?.preview_captions) return;
    
    const captions = result.captions || result.preview_captions || [];
    const csvContent = [
      ['Product', 'Caption Style', 'Caption Text'],
      ...captions.map(caption => [
        result.products?.find(p => p.id === caption.product_id)?.name || 'Product',
        caption.caption_style.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        caption.caption_text
      ])
    ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${result.store_name || 'store'}-captions.csv`;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  const resetForm = () => {
    setResult(null);
    setUrl('');
    setEmail('');
    setError('');
    setSelectedStyles(getDefaultSelectedStyles());
    setShowStyleSelection(false);
    setShowAllCaptionsForm(false);
    setShowEmailForm(false);
    setShowFullCaptions(false);
    setAllCaptions([]);
    setSelectedProduct(null);
    setCopiedCaption(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
      
      {/* Header */}
      <header className="relative px-4 lg:px-6 h-20 flex items-center border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">SC</span>
            </div>
            <span className="font-bold text-xl text-white">StoreCalendar</span>
          </div>
          <nav className="flex gap-6">
            <a href="#features" className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
              Features
            </a>
            <a href="#testimonials" className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
              Reviews
            </a>
            <a href="#pricing" className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
              Pricing
            </a>
            <a href="#faq" className="text-white/80 hover:text-white transition-all duration-300 text-sm font-medium">
              FAQ
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 lg:px-6 py-32">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-tight">
            Turn Your Shopify Products Into 
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Social Media Gold</span>
          </h1>
          <p className="text-xl text-white/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Generate 7 different caption styles for your products in seconds. No more writer&apos;s block. No more boring posts. Just premium AI-generated content that converts.
          </p>
              
              {/* Generator Form */}
              <div id="generator-form" className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 mb-16 max-w-2xl mx-auto border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-slate-700/30 rounded-3xl" />
                <div className="relative space-y-6">
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-white/90 mb-3">
                      Shopify Store URL
                    </label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="e.g., mystore.myshopify.com or myshop.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-xl h-14 px-4 focus:bg-white/20 focus:border-blue-400 transition-all duration-300"
                      disabled={loading}
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-300 text-sm bg-red-500/20 backdrop-blur-sm p-4 rounded-xl border border-red-500/30">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleGenerate(false)}
                      disabled={loading || !url.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-14 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      size="lg"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Generating...
                        </div>
                      ) : (
                        'Generate Preview Captions ✨'
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => handleGenerate(false, true)}
                      disabled={loading || !url.trim()}
                      variant="outline"
                      className="bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white hover:bg-slate-700/70 hover:border-amber-400 transition-all duration-300 h-14 px-4 rounded-xl"
                      size="lg"
                      title="Force refresh data from Shopify"
                    >
                      🔄
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {result && (
                <div className="bg-white rounded-2xl p-6 mb-12 max-w-4xl mx-auto border border-gray-200 shadow-sm">
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                      Results for {result.store_name}
                    </h3>
                  </div>

                  {/* Product and Style Selection - Always Visible */}
                  <div className="mb-6">
                    {/* Product Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product:</label>
                      <select 
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg h-10 px-3 focus:border-blue-500 focus:outline-none transition-colors"
                        value={selectedProduct?.id || ''}
                        onChange={(e) => handleProductChange(e.target.value)}
                      >
                        <option value="">Select a product...</option>
                        {result.products?.map(product => {
                          // Detect currency from price string
                          const currency = product.price.includes('₹') ? '₹' : 
                                         product.price.includes('$') ? '$' : 
                                         product.price.includes('€') ? '€' : 
                                         product.price.includes('£') ? '£' : '';
                          const cleanPrice = product.price.replace(/[₹$€£]/g, '');
                          
                          return (
                            <option key={product.id} value={product.id}>
                              {product.name} - {currency}{cleanPrice}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  
                    {/* Style Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Caption Styles:</label>
                      <div 
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg h-10 px-3 flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => setShowStyleSelection(!showStyleSelection)}
                      >
                        <span>{selectedStyles.length} caption styles selected</span>
                        <span className="text-gray-400">{showStyleSelection ? '▲' : '▼'}</span>
                      </div>
                      
                      {showStyleSelection && (
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
                          {CAPTION_STYLES.map((style) => (
                            <div key={style.id} className="space-y-1">
                              <Checkbox
                                id={style.id}
                                checked={selectedStyles.includes(style.id)}
                                onChange={() => handleStyleToggle(style.id)}
                                label={`${style.emoji} ${style.name}`}
                              />
                              <p className="text-xs text-gray-600 ml-6">{style.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Captions Display */}
                  {(() => {
                    const captionsToShow = showFullCaptions ? allCaptions : (result.preview_captions || result.captions || []);
                    console.log('Captions to show:', captionsToShow, 'showFullCaptions:', showFullCaptions, 'allCaptions:', allCaptions, 'preview_captions:', result.preview_captions);
                    return captionsToShow.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 mb-3">Generated Captions:</h4>
                        {captionsToShow.map((caption, index) => {
                      const styleInfo = CAPTION_STYLES.find(s => s.id === caption.caption_style);
                      const styleDisplay = caption.caption_style
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l: string) => l.toUpperCase());

                      return (
                        <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{styleInfo?.emoji || '✨'}</span>
                              <h5 className="font-medium text-gray-900 text-sm">{styleDisplay}</h5>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(caption.caption_text)}
                              className={`border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded px-2 py-1 text-xs ${
                                copiedCaption === caption.caption_text 
                                  ? 'bg-green-50 border-green-200 text-green-700' 
                                  : ''
                              }`}
                            >
                              {copiedCaption === caption.caption_text ? '✓' : 'Copy'}
                            </Button>
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed mb-1">
                            {caption.caption_text}
                          </p>
                          {styleInfo && (
                            <div className="text-xs text-gray-500">
                              <span className="font-medium">Best for:</span> {styleInfo.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                      </div>
                    ) : null;
                  })()}

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-center gap-3">
                    {result.captions && (
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Export to CSV
                      </Button>
                    )}
                  </div>
                  
                  {/* View All 7 Styles Button - only for preview captions */}
                  {result.preview_captions && result.preview_captions.length > 0 && !showFullCaptions && (
                    <div className="mt-4">
                      <div className="text-center">
                        <Button
                          onClick={handleViewAllStyles}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 rounded-lg transition-colors"
                        >
                          View All 7 Caption Styles
                        </Button>
                      </div>
                      
                      {/* Email Form - simple inline */}
                      {showEmailForm && (
                        <div className="mt-3 space-y-2">
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-9 px-3 text-sm"
                            disabled={loading}
                          />
                          <Button
                            onClick={handleEmailSubmit}
                            disabled={loading || !email.trim() || selectedStyles.length === 0 || !selectedProduct}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                          >
                            {loading ? 'Generating...' : `Generate All Styles`}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Demo Preview */}
              <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 max-w-4xl mx-auto border border-white/20 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl" />
                <div className="relative text-left">
                  <div className="text-sm text-white/60 mb-6 text-center">✨ Example captions for: Organic Cotton T-Shirt</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm border-l-4 border-indigo-400">
                        <div className="flex items-center gap-2 mb-2">
                          <span>✨</span>
                          <strong className="text-indigo-300">Product Showcase</strong>
                        </div>
                        <p className="text-white/90">&ldquo;New arrival alert! 🌟 Our organic cotton tee in forest green is here. Soft, sustainable, perfect for any season.&rdquo;</p>
                      </div>
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm border-l-4 border-green-400">
                        <div className="flex items-center gap-2 mb-2">
                          <span>🎯</span>
                          <strong className="text-green-300">Benefits-Focused</strong>
                        </div>
                        <p className="text-white/90">&ldquo;Why choose organic cotton? Breathable, hypoallergenic, and eco-friendly. Your skin will thank you.&rdquo;</p>
                      </div>
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm border-l-4 border-yellow-400">
                        <div className="flex items-center gap-2 mb-2">
                          <span>⭐</span>
                          <strong className="text-yellow-300">Social Proof</strong>
                        </div>
                        <p className="text-white/90">&ldquo;⭐⭐⭐⭐⭐ &lsquo;Best t-shirt I&apos;ve ever owned!&rsquo; - Sarah M. Absolutely love it!&rdquo;</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm border-l-4 border-purple-400">
                        <div className="flex items-center gap-2 mb-2">
                          <span>👕</span>
                          <strong className="text-purple-300">How-to-Style</strong>
                        </div>
                        <p className="text-white/90">&ldquo;Style tip: Pair with high-waisted jeans and sneakers for the perfect casual look.&rdquo;</p>
                      </div>
                      <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl text-sm border-l-4 border-orange-400">
                        <div className="flex items-center gap-2 mb-2">
                          <span>🔥</span>
                          <strong className="text-orange-300">Call-to-Action</strong>
                        </div>
                        <p className="text-white/90">&ldquo;Limited stock alert! Only 15 left in your size. Don&apos;t miss out on ultimate comfort.&rdquo;</p>
                      </div>
                      <div className="text-center text-white/60 text-sm p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        + 2 more caption styles<br/>
                        <span className="text-xs">(Behind-the-scenes, Problem/Solution)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="relative px-4 lg:px-6 py-20 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div className="group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">AI</div>
                  <div className="text-white/70 text-sm">Powered</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">50K+</div>
                  <div className="text-white/70 text-sm">Captions Generated</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">30 sec</div>
                  <div className="text-white/70 text-sm">Average Generation Time</div>
                </div>
                <div className="group">
                  <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">4.9/5</div>
                  <div className="text-white/70 text-sm">User Rating</div>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="relative px-4 lg:px-6 py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-900/15 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-white">What Our Users Say</h2>
              <div className="grid md:grid-cols-3 gap-8">
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
          <section id="features" className="relative px-4 lg:px-6 py-32 bg-gradient-to-r from-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-white">Why StoreCalendar?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-2xl">⚡</span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">Instant Results</h3>
                  <p className="text-white/70 leading-relaxed">Get 7 different captions in 30 seconds. No waiting, no delays. AI-powered speed meets human creativity.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-2xl">🎯</span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">Shopify-Specific</h3>
                  <p className="text-white/70 leading-relaxed">Built for Shopify stores. Uses your actual products and brand voice to create authentic, converting content.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-white text-2xl">📈</span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 text-white">7 Caption Styles</h3>
                  <p className="text-white/70 leading-relaxed">Product showcase, benefits, social proof, how-to, and more. Every style optimized for engagement.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="relative px-4 lg:px-6 py-32 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
            <div className="relative max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-white">How It Works</h2>
              <div className="space-y-12">
                <div className="flex items-center gap-8 group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">1</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-2 text-white">Paste Your Shopify URL</h3>
                    <p className="text-white/70 text-lg leading-relaxed">Enter your store URL (e.g., mystore.myshopify.com) and we&apos;ll automatically extract your products</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">2</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-2 text-white">See Preview Captions</h3>
                    <p className="text-white/70 text-lg leading-relaxed">Get 3 high-quality sample captions instantly to see the AI magic in action</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 group">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110">3</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl mb-2 text-white">Get All 7 Caption Styles</h3>
                    <p className="text-white/70 text-lg leading-relaxed">Access all caption styles and export them as CSV for easy scheduling across platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Caption Styles Showcase */}
          <section className="relative px-4 lg:px-6 py-32 bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
            <div className="relative max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-6 text-white">7 Powerful Caption Styles</h2>
              <p className="text-center text-white/70 mb-16 text-lg max-w-3xl mx-auto">
                Each style is designed to achieve different marketing goals. Use them strategically to maximize engagement and conversions.
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
          <section id="pricing" className="relative px-4 lg:px-6 py-32 bg-gradient-to-r from-slate-800 to-slate-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent" />
            <div className="relative max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-white">Simple, Transparent Pricing</h2>
              <p className="text-white/70 mb-12 text-lg">
                No subscriptions, no hidden fees. Pay only for what you use.
              </p>
              
              <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl" />
                <div className="relative">
                  <div className="text-6xl font-bold text-white mb-2">FREE</div>
                  <div className="text-white/70 mb-6">Get started today</div>
                  <ul className="space-y-3 text-left text-white/80">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      3 preview captions per store
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      All 7 caption styles with email
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      CSV export for easy scheduling
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      10 generations per day
                    </li>
                  </ul>
                  <div className="mt-8">
                    <Button 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12 rounded-xl"
                      onClick={() => document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      Start Free Now ✨
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 text-center">
                <p className="text-white/60 text-sm">
                  Need more? <a href="mailto:connect@conversailabs.com" className="text-blue-400 hover:text-blue-300">Contact us</a> for custom plans.
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
                      Simply paste your Shopify store URL, and our AI analyzes your products to generate 7 different caption styles. 
                      You get 3 preview captions instantly, and can unlock all 7 styles by providing your email address.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-blue-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">What types of Shopify stores does it work with?</h3>
                    <p className="text-white/80 leading-relaxed">
                      StoreCalendar works with all Shopify stores - both myshopify.com domains and custom domains. 
                      Whether you sell fashion, electronics, home goods, or any other products, our AI adapts to your store&apos;s style.
                    </p>
                  </div>
                </div>

                <div className="relative bg-white/10 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl" />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-white mb-4">Is there a limit to how many captions I can generate?</h3>
                    <p className="text-white/80 leading-relaxed">
                      You can generate up to 10 caption sets per day for free. Each set includes captions for up to 3 products from your store. 
                      Need more? Contact us for custom plans tailored to your needs.
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
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="relative px-4 lg:px-6 py-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
            <div className="relative max-w-5xl mx-auto text-center">
              <h2 className="text-5xl font-bold mb-6 leading-tight">Ready to Transform Your Social Media?</h2>
              <p className="text-white/90 mb-12 text-xl leading-relaxed max-w-3xl mx-auto">
                Join hundreds of Shopify stores already creating better content. Start generating premium captions in seconds.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-white/90 px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                onClick={() => document.getElementById('generator-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Start Generating Captions ✨
              </Button>
            </div>
          </section>

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-12 bg-slate-900 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-bold text-lg text-white">StoreCalendar</span>
          </div>
          <p className="text-white/60">&copy; 2024 StoreCalendar. Turn your Shopify products into social media gold.</p>
        </div>
      </footer>
    </div>
  );
}