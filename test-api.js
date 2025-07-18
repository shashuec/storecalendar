#!/usr/bin/env node
/**
 * StoreCalendar V1 API Test Suite
 * 
 * This file tests all V1 API functionality using the example store:
 * https://thedrugstorecompany.com/
 * 
 * Run with: node test-api.js
 */

const API_BASE = 'http://localhost:3000'; // Change for production testing
const TEST_STORE = 'thedrugstorecompany.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n🧪 Testing: ${testName}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function makeRequest(url, data = null) {
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

// Test 1: Basic Product Loading (V0 Legacy)
async function testBasicProductLoading() {
  logTest('Basic Product Loading (V0 Legacy)');
  
  const result = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE
  });

  if (!result.success) {
    logError(`Request failed: ${result.error || result.data?.error}`);
    return false;
  }

  const data = result.data;
  
  // Validate response structure
  if (!data.success) {
    logError(`API returned error: ${data.error}`);
    return false;
  }

  if (!data.store_name) {
    logError('Missing store_name in response');
    return false;
  }

  if (!data.enhanced_products || !Array.isArray(data.enhanced_products)) {
    logError('Missing or invalid enhanced_products array');
    return false;
  }

  if (data.enhanced_products.length === 0) {
    logError('No products loaded from store');
    return false;
  }

  logSuccess(`Store loaded: ${data.store_name}`);
  logSuccess(`Products loaded: ${data.enhanced_products.length}`);
  
  // Check product structure
  const firstProduct = data.enhanced_products[0];
  const requiredFields = ['id', 'name', 'price', 'selected', 'rank', 'product_type'];
  const missingFields = requiredFields.filter(field => !(field in firstProduct));
  
  if (missingFields.length > 0) {
    logWarning(`Missing enhanced product fields: ${missingFields.join(', ')}`);
  } else {
    logSuccess('Enhanced product structure is correct');
  }

  return { success: true, data };
}

// Test 2: V1 Country Selection
async function testCountrySelection() {
  logTest('V1 Country Selection');
  
  const countries = ['US', 'UK', 'IN'];
  
  for (const country of countries) {
    log(`  Testing country: ${country}`, 'blue');
    
    const result = await makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      country: country
    });

    if (!result.success) {
      logError(`Request failed for ${country}: ${result.error || result.data?.error}`);
      continue;
    }

    const data = result.data;
    
    if (!data.success) {
      logError(`API error for ${country}: ${data.error}`);
      continue;
    }

    if (!data.upcoming_holidays || !Array.isArray(data.upcoming_holidays)) {
      logWarning(`No upcoming holidays returned for ${country}`);
      continue;
    }

    logSuccess(`${country}: ${data.upcoming_holidays.length} upcoming holidays found`);
    
    if (data.upcoming_holidays.length > 0) {
      const holiday = data.upcoming_holidays[0];
      log(`    Next holiday: ${holiday.name} (${holiday.date})`, 'magenta');
    }
  }

  return true;
}

// Test 3: V1 Product Selection
async function testProductSelection() {
  logTest('V1 Product Selection');
  
  // First, get products
  const loadResult = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE
  });

  if (!loadResult.success || !loadResult.data.enhanced_products) {
    logError('Failed to load products for selection test');
    return false;
  }

  const products = loadResult.data.enhanced_products;
  
  // Test with different product selections
  const testCases = [
    {
      name: 'Minimum selection (3 products)',
      selected_products: products.slice(0, 3).map(p => p.id)
    },
    {
      name: 'Optimal selection (5 products)',
      selected_products: products.slice(0, 5).map(p => p.id)
    },
    {
      name: 'Maximum selection (10 products)',
      selected_products: products.slice(0, 10).map(p => p.id)
    }
  ];

  for (const testCase of testCases) {
    log(`  Testing: ${testCase.name}`, 'blue');
    
    const result = await makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      selected_products: testCase.selected_products,
      country: 'US'
    });

    if (!result.success) {
      logError(`Request failed: ${result.error || result.data?.error}`);
      continue;
    }

    const data = result.data;
    
    if (!data.success) {
      logError(`API error: ${data.error}`);
      continue;
    }

    if (!data.products || data.products.length !== testCase.selected_products.length) {
      logError(`Expected ${testCase.selected_products.length} products, got ${data.products?.length || 0}`);
      continue;
    }

    logSuccess(`Successfully filtered to ${data.products.length} selected products`);
  }

  // Test invalid selections
  log(`  Testing: Invalid selection (too few products)`, 'blue');
  const invalidResult = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    selected_products: [products[0].id] // Only 1 product
  });

  if (invalidResult.success && invalidResult.data.success) {
    logWarning('API should reject selection of less than 3 products');
  } else {
    logSuccess('Correctly rejected invalid product selection');
  }

  return true;
}

// Test 4: V1 Brand Tone Selection
async function testBrandToneSelection() {
  logTest('V1 Brand Tone Selection');
  
  const tones = ['professional', 'casual', 'playful', 'luxury'];
  
  for (const tone of tones) {
    log(`  Testing tone: ${tone}`, 'blue');
    
    const result = await makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      brand_tone: tone,
      country: 'US'
    });

    if (!result.success) {
      logError(`Request failed for ${tone}: ${result.error || result.data?.error}`);
      continue;
    }

    const data = result.data;
    
    if (!data.success) {
      logError(`API error for ${tone}: ${data.error}`);
      continue;
    }

    if (!data.all_captions || data.all_captions.length === 0) {
      logError(`No captions generated for ${tone}`);
      continue;
    }

    logSuccess(`${tone}: ${data.all_captions.length} captions generated`);
    
    // Check if tone is reflected in the captions (basic check)
    const sampleCaption = data.all_captions[0]?.caption_text || '';
    log(`    Sample: "${sampleCaption.substring(0, 80)}..."`, 'magenta');
  }

  // Test invalid tone
  log(`  Testing: Invalid tone`, 'blue');
  const invalidResult = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    brand_tone: 'invalid_tone'
  });

  if (invalidResult.success && invalidResult.data.success) {
    logWarning('API should reject invalid brand tone');
  } else {
    logSuccess('Correctly rejected invalid brand tone');
  }

  return true;
}

// Test 5: V1 Weekly Calendar Generation
async function testWeeklyCalendarGeneration() {
  logTest('V1 Weekly Calendar Generation');
  
  // Test Week 1
  log(`  Testing: Week 1 generation`, 'blue');
  const week1Result = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual',
    week_number: 1
  });

  if (!week1Result.success) {
    logError(`Week 1 request failed: ${week1Result.error || week1Result.data?.error}`);
    return false;
  }

  const week1Data = week1Result.data;
  
  if (!week1Data.success) {
    logError(`Week 1 API error: ${week1Data.error}`);
    return false;
  }

  if (!week1Data.weekly_calendar) {
    logError('No weekly_calendar in response');
    return false;
  }

  const calendar1 = week1Data.weekly_calendar;
  
  // Validate calendar structure
  const requiredCalendarFields = ['week_number', 'start_date', 'end_date', 'posts', 'country', 'brand_tone'];
  const missingCalendarFields = requiredCalendarFields.filter(field => !(field in calendar1));
  
  if (missingCalendarFields.length > 0) {
    logError(`Missing calendar fields: ${missingCalendarFields.join(', ')}`);
    return false;
  }

  if (!Array.isArray(calendar1.posts) || calendar1.posts.length !== 7) {
    logError(`Expected 7 posts, got ${calendar1.posts?.length || 0}`);
    return false;
  }

  logSuccess(`Week 1: Generated ${calendar1.posts.length} posts`);
  logSuccess(`Week 1: Covers ${calendar1.start_date} to ${calendar1.end_date}`);
  logSuccess(`Week 1: Country=${calendar1.country}, Tone=${calendar1.brand_tone}`);

  // Check post structure
  const firstPost = calendar1.posts[0];
  const requiredPostFields = ['id', 'day', 'date', 'post_type', 'caption_text', 'product_featured'];
  const missingPostFields = requiredPostFields.filter(field => !(field in firstPost));
  
  if (missingPostFields.length > 0) {
    logWarning(`Missing post fields: ${missingPostFields.join(', ')}`);
  } else {
    logSuccess('Post structure is correct');
  }

  // Check for holiday context
  const postsWithHolidays = calendar1.posts.filter(post => post.holiday_context);
  if (postsWithHolidays.length > 0) {
    logSuccess(`${postsWithHolidays.length} posts include holiday context`);
    log(`    Holiday example: ${postsWithHolidays[0].holiday_context.name}`, 'magenta');
  }

  // Test Week 2
  log(`  Testing: Week 2 generation`, 'blue');
  const week2Result = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual',
    week_number: 2
  });

  if (!week2Result.success) {
    logError(`Week 2 request failed: ${week2Result.error || week2Result.data?.error}`);
    return false;
  }

  const week2Data = week2Result.data;
  
  if (!week2Data.success || !week2Data.weekly_calendar) {
    logError(`Week 2 generation failed: ${week2Data.error || 'No calendar generated'}`);
    return false;
  }

  const calendar2 = week2Data.weekly_calendar;
  
  if (calendar2.week_number !== 2) {
    logError(`Expected week_number 2, got ${calendar2.week_number}`);
    return false;
  }

  logSuccess(`Week 2: Generated ${calendar2.posts.length} posts`);
  logSuccess(`Week 2: Different content angle from Week 1`);

  // Compare post types between weeks
  const week1PostTypes = calendar1.posts.map(p => p.post_type);
  const week2PostTypes = calendar2.posts.map(p => p.post_type);
  const differentTypes = week1PostTypes.filter((type, i) => type !== week2PostTypes[i]).length;
  
  if (differentTypes > 0) {
    logSuccess(`Week 2 has ${differentTypes} different post types from Week 1`);
  }

  return true;
}

// Test 6: Error Handling
async function testErrorHandling() {
  logTest('Error Handling');
  
  const errorTests = [
    {
      name: 'Invalid Shopify URL',
      data: { shopify_url: 'not-a-valid-url' },
      expectedError: true
    },
    {
      name: 'Non-existent store',
      data: { shopify_url: 'definitely-not-a-real-store-12345.myshopify.com' },
      expectedError: true
    },
    {
      name: 'Invalid country code',
      data: { shopify_url: TEST_STORE, country: 'INVALID' },
      expectedError: true
    },
    {
      name: 'Invalid week number',
      data: { shopify_url: TEST_STORE, week_number: 3 },
      expectedError: true
    },
    {
      name: 'Too many selected products',
      data: { 
        shopify_url: TEST_STORE, 
        selected_products: Array.from({length: 15}, (_, i) => `product-${i}`)
      },
      expectedError: true
    }
  ];

  for (const test of errorTests) {
    log(`  Testing: ${test.name}`, 'blue');
    
    const result = await makeRequest('/api/generate', test.data);
    
    if (test.expectedError) {
      if (result.success && result.data.success) {
        logWarning(`Expected error for ${test.name}, but request succeeded`);
      } else {
        logSuccess(`Correctly handled error: ${test.name}`);
        if (result.data?.error) {
          log(`    Error message: ${result.data.error}`, 'magenta');
        }
      }
    }
  }

  return true;
}

// Test 7: Performance & Load Testing
async function testPerformanceAndLoad() {
  logTest('Performance & Load Testing');
  
  // Test response time
  log(`  Testing: Response time`, 'blue');
  const startTime = Date.now();
  
  const result = await makeRequest('/api/generate', {
    shopify_url: TEST_STORE,
    country: 'US',
    brand_tone: 'casual'
  });
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  if (!result.success) {
    logError(`Performance test failed: ${result.error || result.data?.error}`);
    return false;
  }

  if (responseTime < 5000) { // Less than 5 seconds
    logSuccess(`Response time: ${responseTime}ms (Excellent)`);
  } else if (responseTime < 10000) { // Less than 10 seconds
    logSuccess(`Response time: ${responseTime}ms (Good)`);
  } else {
    logWarning(`Response time: ${responseTime}ms (Slow - consider optimization)`);
  }

  // Test concurrent requests
  log(`  Testing: Concurrent requests`, 'blue');
  const concurrentPromises = Array.from({length: 3}, () => 
    makeRequest('/api/generate', {
      shopify_url: TEST_STORE,
      country: 'US'
    })
  );

  const concurrentResults = await Promise.all(concurrentPromises);
  const successfulConcurrent = concurrentResults.filter(r => r.success && r.data.success).length;
  
  if (successfulConcurrent === concurrentResults.length) {
    logSuccess(`All ${concurrentResults.length} concurrent requests succeeded`);
  } else {
    logWarning(`Only ${successfulConcurrent}/${concurrentResults.length} concurrent requests succeeded`);
  }

  return true;
}

// Main test runner
async function runAllTests() {
  log('🚀 StoreCalendar V1 API Test Suite', 'cyan');
  log(`📝 Testing against: ${TEST_STORE}`, 'blue');
  log(`🔗 API Base: ${API_BASE}`, 'blue');
  log('=' .repeat(60), 'cyan');

  const tests = [
    { name: 'Basic Product Loading', fn: testBasicProductLoading },
    { name: 'Country Selection', fn: testCountrySelection },
    { name: 'Product Selection', fn: testProductSelection },
    { name: 'Brand Tone Selection', fn: testBrandToneSelection },
    { name: 'Weekly Calendar Generation', fn: testWeeklyCalendarGeneration },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Performance & Load', fn: testPerformanceAndLoad }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result !== false) {
        passedTests++;
      }
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
    }
  }

  log('\n' + '=' .repeat(60), 'cyan');
  log('📊 Test Results', 'cyan');
  log(`✅ Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! V1 API is working correctly.', 'green');
  } else {
    log(`⚠️  ${totalTests - passedTests} test(s) failed. Review the output above.`, 'yellow');
  }
  
  log('=' .repeat(60), 'cyan');
}

// Check if we have fetch (Node.js 18+)
if (typeof fetch === 'undefined') {
  log('❌ This script requires Node.js 18+ or a fetch polyfill', 'red');
  log('💡 Install with: npm install node-fetch', 'yellow');
  process.exit(1);
}

// Run the tests
runAllTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});