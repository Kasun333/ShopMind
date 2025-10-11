// Test script for Discount API
// This script tests the fetching of active discounts from the backend

// Import the configuration
const API_CONFIG = {
  BASE_IP: '10.239.254.210',
  ORDER_SERVICE: {
    PORT: '8084',
    BASE_URL: '',
    HOSTED: false,
  },
};

// Generate the ORDER_API_URL
if (!API_CONFIG.ORDER_SERVICE.HOSTED) {
  API_CONFIG.ORDER_SERVICE.BASE_URL = `http://${API_CONFIG.BASE_IP}:${API_CONFIG.ORDER_SERVICE.PORT}`;
}

const ORDER_API_URL = API_CONFIG.ORDER_SERVICE.BASE_URL;
const DISCOUNT_API_URL = ORDER_API_URL;

const DISCOUNT_ENDPOINTS = {
  GET_ACTIVE: `${DISCOUNT_API_URL}/api/discounts/active`,
  VALIDATE: `${DISCOUNT_API_URL}/api/discounts/validate`,
  APPLY: `${DISCOUNT_API_URL}/api/discounts/apply`,
  HISTORY: (userId) => `${DISCOUNT_API_URL}/api/discounts/history/${userId}`,
  SAVINGS: (userId) => `${DISCOUNT_API_URL}/api/discounts/savings/${userId}`,
};

console.log('🚀 Testing Discount API');
console.log('📍 Base URL:', ORDER_API_URL);
console.log('🔗 Active Discounts Endpoint:', DISCOUNT_ENDPOINTS.GET_ACTIVE);

// Test function to fetch active discounts
async function testFetchActiveDiscounts() {
  console.log('\n🧪 Testing: Fetch All Active Discounts');
  console.log('📞 Making request to:', DISCOUNT_ENDPOINTS.GET_ACTIVE);
  
  try {
    const response = await fetch(DISCOUNT_ENDPOINTS.GET_ACTIVE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Status Text:', response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success! Active discounts received:');
    console.log('📋 Data type:', Array.isArray(data) ? 'Array' : 'Object');
    console.log('📋 Data length/keys:', Array.isArray(data) ? data.length : Object.keys(data).length);
    console.log('📋 Full response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching active discounts:', error.message);
    if (error.message.includes('fetch')) {
      console.error('🔍 Possible issues:');
      console.error('   - Backend server is not running on port 8084');
      console.error('   - Network connectivity issues');
      console.error('   - CORS configuration problems');
    }
    throw error;
  }
}

// Test function to fetch Bill discounts only
async function testFetchBillDiscounts() {
  console.log('\n🧪 Testing: Fetch Bill Discounts Only');
  const billDiscountsUrl = `${DISCOUNT_ENDPOINTS.GET_ACTIVE}?type=BILL_DISCOUNT`;
  console.log('📞 Making request to:', billDiscountsUrl);
  
  try {
    const response = await fetch(billDiscountsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success! Bill discounts received:');
    console.log('📋 Data:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching bill discounts:', error.message);
    throw error;
  }
}

// Test function to fetch Product discounts only
async function testFetchProductDiscounts() {
  console.log('\n🧪 Testing: Fetch Product Discounts Only');
  const productDiscountsUrl = `${DISCOUNT_ENDPOINTS.GET_ACTIVE}?type=PRODUCT_DISCOUNT`;
  console.log('📞 Making request to:', productDiscountsUrl);
  
  try {
    const response = await fetch(productDiscountsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Success! Product discounts received:');
    console.log('📋 Data:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching product discounts:', error.message);
    throw error;
  }
}

// Main test runner
async function runDiscountTests() {
  console.log('🎯 Starting Discount API Tests...\n');
  
  const tests = [
    { name: 'All Active Discounts', fn: testFetchActiveDiscounts },
    { name: 'Bill Discounts Only', fn: testFetchBillDiscounts },
    { name: 'Product Discounts Only', fn: testFetchProductDiscounts },
  ];

  const results = [];

  for (const test of tests) {
    try {
      console.log(`\n${'='.repeat(50)}`);
      const result = await test.fn();
      results.push({ name: test.name, status: 'PASSED', data: result });
      console.log(`✅ ${test.name}: PASSED`);
    } catch (error) {
      results.push({ name: test.name, status: 'FAILED', error: error.message });
      console.log(`❌ ${test.name}: FAILED`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('📊 TEST SUMMARY:');
  console.log(`${'='.repeat(50)}`);
  
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passedTests = results.filter(r => r.status === 'PASSED').length;
  const totalTests = results.length;
  
  console.log(`\n📈 Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Discount API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the backend server and API endpoints.');
  }
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Node.js environment - use node-fetch if available
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
    runDiscountTests();
  } catch (error) {
    console.log('⚠️ node-fetch not found. Please install it with: npm install node-fetch');
    console.log('Or test this in a browser environment.');
  }
} else {
  // Browser environment
  runDiscountTests();
}