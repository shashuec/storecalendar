'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { GenerationResponse, CaptionStyle } from '@/types';
import { CAPTION_STYLES, getDefaultSelectedStyles } from '@/lib/caption-styles';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<CaptionStyle[]>(getDefaultSelectedStyles());
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const handleGenerate = async (withEmail = false) => {
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
    setShowGenerator(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-semibold text-lg">StoreCalendar</span>
          </div>
          <nav className="flex gap-4">
            {showGenerator ? (
              <Button 
                variant="ghost" 
                onClick={resetForm}
                className="text-sm font-medium hover:text-indigo-600"
              >
                ← Back to Home
              </Button>
            ) : (
              <>
                <a href="#features" className="text-sm font-medium hover:text-indigo-600 transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-indigo-600 transition-colors">
                  How it Works
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {!showGenerator ? (
        <>
          {/* Hero Section */}
          <section className="px-4 lg:px-6 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6">
                Turn Your Shopify Products Into 
                <span className="text-indigo-600"> Social Media Gold</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Paste your Shopify store URL and get 7 different caption styles for your products. 
                No more writer&apos;s block. No more boring posts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  size="lg" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg"
                  onClick={() => setShowGenerator(true)}
                >
                  Try Free Now →
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Watch Demo
                </Button>
              </div>

              {/* Demo Preview */}
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-3xl mx-auto">
                <div className="text-left">
                  <div className="text-sm text-gray-500 mb-4">Example captions for: Organic Cotton T-Shirt</div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded text-sm border-l-4 border-indigo-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span>✨</span>
                          <strong className="text-indigo-600">Product Showcase</strong>
                        </div>
                        &ldquo;New arrival alert! 🌟 Our organic cotton tee in forest green is here. Soft, sustainable, perfect for any season.&rdquo;
                      </div>
                      <div className="p-3 bg-gray-50 rounded text-sm border-l-4 border-green-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span>🎯</span>
                          <strong className="text-green-600">Benefits-Focused</strong>
                        </div>
                        &ldquo;Why choose organic cotton? Breathable, hypoallergenic, and eco-friendly. Your skin will thank you.&rdquo;
                      </div>
                      <div className="p-3 bg-gray-50 rounded text-sm border-l-4 border-yellow-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span>⭐</span>
                          <strong className="text-yellow-600">Social Proof</strong>
                        </div>
                        &ldquo;⭐⭐⭐⭐⭐ &lsquo;Best t-shirt I&apos;ve ever owned!&rsquo; - Sarah M. Join 1000+ happy customers.&rdquo;
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded text-sm border-l-4 border-purple-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span>👕</span>
                          <strong className="text-purple-600">How-to-Style</strong>
                        </div>
                        &ldquo;Style tip: Pair with high-waisted jeans and sneakers for the perfect casual look.&rdquo;
                      </div>
                      <div className="p-3 bg-gray-50 rounded text-sm border-l-4 border-orange-400">
                        <div className="flex items-center gap-2 mb-1">
                          <span>🔥</span>
                          <strong className="text-orange-600">Call-to-Action</strong>
                        </div>
                        &ldquo;Limited stock alert! Only 15 left in your size. Don&apos;t miss out on ultimate comfort.&rdquo;
                      </div>
                      <div className="text-center text-gray-400 text-sm p-3">
                        + 2 more caption styles<br/>
                        <span className="text-xs">(Behind-the-scenes, Problem/Solution)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="px-4 lg:px-6 py-20 bg-white">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Why StoreCalendar?</h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-indigo-600 text-xl">⚡</span>
                  </div>
                  <h3 className="font-semibold mb-2">Instant Results</h3>
                  <p className="text-gray-600">Get 7 different captions in 30 seconds. No waiting, no delays.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-indigo-600 text-xl">🎯</span>
                  </div>
                  <h3 className="font-semibold mb-2">Shopify-Specific</h3>
                  <p className="text-gray-600">Built for Shopify stores. Uses your actual products and brand voice.</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-indigo-600 text-xl">📈</span>
                  </div>
                  <h3 className="font-semibold mb-2">7 Caption Styles</h3>
                  <p className="text-gray-600">Product showcase, benefits, social proof, how-to, and more.</p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="px-4 lg:px-6 py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <div>
                    <h3 className="font-semibold">Paste Your Shopify URL</h3>
                    <p className="text-gray-600">Enter your store URL (e.g., mystore.myshopify.com)</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <div>
                    <h3 className="font-semibold">See Preview Captions</h3>
                    <p className="text-gray-600">Get 3 sample captions instantly to see the quality</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                  <div>
                    <h3 className="font-semibold">Enter Email for All 7</h3>
                    <p className="text-gray-600">Provide your email to unlock all 7 caption styles + export</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 lg:px-6 py-20 bg-indigo-600 text-white">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Social Media?</h2>
              <p className="text-indigo-100 mb-8 text-lg">
                Join hundreds of Shopify stores already creating better content.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 text-lg"
                onClick={() => setShowGenerator(true)}
              >
                Start Generating Captions →
              </Button>
            </div>
          </section>
        </>
      ) : (
        /* Generator Section */
        <section className="px-4 lg:px-6 py-20 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Generate Social Media Captions
              </h2>
              <p className="text-lg text-gray-600">
                Enter your Shopify store URL to get started
              </p>
            </div>

            {/* URL Input Form */}
            <div className="bg-gray-50 rounded-lg shadow-lg p-8 mb-8">
              <div className="space-y-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Shopify Store URL
                  </label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="e.g., mystore.myshopify.com or thedrugstorecompany.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full"
                    disabled={loading}
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={loading || !url.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {loading ? 'Generating...' : 'Generate Preview Captions'}
                </Button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Results for {result.store_name}
                  </h3>
                  <p className="text-gray-600">
                    {result.requires_email 
                      ? 'Here are 3 preview captions. Enter your email to see all 7 styles:'
                      : 'Here are all caption styles for your products:'
                    }
                  </p>
                </div>

                {/* Email Collection (if needed) */}
                {result.requires_email && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold mb-3">Get All Caption Styles + CSV Export</h4>
                    
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

                    <div className="flex gap-3">
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                        disabled={loading}
                      />
                      <Button
                        onClick={handleEmailSubmit}
                        disabled={loading || !email.trim() || selectedStyles.length === 0}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loading ? 'Generating...' : `Generate ${selectedStyles.length} Styles`}
                      </Button>
                    </div>
                    
                    {selectedStyles.length === 0 && (
                      <p className="text-red-600 text-sm mt-2">Please select at least one caption style</p>
                    )}
                  </div>
                )}

                {/* Captions Display */}
                <div className="space-y-6">
                  {(result.preview_captions || result.captions || []).map((caption, index) => {
                    const product = result.products?.find(p => p.id === caption.product_id);
                    const styleDisplay = caption.caption_style
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, l => l.toUpperCase());

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-semibold text-gray-900">{product?.name}</h5>
                            <span className="text-sm text-indigo-600 font-medium">{styleDisplay}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(caption.caption_text)}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-indigo-400">
                          {caption.caption_text}
                        </p>
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
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-8 bg-white border-t">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 StoreCalendar. Turn your Shopify products into social media gold.</p>
        </div>
      </footer>
    </div>
  );
}