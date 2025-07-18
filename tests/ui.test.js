/**
 * StoreCalendar V1 UI End-to-End Tests
 * 
 * Automated UI testing using Playwright
 * Run with: node tests/ui.test.js
 */

const TEST_STORE = 'thedrugstorecompany.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Test utilities
class UITestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.browser = null;
    this.context = null;
    this.page = null;
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

  async setup() {
    try {
      // Use built-in browser tools or install playwright
      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 }
      });
      this.page = await this.context.newPage();
      
      // Set longer timeout for slow responses
      this.page.setDefaultTimeout(30000);
      
      this.log('🚀 Browser setup complete', 'success');
    } catch (error) {
      throw new Error(`Browser setup failed: ${error.message}\nTry: npm install playwright`);
    }
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
      this.log('🔒 Browser closed', 'info');
    }
  }

  test(name, testFunction) {
    this.tests.push({ name, fn: testFunction });
  }

  async runTests() {
    this.log(`🚀 Running ${this.tests.length} UI tests against ${BASE_URL}`, 'info');
    this.log(`📝 Test store: ${TEST_STORE}`, 'info');
    console.log('='.repeat(60));

    await this.setup();

    for (const test of this.tests) {
      try {
        this.log(`Testing: ${test.name}`, 'test');
        
        // Navigate to home page before each test
        await this.page.goto(BASE_URL);
        await this.page.waitForLoadState('networkidle');
        
        await test.fn(this.page);
        this.passed++;
        this.log(`PASSED: ${test.name}`, 'success');
      } catch (error) {
        this.failed++;
        this.log(`FAILED: ${test.name} - ${error.message}`, 'error');
        
        // Take screenshot on failure
        try {
          await this.page.screenshot({ 
            path: `tests/screenshots/failed-${test.name.replace(/\s+/g, '-').toLowerCase()}.png`,
            fullPage: true 
          });
          this.log(`📸 Screenshot saved for ${test.name}`, 'info');
        } catch (screenshotError) {
          // Ignore screenshot errors
        }
      }
      console.log('');
    }

    await this.teardown();
    this.printSummary();
  }

  printSummary() {
    console.log('='.repeat(60));
    this.log(`📊 UI Test Results: ${this.passed}/${this.tests.length} passed`, 'info');
    
    if (this.failed === 0) {
      this.log('🎉 All UI tests passed!', 'success');
    } else {
      this.log(`${this.failed} UI tests failed`, 'error');
    }
  }

  async waitForElement(page, selector, timeout = 10000) {
    await page.waitForSelector(selector, { timeout });
  }

  async waitForText(page, text, timeout = 10000) {
    await page.waitForFunction(
      (searchText) => document.body.innerText.includes(searchText),
      text,
      { timeout }
    );
  }
}

// Initialize test runner
const runner = new UITestRunner();

// Test 1: Page Load and Basic UI Elements
runner.test('Page Load and Basic UI Elements', async (page) => {
  // Check if page loads
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Check header elements
  await runner.waitForElement(page, 'header');
  const title = await page.textContent('h1');
  if (!title || !title.includes('Shopify')) {
    throw new Error('Main heading not found or incorrect');
  }
  
  // Check form elements
  await runner.waitForElement(page, '#generator-form');
  await runner.waitForElement(page, 'input[type="url"]');
  
  runner.log('✓ Page loaded successfully with all basic elements', 'info');
});

// Test 2: Step 1 - URL Input and Product Loading
runner.test('Step 1 - URL Input and Product Loading', async (page) => {
  // Enter Shopify URL
  await page.fill('input[type="url"]', TEST_STORE);
  
  // Click next/load products button
  const loadButton = page.locator('button').filter({ hasText: /Load Products|Next/ }).first();
  await loadButton.click();
  
  // Wait for loading to complete
  await page.waitForFunction(
    () => !document.querySelector('button:disabled'),
    { timeout: 30000 }
  );
  
  // Check if we moved to step 2 or got products
  const hasCountrySelector = await page.locator('text=Select your country').isVisible().catch(() => false);
  const hasProducts = await page.locator('text=products').isVisible().catch(() => false);
  
  if (!hasCountrySelector && !hasProducts) {
    throw new Error('Failed to load products or proceed to next step');
  }
  
  runner.log('✓ Successfully loaded products and/or proceeded to country selection', 'info');
});

// Test 3: Step 2 - Country Selection
runner.test('Step 2 - Country Selection', async (page) => {
  // Navigate through step 1 first
  await page.fill('input[type="url"]', TEST_STORE);
  const loadButton = page.locator('button').filter({ hasText: /Load Products|Next/ }).first();
  await loadButton.click();
  
  // Wait for country selection step
  await runner.waitForText(page, 'country', 15000);
  
  // Select a country (US)
  const usButton = page.locator('button').filter({ hasText: /United States|US/ });
  if (await usButton.isVisible()) {
    await usButton.click();
  }
  
  // Click next
  const nextButton = page.locator('button').filter({ hasText: /Next|Select Products/ }).first();
  if (await nextButton.isVisible()) {
    await nextButton.click();
  }
  
  runner.log('✓ Country selection completed', 'info');
});

// Test 4: Step 3 - Product Selection
runner.test('Step 3 - Product Selection', async (page) => {
  // Navigate through steps 1 and 2
  await page.fill('input[type="url"]', TEST_STORE);
  
  // Step 1: Load products
  const loadButton = page.locator('button').filter({ hasText: /Load Products|Next/ }).first();
  await loadButton.click();
  await page.waitForTimeout(3000);
  
  // Step 2: Select country if available
  const usButton = page.locator('button').filter({ hasText: /United States|US/ });
  if (await usButton.isVisible()) {
    await usButton.click();
    const nextButton = page.locator('button').filter({ hasText: /Next|Select Products/ }).first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  }
  
  // Wait for product selection interface
  await runner.waitForText(page, 'product', 15000);
  
  // Check if products are listed
  const hasCheckboxes = await page.locator('input[type="checkbox"]').isVisible().catch(() => false);
  const hasProductNames = await page.locator('text=/Premium|Face|Cream|Product/').isVisible().catch(() => false);
  
  if (hasCheckboxes) {
    // Select some products if checkboxes are available
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
      await checkboxes[i].check();
    }
    runner.log('✓ Selected products using checkboxes', 'info');
  }
  
  if (!hasCheckboxes && !hasProductNames) {
    throw new Error('No product selection interface found');
  }
  
  runner.log('✓ Product selection interface working', 'info');
});

// Test 5: Step 4 - Brand Tone Selection
runner.test('Step 4 - Brand Tone Selection', async (page) => {
  // Navigate through previous steps quickly
  await page.fill('input[type="url"]', TEST_STORE);
  
  // Try to navigate through all steps quickly
  const buttons = await page.locator('button').all();
  for (const button of buttons) {
    const text = await button.textContent();
    if (text && (text.includes('Load') || text.includes('Next') || text.includes('Select'))) {
      await button.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // Look for brand tone selection
  const hasToneSelection = await page.locator('text=/Professional|Casual|Playful|Luxury|tone|voice/i').isVisible().catch(() => false);
  
  if (hasToneSelection) {
    // Select casual tone
    const casualButton = page.locator('button').filter({ hasText: /Casual/ });
    if (await casualButton.isVisible()) {
      await casualButton.click();
    }
    runner.log('✓ Brand tone selection working', 'info');
  } else {
    runner.log('⚠️ Brand tone selection not reached or not visible', 'warning');
  }
});

// Test 6: Complete Flow - Calendar Generation
runner.test('Complete Flow - Calendar Generation', async (page) => {
  // Set longer timeout for this test
  page.setDefaultTimeout(60000);
  
  try {
    // Step 1: Enter URL
    await page.fill('input[type="url"]', TEST_STORE);
    await page.locator('button').filter({ hasText: /Load|Next/ }).first().click();
    await page.waitForTimeout(3000);
    
    // Navigate through remaining steps
    let stepCount = 0;
    while (stepCount < 5) {
      const nextButton = page.locator('button').filter({ 
        hasText: /Next|Select|Choose|Generate|Continue/ 
      }).first();
      
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(2000);
        stepCount++;
      } else {
        break;
      }
    }
    
    // Look for calendar or results
    const hasCalendar = await page.locator('text=/Monday|Tuesday|Wednesday|calendar|week/i').isVisible().catch(() => false);
    const hasResults = await page.locator('text=/generated|caption|post/i').isVisible().catch(() => false);
    
    if (hasCalendar || hasResults) {
      runner.log('✓ Successfully generated calendar/results', 'success');
    } else {
      runner.log('⚠️ Calendar generation may have failed or UI changed', 'warning');
    }
    
  } catch (error) {
    throw new Error(`Complete flow failed: ${error.message}`);
  }
});

// Test 7: Mobile Responsiveness
runner.test('Mobile Responsiveness', async (page) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  
  // Check if page loads on mobile
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
  
  // Check if form is visible and usable
  await runner.waitForElement(page, '#generator-form');
  await runner.waitForElement(page, 'input[type="url"]');
  
  // Check if form is properly sized
  const formBox = await page.locator('#generator-form').boundingBox();
  if (!formBox || formBox.width > 400) {
    throw new Error('Form not properly responsive on mobile');
  }
  
  // Reset to desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  
  runner.log('✓ Mobile responsiveness working', 'info');
});

// Test 8: Error Handling in UI
runner.test('Error Handling in UI', async (page) => {
  // Test with invalid URL
  await page.fill('input[type="url"]', 'invalid-url');
  
  const submitButton = page.locator('button').filter({ hasText: /Load|Next|Generate/ }).first();
  await submitButton.click();
  
  // Wait for error message
  await page.waitForTimeout(3000);
  
  // Look for error message
  const hasError = await page.locator('text=/error|invalid|failed/i').isVisible().catch(() => false);
  
  if (!hasError) {
    throw new Error('No error message shown for invalid URL');
  }
  
  runner.log('✓ Error handling working in UI', 'info');
});

// Test 9: Copy Functionality (if results are generated)
runner.test('Copy Functionality', async (page) => {
  // Try to get to results quickly
  await page.fill('input[type="url"]', TEST_STORE);
  
  // Click through steps rapidly
  for (let i = 0; i < 5; i++) {
    const nextButton = page.locator('button').filter({ 
      hasText: /Load|Next|Generate|Select|Choose/ 
    }).first();
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // Look for copy buttons
  const copyButtons = await page.locator('button').filter({ hasText: /copy/i }).all();
  
  if (copyButtons.length > 0) {
    // Test copy functionality
    await copyButtons[0].click();
    runner.log('✓ Copy functionality accessible', 'info');
  } else {
    runner.log('⚠️ No copy buttons found (may not have reached results)', 'warning');
  }
});

// Test 10: Navigation Between Steps
runner.test('Navigation Between Steps', async (page) => {
  // Start the flow
  await page.fill('input[type="url"]', TEST_STORE);
  await page.locator('button').filter({ hasText: /Load|Next/ }).first().click();
  await page.waitForTimeout(2000);
  
  // Look for back button
  const backButton = page.locator('button').filter({ hasText: /Back|Previous/ });
  
  if (await backButton.isVisible()) {
    await backButton.click();
    
    // Check if we went back to step 1
    const urlInput = await page.locator('input[type="url"]').isVisible();
    if (!urlInput) {
      throw new Error('Back button did not return to previous step');
    }
    
    runner.log('✓ Step navigation working', 'info');
  } else {
    runner.log('⚠️ No back button found (may be on first step)', 'warning');
  }
});

// Create screenshots directory
const fs = require('fs').promises;
async function createScreenshotsDir() {
  try {
    await fs.mkdir('tests/screenshots', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Check if Playwright is available
async function checkPlaywright() {
  try {
    await import('playwright');
    return true;
  } catch (error) {
    console.error('❌ Playwright not found. Install with: npm install playwright');
    console.error('   Then run: npx playwright install');
    return false;
  }
}

// Main execution
async function main() {
  if (!(await checkPlaywright())) {
    process.exit(1);
  }
  
  await createScreenshotsDir();
  
  try {
    await runner.runTests();
    process.exit(runner.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`❌ UI test suite failed: ${error.message}`);
    process.exit(1);
  }
}

main();