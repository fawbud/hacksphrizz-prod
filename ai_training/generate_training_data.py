#!/usr/bin/env python3
"""
Behavior Data Generator for AI Training
Generates realistic dummy data for training custom behavior detection model
"""

import numpy as np
import pandas as pd
import json
import random
from datetime import datetime, timedelta
import math

class BehaviorDataGenerator:
    def __init__(self):
        self.human_patterns = self.define_human_patterns()
        self.bot_patterns = self.define_bot_patterns()
    
    def define_human_patterns(self):
        """Define realistic human behavior patterns"""
        return {
            'session_duration': (30000, 300000),  # 30s to 5min
            'mouse_velocity_variance': (50, 200),  # High variance for humans
            'keystroke_interval_variance': (100, 500),  # Variable typing
            'mouse_jitter': (5, 20),  # Natural hand tremor
            'correction_rate': (0.1, 0.3),  # 10-30% corrections
            'hesitation_patterns': (1, 5),  # Thinking pauses
            'focus_changes': (2, 8),  # Window focus changes
            'typing_rhythm_consistency': (0.3, 0.7),  # Not too consistent
            'click_accuracy': (0.6, 0.9),  # Not perfect
            'scroll_smoothness': (0.4, 0.8),  # Natural scrolling
            'form_field_time': (2000, 30000),  # Time spent on fields
            'mouse_stops': (5, 20),  # Natural pauses
        }
    
    def define_bot_patterns(self):
        """Define typical bot behavior patterns"""
        return {
            'session_duration': (5000, 60000),  # Faster completion
            'mouse_velocity_variance': (0, 10),  # Very consistent
            'keystroke_interval_variance': (0, 50),  # Very regular
            'mouse_jitter': (0, 2),  # Almost none
            'correction_rate': (0, 0.05),  # Very few errors
            'hesitation_patterns': (0, 1),  # No hesitation
            'focus_changes': (0, 2),  # Focused
            'typing_rhythm_consistency': (0.8, 1.0),  # Very consistent
            'click_accuracy': (0.95, 1.0),  # Perfect clicks
            'scroll_smoothness': (0.9, 1.0),  # Perfect scrolling
            'form_field_time': (500, 2000),  # Very fast
            'mouse_stops': (0, 3),  # Minimal pauses
        }
    
    def generate_mouse_movements(self, is_human=True, duration=60000):
        """Generate mouse movement data"""
        patterns = self.human_patterns if is_human else self.bot_patterns
        num_movements = random.randint(50, 500) if is_human else random.randint(20, 100)
        
        movements = []
        current_time = 0
        current_x, current_y = 500, 400  # Starting position
        
        for i in range(num_movements):
            if is_human:
                # Human: Natural curves, jitter, variable speed
                angle = random.uniform(0, 2 * math.pi)
                distance = random.uniform(5, 50)
                jitter_x = random.gauss(0, patterns['mouse_jitter'][1]/4)
                jitter_y = random.gauss(0, patterns['mouse_jitter'][1]/4)
                
                current_x += distance * math.cos(angle) + jitter_x
                current_y += distance * math.sin(angle) + jitter_y
                
                # Variable timing
                time_interval = max(10, random.gauss(50, 30))
                velocity = distance / max(time_interval, 1) * 1000  # px/s
                
                # Random pauses (thinking/reading)
                if random.random() < 0.05:
                    time_interval += random.randint(500, 3000)
            else:
                # Bot: Linear movements, consistent timing
                if i % 10 == 0:  # Change direction every 10 moves
                    target_x = random.randint(100, 1820)
                    target_y = random.randint(100, 980)
                
                # Move towards target in straight line
                dx = target_x - current_x
                dy = target_y - current_y
                distance = math.sqrt(dx*dx + dy*dy)
                
                if distance > 0:
                    step = min(20, distance)  # Fixed step size
                    current_x += (dx / distance) * step
                    current_y += (dy / distance) * step
                
                # Consistent timing
                time_interval = random.randint(30, 80)
                velocity = step / max(time_interval, 1) * 1000
            
            current_time += time_interval
            if current_time >= duration:
                break
                
            movements.append({
                'timestamp': current_time,
                'x': max(0, min(1920, current_x)),
                'y': max(0, min(1080, current_y)),
                'velocity': velocity,
                'acceleration': random.uniform(-10, 10) if is_human else random.uniform(-2, 2),
                'pressure': random.uniform(0.3, 1.0) if is_human else random.uniform(0.8, 1.0),
            })
        
        return movements
    
    def generate_keystrokes(self, is_human=True, duration=60000):
        """Generate keystroke data"""
        patterns = self.human_patterns if is_human else self.bot_patterns
        num_keystrokes = random.randint(20, 200) if is_human else random.randint(20, 100)
        
        keystrokes = []
        current_time = 0
        
        text_samples = [
            "hello world this is a test message",
            "user@example.com",
            "John Smith",
            "1234567890",
            "Please enter your information here",
            "The quick brown fox jumps over the lazy dog"
        ] if is_human else [
            "bot_user_123",
            "automated@test.com", 
            "Bot Name",
            "1111111111"
        ]
        
        text = random.choice(text_samples)
        
        for i, char in enumerate(text[:num_keystrokes]):
            if is_human:
                # Human: Variable timing, pauses, corrections
                base_interval = random.gauss(150, 80)
                
                # Add natural pauses
                if char == ' ':
                    base_interval += random.randint(50, 300)
                elif char in '.,!?':
                    base_interval += random.randint(100, 500)
                
                # Typing bursts and slowdowns
                if random.random() < 0.1:  # 10% chance of long pause
                    base_interval += random.randint(1000, 5000)
                
                interval = max(50, base_interval)
                dwell_time = random.randint(50, 200)
                
                # Occasional corrections
                if random.random() < patterns['correction_rate'][1]:
                    # Add backspace
                    current_time += interval
                    keystrokes.append({
                        'timestamp': current_time,
                        'key': 'Backspace',
                        'keyCode': 8,
                        'interval': interval,
                        'dwellTime': random.randint(30, 100),
                        'isCorrection': True
                    })
                    interval = random.randint(100, 300)  # Pause after correction
            else:
                # Bot: Consistent timing, no corrections
                interval = random.randint(50, 120)  # Very consistent
                dwell_time = random.randint(30, 60)   # Consistent dwell
            
            current_time += interval
            if current_time >= duration:
                break
                
            keystrokes.append({
                'timestamp': current_time,
                'key': char,
                'keyCode': ord(char) if len(char) == 1 else 0,
                'interval': interval,
                'dwellTime': dwell_time,
                'isCorrection': False
            })
        
        return keystrokes
    
    def generate_form_interactions(self, is_human=True):
        """Generate form interaction data"""
        patterns = self.human_patterns if is_human else self.bot_patterns
        
        form_fields = ['name', 'email', 'phone', 'company', 'message']
        interactions = {}
        
        num_fields = random.randint(2, 5) if is_human else random.randint(1, 3)
        selected_fields = random.sample(form_fields, num_fields)
        
        for field in selected_fields:
            if is_human:
                focus_time = random.randint(*patterns['form_field_time'])
                input_count = random.randint(5, 50)
                corrections = int(input_count * random.uniform(*patterns['correction_rate']))
                hesitations = random.randint(*patterns['hesitation_patterns'])
                focus_count = random.randint(1, 3)  # May refocus on field
            else:
                focus_time = random.randint(*patterns['form_field_time'])
                input_count = random.randint(10, 30)
                corrections = random.randint(0, 1)
                hesitations = 0
                focus_count = 1  # Single focus
            
            interactions[field] = {
                'focusTime': focus_time,
                'inputCount': input_count,
                'corrections': corrections,
                'hesitations': hesitations,
                'focusCount': focus_count,
                'fieldType': field,
                'completionTime': focus_time + random.randint(0, 1000)
            }
        
        return interactions
    
    def calculate_suspicious_patterns(self, session_data, is_human=True):
        """Calculate suspicious patterns based on behavior"""
        patterns = []
        
        mouse_movements = session_data.get('mouse_movements', [])
        keystrokes = session_data.get('keystrokes', [])
        
        if not is_human:
            # Add bot-specific suspicious patterns
            
            # Check mouse linearity
            if len(mouse_movements) > 10:
                velocities = [m['velocity'] for m in mouse_movements[-10:]]
                if np.std(velocities) < 5:
                    patterns.append({'type': 'consistent_velocity', 'severity': 'high'})
            
            # Check keystroke regularity
            if len(keystrokes) > 5:
                intervals = [k['interval'] for k in keystrokes[-10:] if 'interval' in k]
                if intervals and np.std(intervals) < 20:
                    patterns.append({'type': 'regular_typing', 'severity': 'high'})
            
            # Check for lack of corrections
            corrections = sum(1 for k in keystrokes if k.get('isCorrection', False))
            if len(keystrokes) > 20 and corrections == 0:
                patterns.append({'type': 'no_corrections', 'severity': 'medium'})
            
            # Check mouse precision
            if mouse_movements:
                jitter = np.std([m.get('acceleration', 0) for m in mouse_movements])
                if jitter < 2:
                    patterns.append({'type': 'low_jitter', 'severity': 'medium'})
        
        return patterns
    
    def generate_session(self, is_human=True):
        """Generate complete behavior session"""
        patterns = self.human_patterns if is_human else self.bot_patterns
        
        # Session metadata
        session_duration = random.randint(*patterns['session_duration'])
        start_time = datetime.now().timestamp() * 1000
        
        # Generate behavior data
        mouse_movements = self.generate_mouse_movements(is_human, session_duration)
        keystrokes = self.generate_keystrokes(is_human, session_duration)
        form_interactions = self.generate_form_interactions(is_human)
        
        # Basic metrics
        mouse_velocities = [m['velocity'] for m in mouse_movements if 'velocity' in m]
        keystroke_intervals = [k['interval'] for k in keystrokes if 'interval' in k]
        
        session_data = {
            'session_duration': session_duration,
            'mouse_movements': mouse_movements,
            'keystrokes': keystrokes,
            'form_interactions': form_interactions,
            'clicks': self.generate_clicks(is_human, session_duration),
            'scroll_events': self.generate_scrolls(is_human, session_duration),
            'window_events': self.generate_window_events(is_human),
        }
        
        # Calculate metrics
        metrics = {
            'mouse_velocity_variance': np.var(mouse_velocities) if mouse_velocities else 0,
            'keystroke_interval_variance': np.var(keystroke_intervals) if keystroke_intervals else 0,
            'mouse_jitter': np.std([m.get('acceleration', 0) for m in mouse_movements]),
            'total_corrections': sum(1 for k in keystrokes if k.get('isCorrection', False)),
            'total_hesitations': sum(f.get('hesitations', 0) for f in form_interactions.values()),
            'focus_changes': sum(f.get('focusCount', 1) for f in form_interactions.values()),
            'click_accuracy': random.uniform(*patterns['click_accuracy']),
            'typing_rhythm_consistency': random.uniform(*patterns['typing_rhythm_consistency']),
        }
        
        # Calculate suspicious patterns
        suspicious_patterns = self.calculate_suspicious_patterns(session_data, is_human)
        
        # Generate trust score
        if is_human:
            trust_score = random.uniform(60, 100)  # Humans get higher scores
        else:
            trust_score = random.uniform(0, 45)    # Bots get lower scores
        
        return {
            'userId': f"{'human' if is_human else 'bot'}_{int(start_time)}_{random.randint(1000, 9999)}",
            'timestamp': start_time,
            'session_duration': session_duration,
            'mouse_movements': mouse_movements,
            'keystrokes': keystrokes,
            'form_interactions': form_interactions,
            'clicks': session_data['clicks'],
            'scroll_events': session_data['scroll_events'],
            'window_events': session_data['window_events'],
            'metrics': metrics,
            'suspicious_patterns': suspicious_patterns,
            'label': 'human' if is_human else 'bot',
            'trust_score': trust_score,
            'is_human': is_human
        }
    
    def generate_clicks(self, is_human=True, duration=60000):
        """Generate click events"""
        num_clicks = random.randint(5, 20) if is_human else random.randint(2, 8)
        clicks = []
        
        for i in range(num_clicks):
            timestamp = random.randint(0, duration)
            
            if is_human:
                # Human clicks have some inaccuracy
                accuracy = random.uniform(0.6, 0.95)
                x = random.randint(100, 1820) + random.gauss(0, 5)
                y = random.randint(100, 980) + random.gauss(0, 5)
            else:
                # Bot clicks are very accurate
                accuracy = random.uniform(0.95, 1.0)
                x = random.randint(100, 1820)
                y = random.randint(100, 980)
            
            clicks.append({
                'timestamp': timestamp,
                'x': x,
                'y': y,
                'accuracy': accuracy,
                'button': 0,  # Left click
                'pressure': random.uniform(0.3, 1.0) if is_human else 1.0
            })
        
        return sorted(clicks, key=lambda x: x['timestamp'])
    
    def generate_scrolls(self, is_human=True, duration=60000):
        """Generate scroll events"""
        if is_human:
            num_scrolls = random.randint(3, 15)
        else:
            num_scrolls = random.randint(0, 5)  # Bots scroll less
        
        scrolls = []
        for i in range(num_scrolls):
            timestamp = random.randint(0, duration)
            
            if is_human:
                # Human scrolling is variable
                deltaY = random.randint(50, 200) * random.choice([-1, 1])
                smoothness = random.uniform(0.4, 0.8)
            else:
                # Bot scrolling is consistent
                deltaY = random.choice([100, -100, 120, -120])
                smoothness = random.uniform(0.9, 1.0)
            
            scrolls.append({
                'timestamp': timestamp,
                'deltaY': deltaY,
                'deltaX': random.randint(-10, 10) if is_human else 0,
                'smoothness': smoothness
            })
        
        return sorted(scrolls, key=lambda x: x['timestamp'])
    
    def generate_window_events(self, is_human=True):
        """Generate window focus events"""
        if is_human:
            num_events = random.randint(1, 5)
        else:
            num_events = random.randint(0, 2)
        
        events = []
        for i in range(num_events):
            events.append({
                'type': random.choice(['focus', 'blur', 'visibility_change']),
                'timestamp': random.randint(0, 60000)
            })
        
        return sorted(events, key=lambda x: x['timestamp'])
    
    def generate_training_dataset(self, human_samples=1000, bot_samples=1000):
        """Generate balanced training dataset"""
        dataset = []
        
        print(f"🤖 Generating {human_samples} human samples...")
        for i in range(human_samples):
            if i % 100 == 0:
                print(f"  Progress: {i}/{human_samples}")
            dataset.append(self.generate_session(is_human=True))
        
        print(f"🤖 Generating {bot_samples} bot samples...")
        for i in range(bot_samples):
            if i % 100 == 0:
                print(f"  Progress: {i}/{bot_samples}")
            dataset.append(self.generate_session(is_human=False))
        
        # Shuffle dataset
        random.shuffle(dataset)
        
        print(f"✅ Generated {len(dataset)} training samples")
        print(f"📊 Humans: {sum(1 for d in dataset if d['label'] == 'human')}")
        print(f"🤖 Bots: {sum(1 for d in dataset if d['label'] == 'bot')}")
        
        return dataset

def main():
    """Generate training dataset"""
    generator = BehaviorDataGenerator()
    
    # Generate large dataset
    print("🚀 Starting behavior data generation...")
    training_data = generator.generate_training_dataset(
        human_samples=2000, 
        bot_samples=2000
    )
    
    # Save to file
    output_file = 'behavior_training_data.json'
    with open(output_file, 'w') as f:
        json.dump(training_data, f, indent=2)
    
    print(f"💾 Dataset saved to {output_file}")
    
    # Generate sample stats
    human_scores = [d['trust_score'] for d in training_data if d['label'] == 'human']
    bot_scores = [d['trust_score'] for d in training_data if d['label'] == 'bot']
    
    print(f"\n📊 Dataset Statistics:")
    print(f"Human trust scores: {np.mean(human_scores):.1f} ± {np.std(human_scores):.1f}")
    print(f"Bot trust scores: {np.mean(bot_scores):.1f} ± {np.std(bot_scores):.1f}")
    print(f"Total dataset size: {len(training_data):,} samples")

if __name__ == "__main__":
    main()