'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { GenerationResponse, Caption, CaptionStyle } from '@/types';
import { CAPTION_STYLES, getDefaultSelectedStyles } from '@/lib/caption-styles';

export default function GeneratePage() {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<CaptionStyle[]>(getDefaultSelectedStyles());
  const [showStyleSelection, setShowStyleSelection] = useState(false);

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
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.store_name || 'store'}-captions.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between w-full max-w-6xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="font-semibold text-lg">StoreCalendar</span>
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Generate Social Media Captions
          </h1>
          <p className="text-lg text-gray-600">
            Enter your Shopify store URL to get started
          </p>
        </div>

        {/* URL Input Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Store URL
              </label>
              <Input
                id="url"
                type="url"
                placeholder="e.g., mystore.myshopify.com"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Results for {result.store_name}
              </h2>
              <p className="text-gray-600">
                {result.requires_email 
                  ? 'Here are 3 preview captions. Enter your email to see all 7 styles:'
                  : 'Here are all 7 caption styles for your products:'
                }
              </p>
            </div>

            {/* Email Collection (if needed) */}
            {result.requires_email && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Get All Caption Styles + CSV Export</h3>
                
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
                            "{style.example}"
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
                        <h4 className="font-semibold text-gray-900">{product?.name}</h4>
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

            {/* Try Another Store */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => {
                  setResult(null);
                  setUrl('');
                  setEmail('');
                  setError('');
                  setSelectedStyles(getDefaultSelectedStyles());
                  setShowStyleSelection(false);
                }}
                variant="ghost"
              >
                Try Another Store
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}