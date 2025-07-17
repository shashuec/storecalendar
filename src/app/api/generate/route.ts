import { NextRequest, NextResponse } from 'next/server';
import { scrapeShopifyStore, validateShopifyUrlFormat } from '@/lib/shopify';
import { generatePreviewCaptions, generateCaptions } from '@/lib/openai';
import { checkRateLimit, checkGlobalRateLimit, getClientIP } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';
import { GenerationResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopify_url, email, selected_styles, force_refresh } = body;
    
    // Validate input
    if (!shopify_url || typeof shopify_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Shopify URL is required' },
        { status: 400 }
      );
    }
    
    if (!validateShopifyUrlFormat(shopify_url)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid URL (e.g., shop.myshopify.com or yourcustomdomain.com)' 
        },
        { status: 400 }
      );
    }
    
    // Check rate limits
    const clientIP = getClientIP(request);
    const [ipRateLimit, globalRateLimit] = await Promise.all([
      checkRateLimit(clientIP),
      checkGlobalRateLimit()
    ]);
    
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Try again in ${Math.ceil((ipRateLimit.resetTime!.getTime() - Date.now()) / 60000)} minutes.`,
          resetTime: ipRateLimit.resetTime
        },
        { status: 429 }
      );
    }
    
    if (!globalRateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service temporarily busy. Please try again later.',
          resetTime: globalRateLimit.resetTime
        },
        { status: 429 }
      );
    }
    
    // Check if we have cached data (within 6 hours)
    const cleanUrl = shopify_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    // Try to get existing store data
    const { data: existingStore } = await supabase
      .from('calendar_stores')
      .select('*')
      .eq('shopify_url', cleanUrl)
      .single();
    
    let storeName, products, storeData;
    
    // Check if we need to scrape fresh data
    const needsFreshData = force_refresh || 
      !existingStore || 
      !existingStore.last_scraped || 
      existingStore.last_scraped < sixHoursAgo;
    
    if (needsFreshData) {
      console.log(force_refresh ? 'Force refresh requested' : 'Cache miss or expired - scraping fresh data');
      
      // Scrape fresh data from Shopify
      const scrapedData = await scrapeShopifyStore(shopify_url);
      storeName = scrapedData.storeName;
      products = scrapedData.products;
      
      if (products.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No products found. Please check if store has published products.' },
          { status: 400 }
        );
      }
      
      // Store/update store data with fresh timestamp
      const { data: freshStoreData, error: storeError } = await supabase
        .from('calendar_stores')
        .upsert({
          shopify_url: cleanUrl,
          store_name: storeName,
          last_scraped: new Date().toISOString()
        }, {
          onConflict: 'shopify_url'
        })
        .select()
        .single();
      
      if (storeError) {
        console.error('Store upsert error:', storeError);
        return NextResponse.json(
          { success: false, error: 'Failed to process store data' },
          { status: 500 }
        );
      }
      
      storeData = freshStoreData;
      
    } else {
      console.log('Cache hit - using existing data');
      
      // Use cached store data
      storeData = existingStore;
      storeName = existingStore.store_name;
      
      // Get cached products
      const { data: cachedProducts, error: productsError } = await supabase
        .from('calendar_products')
        .select('*')
        .eq('store_id', existingStore.id)
        .order('created_at', { ascending: false });
      
      if (productsError || !cachedProducts || cachedProducts.length === 0) {
        console.log('No cached products found - falling back to scraping');
        
        // Fallback to scraping if no cached products
        const scrapedData = await scrapeShopifyStore(shopify_url);
        storeName = scrapedData.storeName;
        products = scrapedData.products;
        
        if (products.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No products found. Please check if store has published products.' },
            { status: 400 }
          );
        }
      } else {
        // Transform cached products to match expected format
        products = cachedProducts.map(p => ({
          id: p.shopify_product_id,
          name: p.product_name,
          description: p.description || '',
          price: p.price || '0',
          image_url: p.image_url || ''
        }));
      }
    }
    
    // Store products only if we scraped fresh data
    let productData;
    if (needsFreshData) {
      const productsToInsert = products.map(product => ({
        store_id: storeData.id,
        product_name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        shopify_product_id: product.id
      }));
      
      const { data: freshProductData, error: productError } = await supabase
        .from('calendar_products')
        .upsert(productsToInsert, {
          onConflict: 'store_id,shopify_product_id'
        })
        .select();
      
      if (productError) {
        console.error('Product upsert error:', productError);
        // Continue anyway - we can still generate captions
      }
      
      productData = freshProductData;
    } else {
      // Get existing product data for database operations
      const { data: existingProductData } = await supabase
        .from('calendar_products')
        .select('*')
        .eq('store_id', storeData.id);
      
      productData = existingProductData;
    }
    
    // Generate captions based on email presence and selected styles
    let captionResults;
    let requiresEmail = false;
    
    if (!email) {
      // No email - show preview (first 3 captions)
      captionResults = await generatePreviewCaptions(products, storeName, storeData.id);
      requiresEmail = true;
    } else {
      // Email provided - generate selected styles or all 7
      const stylesToGenerate = selected_styles && selected_styles.length > 0 
        ? selected_styles 
        : undefined; // undefined = all styles
      
      captionResults = await generateCaptions(products, storeName, stylesToGenerate, storeData.id);
      
      // Store email
      await supabase
        .from('calendar_emails')
        .upsert({
          email,
          store_id: storeData.id
        }, {
          onConflict: 'email,store_id'
        });
    }
    
    // Store generated captions
    if (productData && captionResults.length > 0) {
      const captionsToInsert = [];
      
      for (const result of captionResults) {
        const dbProduct = productData.find(p => p.shopify_product_id === result.product.id);
        if (dbProduct) {
          for (const caption of result.captions) {
            captionsToInsert.push({
              product_id: dbProduct.id,
              caption_text: caption.text,
              caption_style: caption.style
            });
          }
        }
      }
      
      if (captionsToInsert.length > 0) {
        await supabase
          .from('calendar_captions')
          .insert(captionsToInsert);
      }
    }
    
    const response: GenerationResponse = {
      success: true,
      store_name: storeName,
      products,
      [requiresEmail ? 'preview_captions' : 'captions']: captionResults.flatMap(result => 
        result.captions.map(caption => ({
          id: '', // Will be filled from DB if needed
          product_id: result.product.id,
          caption_text: caption.text,
          caption_style: caption.style,
          created_at: new Date().toISOString()
        }))
      ),
      requires_email: requiresEmail
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}