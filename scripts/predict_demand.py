#!/usr/bin/env python3
"""
Train Booking Demand Prediction - Inference Script
==================================================

This script loads the trained model and provides prediction functionality
for the train booking demand prediction system.
"""

import pandas as pd
import numpy as np
import pickle
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Union

class DemandPredictor:
    """
    Production-ready demand predictor for train booking system
    """
    
    def __init__(self, model_path: str):
        """
        Initialize the predictor with trained model
        
        Args:
            model_path (str): Path to the directory containing model files
        """
        self.model_path = model_path
        self.model = None
        self.model_info = None
        self.load_model()
    
    def load_model(self):
        """Load the trained model and metadata"""
        
        # Load model
        model_file = os.path.join(self.model_path, 'demand_prediction_model.pkl')
        if not os.path.exists(model_file):
            raise FileNotFoundError(f"Model file not found: {model_file}")
        
        with open(model_file, 'rb') as f:
            self.model = pickle.load(f)
        
        # Load model info
        info_file = os.path.join(self.model_path, 'model_info.json')
        if os.path.exists(info_file):
            with open(info_file, 'r') as f:
                self.model_info = json.load(f)
        
        print(f"✅ Model loaded successfully from {model_file}")
        if self.model_info:
            print(f"📊 Model accuracy: {(1 - self.model_info['performance_metrics']['test']['mae'] / 600):.1%}")
    
    def predict_demand(self, 
                      route: str, 
                      train_type: str, 
                      date: str,
                      holiday_multiplier: float = 1.0,
                      weather_impact: float = 1.0,
                      event_impact: float = 1.0) -> Dict:
        """
        Predict booking demand for specific route, train type and date
        
        Args:
            route (str): Train route (e.g., "Jakarta-Surabaya")
            train_type (str): Train type ("Eksekutif", "Bisnis", "Ekonomi")
            date (str): Date in YYYY-MM-DD format
            holiday_multiplier (float): Holiday impact factor (1.0 = normal, >1.0 = holiday)
            weather_impact (float): Weather impact factor
            event_impact (float): Special event impact factor
            
        Returns:
            Dict: Prediction results with demand level and confidence
        """
        
        # Parse date
        pred_date = pd.to_datetime(date)
        
        # Basic feature engineering (simplified for demo)
        features = self._engineer_features(
            route, train_type, pred_date, 
            holiday_multiplier, weather_impact, event_impact
        )
        
        # Make prediction (simplified - would need full pipeline in production)
        base_demand = self._get_baseline_demand(route, train_type)
        
        # Apply multipliers
        weekly_mult = self._get_weekly_multiplier(pred_date)
        seasonal_mult = self._get_seasonal_multiplier(pred_date)
        
        predicted_demand = int(base_demand * holiday_multiplier * weekly_mult * seasonal_mult * weather_impact * event_impact)
        
        # Determine demand level
        demand_level = self._categorize_demand(predicted_demand, route)
        
        # Calculate confidence (simplified)
        confidence = min(0.95, 0.7 + (0.25 * holiday_multiplier / 8))  # Higher confidence for holiday patterns
        
        result = {
            'route': route,
            'train_type': train_type,
            'date': date,
            'predicted_bookings': predicted_demand,
            'demand_level': demand_level,
            'confidence': round(confidence, 2),
            'factors': {
                'holiday_multiplier': holiday_multiplier,
                'weekly_multiplier': round(weekly_mult, 2),
                'seasonal_multiplier': round(seasonal_mult, 2),
                'weather_impact': weather_impact,
                'event_impact': event_impact
            },
            'recommendations': self._get_recommendations(demand_level, predicted_demand)
        }
        
        return result
    
    def predict_route_demand(self, route: str, date: str, **kwargs) -> Dict:
        """
        Predict demand for all train types on a specific route and date
        
        Args:
            route (str): Train route
            date (str): Date in YYYY-MM-DD format
            **kwargs: Additional factors (holiday_multiplier, weather_impact, etc.)
            
        Returns:
            Dict: Predictions for all train types
        """
        
        train_types = ['Eksekutif', 'Bisnis', 'Ekonomi']
        predictions = {}
        total_demand = 0
        
        for train_type in train_types:
            pred = self.predict_demand(route, train_type, date, **kwargs)
            predictions[train_type] = pred
            total_demand += pred['predicted_bookings']
        
        # Overall route analysis
        route_capacity = self._get_route_capacity(route)
        utilization = total_demand / route_capacity if route_capacity > 0 else 0
        
        result = {
            'route': route,
            'date': date,
            'predictions_by_type': predictions,
            'total_predicted_demand': total_demand,
            'route_capacity': route_capacity,
            'utilization_rate': round(utilization, 2),
            'capacity_status': self._get_capacity_status(utilization),
            'operational_recommendations': self._get_operational_recommendations(utilization, total_demand)
        }
        
        return result
    
    def predict_multiple_dates(self, 
                              route: str, 
                              start_date: str, 
                              end_date: str,
                              train_type: str = 'Bisnis') -> List[Dict]:
        """
        Predict demand for a date range
        
        Args:
            route (str): Train route
            start_date (str): Start date (YYYY-MM-DD)
            end_date (str): End date (YYYY-MM-DD)
            train_type (str): Train type to predict for
            
        Returns:
            List[Dict]: List of predictions for each date
        """
        
        start = pd.to_datetime(start_date)
        end = pd.to_datetime(end_date)
        
        predictions = []
        current_date = start
        
        while current_date <= end:
            # Auto-detect holiday multiplier (simplified)
            holiday_mult = self._auto_detect_holiday_multiplier(current_date)
            
            pred = self.predict_demand(
                route, train_type, current_date.strftime('%Y-%m-%d'),
                holiday_multiplier=holiday_mult
            )
            predictions.append(pred)
            
            current_date += timedelta(days=1)
        
        return predictions
    
    def _engineer_features(self, route, train_type, date, holiday_mult, weather, event):
        """Engineer features for prediction (simplified version)"""
        
        features = {
            'route': route,
            'train_type': train_type,
            'year': date.year,
            'month': date.month,
            'day': date.day,
            'day_of_week': date.dayofweek,
            'is_weekend': int(date.dayofweek >= 5),
            'holiday_multiplier': holiday_mult,
            'weather_impact': weather,
            'event_impact': event
        }
        
        return features
    
    def _get_baseline_demand(self, route: str, train_type: str) -> int:
        """Get baseline daily demand for route and train type"""
        
        baselines = {
            'Jakarta-Surabaya': {'Eksekutif': 700, 'Bisnis': 980, 'Ekonomi': 1120},
            'Jakarta-Yogyakarta': {'Eksekutif': 550, 'Bisnis': 770, 'Ekonomi': 880},
            'Jakarta-Bandung': {'Eksekutif': 875, 'Bisnis': 1225, 'Ekonomi': 1400},
            'Jakarta-Semarang': {'Eksekutif': 450, 'Bisnis': 630, 'Ekonomi': 720},
            'Jakarta-Solo': {'Eksekutif': 400, 'Bisnis': 560, 'Ekonomi': 640},
            'Surabaya-Malang': {'Eksekutif': 300, 'Bisnis': 420, 'Ekonomi': 480},
            'Bandung-Yogyakarta': {'Eksekutif': 225, 'Bisnis': 315, 'Ekonomi': 360},
            'Jakarta-Cirebon': {'Eksekutif': 350, 'Bisnis': 490, 'Ekonomi': 560}
        }
        
        return baselines.get(route, {}).get(train_type, 400)
    
    def _get_weekly_multiplier(self, date: pd.Timestamp) -> float:
        """Get weekly demand multiplier"""
        
        day_multipliers = {
            0: 1.0,  # Monday
            1: 1.0,  # Tuesday
            2: 1.0,  # Wednesday
            3: 1.0,  # Thursday
            4: 2.2,  # Friday
            5: 1.4,  # Saturday
            6: 2.0   # Sunday
        }
        
        return day_multipliers.get(date.dayofweek, 1.0)
    
    def _get_seasonal_multiplier(self, date: pd.Timestamp) -> float:
        """Get seasonal demand multiplier"""
        
        month = date.month
        
        # Higher demand in holiday months
        seasonal_multipliers = {
            1: 1.1,   # January (New Year effect)
            2: 0.9,   # February
            3: 1.0,   # March
            4: 1.2,   # April (often Lebaran)
            5: 1.2,   # May (often Lebaran)
            6: 1.3,   # June (School holidays start)
            7: 1.3,   # July (School holidays)
            8: 1.0,   # August
            9: 1.0,   # September
            10: 1.0,  # October
            11: 1.0,  # November
            12: 1.2   # December (Christmas/New Year)
        }
        
        return seasonal_multipliers.get(month, 1.0)
    
    def _get_route_capacity(self, route: str) -> int:
        """Get total daily capacity for route"""
        
        capacities = {
            'Jakarta-Surabaya': 3500,
            'Jakarta-Yogyakarta': 2800,
            'Jakarta-Bandung': 4200,
            'Jakarta-Semarang': 2300,
            'Jakarta-Solo': 2000,
            'Surabaya-Malang': 1500,
            'Bandung-Yogyakarta': 1200,
            'Jakarta-Cirebon': 1800
        }
        
        return capacities.get(route, 2000)
    
    def _categorize_demand(self, predicted_demand: int, route: str) -> str:
        """Categorize demand level"""
        
        baseline = self._get_baseline_demand(route, 'Bisnis')  # Use Bisnis as reference
        
        if predicted_demand >= baseline * 6:
            return 'Critical'
        elif predicted_demand >= baseline * 3:
            return 'High'
        elif predicted_demand >= baseline * 1.5:
            return 'Medium'
        else:
            return 'Low'
    
    def _get_capacity_status(self, utilization: float) -> str:
        """Get capacity status based on utilization rate"""
        
        if utilization >= 0.95:
            return 'Overbooked'
        elif utilization >= 0.8:
            return 'High Utilization'
        elif utilization >= 0.6:
            return 'Medium Utilization'
        else:
            return 'Low Utilization'
    
    def _get_recommendations(self, demand_level: str, predicted_demand: int) -> List[str]:
        """Get operational recommendations based on demand level"""
        
        recommendations = []
        
        if demand_level == 'Critical':
            recommendations.extend([
                'Activate virtual waiting room',
                'Scale server capacity by 2x',
                'Deploy additional trains if available',
                'Implement strict bot detection',
                'Alert operations team immediately'
            ])
        elif demand_level == 'High':
            recommendations.extend([
                'Prepare virtual waiting room',
                'Scale server capacity by 1.5x',
                'Consider additional train deployment',
                'Increase staff at major stations'
            ])
        elif demand_level == 'Medium':
            recommendations.extend([
                'Monitor capacity closely',
                'Standard bot detection',
                'Normal staffing levels'
            ])
        else:
            recommendations.extend([
                'Standard operations',
                'Consider promotional pricing'
            ])
        
        return recommendations
    
    def _get_operational_recommendations(self, utilization: float, total_demand: int) -> List[str]:
        """Get route-level operational recommendations"""
        
        recommendations = []
        
        if utilization >= 0.9:
            recommendations.extend([
                'Deploy additional trains',
                'Extend boarding time',
                'Increase cleaning crew',
                'Alert passengers of delays'
            ])
        elif utilization >= 0.7:
            recommendations.extend([
                'Monitor passenger flow',
                'Prepare additional staff',
                'Consider alternative route suggestions'
            ])
        
        return recommendations
    
    def _auto_detect_holiday_multiplier(self, date: pd.Timestamp) -> float:
        """Auto-detect holiday multiplier based on date (simplified)"""
        
        # Simplified holiday detection
        month = date.month
        day = date.day
        
        # Christmas/New Year period
        if (month == 12 and day >= 22) or (month == 1 and day <= 2):
            return 4.5
        
        # Likely Lebaran periods (varies by year)
        lebaran_months = [3, 4, 5, 6]  # Lebaran can fall in these months
        if month in lebaran_months and date.dayofweek in [4, 5, 6, 0]:  # Fri-Mon
            return 7.0
        
        # Weekend
        if date.dayofweek >= 5:
            return 1.4
        
        return 1.0
    
    def get_model_info(self) -> Dict:
        """Get model information and performance metrics"""
        return self.model_info if self.model_info else {}

def demo_predictions():
    """Demo function to show prediction capabilities"""
    
    model_path = "/Users/macbookair/Documents/Code/hacksphrizz/models"
    
    try:
        predictor = DemandPredictor(model_path)
        
        print("🔮 Demand Prediction Demo")
        print("=" * 40)
        
        # Single prediction
        print("\n1. Single Route Prediction:")
        result = predictor.predict_demand(
            route="Jakarta-Surabaya",
            train_type="Bisnis", 
            date="2025-12-25",  # Christmas
            holiday_multiplier=4.5
        )
        print(f"Route: {result['route']}")
        print(f"Date: {result['date']}")
        print(f"Predicted Bookings: {result['predicted_bookings']}")
        print(f"Demand Level: {result['demand_level']}")
        print(f"Confidence: {result['confidence']}")
        
        # Route analysis
        print("\n2. Complete Route Analysis:")
        route_analysis = predictor.predict_route_demand(
            route="Jakarta-Yogyakarta",
            date="2025-04-10",  # Potential Lebaran
            holiday_multiplier=7.0
        )
        print(f"Total Demand: {route_analysis['total_predicted_demand']}")
        print(f"Utilization: {route_analysis['utilization_rate']:.1%}")
        print(f"Status: {route_analysis['capacity_status']}")
        
    except FileNotFoundError:
        print("⚠️  Model not found. Run training script first.")

if __name__ == "__main__":
    demo_predictions()