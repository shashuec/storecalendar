import { NextRequest, NextResponse } from 'next/server';
import { scrapeShopifyStore, validateShopifyUrlFormat } from '@/lib/shopify';
import { generateAllCaptions } from '@/lib/openai';
// TEMPORARILY DISABLED - Rate limiting imports
// import { checkRateLimit, checkGlobalRateLimit, getClientIP } from '@/lib/rate-limit';
import { supabase } from '@/lib/supabase';
import { GenerationResponse, CountryCode, BrandTone, ShopifyProductEnhanced, CalendarPost } from '@/types';
import { isValidCountryCode } from '@/lib/country-detection';
import { isValidBrandTone } from '@/lib/brand-tones';
import { generateWeeklyCalendar } from '@/lib/calendar-generation';
import { getUpcomingHolidays } from '@/lib/holidays';
import { getAuthenticatedUser, createAuthError } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      shopify_url, 
      email, 
      force_refresh,
      // V1 additions
      country,
      selected_products,
      brand_tone,
      week_number
    } = body;

    // Check authentication for all requests (including product fetching)
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        createAuthError('Please sign in to continue'),
        { status: 401 }
      );
    }
    
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

    // Validate V1 parameters
    if (country && !isValidCountryCode(country)) {
      return NextResponse.json(
        { success: false, error: 'Invalid country code. Must be US, UK, or IN' },
        { status: 400 }
      );
    }

    if (brand_tone && !isValidBrandTone(brand_tone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid brand tone. Must be professional, casual, playful, or luxury' },
        { status: 400 }
      );
    }

    if (selected_products && (!Array.isArray(selected_products) || selected_products.length < 1 || selected_products.length > 10)) {
      return NextResponse.json(
        { success: false, error: 'Selected products must be an array of 1-10 product IDs' },
        { status: 400 }
      );
    }

    if (week_number && (week_number !== 1 && week_number !== 2)) {
      return NextResponse.json(
        { success: false, error: 'Week number must be 1 or 2' },
        { status: 400 }
      );
    }
    
    // TEMPORARILY DISABLED - Rate limits
    // To re-enable: uncomment the code below
    /*
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
    */
    
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
      // Force refresh or cache miss
      
      // Scrape fresh data from Shopify (fetch up to 50 products for V1)
      const scrapedData = await scrapeShopifyStore(shopify_url, 50);
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
      // Using cached data
      
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
        const scrapedData = await scrapeShopifyStore(shopify_url, 50);
        storeName = scrapedData.storeName;
        products = scrapedData.products;
        
        if (products.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No products found. Please check if store has published products.' },
            { status: 400 }
          );
        }
      } else {
        // Transform cached products to match expected format with enhanced fields
        products = cachedProducts.map((p, index) => ({
          id: p.shopify_product_id,
          name: p.product_name,
          description: p.description || '',
          price: p.price || '0',
          image_url: p.image_url || '',
          // Enhanced fields for V1 (use stored data if available)
          selected: false,
          rank: index + 1,
          product_type: p.product_type || 'General',
          vendor: p.vendor || '',
          tags: p.tags || []
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
        shopify_product_id: product.id,
        // V1 enhanced fields
        product_type: product.product_type || 'General',
        vendor: product.vendor || '',
        tags: product.tags || [],
        handle: (product as ShopifyProductEnhanced).handle || ''
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
      
      // Add url field to existing products for compatibility
      if (existingProductData) {
        const shopifyDomain = storeData.shopify_url.replace(/^https?:\/\//, '').split('/')[0];
        products = existingProductData.map(dbProduct => ({
          id: dbProduct.shopify_product_id,
          name: dbProduct.product_name,
          description: dbProduct.description || '',
          price: dbProduct.price || '0',
          image_url: dbProduct.image_url || '',
          url: dbProduct.handle ? `https://${shopifyDomain}/products/${dbProduct.handle}` : `https://${shopifyDomain}/products/${dbProduct.shopify_product_id}`,
          selected: false,
          rank: dbProduct.ranking_score || 0,
          product_type: dbProduct.product_type || 'General',
          vendor: dbProduct.vendor || '',
          tags: dbProduct.tags || []
        })) as ShopifyProductEnhanced[];
      }
    }
    
    // NEW FLOW: Determine what step we're at based on parameters
    const isProductScraping = !selected_products || selected_products.length === 0;
    const isCalendarGeneration = selected_products && selected_products.length > 0 && (country || brand_tone || week_number);

    if (isProductScraping) {
      // STEP 1: Just scrape and return products - NO AI GENERATION
      console.log('Step 1: Product scraping only - no AI calls');
      
      return NextResponse.json({
        success: true,
        store_name: storeName,
        enhanced_products: products as ShopifyProductEnhanced[], // Return all products for selection
        step: 'products',
        message: 'Products loaded successfully'
      });
      
    } else if (isCalendarGeneration) {
      // STEP 3: Generate captions and calendar for SELECTED products only
      console.log('Step 3: Generating captions and calendar for selected products');
      
      // Apply product selection - filter to selected products only
      const finalProducts: ShopifyProductEnhanced[] = (products as ShopifyProductEnhanced[])
        .filter(p => selected_products.includes(p.id));
      
      if (finalProducts.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid products found for selected IDs' },
          { status: 400 }
        );
      }

      // Generate captions for SELECTED products only
      let captionResults;
      
      // Check if we have cached captions first
      const { data: cachedCaptions } = await supabase
        .from('calendar_captions')
        .select('*')
        .in('product_id', productData?.map(p => p.id) || [])
        .gte('created_at', sixHoursAgo);
      
      if (cachedCaptions && cachedCaptions.length > 0 && !force_refresh) {
        // Transform cached captions to match expected format
        console.log('Using cached captions - no AI call needed');
        const captionsByProduct = new Map();
        
        cachedCaptions.forEach(caption => {
          const dbProduct = productData?.find(p => p.id === caption.product_id);
          const product = finalProducts.find(p => p.id === dbProduct?.shopify_product_id);
          
          if (product) {
            if (!captionsByProduct.has(product.id)) {
              captionsByProduct.set(product.id, { product, captions: [] });
            }
            captionsByProduct.get(product.id).captions.push({
              style: caption.caption_style,
              text: caption.caption_text
            });
          }
        });
        
        captionResults = Array.from(captionsByProduct.values());
      } else {
        // No cached captions - generate new ones for selected products
        console.log('Generating captions for selected products');
        const countryParam: CountryCode = country || 'US';
        const toneParam: BrandTone = brand_tone || 'casual';
        
        captionResults = await generateAllCaptions(
          finalProducts, 
          storeName, 
          storeData.id, 
          toneParam, 
          countryParam
        );
        
        // Check if caption generation failed
        if (!captionResults || captionResults.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Failed to generate captions. Please try again or contact support if the issue persists.' },
            { status: 500 }
          );
        }
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

      // Generate weekly calendar for selected products
      const countryParam: CountryCode = country || 'US';
      const toneParam: BrandTone = brand_tone || 'casual';
      const weekParam: 1 | 2 = week_number || 1;

      // Check if we have a cached calendar with the same parameters
      const selectedProductIds = finalProducts.map(p => p.id).sort();
      const { data: existingCalendar } = await supabase
        .from('calendar_weekly_calendars')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('week_number', weekParam)
        .eq('country_code', countryParam)
        .eq('brand_tone', toneParam)
        .gte('created_at', sixHoursAgo)
        .single();

      let weeklyCalendar;
      
      if (existingCalendar && !force_refresh) {
        // Check if selected products match
        const cachedProductIds = (existingCalendar.selected_products as string[]).sort();
        const productsMatch = JSON.stringify(selectedProductIds) === JSON.stringify(cachedProductIds);
        
        if (productsMatch) {
          console.log('Calendar cache hit - using existing calendar');
          weeklyCalendar = existingCalendar.calendar_data;
        } else {
          console.log('Calendar cache miss - product selection changed');
          weeklyCalendar = await generateWeeklyCalendar(
            finalProducts,
            storeName,
            countryParam,
            toneParam,
            weekParam,
            storeData.id,
            captionResults // Pass existing captions to avoid duplicate AI calls
          );
        }
      } else {
        console.log('Calendar cache miss - generating new calendar');
        weeklyCalendar = await generateWeeklyCalendar(
          finalProducts,
          storeName,
          countryParam,
          toneParam,
          weekParam,
          storeData.id,
          captionResults // Pass existing captions to avoid duplicate AI calls
        );
      }

      // Store the weekly calendar in database for V1 (only if newly generated)
      if (weeklyCalendar && !existingCalendar) {
        try {
          const { data: calendarData, error: calendarError } = await supabase
            .from('calendar_weekly_calendars')
            .insert({
              store_id: storeData.id,
              week_number: weekParam,
              start_date: weeklyCalendar.start_date,
              end_date: weeklyCalendar.end_date,
              country_code: countryParam,
              brand_tone: toneParam,
              selected_products: finalProducts.map(p => p.id),
              calendar_data: weeklyCalendar
            })
            .select()
            .single();

          if (calendarError) {
            console.error('Calendar storage error:', calendarError);
            // Continue anyway - don't fail the request
          } else if (calendarData) {
            // Store individual posts for easier querying
            const postsToInsert = weeklyCalendar.posts.map((post: CalendarPost) => ({
              calendar_id: calendarData.id,
              store_id: storeData.id,
              product_id: productData?.find(p => p.shopify_product_id === post.product_featured.id)?.id,
              day_name: post.day,
              post_date: post.date,
              post_type: post.post_type,
              caption_text: post.caption_text,
              holiday_context: post.holiday_context || null
            }));

            await supabase
              .from('calendar_posts')
              .insert(postsToInsert);
          }
        } catch (error) {
          console.error('Calendar persistence error:', error);
          // Continue anyway - don't fail the request
        }
      }

      // Get upcoming holidays for context
      const upcomingHolidays = getUpcomingHolidays(countryParam, 14);
      
      const response: GenerationResponse = {
        success: true,
        store_name: storeName,
        products: finalProducts, // Return the final selected products
        all_captions: captionResults.flatMap(result => 
          result.captions.map((caption: { text: string; style: string }) => ({
            id: '', // Will be filled from DB if needed
            product_id: result.product.id,
            caption_text: caption.text,
            caption_style: caption.style,
            created_at: new Date().toISOString()
          }))
        ),
        requires_email: true, // Always true initially, UI will handle preview vs full
        // V1 additions
        enhanced_products: products as ShopifyProductEnhanced[], // Return all products for selection UI
        weekly_calendar: weeklyCalendar,
        upcoming_holidays: upcomingHolidays
      };
      
      return NextResponse.json(response);
      
    } else {
      // Handle other cases (like email storage)
      if (email) {
        await supabase
          .from('calendar_emails')
          .upsert({
            email,
            store_id: storeData.id
          }, {
            onConflict: 'email,store_id'
          });
        
        return NextResponse.json({
          success: true,
          email_stored: true,
          message: 'Email stored successfully'
        });
      }
      
      // If we reach here, return products for selection
      return NextResponse.json({
        success: true,
        store_name: storeName,
        enhanced_products: products as ShopifyProductEnhanced[],
        step: 'products'
      });
    }
    
  } catch (error) {
    console.error('Generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}