#!/usr/bin/env python3
"""
Custom Behavior Classification Model
Trains AI model to detect bot vs human behavior
"""

import numpy as np
import pandas as pd
import json
import pickle
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

class BehaviorClassifier:
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_names = []
        self.best_model = None
        self.best_model_name = ""
        self.feature_importance = {}
    
    def extract_features(self, session_data):
        """Extract numerical features from behavior session"""
        features = []
        
        # Basic session metrics
        features.extend([
            session_data.get('session_duration', 0) / 1000,  # Convert to seconds
            len(session_data.get('mouse_movements', [])),
            len(session_data.get('keystrokes', [])),
            len(session_data.get('clicks', [])),
            len(session_data.get('scroll_events', [])),
            len(session_data.get('window_events', [])),
            len(session_data.get('suspicious_patterns', [])),
        ])
        
        # Mouse behavior features
        mouse_data = session_data.get('mouse_movements', [])
        if mouse_data:
            velocities = [m.get('velocity', 0) for m in mouse_data if 'velocity' in m]
            accelerations = [m.get('acceleration', 0) for m in mouse_data if 'acceleration' in m]
            
            if velocities:
                features.extend([
                    np.mean(velocities),
                    np.std(velocities),
                    np.min(velocities),
                    np.max(velocities),
                    np.median(velocities),
                ])
            else:
                features.extend([0, 0, 0, 0, 0])
            
            if accelerations:
                features.extend([
                    np.mean(np.abs(accelerations)),  # Mean absolute acceleration
                    np.std(accelerations),           # Acceleration variance
                    len([a for a in accelerations if abs(a) < 1]),  # Low acceleration count
                ])
            else:
                features.extend([0, 0, 0])
            
            # Mouse movement patterns
            if len(mouse_data) > 1:
                distances = []
                for i in range(1, len(mouse_data)):
                    dx = mouse_data[i]['x'] - mouse_data[i-1]['x']
                    dy = mouse_data[i]['y'] - mouse_data[i-1]['y']
                    distances.append(np.sqrt(dx*dx + dy*dy))
                
                features.extend([
                    np.sum(distances),      # Total distance
                    np.mean(distances) if distances else 0,     # Average step
                    np.std(distances) if len(distances) > 1 else 0,   # Step variance
                ])
            else:
                features.extend([0, 0, 0])
        else:
            features.extend([0] * 11)  # 11 mouse features
        
        # Keystroke behavior features
        keystroke_data = session_data.get('keystrokes', [])
        if keystroke_data:
            intervals = [k.get('interval', 0) for k in keystroke_data if k.get('interval', 0) > 0]
            dwell_times = [k.get('dwellTime', 0) for k in keystroke_data if 'dwellTime' in k]
            corrections = [k for k in keystroke_data if k.get('isCorrection', False)]
            
            if intervals:
                features.extend([
                    np.mean(intervals),
                    np.std(intervals),
                    np.min(intervals),
                    np.max(intervals),
                    len([i for i in intervals if i < 100]),  # Fast keystrokes
                    len([i for i in intervals if i > 1000]), # Long pauses
                ])
            else:
                features.extend([0, 0, 0, 0, 0, 0])
            
            if dwell_times:
                features.extend([
                    np.mean(dwell_times),
                    np.std(dwell_times),
                ])
            else:
                features.extend([0, 0])
            
            # Correction patterns
            features.extend([
                len(corrections),                           # Total corrections
                len(corrections) / max(len(keystroke_data), 1),  # Correction rate
            ])
        else:
            features.extend([0] * 10)  # 10 keystroke features
        
        # Form interaction features
        form_data = session_data.get('form_interactions', {})
        if form_data:
            focus_times = [f.get('focusTime', 0) for f in form_data.values()]
            input_counts = [f.get('inputCount', 0) for f in form_data.values()]
            corrections = [f.get('corrections', 0) for f in form_data.values()]
            hesitations = [f.get('hesitations', 0) for f in form_data.values()]
            focus_counts = [f.get('focusCount', 1) for f in form_data.values()]
            
            features.extend([
                len(form_data),                    # Number of fields
                np.mean(focus_times) if focus_times else 0,
                np.std(focus_times) if len(focus_times) > 1 else 0,
                np.sum(input_counts),              # Total inputs
                np.sum(corrections),               # Total corrections
                np.sum(hesitations),               # Total hesitations
                np.mean(focus_counts) if focus_counts else 0,
                np.sum(focus_counts),              # Total refocuses
            ])
        else:
            features.extend([0] * 8)  # 8 form features
        
        # Click behavior features
        click_data = session_data.get('clicks', [])
        if click_data:
            accuracies = [c.get('accuracy', 0) for c in click_data if 'accuracy' in c]
            pressures = [c.get('pressure', 0) for c in click_data if 'pressure' in c]
            
            if len(click_data) > 1:
                # Calculate click intervals
                click_intervals = []
                for i in range(1, len(click_data)):
                    interval = click_data[i]['timestamp'] - click_data[i-1]['timestamp']
                    click_intervals.append(interval)
                
                features.extend([
                    np.mean(click_intervals) if click_intervals else 0,
                    np.std(click_intervals) if len(click_intervals) > 1 else 0,
                ])
            else:
                features.extend([0, 0])
            
            features.extend([
                np.mean(accuracies) if accuracies else 0,
                np.std(accuracies) if len(accuracies) > 1 else 0,
                np.mean(pressures) if pressures else 0,
            ])
        else:
            features.extend([0] * 5)  # 5 click features
        
        # Scroll behavior features
        scroll_data = session_data.get('scroll_events', [])
        if scroll_data:
            delta_ys = [s.get('deltaY', 0) for s in scroll_data if 'deltaY' in s]
            smoothness = [s.get('smoothness', 0) for s in scroll_data if 'smoothness' in s]
            
            features.extend([
                len(scroll_data),
                np.mean(np.abs(delta_ys)) if delta_ys else 0,
                np.std(delta_ys) if len(delta_ys) > 1 else 0,
                np.mean(smoothness) if smoothness else 0,
            ])
        else:
            features.extend([0, 0, 0, 0])  # 4 scroll features
        
        # Advanced metrics from the session
        metrics = session_data.get('metrics', {})
        features.extend([
            metrics.get('mouse_velocity_variance', 0),
            metrics.get('keystroke_interval_variance', 0),
            metrics.get('mouse_jitter', 0),
            metrics.get('total_corrections', 0),
            metrics.get('total_hesitations', 0),
            metrics.get('focus_changes', 0),
            metrics.get('click_accuracy', 0),
            metrics.get('typing_rhythm_consistency', 0),
        ])
        
        # Suspicious pattern analysis
        suspicious_patterns = session_data.get('suspicious_patterns', [])
        pattern_types = ['consistent_velocity', 'regular_typing', 'no_corrections', 'low_jitter']
        for pattern_type in pattern_types:
            count = sum(1 for p in suspicious_patterns if p.get('type') == pattern_type)
            features.append(count)
        
        # Ratios and derived features
        total_events = (len(session_data.get('mouse_movements', [])) + 
                       len(session_data.get('keystrokes', [])) + 
                       len(session_data.get('clicks', [])))
        
        if total_events > 0:
            features.extend([
                len(session_data.get('mouse_movements', [])) / total_events,  # Mouse ratio
                len(session_data.get('keystrokes', [])) / total_events,       # Keystroke ratio
                len(session_data.get('clicks', [])) / total_events,          # Click ratio
            ])
        else:
            features.extend([0, 0, 0])
        
        # Session efficiency metrics
        session_duration_sec = session_data.get('session_duration', 1) / 1000
        features.extend([
            total_events / session_duration_sec,  # Events per second
            len(session_data.get('suspicious_patterns', [])) / max(total_events, 1),  # Suspicion ratio
        ])
        
        return features
    
    def prepare_data(self, training_data):
        """Prepare features and labels for training"""
        print("🔧 Extracting features from training data...")
        
        X = []
        y = []
        
        for i, session in enumerate(training_data):
            if i % 500 == 0:
                print(f"  Progress: {i}/{len(training_data)}")
            
            try:
                features = self.extract_features(session)
                label = 1 if session['label'] == 'human' else 0  # 1 = human, 0 = bot
                
                X.append(features)
                y.append(label)
            except Exception as e:
                print(f"  Error processing sample {i}: {e}")
                continue
        
        # Define feature names for interpretability
        self.feature_names = [
            # Basic metrics (7 features)
            'session_duration_sec', 'mouse_count', 'keystroke_count', 'click_count', 
            'scroll_count', 'window_event_count', 'suspicious_pattern_count',
            
            # Mouse features (11 features)
            'mouse_velocity_mean', 'mouse_velocity_std', 'mouse_velocity_min', 
            'mouse_velocity_max', 'mouse_velocity_median', 'mouse_accel_mean', 
            'mouse_accel_std', 'low_accel_count', 'total_mouse_distance', 
            'avg_mouse_step', 'mouse_step_variance',
            
            # Keystroke features (10 features)
            'keystroke_interval_mean', 'keystroke_interval_std', 'keystroke_interval_min',
            'keystroke_interval_max', 'fast_keystroke_count', 'long_pause_count',
            'dwell_time_mean', 'dwell_time_std', 'total_corrections', 'correction_rate',
            
            # Form features (8 features)
            'form_field_count', 'focus_time_mean', 'focus_time_std', 'total_inputs',
            'total_form_corrections', 'total_hesitations', 'avg_focus_count', 'total_refocuses',
            
            # Click features (5 features)
            'click_interval_mean', 'click_interval_std', 'click_accuracy_mean',
            'click_accuracy_std', 'click_pressure_mean',
            
            # Scroll features (4 features)
            'scroll_event_count', 'scroll_delta_mean', 'scroll_delta_std', 'scroll_smoothness_mean',
            
            # Advanced metrics (8 features)
            'mouse_velocity_variance', 'keystroke_interval_variance', 'mouse_jitter',
            'metric_total_corrections', 'metric_total_hesitations', 'metric_focus_changes',
            'metric_click_accuracy', 'typing_rhythm_consistency',
            
            # Pattern features (4 features)
            'consistent_velocity_pattern', 'regular_typing_pattern', 'no_corrections_pattern', 'low_jitter_pattern',
            
            # Ratio features (3 features)
            'mouse_ratio', 'keystroke_ratio', 'click_ratio',
            
            # Efficiency features (2 features)
            'events_per_second', 'suspicion_ratio'
        ]
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"✅ Extracted {X.shape[1]} features from {X.shape[0]} samples")
        print(f"📊 Expected feature count: {len(self.feature_names)}")
        print(f"📊 Actual feature count: {X.shape[1]}")
        
        if X.shape[1] != len(self.feature_names):
            print("⚠️ Feature count mismatch! Adjusting feature names...")
            # Adjust feature names to match actual feature count
            if X.shape[1] < len(self.feature_names):
                self.feature_names = self.feature_names[:X.shape[1]]
            else:
                for i in range(len(self.feature_names), X.shape[1]):
                    self.feature_names.append(f'feature_{i}')
        
        return X, y
    
    def train_models(self, X_train, X_test, y_train, y_test):
        """Train multiple models and compare performance"""
        print("🚀 Training multiple models...")
        
        # Define models to train
        models_to_train = {
            'RandomForest': RandomForestClassifier(
                n_estimators=100, 
                max_depth=10, 
                random_state=42,
                n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                random_state=42,
                max_iter=1000
            ),
            'MLPClassifier': MLPClassifier(
                hidden_layer_sizes=(128, 64, 32),
                max_iter=500,
                random_state=42,
                early_stopping=True
            )
        }
        
        results = {}
        
        for name, model in models_to_train.items():
            print(f"\n📊 Training {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred = model.predict(X_test)
            y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            accuracy = model.score(X_test, y_test)
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train, y_train, cv=5)
            
            results[name] = {
                'model': model,
                'accuracy': accuracy,
                'auc_score': auc_score,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'y_pred': y_pred,
                'y_pred_proba': y_pred_proba
            }
            
            print(f"  Accuracy: {accuracy:.3f}")
            print(f"  AUC Score: {auc_score:.3f}")
            print(f"  CV Score: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
        
        # Find best model
        best_model_name = max(results.keys(), key=lambda k: results[k]['auc_score'])
        self.best_model = results[best_model_name]['model']
        self.best_model_name = best_model_name
        self.models = {name: result['model'] for name, result in results.items()}
        
        print(f"\n🏆 Best model: {best_model_name} (AUC: {results[best_model_name]['auc_score']:.3f})")
        
        return results
    
    def analyze_feature_importance(self):
        """Analyze feature importance"""
        if hasattr(self.best_model, 'feature_importances_'):
            importances = self.best_model.feature_importances_
            feature_importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': importances
            }).sort_values('importance', ascending=False)
            
            print("\n📊 Top 10 Most Important Features:")
            print(feature_importance_df.head(10))
            
            self.feature_importance = feature_importance_df.to_dict('records')
            
            # Plot feature importance
            plt.figure(figsize=(12, 8))
            sns.barplot(data=feature_importance_df.head(15), x='importance', y='feature')
            plt.title(f'Top 15 Feature Importance - {self.best_model_name}')
            plt.xlabel('Importance')
            plt.tight_layout()
            plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
            plt.show()
            
            return feature_importance_df
        else:
            print("⚠️ Model doesn't support feature importance analysis")
            return None
    
    def train(self, training_data):
        """Train the behavior classification model"""
        print("🚀 Starting comprehensive model training...")
        
        # Prepare data
        X, y = self.prepare_data(training_data)
        
        # Handle missing values
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42, stratify=y
        )
        
        print(f"📊 Training set: {X_train.shape[0]} samples")
        print(f"📊 Test set: {X_test.shape[0]} samples")
        print(f"📊 Feature count: {X_train.shape[1]}")
        
        # Train multiple models
        results = self.train_models(X_train, X_test, y_train, y_test)
        
        # Detailed evaluation of best model
        print(f"\n🔍 Detailed evaluation of {self.best_model_name}:")
        best_result = results[self.best_model_name]
        
        print("\n📈 Classification Report:")
        print(classification_report(y_test, best_result['y_pred'], target_names=['Bot', 'Human']))
        
        print("\n🎯 Confusion Matrix:")
        cm = confusion_matrix(y_test, best_result['y_pred'])
        print(cm)
        
        # Plot confusion matrix
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=['Bot', 'Human'], yticklabels=['Bot', 'Human'])
        plt.title(f'Confusion Matrix - {self.best_model_name}')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.tight_layout()
        plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        # Analyze feature importance
        self.analyze_feature_importance()
        
        # Calculate bot/human detection rates
        tn, fp, fn, tp = cm.ravel()
        bot_detection_rate = tn / (tn + fp)  # True negative rate
        human_detection_rate = tp / (tp + fn)  # True positive rate
        
        print(f"\n🤖 Bot Detection Rate: {bot_detection_rate:.3f}")
        print(f"👤 Human Detection Rate: {human_detection_rate:.3f}")
        
        return results
    
    def predict(self, session_data):
        """Predict if session is human or bot"""
        if self.best_model is None:
            raise ValueError("No model trained yet!")
        
        features = self.extract_features(session_data)
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        features_scaled = self.scaler.transform([features])
        
        prediction_prob = self.best_model.predict_proba(features_scaled)[0][1]  # Probability of being human
        prediction_label = 'human' if prediction_prob > 0.5 else 'bot'
        
        # Get feature contributions (for some models)
        feature_contributions = {}
        if hasattr(self.best_model, 'feature_importances_'):
            importances = self.best_model.feature_importances_
            for i, (feature_name, importance) in enumerate(zip(self.feature_names, importances)):
                if i < len(features):
                    feature_contributions[feature_name] = {
                        'value': features[i],
                        'importance': importance,
                        'contribution': features[i] * importance
                    }
        
        return {
            'prediction': prediction_label,
            'confidence': float(prediction_prob),
            'trust_score': float(prediction_prob * 100),  # Convert to percentage
            'model_used': self.best_model_name,
            'features': dict(zip(self.feature_names[:len(features)], features)),
            'feature_contributions': feature_contributions
        }
    
    def save_model(self, filepath):
        """Save trained model and associated data"""
        if self.best_model is None:
            raise ValueError("No model to save!")
        
        model_data = {
            'best_model': self.best_model,
            'models': self.models,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'best_model_name': self.best_model_name,
            'feature_importance': self.feature_importance
        }
        
        with open(f"{filepath}.pkl", 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"✅ Model saved to {filepath}.pkl")
    
    def load_model(self, filepath):
        """Load trained model and associated data"""
        with open(f"{filepath}.pkl", 'rb') as f:
            model_data = pickle.load(f)
        
        self.best_model = model_data['best_model']
        self.models = model_data.get('models', {})
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.best_model_name = model_data.get('best_model_name', 'unknown')
        self.feature_importance = model_data.get('feature_importance', {})
        
        print(f"✅ Model loaded from {filepath}.pkl")
        print(f"🏆 Best model: {self.best_model_name}")

def main():
    """Main training function"""
    # Load training data
    print("📂 Loading training data...")
    try:
        with open('behavior_training_data.json', 'r') as f:
            training_data = json.load(f)
        print(f"✅ Loaded {len(training_data)} training samples")
    except FileNotFoundError:
        print("❌ Training data not found! Please run generate_training_data.py first")
        return
    
    # Initialize and train classifier
    classifier = BehaviorClassifier()
    results = classifier.train(training_data)
    
    # Save model
    classifier.save_model('custom_behavior_model')
    
    print("\n🎉 Training completed successfully!")
    print(f"🏆 Best model: {classifier.best_model_name}")
    print("📁 Model saved as 'custom_behavior_model.pkl'")
    
    # Test prediction
    print("\n🧪 Testing prediction with sample data...")
    if training_data:
        sample = training_data[0]
        prediction = classifier.predict(sample)
        print(f"Sample prediction: {prediction['prediction']} (confidence: {prediction['confidence']:.3f})")

if __name__ == "__main__":
    main()