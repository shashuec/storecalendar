#!/usr/bin/env node

// Clear cache script for StoreCalendar
// Usage: node clear-cache.js [store-url]

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCache(storeUrl) {
  try {
    if (storeUrl) {
      // Clear specific store
      const cleanUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      
      console.log(`🗑️  Clearing cache for store: ${cleanUrl}`);
      
      // Delete products first (due to foreign key)
      const { error: productError } = await supabase
        .from('calendar_products')
        .delete()
        .in('store_id', 
          supabase.from('calendar_stores').select('id').eq('shopify_url', cleanUrl)
        );
      
      if (productError) {
        console.error('❌ Error deleting products:', productError);
        return;
      }
      
      // Delete store
      const { error: storeError } = await supabase
        .from('calendar_stores')
        .delete()
        .eq('shopify_url', cleanUrl);
      
      if (storeError) {
        console.error('❌ Error deleting store:', storeError);
        return;
      }
      
      console.log(`✅ Cache cleared for store: ${cleanUrl}`);
    } else {
      // Clear all cache
      console.log('🗑️  Clearing all cache...');
      
      const { error: productError } = await supabase
        .from('calendar_products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (productError) {
        console.error('❌ Error clearing products:', productError);
        return;
      }
      
      const { error: storeError } = await supabase
        .from('calendar_stores')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (storeError) {
        console.error('❌ Error clearing stores:', storeError);
        return;
      }
      
      console.log('✅ All cache cleared');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get store URL from command line argument
const storeUrl = process.argv[2];

if (storeUrl) {
  console.log(`Clearing cache for specific store: ${storeUrl}`);
} else {
  console.log('No store URL provided. This will clear ALL cache.');
  console.log('Usage: node clear-cache.js [store-url]');
  console.log('Example: node clear-cache.js thedrugstorecompany.com');
}

// Run the cache clearing
clearCache(storeUrl);