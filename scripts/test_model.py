#!/usr/bin/env python3
"""
Model Testing Script - Various Prediction Scenarios
==================================================
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from scripts.predict_demand import DemandPredictor

def test_scenarios():
    """Test model with various real-world scenarios"""
    
    model_path = "/Users/macbookair/Documents/Code/hacksphrizz/models"
    predictor = DemandPredictor(model_path)
    
    print("🧪 AI Demand Prediction - Test Scenarios")
    print("=" * 50)
    
    # Test scenarios
    scenarios = [
        {
            "name": "Normal Weekday",
            "route": "Jakarta-Surabaya",
            "train_type": "Bisnis",
            "date": "2025-11-12",  # Tuesday
            "holiday_multiplier": 1.0
        },
        {
            "name": "Lebaran Peak",
            "route": "Jakarta-Yogyakarta", 
            "train_type": "Ekonomi",
            "date": "2025-03-30",  # Day before Lebaran
            "holiday_multiplier": 8.0
        },
        {
            "name": "Friday Evening",
            "route": "Jakarta-Bandung",
            "train_type": "Eksekutif", 
            "date": "2025-11-07",  # Friday
            "holiday_multiplier": 1.0
        },
        {
            "name": "Christmas Holiday",
            "route": "Surabaya-Malang",
            "train_type": "Bisnis",
            "date": "2025-12-24",
            "holiday_multiplier": 4.5
        },
        {
            "name": "Low Season",
            "route": "Bandung-Yogyakarta",
            "train_type": "Ekonomi",
            "date": "2025-02-18",  # Regular Tuesday in Feb
            "holiday_multiplier": 1.0
        }
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n{i}. {scenario['name']}")
        print("-" * 30)
        
        result = predictor.predict_demand(
            route=scenario['route'],
            train_type=scenario['train_type'],
            date=scenario['date'],
            holiday_multiplier=scenario['holiday_multiplier']
        )
        
        print(f"📍 Route: {result['route']}")
        print(f"🚄 Train: {result['train_type']}")
        print(f"📅 Date: {result['date']}")
        print(f"🎯 Predicted Bookings: {result['predicted_bookings']:,}")
        print(f"📊 Demand Level: {result['demand_level']}")
        print(f"🎯 Confidence: {result['confidence']:.1%}")
        
        # Show key factors
        factors = result['factors']
        print(f"📈 Key Factors:")
        print(f"   Holiday: {factors['holiday_multiplier']}x")
        print(f"   Weekly: {factors['weekly_multiplier']}x") 
        print(f"   Seasonal: {factors['seasonal_multiplier']}x")
        
        # Show recommendations
        if result['recommendations']:
            print(f"💡 Recommendations:")
            for rec in result['recommendations'][:3]:  # Top 3
                print(f"   • {rec}")
    
    # Route comparison for peak day
    print(f"\n🔍 Route Comparison - Lebaran Peak Day")
    print("=" * 50)
    
    routes = ["Jakarta-Surabaya", "Jakarta-Yogyakarta", "Jakarta-Bandung"]
    
    for route in routes:
        analysis = predictor.predict_route_demand(
            route=route,
            date="2025-03-29",  # Lebaran peak
            holiday_multiplier=8.5
        )
        
        print(f"\n📍 {route}")
        print(f"   Total Demand: {analysis['total_predicted_demand']:,}")
        print(f"   Capacity: {analysis['route_capacity']:,}")
        print(f"   Utilization: {analysis['utilization_rate']:.1%}")
        print(f"   Status: {analysis['capacity_status']}")

if __name__ == "__main__":
    test_scenarios()