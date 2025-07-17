'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { GenerationResponse, CaptionStyle, ShopifyProduct } from '@/types';
import { CAPTION_STYLES, getDefaultSelectedStyles } from '@/lib/caption-styles';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<CaptionStyle[]>(getDefaultSelectedStyles());
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);

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

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    handleGenerate(true);
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
                <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 mb-16 max-w-5xl mx-auto border border-white/20 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-3xl" />
                  <div className="relative mb-8">
                    <h3 className="text-3xl font-bold text-white mb-3">
                      ✨ Results for {result.store_name}
                    </h3>
                    <p className="text-white/80 text-lg">
                      {result.requires_email 
                        ? 'Here are 3 preview captions. Enter your email to unlock all 7 styles:'
                        : 'Here are all caption styles for your products:'
                      }
                    </p>
                  </div>

                  {/* Email Collection (if needed) */}
                  {result.requires_email && (
                    <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-600/30">
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-700/20 to-slate-600/20 rounded-2xl" />
                      <div className="relative">
                        <h4 className="font-semibold mb-6 text-white text-lg">📧 Get All Caption Styles + CSV Export</h4>
                        
                        {/* Product Selection */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-white/90 mb-3">Choose Product to Generate For:</label>
                          <select 
                            className="w-full bg-slate-700/50 backdrop-blur-sm border border-slate-600/50 text-white rounded-xl h-12 px-4 focus:bg-slate-700/70 focus:border-blue-400 transition-all duration-300"
                            onChange={(e) => {
                              const productId = e.target.value;
                              const product = result.products?.find(p => p.id === productId);
                              if (product) {
                                setSelectedProduct(product);
                              }
                            }}
                          >
                            <option value="">Select a product...</option>
                            {result.products?.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} - ${product.price}
                              </option>
                            ))}
                          </select>
                        </div>
                      
                      {/* Style Selection */}
                      <div className="mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStyleSelection(!showStyleSelection)}
                          className="mb-3"
                        >
                          {showStyleSelection ? 'Hide' : 'Customize'} Caption Styles ({selectedStyles.length} selected)
                        </Button>
                        
                        {showStyleSelection && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border">
                            {CAPTION_STYLES.map((style) => (
                              <div key={style.id} className="space-y-2">
                                <Checkbox
                                  id={style.id}
                                  checked={selectedStyles.includes(style.id)}
                                  onChange={() => handleStyleToggle(style.id)}
                                  label={`${style.emoji} ${style.name}`}
                                />
                                <p className="text-xs text-gray-600 ml-6">{style.description}</p>
                                <div className="text-xs text-gray-500 ml-6 p-2 bg-gray-50 rounded italic">
                                  &ldquo;{style.example}&rdquo;
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/90 mb-3">Email Address:</label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-700/50 backdrop-blur-sm border-slate-600/50 text-white placeholder:text-white/50 rounded-xl h-12 px-4 focus:bg-slate-700/70 focus:border-blue-400 transition-all duration-300"
                            disabled={loading}
                          />
                        </div>
                        
                        <Button
                          onClick={handleEmailSubmit}
                          disabled={loading || !email.trim() || selectedStyles.length === 0 || !selectedProduct}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          {loading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating...
                            </div>
                          ) : (
                            `Generate ${selectedStyles.length} Styles for ${selectedProduct?.name || 'Selected Product'} ✨`
                          )}
                        </Button>
                      </div>
                      
                      {selectedStyles.length === 0 && (
                        <p className="text-red-300 text-sm mt-2">Please select at least one caption style</p>
                      )}
                      {!selectedProduct && (
                        <p className="text-amber-300 text-sm mt-2">Please select a product to generate captions for</p>
                      )}
                      </div>
                    </div>
                  )}

                  {/* Captions Display */}
                  <div className="space-y-4">
                    {(result.preview_captions || result.captions || []).map((caption, index) => {
                      const product = result.products?.find(p => p.id === caption.product_id);
                      const styleInfo = CAPTION_STYLES.find(s => s.id === caption.caption_style);
                      const styleDisplay = caption.caption_style
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());

                      return (
                        <div key={index} className="relative bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-600/30 overflow-hidden hover:bg-slate-800/60 transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/10 to-slate-600/10 rounded-2xl" />
                          <div className="relative">
                            {/* Header with style and product info */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-600/30">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                                  <span className="text-white text-lg">{styleInfo?.emoji || '✨'}</span>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-white text-lg">{styleDisplay}</h5>
                                  <p className="text-white/60 text-sm">for {product?.name}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(caption.caption_text)}
                                className={`backdrop-blur-sm border-slate-600/50 text-white hover:border-emerald-400 transition-all duration-300 rounded-xl px-4 py-2 ${
                                  copiedCaption === caption.caption_text 
                                    ? 'bg-emerald-600/70 border-emerald-500' 
                                    : 'bg-slate-700/50 hover:bg-slate-700/70'
                                }`}
                              >
                                {copiedCaption === caption.caption_text ? '✅ Copied!' : '📋 Copy'}
                              </Button>
                            </div>
                            
                            {/* Caption content */}
                            <div className="p-4">
                              <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl p-4 border-l-4 border-emerald-400">
                                <p className="text-white/90 leading-relaxed text-base">
                                  {caption.caption_text}
                                </p>
                              </div>
                              
                              {/* Style description */}
                              {styleInfo && (
                                <div className="mt-3 text-xs text-white/50">
                                  <span className="font-medium">Best for:</span> {styleInfo.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export Button */}
                  {result.captions && (
                    <div className="mt-8 text-center">
                      <Button
                        onClick={exportToCSV}
                        variant="outline"
                        size="lg"
                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                      >
                        Export to CSV
                      </Button>
                    </div>
                  )}

                  {/* Reset Button */}
                  <div className="mt-8 text-center">
                    <Button
                      onClick={resetForm}
                      variant="ghost"
                    >
                      Try Another Store
                    </Button>
                  </div>
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
                        <p className="text-white/90">&ldquo;⭐⭐⭐⭐⭐ &lsquo;Best t-shirt I&apos;ve ever owned!&rsquo; - Sarah M. Join 1000+ happy customers.&rdquo;</p>
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
                  <div className="text-4xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">1000+</div>
                  <div className="text-white/70 text-sm">Shopify Stores</div>
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
                    <p className="text-white/80 text-sm italic mb-3">&ldquo;⭐⭐⭐⭐⭐ &lsquo;Best t-shirt I&apos;ve ever owned!&rsquo; - Sarah M. Join 1000+ happy customers.&rdquo;</p>
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