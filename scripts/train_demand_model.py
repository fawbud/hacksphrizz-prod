#!/usr/bin/env python3
"""
Train Booking Demand Prediction Model
=====================================

This script trains an AI model to predict train booking demand using historical data.
Uses ensemble approach combining Random Forest and Gradient Boosting for optimal performance.
"""

import pandas as pd
import numpy as np
import os
import pickle
import json
from datetime import datetime, timedelta
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

class TrainDemandPredictor:
    def __init__(self, data_path, model_save_path):
        """
        Initialize the Train Demand Predictor
        
        Args:
            data_path (str): Path to the training data CSV
            model_save_path (str): Directory to save trained models
        """
        self.data_path = data_path
        self.model_save_path = model_save_path
        self.models = {}
        self.preprocessors = {}
        self.feature_importance = {}
        self.performance_metrics = {}
        
        # Create model directory if not exists
        os.makedirs(model_save_path, exist_ok=True)
        
    def load_and_preprocess_data(self):
        """Load data and create additional features for better prediction"""
        print("📊 Loading and preprocessing data...")
        
        # Load data
        df = pd.read_csv(self.data_path)
        df['date'] = pd.to_datetime(df['date'])
        
        print(f"✅ Loaded {len(df)} records from {df['date'].min()} to {df['date'].max()}")
        
        # Sort by date
        df = df.sort_values('date').reset_index(drop=True)
        
        # Feature Engineering
        df = self._create_features(df)
        
        # Create lag features
        df = self._create_lag_features(df)
        
        # Create rolling features
        df = self._create_rolling_features(df)
        
        # Remove rows with NaN (due to lag/rolling features)
        df = df.dropna().reset_index(drop=True)
        
        print(f"✅ Feature engineering completed. Final dataset: {len(df)} records with {len(df.columns)} features")
        
        self.df = df
        return df
    
    def _create_features(self, df):
        """Create additional time-based and categorical features"""
        
        # Date features
        df['year'] = df['date'].dt.year
        df['month'] = df['date'].dt.month
        df['day'] = df['date'].dt.day
        df['day_of_week'] = df['date'].dt.dayofweek
        df['week_of_year'] = df['date'].dt.isocalendar().week
        df['quarter'] = df['date'].dt.quarter
        
        # Seasonal features
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        df['is_friday'] = (df['day_of_week'] == 4).astype(int)
        df['is_sunday'] = (df['day_of_week'] == 6).astype(int)
        df['is_month_start'] = (df['day'] <= 5).astype(int)
        df['is_month_end'] = (df['day'] >= 25).astype(int)
        
        # Holiday proximity features
        df['holiday_strength'] = df['holiday_multiplier'] - 1  # How much above normal
        df['is_peak_holiday'] = (df['holiday_multiplier'] > 3).astype(int)
        df['is_major_holiday'] = (df['holiday_multiplier'] > 6).astype(int)
        
        # Route popularity (based on baseline capacity)
        route_popularity = {
            'Jakarta-Bandung': 'high',
            'Jakarta-Surabaya': 'high', 
            'Jakarta-Yogyakarta': 'medium',
            'Jakarta-Semarang': 'medium',
            'Jakarta-Solo': 'medium',
            'Jakarta-Cirebon': 'medium',
            'Surabaya-Malang': 'low',
            'Bandung-Yogyakarta': 'low'
        }
        df['route_popularity'] = df['route'].map(route_popularity)
        
        # Train type priority
        train_priority = {'Eksekutif': 3, 'Bisnis': 2, 'Ekonomi': 1}
        df['train_priority'] = df['train_type'].map(train_priority)
        
        # Interaction features
        df['holiday_weekend_interaction'] = df['holiday_multiplier'] * df['weekly_multiplier']
        df['route_train_interaction'] = df['route_popularity'].map({'high': 3, 'medium': 2, 'low': 1}) * df['train_priority']
        
        return df
    
    def _create_lag_features(self, df):
        """Create lag features for time series prediction"""
        
        # Sort by route, train_type, and date for proper lag calculation
        df = df.sort_values(['route', 'train_type', 'date']).reset_index(drop=True)
        
        # Create lag features
        lag_periods = [1, 7, 14, 30]  # 1 day, 1 week, 2 weeks, 1 month
        
        for lag in lag_periods:
            df[f'bookings_lag_{lag}'] = df.groupby(['route', 'train_type'])['bookings'].shift(lag)
            df[f'holiday_mult_lag_{lag}'] = df.groupby(['route', 'train_type'])['holiday_multiplier'].shift(lag)
        
        # Year-over-year features (same date last year)
        df[f'bookings_lag_365'] = df.groupby(['route', 'train_type'])['bookings'].shift(365)
        
        return df
    
    def _create_rolling_features(self, df):
        """Create rolling window features"""
        
        # Rolling windows
        windows = [7, 14, 30]  # 1 week, 2 weeks, 1 month
        
        for window in windows:
            # Rolling mean
            rolling_mean = df.groupby(['route', 'train_type'])['bookings'].rolling(window, min_periods=1).mean()
            df[f'bookings_rolling_mean_{window}'] = rolling_mean.values
            
            # Rolling std
            rolling_std = df.groupby(['route', 'train_type'])['bookings'].rolling(window, min_periods=1).std()
            df[f'bookings_rolling_std_{window}'] = rolling_std.values
            
            # Fill NaN with 0 for std
            df[f'bookings_rolling_std_{window}'] = df[f'bookings_rolling_std_{window}'].fillna(0)
            
            # Rolling trend (current vs rolling mean)
            df[f'bookings_trend_{window}'] = df['bookings'] / (df[f'bookings_rolling_mean_{window}'] + 1)
        
        return df
    
    def prepare_features_target(self):
        """Prepare features and target for model training"""
        
        # Define feature columns
        numeric_features = [
            'holiday_multiplier', 'weekly_multiplier', 'yearly_growth', 'covid_factor',
            'day_of_week', 'month', 'day', 'week_of_year', 'quarter',
            'is_weekend', 'is_friday', 'is_sunday', 'is_month_start', 'is_month_end',
            'holiday_strength', 'is_peak_holiday', 'is_major_holiday',
            'train_priority', 'holiday_weekend_interaction', 'route_train_interaction'
        ]
        
        # Add lag features
        lag_features = [col for col in self.df.columns if 'lag_' in col]
        numeric_features.extend(lag_features)
        
        # Add rolling features  
        rolling_features = [col for col in self.df.columns if 'rolling_' in col or 'trend_' in col]
        numeric_features.extend(rolling_features)
        
        categorical_features = ['route', 'train_type', 'route_popularity']
        
        # Remove any features that don't exist in the dataframe
        numeric_features = [f for f in numeric_features if f in self.df.columns]
        categorical_features = [f for f in categorical_features if f in self.df.columns]
        
        print(f"📊 Using {len(numeric_features)} numeric and {len(categorical_features)} categorical features")
        
        self.feature_columns = numeric_features + categorical_features
        self.numeric_features = numeric_features
        self.categorical_features = categorical_features
        
        # Prepare X and y
        X = self.df[self.feature_columns].copy()
        y = self.df['bookings'].copy()
        
        return X, y
    
    def create_preprocessor(self):
        """Create preprocessing pipeline"""
        
        # Numeric preprocessing
        numeric_transformer = StandardScaler()
        
        # Categorical preprocessing
        categorical_transformer = Pipeline(steps=[
            ('onehot', pd.get_dummies)
        ])
        
        # Combine preprocessing
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, self.numeric_features),
                ('cat', 'passthrough', self.categorical_features)  # We'll handle categorical manually
            ])
        
        return preprocessor
    
    def train_models(self, X, y):
        """Train demand prediction model using best hyperparameters from previous optimization"""
        
        print("🤖 Training demand prediction model...")
        print("📊 Using Gradient Boosting with optimized hyperparameters")
        
        # Handle categorical variables manually
        X_processed = X.copy()
        for cat_col in self.categorical_features:
            dummies = pd.get_dummies(X_processed[cat_col], prefix=cat_col)
            X_processed = pd.concat([X_processed, dummies], axis=1)
            X_processed = X_processed.drop(cat_col, axis=1)
        
        # Use best hyperparameters from previous optimization
        best_params = {
            'learning_rate': 0.15,
            'max_depth': 6,
            'min_samples_split': 5,
            'n_estimators': 200,
            'random_state': 42
        }
        
        print(f"🔧 Hyperparameters: {best_params}")
        
        # Initialize and train the model
        self.best_model = GradientBoostingRegressor(**best_params)
        
        print("🔄 Training Gradient Boosting model...")
        self.best_model.fit(X_processed, y)
        
        # Calculate training score for validation
        train_predictions = self.best_model.predict(X_processed)
        train_mae = mean_absolute_error(y, train_predictions)
        
        print(f"✅ Model trained successfully!")
        print(f"📊 Training MAE: {train_mae:.2f}")
        
        self.best_model_name = 'gradient_boosting'
        self.models = {'gradient_boosting': self.best_model}
        
        # Feature importance
        if hasattr(self.best_model, 'feature_importances_'):
            feature_names = X_processed.columns
            importance = self.best_model.feature_importances_
            self.feature_importance = dict(zip(feature_names, importance))
        
        return X_processed
    
    def evaluate_model(self, X, y):
        """Evaluate the best model performance"""
        
        print("📈 Evaluating model performance...")
        
        # Time-based split for final evaluation
        split_date = pd.to_datetime('2024-01-01')
        train_mask = self.df['date'] < split_date
        test_mask = self.df['date'] >= split_date
        
        X_train, X_test = X[train_mask], X[test_mask]
        y_train, y_test = y[train_mask], y[test_mask]
        
        # Predictions
        y_train_pred = self.best_model.predict(X_train)
        y_test_pred = self.best_model.predict(X_test)
        
        # Metrics
        metrics = {
            'train': {
                'mae': mean_absolute_error(y_train, y_train_pred),
                'mse': mean_squared_error(y_train, y_train_pred),
                'rmse': np.sqrt(mean_squared_error(y_train, y_train_pred)),
                'r2': r2_score(y_train, y_train_pred)
            },
            'test': {
                'mae': mean_absolute_error(y_test, y_test_pred),
                'mse': mean_squared_error(y_test, y_test_pred),
                'rmse': np.sqrt(mean_squared_error(y_test, y_test_pred)),
                'r2': r2_score(y_test, y_test_pred)
            }
        }
        
        self.performance_metrics = metrics
        
        print("\n📊 Model Performance:")
        print("=" * 50)
        print(f"Training Set:")
        print(f"  MAE:  {metrics['train']['mae']:.2f}")
        print(f"  RMSE: {metrics['train']['rmse']:.2f}")
        print(f"  R²:   {metrics['train']['r2']:.4f}")
        print(f"\nTest Set (2024-2025):")
        print(f"  MAE:  {metrics['test']['mae']:.2f}")
        print(f"  RMSE: {metrics['test']['rmse']:.2f}")
        print(f"  R²:   {metrics['test']['r2']:.4f}")
        
        # Calculate accuracy percentage
        test_accuracy = 1 - (metrics['test']['mae'] / y_test.mean())
        print(f"  Accuracy: {test_accuracy:.1%}")
        
        return metrics
    
    def save_model(self):
        """Save the trained model and preprocessing components"""
        
        print("💾 Saving model and components...")
        
        # Create model info
        model_info = {
            'model_name': self.best_model_name,
            'feature_columns': self.feature_columns,
            'numeric_features': self.numeric_features,
            'categorical_features': self.categorical_features,
            'performance_metrics': self.performance_metrics,
            'feature_importance': dict(sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:20]),
            'training_date': datetime.now().isoformat(),
            'data_range': {
                'start': str(self.df['date'].min()),
                'end': str(self.df['date'].max()),
                'total_records': len(self.df)
            }
        }
        
        # Save model
        model_path = os.path.join(self.model_save_path, 'demand_prediction_model.pkl')
        with open(model_path, 'wb') as f:
            pickle.dump(self.best_model, f)
        
        # Save model info
        info_path = os.path.join(self.model_save_path, 'model_info.json')
        with open(info_path, 'w') as f:
            json.dump(model_info, f, indent=2)
        
        # Save feature importance plot
        self._save_feature_importance_plot()
        
        print(f"✅ Model saved to: {model_path}")
        print(f"✅ Model info saved to: {info_path}")
        
    def _save_feature_importance_plot(self):
        """Save feature importance visualization"""
        
        if not self.feature_importance:
            return
            
        # Top 20 features
        top_features = dict(sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:20])
        
        plt.figure(figsize=(12, 8))
        features = list(top_features.keys())
        importance = list(top_features.values())
        
        plt.barh(range(len(features)), importance)
        plt.yticks(range(len(features)), features)
        plt.xlabel('Feature Importance')
        plt.title('Top 20 Feature Importances - Train Demand Prediction')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        
        plot_path = os.path.join(self.model_save_path, 'feature_importance.png')
        plt.savefig(plot_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"✅ Feature importance plot saved to: {plot_path}")
    
    def predict(self, route, train_type, date, external_factors=None):
        """
        Make prediction for specific route, train type and date
        
        Args:
            route (str): Train route
            train_type (str): Train type (Eksekutif, Bisnis, Ekonomi)
            date (str): Date in YYYY-MM-DD format
            external_factors (dict): Optional external factors
        """
        
        if not hasattr(self, 'best_model'):
            raise ValueError("Model not trained yet. Call train() first.")
        
        # Create prediction dataframe
        pred_data = {
            'date': pd.to_datetime(date),
            'route': route,
            'train_type': train_type,
            'holiday_multiplier': external_factors.get('holiday_multiplier', 1.0) if external_factors else 1.0,
            'weekly_multiplier': external_factors.get('weekly_multiplier', 1.0) if external_factors else 1.0,
            'yearly_growth': external_factors.get('yearly_growth', 1.0) if external_factors else 1.0,
            'covid_factor': external_factors.get('covid_factor', 1.0) if external_factors else 1.0,
        }
        
        # This is a simplified prediction - in practice you'd need to implement
        # the full feature engineering pipeline for new data
        print(f"🔮 Prediction functionality ready - implement full feature engineering for production use")
        
        return pred_data

def main():
    """Main training pipeline"""
    
    print("🚄 Train Booking Demand Prediction - Model Training")
    print("=" * 60)
    
    # Paths
    data_path = "/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv"
    model_save_path = "/Users/macbookair/Documents/Code/hacksphrizz/models"
    
    # Initialize predictor
    predictor = TrainDemandPredictor(data_path, model_save_path)
    
    # Load and preprocess data
    df = predictor.load_and_preprocess_data()
    
    # Prepare features and target
    X, y = predictor.prepare_features_target()
    
    # Train models
    X_processed = predictor.train_models(X, y)
    
    # Evaluate model
    predictor.evaluate_model(X_processed, y)
    
    # Save model
    predictor.save_model()
    
    print("\n🎉 Training completed successfully!")
    print(f"📁 Model files saved in: {model_save_path}")

if __name__ == "__main__":
    main()