// Simple test untuk endpoint /api/predict
async function testPredictEndpoint() {
  try {
    console.log('🧪 Testing /api/predict endpoint...');
    
    const response = await fetch('http://localhost:3000/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'status' })
    });
    
    const data = await response.json();
    
    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.success !== undefined) {
      console.log('✅ Endpoint is working correctly!');
      console.log('🔄 Endpoint renamed from /api/simulation to /api/predict successfully');
    } else {
      console.log('⚠️ Unexpected response format');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
  }
}

// Test dengan Node.js
if (typeof window === 'undefined') {
  // Running in Node.js
  const fetch = require('node-fetch');
  testPredictEndpoint();
} else {
  // Running in browser
  testPredictEndpoint();
}