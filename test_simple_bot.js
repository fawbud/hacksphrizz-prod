#!/usr/bin/env node

/**
 * Simple Bot Detection Test
 * Tests the current behavior tracking API
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function simpleTest() {
    console.log('🤖 Simple Bot Detection Test');
    console.log('============================\n');
    
    // Create very obvious bot behavior
    const botBehaviorData = {
        trackingData: {
            mouseMovements: [
                { x: 100, y: 200, timestamp: Date.now(), type: 'mousemove' },
                { x: 110, y: 200, timestamp: Date.now() + 50, type: 'mousemove' },
                { x: 120, y: 200, timestamp: Date.now() + 100, type: 'mousemove' },
                { x: 130, y: 200, timestamp: Date.now() + 150, type: 'mousemove' },
                { x: 140, y: 200, timestamp: Date.now() + 200, type: 'mousemove' }
            ],
            keystrokes: [
                { key: 'a', timestamp: Date.now() + 1000, type: 'keydown', keyCode: 97 },
                { key: 'a', timestamp: Date.now() + 1100, type: 'keydown', keyCode: 97 },
                { key: 'a', timestamp: Date.now() + 1200, type: 'keydown', keyCode: 97 }
            ],
            clicks: [],
            scrollEvents: [],
            formInteractions: {},
            windowEvents: [],
            touchEvents: [],
            sessionMetrics: {
                startTime: Date.now(),
                totalSessionTime: 1000,
                totalMouseDistance: 40,
                totalKeystrokes: 3,
                totalClicks: 0,
                totalScrolls: 0,
                interactionCount: 2,
                focusChanges: 0,
                suspiciousPatterns: ['perfect_timing', 'linear_movement']
            }
        },
        processed: {
            totalSessionTime: 1000,
            mouseMovementVariance: 0.0,
            keystrokeVariance: 0.0,
            humanLikeScore: 0.1,
            suspicionScore: 0.9
        }
    };
    
    try {
        console.log('📤 Testing bot behavior...');
        const response = await fetch('http://localhost:3003/api/behavior/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'simple-bot-' + Date.now(),
                behaviorData: botBehaviorData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const score = Math.round(result.trustScore * 100);
        
        console.log('📊 Results:');
        console.log(`  🎯 Trust Score: ${score}%`);
        console.log(`  📈 Trust Level: ${result.trustLevel}`);
        console.log(`  🤖 Needs Captcha: ${result.needsCaptcha}`);
        console.log(`  🔧 AI Method: ${result.aiMethod}`);
        console.log(`  📊 Fallback Used: ${result.metadata?.usedFallback || false}`);
        
        if (result.reasons) {
            console.log(`  📋 Reasons: ${result.reasons.slice(0, 3).join(', ')}`);
        }
        
        console.log('\n📝 Analysis:');
        if (score <= 50) {
            console.log(`✅ SUCCESS: Bot detected with ${score}% trust score`);
        } else {
            console.log(`⚠️ ISSUE: Bot scored ${score}%, expected ≤50%`);
        }
        
        // Show which AI system was used
        if (result.aiMethod === 'huggingface') {
            console.log('🔧 Using: Hugging Face AI');
        } else if (result.aiMethod === 'rule_based_fallback') {
            console.log('🔧 Using: Rule-based AI (fallback)');
        } else {
            console.log('🔧 Using: Unknown AI method');
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return null;
    }
}

// Test if server is responsive first
async function testServerHealth() {
    try {
        const response = await fetch('http://localhost:3003/api/behavior/track?userId=health-check');
        return response.status === 400; // Should return 400 for missing behaviorData
    } catch (error) {
        return false;
    }
}

async function main() {
    console.log('🔍 Checking server health...');
    const serverHealthy = await testServerHealth();
    
    if (!serverHealthy) {
        console.error('❌ Server not responding at http://localhost:3003');
        console.log('💡 Make sure to run: npm run dev');
        return;
    }
    
    console.log('✅ Server is responding\n');
    await simpleTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { simpleTest };