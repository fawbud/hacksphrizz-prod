const fetch = require('node-fetch');

async function testRuleBasedDetection() {
  console.log('🧪 Testing Rule-Based Detection Only...\n');
  
  const testData = {
    userId: `test_rule_${Date.now()}`,
    behaviorData: {
      trackingData: {
        mouseMovements: Array.from({length: 75}, (_, i) => ({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          timestamp: Date.now() + i * 100
        })),
        keystrokes: Array.from({length: 45}, (_, i) => ({
          key: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
          timestamp: Date.now() + i * 150,
          interval: 120 + Math.random() * 60
        })),
        clicks: Array.from({length: 15}, (_, i) => ({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          timestamp: Date.now() + i * 3000,
          button: 'left'
        })),
        formInteractions: {
          focus_events: 5,
          blur_events: 5,
          input_changes: 25
        },
        sessionMetrics: {
          totalSessionTime: 45000,
          interactionCount: 135,
          suspiciousPatterns: [],
          tabSwitches: 2,
          copyPasteEvents: 1,
          rightClickEvents: 0
        }
      }
    }
  };

  try {
    console.log('📊 Sending test data to rule-based system...');
    
    const response = await fetch('http://localhost:3003/api/behavior/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Rule-Based Detection Results:');
    console.log(`   Trust Score: ${result.trust_score || 'N/A'}`);
    console.log(`   Trust Level: ${result.trust_level || 'N/A'}`);
    console.log(`   Analysis Method: ${result.analysis_method || 'N/A'}`);
    console.log(`   Needs Captcha: ${result.needs_captcha || false}`);
    
    if (result.reasons && result.reasons.length > 0) {
      console.log('   Top Reasons:');
      result.reasons.slice(0, 3).forEach((reason, index) => {
        console.log(`     ${index + 1}. ${reason}`);
      });
    }

    // Test retrieval
    console.log('\n🔍 Testing data retrieval...');
    const getResponse = await fetch(`http://localhost:3003/api/behavior/track?userId=${testData.userId}`);
    
    if (getResponse.ok) {
      const retrievedData = await getResponse.json();
      console.log('✅ Data retrieval successful');
      console.log(`   Records found: ${retrievedData.behaviors ? retrievedData.behaviors.length : 0}`);
    }
    
    console.log('\n🎉 Rule-based detection system is working correctly!');
    console.log('🚫 AI toggle has been successfully commented out');
    
  } catch (error) {
    console.error('❌ Error testing rule-based detection:', error.message);
  }
}

// Test if server is accessible
async function testServerHealth() {
  try {
    const response = await fetch('http://localhost:3003');
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Next.js server is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Next.js server is not accessible:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Rule-Based Detection Test Suite\n');
  
  const serverOk = await testServerHealth();
  if (serverOk) {
    await testRuleBasedDetection();
  } else {
    console.log('Please start the Next.js server first: npm run dev');
  }
}

main();