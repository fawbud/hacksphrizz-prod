#!/usr/bin/env node

/**
 * Rule-Based Bot Detection Test
 * Tests whether the rule-based system can detect obvious bot patterns
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Generate EXTREMELY obvious bot behavior that should trigger rule-based detection
function generateObviousBotData() {
    const now = Date.now();
    const userId = `obvious-bot-${now}`;
    
    const behaviorData = {
        trackingData: {
            // Perfect robotic mouse movements
            mouseMovements: Array.from({ length: 20 }, (_, i) => ({
                x: 100 + i * 20,        // Perfect linear steps
                y: 200,                 // Exact same Y coordinate
                timestamp: now + i * 100, // Exact 100ms intervals
                type: 'mousemove',
                velocity: 0.2,          // Constant velocity
                acceleration: 0         // Zero acceleration
            })),
            
            // Robotic keystrokes - identical timing
            keystrokes: Array.from({ length: 20 }, (_, i) => ({
                key: String.fromCharCode(97 + (i % 26)),
                timestamp: now + 2000 + i * 150, // Exact 150ms intervals
                type: 'keydown',
                keyCode: 97 + (i % 26),
                timeSinceLastKeystroke: i > 0 ? 150 : 0
            })),
            
            // Zero natural behaviors
            clicks: [
                { x: 200, y: 300, timestamp: now + 5000, accuracy: 1.0 }, // Perfect accuracy
                { x: 250, y: 350, timestamp: now + 5200, accuracy: 1.0 }  // Perfect accuracy
            ],
            
            scrollEvents: [], // No scrolling
            
            formInteractions: {
                'email': {
                    focusTime: now + 1000,
                    blurTime: now + 1001,    // 1ms focus time (impossible)
                    changes: 1,
                    totalKeystrokes: 5,
                    corrections: 0,          // Zero corrections
                    hesitations: 0,          // Zero hesitations
                    value: 'bot@test.com'
                }
            },
            
            windowEvents: [], // No window interactions
            touchEvents: [], // No touch events
            
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 8000,     // Very short session
                totalMouseDistance: 400,    // Minimal distance
                totalKeystrokes: 20,
                totalClicks: 2,
                totalScrolls: 0,            // Zero scrolls
                interactionCount: 22,       // Low for the time spent
                focusChanges: 0,            // No focus changes
                suspiciousPatterns: [       // Many suspicious patterns
                    { type: 'perfect_line_movement', timestamp: now + 1000 },
                    { type: 'consistent_velocity', timestamp: now + 1500 },
                    { type: 'too_regular_typing', timestamp: now + 2500 },
                    { type: 'no_natural_pauses', timestamp: now + 3000 },
                    { type: 'impossible_focus_time', timestamp: now + 1001 },
                    { type: 'zero_corrections', timestamp: now + 4000 },
                    { type: 'robotic_precision', timestamp: now + 5000 }
                ]
            }
        },
        
        processed: {
            totalSessionTime: 8000,
            mouseMovementVariance: 0.0,     // Perfect zero variance
            keystrokeVariance: 0.0,         // Perfect zero variance
            humanLikeScore: 0.1,            // Very low human score
            suspicionScore: 0.95,           // Very high suspicion
            behaviorConsistency: 0.0,       // Perfect consistency (bot-like)
            interactionDiversity: 0.2       // Low diversity
        }
    };
    
    return { userId, behaviorData };
}

// Test the rule-based system specifically
async function testRuleBasedSystem() {
    console.log('🤖 Rule-Based Bot Detection Test');
    console.log('=================================');
    console.log('Testing if rule-based system can detect OBVIOUS bot patterns\n');
    
    const { userId, behaviorData } = generateObviousBotData();
    
    console.log('📊 Bot Pattern Summary:');
    console.log(`  ✓ Mouse: ${behaviorData.trackingData.mouseMovements.length} movements (perfect linear)`);
    console.log(`  ✓ Keys: ${behaviorData.trackingData.keystrokes.length} keystrokes (exact 150ms intervals)`);
    console.log(`  ✓ Suspicious patterns: ${behaviorData.trackingData.sessionMetrics.suspiciousPatterns.length}`);
    console.log(`  ✓ Mouse variance: ${behaviorData.processed.mouseMovementVariance} (zero = bot)`);
    console.log(`  ✓ Keystroke variance: ${behaviorData.processed.keystrokeVariance} (zero = bot)`);
    console.log(`  ✓ Human score: ${behaviorData.processed.humanLikeScore} (very low)`);
    console.log(`  ✓ Suspicion score: ${behaviorData.processed.suspicionScore} (very high)`);
    console.log('');
    
    try {
        const response = await fetch('http://localhost:3003/api/behavior/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, behaviorData })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        const scorePercent = Math.round(result.trustScore * 100);
        
        console.log('🎯 RULE-BASED SYSTEM RESULTS:');
        console.log('=============================');
        console.log(`📊 Trust Score: ${scorePercent}%`);
        console.log(`📈 Trust Level: ${result.trustLevel}`);
        console.log(`🔧 AI Method: ${result.aiMethod}`);
        console.log(`🤖 Needs Captcha: ${result.needsCaptcha ? 'Yes' : 'No'}`);
        console.log(`📊 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
        
        if (result.reasons && result.reasons.length > 0) {
            console.log('📋 Detection Reasons:');
            result.reasons.forEach((reason, i) => {
                console.log(`  ${i + 1}. ${reason}`);
            });
        }
        
        if (result.metadata) {
            console.log('📄 Metadata:', JSON.stringify(result.metadata, null, 2));
        }
        
        console.log('\n' + '='.repeat(50));
        
        // Evaluate the result
        if (scorePercent <= 40) {
            console.log('🎉 EXCELLENT: Rule-based system correctly identified obvious bot!');
            console.log(`   Score ${scorePercent}% is appropriately low for such obvious bot behavior.`);
            return true;
        } else if (scorePercent <= 50) {
            console.log('✅ GOOD: Rule-based system detected bot (but could be more aggressive)');
            console.log(`   Score ${scorePercent}% suggests bot, but system could be stricter.`);
            return true;
        } else {
            console.log('❌ PROBLEM: Rule-based system failed to detect obvious bot!');
            console.log(`   Score ${scorePercent}% is too high for such obvious automated behavior.`);
            console.log('   Consider tuning the rule-based detection thresholds.');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

// Run multiple tests with different bot patterns
async function runComprehensiveTest() {
    console.log('🔍 COMPREHENSIVE RULE-BASED BOT DETECTION TEST');
    console.log('=' .repeat(60));
    console.log('Testing multiple obvious bot patterns...\n');
    
    const tests = [
        {
            name: 'Perfect Linear Mouse Movement',
            modifyData: (data) => {
                // Make mouse movement even more obviously robotic
                data.trackingData.mouseMovements = Array.from({ length: 50 }, (_, i) => ({
                    x: 100 + i * 10,
                    y: 200,
                    timestamp: Date.now() + i * 50,
                    velocity: 0.2,
                    acceleration: 0
                }));
                return data;
            }
        },
        {
            name: 'Identical Keystroke Timing',
            modifyData: (data) => {
                // Make keystrokes perfectly timed
                data.trackingData.keystrokes = Array.from({ length: 30 }, (_, i) => ({
                    key: 'a',
                    timestamp: Date.now() + 1000 + i * 100,
                    timeSinceLastKeystroke: 100
                }));
                return data;
            }
        },
        {
            name: 'Zero Human Behaviors',
            modifyData: (data) => {
                // Remove all human-like behaviors
                data.trackingData.formInteractions = {};
                data.trackingData.scrollEvents = [];
                data.trackingData.windowEvents = [];
                data.processed.humanLikeScore = 0.0;
                data.processed.suspicionScore = 1.0;
                return data;
            }
        }
    ];
    
    let passedTests = 0;
    
    for (const test of tests) {
        console.log(`\n🧪 Testing: ${test.name}`);
        console.log('-'.repeat(40));
        
        let { userId, behaviorData } = generateObviousBotData();
        behaviorData = test.modifyData(behaviorData);
        
        try {
            const response = await fetch('http://localhost:3003/api/behavior/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: `test-${Date.now()}`, behaviorData })
            });
            
            const result = await response.json();
            const scorePercent = Math.round(result.trustScore * 100);
            
            console.log(`   Trust Score: ${scorePercent}%`);
            console.log(`   Method: ${result.aiMethod}`);
            
            if (scorePercent <= 50) {
                console.log('   ✅ PASSED - Bot detected');
                passedTests++;
            } else {
                console.log('   ❌ FAILED - Bot not detected');
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
        }
        
        // Wait between tests
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 FINAL RESULTS: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
        console.log('🎉 EXCELLENT: Rule-based system is working perfectly!');
    } else if (passedTests >= tests.length * 0.7) {
        console.log('✅ GOOD: Rule-based system works but could be improved');
    } else {
        console.log('⚠️ NEEDS IMPROVEMENT: Rule-based system needs tuning');
    }
    
    return passedTests / tests.length;
}

// Main execution
if (require.main === module) {
    testRuleBasedSystem()
        .then(success => {
            if (success) {
                console.log('\n🔄 Running comprehensive test suite...');
                return runComprehensiveTest();
            }
        })
        .catch(console.error);
}

module.exports = { testRuleBasedSystem, runComprehensiveTest };