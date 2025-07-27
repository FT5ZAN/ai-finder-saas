import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test cleanup...');
  
  try {
    // Clean up test data using CommonJS version
    console.log('🗑️ Cleaning up test data...');
    const { cleanupTestData } = require('./test-data-seeder.js');
    const cleanupSuccess = await cleanupTestData();
    
    if (cleanupSuccess) {
      console.log('✅ Test data cleanup completed successfully');
    } else {
      console.error('❌ Failed to cleanup test data');
    }
    
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
  
  console.log('✅ E2E test cleanup completed');
}

export default globalTeardown; 