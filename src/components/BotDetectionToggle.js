'use client';

import { useState, useEffect } from 'react';
import { BehaviorTracker } from '../utils/behaviorTracker';

export default function BotDetectionToggle() {
  const [detectionMethod, setDetectionMethod] = useState('rule-based');
  const [isTracking, setIsTracking] = useState(false);
  const [tracker, setTracker] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const [testRunning, setTestRunning] = useState(false);

  // Initialize tracker
  useEffect(() => {
    const behaviorTracker = new BehaviorTracker(userId);
    setTracker(behaviorTracker);
    
    return () => {
      if (behaviorTracker) {
        // Cleanup event listeners if needed
      }
    };
  }, [userId]);

  const startTracking = () => {
    if (tracker) {
      setIsTracking(true);
      console.log(`🔍 Started ${detectionMethod} tracking for user: ${userId}`);
    }
  };

  const stopTracking = () => {
    setIsTracking(false);
    console.log('⏹️ Stopped behavior tracking');
  };

  const testBotDetection = async () => {
    if (!tracker || testRunning) return;
    
    setTestRunning(true);
    try {
      console.log(`🧪 Testing ${detectionMethod} bot detection...`);
      
      if (detectionMethod === 'rule-based') {
        // Test with existing rule-based system
        const metrics = tracker.generateMetrics();
        const response = await fetch('/api/behavior/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            metrics: metrics
          })
        });
        
        const result = await response.json();
        setLastResult({
          method: 'Rule-Based',
          trustScore: result.trustScore,
          prediction: result.trustLevel === 'High' ? 'human' : 'bot',
          confidence: result.trustScore / 100,
          details: result.reasons?.join(', ') || 'No details available'
        });
        
      } else {
        // Test with AI model
        const behaviorData = {
          mouseMovements: tracker.data.mouseData.movements.map(m => ({
            velocity: m.speed,
            acceleration: Math.random() * 100,
            pressure: Math.random() * 0.5 + 0.3,
            jitter: Math.random() * 10
          })),
          clicks: tracker.data.mouseData.clicks.map(c => ({
            timestamp: c.timestamp,
            x: c.position.x,
            y: c.position.y,
            button: 1,
            clickType: 'single',
            accuracy: c.accuracy,
            pressure: Math.random() * 0.5 + 0.3,
            duration: Math.random() * 200 + 50
          })),
          keystrokes: tracker.data.typingData.keystrokes.map(k => ({
            timestamp: k.timestamp,
            key: k.key,
            pressure: Math.random() * 0.5 + 0.3
          })),
          formInteractions: [{
            interactionType: 'input',
            focusTime: Math.random() * 5000 + 1000,
            dwellTime: Math.random() * 3000 + 500,
            changeCount: Math.floor(Math.random() * 10),
            value: 'test input',
            tabOrder: 1,
            validationErrors: 0
          }],
          pageViewTime: tracker.data.sessionData.timeOnPage,
          suspiciousPatternCount: 0,
          scrollDistance: Math.random() * 1000,
          idleTime: Math.random() * 5000,
          focusEvents: ['focus'],
          blurEvents: [],
          mouseJitter: Math.random() * 20,
          irregularPatterns: 0,
          clickAccuracy: tracker.data.mouseData.clickAccuracy,
          typingRhythm: 0.8
        };
        
        const response = await fetch('http://localhost:5001/predict-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(behaviorData)
        });
        
        if (!response.ok) {
          throw new Error('AI API not available');
        }
        
        const result = await response.json();
        setLastResult({
          method: 'AI Model',
          trustScore: result.trust_score,
          prediction: result.prediction,
          confidence: result.confidence,
          details: `Model: ${result.model_type}, Features: ${result.features_extracted}`
        });
      }
      
    } catch (error) {
      console.error('Test error:', error);
      setLastResult({
        method: detectionMethod === 'rule-based' ? 'Rule-Based' : 'AI Model',
        trustScore: 0,
        prediction: 'error',
        confidence: 0,
        details: `Error: ${error.message}`
      });
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🤖 Bot Detection System Test
        </h2>
        <p className="text-gray-600">
          Toggle between Rule-Based and AI-powered bot detection methods
        </p>
      </div>

      {/* Detection Method Toggle */}
      <div className="mb-8">
        <label className="block text-lg font-semibold text-gray-700 mb-4">
          Detection Method:
        </label>
        <div className="flex bg-gray-100 rounded-lg p-1 max-w-md">
          <button
            onClick={() => setDetectionMethod('rule-based')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              detectionMethod === 'rule-based'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Rule-Based
          </button>
          <button
            onClick={() => setDetectionMethod('ai')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              detectionMethod === 'ai'
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            🧠 AI Model
          </button>
        </div>
      </div>

      {/* Method Info */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">
          {detectionMethod === 'rule-based' ? '📊 Rule-Based Detection' : '🧠 AI Model Detection'}
        </h3>
        <p className="text-gray-600">
          {detectionMethod === 'rule-based' 
            ? 'Uses predefined rules to analyze mouse movement patterns, typing behavior, and interaction timing. Lightweight and fast.'
            : 'Uses a trained machine learning model (RandomForest) with 62 behavioral features for accurate bot detection. More sophisticated analysis.'
          }
        </p>
      </div>

      {/* User Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-1">Test Session Info:</h4>
        <p className="text-blue-600 text-sm">User ID: {userId}</p>
        <p className="text-blue-600 text-sm">
          Status: {isTracking ? '🟢 Tracking active' : '🔴 Not tracking'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={startTracking}
          disabled={isTracking}
          className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isTracking ? '✅ Tracking...' : '▶️ Start Tracking'}
        </button>
        
        <button
          onClick={stopTracking}
          disabled={!isTracking}
          className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          ⏹️ Stop Tracking
        </button>
        
        <button
          onClick={testBotDetection}
          disabled={testRunning}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {testRunning ? '🔄 Testing...' : '🧪 Test Detection'}
        </button>
      </div>

      {/* Results */}
      {lastResult && (
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🎯 Detection Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Method</h4>
              <p className="text-lg text-blue-600">{lastResult.method}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Trust Score</h4>
              <p className="text-2xl font-bold text-green-600">{lastResult.trustScore}%</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Prediction</h4>
              <p className={`text-lg font-bold ${
                lastResult.prediction === 'human' ? 'text-green-600' : 
                lastResult.prediction === 'bot' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {lastResult.prediction === 'human' ? '👤 Human' : 
                 lastResult.prediction === 'bot' ? '🤖 Bot' : '⚠️ Error'}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold text-gray-700 mb-2">Confidence</h4>
              <p className="text-lg text-purple-600">
                {(lastResult.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <h4 className="font-semibold text-gray-700 mb-2">Details</h4>
            <p className="text-gray-600 text-sm">{lastResult.details}</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-2">💡 Instructions:</h4>
        <ol className="text-yellow-700 text-sm space-y-1">
          <li>1. Choose detection method (Rule-Based or AI)</li>
          <li>2. Click "Start Tracking" to begin monitoring behavior</li>
          <li>3. Move your mouse, click, and type to generate behavior data</li>
          <li>4. Click "Test Detection" to analyze your behavior patterns</li>
          <li>5. Compare results between different detection methods</li>
        </ol>
      </div>
    </div>
  );
}