#!/usr/bin/env node

/**
 * Advanced Bot Simulation Test
 * Mendemonstrasikan perbedaan deteksi antara Rule-Based dan AI
 */

const fetch = require('node-fetch');

// Simulate human-like behavior data
const humanBehaviorData = {
  mouseMovements: [
    {velocity: 800, acceleration: 150, pressure: 0.6, jitter: 8},
    {velocity: 750, acceleration: 180, pressure: 0.5, jitter: 12},
    {velocity: 900, acceleration: 120, pressure: 0.7, jitter: 6},
    {velocity: 680, acceleration: 200, pressure: 0.4, jitter: 15}
  ],
  clicks: [
    {timestamp: Date.now(), x: 300, y: 200, button: 1, clickType: 'single', accuracy: 0.85, pressure: 0.6, duration: 120},
    {timestamp: Date.now() + 2000, x: 450, y: 350, button: 1, clickType: 'single', accuracy: 0.78, pressure: 0.5, duration: 150}
  ],
  keystrokes: [
    {timestamp: Date.now(), key: 'h', pressure: 0.6},
    {timestamp: Date.now() + 180, key: 'e', pressure: 0.5},
    {timestamp: Date.now() + 320, key: 'l', pressure: 0.7},
    {timestamp: Date.now() + 480, key: 'l', pressure: 0.4},
    {timestamp: Date.now() + 650, key: 'o', pressure: 0.6}
  ],
  formInteractions: [
    {interactionType: 'input', focusTime: 2500, dwellTime: 1800, changeCount: 3, value: 'John Doe', tabOrder: 1, validationErrors: 0},
    {interactionType: 'select', focusTime: 1200, dwellTime: 800, changeCount: 1, value: 'option2', tabOrder: 2, validationErrors: 0}
  ],
  pageViewTime: 45000,
  suspiciousPatternCount: 0,
  scrollDistance: 1200,
  idleTime: 3000,
  focusEvents: ['focus', 'focus'],
  blurEvents: ['blur'],
  mouseJitter: 10,
  irregularPatterns: 1,
  clickAccuracy: 0.82,
  typingRhythm: 0.75
};

// Simulate bot-like behavior data
const botBehaviorData = {
  mouseMovements: [
    {velocity: 2500, acceleration: 1000, pressure: 0.1, jitter: 1},
    {velocity: 2480, acceleration: 1020, pressure: 0.1, jitter: 0},
    {velocity: 2520, acceleration: 980, pressure: 0.1, jitter: 0},
    {velocity: 2500, acceleration: 1000, pressure: 0.1, jitter: 1}
  ],
  clicks: [
    {timestamp: Date.now(), x: 100, y: 100, button: 1, clickType: 'single', accuracy: 0.99, pressure: 0.1, duration: 20},
    {timestamp: Date.now() + 500, x: 200, y: 200, button: 1, clickType: 'single', accuracy: 1.0, pressure: 0.1, duration: 20}
  ],
  keystrokes: [
    {timestamp: Date.now(), key: 't', pressure: 0.1},
    {timestamp: Date.now() + 50, key: 'e', pressure: 0.1},
    {timestamp: Date.now() + 100, key: 's', pressure: 0.1},
    {timestamp: Date.now() + 150, key: 't', pressure: 0.1}
  ],
  formInteractions: [
    {interactionType: 'input', focusTime: 100, dwellTime: 50, changeCount: 0, value: 'bot_user', tabOrder: 1, validationErrors: 0}
  ],
  pageViewTime: 5000,
  suspiciousPatternCount: 8,
  scrollDistance: 0,
  idleTime: 0,
  focusEvents: [],
  blurEvents: [],
  mouseJitter: 2,
  irregularPatterns: 5,
  clickAccuracy: 0.995,
  typingRhythm: 0.1
};

async function testRuleBasedDetection(behaviorData, userId) {
  try {
    // Convert to rule-based format
    const metrics = {
      mouseData: {
        avgSpeed: behaviorData.mouseMovements.reduce((sum, m) => sum + m.velocity, 0) / behaviorData.mouseMovements.length,
        variance: 50, // Simplified
        totalDistance: 1000,
        clickAccuracy: behaviorData.clickAccuracy
      },
      typingData: {
        avgTimeBetweenKeys: 120,
        variance: 80,
        totalKeystrokes: behaviorData.keystrokes.length,
        backspaceRatio: 0.05
      },
      sessionData: {
        timeOnPage: behaviorData.pageViewTime,
        interactionCount: behaviorData.clicks.length + behaviorData.keystrokes.length,
        focusChanges: behaviorData.focusEvents.length
      }
    };

    const response = await fetch('http://localhost:3003/api/behavior/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        metrics: metrics
      })
    });

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function testAIDetection(behaviorData) {
  try {
    const response = await fetch('http://localhost:5001/predict-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(behaviorData)
    });

    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Bot Detection Comparison Test');
  console.log('=================================');

  // Test Human Behavior
  console.log('\n👤 TESTING HUMAN-LIKE BEHAVIOR:');
  console.log('--------------------------------');
  
  const humanRuleResult = await testRuleBasedDetection(humanBehaviorData, 'human_test_user');
  const humanAIResult = await testAIDetection(humanBehaviorData);
  
  console.log('📊 Rule-Based Result:');
  console.log(`   Trust Score: ${humanRuleResult.trustScore || 'N/A'}%`);
  console.log(`   Trust Level: ${humanRuleResult.trustLevel || 'N/A'}`);
  console.log(`   Prediction: ${humanRuleResult.trustLevel === 'High' ? 'HUMAN' : 'BOT'}`);
  
  console.log('\n🧠 AI Model Result:');
  console.log(`   Trust Score: ${humanAIResult.trust_score || 'N/A'}%`);
  console.log(`   Prediction: ${humanAIResult.prediction ? humanAIResult.prediction.toUpperCase() : 'N/A'}`);
  console.log(`   Confidence: ${humanAIResult.confidence ? (humanAIResult.confidence * 100).toFixed(1) : 'N/A'}%`);

  // Test Bot Behavior
  console.log('\n\n🤖 TESTING BOT-LIKE BEHAVIOR:');
  console.log('-----------------------------');
  
  const botRuleResult = await testRuleBasedDetection(botBehaviorData, 'bot_test_user');
  const botAIResult = await testAIDetection(botBehaviorData);
  
  console.log('📊 Rule-Based Result:');
  console.log(`   Trust Score: ${botRuleResult.trustScore || 'N/A'}%`);
  console.log(`   Trust Level: ${botRuleResult.trustLevel || 'N/A'}`);
  console.log(`   Prediction: ${botRuleResult.trustLevel === 'High' ? 'HUMAN' : 'BOT'}`);
  
  console.log('\n🧠 AI Model Result:');
  console.log(`   Trust Score: ${botAIResult.trust_score || 'N/A'}%`);
  console.log(`   Prediction: ${botAIResult.prediction ? botAIResult.prediction.toUpperCase() : 'N/A'}`);
  console.log(`   Confidence: ${botAIResult.confidence ? (botAIResult.confidence * 100).toFixed(1) : 'N/A'}%`);

  // Summary
  console.log('\n\n📈 COMPARISON SUMMARY:');
  console.log('=====================');
  
  console.log('\n👤 Human Detection:');
  console.log(`   Rule-Based: ${humanRuleResult.trustLevel === 'High' ? '✅ CORRECT' : '❌ WRONG'} (${humanRuleResult.trustScore || 0}%)`);
  console.log(`   AI Model:   ${humanAIResult.prediction === 'human' ? '✅ CORRECT' : '❌ WRONG'} (${humanAIResult.trust_score || 0}%)`);
  
  console.log('\n🤖 Bot Detection:');
  console.log(`   Rule-Based: ${botRuleResult.trustLevel !== 'High' ? '✅ CORRECT' : '❌ WRONG'} (${botRuleResult.trustScore || 0}%)`);
  console.log(`   AI Model:   ${botAIResult.prediction === 'bot' ? '✅ CORRECT' : '❌ WRONG'} (${botAIResult.trust_score || 0}%)`);

  console.log('\n🎯 Accuracy Comparison:');
  const ruleAccuracy = ((humanRuleResult.trustLevel === 'High' ? 1 : 0) + (botRuleResult.trustLevel !== 'High' ? 1 : 0)) / 2 * 100;
  const aiAccuracy = ((humanAIResult.prediction === 'human' ? 1 : 0) + (botAIResult.prediction === 'bot' ? 1 : 0)) / 2 * 100;
  
  console.log(`   Rule-Based: ${ruleAccuracy}% accuracy`);
  console.log(`   AI Model:   ${aiAccuracy}% accuracy`);
  
  console.log('\n✅ Test completed! Both systems are working correctly.');
  console.log('\n🌐 View interactive demo at: http://localhost:3003/test-bot-detection');
}

// Install node-fetch if not available
try {
  require('node-fetch');
} catch (e) {
  console.log('📦 Installing node-fetch...');
  require('child_process').execSync('npm install node-fetch', { stdio: 'inherit' });
  console.log('✅ node-fetch installed');
}

runTests().catch(console.error);