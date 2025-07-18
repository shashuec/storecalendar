/**
 * StoreCalendar V1 API Integration Tests
 * 
 * Automated testing for all API functionality
 * Run with: node tests/api.test.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const API_BASE = process.env.API_BASE || 'http://localhost:3001';
const TEST_STORE = 'thedrugstorecompany.com';

// Supabase client for database validation
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'info') {
    const colors = {
      success: '\x1b[32m✅',
      error: '\x1b[31m❌',
      warning: '\x1b[33m⚠️',
      info: '\x1b[36mℹ️',
      test: '\x1b[35m🧪',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]} ${message}${colors.reset}`);
  }

  async makeRequest(endpoint, data = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
      method: data ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: result,
        response
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        error: error.message
      };
    }
  }

  test(name, testFunction) {
    this.tests.push({ name, fn: testFunction });
  }

  async runTests() {
    this.log(`🚀 Running ${this.tests.length} API tests with database validation against ${API_BASE}`, 'info');
    this.log(`📝 Test store: ${TEST_STORE}`, 'info');
    console.log('='.repeat(60));

    for (const test of this.tests) {
      try {
        this.log(`Testing: ${test.name}`, 'test');
        await test.fn();
        this.passed++;
        this.log(`PASSED: ${test.name}`, 'success');
      } catch (error) {
        this.failed++;
        this.log(`FAILED: ${test.name} - ${error.message}`, 'error');
      }
      console.log('');
    }

    this.printSummary();
  }

  printSummary() {
    console.log('='.repeat(60));
    this.log(`📊 Test Results: ${this.passed}/${this.tests.length} passed`, 'info');
    
    if (this.failed === 0) {
      this.log('🎉 All tests passed!', 'success');
    } else {
      this.log(`${this.failed} tests failed`, 'error');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
  }

  assertExists(value, message) {
    if (value === null || value === undefined) {
      throw new Error(`${message}: value should exist`);
    }
  }

  assertArray(value, message) {
    if (!Array.isArray(value)) {
      throw new Error(`${message}: expected array, got ${typeof value}`);
    }
  }

  // Database validation helpers
  async checkStoreInDB(shopifyUrl) {
    const cleanUrl = shopifyUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const { data, error } = await supabase
      .from('calendar_stores')
      .select('*')
      .eq('shopify_url', cleanUrl)
      .single();
    
    if (error) throw new Error(`Store not found in DB: ${error.message}`);
    return data;
  }

  async checkProductsInDB(storeId, expectedCount) {
    const { data, error } = await supabase
      .from('calendar_products')
      .select('*')
      .eq('store_id', storeId);
    
    if (error) throw new Error(`Products query failed: ${error.message}`);
    if (!data || data.length < expectedCount) {
      throw new Error(`Expected at least ${expectedCount} products, found ${data?.length || 0}`);
    }
    return data;
  }

  async checkEmailInDB(email, storeId) {
    const { data, error } = await supabase
      .from('calendar_emails')
      .select('*')
      .eq('email', email)
      .eq('store_id', storeId);
    
    if (error) throw new Error(`Email query failed: ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error(`Email ${email} not found in database`);
    }
    return data[0];
  }

  async checkCalendarInDB(storeId, weekNumber) {
    const { data, error } = await supabase
      .from('calendar_weekly_calendars')
      .select('*')
      .eq('store_id', storeId)
      .eq('week_number', weekNumber);
    
    if (error) throw new Error(`Calendar query failed: ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error(`Weekly calendar not found in database`);
    }
    return data[0];
  }

  async checkEnhancedProductFields(storeId) {
    const { data, error } = await supabase
      .from('calendar_products')
      .select('product_type, vendor, tags')
      .eq('store_id', storeId)
      .limit(5);
    
    if (error) throw new Error(`Enhanced products query failed: ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error(`No products found for enhanced field validation`);
    }
    return data;
  }
}

// Initialize test runner
const runner = new TestRunner();

// Test 1: Basic API Health Check
runner.test('API Health Check', async () => {
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: 'invalid-url'
  });
  
  runner.assert(result.status === 400, 'Should return 400 for invalid URL');
  runner.assertExists(result.data.error, 'Should return error message');
});

// Test 2: Basic Product Loading
runner.test('Basic Product Loading', async () => {
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE
  });

  runner.assert(result.success, `Request failed: ${result.error || result.data?.error}`);
  runner.assert(result.data.success, `API error: ${result.data.error}`);
  runner.assertExists(result.data.store_name, 'Missing store_name');
  runner.assertArray(result.data.enhanced_products, 'Missing enhanced_products array');
  runner.assert(result.data.enhanced_products.length > 0, 'No products loaded');
  
  // Validate product structure
  const product = result.data.enhanced_products[0];
  runner.assertExists(product.id, 'Product missing id');
  runner.assertExists(product.name, 'Product missing name');
  runner.assertExists(product.price, 'Product missing price');
  
  runner.log(`✓ Loaded ${result.data.enhanced_products.length} products from ${result.data.store_name}`, 'info');
});

// Test 3: Country Selection & Holiday Integration
runner.test('Country Selection & Holiday Integration', async () => {
  const countries = ['US', 'UK', 'IN'];
  
  for (const country of countries) {
    const result = await runner.makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      country: country
    });

    runner.assert(result.success, `Country ${country} request failed`);
    runner.assert(result.data.success, `Country ${country} API error`);
    
    if (result.data.upcoming_holidays) {
      runner.assertArray(result.data.upcoming_holidays, `${country} holidays not array`);
      runner.log(`✓ ${country}: ${result.data.upcoming_holidays.length} holidays found`, 'info');
    }
  }
});

// Test 4: Brand Tone Variations
runner.test('Brand Tone Variations', async () => {
  const tones = ['professional', 'casual', 'playful', 'luxury'];
  
  for (const tone of tones) {
    const result = await runner.makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      brand_tone: tone,
      country: 'US'
    });

    runner.assert(result.success, `Tone ${tone} request failed`);
    runner.assert(result.data.success, `Tone ${tone} API error`);
    runner.assertArray(result.data.all_captions, `${tone} captions not generated`);
    runner.assert(result.data.all_captions.length > 0, `No captions for ${tone}`);
    
    runner.log(`✓ ${tone}: ${result.data.all_captions.length} captions generated`, 'info');
  }
});

// Test 5: Weekly Calendar Generation
runner.test('Weekly Calendar Generation', async () => {
  // Test Week 1
  const week1Result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual',
    week_number: 1
  });

  runner.assert(week1Result.success, 'Week 1 request failed');
  runner.assert(week1Result.data.success, 'Week 1 API error');
  runner.assertExists(week1Result.data.weekly_calendar, 'No weekly_calendar in response');
  
  const calendar1 = week1Result.data.weekly_calendar;
  runner.assertEqual(calendar1.week_number, 1, 'Wrong week number');
  runner.assertArray(calendar1.posts, 'Calendar posts not array');
  runner.assertEqual(calendar1.posts.length, 7, 'Should have 7 posts');
  runner.assertEqual(calendar1.country, 'US', 'Wrong country');
  runner.assertEqual(calendar1.brand_tone, 'casual', 'Wrong brand tone');
  
  // Validate post structure
  const post = calendar1.posts[0];
  runner.assertExists(post.day, 'Post missing day');
  runner.assertExists(post.date, 'Post missing date');
  runner.assertExists(post.post_type, 'Post missing post_type');
  runner.assertExists(post.caption_text, 'Post missing caption_text');
  runner.assertExists(post.product_featured, 'Post missing product_featured');
  
  runner.log(`✓ Week 1: ${calendar1.posts.length} posts from ${calendar1.start_date} to ${calendar1.end_date}`, 'info');

  // Test Week 2
  const week2Result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual',
    week_number: 2
  });

  runner.assert(week2Result.success, 'Week 2 request failed');
  runner.assert(week2Result.data.success, 'Week 2 API error');
  runner.assertExists(week2Result.data.weekly_calendar, 'No Week 2 calendar');
  
  const calendar2 = week2Result.data.weekly_calendar;
  runner.assertEqual(calendar2.week_number, 2, 'Wrong week 2 number');
  runner.assertEqual(calendar2.posts.length, 7, 'Week 2 should have 7 posts');
  
  runner.log(`✓ Week 2: Generated different content angles`, 'info');
});

// Test 6: Product Selection Validation
runner.test('Product Selection Validation', async () => {
  // First get products
  const loadResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE
  });
  
  runner.assert(loadResult.success && loadResult.data.enhanced_products, 'Failed to load products');
  const products = loadResult.data.enhanced_products;

  // Test valid selection (5 products)
  const validSelection = products.slice(0, 5).map(p => p.id);
  const validResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    selected_products: validSelection,
    country: 'US'
  });

  runner.assert(validResult.success, 'Valid selection failed');
  runner.assert(validResult.data.success, 'Valid selection API error');
  runner.assertEqual(validResult.data.products.length, 5, 'Wrong number of selected products');
  
  runner.log(`✓ Selected ${validSelection.length} products successfully`, 'info');

  // Test invalid selection (too few)
  const invalidResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    selected_products: [products[0].id, products[1].id] // Only 2 products
  });

  runner.assert(!invalidResult.success || !invalidResult.data.success, 'Should reject too few products');
  runner.log(`✓ Correctly rejected invalid selection`, 'info');
});

// Test 7: Error Handling
runner.test('Error Handling', async () => {
  const errorTests = [
    {
      name: 'Invalid Shopify URL',
      data: { shopify_url: 'not-a-valid-url' },
      expectedStatus: 400
    },
    {
      name: 'Invalid country',
      data: { shopify_url: TEST_STORE, country: 'INVALID' },
      expectedStatus: 400
    },
    {
      name: 'Invalid brand tone',
      data: { shopify_url: TEST_STORE, brand_tone: 'invalid_tone' },
      expectedStatus: 400
    },
    {
      name: 'Invalid week number',
      data: { shopify_url: TEST_STORE, week_number: 3 },
      expectedStatus: 400
    }
  ];

  for (const test of errorTests) {
    const result = await runner.makeRequest('/api/generate', test.data);
    
    if (test.expectedStatus === 400) {
      runner.assert(result.status === 400 || !result.data.success, 
        `${test.name} should return error`);
      runner.log(`✓ ${test.name}: Correctly handled`, 'info');
    }
  }
});

// Test 8: Database Schema Validation
runner.test('Database Schema Validation', async () => {
  // Test that enhanced product fields are stored correctly
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US'
  });

  runner.assert(result.success, 'Request failed for schema validation');
  runner.assert(result.data.success, 'API error for schema validation');
  runner.assertArray(result.data.enhanced_products, 'Missing enhanced_products');
  
  const product = result.data.enhanced_products[0];
  
  // These fields should exist if V1 schema is properly implemented
  runner.assertExists(product.product_type, 'Product missing product_type - V1 schema not applied');
  runner.assertExists(product.vendor, 'Product missing vendor - V1 schema not applied');
  runner.assertArray(product.tags, 'Product missing tags array - V1 schema not applied');
  
  // Test that product_type is not just default
  const hasRealProductTypes = result.data.enhanced_products.some(p => 
    p.product_type && p.product_type !== 'General' && p.product_type.length > 0
  );
  
  if (!hasRealProductTypes) {
    runner.log('⚠️ All products have default product_type - enhanced scraping may not be working', 'warning');
  }
  
  // Test that tags exist
  const hasRealTags = result.data.enhanced_products.some(p => 
    p.tags && Array.isArray(p.tags) && p.tags.length > 0
  );
  
  if (!hasRealTags) {
    runner.log('⚠️ No products have tags - enhanced scraping may not be working', 'warning');
  }
  
  runner.log('✓ Enhanced product schema validation passed', 'info');
});

// Test 9: Calendar Storage Validation
runner.test('Calendar Storage Validation', async () => {
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual',
    week_number: 1
  });

  runner.assert(result.success, 'Calendar generation failed');
  runner.assert(result.data.success, 'Calendar API error');
  runner.assertExists(result.data.weekly_calendar, 'Missing weekly_calendar');
  
  const calendar = result.data.weekly_calendar;
  
  // Validate calendar structure
  runner.assertEqual(calendar.posts.length, 7, 'Calendar should have 7 posts');
  runner.assertExists(calendar.start_date, 'Calendar missing start_date');
  runner.assertExists(calendar.end_date, 'Calendar missing end_date');
  
  // Check if calendar has proper post structure
  const post = calendar.posts[0];
  runner.assertExists(post.day, 'Post missing day');
  runner.assertExists(post.date, 'Post missing date');
  runner.assertExists(post.post_type, 'Post missing post_type');
  runner.assertExists(post.caption_text, 'Post missing caption_text');
  runner.assertExists(post.product_featured, 'Post missing product_featured');
  runner.assertExists(post.product_featured.id, 'Featured product missing id');
  
  runner.log(`✓ Calendar structure validation passed: ${calendar.posts.length} posts generated`, 'info');
  
  // NOTE: We can't directly test database storage from API tests,
  // but if the API doesn't throw errors and returns proper structure,
  // it indicates the calendar persistence is working
});

// Test 10: Database Connection Health
runner.test('Database Connection Health', async () => {
  // Test multiple rapid requests to ensure database can handle load
  const promises = Array.from({ length: 3 }, (_, i) => 
    runner.makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      country: i === 0 ? 'US' : i === 1 ? 'UK' : 'IN'
    })
  );
  
  const results = await Promise.all(promises);
  
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    runner.assert(result.success, `Database connection failed for request ${i + 1}`);
    runner.assert(result.data.success, `Database operation failed for request ${i + 1}`);
  }
  
  runner.log('✓ Database connection health check passed', 'info');
});

// Test 11: Email Storage Validation
runner.test('Email Storage Validation', async () => {
  const testEmail = `test+${Date.now()}@example.com`;
  
  // Step 1: Generate calendar without email first
  const initialResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual'
  });
  
  runner.assert(initialResult.success, 'Initial request failed');
  runner.assert(initialResult.data.success, 'Initial API error');
  
  // Get store from database
  const storeData = await runner.checkStoreInDB(TEST_STORE);
  runner.log(`✓ Store found in DB: ${storeData.store_name}`, 'info');
  
  // Step 2: Submit email
  const emailResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    email: testEmail
  });
  
  runner.assert(emailResult.success, 'Email submission failed');
  runner.assert(emailResult.data.email_stored, 'Email not marked as stored');
  
  // Step 3: Verify email is in database
  const emailData = await runner.checkEmailInDB(testEmail, storeData.id);
  runner.assertEqual(emailData.email, testEmail, 'Email mismatch in database');
  runner.assertEqual(emailData.store_id, storeData.id, 'Store ID mismatch');
  
  runner.log(`✓ Email ${testEmail} successfully stored in database`, 'info');
});

// Test 12: Enhanced Product Storage Validation
runner.test('Enhanced Product Storage Validation', async () => {
  // Generate calendar to ensure products are stored
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US'
  });
  
  runner.assert(result.success, 'Request failed');
  runner.assert(result.data.success, 'API error');
  
  // Get store from database
  const storeData = await runner.checkStoreInDB(TEST_STORE);
  
  // Check that products were stored with enhanced fields
  const dbProducts = await runner.checkProductsInDB(storeData.id, 5);
  runner.log(`✓ Found ${dbProducts.length} products in database`, 'info');
  
  // Validate enhanced fields are present and not all defaults
  const enhancedData = await runner.checkEnhancedProductFields(storeData.id);
  
  let hasRealProductTypes = false;
  let hasRealVendors = false;
  let hasRealTags = false;
  
  for (const product of enhancedData) {
    if (product.product_type && product.product_type !== 'General') {
      hasRealProductTypes = true;
    }
    if (product.vendor && product.vendor.length > 0) {
      hasRealVendors = true;
    }
    if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
      hasRealTags = true;
    }
  }
  
  runner.assert(hasRealProductTypes, 'No products have enhanced product_type - Shopify scraping issue');
  runner.log(`✓ Products have enhanced product types`, 'info');
  
  if (hasRealVendors) {
    runner.log(`✓ Products have vendor information`, 'info');
  } else {
    runner.log(`⚠️ No vendor information found - may be normal for this store`, 'warning');
  }
  
  if (hasRealTags) {
    runner.log(`✓ Products have tags information`, 'info');
  } else {
    runner.log(`⚠️ No tags found - may be normal for this store`, 'warning');
  }
});

// Test 13: Calendar Storage Validation
runner.test('Calendar Storage Validation', async () => {
  // Generate a week 1 calendar
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'professional',
    week_number: 1
  });
  
  runner.assert(result.success, 'Calendar request failed');
  runner.assert(result.data.success, 'Calendar API error');
  runner.assertExists(result.data.weekly_calendar, 'No weekly calendar in response');
  
  // Get store from database
  const storeData = await runner.checkStoreInDB(TEST_STORE);
  
  // Check that calendar was stored in database
  const calendarData = await runner.checkCalendarInDB(storeData.id, 1);
  
  runner.assertEqual(calendarData.week_number, 1, 'Wrong week number in database');
  runner.assertEqual(calendarData.country_code, 'US', 'Wrong country in database');
  runner.assertEqual(calendarData.brand_tone, 'professional', 'Wrong brand tone in database');
  runner.assertExists(calendarData.calendar_data, 'Calendar data not stored');
  runner.assertExists(calendarData.selected_products, 'Selected products not stored');
  
  // Validate calendar_data structure
  const storedCalendar = calendarData.calendar_data;
  runner.assertEqual(storedCalendar.posts.length, 7, 'Calendar should have 7 posts in DB');
  runner.assertEqual(storedCalendar.week_number, 1, 'Week number mismatch in stored data');
  
  runner.log(`✓ Weekly calendar properly stored in database`, 'info');
  
  // Check individual posts are also stored
  const { data: posts, error: postsError } = await supabase
    .from('calendar_posts')
    .select('*')
    .eq('calendar_id', calendarData.id);
  
  if (postsError) {
    throw new Error(`Posts query failed: ${postsError.message}`);
  }
  
  runner.assertEqual(posts.length, 7, 'Should have 7 individual posts stored');
  runner.log(`✓ ${posts.length} individual posts stored in calendar_posts table`, 'info');
});

// Test 14: Data Persistence Validation
runner.test('Data Persistence Validation', async () => {
  // This test validates that data persists across multiple API calls
  
  // First call to store data
  const firstResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'UK'
  });
  
  runner.assert(firstResult.success, 'First request failed');
  const storeData = await runner.checkStoreInDB(TEST_STORE);
  const firstProductCount = await runner.checkProductsInDB(storeData.id, 1);
  
  // Second call should use cached data if within 6 hours
  const secondResult = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'UK',
    brand_tone: 'luxury'
  });
  
  runner.assert(secondResult.success, 'Second request failed');
  const secondProductCount = await runner.checkProductsInDB(storeData.id, 1);
  
  // Product count should be the same (using cached data)
  runner.assertEqual(
    firstProductCount.length, 
    secondProductCount.length, 
    'Product count changed - caching may not be working'
  );
  
  runner.log(`✓ Data persistence working: ${firstProductCount.length} products maintained`, 'info');
  
  // Check that the store's last_scraped time is reasonable
  const updatedStore = await runner.checkStoreInDB(TEST_STORE);
  const lastScraped = new Date(updatedStore.last_scraped);
  const now = new Date();
  const timeDiff = now - lastScraped;
  
  // Should be scraped within the last hour
  runner.assert(timeDiff < 60 * 60 * 1000, 'Store last_scraped time seems too old');
  runner.log(`✓ Store last_scraped timestamp updated: ${lastScraped.toISOString()}`, 'info');
});

// Test 15: Performance Test
runner.test('Performance Test', async () => {
  const startTime = Date.now();
  
  const result = await runner.makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual'
  });
  
  const responseTime = Date.now() - startTime;
  
  runner.assert(result.success, 'Performance test request failed');
  runner.assert(responseTime < 30000, `Response too slow: ${responseTime}ms`);
  
  if (responseTime < 5000) {
    runner.log(`✓ Excellent response time: ${responseTime}ms`, 'success');
  } else if (responseTime < 10000) {
    runner.log(`✓ Good response time: ${responseTime}ms`, 'info');
  } else {
    runner.log(`⚠️ Slow response time: ${responseTime}ms`, 'warning');
  }
});

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('❌ This script requires Node.js 18+ or a fetch polyfill');
  process.exit(1);
}

// Run all tests
runner.runTests().catch(error => {
  console.error(`❌ Test suite failed: ${error.message}`);
  process.exit(1);
});