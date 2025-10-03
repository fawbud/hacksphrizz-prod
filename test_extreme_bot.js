#!/usr/bin/env node

/**
 * Aggressive Bot Simulation Script
 * Creates extremely obvious bot patterns that should score ≤30%
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function generateExtremelyObviousBotData() {
    const now = Date.now();
    const userId = `extreme-bot-${now}`;
    
    // Create behavior data with EXTREME bot patterns
    const behaviorData = {
        trackingData: {
            // PERFECT linear mouse movements (major bot indicator)
            mouseMovements: Array.from({ length: 100 }, (_, i) => ({
                x: 100 + i * 5,              // PERFECT linear progression
                y: 200 + i * 3,              // PERFECT linear progression  
                timestamp: now + i * 50,      // EXACTLY 50ms intervals
                type: 'mousemove'
            })),
            
            // PERFECTLY timed keystrokes (major bot indicator)
            keystrokes: Array.from({ length: 50 }, (_, i) => ({
                key: String.fromCharCode(97 + (i % 26)), // Perfect a-z pattern
                timestamp: now + 2000 + i * 100,         // EXACTLY 100ms intervals
                type: 'keydown',
                keyCode: 97 + (i % 26)
            })),
            
            // PERFECTLY placed clicks (bot indicator)
            clicks: Array.from({ length: 10 }, (_, i) => ({
                x: 100 + i * 50,            // PERFECT spacing
                y: 200 + i * 30,            // PERFECT spacing
                timestamp: now + 5000 + i * 500, // EXACTLY 500ms intervals
                type: 'click'
            })),
            
            // NO scrolling (bots often don't scroll)
            scrollEvents: [],
            
            // EXTREMELY robotic form interactions
            formInteractions: {
                'field1': {
                    focusTime: now + 1000,
                    blurTime: now + 1100,        // EXACTLY 100ms focus time
                    changes: 1,                  // NO corrections (bot indicator)
                    totalKeystrokes: 5,
                    value: 'robot'
                },
                'field2': {
                    focusTime: now + 1200,
                    blurTime: now + 1300,        // EXACTLY 100ms focus time
                    changes: 1,                  // NO corrections
                    totalKeystrokes: 10,
                    value: 'automated'
                }
            },
            
            windowEvents: [],
            touchEvents: [],
            
            // Session metrics with EXTREME bot indicators
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 3000,         // VERY short session
                totalMouseDistance: 500,        // Minimal distance
                totalKeystrokes: 50,
                totalClicks: 10,
                totalScrolls: 0,                // NO scrolling
                interactionCount: 3,            // VERY low interaction
                focusChanges: 2,                // Minimal focus changes
                suspiciousPatterns: [           // MANY suspicious patterns
                    'perfect_timing',
                    'linear_movement',
                    'no_hesitation',
                    'perfect_precision',
                    'constant_speed',
                    'no_corrections',
                    'robotic_pattern',
                    'too_fast',
                    'no_natural_pauses',
                    'geometric_precision'
                ]
            }
        },
        
        // Additional EXTREME bot indicators
        processed: {
            totalSessionTime: 3000,
            mouseMovementVariance: 0.0,        // ZERO variance (perfect bot indicator)
            keystrokeVariance: 0.0,            // ZERO variance (perfect bot indicator)
            humanLikeScore: 0.0,               // ZERO human-like behavior
            suspicionScore: 1.0                // MAXIMUM suspicion
        }
    };
    
    return { userId, behaviorData };
}

// Generate super-human data for comparison (should score >80%)
function generateSuperHumanData() {
    const now = Date.now();
    const userId = `super-human-${now}`;
    
    const behaviorData = {
        trackingData: {
            // VERY natural mouse movements with curves, jitter, hesitation
            mouseMovements: Array.from({ length: 300 }, (_, i) => {
                const time = now + i * (30 + Math.random() * 150); // Very variable timing 30-180ms
                const jitter = (Math.random() - 0.5) * 8;          // High natural jitter
                const hesitation = Math.random() < 0.1 ? Math.random() * 500 : 0; // Random hesitation
                return {
                    x: 100 + i * 2 + Math.sin(i * 0.05) * 30 + jitter + (Math.random() - 0.5) * 10,
                    y: 200 + i * 1.5 + Math.cos(i * 0.03) * 25 + jitter + (Math.random() - 0.5) * 10,
                    timestamp: time + hesitation,
                    type: 'mousemove'
                };
            }),
            
            // VERY natural typing with lots of variations, corrections, pauses
            keystrokes: (() => {
                const text = "Hello! This is a very natural human typing pattern with lots of corrections, pauses, and variations in speed. Sometimes I type fast, sometimes slow, and I make mistakes that I correct.";
                const keystrokes = [];
                let time = now + 5000;
                
                for (let i = 0; i < text.length; i++) {
                    const char = text[i];
                    const baseDelay = 60 + Math.random() * 200;  // 60-260ms variation
                    const wordPause = char === ' ' ? Math.random() * 800 : 0; // Long word pauses
                    const thinkingPause = Math.random() < 0.05 ? Math.random() * 2000 : 0; // Thinking pauses
                    
                    // Add some typos and corrections
                    if (Math.random() < 0.03 && char !== ' ') {
                        // Typo
                        keystrokes.push({
                            key: String.fromCharCode(97 + Math.floor(Math.random() * 26)),
                            timestamp: time,
                            type: 'keydown',
                            keyCode: 97 + Math.floor(Math.random() * 26)
                        });
                        time += 50 + Math.random() * 100;
                        
                        // Backspace
                        keystrokes.push({
                            key: 'Backspace',
                            timestamp: time,
                            type: 'keydown',
                            keyCode: 8
                        });
                        time += 100 + Math.random() * 200;
                    }
                    
                    keystrokes.push({
                        key: char,
                        timestamp: time,
                        type: 'keydown',
                        keyCode: char.charCodeAt(0)
                    });
                    
                    time += baseDelay + wordPause + thinkingPause;
                }
                
                return keystrokes;
            })(),
            
            // Natural clicking with imprecision
            clicks: Array.from({ length: 15 }, (_, i) => ({
                x: 150 + i * 30 + (Math.random() - 0.5) * 20,  // Natural imprecision
                y: 250 + i * 20 + (Math.random() - 0.5) * 15,  // Natural imprecision
                timestamp: now + 10000 + i * (300 + Math.random() * 1000), // Variable timing
                type: 'click'
            })),
            
            // Natural scrolling patterns
            scrollEvents: Array.from({ length: 20 }, (_, i) => ({
                deltaY: 50 + Math.random() * 200,
                timestamp: now + 15000 + i * (200 + Math.random() * 800)
            })),
            
            // Natural form interactions with corrections
            formInteractions: {
                'name': {
                    focusTime: now + 8000,
                    blurTime: now + 12000,       // Long focus time (human-like)
                    changes: 5,                  // Many corrections (human-like)
                    totalKeystrokes: 35,         // Extra keystrokes for corrections
                    value: 'Sarah Johnson'
                },
                'email': {
                    focusTime: now + 13000,
                    blurTime: now + 18000,       // Long focus time
                    changes: 3,                  // Some corrections
                    totalKeystrokes: 28,
                    value: 'sarah.johnson@gmail.com'
                },
                'message': {
                    focusTime: now + 20000,
                    blurTime: now + 45000,       // Very long focus time
                    changes: 8,                  // Many corrections
                    totalKeystrokes: 120,        // Lots of typing
                    value: 'This is a natural human message with corrections and thoughts...'
                }
            },
            
            windowEvents: [
                { type: 'focus', timestamp: now + 1000 },
                { type: 'blur', timestamp: now + 25000 },
                { type: 'focus', timestamp: now + 26000 },
                { type: 'blur', timestamp: now + 35000 },
                { type: 'focus', timestamp: now + 36000 }
            ],
            
            touchEvents: [],
            
            sessionMetrics: {
                startTime: now,
                totalSessionTime: 120000,       // Long session (2 minutes)
                totalMouseDistance: 5000,       // Lots of mouse movement
                totalKeystrokes: 180,
                totalClicks: 15,
                totalScrolls: 20,
                interactionCount: 45,           // High interaction count
                focusChanges: 12,               // Many focus changes
                suspiciousPatterns: []          // NO suspicious patterns
            }
        },
        
        processed: {
            totalSessionTime: 120000,
            mouseMovementVariance: 0.95,       // Very high variance (human-like)
            keystrokeVariance: 0.9,            // Very high variance (human-like)
            humanLikeScore: 0.98,              // Very high human-like score
            suspicionScore: 0.02               // Very low suspicion
        }
    };
    
    return { userId, behaviorData };
}

async function testExtremeDetection() {
    console.log('🤖 EXTREME Bot Detection Test');
    console.log('==============================');
    console.log('Testing with EXTREMELY obvious bot patterns vs VERY human patterns');
    console.log('Expected: Extreme Bot ≤30%, Super Human >80%\n');
    
    // Test 1: Extreme Bot
    const { userId: botUserId, behaviorData: botData } = generateExtremelyObviousBotData();
    const apiUrl = 'http://localhost:3003/api/behavior/track';
    
    console.log('🔄 Testing EXTREME Bot behavior...');
    console.log(`📊 User ID: ${botUserId}`);
    console.log(`📊 Mouse movements: ${botData.trackingData.mouseMovements.length} (perfect linear)`);
    console.log(`📊 Keystrokes: ${botData.trackingData.keystrokes.length} (perfect timing)`);
    console.log(`📊 Mouse variance: ${botData.processed.mouseMovementVariance} (zero = perfect bot)`);
    console.log(`📊 Keystroke variance: ${botData.processed.keystrokeVariance} (zero = perfect bot)`);
    console.log(`📊 Suspicious patterns: ${botData.trackingData.sessionMetrics.suspiciousPatterns.length}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: botUserId, behaviorData: botData })
        });
        
        const result = await response.json();
        const scorePercent = Math.round(result.trustScore * 100);
        
        console.log(`\n📊 EXTREME Bot Results:`);
        console.log(`🎯 Trust Score: ${scorePercent}%`);
        console.log(`📈 Trust Level: ${result.trustLevel}`);
        console.log(`🤖 Needs Captcha: ${result.needsCaptcha}`);
        console.log(`🔧 AI Method: ${result.aiMethod}`);
        console.log(`📊 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
        
        if (scorePercent <= 30) {
            console.log(`\n✅ EXCELLENT: Extreme bot correctly detected with ${scorePercent}%`);
        } else if (scorePercent <= 50) {
            console.log(`\n⚠️ GOOD: Bot detected with ${scorePercent}% (could be more aggressive)`);
        } else {
            console.log(`\n❌ FAILED: Extreme bot not detected with ${scorePercent}%`);
        }
        
    } catch (error) {
        console.error('❌ Extreme bot test failed:', error.message);
    }
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Super Human
    const { userId: humanUserId, behaviorData: humanData } = generateSuperHumanData();
    
    console.log('\n🔄 Testing SUPER Human behavior...');
    console.log(`📊 User ID: ${humanUserId}`);
    console.log(`📊 Mouse movements: ${humanData.trackingData.mouseMovements.length} (very natural)`);
    console.log(`📊 Keystrokes: ${humanData.trackingData.keystrokes.length} (with corrections)`);
    console.log(`📊 Mouse variance: ${humanData.processed.mouseMovementVariance} (high = human-like)`);
    console.log(`📊 Keystroke variance: ${humanData.processed.keystrokeVariance} (high = human-like)`);
    console.log(`📊 Form corrections: Multiple fields with corrections`);
    console.log(`📊 Session time: ${humanData.trackingData.sessionMetrics.totalSessionTime}ms (long)`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: humanUserId, behaviorData: humanData })
        });
        
        const result = await response.json();
        const scorePercent = Math.round(result.trustScore * 100);
        
        console.log(`\n📊 SUPER Human Results:`);
        console.log(`🎯 Trust Score: ${scorePercent}%`);
        console.log(`📈 Trust Level: ${result.trustLevel}`);
        console.log(`🤖 Needs Captcha: ${result.needsCaptcha}`);
        console.log(`🔧 AI Method: ${result.aiMethod}`);
        console.log(`📊 Confidence: ${Math.round((result.confidence || 0) * 100)}%`);
        
        if (scorePercent > 80) {
            console.log(`\n✅ EXCELLENT: Super human correctly detected with ${scorePercent}%`);
        } else if (scorePercent > 60) {
            console.log(`\n⚠️ GOOD: Human detected with ${scorePercent}% (could be higher)`);
        } else {
            console.log(`\n❌ FAILED: Super human incorrectly detected as bot with ${scorePercent}%`);
        }
        
    } catch (error) {
        console.error('❌ Super human test failed:', error.message);
    }
    
    console.log('\n🏁 Extreme detection test completed');
}

if (require.main === module) {
    testExtremeDetection().catch(console.error);
}

module.exports = { testExtremeDetection };