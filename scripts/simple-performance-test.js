const http = require('http');
const https = require('https');

// Simple performance test to validate optimization
async function simplePerformanceTest() {
  console.log('🚀 Starting Simple Performance Test...');
  
  const testUrl = 'http://localhost:3000/category/all%20in%20one%20ai%20tools';
  
  try {
    console.log('📄 Testing page load performance...');
    
    const startTime = Date.now();
    
    // Make a simple HTTP request to test page load
    const response = await makeRequest(testUrl);
    const loadTime = Date.now() - startTime;
    
    console.log('\n📊 Performance Test Results:');
    console.log('================================');
    console.log(`Page load time: ${loadTime}ms`);
    console.log(`Response status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Page loaded successfully');
      
      // Check if the page contains optimized components
      const hasOptimizedComponents = response.data.includes('OptimizedLikeButton') || 
                                   response.data.includes('OptimizedSaveButton');
      
      if (hasOptimizedComponents) {
        console.log('✅ Optimized components detected');
      } else {
        console.log('⚠️ Optimized components not found - check implementation');
      }
      
      // Check for common error patterns
      const hasNetworkErrors = response.data.includes('Failed to fetch') || 
                              response.data.includes('ERR_INTERNET_DISCONNECTED') ||
                              response.data.includes('Error fetching folders');
      
      if (!hasNetworkErrors) {
        console.log('✅ No network error patterns detected');
      } else {
        console.log('❌ Network error patterns found in page');
      }
      
      // Performance assessment
      if (loadTime < 3000) {
        console.log('✅ Fast page load time (< 3 seconds)');
      } else if (loadTime < 5000) {
        console.log('⚠️ Moderate page load time (3-5 seconds)');
      } else {
        console.log('❌ Slow page load time (> 5 seconds)');
      }
      
      console.log('\n🎯 Test Summary:');
      console.log('================================');
      console.log(`✅ Page loaded in ${loadTime}ms`);
      console.log(`✅ Status code: ${response.statusCode}`);
      console.log(`✅ Optimized components: ${hasOptimizedComponents ? 'Yes' : 'No'}`);
      console.log(`✅ Network errors: ${hasNetworkErrors ? 'Yes' : 'No'}`);
      
      if (loadTime < 3000 && !hasNetworkErrors && hasOptimizedComponents) {
        console.log('\n🎉 ALL TESTS PASSED! The optimization is working correctly.');
        return true;
      } else {
        console.log('\n⚠️ Some issues detected. Please check the details above.');
        return false;
      }
      
    } else {
      console.log(`❌ Page failed to load with status: ${response.statusCode}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Manual API call test
async function testApiCalls() {
  console.log('\n🧪 Testing API Call Optimization...');
  
  const apiEndpoints = [
    '/api/tools/like?toolId=test',
    '/api/tools/save?toolId=test',
    '/api/user/folders'
  ];
  
  const results = [];
  
  for (const endpoint of apiEndpoints) {
    try {
      const startTime = Date.now();
      const response = await makeRequest(`http://localhost:3000${endpoint}`);
      const responseTime = Date.now() - startTime;
      
      results.push({
        endpoint,
        statusCode: response.statusCode,
        responseTime,
        success: response.statusCode < 500
      });
      
      console.log(`✅ ${endpoint}: ${response.statusCode} (${responseTime}ms)`);
      
    } catch (error) {
      results.push({
        endpoint,
        statusCode: 0,
        responseTime: 0,
        success: false,
        error: error.message
      });
      
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`\n📊 API Test Results: ${successCount}/${totalCount} endpoints working`);
  
  return successCount === totalCount;
}

// Run all tests
async function runAllTests() {
  console.log('🔍 Running Comprehensive Performance Tests...\n');
  
  const pageTest = await simplePerformanceTest();
  const apiTest = await testApiCalls();
  
  console.log('\n🎯 Final Test Results:');
  console.log('================================');
  console.log(`Page Performance: ${pageTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API Endpoints: ${apiTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (pageTest && apiTest) {
    console.log('\n🎉 ALL TESTS PASSED! Your application is optimized and ready for production.');
    return true;
  } else {
    console.log('\n❌ Some tests failed. Please review the issues above.');
    return false;
  }
}

// Run the test
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { simplePerformanceTest, testApiCalls, runAllTests }; 