import { NextRequest, NextResponse } from 'next/server';
import { scrapeShopifyStore, validateShopifyUrl } from '@/lib/shopify';
import { generatePreviewCaptions, generateCaptions } from '@/lib/openai';
import { checkRateLimit, checkGlobalRateLimit, getClientIP } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';
import { GenerationResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopify_url, email, selected_styles } = body;
    
    // Validate input
    if (!shopify_url || typeof shopify_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Shopify URL is required' },
        { status: 400 }
      );
    }
    
    if (!validateShopifyUrl(shopify_url)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Please enter a valid Shopify store URL (e.g., shop.myshopify.com)' 
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
    
    // Scrape Shopify store
    const { storeName, products } = await scrapeShopifyStore(shopify_url);
    
    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products found. Please check if store has published products.' },
        { status: 400 }
      );
    }
    
    // Store/update store data
    const { data: storeData, error: storeError } = await supabase
      .from('calendar_stores')
      .upsert({
        shopify_url: shopify_url.replace(/^https?:\/\//, '').replace(/\/$/, ''),
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
    
    // Store products
    const productsToInsert = products.map(product => ({
      store_id: storeData.id,
      product_name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      shopify_product_id: product.id
    }));
    
    const { data: productData, error: productError } = await supabase
      .from('calendar_products')
      .upsert(productsToInsert, {
        onConflict: 'store_id,shopify_product_id'
      })
      .select();
    
    if (productError) {
      console.error('Product upsert error:', productError);
      // Continue anyway - we can still generate captions
    }
    
    // Generate captions based on email presence and selected styles
    let captionResults;
    let requiresEmail = false;
    
    if (!email) {
      // No email - show preview (first 3 captions)
      captionResults = await generatePreviewCaptions(products, storeName);
      requiresEmail = true;
    } else {
      // Email provided - generate selected styles or all 7
      const stylesToGenerate = selected_styles && selected_styles.length > 0 
        ? selected_styles 
        : undefined; // undefined = all styles
      
      captionResults = await generateCaptions(products, storeName, stylesToGenerate);
      
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