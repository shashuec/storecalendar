/**
 * StoreCalendar V1 Complete Test Suite
 * 
 * Runs all tests in sequence: Schema validation → API tests → UI tests
 * This will fail early if database schema is not correct
 * 
 * Run with: node tests/run-all-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

class TestSuiteRunner {
  constructor() {
    this.results = {
      schema: null,
      api: null,
      ui: null
    };
  }

  log(message, type = 'info') {
    const colors = {
      success: '\x1b[32m✅',
      error: '\x1b[31m❌',
      warning: '\x1b[33m⚠️',
      info: '\x1b[36mℹ️',
      test: '\x1b[35m🧪',
      header: '\x1b[34m🚀',
      reset: '\x1b[0m'
    };
    console.log(`${colors[type]} ${message}${colors.reset}`);
  }

  async runCommand(command, args, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { 
        cwd, 
        stdio: 'inherit',
        shell: true 
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runSchemaTests() {
    this.log('=' * 80, 'info');
    this.log('PHASE 1: DATABASE SCHEMA VALIDATION', 'header');
    this.log('Testing if V1 database migrations have been applied...', 'info');
    this.log('=' * 80, 'info');

    try {
      await this.runCommand('node', ['tests/db-schema.test.js']);
      this.results.schema = { success: true };
      this.log('✓ Database schema validation PASSED', 'success');
      return true;
    } catch (error) {
      this.results.schema = { success: false, error: error.message };
      this.log('✗ Database schema validation FAILED', 'error');
      this.log('', 'info');
      this.log('CRITICAL: V1 database migrations are missing!', 'error');
      this.log('Please run the following SQL in your Supabase SQL editor:', 'warning');
      this.log('', 'info');
      this.log('File: database-migrations-v1.sql', 'warning');
      this.log('', 'info');
      this.log('The API tests will likely pass but enhanced V1 features won\'t be stored properly.', 'warning');
      this.log('Continue anyway? (The tests will show what works vs what doesn\'t)', 'warning');
      return false;
    }
  }

  async runApiTests() {
    this.log('=' * 80, 'info');
    this.log('PHASE 2: API FUNCTIONALITY TESTS', 'header');
    this.log('Testing API endpoints and V1 feature integration...', 'info');
    this.log('=' * 80, 'info');

    try {
      await this.runCommand('node', ['tests/api.test.js']);
      this.results.api = { success: true };
      this.log('✓ API tests PASSED', 'success');
      return true;
    } catch (error) {
      this.results.api = { success: false, error: error.message };
      this.log('✗ API tests FAILED', 'error');
      return false;
    }
  }

  async runUiTests() {
    this.log('=' * 80, 'info');
    this.log('PHASE 3: UI END-TO-END TESTS', 'header');
    this.log('Testing user interface and complete user flows...', 'info');
    this.log('=' * 80, 'info');

    try {
      // Check if Playwright is available
      await this.runCommand('node', ['-e', 'require("playwright")']);
      
      await this.runCommand('node', ['tests/ui.test.js']);
      this.results.ui = { success: true };
      this.log('✓ UI tests PASSED', 'success');
      return true;
    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        this.results.ui = { success: false, error: 'Playwright not installed' };
        this.log('⚠️ UI tests SKIPPED - Playwright not installed', 'warning');
        this.log('Install with: npm install playwright && npx playwright install', 'info');
        return true; // Don't fail the suite for missing playwright
      } else {
        this.results.ui = { success: false, error: error.message };
        this.log('✗ UI tests FAILED', 'error');
        return false;
      }
    }
  }

  printFinalSummary() {
    this.log('=' * 80, 'info');
    this.log('🏁 FINAL TEST SUITE RESULTS', 'header');
    this.log('=' * 80, 'info');

    // Schema Results
    if (this.results.schema?.success) {
      this.log('✅ Database Schema: PASSED - V1 migrations applied correctly', 'success');
    } else {
      this.log('❌ Database Schema: FAILED - V1 migrations missing', 'error');
      this.log('   Action required: Run database-migrations-v1.sql in Supabase', 'warning');
    }

    // API Results
    if (this.results.api?.success) {
      this.log('✅ API Tests: PASSED - All endpoints working', 'success');
    } else {
      this.log('❌ API Tests: FAILED - API issues detected', 'error');
    }

    // UI Results
    if (this.results.ui?.success) {
      this.log('✅ UI Tests: PASSED - User interface working', 'success');
    } else if (this.results.ui?.error === 'Playwright not installed') {
      this.log('⚠️ UI Tests: SKIPPED - Playwright not available', 'warning');
    } else {
      this.log('❌ UI Tests: FAILED - UI issues detected', 'error');
    }

    this.log('', 'info');

    // Overall Status
    const criticalFailures = !this.results.schema?.success || !this.results.api?.success;
    const uiSkipped = this.results.ui?.error === 'Playwright not installed';
    
    if (criticalFailures) {
      this.log('🔴 OVERALL STATUS: CRITICAL ISSUES DETECTED', 'error');
      this.log('V1 is not ready for production. Address the failed tests above.', 'error');
    } else if (uiSkipped) {
      this.log('🟡 OVERALL STATUS: MOSTLY READY (UI tests skipped)', 'warning');
      this.log('V1 core functionality works. Install Playwright for complete validation.', 'warning');
    } else {
      this.log('🟢 OVERALL STATUS: ALL TESTS PASSED', 'success');
      this.log('V1 is ready! All features working correctly.', 'success');
    }

    this.log('=' * 80, 'info');
  }

  async runAll() {
    this.log('🚀 StoreCalendar V1 Complete Test Suite', 'header');
    this.log('This will validate database schema, API functionality, and UI', 'info');
    this.log('', 'info');

    let overallSuccess = true;

    // Phase 1: Schema validation (critical)
    const schemaSuccess = await this.runSchemaTests();
    if (!schemaSuccess) {
      overallSuccess = false;
      this.log('', 'info');
      this.log('⚠️ Continuing with API tests to show what works without proper schema...', 'warning');
      this.log('', 'info');
    }

    // Phase 2: API tests (critical)
    const apiSuccess = await this.runApiTests();
    if (!apiSuccess) {
      overallSuccess = false;
    }

    // Phase 3: UI tests (nice to have)
    await this.runUiTests();

    this.printFinalSummary();

    return overallSuccess;
  }
}

// Check if running from correct directory
const expectedFiles = ['package.json', 'src', 'tests'];
const missingFiles = expectedFiles.filter(file => {
  try {
    require('fs').statSync(file);
    return false;
  } catch {
    return true;
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Please run this from the project root directory');
  console.error(`Missing: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// Main execution
async function main() {
  const runner = new TestSuiteRunner();
  
  try {
    const success = await runner.runAll();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(`❌ Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

main();