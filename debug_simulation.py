#!/usr/bin/env python3
"""
Debug simulation - test single iteration
"""

import pandas as pd
import numpy as np
import time
import pickle
import shutil
import os
import json
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
import requests

def test_simulation():
    base_dir = "/Users/macbookair/Documents/Code/hacksphrizz"
    original_data_file = f"{base_dir}/data/train_booking_data_2016_2025.csv"
    temp_data_file = f"{base_dir}/data/simulation_data.csv"
    
    routes = [
        "Jakarta-Surabaya", "Jakarta-Yogyakarta", "Jakarta-Bandung",
        "Jakarta-Semarang", "Jakarta-Solo", "Surabaya-Malang",
        "Bandung-Yogyakarta", "Jakarta-Cirebon"
    ]
    train_types = ["Eksekutif", "Bisnis", "Ekonomi"]
    
    print("🧪 Testing simulation components...")
    
    # Test 1: Load original data
    try:
        original_df = pd.read_csv(original_data_file)
        print(f"✅ Original data loaded: {len(original_df)} rows")
        print(f"📅 Latest date in original data: {original_df['date'].max()}")
    except Exception as e:
        print(f"❌ Failed to load original data: {e}")
        return
    
    # Test 2: Generate sample day data
    try:
        target_date = datetime(2025, 10, 3)
        daily_data = []
        
        for route in routes:
            route_capacities = {
                "Jakarta-Surabaya": 45000, "Jakarta-Yogyakarta": 35000,
                "Jakarta-Bandung": 50000, "Jakarta-Semarang": 30000,
                "Jakarta-Solo": 25000, "Surabaya-Malang": 15000,
                "Bandung-Yogyakarta": 20000, "Jakarta-Cirebon": 8000
            }
            
            base_capacity = route_capacities.get(route, 25000)
            
            for train_type in train_types:
                bookings = int(base_capacity * np.random.uniform(0.1, 0.4))
                daily_data.append({
                    'date': target_date.strftime('%Y-%m-%d'),
                    'route': route,
                    'train_type': train_type,
                    'bookings': bookings,
                    'holiday_multiplier': 1.0,
                    'weekly_multiplier': 1.0,
                    'yearly_growth': 1.05,
                    'covid_factor': 1.0,
                    'is_weekend': target_date.weekday() >= 5,
                    'day_of_week': target_date.weekday(),
                    'month': target_date.month,
                    'year': target_date.year
                })
        
        new_df = pd.DataFrame(daily_data)
        print(f"✅ Generated {len(daily_data)} new records for {target_date.strftime('%Y-%m-%d')}")
        print(f"📊 Sample bookings range: {new_df['bookings'].min()} - {new_df['bookings'].max()}")
        
    except Exception as e:
        print(f"❌ Failed to generate data: {e}")
        return
    
    # Test 3: Combine and save data
    try:
        combined_df = pd.concat([original_df, new_df], ignore_index=True)
        combined_df.to_csv(temp_data_file, index=False)
        print(f"✅ Combined data saved: {len(combined_df)} total rows")
        
    except Exception as e:
        print(f"❌ Failed to save combined data: {e}")
        return
    
    # Test 4: Check if we can load and feature engineer
    try:
        test_df = pd.read_csv(temp_data_file)
        print(f"✅ Temp data reloaded: {len(test_df)} rows")
        print(f"📋 Columns: {list(test_df.columns)}")
        
        # Basic feature engineering test
        test_df['date'] = pd.to_datetime(test_df['date'])
        print(f"✅ Date parsing successful")
        
    except Exception as e:
        print(f"❌ Failed to process temp data: {e}")
        return
    
    # Cleanup
    if os.path.exists(temp_data_file):
        os.remove(temp_data_file)
        print("🧹 Cleaned up temp file")
    
    print("🎉 All simulation components working!")

if __name__ == "__main__":
    test_simulation()