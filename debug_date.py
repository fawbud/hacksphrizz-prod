import pandas as pd

df = pd.read_csv('data/train_booking_data_2016_2025.csv')
print("Original columns:", df.columns.tolist())

if 'date' in df.columns:
    df['Date'] = pd.to_datetime(df['date'])
    print("Date column type:", type(df['Date'].iloc[0]))
    print("Latest date:", df['Date'].max())
    print("Latest date type:", type(df['Date'].max()))

# Check if there are any numeric values mixed in
print("Date column unique sample:", df['Date'].dropna().unique()[:5])