#!/usr/bin/env python3
"""
Real-time Data Simulation for Train Booking Demand Prediction
Generates new data every 5 seconds and retrains model sequentially
"""

import pandas as pd
import numpy as np
import time
import threading
import pickle
import shutil
import os
import json
from datetime import datetime, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class TrainBookingSimulation:
    def __init__(self):
        self.base_dir = "/Users/macbookair/Documents/Code/hacksphrizz"
        self.original_data_file = f"{self.base_dir}/data/train_booking_data_2016_2025.csv"
        self.temp_data_file = f"{self.base_dir}/data/simulation_data.csv"
        self.original_model_file = f"{self.base_dir}/models/demand_prediction_model.pkl"
        self.backup_model_file = f"{self.base_dir}/models/original_model_backup.pkl"
        self.temp_model_file = f"{self.base_dir}/models/simulation_model.pkl"
        self.status_file = f"{self.base_dir}/simulation_status.json"
        
        self.routes = [
            "Jakarta-Surabaya", "Jakarta-Yogyakarta", "Jakarta-Bandung",
            "Jakarta-Semarang", "Jakarta-Solo", "Surabaya-Malang",
            "Bandung-Yogyakarta", "Jakarta-Cirebon"
        ]
        self.train_types = ["Eksekutif", "Bisnis", "Ekonomi"]
        
        self.is_running = False
        self.simulation_thread = None
        self.rows_added = 0
        self.start_date = datetime(2025, 10, 3)  # Start from tomorrow
        self._lock = threading.Lock()  # Thread safety
        
    def backup_original_model(self):
        """Backup original model before simulation starts"""
        if os.path.exists(self.original_model_file):
            shutil.copy2(self.original_model_file, self.backup_model_file)
            logger.info(f"✅ Original model backed up to: {self.backup_model_file}")
    
    def restore_original_model(self):
        """Restore original model after simulation stops"""
        if os.path.exists(self.backup_model_file):
            shutil.copy2(self.backup_model_file, self.original_model_file)
            os.remove(self.backup_model_file)
            logger.info("✅ Original model restored")
        
        # Clean up temp files
        if os.path.exists(self.temp_data_file):
            os.remove(self.temp_data_file)
        if os.path.exists(self.temp_model_file):
            os.remove(self.temp_model_file)
        if os.path.exists(self.status_file):
            os.remove(self.status_file)
    
    def get_holiday_data(self, year):
        """Get Indonesian holidays for given year"""
        try:
            response = requests.get(f"https://api-harilibur.vercel.app/api?year={year}", timeout=5)
            if response.status_code == 200:
                holidays = response.json()
                return {holiday['holiday_date']: holiday['holiday_name'] for holiday in holidays}
        except:
            pass
        
        # Fallback holidays
        fallback_holidays = {
            f"{year}-01-01": "Tahun Baru",
            f"{year}-03-29": "Hari Raya Nyepi",
            f"{year}-04-01": "Isra Mi'raj",
            f"{year}-05-01": "Hari Buruh",
            f"{year}-05-09": "Kenaikan Isa Al-Masih",
            f"{year}-06-01": "Hari Lahir Pancasila",
            f"{year}-08-17": "Hari Kemerdekaan RI",
            f"{year}-12-25": "Hari Raya Natal"
        }
        return fallback_holidays
    
    def generate_daily_data(self, target_date):
        """Generate booking data for a specific date"""
        holidays_2025 = self.get_holiday_data(2025)
        date_str = target_date.strftime('%Y-%m-%d')
        is_holiday = date_str in holidays_2025
        is_weekend = target_date.weekday() >= 5
        
        daily_data = []
        
        for route in self.routes:
            # Route-specific base capacity
            route_capacities = {
                "Jakarta-Surabaya": 45000, "Jakarta-Yogyakarta": 35000,
                "Jakarta-Bandung": 50000, "Jakarta-Semarang": 30000,
                "Jakarta-Solo": 25000, "Surabaya-Malang": 15000,
                "Bandung-Yogyakarta": 20000, "Jakarta-Cirebon": 8000
            }
            
            base_capacity = route_capacities.get(route, 25000)
            
            for train_type in self.train_types:
                # Base bookings with realistic variance
                if is_holiday:
                    base_bookings = int(base_capacity * np.random.uniform(0.4, 0.9))
                elif is_weekend:
                    base_bookings = int(base_capacity * np.random.uniform(0.2, 0.6))
                else:
                    base_bookings = int(base_capacity * np.random.uniform(0.1, 0.4))
                
                # Add random variance
                variance = np.random.uniform(0.85, 1.15)
                bookings = max(int(base_bookings * variance), 33)
                
                daily_data.append({
                    'date': date_str,
                    'route': route,
                    'train_type': train_type,
                    'bookings': bookings,
                    'holiday_multiplier': 1.5 if is_holiday else 1.0,
                    'weekly_multiplier': 1.3 if is_weekend else 1.0,
                    'yearly_growth': 1.05,
                    'covid_factor': 1.0,
                    'is_weekend': is_weekend,
                    'day_of_week': target_date.weekday(),
                    'month': target_date.month,
                    'year': target_date.year
                })
        
        return daily_data
    
    def create_features(self, df):
        """Create engineered features for model training"""
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
        else:
            df['Date'] = pd.to_datetime(df['Date'])
        
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
        
        # Lag features
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
        df = df.fillna(method='bfill').fillna(0)
        
        return df
    
    def retrain_model(self):
        """Retrain model with updated data"""
        try:
            # Load combined data
            if os.path.exists(self.temp_data_file):
                df = pd.read_csv(self.temp_data_file)
            else:
                logger.error("❌ No simulation data found for retraining")
                return False
            
            # Create features
            df_features = self.create_features(df)
            
            # Prepare features and target
            feature_columns = [
                'RouteEncoded', 'TrainTypeEncoded', 'IsHoliday', 'IsWeekend',
                'DayOfWeek', 'Month', 'Year', 'DayOfYear', 'WeekOfYear', 'Quarter',
                'Bookings_Lag1', 'Bookings_Lag7', 'Bookings_Lag30',
                'Rolling_7', 'Rolling_30'
            ]
            
            X = df_features[feature_columns]
            y = df_features['Bookings']
            
            # Train model with same hyperparameters
            model = GradientBoostingRegressor(
                learning_rate=0.15,
                max_depth=6,
                n_estimators=200,
                random_state=42
            )
            
            model.fit(X, y)
            
            # Save updated model
            with open(self.temp_model_file, 'wb') as f:
                pickle.dump(model, f)
            
            # Calculate metrics
            y_pred = model.predict(X)
            mae = mean_absolute_error(y, y_pred)
            r2 = r2_score(y, y_pred)
            
            logger.info(f"🔄 Model retrained - MAE: {mae:.2f}, R²: {r2:.4f}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Model retraining failed: {e}")
            return False
    
    def update_status(self):
        """Update simulation status file thread-safely"""
        with self._lock:
            status = {
                'is_running': self.is_running,
                'rows_added': self.rows_added,
                'last_updated': datetime.now().isoformat(),
                'current_date': (self.start_date + timedelta(days=self.rows_added-1)).strftime('%Y-%m-%d') if self.rows_added > 0 else None,
                'temp_data_file': self.temp_data_file if os.path.exists(self.temp_data_file) else None,
                'temp_model_file': self.temp_model_file if os.path.exists(self.temp_model_file) else None
            }
            
            try:
                with open(self.status_file, 'w') as f:
                    json.dump(status, f, indent=2)
            except Exception as e:
                logger.error(f"Failed to update status: {e}")
    
    def simulation_loop(self):
        """Main simulation loop - runs every 5 seconds"""
        logger.info("🚀 Starting simulation loop...")
        
        try:
            # Load original data
            original_df = pd.read_csv(self.original_data_file)
            
            # For the first iteration, copy original model to temp model
            if not os.path.exists(self.temp_model_file):
                shutil.copy2(self.original_model_file, self.temp_model_file)
                logger.info("🔄 Initial model copied for simulation use")
            
            iteration = 0
            while self.is_running:
                try:
                    iteration += 1
                    logger.info(f"🔄 Simulation iteration {iteration}")
                    
                    # Generate data for current date
                    current_date = self.start_date + timedelta(days=self.rows_added)
                    logger.info(f"📅 Generating data for: {current_date.strftime('%Y-%m-%d')}")
                    
                    daily_data = self.generate_daily_data(current_date)
                    
                    # Convert to DataFrame
                    new_df = pd.DataFrame(daily_data)
                    logger.info(f"📊 Generated {len(daily_data)} records")
                    
                    # Combine with existing data
                    if os.path.exists(self.temp_data_file):
                        existing_df = pd.read_csv(self.temp_data_file)
                        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
                        logger.info(f"🔗 Combined with existing: {len(combined_df)} total rows")
                    else:
                        combined_df = pd.concat([original_df, new_df], ignore_index=True)
                        logger.info(f"🔗 Combined with original: {len(combined_df)} total rows")
                    
                    # Limit to 1000 rows (keep recent data)
                    if len(combined_df) > 1000:
                        combined_df = combined_df.tail(1000)
                        logger.info(f"📏 Trimmed to {len(combined_df)} rows for performance")
                    
                    # Save updated data
                    combined_df.to_csv(self.temp_data_file, index=False)
                    logger.info(f"💾 Data saved to: {self.temp_data_file}")
                    
                    with self._lock:
                        self.rows_added += 1
                    
                    logger.info(f"📈 Days simulated: {self.rows_added}")
                    
                    # Retrain model with new data
                    logger.info("🤖 Retraining model...")
                    if self.retrain_model():
                        logger.info("✅ Model updated successfully")
                    else:
                        logger.warning("⚠️ Model update failed, continuing with previous model")
                    
                    # Update status
                    self.update_status()
                    logger.info("📋 Status updated")
                    
                    # Wait 5 seconds before next iteration
                    logger.info("⏳ Waiting 5 seconds for next iteration...")
                    time.sleep(5)
                    
                except Exception as e:
                    logger.error(f"❌ Simulation error in iteration {iteration}: {e}")
                    import traceback
                    traceback.print_exc()
                    logger.info("⏳ Waiting 5 seconds before retry...")
                    time.sleep(5)
                    continue
            
            logger.info("🛑 Simulation loop stopped")
            
        except Exception as e:
            logger.error(f"❌ Critical simulation error: {e}")
            import traceback
            traceback.print_exc()
            self.is_running = False
    
    def start_simulation(self):
        """Start the simulation"""
        if self.is_running:
            return {"status": "error", "message": "Simulation already running"}
        
        try:
            # Backup original model
            self.backup_original_model()
            
            # Reset counters
            with self._lock:
                self.rows_added = 0
                self.is_running = True
            
            # Start simulation thread
            self.simulation_thread = threading.Thread(target=self.simulation_loop, daemon=True)
            self.simulation_thread.start()
            
            # Wait a moment to see if thread starts successfully
            time.sleep(0.5)
            
            self.update_status()
            
            return {
                "status": "success", 
                "message": "Simulation started",
                "start_date": self.start_date.strftime('%Y-%m-%d')
            }
            
        except Exception as e:
            with self._lock:
                self.is_running = False
            return {"status": "error", "message": f"Failed to start simulation: {e}"}
    
    def stop_simulation(self):
        """Stop the simulation and cleanup"""
        if not self.is_running:
            return {"status": "error", "message": "Simulation not running"}
        
        try:
            with self._lock:
                self.is_running = False
            
            # Wait for thread to finish
            if self.simulation_thread and self.simulation_thread.is_alive():
                self.simulation_thread.join(timeout=10)
            
            # Restore original model and cleanup
            self.restore_original_model()
            
            result = {
                "status": "success",
                "message": "Simulation stopped and cleaned up",
                "rows_added": self.rows_added,
                "duration_seconds": self.rows_added * 5
            }
            
            # Reset counters
            with self._lock:
                self.rows_added = 0
            
            return result
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to stop simulation: {e}"}
    
    def get_status(self):
        """Get current simulation status"""
        if os.path.exists(self.status_file):
            try:
                with open(self.status_file, 'r') as f:
                    return json.load(f)
            except Exception:
                pass
        
        return {
            "is_running": self.is_running,
            "rows_added": self.rows_added,
            "message": "No status file found"
        }

# Global simulation instance
simulation = TrainBookingSimulation()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simulation.py [start|stop|status]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        result = simulation.start_simulation()
        print(json.dumps(result, indent=2))
    
    elif command == "stop":
        result = simulation.stop_simulation()
        print(json.dumps(result, indent=2))
    
    elif command == "status":
        result = simulation.get_status()
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid command. Use: start, stop, or status")
        sys.exit(1)
        
    def backup_original_model(self):
        """Backup original model before simulation starts"""
        if os.path.exists(self.original_model_file):
            shutil.copy2(self.original_model_file, self.backup_model_file)
            print(f"✅ Original model backed up to: {self.backup_model_file}")
    
    def restore_original_model(self):
        """Restore original model after simulation stops"""
        if os.path.exists(self.backup_model_file):
            shutil.copy2(self.backup_model_file, self.original_model_file)
            os.remove(self.backup_model_file)
            print(f"✅ Original model restored")
        
        # Clean up temp files
        if os.path.exists(self.temp_data_file):
            os.remove(self.temp_data_file)
        if os.path.exists(self.temp_model_file):
            os.remove(self.temp_model_file)
        if os.path.exists(self.status_file):
            os.remove(self.status_file)
    
    def get_holiday_data(self, year):
        """Get Indonesian holidays for given year"""
        try:
            response = requests.get(f"https://api-harilibur.vercel.app/api?year={year}", timeout=5)
            if response.status_code == 200:
                holidays = response.json()
                return {holiday['holiday_date']: holiday['holiday_name'] for holiday in holidays}
        except:
            pass
        
        # Fallback holidays
        fallback_holidays = {
            f"{year}-01-01": "Tahun Baru",
            f"{year}-03-29": "Hari Raya Nyepi",
            f"{year}-04-01": "Isra Mi'raj",
            f"{year}-05-01": "Hari Buruh",
            f"{year}-05-09": "Kenaikan Isa Al-Masih",
            f"{year}-06-01": "Hari Lahir Pancasila",
            f"{year}-08-17": "Hari Kemerdekaan RI",
            f"{year}-12-25": "Hari Raya Natal"
        }
        return fallback_holidays
    
    def generate_daily_data(self, target_date):
        """Generate booking data for a specific date"""
        holidays_2025 = self.get_holiday_data(2025)
        date_str = target_date.strftime('%Y-%m-%d')
        is_holiday = date_str in holidays_2025
        is_weekend = target_date.weekday() >= 5
        
        daily_data = []
        
        for route in self.routes:
            # Route-specific base capacity
            route_capacities = {
                "Jakarta-Surabaya": 45000, "Jakarta-Yogyakarta": 35000,
                "Jakarta-Bandung": 50000, "Jakarta-Semarang": 30000,
                "Jakarta-Solo": 25000, "Surabaya-Malang": 15000,
                "Bandung-Yogyakarta": 20000, "Jakarta-Cirebon": 8000
            }
            
            base_capacity = route_capacities.get(route, 25000)
            
            for train_type in self.train_types:
                # Base bookings with realistic variance
                if is_holiday:
                    base_bookings = int(base_capacity * np.random.uniform(0.4, 0.9))
                elif is_weekend:
                    base_bookings = int(base_capacity * np.random.uniform(0.2, 0.6))
                else:
                    base_bookings = int(base_capacity * np.random.uniform(0.1, 0.4))
                
                # Add random variance
                variance = np.random.uniform(0.85, 1.15)
                bookings = max(int(base_bookings * variance), 33)
                
                daily_data.append({
                    'date': date_str,
                    'route': route,
                    'train_type': train_type,
                    'bookings': bookings,
                    'holiday_multiplier': 1.5 if is_holiday else 1.0,
                    'weekly_multiplier': 1.3 if is_weekend else 1.0,
                    'yearly_growth': 1.05,
                    'covid_factor': 1.0,
                    'is_weekend': is_weekend,
                    'day_of_week': target_date.weekday(),
                    'month': target_date.month,
                    'year': target_date.year
                })
        
        return daily_data
    
    def create_features(self, df):
        """Create engineered features for model training"""
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
        else:
            df['Date'] = pd.to_datetime(df['Date'])
        
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
        
        # Lag features
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
        df = df.fillna(method='bfill').fillna(0)
        
        return df
    
    def retrain_model(self):
        """Retrain model with updated data"""
        try:
            # Load combined data
            if os.path.exists(self.temp_data_file):
                df = pd.read_csv(self.temp_data_file)
            else:
                print("❌ No simulation data found for retraining")
                return False
            
            # Create features
            df_features = self.create_features(df)
            
            # Prepare features and target
            feature_columns = [
                'RouteEncoded', 'TrainTypeEncoded', 'IsHoliday', 'IsWeekend',
                'DayOfWeek', 'Month', 'Year', 'DayOfYear', 'WeekOfYear', 'Quarter',
                'Bookings_Lag1', 'Bookings_Lag7', 'Bookings_Lag30',
                'Rolling_7', 'Rolling_30'
            ]
            
            X = df_features[feature_columns]
            y = df_features['Bookings']
            
            # Train model with same hyperparameters
            model = GradientBoostingRegressor(
                learning_rate=0.15,
                max_depth=6,
                n_estimators=200,
                random_state=42
            )
            
            model.fit(X, y)
            
            # Save updated model
            with open(self.temp_model_file, 'wb') as f:
                pickle.dump(model, f)
            
            # Calculate metrics
            y_pred = model.predict(X)
            mae = mean_absolute_error(y, y_pred)
            r2 = r2_score(y, y_pred)
            
            print(f"🔄 Model retrained - MAE: {mae:.2f}, R²: {r2:.4f}")
            return True
            
        except Exception as e:
            print(f"❌ Model retraining failed: {e}")
            return False
    
    def update_status(self):
        """Update simulation status file"""
        status = {
            'is_running': self.is_running,
            'rows_added': self.rows_added,
            'last_updated': datetime.now().isoformat(),
            'current_date': (self.start_date + timedelta(days=self.rows_added)).strftime('%Y-%m-%d') if self.rows_added > 0 else None,
            'temp_data_file': self.temp_data_file if os.path.exists(self.temp_data_file) else None,
            'temp_model_file': self.temp_model_file if os.path.exists(self.temp_model_file) else None
        }
        
        with open(self.status_file, 'w') as f:
            json.dump(status, f, indent=2)
    
    def simulation_loop(self):
        """Main simulation loop - runs every 5 seconds"""
        print("🚀 Starting simulation loop...")
        
        # Load original data
        original_df = pd.read_csv(self.original_data_file)
        
        # For the first iteration, copy original model to temp model
        # so predictions can use it even before simulation data exists
        if not os.path.exists(self.temp_model_file):
            shutil.copy2(self.original_model_file, self.temp_model_file)
            print("🔄 Initial model copied for simulation use")
        
        iteration = 0
        while self.is_running:
            try:
                iteration += 1
                print(f"\n🔄 Simulation iteration {iteration}")
                
                # Generate data for current date
                current_date = self.start_date + timedelta(days=self.rows_added)
                print(f"📅 Generating data for: {current_date.strftime('%Y-%m-%d')}")
                
                daily_data = self.generate_daily_data(current_date)
                
                # Convert to DataFrame
                new_df = pd.DataFrame(daily_data)
                print(f"📊 Generated {len(daily_data)} records")
                
                # Combine with existing data
                if os.path.exists(self.temp_data_file):
                    existing_df = pd.read_csv(self.temp_data_file)
                    combined_df = pd.concat([existing_df, new_df], ignore_index=True)
                    print(f"🔗 Combined with existing: {len(combined_df)} total rows")
                else:
                    combined_df = pd.concat([original_df, new_df], ignore_index=True)
                    print(f"🔗 Combined with original: {len(combined_df)} total rows")
                
                # Limit to 1000 rows (keep recent data)
                if len(combined_df) > 1000:
                    combined_df = combined_df.tail(1000)
                    print(f"📏 Trimmed to {len(combined_df)} rows for performance")
                
                # Save updated data
                combined_df.to_csv(self.temp_data_file, index=False)
                print(f"💾 Data saved to: {self.temp_data_file}")
                
                self.rows_added += 1
                print(f"� Days simulated: {self.rows_added}")
                
                # Retrain model with new data
                print("🤖 Retraining model...")
                if self.retrain_model():
                    print(f"✅ Model updated successfully")
                else:
                    print(f"⚠️ Model update failed, continuing with previous model")
                
                # Update status
                self.update_status()
                print(f"📋 Status updated")
                
                # Wait 5 seconds before next iteration
                print("⏳ Waiting 5 seconds for next iteration...")
                time.sleep(5)
                
            except Exception as e:
                print(f"❌ Simulation error in iteration {iteration}: {e}")
                import traceback
                traceback.print_exc()
                print("⏳ Waiting 5 seconds before retry...")
                time.sleep(5)
                continue
        
        print("🛑 Simulation loop stopped")
    
    def start_simulation(self):
        """Start the simulation"""
        if self.is_running:
            return {"status": "error", "message": "Simulation already running"}
        
        try:
            # Backup original model
            self.backup_original_model()
            
            # Reset counters
            self.rows_added = 0
            self.is_running = True
            
            # Start simulation thread
            self.simulation_thread = threading.Thread(target=self.simulation_loop, daemon=True)
            self.simulation_thread.start()
            
            # Wait a moment to see if thread starts successfully
            time.sleep(0.5)
            
            self.update_status()
            
            return {
                "status": "success", 
                "message": "Simulation started",
                "start_date": self.start_date.strftime('%Y-%m-%d')
            }
            
        except Exception as e:
            self.is_running = False
            return {"status": "error", "message": f"Failed to start simulation: {e}"}
    
    def stop_simulation(self):
        """Stop the simulation and cleanup"""
        if not self.is_running:
            return {"status": "error", "message": "Simulation not running"}
        
        try:
            self.is_running = False
            
            # Wait for thread to finish
            if self.simulation_thread and self.simulation_thread.is_alive():
                self.simulation_thread.join(timeout=10)
            
            # Restore original model and cleanup
            self.restore_original_model()
            
            result = {
                "status": "success",
                "message": "Simulation stopped and cleaned up",
                "rows_added": self.rows_added,
                "duration_seconds": self.rows_added * 5
            }
            
            # Reset counters
            self.rows_added = 0
            
            return result
            
        except Exception as e:
            return {"status": "error", "message": f"Failed to stop simulation: {e}"}
    
    def get_status(self):
        """Get current simulation status"""
        if os.path.exists(self.status_file):
            with open(self.status_file, 'r') as f:
                return json.load(f)
        
        return {
            "is_running": self.is_running,
            "rows_added": self.rows_added,
            "message": "No status file found"
        }

# Global simulation instance
simulation = TrainBookingSimulation()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simulation.py [start|stop|status]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        result = simulation.start_simulation()
        print(json.dumps(result, indent=2))
    
    elif command == "stop":
        result = simulation.stop_simulation()
        print(json.dumps(result, indent=2))
    
    elif command == "status":
        result = simulation.get_status()
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid command. Use: start, stop, or status")
        sys.exit(1)