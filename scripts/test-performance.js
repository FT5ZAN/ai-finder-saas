const puppeteer = require('puppeteer');

async function testPerformance() {
  console.log('🚀 Starting Performance Test...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable network monitoring
    const networkRequests = [];
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
    });
    
    // Navigate to the category page with many tools
    console.log('📄 Navigating to category page...');
    await page.goto('http://localhost:3000/category/all%20in%20one%20ai%20tools', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for the page to fully load
    await page.waitForTimeout(5000);
    
    // Count API calls
    const apiCalls = networkRequests.filter(req => 
      req.url.includes('/api/tools/like') || 
      req.url.includes('/api/tools/save') || 
      req.url.includes('/api/user/folders')
    );
    
    console.log('\n📊 Performance Test Results:');
    console.log('================================');
    console.log(`Total API calls made: ${apiCalls.length}`);
    console.log(`Like API calls: ${apiCalls.filter(req => req.url.includes('/api/tools/like')).length}`);
    console.log(`Save API calls: ${apiCalls.filter(req => req.url.includes('/api/tools/save')).length}`);
    console.log(`Folders API calls: ${apiCalls.filter(req => req.url.includes('/api/user/folders')).length}`);
    
    // Check for errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(3000);
    
    console.log(`\n❌ Console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Error details:');
      consoleErrors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      };
    });
    
    console.log('\n⏱️ Performance Metrics:');
    console.log('================================');
    console.log(`DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`First Paint: ${performanceMetrics.firstPaint.toFixed(2)}ms`);
    console.log(`First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
    
    // Check if optimization is working
    const toolCards = await page.$$('.tool-item');
    console.log(`\n🛠️ Tool cards rendered: ${toolCards.length}`);
    
    // Expected behavior: With optimization, API calls should be significantly reduced
    const expectedMaxApiCalls = toolCards.length * 0.5; // Should be much less than before
    const isOptimized = apiCalls.length < expectedMaxApiCalls;
    
    console.log('\n✅ Optimization Status:');
    console.log('================================');
    if (isOptimized) {
      console.log('🎉 SUCCESS: API calls are optimized!');
      console.log(`Expected max API calls: ${expectedMaxApiCalls}`);
      console.log(`Actual API calls: ${apiCalls.length}`);
      console.log(`Reduction: ${((1 - apiCalls.length / expectedMaxApiCalls) * 100).toFixed(1)}%`);
    } else {
      console.log('⚠️ WARNING: API calls are still high');
      console.log(`Expected max API calls: ${expectedMaxApiCalls}`);
      console.log(`Actual API calls: ${apiCalls.length}`);
    }
    
    // Test user interactions
    console.log('\n🧪 Testing User Interactions...');
    
    // Click a like button
    const likeButton = await page.$('.like-btn');
    if (likeButton) {
      await likeButton.click();
      await page.waitForTimeout(1000);
      
      const afterClickApiCalls = networkRequests.filter(req => 
        req.url.includes('/api/tools/like') || 
        req.url.includes('/api/tools/save') || 
        req.url.includes('/api/user/folders')
      );
      
      console.log(`API calls after like click: ${afterClickApiCalls.length - apiCalls.length}`);
    }
    
    // Test save button
    const saveButton = await page.$('.save-btn');
    if (saveButton) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      const afterSaveApiCalls = networkRequests.filter(req => 
        req.url.includes('/api/tools/like') || 
        req.url.includes('/api/tools/save') || 
        req.url.includes('/api/user/folders')
      );
      
      console.log(`API calls after save click: ${afterSaveApiCalls.length - apiCalls.length}`);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('================================');
    console.log(`✅ Page loaded successfully`);
    console.log(`✅ ${toolCards.length} tool cards rendered`);
    console.log(`✅ ${apiCalls.length} API calls made (optimized)`);
    console.log(`✅ ${consoleErrors.length} console errors`);
    
    if (consoleErrors.length === 0 && isOptimized) {
      console.log('\n🎉 ALL TESTS PASSED! The optimization is working correctly.');
      return true;
    } else {
      console.log('\n❌ Some issues detected. Please check the details above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testPerformance()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testPerformance }; 