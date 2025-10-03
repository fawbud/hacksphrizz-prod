#!/usr/bin/env python3
"""
Direct simulation test without threading
"""

import sys
sys.path.append('/Users/macbookair/Documents/Code/hacksphrizz/scripts')

from simulation import TrainBookingSimulation
import time

def test_direct_simulation():
    sim = TrainBookingSimulation()
    
    print("🧪 Testing direct simulation (no threading)...")
    
    # Backup original model
    sim.backup_original_model()
    
    # Set running flag
    sim.is_running = True
    
    # Run one iteration manually
    try:
        print("🔄 Running single iteration...")
        
        # Load original data
        import pandas as pd
        original_df = pd.read_csv(sim.original_data_file)
        print(f"✅ Loaded original data: {len(original_df)} rows")
        
        # Generate data for Oct 3
        from datetime import datetime, timedelta
        current_date = datetime(2025, 10, 3)
        daily_data = sim.generate_daily_data(current_date)
        print(f"✅ Generated {len(daily_data)} records for {current_date.strftime('%Y-%m-%d')}")
        
        # Convert to DataFrame
        new_df = pd.DataFrame(daily_data)
        combined_df = pd.concat([original_df, new_df], ignore_index=True)
        print(f"✅ Combined data: {len(combined_df)} rows")
        
        # Save temp data
        combined_df.to_csv(sim.temp_data_file, index=False)
        print(f"✅ Saved to: {sim.temp_data_file}")
        
        # Update counter
        sim.rows_added = 1
        
        # Test model retraining
        print("🤖 Testing model retraining...")
        result = sim.retrain_model()
        print(f"✅ Model retrain result: {result}")
        
        # Update status
        sim.update_status()
        print("✅ Status updated")
        
        # Check status
        status = sim.get_status()
        print(f"📋 Final status: {status}")
        
    except Exception as e:
        import traceback
        print(f"❌ Error: {e}")
        traceback.print_exc()
    
    finally:
        # Cleanup
        sim.restore_original_model()
        print("🧹 Cleaned up")

if __name__ == "__main__":
    test_direct_simulation()