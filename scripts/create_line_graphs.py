#!/usr/bin/env python3
"""
Generate Line Graphs for:
1. 2024 Monthly Movement
2. Peak Days Movement Year by Year
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime
import seaborn as sns

def create_2024_movement_graph():
    """Create line graph showing 2024 monthly booking movements"""
    
    # Load data
    df = pd.read_csv('/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv')
    df['date'] = pd.to_datetime(df['date'])
    
    # Filter for 2024 data
    df_2024 = df[df['date'].dt.year == 2024].copy()
    
    # Group by month and calculate monthly totals
    df_2024['Month'] = df_2024['date'].dt.month
    monthly_data = df_2024.groupby('Month')['bookings'].sum().reset_index()
    
    # Create month names
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_data['MonthName'] = [month_names[i-1] for i in monthly_data['Month']]
    
    # Create the plot
    plt.figure(figsize=(14, 8))
    
    # Plot line with markers
    plt.plot(monthly_data['Month'], monthly_data['bookings'], 
             marker='o', linewidth=3, markersize=8, color='#2E86AB', 
             markerfacecolor='#F24236', markeredgecolor='white', markeredgewidth=2)
    
    # Customize the plot
    plt.title('📈 Pergerakan Booking Kereta Api Sepanjang 2024', 
              fontsize=18, fontweight='bold', pad=20)
    plt.xlabel('Bulan', fontsize=14, fontweight='bold')
    plt.ylabel('Total Bookings', fontsize=14, fontweight='bold')
    
    # Set month labels
    plt.xticks(monthly_data['Month'], monthly_data['MonthName'], fontsize=12)
    plt.yticks(fontsize=12)
    
    # Format y-axis to show values in millions/thousands
    ax = plt.gca()
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1000:.0f}K'))
    
    # Add grid
    plt.grid(True, alpha=0.3, linestyle='--')
    
    # Add value labels on points
    for i, row in monthly_data.iterrows():
        plt.annotate(f'{row["bookings"]/1000:.0f}K', 
                    (row['Month'], row['bookings']),
                    textcoords="offset points", xytext=(0,15), ha='center',
                    fontsize=10, fontweight='bold', color='#2E86AB')
    
    # Calculate and display trend
    coeffs = np.polyfit(monthly_data['Month'], monthly_data['bookings'], 1)
    trend_line = np.poly1d(coeffs)
    plt.plot(monthly_data['Month'], trend_line(monthly_data['Month']), 
             '--', color='red', alpha=0.7, linewidth=2, label=f'Trend Line')
    
    # Add statistics text box
    total_2024 = monthly_data['bookings'].sum()
    avg_monthly = monthly_data['bookings'].mean()
    peak_month = monthly_data.loc[monthly_data['bookings'].idxmax()]
    low_month = monthly_data.loc[monthly_data['bookings'].idxmin()]
    
    stats_text = f"""📊 Statistik 2024:
Total Bookings: {total_2024:,}
Rata-rata/Bulan: {avg_monthly:,.0f}
Bulan Tertinggi: {peak_month['MonthName']} ({peak_month['bookings']:,})
Bulan Terendah: {low_month['MonthName']} ({low_month['bookings']:,})"""
    
    plt.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=11,
             verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
    
    plt.legend(fontsize=12)
    plt.tight_layout()
    
    # Save the plot
    plt.savefig('/Users/macbookair/Documents/Code/hacksphrizz/models/visualizations/2024_monthly_movement.png', 
                dpi=300, bbox_inches='tight')
    plt.show()
    
    return monthly_data

def create_yearly_peak_movement():
    """Create line graph showing peak day movements from year to year"""
    
    # Load data
    df = pd.read_csv('/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv')
    df['date'] = pd.to_datetime(df['date'])
    
    # Group by date to get daily totals
    daily_totals = df.groupby('date')['bookings'].sum().reset_index()
    daily_totals['Year'] = daily_totals['date'].dt.year
    
    # Find peak day for each year
    yearly_peaks = daily_totals.groupby('Year').apply(
        lambda x: x.loc[x['bookings'].idxmax()]
    ).reset_index(drop=True)
    
    # Create the plot
    plt.figure(figsize=(15, 9))
    
    # Plot line with markers
    plt.plot(yearly_peaks['Year'], yearly_peaks['bookings'], 
             marker='o', linewidth=4, markersize=12, color='#E74C3C',
             markerfacecolor='#F39C12', markeredgecolor='white', markeredgewidth=3)
    
    # Customize the plot
    plt.title('🏔️ Pergerakan Hari Paling Rame (Peak Days) dari Tahun ke Tahun', 
              fontsize=18, fontweight='bold', pad=20)
    plt.xlabel('Tahun', fontsize=14, fontweight='bold')
    plt.ylabel('Bookings Tertinggi (Peak Day)', fontsize=14, fontweight='bold')
    
    # Set x-axis to show all years
    plt.xticks(yearly_peaks['Year'], fontsize=12, rotation=45)
    plt.yticks(fontsize=12)
    
    # Format y-axis
    ax = plt.gca()
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1000:.0f}K'))
    
    # Add grid
    plt.grid(True, alpha=0.3, linestyle='--')
    
    # Add value labels on points with dates
    for i, row in yearly_peaks.iterrows():
        peak_date = row['date'].strftime('%d %b')
        plt.annotate(f'{peak_date}\n{row["bookings"]/1000:.0f}K', 
                    (row['Year'], row['bookings']),
                    textcoords="offset points", xytext=(0,20), ha='center',
                    fontsize=10, fontweight='bold', color='#E74C3C',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='yellow', alpha=0.7))
    
    # Calculate trend
    coeffs = np.polyfit(yearly_peaks['Year'], yearly_peaks['bookings'], 1)
    trend_line = np.poly1d(coeffs)
    plt.plot(yearly_peaks['Year'], trend_line(yearly_peaks['Year']), 
             '--', color='purple', alpha=0.8, linewidth=3, label='Trend Line')
    
    # Add growth analysis
    growth_rate = ((yearly_peaks['bookings'].iloc[-1] - yearly_peaks['bookings'].iloc[0]) / 
                   yearly_peaks['bookings'].iloc[0] * 100)
    
    # Find biggest jump
    yearly_peaks['Growth'] = yearly_peaks['bookings'].pct_change() * 100
    max_growth_idx = yearly_peaks['Growth'].idxmax()
    max_growth_year = yearly_peaks.loc[max_growth_idx, 'Year']
    max_growth_pct = yearly_peaks.loc[max_growth_idx, 'Growth']
    
    # Statistics
    highest_peak = yearly_peaks.loc[yearly_peaks['bookings'].idxmax()]
    lowest_peak = yearly_peaks.loc[yearly_peaks['bookings'].idxmin()]
    
    stats_text = f"""📈 Analisis Peak Days:
Growth Total (2016-2025): {growth_rate:.1f}%
Peak Tertinggi: {highest_peak['date'].strftime('%d %b %Y')} ({highest_peak['bookings']:,})
Peak Terendah: {lowest_peak['date'].strftime('%d %b %Y')} ({lowest_peak['bookings']:,})
Pertumbuhan Terbesar: {max_growth_year} (+{max_growth_pct:.1f}%)
Rata-rata Peak: {yearly_peaks['bookings'].mean():,.0f}"""
    
    plt.text(0.02, 0.98, stats_text, transform=ax.transAxes, fontsize=11,
             verticalalignment='top', bbox=dict(boxstyle='round', facecolor='lightblue', alpha=0.8))
    
    plt.legend(fontsize=12)
    plt.tight_layout()
    
    # Save the plot
    plt.savefig('/Users/macbookair/Documents/Code/hacksphrizz/models/visualizations/yearly_peak_movement.png', 
                dpi=300, bbox_inches='tight')
    plt.show()
    
    return yearly_peaks

def create_combined_analysis():
    """Create a combined analysis showing both trends"""
    
    # Create figure with subplots
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12))
    
    # Load data
    df = pd.read_csv('/Users/macbookair/Documents/Code/hacksphrizz/data/train_booking_data_2016_2025.csv')
    df['date'] = pd.to_datetime(df['date'])
    
    # 1. 2024 Monthly Movement (Top subplot)
    df_2024 = df[df['date'].dt.year == 2024].copy()
    df_2024['Month'] = df_2024['date'].dt.month
    monthly_data = df_2024.groupby('Month')['bookings'].sum().reset_index()
    
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    ax1.plot(monthly_data['Month'], monthly_data['bookings'], 
             marker='o', linewidth=3, markersize=8, color='#2E86AB', 
             markerfacecolor='#F24236', markeredgecolor='white', markeredgewidth=2)
    
    ax1.set_title('📈 Pergerakan Booking 2024 (Per Bulan)', fontsize=16, fontweight='bold', pad=15)
    ax1.set_xlabel('Bulan', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Total Bookings', fontsize=12, fontweight='bold')
    ax1.set_xticks(monthly_data['Month'])
    ax1.set_xticklabels([month_names[i-1] for i in monthly_data['Month']])
    ax1.grid(True, alpha=0.3, linestyle='--')
    ax1.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1000:.0f}K'))
    
    # 2. Yearly Peak Movement (Bottom subplot)
    daily_totals = df.groupby('date')['bookings'].sum().reset_index()
    daily_totals['Year'] = daily_totals['date'].dt.year
    yearly_peaks = daily_totals.groupby('Year').apply(
        lambda x: x.loc[x['bookings'].idxmax()]
    ).reset_index(drop=True)
    
    ax2.plot(yearly_peaks['Year'], yearly_peaks['bookings'], 
             marker='o', linewidth=4, markersize=10, color='#E74C3C',
             markerfacecolor='#F39C12', markeredgecolor='white', markeredgewidth=2)
    
    ax2.set_title('🏔️ Pergerakan Peak Days (2016-2025)', fontsize=16, fontweight='bold', pad=15)
    ax2.set_xlabel('Tahun', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Peak Day Bookings', fontsize=12, fontweight='bold')
    ax2.grid(True, alpha=0.3, linestyle='--')
    ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x/1000:.0f}K'))
    
    # Add trend lines
    coeffs1 = np.polyfit(monthly_data['Month'], monthly_data['bookings'], 1)
    trend1 = np.poly1d(coeffs1)
    ax1.plot(monthly_data['Month'], trend1(monthly_data['Month']), 
             '--', color='red', alpha=0.7, linewidth=2)
    
    coeffs2 = np.polyfit(yearly_peaks['Year'], yearly_peaks['bookings'], 1)
    trend2 = np.poly1d(coeffs2)
    ax2.plot(yearly_peaks['Year'], trend2(yearly_peaks['Year']), 
             '--', color='purple', alpha=0.8, linewidth=2)
    
    plt.tight_layout()
    
    # Save combined plot
    plt.savefig('/Users/macbookair/Documents/Code/hacksphrizz/models/visualizations/combined_movement_analysis.png', 
                dpi=300, bbox_inches='tight')
    plt.show()

if __name__ == "__main__":
    print("🚀 Creating line graphs for booking movements...")
    
    print("\n1️⃣ Creating 2024 monthly movement graph...")
    monthly_data = create_2024_movement_graph()
    print(f"✅ 2024 monthly data saved with {len(monthly_data)} months")
    
    print("\n2️⃣ Creating yearly peak movement graph...")
    yearly_peaks = create_yearly_peak_movement()
    print(f"✅ Yearly peaks data saved with {len(yearly_peaks)} years")
    
    print("\n3️⃣ Creating combined analysis...")
    create_combined_analysis()
    
    print("\n🎉 All line graphs created successfully!")
    print("📁 Files saved in: /Users/macbookair/Documents/Code/hacksphrizz/models/visualizations/")
    print("   • 2024_monthly_movement.png")
    print("   • yearly_peak_movement.png") 
    print("   • combined_movement_analysis.png")