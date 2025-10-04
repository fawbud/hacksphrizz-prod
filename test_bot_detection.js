#!/usr/bin/env node

/**
 * Bot Simulation Script
 * Tests whether the AI can detect automated behavior patterns
 * Expected result: Trust score ≤ 50% (bot detection)
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Generate bot-like behavior data that should trigger bot detection
function generateBotBehaviorData() {
    const now = Date.now();
    const userId = `bot-test-${now}`;
    
    // Create behavior data with obvious bot patterns
    const behaviorData = {
        trackingData: {
            // Perfect linear mouse movements (bot indicator)
            mouseMovements: Array.from({ length: 50 }, (_, i) => ({
                x: 100 + i * 10,        // Perfect linear progression
                y: 200 + i * 5,         // Perfect linear progression
                timestamp: now + i * 50,  // Constant 50ms intervals
                type: 'mousemove'
            })),
            
            // Robotic keystrokes with constant timing
            keystrokes: Array.from({ length: 30 }, (_, i) => ({
                key: String.fromCharCode(97 + (i % 26)), // a-z pattern
                timestamp: now + 1000 + i * 80,          // Constant 80ms intervals
                type: 'keydown',
                keyCode: 97 + (i % 26)
            })),
            
            // Perfect click patterns
            clicks: [
                { x: 150, y: 250, timestamp: now + 2500, type: 'click' },
                { x: 200, y: 300, timestamp: now + 2700, type: 'click' },
                { x: 250, y: 350, timestamp: now + 2900, type: 'click' }
            ],
            
            // Minimal scroll events (bots often don't scroll naturally)
            scrollEvents: [
                { deltaY: 100, timestamp: now + 3000 },
                { deltaY: 100, timestamp: now + 3200 }
            ],
            
            // Robotic form interactions
            formInteractions: {
                'name': {
                    focusTime: now + 1000,
                    blurTime: now + 1500,
                    changes: 1,
                    totalKeystrokes: 10,
                    value: 'Bot User'
                },
                'email': {
                    focusTime: now + 1600,
                    blurTime: now + 2000,
                    changes: 1,
                    totalKeystrokes: 15,
                    value: 'bot@example.com'
                }
            },
            
            windowEvents: [],
            touchEvents: [],
            
            // Session metrics that indicate bot behavior
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 5000,        // Short session
                totalMouseDistance: 500,       // Minimal distance
                totalKeystrokes: 30,
                totalClicks: 3,
                totalScrolls: 2,
                interactionCount: 5,           // Low interaction count
                focusChanges: 2,
                suspiciousPatterns: [          // Clear bot indicators
                    'constant_timing',
                    'linear_movement',
                    'no_hesitation',
                    'perfect_precision'
                ]
            }
        },
        
        // Additional bot indicators
        processed: {
            totalSessionTime: 5000,
            mouseMovementVariance: 0.1,      // Very low variance (bot-like)
            keystrokeVariance: 0.05,         // Very low variance (bot-like)
            humanLikeScore: 0.2,             // Very low human-like score
            suspicionScore: 0.9              // High suspicion score
        }
    };
    
    return { userId, behaviorData };
}

// Generate human-like behavior data for comparison
function generateHumanBehaviorData() {
    const now = Date.now();
    const userId = `human-test-${now}`;
    
    // Create behavior data with natural human patterns
    const behaviorData = {
        trackingData: {
            // Natural mouse movements with curves and variations
            mouseMovements: Array.from({ length: 150 }, (_, i) => {
                const time = now + i * (40 + Math.random() * 60); // Variable timing 40-100ms
                const jitter = (Math.random() - 0.5) * 5;         // Natural jitter
                return {
                    x: 100 + i * 3 + Math.sin(i * 0.1) * 20 + jitter,
                    y: 200 + i * 2 + Math.cos(i * 0.1) * 15 + jitter,
                    timestamp: time,
                    type: 'mousemove'
                };
            }),
            
            // Natural typing with variations and pauses
            keystrokes: (() => {
                const text = "Hello, this is a natural human typing pattern with variations and occasional pauses.";
                return text.split('').map((char, i) => {
                    const baseDelay = 80;
                    const variation = Math.random() * 100; // 0-100ms variation
                    const pause = char === ' ' ? Math.random() * 200 : 0; // Pauses at spaces
                    return {
                        key: char,
                        timestamp: now + 2000 + i * baseDelay + variation + pause,
                        type: 'keydown',
                        keyCode: char.charCodeAt(0)
                    };
                });
            })(),
            
            // Natural clicking with slight imprecision
            clicks: [
                { x: 148 + Math.random() * 4, y: 252 + Math.random() * 4, timestamp: now + 8000, type: 'click' },
                { x: 203 + Math.random() * 4, y: 298 + Math.random() * 4, timestamp: now + 8500, type: 'click' },
                { x: 251 + Math.random() * 4, y: 347 + Math.random() * 4, timestamp: now + 9200, type: 'click' }
            ],
            
            // Natural scrolling patterns
            scrollEvents: Array.from({ length: 8 }, (_, i) => ({
                deltaY: 50 + Math.random() * 100,
                timestamp: now + 10000 + i * (200 + Math.random() * 500)
            })),
            
            // Natural form interactions with hesitation
            formInteractions: {
                'name': {
                    focusTime: now + 3000,
                    blurTime: now + 4200,
                    changes: 3,                    // Multiple changes (corrections)
                    totalKeystrokes: 25,          // Extra keystrokes for corrections
                    value: 'John Smith'
                },
                'email': {
                    focusTime: now + 4500,
                    blurTime: now + 6800,
                    changes: 2,
                    totalKeystrokes: 20,
                    value: 'john.smith@email.com'
                }
            },
            
            windowEvents: [
                { type: 'focus', timestamp: now + 1000 },
                { type: 'blur', timestamp: now + 5000 },
                { type: 'focus', timestamp: now + 5200 }
            ],
            
            touchEvents: [],
            
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 45000,      // Longer session
                totalMouseDistance: 2500,     // More mouse movement
                totalKeystrokes: 85,
                totalClicks: 12,
                totalScrolls: 8,
                interactionCount: 25,         // Higher interaction count
                focusChanges: 8,
                suspiciousPatterns: []        // No suspicious patterns
            }
        },
        
        processed: {
            totalSessionTime: 45000,
            mouseMovementVariance: 0.85,     // High variance (human-like)
            keystrokeVariance: 0.75,         // High variance (human-like)
            humanLikeScore: 0.9,             // High human-like score
            suspicionScore: 0.1              // Low suspicion score
        }
    };
    
    return { userId, behaviorData };
}

// Test the behavior analysis API
async function testBehaviorAnalysis(userId, behaviorData, testType) {
    const apiUrl = 'http://localhost:3003/api/behavior/track';
    
    console.log(`\n🔄 Testing ${testType} behavior...`);
    console.log(`📊 User ID: ${userId}`);
    console.log(`📊 Mouse movements: ${behaviorData.trackingData?.mouseMovements?.length || 0}`);
    console.log(`📊 Keystrokes: ${behaviorData.trackingData?.keystrokes?.length || 0}`);
    console.log(`📊 Session duration: ${behaviorData.trackingData?.sessionMetrics?.totalSessionTime || 0}ms`);
    console.log(`📊 Suspicious patterns: ${behaviorData.trackingData?.sessionMetrics?.suspiciousPatterns?.length || 0}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                behaviorData
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        console.log(`\n📊 ${testType} Test Results:`);
        console.log(`✅ Success: ${result.success}`);
        console.log(`🎯 Trust Score: ${Math.round(result.trustScore * 100)}%`);
        console.log(`📈 Trust Level: ${result.trustLevel}`);
        console.log(`🤖 Needs Captcha: ${result.needsCaptcha ? 'Yes' : 'No'}`);
        console.log(`🔧 AI Method: ${result.aiMethod}`);
        console.log(`📊 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
        
        if (result.reasons && result.reasons.length > 0) {
            console.log(`📋 Top Reasons:`);
            result.reasons.slice(0, 5).forEach((reason, i) => {
                console.log(`  ${i + 1}. ${reason}`);
            });
        }
        
        if (result.metadata) {
            console.log(`📄 Metadata:`, result.metadata);
        }
        
        // Verify the result
        const scorePercent = Math.round(result.trustScore * 100);
        if (testType === 'Bot') {
            if (scorePercent <= 50) {
                console.log(`\n✅ SUCCESS: Bot correctly detected with ${scorePercent}% trust score`);
                return true;
            } else {
                console.log(`\n❌ FAILURE: Bot incorrectly detected as human with ${scorePercent}% trust score`);
                return false;
            }
        } else {
            if (scorePercent > 50) {
                console.log(`\n✅ SUCCESS: Human correctly detected with ${scorePercent}% trust score`);
                return true;
            } else {
                console.log(`\n⚠️ WARNING: Human detected as bot with ${scorePercent}% trust score`);
                return false;
            }
        }
        
    } catch (error) {
        console.error(`\n❌ ${testType} test failed:`, error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🤖 Bot Detection Test Suite');
    console.log('===========================');
    console.log('Testing whether AI can correctly detect bot vs human behavior');
    console.log('Expected: Bot ≤50%, Human >50%\n');
    
    // Test 1: Bot behavior
    const { userId: botUserId, behaviorData: botData } = generateBotBehaviorData();
    const botTestResult = await testBehaviorAnalysis(botUserId, botData, 'Bot');
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Human behavior
    const { userId: humanUserId, behaviorData: humanData } = generateHumanBehaviorData();
    const humanTestResult = await testBehaviorAnalysis(humanUserId, humanData, 'Human');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`🤖 Bot Detection: ${botTestResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`👤 Human Detection: ${humanTestResult ? '✅ PASSED' : '⚠️ WARNING'}`);
    
    if (botTestResult) {
        console.log('\n🎉 SUCCESS: AI correctly identifies bot behavior!');
    } else {
        console.log('\n⚠️ ISSUE: AI may need tuning to better detect bots');
    }
}

// Check if running directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    generateBotBehaviorData,
    generateHumanBehaviorData,
    testBehaviorAnalysis,
    runTests
};