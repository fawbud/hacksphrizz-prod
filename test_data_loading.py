import pandas as pd
import sys

try:
    # Test loading the data
    df = pd.read_csv('data/train_booking_data_2016_2025.csv')
    print(f"Loaded {len(df)} rows")
    print(f"Columns: {list(df.columns)}")
    
    # Test date parsing
    if 'date' in df.columns:
        df['Date'] = pd.to_datetime(df['date'])
        print("Successfully parsed date column")
    else:
        print("No 'date' column found")
    
    print("Test successful!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()