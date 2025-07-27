// Browser Test Script for Authentication Fixes
// Run this in the browser console to test the fixes

console.log('🧪 Testing Authentication Fixes...');

// Test 1: Check if 401 errors are gone
function testNo401Errors() {
  console.log('✅ Test 1: Checking for 401 errors...');
  
  // Override console.error to catch 401 errors
  const originalError = console.error;
  let has401Error = false;
  
  console.error = (...args) => {
    if (args.some(arg => arg.toString().includes('401'))) {
      has401Error = true;
    }
    originalError.apply(console, args);
  };
  
  // Wait a bit for any API calls to complete
  setTimeout(() => {
    console.error = originalError;
    if (!has401Error) {
      console.log('✅ No 401 errors detected!');
    } else {
      console.log('❌ 401 errors still present');
    }
  }, 2000);
}

// Test 2: Check for sign-in buttons
function testSignInButtons() {
  console.log('✅ Test 2: Checking for sign-in buttons...');
  
  const saveButtons = document.querySelectorAll('button');
  const signInButtons = Array.from(saveButtons).filter(btn => 
    btn.textContent.includes('Sign in to Save') || 
    btn.textContent.includes('Sign in to Like')
  );
  
  if (signInButtons.length > 0) {
    console.log(`✅ Found ${signInButtons.length} sign-in buttons`);
    signInButtons.forEach(btn => {
      console.log(`   - ${btn.textContent}`);
    });
  } else {
    console.log('❌ No sign-in buttons found (user might be authenticated)');
  }
}

// Test 3: Check for regular save/like buttons
function testRegularButtons() {
  console.log('✅ Test 3: Checking for regular save/like buttons...');
  
  const saveButtons = document.querySelectorAll('button');
  const regularButtons = Array.from(saveButtons).filter(btn => 
    btn.textContent.includes('Save') || 
    btn.textContent.includes('Likes')
  );
  
  if (regularButtons.length > 0) {
    console.log(`✅ Found ${regularButtons.length} regular buttons`);
    regularButtons.forEach(btn => {
      console.log(`   - ${btn.textContent}`);
    });
  } else {
    console.log('❌ No regular buttons found');
  }
}

// Test 4: Check for folder menu functionality
function testFolderMenu() {
  console.log('✅ Test 4: Testing folder menu functionality...');
  
  const saveButtons = document.querySelectorAll('button');
  const saveButton = Array.from(saveButtons).find(btn => 
    btn.textContent.includes('Save') && !btn.textContent.includes('Sign in')
  );
  
  if (saveButton) {
    console.log('✅ Found save button, testing right-click...');
    
    // Simulate right-click
    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      button: 2
    });
    
    saveButton.dispatchEvent(contextMenuEvent);
    
    setTimeout(() => {
      const menu = document.querySelector('[data-save-menu="true"]');
      if (menu) {
        console.log('✅ Folder menu appears on right-click');
      } else {
        console.log('❌ Folder menu does not appear');
      }
    }, 100);
  } else {
    console.log('❌ No save button found to test folder menu');
  }
}

// Test 5: Check console for errors
function testConsoleErrors() {
  console.log('✅ Test 5: Checking console for errors...');
  
  const errors = [];
  const originalError = console.error;
  
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    
    const authErrors = errors.filter(error => 
      error.includes('401') || 
      error.includes('Unauthorized') ||
      error.includes('Authentication required')
    );
    
    if (authErrors.length === 0) {
      console.log('✅ No authentication errors in console');
    } else {
      console.log(`❌ Found ${authErrors.length} authentication errors:`);
      authErrors.forEach(error => console.log(`   - ${error}`));
    }
  }, 3000);
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Authentication Fixes Test Suite...\n');
  
  testNo401Errors();
  setTimeout(testSignInButtons, 500);
  setTimeout(testRegularButtons, 1000);
  setTimeout(testFolderMenu, 1500);
  setTimeout(testConsoleErrors, 2000);
  
  setTimeout(() => {
    console.log('\n🎉 Test suite completed!');
    console.log('📝 Check the results above to verify fixes are working.');
  }, 4000);
}

// Auto-run tests after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Export for manual testing
window.testAuthenticationFixes = runAllTests; 