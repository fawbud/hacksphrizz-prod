#!/usr/bin/env python3
"""
AI Behavior Detection API
Provides AI-powered bot detection endpoint for the Next.js application
"""

import json
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys

app = Flask(__name__)
CORS(app)

# Global variables for model and feature extractor
model = None
feature_extractor = None

def load_model():
    """Load the trained AI model"""
    global model, feature_extractor
    try:
        model_path = '/Users/macbookair/Documents/Code/hacksphrizz/custom_behavior_model.pkl'
        
        if not os.path.exists(model_path):
            print(f"❌ Model file not found at {model_path}")
            return False
            
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
            
        # Extract the actual model from the saved data
        model = model_data['models'][model_data['best_model_name']]
        feature_extractor = None  # Will use manual feature extraction
        feature_names = model_data['feature_names']
        
        print("✅ AI model loaded successfully")
        print(f"🏆 Best model: {model_data['best_model_name']}")
        print(f"🔍 Feature count: {len(feature_names)}")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

def extract_behavior_features(behavior_data):
    """Extract features from behavior data for AI prediction (manual extraction)"""
    try:
        # Initialize feature vector
        features = []
        
        # Basic counters
        mouse_moves = len(behavior_data.get('mouseMovements', []))
        clicks = len(behavior_data.get('clicks', []))
        keystrokes = len(behavior_data.get('keystrokes', []))
        form_interactions = len(behavior_data.get('formInteractions', []))
        
        # Basic metrics (features 0-5)
        features.extend([
            mouse_moves,
            clicks, 
            keystrokes,
            form_interactions,
            behavior_data.get('pageViewTime', 0),
            behavior_data.get('suspiciousPatternCount', 0)
        ])
        
        # Mouse movement analysis (features 6-17)
        mouse_movements = behavior_data.get('mouseMovements', [])
        if mouse_movements:
            velocities = [m.get('velocity', 0) for m in mouse_movements]
            accelerations = [m.get('acceleration', 0) for m in mouse_movements]
            
            features.extend([
                np.mean(velocities) if velocities else 0,
                np.std(velocities) if velocities else 0,
                np.min(velocities) if velocities else 0,
                np.max(velocities) if velocities else 0,
                
                np.mean(accelerations) if accelerations else 0,
                np.std(accelerations) if accelerations else 0,
                np.min(accelerations) if accelerations else 0,
                np.max(accelerations) if accelerations else 0,
                
                # Additional mouse metrics
                sum(1 for m in mouse_movements if m.get('velocity', 0) > 1000),  # Fast movements
                sum(1 for m in mouse_movements if m.get('velocity', 0) < 10),   # Slow movements
                len([m for m in mouse_movements if m.get('pressure', 0) > 0.5]),  # High pressure
                sum(m.get('jitter', 0) for m in mouse_movements) / len(mouse_movements) if mouse_movements else 0
            ])
        else:
            features.extend([0] * 12)
        
        # Keystroke analysis (features 18-29)
        keystrokes_data = behavior_data.get('keystrokes', [])
        if keystrokes_data and len(keystrokes_data) > 1:
            intervals = []
            for i in range(1, len(keystrokes_data)):
                if 'timestamp' in keystrokes_data[i] and 'timestamp' in keystrokes_data[i-1]:
                    interval = keystrokes_data[i]['timestamp'] - keystrokes_data[i-1]['timestamp']
                    intervals.append(interval)
            
            if intervals:
                features.extend([
                    np.mean(intervals),
                    np.std(intervals),
                    np.min(intervals), 
                    np.max(intervals),
                    
                    # Typing patterns
                    sum(1 for ks in keystrokes_data if ks.get('key', '').isalpha()),  # Letter keys
                    sum(1 for ks in keystrokes_data if ks.get('key', '') in '0123456789'),  # Number keys
                    sum(1 for ks in keystrokes_data if ks.get('key', '') in ' .,!?'),  # Punctuation
                    sum(1 for ks in keystrokes_data if ks.get('key', '') in ['Backspace', 'Delete']),  # Corrections
                    
                    # Typing speed metrics
                    len(keystrokes_data) / (behavior_data.get('pageViewTime', 1) / 1000) if behavior_data.get('pageViewTime', 0) > 0 else 0,
                    sum(1 for i in intervals if i < 100),  # Very fast typing
                    sum(1 for i in intervals if i > 2000),  # Very slow typing
                    np.std([ks.get('pressure', 0) for ks in keystrokes_data]) if keystrokes_data else 0
                ])
            else:
                features.extend([0] * 12)
        else:
            features.extend([0] * 12)
        
        # Click analysis (features 30-41)
        clicks_data = behavior_data.get('clicks', [])
        if clicks_data:
            # Click timing
            if len(clicks_data) > 1:
                click_intervals = []
                for i in range(1, len(clicks_data)):
                    if 'timestamp' in clicks_data[i] and 'timestamp' in clicks_data[i-1]:
                        interval = clicks_data[i]['timestamp'] - clicks_data[i-1]['timestamp']
                        click_intervals.append(interval)
                
                if click_intervals:
                    features.extend([
                        np.mean(click_intervals),
                        np.std(click_intervals),
                        np.min(click_intervals),
                        np.max(click_intervals)
                    ])
                else:
                    features.extend([0] * 4)
            else:
                features.extend([0] * 4)
            
            # Click accuracy and patterns
            double_clicks = sum(1 for c in clicks_data if c.get('clickType') == 'double')
            right_clicks = sum(1 for c in clicks_data if c.get('button') == 2)
            click_accuracy = np.mean([c.get('accuracy', 0.5) for c in clicks_data])
            
            features.extend([
                double_clicks,
                right_clicks,
                click_accuracy,
                sum(c.get('pressure', 0) for c in clicks_data) / len(clicks_data) if clicks_data else 0,
                
                # Additional click metrics
                len([c for c in clicks_data if c.get('x', 0) < 100]),  # Edge clicks
                len([c for c in clicks_data if c.get('y', 0) < 100]),  # Top clicks
                sum(1 for c in clicks_data if c.get('duration', 0) < 50),  # Fast clicks
                sum(1 for c in clicks_data if c.get('duration', 0) > 500)   # Slow clicks
            ])
        else:
            features.extend([0] * 12)
        
        # Form interaction analysis (features 42-53)
        form_data = behavior_data.get('formInteractions', [])
        if form_data:
            focus_times = [f.get('focusTime', 0) for f in form_data]
            dwell_times = [f.get('dwellTime', 0) for f in form_data]
            
            features.extend([
                np.mean(focus_times) if focus_times else 0,
                np.std(focus_times) if focus_times else 0,
                np.mean(dwell_times) if dwell_times else 0,
                np.std(dwell_times) if dwell_times else 0,
                
                # Form interaction patterns
                sum(1 for f in form_data if f.get('interactionType') == 'input'),
                sum(1 for f in form_data if f.get('interactionType') == 'select'),
                sum(1 for f in form_data if f.get('interactionType') == 'textarea'),
                sum(f.get('changeCount', 0) for f in form_data),
                
                # Form completion metrics
                len([f for f in form_data if f.get('value', '') != '']),  # Filled fields
                np.mean([len(str(f.get('value', ''))) for f in form_data]),  # Average input length
                sum(1 for f in form_data if f.get('tabOrder', 0) > 0),  # Tab navigation
                sum(f.get('validationErrors', 0) for f in form_data)  # Validation errors
            ])
        else:
            features.extend([0] * 12)
        
        # Additional behavioral metrics (features 54-61)
        features.extend([
            behavior_data.get('scrollDistance', 0),
            behavior_data.get('idleTime', 0),
            len(behavior_data.get('focusEvents', [])),
            len(behavior_data.get('blurEvents', [])),
            behavior_data.get('mouseJitter', 0),
            behavior_data.get('irregularPatterns', 0),
            behavior_data.get('clickAccuracy', 0.5),
            behavior_data.get('typingRhythm', 0.5)
        ])
        
        print(f"🔧 Extracted {len(features)} features")
        return np.array(features)
        
    except Exception as e:
        print(f"❌ Feature extraction error: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'service': 'AI Behavior Detection API'
    })

@app.route('/predict-ai', methods=['POST'])
def predict_ai_behavior():
    """AI-powered behavior prediction endpoint"""
    try:
        if model is None:
            return jsonify({
                'error': 'AI model not loaded',
                'trust_score': 0,
                'prediction': 'bot',
                'confidence': 0,
                'method': 'ai'
            }), 500
        
        # Get behavior data from request
        behavior_data = request.json
        
        if not behavior_data:
            return jsonify({
                'error': 'No behavior data provided',
                'trust_score': 0,
                'prediction': 'bot',
                'confidence': 0,
                'method': 'ai'
            }), 400
        
        print(f"🤖 Received behavior data: {len(str(behavior_data))} characters")
        
        # Extract features manually
        features = extract_behavior_features(behavior_data)
        if features is None:
            return jsonify({
                'error': 'Feature extraction failed',
                'trust_score': 0,
                'prediction': 'bot',
                'confidence': 0,
                'method': 'ai'
            }), 500
        
        # Make prediction
        features_reshaped = features.reshape(1, -1)
        prediction = model.predict(features_reshaped)[0]
        confidence = model.predict_proba(features_reshaped)[0].max()
        
        # Convert to trust score (0-100)
        if prediction == 1:  # Human
            trust_score = int(confidence * 100)
            prediction_label = 'human'
        else:  # Bot
            trust_score = int((1 - confidence) * 100)
            prediction_label = 'bot'
        
        print(f"🎯 AI Prediction: {prediction_label} (confidence: {confidence:.3f}, trust: {trust_score}%)")
        
        return jsonify({
            'trust_score': trust_score,
            'prediction': prediction_label,
            'confidence': float(confidence),
            'method': 'ai',
            'features_extracted': len(features),
            'model_type': 'RandomForest'
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        return jsonify({
            'error': str(e),
            'trust_score': 0,
            'prediction': 'bot',
            'confidence': 0,
            'method': 'ai'
        }), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded AI model"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    return jsonify({
        'model_type': type(model).__name__,
        'feature_count': 62,  # Fixed feature count
        'status': 'loaded',
        'features': [
            'mouse_moves', 'clicks', 'keystrokes', 'form_interactions', 'page_view_time', 'suspicious_patterns',
            'mouse_velocity_mean', 'mouse_velocity_std', 'mouse_velocity_min', 'mouse_velocity_max',
            'mouse_accel_mean', 'mouse_accel_std', 'mouse_accel_min', 'mouse_accel_max',
            'fast_movements', 'slow_movements', 'high_pressure_moves', 'mouse_jitter',
            'keystroke_interval_mean', 'keystroke_interval_std', 'keystroke_interval_min', 'keystroke_interval_max',
            'letter_keys', 'number_keys', 'punctuation_keys', 'correction_keys',
            'typing_speed', 'fast_typing', 'slow_typing', 'keystroke_pressure_std',
            'click_interval_mean', 'click_interval_std', 'click_interval_min', 'click_interval_max',
            'double_clicks', 'right_clicks', 'click_accuracy_mean', 'click_pressure_mean',
            'edge_clicks', 'top_clicks', 'fast_clicks', 'slow_clicks',
            'focus_time_mean', 'focus_time_std', 'dwell_time_mean', 'dwell_time_std',
            'input_interactions', 'select_interactions', 'textarea_interactions', 'change_count',
            'filled_fields', 'avg_input_length', 'tab_navigation', 'validation_errors',
            'scroll_distance', 'idle_time', 'focus_events', 'blur_events',
            'mouse_jitter_metric', 'irregular_patterns', 'click_accuracy_metric', 'typing_rhythm'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting AI Behavior Detection API...")
    
    # Load the AI model
    if not load_model():
        print("❌ Failed to load AI model. Exiting...")
        sys.exit(1)
    
    print("🌐 API Server starting on http://localhost:5001")
    print("📊 Endpoints:")
    print("  - GET /health - Health check")
    print("  - POST /predict-ai - AI behavior prediction")
    print("  - GET /model-info - Model information")
    
    app.run(host='0.0.0.0', port=5001, debug=True)