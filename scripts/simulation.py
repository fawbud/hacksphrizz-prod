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
import fcntl
import tempfile
import signal
import sys
import warnings

# Suppress pandas warnings
warnings.filterwarnings('ignore', category=FutureWarning)
warnings.filterwarnings('ignore', category=UserWarning)

# Configure logging
log_dir = 'logs'
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'simulation.log')),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class SingletonMeta(type):
    """Metaclass to ensure only one simulation instance runs"""
    _instances = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        with cls._lock:
            if cls not in cls._instances:
                instance = super().__call__(*args, **kwargs)
                cls._instances[cls] = instance
            return cls._instances[cls]


class TrainBookingSimulation(metaclass=SingletonMeta):
    def __init__(self):
        self.base_data_file = 'data/train_booking_data_2016_2025.csv'
        self.temp_data_file = 'data/simulation_data.csv'
        self.model_file = 'models/demand_prediction_model.pkl'
        self.simulation_model_file = 'models/simulation_model.pkl'
        self.backup_model_file = 'models/original_model_backup.pkl'
        self.status_file = 'simulation_status.json'
        self.lock_file = '/tmp/simulation.lock'
        
        self.routes = ['Jakarta-Yogyakarta', 'Jakarta-Bandung', 'Jakarta-Surabaya', 
                      'Bandung-Surabaya', 'Yogyakarta-Surabaya']
        self.train_types = ['Eksekutif', 'Bisnis', 'Ekonomi']
        
        self.running = False
        self.start_date = None
        self.data_lock = threading.Lock()
        self.generation_count = 0
        self.training_count = 0
        
        self.lockfile_handle = None
        
        # Setup signal handlers
        signal.signal(signal.SIGTERM, self.signal_handler)
        signal.signal(signal.SIGINT, self.signal_handler)

    def signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, shutting down simulation...")
        self.stop()
        sys.exit(0)

    def acquire_lock(self):
        """Acquire exclusive lock to prevent multiple instances"""
        try:
            self.lockfile_handle = open(self.lock_file, 'w')
            fcntl.lockf(self.lockfile_handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.lockfile_handle.write(str(os.getpid()))
            self.lockfile_handle.flush()
            return True
        except (IOError, OSError) as e:
            logger.error(f"Could not acquire lock: {e}")
            if self.lockfile_handle:
                self.lockfile_handle.close()
            return False

    def release_lock(self):
        """Release the exclusive lock"""
        try:
            if self.lockfile_handle:
                fcntl.lockf(self.lockfile_handle, fcntl.LOCK_UN)
                self.lockfile_handle.close()
                self.lockfile_handle = None
            if os.path.exists(self.lock_file):
                os.unlink(self.lock_file)
        except Exception as e:
            logger.error(f"Error releasing lock: {e}")

    def is_holiday(self, date):
        """Check if a date is a holiday using API or predefined holidays"""
        try:
            # Indonesian holidays API with timeout
            response = requests.get(
                f'https://dayoffapi.vercel.app/api?year={date.year}&country=ID',
                timeout=2
            )
            
            if response.status_code == 200:
                holidays = response.json()
                date_str = date.strftime('%Y-%m-%d')
                return any(holiday.get('date') == date_str for holiday in holidays)
            else:
                # Fallback to predefined holidays
                return self.is_predefined_holiday(date)
                
        except Exception as e:
            logger.warning(f"Holiday API error: {e}. Using predefined holidays.")
            return self.is_predefined_holiday(date)
    
    def is_predefined_holiday(self, date):
        """Fallback method for predefined holidays"""
        holidays_2024 = [
            '2024-01-01', '2024-02-10', '2024-03-11', '2024-03-29',
            '2024-04-10', '2024-05-01', '2024-05-09', '2024-05-23',
            '2024-06-01', '2024-06-17', '2024-08-17', '2024-12-25'
        ]
        
        return date.strftime('%Y-%m-%d') in holidays_2024

    def create_features(self, df):
        """Create features for the model"""
        df = df.copy()
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values(['Route', 'TrainType', 'Date'])
        
        # Basic features
        df['DayOfWeek'] = df['Date'].dt.dayofweek
        df['Month'] = df['Date'].dt.month
        df['Year'] = df['Date'].dt.year
        df['DayOfYear'] = df['Date'].dt.dayofyear
        df['WeekOfYear'] = df['Date'].dt.isocalendar().week
        df['Quarter'] = df['Date'].dt.quarter
        df['IsWeekend'] = df['DayOfWeek'].isin([5, 6]).astype(int)
        
        # Holiday feature
        df['IsHoliday'] = df['Date'].apply(self.is_holiday).astype(int)
        
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
        df = df.bfill().fillna(0)
        
        return df

    def retrain_model(self):
        """Retrain model with updated data"""
        try:
            # Load combined data
            if os.path.exists(self.temp_data_file):
                df = pd.read_csv(self.temp_data_file)
            else:
                df = pd.read_csv(self.base_data_file)
            
            logger.info(f"Retraining model with {len(df)} records")
            
            # Create features
            df_features = self.create_features(df)
            
            # Prepare features for training
            feature_columns = ['DayOfWeek', 'Month', 'Year', 'DayOfYear', 'WeekOfYear', 
                             'Quarter', 'IsWeekend', 'IsHoliday', 'RouteEncoded', 'TrainTypeEncoded',
                             'Bookings_Lag1', 'Bookings_Lag7', 'Bookings_Lag30', 'Rolling_7', 'Rolling_30']
            
            X = df_features[feature_columns]
            y = df_features['Bookings']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Train model
            model = GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                n_jobs=-1
            )
            
            model.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            # Save simulation model
            with open(self.simulation_model_file, 'wb') as f:
                pickle.dump(model, f)
            
            self.training_count += 1
            
            logger.info(f"Model retrained successfully - MAE: {mae:.2f}, R²: {r2:.4f}")
            
            return {'mae': mae, 'r2': r2, 'training_count': self.training_count}
            
        except Exception as e:
            logger.error(f"Error retraining model: {e}")
            return None

    def generate_data_batch(self):
        """Generate a batch of new booking data"""
        try:
            current_time = datetime.now()
            
            # Generate data for multiple routes and train types
            new_records = []
            
            for route in self.routes:
                for train_type in self.train_types:
                    # Base demand based on route popularity and train type
                    route_popularity = {
                        'Jakarta-Yogyakarta': 1.2,
                        'Jakarta-Bandung': 1.0,
                        'Jakarta-Surabaya': 1.1,
                        'Bandung-Surabaya': 0.8,
                        'Yogyakarta-Surabaya': 0.9
                    }
                    
                    train_type_factor = {
                        'Eksekutif': 0.6,
                        'Bisnis': 1.0,
                        'Ekonomi': 1.4
                    }
                    
                    base_demand = 150
                    route_factor = route_popularity.get(route, 1.0)
                    type_factor = train_type_factor.get(train_type, 1.0)
                    
                    # Time-based factors
                    hour = current_time.hour
                    is_weekend = current_time.weekday() >= 5
                    is_holiday = self.is_holiday(current_time.date())
                    
                    # Peak hours: 6-9 AM, 5-8 PM
                    time_factor = 1.5 if (6 <= hour <= 9) or (17 <= hour <= 20) else 1.0
                    weekend_factor = 1.3 if is_weekend else 1.0
                    holiday_factor = 1.8 if is_holiday else 1.0
                    
                    # Calculate bookings with some randomness
                    mean_bookings = base_demand * route_factor * type_factor * time_factor * weekend_factor * holiday_factor
                    bookings = max(0, int(np.random.normal(mean_bookings, mean_bookings * 0.2)))
                    
                    record = {
                        'Date': current_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'Route': route,
                        'TrainType': train_type,
                        'Bookings': bookings,
                        'IsHoliday': int(is_holiday),
                        'IsWeekend': int(is_weekend),
                        'DayOfWeek': current_time.weekday(),
                        'Month': current_time.month,
                        'Year': current_time.year
                    }
                    
                    new_records.append(record)
            
            # Save new data
            new_df = pd.DataFrame(new_records)
            
            with self.data_lock:
                if os.path.exists(self.temp_data_file):
                    existing_df = pd.read_csv(self.temp_data_file)
                    combined_df = pd.concat([existing_df, new_df], ignore_index=True)
                else:
                    # Start with base data
                    base_df = pd.read_csv(self.base_data_file)
                    combined_df = pd.concat([base_df, new_df], ignore_index=True)
                
                # Keep only recent data (last 10000 records)
                if len(combined_df) > 10000:
                    combined_df = combined_df.tail(10000)
                
                combined_df.to_csv(self.temp_data_file, index=False)
            
            self.generation_count += 1
            logger.info(f"Generated {len(new_records)} new records at {current_time}")
            
            return len(new_records)
            
        except Exception as e:
            logger.error(f"Error generating data: {e}")
            return 0

    def update_status(self):
        """Update simulation status file"""
        try:
            status = {
                'running': self.running,
                'start_time': self.start_date.isoformat() if self.start_date else None,
                'last_update': datetime.now().isoformat(),
                'generation_count': self.generation_count,
                'training_count': self.training_count,
                'pid': os.getpid()
            }
            
            with open(self.status_file, 'w') as f:
                json.dump(status, f, indent=2)
                
        except Exception as e:
            logger.error(f"Error updating status: {e}")

    def run_simulation(self):
        """Main simulation loop"""
        if not self.acquire_lock():
            logger.error("Another simulation instance is already running")
            return
        
        try:
            logger.info("Starting train booking demand simulation")
            self.running = True
            self.start_date = datetime.now()
            
            # Backup original model if it exists
            if os.path.exists(self.model_file) and not os.path.exists(self.backup_model_file):
                shutil.copy2(self.model_file, self.backup_model_file)
                logger.info("Original model backed up")
            
            # Initial status update
            self.update_status()
            
            while self.running:
                try:
                    # Generate new data
                    records_generated = self.generate_data_batch()
                    
                    if records_generated > 0:
                        # Retrain model every 5 generations (25 seconds)
                        if self.generation_count % 5 == 0:
                            retrain_result = self.retrain_model()
                            if retrain_result:
                                logger.info(f"Model performance: MAE={retrain_result['mae']:.2f}, R²={retrain_result['r2']:.4f}")
                    
                    # Update status
                    self.update_status()
                    
                    # Sleep for 5 seconds
                    if self.running:
                        time.sleep(5)
                        
                except KeyboardInterrupt:
                    logger.info("Received interrupt signal")
                    break
                except Exception as e:
                    logger.error(f"Error in simulation loop: {e}")
                    time.sleep(5)
                    continue
            
        finally:
            self.stop()

    def start(self):
        """Start simulation in a separate thread"""
        if self.running:
            logger.warning("Simulation is already running")
            return
        
        simulation_thread = threading.Thread(target=self.run_simulation, daemon=True)
        simulation_thread.start()
        
        # Wait a moment to let it start
        time.sleep(1)
        return simulation_thread

    def stop(self):
        """Stop the simulation"""
        logger.info("Stopping simulation")
        self.running = False
        
        # Update status
        self.update_status()
        
        # Release lock
        self.release_lock()
        
        logger.info("Simulation stopped")

    def get_status(self):
        """Get current simulation status"""
        try:
            if os.path.exists(self.status_file):
                with open(self.status_file, 'r') as f:
                    status = json.load(f)
                return status
            else:
                return {'running': False, 'message': 'No status file found'}
        except Exception as e:
            logger.error(f"Error reading status: {e}")
            return {'running': False, 'error': str(e)}

    def cleanup(self):
        """Clean up simulation files"""
        try:
            files_to_remove = [
                self.temp_data_file,
                self.simulation_model_file,
                self.status_file
            ]
            
            for file_path in files_to_remove:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    logger.info(f"Removed {file_path}")
            
            # Restore original model if backup exists
            if os.path.exists(self.backup_model_file):
                shutil.copy2(self.backup_model_file, self.model_file)
                os.remove(self.backup_model_file)
                logger.info("Original model restored")
            
            # Release lock
            self.release_lock()
            
            logger.info("Cleanup completed")
            
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


def main():
    """Main function to handle command line arguments"""
    import sys
    
    simulation = TrainBookingSimulation()
    
    if len(sys.argv) < 2:
        print("Usage: python simulation.py [start|stop|status|cleanup]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'start':
        try:
            thread = simulation.start()
            if thread:
                print("Simulation started successfully")
                # Keep the main thread alive
                while simulation.running:
                    time.sleep(1)
            else:
                print("Failed to start simulation")
                sys.exit(1)
        except KeyboardInterrupt:
            print("\nStopping simulation...")
            simulation.stop()
    
    elif command == 'stop':
        simulation.stop()
        print("Stop command sent")
    
    elif command == 'status':
        status = simulation.get_status()
        print(json.dumps(status, indent=2))
    
    elif command == 'cleanup':
        simulation.cleanup()
        print("Cleanup completed")
    
    else:
        print(f"Unknown command: {command}")
        print("Usage: python simulation.py [start|stop|status|cleanup]")
        sys.exit(1)


if __name__ == "__main__":
    main()