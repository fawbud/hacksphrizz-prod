#!/usr/bin/env python3
"""
Enhanced Prediction API with ML Model and Islamic Calendar Features
==================================================================

This script provides real ML-based predictions using the enhanced model
with Islamic calendar integration.
"""

import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

class IslamicCalendarFeatures:
    """Helper class for Islamic calendar calculations (same as training)"""
    
    @staticmethod
    def calculate_lebaran_date(year):
        """Calculate approximate Lebaran (Eid al-Fitr) date for given year"""
        base_date_2024 = datetime(2024, 4, 10)
        year_diff = year - 2024
        days_shift = year_diff * 10.875
        lebaran_date = base_date_2024 - timedelta(days=days_shift)
        lebaran_date = lebaran_date.replace(year=year)
        return lebaran_date
    
    @staticmethod
    def calculate_idul_adha_date(year):
        """Calculate Idul Adha date (approximately 70 days after Lebaran)"""
        lebaran = IslamicCalendarFeatures.calculate_lebaran_date(year)
        return lebaran + timedelta(days=70)
    
    @staticmethod
    def get_holiday_features(date):
        """Generate comprehensive holiday features for a given date"""
        year = date.year
        month = date.month
        day = date.day
        
        features = {}
        
        # Calculate Islamic holidays
        lebaran = IslamicCalendarFeatures.calculate_lebaran_date(year)
        idul_adha = IslamicCalendarFeatures.calculate_idul_adha_date(year)
        
        # Lebaran period features
        days_to_lebaran = (lebaran - date).days
        features['days_to_lebaran'] = days_to_lebaran
        features['days_from_lebaran'] = -days_to_lebaran
        features['is_lebaran_week'] = abs(days_to_lebaran) <= 3
        features['is_lebaran_period'] = abs(days_to_lebaran) <= 7
        features['is_pre_lebaran'] = 0 <= days_to_lebaran <= 14
        features['is_post_lebaran'] = -7 <= days_to_lebaran <= 0
        
        # Idul Adha features
        days_to_idul_adha = (idul_adha - date).days
        features['days_to_idul_adha'] = days_to_idul_adha
        features['is_idul_adha_week'] = abs(days_to_idul_adha) <= 3
        features['is_idul_adha_period'] = abs(days_to_idul_adha) <= 5
        
        # Christmas and New Year
        christmas = datetime(year, 12, 25)
        new_year = datetime(year + 1, 1, 1) if month >= 12 else datetime(year, 1, 1)
        
        days_to_christmas = (christmas - date).days
        days_to_new_year = (new_year - date).days
        
        features['days_to_christmas'] = days_to_christmas
        features['days_to_new_year'] = days_to_new_year
        features['is_christmas_period'] = (month == 12 and day >= 20) or (month == 1 and day <= 10)
        features['is_year_end_holidays'] = month == 12 and day >= 15
        
        # Indonesian National Holidays
        features['is_independence_day'] = (month == 8 and 15 <= day <= 17)
        features['is_labor_day'] = (month == 5 and day == 1)
        
        # Chinese New Year (approximate)
        features['is_chinese_new_year'] = (month == 1 and 20 <= day <= 30) or (month == 2 and day <= 10)
        
        # School holidays in Indonesia
        features['is_school_holiday'] = month in [6, 7, 12]
        features['is_mid_year_holiday'] = month in [6, 7]
        
        # Calculate holiday intensity (0-1 scale)
        holiday_intensity = 0
        if features['is_lebaran_week']:
            holiday_intensity = max(holiday_intensity, 1.0)
        elif features['is_lebaran_period']:
            holiday_intensity = max(holiday_intensity, 0.8)
        elif features['is_pre_lebaran']:
            holiday_intensity = max(holiday_intensity, 0.6)
        
        if features['is_christmas_period']:
            holiday_intensity = max(holiday_intensity, 0.9)
        elif features['is_idul_adha_week']:
            holiday_intensity = max(holiday_intensity, 0.7)
        elif features['is_school_holiday']:
            holiday_intensity = max(holiday_intensity, 0.4)
        
        features['holiday_intensity'] = holiday_intensity
        
        # Seasonal travel patterns
        features['is_peak_travel_month'] = month in [3, 4, 12, 1]
        features['is_low_travel_month'] = month in [2, 8, 9]
        
        return features

class EnhancedMLPredictor:
    """ML-based predictor using the enhanced model"""
    
    def __init__(self, model_path='models/'):
        self.model_path = model_path
        self.model = None
        self.model_info = None
        self.preprocessors = {}
        self.islamic_features = IslamicCalendarFeatures()
        self.load_model()
    
    def load_model(self):
        """Load the trained model and metadata"""
        try:
            # Load model
            model_file = os.path.join(self.model_path, 'demand_prediction_model.pkl')
            with open(model_file, 'rb') as f:
                self.model = pickle.load(f)
            
            # Load model info
            info_file = os.path.join(self.model_path, 'model_info.json')
            with open(info_file, 'r') as f:
                self.model_info = json.load(f)
            
            # Load preprocessors
            if 'preprocessors' in self.model_info:
                for name, filename in self.model_info['preprocessors'].items():
                    preprocessor_file = os.path.join(self.model_path, filename)
                    if os.path.exists(preprocessor_file):
                        with open(preprocessor_file, 'rb') as f:
                            self.preprocessors[name] = pickle.load(f)
            
            print("✅ Enhanced ML model loaded successfully")
            print(f"🕌 Islamic calendar features: {self.model_info.get('islamic_calendar_features', False)}")
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.model = None
    
    def create_features(self, date, route, train_type):
        """Create feature vector for prediction"""
        if not self.model:
            return None
        
        # Get Islamic calendar features
        islamic_features = self.islamic_features.get_holiday_features(date)
        
        # Basic datetime features
        features = {
            'day_of_week': date.weekday(),
            'month': date.month,
            'day': date.day,
            'week_of_year': date.isocalendar()[1],
            'quarter': (date.month - 1) // 3 + 1,
            'is_weekend': date.weekday() >= 5,
            'is_friday': date.weekday() == 4,
            'is_sunday': date.weekday() == 6,
            'is_month_start': date.day <= 5,
            'is_month_end': date.day >= 25,
        }
        
        # Add Islamic calendar features
        features.update(islamic_features)
        
        # Legacy holiday multiplier
        if islamic_features['is_christmas_period']:
            features['holiday_multiplier'] = 2.8
        elif islamic_features['is_lebaran_period']:
            features['holiday_multiplier'] = 2.5
        elif islamic_features['is_idul_adha_period']:
            features['holiday_multiplier'] = 2.0
        elif features['is_weekend']:
            features['holiday_multiplier'] = 1.3
        else:
            features['holiday_multiplier'] = 1.0
        
        # Additional features
        features.update({
            'weekly_multiplier': 1.3 if features['is_weekend'] else 1.0,
            'yearly_growth': 0.05 * (date.year - 2016),
            'covid_factor': 1.0,  # Post-COVID era
            'holiday_weekend_interaction': islamic_features['holiday_intensity'] * int(features['is_weekend']),
            'route_popularity': int('Jakarta' in route),
            'train_priority': {'Eksekutif': 3, 'Bisnis': 2, 'Ekonomi': 1}.get(train_type, 2),
            'route': route,
            'train_type': train_type,
            'route_train_interaction': f"{route}_{train_type}"
        })
        
        # Default values for lag and rolling features (simplified for API)
        lag_features = [
            'bookings_lag_1', 'bookings_lag_7', 'bookings_lag_14', 'bookings_lag_30',
            'holiday_mult_lag_1', 'holiday_mult_lag_7', 'holiday_mult_lag_14', 'holiday_mult_lag_30',
            'bookings_rolling_mean_7', 'bookings_rolling_std_7', 'bookings_trend_7',
            'bookings_rolling_mean_14', 'bookings_rolling_std_14', 'bookings_trend_14',
            'bookings_rolling_mean_30', 'bookings_rolling_std_30', 'bookings_trend_30'
        ]
        
        # Use estimated values based on holiday intensity and route popularity
        base_bookings = 2500 * features['route_popularity'] + 1500
        for feature in lag_features:
            if 'bookings_lag' in feature or 'rolling_mean' in feature:
                features[feature] = base_bookings * features['holiday_multiplier']
            elif 'holiday_mult_lag' in feature:
                features[feature] = features['holiday_multiplier']
            elif 'rolling_std' in feature:
                features[feature] = base_bookings * 0.2
            elif 'trend' in feature:
                features[feature] = base_bookings * 0.1
            else:
                features[feature] = 0
        
        return features
    
    def predict_single(self, date, route, train_type):
        """Make prediction for a single date/route/train combination"""
        if not self.model:
            return None
        
        # Create features
        features = self.create_features(date, route, train_type)
        if not features:
            return None
        
        # Encode categorical variables
        for col_name, encoder in self.preprocessors.items():
            if col_name in features:
                try:
                    if col_name == 'route_train_interaction':
                        # Handle new combinations
                        interaction = f"{route}_{train_type}"
                        if interaction in encoder.classes_:
                            features[col_name] = encoder.transform([interaction])[0]
                        else:
                            # Use a default encoding for unseen combinations
                            features[col_name] = 0
                    else:
                        if features[col_name] in encoder.classes_:
                            features[col_name] = encoder.transform([features[col_name]])[0]
                        else:
                            features[col_name] = 0
                except:
                    features[col_name] = 0
        
        # Create feature vector in correct order
        feature_vector = []
        for col in self.model_info['feature_columns']:
            if col in features:
                feature_vector.append(features[col])
            else:
                feature_vector.append(0)  # Default value for missing features
        
        # Make prediction
        try:
            prediction = self.model.predict([feature_vector])[0]
            return max(0, int(prediction))  # Ensure non-negative integer
        except Exception as e:
            print(f"Prediction error: {e}")
            return None
    
    def predict_period(self, start_date, days, routes=None, train_types=None):
        """Predict for a period of days"""
        if routes is None:
            routes = ['Jakarta-Yogyakarta', 'Jakarta-Bandung', 'Jakarta-Surabaya', 
                     'Bandung-Surabaya', 'Yogyakarta-Surabaya']
        
        if train_types is None:
            train_types = ['Eksekutif', 'Bisnis', 'Ekonomi']
        
        predictions = []
        
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            
            daily_total = 0
            route_breakdown = []
            
            for route in routes:
                for train_type in train_types:
                    prediction = self.predict_single(current_date, route, train_type)
                    if prediction:
                        daily_total += prediction
                        route_breakdown.append({
                            'route': route,
                            'train_type': train_type,
                            'predicted_bookings': prediction
                        })
            
            # Get holiday features for this date
            holiday_features = self.islamic_features.get_holiday_features(current_date)
            
            predictions.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'predicted_bookings': daily_total,
                'day_of_week': current_date.strftime('%A'),
                'is_weekend': current_date.weekday() >= 5,
                'holiday_intensity': holiday_features.get('holiday_intensity', 0),
                'holiday_multiplier': holiday_features.get('holiday_intensity', 0) * 2 + 1,
                'is_lebaran_period': holiday_features.get('is_lebaran_period', False),
                'is_christmas_period': holiday_features.get('is_christmas_period', False),
                'is_idul_adha_period': holiday_features.get('is_idul_adha_period', False)
            })
        
        return {
            'daily_totals': predictions,
            'route_breakdown': route_breakdown,
            'model_type': 'enhanced_ml_with_islamic_calendar',
            'prediction_confidence': 'high' if self.model else 'low'
        }

def main():
    """Test the enhanced predictor"""
    predictor = EnhancedMLPredictor()
    
    if predictor.model:
        # Test prediction
        test_date = datetime(2025, 12, 25)  # Christmas
        prediction = predictor.predict_single(test_date, 'Jakarta-Yogyakarta', 'Eksekutif')
        print(f"Test prediction for Christmas: {prediction}")
        
        # Test Lebaran prediction
        lebaran_date = IslamicCalendarFeatures.calculate_lebaran_date(2025)
        lebaran_prediction = predictor.predict_single(lebaran_date, 'Jakarta-Yogyakarta', 'Eksekutif')
        print(f"Test prediction for Lebaran 2025 ({lebaran_date.date()}): {lebaran_prediction}")

if __name__ == "__main__":
    main()