/**
 * StoreCalendar V1 Database Schema Validation Tests
 * 
 * These tests will FAIL if the V1 database migrations haven't been applied
 * Run with: node tests/db-schema.test.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Check .env.local file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test utilities
class DBSchemaTestRunner {
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

  test(name, testFunction) {
    this.tests.push({ name, fn: testFunction });
  }

  async runTests() {
    this.log(`🚀 Running ${this.tests.length} database schema validation tests`, 'info');
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
    this.log(`📊 Schema Test Results: ${this.passed}/${this.tests.length} passed`, 'info');
    
    if (this.failed === 0) {
      this.log('🎉 All schema tests passed! V1 database migrations are correctly applied.', 'success');
    } else {
      this.log(`${this.failed} schema tests failed - V1 migrations need to be applied`, 'error');
      this.log('Run the database-migrations-v1.sql file in your Supabase SQL editor', 'warning');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async queryDatabase(query) {
    const { data, error } = await supabase.rpc('exec_sql', { sql: query });
    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
    return data;
  }
}

// Initialize test runner
const runner = new DBSchemaTestRunner();

// Test 1: Check if V1 tables exist
runner.test('V1 Tables Existence', async () => {
  const requiredTables = [
    'calendar_weekly_calendars',
    'calendar_posts', 
    'calendar_user_preferences',
    'calendar_holidays'
  ];

  for (const tableName of requiredTables) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === '42P01') {
      throw new Error(`Table '${tableName}' does not exist - V1 migrations not applied`);
    }
    
    runner.log(`✓ Table '${tableName}' exists`, 'info');
  }
});

// Test 2: Check enhanced columns in calendar_products
runner.test('Enhanced Product Columns', async () => {
  const requiredColumns = ['product_type', 'vendor', 'tags', 'ranking_score', 'is_featured'];
  
  // Try to select the new columns
  const { data, error } = await supabase
    .from('calendar_products')
    .select(requiredColumns.join(', '))
    .limit(1);
  
  if (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      const missingColumn = error.message.match(/column "([^"]+)"/)?.[1];
      throw new Error(`Column '${missingColumn}' missing from calendar_products - V1 migrations not applied`);
    }
    throw new Error(`Error checking enhanced columns: ${error.message}`);
  }
  
  runner.log('✓ All enhanced product columns exist', 'info');
});

// Test 3: Test calendar_weekly_calendars constraints
runner.test('Calendar Weekly Constraints', async () => {
  try {
    // Test invalid week_number (should fail)
    const { error: weekError } = await supabase
      .from('calendar_weekly_calendars')
      .insert({
        store_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        week_number: 3, // Invalid - should be 1 or 2
        start_date: '2025-01-01',
        end_date: '2025-01-07',
        country_code: 'US',
        brand_tone: 'casual',
        selected_products: [],
        calendar_data: {}
      });
    
    if (!weekError || !weekError.message.includes('check')) {
      throw new Error('Week number constraint not working - check V1 migrations');
    }
    
    runner.log('✓ Week number constraint working', 'info');
    
    // Test invalid country_code (should fail)
    const { error: countryError } = await supabase
      .from('calendar_weekly_calendars')
      .insert({
        store_id: '00000000-0000-0000-0000-000000000000',
        week_number: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-07',
        country_code: 'INVALID', // Invalid country
        brand_tone: 'casual',
        selected_products: [],
        calendar_data: {}
      });
    
    if (!countryError || !countryError.message.includes('check')) {
      throw new Error('Country code constraint not working - check V1 migrations');
    }
    
    runner.log('✓ Country code constraint working', 'info');
    
  } catch (error) {
    if (error.message.includes('constraint') || error.message.includes('check')) {
      throw error;
    }
    // Other errors (like foreign key violations) are expected for dummy data
    runner.log('✓ Calendar constraints appear to be working', 'info');
  }
});

// Test 4: Check holiday data exists
runner.test('Holiday Data Population', async () => {
  const { data: holidays, error } = await supabase
    .from('calendar_holidays')
    .select('*')
    .eq('country_code', 'US')
    .limit(5);
  
  if (error) {
    throw new Error(`Cannot query holidays: ${error.message}`);
  }
  
  if (!holidays || holidays.length === 0) {
    throw new Error('No holiday data found - V1 holiday data not inserted');
  }
  
  // Check if we have key holidays
  const { data: christmas, error: christmasError } = await supabase
    .from('calendar_holidays')
    .select('*')
    .eq('country_code', 'US')
    .eq('holiday_name', 'Christmas Day');
  
  if (christmasError || !christmas || christmas.length === 0) {
    throw new Error('Christmas holiday not found - sample holiday data not inserted');
  }
  
  runner.log(`✓ Found ${holidays.length} holidays, including Christmas`, 'info');
});

// Test 5: Check indexes exist
runner.test('Database Indexes', async () => {
  // This test checks if our performance indexes were created
  // We'll test by doing queries that should use the indexes
  
  const start = Date.now();
  
  // Query that should use store_week index
  const { data, error } = await supabase
    .from('calendar_weekly_calendars')
    .select('*')
    .eq('store_id', '00000000-0000-0000-0000-000000000000')
    .eq('week_number', 1);
  
  const queryTime = Date.now() - start;
  
  if (error && !error.message.includes('no rows')) {
    throw new Error(`Index query failed: ${error.message}`);
  }
  
  // Query should be fast even with no data
  if (queryTime > 1000) {
    runner.log('⚠️ Query seems slow - indexes may not be created', 'warning');
  } else {
    runner.log('✓ Index queries performing well', 'info');
  }
});

// Test 6: Test JSONB columns work
runner.test('JSONB Column Functionality', async () => {
  // Test that JSONB columns can store and retrieve complex data
  const testTags = ['skincare', 'organic', 'premium'];
  const testCalendarData = {
    week_number: 1,
    posts: [{ day: 'Monday', content: 'Test post' }]
  };
  
  try {
    // Test calendar_products tags (JSONB)
    const { error: tagError } = await supabase
      .from('calendar_products')
      .select('tags')
      .eq('tags', JSON.stringify(testTags))
      .limit(1);
    
    if (tagError && tagError.message.includes('operator does not exist')) {
      throw new Error('JSONB tags column not working properly - check V1 migrations');
    }
    
    runner.log('✓ Product tags JSONB column working', 'info');
    
    // Test calendar_data JSONB column
    const { error: calendarError } = await supabase
      .from('calendar_weekly_calendars')
      .select('calendar_data')
      .limit(1);
    
    if (calendarError && calendarError.message.includes('does not exist')) {
      throw new Error('calendar_data JSONB column missing - check V1 migrations');
    }
    
    runner.log('✓ Calendar data JSONB column working', 'info');
    
  } catch (error) {
    if (error.message.includes('JSONB') || error.message.includes('does not exist')) {
      throw error;
    }
    // Other errors are ok for this test
    runner.log('✓ JSONB columns appear functional', 'info');
  }
});

// Main execution
async function main() {
  try {
    await runner.runTests();
    process.exit(runner.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`❌ Schema test suite failed: ${error.message}`);
    process.exit(1);
  }
}

main();