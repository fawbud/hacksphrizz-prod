#!/usr/bin/env node

/**
 * Test Script to Force Fallback to Rule-Based AI
 * This temporarily disables Hugging Face to test the rule-based system
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Generate simple bot data for quick testing
function generateSimpleBotData() {
    const now = Date.now();
    const userId = `fallback-bot-${now}`;
    
    const behaviorData = {
        trackingData: {
            mouseMovements: Array.from({ length: 20 }, (_, i) => ({
                x: 100 + i * 10,           // Perfect linear
                y: 200,                    // No Y variation
                timestamp: now + i * 50,   // Perfect timing
                type: 'mousemove'
            })),
            
            keystrokes: Array.from({ length: 10 }, (_, i) => ({
                key: 'a',
                timestamp: now + 1000 + i * 100, // Perfect timing
                type: 'keydown',
                keyCode: 97
            })),
            
            clicks: [],
            scrollEvents: [],
            formInteractions: {},
            windowEvents: [],
            touchEvents: [],
            
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 2000,
                totalMouseDistance: 200,
                totalKeystrokes: 10,
                totalClicks: 0,
                totalScrolls: 0,
                interactionCount: 2,
                focusChanges: 0,
                suspiciousPatterns: [
                    'perfect_timing',
                    'linear_movement',
                    'no_variation'
                ]
            }
        },
        
        processed: {
            totalSessionTime: 2000,
            mouseMovementVariance: 0.0,
            keystrokeVariance: 0.0,
            humanLikeScore: 0.1,
            suspicionScore: 0.9
        }
    };
    
    return { userId, behaviorData };
}

async function testWithForcedFallback() {
    console.log('🔄 Testing Rule-Based AI (Forcing Fallback)');
    console.log('============================================');
    
    const { userId, behaviorData } = generateSimpleBotData();
    const apiUrl = 'http://localhost:3003/api/behavior/track';
    
    // First, let's temporarily break the Hugging Face by sending invalid data
    console.log('📤 Sending data that should force fallback to rule-based AI...');
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId, 
                behaviorData: {
                    ...behaviorData,
                    // Add some data that might cause HF to fail
                    forceRuleBasedFallback: true
                }
            })
        });
        
        const result = await response.json();
        const scorePercent = Math.round(result.trustScore * 100);
        
        console.log(`\n📊 Fallback Test Results:`);
        console.log(`🎯 Trust Score: ${scorePercent}%`);
        console.log(`📈 Trust Level: ${result.trustLevel}`);
        console.log(`🤖 Needs Captcha: ${result.needsCaptcha}`);
        console.log(`🔧 AI Method: ${result.aiMethod}`);
        console.log(`📊 Used Fallback: ${result.metadata?.usedFallback}`);
        console.log(`📊 AI Source: ${result.aiSource}`);
        
        if (result.reasons) {
            console.log(`📋 Reasons:`);
            result.reasons.slice(0, 5).forEach((reason, i) => {
                console.log(`  ${i + 1}. ${reason}`);
            });
        }
        
        console.log(`\nMetadata:`, result.metadata);
        
        if (result.aiMethod === 'rule_based_fallback' || result.metadata?.usedFallback) {
            console.log('\n✅ Successfully using rule-based fallback system');
            
            if (scorePercent <= 50) {
                console.log(`✅ Rule-based system correctly detected bot with ${scorePercent}%`);
            } else {
                console.log(`⚠️ Rule-based system gave bot ${scorePercent}% (may need tuning)`);
            }
        } else {
            console.log('\n⚠️ Still using Hugging Face, fallback not triggered');
        }
        
    } catch (error) {
        console.error('❌ Fallback test failed:', error.message);
    }
}

if (require.main === module) {
    testWithForcedFallback().catch(console.error);
}

module.exports = { testWithForcedFallback };