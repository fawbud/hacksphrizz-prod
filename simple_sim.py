#!/usr/bin/env python3
"""
Simple working simulation - minimal version
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

class SimpleSimulation:
    def __init__(self):
        self.base_dir = "/Users/macbookair/Documents/Code/hacksphrizz"
        self.is_running = False
        self.rows_added = 0
        self.start_date = datetime(2025, 10, 3)
        
    def generate_one_day(self):
        """Generate data for one day"""
        current_date = self.start_date + timedelta(days=self.rows_added)
        
        routes = ["Jakarta-Surabaya", "Jakarta-Yogyakarta", "Jakarta-Bandung"]
        train_types = ["Eksekutif", "Bisnis", "Ekonomi"]
        
        daily_data = []
        for route in routes:
            for train_type in train_types:
                bookings = np.random.randint(5000, 15000)
                daily_data.append({
                    'date': current_date.strftime('%Y-%m-%d'),
                    'route': route,
                    'train_type': train_type,
                    'bookings': bookings,
                    'day_added': self.rows_added + 1
                })
        
        return daily_data
    
    def run_simulation(self):
        """Main simulation - add data every 5 seconds"""
        print("🚀 Simple simulation started")
        
        while self.is_running and self.rows_added < 10:  # Limit to 10 iterations
            try:
                # Generate data
                daily_data = self.generate_one_day()
                current_date = self.start_date + timedelta(days=self.rows_added)
                
                self.rows_added += 1
                
                print(f"📅 Day {self.rows_added}: Generated data for {current_date.strftime('%Y-%m-%d')} ({len(daily_data)} records)")
                
                # Save status
                status = {
                    'is_running': self.is_running,
                    'rows_added': self.rows_added,
                    'current_date': current_date.strftime('%Y-%m-%d'),
                    'last_updated': datetime.now().isoformat()
                }
                
                with open(f"{self.base_dir}/simple_status.json", 'w') as f:
                    json.dump(status, f, indent=2)
                
                # Wait 5 seconds
                time.sleep(5)
                
            except Exception as e:
                print(f"❌ Error: {e}")
                break
        
        self.is_running = False
        print("🛑 Simple simulation stopped")
    
    def start(self):
        """Start simulation in background"""
        if self.is_running:
            return {"status": "error", "message": "Already running"}
        
        self.is_running = True
        self.rows_added = 0
        
        # Start in thread
        thread = threading.Thread(target=self.run_simulation, daemon=True)
        thread.start()
        
        return {"status": "success", "message": "Started simple simulation"}
    
    def stop(self):
        """Stop simulation"""
        self.is_running = False
        
        # Cleanup
        status_file = f"{self.base_dir}/simple_status.json"
        if os.path.exists(status_file):
            os.remove(status_file)
        
        return {"status": "success", "message": "Stopped simple simulation"}
    
    def status(self):
        """Get current status"""
        status_file = f"{self.base_dir}/simple_status.json"
        if os.path.exists(status_file):
            with open(status_file, 'r') as f:
                return json.load(f)
        
        return {
            "is_running": self.is_running,
            "rows_added": self.rows_added,
            "message": "No status file found"
        }

# Global instance
sim = SimpleSimulation()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python simple_sim.py [start|stop|status]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "start":
        result = sim.start()
        print(json.dumps(result, indent=2))
    
    elif command == "stop":
        result = sim.stop()
        print(json.dumps(result, indent=2))
    
    elif command == "status":
        result = sim.status()
        print(json.dumps(result, indent=2))
    
    else:
        print("Invalid command. Use: start, stop, or status")
        sys.exit(1)