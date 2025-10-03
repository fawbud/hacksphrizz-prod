#!/usr/bin/env python3

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime, timedelta
import sys
import os

def create_features(df):
    df = df.copy()
    
    # Handle both uppercase and lowercase column names
    if 'date' in df.columns:
        df['Date'] = pd.to_datetime(df['date'])
        df['Route'] = df['route']  
        df['TrainType'] = df['train_type']
        df['Bookings'] = df['bookings']
        df['IsHoliday'] = df.get('is_holiday', df.get('IsHoliday', 0))
        df['IsWeekend'] = df.get('is_weekend', df.get('IsWeekend', 0))
        df['DayOfWeek'] = df.get('day_of_week', df.get('DayOfWeek', df['Date'].dt.dayofweek))
        df['Month'] = df.get('month', df.get('Month', df['Date'].dt.month))
        df['Year'] = df.get('year', df.get('Year', df['Date'].dt.year))
    elif 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
    else:
        print("Error: No date column found", file=sys.stderr)
        return df
    
    # Ensure all required columns exist
    required_cols = ['Route', 'TrainType', 'Bookings']
    for col in required_cols:
        if col not in df.columns:
            print(f"Error: Missing required column {col}", file=sys.stderr)
            return df
    
    df = df.sort_values(['Route', 'TrainType', 'Date'])
    
    # Basic features
    df['DayOfYear'] = df['Date'].dt.dayofyear
    df['WeekOfYear'] = df['Date'].dt.isocalendar().week
    df['Quarter'] = df['Date'].dt.quarter
    
    # Route and train type encoding
    route_encoder = {route: i for i, route in enumerate(df['Route'].unique())}
    train_encoder = {train: i for i, train in enumerate(df['TrainType'].unique())}
    df['RouteEncoded'] = df['Route'].map(route_encoder)
    df['TrainTypeEncoded'] = df['TrainType'].map(train_encoder)
    
    # Lag features (use last known values for future predictions)
    for route in df['Route'].unique():
        for train_type in df['TrainType'].unique():
            mask = (df['Route'] == route) & (df['TrainType'] == train_type)
            df.loc[mask, 'Bookings_Lag1'] = df.loc[mask, 'Bookings'].shift(1)
            df.loc[mask, 'Bookings_Lag7'] = df.loc[mask, 'Bookings'].shift(7)
            df.loc[mask, 'Bookings_Lag30'] = df.loc[mask, 'Bookings'].shift(30)
    
    # Rolling averages
    for route in df['Route'].unique():
        for train_type in df['TrainType'].unique():
            mask = (df['Route'] == route) & (df['TrainType'] == train_type)
            df.loc[mask, 'Rolling_7'] = df.loc[mask, 'Bookings'].rolling(7, min_periods=1).mean()
            df.loc[mask, 'Rolling_30'] = df.loc[mask, 'Bookings'].rolling(30, min_periods=1).mean()
    
    # Fill NaN values
    df = df.bfill().fillna(0)
    
    return df

try:
    # Load model
    model_path = "models/demand_prediction_model.pkl"
    data_path = "data/train_booking_data_2016_2025.csv"
    
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    # Load historical data for context
    df = pd.read_csv(data_path)
    
    # Handle column names based on data source
    if 'date' in df.columns and 'Date' not in df.columns:
        df['Date'] = pd.to_datetime(df['date'])
        df['Route'] = df['route']
        df['TrainType'] = df['train_type']
        df['Bookings'] = df['bookings']
    elif 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'])
    else:
        raise ValueError("No date column found")
    
    # Get the latest date in the data
    latest_date = df['Date'].max()
    
    # Generate future dates
    prediction_days = 7
    start_date = latest_date + timedelta(days=1)
    future_dates = [start_date + timedelta(days=i) for i in range(prediction_days)]
    
    routes = ['Jakarta-Yogyakarta', 'Jakarta-Bandung', 'Jakarta-Surabaya', 
              'Bandung-Surabaya', 'Yogyakarta-Surabaya']
    train_types = ['Eksekutif', 'Bisnis', 'Ekonomi']
    
    # Create future data points
    future_data = []
    for date in future_dates:
        for route in routes:
            for train_type in train_types:
                future_data.append({
                    'Date': date,
                    'Route': route,
                    'TrainType': train_type,
                    'Bookings': 0,  # Placeholder
                    'IsHoliday': 0,  # Simplified
                    'IsWeekend': 1 if date.weekday() >= 5 else 0,
                    'DayOfWeek': date.weekday(),
                    'Month': date.month,
                    'Year': date.year
                })
    
    future_df = pd.DataFrame(future_data)
    
    # Combine with historical data for feature creation
    combined_df = pd.concat([df, future_df], ignore_index=True)
    
    # Create features
    featured_df = create_features(combined_df)
    
    # Get only future predictions
    future_featured = featured_df[featured_df['Date'] > pd.Timestamp(latest_date)]
    
    # Prepare features for prediction
    feature_columns = ['DayOfWeek', 'Month', 'Year', 'DayOfYear', 'WeekOfYear', 
                     'Quarter', 'IsWeekend', 'IsHoliday', 'RouteEncoded', 'TrainTypeEncoded',
                     'Bookings_Lag1', 'Bookings_Lag7', 'Bookings_Lag30', 'Rolling_7', 'Rolling_30']
    
    X_future = future_featured[feature_columns]
    
    # Make predictions
    predictions = model.predict(X_future)
    
    # Prepare results
    results = []
    for i, (_, row) in enumerate(future_featured.iterrows()):
        results.append({
            'date': row['Date'].strftime('%Y-%m-%d'),
            'route': row['Route'],
            'train_type': row['TrainType'],
            'predicted_bookings': max(0, int(predictions[i]))
        })
    
    # Group by date for summary
    daily_totals = {}
    for result in results:
        date = result['date']
        if date not in daily_totals:
            daily_totals[date] = 0
        daily_totals[date] += result['predicted_bookings']
    
    output = {
        'success': True,
        'model_type': 'original',
        'prediction_period': f"{start_date.strftime('%Y-%m-%d')} to {future_dates[-1].strftime('%Y-%m-%d')}",
        'daily_totals': daily_totals,
        'detailed_predictions': results[:10],  # First 10 for brevity
        'total_predictions': len(results)
    }
    
    print(json.dumps(output, indent=2))

except Exception as e:
    error_output = {
        'error': str(e),
        'model_type': 'original',
        'message': 'Prediction failed'
    }
    print(json.dumps(error_output, indent=2))
    sys.exit(1)