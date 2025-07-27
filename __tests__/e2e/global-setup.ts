import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  
  console.log('🚀 Starting E2E test setup...');
  
  // Seed test data using CommonJS version
  console.log('📊 Seeding test data...');
  try {
    const { seedTestData } = require('./test-data-seeder.js');
    const seedingSuccess = await seedTestData();
    if (!seedingSuccess) {
      console.error('❌ Failed to seed test data. Tests may fail.');
    }
  } catch (error) {
    console.error('❌ Error during test data seeding:', error);
  }
  
  // Skip if no storage state is configured
  if (!storageState) {
    console.log('⚠️ No storage state configured, skipping authentication setup');
    return;
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the application
    console.log('🌐 Navigating to application...');
    await page.goto(baseURL!);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check if authentication is required
    const signInButton = page.locator('[data-testid="sign-in-button"]');
    const userButton = page.locator('[data-testid="user-button"]');

    // If user is not signed in, we can set up test data or skip authentication
    if (await signInButton.isVisible()) {
      console.log('👤 User not authenticated, setting up test environment...');
      
      // For now, we'll just ensure the page loads correctly
      // In a real scenario, you might want to:
      // 1. Create test user accounts
      // 2. Set up test data in the database
      // 3. Authenticate with test credentials
      
      // Wait a bit to ensure everything is loaded
      await page.waitForTimeout(2000);
    } else if (await userButton.isVisible()) {
      console.log('✅ User is already authenticated');
    } else {
      console.log('⚠️ No authentication elements found, proceeding without auth');
    }

    // Save signed-in state
    await page.context().storageState({ path: storageState as string });
    console.log('💾 Saved authentication state');
    
  } catch (error) {
    console.error('❌ Error during global setup:', error);
  } finally {
    await browser.close();
  }
  
  console.log('✅ E2E test setup completed');
}

export default globalSetup; 