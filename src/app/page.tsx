'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
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
            <Link href="#features" className="text-sm font-medium hover:text-indigo-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-indigo-600 transition-colors">
              How it Works
            </Link>
          </nav>
        </div>
      </header>

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
            <Link href="/generate">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg">
                Try Free Now →
              </Button>
            </Link>
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
          <Link href="/generate">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-4 text-lg">
              Start Generating Captions →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 lg:px-6 py-8 bg-white border-t">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 StoreCalendar. Turn your Shopify products into social media gold.</p>
        </div>
      </footer>
    </div>
  );
}
